open Monad
open Syntax

type nonrec 'a parser = ('a, pstring) parser

let item : char parser =
 fun ((pos, chars) as s) ->
  match chars with
  | [] -> fail "Empty char list" s
  | '\n' :: xs -> Ok ('\n', ((fst pos + 1, 0), xs))
  | c :: xs -> Ok (c, ((fst pos, snd pos + 1), xs))

let sat : ?msg:string -> (char -> bool) -> char parser =
 fun ?(msg = "") p ->
  item >>= fun c -> if p c then return c else fun s -> fail ("sat: " ^ msg) s

let char c = sat ~msg:("char(" ^ String.make 1 c ^ ")") (fun x -> x = c)

let peek_char : char option parser =
 fun ((_, s) as s') ->
  match s with [] -> return None s' | x :: _ -> return (Some x) s'

let ws = sat ~msg:"ws" (function ' ' | '\n' -> true | _ -> false)
let wss = many ws
let is_upper = function 'A' .. 'Z' -> true | _ -> false
let upper = sat ~msg:"is_upper" is_upper
let is_lower = function 'a' .. 'z' -> true | _ -> false
let lower = sat ~msg:"is_lower" is_lower
let letter = sat ~msg:"letter" (fun c -> is_lower c || is_upper c)
let is_digit = function '0' .. '9' -> true | _ -> false
let digit = sat ~msg:"is_digit" is_digit
let is_letter_or_digit c = is_upper c || is_lower c || is_digit c
let letter_or_digit = sat is_letter_or_digit
let explode s = List.of_seq (String.to_seq s)
let implode l = String.of_seq (List.to_seq l)
let ( *> ) p1 p2 = p1 >>= fun _ -> p2
let tchar c = wss *> char c

let ( <* ) p1 p2 =
  p1 >>= fun v ->
  p2 >>= fun _ -> return v

let rec string s =
  match explode s with
  | [] -> return ""
  | x :: xs -> char x *> string (implode xs) *> return s

let tstring s = wss *> string s
let tlparent = wss *> char '('
let trparent = wss *> char ')'
let tlet = wss *> string "let"
let trec = wss *> string "rec"
let tin = wss *> string "in"
let tfun = wss *> string "fun"
let keywords = [ tlet; trec; tin; tfun ]
let keyword_parser = List.fold_left (fun acc p -> acc ++ p) zero keywords

let ident =
  wss *> letter >>= fun x ->
  many letter_or_digit >>= fun xs ->
  let s = implode (x :: xs) in
  let t = keyword_parser ((0, 0), explode s) in
  match t with
  | Ok (_, (_, s2)) when List.length s2 = 0 -> fail (s ^ " is a keyword")
  | _ -> return s

let number = wss *> many1 digit
let unknown = many1 (sat (function ' ' | '\n' -> false | _ -> true))

type term_list = term list [@@deriving show { with_path = false }]

let rec term_parser : term parser =
 fun s ->
  (wss
   *> ( fetch >>= fun (pos1, _) ->
        ( tlet *> optional trec >>= fun r ->
          ident >>= fun id ->
          tchar '=' *> term_parser >>= fun t1 ->
          tin *> term_parser >>= fun t2 ->
          return
            (TmLet ((match r with None -> false | Some _ -> true), id, t1, t2))
        )
        ++ ( tfun *> ident >>= fun id ->
             print_endline id;
             optional (tchar ':' *> ident) >>= fun ty ->
             tstring "->" *> term_parser >>= fun t ->
             return (TmAbs (id, Option.map (fun x -> TyId x) ty, t)) )
        >>= fun tm ->
        fetch >>= fun (pos2, _) -> return { desc = tm; loc = (pos1, pos2) } )
  ++ app_term)
    s

and app_term : term parser =
 fun s ->
  ( many1 atom_term >>= fun xs ->
    return
      (List.fold_left
         (fun acc tm ->
           { desc = TmApp (acc, tm); loc = (fst acc.loc, snd tm.loc) })
         (List.hd xs) (List.tl xs)) )
    s

and atom_term : term parser =
 fun s ->
  let a0 =
    fetch >>= fun (pos1, _) ->
    (ident >>= fun x -> return (TmVar x)) ++ (number *> return TmInt)
    >>= fun tm ->
    fetch >>= fun (pos2, _) -> return { desc = tm; loc = (pos1, pos2) }
  in
  (a0 ++ (tlparent *> term_parser <* trparent)) s
