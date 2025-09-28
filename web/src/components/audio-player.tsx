"use client";

import { useEffect, useRef } from "react";
import { fileAtom, isPlayingAtom, mainVolumeAtom } from "@/atoms";
import { useAtomValue } from "jotai";
import { Controls } from "./player/controls";

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
