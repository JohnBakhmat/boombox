"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/stores/player";
import { Controls } from "./player/controls";

function usePlayer() {
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const currentTrack = usePlayerStore((state) => state.currentTrack);
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const volume = usePlayerStore((state) => state.volume);
	const play = usePlayerStore((state) => state.play);
	const pause = usePlayerStore((state) => state.pause);

	const link = currentTrack ? `http://localhost:3003/file/${currentTrack}` : "";
	const player = audioRef.current;

	useEffect(() => {
		if (!player) {
			return;
		}

		player.volume = volume;

		if (isPlaying) {
			player.play();
		} else {
			player.pause();
		}
	}, [audioRef, currentTrack, isPlaying]);

	useEffect(() => {
		if (!player) {
			return;
		}
		player.volume = volume;
	}, [audioRef, volume]);

	const onPause = () => {
		pause();
	};
	const onPlay = () => {
		play();
	};

	return {
		ref: audioRef,
		src: link,
		onPause,
		onPlay,
	};
}

export function AudioPlayer() {
	const { ref, src, onPause, onPlay } = usePlayer();

	return (
		<>
			<Controls />
			<audio ref={ref} src={src} onPause={onPause} onPlay={onPlay}></audio>
		</>
	);
}
