open Types
open Typed
open Predef
open Report

let rec subst_vars subst ty =
  match typerepr ty with
  | Var var as tyvar -> ( try List.assq var subst with Not_found -> tyvar)
  | Typeconstr (p, tl) -> Typeconstr (p, List.map (subst_vars subst) tl)
  | Tarrow (label, t1, t2) ->
      Tarrow (label, subst_vars subst t1, subst_vars subst t2)
  | Trecord row -> Trecord (subst_vars subst row)
  | TRempty -> TRempty
  | TRextend (label, t1, rest) ->
      TRextend (label, subst_vars subst t1, subst_vars subst rest)
  | Tvariant row -> Tvariant (subst_vars subst row)

exception Cannot_expand

let expand_manifest env path (args : simple_type list) =
  match Env.find_type path env with
  | { manifest = None; _ } -> raise Cannot_expand
  | { manifest = Some def; _ } ->
      subst_vars
        (List.combine def.params args)
        (def.defbody : Types.simple_type)

let arg_label_match label1 label2 =
  let open Parsing.Asttypes in
  match (label1, label2) with
  | Nolabel, Nolabel -> true
  | (Labelled s1 | Optional s1), (Labelled s2 | Optional s2) -> s1 = s2
  | _ -> false

let rec scrape_types env ty1 ty2 =
  let repr1 = typerepr ty1 and repr2 = typerepr ty2 in
  match (repr1, repr2) with
  | Typeconstr (path1, args1), Typeconstr (path2, args2) -> (
      if Path.path_equal path1 path2 then (repr1, repr2)
      else
        try scrape_types env (expand_manifest env path1 args1) repr2
        with Cannot_expand -> (
          try scrape_types env repr1 (expand_manifest env path2 args2)
          with Cannot_expand -> (repr1, repr2)))
  | Typeconstr (path, args), _ -> (
      try scrape_types env (expand_manifest env path args) repr2
      with Cannot_expand -> (repr1, repr2))
  | _, Typeconstr (path, args) -> (
      try scrape_types env repr1 (expand_manifest env path args)
      with Cannot_expand -> (repr1, repr2))
  | _, _ -> (repr1, repr2)

let rec occur_check var ty =
  match typerepr ty with
  | Var var' ->
      if var == var' then raise (Typechecking_error "cycle in unification")
  | Typeconstr (p, tl) -> List.iter (occur_check var) tl
  | Tarrow (_, t1, t2) ->
      occur_check var t1;
      occur_check var t2
  | Trecord row -> occur_check var row
  | TRempty -> ()
  | TRextend (_, ty1, rest) ->
      occur_check var ty1;
      occur_check var rest
  | Tvariant row -> occur_check var row

let rec update_levels level_max ty =
  match typerepr ty with
  | Var v -> if v.level > level_max then v.level <- level_max
  | Typeconstr (p, tl) -> List.iter (update_levels level_max) tl
  | Tarrow (_, t1, t2) ->
      update_levels level_max t1;
      update_levels level_max t2
  | Trecord row -> update_levels level_max row
  | TRempty -> ()
  | TRextend (_, ty1, rest) ->
      update_levels level_max ty1;
      update_levels level_max rest
  | Tvariant row -> update_levels level_max row

let rec unify env t1 t2 =
  match scrape_types env t1 t2 with
  | r1, r2 when r1 == r2 -> ()
  | Var v, r2 ->
      occur_check v r2;
      update_levels v.level r2;
      v.repres <- Some r2
  | r1, Var v ->
      occur_check v r1;
      update_levels v.level r1;
      v.repres <- Some r1
  | Typeconstr (path1, args1), Typeconstr (path2, args2) when path1 = path2 ->
      List.iter2 (unify env) args1 args2
  | Tarrow (arg_label1, t11, t12), Tarrow (arg_label2, t21, t22) ->
      if not (arg_label_match arg_label1 arg_label2) then
        raise
          (Typechecking_error
             (Printf.sprintf "label1: %s, label2: %s"
                (Parsing.Asttypes.show_arg_label arg_label1)
                (Parsing.Asttypes.show_arg_label arg_label2)));
      unify env t11 t21;
      unify env t12 t22
  | Trecord row1, Trecord row2 -> unify env row1 row2
  | Tvariant row1, Tvariant row2 -> unify env row1 row2
  | TRextend (label1, t1, rest1), (TRextend _ as row2) ->
      let rec rewrite_row row label1 t1 =
        match row with
        | TRextend (label2, t2, rest) when label1 = label2 ->
            unify env t1 t2;
            rest
        | TRextend (label2, t2, rest) ->
            TRextend (label2, t2, rewrite_row rest label1 t1)
        | TRempty ->
            error (Printf.sprintf "unify: %s does not exsit on empty" label1)
        | Var { repres = Some row2; _ } -> rewrite_row row2 label1 t1
        | Var ({ repres = None; level } as varref) ->
            let var = newvar () in
            var.level <- level;
            let rest2 = Var var in
            varref.repres <- Some (TRextend (label1, t1, rest2));
            rest2
        | _ -> error "not a row"
      in
      let rest2 = rewrite_row row2 label1 t1 in
      unify env rest1 rest2
  | TRempty, (TRextend (label, _, _) as r)
  | (TRextend (label, _, _) as r), TRempty ->
      print_endline (show_simple_type r);
      error (Printf.sprintf "unify: %s does not exsit on empty" label)
  | ty1, ty2 ->
      error
        (Printf.sprintf "type constructor mismatch in unification: %s, %s"
           (show_simple_type ty1) (show_simple_type ty2))

let instance vty =
  match vty.quantif with
  | [] -> vty.body
  | vars -> subst_vars (List.map (fun v -> (v, unknown ())) vars) vty.body

let rec flatten_arrow arrow =
  match typerepr arrow with
  | Tarrow (label, t1, t2) ->
      let args, ret = flatten_arrow t2 in
      ((label, t1) :: args, ret)
  | t -> ([], t)

let rec row_remove_label row label =
  match typerepr row with
  | TRempty -> TRempty
  | TRextend (label1, _, rest) when label = label1 -> rest
  | TRextend (label1, t, rest) ->
      TRextend (label1, t, row_remove_label rest label)
  | Var { repres = None; _ } as var -> var
  | _ ->
      print_endline (show_simple_type row);
      assert false

let rec infer_type env term : term =
  let ty =
    match term.term_desc with
    | Constant n -> (
        match n with Const_number -> int_type | Const_string -> string_type)
    | Longident path -> instance (Env.find_value path env)
    | Function (arg_label, param, body) ->
        let type_param = unknown () in
        print_endline (show_simple_type type_param);
        let type_body =
          infer_type
            (Env.add_value param
               (trivial_scheme
                  (match arg_label with
                  | Nolabel | Labelled _ -> type_param
                  | Optional _ -> option_type type_param))
               env)
            body
        in
        arrow_type arg_label type_param type_body.term_type
    | Apply (funct, args) -> (
        let type_funct = infer_type env funct in
        let args_tys, ret_ty = flatten_arrow type_funct.term_type in
        match ret_ty with
        | Var _ ->
            let type_result = unknown () in
            let type_f =
              List.fold_right
                (fun (label, arg) r_ty ->
                  Tarrow (label, (infer_type env arg).term_type, r_ty))
                args type_result
            in
            unify env type_funct.term_type type_f;
            type_result
        | _ ->
            let n = List.length args_tys in
            let sigma = Array.make (List.length args_tys) (-1) in
            List.iteri
              (fun pos (label1, expr) ->
                let rec loop l i =
                  match l with
                  | [] -> error "Unkonwn label"
                  | (label2, ty) :: rest ->
                      if arg_label_match label1 label2 && sigma.(i) = -1 then (
                        unify env ty (infer_type env expr).term_type;
                        sigma.(i) <- pos)
                      else loop rest (i + 1)
                in
                loop args_tys 0)
              args;
            let rec fill i pos =
              if i < Array.length sigma then (
                if sigma.(i) = -1 then sigma.(i) <- pos;
                fill (i + 1) (pos + 1))
            in
            fill 0 (List.length args);
            let sigma = Array.to_list sigma in
            let k =
              List.filteri
                (fun i pos ->
                  pos >= List.length args
                  && List.exists
                       (fun j ->
                         j > i
                         && fst (List.nth args_tys j) = Nolabel
                         && List.nth sigma j < List.length args)
                       (List.init n (fun x -> x)))
                sigma
              |> List.length
            in
            let extra =
              List.filteri
                (fun i _ -> List.nth sigma i >= List.length args)
                args_tys
            in
            let rec erase ty k =
              match (ty, k) with
              | _, 0 -> ty
              | (Parsing.Asttypes.Optional _, _) :: rest, k -> erase rest (k - 1)
              | t :: rest, k -> t :: erase rest (k - 1)
              | [], _ -> error "erase"
            in
            List.fold_right
              (fun (label, t1) t2 -> Tarrow (label, t1, t2))
              (erase extra k) ret_ty)
    | Jsxelement (funct, args) -> (
        let type_funct = infer_type env funct in
        let args_tys, ret_ty = flatten_arrow type_funct.term_type in
        match ret_ty with
        | Var _ -> error "Element type should be known"
        | _ ->
            unify env ret_ty jsx_element_type;
            let n = List.length args_tys in
            let sigma = Array.make (List.length args_tys) (-1) in
            List.iteri
              (fun pos (label1, expr) ->
                let rec loop l i =
                  match l with
                  | [] -> error "Unkonwn label"
                  | (label2, ty) :: rest ->
                      if arg_label_match label1 label2 && sigma.(i) = -1 then (
                        unify env ty (infer_type env expr).term_type;
                        sigma.(i) <- pos)
                      else loop rest (i + 1)
                in
                loop args_tys 0)
              args;
            let rec fill i pos =
              if i < Array.length sigma then (
                if sigma.(i) = -1 then sigma.(i) <- pos;
                fill (i + 1) (pos + 1))
            in
            fill 0 (List.length args);
            let sigma = Array.to_list sigma in
            let k =
              List.filteri
                (fun i pos ->
                  pos >= List.length args
                  && List.exists
                       (fun j ->
                         j > i
                         && fst (List.nth args_tys j) = Nolabel
                         && List.nth sigma j < List.length args)
                       (List.init n (fun x -> x)))
                sigma
              |> List.length
            in
            let extra =
              List.filteri
                (fun i _ -> List.nth sigma i >= List.length args)
                args_tys
            in
            let rec erase ty k =
              match (ty, k) with
              | _, 0 -> ty
              | (Parsing.Asttypes.Optional _, _) :: rest, k -> erase rest (k - 1)
              | t :: rest, k -> t :: erase rest (k - 1)
              | [], _ -> error "erase"
            in
            let d = erase extra k in
            List.iter
              (fun (l, _) ->
                match l with
                | Asttypes.Optional _ -> ()
                | Asttypes.Nolabel -> error "Find a nolabel prop"
                | Asttypes.Labelled s -> error (s ^ " is missing"))
              d;
            ret_ty)
    | Let (ident, arg, body) ->
        begin_def ();
        let type_arg = infer_type env arg in
        end_def ();
        (infer_type
           (Env.add_value ident.txt (generalize type_arg.term_type) env)
           body)
          .term_type
    | RecordEmpty -> Trecord TRempty
    | RecordExtend (label, e1, e2) ->
        let ty1 = (infer_type env e1).term_type in
        let ty_e2 =
          match (infer_type env e2).term_type with
          | Trecord row -> Trecord (row_remove_label row label.txt)
          | _ -> assert false
        in
        let rest = unknown () in
        unify env (Trecord rest) ty_e2;
        let ret = Trecord (TRextend (label.txt, ty1, rest)) in
        ret
    | RecordSelect (e, label) ->
        let field_ty = unknown () in
        let e_ty = Trecord (TRextend (label.txt, field_ty, unknown ())) in
        unify env e_ty (infer_type env e).term_type;
        field_ty
    | Variant (tag, e) ->
        let field_ty = infer_type env e in
        Tvariant (TRextend (tag, field_ty.term_type, unknown ()))
    | Case (e, cases, pat) ->
        let ret = unknown () in
        let var_tys = List.map (fun _ -> unknown ()) cases in
        let rest_row = unknown () in
        List.iter2
          (fun (_, var, e) vat_ty ->
            let new_env =
              Env.add_value var.Asttypes.txt (trivial_scheme vat_ty) env
            in
            let e_ty = infer_type new_env e in
            unify env e_ty.term_type ret)
          cases var_tys;
        (match pat with
        | None -> unify env rest_row TRempty
        | Some (var, e) ->
            let new_env =
              Env.add_value var.txt (trivial_scheme (Tvariant rest_row)) env
            in
            let e_ty = infer_type new_env e in
            unify env e_ty.term_type ret);
        let variant_ty =
          Tvariant
            (List.fold_right2
               (fun (tag, _, _) var_ty ty ->
                 TRextend (tag, var_ty, row_remove_label ty tag))
               cases var_tys rest_row)
        in
        unify env variant_ty (infer_type env e).term_type;
        ret
  in
  term.term_type <- ty;
  term.term_env <- env;
  term

let rec check_simple_type env params ty =
  match typerepr ty with
  | Var v -> if not (List.memq v params) then error "free type variable"
  | Typeconstr (path, tl) ->
      let arity = (Env.find_type path env).kind.arity in
      if List.length tl <> arity then error "arity error";
      List.iter (check_simple_type env params) tl
  | Tarrow (_, t1, t2) ->
      check_simple_type env params t1;
      check_simple_type env params t2

let kind_deftype env def =
  print_endline (String.concat ", " (List.map show_type_variable def.params));
  check_simple_type env def.params def.defbody;
  { arity = List.length def.params }

let check_valtype env vty = check_simple_type env vty.quantif vty.body
let check_kind env kind = ()

let type_term env term =
  begin_def ();
  let ty =
    try infer_type env term with
    | Typechecking_error s ->
        add_d_ref
          {
            msg = s;
            start_pos = term.loc.loc_start;
            end_pos = term.loc.loc_end;
          };
        term
    | _ ->
        add_d_ref
          {
            msg = "Type error";
            start_pos = term.loc.loc_start;
            end_pos = term.loc.loc_end;
          };
        term
  in
  end_def ();
  let ret = generalize ty.term_type in
  ret

let valtype_match env vty1 vty2 =
  (* TODO *)
  try
    unify env (instance vty1) (instance vty2);
    true
  with _ -> false

let deftype_equiv env kind def1 def2 =
  let rec equiv ty1 ty2 =
    match scrape_types env ty1 ty2 with
    | Var v1, Var v2 -> v1 == v2
    | Typeconstr (path1, args1), Typeconstr (path2, args2) ->
        path1 = path2 && List.for_all2 equiv args1 args2
    | _, _ -> false
  in
  let subst = List.map2 (fun v1 v2 -> (v2, Var v1)) def1.params def2.params in
  equiv def1.defbody (subst_vars subst def2.defbody)

let kind_match env kind1 kind2 = kind1.arity = kind2.arity

let deftype_of_path path kind =
  let rec make_params n =
    if n <= 0 then [] else newvar () :: make_params (n - 1)
  in
  let params = make_params kind.arity in
  { params; defbody = Typeconstr (path, List.map (fun v -> Var v) params) }

let rec modtype_match env mty1 mty2 =
  match (mty1, mty2) with
  | Signature sig1, Signature sig2 ->
      let paired_components, subst = pair_signature_components sig1 sig2 in
      let ext_env = Env.add_signature sig1 env in
      List.iter (specification_match ext_env subst) paired_components
  | Functor_type (param1, arg1, res1), Functor_type (param2, arg2, res2) ->
      let subst = Subst.add param1 (Path.Pident param2) Subst.identity in
      let res1' = Subst.subst_modtype res1 subst in
      modtype_match env arg2 arg1;
      modtype_match (Env.add_module param2 arg2 env) res1' res2
  | _, _ -> error "module type mismatch"

and pair_signature_components sig1 sig2 =
  match sig2 with
  | [] -> ([], Subst.identity)
  | item2 :: rem2 ->
      let rec find_matching_component = function
        | [] -> error "unmatched signature component"
        | item1 :: rem1 -> (
            match (item1, item2) with
            | Value_sig (id1, _), Value_sig (id2, _)
              when Ident.name id1 = Ident.name id2 ->
                (id1, id2, item1)
            | Type_sig (id1, _), Type_sig (id2, _)
              when Ident.name id1 = Ident.name id2 ->
                (id1, id2, item1)
            | Module_sig (id1, _), Module_sig (id2, _)
              when Ident.name id1.txt = Ident.name id2.txt ->
                (id1.txt, id2.txt, item1)
            | _ -> find_matching_component rem1)
      in
      let id1, id2, item1 = find_matching_component sig1 in
      let pairs, subst = pair_signature_components sig1 rem2 in
      ((item1, item2) :: pairs, Subst.add id2 (Path.Pident id1) subst)

and specification_match env subst = function
  | Value_sig (_, vty1), Value_sig (_, vty2) ->
      if not (valtype_match env vty1 (Subst.subst_valtype vty2 subst)) then
        error "value components do not match"
  | Type_sig (id, decl1), Type_sig (_, decl2) ->
      if not (typedecl_match env id decl1 (Subst.subst_typedecl decl2 subst))
      then error "type components do not match"
  | Module_sig (_, mty1), Module_sig (_, mty2) ->
      modtype_match env mty1 (Subst.subst_modtype mty2 subst)

and typedecl_match env id decl1 decl2 =
  kind_match env decl1.kind decl2.kind
  &&
  match (decl1.manifest, decl2.manifest) with
  | _, None -> true
  | Some typ1, Some typ2 -> deftype_equiv env decl2.kind typ1 typ2
  | None, Some typ2 ->
      deftype_equiv env decl2.kind (deftype_of_path (Pident id) decl1.kind) typ2

let rec strengthen_modtype path mty =
  match mty with
  | Signature sg -> Signature (List.map (strengthen_spec path) sg)
  | Functor_type (_, _, _) -> mty

and strengthen_spec path item =
  match item with
  | Value_sig (id, vty) -> item
  | Type_sig (id, decl) ->
      let m =
        match decl.manifest with
        | None -> Some (deftype_of_path (Pdot (path, Ident.name id)) decl.kind)
        | Some ty -> Some ty
      in
      Type_sig (id, { kind = decl.kind; manifest = m })
  | Module_sig (id, mty) ->
      Module_sig (id, strengthen_modtype (Pdot (path, Ident.name id.txt)) mty)

let rec check_modtype env = function
  | Signature sg -> check_signature env [] sg
  | Functor_type (param, arg, res) ->
      check_modtype env arg;
      check_modtype (Env.add_module param arg env) res

and check_signature env seen = function
  | [] -> ()
  | Value_sig (id, vty) :: rem ->
      if List.mem (Ident.name id) seen then error "repeated value name";
      check_valtype env vty;
      check_signature env (Ident.name id :: seen) rem
  | Type_sig (id, decl) :: rem ->
      if List.mem (Ident.name id) seen then error "repeated type name";
      check_kind env decl.kind;
      (match decl.manifest with
      | None -> ()
      | Some typ ->
          if not (kind_match env (kind_deftype env typ) decl.kind) then
            error "kind mismatch in manifest type specification");
      check_signature (Env.add_type id decl env) (Ident.name id :: seen) rem
  | Module_sig (id, mty) :: rem ->
      if List.mem (Ident.name id.txt) seen then error "repeated module name";
      check_modtype env mty;
      check_signature (Env.add_module id.txt mty env) (Ident.name id.txt :: seen) rem

let rec type_module env mod_term : mod_term =
  let ret =
    match mod_term.mod_term_desc with
    | Longident path -> strengthen_modtype path (Env.find_module path env)
    | Structure str -> Signature (type_structure env [] str)
    | Functor (param, mty, body) ->
        check_modtype env mty;
        Functor_type
          ( param,
            mty,
            (type_module (Env.add_module param mty env) body).mod_term_type )
    | Apply (funct, arg) -> (
        match (type_module env funct).mod_term_type with
        | Functor_type (param, mty_param, mty_res) ->
            let mty_arg = (type_module env arg).mod_term_type in
            modtype_match env mty_arg mty_param;
            let path =
              match arg.mod_term_desc with
              | Longident path -> path
              | _ -> error "application of a functor to a non-path"
            in
            Subst.subst_modtype mty_res (Subst.add param path Subst.identity)
        | _ -> error "application of a non-functor")
    | Apply (funct, arg) -> error "application of a functor to a non-path"
    | Constraint (modl, mty) ->
        check_modtype env mty;
        modtype_match env (type_module env modl).mod_term_type mty;
        mty
  in
  { mod_term with mod_term_type = ret; mod_term_env = env }

and type_structure env seen = function
  | [] -> []
  | stritem :: rem ->
      stritem.before_env <- env;
      let sigitem, seen' = type_definition env seen stritem.definition_desc in
      let new_env = Env.add_spec sigitem env in
      stritem.after_env <- new_env;
      sigitem :: type_structure new_env seen' rem

and type_definition env seen = function
  | Value_str (id, term) ->
      if List.mem (Ident.name id.txt) seen then error "repeated value name";
      (Value_sig (id.txt, type_term env term), Ident.name id.txt :: seen)
  | Module_str (id, modl) ->
      if List.mem (Ident.name id.txt) seen then error "repeated module name";
      let mty = (type_module env modl).mod_term_type in
      modl.mod_term_type <- mty;
      (Module_sig (id, mty), Ident.name id.txt :: seen)
  | Type_str (id, kind, typ) ->
      if List.mem (Ident.name id) seen then error "repeated type name";
      check_kind env kind;
      if not (kind_match env (kind_deftype env typ) kind) then
        error "kind mismatch in type definition";
      (Type_sig (id, { kind; manifest = Some typ }), Ident.name id :: seen)
