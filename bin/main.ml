open Parsing

let src =
  "struct let a = 1 let v = 3 module M = struct let b = 2 module N = struct \
   end end let c = 3 end"

let src =
  {|
  (* aaaaa *)
  (*aaaaadasdasdas*)
  let a = 1
  module M = struct
   (* ccc *)
   let v = s
   end
         |}
  |> String.trim

let p = Parser.make "test.mod" src
let e = Parser.parse p

(* let _ = print_endline (Syntax.show_simple_type e) *)

(* let _ =
     List.iter (fun d -> print_endline (Parser.show_diagnostic d)) p.diagnostics

   let _ = print_endline src *)

(* let _ = print_endline (Syntax.show_mod_expr e) *)
let _ = print_endline (Syntax.print_definition_list e)
