import { atom } from "jotai";
import { NormalizedFloatType } from "./utils";

export const isPlayingAtom = atom<boolean>(false);
export const fileAtom = atom<string | null>(null);

export const mainVolumeAtom = atom<NormalizedFloatType>(0.02);
