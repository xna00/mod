type 's error = Fail of string * 's
type ('a, 's) parser = 's -> ('a * 's, 's error) result

let return v : ('a, 's) parser = fun s -> Ok (v, s)

let bind (stm : ('a, 's) parser) (f : 'a -> ('b, 's) parser) : ('b, 's) parser =
 fun s -> Result.bind (stm s) (fun (v, s') -> f v s')

let ( >>= ) = bind
let fail msg : ('a, 's) parser = fun s -> Error (Fail (msg, s))
let zero : ('a, 's) parser = fun s -> fail "zero" s

let ( ++ ) : ('a, 's) parser -> ('a, 's) parser -> ('a, 's) parser =
 fun p1 p2 s -> match p1 s with Ok v -> Ok v | Error _ -> p2 s

let update : ('s -> 's) -> ('a, 's) parser = fun f s -> Ok (s, f s)
let set s = update (fun _ -> s)
let fetch : ('a, 's) parser = fun s -> update (fun x -> x) s

let rec many p =
  ( p >>= fun x ->
    many p >>= fun xs -> return (x :: xs) )
  ++ return []

let many1 p =
  p >>= fun x ->
  many p >>= fun xs -> return (x :: xs)

let optional p = (p >>= fun x -> return (Some x)) ++ return None
