# Boombox is a small music metadata parsing and indexing software i need.
I dont like how Jellyfin works, so I'm implementing custom media server in OCaml.
Mainly focusing on:
 - Parsing metadata from a file.
 - Filetypes: FLAC >> M4A >> WAV >> MP3  (currently only flac works).
 - Sqlite for `small bundle size` or whatever that buzz words are 
