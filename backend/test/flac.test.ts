import { expect, it as test } from "@effect/vitest";
import { Effect } from "effect/index";
import { isFlac, readMetadata } from "../src/flac";
import { BunContext } from "@effect/platform-bun/index";

const provide = Effect.provide(BunContext.layer);

test.effect("isFlac should return weather file is flac", () =>
	Effect.gen(function* () {
		const inputFlac = "./test-data/11 - Tropical Fish.flac";
		const actualFlac = yield* isFlac(inputFlac);
		expect(actualFlac).toBeTruthy();

		const inputNonFlac = "./test-data/01 - hover.mp3";
		const actualNonFlac = yield* isFlac(inputNonFlac);
		expect(actualNonFlac).toBeFalsy();
	}).pipe(provide),
);

test.effect("readMetadata should return error if file is not flac", () =>
	Effect.gen(function* () {
		const inputNonFlac = "./test-data/01 - hover.mp3";
		const actualNonFlac = yield* readMetadata(inputNonFlac).pipe(
			Effect.as(true),
			Effect.catchTag("FlacError", (_) => Effect.succeed(false)),
		);

		expect(actualNonFlac).toBe(false);
	}).pipe(provide),
);

test.effect("readMetadata should NOT error if file is FLAC", () =>
	Effect.gen(function* () {
		const input = "./test-data/11 - Tropical Fish.flac";
		const actual = yield* readMetadata(input).pipe(
			Effect.as(true),
			Effect.catchTag("FlacError", (_) => Effect.succeed(false)),
		);

		expect(actual).toBe(true);
	}).pipe(provide),
);

test.effect("readMetadata should return album, artist and title", () =>
	Effect.gen(function* () {
		const input = "./test-data/11 - Tropical Fish.flac";
		const actual = yield* readMetadata(input);
		expect(actual).toHaveProperty("artist", "濱田金吾");
		expect(actual).toHaveProperty("album", "「midnight cruisin’」+「MUGSHOT」");
		expect(actual).toHaveProperty("title", "TROPICAL FISH");
	}).pipe(provide),
);
