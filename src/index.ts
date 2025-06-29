import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";
import { DatabaseLive } from "./db";
import { Env, EnvLive } from "./env";
import { readMetadata } from "./flac";
import { FileSystem, Path } from "@effect/platform";
import { parseManyFiles } from "./file-parser";

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive);

const main = Effect.gen(function* () {
	//const metadata = yield* readMetadata("./test-data/gaga/01 Disease.flac");

	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const env = yield* Env.pipe(Effect.flatMap((x) => x.getEnv));

	const files = yield* fs.readDirectory(env.FOLDER_PATH, {
		recursive: true,
	});

	const relative = files.map((file) => path.resolve(env.FOLDER_PATH, file));
	yield* Console.log(files, relative);

	const metadata = yield* parseManyFiles(relative);

	yield* Console.log(metadata);
}).pipe(Effect.provide(layers));

BunRuntime.runMain(main);
