import { relations } from "drizzle-orm";
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

const id = () =>
	text()
		.primaryKey()
		.$defaultFn(() => Bun.randomUUIDv7());

export const fileTable = sqliteTable("file", {
	id: id(),
	path: text().notNull().unique(),
});
export const songTable = sqliteTable("song", {
	id: id(),
	title: text().notNull(),
	fileId: text()
		.notNull()
		.references(() => fileTable.id, { onDelete: "cascade" })
		.unique(),
	albumId: text()
		.notNull()
		.references(() => albumTable.id, { onDelete: "cascade" }),
});

export const fileToSongRelation = relations(songTable, ({ one }) => ({
	file: one(fileTable),
}));

export const artistTable = sqliteTable(
	"artist",
	{
		id: id(),
		name: text().notNull(),
	},
	(t) => [unique().on(t.name)],
);

export const albumTable = sqliteTable(
	"album",
	{
		id: id(),
		title: text().notNull(),
	},
	(t) => [unique().on(t.title)],
);

export const albumToSongRelation = relations(albumTable, ({ one, many }) => ({
	songs: many(songTable),
}));

export const songToArtistTable = sqliteTable(
	"song_to_artist",
	{
		songId: text()
			.notNull()
			.references(() => songTable.id, { onDelete: "cascade" }),
		artistId: text()
			.notNull()
			.references(() => artistTable.id, { onDelete: "cascade" }),
	},
	(t) => [unique().on(t.songId, t.artistId)],
);

export const artistToAlbumTable = sqliteTable(
	"artist_to_album",
	{
		artistId: text()
			.notNull()
			.references(() => artistTable.id, { onDelete: "cascade" }),
		albumId: text()
			.notNull()
			.references(() => albumTable.id, { onDelete: "cascade" }),
	},
	(t) => [unique().on(t.artistId, t.albumId)],
);
