import { Effect, Option, ParseResult, Schema } from "effect";

import { type Metadata, MetadataSchema } from "~/metadata";
import { Bit, Int24, safeParseInt, Uint7 } from "~/utils/utils";

const FlacHeader = Schema.Struct({
	isLast: Bit, // 1 bit
	streamInfo: Uint7, // 7 bits
	length: Int24, // 3 bytes
});

const FlacHeaderInput = Schema.Struct({
	uint8Array: Schema.Uint8ArrayFromSelf,
	offset: Schema.Number,
});

export const FlacHeaderFromUint8Array = Schema.transformOrFail(FlacHeaderInput, FlacHeader, {
	strict: true,
	decode({ uint8Array, offset }, _, ast) {
		return Effect.gen(function* () {
			if (uint8Array.length < 4) {
				return yield* ParseResult.fail(new ParseResult.Type(ast, uint8Array, "UIntArray is too short"));
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
	encode(x, _, ast) {
		return ParseResult.fail(new ParseResult.Type(ast, x, "Unimplemented"));
	},
});

const MetadataInput = Schema.Struct({
	uint8Array: Schema.Uint8ArrayFromSelf,
	offset: Schema.Number,
	length: Schema.Number,
});

export const MetadataFromUint8Array = Schema.transformOrFail(MetadataInput, MetadataSchema, {
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

			const metadata: Partial<Metadata & { artists: string[] }> = {};

			for (let i = 0; i < numberOfFields; i++) {
				const fieldLength = dv.getUint32(cursor, true);
				cursor += 4;

				const fieldValue = uint8Array.slice(cursor, cursor + fieldLength).toString();
				cursor += fieldLength;

				const parsedField = parseFieldValue(fieldValue);

				if (!parsedField) {
					continue;
				}

				const { key, value } = parsedField;

				switch (key.toUpperCase()) {
					case "ALBUM":
						metadata.album = value;
						break;
					case "ARTIST":
						if (!metadata.artists) {
							metadata.artists = [];
						}
						metadata.artists.push(value);
						break;
					case "ALBUM ARTIST":
						metadata.albumArtist = value;
						break;
					case "TITLE":
						metadata.title = value;
						break;
					case "TRACKNUMBER":
						const parsedNumber = yield* safeParseInt(value, 10);
						if (Option.isSome(parsedNumber)) {
							metadata.trackNumber = parsedNumber.value;
						}
						break;
					default:
						continue;
				}
			}

			metadata.albumArtist ??= metadata.artists?.at(0);

			const valid = Schema.decodeUnknownOption(MetadataSchema)(metadata);

			return yield* Option.match(valid, {
				onSome: (value) => ParseResult.succeed(value),
				onNone: () => ParseResult.fail(new ParseResult.Type(ast, metadata, "Metadata is not valid")),
			});
		});
	},
	encode(x, _, ast) {
		return ParseResult.fail(new ParseResult.Type(ast, x, "Unimplemented"));
	},
});

function parseFieldValue(str: string): { key: string; value: string } | null {
	const [key, value] = str.split("=").map((x) => x.trim());
	if (!key || !value) {
		return null;
	}
	return { key: key.toUpperCase(), value };
}

