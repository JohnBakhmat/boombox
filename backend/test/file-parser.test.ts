import { expect, it as test } from "@effect/vitest";
import { Effect } from "effect/index";
import { BunContext } from "@effect/platform-bun/index";
import { parseFile, parseManyFiles } from "../src/file-parser";
import { Console } from "effect";

const provide = Effect.provide(BunContext.layer);

test.effect("parseFile should parse flac just fine", () =>
	Effect.gen(function* () {
		const input = "./test-data/11 - Tropical Fish.flac";
		const actual = yield* parseFile(input);
		expect(actual).toHaveProperty("artist", "濱田金吾");
		expect(actual).toHaveProperty("album", "「midnight cruisin’」+「MUGSHOT」");
		expect(actual).toHaveProperty("title", "TROPICAL FISH");
	}).pipe(provide),
);

test.effect("parseManyFiles should parse many files just fine", () =>
	Effect.gen(function* () {
		const input = [
			"./test-data/11 - Tropical Fish.flac",
			"./test-data/01 - hover.mp3",
			"./test-data/01 - hover.fake.flac",
		];
		const actual = yield* parseManyFiles(input);

		yield* Console.dir(actual);

		expect(actual.length).toBe(1); // mp3 is not yet supported
	}).pipe(provide),
);
