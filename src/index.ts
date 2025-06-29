import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Console, Effect, Layer } from "effect";
import { DatabaseLive } from "./db";
import { EnvLive } from "./env";
import { readMetadata } from "./flac";

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive);

const main = Effect.gen(function* () {
	const metadata = yield* readMetadata("./test-data/11 - Tropical Fish.flac");

	yield* Console.log(metadata);
}).pipe(Effect.provide(layers));

BunRuntime.runMain(main);
