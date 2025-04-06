type metadata =
  { title : string
  ; album_artist : string
  ; album : string
  ; artists : string list
  }
[@@deriving show]

type t = metadata

let pp_metadata x = Printf.printf "%s\n" (show_metadata x)
let create () = { title = ""; album = ""; album_artist = ""; artists = [] }
