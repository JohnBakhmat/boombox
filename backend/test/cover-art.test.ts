import { expect, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { CoverartService, MusicbrainzCoverartLayer } from "../src/cover-art";

it.effect("should fetch cover art if release group is correct", () =>
	Effect.gen(function* () {
		const coverartService = yield* CoverartService;

		const result = yield* coverartService
			.fetchFrontByReleaseGroupId("7d1a547f-e58e-4601-b682-300e39a4aa18")
			.pipe(Effect.exit);

		expect(Exit.isSuccess(result)).toBeTruthy();
	}).pipe(Effect.provide(MusicbrainzCoverartLayer)),
);

it.effect("should return InvalidReleaseGroupId if id is invalid", () =>
	Effect.gen(function* () {
		const coverartService = yield* CoverartService;

		const rgId = "7d1a547f-e58e-4601-b555-300e39a4aa18";

		const result = yield* coverartService.fetchFrontByReleaseGroupId(rgId).pipe(Effect.exit);

		expect(Exit.isFailure(result)).toBeTruthy();
	}).pipe(Effect.provide(MusicbrainzCoverartLayer)),
);
