let d_ref : Parsing.Parser_base.diagnostic list ref = ref []
let reset_d_ref () = d_ref := []
let add_d_ref d = d_ref := d :: !d_ref

exception Typechecking_error of string

let error s = raise (Typechecking_error s)

let report_term s (t : Typed.term) =
  add_d_ref { msg = s; start_pos = t.loc.loc_start; end_pos = t.loc.loc_end }
