import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Cron, Effect, Either, Layer, Option, Schedule } from "effect";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Database } from "bun:sqlite";
import { DatabaseLive } from "./db";
import { syncLibraryStream } from "./sync-library";
import { OtelLive } from "./utils/otel";
import { startApi } from "./api";
import { FlacService } from "./flac/service";

const AppLayer = FlacService.Default.pipe(
	// asdf
	Layer.provideMerge(DatabaseLive.Default),
	Layer.provideMerge(BunContext.layer),
	Layer.merge(OtelLive),
);

const syncCron = Cron.parse("*/1 * * * *").pipe(Either.getRight, Option.getOrThrow);
const syncSchedule = Schedule.cron(syncCron);

const main = Effect.gen(function* () {
	// Run migrations first
	yield* Effect.log("Running database migrations...");
	const dbUrl = yield* Config.string("DB_URL");
	const db = drizzle(new Database(dbUrl));
	yield* Effect.try(() => migrate(db, { migrationsFolder: "./drizzle" }));
	yield* Effect.log("Migrations completed successfully");

	// Then start the application
	const folderPath = yield* Config.string("FOLDER_PATH");

	startApi();

	yield* syncLibraryStream(folderPath);
}).pipe(Effect.provide(AppLayer));

BunRuntime.runMain(main);
