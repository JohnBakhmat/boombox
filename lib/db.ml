open Fun_sqlite

let db = Sqlite3.db_open "./db.sqlite"
let init_db () = query db "create table test(id text not null)" ~args:[] unit
