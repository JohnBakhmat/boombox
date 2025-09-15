PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_artist_to_album` (
	`artistId` text NOT NULL,
	`albumId` text NOT NULL,
	FOREIGN KEY (`artistId`) REFERENCES `artist`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`albumId`) REFERENCES `album`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_artist_to_album`("artistId", "albumId") SELECT "artistId", "albumId" FROM `artist_to_album`;--> statement-breakpoint
DROP TABLE `artist_to_album`;--> statement-breakpoint
ALTER TABLE `__new_artist_to_album` RENAME TO `artist_to_album`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `artist_to_album_artistId_albumId_unique` ON `artist_to_album` (`artistId`,`albumId`);--> statement-breakpoint
CREATE TABLE `__new_song` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`fileId` text NOT NULL,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_song`("id", "title", "fileId") SELECT "id", "title", "fileId" FROM `song`;--> statement-breakpoint
DROP TABLE `song`;--> statement-breakpoint
ALTER TABLE `__new_song` RENAME TO `song`;--> statement-breakpoint
CREATE UNIQUE INDEX `song_fileId_unique` ON `song` (`fileId`);--> statement-breakpoint
CREATE TABLE `__new_song_to_album` (
	`songId` text NOT NULL,
	`albumId` text NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `song`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`albumId`) REFERENCES `album`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_song_to_album`("songId", "albumId") SELECT "songId", "albumId" FROM `song_to_album`;--> statement-breakpoint
DROP TABLE `song_to_album`;--> statement-breakpoint
ALTER TABLE `__new_song_to_album` RENAME TO `song_to_album`;--> statement-breakpoint
CREATE UNIQUE INDEX `song_to_album_songId_albumId_unique` ON `song_to_album` (`songId`,`albumId`);--> statement-breakpoint
CREATE TABLE `__new_song_to_artist` (
	`songId` text NOT NULL,
	`artistId` text NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `song`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artistId`) REFERENCES `artist`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_song_to_artist`("songId", "artistId") SELECT "songId", "artistId" FROM `song_to_artist`;--> statement-breakpoint
DROP TABLE `song_to_artist`;--> statement-breakpoint
ALTER TABLE `__new_song_to_artist` RENAME TO `song_to_artist`;--> statement-breakpoint
CREATE UNIQUE INDEX `song_to_artist_songId_artistId_unique` ON `song_to_artist` (`songId`,`artistId`);