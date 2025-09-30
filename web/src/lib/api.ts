import { treaty } from "@elysiajs/eden";
import type { ApiType } from "../../../backend/src/api";

export const client = treaty<ApiType>("localhost:3003");
