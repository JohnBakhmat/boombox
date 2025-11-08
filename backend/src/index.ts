import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Deferred, Effect, Fiber, Layer, Schedule } from "effect";
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

const SHUTDOWN_TIMEOUT_MS = 10_000;

const main = Effect.gen(function* () {
	// Run migrations first
	yield* Effect.log("Running database migrations...");
	const dbUrl = yield* Config.string("DB_URL");
	const db = drizzle(new Database(dbUrl));
	yield* Effect.try(() => migrate(db, { migrationsFolder: "./drizzle" }));
	yield* Effect.log("Migrations completed successfully");

	// Then start the application
	const folderPath = yield* Config.string("FOLDER_PATH");

	const { server, runtime } = startApi();
	yield* Effect.log("API server started on port 3003");

	// Create a deferred to handle shutdown signal
	const shutdownSignal = yield* Deferred.make<void>();

	// Setup graceful shutdown handlers
	const setupShutdownHandlers = Effect.sync(() => {
		const handleShutdown = (signal: string) => {
			Effect.runFork(
				Effect.gen(function* () {
					yield* Effect.log(`Received ${signal}, starting graceful shutdown...`);
					yield* Deferred.succeed(shutdownSignal, undefined);
				}).pipe(Effect.provide(AppLayer)),
			);
		};

		process.on("SIGTERM", () => handleShutdown("SIGTERM"));
		process.on("SIGINT", () => handleShutdown("SIGINT"));
	});

	yield* setupShutdownHandlers;

	// Start library sync in the background, repeating every 10 minutes
	const syncFiber = yield* Effect.fork(
		syncLibraryStream(folderPath).pipe(Effect.repeat(Schedule.spaced("3 minutes"))),
	);

	// Wait for shutdown signal
	yield* Deferred.await(shutdownSignal);

	// Begin graceful shutdown
	yield* Effect.log("Shutting down API server...");

	// Stop accepting new connections
	yield* Effect.tryPromise(() => server.stop());
	yield* Effect.log("API server stopped");

	// Interrupt the sync fiber
	yield* Effect.log("Stopping library sync...");
	yield* Fiber.interrupt(syncFiber);
	yield* Effect.log("Library sync stopped");

	// Dispose of the runtime to clean up database connections
	yield* Effect.log("Closing database connections...");
	yield* Effect.tryPromise(() => runtime.dispose());
	yield* Effect.log("Database connections closed");

	yield* Effect.log("Graceful shutdown completed");
}).pipe(Effect.provide(AppLayer));

BunRuntime.runMain(main);
