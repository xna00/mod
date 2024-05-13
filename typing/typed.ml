open Types
module Asttypes = Parsing.Asttypes

type term = {
  term_desc : term_desc;
  loc : Parsing.Location.t;
  mutable term_type : simple_type;
  mutable term_env : Env.t;
}
[@@deriving show { with_path = false }]

and term_desc =
  | Constant of Asttypes.constant (* integer constants *)
  | Longident of Path.t (* id or mod.mod...id *)
  | Function of Parsing.Asttypes.arg_label * Ident.t * term (* fun id -> expr *)
  | Apply of term * (Parsing.Asttypes.arg_label * term) list (* expr(expr) *)
  | Let of Ident.t Asttypes.loc * term * term (* let id = expr in expr *)
  | RecordEmpty
  | RecordExtend of string Asttypes.loc * term * term
  | RecordSelect of term * string Asttypes.loc
  | Variant of string * term
  | Case of
      term
      * (string * Ident.t Asttypes.loc * term) list
      * (Ident.t Asttypes.loc * term) option
  | Jsxelement of term * (Asttypes.arg_label * term) list
[@@deriving show { with_path = false }]

let generalize ty =
  let rec gen_vars vars ty =
    match typerepr ty with
    | Var v ->
        if v.level > !current_level && not (List.memq v vars) then v :: vars
        else vars
    | Typeconstr (path, tl) -> List.fold_left gen_vars vars tl
    | Tarrow (_, t1, t2) -> gen_vars (gen_vars vars t1) t2
    | Trecord row -> gen_vars vars row
    | TRextend (_, t, rest) ->
        let t_vars = gen_vars vars t in
        gen_vars t_vars rest
    | TRempty -> vars
    | Tvariant row -> gen_vars vars row
  in
  { quantif = gen_vars [] ty; body = ty }

type mod_term = {
  mod_term_desc : mod_term_desc;
  loc : Parsing.Location.t;
  mutable mod_term_type : mod_type;
  mutable mod_term_env : Env.t;
}

and mod_term_desc =
  | Longident of Path.t (* X or X.Y.Z *)
  | Structure of structure (* struct ... end *)
  | Functor of Ident.t * mod_type * mod_term (* functor (X: mty) mod *)
  | Apply of mod_term * mod_term (* mod1(mod2) *)
  | Constraint of mod_term * mod_type (* (mod : mty) *)
[@@deriving show { with_path = false }]

and structure = definition list [@@deriving show { with_path = false }]

and definition = {
  definition_desc : definition_desc;
  mutable before_env : Env.t;
  mutable after_env : Env.t;
}

and definition_desc =
  | Value_str of Ident.t Asttypes.loc * term (* let x = expr *)
  | Type_str of Ident.t * kind * def_type (* type t :: k = ty *)
  | Module_str of Ident.t * mod_term (* module X = mod *)
[@@deriving show { with_path = false }]

module Syntax = Parsing.Syntax
module Longident = Parsing.Longident

let variables = ref ([] : (string * type_variable) list)
let reset_type_variables () = variables := []

let find_type_variable name =
  try List.assoc name !variables
  with Not_found ->
    let v = newvar () in
    variables := (name, v) :: !variables;
    v

let rec map_simple_type sty =
  let ret =
    match sty.Syntax.ty_desc with
    | Syntax.TVar s -> Var (find_type_variable s)
    | Tarrow (l, t1, t2) -> Tarrow (l, map_simple_type t1, map_simple_type t2)
    | Typeconstr (lid, tyl) ->
        Typeconstr (Path.path_of_longident lid.txt, List.map map_simple_type tyl)
    | Trecord row -> Trecord (map_simple_type row)
    | Tvariant row -> Tvariant (map_simple_type row)
    | TRempty -> TRempty
    | TRextend (l, t1, t2) ->
        TRextend (l.txt, map_simple_type t1, map_simple_type t2)
  in
  ret

let rec expr_to_typed expr =
  let open Syntax in
  let ret =
    match expr.desc with
    | EConstant i ->
        Constant
          (match i with
          | Pconst_string _ -> Const_string
          | Pconst_number _ -> Const_number)
    | ELongident i -> Longident (Path.path_of_longident i.txt)
    | EFunction (arg_label, { txt; _ }, expr) ->
        Function (arg_label, Ident.create txt, expr_to_typed expr)
    | EApply (f, args) ->
        Apply
          (expr_to_typed f, List.map (fun (l, e) -> (l, expr_to_typed e)) args)
    | ELet (s, e1, e2) ->
        Let
          ( { txt = Ident.create s.txt; loc = s.loc },
            expr_to_typed e1,
            expr_to_typed e2 )
    | RecordEmpty -> RecordEmpty
    | RecordExtend (l, e1, e2) ->
        RecordExtend (l, expr_to_typed e1, expr_to_typed e2)
    | RecordSelect (e, l) -> RecordSelect (expr_to_typed e, l)
    | Variant (tag, e) -> Variant (tag, expr_to_typed e)
    | Case (e1, cases, o) ->
        Case
          ( expr_to_typed e1,
            List.map
              (fun (tag, (v : string Asttypes.loc), e) ->
                ( tag,
                  { Asttypes.txt = Ident.create v.txt; loc = v.loc },
                  expr_to_typed e ))
              cases,
            match o with
            | None -> None
            | Some (v, e) ->
                Some ({ txt = Ident.create v.txt; loc = v.loc }, expr_to_typed e)
          )
    | Ejsxelement (e, el) ->
        Jsxelement
          (expr_to_typed e, List.map (fun (l, e) -> (l, expr_to_typed e)) el)
  in
  {
    term_desc = ret;
    term_type = unknown ();
    loc = expr.loc;
    term_env = Env.empty;
  }

let rec mod_type_to_typed mty : mod_type =
  let open Syntax in
  match mty.mt_desc with
  | Functor_type (lid, mty1, mty2) ->
      Functor_type
        ( Ident.create (Longident.string_of_longident lid.txt),
          mod_type_to_typed mty1,
          mod_type_to_typed mty2 )
  | Signature signature -> Signature (List.map specification_to_typed signature)

and specification_to_typed spec : specification =
  match spec with
  | Syntax.Value_sig (lid, sty) ->
      reset_type_variables ();
      begin_def ();
      let ty = map_simple_type sty in
      end_def ();
      let ty = generalize ty in
      Value_sig (Ident.create (Longident.string_of_longident lid.txt), ty)
  | Type_sig (lid, decl) ->
      reset_type_variables ();
      let manifest : def_type option =
        match decl.manifest with
        | None -> None
        | Some def ->
            let params =
              List.map
                (fun (x : string Parsing.Location.loc) ->
                  find_type_variable x.txt)
                def.params
            in
            Some { params; defbody = map_simple_type def.defbody }
      in
      Type_sig
        ( Ident.create (Longident.string_of_longident lid.txt),
          { kind = { arity = decl.kind }; manifest } )
  | Module_sig (lid, mty) ->
      Module_sig
        ( Ident.create (Longident.string_of_longident lid.txt),
          mod_type_to_typed mty )

let rec mod_expr_to_typed me : mod_term =
  let ret =
    match me.Syntax.me_desc with
    | Syntax.MELongident lid -> Longident (Path.path_of_longident lid.txt)
    | Syntax.MEFunctor (lid, mty, me1) ->
        Functor
          ( Ident.create (Longident.string_of_longident lid.txt),
            mod_type_to_typed mty,
            mod_expr_to_typed me1 )
    | Syntax.MEApply (me1, me2) ->
        Apply (mod_expr_to_typed me1, mod_expr_to_typed me2)
    | Syntax.MEConstraint (me, mt) ->
        Constraint (mod_expr_to_typed me, mod_type_to_typed mt)
    | Syntax.MEStructure structure -> Structure (mod_structure structure)
  in

  {
    mod_term_desc = ret;
    loc = me.loc;
    mod_term_type = unknown_mod_type ();
    mod_term_env = Env.empty;
  }

and mod_structure defs =
  List.map (fun def -> mod_def_to_typed def.Syntax.definition) defs

and mod_def_to_typed def =
  let ret =
    match def with
    | Syntax.Value_str (lid, expr) ->
        Value_str
          ( {
              txt = Ident.create (Longident.string_of_shortident lid.txt);
              loc = lid.loc;
            },
            expr_to_typed expr )
    | Syntax.Type_str (lid, decl) ->
        reset_type_variables ();
        let manifest =
          match decl.manifest with
          | None -> failwith "Type_str"
          | Some def ->
              let params =
                List.map
                  (fun (x : string Parsing.Location.loc) ->
                    find_type_variable x.txt)
                  def.params
              in
              { params; defbody = map_simple_type def.defbody }
        in
        Type_str
          ( Ident.create (Longident.string_of_longident lid.txt),
            { arity = decl.kind },
            manifest )
    | Syntax.Module_str (lid, mt, me) ->
        Module_str
          ( Ident.create (Longident.string_of_longident lid.txt),
            match mt with
            | None -> mod_expr_to_typed me
            | Some mty ->
                print_endline (Syntax.show_mod_type mty);
                {
                  mod_term_desc =
                    Constraint (mod_expr_to_typed me, mod_type_to_typed mty);
                  loc = Parsing.Location.dummy_loc;
                  mod_term_type = unknown_mod_type ();
                  mod_term_env = Env.empty;
                } )
  in
  { definition_desc = ret; before_env = Env.empty; after_env = Env.empty }
