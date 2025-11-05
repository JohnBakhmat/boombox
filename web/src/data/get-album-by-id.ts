import { createServerFn } from "@tanstack/react-start";
import { client } from "@/lib/api";
import { FetchFailedError } from "@/lib/errors";
import { Effect, pipe } from "effect";

export const getAlbumByIdFn = createServerFn({
	method: "GET",
})
	.inputValidator((data: { id: string }) => data)
	.handler(({ data }) =>
		pipe(
			Effect.tryPromise({
				try: () => client.album({ id: data.id }).get(),
				catch: (err) =>
					new FetchFailedError({
						cause: err,
						message: "Failed to fetch album",
					}),
			}),
			Effect.map((x) => x.data),
			Effect.flatMap(Effect.fromNullable),
			Effect.runPromise,
		),
	);
