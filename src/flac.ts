import { Data, Effect, Option, ParseResult, Schema } from "effect";
import { FileSystem } from "@effect/platform";
import { Bit, Int32, Uint8 } from "./utils";
import { type Metadata, MetadataSchema } from "./metadata";

const VORBIS_STREAMINFO = 4;

const FlacHeader = Schema.Struct({
	isLast: Bit, // 1 bit
	streamInfo: Uint8, // 7 bits
	length: Int32, // 3 bytes
});

// Error class
export class FlacError extends Data.TaggedError("FlacError")<{
	message: string;
	cause?: unknown;
}> {}

// Schema Transformers
const FlacHeaderFromUint8Array = Schema.transformOrFail(
	Schema.Struct({
		uint8Array: Schema.Uint8ArrayFromSelf,
		offset: Schema.Number,
	}),
	FlacHeader,
	{
		strict: true,
		decode({ uint8Array, offset }, _, ast) {
			return Effect.gen(function* () {
				if (uint8Array.length < 4) {
					return yield* ParseResult.fail(
						new ParseResult.Type(ast, uint8Array, "UIntArray is too short"),
					);
				}

				const dataView = new DataView(uint8Array.buffer, offset, 4);

				const header = {
					isLast: ((dataView.getUint8(0) & 0x80) === 0x80 ? 1 : 0) as Bit, // 1 bit
					streamInfo: dataView.getUint8(0) & 0x7f, // 7 bits
					length: dataView.getUint32(0, false) & 0xffffff, // 3 byte
				};

				return yield* ParseResult.succeed(header);
			});
		},
		encode(header, _, _ast) {
			const buffer = new ArrayBuffer(4);
			const dataView = new DataView(buffer);
			dataView.setUint8(0, header.isLast ? 0x80 : 0x00);
			dataView.setUint8(1, header.streamInfo);
			dataView.setUint32(1, header.length, false);
			return ParseResult.succeed({
				uint8Array: new Uint8Array(buffer),
				offset: 0,
			});
		},
	},
);

const MetadataFromUint8Array = Schema.transformOrFail(
	Schema.Struct({
		uint8Array: Schema.Uint8ArrayFromSelf,
		offset: Schema.Number,
		length: Schema.Number,
	}),
	MetadataSchema,
	{
		strict: true,
		decode({ uint8Array, offset, length }, _, ast) {
			return Effect.gen(function* () {
				const dv = new DataView(uint8Array.buffer, offset, length);

				let cursor = 0;

				const vendorStringLength = dv.getUint32(cursor, true);
				cursor += 4;

				
				cursor += vendorStringLength;

				const numberOfFields = dv.getUint32(cursor, true);
				cursor += 4;

				const metadata: Partial<Metadata> = {};

				for (let i = 0; i < numberOfFields; i++) {
					const fieldLength = dv.getUint32(cursor, true);
					cursor += 4;

					const fieldValue = uint8Array
						.slice(cursor, cursor + fieldLength)
						.toString();
					cursor += fieldLength;

					const parsedField = parseFieldValue(fieldValue);

					if (!parsedField) {
						continue;
					}

					const { key, value } = parsedField;

					switch (key) {
						case "ALBUM":
							metadata.album = value;
							break;
						case "ARTIST":
							metadata.artist = value;
							break;
						case "TITLE":
							metadata.title = value;
							break;
						case "TRACKNUMBER":
							metadata.trackNumber = Number.parseInt(value);
							break;
						default:
							continue;
					}
				}

				const valid = Schema.decodeUnknownOption(MetadataSchema)(metadata);

				if (Option.isNone(valid)) {
					return yield* ParseResult.fail(
						new ParseResult.Type(ast, metadata, "Metadata is not valid"),
					);
				}
				return yield* ParseResult.succeed(valid.value);
			});
		},
		encode(x, _, ast) {
			return ParseResult.fail(new ParseResult.Type(ast, x, "Unimplemented"));
		},
	},
);

// Helper functions
function parseFieldValue(str: string): { key: string; value: string } | null {
	const [key, value] = str.split("=").map((x) => x.trim());
	if (!key || !value) return null;
	return { key, value };
}

function readHeader(file: Uint8Array, offset: number) {
	return Effect.gen(function* () {
		

		const header = yield* Schema.decode(FlacHeaderFromUint8Array)({
			uint8Array: file,
			offset: offset,
		});

		return header;
	});
}

function readVorbisComment(file: Uint8Array, offset: number, length: number) {
	return Effect.gen(function* () {
		const slice = file.slice(offset, offset + length);

		const vorbisComment = yield* Schema.decode(MetadataFromUint8Array)({
			uint8Array: slice,
			offset,
			length,
		});

		return vorbisComment;
	}).pipe(
		Effect.withSpan("readVorbisComment", {
			attributes: {
				file,
				offset,
				length,
			},
		}),
	);
}

// Public API
export function isFlac(path: string) {
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const file = yield* fs.readFile(path);
		const slice = file.slice(0, 4).toString();
		return slice === "fLaC";
	});
}

export function readMetadata(path: string) {
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		const fileIsFlac = yield* isFlac(path);
		if (!fileIsFlac) {
			return yield* Effect.fail(
				new FlacError({
					message: "The file you are trying to parse as FLAC is NOT FLAC",
				}),
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

		return vorbisComment;
	});
}
