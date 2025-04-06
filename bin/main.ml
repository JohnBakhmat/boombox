open Boombox

let get_path () =
  let argv1 = Sys.argv.(1) in
  let cwd = Sys.getcwd () in
  let absolute_path = Core.Filename.to_absolute_exn argv1 ~relative_to:cwd in
  absolute_path
;;

let is_dir path = Sys.is_directory path

let read_dir path =
  let files =
    Sys.readdir path
    |> Array.to_list
    |> List.filter (fun file -> String.ends_with ~suffix:".flac" file)
    |> List.map (fun file -> path ^ "/" ^ file)
  in
  let parsed_files = files |> List.map In_channel.open_bin |> List.map Flac.read_file in
  parsed_files |> List.filter_map Fun.id |> List.iter (fun x -> Metadata.pp_metadata x);
  ()
;;

let main () =
  let path = get_path () in
  (match is_dir path with
   | true -> read_dir path
   | false -> ());
  Some ()
;;

let () = main () |> Option.value ~default:()
