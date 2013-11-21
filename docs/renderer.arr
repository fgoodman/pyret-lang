#lang pyret

import ast as A
provide { get-pretty-str: get-pretty-str } end

fun get-pretty-str(raw-ast):
  this-ast = A.to-pyret(raw-ast)
  this-ast.tosource().pretty(80)
end

