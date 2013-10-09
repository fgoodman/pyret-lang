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
       })", [bindings, expr-to-js(block)])
  end
end

fun do-block(str):
  format("(function() { ~a })()", [str])
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
    | s_user_block(_, body) => format("(function(){ ~a }()", [expr-to-js(body)])
    #| s_var(l, name, value) =>
    #| s_let(l, name, value) =>
    #| s_assign(l, id, value) =>
    #| s_if_else(_, branches, _else) =>
    #| s_try(l, body, id, _except) =>
    #| s_lam(l, params, args, _, _, body, _) =>
    #| s_method(l, args, _, _, body, _) =>
    #| s_extend(l, super, fields) =>
    #| s_obj(_, fields) => print(fields)
    | s_app(_, f, args) =>
      format("~a.app(~a)", [expr-to-js(f), args.map(expr-to-js).join-str(",")])
    | s_id(l, id) =>
      js-id-of(id)
    | s_num(_, n) =>
      format("RUNTIME.makeNumber(~a)", [n])
    | s_bool(_, b) =>
      format("RUNTIME.makeBool(~a)", [b])
    | s_str(_, s) =>
      format("RUNTIME.makeString(\"~a\")", [s])
    | s_bracket(_, obj, f) =>
      cases (A.Expr) f:
        | s_str(_, s) => format("RUNTIME.getField(~a, '~a')", [expr-to-js(obj), s])
        | else => raise("Non-string lookups not supported")
      end
    #| s_colon_bracket(l, obj, field) =>
    #| s_get_bang(l, obj, field) =>
    #| s_update(l, super, fields) =>
    | else => do-block(format("throw new Error('Not yet implemented ~a')", [torepr(ast)]))
  end
end

program-to-js(A.parse-tc("true(false)", "test", {check : false, env : []}), [])
#A.parse-tc("[1, 2, 3]", "test", {check : false, env : []})
