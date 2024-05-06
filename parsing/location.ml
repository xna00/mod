type position = Lexing.position = {
  pos_fname : string;
  pos_lnum : int;
  pos_bol : int;
  pos_cnum : int;
}
[@@deriving show { with_path = false }]

type t = { loc_start : position; loc_end : position }
[@@deriving show { with_path = false }]

type 'a loc = { txt : 'a; loc : t } [@@deriving show { with_path = false }]

let dummy_loc = { loc_start = Lexing.dummy_pos; loc_end = Lexing.dummy_pos }
