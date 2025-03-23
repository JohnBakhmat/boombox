type t =
  { title : string
  ; album_artist : string
  ; album : string
  ; artists : string list
  }

val pp_metadata : t -> unit
val create : unit -> t
