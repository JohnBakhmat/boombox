import { useAtomValue } from "jotai";
import { fileAtom } from "@/atoms";

import { Pause, Play } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useControls } from "./use-controls";
import { Button } from "@/components/ui/button";

export function Controls() {
	const file = useAtomValue(fileAtom);

	const { togglePlayPause, isPlaying, volumeReal, volumePercent, setVolumePercent } = useControls({});

	if (!file) {
		return null;
	}

	return (
		<div className="fixed h-24 bg-white border border-black bottom-0 left-0 right-0 w-full grid place-items-center z-10">
			<div className="grid place-items-center grid-rows-1 grid-cols-[1fr_auto_1fr] gap-x-10 w-full">
				<div></div>
				<div>
					<Button
						onClick={togglePlayPause}
						size="icon"
						variant="ghost"
						className="aspect-square  border-2 border-black p-3"
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
		</div>
	);
}
