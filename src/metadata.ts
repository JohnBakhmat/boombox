import { Schema } from "effect";

export const MetadataSchema = Schema.Struct({
	album: Schema.NonEmptyString,
	artist: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	trackNumber: Schema.optional(Schema.Number),
});

const mutableMetadataSchema = Schema.mutable(MetadataSchema);

export type Metadata = Schema.Schema.Type<typeof mutableMetadataSchema>;
