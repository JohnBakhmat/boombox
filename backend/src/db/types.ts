import type { albumTable, artistTable, songTable } from "./schema";

export type Album = typeof albumTable.$inferSelect;
export type Song = typeof songTable.$inferSelect;
export type Artist = typeof artistTable.$inferSelect;

export type AlbumWithArtist = Album & {
	artists: Artist[];
};
