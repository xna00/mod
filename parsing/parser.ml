open Syntax
open Asttypes
open Token

type diagnostic = {
  start_pos : Location.position;
  end_pos : Location.position;
  msg : string;
}
[@@deriving show { with_path = false }]

type t = {
  mutable scanner : Lexer.t;
  mutable token : Token.t;
  mutable start_pos : Lexing.position;
  mutable end_pos : Lexing.position;
  mutable prev_end_pos : Lexing.position;
  mutable diagnostics : diagnostic list;
}

exception Parse_error

let err ~start_pos ~end_pos parser msg =
  parser.diagnostics <- { start_pos; end_pos; msg } :: parser.diagnostics

let report p = err ~start_pos:p.start_pos ~end_pos:p.end_pos p "Parse fail"

let make filename src =
  let scanner = Lexer.make filename src in
  let parser =
    {
      scanner;
      token = EOF;
      start_pos = Lexing.dummy_pos;
      end_pos = Lexing.dummy_pos;
      prev_end_pos = Lexing.dummy_pos;
      diagnostics = [];
    }
  in
  scanner.err <- err parser;
  parser

let make_loc p = Location.{ loc_start = p.start_pos; loc_end = p.end_pos }

let advance parser =
  let start_pos, end_pos, token = Lexer.scan parser.scanner in
  parser.prev_end_pos <- parser.end_pos;
  parser.token <- token;
  parser.start_pos <- start_pos;
  parser.end_pos <- end_pos

let expect token p =
  if p.token = token then advance p
  else (
    err ~start_pos:p.start_pos ~end_pos:p.end_pos p
      ("Expect a " ^ Token.show token);
    raise Parse_error)

let optional token p =
  if p.token = token then (
    advance p;
    true)
  else false

let lookahead p callback =
  let ch = p.scanner.ch in
  let err = p.scanner.err in
  let offset = p.scanner.offset in
  let lnum = p.scanner.lnum in
  let col = p.scanner.col in
  let comments = p.scanner.comments in
  let token = p.token in
  let start_pos = p.start_pos in
  let end_pos = p.end_pos in
  let prev_end_pos = p.prev_end_pos in
  let diagnostics = p.diagnostics in

  let res = callback p in

  p.scanner.ch <- ch;
  p.scanner.err <- err;
  p.scanner.offset <- offset;
  p.scanner.lnum <- lnum;
  p.scanner.col <- col;
  p.scanner.comments <- comments;
  p.token <- token;
  p.start_pos <- start_pos;
  p.end_pos <- end_pos;
  p.prev_end_pos <- prev_end_pos;
  p.diagnostics <- diagnostics;
  res

let rec sepby1 p1 sep p =
  let first = p1 p in
  if sep p.token then (
    advance p;
    first :: sepby1 p1 sep p)
  else [ first ]

let rec many1 p1 pred p =
  let first = p1 p in
  if pred p.token then first :: many1 p1 pred p else [ first ]

let rec many p1 pred p =
  if pred p.token then
    let first = p1 p in
    first :: many p1 pred p
  else []

let many_uident parser =
  let rec loop () =
    match parser.token with UIDENT s -> s :: loop () | _ -> []
  in
  let ids = loop () in
  ids

let lident parser =
  let loc_start = parser.start_pos in

  let s =
    match parser.token with
    | LIDENT s ->
        advance parser;
        s
    | LPARENT ->
        advance parser;
        if is_infix parser.token then (
          let s = string_of_infix parser.token in
          advance parser;
          expect RPARENT parser;
          s)
        else (
          err ~start_pos:loc_start ~end_pos:parser.end_pos parser "";
          raise Parse_error)
    | _ ->
        err ~start_pos:loc_start ~end_pos:parser.end_pos parser "";
        raise Parse_error
  in
  let loc_end = parser.prev_end_pos in
  { txt = s; loc = { loc_start; loc_end } }

let uident parser =
  let loc_start = parser.start_pos in
  let loc_end = parser.end_pos in
  match parser.token with
  | UIDENT s ->
      advance parser;
      { txt = s; loc = { loc_start; loc_end } }
  | _ ->
      err ~start_pos:loc_start ~end_pos:loc_end parser "";
      raise Parse_error

let longident_end_lident p =
  let loc_start = p.start_pos in
  let uids = many_uident p in
  let lid = lident p in
  let loc_end = p.prev_end_pos in
  { txt = Longident.make (uids @ [ lid.txt ]); loc = { loc_start; loc_end } }

let longident_end_uident p =
  let loc_start = p.start_pos in
  let uids = many_uident p in
  let loc_end = p.prev_end_pos in
  { txt = Longident.make uids; loc = { loc_start; loc_end } }

let rec expr parser =
  let loc_start = parser.start_pos in
  let desc =
    match parser.token with
    | LET ->
        advance parser;
        let is_rec = optional REC in
        let id = lident parser in
        expect EQUAL parser;
        let e1 = expr parser in
        expect IN parser;
        let body = expr parser in
        ELet (id, e1, body)
    | FUN ->
        advance parser;
        let id = lident parser in
        expect ARROW parser;
        let body = expr parser in
        EFunction (Nolabel, id, body)
    | _ ->
        let { desc; _ } = op_expr parser in
        desc
  in
  let loc_end = parser.prev_end_pos in
  { desc; loc = { loc_start; loc_end } }

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
  let rec loop () =
    (* print_endline (Token.show p.token); *)
    match p.token with
    | NUMBER _ | LIDENT _ | UIDENT _ | LPARENT ->
        let f = atom_expr p in
        f :: loop ()
    | _ -> []
  in
  let es = loop () in
  if List.length es = 0 then (
    report p;
    raise Parse_error)
  else if List.length es = 1 then List.hd es
  else
    {
      desc = EApply (List.hd es, List.map (fun e -> (Nolabel, e)) (List.tl es));
      loc =
        {
          loc_start = (List.hd es).loc.loc_start;
          loc_end = (List.nth es (List.length es - 1)).loc.loc_end;
        };
    }

and atom_expr p =
  let loc_start = p.start_pos in
  let desc =
    match p.token with
    | NUMBER n ->
        advance p;
        EConstant n
    | LIDENT s ->
        advance p;
        ELongident { txt = Longident.Lident s; loc = Location.dummy_loc }
    | UIDENT _ -> (
        let uids = many_uident p in
        match p.token with
        | LIDENT s ->
            advance p;
            ELongident
              { txt = Longident.make (uids @ [ s ]); loc = Location.dummy_loc }
        | _ ->
            report p;
            raise Parse_error)
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
  let rec typ_bp min_bp : simple_type =
    let lhs = apply_type p in
    let rec loop lhs : simple_type =
      match p.token with
      | STAR | ARROW ->
          let op = p.token in
          let prec =
            match op with STAR -> 2 | ARROW -> 1 | _ -> assert false
          in
          if prec < min_bp then lhs
          else (
            advance p;
            let rhs = typ_bp prec in
            (* print_endline (print_simple_type rhs); *)
            let ty =
              match op with
              | STAR ->
                  {
                    ty_desc =
                      Typeconstr
                        ( {
                            txt = Longident.Lident "*";
                            loc = Location.dummy_loc;
                          },
                          [ lhs; rhs ] );
                    loc =
                      {
                        loc_start = lhs.loc.loc_start;
                        loc_end = lhs.loc.loc_end;
                      };
                  }
              | ARROW ->
                  {
                    ty_desc = Tarrow (Nolabel, lhs, rhs);
                    loc =
                      {
                        loc_start = lhs.loc.loc_start;
                        loc_end = lhs.loc.loc_end;
                      };
                  }
              | _ -> assert false
            in
            loop ty)
      | _ -> lhs
    in
    loop lhs
  in
  typ_bp 0

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
    | _ ->
        report p;
        raise Parse_error
  in

  let loc_end = p.prev_end_pos in
  { ty_desc = ty; loc = { loc_start; loc_end } }

let todo () = failwith "TODO"

(*
   let type_decl p =
     match p.token with
     | LPARENT -> advance p;
      let params =  sepby1 tvar (fun tok -> tok = COMMA) p in *)
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
        let ps = many1 tvar (fun x -> x = COMMA) p in
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
        expect EQUAL p;
        let e = expr p in
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

let parse p =
  advance p;
  structure p
