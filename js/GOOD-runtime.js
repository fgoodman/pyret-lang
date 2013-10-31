var PYRET = (function() {
    function makeRuntime() {

	//////////////////////
	// Data             //
	//////////////////////

	/* Start Helpers */
	var badApp = function(type) {
	    return function() {
		throw makeString("check-fun: expected function, got " + type);
	    };
	};

	var badMeth = function(type) {
	    return function() {
		throw makeString("check-method: expected method, got " + type);
	    };
	};
	/* End Helpers */

	/* Start Base */
	function PBase() {}
	PBase.prototype = {
	    brands: [],
	    dict: {},
	    app: badApp("base"),
	    method: badMeth("base")
	};
	/* End Base */

	/* Start Function */
	function PFunction(f, doc) {
	    this.app = f;
	    this.arity = f.length;
	    this.dict = {
		_doc: doc,
		_method: new _PFunction(function () {
		    return makeMethod(f, doc);
		})
	    };
	}
	function _PFunction(f) { this.app = f; }
	function makeFunction(f, doc) { return new PFunction(f, doc); }
	function _makeFunction(f) { return new PFunction(f, makeString("")); }
	function isFunction(v) { return v instanceof PFunction; }
	PFunction.prototype = Object.create(PBase.prototype);
	PFunction.prototype.method = badMeth("function");
	/* End Function */
	
	/* Start Method */
	function PMethod(m, doc, arity) {
	    this.method = m;
	    this.arity = m.length;
	    this.dict = {
		_doc: doc,
		_fun: _makeFunction(function () {
		    return makeFunction(m, doc);
		})
	    };
	}
	function makeMethod(m, doc) { return new PMethod(m, doc); }
	function _makeMethod(m, arity) { return new PMethod(m, makeString("")); }
	function isMethod(v) { return v instanceof PMethod; }
	PMethod.prototype = Object.create(PBase.prototype);
	PMethod.prototype.app = badApp("method");
	/* End Method */

	/* Start Object */
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
	/* End Object */

	/* Start Number */
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
		if (r.n === 0) throw makeString("Division by zero");
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
	/* End Number */

	/* Start Bool */
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
		r = r.app();
		checkPrimitive(isBool, "and", [l, r]);
		return makeBool(l.b && r.b);
	    }),
	    _or: _makeMethod(function(l, r) {
		r = r.app();
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
		r = r.app();
		checkPrimitive(isBool, "equals", [l, r]);
		return makeBool(l.b === r.b);
	    }),
	    _not: _makeMethod(function(self) {
		return makeBool(!self.b);
	    })
	};
	/* End Bool */

	/* Start String */
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
	    char_DASH_at: _makeMethod(function(l, r) {
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
		if (isNaN(n)) throw makeString("");
		return makeNumber(n);
	    }),
	    tostring: _makeMethod(function(l) {
		return l;
	    }),
	    _torepr: _makeMethod(function(l) {
		return makeString("\"" + l.s + "\"");
	    })
	};
	/* End String */

	/* Start Placeholder */
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
		    throwTypeError("Placeholder", self);
		}
		else {
		    checkBrand.app(makePredicate(isFunction), g, makeString("Function"));

		    if (self.v !== undefined) throw makeObject({message:makeString("Tried to add guard on an already-initialized placeholder")});

		    self.guards.push(g);
		}
	    }),
	    set: _makeMethod(function(self, v) {
		if (!isPlaceholder(self)) {
		    throwTypeError("Placeholder", self);
		}
		else if (self.v !== undefined) {
		    throw makeObject({message:makeString("Tried to set value in already-initialized placeholder")});
		}
		else {
		    for (var i in self.guards) self.guards[i].app(v);
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
	    if (!isPlaceholder(p)) throwTypeError("Placeholder", p);
	    if (p.v !== undefined) {
		return p.v;
	    }
	    else {
		throw makeObject({message:makeString("Tried to get value from uninitialized placeholder")});
	    }
	}
	/* End Placeholder */

	/* Start Mutable */
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
	/* End Mutable */

	//////////////////////
	// Moorings         //
	//////////////////////

	/* Start Error */
	var error = makeObject({
	    make_DASH_error: _makeMethod(function(self, e) {
		return e;// makeObject({ message: makeString(e) });
	    }),
	    cases_DASH_miss: _makeMethod(function(self, e) {
		return e;
	    }),
	    location: _makeMethod(function(self, e) {
		return e;
	    })
	});
	/* End Error */

	/* Start Builtins */
	var builtins = makeObject({
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
	    data_DASH_to_DASH_repr: _makeFunction(function(val, name, fields) {
		var out = [];
		var flst = [];
		var lst = fields;
		if (!getField(list, "is-empty").app(lst).b) {
		    do {
			flst.push(getField(lst, "first"));
			lst = getField(lst, "rest");
		    } while (getField(list, "is-link").app(lst).b);

		    for (var i in flst) {
			out.push(toRepr(getField(val, flst[i].s)).s);
		    }
		}

		return makeString(name.s + "(" + out.join(", ") + ")");
	    }),
	    has_DASH_field: _makeFunction(function(obj, name) {
		return makeBool(obj.dict[name.s] !== undefined);
	    })
	});
	/* End Builtins */

	/* Start Check-Brand */
	var checkBrand = _makeFunction(function(ck, o, s) {
	    if (isString(s)) {
		checkArity(ck.arity, [o]); // TODO: is this the best way to check arity?

		var f = ck.app;
		var check_v = f(o);
		if (isTrue(check_v)) {
		    return o;
		}
		else {
		    throwTypeError(s.s, o);
		}
	    }
	    else if (isString(ck)) {
		throw makeString("cannot check-brand with non-function");
	    }
	    else if (isFunction(ck)) {
		throw makeString("cannot check-brand with non-string");
	    }
	    else {
		throw makeString("check-brand failed");
	    }
	});
	/* End Check-Brand */

	var brander = _makeFunction(function() {

	    checkArity(0, Array.prototype.slice.call(arguments));

	    var brand_id = (function () { // http://stackoverflow.com/a/1349426
		var text = "b";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (var i = 0; i < 10; i++)
		    text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	    })();

	    return makeObject({
		brand: _makeMethod(function(self, v) {
		    var arr = Array.prototype.slice.call(arguments);
		    arr.shift();
		    checkArity(1, arr);

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
			    getField(nv, "guard").app(v.guards[i]);
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

	var list = (function() {
	    var branderList = brander.app();
	    var List = getField(branderList, "test");

	    var branderLink = brander.app();
	    var isLink = getField(branderLink, "test");
	    var linkBase = makeObject({
		length: _makeMethod(function(self) {
		    var out = 0;
		    var lst = self;
		    while (isLink.app(getField(lst, "rest")).b) {
			out += 1;
			lst = getField(lst, "rest");
		    }
		    return makeNumber(out);
		}),
		_plus: _makeMethod(function(self, lst) {
		    // TODO: figure out how to do this with a loop
		    return link.app(getField(self, 'first'), getField(getField(self, 'rest'), '_plus').app(lst));
		}),
		_torepr: _makeMethod(function(self) {
		    var out = [];
		    var lst = self;
		    while (isLink.app(lst).b) {
			out.push(getField(getField(lst, "first"), "tostring").app().s);
			lst = getField(lst, "rest");
		    }
		    return makeString("[" + out.join(", ") + "]");
		}),
		tostring: _makeMethod(function(self) {
		    return makeString(toRepr(getRawField(self, "first")).s);
		}),
		map: _makeMethod(function(self, f) {
		    var out = empty;
		    var lst = self;
		    while (isLink.app(lst).b) {
			out = link.app(f.app(getField(lst, "first")), out);
			lst = getField(lst, "rest");
		    }

		    return out;
		}),
		_equals: _makeMethod(function(self, other) {
		    var lst1 = self;
		    var lst2 = other;
		    while (isLink.app(lst1).b && isLink.app(lst2).b) {
			if (!getField(getField(lst1, "first"), "_equals").app(getField(lst2, "first"))) return makeBool(false);
			lst1 = getField(lst1, "rest");
			lst2 = getField(lst2, "rest");
		    }

		    return makeBool(isEmpty.app(lst1).b && isEmpty.app(lst2).b);
		}),
		is_DASH_empty: makeBool(false),
		is_DASH_link: makeBool(true)
	    });
	    var link = _makeFunction(function(first, rest) {
		return getField(branderList, "brand").app(getField(branderLink, "brand").app(linkBase.extend("first", first).extend("rest", rest)));
	    });

	    var branderEmpty = brander.app();
	    var isEmpty = getField(branderEmpty, "test");
	    var emptyBase = makeObject({
		length: _makeMethod(function(self) {
		    return makeNumber(0);
		}),
		_plus: _makeMethod(function(self, lst) {
		    return lst;
		}),
		_torepr: _makeMethod(function(self) {
		    return makeString("[]");
		}),
		tostring: _makeMethod(function(self) {
		    return makeString("");
		}),
		map: _makeMethod(function(self, f) {
		    return self;
		}),
		_equals: _makeMethod(function(self, other) {
		    return makeBool(self === other);
		}),
		is_DASH_empty: makeBool(true),
		is_DASH_link: makeBool(false)
	    });
	    var empty = _makeFunction(function () {
		return getField(branderList, "brand").app(getField(branderEmpty, "brand").app(emptyBase));
	    }).app();

	    return makeObject({
		List: List,
		is_DASH_link: isLink,
		link: link,
		is_DASH_empty: isEmpty,
		empty: empty
	    });
	})();

	var primKeys = _makeFunction(function(o) {
	    var keys = Object.keys(o.dict);
	    var lst = getField(list, "empty");
	    for (var i in keys) {
		lst = getField(list, "link").app(makeString(keys[i]), lst);
	    }
	    return lst;
	});

	//////////////////////
	// Other            //
	//////////////////////

	/* Start Get Functions */
	function getRawField(v, f) {
	    f = f.split("-").join("_DASH_");
	    var vfield = v.dict[f];
	    if (vfield !== undefined) {
		return vfield;
	    }
	    else {
		throw makeString(f + " was not found on " + toRepr(v).s);
	    }
	}

	// Get the immutable field value from a Pyret value
	function getField(v, f) {
	    var vfield = getRawField(v, f);

	    if (isMutable(vfield)) {
		throw makeString("Cannot look up mutable field \"" + f + "\" using dot or bracket");
	    }
	    else if (isPlaceholder(vfield)) {
		return getPlaceholderValue(vfield);
	    }
	    else if (isMethod(vfield)) {
		var f = makeFunction(function () {
                    var argList = Array.prototype.slice.call(arguments);
                    return vfield.method.apply(null, [v].concat(argList));
                }, vfield.dict._doc);
		f.arity = vfield.method.length - 1;
		return f;
	    }
	    else {
		return vfield;
	    }
	}

	// Get the mutable field value from a Pyret value
	function getMutableField(v, f) {
	    var vfield = getRawField(v, f);
	    if (isMutable(vfield)) {
		// read checks
		return vfield;
	    }
	    else {
		throw makeString("Cannot look up immutable field \"" + f + "\" with the ! operator");
	    }
	}
	/* End Get Functions */

	/* Start Generic Helpers */
	function makePredicate(f) {
	    return _makeFunction(function(v) {
		return makeBool(f(v));
	    });
	}

	function checkArity(n, args) {
	    if (n !== args.length) {
		var fs = "";
		if (n !== 1) fs = "s";
		var as = "";
		if (args.length !== 1) as = "s";
		var w = "were";
		if (args.length == 1) w = "was";
		var r = "none.";
		if (args.length > 0) r = args.length + ".  The "
		    + args.length + " provided argument" + as + " " + w + ":\n"
		    + Array.prototype.slice.call(args).map(function (x) {
			return toRepr(x).s;
		    }).join("\n");
		throw makeString("Expected " + n + " argument" + fs + ", but got " + r);


		if (args.length === 0) {
		    throw makeString("Expected " + n + " argument, but got none.");
		}
		else {
		    throw makeString("Expected " + n + " arguments, but got " + args.length + ".  The "
			+ args.length + " provided argument was:\n"
			+ Array.prototype.slice.call(args).map(function (x) {
			    return toRepr(x).s;
			}).join("\n"));
		}
		
	    } 
	}

	function checkPrimitive(f, name, args) {
	    for (var i = 0; i < args.length; i++) {
		if (!f(args[i])) throw makeString("Bad args to prim: " + name + " : " +
		    Array.prototype.map.call(args, function (arg) {
			return String(toRepr(arg).s).replace(/\"+/g, ""); // TODO: make this not ugly
		    }).join(", "));
	    }
	}

	function throwTypeError(typname, o) {
	    throw makeString("typecheck failed; expected " + typname + " and got\n" + toRepr(o).s);
	}
	/* End Generic Helpers */

	/* Start Testing */
	function equal(val1, val2) {
	    if (isObject(val1) && isObject(val2)) {
		return val1.dict === val2.dict;
	    }
            if (isNumber(val1) && isNumber(val2)) {
                return val1.n === val2.n;
            }
	    else if (isBool(val1) && isBool(val2)) {
		return val1.b === val2.b;
	    }
	    else if (isString(val1) && isString(val2)) {
                return val1.s === val2.s;
            }
	    else if (isFunction(val1) && isFunction(val2)) {
		return val1.app === val2.app;
	    }
	    else if (isMethod(val1) && isMethod(val2)) {
		return val1.method === val2.method;
	    }
	    else if (isPlaceholder(val1) && isPlaceholder(val2)) {
		return val1.v === val2.v;
	    }
	    else if (isMutable(val1) && isMutable(val2)) {
		return val1.v === val2.v;
	    }

            return false;
        }

	function toRepr(v) {
	    if (isFunction(v)) return makeString("fun(): end");
	    else if (isObject(v) && v.dict._torepr === undefined) {
		var fields = [];
		for (var i in v.dict) {
		    fields.push(i + ": " + toRepr(v.dict[i]).s);
		}
		return makeString("{" + fields.join(", ") + "}");
	    }
	    return getField(v, "_torepr").app();
	}

	function toString(v) {
	    return getField(v, "tostring").app();
	}


	var testPrintOutput = "";

        function testPrint(val) {
            var str = toRepr(val).s;
            console.log("testPrint: ", val, str);
            testPrintOutput += str + "\n";
            return val;
        }

        function NormalResult(val) {
            this.val = val;
        }

        function makeNormalResult(val) {
            return new NormalResult(val);
        }

        function FailResult(exn) {
            this.exn = exn;
        }

        function makeFailResult(exn) {
            return new FailResult(exn);
        }

	function errToJSON(exn) {
	    if (isObject(exn)) exn = getField(exn, "message");
	    return String(exn.s);
        }
	/* End Testing */

	return {
	    nothing: {},

	    makeFunction: makeFunction,
	    makeMethod: makeMethod,
	    makeObject: makeObject,
	    makeNumber: makeNumber,
	    makeBool: makeBool,
	    makeString: makeString,
	    "mk-placeholder": _makeFunction(function () {
		return new PPlaceholder();
	    }),
	    "mk-mutable": _makeFunction(function(val, read, write) {
		checkBrand.app(makePredicate(isFunction), read, makeString("Function"));
		checkBrand.app(makePredicate(isFunction), write, makeString("Function"));
		return new PMutable(val, [read], [write]);
	    }),
	    "mk-simple-mutable": _makeFunction(function(val) {
		return new PMutable(val, [], []);
	    }),


	    isFunction: isFunction,
	    isMethod: isMethod,
	    isObject: isObject,
	    isNumber: isNumber,
	    isBool: isBool,
	    isString: isString,
	    isPlaceholder: isPlaceholder,
	    isMutable: isMutable,

	    isTrue: isTrue,

	    Function: makePredicate(isFunction),
	    Method: makePredicate(isMethod),
	    Object: makePredicate(isObject),
	    Number: makePredicate(isNumber),
	    Bool: makePredicate(isBool),
	    String: makePredicate(isString),
	    Placeholder: makePredicate(isPlaceholder),
	    Mutable: makePredicate(isMutable),

	    "is-function": makePredicate(isFunction),
	    "is-method": makePredicate(isMethod),
	    "is-object": makePredicate(isObject),
	    "is-number": makePredicate(isNumber),
	    "is-bool": makePredicate(isBool),
	    "is-string": makePredicate(isString),
	    "is-placeholder": makePredicate(isPlaceholder),
	    "is-mutable": makePredicate(isMutable),
   
	    list: list,
	    "check-brand": checkBrand,
	    brander: brander,
	    builtins: builtins,
	    error: error,
	    raise: _makeFunction(function(e) {
		throw e;
	    }),
	    "prim-num-keys": _makeFunction(function(v) {
		return makeNumber(Object.keys(v.dict).length);
	    }),
	    "prim-has-field": _makeFunction(function(v, n) {
		return makeBool(v.dict[n.s] !== undefined);
	    }),
	    "prim-keys": primKeys,

	    getRawField: getRawField,
	    getField: getField,
	    getMutableField: getMutableField,

	    equal: equal,
	    torepr: _makeFunction(function(v) {
		return toRepr(v);
	    }),
	    tostring: _makeFunction(function(v) {
		return toString(v);
	    }),

	    NormalResult: NormalResult,
	    makeNormalResult: makeNormalResult,
	    FailResult: FailResult,
	    makeFailResult: makeFailResult,
	    errToJSON: errToJSON,

	    "test-print": _makeFunction(testPrint),
	    getTestPrintOutput: function (val) {
                return testPrintOutput + toRepr(val).s;
            }
	};
    }

    return {
	makeRuntime: makeRuntime
    };
})();