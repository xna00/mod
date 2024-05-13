export const test_mod =
	`
(* Hover to inspect the type of a expression *)

let a = 1
let id = fun x -> x
let ( ++ ) = ( + )
let b = 2 ++ 2

let o1 = {a=1}
let o2 = {b = 2 | o1}
let f o = o.a + o.b

let m x = match x with
| \`Int y -> y
| \`Float y -> 0


let e = <div></div>
let button ~className ?size = <div className={className}> </div>

let e2 = <button className={1}></button>

module M = struct
	let make = button ~size:3
end

let e4 = <M className={0}></M>
`.trim()