let ( let* ) x f = Option.bind x f

let is_flac ic =
  let buf = Bytes.create 4 in
  let success = In_channel.really_input ic buf 0 4 in
  match success with
  | Some _ -> Bytes.to_string buf = "fLaC"
  | None -> false
;;

let last_block_mask = 0b10000000
let streaminfo_block_mask = 0b01111111

let read_length ic =
  let buf = Bytes.create 3 in
  let* _ = In_channel.really_input ic buf 0 3 in
  let padded = Bytes.extend buf 1 0 in
  let len = Bytes.get_int32_be padded 0 in 
  Some (Int32.to_int len)
;;

let read_metadata_header ic =
  let* block_info = In_channel.input_byte ic in

  let _is_last = block_info land last_block_mask = 0b10000000 in
  let _stream_info = block_info land streaminfo_block_mask in

  let* len = read_length ic in

  Printf.printf "Blockinfo: %0#11d\n" block_info;
  Printf.printf "Length: %x %d \n" len len;
  Printf.printf "Position: %s" (In_channel.pos ic |> Int64.to_string);
  Some ()
;;
