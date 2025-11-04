import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";
import { Env, EnvLive } from "../utils/env";

const main = Effect.gen(function* () {
	const env = yield* Env.pipe(Effect.flatMap((x) => x.getEnv));

	const db = drizzle(new Database(env.DB_URL));

	yield* Effect.try(() => migrate(db, { migrationsFolder: "./drizzle" }));
});

const layers = Layer.mergeAll(BunContext.layer, EnvLive);
BunRuntime.runMain(main.pipe(Effect.provide(layers)));
