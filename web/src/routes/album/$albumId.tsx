import { getAlbumByIdFn } from "@/data/get-album-by-id";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, Suspense } from "react";
import { SongRow } from "@/components/song-row";

export const Route = createFileRoute("/album/$albumId")({
	component: AlbumPage,
});

const cover =
	"https://kagi.com/proxy/61XULTvSzAL._UF1000,1000_QL80_.jpg?c=CXPfL3-FqybbvZNQU82_BGSCqYZMz5YT_CgNKn5TDDXCMTx4RBDER1f1uKKcHU3q-jYfB0s9g7IqjQnd4qu98gIcHOAFJ-6Z9h86prZDhCifllLXbHfuIeOHoHw5gbgC";

function AlbumPage() {
	return (
		<Suspense fallback={"Loading ..."}>
			<SuspendedAlbumPage />
		</Suspense>
	);
}

function SuspendedAlbumPage() {
	const { albumId } = Route.useParams();

	const getAlbumById = useServerFn(getAlbumByIdFn);

	const { data: album } = useSuspenseQuery({
		queryKey: ["album", albumId],
		queryFn: () => getAlbumById({ data: { id: albumId } }),
	});

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[1fr_4fr] max-w-6xl w-full gap-x-8 px-8 py-12 mx-auto">
			{/* Left section*/}
			<div className="relative">
				<div className="flex flex-col gap-5 sticky top-12">
					<img
						src={cover}
						width={900}
						height={900}
						className="max-w-[400px] max-h-[400px] aspect-square min-w-[400px] min-h-[400px] rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500 object-cover"
					/>

					<div className="space-y-3">
						<h1 className="text-4xl lg:text-5xl font-bold text-balance leading-tight">{album.title}</h1>
						<h2 className="text-xl font-medium text-primary">
							{album.artists.map((artist, idx) => (
								<Fragment key={artist.id}>
									{/* @ts-ignore */}
									<a href={`#`}>
										{idx !== 0 ? ", " : ""}
										{artist.name}
									</a>
								</Fragment>
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
							key={song.id}
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
}
