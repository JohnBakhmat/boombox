let ( let* ) x f = Option.bind x f

let is_flac ic =
  let buf = Bytes.create 4 in
  let success = In_channel.really_input ic buf 0 4 in
  match success with
  | Some _ ->
    let str = Bytes.to_string buf in
    str = "fLaC"
  | None -> false
;;

let last_block_mask = 0b10000000
let streaminfo_block_mask = 0b01111111

let read_length ic =
  let buf = Bytes.create 3 in
  let* _ = In_channel.really_input ic buf 0 3 in
  Some buf
;;

let read_metadata_header ic =
  let* block_info = In_channel.input_byte ic in
  let _is_last = block_info land last_block_mask = 0b10000000 in
  let _stream_info = block_info land streaminfo_block_mask in
  Printf.printf "%0#11d\n" block_info;
  let* len = read_length ic in
  Printf.printf "%a" output_bytes len;
  Some ()
;;
