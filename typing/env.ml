open Parsing
open Types

type binding = Value of val_type | Type of type_decl | Module of mod_type
[@@deriving show { with_path = false }]

type t = binding Ident.tbl
[@@deriving show { with_path = false }]

let empty = Ident.emptytbl
let add_value id vty env = Ident.add id (Value vty) env
let add_type id decl env = Ident.add id (Type decl) env
let add_module id mty env = Ident.add id (Module mty) env

let add_spec item env =
  match item with
  | Value_sig (id, vty) -> add_value id vty env
  | Type_sig (id, decl) -> add_type id decl env
  | Module_sig (id, mty) -> add_module id.txt mty env

(* Why fold_right instead of fold_left? *)
let add_signature = List.fold_right add_spec
let error s = failwith s

let rec find path env =
  match path with
  | Path.Pident id -> Ident.find id env
  | Pdot (root, field) -> (
      match find_module root env with
      | Signature sg -> find_field root field Subst.identity sg
      | _ -> error "structure expected in dot access")

and find_field p field subst = function
  | [] -> error "no such field in structure"
  | Value_sig (id, vty) :: rem ->
      if Ident.name id = field then Value (Subst.subst_valtype vty subst)
      else find_field p field subst rem
  | Type_sig (id, decl) :: rem ->
      if Ident.name id = field then Type (Subst.subst_typedecl decl subst)
      else
        find_field p field
          (Subst.add id (Path.Pdot (p, Ident.name id)) subst)
          rem
  | Module_sig (id, mty) :: rem ->
      if Ident.name id.txt = field then Module (Subst.subst_modtype mty subst)
      else
        find_field p field
          (Subst.add id.txt (Path.Pdot (p, Ident.name id.txt)) subst)
          rem

and find_value path env =
  match find path env with
  | Value vty -> vty
  | _ -> error "value field expected"

and find_type path env =
  match find path env with
  | Type decl -> decl
  | _ -> error "type field expected"

and find_module path env =
  match find path env with
  | Module mty -> mty
  | _ -> error "module field expected"

let rec lookup lid (env : t) =
  match lid with
  | Longident.Lident id ->
      let rec loop id env =
        match env with
        | [] -> raise Not_found
        | (ident, data) :: rest ->
            if Ident.name ident = id then (Path.Pident ident, data)
            else loop id rest
      in
      loop id env
  | Longident.Ldot (lid1, id) -> (
      let p, mty = lookup_module lid1 env in
      match mty with
      | Signature sig_ ->
          let binding = find_field p id Subst.identity sig_ in
          (Path.Pdot (p, id), binding)
      | _ -> error "structure expected in dot access")

and lookup_value lid env =
  let path, data = lookup lid env in
  match data with Value ty -> (path, ty) | _ -> error "value field expected"

and lookup_type lid env =
  let path, data = lookup lid env in
  match data with Type decl -> (path, decl) | _ -> error "type field expected"

and lookup_module lid env =
  let path, data = lookup lid env in
  match data with
  | Module mty -> (path, mty)
  | _ -> failwith "module field expected"

let iniitalenv : t = []
