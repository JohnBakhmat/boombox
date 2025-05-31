import { Console, Effect, Layer } from "effect";
import { Env, EnvLive } from "./env";
import { BunContext, BunRuntime } from "@effect/platform-bun";
import { SqliteDrizzle } from "@effect/sql-drizzle/Sqlite";
import { songTable } from "./db/schema";
import { DatabaseLive } from "./db";

const main = Effect.gen(function* () {

	const db = yield* SqliteDrizzle;

	const data = yield* Effect.promise(() => db.select().from(songTable).execute())

	yield* Console.log(data)

})


const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive)

BunRuntime.runMain(main.pipe(Effect.provide(layers)))

