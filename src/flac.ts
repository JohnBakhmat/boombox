import { Chunk, Console, Effect, Equal, pipe, Sink, Stream } from "effect";
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

export const readVorbisComment = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const buffer = yield* fs.readFile(path);
		const stream = Stream.fromIterable(buffer);

		const header = yield* pipe(Stream.take(stream, 4), Stream.runCollect);

		yield* Console.log(header);
	});

const readBytes = (stream: Stream.Stream<number>, length: number) =>
	pipe(Stream.take(stream, length), Stream.runCollect);

export const readHeader = (stream: Stream.Stream<number>) =>
	Effect.gen(function* () {
		const isFlac = yield* readBytes(stream, 4);
		const isLastAndBlockType = yield* readBytes(stream, 1);
		const length = yield* readBytes(stream, 3);
	});
