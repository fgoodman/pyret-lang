var PYRET = (function () {

    function makeRuntime() {
	var badApp = function(type) {
	    return function() {
		throw makePyretException("check-fun: expected function, got " + type);
	    };
	};

	var badMeth = function(type) {
	    return function() {
		throw makePyretException("check-method: expected method, got " + type);
	    };
	};


	function PBase() {}
	PBase.prototype = {
	    brands: [],
	    dict: {},
	    app: badApp("base"),
	    method: badMeth("base")
	};


	function PFunction(f, doc) {
	    this.app = f;
	    this.arity = f.length;
	    this.dict = {
		_doc: doc,
		_method: new _PMethod(function(self) {
		    return makeMethod(f, doc);
		}, doc)
	    };
	}
	function _PFunction(f, doc) { this.app = f; this.dict = { _doc : doc }; }
	function _PFunction(f, doc) { 
	    this.app = f;
	    this.dict = {
		_doc: doc,
		_method: function () { throw makePyretException("Can't convert a function field into a method."); }
	    };
	}
	function makeFunction(f, doc) { return new PFunction(f, doc); }
	function _makeFunction(f) { return new PFunction(f, makeString("")); }
	function isFunction(v) { return v instanceof PFunction || v instanceof _PFunction; }
	PFunction.prototype = Object.create(PBase.prototype);
	PFunction.prototype.method = badMeth("function");
	function applyFunc(f, argList) {
	    //console.log(f, argList);
	    if (f.arity === undefined) f.arity = f.app.length;
	    if (f.arity !== argList.length) {
		throw makePyretException("Wrong number of arguments given to function.");
	    }

	    return f.app.apply(null, argList);
	}


	function PMethod(m, doc, arity) {
	    this.method = m;
	    this.arity = m.length;
	    this.dict = {
		_doc: doc,
		_fun: new _PMethod(function(self) {
		    return makeFunction(m, doc);
		}, doc)
	    };
	}
        function _PMethod(m, doc) { 
	    this.method = m;
	    this.dict = {
		_doc: doc,
		_fun: function () { throw makePyretException("Can't convert a method field into a function."); }
	    };
	}
	function makeMethod(m, doc) { return new PMethod(m, doc); }
	function _makeMethod(m, arity) { return new PMethod(m, makeString("")); }
	function isMethod(v) { return v instanceof PMethod || v instanceof _PMethod; }
	PMethod.prototype = Object.create(PBase.prototype);
	PMethod.prototype.app = badApp("method");


	function PNothing() {}
	PNothing.prototype = Object.create(PBase.prototype);
	PNothing.prototype.dict = {
	    _torepr: _makeMethod(function(s) {
		return makeString("nothing");
	    })
	};
	var nothing = new PNothing();


	function PObject(o) {
	    this.dict = o;
	}
	function makeObject(o) { return new PObject(o); }
	function isObject(v) { return v instanceof PObject; }
	PObject.prototype = Object.create(PBase.prototype);
	PObject.prototype.app = badApp("object");
	PObject.prototype.method = badMeth("object");
	PObject.prototype.extend = function(field, value) {
	    var o = makeObject(Object.create(this.dict));
	    if (this.dict[field] === undefined) o.brands = this.brands.slice(0);
	    o.dict[field] = value;
	    return o;
	};
	PObject.prototype.mutate = function(field, value) {
	    this.dict[field].set(value);
	    return this;
	};


	function PNumber(n) { this.n = n; }

	function makeNumber(n) { return new PNumber(n); }
	function isNumber(v) { return v instanceof PNumber; }
	PNumber.prototype = Object.create(PBase.prototype);
	PNumber.prototype.app = badApp("number");
	PNumber.prototype.method = badMeth("number");
	PNumber.prototype.dict = {
	    _plus: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "plus", [l, r]);
		return makeNumber(l.n + r.n);
	    }),
	    _add: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "add", [l, r]);
		return makeNumber(l.n + r.n);
	    }),
	    _minus: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "minus", [l, r]);
		return makeNumber(l.n - r.n);
	    }),
	    _divide: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "divide", [l, r]);
		if (r.n === 0) throw makePyretException("Division by zero");
		return makeNumber(l.n / r.n);
	    }),
	    _times: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "times", [l, r]);
		return makeNumber(l.n * r.n);
	    }),
	    _torepr: _makeMethod(function(s) {
		return makeString(s.n.toString());
	    }),
	    _equals: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "equals", [l, r]);
		return makeBool(l.n === r.n);
	    }),
	    _lessthan: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "lessthan", [l, r]);
		return makeBool(l.n < r.n);
	    }),
	    _greaterthan: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "greaterthan", [l, r]);
		return makeBool(l.n > r.n);
	    }),
	    _lessequal: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "lessequal", [l, r]);
		return makeBool(l.n <= r.n);
	    }),
	    _greaterequal: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "greaterequal", [l, r]);
		return makeBool(l.n >= r.n);
	    }),
	    tostring: _makeMethod(function(s) {
		return makeString(s.n.toString());
	    }),
	    modulo: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "modulo", [l, r]);
		return makeNumber(l.n % r.n);
	    }),
	    truncate: _makeMethod(function(s) {
		return makeNumber(Math.floor(s.n));
	    }),
	    abs: _makeMethod(function(s) {
		return makeNumber(Math.abs(s.n));
	    }),
	    max: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "max", [l, r]);
		return makeNumber(Math.max(l.n, r.n));
	    }),
	    min: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "min", [l, r]);
		return makeNumber(Math.min(l.n, r.n));
	    }),
	    sin: _makeMethod(function(s) {
		return makeNumber(Math.min(s.n));
	    }),
	    cos: _makeMethod(function(s) {
		return makeNumber(Math.cos(s.n));
	    }),
	    tan: _makeMethod(function(s) {
		return makeNumber(Math.tan(s.n));
	    }),
	    asin: _makeMethod(function(s) {
		return makeNumber(Math.asin(s.n));
	    }),
	    acos: _makeMethod(function(s) {
		return makeNumber(Math.acos(s.n));
	    }),
	    atan: _makeMethod(function(s) {
		return makeNumber(Math.atan(s.n));
	    }),
	    sqr: _makeMethod(function(s) {
		return makeNumber(s.n * s.n);
	    }),
	    sqrt: _makeMethod(function(s) {
		return makeNumber(Math.sqrt(s.n));
	    }),
	    ceiling: _makeMethod(function(s) {
		return makeNumber(Math.ceil(s.n).toFixed(1));
	    }),
	    floor: _makeMethod(function(s) {
		return makeNumber(Math.floor(s.n).toFixed(1));
	    }),
	    log: _makeMethod(function(s) {
		return makeNumber(Math.log(s.n));
	    }),
	    exp: _makeMethod(function(s) {
		return makeNumber(Math.exp(s.n));
	    }),
	    exact: _makeMethod(function(s) {
		return s;
	    }),
	    expt: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "min", [l, r]);
		return makeNumber(Math.pow(l.n, r.n));
	    })
	};


	function PBool(b) {
	    this.b = b;
	    this.app = badApp(b);
	    this.method = badMeth(b);
	}
	function makeBool(b) { return new PBool(b); }
	function isBool(v) { return v instanceof PBool; }
	function isTrue(b) { return isBool(b) && b.b; }
	PBool.prototype = Object.create(PBase.prototype);
	PBool.prototype.dict = {
	    _and: _makeMethod(function(l, r) {
		r = applyFunc(r, []);
		checkPrimitive(isBool, "and", [l, r]);
		return makeBool(l.b && r.b);
	    }),
	    _or: _makeMethod(function(l, r) {
		r = applyFunc(r, []);
		checkPrimitive(isBool, "or", [l, r]);
		return makeBool(l.b || r.b);
	    }),
	    tostring: _makeMethod(function(self) {
		return makeString(self.b.toString());
	    }),
	    _torepr: _makeMethod(function(self) {
		return makeString(self.b.toString());
	    }),
	    _equals: _makeMethod(function(l, r) {
		r = applyFunc(r, []);
		checkPrimitive(isBool, "equals", [l, r]);
		return makeBool(l.b === r.b);
	    }),
	    _not: _makeMethod(function(self) {
		return makeBool(!self.b);
	    })
	};


	function PString(s) { this.s = s; }
	function makeString(s) { return new PString(s); }
	function isString(v) { return v instanceof PString; }
	PString.prototype = Object.create(PBase.prototype);
	PString.prototype.app = badApp("string");
	PString.prototype.method = badMeth("string");
	String.prototype.repeat = function(n) { return new Array(1 + n).join(this); };
	PString.prototype.dict = {
	    _plus: _makeMethod(function(l, r) {
		checkPrimitive(isString, "plus", [l, r]);
		return makeString(l.s + r.s);
	    }),
	    _lessequal: _makeMethod(function(l, r) {
		checkPrimitive(isString, "lessequal", [l, r]);
		return makeBool(l.s <= r.s);
	    }),
	    _lessthan: _makeMethod(function(l, r) {
		checkPrimitive(isString, "lessthan", [l, r]);
		return makeBool(l.s < r.s);
	    }),
	    _greaterthan: _makeMethod(function(l, r) {
		checkPrimitive(isString, "greaterthan", [l, r]);
		return makeBool(l.s > r.s);
	    }),
	    _greaterequal: _makeMethod(function(l, r) {
		checkPrimitive(isString, "greaterequal", [l, r]);
		return makeBool(l.s <= r.s);
	    }),
	    _equals: _makeMethod(function(l, r) {
		checkPrimitive(isString, "equals", [l, r]);
		return makeBool(l.s === r.s);
	    }),
	    append: _makeMethod(function(l, r) {
		checkPrimitive(isString, "append", [l, r]);
		return makeString(l.s + r.s);
	    }),
	    contains: _makeMethod(function(l, r) {
		checkPrimitive(isString, "contains", [l, r]);
		return makeBool(l.s.indexOf(r.s) != -1);
	    }),
	    replace: _makeMethod(function(s, l, r) {
		checkPrimitive(isString, "replace", [l, r]);
		return makeString(s.s.replace(new RegExp(l.s, "g"), r.s));
	    }),
	    substring: _makeMethod(function(s, l, r) {
		checkPrimitive(isNumber, "substring", [l, r]);
		return makeString(s.s.substring(l.n, r.n));
	    }),
	    "char-at": _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "char-at", [r]);
		return makeString(l.s.charAt(r.n));
	    }),
	    repeat: _makeMethod(function(l, r) {
		checkPrimitive(isNumber, "repeat", [r]);
		return makeString(l.s.repeat(r.n));
	    }),
	    length: _makeMethod(function(l) {
		return makeNumber(l.s.length);
	    }),
	    tonumber: _makeMethod(function(l) {
		var n = parseFloat(l.s);
		if (isNaN(n)) return nothing;
		return makeNumber(n);
	    }),
	    tostring: _makeMethod(function(l) {
		return l;
	    }),
	    _torepr: _makeMethod(function(l) {
		return makeString("\"" + l.s + "\"");
	    })
	};


	function PPlaceholder() { this.guards = []; }
	function isPlaceholder(v) { return v instanceof PPlaceholder; }
	PPlaceholder.prototype = Object.create(PBase.prototype);
	PPlaceholder.prototype.app = badApp("placeholder");
	PPlaceholder.prototype.method = badMeth("placeholder");
	PPlaceholder.prototype.dict = {
	    get: _makeMethod(function(self) {
		return getPlaceholderValue(self);
	    }),
	    guard: _makeMethod(function(self, g) {
		if (!isPlaceholder(self)) {
		    throw makeObject({
			path: makeString(""),
			line: makeString(""),
			column: makeString(""),
			system: makeString(""),
			value: makeObject({message:makeString("typecheck failed; expected Placeholder and got\n" + toRepr(self).s)})
		    });
		}
		else {
		    //console.log([_makeFunction(function(v) { return makeBool(isFunction(v)); }), g, makeString("Function")]);
		    try {
			applyFunc(checkBrand, [_makeFunction(function(v) { return makeBool(isFunction(v)); }), g, makeString("Function")]);
		    }
		    catch (e) {
			throw makeObject({message:makeString(e.exnVal)});
		    }

		    if (self.v !== undefined) throw makeObject({
			path: makeString(""),
			line: makeString(""),
			column: makeString(""),
			system: makeString(""),
			value: makeObject({message:makeString("Tried to add guard on an already-initialized placeholder")})
		    });

		    self.guards.push(g);
		}
	    }),
	    set: _makeMethod(function(self, v) {
		if (!isPlaceholder(self)) {
		    throw makeObject({
			path: makeString(""),
			line: makeString(""),
			column: makeString(""),
			system: makeString(""),
			value: makeObject({message:makeString("typecheck failed; expected Placeholder and got\n" + toRepr(self).s)})
		    });
		}
		else if (self.v !== undefined) {
		    throw makePyretException("Tried to set value in already-initialized placeholder");
		}
		else {
		    for (var i in self.guards) {
			try {
			    applyFunc(self.guards[i], [v]);
			}
			catch (e) {
			    throw makeObject({
				path: makeString(""),
				line: makeString(""),
				column: makeString(""),
				system: makeString(""),
				value: makeObject({message:makeString(e.exnVal)})
			    });
			}
		    }
		    self.v = v;
		}
	    }),
	    _equals: _makeMethod(function(self, other) {
		return makeBool(self === other);
	    }),
	    tostring: _makeMethod(function(self) {
		return makeString("cyclic-field");
	    }),
	    _torepr: _makeMethod(function(self) {
		return makeString("cyclic-field");
	    })
	};
	function getPlaceholderValue(p) {
	    if (!isPlaceholder(p)) {
		throw makeObject({
		    path: makeString(""),
		    line: makeString(""),
		    column: makeString(""),
		    system: makeString(""),
		    value: makeObject({message:makeString("typecheck failed; expected Placeholder and got\n" + toRepr(p).s)})
		});
	    }
	    if (p.v !== undefined) {
		return p.v;
	    }
	    else {
		throw makeObject({
		    path: makeString(""),
		    line: makeString(""),
		    column: makeString(""),
		    system: makeString(""),
		    value: makeObject({message:makeString("Tried to get value from uninitialized placeholder")})
		});
	    }
	}


	function PMutable(val, reads, writes) {
	    this.val = val;
	    this.reads = reads;
	    this.writes = writes;
	}
	function isMutable(v) { return v instanceof PMutable; }
	PMutable.prototype = Object.create(PBase.prototype);
	PMutable.prototype.dict = {
	    get: _makeMethod(function(self) {
		if (!isMutable(self)) {
		    throwTypeError("Mutable", self);
		}
		else {
		    for (var i in self.reads) {
			if (!isTrue(self.reads[i].app(self.val))) return makeBool(false);
		    }
		    return self.val;
		}
	    }),
	    _equals: _makeMethod(function(self, other) {
		return makeBool(self === other);
	    }),
	    tostring: _makeMethod(function(self) {
		return makeString("mutable-field");
	    }),
	    _torepr: _makeMethod(function(self) {
		return makeString("mutable-field");
	    })
	};
	PMutable.prototype.set = function(val) {
	    // write checks
	    this.val = val;
	};


	function equal(val1, val2) {
	    if (isObject(val1) && isObject(val2)) return val1.dict === val2.dict;
	    else if (isNumber(val1) && isNumber(val2)) return val1.n === val2.n;
	    else if (isBool(val1) && isBool(val2)) return val1.b === val2.b;
	    else if (isString(val1) && isString(val2)) return val1.s === val2.s;
	    else if (isFunction(val1) && isFunction(val2)) return val1.app === val2.app;
	    else if (isMethod(val1) && isMethod(val2)) return val1.method === val2.method;
	    else if (isPlaceholder(val1) && isPlaceholder(val2)) return val1.v === val2.v;
	    else if (isMutable(val1) && isMutable(val2)) return val1.v === val2.v;
	    else return false;
	}

	function toRepr(val) {
	    if (isFunction(val)) return makeString("fun(): end");
	    else if (isObject(val) && val.dict._torepr === undefined) {
		var fields = [];
		for (var i in val.dict) fields.push(i + ": " + toRepr(val.dict[i]).s);
		return makeString("{" + fields.join(", ") + "}");
	    }
	    else return getField(val, "_torepr").app();
	}

	function toString(val) {
	    return getField(v, "tostring").app();
	}


	function getRawField(val, str) {
	    var field = val.dict[str];
	    if (field !== undefined) return field;
	    else throw makePyretException(str + " was not found on " + toRepr(val).s);
	}

	function getField(val, str) {
	    var field = getRawField(val, str);
	    if (isMutable(field)) throw makePyretException("Cannot look up mutable field \"" + str + "\" using dot or bracket.");
	    else if (isPlaceholder(field)) return getPlaceholderValue(field);
	    else if (isMethod(field)) {
		var f = makeFunction(function () {
		    var argList = Array.prototype.slice.call(arguments);
		    return field.method.apply(null, [val].concat(argList));
		}, field.dict._doc);
		f.arity = field.method.length - 1;
		return f;
	    }
	    else return field;
	}

	function getMutableField(val, str) {
	    var field = getRawField(val, str);
	    if (isMutable(field)) {
		// perform read checks
		return field;
	    }
	    else throw makePyretException("Cannot look up immutable field \"" + str + "\" with the ! operator");
	}

	var brander = _makeFunction(function() {
	    var brand_id = (function () { // http://stackoverflow.com/a/1349426
		var text = "b";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < 10; i++)
		    text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	    })();

	    return makeObject({
		brand: _makeMethod(function(self, v) {
		    var nv;
		    if (isObject(v)) nv = makeObject(Object.create(v.dict));
		    else if (isNumber(v)) nv = makeNumber(v.n);
		    else if (isBool(v)) nv = makeBool(v.b);
		    else if (isString(v)) nv = makeString(v.s);
		    else if (isFunction(v)) nv = makeFunction(v.app, v.dict._doc);
		    else if (isMethod(v)) nv = makeMethod(v.method, v.dict._doc);
		    else if (isMutable(v)) nv = makeMutable(v.v, v.r.slice(0), v.w.slice(0));
		    else if (isPlaceholder(v)) {
			nv = makePlaceholder();
			for (var i in v.guards) {
			    applyFunc(getField(nv, "guard"), [v.guards[i]]);
			}
			nv.set(v.v);
		    }

		    nv.brands = v.brands.slice(0);
		    nv.brands.push(brand_id);

		    return nv;
		}),
		test: _makeMethod(function(self, v) {
		    for (var i = 0; i < v.brands.length; i++) {
			if (v.brands[i] === brand_id) return makeBool(true);
		    }
		    return makeBool(false);
		})
	    });
	});

	var checkBrand = _makeFunction(function(ck, o, s) {
	    if (isString(s)) {
		var check_v = applyFunc(ck, [o]);
		if (isTrue(check_v)) {
		    return o;
		}
		else {
		    throwTypeError(s.s, o);
		}
	    }
	    else if (isString(ck)) {
		throw makePyretException("cannot check-brand with non-function");
	    }
	    else if (isFunction(ck)) {
		throw makePyretException("cannot check-brand with non-string");
	    }
	    else {
		throw makePyretException("check-brand failed");
	    }
	});

	function checkPrimitive(f, name, args) {
	    for (var i = 0; i < args.length; i++) {
		if (!f(args[i])) throw makePyretException("Bad args to prim: " + name + " : " +
		    Array.prototype.map.call(args, function (arg) {
			return String(toRepr(arg).s).replace(/\"+/g, ""); // TODO: make this not ugly
		    }).join(", "));
	    }
	}

	function throwTypeError(typname, o) {
	    throw makePyretException("typecheck failed; expected " + typname + " and got\n" + toRepr(o).s);
	}
	

	var testPrintOutput = "";
	function testPrint(val) {
	    var str = toRepr(val).s;
	    console.log("testPrint: ", val, str);
	    testPrintOutput += str + "\n";
	    return val;
	}

	function NormalResult(val, namespace) {
	    this.val = val;
	    this.namespace = namespace;
	}
	function makeNormalResult(val, ns) { return new NormalResult(val, ns); }

	function FailResult(exn) {
	    this.exn = exn;
	}
	function makeFailResult(exn) { return new FailResult(exn); }

	function PyretException(exnVal) {
	    this.exnVal = exnVal;
	}
	function makePyretException(exnVal) {
	    return new PyretException(exnVal);
	}

	function errToJSON(exn) {
	    return exn;
	}

	return {
	    namespace: Namespace({
		nothing: {},

		Number: _makeFunction(function(v) { return makeBool(isNumber(v)); }),
		String: _makeFunction(function(v) { return makeBool(isString(v)); }),
		Bool:_makeFunction(function(v) { return makeBool(isBool(v)); }),
		Object: _makeFunction(function(v) { return makeBool(isObject(v)); }),
		Nothing: _makeFunction(function(v) { return makeBool(v === {}); }),
		Function: _makeFunction(function(v) { return makeBool(isFunction(v)); }),
		Method: _makeFunction(function(v) { return makeBool(isMethod(v)); }),
		Mutable: _makeFunction(function(v) { return makeBool(isMutable(v)); }),
		Placeholder: _makeFunction(function(v) { return makeBool(isPlaceholder(v)); }),

		"is-number": _makeFunction(function(v) { return makeBool(isNumber(v)); }),
		"is-string": _makeFunction(function(v) { return makeBool(isString(v)); }),
		"is-bool": _makeFunction(function(v) { return makeBool(isBool(v)); }),
		"is-object": _makeFunction(function(v) { return makeBool(isObject(v)); }),
		"is-nothing": _makeFunction(function(v) { return makeBool(v === {}); }),
		"is-function": _makeFunction(function(v) { return makeBool(isFunction(v)); }),
		"is-method": _makeFunction(function(v) { return makeBool(isMethod(v)); }),
		"is-mutable": _makeFunction(function(v) { return makeBool(isMutable(v)); }),
		"is-placeholder": _makeFunction(function(v) { return makeBool(isPlaceholder(v)); }),

		"test-print": _makeFunction(testPrint),
		tostring: _makeFunction(function(val) {
		    return applyFunc(getField(val, "tostring"), []);
		}),
		torepr: _makeFunction(toRepr),

		"mk-placeholder": _makeFunction(function () {
		    return new PPlaceholder();
		}),
		"mk-mutable": _makeFunction(function(val, read, write) {
		    applyFunc(checkBrand, [_makeFunction(function(v) { return makeBool(isFunction(v)); }), read, makeString("Function")]);
		    applyFunc(checkBrand, [_makeFunction(function(v) { return makeBool(isFunction(v)); }), write, makeString("Function")]);
		    return new PMutable(val, [read], [write]);
		}),
		"mk-simple-mutable": _makeFunction(function(val) {
		    return new PMutable(val, [], []);
		}),

		brander: brander,
		"check-brand": checkBrand,
		raise: _makeFunction(function(e) { console.log(e); throw makePyretException(e); }),

		"prim-num-keys": _makeFunction(function(v) {
		    return makeNumber(Object.keys(v.dict).length);
		}),
		"prim-has-field": _makeFunction(function(v, n) {
		    return makeBool(v.dict !== undefined && v.dict[n.s] !== undefined);
		}),
		"prim-keys": _makeFunction(function(v) {
		    var keys = Object.keys(v.dict);
		    var obj = makeObject({ "is-empty": makeBool(true) });
		    for (var i in keys) {
			obj = makeObject({
			    first: makeString(keys[i]),
			    rest: obj
			});
		    }

		    return obj;
		}),

		"data-to-repr": _makeFunction(function(val, name, fields) {
		    var out = [];
		    var flst = [];
		    var lst = fields;
		    if (lst.dict["first"] !== undefined) {
			do {
			    flst.push(getField(lst, "first"));
			    lst = getField(lst, "rest");
			} while (lst.dict["first"] !== undefined);

			for (var i in flst) {
			    out.push(toRepr(getField(val, flst[i].s)).s);
			}
		    }

		    return makeString(name.s + "(" + out.join(", ") + ")");
		}),

		equiv: _makeFunction(function (obj1, obj2) { // http://stackoverflow.com/a/3849480
		    function countProps(obj) {
			var count = 0;
			for (k in obj) if (obj.hasOwnProperty(k)) count++;
			return count;
		    }
		    function objectEquals(v1, v2) {
			if (typeof(v1) !== typeof(v2)) return false;
			else if (countProps(v1) !== countProps(v2)) return false;

			var r = true;
			for (k in v1) {
			    r = objectEquals(v1[k], v2[k]);
			    if (!r) return false;
			}
			return true;
		    }
		    if (isObject(obj1) && isObject(obj2)) {
			return makeBool(objectEquals(obj1.dict, obj2.dict));
		    }
		    else {
			return makeBool(obj1 === obj2);
		    }
		}),

		"data-equals": _makeFunction(function(self, other, brand, fields) {
		    var b1 = applyFunc(brand, [other]);

		    var b2 = true;
		    var field = fields;
		    while (fields.dict["first"] !== undefined) {
			var thisval = getField(self, getField(field, "first"));
			var otherval = getField(other, getField(field, "first"));
			b2 == b2 && applyFunc(getField(thisval, "equals"), [otherval]).b;
			field = getField(field, "rest");
		    }

		    return makeBool(b1 && b2);
		})

		/*
		builtins: makeObject({
		    equiv: _makeFunction(function (obj1, obj2) { // http://stackoverflow.com/a/3849480
			function countProps(obj) {
			    var count = 0;
			    for (k in obj) if (obj.hasOwnProperty(k)) count++;
			    return count;
			}
			function objectEquals(v1, v2) {
			    if (typeof(v1) !== typeof(v2)) return false;
			    else if (countProps(v1) !== countProps(v2)) return false;

			    var r = true;
			    for (k in v1) {
				r = objectEquals(v1[k], v2[k]);
				if (!r) return false;
			    }
			    return true;
			}
			if (isObject(obj1) && isObject(obj2)) {
			    return makeBool(objectEquals(obj1.dict, obj2.dict));
			}
			else {
			    return makeBool(obj1 === obj2);
			}
		    }),
		    
		    
		    "has-field": _makeFunction(function(obj, name) {
			return makeBool(obj.dict[name.s] !== undefined);
		    })
		})*/
	    }),
	    runtime: {
		nothing: {},

		makeFunction: makeFunction,
		makeMethod: makeMethod,
		makeObject: makeObject,
		makeNumber: makeNumber,
		makeBool: makeBool,
		makeString: makeString,


		isFunction: isFunction,
		isMethod: isMethod,
		isObject: isObject,
		isNumber: isNumber,
		isBool: isBool,
		isString: isString,
		isPlaceholder: isPlaceholder,
		isMutable: isMutable,

		isTrue: isTrue,


		applyFunc: applyFunc,
		equal: equal,
		getRawField: getRawField,
		getField: getField,
		getMutableField: getMutableField,
		getTestPrintOutput: function(val) {
		    return testPrintOutput + toRepr(val).s;
		},
		NormalResult: NormalResult,
		FailResult: FailResult,
		PyretException: PyretException,
		makeNormalResult: makeNormalResult,
		makeFailResult: makeFailResult,
		makePyretException: makePyretException,
		toReprJS: toRepr,
		errToJSON: errToJSON
	    }
	}
    }

    return {
	makeRuntime: makeRuntime
    };
})();
