import { SqliteClient } from "@effect/sql-sqlite-bun"
import { SqlClient } from "@effect/sql"

import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite"
import { Effect, Layer } from "effect"
import { Env } from "../env"


const SqlLive = Layer.scoped(SqlClient.SqlClient, Effect.gen(function* () {

	const env = yield* Env.pipe(Effect.flatMap(x => x.getEnv));

	return yield* SqliteClient.make({
		filename: env.DB_URL
	})
}))

const DrizzleLive = SqliteDrizzle.layer.pipe(
	Layer.provide(SqlLive)
)
export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive)
