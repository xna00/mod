const lib = require('../_build/default/js/main.bc.js')

console.log(JSON.parse(lib.lexing("let a = 1 in a")))
console.log(lib.typeinfo("let a = fun x -> x in a", 0,0))