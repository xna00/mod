open Js_of_ocaml
open Parsing
open Parser
open Typing.Typexpr
open Syntax

type loc = {
  start : int * int;
  _end : int * int; [@key "end"]
  _type : string; [@key "type"]
}
[@@deriving yojson]

type loc_list = loc list [@@deriving yojson]

type diag = { start : int * int; _end : int * int; [@key "end"] msg : string }
[@@deriving yojson]

type docdata = {
  tokens : loc_list;
  formatted : string;
  diagnostics : diag list;
}
[@@deriving yojson]

let in_range ((l, c) as p1) (((l1, c1) as p2), ((l2, c2) as p3)) =
  (* print_endline (show_pos p1);
     print_endline (show_pos p2);
     print_endline (show_pos p3); *)
  (l1 < l && l2 > l)
  || (l1 <> l2 && l1 = l && c1 <= c)
  || (l1 <> l2 && l2 = l && c2 > c)
  || (l1 = l2 && l1 = l && c1 <= c && c2 > c)

let pos_of_position (s : Location.position) =
  (s.pos_lnum - 1, s.pos_cnum - s.pos_bol)

let tokeinfo src =
  let scanner = Lexer.make "file" src in
  let rec loop () =
    let s, e, tok = Lexer.scan scanner in
    if tok = Token.EOF then [] else (s, e, tok) :: loop ()
  in
  let tok_list = loop () in
  let locs =
    List.map
      Location.(
        fun (s, e, tok) ->
          {
            start = (s.pos_lnum - 1, s.pos_cnum - s.pos_bol);
            _end = (e.pos_lnum - 1, e.pos_cnum - e.pos_bol);
            _type =
              Token.(
                match tok with
                | UIDENT _ | LIDENT _ -> "variable"
                | NUMBER _ -> "number"
                | tok when List.mem tok (List.map snd Token.keywords) ->
                    "keyword"
                | _ -> "unknown");
          })
      tok_list
  in
  List.filter (fun { _type; _ } -> _type <> "unknown") locs

let format src =
  let p = Parser.make "file" src in
  let mod_expr = Parser.parse p in
  Syntax.print_definition_list mod_expr

let filechange src =
  let toks = tokeinfo src in
  print_endline "toks done";
  let p = Parser.make "file" src in
  let mod_expr = Parser.parse p in
  print_endline "parse done";
  let ret =
    if List.length p.diagnostics = 0 then
      {
        tokens = toks;
        formatted = Syntax.print_definition_list mod_expr;
        diagnostics = [];
      }
    else
      {
        tokens = toks;
        formatted = src;
        diagnostics =
          List.map
            (fun (d : diagnostic) ->
              {
                start = pos_of_position d.start_pos;
                _end = pos_of_position d.end_pos;
                msg = d.msg;
              })
            p.diagnostics;
      }
  in
  ret |> docdata_to_yojson |> Yojson.Safe.to_string

let type_info src pos = "unknown"
let tokeinfo src = tokeinfo src |> loc_list_to_yojson |> Yojson.Safe.to_string

let _ =
  Js.export_all
    (object%js
       method tokeninfo src = tokeinfo src
       method format src = format src
       method typeinfo src l c = type_info src (l, c)
       method filechange src = filechange src
    end)
