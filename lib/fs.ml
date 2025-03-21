
let read_file_as_bytes file_path = 
        let ic = In_channel.open_bin file_path in

        let is_flac = Flac.is_flac ic in 
        Printf.printf "%b" is_flac;

        ();
