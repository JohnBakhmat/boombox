import { Data, Effect, Layer, ManagedRuntime } from "effect";
import { Elysia, status, StatusMap, t, type HTTPHeaders } from "elysia";
import { DatabaseLive } from "./db";
import { BunContext } from "@effect/platform-bun";
import { EnvLive } from "./utils/env";
import { albumTable, artistTable, fileTable, songTable, songToArtistTable } from "./db/schema";
import { eq } from "drizzle-orm";
import { openapi } from "@elysiajs/openapi";
import { pipe } from "effect";
import type { ElysiaCookie } from "elysia/cookies";

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

class ApiService extends Effect.Service<ApiService>()("@boombox/backend/api/ApiService", {
	dependencies: [DatabaseLive.Default],
	accessors: true,
	effect: Effect.gen(function* () {
		const db = yield* DatabaseLive;

		const getAlbumById = Effect.fn("getAlbum")(function* (id: string) {
			const album = yield* db.query.albumTable
				.findMany({
					where: eq(albumTable.id, id),
					limit: 1,
					with: {
						artists: {
							with: {
								artist: true,
							},
						},
						songs: {
							with: {
								artists: {
									with: {
										artist: true,
									},
								},
							},
						},
					},
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

			const artists = album.artists.map((a) => a.artist);
			const songs = album.songs.map((s) => ({
				...s,
				artists: s.artists.map((a) => a.artist),
			}));

			return {
				...album,
				artists,
				songs,
			};
		});

		const getAlbumList = Effect.fn("getAlbumList")(function* () {
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

			return rows.map((r) => ({
				...r,
				artists: r.artists.map((a) => a.artist),
			}));
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
	return new Elysia()
		.use(openapi())
		.get("/", "Hello Elysia")
		.get("/albums", () => runtime.runPromise(ApiService.getAlbumList()))
		.get("/album/:id", ({ params: { id } }) => runtime.runPromise(ApiService.getAlbumById(id)))
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
		.get("/songs", () => pipe(ApiService.getAllSongs(), runtime.runPromise))
		.listen(3003);
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
