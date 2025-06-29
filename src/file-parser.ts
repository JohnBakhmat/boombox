import * as flac from "./flac";
import { Effect, Either } from "effect";

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
		const tasks = paths.map((path) => parseFile(path));

		const files = yield* Effect.all(tasks, {
			concurrency: 10,
			mode: "either",
		});

		const successful = files.filter((file) => Either.isRight(file)).map((file) => file.right);

		return successful;
	});
}
