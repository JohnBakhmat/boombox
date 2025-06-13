import {
	Chunk,
	Console,
	Data,
	Effect,
	Equal,
	ParseResult,
	pipe,
	Schema,
	Sink,
	Stream,
} from "effect";
import { FileSystem } from "@effect/platform";
import { Bit, Int32, Uint8 } from "./utils";
import { uint8Array } from "@effect/platform/HttpServerResponse";
import { z } from "zod";

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

const VORBIS_STREAMINFO = 4;

const metadataSchema = z.object({
	album: z.string(),
	artist: z.string(),
	title: z.string(),
});

type Metadata = z.infer<typeof metadataSchema>;

const FlacHeader = Schema.Struct({
	isLast: Bit, // 1 bit
	streamInfo: Uint8, // 7 bits
	length: Int32, // 3 bytes
});

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

		encode(header, _, ast) {
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

const VorbisComment = Schema.Struct({
	artist: Schema.String,
	album: Schema.String,
	title: Schema.String,
});

const VorbisCommentFromUint8Array = Schema.transformOrFail(
	Schema.Struct({
		uint8Array: Schema.Uint8ArrayFromSelf,
		offset: Schema.Number,
		length: Schema.Number,
	}),
	VorbisComment,
	{
		strict: true,
		decode({ uint8Array, offset, length }, _, ast) {
			return Effect.gen(function* () {
				const dv = new DataView(uint8Array.buffer, offset, length);

				let cursor = 0;

				const vendorStringLength = dv.getUint32(cursor, true);
				cursor += 4;

				const vendorString = uint8Array
					.slice(cursor, cursor + vendorStringLength)
					.toString();
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
						default:
							continue;
					}
				}

				//catch:(error)=> ParseResult.fail(new ParseResult.Type(ast, error, "Failed to validate parsed metdata"))

				//const foo = effect.promise(()=>metadataschema.parseasync(metadata))

				//const valid = yield* Effect.tryPromise(() =>
				//metadataSchema.parseAsync(metadata),
				//).pipe(
				//Effect.mapError((error) =>
				//ParseResult.fail(
				//new ParseResult.Type(ast, error, "Failed to validate"),
				//),
				//),
				//Effect.map(ParseResult.succeed)
				//);

				//return yield* valid

				const {
					data: valid,
					success: isValid,
					error,
				} = yield* Effect.promise(() =>
					metadataSchema.safeParseAsync(metadata),
				);

				if (!isValid) {
					return yield* ParseResult.fail(
						new ParseResult.Type(ast, error, "Metadata is not valid"),
					);
				}
				return yield* ParseResult.succeed(valid);
			});
		},
		encode(x, _, ast) {
			return ParseResult.fail(new ParseResult.Type(ast, x, "Unimplemented"));
		},
	},
);

function readVorbisComment(file: Uint8Array, offset: number, length: number) {
	return Effect.gen(function* () {
		const slice = file.slice(offset, offset + length);

		const vorbisComment = yield* Schema.decode(VorbisCommentFromUint8Array)({
			uint8Array: slice,
			offset,
			length,
		});

		return vorbisComment;
	});
}

function readHeader(file: Uint8Array, offset: number) {
	return Effect.gen(function* () {
		const slice = file.slice(offset, offset + 4);

		const header = yield* Schema.decode(FlacHeaderFromUint8Array)({
			uint8Array: file,
			offset: offset,
		});

		return header;
	});
}

function parseFieldValue(str: string): { key: string; value: string } | null {
	const [key, value] = str.split("=").map((x) => x.trim());
	if (!key || !value) return null;
	return { key, value };
}

export class FlacError extends Data.TaggedError("FlacError")<{
	message: string;
	cause?: unknown;
}> {}
