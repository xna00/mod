open Asttypes
open Token
open Syntax
open Parser_base

let expr_ref = ref (fun _ -> assert false)
let expr p = !expr_ref p

let rec jsx p =
  let loc_start = p.start_pos in
  expect LESS p;
  print_token p.token;
  let tag = longident p in
  print_endline (Longident.string_of_longident tag.txt);
  let e = ELongident tag in
  let attrs = jsx_attrs p in
  print_token p.token;
  expect GREATER p;
  let children =
    match p.token with
    | LESSSLASH -> []
    | LESS -> [ (Labelled "children", jsx p) ]
    | LBRACE -> [ (Labelled "children", expr p) ]
    | _ ->
        report p;
        raise Parse_error
  in
  expect LESSSLASH p;
  let tag' = longident p in
  expect GREATER p;
  let loc_end = p.prev_end_pos in
  if tag.txt <> tag'.txt then (
    report p;
    raise Parse_error)
  else
    {
      desc = Ejsxelement ({ desc = e; loc = tag.loc }, attrs @ children);
      loc = { loc_start; loc_end };
    }

and jsx_attrs p =
  match p.token with
  | LIDENT _ ->
      print_token p.token;
      let lid = lident p in
      print_token p.token;
      expect EQUAL p;
      expect LBRACE p;
      let e = expr p in
      expect RBRACE p;
      (Labelled lid.txt, e) :: jsx_attrs p
  | _ -> []
