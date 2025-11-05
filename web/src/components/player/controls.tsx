import { Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatDate } from "date-fns";
import { usePlayerStore, getVolumePercent } from "@/store/player";

export function Controls() {
	const currentTrack = usePlayerStore((state) => state.currentTrack);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const volume = usePlayerStore((state) => state.volume);
	const togglePlayPause = usePlayerStore((state) => state.togglePlayPause);
	const setVolumePercent = usePlayerStore((state) => state.setVolumePercent);

	const volumePercent = getVolumePercent(volume);

	// Hardcoded duration values (unchanged from original)
	const maxDurationMs = (12 * 60 + 47) * 1000;
	const curDurationMs = (0 * 60 + 0) * 1000;

	if (!currentTrack) {
		return null;
	}

	return (
		<div className="fixed h-fit py-6 bg-white border border-black bottom-0 left-0 right-0 w-full grid place-items-center gap-4 z-10">
			<div className="grid place-items-center grid-rows-1 grid-cols-[1fr_auto_1fr] gap-x-10 w-full">
				<div></div>
				<div>
					<Button
						onClick={togglePlayPause}
						size="icon"
						variant="outline"
						className="aspect-square  border-2 border-primary text-primary hover:text-primary p-3"
					>
						{isPlaying ? <Pause /> : <Play />}
					</Button>
				</div>

				{/* right */}
				<div className="w-full flex flex-row items-center gap-5">
					<Slider
						defaultValue={[volumePercent]}
						min={0}
						max={100}
						step={0.01}
						className="max-w-[200px]"
						onValueChange={([value]) => value && setVolumePercent(value)}
					/>
					{/*
					 *<pre>{JSON.stringify({ volumePercent, volumeReal }, null, 2)}</pre>
					 */}
				</div>
			</div>
			<div className="w-full max-w-sm flex flex-row items-center gap-4 text-xs  text-black/70">
				<div>{formatTime(curDurationMs)}</div>
				<Slider />
				<div>{formatTime(maxDurationMs)}</div>
			</div>
		</div>
	);
}

function formatTime(ms: number): string {
	return formatDate(new Date(ms), "m:ss");
}
