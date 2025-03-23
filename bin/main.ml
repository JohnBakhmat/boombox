open Boombox

let ( let* ) x f = Option.bind x f

let get_filepath () =
  let argv1 = Sys.argv.(1) in
  let cwd = Sys.getcwd () in
  let absolute_path = Core.Filename.to_absolute_exn argv1 ~relative_to:cwd in
  absolute_path
;;

let main () =
  let filepath = get_filepath () in
  let ic = In_channel.open_bin filepath in
  let* metadata = Flac.read_file ic in
  Metadata.pp_metadata metadata;
  Some ()
;;

let () =
  match main () with
  | Some _ -> ()
  | None -> ()
;;
