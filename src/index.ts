import { Console, Effect, Layer } from "effect";
import { Env, EnvLive } from "./env";
import { BunContext, BunRuntime } from "@effect/platform-bun";

const main = Effect.gen(function* () {

	const env = yield* Env.pipe(Effect.flatMap(x => x.getEnv))


	yield* Console.log(env)
})


const layers = Layer.mergeAll(BunContext.layer, EnvLive)

BunRuntime.runMain(main.pipe(Effect.provide(layers)))

