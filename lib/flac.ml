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

let read_vorbis_comment (ic:in_channel) (length:int) = 
        let buf = Bytes.create length in
        let* _ = In_channel.really_input ic buf 0 length in
        let str = Bytes.to_string buf in
        Printf.printf "vorbis: [%s]" str;

        Some ()
;;

let skip ic (offset:int64) =
        let current_pos = In_channel.pos ic in 
        let new_pos = Int64.add current_pos offset in 
        In_channel.seek ic new_pos;
        ()
;;
let read_file ic = 
        assert (is_flac ic);

        let rec loop () = 
                let header = read_metadata_header ic in
                match header with
                | Some (is_last, block_info, length) ->
                                (match block_info with
                                | x when x = vorbis_comment_block -> 
                                                Printf.printf "%s\n" (Int64.to_string (In_channel.pos ic));
                                                skip ic (Int64.of_int 4);
                                                skip ic (Int64.of_int 32);
                                                let _foo = read_vorbis_comment ic 72 in 

                                                ()
                                | _ -> if is_last 
                                then () 
                                else 
                                        skip ic (Int64.of_int length);
                                        loop()
                                );
                | None -> ()
        in

        loop();
        Some ()
;;


