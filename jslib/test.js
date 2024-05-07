const lib = require('../_build/default/jslib/main.bc.js')

// console.log((lib.filechange(" (* abd *) let a = 1 ")))
lib.filechange("a", "let a = M.b")
console.log(lib.typeinfo("a", 0, 21))