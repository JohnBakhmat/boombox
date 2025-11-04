import { Schema } from "effect";

export const MusicbrainzSchema = Schema.Struct({
	musicBrainzReleaseGroupId: Schema.optional(Schema.NonEmptyString),
	musicBrainzArtistId: Schema.optional(Schema.NonEmptyString),
	musicBrainzTrackId: Schema.optional(Schema.NonEmptyString),
});

export const MetadataSchema = Schema.Struct({
	album: Schema.NonEmptyString,
	artists: Schema.Array(Schema.NonEmptyString),
	albumArtist: Schema.optional(Schema.NonEmptyString),
	title: Schema.NonEmptyString,
	trackNumber: Schema.optional(Schema.Number),
	...MusicbrainzSchema.fields,
});

export const MetadataWithFilepathSchema = Schema.Struct({
	...MetadataSchema.fields,
	filePath: Schema.NonEmptyString,
});

const mutableMetadataSchema = Schema.mutable(MetadataSchema);

export type Metadata = Schema.Schema.Type<typeof mutableMetadataSchema>;
