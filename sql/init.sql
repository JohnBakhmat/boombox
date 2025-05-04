-- Dialect: SQLite.
--
create table file (
    id          text not null primary key,
    path        text not null,
    song_id     text not null references song(id),
    foreign key (song_id) references song(id) on delete set null
);
create table artits(
    id          text not null primary key,
    name        text not null
);

create table album (
    id          text not null primary key,
    title       text not null,
);

create table artist_album (
    id          text not null primary key,
    artist_id   text not null references artists(id) on delete cascade,
    album_id    text not null references album(id) on delete cascade,

    unique(album_id, artist_id))
);

create table song (
    id          text not null primary key,
    title       text not null,
    album_id    text not null references album(id) on delete cascade
);

create table artist_song (
    id          text not null primary key,
    artist_id   text not null references artists(id) on delete cascade,
    song_id     text not null references song(id) on delete cascade,

    unique(artist_id, song_id))
);
