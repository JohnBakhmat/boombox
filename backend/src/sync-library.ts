import { Console, Effect } from "effect";
import { DatabaseLive } from "./db";
import { readDirectory } from "./file-parser";

import { albumTable, artistTable, artistToAlbumTable, fileTable, songTable, songToArtistTable } from "./db/schema";
import { inArray } from "drizzle-orm";

export function syncLibrary(libraryPath: string) {
	return Effect.gen(function* () {
		const db = yield* DatabaseLive;

		const alreadyIndexed = yield* db.query.fileTable.findMany();

		const dirContent = yield* readDirectory(
			libraryPath,
			alreadyIndexed.map((x) => x.path),
		);

		if (dirContent.length === 0) {
			return;
		}

		yield* Console.table(dirContent);

		const newArtists = [
			...dirContent.reduce((acc, cur) => {
				acc.add(cur.artist);
				return acc;
			}, new Set<string>()),
		];

		const newAlbums = [
			...dirContent.reduce((acc, cur) => {
				acc.add(cur.album);
				return acc;
			}, new Set<string>()),
		];

		const newFiles = dirContent.map((entry) => ({
			path: entry.filePath,
		}));

		yield* db.insert(fileTable).values(newFiles).onConflictDoNothing();

		const files = yield* db
			.select({
				id: fileTable.id,
				filePath: fileTable.path,
			})
			.from(fileTable)
			.where(
				inArray(
					fileTable.path,
					newFiles.map((f) => f.path),
				),
			);

		yield* Console.log(newArtists);

		yield* Effect.all(
			[
				db
					.insert(artistTable)
					.values(newArtists.map((a) => ({ name: a })))
					.onConflictDoNothing(),
				db
					.insert(albumTable)
					.values(newAlbums.map((a) => ({ title: a })))
					.onConflictDoNothing(),
				db.insert(fileTable).values(newFiles).onConflictDoNothing(),
			],
			{ concurrency: "unbounded" },
		);

		const [artists, albums] = yield* Effect.all(
			[
				db
					.select({
						id: artistTable.id,
						name: artistTable.name,
					})
					.from(artistTable)
					.where(inArray(artistTable.name, newArtists)),
				db
					.select({
						id: albumTable.id,
						title: albumTable.title,
					})
					.from(albumTable)
					.where(inArray(albumTable.title, newAlbums)),
			],
			{
				concurrency: "unbounded",
			},
		);

		const newSongs = dirContent.map((entry) => ({
			title: entry.title,
			trackNumber: entry.trackNumber,
			fileId: files.find((file) => file.filePath === entry.filePath)?.id!,
			albumId: albums.find((album) => album.title === entry.album)?.id!,
		}));
		yield* db.insert(songTable).values(newSongs).onConflictDoNothing();

		const songs = yield* db
			.select({
				id: songTable.id,
				title: songTable.title,
			})
			.from(songTable)
			.where(
				inArray(
					songTable.title,
					newSongs.map((x) => x.title),
				),
			);

		yield* Console.log(artists, albums, songs, files);

		const artistAlbumTasks = dirContent
			.map((entry) => ({
				artistId: artists.find((x) => x.name === entry.artist)?.id,
				albumId: albums.find((x) => x.title === entry.album)?.id,
			}))
			.filter((x) => x.albumId && x.artistId)
			.map(({ artistId, albumId }) =>
				db
					.insert(artistToAlbumTable)
					.values({
						artistId: artistId!,
						albumId: albumId!,
					})
					.onConflictDoNothing(),
			);

		const artistSongTasks = dirContent
			.map((entry) => ({
				artistId: artists.find((x) => x.name === entry.artist)?.id,
				songId: songs.find((x) => x.title === entry.title)?.id,
			}))
			.filter((x) => x.songId && x.artistId)
			.map(({ songId, artistId }) =>
				db
					.insert(songToArtistTable)
					.values({
						songId: songId!,
						artistId: artistId!,
					})
					.onConflictDoNothing(),
			);

		yield* Effect.all([artistAlbumTasks, artistSongTasks].flat(), {
			concurrency: "unbounded",
		});
	}).pipe(Effect.withSpan("syncLibrary"));
}
