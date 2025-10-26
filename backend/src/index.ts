import { BunContext, BunFileSystem, BunRuntime } from "@effect/platform-bun";
import { Config, Effect, Layer } from "effect";
import { DatabaseLive } from "./db";
import { syncLibraryStream } from "./sync-library";
import { OtelLive } from "./otel";
import { startApi } from "./api";
import { FlacService } from "./flac/service";

const layers = Layer.mergeAll(
	BunContext.layer, 
	OtelLive,
	DatabaseLive.Default, 
	FlacService.Default.pipe(Layer.provide(BunFileSystem.layer)),
);

const main = Effect.gen(function* () {
	const folderPath = yield* Config.string("FOLDER_PATH");	

	yield* syncLibraryStream(folderPath);

	startApi();
}).pipe(Effect.provide(layers));

BunRuntime.runMain(main);
