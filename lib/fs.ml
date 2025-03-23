let read_file_as_bytes file_path =
  let ic = In_channel.open_bin file_path in
  let _ = Flac.read_file ic in
  ()
;;
