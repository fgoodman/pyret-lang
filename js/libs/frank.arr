#lang pyret

# BUILTINS

fun identical(obj1, obj2):
  if has-field(obj1, "eq") and has-field(obj2, "eq"):
    obj1.eq(obj2)
  else:
    raise("Identical got values that weren't created by data: " + torepr(obj1) + " and " + torepr(obj2))
  end
end

fun mklist(obj):
  doc: "Creates a List from something with `first` and `rest` fields, recursively"
  if obj.is-empty: empty
  else: link(obj.first, mklist(obj.rest))
  end
end

fun keys(obj):
  doc: "Returns a List of the keys of an object, as strings"
  mklist(prim-keys(obj))
end

fun has-field(obj, name):
  doc: "Returns true if the object has a field with the name specified"
  prim-has-field(obj, name)
end

fun num-keys(obj):
  doc: "Returns the Number of fields in an object"
  prim-num-keys(obj)
end


fun Eq():
  b = brander()
  {
    extend: fun(obj):
        obj.{eq(self, other): b.test(self) and b.test(other) end}
      end,
    brand: fun(obj): b.brand(obj) end
  }
end

builtins = {
  identical: identical,
  keys: keys,
  has-field: has-field,
  mklist: mklist,
  equiv: equiv,
  data-to-repr: data-to-repr,
  data-equals: data-equals,
  Eq: Eq
}

data List:
  | empty with:
    length(self): 0 end,
    append(self, other): other end,
    _torepr(self): "[]" end,
    map(self, f) -> List: empty end
  | link(first, rest :: List) with:
    length(self): 1 + self.rest.length() end,
    append(self, other): self.first^link(self.rest.append(other)) end,
    _torepr(self):
      "[" +
        for raw-fold(combined from torepr(self:first), elt from self:rest):
          combined + ", " + torepr(elt)
        end
      + "]"
    end,
    map(self, f): f(self.first)^link(self.rest.map(f)) end
sharing:
  _plus(self, other): self.append(other) end
end

fun raw-fold(f, base, lst :: List):
  if is-empty(lst):
    base
  else:
    raw-fold(f, f(base, lst:first), lst.rest)
  end
end

fun map(f, lst :: List):
  doc: "Returns a list made up of f(elem) for each elem in lst"
  if is-empty(lst):
    empty
  else:
    f(lst.first)^link(map(f, lst.rest))
  end
end

list = {
  link: link,
  empty: empty,
  map: map
}

# ERROR
data Location:
  | location(file :: String, line, column) with:
    _equals(self, other):
      is-location(other) and
      (self.file == other.file) and
      (self.line == other.line) and
      (self.column == other.column)
    end,
    format(self):
      self.file +
      ": line " +
      self.line.tostring() +
      ", column " +
      self.column.tostring()
    end,
    tostring(self): self.format() end
end

data Error:
  | opaque-error(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Error using opaque internal value" end
  | field-not-found(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Field not found" end
  | field-non-string(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Non-string in field name" end
  | cases-miss(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "No cases matched" end
  | invalid-case(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Invalid case" end
  | eval-error(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Eval Error" end
  | user-contract-failure(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Contract failure" end
  | arity-error(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Arity mismatch" end
  | div-0(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Division by zero" end
  | type-error(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Type Error" end
  | lazy-error(message :: String, location :: Location, trace :: List<Location>) with:
    name(self): "Error" end
sharing:
  tostring(self): self.format() end,
  format(self):
    self.location.format().append(":\n").append(self.name()).append(": ").append(self.message) end
end


fun make-error(obj):
  trace = if has-field(obj, "trace"):
    for map(l from mklist(obj.trace)):
      location(l.path, l.line, l.column)
    end
  else:
    []
  end
  loc = location(obj.path, obj.line, obj.column)
  if obj.system:
    type = obj.value.type
    msg = obj.value.message
    if (type == "opaque"): opaque-error(msg, loc, trace)
    else if (type == "field-not-found"): field-not-found(msg, loc, trace)
    else if (type == "field-non-string"): field-non-string(msg, loc, trace)
    else if (type == "user-contract-failure"): user-contract-failure(msg, loc, trace)
    else if (type == "eval-error"): eval-error(msg, loc, trace)
    else if (type == "arity-mismatch"): arity-error(msg, loc, trace)
    else if (type == "div-0"): div-0(msg, loc, trace)
    else if (type == "type-error"): type-error(msg, loc, trace)
    else: lazy-error(msg, loc, trace)
    end
  else: obj.value
  end
end

error = {
  opaque-error: opaque-error,
  is-opaque-error : is-opaque-error,
  field-not-found: field-not-found,
  is-field-not-found: is-field-not-found,
  cases-miss: cases-miss,
  is-cases-miss: is-cases-miss,
  invalid-case: invalid-case,
  is-invalid-case: is-invalid-case,
  user-contract-failure: user-contract-failure,
  is-user-contract-failure: is-user-contract-failure,
  div-0: div-0,
  is-div-0: is-div-0,
  make-error: make-error,
  Error: Error,
  Location: Location,
  location: location,
  is-location: is-location
}

checkers = {}
