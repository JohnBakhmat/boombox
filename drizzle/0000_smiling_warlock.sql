CREATE TABLE `album` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artist` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artist_to_album` (
	`artistId` text NOT NULL,
	`albumId` text NOT NULL,
	FOREIGN KEY (`artistId`) REFERENCES `artist`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `album`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artist_to_album_artistId_albumId_unique` ON `artist_to_album` (`artistId`,`albumId`);--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `song` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`fileId` text,
	FOREIGN KEY (`fileId`) REFERENCES `file`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `song_to_album` (
	`songId` text NOT NULL,
	`albumId` text NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `song`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`albumId`) REFERENCES `album`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `song_to_album_songId_albumId_unique` ON `song_to_album` (`songId`,`albumId`);--> statement-breakpoint
CREATE TABLE `song_to_artist` (
	`songId` text NOT NULL,
	`artistId` text NOT NULL,
	FOREIGN KEY (`songId`) REFERENCES `song`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`artistId`) REFERENCES `artist`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `song_to_artist_songId_artistId_unique` ON `song_to_artist` (`songId`,`artistId`);