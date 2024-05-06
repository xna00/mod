const lib = require('../_build/default/jslib/main.bc.js')

console.log((lib.filechange(" let a = 1 ")))
console.log(lib.typeinfo("let a = fun x -> x in a", 0, 0))