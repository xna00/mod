type arg_label =
  | Nolabel
  | Labelled of string  (** [label:T -> ...] *)
  | Optional of string  (** [?label:T -> ...] *)
[@@deriving show { with_path = false }]

type 'a loc = 'a Location.loc = { txt : 'a; loc : Location.t }
[@@deriving show { with_path = false }]
