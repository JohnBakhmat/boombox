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

export const fileRelations = relations(fileTable, ({ one }) => ({
	song: one(songTable, {
		fields: [fileTable.id],
		references: [songTable.fileId],
	}),
}));

export const songRelations = relations(songTable, ({ one, many }) => ({
	file: one(fileTable, {
		fields: [songTable.fileId],
		references: [fileTable.id],
	}),
	album: one(albumTable, {
		fields: [songTable.albumId],
		references: [albumTable.id],
	}),
	artists: many(songToArtistTable),
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

export const artistRelations = relations(artistTable, ({ many }) => ({
	songs: many(songToArtistTable),
	albums: many(artistToAlbumTable),
}));

export const albumRelations = relations(albumTable, ({ many }) => ({
	songs: many(songTable),
	artists: many(artistToAlbumTable),
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

export const songToArtistRelations = relations(songToArtistTable, ({ one }) => ({
	song: one(songTable, {
		fields: [songToArtistTable.songId],
		references: [songTable.id],
	}),
	artist: one(artistTable, {
		fields: [songToArtistTable.artistId],
		references: [artistTable.id],
	}),
}));

export const artistToAlbumRelations = relations(artistToAlbumTable, ({ one }) => ({
	artist: one(artistTable, {
		fields: [artistToAlbumTable.artistId],
		references: [artistTable.id],
	}),
	album: one(albumTable, {
		fields: [artistToAlbumTable.albumId],
		references: [albumTable.id],
	}),
}));
