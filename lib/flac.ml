open Util
open Fs

let is_flac ic =
  read_bytes ic 4
  |> Option.map Bytes.to_string
  |> Option.map (fun s -> s = "fLaC")
  |> Option.value ~default:false
;;

let last_block_mask = 0b10000000
let streaminfo_block_mask = 0b01111111
let vorbis_comment_block = 0b0000100

let read_length ic =
  let buf = Bytes.create 3 in
  let* _ = In_channel.really_input ic buf 0 3 in
  let padded = Bytes.extend buf 1 0 in
  let len = Bytes.get_int32_be padded 0 in
  Some (Int32.to_int len)
;;

let read_metadata_header ic =
  let* block_info = In_channel.input_byte ic in
  let is_last = block_info land last_block_mask = 0b10000000 in
  let stream_info = block_info land streaminfo_block_mask in
  let* length = read_length ic in
  Some (is_last, stream_info, length)
;;

let read_vendor_length ic = read_int32 ic
let read_vendor_string ic length = read_bytes ic length |> Option.map Bytes.to_string
let read_field_count ic = read_int32 ic
let read_field_length ic = read_int32 ic
let read_field ic length = read_bytes ic length |> Option.map Bytes.to_string

let split_field field =
  match String.split_on_char '=' field with
  | [ name; value ] -> Some (name, value)
  | _ -> None
;;

let read_vorbis_comment ic =
  let* vendor_length = read_vendor_length ic in
  let* _vendor_string = read_vendor_string ic vendor_length in
  let* field_count = read_field_count ic in
  let empty_metadata = Metadata.create () in
  let open Metadata in
  let metadata =
    List.init field_count (fun _ ->
      let* field_length = read_field_length ic in
      let* field = read_field ic field_length in
      Printf.printf "%s\n" field;
      Some field)
    |> List.filter_map Fun.id
    |> List.map split_field
    |> List.filter_map Fun.id
    |> List.fold_left
         (fun acc (name, value) ->
            match name with
            | "TITLE" -> { acc with title = value }
            | "ALBUMARTIST" -> { acc with album_artist = value }
            | "ALBUM" -> { acc with album = value }
            | "ARTISTS" -> { acc with artists = acc.artists @ [ value ] }
            | _ -> acc)
         empty_metadata
  in
  Some metadata
;;

let read_file ic =
  assert (is_flac ic);
  let rec loop () =
    let* is_last, block_info, length = read_metadata_header ic in
    match block_info with
    | x when x = vorbis_comment_block ->
      let* metadata = read_vorbis_comment ic in
      Some metadata
    | _ ->
      if is_last
      then None
      else (
        skip ic (Int64.of_int length);
        loop ())
  in
  loop ()
;;
