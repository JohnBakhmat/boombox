import { Schema } from "effect";
import { isValid } from "ulid";

const ArtistIdSymbol = Symbol.for("ArtistId");
const ArtistId = Schema.NonEmptyString.pipe(
	Schema.brand(ArtistIdSymbol),
	Schema.startsWith("artist_"),
	Schema.filter((str) => {
		const [, id] = str.split("_");
		return isValid(id as string) ? true : `Extpected ArtistID to end with valid ulid but recieved (${id})`;
	}),
);
const Artist = Schema.TaggedStruct("Artist", {
	id: ArtistId,
	name: Schema.NonEmptyString,
});

const SongIdSymbol = Symbol.for("SongId");
const SongId = Schema.NonEmptyString.pipe(
	Schema.brand(SongIdSymbol),
	Schema.startsWith("song_"),
	Schema.filter((str) => {
		const [, id] = str.split("_");
		return isValid(id as string) ? true : `Extpected SongID to end with valid ulid but recieved (${id})`;
	}),
);
const Song = Schema.TaggedStruct("Song", {
	id: SongId,
	title: Schema.NonEmptyString,
	artists: Schema.Array(Artist),
});

const AlbumIdSymbol = Symbol.for("AlbumId");
const AlbumId = Schema.NonEmptyString.pipe(
	Schema.brand(AlbumIdSymbol),
	Schema.startsWith("album_"),
	Schema.filter((str) => {
		const [, id] = str.split("_");
		return isValid(id as string) ? true : `Extpected AlbumID to end with valid ulid but recieved (${id})`;
	}),
);
const Album = Schema.TaggedStruct("Album", {
	id: AlbumId,
	title: Schema.NonEmptyString,
	artists: Schema.Array(Artist),
	songs: Schema.Array(Song),
});

export { Song, Album, Artist };
