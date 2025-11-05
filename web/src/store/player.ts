import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scale } from "@/lib/utils";

const MAX_VOLUME = 0.15;

// ## Volume Helpers

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

// ## Store

interface PlayerState {
	// State
	isPlaying: boolean;
	currentTrack: string | null;
	volume: number; // 0-1 range

	// Actions
	play: () => void;
	pause: () => void;
	togglePlayPause: () => void;
	setTrack: (fileId: string) => void;
	setVolume: (volume: number) => void;
	setVolumePercent: (percent: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
	persist(
		(set) => ({
			// Initial state
			isPlaying: false,
			currentTrack: null,
			volume: 0.02,

			// Actions
			play: () => set({ isPlaying: true }),
			pause: () => set({ isPlaying: false }),
			togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
			setTrack: (fileId: string) => set({ currentTrack: fileId, isPlaying: true }),
			setVolume: (volume: number) => set({ volume }),
			setVolumePercent: (percent: number) => set({ volume: volumeForward(percent) }),
		}),
		{
			name: "boombox-player-volume",
			partialize: (state) => ({ volume: state.volume }),
		},
	),
);

// Helper to get volume as percentage (0-100)
export function getVolumePercent(volume: number): number {
	return volumeBackwards(volume);
}
