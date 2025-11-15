import { Effect, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { FlacHeaderFromUint8Array, MetadataFromUint8Array } from "./transformers";
import { FlacError } from "./errors";
import { MetadataWithFilepathSchema } from "~/metadata";
import { BunFileSystem } from "@effect/platform-bun";

const VORBIS_COMMENT = 4;
const MAX_METADATA_BLOCKS = 128; // FLAC spec allows max 128 metadata blocks

export class FlacService extends Effect.Service<FlacService>()("FlacService", {
	dependencies: [BunFileSystem.layer],
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		const readMetadata = Effect.fn("flac-readMetadata")(function* (path: string) {
			const file = yield* fs.readFile(path);

			// Check if file is FLAC
			if (file.length < 4 || file.slice(0, 4).toString() !== "fLaC") {
				return yield* Effect.fail(
					new FlacError({
						message: `File is not a valid FLAC file: ${path}`,
					}),
				);
			}

			let offset = 4;
			let iterations = 0;

			// Find the Vorbis Comment block
			while (iterations < MAX_METADATA_BLOCKS) {
				// Bounds check: ensure we can read a header
				if (offset + 4 > file.length) {
					return yield* Effect.fail(
						new FlacError({
							message: `Malformed FLAC file: unexpected end at offset ${offset} in ${path}`,
						}),
					);
				}

				const header = yield* readHeader(file, offset, path);

				if (header.streamInfo === VORBIS_COMMENT) {
					// Found Vorbis Comment block
					offset += 4;

					// Bounds check: ensure we can read the vorbis comment
					if (offset + header.length > file.length) {
						return yield* Effect.fail(
							new FlacError({
								message: `Malformed FLAC file: Vorbis Comment extends beyond file at offset ${offset} in ${path}`,
							}),
						);
					}

					const vorbisComment = yield* readVorbisComment(file, offset, header.length, path);

					const result = MetadataWithFilepathSchema.make({
						...vorbisComment,
						filePath: path,
					});

					return result;
				}

				if (header.isLast) {
					return yield* Effect.fail(
						new FlacError({
							message: `No Vorbis Comment block found in FLAC file: ${path}`,
						}),
					);
				}

				offset = offset + 4 + header.length;
				iterations++;
			}

			return yield* Effect.fail(
				new FlacError({
					message: `Too many metadata blocks (>${MAX_METADATA_BLOCKS}) in FLAC file: ${path}`,
				}),
			);
		});

		return {
			readMetadata,
		} as const;
	}),
}) {}

// Helpers
const readHeader = Effect.fn("flac-readHeader")(function* (file: Uint8Array, offset: number, path: string) {
	const result = yield* Schema.decode(FlacHeaderFromUint8Array)({
		uint8Array: file,
		offset: offset,
	}).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: `Failed reading FLAC header at offset ${offset} in ${path}`,
				}),
		),
	);

	return result;
});

const readVorbisComment = Effect.fn("readVorbisComment")(function* (
	file: Uint8Array,
	offset: number,
	length: number,
	path: string,
) {
	const slice = file.slice(offset, offset + length);

	const vorbisComment = yield* Schema.decode(MetadataFromUint8Array)({
		uint8Array: slice,
		offset: 0, // slice starts at 0
		length,
	}).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: `Failed to parse Vorbis Comment at offset ${offset} in ${path}`,
				}),
		),
	);

	return vorbisComment;
});
