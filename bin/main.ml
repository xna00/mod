open Parsing
open Typing

module M = struct
  type t = A
end

module N = struct
  let id ~x = x
end

let init_scope, init_env = Predef.init_scope_env ()

let src =
  "struct let a = 1 let v = 3 module M = struct let b = 2 module N = struct \
   end end let c = 3 end"

let src =
  {|
  module M= struct
   let id = fun ?z ~x ~y -> x + y
   end
         |}
  |> String.trim

let p = Parser.make "test.mod" src
let e = Parser.parse p

let _ =
  let m =
    Typed.mod_expr_to_typed e
    |> Typing.Scope.scope_module init_scope
    |> Infer.type_module init_env
  in
  print_endline "AAA";
  Types.print_mod_type m.mod_term_type |> print_endline

(* let _ = print_endline (Syntax.show_simple_type e) *)

let _ =
  List.iter (fun d -> print_endline (Parser.show_diagnostic d)) p.diagnostics

(* let _ = print_endline src *)

(* let _ = print_endline (Syntax.show_mod_expr e) *)
(* let _ = print_endline (Syntax.print_definition_list e) *)
