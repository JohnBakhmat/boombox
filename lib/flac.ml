let is_flac ic = 
        let buf = Bytes.create 4 in 
        let success = In_channel.really_input ic buf 0 4 in

        match success with
        | Some _ -> 
                        let str = Bytes.to_string buf in 
                        Printf.printf "%s" str;
                        str = "fLaC"
        | None -> false
;;
