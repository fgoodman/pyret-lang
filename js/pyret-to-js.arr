#lang pyret

import ast as A
import json as J
import format as format

provide *

js-id-of = block:
  var js-ids = {}
  fun(id :: String):
    if builtins.has-field(js-ids, id):
      js-ids.[id]
    else:
      no-hyphens = id.replace("-", "_DASH_")
      safe-id = gensym(no-hyphens)
      js-ids := js-ids.{ [id]: safe-id }
      safe-id
    end
  end
end

fun program-to-js(ast, runtime-ids):
  cases(A.Program) ast:
    # import/provide ignored
    | s_program(_, _, block) =>
      expr = cases (A.Expr) block :
        | s_block(l, stmts) =>
          sl = stmts.last()
          if A.is-s_var(sl) or A.is-s_let(sl):
            expr-to-js(A.s_block(l, stmts.append([A.s_id(l, "nothing")])))
          else:
            expr-to-js(block)
          end
        | else => expr-to-js(block)
      end
      
      bindings = for list.fold(bs from "", id from runtime-ids):
        bs + format("var ~a = RUNTIME['~a'];\n", [js-id-of(id), id])
      end
      format("(function(RUNTIME) {
        try {
          ~a
          return RUNTIME.makeNormalResult(~a);
        } catch(e) {
          return RUNTIME.makeFailResult(e);
        }
       })", [bindings, expr])
  end
end

fun do-block(str): format("(function() { ~a })()", [str]) end

fun args-to-str(args): args.map(fun(arg): js-id-of(arg.id) end).join-str(",") end

fun name-to-key(name):
   name.substring(20, name.length() - 2).replace("-", "_DASH_")
end

fun expr-to-js(ast):
  cases(A.Expr) ast:
    | s_block(_, stmts) =>
      if stmts.length() == 0:
        "RUNTIME.nothing"
      else:
        fun sequence-return-last(ss):
          cases(list.List) ss:
            | link(f, r) =>
              cases(list.List) r:
                | empty => format("return ~a;", [expr-to-js(f)])
                | link(_, _) =>
                  format("~a;\n", [expr-to-js(f)]) + sequence-return-last(r)
              end
          end
        end
        format("(function(){\n ~a \n})()", [sequence-return-last(stmts)])
      end
    | s_user_block(_, body) => do-block("return " + expr-to-js(body))
    | s_var(_, name, value) => format("var ~a = ~a", [js-id-of(name.id), expr-to-js(value)])
    | s_let(_, name, value) => format("var ~a = ~a", [js-id-of(name.id), expr-to-js(value)])
    | s_assign(_, id, value) => format("~a = ~a", [js-id-of(id), expr-to-js(value)])
    | s_if_else(_, branches, _else) =>
      elseifs = for list.fold(bs from "", b from branches.rest):
        bs + format("else if (RUNTIME.isTrue(~a)) { return ~a; } ", [expr-to-js(b.test), expr-to-js(b.body)])
      end
      do-block(format("if (RUNTIME.isTrue(~a)) { return ~a; } ~aelse { return ~a; }",
        [expr-to-js(branches.first.test), expr-to-js(branches.first.body), elseifs, expr-to-js(_else)]))
    | s_try(_, body, id, _except) =>
      do-block(format("try { return ~a; } catch (~a) { return ~a; }", [expr-to-js(body), js-id-of(id.id), expr-to-js(_except)]))
    | s_lam(_, _, args, _, doc, body, _) => 
      format("RUNTIME.makeFunction(function (~a) { return ~a; }, RUNTIME.makeString('~a'))", [args-to-str(args), expr-to-js(body), doc])
    | s_method(_, args, _, doc, body, _) =>
      format("RUNTIME.makeMethod(function (~a) { return ~a; }, RUNTIME.makeString('~a'))", [args-to-str(args), expr-to-js(body), doc])
    | s_extend(_, super, fields) =>
      fun member-to-pair(m):
        cases (A.Member) m:
          | s_data_field(_, name, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_mutable_field(_, name, _, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_once_field(_, name, _, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_method_field(l, name, args, ann, doc, body, _check) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(A.s_method(l, args, ann, doc, body, _check)) }
        end
      end
      for list.fold(base from expr-to-js(super), field from fields):
        pair = member-to-pair(field)
        base + format(".extend('~a', ~a)", [pair.name, pair.value])
      end
    | s_obj(_, fields) =>
      fun member-to-js(m):
        cases (A.Member) m:
          | s_data_field(_, name, value) => format("~a:~a", [name-to-key(expr-to-js(name)), expr-to-js(value)])
          | s_mutable_field(_, name, _, value) => format("~a:~a", [name-to-key(expr-to-js(name)), expr-to-js(value)])
          | s_once_field(_, name, _, value) => format("~a:~a", [name-to-key(expr-to-js(name)), expr-to-js(value)])
          | s_method_field(l, name, args, ann, doc, body, _check) =>
            format("~a:~a", [name-to-key(expr-to-js(name)), expr-to-js(A.s_method(l, args, ann, doc, body, _check))])
        end
      end
      format("RUNTIME.makeObject({~a})", [fields.map(member-to-js).join-str(",")])
    | s_app(_, _fun, args) => format("~a.app(~a)", [expr-to-js(_fun), args.map(expr-to-js).join-str(",")])
    | s_id(_, id) => js-id-of(id)
    | s_num(_, n) => format("RUNTIME.makeNumber(~a)", [n])
    | s_bool(_, b) => format("RUNTIME.makeBool(~a)", [b])
    | s_str(_, s) => format("RUNTIME.makeString('~a')", [s])
    | s_bracket(_, obj, field) =>
      cases (A.Expr) field:
        | s_str(_, s) => format("RUNTIME.getField(~a, '~a')", [expr-to-js(obj), s])
        | else => raise("Non-string lookups not supported")
      end
    | s_colon_bracket(_, obj, field) =>
      cases (A.Expr) field:
        | s_str(_, s) => format("RUNTIME.getRawField(~a, '~a')", [expr-to-js(obj), s])
        | else => raise("Non-string lookups not supported")
      end
    | s_get_bang(_, obj, field) =>
      m = format("RUNTIME.getMutableField(~a, '~a')", [expr-to-js(obj), field]) # Find out error for this
      do-block(format("if (RUNTIME.isMutable(~a)) { return RUNTIME.getField(~a, 'get').app(); } else { throw 'err'; }", [m, m]))
    | s_update(_, super, fields) =>
      fun member-to-pair(m):
        cases (A.Member) m:
          | s_data_field(_, name, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_mutable_field(_, name, _, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_once_field(_, name, _, value) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(value) }
          | s_method_field(l, name, args, ann, doc, body, _check) =>
            { name: name-to-key(expr-to-js(name)), value: expr-to-js(A.s_method(l, args, ann, doc, body, _check)) }
        end
      end
      for list.fold(base from expr-to-js(super), field from fields):
        pair = member-to-pair(field)
        base + format(".mutate('~a', ~a)", [pair.name, pair.value])
      end
    | else => do-block(format("throw new Error('Not yet implemented ~a')", [torepr(ast)]))
  end
end
