open Types

let arrow_type arg_label t1 t2 = Tarrow (arg_label, t1, t2)
let ident_int = Ident.create "number"
let path_int = Path.Pident ident_int
let int_type = Typeconstr (path_int, [])
let ident_string = Ident.create "string"
let path_string = Path.Pident ident_string
let string_type = Typeconstr (path_string, [])
let ident_star = Ident.create "*"
let path_star = Path.Pident ident_star
let ident_option = Ident.create "option"
let path_option = Path.Pident ident_option
let option_type ty = Typeconstr (path_option, [ ty ])
let ident_jsx_element = Ident.create "jsx_element"
let path_jsx_element = Path.Pident ident_jsx_element
let jsx_element_type = Typeconstr (path_jsx_element, [])

let init_scope_env () =
  let init_scope = ref Scope.empty in
  let init_env = ref Env.empty in

  let enter_type id decl =
    init_scope := Scope.enter_type id !init_scope;
    init_env := Env.add_type id decl !init_env
  in

  let enter_val name ty =
    let id = Ident.create name in
    init_scope := Scope.enter_value id !init_scope;
    init_env := Env.add_value id ty !init_env
  in
  let ident_bool = Ident.create "bool" in
  let path_bool = Path.Pident ident_bool in
  let bool_type = Types.Typeconstr (path_bool, []) in
  (* enter_type ident_arrow
     { MLMod.kind = { ML.arity = 2 }; MLMod.manifest = None }; *)
  enter_type ident_star { kind = { arity = 2 }; manifest = None };
  enter_type ident_int { kind = { arity = 0 }; manifest = None };
  enter_type ident_string { kind = { arity = 0 }; manifest = None };
  enter_type ident_bool { kind = { arity = 0 }; manifest = None };
  enter_type ident_option { kind = { arity = 1 }; manifest = None };
  enter_type ident_jsx_element { kind = { arity = 0 }; manifest = None };
  enter_val "false" { quantif = []; body = bool_type };
  enter_val "true" { quantif = []; body = bool_type };
  List.iter
    (fun name ->
      enter_val name
        {
          quantif = [];
          body =
            Types.(
              arrow_type Nolabel int_type
                (arrow_type Nolabel int_type bool_type));
        })
    [ "=="; "<>"; "<"; "<="; ">"; ">=" ];
  List.iter
    (fun name ->
      enter_val name
        {
          quantif = [];
          body =
            Types.(
              arrow_type Nolabel int_type (arrow_type Nolabel int_type int_type));
        })
    [ "+"; "-"; "*"; "/" ];
  let alpha = Types.newvar () and beta = Types.newvar () in
  let talpha = Types.Var alpha and tbeta = Types.Var beta in
  enter_val ","
    {
      quantif = [ alpha; beta ];
      body =
        Types.(
          arrow_type Nolabel talpha
            (arrow_type Nolabel tbeta
               (Typeconstr (path_star, [ talpha; tbeta ]))));
    };
  enter_val "fst"
    {
      quantif = [ alpha; beta ];
      body =
        Types.(
          arrow_type Nolabel (Typeconstr (path_star, [ talpha; tbeta ])) talpha);
    };
  enter_val "snd"
    {
      quantif = [ alpha; beta ];
      body =
        Types.(
          arrow_type Nolabel (Typeconstr (path_star, [ talpha; tbeta ])) tbeta);
    };
  enter_val "conditional"
    {
      quantif = [ alpha ];
      body =
        Types.(
          arrow_type Nolabel bool_type
            (arrow_type Nolabel talpha (arrow_type Nolabel talpha talpha)));
    };

  enter_val "none" { quantif = [ alpha ]; body = option_type talpha };
  enter_val "some"
    {
      quantif = [ alpha ];
      body = Types.(arrow_type Nolabel talpha (option_type talpha));
    };

  enter_val "div"
    {
      quantif = [ alpha ];
      body =
        Types.(arrow_type (Optional "className") string_type jsx_element_type);
    };

  (!init_scope, !init_env)
