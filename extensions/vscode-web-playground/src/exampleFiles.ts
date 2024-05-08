export const test_mod =
	`
(* Hover to inspect the type of a expression *)

let a = 1
module M = struct
	let id = fun x -> x
	let ( ++ ) = ( + )
end
`.trim()