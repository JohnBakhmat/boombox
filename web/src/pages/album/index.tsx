import { AlbumCard } from "@/components/album-card";
import { FetchFailedError, JsonParseError } from "@/lib/errors";
import { Console, Effect, Schema } from "effect";
import { divide } from "effect/Duration";


const ArtistSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	name: Schema.NonEmptyString,
});

const AlbumSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	cover: Schema.UndefinedOr(Schema.String),  // TODO: enforce cover to be string, or atleast String | Null
	artists: Schema.Array(ArtistSchema)
});

const getAlbums = () => Effect.gen(function*() {

	const request = yield* Effect.tryPromise({
		try: () => fetch(`http://localhost:3003/albums`),
		catch: (err) =>
			new FetchFailedError({
				cause: err,
				message: "Failed to fetch album",
			}),
	});

	const json = yield* Effect.tryPromise({
		try: () => request.json().then((x) => x as unknown),
		catch: (err) =>
			new JsonParseError({
				cause: err,
				message: "Failed to parse json",
			}),
	});
	yield* Console.dir(json, { depth: 3 })

	const parsed = yield* Schema.decodeUnknown(Schema.Array(AlbumSchema))(json);
	return parsed
	//return Array.from({ length: 15 }).map(() => parsed).flat();
})

const AlbumPage = () => Effect.runPromise(Effect.gen(function*() {


	const albums = yield* getAlbums()

	return (
		<div className="container">
			<div className="grid lg:grid-cols-6 grid-cols-1">


				{albums.map(album => <AlbumCard
					album={album}
					key={album.id}

				/>)}

			</div>
		</div>
	)
}))


export default AlbumPage;
