var Pyret = (function () {

    function makeRuntime() {

	/* p-base */

	/* p-nothing */

	var nothing = {};

	/* p-object */

	/* p-number */

	function PNumber(n) {
	    this.n = n;
	}
	function makeNumber(n) { return new PNumber(n); }
	function isNumber(v) { return v instanceof PNumber; }

	var numberDict = {
	    _plus: makeMethod(function(left, right) {
		return makeNumber(left.n + right.n);
	    }),
	    _add: makeMethod(function(left, right) {
		return makeNumber(left.n + right.n);
	    }),
	    _minus: makeMethod(function(left, right) {
		return makeNumber(left.n - right.n);
	    }),
	    _divide: makeMethod(function(left, right) {
		return makeNumber(left.n / right.n);
	    }),
	    _times: makeMethod(function(left, right) {
		return makeNumber(left.n * right.n);
	    }),
	    _torepr: makeMethod(function(self) {
		return makeString(self.n.toString());
	    }),
	    _equals: makeMethod(function(left, right) {
		return makeBool(left.n == right.n);
	    }),
	    _lessthan: makeMethod(function(left, right) {
		return makeBool(left.n < right.n);
	    }),
	    _greaterthan: makeMethod(function(left, right) {
		return makeBool(left.n > right.n);
	    }),
	    _lessequal: makeMethod(function(left, right) {
		return makeBool(left.n <= right.n);
	    }),
	    _greaterequal: makeMethod(function(left, right) {
		return makeBool(left.n >= right.n);
	    }),
	    tostring: makeMethod(function(self) {
		return makeString(self.n.toString());
	    }),
	    modulo: makeMethod(function(left, right) {
		return makeNumber(left.n % right.n);
	    }),
	    truncate: makeMethod(function(self) {
		return makeNumber(Math.floor(self.n));
	    }),
	    abs: makeMethod(function(self) {
		return makeNumber(Math.abs(self.n));
	    }),
	    max: makeMethod(function(left, right) {
		return makeNumber(Math.max(left.n, right.n));
	    }),
	    min: makeMethod(function(left, right) {
		return makeNumber(Math.min(left.n, right.n));
	    }),
	    sin: makeMethod(function(self) {
		return makeNumber(Math.min(self.n));
	    }),
	    cos: makeMethod(function(self) {
		return makeNumber(Math.cos(self.n));
	    }),
	    tan: makeMethod(function(self) {
		return makeNumber(Math.tan(self.n));
	    }),
	    asin: makeMethod(function(self) {
		return makeNumber(Math.asin(self.n));
	    }),
	    acos: makeMethod(function(self) {
		return makeNumber(Math.acos(self.n));
	    }),
	    atan: makeMethod(function(self) {
		return makeNumber(Math.atan(self.n));
	    }),
	    sqr: makeMethod(function(self) {
		return makeNumber(self.n * self.n);
	    }),
	    sqrt: makeMethod(function(self) {
		return makeNumber(Math.sqrt(self.n));
	    }),
	    ceiling: makeMethod(function(self) {
		return makeNumber(Math.ceil(self.n));
	    }),
	    floor: makeMethod(function(self) {
		return makeNumber(Math.floor(self.n));
	    }),
	    log: makeMethod(function(self) {
		return makeNumber(Math.log(self.n));
	    }),
	    exp: makeMethod(function(self) {
		return makeNumber(Math.exp(self.n));
	    }),
	    exact: makeMethod(function(self) {
		return self;
	    }),
	    expt: makeMethod(function(base, power) {
		return makeNumber(Math.pow(base.n, power.n));
	    })
	};

	PNumber.prototype = {
	    dict : numberDict
	};

	/* p-bool */

	function PBool(b) {
	    this.b = b;
	}
	function makeBool(b) { return new PBool(b); }
	function isBool(v) { return v instanceof PBool; }

	var boolDict = {
	    _and: makeMethod(function(left, right) {
		return makeBool(left.b && right.b);
	    }),
	    _or: makeMethod(function(left, right) {
		return makeBool(left.b || right.b);
	    }),
	    tostring: makeMethod(function(self) {
		return makeString(self.b.toString());
	    }),
	    _torepr: makeMethod(function(self) {
		return makeString(self.b.toString());
	    }),
	    _equals: makeMethod(function(left, right) {
		return makeBool(left.b == right.b);
	    }),
	    _not: makeMethod(function(self) {
		return makeBool(!self.b);
	    })
	};

	PBool.prototype = {
	    dict: boolDict
	};
	
	/* p-string */

	function PString(s) {
	    this.s = s;
	}
	function makeString(s) { return new PString(s); }
	function isString(v) { return v instanceof PString; }

	String.prototype.repeat = function(n) {
	    return new Array(1 + n).join(this);
	};

	var stringDict = {
	    _plus: makeMethod(function(left, right) {
		return makeString(left.s + right.s);
	    }),
	    _lessequal: makeMethod(function(left, right) {
		return makeBool(left.s <= right.s);
	    }),
	    _lessthan: makeMethod(function(left, right) {
		return makeBool(left.s < right.s);
	    }),
	    _greaterthan: makeMethod(function(left, right) {
		return makeBool(left.s > right.s);
	    }),
	    _greaterequal: makeMethod(function(left, right) {
		return makeBool(left.s >= right.s);
	    }),
	    _equals: makeMethod(function(left, right) {
		return makeBool(left.s == right.s);
	    }),
	    append: makeMethod(function(left, right) {
		return makeString(left.s + right.s);
	    }),
	    contains: makeMethod(function(haystack, needle) {
		return makeBool(haystack.s.indexOf(needle.s) != -1);
	    }),
	    replace: makeMethod(function(str, substr, newsubstr) {
		return makeString(str.s.replace(substr.s, newsubstr.s));
	    }),
	    substring: makeMethod(function(str, start, end) {
		return makeString(str.s.substring(start.n, end.n));
	    }),
	    "char-at": makeMethod(function(str, index) {
		return makeString(str.s.charAt(index.n));
	    }),
	    repeat: makeMethod(function(str, times) {
		return makeString(str.s.repeat(times.n));
	    }),
	    length: makeMethod(function(self) {
		return makeNumber(self.s.length);
	    }),
	    tonumber: makeMethod(function(self) {
		return makeNumber(parseFloat(self.s));
	    }),
	    tostring: makeMethod(function(self) {
		return self;
	    }),
	    _torepr: makeMethod(function(self) {
		return self;
	    })
	};

	PString.prototype = {
	    dict : stringDict
	};

	/* p-fun */

	function PFunction(f) {
	    this.app = f;
	}
	function makeFunction(f) { return new PFunction(f); }
	function isFunction(v) { return v instanceof PFunction; }

	PFunction.prototype = {
	    dict: {} 
	};

	/* p-method */

	function PMethod(f) {
	    this.method = f;
	}
	function makeMethod(f) { return new PMethod(f); } 
	function isMethod(v) { return v instanceof PMethod; }

	PMethod.prototype = {
	    app: function() { throw "Cannot apply method directly."; },
	    dict: {}
	};

	/* p-mutable */

	/* p-placeholder */

	/* other */

	function equal(val1, val2) {
	    if(isNumber(val1) && isNumber(val2)) {
		return val1.n === val2.n;
	    }
	    else if (isString(val1) && isString(val2)) {
		return val1.s === val2.s;
	    }
	    return false;
	}

	function toRepr(val) {
	    if(isNumber(val)) {
		return makeString(String(val.n));
	    }
	    else if (isString(val)) {
		return makeString('"' + val.s + '"');
	    }
	    else if (isFunction(val)) {
		return makeString("fun: end");
	    }
	    else if (isMethod(val)) {
		return makeString("method: end");
	    }
	    throw ("toStringJS on an unknown type: " + val);
	}

	function getField(val, str) {
	    var fieldVal = val.dict[str];
	    if (isMethod(fieldVal)) {
		return makeFunction(function() {
		    var argList = Array.prototype.slice.call(arguments);
		    return fieldVal.method.apply(null, [val].concat(argList));
		});
	    } else {
		return fieldVal;
	    }
	}

	var testPrintOutput = "";
	function testPrint(val) {
	    var str = toRepr(val).s;
	    console.log("testPrint: ", val, str);
	    testPrintOutput += str + "\n";
	    return val;
	}

	return {
	    nothing: nothing,

	    makeNumber: makeNumber,
	    isNumber: isNumber,

	    makeBool: makeBool,
	    isBool: isBool,

	    makeString: makeString,
	    isString: isString,

	    equal: equal,
	    getField: getField,
	    "test-print": makeFunction(testPrint),
	    getTestPrintOutput: function(val) {
		return testPrintOutput + toRepr(val).s;
	    }
	};
    }

    return {
	makeRuntime: makeRuntime
    };
})();

