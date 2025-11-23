import { Console, Data, Effect, Layer, ManagedRuntime, Schema } from "effect";
import { Elysia, status, StatusMap, t, type HTTPHeaders } from "elysia";
import { DatabaseLive } from "./db";
import { BunContext } from "@effect/platform-bun";
import { EnvLive } from "./utils/env";
import { albumTable, artistTable, fileTable, songTable, songToArtistTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { openapi } from "@elysiajs/openapi";
import { pipe } from "effect";
import type { ElysiaCookie } from "elysia/cookies";
import { Album, Artist, Song } from "./types";
import type { Album, Album, Artist } from "./db/types";
import { decode } from "zod";
import { decodeUnknown } from "effect/Duration";

class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
	message: string;
	cause?: unknown;
}> {}
class AlbumNotFoundError extends Data.TaggedError("AlbumNotFoundError")<{
	message: string;
	cause?: unknown;
}> {}

type ElysiaSet = {
	headers: HTTPHeaders;
	status?: number | keyof StatusMap;
	redirect?: string;
	cookie?: Record<string, ElysiaCookie>;
};

const GetAlbumSchema = Schema.Struct({
	...Album.fields,
	artists: Schema.optional(Artist),
	songs: Schema.optional(
		Schema.Struct({
			...Song.fields,
			artists: Schema.optional(Artist),
		}),
	),
});

type AlbumQueryInclude = {
	artists?: {
		with: {
			artist: true;
		};
	};
	songs?: {
		orderBy?: (typeof songTable.trackNumber)[];
		with: {
			artists?: {
				with: {
					artist: true;
				};
			};
		};
	};
};

const getAlbumVariants = ["album-artist", "song", "song-artist"] as const;
type GetAlbumVariant = (typeof getAlbumVariants)[number];

class ApiService extends Effect.Service<ApiService>()("@boombox/backend/api/ApiService", {
	dependencies: [DatabaseLive.Default],
	accessors: true,
	effect: Effect.gen(function* () {
		const db = yield* DatabaseLive;

		const getAlbumById = Effect.fn("getAlbum")(function* (id: string, relations: Array<GetAlbumVariant> = []) {
			const withArtist = { artists: { with: { artist: true } } } satisfies AlbumQueryInclude;
			const withSongArtist = {
				songs: {
					with: {
						artists: {
							with: {
								artist: true,
							},
						},
					},
				},
			} satisfies AlbumQueryInclude;
			const withSongs = {
				songs: {
					orderBy: [songTable.trackNumber],
					with: {},
				},
			} satisfies AlbumQueryInclude;

			const include = relations.reduce<AlbumQueryInclude>((acc, rel) => {
				switch (rel) {
					case "album-artist":
						return { ...acc, ...withArtist };
					case "song":
						return { ...acc, ...withSongs };
					case "song-artist":
						return { ...acc, ...withSongArtist };

					default:
						return acc;
				}
			}, {});

			const album = yield* db.query.albumTable
				.findMany({
					where: eq(albumTable.id, id),
					limit: 1,
					with: include,
				})
				.pipe(
					Effect.map((x) => x.at(0)),
					Effect.flatMap(Effect.fromNullable),
					Effect.mapError(
						(e) =>
							new AlbumNotFoundError({
								message: "Album not found",
								cause: e,
							}),
					),
				);

			const artistDecoder = Schema.decodeUnknown(Artist);

			const artists = yield* Effect.gen(function* () {
				const albumArtists = album.artists;

				if (albumArtists && Object.hasOwn(albumArtists[0], "artist")) {
					const decodeArtists = albumArtists?.map((relation) => {
						const rel = relation as Extract<typeof relation, { artist: { name: string } }>;
						const artist = rel.artist;

						return artistDecoder(artist);
					});

					const artists = yield* Effect.all(decodeArtists, { concurrency: "unbounded" });
					return artists;
				}
				return undefined;
			});

			const songs = yield* Effect.gen(function* () {
				if (!album.songs) return undefined;

				const decodeSongs = album.songs.map((song) =>
					Effect.gen(function* () {
						const artists = yield* Effect.gen(function* () {
							if (!Object.hasOwn(song, "artists")) return undefined;
							const songWithArtists = song as Extract<typeof song, { artists: { songId: string }[] }>;

							const decodeArtists = songWithArtists.artists
								.map((relation) => {
									if (!Object.hasOwn(relation, "artist")) return undefined;

									const { artist } = relation as Extract<
										typeof relation,
										{ artist: { name: string } }
									>;

									return artistDecoder(artist);
								})
								.filter(Boolean)
								.map((x) => x as typeof x & {});

							yield* Effect.log(decodeArtists);

							return yield* Effect.all(decodeArtists);
						});

						const songDecoder = Schema.decodeUnknown(
							Schema.Struct({
								...Song.fields,
								artists: Schema.optional(Schema.Array(Artist)),
							}),
						);

						return yield* songDecoder({
							...song,
							artists,
						});
					}),
				);

				return yield* Effect.all(decodeSongs, { concurrency: "unbounded" });
			});

			const result = yield* Schema.decodeUnknown(
				Schema.Struct({
					...Album.fields,
					songs: Schema.Struct({
						...Song.fields,
						artists: Artist.pipe(Schema.Array, Schema.optional),
					}).pipe(Schema.Array, Schema.optional),
					artists: Artist.pipe(Schema.Array, Schema.optional),
				}),
			)({
				id: album.id,
				title: album.title,
				artists: artists,
				songs: songs,
			});

			return result;
		});

		const getAlbumList = Effect.fn("getAlbumList")(function* () {
			const AlbumWithArtists = Schema.Struct({
				...Album.fields,
				artists: Schema.Array(Artist),
			});

			const rows = yield* db.query.albumTable
				.findMany({
					with: {
						artists: {
							with: {
								artist: true,
							},
						},
					},
				})
				.pipe(Effect.catchAll((_) => Effect.succeed([])));

			const result = rows.map((row) =>
				Effect.gen(function* () {
					const artistTasks = row.artists.map(({ artist }) => Schema.decodeUnknown(Artist)(artist));
					const artists = yield* Effect.all(artistTasks, { concurrency: 10 });

					return yield* Schema.decodeUnknown(AlbumWithArtists)({
						...row,
						artists,
					});
				}),
			);

			return yield* Effect.all(result);
		});

		const getFileById = Effect.fn("getFileById")(function* (id: string, set: ElysiaSet) {
			const files = yield* db.select().from(fileTable).where(eq(fileTable.id, id)).limit(1);

			const file = files.at(0);

			if (!file) {
				return yield* Effect.fail(
					new FileNotFoundError({
						message: `Failed to find file with id ${id}`,
						cause: { id },
					}),
				);
			}

			const fileHandle = Bun.file(file.path);

			const fileExists = yield* Effect.tryPromise(() => fileHandle.exists());

			// Check if file exists
			if (!fileExists) {
				return yield* Effect.fail(
					new FileNotFoundError({
						message: `File not found on disk: ${file.path}`,
						cause: { id, path: file.path },
					}),
				);
			}

			const filename = file.path.split("/").pop();
			const encodedFilename = encodeURIComponent(filename ?? "");

			set.headers["Content-Disposition"] =
				`attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`;
			set.headers["Content-Type"] = "audio/flac";
			set.headers["Accept-Ranges"] = "bytes";

			return fileHandle;
		});

		const getAllSongs = Effect.fn("getAllSongs")(function* () {
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						song: songTable,
						album: albumTable,
						artist: artistTable,
					})
					.from(songTable)
					.innerJoin(albumTable, eq(songTable.albumId, albumTable.id))
					.innerJoin(songToArtistTable, eq(songToArtistTable.songId, songTable.id))
					.innerJoin(artistTable, eq(songToArtistTable.artistId, artistTable.id))
					.all(),
			);

			const reduced = rows.reduce<Record<string, GetSongType>>((acc, row) => {
				const { song, album, artist } = row;

				if (!acc[song.id]) {
					acc[song.id] = {
						id: song.id,
						fileId: song.fileId,
						title: song.title,
						album: {
							id: album.id,
							title: album.title,
						},
						artists: [],
					};
				}

				if (artist) {
					acc[song.id].artists.push(artist);
				}

				return acc;
			}, {});

			return Object.values(reduced);
		});

		return {
			getAlbumById,
			getAlbumList,
			getFileById,
			getAllSongs,
		};
	}),
}) {}

export function startApi() {
	const app = new Elysia()
		.use(openapi())
		.get("/", "Hello Elysia")
		.get("/albums", () => runtime.runPromise(ApiService.getAlbumList()))

		.get(
			"/album/:id",
			({ params: { id }, query: { include } }) => {
				if (include?.some((x) => (getAlbumVariants as readonly string[]).includes(x) === false)) {
					throw new Error("Unsupported get album variant");
				}

				const realInclude = include as GetAlbumVariant[] | undefined;

				return runtime.runPromise(ApiService.getAlbumById(id, realInclude));
			},

			{
				query: t.Object({
					include: t.Optional(t.Array(t.String())),
				}),
			},
		)

		.get(
			"/file/:id",
			({ params: { id }, set }) =>
				pipe(
					ApiService.getFileById(id, set),
					Effect.catchTag("FileNotFoundError", (e) => Effect.succeed(status(404, e.message))),
					runtime.runPromise,
				),
			{
				params: t.Object({
					id: t.String(),
				}),
			},
		)
		.get("/songs", () => pipe(ApiService.getAllSongs(), runtime.runPromise));

	const server = app.listen(3003);

	return {
		server,
		runtime,
	};
}

type GetSongType = {
	id: string;
	fileId: string;
	title: string;
	album: {
		id: string;
		title: string;
	};
	artists: Array<{
		id: string;
		name: string;
	}>;
};

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive.Default, ApiService.Default);
const runtime = ManagedRuntime.make(layers);

export type ApiType = ReturnType<typeof startApi>;
