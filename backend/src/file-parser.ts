import * as flac from "./flac";
import { Effect, Option, Console, Duration, Data, Stream } from "effect";
import { FileSystem, Path } from "@effect/platform";

const SUPPORTED_EXTENSIONS = ["flac"] as const;
type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

class UnsupportedFileError extends Data.TaggedError("UnsupportedFileError")<{
	cause?: unknown;
	message: string;
}> {}

const supportedExtensions = [".flac"] as const;

export function parseFile(path: string) {
	return Effect.gen(function* () {
		yield* Console.log(`Started reading ${path}`);
		const start = Date.now();

		const extension = path.split(".").pop();
		const assumedType =
			extension && SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
				? (extension as SupportedExtension)
				: null;

		if (!assumedType) {
			return yield* Effect.fail(new UnsupportedFileError({ message: "File is unsupported" }));
		}

		if (assumedType === "flac") {
			const isFlac = yield* flac.isFlac(path);
			if (isFlac) {
				const metadata = yield* flac.readMetadata(path);

				const end = Date.now();
				const elapsed = Duration.millis(end - start);
				yield* Console.log(`----------Finished reading ${path} in ${Duration.toMillis(elapsed)}`);
				return metadata;
			}
		}
		return yield* Effect.fail(new UnsupportedFileError({ message: "File is unsupported" }));
	}).pipe(
		Effect.tapError((e) => {
			if (e._tag === "UnsupportedFileError") return Effect.succeed(null);

			return Console.error(e);
		}),
		Effect.withSpan("parseFile"),
	);
}

export function parseManyFiles(paths: string[]) {
	return Effect.gen(function* () {
		const tasks = paths.map((path) => Effect.option(parseFile(path)));

		const files = yield* Effect.all(tasks, {
			concurrency: 10,
		});

		const successful = files.filter(Option.isSome).map((file) => file.value);

		return successful;
	}).pipe(Effect.withSpan("parseManyFiles"));
}

export function readDirectory(dirPath: string, skip: string[] = []) {
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const files = yield* fs.readDirectory(dirPath, {
			recursive: true,
		});

		const relative = files.map((file) => path.resolve(dirPath, file));
		yield* Console.log(relative);

		const filtered = relative.filter((file) => skip.includes(file) === false);
		yield* Console.log("FILTERED", filtered);

		if (filtered.length === 0) {
			return yield* Effect.succeed([]);
		}

		return yield* parseManyFiles(filtered);
	}).pipe(Effect.withSpan("readDirectory"));
}

export function readDirectoryStream(dirPath: string, skip: string[] = []) {
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const files = yield* fs.readDirectory(dirPath, {
			recursive: true,
		});

		const stream = Stream.fromIterable(files).pipe(
			Stream.map((file) => path.resolve(dirPath, file)),
			Stream.tap((relative) => Console.debug("RELATIVE", relative)),

			Stream.filter((file) => supportedExtensions.some((ext) => file.endsWith(ext)) === false),
			Stream.filter((file) => skip.includes(file) === false),
			Stream.tap((filtered) => Console.debug("FILTERED", filtered)),

			Stream.mapEffect((file) => parseFile(file), {
				concurrency: 10,
			}),
			Stream.catchAll((err) => Stream.empty),
		);

		return stream;
	}).pipe(Effect.withSpan("readDirectoryStream"));
}
