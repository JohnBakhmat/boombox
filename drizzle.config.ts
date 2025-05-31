import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const env = z.object({
	DB_URL: z.string().min(1)
}).parse(process.env)

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	dbCredentials: {
		url: env.DB_URL
	},
});

