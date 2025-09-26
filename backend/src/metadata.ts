import { Schema } from "effect";

export const MetadataSchema = Schema.Struct({
	album: Schema.NonEmptyString,
	artists: Schema.Array(Schema.NonEmptyString),
	albumArtist: Schema.optional(Schema.NonEmptyString),
	title: Schema.NonEmptyString,
	trackNumber: Schema.optional(Schema.Number),
});

export const MetadataWithFilepathSchema = Schema.Struct({
	...MetadataSchema.fields,
	filePath: Schema.NonEmptyString,
});

const mutableMetadataSchema = Schema.mutable(MetadataSchema);

export type Metadata = Schema.Schema.Type<typeof mutableMetadataSchema>;
