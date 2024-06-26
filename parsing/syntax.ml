open Asttypes

type constant = Pconst_string of string | Pconst_number of string
[@@deriving show { with_path = false }]

type expr = { desc : expr_desc; loc : Location.t }

and expr_desc =
  | EConstant of constant (* integer constants *)
  | ELongident of Longident.t loc (* id or mod.mod...id *)
  | EFunction of arg_label * string loc * expr (* fun id -> expr *)
  | EApply of expr * (arg_label * expr) list (* expr(expr) *)
  | ELet of string loc * expr * expr
  | RecordEmpty
  | RecordExtend of string loc * expr * expr
  | RecordSelect of expr * string loc
  | Variant of string * expr
  | Case of
      expr * (string * string loc * expr) list * (string loc * expr) option
  | Ejsxelement of expr * (arg_label * expr) list
[@@deriving show { with_path = false }]

let is_infix s =
  match s.[0] with
  | '*' | '/' | '+' | '-' | '>' | '<' | '=' -> true
  | _ -> false

let label_name l =
  match l with Nolabel -> "" | Labelled s -> s | Optional s -> s

let string_of_constant c =
  match c with Pconst_string s -> s | Pconst_number s -> s

let rec print_expr ?(parenthesis = false) ?(offset = 0) e =
  match e.desc with
  | EConstant c -> string_of_constant c
  | ELongident id ->
      Longident.infixify (String.concat "." (Longident.flat id.txt))
  | EFunction (l, { txt; _ }, body) ->
      let ls =
        match l with
        | Nolabel -> txt
        | Labelled s -> "~" ^ s
        | Optional s -> "?" ^ s
      in
      let b = print_expr ~offset body in
      if parenthesis then Printf.sprintf "(fun %s -> %s)" ls b
      else Printf.sprintf "fun %s -> %s" ls b
  | EApply (f, args) ->
      let fs =
        match f with
        | { desc = ELongident { txt = Longident.Lident s; _ }; _ }
          when is_infix s ->
            s
        | _ -> print_expr ~parenthesis:true ~offset f
      in
      let argss =
        List.map
          (fun (l, e) ->
            (match l with
            | Nolabel -> ""
            | Labelled s -> "~" ^ s ^ ":"
            | Optional s -> "?" ^ s ^ ":")
            ^ print_expr ~offset ~parenthesis:true e)
          args
      in

      if is_infix fs then List.nth argss 0 ^ " " ^ fs ^ " " ^ List.nth argss 1
      else fs ^ " " ^ String.concat " '" argss
  | ELet ({ txt; _ }, e1, body) ->
      print_endline ("txt:" ^ txt);
      Printf.sprintf "let %s = %s in %s" (Longident.infixify txt)
        (print_expr ~offset e1) (print_expr ~offset body)
  | RecordEmpty -> "{}"
  | RecordExtend _ as r ->
      let rec loop r =
        match r with
        | RecordExtend (f, e1, e2) ->
            let rs, res = loop e2.desc in
            ((f, e1) :: rs, res)
        | _ -> ([], r)
      in
      let fs = loop r in
      Printf.sprintf "{ %s%s }"
        (String.concat "; "
           (List.map
              (fun (f, e) -> f.txt ^ " = " ^ print_expr ~offset e)
              (fst fs)))
        (match snd fs with
        | RecordEmpty -> ""
        | e -> " | " ^ print_expr ~offset { desc = e; loc = Location.dummy_loc })
  | RecordSelect (e, f) -> print_expr ~offset e ^ "." ^ f.txt
  | Variant (tag, e) -> "`" ^ tag ^ " " ^ print_expr ~offset e
  | Case (e1, cases, op) ->
      print_endline ("offset" ^ string_of_int offset);
      Printf.sprintf "\n%smatch %s with\n%s%s" (String.make offset ' ')
        (print_expr ~offset e1)
        (String.concat "\n"
           (ListLabels.map cases ~f:(fun (tag, v, e) ->
                String.make offset ' ' ^ "| `" ^ tag ^ " " ^ v.txt ^ " -> "
                ^ print_expr ~offset e)))
        (match op with
        | None -> ""
        | Some (v, e) ->
            "\n" ^ String.make offset ' ' ^ "| " ^ v.txt ^ " -> "
            ^ print_expr ~offset e)
  | Ejsxelement (e, el) ->
      let es = print_expr e in
      let els =
        String.concat ""
          (List.map
             (fun (l, e) -> " " ^ label_name l ^ "={" ^ print_expr e ^ "}")
             el)
      in
      Printf.sprintf "<%s%s></%s>" es els es

type simple_type = { ty_desc : simple_type_desc; loc : Location.t }

and simple_type_desc =
  | TVar of string (* 'a, 'b *)
  | Tarrow of arg_label * simple_type * simple_type
  | Typeconstr of Longident.t loc * simple_type list
  | TRempty
  | TRextend of string loc * simple_type * row
  | Trecord of row
  | Tvariant of row
[@@deriving show { with_path = false }]

and row = simple_type [@@deriving show { with_path = false }]

let rec print_simple_type ?(parenthesis = false) ty =
  match ty.ty_desc with
  | TVar s -> "'" ^ s
  | Tarrow (l, t1, t2) ->
      let ls =
        match l with
        | Nolabel -> ""
        | Labelled s -> s ^ ":"
        | Optional s -> "?" ^ s ^ ":"
      in
      let ty1s = print_simple_type ~parenthesis:true t1 in
      let ty2s = print_simple_type t2 in
      if parenthesis then Printf.sprintf "(%s%s -> %s)" ls ty1s ty2s
      else Printf.sprintf "%s%s -> %s" ls ty1s ty2s
  | Typeconstr (p, args) -> (
      let argss = List.map print_simple_type args |> String.concat ", " in
      match p.txt with
      | Longident.Lident s when s = "*" ->
          Printf.sprintf "%s * %s"
            (print_simple_type ~parenthesis:true (List.nth args 0))
            (print_simple_type ~parenthesis:true (List.nth args 1))
      | _ ->
          let ps = String.concat "." (Longident.flat p.txt) in
          if List.length args > 1 then Printf.sprintf "(%s) %s" argss ps
          else if List.length args = 1 then Printf.sprintf "%s %s" argss ps
          else ps)
  | Trecord row ->
      let rec loop row =
        match row with
        | TRextend (f, ty, tyr) ->
            let rs, rem = loop tyr.ty_desc in
            ((f, ty) :: rs, rem)
        | TVar ".." | TRempty -> ([], row)
        | _ -> assert false
      in
      let fs, res = loop row.ty_desc in
      if List.length fs = 0 && res = TRempty then "< >"
      else
        Printf.sprintf "< %s%s >"
          (String.concat "; "
             (List.map (fun (f, ty) -> f.txt ^ " : " ^ print_simple_type ty) fs))
          (match res with
          | TVar ".." -> "; .."
          | TRempty -> ""
          | _ -> assert false)
  | TRextend _ | TRempty -> assert false
  | Tvariant _ -> failwith "TODO"

(* and row = simple_type [@@deriving show { with_path = false }] *)

type def_type = {
  params : string loc list; (* list of parameters *)
  defbody : simple_type;
}
[@@deriving show { with_path = false }]
(* body of type definition *)

type type_decl = { kind : int; manifest : def_type option }
[@@deriving show { with_path = false }]

type mod_type = { mt_desc : mod_type_desc; loc : Location.t }
[@@deriving show { with_path = false }]

and mod_type_desc =
  | Signature of signature
  | Functor_type of Longident.t loc * mod_type * mod_type
[@@deriving show { with_path = false }]

and signature = specification list [@@deriving show { with_path = false }]

and specification =
  | Value_sig of Longident.t loc * simple_type
  | Type_sig of Longident.t loc * type_decl
  | Module_sig of Longident.t loc * mod_type
[@@deriving show { with_path = false }]

type mod_expr = { me_desc : mod_expr_desc; loc : Location.t }
[@@deriving show { with_path = false }]

and mod_expr_desc =
  | MELongident of Longident.t loc
  | MEStructure of structure
  | MEFunctor of Longident.t loc * mod_type * mod_expr
  | MEApply of mod_expr * mod_expr
  | MEConstraint of mod_expr * mod_type
[@@deriving show { with_path = false }]

and structure = definition_comment list [@@deriving show { with_path = false }]

and definition_comment = {
  definition : definition;
  prev_comments : string list;
}

and definition =
  | Value_str of Longident.t loc * expr
  | Type_str of Longident.t loc * type_decl
  | Module_str of Longident.t loc * mod_type option * mod_expr
[@@deriving show { with_path = false }]

let print_comment c = "(*" ^ c ^ "*)"

let print_type_decl id decl =
  "type "
  ^ (if decl.kind = 0 then ""
     else
       let paramss =
         String.concat ", "
           (List.map (fun x -> "'" ^ x.txt) (Option.get decl.manifest).params)
       in
       if decl.kind = 1 then paramss else "(" ^ paramss ^ ")")
  ^ Longident.string_of_longident id.txt
  ^
  match decl.manifest with
  | None -> ""
  | Some ty -> " = " ^ print_simple_type ty.defbody

let rec print_mod_type ?(offset = 0) mod_type =
  match mod_type.mt_desc with
  | Signature sig_ ->
      Printf.sprintf "sig\n%s\n%send"
        (String.concat "\n"
           (List.map (fun x -> print_specification ~offset:(offset + 2) x) sig_))
        (String.make offset ' ')
  | Functor_type (uid, mty1, mty2) ->
      Printf.sprintf "functor(%s: %s) %s"
        (Longident.string_of_longident uid.txt)
        (print_mod_type mty1) (print_mod_type mty2)

and print_specification ~offset spec =
  let ret =
    match spec with
    | Value_sig (id, e) ->
        Printf.sprintf "val %s: %s"
          (Longident.string_of_longident id.txt)
          (print_simple_type e)
    | Type_sig (id, decl) -> print_type_decl id decl
    | Module_sig (id, mty) ->
        Printf.sprintf "module %s: %s"
          (Longident.string_of_longident id.txt)
          (print_mod_type ~offset mty)
  in
  String.make offset ' ' ^ ret

let rec print_mod_expr ?(offset = 0) mod_expr =
  match mod_expr.me_desc with
  | MELongident { txt; _ } -> Longident.string_of_longident txt
  | MEStructure str ->
      Printf.sprintf "struct\n%s\n%send"
        (String.concat "\n"
           (List.map (fun x -> print_definition ~offset:(offset + 2) x) str))
        (String.make offset ' ')
  | MEFunctor (id, mod_ty, mod_e) ->
      Printf.sprintf "functor(%s: %s) = %s"
        (Longident.string_of_longident id.txt)
        (print_mod_type mod_ty) (print_mod_expr mod_e)
  | MEApply (e1, e2) ->
      Printf.sprintf "%s(%s)" (print_mod_expr e1) (print_mod_expr e2)
  | MEConstraint (e, t) ->
      Printf.sprintf "(%s: %s)" (print_mod_expr e) (print_mod_type t)

and print_definition ~offset str =
  print_endline ("print_definition" ^ string_of_int offset);
  let ret =
    match str.definition with
    | Value_str (id, e) ->
        Printf.sprintf "let %s = %s"
          (Longident.string_of_longident id.txt)
          (print_expr ~offset e)
    | Type_str (id, decl) -> print_type_decl id decl
    | Module_str (id, mod_ty_opt, mod_e) -> (
        match mod_ty_opt with
        | None ->
            Printf.sprintf "module %s = %s"
              (Longident.string_of_longident id.txt)
              (print_mod_expr ~offset mod_e)
        | Some mty ->
            Printf.sprintf "module %s: %s = %s"
              (Longident.string_of_longident id.txt)
              (print_mod_type ~offset mty)
              (print_mod_expr ~offset mod_e))
  in
  String.concat "\n"
    (List.map
       (fun c -> String.make offset ' ' ^ print_comment c)
       str.prev_comments
    @ [ String.make offset ' ' ^ ret ])

let print_definition_list str =
  String.concat "\n" (List.map (fun x -> print_definition ~offset:0 x) str)
