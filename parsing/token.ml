type t =
  | NUMBER of int
  | STRING
  | UIDENT of string
  | LIDENT of string
  | INFIX1 of string
  | INFIX2 of string
  | INFIX3 of string
  | LPARENT
  | RPARENT
  | ARROW
  | EQUAL
  | DOT
  | QUOTE
  | COMMA
  | STAR
  | COLON
  | TILDE
  | QUESTION
  | LET
  | REC
  | IN
  | FUN
  | IF
  | THEN
  | ELSE
  | STRUCT
  | END
  | FUNCTOR
  | VAL
  | TYPE
  | MODULE
  | SIG
  | MATCH
  | WITH
  | OF
  | EOF
[@@deriving show { with_path = false }]

let precedence token =
  match token with
  | INFIX3 _ | STAR -> 3 (* * / *)
  | INFIX2 _ -> 2 (* + - *)
  | INFIX1 _ | EQUAL -> 1 (* > < = *)
  | _ -> assert false

let is_infix token =
  match token with
  | INFIX1 _ | INFIX2 _ | INFIX3 _ | STAR | EQUAL -> true
  | _ -> false

let string_of_infix token =
  match token with
  | INFIX1 s | INFIX2 s | INFIX3 s -> s
  | STAR -> "*"
  | EQUAL -> "="
  | _ -> assert false

let keywords =
  [
    ("let", LET);
    ("in", IN);
    ("fun", FUN);
    ("if", IF);
    ("then", THEN);
    ("else", ELSE);
    ("struct", STRUCT);
    ("end", END);
    ("functor", FUNCTOR);
    ("val", VAL);
    ("type", TYPE);
    ("module", MODULE);
    ("sig", SIG);
    ("match", MATCH);
    ("with", WITH);
    ("of", OF);
  ]

let print_token t = print_endline (show t)
