import { Effect, Option, Schema } from "effect";

export const Nibble = Schema.Number.pipe(
	Schema.between(0, 15, {
		identifier: "Nibble",
		description: "a 4-bit unsigned integer",
	}),
);

export const Uint7 = Schema.Number.pipe(
	Schema.between(0, 127, {
		identifier: "Uint7",
		description: "a 7-bit unsigned integer",
	}),
);

const INT24_MAX = 16_777_215;
export const Int24 = Schema.Number.pipe(
	Schema.between(0, INT24_MAX, {
		identifier: "Int24",
		description: "a 24-bit (3 byte) signed integer",
	}),
);

export const Uint3 = Schema.Number.pipe(
	Schema.between(0, 7, {
		identifier: "Uint3",
		description: "a 3-bit unsigned integer",
	}),
);

export type Bit = typeof Bit.Type;

export const Bit = Schema.Literal(0, 1).annotations({
	identifier: "Bit",
	description: "a 1-bit unsigned integer",
});

export const Uint8 = Schema.Number.pipe(
	Schema.between(0, 255, {
		identifier: "Byte",
		description: "a 8-bit unsigned integer",
	}),
);

const INT16_MAX = 65_535;
export const Uint16 = Schema.Number.pipe(
	Schema.between(0, INT16_MAX, {
		identifier: "Uint16",
		description: "a 16-bit unsigned integer",
	}),
);

const INT32_MAX = 2_147_483_648;
export const Int32 = Schema.Number.pipe(
	Schema.between(-INT32_MAX, INT32_MAX, {
		identifier: "Int32",
		description: "a 32-bit signed integer",
	}),
);

export function safeParseInt(str: string, radix: number = 10): Effect.Effect<Option.Option<number>> {
	return Effect.gen(function* () {
		return yield* Effect.try(() => Number.parseInt(str, radix)).pipe(Effect.option);
	});
}
