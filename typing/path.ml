type t =
  | Pident of Ident.t (* identifier *)
  | Pdot of t * string (* access to a module component *)
[@@deriving show { with_path = false }]

let rec path_equal p1 p2 =
  match (p1, p2) with
  | Pident id1, Pident id2 -> Ident.equal id1 id2
  | Pdot (r1, field1), Pdot (r2, field2) -> path_equal r1 r2 && field1 = field2
  | _, _ -> false

let rec path_of_longident lid =
  let open Parsing.Longident in
  match lid with
  | Lident s -> Pident (Ident.create s)
  | Ldot (lid1, s) -> Pdot (path_of_longident lid1, s)

let rec string_of_path p =
  match p with
  | Pident i -> Ident.name i
  | Pdot (p, f) -> string_of_path p ^ "." ^ f
