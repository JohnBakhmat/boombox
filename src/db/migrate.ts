import { BunContext, BunRuntime } from "@effect/platform-bun";
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun";
import { Effect, Layer } from "effect";
import { SqlLive } from ".";


const main = Effect.gen(function* () {

	yield* SqliteMigrator.run({
		loader: SqliteMigrator.fromFileSystem("./drizzle")
	})
})

const layers = Layer.mergeAll(BunContext.layer, SqlLive)
BunRuntime.runMain(main.pipe(Effect.provide(layers)))
