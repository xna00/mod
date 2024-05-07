type t = { name : string; stamp : int } [@@deriving show { with_path = false }]

let currstamp = ref 0

let create s =
  currstamp := !currstamp + 1;
  { name = s; stamp = !currstamp }

let name id = id.name
let equal id1 id2 = id1.stamp = id2.stamp

type 'a tbl = (t * 'a) list [@@deriving show { with_path = false }]

let emptytbl = []
let add id data tbl = (id, data) :: tbl

let rec find id1 = function
  | [] -> raise Not_found
  | (id2, data) :: rem -> if equal id1 id2 then data else find id1 rem

let rec find_name name1 env = List.find (fun id -> name id = name1) env
