open Boombox

let ( let* ) x f = Option.bind x f

let main () =
  let ic =
    In_channel.open_bin
      "/home/johnb/Downloads/03. new one - San Holo, Bipolar Sunshine - bb u ok 2021.flac"
  in
  let* metadata = Flac.read_file ic in
  Metadata.pp_metadata metadata;
  Some ()
;;

let () =
  match main () with
  | Some _ -> ()
  | None -> ()
;;
