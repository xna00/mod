open Syntax
open Parser_base
open Token
open Asttypes
open Parser_jsx

let rec expr parser =
  let loc_start = parser.start_pos in
  let desc =
    match parser.token with
    | LET ->
        advance parser;
        let is_rec = optional REC in
        let id = lident parser in
        let e1 = valbind1 EQUAL parser in
        expect IN parser;
        let body = expr parser in
        ELet (id, e1, body)
    | FUN ->
        advance parser;
        (valbind1 ARROW parser).desc
    | MATCH ->
        advance parser;
        let e1 = expr parser in
        expect WITH parser;
        let _ = optional BAR parser in
        let cases =
          sepby
            (fun p ->
              expect BACKQOUTE p;
              let uid = uident p in
              let lid = lident p in
              expect ARROW p;
              let e = expr p in
              (uid.txt, lid, e))
            (fun x -> x = BACKQOUTE)
            (fun x -> x = BAR)
            parser
        in
        let op =
          match parser.token with
          | LIDENT _ ->
              let lid = lident parser in
              expect ARROW parser;
              let e = expr parser in
              Some (lid, e)
          | _ -> None
        in
        Case (e1, cases, op)
    | LESS ->
        let { desc; _ } = jsx parser in
        desc
    | _ ->
        let { desc; _ } = op_expr parser in
        desc
  in
  let loc_end = parser.prev_end_pos in
  { desc; loc = { loc_start; loc_end } }

and valbind1 token p =
  if p.token = token then (
    advance p;
    expr p)
  else
    let loc_start = p.start_pos in
    let label_f = arg_label_fun p in
    let lid = lident p in
    let body = valbind1 token p in
    let loc_end = p.prev_end_pos in
    {
      desc = EFunction (label_f lid.txt, lid, body);
      loc = { loc_start; loc_end };
    }

and op_expr p =
  let rec expr_bp min_bp =
    let lhs = apply_expr p in
    let rec loop (lhs : expr) =
      if is_infix p.token then
        let s = string_of_infix p.token in
        let op =
          {
            desc =
              ELongident { txt = Longident.Lident s; loc = Location.dummy_loc };
            loc = { loc_start = p.start_pos; loc_end = p.end_pos };
          }
        in
        let prec = precedence p.token in
        if prec < min_bp then lhs
        else (
          advance p;
          let rhs = expr_bp (prec + 1) in
          let e =
            {
              desc = EApply (op, [ (Nolabel, lhs); (Nolabel, rhs) ]);
              loc = { loc_start = lhs.loc.loc_start; loc_end = rhs.loc.loc_end };
            }
          in
          loop e)
      else lhs
    in
    loop lhs
  in
  expr_bp 0

and apply_expr p =
  let f = select_expr p in
  let rec loop () =
    match p.token with
    | TILDE -> (
        advance p;
        let lid = lident p in
        expect COLON p;
        match p.token with
        | NUMBER _ | LIDENT _ | UIDENT _ | LBRACE | LPARENT | STRING _ ->
            let f = select_expr p in
            (Labelled lid.txt, f) :: loop ()
        | _ ->
            report p;
            raise Parse_error)
    | _ -> (
        match p.token with
        | NUMBER _ | LIDENT _ | UIDENT _ | LBRACE | LPARENT ->
            let f = select_expr p in
            (Nolabel, f) :: loop ()
        | _ -> [])
  in

  let args = loop () in
  if List.length args = 0 then f
  else
    {
      desc = EApply (f, args);
      loc =
        {
          loc_start = f.loc.loc_start;
          loc_end = (snd (List.nth args (List.length args - 1))).loc.loc_end;
        };
    }

and select_expr p =
  let atom = atom_expr p in
  match p.token with
  | DOT ->
      let fs =
        many1
          (fun p ->
            expect DOT p;
            lident p)
          (fun x -> x = DOT)
          p
      in
      List.fold_left
        (fun acc f ->
          {
            desc = RecordSelect (acc, f);
            loc = { loc_start = acc.loc.loc_start; loc_end = f.loc.loc_end };
          })
        atom fs
  | _ -> atom

and atom_expr p =
  let loc_start = p.start_pos in
  let desc =
    match p.token with
    | NUMBER n ->
        advance p;
        EConstant (Pconst_number n)
    | STRING s ->
        advance p;
        EConstant (Pconst_string s)
    | LIDENT s ->
        advance p;
        ELongident { txt = Longident.Lident s; loc = Location.dummy_loc }
    | UIDENT _ ->
        let lid = longident_end_lident p in
        ELongident lid
    | BACKQOUTE ->
        advance p;
        let uid = uident p in
        let e = atom_expr p in
        Variant (uid.txt, e)
    | LPARENT ->
        let infix =
          lookahead p (fun p ->
              advance p;
              is_infix p.token)
        in
        if infix then ELongident (Longident.ident_of_string (lident p))
        else (
          advance p;
          let e = expr p in
          expect RPARENT p;
          e.desc)
    | LBRACE ->
        advance p;
        let fields =
          sepby
            (fun p ->
              let lid = lident p in
              expect EQUAL p;
              let e = expr p in
              (lid, e))
            (function LIDENT _ -> true | _ -> false)
            (fun x -> x = SEMICOLON)
            p
        in
        let ext =
          match p.token with
          | BAR ->
              advance p;
              expr p
          | _ -> { desc = RecordEmpty; loc = Location.dummy_loc }
        in
        expect RBRACE p;
        (List.fold_left
           (fun acc (f, e) ->
             { desc = RecordExtend (f, e, acc); loc = Location.dummy_loc })
           ext fields)
          .desc
    | _ ->
        report p;
        raise Parse_error
  in
  let loc_end = p.prev_end_pos in
  { desc; loc = { loc_start; loc_end } }

let tvar p =
  expect QUOTE p;
  lident p

let rec simple_type p : simple_type =
  let mems =
    List.rev
      (sepby1
         (fun p ->
           let label =
             match p.token with
             | QUESTION ->
                 advance p;
                 let lid = lident p in
                 expect COLON p;
                 Optional lid.txt
             | _ ->
                 let labelled =
                   lookahead p (fun p ->
                       advance p;
                       p.token = COLON)
                 in
                 if labelled then (
                   let lid = lident p in
                   expect COLON p;
                   Labelled lid.txt)
                 else Nolabel
           in
           let sty = tuple_type p in
           (label, sty))
         (fun x -> x = ARROW)
         p)
  in
  List.fold_left
    (fun acc (l, sty) ->
      {
        ty_desc = Tarrow (l, sty, acc);
        loc = { loc_start = sty.loc.loc_start; loc_end = acc.loc.loc_end };
      })
    (snd (List.hd mems))
    (List.tl mems)

and tuple_type p =
  let mems = List.rev (sepby1 apply_type (fun x -> x = STAR) p) in
  List.fold_left
    (fun acc sty ->
      {
        ty_desc =
          Typeconstr
            ( { txt = Longident.Lident "*"; loc = Location.dummy_loc },
              [ sty; acc ] );
        loc = { loc_start = sty.loc.loc_start; loc_end = acc.loc.loc_end };
      })
    (List.hd mems) (List.tl mems)

and apply_type p =
  let ty = atom_type p in
  let rec loop () =
    match p.token with
    | LIDENT _ | UIDENT _ ->
        let ty = longident_end_lident p in
        ty :: loop ()
    | _ -> []
  in
  let paths = loop () in
  List.fold_left
    (fun acc p ->
      {
        ty_desc = Typeconstr (p, [ acc ]);
        loc = { loc_start = acc.loc.loc_start; loc_end = p.loc.loc_end };
      })
    ty paths

and atom_type p =
  let loc_start = p.start_pos in
  let ty =
    match p.token with
    | QUOTE ->
        let { txt } = tvar p in
        TVar txt
    | LPARENT ->
        advance p;
        let simple_tys = sepby1 simple_type (fun t -> t = COMMA) p in
        expect RPARENT p;
        let ty_desc =
          match p.token with
          | LIDENT _ | UIDENT _ ->
              let id = longident_end_lident p in
              Typeconstr (id, simple_tys)
          | _ when List.length simple_tys = 1 -> (List.hd simple_tys).ty_desc
          | _ ->
              report p;
              raise Parse_error
        in
        ty_desc
    | LIDENT _ | UIDENT _ ->
        let id = longident_end_lident p in
        Typeconstr (id, [])
    | LESS ->
        advance p;
        let fields =
          sepby
            (fun p ->
              let lid = lident p in
              expect COLON p;
              let e = simple_type p in
              (lid, e))
            (function LIDENT _ -> true | _ -> false)
            (fun x -> x = SEMICOLON)
            p
        in
        print_token p.token;
        let ext =
          match p.token with
          | DOTDOT ->
              let loc_start = p.start_pos in
              advance p;
              let loc_end = p.end_pos in
              { ty_desc = TVar ".."; loc = { loc_start; loc_end } }
          | _ -> { ty_desc = TRempty; loc = Location.dummy_loc }
        in
        expect GREATER p;
        let row =
          (List.fold_right
             (fun (f, e) acc ->
               { ty_desc = TRextend (f, e, acc); loc = Location.dummy_loc })
             fields ext)
            .ty_desc
        in
        Trecord { ty_desc = row; loc = Location.dummy_loc }
    | LBRACKET | LBRACKETGREATER ->
        let op = p.token = LBRACKETGREATER in
        let ext =
          {
            ty_desc = (if op then TVar ".." else TRempty);
            loc = Location.dummy_loc;
          }
        in
        advance p;
        let fields =
          sepby1
            (fun p ->
              expect BACKQOUTE p;
              let uid = uident p in
              expect OF p;
              let ty = simple_type p in
              (uid, ty))
            (fun x -> x = BAR)
            p
        in
        expect RBRACKET p;
        let row =
          (List.fold_right
             (fun (f, e) acc ->
               { ty_desc = TRextend (f, e, acc); loc = Location.dummy_loc })
             fields ext)
            .ty_desc
        in
        Tvariant { ty_desc = row; loc = Location.dummy_loc }
    | _ ->
        report p;
        raise Parse_error
  in

  let loc_end = p.prev_end_pos in
  { ty_desc = ty; loc = { loc_start; loc_end } }

let rec skip_to pred p =
  if pred p.token then ()
  else (
    advance p;
    skip_to pred p)

let type_decl p =
  advance p;
  let params =
    match p.token with
    | QUOTE -> [ tvar p ]
    | LPARENT ->
        advance p;
        let ps = sepby1 tvar (fun x -> x = COMMA) p in
        expect RPARENT p;
        ps
    | _ -> []
  in
  let lid = lident p in
  let def =
    match p.token with
    | EQUAL ->
        advance p;
        let body = simple_type p in
        {
          kind = List.length params;
          manifest = Some { params; defbody = body };
        }
    | _ -> { kind = List.length params; manifest = None }
  in
  (lid, def)

let rec mod_type p =
  let loc_start = p.start_pos in
  let desc =
    match p.token with
    | SIG ->
        advance p;
        let sig_ = signature p in
        expect END p;
        Signature sig_
    | FUNCTOR ->
        advance p;
        expect LPARENT p;
        let uid = uident p in
        expect COLON p;
        let pmty = mod_type p in
        expect RPARENT p;
        let rmty = mod_type p in
        Functor_type (Longident.ident_of_string uid, pmty, rmty)
    | LPARENT ->
        advance p;
        let mty = mod_type p in
        expect RPARENT p;
        mty.mt_desc
    | _ ->
        report p;
        raise Parse_error
  in
  let loc_end = p.prev_end_pos in
  let ret = { mt_desc = desc; loc = { loc_start; loc_end } } in
  ret

and signature p =
  let rec loop () =
    if p.token = END || p.token = EOF then []
    else
      let d =
        try Some (spec p)
        with Parse_error ->
          skip_to
            (function VAL | TYPE | MODULE | END | EOF -> true | _ -> false)
            p;
          None
      in
      d :: loop ()
  in
  List.filter_map (fun x -> x) (loop ())

and spec p =
  match p.token with
  | VAL ->
      advance p;
      let lid = lident p in
      expect COLON p;
      let ty = simple_type p in
      Value_sig (Longident.ident_of_string lid, ty)
  | TYPE ->
      let lid, def = type_decl p in
      Type_sig (Longident.ident_of_string lid, def)
  | MODULE ->
      advance p;
      let uid = uident p in
      expect COLON p;
      let mty = mod_type p in
      Module_sig (Longident.ident_of_string uid, mty)
  | _ ->
      report p;
      raise Parse_error

let rec mod_expr p =
  let atom = atom_mod_expr p in
  let args =
    many
      (fun p ->
        expect LPARENT p;
        let mod_e = mod_expr p in
        expect RPARENT p;
        mod_e)
      (fun x -> x = LPARENT)
      p
  in
  List.fold_left
    (fun acc m ->
      {
        me_desc = MEApply (acc, m);
        loc = { loc_start = acc.loc.loc_start; loc_end = acc.loc.loc_end };
      })
    atom args

and atom_mod_expr p =
  let loc_start = p.start_pos in
  let e =
    match p.token with
    | STRUCT ->
        advance p;
        let str = structure p in
        expect END p;
        MEStructure str
    | FUNCTOR ->
        advance p;
        expect LPARENT p;
        let uid = uident p in
        expect COLON p;
        let mod_ty = mod_type p in
        expect RPARENT p;
        let mod_e = mod_expr p in
        MEFunctor (Longident.ident_of_string uid, mod_ty, mod_e)
    | UIDENT _ ->
        let path = longident_end_uident p in
        MELongident path
    | LPARENT ->
        advance p;
        let mod_e = mod_expr p in
        let ret =
          if p.token = COLON then (
            advance p;
            let mod_ty = mod_type p in
            MEConstraint (mod_e, mod_ty))
          else mod_e.me_desc
        in
        expect RPARENT p;
        ret
    | _ ->
        report p;
        raise Parse_error
  in

  let loc_end = p.prev_end_pos in
  { me_desc = e; loc = { loc_start; loc_end } }

and structure p =
  let rec loop () =
    if p.token = END || p.token = EOF then []
    else
      let d =
        try Some (definition p)
        with Parse_error ->
          skip_to
            (function LET | TYPE | MODULE | END | EOF -> true | _ -> false)
            p;
          None
      in
      d :: loop ()
  in
  List.filter_map (fun x -> x) (loop ())

and definition p =
  let ret =
    match p.token with
    | LET ->
        advance p;
        let lid = lident p in
        let e = valbind1 EQUAL p in
        Value_str (Longident.ident_of_string lid, e)
    | TYPE ->
        let lid, def = type_decl p in
        Type_str (Longident.ident_of_string lid, def)
    | MODULE ->
        advance p;
        let lid = uident p in
        let mty =
          match p.token with
          | COLON ->
              advance p;
              Some (mod_type p)
          | _ -> None
        in
        expect EQUAL p;
        let e = mod_expr p in
        Module_str (Longident.ident_of_string lid, mty, e)
    | _ ->
        report p;
        raise Parse_error
  in
  let prev_comments = p.scanner.comments in
  p.scanner.comments <- [];
  { definition = ret; prev_comments }

let _ = expr_ref := expr

let parse p =
  advance p;
  let loc_start = p.start_pos in
  let str = structure p in
  let loc_end = p.prev_end_pos in
  { me_desc = MEStructure str; loc = { loc_start; loc_end } }
