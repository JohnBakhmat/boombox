import { AlbumCard } from "@/components/album-card";
import { getAlbumListFn } from "@/data/get-album-list";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/album/")({
	component: RouteComponent,
});

function RouteComponent() {
	const getAlbumList = useServerFn(getAlbumListFn);

	const { data: albums } = useQuery({
		queryKey: ["album-list"],
		queryFn: () => getAlbumList(),
	});

	return (
		<div className="container">
			<div className="grid lg:grid-cols-6 grid-cols-1">
				{albums?.map((album) => (
					<AlbumCard album={album} key={album.id} />
				))}
			</div>
		</div>
	);
}
