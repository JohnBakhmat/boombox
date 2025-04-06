open Util

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

let bytes_to_int32 bytes = Bytes.get_int32_le bytes 0 |> Int32.to_int
let read_int32 ic = read_bytes ic 4 |> Option.map bytes_to_int32
