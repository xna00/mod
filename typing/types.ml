type simple_type =
  | Var of type_variable (* 'a, 'b *)
  | Tarrow of Parsing.Asttypes.arg_label * simple_type * simple_type
  | Typeconstr of Path.t * simple_type list
(* constructed type *)
[@@deriving show { with_path = false }]

and type_variable = {
  mutable repres : simple_type option; (* representative, for union-find *)
  mutable level : int;
}
[@@deriving show { with_path = false }]

and type_variable_list = type_variable list
[@@deriving show { with_path = false }]

type val_type = {
  quantif : type_variable list; (* quantified variables *)
  body : simple_type;
}
[@@deriving show { with_path = false }]
(* body of type scheme *)

type def_type = {
  params : type_variable list; (* list of parameters *)
  defbody : simple_type;
}
[@@deriving show { with_path = false }]
(* body of type definition *)

type kind = { arity : int } [@@deriving show { with_path = false }]

type type_decl = { kind : kind; manifest : def_type option }
[@@deriving show { with_path = false }]

type mod_type =
  | Signature of signature (* sig ... end *)
  | Functor_type of Ident.t * mod_type * mod_type
[@@deriving show { with_path = false }]
(* functor(X: mty) mty *)

and signature = specification list [@@deriving show { with_path = false }]

and specification =
  | Value_sig of Ident.t * val_type (* val x: ty *)
  | Type_sig of Ident.t * type_decl (* type t :: k [= ty] *)
  | Module_sig of Ident.t * mod_type
(* module X: mty *) [@@deriving show { with_path = false }]

let unknown_mod_type () = Signature []

let rec typerepr = function
  | Var ({ repres = Some ty } as var) ->
      let r = typerepr ty in
      var.repres <- Some r;
      r
  | ty -> ty

let current_level = ref 0
let begin_def () = incr current_level
let end_def () = decr current_level
let newvar () = { repres = None; level = !current_level }
let unknown () = Var (newvar ())
let trivial_scheme ty = { quantif = []; body = ty }

let var_string_of_int ?(quantify = true) i =
  "'"
  ^ (if quantify then "" else "_")
  ^ String.make 1 (Char.chr (Char.code 'a' + i))

let rec print_val_type vars ?(parent = false) val_type =
  match typerepr val_type.body with
  | Var ({ repres = None; _ } as var) ->
      let vars =
        if List.mem_assq var vars then vars
        else
          ( var,
            var_string_of_int
              ~quantify:(List.memq var val_type.quantif)
              (List.length vars) )
          :: vars
      in
      (vars, List.assq var vars)
  | Var { repres = Some _; _ } -> assert false
  | Tarrow (l, t1, t2) ->
      let ls =
        match l with
        | Nolabel -> ""
        | Labelled s -> s ^ ":"
        | Optional s -> "?" ^ s ^ ":"
      in
      print_endline (show_type_variable_list (List.map fst vars));
      let vars, t1s =
        print_val_type vars ~parent:true
          { quantif = val_type.quantif; body = t1 }
      in
      let vars, t2s =
        print_val_type vars { quantif = val_type.quantif; body = t1 }
      in
      ( vars,
        (if parent then Printf.sprintf "(%s%s -> %s)"
         else Printf.sprintf "%s%s -> %s")
          ls t1s t2s )
  | Typeconstr (p, tl) ->
      let ps = Path.string_of_path p in
      let len = List.length tl in
      if len = 0 then (vars, ps)
      else if len = 1 then
        let vars, ret =
          print_val_type vars
            { quantif = val_type.quantif; body = List.nth tl 0 }
        in
        (vars, ret ^ ps)
      else
        ( vars,
          Printf.sprintf "(%s) %s"
            (String.concat ", "
               (snd
                  (List.fold_left
                     (fun (vars, sl) t ->
                       let vars, s =
                         print_val_type vars
                           { quantif = val_type.quantif; body = t }
                       in
                       (vars, sl @ [ s ]))
                     (vars, []) tl)))
            ps )

let print_val_type vars ?(parent = false) val_type =
  snd (print_val_type vars ~parent val_type)

let rec print_mod_type ?(offset = 0) mod_type =
  (* print_endline (show_mod_type mod_type); *)
  match mod_type with
  | Functor_type (id, mty1, mty2) ->
      Printf.sprintf "functor(%s: %s) %s" (Ident.name id) (print_mod_type mty1)
        (print_mod_type mty2)
  | Signature sig_ ->
      Printf.sprintf "sig\n%s\n%send"
        (String.concat "\n"
           (List.map (fun x -> print_specification ~offset:(offset + 2) x) sig_))
        (String.make offset ' ')

and print_specification ~offset spec =
  let ret =
    match spec with
    | Value_sig (id, e) ->
        Printf.sprintf "val %s: %s" (Ident.name id) (print_val_type [] e)
    | Type_sig (id, decl) -> (
        let len = decl.kind.arity in
        match decl.manifest with
        | None ->
            Printf.sprintf "type %s%s"
              (String.concat ""
                 (List.map
                    (fun n -> var_string_of_int n ^ " ")
                    (List.init len (fun x -> x))))
              (Ident.name id)
        | Some body ->
            let vars =
              List.mapi (fun i var -> (var, var_string_of_int i)) body.params
            in
            let paramss = String.concat ", " (List.map snd vars) in
            let bodys = print_val_type vars (trivial_scheme body.defbody) in
            if len = 0 then Printf.sprintf "type %s = %s" (Ident.name id) bodys
            else if len = 1 then
              Printf.sprintf "type %s %s = %s" paramss (Ident.name id) bodys
            else
              Printf.sprintf "type (%s) %s = %s" paramss (Ident.name id) bodys)
    | Module_sig (id, mty) ->
        Printf.sprintf "module %s: %s" (Ident.name id)
          (print_mod_type ~offset mty)
  in
  String.make offset ' ' ^ ret
