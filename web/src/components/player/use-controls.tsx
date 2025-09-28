import { useAtom } from "jotai";
import { isPlayingAtom, mainVolumeAtom } from "@/atoms";
import { scale } from "@/utils";

const MAX_VOLUME = 0.15;

type Props = {
	maxVolume?: number;
};
export function useControls({ maxVolume }: Props) {
	const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);

	const [mainVolume, setMainVolume] = useAtom(mainVolumeAtom);
	const volumePercent = volumeBackwards(mainVolume, maxVolume);

	const togglePlayPause = () => {
		setIsPlaying((x) => !x);
	};

	const setVolumePercent = (volume: number) => {
		setMainVolume(volumeForward(volume, maxVolume));
	};

	return {
		togglePlayPause,
		isPlaying,
		volumePercent,
		volumeReal: mainVolume,
		setVolumePercent,

		maxDurationMs: (12 * 60 + 47) * 1000,
		curDurationMs: (0 * 60 + 0) * 1000,
	};
}

// ## Helpers

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

function volumeForward(valuePercent: number, maxVolume = MAX_VOLUME) {
	const clamped = clamp(valuePercent, 0, 100);
	const normalized = scale(clamped, 100, 1);
	const perceptual = perceptualVolume(normalized);
	const scaled = scale(perceptual, 1, maxVolume);
	const clamped2 = clamp(scaled, 0, maxVolume);
	return clamped2;
}
function volumeBackwards(value: number, maxVolume = MAX_VOLUME) {
	const clamped = clamp(value, 0, maxVolume);
	const scaled = scale(clamped, maxVolume, 1);
	const actual = amplitudeVolume(scaled);
	const denormalized = scale(actual, 1, 100);
	const clamped2 = clamp(denormalized, 0, 100);
	return clamped2;
}
