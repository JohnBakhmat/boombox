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

export const isFlac = (path: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const file = yield* fs.readFile(path);
		const slice = new TextDecoder().decode(file.slice(0, 4));
		return slice === "fLaC";
	});

export const readMetadata = (path: string) =>
	Effect.gen(function* () {
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

		function readHeader(file: Uint8Array, offset: number) {
			return Effect.gen(function* () {
				const slice = file.slice(offset, offset + 4);

				const header = yield* Schema.decode(FlacHeaderFromUint8Array)({
					uint8Array: file,
					offset: offset,
				});

				yield* Console.dir({
					header,
					offset,
					slice,
				});

				return header;
			});
		}

		let offset = 4;
		let header = yield* readHeader(file, offset);
		offset = offset + 4 + header.length;

		while (!header.isLast && header.streamInfo !== VORBIS_STREAMINFO) {
			header = yield* readHeader(file, offset);
			offset = offset + 4 + header.length;
		}

		yield* Console.log({
			header,
			offset,
		});
	});

const VORBIS_STREAMINFO = 4;

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

				const dataView = new DataView(uint8Array.buffer, offset);

				yield* Console.dir({
					dataView: dataView,
				});

				const header = {
					isLast: ((dataView.getUint8(0) & 0x80) === 0x80 ? 1 : 0) as Bit, // 1 bit
					streamInfo: dataView.getUint8(0) & 0x7f, // 7 bits
					length: dataView.getUint32(1, false) >> 8, // 3 bytes
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

export class FlacError extends Data.TaggedError("FlacError")<{
	message: string;
	cause?: unknown;
}> {}
