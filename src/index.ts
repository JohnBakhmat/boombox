import { Console, Effect, Layer } from "effect";
import { Env, EnvLive } from "./env";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { SqliteDrizzle } from "@effect/sql-drizzle/Sqlite";
import { songTable } from "./db/schema";
import { DatabaseLive } from "./db";
import { readMetadata } from "./flac";

const main = Effect.gen(function* () {
	yield* readMetadata("./test-data/11 - Tropical Fish.flac");
});

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive);

BunRuntime.runMain(main.pipe(Effect.provide(layers)));
