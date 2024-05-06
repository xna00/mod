open OUnit2
open Parsing

let make_parser s =
  let p = Parser.make "file" s in
  Parser.advance p;
  p

let expr_test ?expect s : test_fun =
 fun _ ->
  let p = make_parser s in
  let ret = Syntax.print_expr (Parser.expr p) in
  assert_equal (match expect with None -> s | Some s -> s) ret

let test_type ?expect s : test_fun =
 fun _ ->
  let p = make_parser s in
  assert_equal
    (match expect with None -> s | Some s -> s)
    (Syntax.print_simple_type (Parser.simple_type p))

let test_mod_expr ?expect s : test_fun =
 fun _ ->
  let p = make_parser s in
  let ret = Syntax.print_mod_expr (Parser.mod_expr p) in
  (* print_endline ret; *)
  assert_equal (match expect with None -> s | Some s -> s) ret

let test_mod_type ?expect s : test_fun =
 fun _ ->
  let p = make_parser s in
  let ret = Syntax.print_mod_type (Parser.mod_type p) in
  (* print_endline "ret:";
     print_endline ret; *)
  assert_equal (match expect with None -> s | Some s -> s) ret

let mod_src1 =
  {|
struct
  let a = 2
  module M: sig
    val c: int
  end = struct
    let c = 3
  end
end
         |}
  |> String.trim

let modt_src1 = {|
sig
  val a: int
end
|} |> String.trim

let parser =
  "parser"
  >::: [
         test_case (expr_test "1 + 2" ~expect:"+ 1 2");
         "test1" >:: expr_test "let a = 1 in a";
         test_case (expr_test "fun x -> x");
         test_case (expr_test "let id = fun x -> x in id (fun x -> x)");
         test_case (test_type "'a -> 'a");
         test_case (test_type "a * b -> 'a" ~expect:"(a, b) * -> 'a");
         test_case (test_type "a b c");
         test_case (test_mod_expr mod_src1);
         test_case (test_mod_type modt_src1);
       ]

let () = run_test_tt_main (test_list [ parser ])
