import {
	Chunk,
	Console,
	Data,
	Effect,
	Equal,
	pipe,
	Sink,
	Stream,
} from "effect";
import { FileSystem } from "@effect/platform";

export const isFlac = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const file = yield* fs.readFile(path);
		const slice = new TextDecoder().decode(file.slice(0, 4));
		return slice === "fLaC";
	});

export const readMetadata = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		const fileIsFlac = yield* isFlac(path);
		if (!fileIsFlac) {
			return yield* Effect.fail(
				new FlacError({
					message: "The file you are trying to parse as FLAC is NOT FLAC",
				}),
			);
		}
	});

export class FlacError extends Data.TaggedError("FlacError")<{
	message: string;
	cause?: unknown;
}> {}
