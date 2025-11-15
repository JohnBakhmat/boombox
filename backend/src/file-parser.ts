import { Effect, Console, Data, Stream } from "effect";
import { FileSystem, Path } from "@effect/platform";
import { FlacService } from "./flac/service";

const SUPPORTED_EXTENSIONS = ["flac"] as const;
type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

class UnsupportedFileError extends Data.TaggedError("UnsupportedFileError")<{
	cause?: unknown;
	message: string;
}> {}

export const readDirectory = Effect.fn("read-directory")(function* (dirPath: string, skip: string[] = []) {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	const files = yield* fs.readDirectory(dirPath, {
		recursive: true,
	});

	yield* Console.log(files);

	const stream = Stream.fromIterable(files).pipe(
		Stream.map((file) => path.resolve(dirPath, file)),
		Stream.filter((file) => SUPPORTED_EXTENSIONS.some((ext) => file.endsWith(ext)) === true),
		Stream.filter((file) => skip.includes(file) === false),
		Stream.mapEffect((file) => parseFile(file), {
			concurrency: 10,
		}),
		Stream.tap(Console.log),
		Stream.catchAll((err) => Stream.empty),
	);

	return stream;
});

export const parseFile = Effect.fn("parse-file")(function* (path: string) {
	const extension = path.split(".").pop();
	const assumedType =
		extension && SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
			? (extension as SupportedExtension)
			: null;

	if (!assumedType) {
		return yield* Effect.fail(new UnsupportedFileError({ message: "File is unsupported" }));
	}

	if (assumedType === "flac") {
		const flacService = yield* FlacService;
		const metadata = yield* flacService.readMetadata(path);
		return metadata;
	}
	return yield* Effect.fail(new UnsupportedFileError({ message: "File is unsupported" }));
});

