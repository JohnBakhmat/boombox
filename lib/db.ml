(* open Fun_sqlite  *)
open Sqlite3

let db = db_open "./db.sqlite"

let init_db () =
  let schema =
    "create table if not exists file ("
    ^ " id  text not null primary key,"
    ^ " path        text not null,"
    ^ " song_id     text not null references song(id),"
    ^ "foreign key (song_id) references song(id) on delete set null );"
    ^ "\n"
    ^ "create table if not exists artists("
    ^ "id          text not null primary key,"
    ^ "name        text not null"
    ^ ");"
    ^ "\n"
    ^ "create table if not exists album ("
    ^ "id          text not null primary key,"
    ^ "title       text not null"
    ^ ");"
    ^ "\n"
    ^ "create table if not exists artist_album ("
    ^ "id          text not null primary key,"
    ^ "artist_id   text not null references artists(id) on delete cascade,"
    ^ "album_id    text not null references album(id) on delete cascade,"
    ^ "unique(album_id, artist_id)"
    ^ ");"
    ^ "\n"
    ^ "create table if not exists song ("
    ^ "id          text not null primary key,"
    ^ "title       text not null,"
    ^ "album_id    text not null references album(id) on delete cascade"
    ^ ");"
    ^ "\n"
    ^ "create table if not exists artist_song ("
    ^ "id          text not null primary key,"
    ^ "artist_id   text not null references artists(id) on delete cascade,"
    ^ "song_id     text not null references song(id) on delete cascade,"
    ^ "unique(artist_id, song_id)"
    ^ ");"
  in
  let rc = exec db schema in
  Printf.printf "Created schema: %s" (Rc.to_string rc);
  ()
;;
