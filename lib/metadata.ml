type t =
  { title : string
  ; album_artist : string
  ; album : string
  }

let pp_metadata x =
  Printf.printf
    "{\n\t title: %s\n\t album: %s\n\t album_artist: %s\n}"
    x.title
    x.album
    x.album_artist
;;

let create () = { title = ""; album = ""; album_artist = "" }
