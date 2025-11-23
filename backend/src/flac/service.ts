import { Effect, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { FlacHeaderFromUint8Array, MetadataFromUint8Array } from "./transformers";
import { FlacError } from "./errors";
import { MetadataWithFilepathSchema } from "~/metadata";
import { BunFileSystem } from "@effect/platform-bun";

const VORBIS_COMMENT = 4;
const MAX_METADATA_BLOCKS = 128;
const FLAC_MARKER_SIZE = 4;
const BLOCK_HEADER_SIZE = 4;

// Helper: Convert Uint8Array to string
const bytesToString = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

export class FlacService extends Effect.Service<FlacService>()("FlacService", {
	dependencies: [BunFileSystem.layer],
	effect: Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const readMetadata = Effect.fn("flac-readMetadata")(function* (path: string) {
			// fs.open returns a scoped resource - it will automatically close
			// when the scope exits (success, failure, or interruption)
			return yield* Effect.scoped(
				Effect.gen(function* () {
					const file = yield* fs.open(path, { flag: "r" });
					// Read only the fLaC marker (4 bytes)
					const marker = yield* readBytes(file, 0, FLAC_MARKER_SIZE, path);
					if (bytesToString(marker) !== "fLaC") {
						return yield* Effect.fail(
							new FlacError({
								message: `File is not a valid FLAC file: ${path}`,
							}),
						);
					}
					let offset = FLAC_MARKER_SIZE;
					let iterations = 0;
					// Stream through metadata blocks
					while (iterations < MAX_METADATA_BLOCKS) {
						// Read just the 4-byte block header
						const headerBytes = yield* readBytes(file, offset, BLOCK_HEADER_SIZE, path);
						const header = yield* parseHeader(headerBytes, offset, path);
						if (header.streamInfo === VORBIS_COMMENT) {
							// Found Vorbis Comment - read only this block's content
							const vorbisBytes = yield* readBytes(file, offset + BLOCK_HEADER_SIZE, header.length, path);
							const vorbisComment = yield* parseVorbisComment(vorbisBytes, header.length, offset, path);
							return MetadataWithFilepathSchema.make({
								...vorbisComment,
								filePath: path,
							});
						}
						if (header.isLast) {
							return yield* Effect.fail(
								new FlacError({
									message: `No Vorbis Comment block found in FLAC file: ${path}`,
								}),
							);
						}
						// Skip to next block
						offset = offset + BLOCK_HEADER_SIZE + header.length;
						iterations++;
					}
					return yield* Effect.fail(
						new FlacError({
							message: `Too many metadata blocks (>${MAX_METADATA_BLOCKS}) in FLAC file: ${path}`,
						}),
					);
				}),
			);
		});
		return {
			readMetadata,
		} as const;
	}),
}) {}
// Helper: Read specific bytes from file handle
const readBytes = Effect.fn("readBytes")(function* (
	file: FileSystem.File,
	offset: number,
	length: number,
	path: string,
) {
	const buffer = new Uint8Array(length);
	// Seek to the desired offset
	yield* file.seek(offset, "start");
	// Read the data
	const bytesRead = yield* file.read(buffer).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: `Failed to read ${length} bytes at offset ${offset} from ${path}`,
				}),
		),
	);
	if (bytesRead < length) {
		return yield* Effect.fail(
			new FlacError({
				message: `Unexpected end of file: expected ${length} bytes, got ${bytesRead} at offset ${offset} in ${path}`,
			}),
		);
	}
	return buffer;
});
// Helper: Parse header from bytes
const parseHeader = Effect.fn("parseHeader")(function* (headerBytes: Uint8Array, offset: number, path: string) {
	return yield* Schema.decode(FlacHeaderFromUint8Array)({
		uint8Array: headerBytes,
		offset: 0, // Reading fresh buffer
	}).pipe(
		Effect.mapError(
			(e) =>
				new FlacError({
					cause: e,
					message: `Failed reading FLAC header at offset ${offset} in ${path}`,
				}),
		),
	);
});
// Helper: Parse Vorbis Comment from bytes
const parseVorbisComment = Effect.fn("parseVorbisComment")(function* (
	vorbisBytes: Uint8Array,
	length: number,
	offset: number,
	path: string,
) {
	return yield* Schema.decode(MetadataFromUint8Array)({
		uint8Array: vorbisBytes,
		offset: 0, // Reading fresh buffer
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
});
