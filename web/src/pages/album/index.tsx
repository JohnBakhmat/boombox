import { AlbumCard } from "@/components/album-card";
import { client } from "@/lib/api";
import { FetchFailedError } from "@/lib/errors";
import { Effect, pipe } from "effect";

const getAlbums = () => pipe(
	Effect.tryPromise({
		try: () => client.albums.get(),
		catch: (err) => new FetchFailedError({
			cause: err,
			message: "Failed to fetch album"
		})
	}),
	Effect.map(x => x.data),
	Effect.flatMap(Effect.fromNullable)
)

const AlbumPage = () =>
	Effect.runPromise(
		Effect.gen(function* () {
			const albums = yield* getAlbums();

			return (
				<div className="container">
					<div className="grid lg:grid-cols-6 grid-cols-1">
						{albums.map((album) => (
							<AlbumCard album={album} key={album.id} />
						))}
					</div>
				</div>
			);
		}),
	);

export default AlbumPage;
