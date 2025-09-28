import presetWind3 from "@unocss/preset-wind3";

import { defineConfig, presetAttributify, presetIcons, presetWebFonts, transformerVariantGroup } from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

export default defineConfig({
	presets: [
		presetWind3(),
		presetAttributify(),
		presetIcons(),
		presetWebFonts({
			fonts: {
				//sans: "Geist",
			},
		}),
		presetAnimations(),
		presetShadcn({
			color: "orange",
			// With default setting for SolidUI, you need to set the darkSelector option.
			darkSelector: '[data-kb-theme="dark"]',
		}),
	],
	transformers: [transformerVariantGroup()],
	theme: {
		colors: {
			brand: {
				orange: {
					DEFAULT: "oklch(0.7154 0.1862 42.53)",
					light: "oklch(0.7154 0.1862 42.53 / 8%)",
				},
			},
		},
	},
});
