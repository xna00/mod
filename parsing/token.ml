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
  | INFIX3 _ -> 3
  | INFIX2 _ -> 2
  | INFIX1 _ -> 1
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
