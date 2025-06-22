import { Console, Effect, Layer } from "effect";
import { EnvLive } from "./env";
import { BunContext, BunRuntime } from "@effect/platform-bun";

import { DatabaseLive } from "./db";
import { readMetadata } from "./flac";


const layers = Layer.mergeAll(BunContext.layer, EnvLive, DatabaseLive);

const main = Effect.gen(function* () {
    const metadata = yield* readMetadata("./test-data/11 - Tropical Fish.flac");

    yield* Console.log(metadata);
}).pipe(Effect.provide(layers));


BunRuntime.runMain(main);
