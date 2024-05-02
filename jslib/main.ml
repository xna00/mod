open Js_of_ocaml
open Parsing
open Monad
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

let token_parser : loc parser =
  wss *> fetch >>= fun (pos1, _) ->
  (ident *> return "variable")
  ++ (keyword_parser *> return "keyword")
  ++ (number *> return "number")
  ++ (unknown *> return "unknown")
  >>= fun t ->
  fetch >>= fun (pos2, _) -> return { start = pos1; _end = pos2; _type = t }

let lexing src =
  match (many token_parser) ((0, 0), explode src) with
  | Ok (v, _) ->
      List.filter (fun { _type; _ } -> _type <> "unknown") v
      |> loc_list_to_yojson |> Yojson.Safe.to_string
  | Error e -> failwith "fail"

let parse src =
  match term_parser ((0, 0), explode src) with
  | Ok (v, _) -> v
  | Error (Fail (msg, s)) ->
      failwith ("fail parse" ^ msg ^ show_pos (fst s) ^ implode (snd s))

let in_range ((l, c) as p1) (((l1, c1) as p2), ((l2, c2) as p3)) =
  (* print_endline (show_pos p1);
     print_endline (show_pos p2);
     print_endline (show_pos p3); *)
  (l1 < l && l2 > l)
  || (l1 <> l2 && l1 = l && c1 <= c)
  || (l1 <> l2 && l2 = l && c2 > c)
  || (l1 = l2 && l1 = l && c1 <= c && c2 > c)

let type_info src pos =
  let typed_tm = type_expr (parse src) in
  (* print_endline (show_typed_tm typed_tm); *)
  let rec find tm =
    match tm.tm with
    | Tint | Tbool | Tvar _ -> print_ty tm.ty
    | Tabs (_, _, body) ->
        if in_range pos body.loc then find body else print_ty tm.ty
    | Tapp (t1, t2) ->
        if in_range pos t1.loc then find t1
        else if in_range pos t2.loc then find t2
        else print_ty tm.ty
    | Tlet (_, _, t1, t2) ->
        (* print_endline (string_of_bool (in_range pos t1.loc));
           print_endline (string_of_bool (in_range pos t2.loc)); *)
        if in_range pos t1.loc then find t1
        else if in_range pos t2.loc then find t2
        else print_ty tm.ty
  in
  find typed_tm

let _ =
  Js.export_all
    (object%js
       method lexing src = lexing src
       method typeinfo src l c = type_info src (l, c)
    end)

(* let _ = print_endline (type_info "let id = fun x -> x in id" (0, 26)) *)
