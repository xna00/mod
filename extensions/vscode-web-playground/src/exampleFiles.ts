export const test_mod =
	`
(* Hover to inspect the type of a expression *)

let a = 1
let id = fun x -> x
let ( ++ ) = ( + )
let b = 2 ++ 2
let e = <div></div>
let button ~className ?size = <div className={className}> </div>

let e2 = <button className={1}></button>

let 
module M = struct
	let make = button ~size:3
end

let e4 = <M className={0}></M>
`.trim()