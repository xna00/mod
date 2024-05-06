(lang dune 3.15)

(name mod)

(generate_opam_files true)

(source
 (github username/reponame))

(authors "Author Name")

(maintainers "Maintainer Name")

(license LICENSE)

(documentation https://url/to/documentation)

(package
 (name mod)
 (synopsis "A short synopsis")
 (description "A longer description")
 (depends
  ocaml
  dune
  ounit2
  js_of_ocaml
  js_of_ocaml-compiler
  js_of_ocaml-ppx
  ppx_deriving
  ppx_deriving_yojson)
 (tags
  (topics "to describe" your project)))

; See the complete stanza docs at https://dune.readthedocs.io/en/stable/dune-files.html#dune-project
