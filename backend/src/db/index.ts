import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun";

import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite";
import { Config, Effect, Layer, pipe } from "effect";
import { BunFileSystem } from "@effect/platform-bun";
import * as schema from "./schema";

//export const SqlLive = SqliteClient.layer({
//filename: process.env.DB_URL!,
//});

//const DrizzleLive = SqliteDrizzle.layer.pipe(Layer.provide(SqlLive));

const SqliteLive = SqliteClient.layerConfig({
	filename: Config.string("DB_URL"),
});

export class DatabaseLive extends Effect.Service<DatabaseLive>()("DatabaseLive", {
	dependencies: [SqliteLive],
	effect: SqliteDrizzle.make<typeof schema>({
		schema,
	}),
}) {}

export const DrizzleMigratorLive = pipe(
	SqliteMigrator.layer({
		loader: SqliteMigrator.fromFileSystem("./drizzle"),
		schemaDirectory: "./drizzle",
	}),
	Layer.provide(SqliteLive),
	Layer.provide(BunFileSystem.layer),
);
