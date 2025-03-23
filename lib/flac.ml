let ( let* ) x f = Option.bind x f

let read_bytes ic length =
  let buf = Bytes.create length in
  let* _ = In_channel.really_input ic buf 0 length in
  Some buf
;;

let skip ic (offset : int64) =
  let current_pos = In_channel.pos ic in
  let new_pos = Int64.add current_pos offset in
  In_channel.seek ic new_pos;
  ()
;;

let is_flac ic =
  let bytes = read_bytes ic 4 in
  match bytes with
  | Some x -> Bytes.to_string x = "fLaC"
  | None -> false
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

let read_vendor_length ic =
  let* bytes = read_bytes ic 4 in
  let vendor_length = Bytes.get_int32_le bytes 0 |> Int32.to_int in
  Some vendor_length
;;

let read_vendor_string ic length =
  let* bytes = read_bytes ic length in
  Some (Bytes.to_string bytes)
;;

let read_field_count ic =
  let* bytes = read_bytes ic 4 in
  Some (Bytes.get_int32_le bytes 0 |> Int32.to_int)
;;

let read_field_length ic =
  let* bytes = read_bytes ic 4 in
  Some (Bytes.get_int32_le bytes 0 |> Int32.to_int)
;;

let read_field ic length =
  let* bytes = read_bytes ic length in
  Some (Bytes.to_string bytes)
;;

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
            | "ALBUM ARTIST" -> { acc with album_artist = value }
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
