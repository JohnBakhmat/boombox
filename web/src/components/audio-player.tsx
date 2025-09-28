"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { fileAtom, isPlayingAtom, mainVolumeAtom } from "@/atoms";
import { useAtom, useAtomValue } from "jotai";

import { Slider } from "./ui/slider";

import { scale } from "@/utils";

export function AudioPlayer() {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const file = useAtomValue(fileAtom);
	const isPlaying = useAtomValue(isPlayingAtom);
	const mainVolume = useAtomValue(mainVolumeAtom);

	const link = file ? `http://localhost:3003/file/${file}` : "";
	const player = audioRef.current;

	useEffect(() => {
		if (!player) {
			return;
		}

		player.volume = mainVolume;

		if (isPlaying) {
			player.play();
		} else {
			player.pause();
		}
	}, [audioRef, file, isPlaying]);

	useEffect(() => {
		if (!player) {
			return;
		}
		player.volume = mainVolume;
	}, [audioRef, mainVolume]);

	return (
		<>
			<Controls />
			<audio ref={audioRef} src={link}></audio>
		</>
	);
}

function Controls() {
	const file = useAtomValue(fileAtom);
	const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

	const [mainVolume, setMainVolume] = useAtom(mainVolumeAtom);
	const volumePercent = volumeBackwards(mainVolume);

	const togglePlayPause = () => {
		setIsPlaying((x) => !x);
	};

	const setVolumePercent = (volume: number) => {
		setMainVolume(volumeForward(volume));
	};

	if (!file) {
		return null;
	}

	return (
		<div className="fixed h-24 bg-white border border-black bottom-0 left-0 right-0 w-full grid place-items-center z-10">
			<div className="grid place-items-center grid-rows-1 grid-cols-[1fr_auto_1fr] gap-x-10 w-full">
				<div></div>
				<div>
					<button onClick={togglePlayPause} className="aspect-square rounded-full  border-2 border-black p-3">
						{isPlaying ? <Pause /> : <Play />}
					</button>
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
					<pre>{JSON.stringify({ mainVolume, volumePercent }, null, 2)}</pre>
				</div>
			</div>
		</div>
	);
}

const MAX_VOLUME = 0.15;

function perceptualVolume(x: number) {
	//return (Math.exp(x) - 1) / (Math.E - 1);
	return (Math.exp(x) - 1) * 0.5819767; // 1/(e-1)
}

function amplitudeVolume(x: number) {
	//return Math.log(x * (Math.E - 1) + 1);
	return Math.log(x * 1.71828 + 1); // e-1
}

function clamp(x: number, min: number, max: number) {
	if (x > max) {
		return max;
	}
	if (x < min) {
		return min;
	}
	return x;
}

function volumeForward(valuePercent: number) {
	const clamped = clamp(valuePercent, 0, 100);
	const normalized = scale(clamped, 100, 1);
	const perceptual = perceptualVolume(normalized);
	const scaled = scale(perceptual, 1, MAX_VOLUME);
	const clamped2 = clamp(scaled, 0, MAX_VOLUME);
	return clamped2;
}
function volumeBackwards(value: number) {
	const clamped = clamp(value, 0, MAX_VOLUME);
	const scaled = scale(clamped, MAX_VOLUME, 1);
	const actual = amplitudeVolume(scaled);
	const denormalized = scale(actual, 1, 100);
	const clamped2 = clamp(denormalized, 0, 100);
	return clamped2;
}
