import { Data } from "effect";

export class FetchFailedError extends Data.TaggedError("FetchFailedError")<{
	message: string;
	cause?: unknown;
}> {}

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
	message: string;
	cause?: unknown;
}> {}
