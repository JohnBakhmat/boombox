import { Link } from "@tanstack/react-router";

type Props = {
	album: Readonly<{
		id: string;
		title: string;
		artists: ReadonlyArray<{
			id: string;
			name: string;
		}>;
	}>;
};

const mockCover = "https://writteninmusic.com/wp-content/uploads/2025/09/TOP-Breach.jpg";
export function AlbumCard(props: Props) {
	const { id, title, artists } = props.album;

	return (
		//TODO Update to tanstack link
		<a href={`/album/${id}`} className="space-y-px p-3 transition duration-100 hover:bg-black/10 h-fit rounded-lg">
			<div className="aspect-square rounded-md overflow-hidden">
				<img width={900} height={900} src={mockCover} className="object-cover w-full h-full" />
			</div>
			<p className="text-md font-medium">{title}</p>
			<p className="text-sm opacity-70">{artists.at(0)?.name}</p>
		</a>
	);
}
