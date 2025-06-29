import { Env } from "./env";
import * as flac from "./flac";
import { Effect, Option, Console } from "effect";
import { FileSystem, Path } from "@effect/platform";

const SUPPORTED_EXTENSIONS = ["flac"] as const;
type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export function parseFile(path: string) {
	return Effect.gen(function* () {
		const extension = path.split(".").pop();
		const assumedType =
			extension && SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
				? (extension as SupportedExtension)
				: null;

		if (!assumedType) {
			return yield* Effect.fail(new Error("File is unsupported"));
		}

		if (assumedType === "flac") {
			const isFlac = yield* flac.isFlac(path);
			if (isFlac) {
				const metadata = yield* flac.readMetadata(path);
				return metadata;
			}
		}
		return yield* Effect.fail(new Error("File is unsupported"));
	});
}

export function parseManyFiles(paths: string[]) {
	return Effect.gen(function* () {
		const tasks = paths.map((path) => Effect.option(parseFile(path)));

		const files = yield* Effect.all(tasks, {
			concurrency: 10,
		});
		yield* Console.log(files);

		const successful = files.filter(Option.isSome).map((file) => file.value);

		return successful;
	});
}

export function readDirectory(dirPath: string) {
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const files = yield* fs.readDirectory(dirPath, {
			recursive: true,
		});

		const relative = files.map((file) => path.resolve(dirPath, file));
		yield* Console.log(relative);

		return yield* parseManyFiles(relative);
	});
}
