open Report

type t = {
  values : (string * Ident.t) list;
  types : (string * Ident.t) list;
  modules : (string * Ident.t) list;
}

let empty = { values = []; types = []; modules = [] }

let enter_value id sc =
  {
    values = (Ident.name id, id) :: sc.values;
    types = sc.types;
    modules = sc.modules;
  }

let enter_type id sc =
  {
    types = (Ident.name id, id) :: sc.types;
    values = sc.values;
    modules = sc.modules;
  }

let enter_module id sc =
  {
    modules = (Ident.name id, id) :: sc.modules;
    values = sc.values;
    types = sc.types;
  }

let scope_value id sc =
  try List.assoc (Ident.name id) sc.values
  with Not_found -> error ("unbound value " ^ Ident.name id)

let scope_type id sc =
  try List.assoc (Ident.name id) sc.types
  with Not_found -> error ("unbound type " ^ Ident.name id)

let scope_module id sc =
  try List.assoc (Ident.name id) sc.modules
  with Not_found -> error ("unbound module " ^ Ident.name id)

let rec scope_path scope_ident path sc =
  match path with
  | Path.Pident id -> Path.Pident (scope_ident id sc)
  | Pdot (root, field) -> Pdot (scope_path scope_module root sc, field)

let value_path = scope_path scope_value
let type_path = scope_path scope_type
let module_path = scope_path scope_module

open Types
open Typed

let rec scope_term sc term =
  let newterm =
    try
      match term.term_desc with
      | Constant n -> Constant n
      | Longident path -> Longident (value_path path sc)
      | Function (l, id, body) ->
          Function (l, id, scope_term (enter_value id sc) body)
      | Apply (t1, t2) ->
          Apply
            ( scope_term sc t1,
              List.map (fun (l, tm) -> (l, scope_term sc tm)) t2 )
      | Let (id, t1, t2) ->
          Let (id, scope_term sc t1, scope_term (enter_value id.txt sc) t2)
      | RecordEmpty -> RecordEmpty
      | RecordExtend (l, e1, e2) ->
          RecordExtend (l, scope_term sc e1, scope_term sc e2)
      | RecordSelect (e, l) -> RecordSelect (scope_term sc e, l)
      | Variant (tag, e) -> Variant (tag, scope_term sc e)
      | Case (e, cases, pat) ->
          Case
            ( scope_term sc e,
              List.map
                (fun (tag, var, e) ->
                  let new_sc = enter_value var.Asttypes.txt sc in
                  (tag, var, scope_term new_sc e))
                cases,
              Option.map
                (fun (var, e) ->
                  (var, scope_term (enter_value var.Asttypes.txt sc) e))
                pat )
      | Jsxelement (t1, t2) ->
          Jsxelement
            ( scope_term sc t1,
              List.map (fun (l, tm) -> (l, scope_term sc tm)) t2 )
    with Typechecking_error s ->
      print_endline s;
      report_term s term;
      term.term_desc
  in
  { term with term_desc = newterm }

let rec scope_simple_type sc = function
  | Var v -> Var v
  | Typeconstr (path, args) ->
      Typeconstr (type_path path sc, List.map (scope_simple_type sc) args)
  | Tarrow (l, t1, t2) ->
      Tarrow (l, scope_simple_type sc t1, scope_simple_type sc t2)
  | TRempty -> TRempty
  | TRextend (s, ty1, ty2) ->
      TRextend (s, scope_simple_type sc ty1, scope_simple_type sc ty2)
  | Tvariant ty -> Tvariant (scope_simple_type sc ty)
  | Trecord ty -> Trecord (scope_simple_type sc ty)

let scope_valtype sc vty =
  { quantif = vty.quantif; body = scope_simple_type sc vty.body }

let scope_deftype sc def =
  { params = def.params; defbody = scope_simple_type sc def.defbody }

let scope_kind sc kind = kind

let scope_typedecl sc decl =
  {
    kind = scope_kind sc decl.kind;
    manifest =
      (match decl.manifest with
      | None -> None
      | Some ty -> Some (scope_deftype sc ty));
  }

let rec scope_modtype sc = function
  | Signature sg -> Signature (scope_signature sc sg)
  | Functor_type (id, arg, res) ->
      Functor_type
        (id, scope_modtype sc arg, scope_modtype (enter_module id sc) res)

and scope_signature sc = function
  | [] -> []
  | Value_sig (id, vty) :: rem ->
      Value_sig (id, scope_valtype sc vty)
      :: scope_signature (enter_value id sc) rem
  | Type_sig (id, decl) :: rem ->
      Type_sig (id, scope_typedecl sc decl)
      :: scope_signature (enter_type id sc) rem
  | Module_sig (id, mty) :: rem ->
      Module_sig (id, scope_modtype sc mty)
      :: scope_signature (enter_module id sc) rem

let rec scope_module sc mod_term =
  let new_mod_term =
    match mod_term.mod_term_desc with
    | Longident path -> Longident (module_path path sc)
    | Structure str -> Structure (scope_structure sc str)
    | Functor (id, arg, body) ->
        Functor
          (id, scope_modtype sc arg, scope_module (enter_module id sc) body)
    | Apply (m1, m2) -> Apply (scope_module sc m1, scope_module sc m2)
    | Constraint (m, mty) -> Constraint (scope_module sc m, scope_modtype sc mty)
  in
  { mod_term with mod_term_desc = new_mod_term }

and scope_structure sc str =
  match str with
  | [] -> []
  | { definition_desc = Value_str (id, v); _ } :: rem ->
      {
        definition_desc = Value_str (id, scope_term sc v);
        before_env = Env.empty;
        after_env = Env.empty;
      }
      :: scope_structure (enter_value id.txt sc) rem
  | { definition_desc = Type_str (id, kind, dty); _ } :: rem ->
      {
        definition_desc = Type_str (id, scope_kind sc kind, scope_deftype sc dty);
        before_env = Env.empty;
        after_env = Env.empty;
      }
      :: scope_structure (enter_type id sc) rem
  | { definition_desc = Module_str (id, m); _ } :: rem ->
      {
        definition_desc = Module_str (id, scope_module sc m);
        before_env = Env.empty;
        after_env = Env.empty;
      }
      :: scope_structure (enter_module id sc) rem
