import { Effect, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { FlacHeaderFromUint8Array, MetadataFromUint8Array } from "./transformers";
import { FlacError } from "./errors";
import { MetadataWithFilepathSchema } from "~/metadata";

const VORBIS_STREAMINFO = 4;

export class FlacService extends Effect.Service<FlacService>()("FlacService", {
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		const isFlac = Effect.fn("isFlac")(function* (path: string) {
			const file = yield* fs.readFile(path);
			const slice = file.slice(0, 4).toString();
			return slice === "fLaC";
		});

		const readMetadata = Effect.fn("flac-readMetadata")(function* (path: string) {
			const fileIsFlac = yield* isFlac(path);
			if (!fileIsFlac) {
				return yield* Effect.fail(
					new FlacError({
						message: "The file you are trying to parse as FLAC is NOT FLAC",
					})
				);
			}

			const file = yield* fs.readFile(path);

			let offset = 4;
			let header = yield* readHeader(file, offset);

			while (!header.isLast && header.streamInfo !== VORBIS_STREAMINFO) {
				offset = offset + 4 + header.length;
				header = yield* readHeader(file, offset);
			}

			offset += 4;

			const vorbisComment = yield* readVorbisComment(file, offset, header.length);

			const result = MetadataWithFilepathSchema.make({
				...vorbisComment,
				filePath: path,
			});

			return result;
		});

		return {
			isFlac,
            readMetadata,
		};
	}),
}) {}



// Helpers
const readHeader = Effect.fn("flac-readHeader")(function* (file: Uint8Array, offset: number) {
	const result = yield* Schema.decode(FlacHeaderFromUint8Array)({
		uint8Array: file,
		offset: offset,
	}).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: "Failed reading header",
				})
		)
	);

	return result;
});

const readVorbisComment = Effect.fn("readVorbisComment")(function* (file: Uint8Array, offset: number, length: number) {
	const slice = file.slice(offset, offset + length);

	const vorbisComment = yield* Schema.decode(MetadataFromUint8Array)({
		uint8Array: slice,
		offset,
		length,
	}).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: "Failed to parse Vorbis Comment",
				})
		)
	);

	return vorbisComment;
});
