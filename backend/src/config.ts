import { Config, Effect } from "effect";

export const getConfig = Effect.gen(function* () {
	return {
		DB_URL: yield* Config.redacted("DB_URL"),
	};
});
