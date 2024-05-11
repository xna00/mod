type t = Path.t Ident.tbl

let identity = Ident.emptytbl
let add = Ident.add

let rec path p sub =
  match p with
  | Path.Pident id -> ( try Ident.find id sub with Not_found -> p)
  | Path.Pdot (root, field) -> Pdot (path root sub, field)

open Types

let rec subst_type subst = function
  | Var { repres = None; _ } as ty -> ty
  | Var { repres = Some ty; _ } -> subst_type subst ty
  | Typeconstr (p, tl) ->
      Typeconstr (path p subst, List.map (subst_type subst) tl)
  | Tarrow (l, t1, t2) -> Tarrow (l, subst_type subst t1, subst_type subst t2)
  | TRempty -> TRempty
  | TRextend (s, ty1, ty2) ->
      TRextend (s, subst_type subst ty1, subst_type subst ty2)
  | Tvariant row -> subst_type subst row
  | Trecord row -> subst_type subst row

let subst_valtype vty subst =
  { quantif = vty.quantif; body = subst_type subst vty.body }

let subst_deftype def subst =
  { params = def.params; defbody = subst_type subst def.defbody }

let subst_kind kind subst = kind

let subst_typedecl decl sub =
  {
    kind = subst_kind decl.kind sub;
    manifest =
      (match decl.manifest with
      | None -> None
      | Some dty -> Some (subst_deftype dty sub));
  }

let rec subst_modtype mty sub =
  match mty with
  | Signature sg -> Signature (List.map (subst_sig_item sub) sg)
  | Functor_type (id, mty1, mty2) ->
      Functor_type (id, subst_modtype mty1 sub, subst_modtype mty2 sub)

and subst_sig_item sub = function
  | Value_sig (id, vty) -> Value_sig (id, subst_valtype vty sub)
  | Type_sig (id, decl) -> Type_sig (id, subst_typedecl decl sub)
  | Module_sig (id, mty) -> Module_sig (id, subst_modtype mty sub)
