import { SongRow } from "@/components/song-row";
import { Console, Data, Effect, Schema } from "effect";
import { Struct } from "effect/Schema";
import { Link } from "waku";

async function getMock() {
	return {
		title: "SISTER",
		cover: "https://writteninmusic.com/wp-content/uploads/2025/09/TOP-Breach.jpg",
		artists: [
			{
				id: "1234",
				name: "Frost Children",
			},
		],
		songs: [
			{
				id: "01994481-481d-7000-9da7-883e615593a4",
				title: "Position Famous",
				trackNumber: 1,
				artists: [
					{
						id: "1234",
						name: "Frost Children",
					},
				],
			},
			{
				id: "01994481-481d-700c-b1cb-a5d0acf3f2f1",
				title: "Falling",
				trackNumber: 2,
				artists: [
					{
						id: "1234",
						name: "Frost Children",
					},
				],
			},
			{
				id: "01994481-481d-7002-b219-fe95ffb1bcfe",
				title: "ELECTRIC",
				trackNumber: 3,
				artists: [
					{
						id: "1234",
						name: "Frost Children",
					},
				],
			},
			{
				id: "01994481-481d-7009-92c9-4a4ba6298844",
				title: "WHAT IS FOREVER FOR",
				trackNumber: 4,
				artists: [
					{
						id: "1234",
						name: "Frost Children",
					},
				],
			},
		],
	};
}

class FetchFailedError extends Data.TaggedError("FetchFailedError")<{
	message: string;
	cause?: unknown;
}> {}

class JsonParseError extends Data.TaggedError("JsonParseError")<{
	message: string;
	cause?: unknown;
}> {}

const ArtistSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	name: Schema.NonEmptyString,
});
const SongSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	fileId: Schema.NonEmptyString,
	artists: Schema.Array(ArtistSchema),
});

const AlbumSchema = Schema.Struct({
	id: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	songs: Schema.Array(SongSchema),
});

function fetchAlbum(id: string) {
	return Effect.gen(function* () {
		const request = yield* Effect.tryPromise({
			try: () => fetch(`http://localhost:3003/album/${id}`),
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

		const parsed = yield* Schema.decodeUnknown(AlbumSchema)(json);
		return parsed;
	}).pipe(Effect.tapError((err) => Console.error(err)));
}

export default async function AlbumPage() {
	return await Effect.runPromise(
		Effect.gen(function* () {
			const data = yield* Effect.tryPromise(() => getMock());

			const album = yield* fetchAlbum("019950fd-d124-7007-934a-49bc1fed41a2");

			return (
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_4fr] max-w-6xl w-full gap-x-8 px-8 py-12">
					{/* Left section*/}
					<div className="relative">
						<div className="flex flex-col gap-5 sticky top-12">
							<img
								src={data.cover}
								width={900}
								height={900}
								className="max-w-[400px] max-h-[400px] aspect-square min-w-[400px] min-h-[400px] rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 object-cover"
							/>

							<div className="space-y-3">
								<h1 className="text-4xl lg:text-5xl font-bold text-balance leading-tight">
									{data.title}
								</h1>
								<h2 className="text-xl font-medium text-brand-orange">
									{data.artists.map((artist, idx) => (
										<>
											{/* @ts-ignore */}
											<Link to={`#`} key={artist.name + idx}>
												{idx !== 0 ? ", " : ""}
												{artist.name}
											</Link>
										</>
									))}
								</h2>
							</div>
						</div>
					</div>

					{/* Right section*/}
					<div className="space-y-5">
						<div>
							<h2 className="text-2xl font-semibold">Tracks</h2>
						</div>

						<ul className="bg-white shadow-md rounded-2xl w-full divide-y divide-border overflow-hidden">
							{album.songs.map((song, idx) => (
								<SongRow
									key={song.title}
									fileId={song.fileId}
									title={song.title}
									trackNumber={idx + 1}
									artists={song.artists.map((x) => ({ name: x.name, id: x.id }))}
								/>
							))}
						</ul>
					</div>
				</div>
			);
		}),
	);
}
