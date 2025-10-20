import { Effect, Stream, Chunk, Console } from "effect";
import { DatabaseLive } from "./db";
import { readDirectoryStream } from "./file-parser";

import { albumTable, artistTable, artistToAlbumTable, fileTable, songTable, songToArtistTable } from "./db/schema";
import type { MetadataWithFilepathSchema } from "./metadata";
import { colors } from "./chalk";

export const syncLibraryStream = Effect.fn("sync-library-stream")(function* (libraryPath: string) {
	const db = yield* DatabaseLive;

	//TODO: reaindex old files / updated files
	const alreadyIndexed = yield* db.query.fileTable.findMany();

	const stream = yield* readDirectoryStream(
		libraryPath,
		alreadyIndexed.map((x) => x.path),
	);

	yield* stream.pipe(
		Stream.tap((x) =>
			Console.log(
				"Found",
				colors.FgGreen,
				x.title,
				colors.Reset,
				"by",
				colors.FgYellow,
				x.artists.join(","),
				colors.Reset,
			),
		),
		Stream.grouped(10),
		//Stream.schedule(Schedule.spaced("3 second")),
		Stream.mapEffect(saveChunk, { concurrency: 5 }),
		Stream.runDrain,
	);
});

type Metadata = typeof MetadataWithFilepathSchema.Type;

const saveChunk = Effect.fn("save-chunk")(function* (chunk: Chunk.Chunk<Metadata>) {
	const [files, artists, albums] = yield* Effect.all(
		[createFiles(chunk), createArtists(chunk), createAlbums(chunk)],
		{ concurrency: 3 },
	);

	const songs = yield* createSongs(chunk, { files, albums });

	yield* Effect.all(
		[
			connectArtistToSong(chunk, {
				songs,
				artists,
			}),
			connectArtistAlbum(chunk, {
				artists,
				albums,
			}),
		],
		{ concurrency: 2 },
	);

	return {
		songCount: songs.length,
		artistCount: artists.length,
		albumCount: albums.length,
	};
});

const connectArtistToSong = Effect.fn("connect-artist-song")(function* (
	chunk: Chunk.Chunk<Metadata>,

	lookup: {
		songs: Effect.Effect.Success<ReturnType<typeof createSongs>>;
		artists: Effect.Effect.Success<ReturnType<typeof createArtists>>;
	},
) {
	const db = yield* DatabaseLive;
	const newSongArtist = Chunk.toArray(chunk)
		.flatMap((entry) =>
			entry.artists.map((artist) => ({
				artistId: lookup.artists.find((x) => x.name === artist)?.id ?? "",
				songId: lookup.songs.find((x) => x.title === entry.title)?.id ?? "",
			})),
		)
		.filter((x) => x.songId && x.artistId);

	if (!newSongArtist) {
		return;
	}

	yield* db.insert(songToArtistTable).values(newSongArtist).onConflictDoNothing();
});

const connectArtistAlbum = Effect.fn("connect-album-artist")(function* (
	chunk: Chunk.Chunk<Metadata>,

	lookup: {
		albums: Effect.Effect.Success<ReturnType<typeof createAlbums>>;
		artists: Effect.Effect.Success<ReturnType<typeof createArtists>>;
	},
) {
	const db = yield* DatabaseLive;
	const newAlbumArtists = Chunk.toArray(chunk)
		.map((entry) => ({
			artistId: lookup.artists.find((x) => x.name === entry.albumArtist)?.id ?? "",
			albumId: lookup.albums.find((x) => x.title === entry.album)?.id ?? "",
		}))
		.filter((x) => x.albumId && x.artistId);

	if (!newAlbumArtists.length) {
		return;
	}

	yield* db.insert(artistToAlbumTable).values(newAlbumArtists).onConflictDoNothing();
});

const createSongs = Effect.fn("create-songs")(function* (
	chunk: Chunk.Chunk<Metadata>,
	lookup: {
		files: Effect.Effect.Success<ReturnType<typeof createFiles>>;
		albums: Effect.Effect.Success<ReturnType<typeof createAlbums>>;
	},
) {
	const db = yield* DatabaseLive;

	const newSongs = Chunk.toArray(chunk).map((x) => ({
		title: x.title,
		fileId: lookup.files.find((file) => file.filePath === x.filePath)?.id!,
		albumId: lookup.albums.find((album) => album.title === x.album)?.id!,
	}));

	if (!newSongs.length) {
		return [];
	}

	yield* db.insert(songTable).values(newSongs).onConflictDoNothing();

	return yield* db
		.select({
			id: songTable.id,
			title: songTable.title,
		})
		.from(songTable);
});

const createFiles = Effect.fn("create-files")(function* (chunk: Chunk.Chunk<Metadata>) {
	const db = yield* DatabaseLive;

	const newFiles = chunkToUniqueArray(chunk, (x) => x.filePath).map((x) => ({
		path: x,
	}));

	if (!newFiles.length) {
		return [];
	}

	yield* db.insert(fileTable).values(newFiles).onConflictDoNothing();

	return yield* db
		.select({
			id: fileTable.id,
			filePath: fileTable.path,
		})
		.from(fileTable);
});

const createArtists = Effect.fn("create-artists")(function* (chunk: Chunk.Chunk<Metadata>) {
	const db = yield* DatabaseLive;

	const newArtists = chunkToUniqueArray(chunk, (x) => x.artists);

	if (!newArtists.length) {
		return [];
	}

	yield* db
		.insert(artistTable)
		.values(
			newArtists.map((x) => ({
				name: x,
			})),
		)
		.onConflictDoNothing()
		.returning();

	return yield* db
		.select({
			id: artistTable.id,
			name: artistTable.name,
		})
		.from(artistTable);
});

const createAlbums = Effect.fn("create-albums")(function* (chunk: Chunk.Chunk<Metadata>) {
	const db = yield* DatabaseLive;

	const newAlbums = chunkToUniqueArray(chunk, (x) => x.album);

	if (!newAlbums.length) {
		return [];
	}

	yield* db
		.insert(albumTable)
		.values(
			newAlbums.map((x) => ({
				title: x,
			})),
		)
		.onConflictDoNothing()
		.returning();

	return yield* db
		.select({
			id: albumTable.id,
			title: albumTable.title,
		})
		.from(albumTable);
});

function chunkToUniqueArray<T extends object, U extends string | readonly string[]>(
	chunk: Chunk.Chunk<T>,
	map: (x: T) => U,
) {
	const array = Chunk.toArray(chunk);
	const x = array.flatMap(map);
	const set = new Set(x);
	return Array.from(set);
}
