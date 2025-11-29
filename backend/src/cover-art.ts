import { Context, Data, Effect, Layer, Schema } from "effect";

export class RateLimitError extends Schema.TaggedError<RateLimitError>()("RateLimitError", {
	message: Schema.NonEmptyString,
	status: Schema.Number,
}) {}

export class InvalidReleaseGroupIdError extends Schema.TaggedError<InvalidReleaseGroupIdError>()(
	"InvalidReleaseGroupIdError",
	{
		message: Schema.NonEmptyString,
		status: Schema.Number,
		cause: Schema.Defect,
	},
) {}

export class UnknownFetchError extends Schema.TaggedError<UnknownFetchError>()("UnknownFetchError", {
	message: Schema.NonEmptyString,
	status: Schema.optional(Schema.Number),
	cause: Schema.Defect,
}) {}

const ErrorUnion = Schema.Union(RateLimitError, InvalidReleaseGroupIdError, UnknownFetchError);

export class CoverartService extends Context.Tag("CoverartService")<
	CoverartService,
	{
		readonly fetchFrontByReleaseGroupId: (
			rgId: string,
		) => Effect.Effect<Uint8Array<ArrayBuffer>, typeof ErrorUnion.Type, unknown>;
	}
>() {
	static readonly layer = Layer.succeed(
		CoverartService,
		CoverartService.of({
			fetchFrontByReleaseGroupId: (rgId) =>
				Effect.gen(function* () {
					const endpoint = `http://coverartarchive.org/release-group/${rgId}/front`;

					const response = yield* Effect.tryPromise({
						try: () => fetch(endpoint),
						catch: (err) =>
							UnknownFetchError.make({
								message: "Unknown error",
								cause: err,
							}),
					});
					const status = response.status;

					if (status === 400 || status === 404) {
						return yield* InvalidReleaseGroupIdError.make({
							message: "This release group id is unparsable or invalid",
							status,
							cause: {
								releaseGroupId: rgId,
							},
						});
					}

					if (status === 503) {
						return yield* RateLimitError.make({
							message: "Rate limit hit",
							status,
						});
					}

					if (!response.ok) {
						return yield* UnknownFetchError.make({
							message: "Unknown Error",
							status,
							cause: response,
						});
					}

					const file = yield* Effect.tryPromise({
						try: () => response.bytes(),
						catch: (err) =>
							UnknownFetchError.make({
								message: "Unknown error",
								status,
								cause: err,
							}),
					});

					return file;
				}),
		}),
	);
}
