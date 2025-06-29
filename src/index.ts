import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";
import { DatabaseLive } from "./db";
import { Env, EnvLive } from "./env";
import { readDirectory } from "./file-parser";

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive);

const main = Effect.gen(function* () {
	const env = yield* Env.pipe(Effect.flatMap((x) => x.getEnv));

	const dirContent = yield* readDirectory(env.FOLDER_PATH);

	yield* Console.log(dirContent);
}).pipe(Effect.provide(layers));

BunRuntime.runMain(main);
