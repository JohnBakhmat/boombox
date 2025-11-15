import { expect, it as test } from "@effect/vitest";
import { Effect } from "effect/index";
import { FlacService } from "../src/flac/service";
import { BunContext } from "@effect/platform-bun/index";

const provide = Effect.provide(BunContext.layer);

test.effect("readMetadata should return error if file is not flac", () =>
	Effect.gen(function* () {
		const flacService = yield* FlacService;
		const inputNonFlac = "./test-data/01 - hover.mp3";
		const actualNonFlac = yield* flacService.readMetadata(inputNonFlac).pipe(
			Effect.as(true),
			Effect.catchTag("FlacError", (_) => Effect.succeed(false)),
		);

		expect(actualNonFlac).toBe(false);
	}).pipe(provide),
);

test.effect("readMetadata should NOT error if file is FLAC", () =>
	Effect.gen(function* () {
		const flacService = yield* FlacService;
		const input = "./test-data/11 - Tropical Fish.flac";
		const actual = yield* flacService.readMetadata(input).pipe(
			Effect.as(true),
			Effect.catchTag("FlacError", (_) => Effect.succeed(false)),
		);

		expect(actual).toBe(true);
	}).pipe(provide),
);

test.effect("readMetadata should return album, artist and title", () =>
	Effect.gen(function* () {
		const flacService = yield* FlacService;
		const input = "./test-data/11 - Tropical Fish.flac";
		const actual = yield* flacService.readMetadata(input);
		expect(actual).toHaveProperty("artist", "濱田金吾");
		expect(actual).toHaveProperty("album", "「midnight cruisin'」+「MUGSHOT」");
		expect(actual).toHaveProperty("title", "TROPICAL FISH");
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
