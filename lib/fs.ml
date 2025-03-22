let read_file_as_bytes file_path =
  let ic = In_channel.open_bin file_path in
  let is_flac = Flac.is_flac ic in
  assert is_flac;
  let _ = Flac.read_metadata_header ic in
  ()
