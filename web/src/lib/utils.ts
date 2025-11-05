import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

import { Schema } from "effect";

export const NormalizedFloat = Schema.Number.pipe(
	Schema.between(0, 1, {
		identifier: "NormalizedFloat",
		description: "floating point number between 0 and 1",
	}),
);

export type NormalizedFloatType = typeof NormalizedFloat.Type;

export function scale(x: number, fromMax: number, toMax: number) {
	return (x / fromMax) * toMax;
}
