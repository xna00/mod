open Token

type t = {
  filename : string;
  src : string;
  mutable ch : char;
  mutable err :
    start_pos:Lexing.position -> end_pos:Lexing.position -> string -> unit;
  mutable offset : int;
  mutable lnum : int;
  mutable col : int;
  mutable comments : string list;
}

let position scanner : Lexing.position =
  Lexing.
    {
      pos_fname = scanner.filename;
      pos_lnum = scanner.lnum;
      pos_bol = scanner.offset - scanner.col;
      pos_cnum = scanner.offset;
    }

let make filename src =
  {
    filename;
    src;
    ch = (if String.length src > 0 then src.[0] else ' ');
    offset = 0;
    lnum = 1;
    col = 0;
    err = (fun ~start_pos:_ ~end_pos:_ _ -> ());
    comments = [];
  }

let clone scanner = { scanner with src = scanner.src }
let at_end scanner = scanner.offset >= String.length scanner.src
let peek scanner = scanner.src.[scanner.offset]
let peek1 scanner = scanner.src.[scanner.offset + 1]

let advance scanner =
  let offset = scanner.offset + 1 in
  let ch = scanner.ch in
  scanner.offset <- offset;
  if not (at_end scanner) then scanner.ch <- scanner.src.[offset];
  if ch = '\n' || ch = '\r' then (
    scanner.lnum <- scanner.lnum + 1;
    scanner.col <- 0)
  else scanner.col <- scanner.col + 1

let scan_number scanner =
  let start = scanner.offset in
  let rec loop () =
    if at_end scanner then ()
    else
      match scanner.ch with
      | '0' .. '9' ->
          advance scanner;
          loop ()
      | _ -> ()
  in
  loop ();
  let s = String.sub scanner.src start (scanner.offset - start) in
  NUMBER (int_of_string s)

let scan_string scanner =
  let start_pos = position scanner in
  advance scanner;
  let start = scanner.offset in

  let rec loop () =
    if at_end scanner then
      let end_pos = position scanner in
      scanner.err ~start_pos ~end_pos "Expect a \""
    else
      match scanner.ch with
      | '"' -> advance scanner
      | _ ->
          advance scanner;
          loop ()
  in
  loop ();
  let _ = String.sub scanner.src start (scanner.offset - start) in
  STRING

let scan_ident scanner =
  let start = scanner.offset in
  let rec loop () =
    if at_end scanner then ()
    else
      match scanner.ch with
      | 'a' .. 'z' | 'A' .. 'Z' | '0' .. '9' ->
          advance scanner;
          loop ()
      | _ -> ()
  in
  loop ();
  let s = String.sub scanner.src start (scanner.offset - start) in
  if List.mem_assoc s keywords then List.assoc s keywords
  else match s.[0] with 'a' .. 'z' -> LIDENT s | _ -> UIDENT s

let scan_infix_chars scanner =
  let start = scanner.offset in
  let rec loop () =
    if at_end scanner then ()
    else
      match scanner.ch with
      | '*' | '/' | '+' | '-' | '>' | '<' | '=' ->
          advance scanner;
          loop ()
      | _ -> ()
  in
  loop ();
  let s = String.sub scanner.src start (scanner.offset - start) in
  s

let rec skip_whitesapce scanner =
  if at_end scanner then ()
  else
    match scanner.ch with
    | '\n' | ' ' | '\r' | '\t' ->
        advance scanner;
        skip_whitesapce scanner
    | '(' ->
        if
          String.length scanner.src - scanner.offset >= 2 && peek1 scanner = '*'
        then (
          advance scanner;
          advance scanner;

          let start = scanner.offset in
          let _end = ref (String.length scanner.src) in
          let rec loop () =
            if at_end scanner then ()
            else if String.length scanner.src - scanner.offset = 1 then
              advance scanner
            else if scanner.ch = '*' && peek1 scanner = ')' then (
              _end := scanner.offset;
              advance scanner;
              advance scanner)
            else (
              advance scanner;
              loop ())
          in
          loop ();
          let s = String.sub scanner.src start (!_end - start) in
          scanner.comments <- scanner.comments @ [ s ];
          skip_whitesapce scanner)
    | _ -> ()

let rec scan scanner =
  skip_whitesapce scanner;
  let start_pos = position scanner in
  let token =
    if scanner.offset >= String.length scanner.src then EOF
    else
      match scanner.ch with
      | '0' .. '9' -> scan_number scanner
      | '"' -> scan_string scanner
      | 'a' .. 'z' | 'A' .. 'Z' -> scan_ident scanner
      | '*' | '/' -> (
          let s = scan_infix_chars scanner in
          match s with "*" -> STAR | _ -> INFIX3 s)
      | '-' | '+' -> (
          let s = scan_infix_chars scanner in
          match s with "->" -> ARROW | _ -> INFIX2 s)
      | '>' | '<' | '=' -> (
          let s = scan_infix_chars scanner in
          match s with
          | "=" -> EQUAL
          | "<" -> LESS
          | ">" -> GREATER
          | _ -> INFIX1 s)
      | '(' ->
          advance scanner;
          LPARENT
      | ')' ->
          advance scanner;
          RPARENT
      | '.' ->
          advance scanner;
          if (not (at_end scanner)) && scanner.ch = '.' then (
            advance scanner;
            DOTDOT)
          else DOT
      | '\'' ->
          advance scanner;
          QUOTE
      | ',' ->
          advance scanner;
          COMMA
      | ':' ->
          advance scanner;
          COLON
      | '~' ->
          advance scanner;
          TILDE
      | '?' ->
          advance scanner;
          QUESTION
      | '{' ->
          advance scanner;
          LBRACE
      | '}' ->
          advance scanner;
          RBRACE
      | '|' ->
          advance scanner;
          BAR
      | ';' ->
          advance scanner;
          SEMICOLON
      | '`' ->
          advance scanner;
          BACKQOUTE
      | '[' ->
          advance scanner;
          if (not (at_end scanner)) && scanner.ch = '>' then (
            advance scanner;
            LBRACKETGREATER)
          else LBRACKET
      | ']' ->
          advance scanner;
          RBRACKET
      | c ->
          advance scanner;
          let end_pos = position scanner in
          scanner.err ~start_pos ~end_pos ("Unknown char" ^ String.make 1 c);
          let _, _, t = scan scanner in
          t
  in
  let end_pos = position scanner in
  (start_pos, end_pos, token)
