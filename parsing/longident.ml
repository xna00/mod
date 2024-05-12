type t = Lident of string | Ldot of t * string
[@@deriving show { with_path = false }]

let make ids =
  List.fold_left
    (fun acc x -> Ldot (acc, x))
    (Lident (List.hd ids))
    (List.tl ids)

let is_infix s =
  match s.[0] with
  | '*' | '/' | '+' | '-' | '>' | '<' | '=' -> true
  | _ -> false

let infixify s = if is_infix s then "( " ^ s ^ " )" else s

let rec flat id =
  match id with
  | Lident s -> [ infixify s ]
  | Ldot (id1, s) -> flat id1 @ [ infixify s ]

let ident_of_string s =
  let Location.{ txt; loc } = s in
  Location.{ txt = Lident txt; loc }

let string_of_longident id = String.concat "." (flat id)
let string_of_shortident id = match id with Lident s -> s | _ -> assert false
