import { Context, Data, Effect, Layer } from "effect";
import { z } from "zod";

const schema = z.object({
	DB_URL: z.string().min(1),
});
type EnvSchema = z.infer<typeof schema>;

class EnvError extends Data.TaggedError("EnvError")<{
	cause?: unknown;
	message: string;
}> {}

export class Env extends Context.Tag("Env")<
	Env,
	{
		readonly getEnv: Effect.Effect<EnvSchema, EnvError>;
	}
>() {}

export const EnvLive = Layer.succeed(Env, {
	getEnv: Effect.tryPromise({
		try: () => schema.parseAsync(process.env),
		catch: (error) =>
			new EnvError({
				cause: error,
				message: "Failed to parse environment variables",
			}),
	}),
});
