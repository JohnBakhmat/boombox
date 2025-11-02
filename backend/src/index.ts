import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Config, Cron, Effect, Either, Layer, Option, Schedule } from "effect";
import { DatabaseLive } from "./db";
import { syncLibraryStream } from "./sync-library";
import { OtelLive } from "./otel";
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
	const folderPath = yield* Config.string("FOLDER_PATH");

	startApi();

	yield* syncLibraryStream(folderPath);
}).pipe(Effect.provide(AppLayer));

BunRuntime.runMain(main);
