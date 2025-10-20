import { BunContext, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";
import { DatabaseLive } from "./db";
import { Env, EnvLive } from "./env";
import { syncLibraryStream } from "./sync-library";
import { OtelLive } from "./otel";
import { startApi } from "./api";

const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive.Default);

const main = Effect.gen(function* () {
	const env = yield* Env.pipe(Effect.flatMap((x) => x.getEnv)).pipe(Effect.withSpan("env"));

	yield* syncLibraryStream(env.FOLDER_PATH);

	startApi();
}).pipe(Effect.provide(OtelLive), Effect.provide(layers));

BunRuntime.runMain(main);
