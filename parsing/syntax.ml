type pos = int * int (* line, col *) [@@deriving show { with_path = false }]
type pstring = pos * char list [@@deriving show { with_path = false }]
type location = pos * pos [@@deriving show { with_path = false }]

type ty = TyBool | TyInt | TyArr of ty * ty | TyId of string | TyQId of string
[@@deriving show { with_path = false }]

type term = { desc : term_desc; loc : location }

and term_desc =
  | TmVar of string
  | TmAbs of string * ty option * term
  | TmApp of term * term
  | TmInt
  | TmBool
  | TmLet of bool * string * term * term
[@@deriving show { with_path = false }]
