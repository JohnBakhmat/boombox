"use client";

import { AudioLines, Pause, Play } from "lucide-react";
import { usePlayerStore } from "@/store/player";

type Props = Readonly<{
	title: string;
	fileId: string;
	trackNumber: number;
	artists: Array<{ id: string; name: string }>;
	isPaused?: boolean;
}>;

export function SongRow(props: Props) {
	const currentTrack = usePlayerStore((state) => state.currentTrack);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const setTrack = usePlayerStore((state) => state.setTrack);

	const isCurrent = currentTrack === props.fileId;
	const isPaused = isCurrent && !isPlaying;

	const handleClick = () => {
		setTrack(props.fileId);
	};

	return (
		<li className="w-full">
			<button
				onClick={handleClick}
				data-is-current={isCurrent}
				className="track-row-grid p-4 gap-x-4 gap-y-1 group transition-all duration-200 cursor-pointer hover:bg-muted data-[is-current=true]:bg-primary-foreground w-full text-left"
			>
				<div
					data-is-current={isCurrent}
					className="data-[id-current=true]:text-primary grid place-items-center h-full w-6 text-center"
					style={{ gridArea: "number" }}
				>
					<div className="w-4 h-4 group-hover:hidden grid place-items-center">
						{isPaused ? (
							<Pause className="w-4 h-4 text-primary" />
						) : isCurrent ? (
							<AudioLines className="w-4 h-4 text-primary animate-pulse" />
						) : (
							<>
								<span>{props.trackNumber}</span>
							</>
						)}
					</div>
					<Play className="w-4 h-4 text-primary hidden group-hover:block" />
				</div>
				<span data-id-current={isCurrent} className="font-semibold data-[id-current=true]:text-primary">
					{props.title}
				</span>
				<span className="text-sm">{props.artists.map((a) => a.name).join(", ")}</span>
				<span style={{ gridArea: "duration" }} className="text-right">
					0:00
				</span>
			</button>
		</li>
	);
}
