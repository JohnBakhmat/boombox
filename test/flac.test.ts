import { expect, it as test } from "@effect/vitest";
import { Effect } from "effect/index";
import { isFlac } from "../src/flac";
import { BunContext, BunRuntime } from "@effect/platform-bun/index";

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
