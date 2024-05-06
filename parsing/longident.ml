type t = Lident of string | Ldot of t * string
[@@deriving show { with_path = false }]

let make ids =
  List.fold_left
    (fun acc x -> Ldot (acc, x))
    (Lident (List.hd ids))
    (List.tl ids)

let rec flat id =
  match id with Lident s -> [ s ] | Ldot (id1, s) -> flat id1 @ [ s ]

let ident_of_string s =
  let Location.{ txt; loc } = s in
  Location.{ txt = Lident txt; loc }

let string_of_longident id = String.concat "." (flat id)
