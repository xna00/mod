open Syntax
open Asttypes
open Token

type diagnostic = {
  start_pos : Location.position;
  end_pos : Location.position;
  msg : string;
}
[@@deriving show { with_path = false }]

type t = {
  mutable scanner : Lexer.t;
  mutable token : Token.t;
  mutable start_pos : Lexing.position;
  mutable end_pos : Lexing.position;
  mutable prev_end_pos : Lexing.position;
  mutable diagnostics : diagnostic list;
}

exception Parse_error

let err ~start_pos ~end_pos parser msg =
  parser.diagnostics <- { start_pos; end_pos; msg } :: parser.diagnostics

let report p = err ~start_pos:p.start_pos ~end_pos:p.end_pos p "Parse fail"

let make filename src =
  let scanner = Lexer.make filename src in
  let parser =
    {
      scanner;
      token = EOF;
      start_pos = Lexing.dummy_pos;
      end_pos = Lexing.dummy_pos;
      prev_end_pos = Lexing.dummy_pos;
      diagnostics = [];
    }
  in
  scanner.err <- err parser;
  parser

let make_loc p = Location.{ loc_start = p.start_pos; loc_end = p.end_pos }

let advance parser =
  let start_pos, end_pos, token = Lexer.scan parser.scanner in
  parser.prev_end_pos <- parser.end_pos;
  parser.token <- token;
  parser.start_pos <- start_pos;
  parser.end_pos <- end_pos

let expect token p =
  if p.token = token then advance p
  else (
    err ~start_pos:p.start_pos ~end_pos:p.end_pos p
      ("Expect a " ^ Token.show token);
    raise Parse_error)

let optional token p =
  if p.token = token then (
    advance p;
    true)
  else false

let lookahead p callback =
  let ch = p.scanner.ch in
  let err = p.scanner.err in
  let offset = p.scanner.offset in
  let lnum = p.scanner.lnum in
  let col = p.scanner.col in
  let comments = p.scanner.comments in
  let token = p.token in
  let start_pos = p.start_pos in
  let end_pos = p.end_pos in
  let prev_end_pos = p.prev_end_pos in
  let diagnostics = p.diagnostics in

  let res = callback p in

  p.scanner.ch <- ch;
  p.scanner.err <- err;
  p.scanner.offset <- offset;
  p.scanner.lnum <- lnum;
  p.scanner.col <- col;
  p.scanner.comments <- comments;
  p.token <- token;
  p.start_pos <- start_pos;
  p.end_pos <- end_pos;
  p.prev_end_pos <- prev_end_pos;
  p.diagnostics <- diagnostics;
  res

let rec sepby1 p1 sep p =
  let first = p1 p in
  if sep p.token then (
    advance p;
    first :: sepby1 p1 sep p)
  else [ first ]

let rec sepby p1 pred sep p =
  if pred p.token then
    let first = p1 p in
    if sep p.token then (
      advance p;
      first :: sepby p1 pred sep p)
    else [ first ]
  else []

let rec many1 p1 pred p =
  let first = p1 p in
  if pred p.token then first :: many1 p1 pred p else [ first ]

let rec many p1 pred p =
  if pred p.token then
    let first = p1 p in
    first :: many p1 pred p
  else []

let lident parser =
  let loc_start = parser.start_pos in

  let s =
    match parser.token with
    | LIDENT s ->
        advance parser;
        s
    | LPARENT ->
        advance parser;
        if is_infix parser.token then (
          let s = string_of_infix parser.token in
          advance parser;
          expect RPARENT parser;
          s)
        else (
          err ~start_pos:loc_start ~end_pos:parser.end_pos parser "";
          raise Parse_error)
    | _ ->
        err ~start_pos:loc_start ~end_pos:parser.end_pos parser "";
        raise Parse_error
  in
  let loc_end = parser.prev_end_pos in
  { txt = s; loc = { loc_start; loc_end } }

let uident parser =
  let loc_start = parser.start_pos in
  let loc_end = parser.end_pos in
  match parser.token with
  | UIDENT s ->
      advance parser;
      { txt = s; loc = { loc_start; loc_end } }
  | _ ->
      err ~start_pos:loc_start ~end_pos:loc_end parser "";
      raise Parse_error

let longident_end_lident p =
  let loc_start = p.start_pos in
  let uids =
    match p.token with
    | UIDENT _ ->
        let uids =
          sepby1 uident
            (function
              | DOT ->
                  lookahead p (fun p ->
                      advance p;
                      match p.token with UIDENT _ -> true | _ -> false)
              | _ -> false)
            p
        in
        expect DOT p;
        uids
    | _ -> []
  in
  let lid = lident p in
  let loc_end = p.prev_end_pos in
  {
    txt = Longident.make (List.map (fun x -> x.txt) uids @ [ lid.txt ]);
    loc = { loc_start; loc_end };
  }

let longident p =
  let loc_start = p.start_pos in
  print_token p.token;
  let uids =
    match p.token with
    | UIDENT _ ->
        let uids =
          sepby1 uident
            (function
              | DOT ->
                  lookahead p (fun p ->
                      advance p;
                      match p.token with UIDENT _ -> true | _ -> false)
              | _ -> false)
            p
        in
        uids
    | _ -> []
  in
  print_token p.token;
  let lid =
    match p.token with
    | DOT ->
        advance p;
        [ (lident p).txt ]
    | LIDENT _ when List.length uids = 0 -> [ (lident p).txt ]
    | _ -> [ "make" ]
  in
  let loc_end = p.prev_end_pos in
  {
    txt = Longident.make (List.map (fun x -> x.txt) uids @ lid);
    loc = { loc_start; loc_end };
  }

let arg_label_fun p =
  match p.token with
  | TILDE ->
      advance p;
      fun id -> Labelled id
  | QUESTION ->
      advance p;
      fun id -> Optional id
  | _ -> fun _ -> Nolabel

let longident_end_uident p =
  let loc_start = p.start_pos in
  let uids =
    sepby1 uident
      (function
        | DOT ->
            lookahead p (fun p ->
                advance p;
                match p.token with UIDENT _ -> true | _ -> false)
        | _ -> false)
      p
  in
  let loc_end = p.prev_end_pos in
  {
    txt = Longident.make (List.map (fun x -> x.txt) uids);
    loc = { loc_start; loc_end };
  }
