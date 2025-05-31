import { relations } from "drizzle-orm"
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core"


const id = () => text().primaryKey().$defaultFn(() => Bun.randomUUIDv7())

export const fileTable = sqliteTable("file", {
	id: id(),
	path: text().notNull()
})
export const songTable = sqliteTable("song", {
	id: id(),
	title: text().notNull(),
	fileId: text().references(() => fileTable.id)
})

export const fileToSongRelation = relations(songTable, ({ one }) => ({
	file: one(fileTable)
}))

export const artistTable = sqliteTable("artist", {
	id: id(),
	name: text().notNull()
})

export const albumTable = sqliteTable("album", {
	id: id(),
	title: text().notNull()
})

export const songToAlbumTable = sqliteTable("song_to_album", {
	songId: text().notNull().references(() => songTable.id),
	albumId: text().notNull().references(() => albumTable.id)
}, (t) => ([
	unique().on(t.songId, t.albumId)
]))

export const songToArtistTable = sqliteTable("song_to_artist", {
	songId: text().notNull().references(() => songTable.id),
	artistId: text().notNull().references(() => artistTable.id)
}, (t) => ([
	unique().on(t.songId, t.artistId)
]))

export const artistToAlbumTable = sqliteTable("artist_to_album", {
	artistId: text().notNull().references(() => artistTable.id),
	albumId: text().notNull().references(() => albumTable.id)
}, (t) => ([
	unique().on(t.artistId, t.albumId)
]))
