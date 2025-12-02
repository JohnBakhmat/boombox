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

			const dataView = new DataView(uint8Array.buffer, uint8Array.byteOffset + offset, 4);

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

const FIELD_MAPPING = {
	ALBUM: "album",
	ARTIST: "artist",
	"ALBUM ARTIST": "albumArtist",
	TITLE: "title",
	TRACKNUMBER: "trackNumber",
	MUSICBRAINZ_RELEASEGROUPID: "musicBrainzReleaseGroupId",
	MUSICBRAINZ_ARTISTID: "musicBrainzArtistId",
	MUSICBRAINZ_TRACKID: "musicBrainzTrackId",
} as const;

const MAX_VORBIS_FIELDS = 10000; // Reasonable limit for metadata fields
const MAX_FIELD_LENGTH = 1024 * 1024; // 1MB max per field

export const MetadataFromUint8Array = Schema.transformOrFail(MetadataInput, MetadataSchema, {
	strict: true,
	decode({ uint8Array, offset, length }, _, ast) {
		return Effect.gen(function* () {
			const dv = new DataView(uint8Array.buffer, uint8Array.byteOffset + offset, length);
			const decoder = new TextDecoder("utf-8");

			let cursor = 0;

			// Bounds check: ensure we can read vendor string length
			if (cursor + 4 > length) {
				return yield* ParseResult.fail(
					new ParseResult.Type(ast, uint8Array, "Buffer too short to read vendor string length"),
				);
			}

			const vendorStringLength = dv.getUint32(cursor, true);
			cursor += 4;

			// Validate vendor string length
			if (vendorStringLength > MAX_FIELD_LENGTH || cursor + vendorStringLength > length) {
				return yield* ParseResult.fail(
					new ParseResult.Type(ast, uint8Array, `Invalid vendor string length: ${vendorStringLength}`),
				);
			}

			cursor += vendorStringLength;

			// Bounds check: ensure we can read number of fields
			if (cursor + 4 > length) {
				return yield* ParseResult.fail(
					new ParseResult.Type(ast, uint8Array, "Buffer too short to read number of fields"),
				);
			}

			const numberOfFields = dv.getUint32(cursor, true);
			cursor += 4;

			// Validate number of fields to prevent DoS
			if (numberOfFields > MAX_VORBIS_FIELDS) {
				return yield* ParseResult.fail(
					new ParseResult.Type(
						ast,
						uint8Array,
						`Too many fields: ${numberOfFields} (max ${MAX_VORBIS_FIELDS})`,
					),
				);
			}

			const metadata: Partial<Metadata & { artists: string[] }> = {
				artists: [],
			};

			for (let i = 0; i < numberOfFields; i++) {
				// Bounds check: ensure we can read field length
				if (cursor + 4 > length) {
					return yield* ParseResult.fail(
						new ParseResult.Type(
							ast,
							uint8Array,
							`Buffer too short to read field ${i} length at cursor ${cursor}`,
						),
					);
				}

				const fieldLength = dv.getUint32(cursor, true);
				cursor += 4;

				// Validate field length
				if (fieldLength > MAX_FIELD_LENGTH) {
					return yield* ParseResult.fail(
						new ParseResult.Type(ast, uint8Array, `Field ${i} length too large: ${fieldLength}`),
					);
				}

				// Bounds check: ensure we can read field value
				if (cursor + fieldLength > length) {
					return yield* ParseResult.fail(
						new ParseResult.Type(
							ast,
							uint8Array,
							`Buffer too short to read field ${i} value (need ${fieldLength} bytes at cursor ${cursor})`,
						),
					);
				}

				const fieldBytes = uint8Array.slice(offset + cursor, offset + cursor + fieldLength);
				const fieldValue = decoder.decode(fieldBytes);
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
						metadata.artists!.push(value);
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
					case "MUSICBRAINZ_RELEASEGROUPID":
						metadata.musicBrainzReleaseGroupId = value;
						break;
					case "MUSICBRAINZ_ARTISTID":
						metadata.musicBrainzArtistId = value;
						break;
					case "MUSICBRAINZ_TRACKID":
						metadata.musicBrainzTrackId = value;
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
	const equalIndex = str.indexOf("=");
	if (equalIndex === -1) {
		return null;
	}
	const key = str.slice(0, equalIndex).trim().toUpperCase();
	const value = str.slice(equalIndex + 1).trim();
	if (!key || !value) {
		return null;
	}
	return { key, value };
}
