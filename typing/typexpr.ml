open Parsing.Syntax

let rec print_ty ty =
  match ty with
  | TyBool -> "bool"
  | TyInt -> "int"
  | TyArr (ty1, ty2) ->
      Printf.sprintf
        (match ty1 with TyArr _ -> "(%s) -> %s" | _ -> "%s -> %s")
        (print_ty ty1) (print_ty ty2)
  | TyId x -> x
  | TyQId _ -> assert false

type constr = (ty * ty) list [@@deriving show { with_path = false }]

type nextuvar = NextUVar of string * uvargenerator
and uvargenerator = unit -> nextuvar

let uvargen =
  let rec f n () = NextUVar ("?X_" ^ string_of_int n, f (n + 1)) in
  f 0

type env = (string * ty) list [@@deriving show { with_path = false }]

type typed_tm = { tm : tm_desc; ty : ty; env : env; loc : location }
[@@deriving show { with_path = false }]

and tm_desc =
  | Tvar of string
  | Tabs of (string * ty option * typed_tm)
  | Tapp of typed_tm * typed_tm
  | Tint
  | Tbool
  | Tlet of (bool * string * typed_tm * typed_tm)

let rec print_typed typed =
  let { tm; ty; _ } = typed in
  match tm with
  | Tvar x -> Printf.sprintf "(%s: %s)" x (print_ty ty)
  | Tabs (x, ty0, t2) ->
      Printf.sprintf "((\%s: %s. %s): %s)" x
        (Option.fold ~none:"" ~some:print_ty ty0)
        (print_typed t2) (print_ty ty)
  | Tapp (t1, t2) ->
      Printf.sprintf "(%s %s: %s)" (print_typed t1) (print_typed t2)
        (print_ty ty)
  | Tint -> Printf.sprintf "(intv: %s)" (print_ty ty)
  | Tbool -> Printf.sprintf "(boolv: %s)" (print_ty ty)
  | Tlet (r, x, t1, t2) ->
      Printf.sprintf "(let %s %s = %s in %s)"
        (if r then "rec" else "")
        x (print_typed t1) (print_typed t2)

let is_value t = match t with TmApp _ -> false | _ -> true

let rec is_occurs t1 t2 =
  match t2 with
  | TyId _ -> t1 = t2
  | TyArr (ty1, ty2) -> is_occurs t1 ty1 || is_occurs t1 ty2
  | TyBool | TyInt -> false
  | TyQId _ -> false

let rec occurs t1 t2 = if is_occurs t1 t2 then failwith "occurs"

let rec subst s t =
  match t with
  | TyInt -> TyInt
  | TyBool -> TyBool
  | TyQId x -> TyQId x
  | TyArr (ty1, ty2) -> TyArr (subst s ty1, subst s ty2)
  | TyId _ -> (
      match s with
      | [] -> t
      | (x, ty) :: rest -> if t = x then subst rest ty else subst rest t)

and unify c =
  match c with
  | [] -> []
  | (ty1, ty2) :: rest when ty1 = ty2 -> unify rest
  | (TyId id, t | t, TyId id) :: rest ->
      occurs (TyId id) t;
      (TyId id, t)
      :: unify
           (List.map
              (fun (x, ty) ->
                (subst [ (TyId id, t) ] x, subst [ (TyId id, t) ] ty))
              rest)
  | (TyArr (ty11, ty12), TyArr (ty21, ty22)) :: rest ->
      unify ((ty11, ty21) :: (ty12, ty22) :: rest)
  | _ -> failwith "unify"

let unify_subst c t = subst (unify c) t

let rec gen env t =
  match t with
  | TyId x when List.for_all (fun (_, ty) -> not (is_occurs t ty)) env ->
      TyQId x
  | TyArr (ty1, ty2) -> TyArr (gen env ty1, gen env ty2)
  | _ -> t

let rec inst f (m : (string * ty) list) t =
  match t with
  | TyQId id ->
      if List.mem_assoc id m then (List.assoc id m, m, f)
      else
        let (NextUVar (x, f)) = f () in
        let t = TyId x in
        (t, (id, t) :: m, f)
  | TyArr (ty1, ty2) ->
      let ty1', m, f = inst f m ty1 in
      let ty2', m, f = inst f m ty2 in
      (TyArr (ty1', ty2'), m, f)
  | _ -> (t, m, f)

let rec gen_constr env f (t : term) : typed_tm * uvargenerator * constr =
  let loc = t.loc in
  match t.desc with
  | TmBool -> ({ env; tm = Tbool; ty = TyBool; loc }, f, [])
  | TmInt -> ({ env; tm = Tint; ty = TyInt; loc }, f, [])
  | TmVar x ->
      let ty =
        try List.assoc x env with Not_found -> failwith ("Unbound: " ^ x)
      in
      let ty, _, f = inst f [] ty in
      ({ env; tm = Tvar x; ty; loc }, f, [])
  | TmAbs (x, Some ty1, t2) ->
      let ty2, f, c = gen_constr ((x, ty1) :: env) f t2 in
      ( { env; tm = Tabs (x, Some ty1, ty2); ty = TyArr (ty1, ty2.ty); loc },
        f,
        c )
  | TmAbs (x, None, t2) ->
      let (NextUVar (name, f)) = f () in
      let ty_x = TyId name in
      let ty, f, c = gen_constr ((x, ty_x) :: env) f t2 in
      ({ env; tm = Tabs (x, None, ty); ty = TyArr (ty_x, ty.ty); loc }, f, c)
  | TmApp (t1, t2) ->
      let ty1, f, c1 = gen_constr env f t1 in
      let ty2, f, c2 = gen_constr env f t2 in
      let (NextUVar (x, f)) = f () in
      let ty_r = TyId x in
      let c = c1 @ c2 @ [ (ty1.ty, TyArr (ty2.ty, ty_r)) ] in
      ({ env; tm = Tapp (ty1, ty2); ty = ty_r; loc }, f, c)
  | TmLet (r, x, t1, t2) ->
      let typed_tm, f, c1 =
        if r then
          let (NextUVar (id, f)) = f () in
          gen_constr ((x, TyId id) :: env) f t1
        else gen_constr env f t1
      in
      let ty1 = unify_subst c1 typed_tm.ty in
      let ty2, f, c2 =
        gen_constr
          ((x, if is_value t1.desc then gen env ty1 else ty1) :: env)
          f t2
      in
      ({ env; tm = Tlet (r, x, typed_tm, ty2); ty = ty2.ty; loc }, f, c1 @ c2)

let rec subst_typed s typed =
  let { env; tm; ty; loc } = typed in
  {
    env = List.map (fun (x, ty) -> (x, subst s ty)) env;
    tm =
      (match tm with
      | Tabs (x, ty, t2) -> Tabs (x, ty, subst_typed s t2)
      | Tapp (t1, t2) -> Tapp (subst_typed s t1, subst_typed s t2)
      | Tlet (r, x, t1, t2) -> Tlet (r, x, subst_typed s t1, subst_typed s t2)
      | _ -> tm);
    ty = subst s ty;
    loc;
  }

let initialenv : env = [ ("true", TyBool); ("false", TyBool) ]

let type_expr e =
  let typed, _, c = gen_constr initialenv uvargen e in
  let s = unify c in
  subst_typed s typed
