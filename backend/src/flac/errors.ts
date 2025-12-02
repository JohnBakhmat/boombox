import { Data } from "effect";

export class FlacError extends Data.TaggedError("FlacError")<{ message: string; cause?: unknown }> {}
