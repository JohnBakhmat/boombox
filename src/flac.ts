import { Chunk, Effect, Equal, pipe, Sink, Stream } from "effect";
import { FileSystem } from "@effect/platform";

export const isFlac = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		const fileStream = yield* pipe(
			fs.stream(path, {
				bufferSize: 4,
				chunkSize: 4,
			}),
			Stream.map((x) => x.toString()),
			Stream.run(Sink.take(1)),
		);

		const magicBytes = Chunk.make("fLaC");

		return Equal.equals(fileStream, magicBytes);
	});
