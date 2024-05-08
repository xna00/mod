open Js_of_ocaml
open Parsing
open Typing

type loc = {
  start : int * int;
  _end : int * int; [@key "end"]
  _type : string; [@key "type"]
}
[@@deriving yojson, show { with_path = false }]

type loc_list = loc list [@@deriving yojson, show { with_path = false }]

type diag = { start : int * int; _end : int * int; [@key "end"] msg : string }
[@@deriving yojson, show { with_path = false }]

type docdata = {
  tokens : loc_list;
  formatted : string;
  diagnostics : diag list;
  mod_term : Typing.Typed.mod_term;
}
[@@deriving show { with_path = false }]

let js_log s = Firebug.console##log (Js.string s)

let in_range (l, c) ((l1, c1), (l2, c2)) =
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

let files = Hashtbl.create 1

let filechange (uri : string) src =
  js_log "filechange";
  js_log uri;
  js_log src;
  let toks = tokeinfo src in
  js_log "tokeinfo done";
  let p = Parser.make "file" src in
  let mod_expr = Parser.parse p in
  js_log "parse done";
  let init_scope, init_env = Predef.init_scope_env () in
  let m =
    Typed.mod_expr_to_typed mod_expr
    |> Typing.Scope.scope_module init_scope
    |> Infer.type_module init_env
  in
  js_log "type done";
  let ret =
    if List.length p.diagnostics = 0 then
      {
        tokens = toks;
        formatted =
          (match mod_expr.me_desc with
          | MEStructure defs -> Syntax.print_definition_list defs
          | _ -> assert false);
        diagnostics = [];
        mod_term = m;
      }
    else
      {
        tokens = toks;
        formatted = src;
        diagnostics =
          List.map
            (fun (d : Parser.diagnostic) ->
              {
                start = pos_of_position d.start_pos;
                _end = pos_of_position d.end_pos;
                msg = d.msg;
              })
            p.diagnostics;
        mod_term = m;
      }
  in
  js_log uri;
  js_log (show_docdata ret);
  Hashtbl.add files uri ret

let in_loc_range pos loc =
  in_range pos
    ( pos_of_position loc.Location.loc_start,
      pos_of_position loc.Location.loc_end )

let in_mod_term_range pos mod_term =
  in_range pos
    ( pos_of_position mod_term.Typed.loc.loc_start,
      pos_of_position mod_term.Typed.loc.loc_end )

let in_term_range pos (term : Typed.term) =
  in_range pos
    ( pos_of_position term.Typed.loc.loc_start,
      pos_of_position term.Typed.loc.loc_end )

let type_info uri pos =
  let mod_term = (Hashtbl.find files uri).mod_term in
  let rec loop_mod_term mod_term =
    let str = Types.print_mod_type mod_term.Typed.mod_term_type in
    match mod_term.Typed.mod_term_desc with
    | Typed.Apply (m1, m2) ->
        if in_mod_term_range pos m1 then loop_mod_term m1
        else if in_mod_term_range pos m2 then loop_mod_term m2
        else str
    | Typed.Functor (_, _, m1) ->
        if in_mod_term_range pos m1 then loop_mod_term m1 else str
    | Typed.Structure structure ->
        List.fold_left
          (fun acc def ->
            match def.Typed.definition_desc with
            | Typed.Value_str (id, term) ->
                if in_loc_range pos id.loc then
                  Env.find_value (Path.Pident id.txt) def.after_env
                  |> Types.print_val_type []
                else if in_term_range pos term then loop_term pos term
                else acc
            | Typed.Module_str (_, m) ->
                if in_mod_term_range pos m then loop_mod_term m else acc
            | _ -> acc)
          str structure
    | _ -> str
  and loop_term pos term =
    let str = Types.print_val_type [] (Types.trivial_scheme term.term_type) in
    match (term : Typed.term).term_desc with
    | Apply (tm, tml) ->
        if in_term_range pos tm then loop_term pos tm
        else loop_term_list pos str (List.map snd tml)
    | Function (_, _, tm) ->
        if in_term_range pos tm then loop_term pos tm else str
    | Let (id, tm1, tm2) ->
        js_log (Location.show id.loc);
        if in_loc_range pos id.loc then
          Env.find_value (Path.Pident id.txt) tm2.term_env
          |> Types.print_val_type []
        else loop_term_list pos str [ tm1; tm2 ]
    | _ -> str
  and loop_term_list pos str tml =
    List.fold_left
      (fun acc tm -> if in_term_range pos tm then loop_term pos tm else acc)
      str tml
  in
  loop_mod_term mod_term

let tokeinfo uri =
  (Hashtbl.find files uri).tokens |> loc_list_to_yojson |> Yojson.Safe.to_string

let _ =
  Js.export_all
    (object%js
       method tokeninfo uri = tokeinfo uri
       method format uri = (Hashtbl.find files uri).formatted
       method typeinfo uri l c = type_info uri (l, c)
       method filechange uri src = filechange uri src
    end)
