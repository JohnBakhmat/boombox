import { createServerFn } from "@tanstack/react-start";
import { client } from "@/lib/api";
import { FetchFailedError } from "@/lib/errors";
import { Effect, pipe } from "effect";

export const getAlbumListFn = createServerFn({
	method: "GET",
}).handler(() =>
	pipe(
		Effect.tryPromise({
			try: () => client.albums.get(),
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
