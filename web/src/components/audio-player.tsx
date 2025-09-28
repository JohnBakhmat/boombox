"use client";

import { useEffect, useRef } from "react";
import { fileAtom, isPlayingAtom, mainVolumeAtom } from "@/atoms";
import { useAtomValue } from "jotai";
import { Controls } from "./player/controls";

function usePlayer() {
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

	return {
		ref: audioRef,
		src: link,
	};
}

export function AudioPlayer() {
	const { ref, src } = usePlayer();

	return (
		<>
			<Controls />
			<audio ref={ref} src={src} controls></audio>
		</>
	);
}
