import { Schema } from "effect";

export const MetadataSchema = Schema.Struct({
	album: Schema.NonEmptyString,
	artist: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
});

export type Metadata = Schema.Schema.Type<typeof MetadataSchema>;
