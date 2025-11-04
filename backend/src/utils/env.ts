import { Context, Data, Effect, Layer, Schema } from "effect";

class EnvError extends Data.TaggedError("EnvError")<{
	cause?: unknown;
	message: string;
}> {}

export class Env extends Context.Tag("Env")<Env, { readonly getEnv: Effect.Effect<EnvSchema, EnvError> }>() {}

const schema = Schema.Struct({
	DB_URL: Schema.NonEmptyString,
	FOLDER_PATH: Schema.NonEmptyString,
});

type EnvSchema = Schema.Schema.Type<typeof schema>;

export const EnvLive = Layer.succeed(Env, {
	getEnv: Schema.decodeUnknown(schema)(process.env).pipe(
		Effect.mapError((e) => new EnvError({ message: "Environment is not valid", cause: e })),
	),
});
