DROP TABLE `song_to_album`;--> statement-breakpoint
ALTER TABLE `song` ADD `albumId` text NOT NULL REFERENCES album(id);