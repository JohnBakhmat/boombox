import { Console, Context, Data, Effect, Layer } from "effect";

export class CoverartService extends Context.Tag("CoverartService")<
	CoverartService,
	{
		readonly fetchFrontByReleaseGroupId: (
			rgId: string,
		) => Effect.Effect<
			Uint8Array<ArrayBuffer>,
			InvalidReleaseGroupIdError | RateLimitError | UnknownFetchError,
			unknown
		>;
	}
>() {}

export const MusicbrainzCoverartLayer = Layer.succeed(
	CoverartService,
	CoverartService.of({
		fetchFrontByReleaseGroupId: (rgId) =>
			Effect.gen(function* () {
				const endpoint = `http://coverartarchive.org/release-group/${rgId}/front`;

				const response = yield* Effect.tryPromise({
					try: () => fetch(endpoint),
					catch: (err) =>
						new UnknownFetchError({
							message: "Unknown error",
							cause: err,
						}),
				});
				const status = response.status;

				if (status === 400 || status === 404) {
					return yield* Effect.fail(
						new InvalidReleaseGroupIdError({
							message: "This release group id is unparsable or invalid",
							cause: {
								releaseGroupId: rgId,
							},
						}),
					);
				}

				if (status === 503) {
					return yield* Effect.fail(
						new RateLimitError({
							message: "Rate limit hit",
						}),
					);
				}

				if (!response.ok) {
					return yield* Effect.fail(
						new UnknownFetchError({
							message: "Unknown Error",
						}),
					);
				}

				const file = yield* Effect.tryPromise({
					try: () => response.bytes(),
					catch: (err) =>
						new UnknownFetchError({
							message: "Unknown error",
							cause: err,
						}),
				});

				return file;
			}).pipe(),
	}),
);

// Errors
//

class RateLimitError extends Data.TaggedError("RateLimitError")<{
	message: string;
	cause?: unknown;
}> {}

class InvalidReleaseGroupIdError extends Data.TaggedError("InvalidReleaseGroupIdError")<{
	message: string;
	cause?: unknown;
}> {}

class UnknownFetchError extends Data.TaggedError("UnknownFetchError")<{
	message: string;
	cause?: unknown;
}> {}
