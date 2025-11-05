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
const Artist = Schema.Struct({
	id: ArtistId,
	name: Schema.NonEmptyString,
}).annotations({
	title: "artists",
	identifier: "Artist",
});

const AudioFileIdSymbol = Symbol.for("AudioFileId");
const AudioFileId = Schema.NonEmptyString.pipe(
	Schema.brand(AudioFileIdSymbol),
	Schema.startsWith("file_"),
	Schema.filter((str) => {
		const [, id] = str.split("_");
		return isValid(id as string) ? true : `Extpected AudioFileID to end with valid ulid but recieved (${id})`;
	}),
);
const AudioFile = Schema.Struct({
	id: AudioFileId,
	filePath: Schema.NonEmptyString,
}).annotations({
	title: "audiofiles",
	identifier: "AudioFile",
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
const Song = Schema.Struct({
	id: SongId,
	title: Schema.NonEmptyString,
	artists: Schema.Array(Artist),
	// TODO: this can only positive non zero int
	trackNumber: Schema.NullOr(Schema.Int),
	fileId: AudioFileId,
}).annotations({
	title: "songs",
	identifier: "Song",
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
const Album = Schema.Struct({
	id: AlbumId,
	title: Schema.NonEmptyString,
	artists: Schema.Array(Artist),
	songs: Schema.Array(Song),
}).annotations({
	title: "albums",
	identifier: "Album",
});

export { Song, Album, Artist, AudioFile };
