var $m = (e) => {
  throw TypeError(e);
};
var xc = (e, t, n) => t.has(e) || $m('Cannot ' + n);
var R = (e, t, n) => (
    xc(e, t, 'read from private field'),
    n ? n.call(e) : t.get(e)
  ),
  oe = (e, t, n) =>
    t.has(e)
      ? $m('Cannot add the same private member more than once')
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, n),
  X = (e, t, n, r) => (
    xc(e, t, 'write to private field'),
    r ? r.call(e, n) : t.set(e, n),
    n
  ),
  Ie = (e, t, n) => (xc(e, t, 'access private method'), n);
var Aa = (e, t, n, r) => ({
  set _(o) {
    X(e, t, o, n);
  },
  get _() {
    return R(e, t, r);
  },
});
function I2(e, t) {
  for (var n = 0; n < t.length; n++) {
    const r = t[n];
    if (typeof r != 'string' && !Array.isArray(r)) {
      for (const o in r)
        if (o !== 'default' && !(o in e)) {
          const s = Object.getOwnPropertyDescriptor(r, o);
          s &&
            Object.defineProperty(
              e,
              o,
              s.get ? s : { enumerable: !0, get: () => r[o] }
            );
        }
    }
  }
  return Object.freeze(
    Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' })
  );
}
(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) r(o);
  new MutationObserver((o) => {
    for (const s of o)
      if (s.type === 'childList')
        for (const i of s.addedNodes)
          i.tagName === 'LINK' && i.rel === 'modulepreload' && r(i);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(o) {
    const s = {};
    return (
      o.integrity && (s.integrity = o.integrity),
      o.referrerPolicy && (s.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === 'use-credentials'
        ? (s.credentials = 'include')
        : o.crossOrigin === 'anonymous'
          ? (s.credentials = 'omit')
          : (s.credentials = 'same-origin'),
      s
    );
  }
  function r(o) {
    if (o.ep) return;
    o.ep = !0;
    const s = n(o);
    fetch(o.href, s);
  }
})();
function xg(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default')
    ? e.default
    : e;
}
var yg = { exports: {} },
  yl = {},
  wg = { exports: {} },
  te = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var xa = Symbol.for('react.element'),
  L2 = Symbol.for('react.portal'),
  F2 = Symbol.for('react.fragment'),
  $2 = Symbol.for('react.strict_mode'),
  z2 = Symbol.for('react.profiler'),
  W2 = Symbol.for('react.provider'),
  U2 = Symbol.for('react.context'),
  B2 = Symbol.for('react.forward_ref'),
  H2 = Symbol.for('react.suspense'),
  V2 = Symbol.for('react.memo'),
  Y2 = Symbol.for('react.lazy'),
  zm = Symbol.iterator;
function G2(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (zm && e[zm]) || e['@@iterator']),
      typeof e == 'function' ? e : null);
}
var bg = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  Ng = Object.assign,
  jg = {};
function rs(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = jg),
    (this.updater = n || bg));
}
rs.prototype.isReactComponent = {};
rs.prototype.setState = function (e, t) {
  if (typeof e != 'object' && typeof e != 'function' && e != null)
    throw Error(
      'setState(...): takes an object of state variables to update or a function which returns an object of state variables.'
    );
  this.updater.enqueueSetState(this, e, t, 'setState');
};
rs.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function Cg() {}
Cg.prototype = rs.prototype;
function Ld(e, t, n) {
  ((this.props = e),
    (this.context = t),
    (this.refs = jg),
    (this.updater = n || bg));
}
var Fd = (Ld.prototype = new Cg());
Fd.constructor = Ld;
Ng(Fd, rs.prototype);
Fd.isPureReactComponent = !0;
var Wm = Array.isArray,
  Sg = Object.prototype.hasOwnProperty,
  $d = { current: null },
  Eg = { key: !0, ref: !0, __self: !0, __source: !0 };
function kg(e, t, n) {
  var r,
    o = {},
    s = null,
    i = null;
  if (t != null)
    for (r in (t.ref !== void 0 && (i = t.ref),
    t.key !== void 0 && (s = '' + t.key),
    t))
      Sg.call(t, r) && !Eg.hasOwnProperty(r) && (o[r] = t[r]);
  var l = arguments.length - 2;
  if (l === 1) o.children = n;
  else if (1 < l) {
    for (var c = Array(l), u = 0; u < l; u++) c[u] = arguments[u + 2];
    o.children = c;
  }
  if (e && e.defaultProps)
    for (r in ((l = e.defaultProps), l)) o[r] === void 0 && (o[r] = l[r]);
  return {
    $$typeof: xa,
    type: e,
    key: s,
    ref: i,
    props: o,
    _owner: $d.current,
  };
}
function K2(e, t) {
  return {
    $$typeof: xa,
    type: e.type,
    key: t,
    ref: e.ref,
    props: e.props,
    _owner: e._owner,
  };
}
function zd(e) {
  return typeof e == 'object' && e !== null && e.$$typeof === xa;
}
function Q2(e) {
  var t = { '=': '=0', ':': '=2' };
  return (
    '$' +
    e.replace(/[=:]/g, function (n) {
      return t[n];
    })
  );
}
var Um = /\/+/g;
function yc(e, t) {
  return typeof e == 'object' && e !== null && e.key != null
    ? Q2('' + e.key)
    : t.toString(36);
}
function ui(e, t, n, r, o) {
  var s = typeof e;
  (s === 'undefined' || s === 'boolean') && (e = null);
  var i = !1;
  if (e === null) i = !0;
  else
    switch (s) {
      case 'string':
      case 'number':
        i = !0;
        break;
      case 'object':
        switch (e.$$typeof) {
          case xa:
          case L2:
            i = !0;
        }
    }
  if (i)
    return (
      (i = e),
      (o = o(i)),
      (e = r === '' ? '.' + yc(i, 0) : r),
      Wm(o)
        ? ((n = ''),
          e != null && (n = e.replace(Um, '$&/') + '/'),
          ui(o, t, n, '', function (u) {
            return u;
          }))
        : o != null &&
          (zd(o) &&
            (o = K2(
              o,
              n +
                (!o.key || (i && i.key === o.key)
                  ? ''
                  : ('' + o.key).replace(Um, '$&/') + '/') +
                e
            )),
          t.push(o)),
      1
    );
  if (((i = 0), (r = r === '' ? '.' : r + ':'), Wm(e)))
    for (var l = 0; l < e.length; l++) {
      s = e[l];
      var c = r + yc(s, l);
      i += ui(s, t, n, c, o);
    }
  else if (((c = G2(e)), typeof c == 'function'))
    for (e = c.call(e), l = 0; !(s = e.next()).done; )
      ((s = s.value), (c = r + yc(s, l++)), (i += ui(s, t, n, c, o)));
  else if (s === 'object')
    throw (
      (t = String(e)),
      Error(
        'Objects are not valid as a React child (found: ' +
          (t === '[object Object]'
            ? 'object with keys {' + Object.keys(e).join(', ') + '}'
            : t) +
          '). If you meant to render a collection of children, use an array instead.'
      )
    );
  return i;
}
function Oa(e, t, n) {
  if (e == null) return e;
  var r = [],
    o = 0;
  return (
    ui(e, r, '', '', function (s) {
      return t.call(n, s, o++);
    }),
    r
  );
}
function q2(e) {
  if (e._status === -1) {
    var t = e._result;
    ((t = t()),
      t.then(
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 1), (e._result = n));
        },
        function (n) {
          (e._status === 0 || e._status === -1) &&
            ((e._status = 2), (e._result = n));
        }
      ),
      e._status === -1 && ((e._status = 0), (e._result = t)));
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var Ge = { current: null },
  di = { transition: null },
  X2 = {
    ReactCurrentDispatcher: Ge,
    ReactCurrentBatchConfig: di,
    ReactCurrentOwner: $d,
  };
function Pg() {
  throw Error('act(...) is not supported in production builds of React.');
}
te.Children = {
  map: Oa,
  forEach: function (e, t, n) {
    Oa(
      e,
      function () {
        t.apply(this, arguments);
      },
      n
    );
  },
  count: function (e) {
    var t = 0;
    return (
      Oa(e, function () {
        t++;
      }),
      t
    );
  },
  toArray: function (e) {
    return (
      Oa(e, function (t) {
        return t;
      }) || []
    );
  },
  only: function (e) {
    if (!zd(e))
      throw Error(
        'React.Children.only expected to receive a single React element child.'
      );
    return e;
  },
};
te.Component = rs;
te.Fragment = F2;
te.Profiler = z2;
te.PureComponent = Ld;
te.StrictMode = $2;
te.Suspense = H2;
te.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = X2;
te.act = Pg;
te.cloneElement = function (e, t, n) {
  if (e == null)
    throw Error(
      'React.cloneElement(...): The argument must be a React element, but you passed ' +
        e +
        '.'
    );
  var r = Ng({}, e.props),
    o = e.key,
    s = e.ref,
    i = e._owner;
  if (t != null) {
    if (
      (t.ref !== void 0 && ((s = t.ref), (i = $d.current)),
      t.key !== void 0 && (o = '' + t.key),
      e.type && e.type.defaultProps)
    )
      var l = e.type.defaultProps;
    for (c in t)
      Sg.call(t, c) &&
        !Eg.hasOwnProperty(c) &&
        (r[c] = t[c] === void 0 && l !== void 0 ? l[c] : t[c]);
  }
  var c = arguments.length - 2;
  if (c === 1) r.children = n;
  else if (1 < c) {
    l = Array(c);
    for (var u = 0; u < c; u++) l[u] = arguments[u + 2];
    r.children = l;
  }
  return { $$typeof: xa, type: e.type, key: o, ref: s, props: r, _owner: i };
};
te.createContext = function (e) {
  return (
    (e = {
      $$typeof: U2,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: W2, _context: e }),
    (e.Consumer = e)
  );
};
te.createElement = kg;
te.createFactory = function (e) {
  var t = kg.bind(null, e);
  return ((t.type = e), t);
};
te.createRef = function () {
  return { current: null };
};
te.forwardRef = function (e) {
  return { $$typeof: B2, render: e };
};
te.isValidElement = zd;
te.lazy = function (e) {
  return { $$typeof: Y2, _payload: { _status: -1, _result: e }, _init: q2 };
};
te.memo = function (e, t) {
  return { $$typeof: V2, type: e, compare: t === void 0 ? null : t };
};
te.startTransition = function (e) {
  var t = di.transition;
  di.transition = {};
  try {
    e();
  } finally {
    di.transition = t;
  }
};
te.unstable_act = Pg;
te.useCallback = function (e, t) {
  return Ge.current.useCallback(e, t);
};
te.useContext = function (e) {
  return Ge.current.useContext(e);
};
te.useDebugValue = function () {};
te.useDeferredValue = function (e) {
  return Ge.current.useDeferredValue(e);
};
te.useEffect = function (e, t) {
  return Ge.current.useEffect(e, t);
};
te.useId = function () {
  return Ge.current.useId();
};
te.useImperativeHandle = function (e, t, n) {
  return Ge.current.useImperativeHandle(e, t, n);
};
te.useInsertionEffect = function (e, t) {
  return Ge.current.useInsertionEffect(e, t);
};
te.useLayoutEffect = function (e, t) {
  return Ge.current.useLayoutEffect(e, t);
};
te.useMemo = function (e, t) {
  return Ge.current.useMemo(e, t);
};
te.useReducer = function (e, t, n) {
  return Ge.current.useReducer(e, t, n);
};
te.useRef = function (e) {
  return Ge.current.useRef(e);
};
te.useState = function (e) {
  return Ge.current.useState(e);
};
te.useSyncExternalStore = function (e, t, n) {
  return Ge.current.useSyncExternalStore(e, t, n);
};
te.useTransition = function () {
  return Ge.current.useTransition();
};
te.version = '18.3.1';
wg.exports = te;
var d = wg.exports;
const A = xg(d),
  Wd = I2({ __proto__: null, default: A }, [d]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Z2 = d,
  J2 = Symbol.for('react.element'),
  eN = Symbol.for('react.fragment'),
  tN = Object.prototype.hasOwnProperty,
  nN = Z2.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  rN = { key: !0, ref: !0, __self: !0, __source: !0 };
function Tg(e, t, n) {
  var r,
    o = {},
    s = null,
    i = null;
  (n !== void 0 && (s = '' + n),
    t.key !== void 0 && (s = '' + t.key),
    t.ref !== void 0 && (i = t.ref));
  for (r in t) tN.call(t, r) && !rN.hasOwnProperty(r) && (o[r] = t[r]);
  if (e && e.defaultProps)
    for (r in ((t = e.defaultProps), t)) o[r] === void 0 && (o[r] = t[r]);
  return {
    $$typeof: J2,
    type: e,
    key: s,
    ref: i,
    props: o,
    _owner: nN.current,
  };
}
yl.Fragment = eN;
yl.jsx = Tg;
yl.jsxs = Tg;
yg.exports = yl;
var a = yg.exports,
  Rg = { exports: {} },
  ut = {},
  Dg = { exports: {} },
  Mg = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
  function t(T, E) {
    var I = T.length;
    T.push(E);
    e: for (; 0 < I; ) {
      var B = (I - 1) >>> 1,
        z = T[B];
      if (0 < o(z, E)) ((T[B] = E), (T[I] = z), (I = B));
      else break e;
    }
  }
  function n(T) {
    return T.length === 0 ? null : T[0];
  }
  function r(T) {
    if (T.length === 0) return null;
    var E = T[0],
      I = T.pop();
    if (I !== E) {
      T[0] = I;
      e: for (var B = 0, z = T.length, Q = z >>> 1; B < Q; ) {
        var Z = 2 * (B + 1) - 1,
          ue = T[Z],
          he = Z + 1,
          ee = T[he];
        if (0 > o(ue, I))
          he < z && 0 > o(ee, ue)
            ? ((T[B] = ee), (T[he] = I), (B = he))
            : ((T[B] = ue), (T[Z] = I), (B = Z));
        else if (he < z && 0 > o(ee, I)) ((T[B] = ee), (T[he] = I), (B = he));
        else break e;
      }
    }
    return E;
  }
  function o(T, E) {
    var I = T.sortIndex - E.sortIndex;
    return I !== 0 ? I : T.id - E.id;
  }
  if (typeof performance == 'object' && typeof performance.now == 'function') {
    var s = performance;
    e.unstable_now = function () {
      return s.now();
    };
  } else {
    var i = Date,
      l = i.now();
    e.unstable_now = function () {
      return i.now() - l;
    };
  }
  var c = [],
    u = [],
    f = 1,
    m = null,
    p = 3,
    h = !1,
    b = !1,
    v = !1,
    w = typeof setTimeout == 'function' ? setTimeout : null,
    x = typeof clearTimeout == 'function' ? clearTimeout : null,
    g = typeof setImmediate < 'u' ? setImmediate : null;
  typeof navigator < 'u' &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function y(T) {
    for (var E = n(u); E !== null; ) {
      if (E.callback === null) r(u);
      else if (E.startTime <= T)
        (r(u), (E.sortIndex = E.expirationTime), t(c, E));
      else break;
      E = n(u);
    }
  }
  function N(T) {
    if (((v = !1), y(T), !b))
      if (n(c) !== null) ((b = !0), V(C));
      else {
        var E = n(u);
        E !== null && G(N, E.startTime - T);
      }
  }
  function C(T, E) {
    ((b = !1), v && ((v = !1), x(k), (k = -1)), (h = !0));
    var I = p;
    try {
      for (
        y(E), m = n(c);
        m !== null && (!(m.expirationTime > E) || (T && !W()));
      ) {
        var B = m.callback;
        if (typeof B == 'function') {
          ((m.callback = null), (p = m.priorityLevel));
          var z = B(m.expirationTime <= E);
          ((E = e.unstable_now()),
            typeof z == 'function' ? (m.callback = z) : m === n(c) && r(c),
            y(E));
        } else r(c);
        m = n(c);
      }
      if (m !== null) var Q = !0;
      else {
        var Z = n(u);
        (Z !== null && G(N, Z.startTime - E), (Q = !1));
      }
      return Q;
    } finally {
      ((m = null), (p = I), (h = !1));
    }
  }
  var j = !1,
    S = null,
    k = -1,
    M = 5,
    D = -1;
  function W() {
    return !(e.unstable_now() - D < M);
  }
  function P() {
    if (S !== null) {
      var T = e.unstable_now();
      D = T;
      var E = !0;
      try {
        E = S(!0, T);
      } finally {
        E ? U() : ((j = !1), (S = null));
      }
    } else j = !1;
  }
  var U;
  if (typeof g == 'function')
    U = function () {
      g(P);
    };
  else if (typeof MessageChannel < 'u') {
    var _ = new MessageChannel(),
      Y = _.port2;
    ((_.port1.onmessage = P),
      (U = function () {
        Y.postMessage(null);
      }));
  } else
    U = function () {
      w(P, 0);
    };
  function V(T) {
    ((S = T), j || ((j = !0), U()));
  }
  function G(T, E) {
    k = w(function () {
      T(e.unstable_now());
    }, E);
  }
  ((e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (T) {
      T.callback = null;
    }),
    (e.unstable_continueExecution = function () {
      b || h || ((b = !0), V(C));
    }),
    (e.unstable_forceFrameRate = function (T) {
      0 > T || 125 < T
        ? console.error(
            'forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported'
          )
        : (M = 0 < T ? Math.floor(1e3 / T) : 5);
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return p;
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(c);
    }),
    (e.unstable_next = function (T) {
      switch (p) {
        case 1:
        case 2:
        case 3:
          var E = 3;
          break;
        default:
          E = p;
      }
      var I = p;
      p = E;
      try {
        return T();
      } finally {
        p = I;
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (T, E) {
      switch (T) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          T = 3;
      }
      var I = p;
      p = T;
      try {
        return E();
      } finally {
        p = I;
      }
    }),
    (e.unstable_scheduleCallback = function (T, E, I) {
      var B = e.unstable_now();
      switch (
        (typeof I == 'object' && I !== null
          ? ((I = I.delay), (I = typeof I == 'number' && 0 < I ? B + I : B))
          : (I = B),
        T)
      ) {
        case 1:
          var z = -1;
          break;
        case 2:
          z = 250;
          break;
        case 5:
          z = 1073741823;
          break;
        case 4:
          z = 1e4;
          break;
        default:
          z = 5e3;
      }
      return (
        (z = I + z),
        (T = {
          id: f++,
          callback: E,
          priorityLevel: T,
          startTime: I,
          expirationTime: z,
          sortIndex: -1,
        }),
        I > B
          ? ((T.sortIndex = I),
            t(u, T),
            n(c) === null &&
              T === n(u) &&
              (v ? (x(k), (k = -1)) : (v = !0), G(N, I - B)))
          : ((T.sortIndex = z), t(c, T), b || h || ((b = !0), V(C))),
        T
      );
    }),
    (e.unstable_shouldYield = W),
    (e.unstable_wrapCallback = function (T) {
      var E = p;
      return function () {
        var I = p;
        p = E;
        try {
          return T.apply(this, arguments);
        } finally {
          p = I;
        }
      };
    }));
})(Mg);
Dg.exports = Mg;
var oN = Dg.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var sN = d,
  ct = oN;
function O(e) {
  for (
    var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, n = 1;
    n < arguments.length;
    n++
  )
    t += '&args[]=' + encodeURIComponent(arguments[n]);
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  );
}
var Ag = new Set(),
  Bs = {};
function Gr(e, t) {
  (Vo(e, t), Vo(e + 'Capture', t));
}
function Vo(e, t) {
  for (Bs[e] = t, e = 0; e < t.length; e++) Ag.add(t[e]);
}
var jn = !(
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
  ),
  fu = Object.prototype.hasOwnProperty,
  aN =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  Bm = {},
  Hm = {};
function iN(e) {
  return fu.call(Hm, e)
    ? !0
    : fu.call(Bm, e)
      ? !1
      : aN.test(e)
        ? (Hm[e] = !0)
        : ((Bm[e] = !0), !1);
}
function lN(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case 'function':
    case 'symbol':
      return !0;
    case 'boolean':
      return r
        ? !1
        : n !== null
          ? !n.acceptsBooleans
          : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
    default:
      return !1;
  }
}
function cN(e, t, n, r) {
  if (t === null || typeof t > 'u' || lN(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function Ke(e, t, n, r, o, s, i) {
  ((this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = o),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = s),
    (this.removeEmptyString = i));
}
var Ae = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
  .split(' ')
  .forEach(function (e) {
    Ae[e] = new Ke(e, 0, !1, e, null, !1, !1);
  });
[
  ['acceptCharset', 'accept-charset'],
  ['className', 'class'],
  ['htmlFor', 'for'],
  ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
  var t = e[0];
  Ae[t] = new Ke(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
  Ae[e] = new Ke(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
[
  'autoReverse',
  'externalResourcesRequired',
  'focusable',
  'preserveAlpha',
].forEach(function (e) {
  Ae[e] = new Ke(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
  .split(' ')
  .forEach(function (e) {
    Ae[e] = new Ke(e, 3, !1, e.toLowerCase(), null, !1, !1);
  });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
  Ae[e] = new Ke(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
  Ae[e] = new Ke(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
  Ae[e] = new Ke(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
  Ae[e] = new Ke(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Ud = /[\-:]([a-z])/g;
function Bd(e) {
  return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
  .split(' ')
  .forEach(function (e) {
    var t = e.replace(Ud, Bd);
    Ae[t] = new Ke(t, 1, !1, e, null, !1, !1);
  });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'
  .split(' ')
  .forEach(function (e) {
    var t = e.replace(Ud, Bd);
    Ae[t] = new Ke(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
  });
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
  var t = e.replace(Ud, Bd);
  Ae[t] = new Ke(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
  Ae[e] = new Ke(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
Ae.xlinkHref = new Ke(
  'xlinkHref',
  1,
  !1,
  'xlink:href',
  'http://www.w3.org/1999/xlink',
  !0,
  !1
);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
  Ae[e] = new Ke(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Hd(e, t, n, r) {
  var o = Ae.hasOwnProperty(t) ? Ae[t] : null;
  (o !== null
    ? o.type !== 0
    : r ||
      !(2 < t.length) ||
      (t[0] !== 'o' && t[0] !== 'O') ||
      (t[1] !== 'n' && t[1] !== 'N')) &&
    (cN(t, n, o, r) && (n = null),
    r || o === null
      ? iN(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
      : o.mustUseProperty
        ? (e[o.propertyName] = n === null ? (o.type === 3 ? !1 : '') : n)
        : ((t = o.attributeName),
          (r = o.attributeNamespace),
          n === null
            ? e.removeAttribute(t)
            : ((o = o.type),
              (n = o === 3 || (o === 4 && n === !0) ? '' : '' + n),
              r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var Tn = sN.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  _a = Symbol.for('react.element'),
  co = Symbol.for('react.portal'),
  uo = Symbol.for('react.fragment'),
  Vd = Symbol.for('react.strict_mode'),
  mu = Symbol.for('react.profiler'),
  Og = Symbol.for('react.provider'),
  _g = Symbol.for('react.context'),
  Yd = Symbol.for('react.forward_ref'),
  pu = Symbol.for('react.suspense'),
  hu = Symbol.for('react.suspense_list'),
  Gd = Symbol.for('react.memo'),
  Un = Symbol.for('react.lazy'),
  Ig = Symbol.for('react.offscreen'),
  Vm = Symbol.iterator;
function ps(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (Vm && e[Vm]) || e['@@iterator']),
      typeof e == 'function' ? e : null);
}
var we = Object.assign,
  wc;
function Ss(e) {
  if (wc === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      wc = (t && t[1]) || '';
    }
  return (
    `
` +
    wc +
    e
  );
}
var bc = !1;
function Nc(e, t) {
  if (!e || bc) return '';
  bc = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (
        ((t = function () {
          throw Error();
        }),
        Object.defineProperty(t.prototype, 'props', {
          set: function () {
            throw Error();
          },
        }),
        typeof Reflect == 'object' && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, []);
        } catch (u) {
          var r = u;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (u) {
          r = u;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (u) {
        r = u;
      }
      e();
    }
  } catch (u) {
    if (u && r && typeof u.stack == 'string') {
      for (
        var o = u.stack.split(`
`),
          s = r.stack.split(`
`),
          i = o.length - 1,
          l = s.length - 1;
        1 <= i && 0 <= l && o[i] !== s[l];
      )
        l--;
      for (; 1 <= i && 0 <= l; i--, l--)
        if (o[i] !== s[l]) {
          if (i !== 1 || l !== 1)
            do
              if ((i--, l--, 0 > l || o[i] !== s[l])) {
                var c =
                  `
` + o[i].replace(' at new ', ' at ');
                return (
                  e.displayName &&
                    c.includes('<anonymous>') &&
                    (c = c.replace('<anonymous>', e.displayName)),
                  c
                );
              }
            while (1 <= i && 0 <= l);
          break;
        }
    }
  } finally {
    ((bc = !1), (Error.prepareStackTrace = n));
  }
  return (e = e ? e.displayName || e.name : '') ? Ss(e) : '';
}
function uN(e) {
  switch (e.tag) {
    case 5:
      return Ss(e.type);
    case 16:
      return Ss('Lazy');
    case 13:
      return Ss('Suspense');
    case 19:
      return Ss('SuspenseList');
    case 0:
    case 2:
    case 15:
      return ((e = Nc(e.type, !1)), e);
    case 11:
      return ((e = Nc(e.type.render, !1)), e);
    case 1:
      return ((e = Nc(e.type, !0)), e);
    default:
      return '';
  }
}
function gu(e) {
  if (e == null) return null;
  if (typeof e == 'function') return e.displayName || e.name || null;
  if (typeof e == 'string') return e;
  switch (e) {
    case uo:
      return 'Fragment';
    case co:
      return 'Portal';
    case mu:
      return 'Profiler';
    case Vd:
      return 'StrictMode';
    case pu:
      return 'Suspense';
    case hu:
      return 'SuspenseList';
  }
  if (typeof e == 'object')
    switch (e.$$typeof) {
      case _g:
        return (e.displayName || 'Context') + '.Consumer';
      case Og:
        return (e._context.displayName || 'Context') + '.Provider';
      case Yd:
        var t = e.render;
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ''),
            (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
          e
        );
      case Gd:
        return (
          (t = e.displayName || null),
          t !== null ? t : gu(e.type) || 'Memo'
        );
      case Un:
        ((t = e._payload), (e = e._init));
        try {
          return gu(e(t));
        } catch {}
    }
  return null;
}
function dN(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return 'Cache';
    case 9:
      return (t.displayName || 'Context') + '.Consumer';
    case 10:
      return (t._context.displayName || 'Context') + '.Provider';
    case 18:
      return 'DehydratedFragment';
    case 11:
      return (
        (e = t.render),
        (e = e.displayName || e.name || ''),
        t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')
      );
    case 7:
      return 'Fragment';
    case 5:
      return t;
    case 4:
      return 'Portal';
    case 3:
      return 'Root';
    case 6:
      return 'Text';
    case 16:
      return gu(t);
    case 8:
      return t === Vd ? 'StrictMode' : 'Mode';
    case 22:
      return 'Offscreen';
    case 12:
      return 'Profiler';
    case 21:
      return 'Scope';
    case 13:
      return 'Suspense';
    case 19:
      return 'SuspenseList';
    case 25:
      return 'TracingMarker';
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == 'function') return t.displayName || t.name || null;
      if (typeof t == 'string') return t;
  }
  return null;
}
function cr(e) {
  switch (typeof e) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return e;
    case 'object':
      return e;
    default:
      return '';
  }
}
function Lg(e) {
  var t = e.type;
  return (
    (e = e.nodeName) &&
    e.toLowerCase() === 'input' &&
    (t === 'checkbox' || t === 'radio')
  );
}
function fN(e) {
  var t = Lg(e) ? 'checked' : 'value',
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = '' + e[t];
  if (
    !e.hasOwnProperty(t) &&
    typeof n < 'u' &&
    typeof n.get == 'function' &&
    typeof n.set == 'function'
  ) {
    var o = n.get,
      s = n.set;
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return o.call(this);
        },
        set: function (i) {
          ((r = '' + i), s.call(this, i));
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r;
        },
        setValue: function (i) {
          r = '' + i;
        },
        stopTracking: function () {
          ((e._valueTracker = null), delete e[t]);
        },
      }
    );
  }
}
function Ia(e) {
  e._valueTracker || (e._valueTracker = fN(e));
}
function Fg(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(),
    r = '';
  return (
    e && (r = Lg(e) ? (e.checked ? 'true' : 'false') : e.value),
    (e = r),
    e !== n ? (t.setValue(e), !0) : !1
  );
}
function Ri(e) {
  if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u'))
    return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function vu(e, t) {
  var n = t.checked;
  return we({}, t, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: n ?? e._wrapperState.initialChecked,
  });
}
function Ym(e, t) {
  var n = t.defaultValue == null ? '' : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked;
  ((n = cr(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled:
        t.type === 'checkbox' || t.type === 'radio'
          ? t.checked != null
          : t.value != null,
    }));
}
function $g(e, t) {
  ((t = t.checked), t != null && Hd(e, 'checked', t, !1));
}
function xu(e, t) {
  $g(e, t);
  var n = cr(t.value),
    r = t.type;
  if (n != null)
    r === 'number'
      ? ((n === 0 && e.value === '') || e.value != n) && (e.value = '' + n)
      : e.value !== '' + n && (e.value = '' + n);
  else if (r === 'submit' || r === 'reset') {
    e.removeAttribute('value');
    return;
  }
  (t.hasOwnProperty('value')
    ? yu(e, t.type, n)
    : t.hasOwnProperty('defaultValue') && yu(e, t.type, cr(t.defaultValue)),
    t.checked == null &&
      t.defaultChecked != null &&
      (e.defaultChecked = !!t.defaultChecked));
}
function Gm(e, t, n) {
  if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
    var r = t.type;
    if (
      !(
        (r !== 'submit' && r !== 'reset') ||
        (t.value !== void 0 && t.value !== null)
      )
    )
      return;
    ((t = '' + e._wrapperState.initialValue),
      n || t === e.value || (e.value = t),
      (e.defaultValue = t));
  }
  ((n = e.name),
    n !== '' && (e.name = ''),
    (e.defaultChecked = !!e._wrapperState.initialChecked),
    n !== '' && (e.name = n));
}
function yu(e, t, n) {
  (t !== 'number' || Ri(e.ownerDocument) !== e) &&
    (n == null
      ? (e.defaultValue = '' + e._wrapperState.initialValue)
      : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Es = Array.isArray;
function So(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {};
    for (var o = 0; o < n.length; o++) t['$' + n[o]] = !0;
    for (n = 0; n < e.length; n++)
      ((o = t.hasOwnProperty('$' + e[n].value)),
        e[n].selected !== o && (e[n].selected = o),
        o && r && (e[n].defaultSelected = !0));
  } else {
    for (n = '' + cr(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        ((e[o].selected = !0), r && (e[o].defaultSelected = !0));
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function wu(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(O(91));
  return we({}, t, {
    value: void 0,
    defaultValue: void 0,
    children: '' + e._wrapperState.initialValue,
  });
}
function Km(e, t) {
  var n = t.value;
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(O(92));
      if (Es(n)) {
        if (1 < n.length) throw Error(O(93));
        n = n[0];
      }
      t = n;
    }
    (t == null && (t = ''), (n = t));
  }
  e._wrapperState = { initialValue: cr(n) };
}
function zg(e, t) {
  var n = cr(t.value),
    r = cr(t.defaultValue);
  (n != null &&
    ((n = '' + n),
    n !== e.value && (e.value = n),
    t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = '' + r));
}
function Qm(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function Wg(e) {
  switch (e) {
    case 'svg':
      return 'http://www.w3.org/2000/svg';
    case 'math':
      return 'http://www.w3.org/1998/Math/MathML';
    default:
      return 'http://www.w3.org/1999/xhtml';
  }
}
function bu(e, t) {
  return e == null || e === 'http://www.w3.org/1999/xhtml'
    ? Wg(t)
    : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
      ? 'http://www.w3.org/1999/xhtml'
      : e;
}
var La,
  Ug = (function (e) {
    return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, o) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, o);
          });
        }
      : e;
  })(function (e, t) {
    if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e)
      e.innerHTML = t;
    else {
      for (
        La = La || document.createElement('div'),
          La.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>',
          t = La.firstChild;
        e.firstChild;
      )
        e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
function Hs(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Ms = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  mN = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(Ms).forEach(function (e) {
  mN.forEach(function (t) {
    ((t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Ms[t] = Ms[e]));
  });
});
function Bg(e, t, n) {
  return t == null || typeof t == 'boolean' || t === ''
    ? ''
    : n || typeof t != 'number' || t === 0 || (Ms.hasOwnProperty(e) && Ms[e])
      ? ('' + t).trim()
      : t + 'px';
}
function Hg(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf('--') === 0,
        o = Bg(n, t[n], r);
      (n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, o) : (e[n] = o));
    }
}
var pN = we(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  }
);
function Nu(e, t) {
  if (t) {
    if (pN[e] && (t.children != null || t.dangerouslySetInnerHTML != null))
      throw Error(O(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(O(60));
      if (
        typeof t.dangerouslySetInnerHTML != 'object' ||
        !('__html' in t.dangerouslySetInnerHTML)
      )
        throw Error(O(61));
    }
    if (t.style != null && typeof t.style != 'object') throw Error(O(62));
  }
}
function ju(e, t) {
  if (e.indexOf('-') === -1) return typeof t.is == 'string';
  switch (e) {
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return !1;
    default:
      return !0;
  }
}
var Cu = null;
function Kd(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  );
}
var Su = null,
  Eo = null,
  ko = null;
function qm(e) {
  if ((e = ba(e))) {
    if (typeof Su != 'function') throw Error(O(280));
    var t = e.stateNode;
    t && ((t = Cl(t)), Su(e.stateNode, e.type, t));
  }
}
function Vg(e) {
  Eo ? (ko ? ko.push(e) : (ko = [e])) : (Eo = e);
}
function Yg() {
  if (Eo) {
    var e = Eo,
      t = ko;
    if (((ko = Eo = null), qm(e), t)) for (e = 0; e < t.length; e++) qm(t[e]);
  }
}
function Gg(e, t) {
  return e(t);
}
function Kg() {}
var jc = !1;
function Qg(e, t, n) {
  if (jc) return e(t, n);
  jc = !0;
  try {
    return Gg(e, t, n);
  } finally {
    ((jc = !1), (Eo !== null || ko !== null) && (Kg(), Yg()));
  }
}
function Vs(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = Cl(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      ((r = !r.disabled) ||
        ((e = e.type),
        (r = !(
          e === 'button' ||
          e === 'input' ||
          e === 'select' ||
          e === 'textarea'
        ))),
        (e = !r));
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != 'function') throw Error(O(231, t, typeof n));
  return n;
}
var Eu = !1;
if (jn)
  try {
    var hs = {};
    (Object.defineProperty(hs, 'passive', {
      get: function () {
        Eu = !0;
      },
    }),
      window.addEventListener('test', hs, hs),
      window.removeEventListener('test', hs, hs));
  } catch {
    Eu = !1;
  }
function hN(e, t, n, r, o, s, i, l, c) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (f) {
    this.onError(f);
  }
}
var As = !1,
  Di = null,
  Mi = !1,
  ku = null,
  gN = {
    onError: function (e) {
      ((As = !0), (Di = e));
    },
  };
function vN(e, t, n, r, o, s, i, l, c) {
  ((As = !1), (Di = null), hN.apply(gN, arguments));
}
function xN(e, t, n, r, o, s, i, l, c) {
  if ((vN.apply(this, arguments), As)) {
    if (As) {
      var u = Di;
      ((As = !1), (Di = null));
    } else throw Error(O(198));
    Mi || ((Mi = !0), (ku = u));
  }
}
function Kr(e) {
  var t = e,
    n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function qg(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (
      (t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)),
      t !== null)
    )
      return t.dehydrated;
  }
  return null;
}
function Xm(e) {
  if (Kr(e) !== e) throw Error(O(188));
}
function yN(e) {
  var t = e.alternate;
  if (!t) {
    if (((t = Kr(e)), t === null)) throw Error(O(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var o = n.return;
    if (o === null) break;
    var s = o.alternate;
    if (s === null) {
      if (((r = o.return), r !== null)) {
        n = r;
        continue;
      }
      break;
    }
    if (o.child === s.child) {
      for (s = o.child; s; ) {
        if (s === n) return (Xm(o), e);
        if (s === r) return (Xm(o), t);
        s = s.sibling;
      }
      throw Error(O(188));
    }
    if (n.return !== r.return) ((n = o), (r = s));
    else {
      for (var i = !1, l = o.child; l; ) {
        if (l === n) {
          ((i = !0), (n = o), (r = s));
          break;
        }
        if (l === r) {
          ((i = !0), (r = o), (n = s));
          break;
        }
        l = l.sibling;
      }
      if (!i) {
        for (l = s.child; l; ) {
          if (l === n) {
            ((i = !0), (n = s), (r = o));
            break;
          }
          if (l === r) {
            ((i = !0), (r = s), (n = o));
            break;
          }
          l = l.sibling;
        }
        if (!i) throw Error(O(189));
      }
    }
    if (n.alternate !== r) throw Error(O(190));
  }
  if (n.tag !== 3) throw Error(O(188));
  return n.stateNode.current === n ? e : t;
}
function Xg(e) {
  return ((e = yN(e)), e !== null ? Zg(e) : null);
}
function Zg(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = Zg(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var Jg = ct.unstable_scheduleCallback,
  Zm = ct.unstable_cancelCallback,
  wN = ct.unstable_shouldYield,
  bN = ct.unstable_requestPaint,
  Se = ct.unstable_now,
  NN = ct.unstable_getCurrentPriorityLevel,
  Qd = ct.unstable_ImmediatePriority,
  ev = ct.unstable_UserBlockingPriority,
  Ai = ct.unstable_NormalPriority,
  jN = ct.unstable_LowPriority,
  tv = ct.unstable_IdlePriority,
  wl = null,
  rn = null;
function CN(e) {
  if (rn && typeof rn.onCommitFiberRoot == 'function')
    try {
      rn.onCommitFiberRoot(wl, e, void 0, (e.current.flags & 128) === 128);
    } catch {}
}
var Lt = Math.clz32 ? Math.clz32 : kN,
  SN = Math.log,
  EN = Math.LN2;
function kN(e) {
  return ((e >>>= 0), e === 0 ? 32 : (31 - ((SN(e) / EN) | 0)) | 0);
}
var Fa = 64,
  $a = 4194304;
function ks(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Oi(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0,
    o = e.suspendedLanes,
    s = e.pingedLanes,
    i = n & 268435455;
  if (i !== 0) {
    var l = i & ~o;
    l !== 0 ? (r = ks(l)) : ((s &= i), s !== 0 && (r = ks(s)));
  } else ((i = n & ~o), i !== 0 ? (r = ks(i)) : s !== 0 && (r = ks(s)));
  if (r === 0) return 0;
  if (
    t !== 0 &&
    t !== r &&
    !(t & o) &&
    ((o = r & -r), (s = t & -t), o >= s || (o === 16 && (s & 4194240) !== 0))
  )
    return t;
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; )
      ((n = 31 - Lt(t)), (o = 1 << n), (r |= e[n]), (t &= ~o));
  return r;
}
function PN(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function TN(e, t) {
  for (
    var n = e.suspendedLanes,
      r = e.pingedLanes,
      o = e.expirationTimes,
      s = e.pendingLanes;
    0 < s;
  ) {
    var i = 31 - Lt(s),
      l = 1 << i,
      c = o[i];
    (c === -1
      ? (!(l & n) || l & r) && (o[i] = PN(l, t))
      : c <= t && (e.expiredLanes |= l),
      (s &= ~l));
  }
}
function Pu(e) {
  return (
    (e = e.pendingLanes & -1073741825),
    e !== 0 ? e : e & 1073741824 ? 1073741824 : 0
  );
}
function nv() {
  var e = Fa;
  return ((Fa <<= 1), !(Fa & 4194240) && (Fa = 64), e);
}
function Cc(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function ya(e, t, n) {
  ((e.pendingLanes |= t),
    t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
    (e = e.eventTimes),
    (t = 31 - Lt(t)),
    (e[t] = n));
}
function RN(e, t) {
  var n = e.pendingLanes & ~t;
  ((e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements));
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - Lt(n),
      s = 1 << o;
    ((t[o] = 0), (r[o] = -1), (e[o] = -1), (n &= ~s));
  }
}
function qd(e, t) {
  var n = (e.entangledLanes |= t);
  for (e = e.entanglements; n; ) {
    var r = 31 - Lt(n),
      o = 1 << r;
    ((o & t) | (e[r] & t) && (e[r] |= t), (n &= ~o));
  }
}
var ie = 0;
function rv(e) {
  return (
    (e &= -e),
    1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1
  );
}
var ov,
  Xd,
  sv,
  av,
  iv,
  Tu = !1,
  za = [],
  er = null,
  tr = null,
  nr = null,
  Ys = new Map(),
  Gs = new Map(),
  Hn = [],
  DN =
    'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
      ' '
    );
function Jm(e, t) {
  switch (e) {
    case 'focusin':
    case 'focusout':
      er = null;
      break;
    case 'dragenter':
    case 'dragleave':
      tr = null;
      break;
    case 'mouseover':
    case 'mouseout':
      nr = null;
      break;
    case 'pointerover':
    case 'pointerout':
      Ys.delete(t.pointerId);
      break;
    case 'gotpointercapture':
    case 'lostpointercapture':
      Gs.delete(t.pointerId);
  }
}
function gs(e, t, n, r, o, s) {
  return e === null || e.nativeEvent !== s
    ? ((e = {
        blockedOn: t,
        domEventName: n,
        eventSystemFlags: r,
        nativeEvent: s,
        targetContainers: [o],
      }),
      t !== null && ((t = ba(t)), t !== null && Xd(t)),
      e)
    : ((e.eventSystemFlags |= r),
      (t = e.targetContainers),
      o !== null && t.indexOf(o) === -1 && t.push(o),
      e);
}
function MN(e, t, n, r, o) {
  switch (t) {
    case 'focusin':
      return ((er = gs(er, e, t, n, r, o)), !0);
    case 'dragenter':
      return ((tr = gs(tr, e, t, n, r, o)), !0);
    case 'mouseover':
      return ((nr = gs(nr, e, t, n, r, o)), !0);
    case 'pointerover':
      var s = o.pointerId;
      return (Ys.set(s, gs(Ys.get(s) || null, e, t, n, r, o)), !0);
    case 'gotpointercapture':
      return (
        (s = o.pointerId),
        Gs.set(s, gs(Gs.get(s) || null, e, t, n, r, o)),
        !0
      );
  }
  return !1;
}
function lv(e) {
  var t = kr(e.target);
  if (t !== null) {
    var n = Kr(t);
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = qg(n)), t !== null)) {
          ((e.blockedOn = t),
            iv(e.priority, function () {
              sv(n);
            }));
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function fi(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Ru(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      ((Cu = r), n.target.dispatchEvent(r), (Cu = null));
    } else return ((t = ba(n)), t !== null && Xd(t), (e.blockedOn = n), !1);
    t.shift();
  }
  return !0;
}
function ep(e, t, n) {
  fi(e) && n.delete(t);
}
function AN() {
  ((Tu = !1),
    er !== null && fi(er) && (er = null),
    tr !== null && fi(tr) && (tr = null),
    nr !== null && fi(nr) && (nr = null),
    Ys.forEach(ep),
    Gs.forEach(ep));
}
function vs(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    Tu ||
      ((Tu = !0),
      ct.unstable_scheduleCallback(ct.unstable_NormalPriority, AN)));
}
function Ks(e) {
  function t(o) {
    return vs(o, e);
  }
  if (0 < za.length) {
    vs(za[0], e);
    for (var n = 1; n < za.length; n++) {
      var r = za[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (
    er !== null && vs(er, e),
      tr !== null && vs(tr, e),
      nr !== null && vs(nr, e),
      Ys.forEach(t),
      Gs.forEach(t),
      n = 0;
    n < Hn.length;
    n++
  )
    ((r = Hn[n]), r.blockedOn === e && (r.blockedOn = null));
  for (; 0 < Hn.length && ((n = Hn[0]), n.blockedOn === null); )
    (lv(n), n.blockedOn === null && Hn.shift());
}
var Po = Tn.ReactCurrentBatchConfig,
  _i = !0;
function ON(e, t, n, r) {
  var o = ie,
    s = Po.transition;
  Po.transition = null;
  try {
    ((ie = 1), Zd(e, t, n, r));
  } finally {
    ((ie = o), (Po.transition = s));
  }
}
function _N(e, t, n, r) {
  var o = ie,
    s = Po.transition;
  Po.transition = null;
  try {
    ((ie = 4), Zd(e, t, n, r));
  } finally {
    ((ie = o), (Po.transition = s));
  }
}
function Zd(e, t, n, r) {
  if (_i) {
    var o = Ru(e, t, n, r);
    if (o === null) (Oc(e, t, r, Ii, n), Jm(e, r));
    else if (MN(o, e, t, n, r)) r.stopPropagation();
    else if ((Jm(e, r), t & 4 && -1 < DN.indexOf(e))) {
      for (; o !== null; ) {
        var s = ba(o);
        if (
          (s !== null && ov(s),
          (s = Ru(e, t, n, r)),
          s === null && Oc(e, t, r, Ii, n),
          s === o)
        )
          break;
        o = s;
      }
      o !== null && r.stopPropagation();
    } else Oc(e, t, r, null, n);
  }
}
var Ii = null;
function Ru(e, t, n, r) {
  if (((Ii = null), (e = Kd(r)), (e = kr(e)), e !== null))
    if (((t = Kr(e)), t === null)) e = null;
    else if (((n = t.tag), n === 13)) {
      if (((e = qg(t)), e !== null)) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated)
        return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
  return ((Ii = e), null);
}
function cv(e) {
  switch (e) {
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    case 'beforeblur':
    case 'afterblur':
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return 1;
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return 4;
    case 'message':
      switch (NN()) {
        case Qd:
          return 1;
        case ev:
          return 4;
        case Ai:
        case jN:
          return 16;
        case tv:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var Xn = null,
  Jd = null,
  mi = null;
function uv() {
  if (mi) return mi;
  var e,
    t = Jd,
    n = t.length,
    r,
    o = 'value' in Xn ? Xn.value : Xn.textContent,
    s = o.length;
  for (e = 0; e < n && t[e] === o[e]; e++);
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === o[s - r]; r++);
  return (mi = o.slice(e, 1 < r ? 1 - r : void 0));
}
function pi(e) {
  var t = e.keyCode;
  return (
    'charCode' in e
      ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
      : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  );
}
function Wa() {
  return !0;
}
function tp() {
  return !1;
}
function dt(e) {
  function t(n, r, o, s, i) {
    ((this._reactName = n),
      (this._targetInst = o),
      (this.type = r),
      (this.nativeEvent = s),
      (this.target = i),
      (this.currentTarget = null));
    for (var l in e)
      e.hasOwnProperty(l) && ((n = e[l]), (this[l] = n ? n(s) : s[l]));
    return (
      (this.isDefaultPrevented = (
        s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1
      )
        ? Wa
        : tp),
      (this.isPropagationStopped = tp),
      this
    );
  }
  return (
    we(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n &&
          (n.preventDefault
            ? n.preventDefault()
            : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
          (this.isDefaultPrevented = Wa));
      },
      stopPropagation: function () {
        var n = this.nativeEvent;
        n &&
          (n.stopPropagation
            ? n.stopPropagation()
            : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
          (this.isPropagationStopped = Wa));
      },
      persist: function () {},
      isPersistent: Wa,
    }),
    t
  );
}
var os = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  ef = dt(os),
  wa = we({}, os, { view: 0, detail: 0 }),
  IN = dt(wa),
  Sc,
  Ec,
  xs,
  bl = we({}, wa, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: tf,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget;
    },
    movementX: function (e) {
      return 'movementX' in e
        ? e.movementX
        : (e !== xs &&
            (xs && e.type === 'mousemove'
              ? ((Sc = e.screenX - xs.screenX), (Ec = e.screenY - xs.screenY))
              : (Ec = Sc = 0),
            (xs = e)),
          Sc);
    },
    movementY: function (e) {
      return 'movementY' in e ? e.movementY : Ec;
    },
  }),
  np = dt(bl),
  LN = we({}, bl, { dataTransfer: 0 }),
  FN = dt(LN),
  $N = we({}, wa, { relatedTarget: 0 }),
  kc = dt($N),
  zN = we({}, os, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  WN = dt(zN),
  UN = we({}, os, {
    clipboardData: function (e) {
      return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
    },
  }),
  BN = dt(UN),
  HN = we({}, os, { data: 0 }),
  rp = dt(HN),
  VN = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified',
  },
  YN = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta',
  },
  GN = {
    Alt: 'altKey',
    Control: 'ctrlKey',
    Meta: 'metaKey',
    Shift: 'shiftKey',
  };
function KN(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = GN[e]) ? !!t[e] : !1;
}
function tf() {
  return KN;
}
var QN = we({}, wa, {
    key: function (e) {
      if (e.key) {
        var t = VN[e.key] || e.key;
        if (t !== 'Unidentified') return t;
      }
      return e.type === 'keypress'
        ? ((e = pi(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
        : e.type === 'keydown' || e.type === 'keyup'
          ? YN[e.keyCode] || 'Unidentified'
          : '';
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: tf,
    charCode: function (e) {
      return e.type === 'keypress' ? pi(e) : 0;
    },
    keyCode: function (e) {
      return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
    },
    which: function (e) {
      return e.type === 'keypress'
        ? pi(e)
        : e.type === 'keydown' || e.type === 'keyup'
          ? e.keyCode
          : 0;
    },
  }),
  qN = dt(QN),
  XN = we({}, bl, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  op = dt(XN),
  ZN = we({}, wa, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: tf,
  }),
  JN = dt(ZN),
  ej = we({}, os, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  tj = dt(ej),
  nj = we({}, bl, {
    deltaX: function (e) {
      return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function (e) {
      return 'deltaY' in e
        ? e.deltaY
        : 'wheelDeltaY' in e
          ? -e.wheelDeltaY
          : 'wheelDelta' in e
            ? -e.wheelDelta
            : 0;
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  rj = dt(nj),
  oj = [9, 13, 27, 32],
  nf = jn && 'CompositionEvent' in window,
  Os = null;
jn && 'documentMode' in document && (Os = document.documentMode);
var sj = jn && 'TextEvent' in window && !Os,
  dv = jn && (!nf || (Os && 8 < Os && 11 >= Os)),
  sp = ' ',
  ap = !1;
function fv(e, t) {
  switch (e) {
    case 'keyup':
      return oj.indexOf(t.keyCode) !== -1;
    case 'keydown':
      return t.keyCode !== 229;
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      return !0;
    default:
      return !1;
  }
}
function mv(e) {
  return ((e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null);
}
var fo = !1;
function aj(e, t) {
  switch (e) {
    case 'compositionend':
      return mv(t);
    case 'keypress':
      return t.which !== 32 ? null : ((ap = !0), sp);
    case 'textInput':
      return ((e = t.data), e === sp && ap ? null : e);
    default:
      return null;
  }
}
function ij(e, t) {
  if (fo)
    return e === 'compositionend' || (!nf && fv(e, t))
      ? ((e = uv()), (mi = Jd = Xn = null), (fo = !1), e)
      : null;
  switch (e) {
    case 'paste':
      return null;
    case 'keypress':
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case 'compositionend':
      return dv && t.locale !== 'ko' ? null : t.data;
    default:
      return null;
  }
}
var lj = {
  color: !0,
  date: !0,
  datetime: !0,
  'datetime-local': !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
};
function ip(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === 'input' ? !!lj[e.type] : t === 'textarea';
}
function pv(e, t, n, r) {
  (Vg(r),
    (t = Li(t, 'onChange')),
    0 < t.length &&
      ((n = new ef('onChange', 'change', null, n, r)),
      e.push({ event: n, listeners: t })));
}
var _s = null,
  Qs = null;
function cj(e) {
  Sv(e, 0);
}
function Nl(e) {
  var t = ho(e);
  if (Fg(t)) return e;
}
function uj(e, t) {
  if (e === 'change') return t;
}
var hv = !1;
if (jn) {
  var Pc;
  if (jn) {
    var Tc = 'oninput' in document;
    if (!Tc) {
      var lp = document.createElement('div');
      (lp.setAttribute('oninput', 'return;'),
        (Tc = typeof lp.oninput == 'function'));
    }
    Pc = Tc;
  } else Pc = !1;
  hv = Pc && (!document.documentMode || 9 < document.documentMode);
}
function cp() {
  _s && (_s.detachEvent('onpropertychange', gv), (Qs = _s = null));
}
function gv(e) {
  if (e.propertyName === 'value' && Nl(Qs)) {
    var t = [];
    (pv(t, Qs, e, Kd(e)), Qg(cj, t));
  }
}
function dj(e, t, n) {
  e === 'focusin'
    ? (cp(), (_s = t), (Qs = n), _s.attachEvent('onpropertychange', gv))
    : e === 'focusout' && cp();
}
function fj(e) {
  if (e === 'selectionchange' || e === 'keyup' || e === 'keydown')
    return Nl(Qs);
}
function mj(e, t) {
  if (e === 'click') return Nl(t);
}
function pj(e, t) {
  if (e === 'input' || e === 'change') return Nl(t);
}
function hj(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var $t = typeof Object.is == 'function' ? Object.is : hj;
function qs(e, t) {
  if ($t(e, t)) return !0;
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null)
    return !1;
  var n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var o = n[r];
    if (!fu.call(t, o) || !$t(e[o], t[o])) return !1;
  }
  return !0;
}
function up(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function dp(e, t) {
  var n = up(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t))
        return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = up(n);
  }
}
function vv(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
        ? !1
        : t && t.nodeType === 3
          ? vv(e, t.parentNode)
          : 'contains' in e
            ? e.contains(t)
            : e.compareDocumentPosition
              ? !!(e.compareDocumentPosition(t) & 16)
              : !1
    : !1;
}
function xv() {
  for (var e = window, t = Ri(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == 'string';
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = Ri(e.document);
  }
  return t;
}
function rf(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return (
    t &&
    ((t === 'input' &&
      (e.type === 'text' ||
        e.type === 'search' ||
        e.type === 'tel' ||
        e.type === 'url' ||
        e.type === 'password')) ||
      t === 'textarea' ||
      e.contentEditable === 'true')
  );
}
function gj(e) {
  var t = xv(),
    n = e.focusedElem,
    r = e.selectionRange;
  if (
    t !== n &&
    n &&
    n.ownerDocument &&
    vv(n.ownerDocument.documentElement, n)
  ) {
    if (r !== null && rf(n)) {
      if (
        ((t = r.start),
        (e = r.end),
        e === void 0 && (e = t),
        'selectionStart' in n)
      )
        ((n.selectionStart = t),
          (n.selectionEnd = Math.min(e, n.value.length)));
      else if (
        ((e = ((t = n.ownerDocument || document) && t.defaultView) || window),
        e.getSelection)
      ) {
        e = e.getSelection();
        var o = n.textContent.length,
          s = Math.min(r.start, o);
        ((r = r.end === void 0 ? s : Math.min(r.end, o)),
          !e.extend && s > r && ((o = r), (r = s), (s = o)),
          (o = dp(n, s)));
        var i = dp(n, r);
        o &&
          i &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== o.node ||
            e.anchorOffset !== o.offset ||
            e.focusNode !== i.node ||
            e.focusOffset !== i.offset) &&
          ((t = t.createRange()),
          t.setStart(o.node, o.offset),
          e.removeAllRanges(),
          s > r
            ? (e.addRange(t), e.extend(i.node, i.offset))
            : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; (e = e.parentNode); )
      e.nodeType === 1 &&
        t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == 'function' && n.focus(), n = 0; n < t.length; n++)
      ((e = t[n]),
        (e.element.scrollLeft = e.left),
        (e.element.scrollTop = e.top));
  }
}
var vj = jn && 'documentMode' in document && 11 >= document.documentMode,
  mo = null,
  Du = null,
  Is = null,
  Mu = !1;
function fp(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  Mu ||
    mo == null ||
    mo !== Ri(r) ||
    ((r = mo),
    'selectionStart' in r && rf(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = (
          (r.ownerDocument && r.ownerDocument.defaultView) ||
          window
        ).getSelection()),
        (r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        })),
    (Is && qs(Is, r)) ||
      ((Is = r),
      (r = Li(Du, 'onSelect')),
      0 < r.length &&
        ((t = new ef('onSelect', 'select', null, t, n)),
        e.push({ event: t, listeners: r }),
        (t.target = mo))));
}
function Ua(e, t) {
  var n = {};
  return (
    (n[e.toLowerCase()] = t.toLowerCase()),
    (n['Webkit' + e] = 'webkit' + t),
    (n['Moz' + e] = 'moz' + t),
    n
  );
}
var po = {
    animationend: Ua('Animation', 'AnimationEnd'),
    animationiteration: Ua('Animation', 'AnimationIteration'),
    animationstart: Ua('Animation', 'AnimationStart'),
    transitionend: Ua('Transition', 'TransitionEnd'),
  },
  Rc = {},
  yv = {};
jn &&
  ((yv = document.createElement('div').style),
  'AnimationEvent' in window ||
    (delete po.animationend.animation,
    delete po.animationiteration.animation,
    delete po.animationstart.animation),
  'TransitionEvent' in window || delete po.transitionend.transition);
function jl(e) {
  if (Rc[e]) return Rc[e];
  if (!po[e]) return e;
  var t = po[e],
    n;
  for (n in t) if (t.hasOwnProperty(n) && n in yv) return (Rc[e] = t[n]);
  return e;
}
var wv = jl('animationend'),
  bv = jl('animationiteration'),
  Nv = jl('animationstart'),
  jv = jl('transitionend'),
  Cv = new Map(),
  mp =
    'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
      ' '
    );
function pr(e, t) {
  (Cv.set(e, t), Gr(t, [e]));
}
for (var Dc = 0; Dc < mp.length; Dc++) {
  var Mc = mp[Dc],
    xj = Mc.toLowerCase(),
    yj = Mc[0].toUpperCase() + Mc.slice(1);
  pr(xj, 'on' + yj);
}
pr(wv, 'onAnimationEnd');
pr(bv, 'onAnimationIteration');
pr(Nv, 'onAnimationStart');
pr('dblclick', 'onDoubleClick');
pr('focusin', 'onFocus');
pr('focusout', 'onBlur');
pr(jv, 'onTransitionEnd');
Vo('onMouseEnter', ['mouseout', 'mouseover']);
Vo('onMouseLeave', ['mouseout', 'mouseover']);
Vo('onPointerEnter', ['pointerout', 'pointerover']);
Vo('onPointerLeave', ['pointerout', 'pointerover']);
Gr(
  'onChange',
  'change click focusin focusout input keydown keyup selectionchange'.split(' ')
);
Gr(
  'onSelect',
  'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(
    ' '
  )
);
Gr('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
Gr(
  'onCompositionEnd',
  'compositionend focusout keydown keypress keyup mousedown'.split(' ')
);
Gr(
  'onCompositionStart',
  'compositionstart focusout keydown keypress keyup mousedown'.split(' ')
);
Gr(
  'onCompositionUpdate',
  'compositionupdate focusout keydown keypress keyup mousedown'.split(' ')
);
var Ps =
    'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
      ' '
    ),
  wj = new Set('cancel close invalid load scroll toggle'.split(' ').concat(Ps));
function pp(e, t, n) {
  var r = e.type || 'unknown-event';
  ((e.currentTarget = n), xN(r, t, void 0, e), (e.currentTarget = null));
}
function Sv(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      o = r.event;
    r = r.listeners;
    e: {
      var s = void 0;
      if (t)
        for (var i = r.length - 1; 0 <= i; i--) {
          var l = r[i],
            c = l.instance,
            u = l.currentTarget;
          if (((l = l.listener), c !== s && o.isPropagationStopped())) break e;
          (pp(o, l, u), (s = c));
        }
      else
        for (i = 0; i < r.length; i++) {
          if (
            ((l = r[i]),
            (c = l.instance),
            (u = l.currentTarget),
            (l = l.listener),
            c !== s && o.isPropagationStopped())
          )
            break e;
          (pp(o, l, u), (s = c));
        }
    }
  }
  if (Mi) throw ((e = ku), (Mi = !1), (ku = null), e);
}
function fe(e, t) {
  var n = t[Lu];
  n === void 0 && (n = t[Lu] = new Set());
  var r = e + '__bubble';
  n.has(r) || (Ev(t, e, 2, !1), n.add(r));
}
function Ac(e, t, n) {
  var r = 0;
  (t && (r |= 4), Ev(n, e, r, t));
}
var Ba = '_reactListening' + Math.random().toString(36).slice(2);
function Xs(e) {
  if (!e[Ba]) {
    ((e[Ba] = !0),
      Ag.forEach(function (n) {
        n !== 'selectionchange' && (wj.has(n) || Ac(n, !1, e), Ac(n, !0, e));
      }));
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Ba] || ((t[Ba] = !0), Ac('selectionchange', !1, t));
  }
}
function Ev(e, t, n, r) {
  switch (cv(t)) {
    case 1:
      var o = ON;
      break;
    case 4:
      o = _N;
      break;
    default:
      o = Zd;
  }
  ((n = o.bind(null, t, n, e)),
    (o = void 0),
    !Eu ||
      (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') ||
      (o = !0),
    r
      ? o !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: o })
        : e.addEventListener(t, n, !0)
      : o !== void 0
        ? e.addEventListener(t, n, { passive: o })
        : e.addEventListener(t, n, !1));
}
function Oc(e, t, n, r, o) {
  var s = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return;
      var i = r.tag;
      if (i === 3 || i === 4) {
        var l = r.stateNode.containerInfo;
        if (l === o || (l.nodeType === 8 && l.parentNode === o)) break;
        if (i === 4)
          for (i = r.return; i !== null; ) {
            var c = i.tag;
            if (
              (c === 3 || c === 4) &&
              ((c = i.stateNode.containerInfo),
              c === o || (c.nodeType === 8 && c.parentNode === o))
            )
              return;
            i = i.return;
          }
        for (; l !== null; ) {
          if (((i = kr(l)), i === null)) return;
          if (((c = i.tag), c === 5 || c === 6)) {
            r = s = i;
            continue e;
          }
          l = l.parentNode;
        }
      }
      r = r.return;
    }
  Qg(function () {
    var u = s,
      f = Kd(n),
      m = [];
    e: {
      var p = Cv.get(e);
      if (p !== void 0) {
        var h = ef,
          b = e;
        switch (e) {
          case 'keypress':
            if (pi(n) === 0) break e;
          case 'keydown':
          case 'keyup':
            h = qN;
            break;
          case 'focusin':
            ((b = 'focus'), (h = kc));
            break;
          case 'focusout':
            ((b = 'blur'), (h = kc));
            break;
          case 'beforeblur':
          case 'afterblur':
            h = kc;
            break;
          case 'click':
            if (n.button === 2) break e;
          case 'auxclick':
          case 'dblclick':
          case 'mousedown':
          case 'mousemove':
          case 'mouseup':
          case 'mouseout':
          case 'mouseover':
          case 'contextmenu':
            h = np;
            break;
          case 'drag':
          case 'dragend':
          case 'dragenter':
          case 'dragexit':
          case 'dragleave':
          case 'dragover':
          case 'dragstart':
          case 'drop':
            h = FN;
            break;
          case 'touchcancel':
          case 'touchend':
          case 'touchmove':
          case 'touchstart':
            h = JN;
            break;
          case wv:
          case bv:
          case Nv:
            h = WN;
            break;
          case jv:
            h = tj;
            break;
          case 'scroll':
            h = IN;
            break;
          case 'wheel':
            h = rj;
            break;
          case 'copy':
          case 'cut':
          case 'paste':
            h = BN;
            break;
          case 'gotpointercapture':
          case 'lostpointercapture':
          case 'pointercancel':
          case 'pointerdown':
          case 'pointermove':
          case 'pointerout':
          case 'pointerover':
          case 'pointerup':
            h = op;
        }
        var v = (t & 4) !== 0,
          w = !v && e === 'scroll',
          x = v ? (p !== null ? p + 'Capture' : null) : p;
        v = [];
        for (var g = u, y; g !== null; ) {
          y = g;
          var N = y.stateNode;
          if (
            (y.tag === 5 &&
              N !== null &&
              ((y = N),
              x !== null && ((N = Vs(g, x)), N != null && v.push(Zs(g, N, y)))),
            w)
          )
            break;
          g = g.return;
        }
        0 < v.length &&
          ((p = new h(p, b, null, n, f)), m.push({ event: p, listeners: v }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((p = e === 'mouseover' || e === 'pointerover'),
          (h = e === 'mouseout' || e === 'pointerout'),
          p &&
            n !== Cu &&
            (b = n.relatedTarget || n.fromElement) &&
            (kr(b) || b[Cn]))
        )
          break e;
        if (
          (h || p) &&
          ((p =
            f.window === f
              ? f
              : (p = f.ownerDocument)
                ? p.defaultView || p.parentWindow
                : window),
          h
            ? ((b = n.relatedTarget || n.toElement),
              (h = u),
              (b = b ? kr(b) : null),
              b !== null &&
                ((w = Kr(b)), b !== w || (b.tag !== 5 && b.tag !== 6)) &&
                (b = null))
            : ((h = null), (b = u)),
          h !== b)
        ) {
          if (
            ((v = np),
            (N = 'onMouseLeave'),
            (x = 'onMouseEnter'),
            (g = 'mouse'),
            (e === 'pointerout' || e === 'pointerover') &&
              ((v = op),
              (N = 'onPointerLeave'),
              (x = 'onPointerEnter'),
              (g = 'pointer')),
            (w = h == null ? p : ho(h)),
            (y = b == null ? p : ho(b)),
            (p = new v(N, g + 'leave', h, n, f)),
            (p.target = w),
            (p.relatedTarget = y),
            (N = null),
            kr(f) === u &&
              ((v = new v(x, g + 'enter', b, n, f)),
              (v.target = y),
              (v.relatedTarget = w),
              (N = v)),
            (w = N),
            h && b)
          )
            t: {
              for (v = h, x = b, g = 0, y = v; y; y = to(y)) g++;
              for (y = 0, N = x; N; N = to(N)) y++;
              for (; 0 < g - y; ) ((v = to(v)), g--);
              for (; 0 < y - g; ) ((x = to(x)), y--);
              for (; g--; ) {
                if (v === x || (x !== null && v === x.alternate)) break t;
                ((v = to(v)), (x = to(x)));
              }
              v = null;
            }
          else v = null;
          (h !== null && hp(m, p, h, v, !1),
            b !== null && w !== null && hp(m, w, b, v, !0));
        }
      }
      e: {
        if (
          ((p = u ? ho(u) : window),
          (h = p.nodeName && p.nodeName.toLowerCase()),
          h === 'select' || (h === 'input' && p.type === 'file'))
        )
          var C = uj;
        else if (ip(p))
          if (hv) C = pj;
          else {
            C = fj;
            var j = dj;
          }
        else
          (h = p.nodeName) &&
            h.toLowerCase() === 'input' &&
            (p.type === 'checkbox' || p.type === 'radio') &&
            (C = mj);
        if (C && (C = C(e, u))) {
          pv(m, C, n, f);
          break e;
        }
        (j && j(e, p, u),
          e === 'focusout' &&
            (j = p._wrapperState) &&
            j.controlled &&
            p.type === 'number' &&
            yu(p, 'number', p.value));
      }
      switch (((j = u ? ho(u) : window), e)) {
        case 'focusin':
          (ip(j) || j.contentEditable === 'true') &&
            ((mo = j), (Du = u), (Is = null));
          break;
        case 'focusout':
          Is = Du = mo = null;
          break;
        case 'mousedown':
          Mu = !0;
          break;
        case 'contextmenu':
        case 'mouseup':
        case 'dragend':
          ((Mu = !1), fp(m, n, f));
          break;
        case 'selectionchange':
          if (vj) break;
        case 'keydown':
        case 'keyup':
          fp(m, n, f);
      }
      var S;
      if (nf)
        e: {
          switch (e) {
            case 'compositionstart':
              var k = 'onCompositionStart';
              break e;
            case 'compositionend':
              k = 'onCompositionEnd';
              break e;
            case 'compositionupdate':
              k = 'onCompositionUpdate';
              break e;
          }
          k = void 0;
        }
      else
        fo
          ? fv(e, n) && (k = 'onCompositionEnd')
          : e === 'keydown' && n.keyCode === 229 && (k = 'onCompositionStart');
      (k &&
        (dv &&
          n.locale !== 'ko' &&
          (fo || k !== 'onCompositionStart'
            ? k === 'onCompositionEnd' && fo && (S = uv())
            : ((Xn = f),
              (Jd = 'value' in Xn ? Xn.value : Xn.textContent),
              (fo = !0))),
        (j = Li(u, k)),
        0 < j.length &&
          ((k = new rp(k, e, null, n, f)),
          m.push({ event: k, listeners: j }),
          S ? (k.data = S) : ((S = mv(n)), S !== null && (k.data = S)))),
        (S = sj ? aj(e, n) : ij(e, n)) &&
          ((u = Li(u, 'onBeforeInput')),
          0 < u.length &&
            ((f = new rp('onBeforeInput', 'beforeinput', null, n, f)),
            m.push({ event: f, listeners: u }),
            (f.data = S))));
    }
    Sv(m, t);
  });
}
function Zs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Li(e, t) {
  for (var n = t + 'Capture', r = []; e !== null; ) {
    var o = e,
      s = o.stateNode;
    (o.tag === 5 &&
      s !== null &&
      ((o = s),
      (s = Vs(e, n)),
      s != null && r.unshift(Zs(e, s, o)),
      (s = Vs(e, t)),
      s != null && r.push(Zs(e, s, o))),
      (e = e.return));
  }
  return r;
}
function to(e) {
  if (e === null) return null;
  do e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function hp(e, t, n, r, o) {
  for (var s = t._reactName, i = []; n !== null && n !== r; ) {
    var l = n,
      c = l.alternate,
      u = l.stateNode;
    if (c !== null && c === r) break;
    (l.tag === 5 &&
      u !== null &&
      ((l = u),
      o
        ? ((c = Vs(n, s)), c != null && i.unshift(Zs(n, c, l)))
        : o || ((c = Vs(n, s)), c != null && i.push(Zs(n, c, l)))),
      (n = n.return));
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var bj = /\r\n?/g,
  Nj = /\u0000|\uFFFD/g;
function gp(e) {
  return (typeof e == 'string' ? e : '' + e)
    .replace(
      bj,
      `
`
    )
    .replace(Nj, '');
}
function Ha(e, t, n) {
  if (((t = gp(t)), gp(e) !== t && n)) throw Error(O(425));
}
function Fi() {}
var Au = null,
  Ou = null;
function _u(e, t) {
  return (
    e === 'textarea' ||
    e === 'noscript' ||
    typeof t.children == 'string' ||
    typeof t.children == 'number' ||
    (typeof t.dangerouslySetInnerHTML == 'object' &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  );
}
var Iu = typeof setTimeout == 'function' ? setTimeout : void 0,
  jj = typeof clearTimeout == 'function' ? clearTimeout : void 0,
  vp = typeof Promise == 'function' ? Promise : void 0,
  Cj =
    typeof queueMicrotask == 'function'
      ? queueMicrotask
      : typeof vp < 'u'
        ? function (e) {
            return vp.resolve(null).then(e).catch(Sj);
          }
        : Iu;
function Sj(e) {
  setTimeout(function () {
    throw e;
  });
}
function _c(e, t) {
  var n = t,
    r = 0;
  do {
    var o = n.nextSibling;
    if ((e.removeChild(n), o && o.nodeType === 8))
      if (((n = o.data), n === '/$')) {
        if (r === 0) {
          (e.removeChild(o), Ks(t));
          return;
        }
        r--;
      } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
    n = o;
  } while (n);
  Ks(t);
}
function rr(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
      if (t === '/$') return null;
    }
  }
  return e;
}
function xp(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === '$' || n === '$!' || n === '$?') {
        if (t === 0) return e;
        t--;
      } else n === '/$' && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var ss = Math.random().toString(36).slice(2),
  Zt = '__reactFiber$' + ss,
  Js = '__reactProps$' + ss,
  Cn = '__reactContainer$' + ss,
  Lu = '__reactEvents$' + ss,
  Ej = '__reactListeners$' + ss,
  kj = '__reactHandles$' + ss;
function kr(e) {
  var t = e[Zt];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if ((t = n[Cn] || n[Zt])) {
      if (
        ((n = t.alternate),
        t.child !== null || (n !== null && n.child !== null))
      )
        for (e = xp(e); e !== null; ) {
          if ((n = e[Zt])) return n;
          e = xp(e);
        }
      return t;
    }
    ((e = n), (n = e.parentNode));
  }
  return null;
}
function ba(e) {
  return (
    (e = e[Zt] || e[Cn]),
    !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e
  );
}
function ho(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(O(33));
}
function Cl(e) {
  return e[Js] || null;
}
var Fu = [],
  go = -1;
function hr(e) {
  return { current: e };
}
function me(e) {
  0 > go || ((e.current = Fu[go]), (Fu[go] = null), go--);
}
function ce(e, t) {
  (go++, (Fu[go] = e.current), (e.current = t));
}
var ur = {},
  We = hr(ur),
  et = hr(!1),
  $r = ur;
function Yo(e, t) {
  var n = e.type.contextTypes;
  if (!n) return ur;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
    return r.__reactInternalMemoizedMaskedChildContext;
  var o = {},
    s;
  for (s in n) o[s] = t[s];
  return (
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = t),
      (e.__reactInternalMemoizedMaskedChildContext = o)),
    o
  );
}
function tt(e) {
  return ((e = e.childContextTypes), e != null);
}
function $i() {
  (me(et), me(We));
}
function yp(e, t, n) {
  if (We.current !== ur) throw Error(O(168));
  (ce(We, t), ce(et, n));
}
function kv(e, t, n) {
  var r = e.stateNode;
  if (((t = t.childContextTypes), typeof r.getChildContext != 'function'))
    return n;
  r = r.getChildContext();
  for (var o in r) if (!(o in t)) throw Error(O(108, dN(e) || 'Unknown', o));
  return we({}, n, r);
}
function zi(e) {
  return (
    (e =
      ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || ur),
    ($r = We.current),
    ce(We, e),
    ce(et, et.current),
    !0
  );
}
function wp(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(O(169));
  (n
    ? ((e = kv(e, t, $r)),
      (r.__reactInternalMemoizedMergedChildContext = e),
      me(et),
      me(We),
      ce(We, e))
    : me(et),
    ce(et, n));
}
var hn = null,
  Sl = !1,
  Ic = !1;
function Pv(e) {
  hn === null ? (hn = [e]) : hn.push(e);
}
function Pj(e) {
  ((Sl = !0), Pv(e));
}
function gr() {
  if (!Ic && hn !== null) {
    Ic = !0;
    var e = 0,
      t = ie;
    try {
      var n = hn;
      for (ie = 1; e < n.length; e++) {
        var r = n[e];
        do r = r(!0);
        while (r !== null);
      }
      ((hn = null), (Sl = !1));
    } catch (o) {
      throw (hn !== null && (hn = hn.slice(e + 1)), Jg(Qd, gr), o);
    } finally {
      ((ie = t), (Ic = !1));
    }
  }
  return null;
}
var vo = [],
  xo = 0,
  Wi = null,
  Ui = 0,
  ht = [],
  gt = 0,
  zr = null,
  xn = 1,
  yn = '';
function Cr(e, t) {
  ((vo[xo++] = Ui), (vo[xo++] = Wi), (Wi = e), (Ui = t));
}
function Tv(e, t, n) {
  ((ht[gt++] = xn), (ht[gt++] = yn), (ht[gt++] = zr), (zr = e));
  var r = xn;
  e = yn;
  var o = 32 - Lt(r) - 1;
  ((r &= ~(1 << o)), (n += 1));
  var s = 32 - Lt(t) + o;
  if (30 < s) {
    var i = o - (o % 5);
    ((s = (r & ((1 << i) - 1)).toString(32)),
      (r >>= i),
      (o -= i),
      (xn = (1 << (32 - Lt(t) + o)) | (n << o) | r),
      (yn = s + e));
  } else ((xn = (1 << s) | (n << o) | r), (yn = e));
}
function of(e) {
  e.return !== null && (Cr(e, 1), Tv(e, 1, 0));
}
function sf(e) {
  for (; e === Wi; )
    ((Wi = vo[--xo]), (vo[xo] = null), (Ui = vo[--xo]), (vo[xo] = null));
  for (; e === zr; )
    ((zr = ht[--gt]),
      (ht[gt] = null),
      (yn = ht[--gt]),
      (ht[gt] = null),
      (xn = ht[--gt]),
      (ht[gt] = null));
}
var it = null,
  at = null,
  ve = !1,
  It = null;
function Rv(e, t) {
  var n = vt(5, null, null, 0);
  ((n.elementType = 'DELETED'),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n));
}
function bp(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return (
        (t =
          t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase()
            ? null
            : t),
        t !== null
          ? ((e.stateNode = t), (it = e), (at = rr(t.firstChild)), !0)
          : !1
      );
    case 6:
      return (
        (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t),
        t !== null ? ((e.stateNode = t), (it = e), (at = null), !0) : !1
      );
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = zr !== null ? { id: xn, overflow: yn } : null),
            (e.memoizedState = {
              dehydrated: t,
              treeContext: n,
              retryLane: 1073741824,
            }),
            (n = vt(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (it = e),
            (at = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function $u(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function zu(e) {
  if (ve) {
    var t = at;
    if (t) {
      var n = t;
      if (!bp(e, t)) {
        if ($u(e)) throw Error(O(418));
        t = rr(n.nextSibling);
        var r = it;
        t && bp(e, t)
          ? Rv(r, n)
          : ((e.flags = (e.flags & -4097) | 2), (ve = !1), (it = e));
      }
    } else {
      if ($u(e)) throw Error(O(418));
      ((e.flags = (e.flags & -4097) | 2), (ve = !1), (it = e));
    }
  }
}
function Np(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; )
    e = e.return;
  it = e;
}
function Va(e) {
  if (e !== it) return !1;
  if (!ve) return (Np(e), (ve = !0), !1);
  var t;
  if (
    ((t = e.tag !== 3) &&
      !(t = e.tag !== 5) &&
      ((t = e.type),
      (t = t !== 'head' && t !== 'body' && !_u(e.type, e.memoizedProps))),
    t && (t = at))
  ) {
    if ($u(e)) throw (Dv(), Error(O(418)));
    for (; t; ) (Rv(e, t), (t = rr(t.nextSibling)));
  }
  if ((Np(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
      throw Error(O(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === '/$') {
            if (t === 0) {
              at = rr(e.nextSibling);
              break e;
            }
            t--;
          } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
        }
        e = e.nextSibling;
      }
      at = null;
    }
  } else at = it ? rr(e.stateNode.nextSibling) : null;
  return !0;
}
function Dv() {
  for (var e = at; e; ) e = rr(e.nextSibling);
}
function Go() {
  ((at = it = null), (ve = !1));
}
function af(e) {
  It === null ? (It = [e]) : It.push(e);
}
var Tj = Tn.ReactCurrentBatchConfig;
function ys(e, t, n) {
  if (
    ((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')
  ) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(O(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(O(147, e));
      var o = r,
        s = '' + e;
      return t !== null &&
        t.ref !== null &&
        typeof t.ref == 'function' &&
        t.ref._stringRef === s
        ? t.ref
        : ((t = function (i) {
            var l = o.refs;
            i === null ? delete l[s] : (l[s] = i);
          }),
          (t._stringRef = s),
          t);
    }
    if (typeof e != 'string') throw Error(O(284));
    if (!n._owner) throw Error(O(290, e));
  }
  return e;
}
function Ya(e, t) {
  throw (
    (e = Object.prototype.toString.call(t)),
    Error(
      O(
        31,
        e === '[object Object]'
          ? 'object with keys {' + Object.keys(t).join(', ') + '}'
          : e
      )
    )
  );
}
function jp(e) {
  var t = e._init;
  return t(e._payload);
}
function Mv(e) {
  function t(x, g) {
    if (e) {
      var y = x.deletions;
      y === null ? ((x.deletions = [g]), (x.flags |= 16)) : y.push(g);
    }
  }
  function n(x, g) {
    if (!e) return null;
    for (; g !== null; ) (t(x, g), (g = g.sibling));
    return null;
  }
  function r(x, g) {
    for (x = new Map(); g !== null; )
      (g.key !== null ? x.set(g.key, g) : x.set(g.index, g), (g = g.sibling));
    return x;
  }
  function o(x, g) {
    return ((x = ir(x, g)), (x.index = 0), (x.sibling = null), x);
  }
  function s(x, g, y) {
    return (
      (x.index = y),
      e
        ? ((y = x.alternate),
          y !== null
            ? ((y = y.index), y < g ? ((x.flags |= 2), g) : y)
            : ((x.flags |= 2), g))
        : ((x.flags |= 1048576), g)
    );
  }
  function i(x) {
    return (e && x.alternate === null && (x.flags |= 2), x);
  }
  function l(x, g, y, N) {
    return g === null || g.tag !== 6
      ? ((g = Bc(y, x.mode, N)), (g.return = x), g)
      : ((g = o(g, y)), (g.return = x), g);
  }
  function c(x, g, y, N) {
    var C = y.type;
    return C === uo
      ? f(x, g, y.props.children, N, y.key)
      : g !== null &&
          (g.elementType === C ||
            (typeof C == 'object' &&
              C !== null &&
              C.$$typeof === Un &&
              jp(C) === g.type))
        ? ((N = o(g, y.props)), (N.ref = ys(x, g, y)), (N.return = x), N)
        : ((N = bi(y.type, y.key, y.props, null, x.mode, N)),
          (N.ref = ys(x, g, y)),
          (N.return = x),
          N);
  }
  function u(x, g, y, N) {
    return g === null ||
      g.tag !== 4 ||
      g.stateNode.containerInfo !== y.containerInfo ||
      g.stateNode.implementation !== y.implementation
      ? ((g = Hc(y, x.mode, N)), (g.return = x), g)
      : ((g = o(g, y.children || [])), (g.return = x), g);
  }
  function f(x, g, y, N, C) {
    return g === null || g.tag !== 7
      ? ((g = Lr(y, x.mode, N, C)), (g.return = x), g)
      : ((g = o(g, y)), (g.return = x), g);
  }
  function m(x, g, y) {
    if ((typeof g == 'string' && g !== '') || typeof g == 'number')
      return ((g = Bc('' + g, x.mode, y)), (g.return = x), g);
    if (typeof g == 'object' && g !== null) {
      switch (g.$$typeof) {
        case _a:
          return (
            (y = bi(g.type, g.key, g.props, null, x.mode, y)),
            (y.ref = ys(x, null, g)),
            (y.return = x),
            y
          );
        case co:
          return ((g = Hc(g, x.mode, y)), (g.return = x), g);
        case Un:
          var N = g._init;
          return m(x, N(g._payload), y);
      }
      if (Es(g) || ps(g))
        return ((g = Lr(g, x.mode, y, null)), (g.return = x), g);
      Ya(x, g);
    }
    return null;
  }
  function p(x, g, y, N) {
    var C = g !== null ? g.key : null;
    if ((typeof y == 'string' && y !== '') || typeof y == 'number')
      return C !== null ? null : l(x, g, '' + y, N);
    if (typeof y == 'object' && y !== null) {
      switch (y.$$typeof) {
        case _a:
          return y.key === C ? c(x, g, y, N) : null;
        case co:
          return y.key === C ? u(x, g, y, N) : null;
        case Un:
          return ((C = y._init), p(x, g, C(y._payload), N));
      }
      if (Es(y) || ps(y)) return C !== null ? null : f(x, g, y, N, null);
      Ya(x, y);
    }
    return null;
  }
  function h(x, g, y, N, C) {
    if ((typeof N == 'string' && N !== '') || typeof N == 'number')
      return ((x = x.get(y) || null), l(g, x, '' + N, C));
    if (typeof N == 'object' && N !== null) {
      switch (N.$$typeof) {
        case _a:
          return (
            (x = x.get(N.key === null ? y : N.key) || null),
            c(g, x, N, C)
          );
        case co:
          return (
            (x = x.get(N.key === null ? y : N.key) || null),
            u(g, x, N, C)
          );
        case Un:
          var j = N._init;
          return h(x, g, y, j(N._payload), C);
      }
      if (Es(N) || ps(N)) return ((x = x.get(y) || null), f(g, x, N, C, null));
      Ya(g, N);
    }
    return null;
  }
  function b(x, g, y, N) {
    for (
      var C = null, j = null, S = g, k = (g = 0), M = null;
      S !== null && k < y.length;
      k++
    ) {
      S.index > k ? ((M = S), (S = null)) : (M = S.sibling);
      var D = p(x, S, y[k], N);
      if (D === null) {
        S === null && (S = M);
        break;
      }
      (e && S && D.alternate === null && t(x, S),
        (g = s(D, g, k)),
        j === null ? (C = D) : (j.sibling = D),
        (j = D),
        (S = M));
    }
    if (k === y.length) return (n(x, S), ve && Cr(x, k), C);
    if (S === null) {
      for (; k < y.length; k++)
        ((S = m(x, y[k], N)),
          S !== null &&
            ((g = s(S, g, k)),
            j === null ? (C = S) : (j.sibling = S),
            (j = S)));
      return (ve && Cr(x, k), C);
    }
    for (S = r(x, S); k < y.length; k++)
      ((M = h(S, x, k, y[k], N)),
        M !== null &&
          (e && M.alternate !== null && S.delete(M.key === null ? k : M.key),
          (g = s(M, g, k)),
          j === null ? (C = M) : (j.sibling = M),
          (j = M)));
    return (
      e &&
        S.forEach(function (W) {
          return t(x, W);
        }),
      ve && Cr(x, k),
      C
    );
  }
  function v(x, g, y, N) {
    var C = ps(y);
    if (typeof C != 'function') throw Error(O(150));
    if (((y = C.call(y)), y == null)) throw Error(O(151));
    for (
      var j = (C = null), S = g, k = (g = 0), M = null, D = y.next();
      S !== null && !D.done;
      k++, D = y.next()
    ) {
      S.index > k ? ((M = S), (S = null)) : (M = S.sibling);
      var W = p(x, S, D.value, N);
      if (W === null) {
        S === null && (S = M);
        break;
      }
      (e && S && W.alternate === null && t(x, S),
        (g = s(W, g, k)),
        j === null ? (C = W) : (j.sibling = W),
        (j = W),
        (S = M));
    }
    if (D.done) return (n(x, S), ve && Cr(x, k), C);
    if (S === null) {
      for (; !D.done; k++, D = y.next())
        ((D = m(x, D.value, N)),
          D !== null &&
            ((g = s(D, g, k)),
            j === null ? (C = D) : (j.sibling = D),
            (j = D)));
      return (ve && Cr(x, k), C);
    }
    for (S = r(x, S); !D.done; k++, D = y.next())
      ((D = h(S, x, k, D.value, N)),
        D !== null &&
          (e && D.alternate !== null && S.delete(D.key === null ? k : D.key),
          (g = s(D, g, k)),
          j === null ? (C = D) : (j.sibling = D),
          (j = D)));
    return (
      e &&
        S.forEach(function (P) {
          return t(x, P);
        }),
      ve && Cr(x, k),
      C
    );
  }
  function w(x, g, y, N) {
    if (
      (typeof y == 'object' &&
        y !== null &&
        y.type === uo &&
        y.key === null &&
        (y = y.props.children),
      typeof y == 'object' && y !== null)
    ) {
      switch (y.$$typeof) {
        case _a:
          e: {
            for (var C = y.key, j = g; j !== null; ) {
              if (j.key === C) {
                if (((C = y.type), C === uo)) {
                  if (j.tag === 7) {
                    (n(x, j.sibling),
                      (g = o(j, y.props.children)),
                      (g.return = x),
                      (x = g));
                    break e;
                  }
                } else if (
                  j.elementType === C ||
                  (typeof C == 'object' &&
                    C !== null &&
                    C.$$typeof === Un &&
                    jp(C) === j.type)
                ) {
                  (n(x, j.sibling),
                    (g = o(j, y.props)),
                    (g.ref = ys(x, j, y)),
                    (g.return = x),
                    (x = g));
                  break e;
                }
                n(x, j);
                break;
              } else t(x, j);
              j = j.sibling;
            }
            y.type === uo
              ? ((g = Lr(y.props.children, x.mode, N, y.key)),
                (g.return = x),
                (x = g))
              : ((N = bi(y.type, y.key, y.props, null, x.mode, N)),
                (N.ref = ys(x, g, y)),
                (N.return = x),
                (x = N));
          }
          return i(x);
        case co:
          e: {
            for (j = y.key; g !== null; ) {
              if (g.key === j)
                if (
                  g.tag === 4 &&
                  g.stateNode.containerInfo === y.containerInfo &&
                  g.stateNode.implementation === y.implementation
                ) {
                  (n(x, g.sibling),
                    (g = o(g, y.children || [])),
                    (g.return = x),
                    (x = g));
                  break e;
                } else {
                  n(x, g);
                  break;
                }
              else t(x, g);
              g = g.sibling;
            }
            ((g = Hc(y, x.mode, N)), (g.return = x), (x = g));
          }
          return i(x);
        case Un:
          return ((j = y._init), w(x, g, j(y._payload), N));
      }
      if (Es(y)) return b(x, g, y, N);
      if (ps(y)) return v(x, g, y, N);
      Ya(x, y);
    }
    return (typeof y == 'string' && y !== '') || typeof y == 'number'
      ? ((y = '' + y),
        g !== null && g.tag === 6
          ? (n(x, g.sibling), (g = o(g, y)), (g.return = x), (x = g))
          : (n(x, g), (g = Bc(y, x.mode, N)), (g.return = x), (x = g)),
        i(x))
      : n(x, g);
  }
  return w;
}
var Ko = Mv(!0),
  Av = Mv(!1),
  Bi = hr(null),
  Hi = null,
  yo = null,
  lf = null;
function cf() {
  lf = yo = Hi = null;
}
function uf(e) {
  var t = Bi.current;
  (me(Bi), (e._currentValue = t));
}
function Wu(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break;
    e = e.return;
  }
}
function To(e, t) {
  ((Hi = e),
    (lf = yo = null),
    (e = e.dependencies),
    e !== null &&
      e.firstContext !== null &&
      (e.lanes & t && (Je = !0), (e.firstContext = null)));
}
function wt(e) {
  var t = e._currentValue;
  if (lf !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), yo === null)) {
      if (Hi === null) throw Error(O(308));
      ((yo = e), (Hi.dependencies = { lanes: 0, firstContext: e }));
    } else yo = yo.next = e;
  return t;
}
var Pr = null;
function df(e) {
  Pr === null ? (Pr = [e]) : Pr.push(e);
}
function Ov(e, t, n, r) {
  var o = t.interleaved;
  return (
    o === null ? ((n.next = n), df(t)) : ((n.next = o.next), (o.next = n)),
    (t.interleaved = n),
    Sn(e, r)
  );
}
function Sn(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    ((e.childLanes |= t),
      (n = e.alternate),
      n !== null && (n.childLanes |= t),
      (n = e),
      (e = e.return));
  return n.tag === 3 ? n.stateNode : null;
}
var Bn = !1;
function ff(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  };
}
function _v(e, t) {
  ((e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      }));
}
function Nn(e, t) {
  return {
    eventTime: e,
    lane: t,
    tag: 0,
    payload: null,
    callback: null,
    next: null,
  };
}
function or(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (((r = r.shared), re & 2)) {
    var o = r.pending;
    return (
      o === null ? (t.next = t) : ((t.next = o.next), (o.next = t)),
      (r.pending = t),
      Sn(e, n)
    );
  }
  return (
    (o = r.interleaved),
    o === null ? ((t.next = t), df(r)) : ((t.next = o.next), (o.next = t)),
    (r.interleaved = t),
    Sn(e, n)
  );
}
function hi(e, t, n) {
  if (
    ((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))
  ) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), qd(e, n));
  }
}
function Cp(e, t) {
  var n = e.updateQueue,
    r = e.alternate;
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var o = null,
      s = null;
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var i = {
          eventTime: n.eventTime,
          lane: n.lane,
          tag: n.tag,
          payload: n.payload,
          callback: n.callback,
          next: null,
        };
        (s === null ? (o = s = i) : (s = s.next = i), (n = n.next));
      } while (n !== null);
      s === null ? (o = s = t) : (s = s.next = t);
    } else o = s = t;
    ((n = {
      baseState: r.baseState,
      firstBaseUpdate: o,
      lastBaseUpdate: s,
      shared: r.shared,
      effects: r.effects,
    }),
      (e.updateQueue = n));
    return;
  }
  ((e = n.lastBaseUpdate),
    e === null ? (n.firstBaseUpdate = t) : (e.next = t),
    (n.lastBaseUpdate = t));
}
function Vi(e, t, n, r) {
  var o = e.updateQueue;
  Bn = !1;
  var s = o.firstBaseUpdate,
    i = o.lastBaseUpdate,
    l = o.shared.pending;
  if (l !== null) {
    o.shared.pending = null;
    var c = l,
      u = c.next;
    ((c.next = null), i === null ? (s = u) : (i.next = u), (i = c));
    var f = e.alternate;
    f !== null &&
      ((f = f.updateQueue),
      (l = f.lastBaseUpdate),
      l !== i &&
        (l === null ? (f.firstBaseUpdate = u) : (l.next = u),
        (f.lastBaseUpdate = c)));
  }
  if (s !== null) {
    var m = o.baseState;
    ((i = 0), (f = u = c = null), (l = s));
    do {
      var p = l.lane,
        h = l.eventTime;
      if ((r & p) === p) {
        f !== null &&
          (f = f.next =
            {
              eventTime: h,
              lane: 0,
              tag: l.tag,
              payload: l.payload,
              callback: l.callback,
              next: null,
            });
        e: {
          var b = e,
            v = l;
          switch (((p = t), (h = n), v.tag)) {
            case 1:
              if (((b = v.payload), typeof b == 'function')) {
                m = b.call(h, m, p);
                break e;
              }
              m = b;
              break e;
            case 3:
              b.flags = (b.flags & -65537) | 128;
            case 0:
              if (
                ((b = v.payload),
                (p = typeof b == 'function' ? b.call(h, m, p) : b),
                p == null)
              )
                break e;
              m = we({}, m, p);
              break e;
            case 2:
              Bn = !0;
          }
        }
        l.callback !== null &&
          l.lane !== 0 &&
          ((e.flags |= 64),
          (p = o.effects),
          p === null ? (o.effects = [l]) : p.push(l));
      } else
        ((h = {
          eventTime: h,
          lane: p,
          tag: l.tag,
          payload: l.payload,
          callback: l.callback,
          next: null,
        }),
          f === null ? ((u = f = h), (c = m)) : (f = f.next = h),
          (i |= p));
      if (((l = l.next), l === null)) {
        if (((l = o.shared.pending), l === null)) break;
        ((p = l),
          (l = p.next),
          (p.next = null),
          (o.lastBaseUpdate = p),
          (o.shared.pending = null));
      }
    } while (!0);
    if (
      (f === null && (c = m),
      (o.baseState = c),
      (o.firstBaseUpdate = u),
      (o.lastBaseUpdate = f),
      (t = o.shared.interleaved),
      t !== null)
    ) {
      o = t;
      do ((i |= o.lane), (o = o.next));
      while (o !== t);
    } else s === null && (o.shared.lanes = 0);
    ((Ur |= i), (e.lanes = i), (e.memoizedState = m));
  }
}
function Sp(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        o = r.callback;
      if (o !== null) {
        if (((r.callback = null), (r = n), typeof o != 'function'))
          throw Error(O(191, o));
        o.call(r);
      }
    }
}
var Na = {},
  on = hr(Na),
  ea = hr(Na),
  ta = hr(Na);
function Tr(e) {
  if (e === Na) throw Error(O(174));
  return e;
}
function mf(e, t) {
  switch ((ce(ta, t), ce(ea, e), ce(on, Na), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : bu(null, '');
      break;
    default:
      ((e = e === 8 ? t.parentNode : t),
        (t = e.namespaceURI || null),
        (e = e.tagName),
        (t = bu(t, e)));
  }
  (me(on), ce(on, t));
}
function Qo() {
  (me(on), me(ea), me(ta));
}
function Iv(e) {
  Tr(ta.current);
  var t = Tr(on.current),
    n = bu(t, e.type);
  t !== n && (ce(ea, e), ce(on, n));
}
function pf(e) {
  ea.current === e && (me(on), me(ea));
}
var xe = hr(0);
function Yi(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (
        n !== null &&
        ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!')
      )
        return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      ((t.child.return = t), (t = t.child));
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    ((t.sibling.return = t.return), (t = t.sibling));
  }
  return null;
}
var Lc = [];
function hf() {
  for (var e = 0; e < Lc.length; e++)
    Lc[e]._workInProgressVersionPrimary = null;
  Lc.length = 0;
}
var gi = Tn.ReactCurrentDispatcher,
  Fc = Tn.ReactCurrentBatchConfig,
  Wr = 0,
  ye = null,
  ke = null,
  Te = null,
  Gi = !1,
  Ls = !1,
  na = 0,
  Rj = 0;
function Le() {
  throw Error(O(321));
}
function gf(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++)
    if (!$t(e[n], t[n])) return !1;
  return !0;
}
function vf(e, t, n, r, o, s) {
  if (
    ((Wr = s),
    (ye = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (gi.current = e === null || e.memoizedState === null ? Oj : _j),
    (e = n(r, o)),
    Ls)
  ) {
    s = 0;
    do {
      if (((Ls = !1), (na = 0), 25 <= s)) throw Error(O(301));
      ((s += 1),
        (Te = ke = null),
        (t.updateQueue = null),
        (gi.current = Ij),
        (e = n(r, o)));
    } while (Ls);
  }
  if (
    ((gi.current = Ki),
    (t = ke !== null && ke.next !== null),
    (Wr = 0),
    (Te = ke = ye = null),
    (Gi = !1),
    t)
  )
    throw Error(O(300));
  return e;
}
function xf() {
  var e = na !== 0;
  return ((na = 0), e);
}
function Vt() {
  var e = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };
  return (Te === null ? (ye.memoizedState = Te = e) : (Te = Te.next = e), Te);
}
function bt() {
  if (ke === null) {
    var e = ye.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = ke.next;
  var t = Te === null ? ye.memoizedState : Te.next;
  if (t !== null) ((Te = t), (ke = e));
  else {
    if (e === null) throw Error(O(310));
    ((ke = e),
      (e = {
        memoizedState: ke.memoizedState,
        baseState: ke.baseState,
        baseQueue: ke.baseQueue,
        queue: ke.queue,
        next: null,
      }),
      Te === null ? (ye.memoizedState = Te = e) : (Te = Te.next = e));
  }
  return Te;
}
function ra(e, t) {
  return typeof t == 'function' ? t(e) : t;
}
function $c(e) {
  var t = bt(),
    n = t.queue;
  if (n === null) throw Error(O(311));
  n.lastRenderedReducer = e;
  var r = ke,
    o = r.baseQueue,
    s = n.pending;
  if (s !== null) {
    if (o !== null) {
      var i = o.next;
      ((o.next = s.next), (s.next = i));
    }
    ((r.baseQueue = o = s), (n.pending = null));
  }
  if (o !== null) {
    ((s = o.next), (r = r.baseState));
    var l = (i = null),
      c = null,
      u = s;
    do {
      var f = u.lane;
      if ((Wr & f) === f)
        (c !== null &&
          (c = c.next =
            {
              lane: 0,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
          (r = u.hasEagerState ? u.eagerState : e(r, u.action)));
      else {
        var m = {
          lane: f,
          action: u.action,
          hasEagerState: u.hasEagerState,
          eagerState: u.eagerState,
          next: null,
        };
        (c === null ? ((l = c = m), (i = r)) : (c = c.next = m),
          (ye.lanes |= f),
          (Ur |= f));
      }
      u = u.next;
    } while (u !== null && u !== s);
    (c === null ? (i = r) : (c.next = l),
      $t(r, t.memoizedState) || (Je = !0),
      (t.memoizedState = r),
      (t.baseState = i),
      (t.baseQueue = c),
      (n.lastRenderedState = r));
  }
  if (((e = n.interleaved), e !== null)) {
    o = e;
    do ((s = o.lane), (ye.lanes |= s), (Ur |= s), (o = o.next));
    while (o !== e);
  } else o === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function zc(e) {
  var t = bt(),
    n = t.queue;
  if (n === null) throw Error(O(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch,
    o = n.pending,
    s = t.memoizedState;
  if (o !== null) {
    n.pending = null;
    var i = (o = o.next);
    do ((s = e(s, i.action)), (i = i.next));
    while (i !== o);
    ($t(s, t.memoizedState) || (Je = !0),
      (t.memoizedState = s),
      t.baseQueue === null && (t.baseState = s),
      (n.lastRenderedState = s));
  }
  return [s, r];
}
function Lv() {}
function Fv(e, t) {
  var n = ye,
    r = bt(),
    o = t(),
    s = !$t(r.memoizedState, o);
  if (
    (s && ((r.memoizedState = o), (Je = !0)),
    (r = r.queue),
    yf(Wv.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || s || (Te !== null && Te.memoizedState.tag & 1))
  ) {
    if (
      ((n.flags |= 2048),
      oa(9, zv.bind(null, n, r, o, t), void 0, null),
      Re === null)
    )
      throw Error(O(349));
    Wr & 30 || $v(n, t, o);
  }
  return o;
}
function $v(e, t, n) {
  ((e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = ye.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (ye.updateQueue = t),
        (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
}
function zv(e, t, n, r) {
  ((t.value = n), (t.getSnapshot = r), Uv(t) && Bv(e));
}
function Wv(e, t, n) {
  return n(function () {
    Uv(t) && Bv(e);
  });
}
function Uv(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !$t(e, n);
  } catch {
    return !0;
  }
}
function Bv(e) {
  var t = Sn(e, 1);
  t !== null && Ft(t, e, 1, -1);
}
function Ep(e) {
  var t = Vt();
  return (
    typeof e == 'function' && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = {
      pending: null,
      interleaved: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: ra,
      lastRenderedState: e,
    }),
    (t.queue = e),
    (e = e.dispatch = Aj.bind(null, ye, e)),
    [t.memoizedState, e]
  );
}
function oa(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = ye.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }),
        (ye.updateQueue = t),
        (t.lastEffect = e.next = e))
      : ((n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  );
}
function Hv() {
  return bt().memoizedState;
}
function vi(e, t, n, r) {
  var o = Vt();
  ((ye.flags |= e),
    (o.memoizedState = oa(1 | t, n, void 0, r === void 0 ? null : r)));
}
function El(e, t, n, r) {
  var o = bt();
  r = r === void 0 ? null : r;
  var s = void 0;
  if (ke !== null) {
    var i = ke.memoizedState;
    if (((s = i.destroy), r !== null && gf(r, i.deps))) {
      o.memoizedState = oa(t, n, s, r);
      return;
    }
  }
  ((ye.flags |= e), (o.memoizedState = oa(1 | t, n, s, r)));
}
function kp(e, t) {
  return vi(8390656, 8, e, t);
}
function yf(e, t) {
  return El(2048, 8, e, t);
}
function Vv(e, t) {
  return El(4, 2, e, t);
}
function Yv(e, t) {
  return El(4, 4, e, t);
}
function Gv(e, t) {
  if (typeof t == 'function')
    return (
      (e = e()),
      t(e),
      function () {
        t(null);
      }
    );
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null;
      }
    );
}
function Kv(e, t, n) {
  return (
    (n = n != null ? n.concat([e]) : null),
    El(4, 4, Gv.bind(null, t, e), n)
  );
}
function wf() {}
function Qv(e, t) {
  var n = bt();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gf(t, r[1])
    ? r[0]
    : ((n.memoizedState = [e, t]), e);
}
function qv(e, t) {
  var n = bt();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gf(t, r[1])
    ? r[0]
    : ((e = e()), (n.memoizedState = [e, t]), e);
}
function Xv(e, t, n) {
  return Wr & 21
    ? ($t(n, t) || ((n = nv()), (ye.lanes |= n), (Ur |= n), (e.baseState = !0)),
      t)
    : (e.baseState && ((e.baseState = !1), (Je = !0)), (e.memoizedState = n));
}
function Dj(e, t) {
  var n = ie;
  ((ie = n !== 0 && 4 > n ? n : 4), e(!0));
  var r = Fc.transition;
  Fc.transition = {};
  try {
    (e(!1), t());
  } finally {
    ((ie = n), (Fc.transition = r));
  }
}
function Zv() {
  return bt().memoizedState;
}
function Mj(e, t, n) {
  var r = ar(e);
  if (
    ((n = {
      lane: r,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
    Jv(e))
  )
    e0(t, n);
  else if (((n = Ov(e, t, n, r)), n !== null)) {
    var o = Ye();
    (Ft(n, e, r, o), t0(n, t, r));
  }
}
function Aj(e, t, n) {
  var r = ar(e),
    o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (Jv(e)) e0(t, o);
  else {
    var s = e.alternate;
    if (
      e.lanes === 0 &&
      (s === null || s.lanes === 0) &&
      ((s = t.lastRenderedReducer), s !== null)
    )
      try {
        var i = t.lastRenderedState,
          l = s(i, n);
        if (((o.hasEagerState = !0), (o.eagerState = l), $t(l, i))) {
          var c = t.interleaved;
          (c === null
            ? ((o.next = o), df(t))
            : ((o.next = c.next), (c.next = o)),
            (t.interleaved = o));
          return;
        }
      } catch {
      } finally {
      }
    ((n = Ov(e, t, o, r)),
      n !== null && ((o = Ye()), Ft(n, e, r, o), t0(n, t, r)));
  }
}
function Jv(e) {
  var t = e.alternate;
  return e === ye || (t !== null && t === ye);
}
function e0(e, t) {
  Ls = Gi = !0;
  var n = e.pending;
  (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
    (e.pending = t));
}
function t0(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    ((r &= e.pendingLanes), (n |= r), (t.lanes = n), qd(e, n));
  }
}
var Ki = {
    readContext: wt,
    useCallback: Le,
    useContext: Le,
    useEffect: Le,
    useImperativeHandle: Le,
    useInsertionEffect: Le,
    useLayoutEffect: Le,
    useMemo: Le,
    useReducer: Le,
    useRef: Le,
    useState: Le,
    useDebugValue: Le,
    useDeferredValue: Le,
    useTransition: Le,
    useMutableSource: Le,
    useSyncExternalStore: Le,
    useId: Le,
    unstable_isNewReconciler: !1,
  },
  Oj = {
    readContext: wt,
    useCallback: function (e, t) {
      return ((Vt().memoizedState = [e, t === void 0 ? null : t]), e);
    },
    useContext: wt,
    useEffect: kp,
    useImperativeHandle: function (e, t, n) {
      return (
        (n = n != null ? n.concat([e]) : null),
        vi(4194308, 4, Gv.bind(null, t, e), n)
      );
    },
    useLayoutEffect: function (e, t) {
      return vi(4194308, 4, e, t);
    },
    useInsertionEffect: function (e, t) {
      return vi(4, 2, e, t);
    },
    useMemo: function (e, t) {
      var n = Vt();
      return (
        (t = t === void 0 ? null : t),
        (e = e()),
        (n.memoizedState = [e, t]),
        e
      );
    },
    useReducer: function (e, t, n) {
      var r = Vt();
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t,
        }),
        (r.queue = e),
        (e = e.dispatch = Mj.bind(null, ye, e)),
        [r.memoizedState, e]
      );
    },
    useRef: function (e) {
      var t = Vt();
      return ((e = { current: e }), (t.memoizedState = e));
    },
    useState: Ep,
    useDebugValue: wf,
    useDeferredValue: function (e) {
      return (Vt().memoizedState = e);
    },
    useTransition: function () {
      var e = Ep(!1),
        t = e[0];
      return ((e = Dj.bind(null, e[1])), (Vt().memoizedState = e), [t, e]);
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = ye,
        o = Vt();
      if (ve) {
        if (n === void 0) throw Error(O(407));
        n = n();
      } else {
        if (((n = t()), Re === null)) throw Error(O(349));
        Wr & 30 || $v(r, t, n);
      }
      o.memoizedState = n;
      var s = { value: n, getSnapshot: t };
      return (
        (o.queue = s),
        kp(Wv.bind(null, r, s, e), [e]),
        (r.flags |= 2048),
        oa(9, zv.bind(null, r, s, n, t), void 0, null),
        n
      );
    },
    useId: function () {
      var e = Vt(),
        t = Re.identifierPrefix;
      if (ve) {
        var n = yn,
          r = xn;
        ((n = (r & ~(1 << (32 - Lt(r) - 1))).toString(32) + n),
          (t = ':' + t + 'R' + n),
          (n = na++),
          0 < n && (t += 'H' + n.toString(32)),
          (t += ':'));
      } else ((n = Rj++), (t = ':' + t + 'r' + n.toString(32) + ':'));
      return (e.memoizedState = t);
    },
    unstable_isNewReconciler: !1,
  },
  _j = {
    readContext: wt,
    useCallback: Qv,
    useContext: wt,
    useEffect: yf,
    useImperativeHandle: Kv,
    useInsertionEffect: Vv,
    useLayoutEffect: Yv,
    useMemo: qv,
    useReducer: $c,
    useRef: Hv,
    useState: function () {
      return $c(ra);
    },
    useDebugValue: wf,
    useDeferredValue: function (e) {
      var t = bt();
      return Xv(t, ke.memoizedState, e);
    },
    useTransition: function () {
      var e = $c(ra)[0],
        t = bt().memoizedState;
      return [e, t];
    },
    useMutableSource: Lv,
    useSyncExternalStore: Fv,
    useId: Zv,
    unstable_isNewReconciler: !1,
  },
  Ij = {
    readContext: wt,
    useCallback: Qv,
    useContext: wt,
    useEffect: yf,
    useImperativeHandle: Kv,
    useInsertionEffect: Vv,
    useLayoutEffect: Yv,
    useMemo: qv,
    useReducer: zc,
    useRef: Hv,
    useState: function () {
      return zc(ra);
    },
    useDebugValue: wf,
    useDeferredValue: function (e) {
      var t = bt();
      return ke === null ? (t.memoizedState = e) : Xv(t, ke.memoizedState, e);
    },
    useTransition: function () {
      var e = zc(ra)[0],
        t = bt().memoizedState;
      return [e, t];
    },
    useMutableSource: Lv,
    useSyncExternalStore: Fv,
    useId: Zv,
    unstable_isNewReconciler: !1,
  };
function Rt(e, t) {
  if (e && e.defaultProps) {
    ((t = we({}, t)), (e = e.defaultProps));
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Uu(e, t, n, r) {
  ((t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : we({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n));
}
var kl = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? Kr(e) === e : !1;
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals;
    var r = Ye(),
      o = ar(e),
      s = Nn(r, o);
    ((s.payload = t),
      n != null && (s.callback = n),
      (t = or(e, s, o)),
      t !== null && (Ft(t, e, o, r), hi(t, e, o)));
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals;
    var r = Ye(),
      o = ar(e),
      s = Nn(r, o);
    ((s.tag = 1),
      (s.payload = t),
      n != null && (s.callback = n),
      (t = or(e, s, o)),
      t !== null && (Ft(t, e, o, r), hi(t, e, o)));
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals;
    var n = Ye(),
      r = ar(e),
      o = Nn(n, r);
    ((o.tag = 2),
      t != null && (o.callback = t),
      (t = or(e, o, r)),
      t !== null && (Ft(t, e, r, n), hi(t, e, r)));
  },
};
function Pp(e, t, n, r, o, s, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == 'function'
      ? e.shouldComponentUpdate(r, s, i)
      : t.prototype && t.prototype.isPureReactComponent
        ? !qs(n, r) || !qs(o, s)
        : !0
  );
}
function n0(e, t, n) {
  var r = !1,
    o = ur,
    s = t.contextType;
  return (
    typeof s == 'object' && s !== null
      ? (s = wt(s))
      : ((o = tt(t) ? $r : We.current),
        (r = t.contextTypes),
        (s = (r = r != null) ? Yo(e, o) : ur)),
    (t = new t(n, s)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = kl),
    (e.stateNode = t),
    (t._reactInternals = e),
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = o),
      (e.__reactInternalMemoizedMaskedChildContext = s)),
    t
  );
}
function Tp(e, t, n, r) {
  ((e = t.state),
    typeof t.componentWillReceiveProps == 'function' &&
      t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
      t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && kl.enqueueReplaceState(t, t.state, null));
}
function Bu(e, t, n, r) {
  var o = e.stateNode;
  ((o.props = n), (o.state = e.memoizedState), (o.refs = {}), ff(e));
  var s = t.contextType;
  (typeof s == 'object' && s !== null
    ? (o.context = wt(s))
    : ((s = tt(t) ? $r : We.current), (o.context = Yo(e, s))),
    (o.state = e.memoizedState),
    (s = t.getDerivedStateFromProps),
    typeof s == 'function' && (Uu(e, t, s, n), (o.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == 'function' ||
      typeof o.getSnapshotBeforeUpdate == 'function' ||
      (typeof o.UNSAFE_componentWillMount != 'function' &&
        typeof o.componentWillMount != 'function') ||
      ((t = o.state),
      typeof o.componentWillMount == 'function' && o.componentWillMount(),
      typeof o.UNSAFE_componentWillMount == 'function' &&
        o.UNSAFE_componentWillMount(),
      t !== o.state && kl.enqueueReplaceState(o, o.state, null),
      Vi(e, n, o, r),
      (o.state = e.memoizedState)),
    typeof o.componentDidMount == 'function' && (e.flags |= 4194308));
}
function qo(e, t) {
  try {
    var n = '',
      r = t;
    do ((n += uN(r)), (r = r.return));
    while (r);
    var o = n;
  } catch (s) {
    o =
      `
Error generating stack: ` +
      s.message +
      `
` +
      s.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function Wc(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Hu(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function () {
      throw n;
    });
  }
}
var Lj = typeof WeakMap == 'function' ? WeakMap : Map;
function r0(e, t, n) {
  ((n = Nn(-1, n)), (n.tag = 3), (n.payload = { element: null }));
  var r = t.value;
  return (
    (n.callback = function () {
      (qi || ((qi = !0), (ed = r)), Hu(e, t));
    }),
    n
  );
}
function o0(e, t, n) {
  ((n = Nn(-1, n)), (n.tag = 3));
  var r = e.type.getDerivedStateFromError;
  if (typeof r == 'function') {
    var o = t.value;
    ((n.payload = function () {
      return r(o);
    }),
      (n.callback = function () {
        Hu(e, t);
      }));
  }
  var s = e.stateNode;
  return (
    s !== null &&
      typeof s.componentDidCatch == 'function' &&
      (n.callback = function () {
        (Hu(e, t),
          typeof r != 'function' &&
            (sr === null ? (sr = new Set([this])) : sr.add(this)));
        var i = t.stack;
        this.componentDidCatch(t.value, {
          componentStack: i !== null ? i : '',
        });
      }),
    n
  );
}
function Rp(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new Lj();
    var o = new Set();
    r.set(t, o);
  } else ((o = r.get(t)), o === void 0 && ((o = new Set()), r.set(t, o)));
  o.has(n) || (o.add(n), (e = Xj.bind(null, e, t, n)), t.then(e, e));
}
function Dp(e) {
  do {
    var t;
    if (
      ((t = e.tag === 13) &&
        ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)),
      t)
    )
      return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Mp(e, t, n, r, o) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = o), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 &&
            (n.alternate === null
              ? (n.tag = 17)
              : ((t = Nn(-1, 1)), (t.tag = 2), or(n, t, 1))),
          (n.lanes |= 1)),
      e);
}
var Fj = Tn.ReactCurrentOwner,
  Je = !1;
function He(e, t, n, r) {
  t.child = e === null ? Av(t, null, n, r) : Ko(t, e.child, n, r);
}
function Ap(e, t, n, r, o) {
  n = n.render;
  var s = t.ref;
  return (
    To(t, o),
    (r = vf(e, t, n, r, s, o)),
    (n = xf()),
    e !== null && !Je
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~o),
        En(e, t, o))
      : (ve && n && of(t), (t.flags |= 1), He(e, t, r, o), t.child)
  );
}
function Op(e, t, n, r, o) {
  if (e === null) {
    var s = n.type;
    return typeof s == 'function' &&
      !Pf(s) &&
      s.defaultProps === void 0 &&
      n.compare === null &&
      n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = s), s0(e, t, s, r, o))
      : ((e = bi(n.type, null, r, t, t.mode, o)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e));
  }
  if (((s = e.child), !(e.lanes & o))) {
    var i = s.memoizedProps;
    if (
      ((n = n.compare), (n = n !== null ? n : qs), n(i, r) && e.ref === t.ref)
    )
      return En(e, t, o);
  }
  return (
    (t.flags |= 1),
    (e = ir(s, r)),
    (e.ref = t.ref),
    (e.return = t),
    (t.child = e)
  );
}
function s0(e, t, n, r, o) {
  if (e !== null) {
    var s = e.memoizedProps;
    if (qs(s, r) && e.ref === t.ref)
      if (((Je = !1), (t.pendingProps = r = s), (e.lanes & o) !== 0))
        e.flags & 131072 && (Je = !0);
      else return ((t.lanes = e.lanes), En(e, t, o));
  }
  return Vu(e, t, n, r, o);
}
function a0(e, t, n) {
  var r = t.pendingProps,
    o = r.children,
    s = e !== null ? e.memoizedState : null;
  if (r.mode === 'hidden')
    if (!(t.mode & 1))
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        ce(bo, ot),
        (ot |= n));
    else {
      if (!(n & 1073741824))
        return (
          (e = s !== null ? s.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = {
            baseLanes: e,
            cachePool: null,
            transitions: null,
          }),
          (t.updateQueue = null),
          ce(bo, ot),
          (ot |= e),
          null
        );
      ((t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        (r = s !== null ? s.baseLanes : n),
        ce(bo, ot),
        (ot |= r));
    }
  else
    (s !== null ? ((r = s.baseLanes | n), (t.memoizedState = null)) : (r = n),
      ce(bo, ot),
      (ot |= r));
  return (He(e, t, o, n), t.child);
}
function i0(e, t) {
  var n = t.ref;
  ((e === null && n !== null) || (e !== null && e.ref !== n)) &&
    ((t.flags |= 512), (t.flags |= 2097152));
}
function Vu(e, t, n, r, o) {
  var s = tt(n) ? $r : We.current;
  return (
    (s = Yo(t, s)),
    To(t, o),
    (n = vf(e, t, n, r, s, o)),
    (r = xf()),
    e !== null && !Je
      ? ((t.updateQueue = e.updateQueue),
        (t.flags &= -2053),
        (e.lanes &= ~o),
        En(e, t, o))
      : (ve && r && of(t), (t.flags |= 1), He(e, t, n, o), t.child)
  );
}
function _p(e, t, n, r, o) {
  if (tt(n)) {
    var s = !0;
    zi(t);
  } else s = !1;
  if ((To(t, o), t.stateNode === null))
    (xi(e, t), n0(t, n, r), Bu(t, n, r, o), (r = !0));
  else if (e === null) {
    var i = t.stateNode,
      l = t.memoizedProps;
    i.props = l;
    var c = i.context,
      u = n.contextType;
    typeof u == 'object' && u !== null
      ? (u = wt(u))
      : ((u = tt(n) ? $r : We.current), (u = Yo(t, u)));
    var f = n.getDerivedStateFromProps,
      m =
        typeof f == 'function' ||
        typeof i.getSnapshotBeforeUpdate == 'function';
    (m ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' &&
        typeof i.componentWillReceiveProps != 'function') ||
      ((l !== r || c !== u) && Tp(t, i, r, u)),
      (Bn = !1));
    var p = t.memoizedState;
    ((i.state = p),
      Vi(t, r, i, o),
      (c = t.memoizedState),
      l !== r || p !== c || et.current || Bn
        ? (typeof f == 'function' && (Uu(t, n, f, r), (c = t.memoizedState)),
          (l = Bn || Pp(t, n, l, r, p, c, u))
            ? (m ||
                (typeof i.UNSAFE_componentWillMount != 'function' &&
                  typeof i.componentWillMount != 'function') ||
                (typeof i.componentWillMount == 'function' &&
                  i.componentWillMount(),
                typeof i.UNSAFE_componentWillMount == 'function' &&
                  i.UNSAFE_componentWillMount()),
              typeof i.componentDidMount == 'function' && (t.flags |= 4194308))
            : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308),
              (t.memoizedProps = r),
              (t.memoizedState = c)),
          (i.props = r),
          (i.state = c),
          (i.context = u),
          (r = l))
        : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308),
          (r = !1)));
  } else {
    ((i = t.stateNode),
      _v(e, t),
      (l = t.memoizedProps),
      (u = t.type === t.elementType ? l : Rt(t.type, l)),
      (i.props = u),
      (m = t.pendingProps),
      (p = i.context),
      (c = n.contextType),
      typeof c == 'object' && c !== null
        ? (c = wt(c))
        : ((c = tt(n) ? $r : We.current), (c = Yo(t, c))));
    var h = n.getDerivedStateFromProps;
    ((f =
      typeof h == 'function' ||
      typeof i.getSnapshotBeforeUpdate == 'function') ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' &&
        typeof i.componentWillReceiveProps != 'function') ||
      ((l !== m || p !== c) && Tp(t, i, r, c)),
      (Bn = !1),
      (p = t.memoizedState),
      (i.state = p),
      Vi(t, r, i, o));
    var b = t.memoizedState;
    l !== m || p !== b || et.current || Bn
      ? (typeof h == 'function' && (Uu(t, n, h, r), (b = t.memoizedState)),
        (u = Bn || Pp(t, n, u, r, p, b, c) || !1)
          ? (f ||
              (typeof i.UNSAFE_componentWillUpdate != 'function' &&
                typeof i.componentWillUpdate != 'function') ||
              (typeof i.componentWillUpdate == 'function' &&
                i.componentWillUpdate(r, b, c),
              typeof i.UNSAFE_componentWillUpdate == 'function' &&
                i.UNSAFE_componentWillUpdate(r, b, c)),
            typeof i.componentDidUpdate == 'function' && (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
          : (typeof i.componentDidUpdate != 'function' ||
              (l === e.memoizedProps && p === e.memoizedState) ||
              (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != 'function' ||
              (l === e.memoizedProps && p === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = b)),
        (i.props = r),
        (i.state = b),
        (i.context = c),
        (r = u))
      : (typeof i.componentDidUpdate != 'function' ||
          (l === e.memoizedProps && p === e.memoizedState) ||
          (t.flags |= 4),
        typeof i.getSnapshotBeforeUpdate != 'function' ||
          (l === e.memoizedProps && p === e.memoizedState) ||
          (t.flags |= 1024),
        (r = !1));
  }
  return Yu(e, t, n, r, s, o);
}
function Yu(e, t, n, r, o, s) {
  i0(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return (o && wp(t, n, !1), En(e, t, s));
  ((r = t.stateNode), (Fj.current = t));
  var l =
    i && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
  return (
    (t.flags |= 1),
    e !== null && i
      ? ((t.child = Ko(t, e.child, null, s)), (t.child = Ko(t, null, l, s)))
      : He(e, t, l, s),
    (t.memoizedState = r.state),
    o && wp(t, n, !0),
    t.child
  );
}
function l0(e) {
  var t = e.stateNode;
  (t.pendingContext
    ? yp(e, t.pendingContext, t.pendingContext !== t.context)
    : t.context && yp(e, t.context, !1),
    mf(e, t.containerInfo));
}
function Ip(e, t, n, r, o) {
  return (Go(), af(o), (t.flags |= 256), He(e, t, n, r), t.child);
}
var Gu = { dehydrated: null, treeContext: null, retryLane: 0 };
function Ku(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function c0(e, t, n) {
  var r = t.pendingProps,
    o = xe.current,
    s = !1,
    i = (t.flags & 128) !== 0,
    l;
  if (
    ((l = i) ||
      (l = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0),
    l
      ? ((s = !0), (t.flags &= -129))
      : (e === null || e.memoizedState !== null) && (o |= 1),
    ce(xe, o & 1),
    e === null)
  )
    return (
      zu(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1
            ? e.data === '$!'
              ? (t.lanes = 8)
              : (t.lanes = 1073741824)
            : (t.lanes = 1),
          null)
        : ((i = r.children),
          (e = r.fallback),
          s
            ? ((r = t.mode),
              (s = t.child),
              (i = { mode: 'hidden', children: i }),
              !(r & 1) && s !== null
                ? ((s.childLanes = 0), (s.pendingProps = i))
                : (s = Rl(i, r, 0, null)),
              (e = Lr(e, r, n, null)),
              (s.return = t),
              (e.return = t),
              (s.sibling = e),
              (t.child = s),
              (t.child.memoizedState = Ku(n)),
              (t.memoizedState = Gu),
              e)
            : bf(t, i))
    );
  if (((o = e.memoizedState), o !== null && ((l = o.dehydrated), l !== null)))
    return $j(e, t, i, r, l, o, n);
  if (s) {
    ((s = r.fallback), (i = t.mode), (o = e.child), (l = o.sibling));
    var c = { mode: 'hidden', children: r.children };
    return (
      !(i & 1) && t.child !== o
        ? ((r = t.child),
          (r.childLanes = 0),
          (r.pendingProps = c),
          (t.deletions = null))
        : ((r = ir(o, c)), (r.subtreeFlags = o.subtreeFlags & 14680064)),
      l !== null ? (s = ir(l, s)) : ((s = Lr(s, i, n, null)), (s.flags |= 2)),
      (s.return = t),
      (r.return = t),
      (r.sibling = s),
      (t.child = r),
      (r = s),
      (s = t.child),
      (i = e.child.memoizedState),
      (i =
        i === null
          ? Ku(n)
          : {
              baseLanes: i.baseLanes | n,
              cachePool: null,
              transitions: i.transitions,
            }),
      (s.memoizedState = i),
      (s.childLanes = e.childLanes & ~n),
      (t.memoizedState = Gu),
      r
    );
  }
  return (
    (s = e.child),
    (e = s.sibling),
    (r = ir(s, { mode: 'visible', children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null &&
      ((n = t.deletions),
      n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  );
}
function bf(e, t) {
  return (
    (t = Rl({ mode: 'visible', children: t }, e.mode, 0, null)),
    (t.return = e),
    (e.child = t)
  );
}
function Ga(e, t, n, r) {
  return (
    r !== null && af(r),
    Ko(t, e.child, null, n),
    (e = bf(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  );
}
function $j(e, t, n, r, o, s, i) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = Wc(Error(O(422)))), Ga(e, t, i, r))
      : t.memoizedState !== null
        ? ((t.child = e.child), (t.flags |= 128), null)
        : ((s = r.fallback),
          (o = t.mode),
          (r = Rl({ mode: 'visible', children: r.children }, o, 0, null)),
          (s = Lr(s, o, i, null)),
          (s.flags |= 2),
          (r.return = t),
          (s.return = t),
          (r.sibling = s),
          (t.child = r),
          t.mode & 1 && Ko(t, e.child, null, i),
          (t.child.memoizedState = Ku(i)),
          (t.memoizedState = Gu),
          s);
  if (!(t.mode & 1)) return Ga(e, t, i, null);
  if (o.data === '$!') {
    if (((r = o.nextSibling && o.nextSibling.dataset), r)) var l = r.dgst;
    return (
      (r = l),
      (s = Error(O(419))),
      (r = Wc(s, r, void 0)),
      Ga(e, t, i, r)
    );
  }
  if (((l = (i & e.childLanes) !== 0), Je || l)) {
    if (((r = Re), r !== null)) {
      switch (i & -i) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      ((o = o & (r.suspendedLanes | i) ? 0 : o),
        o !== 0 &&
          o !== s.retryLane &&
          ((s.retryLane = o), Sn(e, o), Ft(r, e, o, -1)));
    }
    return (kf(), (r = Wc(Error(O(421)))), Ga(e, t, i, r));
  }
  return o.data === '$?'
    ? ((t.flags |= 128),
      (t.child = e.child),
      (t = Zj.bind(null, e)),
      (o._reactRetry = t),
      null)
    : ((e = s.treeContext),
      (at = rr(o.nextSibling)),
      (it = t),
      (ve = !0),
      (It = null),
      e !== null &&
        ((ht[gt++] = xn),
        (ht[gt++] = yn),
        (ht[gt++] = zr),
        (xn = e.id),
        (yn = e.overflow),
        (zr = t)),
      (t = bf(t, r.children)),
      (t.flags |= 4096),
      t);
}
function Lp(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  (r !== null && (r.lanes |= t), Wu(e.return, t, n));
}
function Uc(e, t, n, r, o) {
  var s = e.memoizedState;
  s === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: r,
        tail: n,
        tailMode: o,
      })
    : ((s.isBackwards = t),
      (s.rendering = null),
      (s.renderingStartTime = 0),
      (s.last = r),
      (s.tail = n),
      (s.tailMode = o));
}
function u0(e, t, n) {
  var r = t.pendingProps,
    o = r.revealOrder,
    s = r.tail;
  if ((He(e, t, r.children, n), (r = xe.current), r & 2))
    ((r = (r & 1) | 2), (t.flags |= 128));
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Lp(e, n, t);
        else if (e.tag === 19) Lp(e, n, t);
        else if (e.child !== null) {
          ((e.child.return = e), (e = e.child));
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    r &= 1;
  }
  if ((ce(xe, r), !(t.mode & 1))) t.memoizedState = null;
  else
    switch (o) {
      case 'forwards':
        for (n = t.child, o = null; n !== null; )
          ((e = n.alternate),
            e !== null && Yi(e) === null && (o = n),
            (n = n.sibling));
        ((n = o),
          n === null
            ? ((o = t.child), (t.child = null))
            : ((o = n.sibling), (n.sibling = null)),
          Uc(t, !1, o, n, s));
        break;
      case 'backwards':
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (((e = o.alternate), e !== null && Yi(e) === null)) {
            t.child = o;
            break;
          }
          ((e = o.sibling), (o.sibling = n), (n = o), (o = e));
        }
        Uc(t, !0, n, null, s);
        break;
      case 'together':
        Uc(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function xi(e, t) {
  !(t.mode & 1) &&
    e !== null &&
    ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function En(e, t, n) {
  if (
    (e !== null && (t.dependencies = e.dependencies),
    (Ur |= t.lanes),
    !(n & t.childLanes))
  )
    return null;
  if (e !== null && t.child !== e.child) throw Error(O(153));
  if (t.child !== null) {
    for (
      e = t.child, n = ir(e, e.pendingProps), t.child = n, n.return = t;
      e.sibling !== null;
    )
      ((e = e.sibling),
        (n = n.sibling = ir(e, e.pendingProps)),
        (n.return = t));
    n.sibling = null;
  }
  return t.child;
}
function zj(e, t, n) {
  switch (t.tag) {
    case 3:
      (l0(t), Go());
      break;
    case 5:
      Iv(t);
      break;
    case 1:
      tt(t.type) && zi(t);
      break;
    case 4:
      mf(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context,
        o = t.memoizedProps.value;
      (ce(Bi, r._currentValue), (r._currentValue = o));
      break;
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (ce(xe, xe.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
            ? c0(e, t, n)
            : (ce(xe, xe.current & 1),
              (e = En(e, t, n)),
              e !== null ? e.sibling : null);
      ce(xe, xe.current & 1);
      break;
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return u0(e, t, n);
        t.flags |= 128;
      }
      if (
        ((o = t.memoizedState),
        o !== null &&
          ((o.rendering = null), (o.tail = null), (o.lastEffect = null)),
        ce(xe, xe.current),
        r)
      )
        break;
      return null;
    case 22:
    case 23:
      return ((t.lanes = 0), a0(e, t, n));
  }
  return En(e, t, n);
}
var d0, Qu, f0, m0;
d0 = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      ((n.child.return = n), (n = n.child));
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    ((n.sibling.return = n.return), (n = n.sibling));
  }
};
Qu = function () {};
f0 = function (e, t, n, r) {
  var o = e.memoizedProps;
  if (o !== r) {
    ((e = t.stateNode), Tr(on.current));
    var s = null;
    switch (n) {
      case 'input':
        ((o = vu(e, o)), (r = vu(e, r)), (s = []));
        break;
      case 'select':
        ((o = we({}, o, { value: void 0 })),
          (r = we({}, r, { value: void 0 })),
          (s = []));
        break;
      case 'textarea':
        ((o = wu(e, o)), (r = wu(e, r)), (s = []));
        break;
      default:
        typeof o.onClick != 'function' &&
          typeof r.onClick == 'function' &&
          (e.onclick = Fi);
    }
    Nu(n, r);
    var i;
    n = null;
    for (u in o)
      if (!r.hasOwnProperty(u) && o.hasOwnProperty(u) && o[u] != null)
        if (u === 'style') {
          var l = o[u];
          for (i in l) l.hasOwnProperty(i) && (n || (n = {}), (n[i] = ''));
        } else
          u !== 'dangerouslySetInnerHTML' &&
            u !== 'children' &&
            u !== 'suppressContentEditableWarning' &&
            u !== 'suppressHydrationWarning' &&
            u !== 'autoFocus' &&
            (Bs.hasOwnProperty(u)
              ? s || (s = [])
              : (s = s || []).push(u, null));
    for (u in r) {
      var c = r[u];
      if (
        ((l = o != null ? o[u] : void 0),
        r.hasOwnProperty(u) && c !== l && (c != null || l != null))
      )
        if (u === 'style')
          if (l) {
            for (i in l)
              !l.hasOwnProperty(i) ||
                (c && c.hasOwnProperty(i)) ||
                (n || (n = {}), (n[i] = ''));
            for (i in c)
              c.hasOwnProperty(i) &&
                l[i] !== c[i] &&
                (n || (n = {}), (n[i] = c[i]));
          } else (n || (s || (s = []), s.push(u, n)), (n = c));
        else
          u === 'dangerouslySetInnerHTML'
            ? ((c = c ? c.__html : void 0),
              (l = l ? l.__html : void 0),
              c != null && l !== c && (s = s || []).push(u, c))
            : u === 'children'
              ? (typeof c != 'string' && typeof c != 'number') ||
                (s = s || []).push(u, '' + c)
              : u !== 'suppressContentEditableWarning' &&
                u !== 'suppressHydrationWarning' &&
                (Bs.hasOwnProperty(u)
                  ? (c != null && u === 'onScroll' && fe('scroll', e),
                    s || l === c || (s = []))
                  : (s = s || []).push(u, c));
    }
    n && (s = s || []).push('style', n);
    var u = s;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
m0 = function (e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function ws(e, t) {
  if (!ve)
    switch (e.tailMode) {
      case 'hidden':
        t = e.tail;
        for (var n = null; t !== null; )
          (t.alternate !== null && (n = t), (t = t.sibling));
        n === null ? (e.tail = null) : (n.sibling = null);
        break;
      case 'collapsed':
        n = e.tail;
        for (var r = null; n !== null; )
          (n.alternate !== null && (r = n), (n = n.sibling));
        r === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (r.sibling = null);
    }
}
function Fe(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0;
  if (t)
    for (var o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags & 14680064),
        (r |= o.flags & 14680064),
        (o.return = e),
        (o = o.sibling));
  else
    for (o = e.child; o !== null; )
      ((n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags),
        (r |= o.flags),
        (o.return = e),
        (o = o.sibling));
  return ((e.subtreeFlags |= r), (e.childLanes = n), t);
}
function Wj(e, t, n) {
  var r = t.pendingProps;
  switch ((sf(t), t.tag)) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return (Fe(t), null);
    case 1:
      return (tt(t.type) && $i(), Fe(t), null);
    case 3:
      return (
        (r = t.stateNode),
        Qo(),
        me(et),
        me(We),
        hf(),
        r.pendingContext &&
          ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (Va(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), It !== null && (rd(It), (It = null)))),
        Qu(e, t),
        Fe(t),
        null
      );
    case 5:
      pf(t);
      var o = Tr(ta.current);
      if (((n = t.type), e !== null && t.stateNode != null))
        (f0(e, t, n, r, o),
          e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152)));
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(O(166));
          return (Fe(t), null);
        }
        if (((e = Tr(on.current)), Va(t))) {
          ((r = t.stateNode), (n = t.type));
          var s = t.memoizedProps;
          switch (((r[Zt] = t), (r[Js] = s), (e = (t.mode & 1) !== 0), n)) {
            case 'dialog':
              (fe('cancel', r), fe('close', r));
              break;
            case 'iframe':
            case 'object':
            case 'embed':
              fe('load', r);
              break;
            case 'video':
            case 'audio':
              for (o = 0; o < Ps.length; o++) fe(Ps[o], r);
              break;
            case 'source':
              fe('error', r);
              break;
            case 'img':
            case 'image':
            case 'link':
              (fe('error', r), fe('load', r));
              break;
            case 'details':
              fe('toggle', r);
              break;
            case 'input':
              (Ym(r, s), fe('invalid', r));
              break;
            case 'select':
              ((r._wrapperState = { wasMultiple: !!s.multiple }),
                fe('invalid', r));
              break;
            case 'textarea':
              (Km(r, s), fe('invalid', r));
          }
          (Nu(n, s), (o = null));
          for (var i in s)
            if (s.hasOwnProperty(i)) {
              var l = s[i];
              i === 'children'
                ? typeof l == 'string'
                  ? r.textContent !== l &&
                    (s.suppressHydrationWarning !== !0 &&
                      Ha(r.textContent, l, e),
                    (o = ['children', l]))
                  : typeof l == 'number' &&
                    r.textContent !== '' + l &&
                    (s.suppressHydrationWarning !== !0 &&
                      Ha(r.textContent, l, e),
                    (o = ['children', '' + l]))
                : Bs.hasOwnProperty(i) &&
                  l != null &&
                  i === 'onScroll' &&
                  fe('scroll', r);
            }
          switch (n) {
            case 'input':
              (Ia(r), Gm(r, s, !0));
              break;
            case 'textarea':
              (Ia(r), Qm(r));
              break;
            case 'select':
            case 'option':
              break;
            default:
              typeof s.onClick == 'function' && (r.onclick = Fi);
          }
          ((r = o), (t.updateQueue = r), r !== null && (t.flags |= 4));
        } else {
          ((i = o.nodeType === 9 ? o : o.ownerDocument),
            e === 'http://www.w3.org/1999/xhtml' && (e = Wg(n)),
            e === 'http://www.w3.org/1999/xhtml'
              ? n === 'script'
                ? ((e = i.createElement('div')),
                  (e.innerHTML = '<script><\/script>'),
                  (e = e.removeChild(e.firstChild)))
                : typeof r.is == 'string'
                  ? (e = i.createElement(n, { is: r.is }))
                  : ((e = i.createElement(n)),
                    n === 'select' &&
                      ((i = e),
                      r.multiple
                        ? (i.multiple = !0)
                        : r.size && (i.size = r.size)))
              : (e = i.createElementNS(e, n)),
            (e[Zt] = t),
            (e[Js] = r),
            d0(e, t, !1, !1),
            (t.stateNode = e));
          e: {
            switch (((i = ju(n, r)), n)) {
              case 'dialog':
                (fe('cancel', e), fe('close', e), (o = r));
                break;
              case 'iframe':
              case 'object':
              case 'embed':
                (fe('load', e), (o = r));
                break;
              case 'video':
              case 'audio':
                for (o = 0; o < Ps.length; o++) fe(Ps[o], e);
                o = r;
                break;
              case 'source':
                (fe('error', e), (o = r));
                break;
              case 'img':
              case 'image':
              case 'link':
                (fe('error', e), fe('load', e), (o = r));
                break;
              case 'details':
                (fe('toggle', e), (o = r));
                break;
              case 'input':
                (Ym(e, r), (o = vu(e, r)), fe('invalid', e));
                break;
              case 'option':
                o = r;
                break;
              case 'select':
                ((e._wrapperState = { wasMultiple: !!r.multiple }),
                  (o = we({}, r, { value: void 0 })),
                  fe('invalid', e));
                break;
              case 'textarea':
                (Km(e, r), (o = wu(e, r)), fe('invalid', e));
                break;
              default:
                o = r;
            }
            (Nu(n, o), (l = o));
            for (s in l)
              if (l.hasOwnProperty(s)) {
                var c = l[s];
                s === 'style'
                  ? Hg(e, c)
                  : s === 'dangerouslySetInnerHTML'
                    ? ((c = c ? c.__html : void 0), c != null && Ug(e, c))
                    : s === 'children'
                      ? typeof c == 'string'
                        ? (n !== 'textarea' || c !== '') && Hs(e, c)
                        : typeof c == 'number' && Hs(e, '' + c)
                      : s !== 'suppressContentEditableWarning' &&
                        s !== 'suppressHydrationWarning' &&
                        s !== 'autoFocus' &&
                        (Bs.hasOwnProperty(s)
                          ? c != null && s === 'onScroll' && fe('scroll', e)
                          : c != null && Hd(e, s, c, i));
              }
            switch (n) {
              case 'input':
                (Ia(e), Gm(e, r, !1));
                break;
              case 'textarea':
                (Ia(e), Qm(e));
                break;
              case 'option':
                r.value != null && e.setAttribute('value', '' + cr(r.value));
                break;
              case 'select':
                ((e.multiple = !!r.multiple),
                  (s = r.value),
                  s != null
                    ? So(e, !!r.multiple, s, !1)
                    : r.defaultValue != null &&
                      So(e, !!r.multiple, r.defaultValue, !0));
                break;
              default:
                typeof o.onClick == 'function' && (e.onclick = Fi);
            }
            switch (n) {
              case 'button':
              case 'input':
              case 'select':
              case 'textarea':
                r = !!r.autoFocus;
                break e;
              case 'img':
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
      }
      return (Fe(t), null);
    case 6:
      if (e && t.stateNode != null) m0(e, t, e.memoizedProps, r);
      else {
        if (typeof r != 'string' && t.stateNode === null) throw Error(O(166));
        if (((n = Tr(ta.current)), Tr(on.current), Va(t))) {
          if (
            ((r = t.stateNode),
            (n = t.memoizedProps),
            (r[Zt] = t),
            (s = r.nodeValue !== n) && ((e = it), e !== null))
          )
            switch (e.tag) {
              case 3:
                Ha(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 &&
                  Ha(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          s && (t.flags |= 4);
        } else
          ((r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)),
            (r[Zt] = t),
            (t.stateNode = r));
      }
      return (Fe(t), null);
    case 13:
      if (
        (me(xe),
        (r = t.memoizedState),
        e === null ||
          (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (ve && at !== null && t.mode & 1 && !(t.flags & 128))
          (Dv(), Go(), (t.flags |= 98560), (s = !1));
        else if (((s = Va(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!s) throw Error(O(318));
            if (
              ((s = t.memoizedState),
              (s = s !== null ? s.dehydrated : null),
              !s)
            )
              throw Error(O(317));
            s[Zt] = t;
          } else
            (Go(),
              !(t.flags & 128) && (t.memoizedState = null),
              (t.flags |= 4));
          (Fe(t), (s = !1));
        } else (It !== null && (rd(It), (It = null)), (s = !0));
        if (!s) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192),
            t.mode & 1 &&
              (e === null || xe.current & 1 ? Pe === 0 && (Pe = 3) : kf())),
          t.updateQueue !== null && (t.flags |= 4),
          Fe(t),
          null);
    case 4:
      return (
        Qo(),
        Qu(e, t),
        e === null && Xs(t.stateNode.containerInfo),
        Fe(t),
        null
      );
    case 10:
      return (uf(t.type._context), Fe(t), null);
    case 17:
      return (tt(t.type) && $i(), Fe(t), null);
    case 19:
      if ((me(xe), (s = t.memoizedState), s === null)) return (Fe(t), null);
      if (((r = (t.flags & 128) !== 0), (i = s.rendering), i === null))
        if (r) ws(s, !1);
        else {
          if (Pe !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((i = Yi(e)), i !== null)) {
                for (
                  t.flags |= 128,
                    ws(s, !1),
                    r = i.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;
                )
                  ((s = n),
                    (e = r),
                    (s.flags &= 14680066),
                    (i = s.alternate),
                    i === null
                      ? ((s.childLanes = 0),
                        (s.lanes = e),
                        (s.child = null),
                        (s.subtreeFlags = 0),
                        (s.memoizedProps = null),
                        (s.memoizedState = null),
                        (s.updateQueue = null),
                        (s.dependencies = null),
                        (s.stateNode = null))
                      : ((s.childLanes = i.childLanes),
                        (s.lanes = i.lanes),
                        (s.child = i.child),
                        (s.subtreeFlags = 0),
                        (s.deletions = null),
                        (s.memoizedProps = i.memoizedProps),
                        (s.memoizedState = i.memoizedState),
                        (s.updateQueue = i.updateQueue),
                        (s.type = i.type),
                        (e = i.dependencies),
                        (s.dependencies =
                          e === null
                            ? null
                            : {
                                lanes: e.lanes,
                                firstContext: e.firstContext,
                              })),
                    (n = n.sibling));
                return (ce(xe, (xe.current & 1) | 2), t.child);
              }
              e = e.sibling;
            }
          s.tail !== null &&
            Se() > Xo &&
            ((t.flags |= 128), (r = !0), ws(s, !1), (t.lanes = 4194304));
        }
      else {
        if (!r)
          if (((e = Yi(i)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              ws(s, !0),
              s.tail === null && s.tailMode === 'hidden' && !i.alternate && !ve)
            )
              return (Fe(t), null);
          } else
            2 * Se() - s.renderingStartTime > Xo &&
              n !== 1073741824 &&
              ((t.flags |= 128), (r = !0), ws(s, !1), (t.lanes = 4194304));
        s.isBackwards
          ? ((i.sibling = t.child), (t.child = i))
          : ((n = s.last),
            n !== null ? (n.sibling = i) : (t.child = i),
            (s.last = i));
      }
      return s.tail !== null
        ? ((t = s.tail),
          (s.rendering = t),
          (s.tail = t.sibling),
          (s.renderingStartTime = Se()),
          (t.sibling = null),
          (n = xe.current),
          ce(xe, r ? (n & 1) | 2 : n & 1),
          t)
        : (Fe(t), null);
    case 22:
    case 23:
      return (
        Ef(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1
          ? ot & 1073741824 && (Fe(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : Fe(t),
        null
      );
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(O(156, t.tag));
}
function Uj(e, t) {
  switch ((sf(t), t.tag)) {
    case 1:
      return (
        tt(t.type) && $i(),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 3:
      return (
        Qo(),
        me(et),
        me(We),
        hf(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 5:
      return (pf(t), null);
    case 13:
      if (
        (me(xe), (e = t.memoizedState), e !== null && e.dehydrated !== null)
      ) {
        if (t.alternate === null) throw Error(O(340));
        Go();
      }
      return (
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 19:
      return (me(xe), null);
    case 4:
      return (Qo(), null);
    case 10:
      return (uf(t.type._context), null);
    case 22:
    case 23:
      return (Ef(), null);
    case 24:
      return null;
    default:
      return null;
  }
}
var Ka = !1,
  ze = !1,
  Bj = typeof WeakSet == 'function' ? WeakSet : Set,
  F = null;
function wo(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == 'function')
      try {
        n(null);
      } catch (r) {
        Ne(e, t, r);
      }
    else n.current = null;
}
function qu(e, t, n) {
  try {
    n();
  } catch (r) {
    Ne(e, t, r);
  }
}
var Fp = !1;
function Hj(e, t) {
  if (((Au = _i), (e = xv()), rf(e))) {
    if ('selectionStart' in e)
      var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var o = r.anchorOffset,
            s = r.focusNode;
          r = r.focusOffset;
          try {
            (n.nodeType, s.nodeType);
          } catch {
            n = null;
            break e;
          }
          var i = 0,
            l = -1,
            c = -1,
            u = 0,
            f = 0,
            m = e,
            p = null;
          t: for (;;) {
            for (
              var h;
              m !== n || (o !== 0 && m.nodeType !== 3) || (l = i + o),
                m !== s || (r !== 0 && m.nodeType !== 3) || (c = i + r),
                m.nodeType === 3 && (i += m.nodeValue.length),
                (h = m.firstChild) !== null;
            )
              ((p = m), (m = h));
            for (;;) {
              if (m === e) break t;
              if (
                (p === n && ++u === o && (l = i),
                p === s && ++f === r && (c = i),
                (h = m.nextSibling) !== null)
              )
                break;
              ((m = p), (p = m.parentNode));
            }
            m = h;
          }
          n = l === -1 || c === -1 ? null : { start: l, end: c };
        } else n = null;
      }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (Ou = { focusedElem: e, selectionRange: n }, _i = !1, F = t; F !== null; )
    if (((t = F), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      ((e.return = t), (F = e));
    else
      for (; F !== null; ) {
        t = F;
        try {
          var b = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (b !== null) {
                  var v = b.memoizedProps,
                    w = b.memoizedState,
                    x = t.stateNode,
                    g = x.getSnapshotBeforeUpdate(
                      t.elementType === t.type ? v : Rt(t.type, v),
                      w
                    );
                  x.__reactInternalSnapshotBeforeUpdate = g;
                }
                break;
              case 3:
                var y = t.stateNode.containerInfo;
                y.nodeType === 1
                  ? (y.textContent = '')
                  : y.nodeType === 9 &&
                    y.documentElement &&
                    y.removeChild(y.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(O(163));
            }
        } catch (N) {
          Ne(t, t.return, N);
        }
        if (((e = t.sibling), e !== null)) {
          ((e.return = t.return), (F = e));
          break;
        }
        F = t.return;
      }
  return ((b = Fp), (Fp = !1), b);
}
function Fs(e, t, n) {
  var r = t.updateQueue;
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var o = (r = r.next);
    do {
      if ((o.tag & e) === e) {
        var s = o.destroy;
        ((o.destroy = void 0), s !== void 0 && qu(t, n, s));
      }
      o = o.next;
    } while (o !== r);
  }
}
function Pl(e, t) {
  if (
    ((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)
  ) {
    var n = (t = t.next);
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Xu(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == 'function' ? t(e) : (t.current = e);
  }
}
function p0(e) {
  var t = e.alternate;
  (t !== null && ((e.alternate = null), p0(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 &&
      ((t = e.stateNode),
      t !== null &&
        (delete t[Zt], delete t[Js], delete t[Lu], delete t[Ej], delete t[kj])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null));
}
function h0(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function $p(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || h0(e.return)) return null;
      e = e.return;
    }
    for (
      e.sibling.return = e.return, e = e.sibling;
      e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
    ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      ((e.child.return = e), (e = e.child));
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Zu(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8
            ? ((t = n.parentNode), t.insertBefore(e, n))
            : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = Fi)));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Zu(e, t, n), e = e.sibling; e !== null; )
      (Zu(e, t, n), (e = e.sibling));
}
function Ju(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Ju(e, t, n), e = e.sibling; e !== null; )
      (Ju(e, t, n), (e = e.sibling));
}
var De = null,
  Ot = !1;
function On(e, t, n) {
  for (n = n.child; n !== null; ) (g0(e, t, n), (n = n.sibling));
}
function g0(e, t, n) {
  if (rn && typeof rn.onCommitFiberUnmount == 'function')
    try {
      rn.onCommitFiberUnmount(wl, n);
    } catch {}
  switch (n.tag) {
    case 5:
      ze || wo(n, t);
    case 6:
      var r = De,
        o = Ot;
      ((De = null),
        On(e, t, n),
        (De = r),
        (Ot = o),
        De !== null &&
          (Ot
            ? ((e = De),
              (n = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : De.removeChild(n.stateNode)));
      break;
    case 18:
      De !== null &&
        (Ot
          ? ((e = De),
            (n = n.stateNode),
            e.nodeType === 8
              ? _c(e.parentNode, n)
              : e.nodeType === 1 && _c(e, n),
            Ks(e))
          : _c(De, n.stateNode));
      break;
    case 4:
      ((r = De),
        (o = Ot),
        (De = n.stateNode.containerInfo),
        (Ot = !0),
        On(e, t, n),
        (De = r),
        (Ot = o));
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (
        !ze &&
        ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))
      ) {
        o = r = r.next;
        do {
          var s = o,
            i = s.destroy;
          ((s = s.tag),
            i !== void 0 && (s & 2 || s & 4) && qu(n, t, i),
            (o = o.next));
        } while (o !== r);
      }
      On(e, t, n);
      break;
    case 1:
      if (
        !ze &&
        (wo(n, t),
        (r = n.stateNode),
        typeof r.componentWillUnmount == 'function')
      )
        try {
          ((r.props = n.memoizedProps),
            (r.state = n.memoizedState),
            r.componentWillUnmount());
        } catch (l) {
          Ne(n, t, l);
        }
      On(e, t, n);
      break;
    case 21:
      On(e, t, n);
      break;
    case 22:
      n.mode & 1
        ? ((ze = (r = ze) || n.memoizedState !== null), On(e, t, n), (ze = r))
        : On(e, t, n);
      break;
    default:
      On(e, t, n);
  }
}
function zp(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    (n === null && (n = e.stateNode = new Bj()),
      t.forEach(function (r) {
        var o = Jj.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(o, o));
      }));
  }
}
function Pt(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r];
      try {
        var s = e,
          i = t,
          l = i;
        e: for (; l !== null; ) {
          switch (l.tag) {
            case 5:
              ((De = l.stateNode), (Ot = !1));
              break e;
            case 3:
              ((De = l.stateNode.containerInfo), (Ot = !0));
              break e;
            case 4:
              ((De = l.stateNode.containerInfo), (Ot = !0));
              break e;
          }
          l = l.return;
        }
        if (De === null) throw Error(O(160));
        (g0(s, i, o), (De = null), (Ot = !1));
        var c = o.alternate;
        (c !== null && (c.return = null), (o.return = null));
      } catch (u) {
        Ne(o, t, u);
      }
    }
  if (t.subtreeFlags & 12854)
    for (t = t.child; t !== null; ) (v0(t, e), (t = t.sibling));
}
function v0(e, t) {
  var n = e.alternate,
    r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((Pt(t, e), Ht(e), r & 4)) {
        try {
          (Fs(3, e, e.return), Pl(3, e));
        } catch (v) {
          Ne(e, e.return, v);
        }
        try {
          Fs(5, e, e.return);
        } catch (v) {
          Ne(e, e.return, v);
        }
      }
      break;
    case 1:
      (Pt(t, e), Ht(e), r & 512 && n !== null && wo(n, n.return));
      break;
    case 5:
      if (
        (Pt(t, e),
        Ht(e),
        r & 512 && n !== null && wo(n, n.return),
        e.flags & 32)
      ) {
        var o = e.stateNode;
        try {
          Hs(o, '');
        } catch (v) {
          Ne(e, e.return, v);
        }
      }
      if (r & 4 && ((o = e.stateNode), o != null)) {
        var s = e.memoizedProps,
          i = n !== null ? n.memoizedProps : s,
          l = e.type,
          c = e.updateQueue;
        if (((e.updateQueue = null), c !== null))
          try {
            (l === 'input' && s.type === 'radio' && s.name != null && $g(o, s),
              ju(l, i));
            var u = ju(l, s);
            for (i = 0; i < c.length; i += 2) {
              var f = c[i],
                m = c[i + 1];
              f === 'style'
                ? Hg(o, m)
                : f === 'dangerouslySetInnerHTML'
                  ? Ug(o, m)
                  : f === 'children'
                    ? Hs(o, m)
                    : Hd(o, f, m, u);
            }
            switch (l) {
              case 'input':
                xu(o, s);
                break;
              case 'textarea':
                zg(o, s);
                break;
              case 'select':
                var p = o._wrapperState.wasMultiple;
                o._wrapperState.wasMultiple = !!s.multiple;
                var h = s.value;
                h != null
                  ? So(o, !!s.multiple, h, !1)
                  : p !== !!s.multiple &&
                    (s.defaultValue != null
                      ? So(o, !!s.multiple, s.defaultValue, !0)
                      : So(o, !!s.multiple, s.multiple ? [] : '', !1));
            }
            o[Js] = s;
          } catch (v) {
            Ne(e, e.return, v);
          }
      }
      break;
    case 6:
      if ((Pt(t, e), Ht(e), r & 4)) {
        if (e.stateNode === null) throw Error(O(162));
        ((o = e.stateNode), (s = e.memoizedProps));
        try {
          o.nodeValue = s;
        } catch (v) {
          Ne(e, e.return, v);
        }
      }
      break;
    case 3:
      if (
        (Pt(t, e), Ht(e), r & 4 && n !== null && n.memoizedState.isDehydrated)
      )
        try {
          Ks(t.containerInfo);
        } catch (v) {
          Ne(e, e.return, v);
        }
      break;
    case 4:
      (Pt(t, e), Ht(e));
      break;
    case 13:
      (Pt(t, e),
        Ht(e),
        (o = e.child),
        o.flags & 8192 &&
          ((s = o.memoizedState !== null),
          (o.stateNode.isHidden = s),
          !s ||
            (o.alternate !== null && o.alternate.memoizedState !== null) ||
            (Cf = Se())),
        r & 4 && zp(e));
      break;
    case 22:
      if (
        ((f = n !== null && n.memoizedState !== null),
        e.mode & 1 ? ((ze = (u = ze) || f), Pt(t, e), (ze = u)) : Pt(t, e),
        Ht(e),
        r & 8192)
      ) {
        if (
          ((u = e.memoizedState !== null),
          (e.stateNode.isHidden = u) && !f && e.mode & 1)
        )
          for (F = e, f = e.child; f !== null; ) {
            for (m = F = f; F !== null; ) {
              switch (((p = F), (h = p.child), p.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  Fs(4, p, p.return);
                  break;
                case 1:
                  wo(p, p.return);
                  var b = p.stateNode;
                  if (typeof b.componentWillUnmount == 'function') {
                    ((r = p), (n = p.return));
                    try {
                      ((t = r),
                        (b.props = t.memoizedProps),
                        (b.state = t.memoizedState),
                        b.componentWillUnmount());
                    } catch (v) {
                      Ne(r, n, v);
                    }
                  }
                  break;
                case 5:
                  wo(p, p.return);
                  break;
                case 22:
                  if (p.memoizedState !== null) {
                    Up(m);
                    continue;
                  }
              }
              h !== null ? ((h.return = p), (F = h)) : Up(m);
            }
            f = f.sibling;
          }
        e: for (f = null, m = e; ; ) {
          if (m.tag === 5) {
            if (f === null) {
              f = m;
              try {
                ((o = m.stateNode),
                  u
                    ? ((s = o.style),
                      typeof s.setProperty == 'function'
                        ? s.setProperty('display', 'none', 'important')
                        : (s.display = 'none'))
                    : ((l = m.stateNode),
                      (c = m.memoizedProps.style),
                      (i =
                        c != null && c.hasOwnProperty('display')
                          ? c.display
                          : null),
                      (l.style.display = Bg('display', i))));
              } catch (v) {
                Ne(e, e.return, v);
              }
            }
          } else if (m.tag === 6) {
            if (f === null)
              try {
                m.stateNode.nodeValue = u ? '' : m.memoizedProps;
              } catch (v) {
                Ne(e, e.return, v);
              }
          } else if (
            ((m.tag !== 22 && m.tag !== 23) ||
              m.memoizedState === null ||
              m === e) &&
            m.child !== null
          ) {
            ((m.child.return = m), (m = m.child));
            continue;
          }
          if (m === e) break e;
          for (; m.sibling === null; ) {
            if (m.return === null || m.return === e) break e;
            (f === m && (f = null), (m = m.return));
          }
          (f === m && (f = null),
            (m.sibling.return = m.return),
            (m = m.sibling));
        }
      }
      break;
    case 19:
      (Pt(t, e), Ht(e), r & 4 && zp(e));
      break;
    case 21:
      break;
    default:
      (Pt(t, e), Ht(e));
  }
}
function Ht(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (h0(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(O(160));
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode;
          r.flags & 32 && (Hs(o, ''), (r.flags &= -33));
          var s = $p(e);
          Ju(e, s, o);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo,
            l = $p(e);
          Zu(e, l, i);
          break;
        default:
          throw Error(O(161));
      }
    } catch (c) {
      Ne(e, e.return, c);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function Vj(e, t, n) {
  ((F = e), x0(e));
}
function x0(e, t, n) {
  for (var r = (e.mode & 1) !== 0; F !== null; ) {
    var o = F,
      s = o.child;
    if (o.tag === 22 && r) {
      var i = o.memoizedState !== null || Ka;
      if (!i) {
        var l = o.alternate,
          c = (l !== null && l.memoizedState !== null) || ze;
        l = Ka;
        var u = ze;
        if (((Ka = i), (ze = c) && !u))
          for (F = o; F !== null; )
            ((i = F),
              (c = i.child),
              i.tag === 22 && i.memoizedState !== null
                ? Bp(o)
                : c !== null
                  ? ((c.return = i), (F = c))
                  : Bp(o));
        for (; s !== null; ) ((F = s), x0(s), (s = s.sibling));
        ((F = o), (Ka = l), (ze = u));
      }
      Wp(e);
    } else
      o.subtreeFlags & 8772 && s !== null ? ((s.return = o), (F = s)) : Wp(e);
  }
}
function Wp(e) {
  for (; F !== null; ) {
    var t = F;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              ze || Pl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !ze)
                if (n === null) r.componentDidMount();
                else {
                  var o =
                    t.elementType === t.type
                      ? n.memoizedProps
                      : Rt(t.type, n.memoizedProps);
                  r.componentDidUpdate(
                    o,
                    n.memoizedState,
                    r.__reactInternalSnapshotBeforeUpdate
                  );
                }
              var s = t.updateQueue;
              s !== null && Sp(t, s, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                Sp(t, i, n);
              }
              break;
            case 5:
              var l = t.stateNode;
              if (n === null && t.flags & 4) {
                n = l;
                var c = t.memoizedProps;
                switch (t.type) {
                  case 'button':
                  case 'input':
                  case 'select':
                  case 'textarea':
                    c.autoFocus && n.focus();
                    break;
                  case 'img':
                    c.src && (n.src = c.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var u = t.alternate;
                if (u !== null) {
                  var f = u.memoizedState;
                  if (f !== null) {
                    var m = f.dehydrated;
                    m !== null && Ks(m);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(O(163));
          }
        ze || (t.flags & 512 && Xu(t));
      } catch (p) {
        Ne(t, t.return, p);
      }
    }
    if (t === e) {
      F = null;
      break;
    }
    if (((n = t.sibling), n !== null)) {
      ((n.return = t.return), (F = n));
      break;
    }
    F = t.return;
  }
}
function Up(e) {
  for (; F !== null; ) {
    var t = F;
    if (t === e) {
      F = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      ((n.return = t.return), (F = n));
      break;
    }
    F = t.return;
  }
}
function Bp(e) {
  for (; F !== null; ) {
    var t = F;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Pl(4, t);
          } catch (c) {
            Ne(t, n, c);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == 'function') {
            var o = t.return;
            try {
              r.componentDidMount();
            } catch (c) {
              Ne(t, o, c);
            }
          }
          var s = t.return;
          try {
            Xu(t);
          } catch (c) {
            Ne(t, s, c);
          }
          break;
        case 5:
          var i = t.return;
          try {
            Xu(t);
          } catch (c) {
            Ne(t, i, c);
          }
      }
    } catch (c) {
      Ne(t, t.return, c);
    }
    if (t === e) {
      F = null;
      break;
    }
    var l = t.sibling;
    if (l !== null) {
      ((l.return = t.return), (F = l));
      break;
    }
    F = t.return;
  }
}
var Yj = Math.ceil,
  Qi = Tn.ReactCurrentDispatcher,
  Nf = Tn.ReactCurrentOwner,
  xt = Tn.ReactCurrentBatchConfig,
  re = 0,
  Re = null,
  Ee = null,
  Me = 0,
  ot = 0,
  bo = hr(0),
  Pe = 0,
  sa = null,
  Ur = 0,
  Tl = 0,
  jf = 0,
  $s = null,
  Ze = null,
  Cf = 0,
  Xo = 1 / 0,
  pn = null,
  qi = !1,
  ed = null,
  sr = null,
  Qa = !1,
  Zn = null,
  Xi = 0,
  zs = 0,
  td = null,
  yi = -1,
  wi = 0;
function Ye() {
  return re & 6 ? Se() : yi !== -1 ? yi : (yi = Se());
}
function ar(e) {
  return e.mode & 1
    ? re & 2 && Me !== 0
      ? Me & -Me
      : Tj.transition !== null
        ? (wi === 0 && (wi = nv()), wi)
        : ((e = ie),
          e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : cv(e.type))),
          e)
    : 1;
}
function Ft(e, t, n, r) {
  if (50 < zs) throw ((zs = 0), (td = null), Error(O(185)));
  (ya(e, n, r),
    (!(re & 2) || e !== Re) &&
      (e === Re && (!(re & 2) && (Tl |= n), Pe === 4 && Vn(e, Me)),
      nt(e, r),
      n === 1 && re === 0 && !(t.mode & 1) && ((Xo = Se() + 500), Sl && gr())));
}
function nt(e, t) {
  var n = e.callbackNode;
  TN(e, t);
  var r = Oi(e, e === Re ? Me : 0);
  if (r === 0)
    (n !== null && Zm(n), (e.callbackNode = null), (e.callbackPriority = 0));
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && Zm(n), t === 1))
      (e.tag === 0 ? Pj(Hp.bind(null, e)) : Pv(Hp.bind(null, e)),
        Cj(function () {
          !(re & 6) && gr();
        }),
        (n = null));
    else {
      switch (rv(r)) {
        case 1:
          n = Qd;
          break;
        case 4:
          n = ev;
          break;
        case 16:
          n = Ai;
          break;
        case 536870912:
          n = tv;
          break;
        default:
          n = Ai;
      }
      n = E0(n, y0.bind(null, e));
    }
    ((e.callbackPriority = t), (e.callbackNode = n));
  }
}
function y0(e, t) {
  if (((yi = -1), (wi = 0), re & 6)) throw Error(O(327));
  var n = e.callbackNode;
  if (Ro() && e.callbackNode !== n) return null;
  var r = Oi(e, e === Re ? Me : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = Zi(e, r);
  else {
    t = r;
    var o = re;
    re |= 2;
    var s = b0();
    (Re !== e || Me !== t) && ((pn = null), (Xo = Se() + 500), Ir(e, t));
    do
      try {
        Qj();
        break;
      } catch (l) {
        w0(e, l);
      }
    while (!0);
    (cf(),
      (Qi.current = s),
      (re = o),
      Ee !== null ? (t = 0) : ((Re = null), (Me = 0), (t = Pe)));
  }
  if (t !== 0) {
    if (
      (t === 2 && ((o = Pu(e)), o !== 0 && ((r = o), (t = nd(e, o)))), t === 1)
    )
      throw ((n = sa), Ir(e, 0), Vn(e, r), nt(e, Se()), n);
    if (t === 6) Vn(e, r);
    else {
      if (
        ((o = e.current.alternate),
        !(r & 30) &&
          !Gj(o) &&
          ((t = Zi(e, r)),
          t === 2 && ((s = Pu(e)), s !== 0 && ((r = s), (t = nd(e, s)))),
          t === 1))
      )
        throw ((n = sa), Ir(e, 0), Vn(e, r), nt(e, Se()), n);
      switch (((e.finishedWork = o), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(O(345));
        case 2:
          Sr(e, Ze, pn);
          break;
        case 3:
          if (
            (Vn(e, r), (r & 130023424) === r && ((t = Cf + 500 - Se()), 10 < t))
          ) {
            if (Oi(e, 0) !== 0) break;
            if (((o = e.suspendedLanes), (o & r) !== r)) {
              (Ye(), (e.pingedLanes |= e.suspendedLanes & o));
              break;
            }
            e.timeoutHandle = Iu(Sr.bind(null, e, Ze, pn), t);
            break;
          }
          Sr(e, Ze, pn);
          break;
        case 4:
          if ((Vn(e, r), (r & 4194240) === r)) break;
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var i = 31 - Lt(r);
            ((s = 1 << i), (i = t[i]), i > o && (o = i), (r &= ~s));
          }
          if (
            ((r = o),
            (r = Se() - r),
            (r =
              (120 > r
                ? 120
                : 480 > r
                  ? 480
                  : 1080 > r
                    ? 1080
                    : 1920 > r
                      ? 1920
                      : 3e3 > r
                        ? 3e3
                        : 4320 > r
                          ? 4320
                          : 1960 * Yj(r / 1960)) - r),
            10 < r)
          ) {
            e.timeoutHandle = Iu(Sr.bind(null, e, Ze, pn), r);
            break;
          }
          Sr(e, Ze, pn);
          break;
        case 5:
          Sr(e, Ze, pn);
          break;
        default:
          throw Error(O(329));
      }
    }
  }
  return (nt(e, Se()), e.callbackNode === n ? y0.bind(null, e) : null);
}
function nd(e, t) {
  var n = $s;
  return (
    e.current.memoizedState.isDehydrated && (Ir(e, t).flags |= 256),
    (e = Zi(e, t)),
    e !== 2 && ((t = Ze), (Ze = n), t !== null && rd(t)),
    e
  );
}
function rd(e) {
  Ze === null ? (Ze = e) : Ze.push.apply(Ze, e);
}
function Gj(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r],
            s = o.getSnapshot;
          o = o.value;
          try {
            if (!$t(s(), o)) return !1;
          } catch {
            return !1;
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
      ((n.return = t), (t = n));
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      ((t.sibling.return = t.return), (t = t.sibling));
    }
  }
  return !0;
}
function Vn(e, t) {
  for (
    t &= ~jf,
      t &= ~Tl,
      e.suspendedLanes |= t,
      e.pingedLanes &= ~t,
      e = e.expirationTimes;
    0 < t;
  ) {
    var n = 31 - Lt(t),
      r = 1 << n;
    ((e[n] = -1), (t &= ~r));
  }
}
function Hp(e) {
  if (re & 6) throw Error(O(327));
  Ro();
  var t = Oi(e, 0);
  if (!(t & 1)) return (nt(e, Se()), null);
  var n = Zi(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = Pu(e);
    r !== 0 && ((t = r), (n = nd(e, r)));
  }
  if (n === 1) throw ((n = sa), Ir(e, 0), Vn(e, t), nt(e, Se()), n);
  if (n === 6) throw Error(O(345));
  return (
    (e.finishedWork = e.current.alternate),
    (e.finishedLanes = t),
    Sr(e, Ze, pn),
    nt(e, Se()),
    null
  );
}
function Sf(e, t) {
  var n = re;
  re |= 1;
  try {
    return e(t);
  } finally {
    ((re = n), re === 0 && ((Xo = Se() + 500), Sl && gr()));
  }
}
function Br(e) {
  Zn !== null && Zn.tag === 0 && !(re & 6) && Ro();
  var t = re;
  re |= 1;
  var n = xt.transition,
    r = ie;
  try {
    if (((xt.transition = null), (ie = 1), e)) return e();
  } finally {
    ((ie = r), (xt.transition = n), (re = t), !(re & 6) && gr());
  }
}
function Ef() {
  ((ot = bo.current), me(bo));
}
function Ir(e, t) {
  ((e.finishedWork = null), (e.finishedLanes = 0));
  var n = e.timeoutHandle;
  if ((n !== -1 && ((e.timeoutHandle = -1), jj(n)), Ee !== null))
    for (n = Ee.return; n !== null; ) {
      var r = n;
      switch ((sf(r), r.tag)) {
        case 1:
          ((r = r.type.childContextTypes), r != null && $i());
          break;
        case 3:
          (Qo(), me(et), me(We), hf());
          break;
        case 5:
          pf(r);
          break;
        case 4:
          Qo();
          break;
        case 13:
          me(xe);
          break;
        case 19:
          me(xe);
          break;
        case 10:
          uf(r.type._context);
          break;
        case 22:
        case 23:
          Ef();
      }
      n = n.return;
    }
  if (
    ((Re = e),
    (Ee = e = ir(e.current, null)),
    (Me = ot = t),
    (Pe = 0),
    (sa = null),
    (jf = Tl = Ur = 0),
    (Ze = $s = null),
    Pr !== null)
  ) {
    for (t = 0; t < Pr.length; t++)
      if (((n = Pr[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null;
        var o = r.next,
          s = n.pending;
        if (s !== null) {
          var i = s.next;
          ((s.next = o), (r.next = i));
        }
        n.pending = r;
      }
    Pr = null;
  }
  return e;
}
function w0(e, t) {
  do {
    var n = Ee;
    try {
      if ((cf(), (gi.current = Ki), Gi)) {
        for (var r = ye.memoizedState; r !== null; ) {
          var o = r.queue;
          (o !== null && (o.pending = null), (r = r.next));
        }
        Gi = !1;
      }
      if (
        ((Wr = 0),
        (Te = ke = ye = null),
        (Ls = !1),
        (na = 0),
        (Nf.current = null),
        n === null || n.return === null)
      ) {
        ((Pe = 1), (sa = t), (Ee = null));
        break;
      }
      e: {
        var s = e,
          i = n.return,
          l = n,
          c = t;
        if (
          ((t = Me),
          (l.flags |= 32768),
          c !== null && typeof c == 'object' && typeof c.then == 'function')
        ) {
          var u = c,
            f = l,
            m = f.tag;
          if (!(f.mode & 1) && (m === 0 || m === 11 || m === 15)) {
            var p = f.alternate;
            p
              ? ((f.updateQueue = p.updateQueue),
                (f.memoizedState = p.memoizedState),
                (f.lanes = p.lanes))
              : ((f.updateQueue = null), (f.memoizedState = null));
          }
          var h = Dp(i);
          if (h !== null) {
            ((h.flags &= -257),
              Mp(h, i, l, s, t),
              h.mode & 1 && Rp(s, u, t),
              (t = h),
              (c = u));
            var b = t.updateQueue;
            if (b === null) {
              var v = new Set();
              (v.add(c), (t.updateQueue = v));
            } else b.add(c);
            break e;
          } else {
            if (!(t & 1)) {
              (Rp(s, u, t), kf());
              break e;
            }
            c = Error(O(426));
          }
        } else if (ve && l.mode & 1) {
          var w = Dp(i);
          if (w !== null) {
            (!(w.flags & 65536) && (w.flags |= 256),
              Mp(w, i, l, s, t),
              af(qo(c, l)));
            break e;
          }
        }
        ((s = c = qo(c, l)),
          Pe !== 4 && (Pe = 2),
          $s === null ? ($s = [s]) : $s.push(s),
          (s = i));
        do {
          switch (s.tag) {
            case 3:
              ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
              var x = r0(s, c, t);
              Cp(s, x);
              break e;
            case 1:
              l = c;
              var g = s.type,
                y = s.stateNode;
              if (
                !(s.flags & 128) &&
                (typeof g.getDerivedStateFromError == 'function' ||
                  (y !== null &&
                    typeof y.componentDidCatch == 'function' &&
                    (sr === null || !sr.has(y))))
              ) {
                ((s.flags |= 65536), (t &= -t), (s.lanes |= t));
                var N = o0(s, l, t);
                Cp(s, N);
                break e;
              }
          }
          s = s.return;
        } while (s !== null);
      }
      j0(n);
    } catch (C) {
      ((t = C), Ee === n && n !== null && (Ee = n = n.return));
      continue;
    }
    break;
  } while (!0);
}
function b0() {
  var e = Qi.current;
  return ((Qi.current = Ki), e === null ? Ki : e);
}
function kf() {
  ((Pe === 0 || Pe === 3 || Pe === 2) && (Pe = 4),
    Re === null || (!(Ur & 268435455) && !(Tl & 268435455)) || Vn(Re, Me));
}
function Zi(e, t) {
  var n = re;
  re |= 2;
  var r = b0();
  (Re !== e || Me !== t) && ((pn = null), Ir(e, t));
  do
    try {
      Kj();
      break;
    } catch (o) {
      w0(e, o);
    }
  while (!0);
  if ((cf(), (re = n), (Qi.current = r), Ee !== null)) throw Error(O(261));
  return ((Re = null), (Me = 0), Pe);
}
function Kj() {
  for (; Ee !== null; ) N0(Ee);
}
function Qj() {
  for (; Ee !== null && !wN(); ) N0(Ee);
}
function N0(e) {
  var t = S0(e.alternate, e, ot);
  ((e.memoizedProps = e.pendingProps),
    t === null ? j0(e) : (Ee = t),
    (Nf.current = null));
}
function j0(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (((e = t.return), t.flags & 32768)) {
      if (((n = Uj(n, t)), n !== null)) {
        ((n.flags &= 32767), (Ee = n));
        return;
      }
      if (e !== null)
        ((e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null));
      else {
        ((Pe = 6), (Ee = null));
        return;
      }
    } else if (((n = Wj(n, t, ot)), n !== null)) {
      Ee = n;
      return;
    }
    if (((t = t.sibling), t !== null)) {
      Ee = t;
      return;
    }
    Ee = t = e;
  } while (t !== null);
  Pe === 0 && (Pe = 5);
}
function Sr(e, t, n) {
  var r = ie,
    o = xt.transition;
  try {
    ((xt.transition = null), (ie = 1), qj(e, t, n, r));
  } finally {
    ((xt.transition = o), (ie = r));
  }
  return null;
}
function qj(e, t, n, r) {
  do Ro();
  while (Zn !== null);
  if (re & 6) throw Error(O(327));
  n = e.finishedWork;
  var o = e.finishedLanes;
  if (n === null) return null;
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current))
    throw Error(O(177));
  ((e.callbackNode = null), (e.callbackPriority = 0));
  var s = n.lanes | n.childLanes;
  if (
    (RN(e, s),
    e === Re && ((Ee = Re = null), (Me = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      Qa ||
      ((Qa = !0),
      E0(Ai, function () {
        return (Ro(), null);
      })),
    (s = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || s)
  ) {
    ((s = xt.transition), (xt.transition = null));
    var i = ie;
    ie = 1;
    var l = re;
    ((re |= 4),
      (Nf.current = null),
      Hj(e, n),
      v0(n, e),
      gj(Ou),
      (_i = !!Au),
      (Ou = Au = null),
      (e.current = n),
      Vj(n),
      bN(),
      (re = l),
      (ie = i),
      (xt.transition = s));
  } else e.current = n;
  if (
    (Qa && ((Qa = !1), (Zn = e), (Xi = o)),
    (s = e.pendingLanes),
    s === 0 && (sr = null),
    CN(n.stateNode),
    nt(e, Se()),
    t !== null)
  )
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      ((o = t[n]), r(o.value, { componentStack: o.stack, digest: o.digest }));
  if (qi) throw ((qi = !1), (e = ed), (ed = null), e);
  return (
    Xi & 1 && e.tag !== 0 && Ro(),
    (s = e.pendingLanes),
    s & 1 ? (e === td ? zs++ : ((zs = 0), (td = e))) : (zs = 0),
    gr(),
    null
  );
}
function Ro() {
  if (Zn !== null) {
    var e = rv(Xi),
      t = xt.transition,
      n = ie;
    try {
      if (((xt.transition = null), (ie = 16 > e ? 16 : e), Zn === null))
        var r = !1;
      else {
        if (((e = Zn), (Zn = null), (Xi = 0), re & 6)) throw Error(O(331));
        var o = re;
        for (re |= 4, F = e.current; F !== null; ) {
          var s = F,
            i = s.child;
          if (F.flags & 16) {
            var l = s.deletions;
            if (l !== null) {
              for (var c = 0; c < l.length; c++) {
                var u = l[c];
                for (F = u; F !== null; ) {
                  var f = F;
                  switch (f.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Fs(8, f, s);
                  }
                  var m = f.child;
                  if (m !== null) ((m.return = f), (F = m));
                  else
                    for (; F !== null; ) {
                      f = F;
                      var p = f.sibling,
                        h = f.return;
                      if ((p0(f), f === u)) {
                        F = null;
                        break;
                      }
                      if (p !== null) {
                        ((p.return = h), (F = p));
                        break;
                      }
                      F = h;
                    }
                }
              }
              var b = s.alternate;
              if (b !== null) {
                var v = b.child;
                if (v !== null) {
                  b.child = null;
                  do {
                    var w = v.sibling;
                    ((v.sibling = null), (v = w));
                  } while (v !== null);
                }
              }
              F = s;
            }
          }
          if (s.subtreeFlags & 2064 && i !== null) ((i.return = s), (F = i));
          else
            e: for (; F !== null; ) {
              if (((s = F), s.flags & 2048))
                switch (s.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Fs(9, s, s.return);
                }
              var x = s.sibling;
              if (x !== null) {
                ((x.return = s.return), (F = x));
                break e;
              }
              F = s.return;
            }
        }
        var g = e.current;
        for (F = g; F !== null; ) {
          i = F;
          var y = i.child;
          if (i.subtreeFlags & 2064 && y !== null) ((y.return = i), (F = y));
          else
            e: for (i = g; F !== null; ) {
              if (((l = F), l.flags & 2048))
                try {
                  switch (l.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Pl(9, l);
                  }
                } catch (C) {
                  Ne(l, l.return, C);
                }
              if (l === i) {
                F = null;
                break e;
              }
              var N = l.sibling;
              if (N !== null) {
                ((N.return = l.return), (F = N));
                break e;
              }
              F = l.return;
            }
        }
        if (
          ((re = o), gr(), rn && typeof rn.onPostCommitFiberRoot == 'function')
        )
          try {
            rn.onPostCommitFiberRoot(wl, e);
          } catch {}
        r = !0;
      }
      return r;
    } finally {
      ((ie = n), (xt.transition = t));
    }
  }
  return !1;
}
function Vp(e, t, n) {
  ((t = qo(n, t)),
    (t = r0(e, t, 1)),
    (e = or(e, t, 1)),
    (t = Ye()),
    e !== null && (ya(e, 1, t), nt(e, t)));
}
function Ne(e, t, n) {
  if (e.tag === 3) Vp(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Vp(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (
          typeof t.type.getDerivedStateFromError == 'function' ||
          (typeof r.componentDidCatch == 'function' &&
            (sr === null || !sr.has(r)))
        ) {
          ((e = qo(n, e)),
            (e = o0(t, e, 1)),
            (t = or(t, e, 1)),
            (e = Ye()),
            t !== null && (ya(t, 1, e), nt(t, e)));
          break;
        }
      }
      t = t.return;
    }
}
function Xj(e, t, n) {
  var r = e.pingCache;
  (r !== null && r.delete(t),
    (t = Ye()),
    (e.pingedLanes |= e.suspendedLanes & n),
    Re === e &&
      (Me & n) === n &&
      (Pe === 4 || (Pe === 3 && (Me & 130023424) === Me && 500 > Se() - Cf)
        ? Ir(e, 0)
        : (jf |= n)),
    nt(e, t));
}
function C0(e, t) {
  t === 0 &&
    (e.mode & 1
      ? ((t = $a), ($a <<= 1), !($a & 130023424) && ($a = 4194304))
      : (t = 1));
  var n = Ye();
  ((e = Sn(e, t)), e !== null && (ya(e, t, n), nt(e, n)));
}
function Zj(e) {
  var t = e.memoizedState,
    n = 0;
  (t !== null && (n = t.retryLane), C0(e, n));
}
function Jj(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        o = e.memoizedState;
      o !== null && (n = o.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(O(314));
  }
  (r !== null && r.delete(t), C0(e, n));
}
var S0;
S0 = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || et.current) Je = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return ((Je = !1), zj(e, t, n));
      Je = !!(e.flags & 131072);
    }
  else ((Je = !1), ve && t.flags & 1048576 && Tv(t, Ui, t.index));
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type;
      (xi(e, t), (e = t.pendingProps));
      var o = Yo(t, We.current);
      (To(t, n), (o = vf(null, t, r, e, o, n)));
      var s = xf();
      return (
        (t.flags |= 1),
        typeof o == 'object' &&
        o !== null &&
        typeof o.render == 'function' &&
        o.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            tt(r) ? ((s = !0), zi(t)) : (s = !1),
            (t.memoizedState =
              o.state !== null && o.state !== void 0 ? o.state : null),
            ff(t),
            (o.updater = kl),
            (t.stateNode = o),
            (o._reactInternals = t),
            Bu(t, r, e, n),
            (t = Yu(null, t, r, !0, s, n)))
          : ((t.tag = 0), ve && s && of(t), He(null, t, o, n), (t = t.child)),
        t
      );
    case 16:
      r = t.elementType;
      e: {
        switch (
          (xi(e, t),
          (e = t.pendingProps),
          (o = r._init),
          (r = o(r._payload)),
          (t.type = r),
          (o = t.tag = tC(r)),
          (e = Rt(r, e)),
          o)
        ) {
          case 0:
            t = Vu(null, t, r, e, n);
            break e;
          case 1:
            t = _p(null, t, r, e, n);
            break e;
          case 11:
            t = Ap(null, t, r, e, n);
            break e;
          case 14:
            t = Op(null, t, r, Rt(r.type, e), n);
            break e;
        }
        throw Error(O(306, r, ''));
      }
      return t;
    case 0:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Rt(r, o)),
        Vu(e, t, r, o, n)
      );
    case 1:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Rt(r, o)),
        _p(e, t, r, o, n)
      );
    case 3:
      e: {
        if ((l0(t), e === null)) throw Error(O(387));
        ((r = t.pendingProps),
          (s = t.memoizedState),
          (o = s.element),
          _v(e, t),
          Vi(t, r, null, n));
        var i = t.memoizedState;
        if (((r = i.element), s.isDehydrated))
          if (
            ((s = {
              element: r,
              isDehydrated: !1,
              cache: i.cache,
              pendingSuspenseBoundaries: i.pendingSuspenseBoundaries,
              transitions: i.transitions,
            }),
            (t.updateQueue.baseState = s),
            (t.memoizedState = s),
            t.flags & 256)
          ) {
            ((o = qo(Error(O(423)), t)), (t = Ip(e, t, r, n, o)));
            break e;
          } else if (r !== o) {
            ((o = qo(Error(O(424)), t)), (t = Ip(e, t, r, n, o)));
            break e;
          } else
            for (
              at = rr(t.stateNode.containerInfo.firstChild),
                it = t,
                ve = !0,
                It = null,
                n = Av(t, null, r, n),
                t.child = n;
              n;
            )
              ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
        else {
          if ((Go(), r === o)) {
            t = En(e, t, n);
            break e;
          }
          He(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return (
        Iv(t),
        e === null && zu(t),
        (r = t.type),
        (o = t.pendingProps),
        (s = e !== null ? e.memoizedProps : null),
        (i = o.children),
        _u(r, o) ? (i = null) : s !== null && _u(r, s) && (t.flags |= 32),
        i0(e, t),
        He(e, t, i, n),
        t.child
      );
    case 6:
      return (e === null && zu(t), null);
    case 13:
      return c0(e, t, n);
    case 4:
      return (
        mf(t, t.stateNode.containerInfo),
        (r = t.pendingProps),
        e === null ? (t.child = Ko(t, null, r, n)) : He(e, t, r, n),
        t.child
      );
    case 11:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Rt(r, o)),
        Ap(e, t, r, o, n)
      );
    case 7:
      return (He(e, t, t.pendingProps, n), t.child);
    case 8:
      return (He(e, t, t.pendingProps.children, n), t.child);
    case 12:
      return (He(e, t, t.pendingProps.children, n), t.child);
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (o = t.pendingProps),
          (s = t.memoizedProps),
          (i = o.value),
          ce(Bi, r._currentValue),
          (r._currentValue = i),
          s !== null)
        )
          if ($t(s.value, i)) {
            if (s.children === o.children && !et.current) {
              t = En(e, t, n);
              break e;
            }
          } else
            for (s = t.child, s !== null && (s.return = t); s !== null; ) {
              var l = s.dependencies;
              if (l !== null) {
                i = s.child;
                for (var c = l.firstContext; c !== null; ) {
                  if (c.context === r) {
                    if (s.tag === 1) {
                      ((c = Nn(-1, n & -n)), (c.tag = 2));
                      var u = s.updateQueue;
                      if (u !== null) {
                        u = u.shared;
                        var f = u.pending;
                        (f === null
                          ? (c.next = c)
                          : ((c.next = f.next), (f.next = c)),
                          (u.pending = c));
                      }
                    }
                    ((s.lanes |= n),
                      (c = s.alternate),
                      c !== null && (c.lanes |= n),
                      Wu(s.return, n, t),
                      (l.lanes |= n));
                    break;
                  }
                  c = c.next;
                }
              } else if (s.tag === 10) i = s.type === t.type ? null : s.child;
              else if (s.tag === 18) {
                if (((i = s.return), i === null)) throw Error(O(341));
                ((i.lanes |= n),
                  (l = i.alternate),
                  l !== null && (l.lanes |= n),
                  Wu(i, n, t),
                  (i = s.sibling));
              } else i = s.child;
              if (i !== null) i.return = s;
              else
                for (i = s; i !== null; ) {
                  if (i === t) {
                    i = null;
                    break;
                  }
                  if (((s = i.sibling), s !== null)) {
                    ((s.return = i.return), (i = s));
                    break;
                  }
                  i = i.return;
                }
              s = i;
            }
        (He(e, t, o.children, n), (t = t.child));
      }
      return t;
    case 9:
      return (
        (o = t.type),
        (r = t.pendingProps.children),
        To(t, n),
        (o = wt(o)),
        (r = r(o)),
        (t.flags |= 1),
        He(e, t, r, n),
        t.child
      );
    case 14:
      return (
        (r = t.type),
        (o = Rt(r, t.pendingProps)),
        (o = Rt(r.type, o)),
        Op(e, t, r, o, n)
      );
    case 15:
      return s0(e, t, t.type, t.pendingProps, n);
    case 17:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : Rt(r, o)),
        xi(e, t),
        (t.tag = 1),
        tt(r) ? ((e = !0), zi(t)) : (e = !1),
        To(t, n),
        n0(t, r, o),
        Bu(t, r, o, n),
        Yu(null, t, r, !0, e, n)
      );
    case 19:
      return u0(e, t, n);
    case 22:
      return a0(e, t, n);
  }
  throw Error(O(156, t.tag));
};
function E0(e, t) {
  return Jg(e, t);
}
function eC(e, t, n, r) {
  ((this.tag = e),
    (this.key = n),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies =
      this.memoizedState =
      this.updateQueue =
      this.memoizedProps =
        null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null));
}
function vt(e, t, n, r) {
  return new eC(e, t, n, r);
}
function Pf(e) {
  return ((e = e.prototype), !(!e || !e.isReactComponent));
}
function tC(e) {
  if (typeof e == 'function') return Pf(e) ? 1 : 0;
  if (e != null) {
    if (((e = e.$$typeof), e === Yd)) return 11;
    if (e === Gd) return 14;
  }
  return 2;
}
function ir(e, t) {
  var n = e.alternate;
  return (
    n === null
      ? ((n = vt(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t),
        (n.type = e.type),
        (n.flags = 0),
        (n.subtreeFlags = 0),
        (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies =
      t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  );
}
function bi(e, t, n, r, o, s) {
  var i = 2;
  if (((r = e), typeof e == 'function')) Pf(e) && (i = 1);
  else if (typeof e == 'string') i = 5;
  else
    e: switch (e) {
      case uo:
        return Lr(n.children, o, s, t);
      case Vd:
        ((i = 8), (o |= 8));
        break;
      case mu:
        return (
          (e = vt(12, n, t, o | 2)),
          (e.elementType = mu),
          (e.lanes = s),
          e
        );
      case pu:
        return ((e = vt(13, n, t, o)), (e.elementType = pu), (e.lanes = s), e);
      case hu:
        return ((e = vt(19, n, t, o)), (e.elementType = hu), (e.lanes = s), e);
      case Ig:
        return Rl(n, o, s, t);
      default:
        if (typeof e == 'object' && e !== null)
          switch (e.$$typeof) {
            case Og:
              i = 10;
              break e;
            case _g:
              i = 9;
              break e;
            case Yd:
              i = 11;
              break e;
            case Gd:
              i = 14;
              break e;
            case Un:
              ((i = 16), (r = null));
              break e;
          }
        throw Error(O(130, e == null ? e : typeof e, ''));
    }
  return (
    (t = vt(i, n, t, o)),
    (t.elementType = e),
    (t.type = r),
    (t.lanes = s),
    t
  );
}
function Lr(e, t, n, r) {
  return ((e = vt(7, e, r, t)), (e.lanes = n), e);
}
function Rl(e, t, n, r) {
  return (
    (e = vt(22, e, r, t)),
    (e.elementType = Ig),
    (e.lanes = n),
    (e.stateNode = { isHidden: !1 }),
    e
  );
}
function Bc(e, t, n) {
  return ((e = vt(6, e, null, t)), (e.lanes = n), e);
}
function Hc(e, t, n) {
  return (
    (t = vt(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation,
    }),
    t
  );
}
function nC(e, t, n, r, o) {
  ((this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork =
      this.pingCache =
      this.current =
      this.pendingChildren =
        null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = Cc(0)),
    (this.expirationTimes = Cc(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = Cc(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = o),
    (this.mutableSourceEagerHydrationData = null));
}
function Tf(e, t, n, r, o, s, i, l, c) {
  return (
    (e = new nC(e, t, n, l, c)),
    t === 1 ? ((t = 1), s === !0 && (t |= 8)) : (t = 0),
    (s = vt(3, null, null, t)),
    (e.current = s),
    (s.stateNode = e),
    (s.memoizedState = {
      element: r,
      isDehydrated: n,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    }),
    ff(s),
    e
  );
}
function rC(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return {
    $$typeof: co,
    key: r == null ? null : '' + r,
    children: e,
    containerInfo: t,
    implementation: n,
  };
}
function k0(e) {
  if (!e) return ur;
  e = e._reactInternals;
  e: {
    if (Kr(e) !== e || e.tag !== 1) throw Error(O(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (tt(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(O(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (tt(n)) return kv(e, n, t);
  }
  return t;
}
function P0(e, t, n, r, o, s, i, l, c) {
  return (
    (e = Tf(n, r, !0, e, o, s, i, l, c)),
    (e.context = k0(null)),
    (n = e.current),
    (r = Ye()),
    (o = ar(n)),
    (s = Nn(r, o)),
    (s.callback = t ?? null),
    or(n, s, o),
    (e.current.lanes = o),
    ya(e, o, r),
    nt(e, r),
    e
  );
}
function Dl(e, t, n, r) {
  var o = t.current,
    s = Ye(),
    i = ar(o);
  return (
    (n = k0(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = Nn(s, i)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = or(o, t, i)),
    e !== null && (Ft(e, o, i, s), hi(e, o, i)),
    i
  );
}
function Ji(e) {
  if (((e = e.current), !e.child)) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Yp(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Rf(e, t) {
  (Yp(e, t), (e = e.alternate) && Yp(e, t));
}
function oC() {
  return null;
}
var T0 =
  typeof reportError == 'function'
    ? reportError
    : function (e) {
        console.error(e);
      };
function Df(e) {
  this._internalRoot = e;
}
Ml.prototype.render = Df.prototype.render = function (e) {
  var t = this._internalRoot;
  if (t === null) throw Error(O(409));
  Dl(e, t, null, null);
};
Ml.prototype.unmount = Df.prototype.unmount = function () {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    (Br(function () {
      Dl(null, e, null, null);
    }),
      (t[Cn] = null));
  }
};
function Ml(e) {
  this._internalRoot = e;
}
Ml.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = av();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Hn.length && t !== 0 && t < Hn[n].priority; n++);
    (Hn.splice(n, 0, e), n === 0 && lv(e));
  }
};
function Mf(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function Al(e) {
  return !(
    !e ||
    (e.nodeType !== 1 &&
      e.nodeType !== 9 &&
      e.nodeType !== 11 &&
      (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
  );
}
function Gp() {}
function sC(e, t, n, r, o) {
  if (o) {
    if (typeof r == 'function') {
      var s = r;
      r = function () {
        var u = Ji(i);
        s.call(u);
      };
    }
    var i = P0(t, r, e, 0, null, !1, !1, '', Gp);
    return (
      (e._reactRootContainer = i),
      (e[Cn] = i.current),
      Xs(e.nodeType === 8 ? e.parentNode : e),
      Br(),
      i
    );
  }
  for (; (o = e.lastChild); ) e.removeChild(o);
  if (typeof r == 'function') {
    var l = r;
    r = function () {
      var u = Ji(c);
      l.call(u);
    };
  }
  var c = Tf(e, 0, !1, null, null, !1, !1, '', Gp);
  return (
    (e._reactRootContainer = c),
    (e[Cn] = c.current),
    Xs(e.nodeType === 8 ? e.parentNode : e),
    Br(function () {
      Dl(t, c, n, r);
    }),
    c
  );
}
function Ol(e, t, n, r, o) {
  var s = n._reactRootContainer;
  if (s) {
    var i = s;
    if (typeof o == 'function') {
      var l = o;
      o = function () {
        var c = Ji(i);
        l.call(c);
      };
    }
    Dl(t, i, e, o);
  } else i = sC(n, t, e, o, r);
  return Ji(i);
}
ov = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = ks(t.pendingLanes);
        n !== 0 &&
          (qd(t, n | 1), nt(t, Se()), !(re & 6) && ((Xo = Se() + 500), gr()));
      }
      break;
    case 13:
      (Br(function () {
        var r = Sn(e, 1);
        if (r !== null) {
          var o = Ye();
          Ft(r, e, 1, o);
        }
      }),
        Rf(e, 1));
  }
};
Xd = function (e) {
  if (e.tag === 13) {
    var t = Sn(e, 134217728);
    if (t !== null) {
      var n = Ye();
      Ft(t, e, 134217728, n);
    }
    Rf(e, 134217728);
  }
};
sv = function (e) {
  if (e.tag === 13) {
    var t = ar(e),
      n = Sn(e, t);
    if (n !== null) {
      var r = Ye();
      Ft(n, e, t, r);
    }
    Rf(e, t);
  }
};
av = function () {
  return ie;
};
iv = function (e, t) {
  var n = ie;
  try {
    return ((ie = e), t());
  } finally {
    ie = n;
  }
};
Su = function (e, t, n) {
  switch (t) {
    case 'input':
      if ((xu(e, n), (t = n.name), n.type === 'radio' && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (
          n = n.querySelectorAll(
            'input[name=' + JSON.stringify('' + t) + '][type="radio"]'
          ),
            t = 0;
          t < n.length;
          t++
        ) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var o = Cl(r);
            if (!o) throw Error(O(90));
            (Fg(r), xu(r, o));
          }
        }
      }
      break;
    case 'textarea':
      zg(e, n);
      break;
    case 'select':
      ((t = n.value), t != null && So(e, !!n.multiple, t, !1));
  }
};
Gg = Sf;
Kg = Br;
var aC = { usingClientEntryPoint: !1, Events: [ba, ho, Cl, Vg, Yg, Sf] },
  bs = {
    findFiberByHostInstance: kr,
    bundleType: 0,
    version: '18.3.1',
    rendererPackageName: 'react-dom',
  },
  iC = {
    bundleType: bs.bundleType,
    version: bs.version,
    rendererPackageName: bs.rendererPackageName,
    rendererConfig: bs.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: Tn.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return ((e = Xg(e)), e === null ? null : e.stateNode);
    },
    findFiberByHostInstance: bs.findFiberByHostInstance || oC,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: '18.3.1-next-f1338f8080-20240426',
  };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
  var qa = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!qa.isDisabled && qa.supportsFiber)
    try {
      ((wl = qa.inject(iC)), (rn = qa));
    } catch {}
}
ut.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = aC;
ut.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Mf(t)) throw Error(O(200));
  return rC(e, t, null, n);
};
ut.createRoot = function (e, t) {
  if (!Mf(e)) throw Error(O(299));
  var n = !1,
    r = '',
    o = T0;
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
    (t = Tf(e, 1, !1, null, null, n, !1, r, o)),
    (e[Cn] = t.current),
    Xs(e.nodeType === 8 ? e.parentNode : e),
    new Df(t)
  );
};
ut.findDOMNode = function (e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == 'function'
      ? Error(O(188))
      : ((e = Object.keys(e).join(',')), Error(O(268, e)));
  return ((e = Xg(t)), (e = e === null ? null : e.stateNode), e);
};
ut.flushSync = function (e) {
  return Br(e);
};
ut.hydrate = function (e, t, n) {
  if (!Al(t)) throw Error(O(200));
  return Ol(null, e, t, !0, n);
};
ut.hydrateRoot = function (e, t, n) {
  if (!Mf(e)) throw Error(O(405));
  var r = (n != null && n.hydratedSources) || null,
    o = !1,
    s = '',
    i = T0;
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (o = !0),
      n.identifierPrefix !== void 0 && (s = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (i = n.onRecoverableError)),
    (t = P0(t, null, e, 1, n ?? null, o, !1, s, i)),
    (e[Cn] = t.current),
    Xs(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      ((n = r[e]),
        (o = n._getVersion),
        (o = o(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, o])
          : t.mutableSourceEagerHydrationData.push(n, o));
  return new Ml(t);
};
ut.render = function (e, t, n) {
  if (!Al(t)) throw Error(O(200));
  return Ol(null, e, t, !1, n);
};
ut.unmountComponentAtNode = function (e) {
  if (!Al(e)) throw Error(O(40));
  return e._reactRootContainer
    ? (Br(function () {
        Ol(null, null, e, !1, function () {
          ((e._reactRootContainer = null), (e[Cn] = null));
        });
      }),
      !0)
    : !1;
};
ut.unstable_batchedUpdates = Sf;
ut.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!Al(n)) throw Error(O(200));
  if (e == null || e._reactInternals === void 0) throw Error(O(38));
  return Ol(e, t, n, !1, r);
};
ut.version = '18.3.1-next-f1338f8080-20240426';
function R0() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(R0);
    } catch (e) {
      console.error(e);
    }
}
(R0(), (Rg.exports = ut));
var ja = Rg.exports;
const D0 = xg(ja);
var M0,
  Kp = ja;
((M0 = Kp.createRoot), Kp.hydrateRoot);
const lC = 1,
  cC = 1e6;
let Vc = 0;
function uC() {
  return ((Vc = (Vc + 1) % Number.MAX_SAFE_INTEGER), Vc.toString());
}
const Yc = new Map(),
  Qp = (e) => {
    if (Yc.has(e)) return;
    const t = setTimeout(() => {
      (Yc.delete(e), Ws({ type: 'REMOVE_TOAST', toastId: e }));
    }, cC);
    Yc.set(e, t);
  },
  dC = (e, t) => {
    switch (t.type) {
      case 'ADD_TOAST':
        return { ...e, toasts: [t.toast, ...e.toasts].slice(0, lC) };
      case 'UPDATE_TOAST':
        return {
          ...e,
          toasts: e.toasts.map((n) =>
            n.id === t.toast.id ? { ...n, ...t.toast } : n
          ),
        };
      case 'DISMISS_TOAST': {
        const { toastId: n } = t;
        return (
          n
            ? Qp(n)
            : e.toasts.forEach((r) => {
                Qp(r.id);
              }),
          {
            ...e,
            toasts: e.toasts.map((r) =>
              r.id === n || n === void 0 ? { ...r, open: !1 } : r
            ),
          }
        );
      }
      case 'REMOVE_TOAST':
        return t.toastId === void 0
          ? { ...e, toasts: [] }
          : { ...e, toasts: e.toasts.filter((n) => n.id !== t.toastId) };
    }
  },
  Ni = [];
let ji = { toasts: [] };
function Ws(e) {
  ((ji = dC(ji, e)),
    Ni.forEach((t) => {
      t(ji);
    }));
}
function fC({ ...e }) {
  const t = uC(),
    n = (o) => Ws({ type: 'UPDATE_TOAST', toast: { ...o, id: t } }),
    r = () => Ws({ type: 'DISMISS_TOAST', toastId: t });
  return (
    Ws({
      type: 'ADD_TOAST',
      toast: {
        ...e,
        id: t,
        open: !0,
        onOpenChange: (o) => {
          o || r();
        },
      },
    }),
    { id: t, dismiss: r, update: n }
  );
}
function mC() {
  const [e, t] = d.useState(ji);
  return (
    d.useEffect(
      () => (
        Ni.push(t),
        () => {
          const n = Ni.indexOf(t);
          n > -1 && Ni.splice(n, 1);
        }
      ),
      [e]
    ),
    {
      ...e,
      toast: fC,
      dismiss: (n) => Ws({ type: 'DISMISS_TOAST', toastId: n }),
    }
  );
}
function $(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function (o) {
    if ((e == null || e(o), n === !1 || !o.defaultPrevented))
      return t == null ? void 0 : t(o);
  };
}
function qp(e, t) {
  if (typeof e == 'function') return e(t);
  e != null && (e.current = t);
}
function _l(...e) {
  return (t) => {
    let n = !1;
    const r = e.map((o) => {
      const s = qp(o, t);
      return (!n && typeof s == 'function' && (n = !0), s);
    });
    if (n)
      return () => {
        for (let o = 0; o < r.length; o++) {
          const s = r[o];
          typeof s == 'function' ? s() : qp(e[o], null);
        }
      };
  };
}
function se(...e) {
  return d.useCallback(_l(...e), e);
}
function pC(e, t) {
  const n = d.createContext(t),
    r = (s) => {
      const { children: i, ...l } = s,
        c = d.useMemo(() => l, Object.values(l));
      return a.jsx(n.Provider, { value: c, children: i });
    };
  r.displayName = e + 'Provider';
  function o(s) {
    const i = d.useContext(n);
    if (i) return i;
    if (t !== void 0) return t;
    throw new Error(`\`${s}\` must be used within \`${e}\``);
  }
  return [r, o];
}
function Ue(e, t = []) {
  let n = [];
  function r(s, i) {
    const l = d.createContext(i),
      c = n.length;
    n = [...n, i];
    const u = (m) => {
      var x;
      const { scope: p, children: h, ...b } = m,
        v = ((x = p == null ? void 0 : p[e]) == null ? void 0 : x[c]) || l,
        w = d.useMemo(() => b, Object.values(b));
      return a.jsx(v.Provider, { value: w, children: h });
    };
    u.displayName = s + 'Provider';
    function f(m, p) {
      var v;
      const h = ((v = p == null ? void 0 : p[e]) == null ? void 0 : v[c]) || l,
        b = d.useContext(h);
      if (b) return b;
      if (i !== void 0) return i;
      throw new Error(`\`${m}\` must be used within \`${s}\``);
    }
    return [u, f];
  }
  const o = () => {
    const s = n.map((i) => d.createContext(i));
    return function (l) {
      const c = (l == null ? void 0 : l[e]) || s;
      return d.useMemo(() => ({ [`__scope${e}`]: { ...l, [e]: c } }), [l, c]);
    };
  };
  return ((o.scopeName = e), [r, hC(o, ...t)]);
}
function hC(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((o) => ({ useScope: o(), scopeName: o.scopeName }));
    return function (s) {
      const i = r.reduce((l, { useScope: c, scopeName: u }) => {
        const m = c(s)[`__scope${u}`];
        return { ...l, ...m };
      }, {});
      return d.useMemo(() => ({ [`__scope${t.scopeName}`]: i }), [i]);
    };
  };
  return ((n.scopeName = t.scopeName), n);
}
function Zo(e) {
  const t = gC(e),
    n = d.forwardRef((r, o) => {
      const { children: s, ...i } = r,
        l = d.Children.toArray(s),
        c = l.find(vC);
      if (c) {
        const u = c.props.children,
          f = l.map((m) =>
            m === c
              ? d.Children.count(u) > 1
                ? d.Children.only(null)
                : d.isValidElement(u)
                  ? u.props.children
                  : null
              : m
          );
        return a.jsx(t, {
          ...i,
          ref: o,
          children: d.isValidElement(u) ? d.cloneElement(u, void 0, f) : null,
        });
      }
      return a.jsx(t, { ...i, ref: o, children: s });
    });
  return ((n.displayName = `${e}.Slot`), n);
}
var A0 = Zo('Slot');
function gC(e) {
  const t = d.forwardRef((n, r) => {
    const { children: o, ...s } = n;
    if (d.isValidElement(o)) {
      const i = yC(o),
        l = xC(s, o.props);
      return (
        o.type !== d.Fragment && (l.ref = r ? _l(r, i) : i),
        d.cloneElement(o, l)
      );
    }
    return d.Children.count(o) > 1 ? d.Children.only(null) : null;
  });
  return ((t.displayName = `${e}.SlotClone`), t);
}
var O0 = Symbol('radix.slottable');
function _0(e) {
  const t = ({ children: n }) => a.jsx(a.Fragment, { children: n });
  return ((t.displayName = `${e}.Slottable`), (t.__radixId = O0), t);
}
function vC(e) {
  return (
    d.isValidElement(e) &&
    typeof e.type == 'function' &&
    '__radixId' in e.type &&
    e.type.__radixId === O0
  );
}
function xC(e, t) {
  const n = { ...t };
  for (const r in t) {
    const o = e[r],
      s = t[r];
    /^on[A-Z]/.test(r)
      ? o && s
        ? (n[r] = (...l) => {
            const c = s(...l);
            return (o(...l), c);
          })
        : o && (n[r] = o)
      : r === 'style'
        ? (n[r] = { ...o, ...s })
        : r === 'className' && (n[r] = [o, s].filter(Boolean).join(' '));
  }
  return { ...e, ...n };
}
function yC(e) {
  var r, o;
  let t =
      (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null
        ? void 0
        : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t =
        (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null
          ? void 0
          : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
function Il(e) {
  const t = e + 'CollectionProvider',
    [n, r] = Ue(t),
    [o, s] = n(t, { collectionRef: { current: null }, itemMap: new Map() }),
    i = (v) => {
      const { scope: w, children: x } = v,
        g = A.useRef(null),
        y = A.useRef(new Map()).current;
      return a.jsx(o, { scope: w, itemMap: y, collectionRef: g, children: x });
    };
  i.displayName = t;
  const l = e + 'CollectionSlot',
    c = Zo(l),
    u = A.forwardRef((v, w) => {
      const { scope: x, children: g } = v,
        y = s(l, x),
        N = se(w, y.collectionRef);
      return a.jsx(c, { ref: N, children: g });
    });
  u.displayName = l;
  const f = e + 'CollectionItemSlot',
    m = 'data-radix-collection-item',
    p = Zo(f),
    h = A.forwardRef((v, w) => {
      const { scope: x, children: g, ...y } = v,
        N = A.useRef(null),
        C = se(w, N),
        j = s(f, x);
      return (
        A.useEffect(
          () => (
            j.itemMap.set(N, { ref: N, ...y }),
            () => void j.itemMap.delete(N)
          )
        ),
        a.jsx(p, { [m]: '', ref: C, children: g })
      );
    });
  h.displayName = f;
  function b(v) {
    const w = s(e + 'CollectionConsumer', v);
    return A.useCallback(() => {
      const g = w.collectionRef.current;
      if (!g) return [];
      const y = Array.from(g.querySelectorAll(`[${m}]`));
      return Array.from(w.itemMap.values()).sort(
        (j, S) => y.indexOf(j.ref.current) - y.indexOf(S.ref.current)
      );
    }, [w.collectionRef, w.itemMap]);
  }
  return [{ Provider: i, Slot: u, ItemSlot: h }, b, r];
}
var wC = [
    'a',
    'button',
    'div',
    'form',
    'h2',
    'h3',
    'img',
    'input',
    'label',
    'li',
    'nav',
    'ol',
    'p',
    'select',
    'span',
    'svg',
    'ul',
  ],
  K = wC.reduce((e, t) => {
    const n = Zo(`Primitive.${t}`),
      r = d.forwardRef((o, s) => {
        const { asChild: i, ...l } = o,
          c = i ? n : t;
        return (
          typeof window < 'u' && (window[Symbol.for('radix-ui')] = !0),
          a.jsx(c, { ...l, ref: s })
        );
      });
    return ((r.displayName = `Primitive.${t}`), { ...e, [t]: r });
  }, {});
function Ll(e, t) {
  e && ja.flushSync(() => e.dispatchEvent(t));
}
function Oe(e) {
  const t = d.useRef(e);
  return (
    d.useEffect(() => {
      t.current = e;
    }),
    d.useMemo(
      () =>
        (...n) => {
          var r;
          return (r = t.current) == null ? void 0 : r.call(t, ...n);
        },
      []
    )
  );
}
function I0(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Oe(e);
  d.useEffect(() => {
    const r = (o) => {
      o.key === 'Escape' && n(o);
    };
    return (
      t.addEventListener('keydown', r, { capture: !0 }),
      () => t.removeEventListener('keydown', r, { capture: !0 })
    );
  }, [n, t]);
}
var bC = 'DismissableLayer',
  od = 'dismissableLayer.update',
  NC = 'dismissableLayer.pointerDownOutside',
  jC = 'dismissableLayer.focusOutside',
  Xp,
  L0 = d.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set(),
  }),
  Ca = d.forwardRef((e, t) => {
    const {
        disableOutsidePointerEvents: n = !1,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: s,
        onInteractOutside: i,
        onDismiss: l,
        ...c
      } = e,
      u = d.useContext(L0),
      [f, m] = d.useState(null),
      p =
        (f == null ? void 0 : f.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      [, h] = d.useState({}),
      b = se(t, (S) => m(S)),
      v = Array.from(u.layers),
      [w] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1),
      x = v.indexOf(w),
      g = f ? v.indexOf(f) : -1,
      y = u.layersWithOutsidePointerEventsDisabled.size > 0,
      N = g >= x,
      C = SC((S) => {
        const k = S.target,
          M = [...u.branches].some((D) => D.contains(k));
        !N ||
          M ||
          (o == null || o(S),
          i == null || i(S),
          S.defaultPrevented || l == null || l());
      }, p),
      j = EC((S) => {
        const k = S.target;
        [...u.branches].some((D) => D.contains(k)) ||
          (s == null || s(S),
          i == null || i(S),
          S.defaultPrevented || l == null || l());
      }, p);
    return (
      I0((S) => {
        g === u.layers.size - 1 &&
          (r == null || r(S),
          !S.defaultPrevented && l && (S.preventDefault(), l()));
      }, p),
      d.useEffect(() => {
        if (f)
          return (
            n &&
              (u.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((Xp = p.body.style.pointerEvents),
                (p.body.style.pointerEvents = 'none')),
              u.layersWithOutsidePointerEventsDisabled.add(f)),
            u.layers.add(f),
            Zp(),
            () => {
              n &&
                u.layersWithOutsidePointerEventsDisabled.size === 1 &&
                (p.body.style.pointerEvents = Xp);
            }
          );
      }, [f, p, n, u]),
      d.useEffect(
        () => () => {
          f &&
            (u.layers.delete(f),
            u.layersWithOutsidePointerEventsDisabled.delete(f),
            Zp());
        },
        [f, u]
      ),
      d.useEffect(() => {
        const S = () => h({});
        return (
          document.addEventListener(od, S),
          () => document.removeEventListener(od, S)
        );
      }, []),
      a.jsx(K.div, {
        ...c,
        ref: b,
        style: {
          pointerEvents: y ? (N ? 'auto' : 'none') : void 0,
          ...e.style,
        },
        onFocusCapture: $(e.onFocusCapture, j.onFocusCapture),
        onBlurCapture: $(e.onBlurCapture, j.onBlurCapture),
        onPointerDownCapture: $(e.onPointerDownCapture, C.onPointerDownCapture),
      })
    );
  });
Ca.displayName = bC;
var CC = 'DismissableLayerBranch',
  F0 = d.forwardRef((e, t) => {
    const n = d.useContext(L0),
      r = d.useRef(null),
      o = se(t, r);
    return (
      d.useEffect(() => {
        const s = r.current;
        if (s)
          return (
            n.branches.add(s),
            () => {
              n.branches.delete(s);
            }
          );
      }, [n.branches]),
      a.jsx(K.div, { ...e, ref: o })
    );
  });
F0.displayName = CC;
function SC(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Oe(e),
    r = d.useRef(!1),
    o = d.useRef(() => {});
  return (
    d.useEffect(() => {
      const s = (l) => {
          if (l.target && !r.current) {
            let c = function () {
              $0(NC, n, u, { discrete: !0 });
            };
            const u = { originalEvent: l };
            l.pointerType === 'touch'
              ? (t.removeEventListener('click', o.current),
                (o.current = c),
                t.addEventListener('click', o.current, { once: !0 }))
              : c();
          } else t.removeEventListener('click', o.current);
          r.current = !1;
        },
        i = window.setTimeout(() => {
          t.addEventListener('pointerdown', s);
        }, 0);
      return () => {
        (window.clearTimeout(i),
          t.removeEventListener('pointerdown', s),
          t.removeEventListener('click', o.current));
      };
    }, [t, n]),
    { onPointerDownCapture: () => (r.current = !0) }
  );
}
function EC(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Oe(e),
    r = d.useRef(!1);
  return (
    d.useEffect(() => {
      const o = (s) => {
        s.target &&
          !r.current &&
          $0(jC, n, { originalEvent: s }, { discrete: !1 });
      };
      return (
        t.addEventListener('focusin', o),
        () => t.removeEventListener('focusin', o)
      );
    }, [t, n]),
    {
      onFocusCapture: () => (r.current = !0),
      onBlurCapture: () => (r.current = !1),
    }
  );
}
function Zp() {
  const e = new CustomEvent(od);
  document.dispatchEvent(e);
}
function $0(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target,
    s = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  (t && o.addEventListener(e, t, { once: !0 }),
    r ? Ll(o, s) : o.dispatchEvent(s));
}
var kC = Ca,
  PC = F0,
  _e = globalThis != null && globalThis.document ? d.useLayoutEffect : () => {},
  TC = 'Portal',
  Fl = d.forwardRef((e, t) => {
    var l;
    const { container: n, ...r } = e,
      [o, s] = d.useState(!1);
    _e(() => s(!0), []);
    const i =
      n ||
      (o &&
        ((l = globalThis == null ? void 0 : globalThis.document) == null
          ? void 0
          : l.body));
    return i ? D0.createPortal(a.jsx(K.div, { ...r, ref: t }), i) : null;
  });
Fl.displayName = TC;
function RC(e, t) {
  return d.useReducer((n, r) => t[n][r] ?? n, e);
}
var Nt = (e) => {
  const { present: t, children: n } = e,
    r = DC(t),
    o =
      typeof n == 'function' ? n({ present: r.isPresent }) : d.Children.only(n),
    s = se(r.ref, MC(o));
  return typeof n == 'function' || r.isPresent
    ? d.cloneElement(o, { ref: s })
    : null;
};
Nt.displayName = 'Presence';
function DC(e) {
  const [t, n] = d.useState(),
    r = d.useRef(null),
    o = d.useRef(e),
    s = d.useRef('none'),
    i = e ? 'mounted' : 'unmounted',
    [l, c] = RC(i, {
      mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
      unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
      unmounted: { MOUNT: 'mounted' },
    });
  return (
    d.useEffect(() => {
      const u = Xa(r.current);
      s.current = l === 'mounted' ? u : 'none';
    }, [l]),
    _e(() => {
      const u = r.current,
        f = o.current;
      if (f !== e) {
        const p = s.current,
          h = Xa(u);
        (e
          ? c('MOUNT')
          : h === 'none' || (u == null ? void 0 : u.display) === 'none'
            ? c('UNMOUNT')
            : c(f && p !== h ? 'ANIMATION_OUT' : 'UNMOUNT'),
          (o.current = e));
      }
    }, [e, c]),
    _e(() => {
      if (t) {
        let u;
        const f = t.ownerDocument.defaultView ?? window,
          m = (h) => {
            const v = Xa(r.current).includes(h.animationName);
            if (h.target === t && v && (c('ANIMATION_END'), !o.current)) {
              const w = t.style.animationFillMode;
              ((t.style.animationFillMode = 'forwards'),
                (u = f.setTimeout(() => {
                  t.style.animationFillMode === 'forwards' &&
                    (t.style.animationFillMode = w);
                })));
            }
          },
          p = (h) => {
            h.target === t && (s.current = Xa(r.current));
          };
        return (
          t.addEventListener('animationstart', p),
          t.addEventListener('animationcancel', m),
          t.addEventListener('animationend', m),
          () => {
            (f.clearTimeout(u),
              t.removeEventListener('animationstart', p),
              t.removeEventListener('animationcancel', m),
              t.removeEventListener('animationend', m));
          }
        );
      } else c('ANIMATION_END');
    }, [t, c]),
    {
      isPresent: ['mounted', 'unmountSuspended'].includes(l),
      ref: d.useCallback((u) => {
        ((r.current = u ? getComputedStyle(u) : null), n(u));
      }, []),
    }
  );
}
function Xa(e) {
  return (e == null ? void 0 : e.animationName) || 'none';
}
function MC(e) {
  var r, o;
  let t =
      (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null
        ? void 0
        : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t =
        (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null
          ? void 0
          : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
var AC = Wd[' useInsertionEffect '.trim().toString()] || _e;
function cn({ prop: e, defaultProp: t, onChange: n = () => {}, caller: r }) {
  const [o, s, i] = OC({ defaultProp: t, onChange: n }),
    l = e !== void 0,
    c = l ? e : o;
  {
    const f = d.useRef(e !== void 0);
    d.useEffect(() => {
      const m = f.current;
      (m !== l &&
        console.warn(
          `${r} is changing from ${m ? 'controlled' : 'uncontrolled'} to ${l ? 'controlled' : 'uncontrolled'}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
        ),
        (f.current = l));
    }, [l, r]);
  }
  const u = d.useCallback(
    (f) => {
      var m;
      if (l) {
        const p = _C(f) ? f(e) : f;
        p !== e && ((m = i.current) == null || m.call(i, p));
      } else s(f);
    },
    [l, e, s, i]
  );
  return [c, u];
}
function OC({ defaultProp: e, onChange: t }) {
  const [n, r] = d.useState(e),
    o = d.useRef(n),
    s = d.useRef(t);
  return (
    AC(() => {
      s.current = t;
    }, [t]),
    d.useEffect(() => {
      var i;
      o.current !== n &&
        ((i = s.current) == null || i.call(s, n), (o.current = n));
    }, [n, o]),
    [n, r, s]
  );
}
function _C(e) {
  return typeof e == 'function';
}
var IC = Object.freeze({
    position: 'absolute',
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
  }),
  LC = 'VisuallyHidden',
  $l = d.forwardRef((e, t) =>
    a.jsx(K.span, { ...e, ref: t, style: { ...IC, ...e.style } })
  );
$l.displayName = LC;
var FC = $l,
  Af = 'ToastProvider',
  [Of, $C, zC] = Il('Toast'),
  [z0, rO] = Ue('Toast', [zC]),
  [WC, zl] = z0(Af),
  W0 = (e) => {
    const {
        __scopeToast: t,
        label: n = 'Notification',
        duration: r = 5e3,
        swipeDirection: o = 'right',
        swipeThreshold: s = 50,
        children: i,
      } = e,
      [l, c] = d.useState(null),
      [u, f] = d.useState(0),
      m = d.useRef(!1),
      p = d.useRef(!1);
    return (
      n.trim() ||
        console.error(
          `Invalid prop \`label\` supplied to \`${Af}\`. Expected non-empty \`string\`.`
        ),
      a.jsx(Of.Provider, {
        scope: t,
        children: a.jsx(WC, {
          scope: t,
          label: n,
          duration: r,
          swipeDirection: o,
          swipeThreshold: s,
          toastCount: u,
          viewport: l,
          onViewportChange: c,
          onToastAdd: d.useCallback(() => f((h) => h + 1), []),
          onToastRemove: d.useCallback(() => f((h) => h - 1), []),
          isFocusedToastEscapeKeyDownRef: m,
          isClosePausedRef: p,
          children: i,
        }),
      })
    );
  };
W0.displayName = Af;
var U0 = 'ToastViewport',
  UC = ['F8'],
  sd = 'toast.viewportPause',
  ad = 'toast.viewportResume',
  B0 = d.forwardRef((e, t) => {
    const {
        __scopeToast: n,
        hotkey: r = UC,
        label: o = 'Notifications ({hotkey})',
        ...s
      } = e,
      i = zl(U0, n),
      l = $C(n),
      c = d.useRef(null),
      u = d.useRef(null),
      f = d.useRef(null),
      m = d.useRef(null),
      p = se(t, m, i.onViewportChange),
      h = r.join('+').replace(/Key/g, '').replace(/Digit/g, ''),
      b = i.toastCount > 0;
    (d.useEffect(() => {
      const w = (x) => {
        var y;
        r.length !== 0 &&
          r.every((N) => x[N] || x.code === N) &&
          ((y = m.current) == null || y.focus());
      };
      return (
        document.addEventListener('keydown', w),
        () => document.removeEventListener('keydown', w)
      );
    }, [r]),
      d.useEffect(() => {
        const w = c.current,
          x = m.current;
        if (b && w && x) {
          const g = () => {
              if (!i.isClosePausedRef.current) {
                const j = new CustomEvent(sd);
                (x.dispatchEvent(j), (i.isClosePausedRef.current = !0));
              }
            },
            y = () => {
              if (i.isClosePausedRef.current) {
                const j = new CustomEvent(ad);
                (x.dispatchEvent(j), (i.isClosePausedRef.current = !1));
              }
            },
            N = (j) => {
              !w.contains(j.relatedTarget) && y();
            },
            C = () => {
              w.contains(document.activeElement) || y();
            };
          return (
            w.addEventListener('focusin', g),
            w.addEventListener('focusout', N),
            w.addEventListener('pointermove', g),
            w.addEventListener('pointerleave', C),
            window.addEventListener('blur', g),
            window.addEventListener('focus', y),
            () => {
              (w.removeEventListener('focusin', g),
                w.removeEventListener('focusout', N),
                w.removeEventListener('pointermove', g),
                w.removeEventListener('pointerleave', C),
                window.removeEventListener('blur', g),
                window.removeEventListener('focus', y));
            }
          );
        }
      }, [b, i.isClosePausedRef]));
    const v = d.useCallback(
      ({ tabbingDirection: w }) => {
        const g = l().map((y) => {
          const N = y.ref.current,
            C = [N, ...tS(N)];
          return w === 'forwards' ? C : C.reverse();
        });
        return (w === 'forwards' ? g.reverse() : g).flat();
      },
      [l]
    );
    return (
      d.useEffect(() => {
        const w = m.current;
        if (w) {
          const x = (g) => {
            var C, j, S;
            const y = g.altKey || g.ctrlKey || g.metaKey;
            if (g.key === 'Tab' && !y) {
              const k = document.activeElement,
                M = g.shiftKey;
              if (g.target === w && M) {
                (C = u.current) == null || C.focus();
                return;
              }
              const P = v({ tabbingDirection: M ? 'backwards' : 'forwards' }),
                U = P.findIndex((_) => _ === k);
              Gc(P.slice(U + 1))
                ? g.preventDefault()
                : M
                  ? (j = u.current) == null || j.focus()
                  : (S = f.current) == null || S.focus();
            }
          };
          return (
            w.addEventListener('keydown', x),
            () => w.removeEventListener('keydown', x)
          );
        }
      }, [l, v]),
      a.jsxs(PC, {
        ref: c,
        role: 'region',
        'aria-label': o.replace('{hotkey}', h),
        tabIndex: -1,
        style: { pointerEvents: b ? void 0 : 'none' },
        children: [
          b &&
            a.jsx(id, {
              ref: u,
              onFocusFromOutsideViewport: () => {
                const w = v({ tabbingDirection: 'forwards' });
                Gc(w);
              },
            }),
          a.jsx(Of.Slot, {
            scope: n,
            children: a.jsx(K.ol, { tabIndex: -1, ...s, ref: p }),
          }),
          b &&
            a.jsx(id, {
              ref: f,
              onFocusFromOutsideViewport: () => {
                const w = v({ tabbingDirection: 'backwards' });
                Gc(w);
              },
            }),
        ],
      })
    );
  });
B0.displayName = U0;
var H0 = 'ToastFocusProxy',
  id = d.forwardRef((e, t) => {
    const { __scopeToast: n, onFocusFromOutsideViewport: r, ...o } = e,
      s = zl(H0, n);
    return a.jsx($l, {
      'aria-hidden': !0,
      tabIndex: 0,
      ...o,
      ref: t,
      style: { position: 'fixed' },
      onFocus: (i) => {
        var u;
        const l = i.relatedTarget;
        !((u = s.viewport) != null && u.contains(l)) && r();
      },
    });
  });
id.displayName = H0;
var Sa = 'Toast',
  BC = 'toast.swipeStart',
  HC = 'toast.swipeMove',
  VC = 'toast.swipeCancel',
  YC = 'toast.swipeEnd',
  V0 = d.forwardRef((e, t) => {
    const { forceMount: n, open: r, defaultOpen: o, onOpenChange: s, ...i } = e,
      [l, c] = cn({ prop: r, defaultProp: o ?? !0, onChange: s, caller: Sa });
    return a.jsx(Nt, {
      present: n || l,
      children: a.jsx(QC, {
        open: l,
        ...i,
        ref: t,
        onClose: () => c(!1),
        onPause: Oe(e.onPause),
        onResume: Oe(e.onResume),
        onSwipeStart: $(e.onSwipeStart, (u) => {
          u.currentTarget.setAttribute('data-swipe', 'start');
        }),
        onSwipeMove: $(e.onSwipeMove, (u) => {
          const { x: f, y: m } = u.detail.delta;
          (u.currentTarget.setAttribute('data-swipe', 'move'),
            u.currentTarget.style.setProperty(
              '--radix-toast-swipe-move-x',
              `${f}px`
            ),
            u.currentTarget.style.setProperty(
              '--radix-toast-swipe-move-y',
              `${m}px`
            ));
        }),
        onSwipeCancel: $(e.onSwipeCancel, (u) => {
          (u.currentTarget.setAttribute('data-swipe', 'cancel'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-y'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-end-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-end-y'));
        }),
        onSwipeEnd: $(e.onSwipeEnd, (u) => {
          const { x: f, y: m } = u.detail.delta;
          (u.currentTarget.setAttribute('data-swipe', 'end'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-x'),
            u.currentTarget.style.removeProperty('--radix-toast-swipe-move-y'),
            u.currentTarget.style.setProperty(
              '--radix-toast-swipe-end-x',
              `${f}px`
            ),
            u.currentTarget.style.setProperty(
              '--radix-toast-swipe-end-y',
              `${m}px`
            ),
            c(!1));
        }),
      }),
    });
  });
V0.displayName = Sa;
var [GC, KC] = z0(Sa, { onClose() {} }),
  QC = d.forwardRef((e, t) => {
    const {
        __scopeToast: n,
        type: r = 'foreground',
        duration: o,
        open: s,
        onClose: i,
        onEscapeKeyDown: l,
        onPause: c,
        onResume: u,
        onSwipeStart: f,
        onSwipeMove: m,
        onSwipeCancel: p,
        onSwipeEnd: h,
        ...b
      } = e,
      v = zl(Sa, n),
      [w, x] = d.useState(null),
      g = se(t, (_) => x(_)),
      y = d.useRef(null),
      N = d.useRef(null),
      C = o || v.duration,
      j = d.useRef(0),
      S = d.useRef(C),
      k = d.useRef(0),
      { onToastAdd: M, onToastRemove: D } = v,
      W = Oe(() => {
        var Y;
        ((w == null ? void 0 : w.contains(document.activeElement)) &&
          ((Y = v.viewport) == null || Y.focus()),
          i());
      }),
      P = d.useCallback(
        (_) => {
          !_ ||
            _ === 1 / 0 ||
            (window.clearTimeout(k.current),
            (j.current = new Date().getTime()),
            (k.current = window.setTimeout(W, _)));
        },
        [W]
      );
    (d.useEffect(() => {
      const _ = v.viewport;
      if (_) {
        const Y = () => {
            (P(S.current), u == null || u());
          },
          V = () => {
            const G = new Date().getTime() - j.current;
            ((S.current = S.current - G),
              window.clearTimeout(k.current),
              c == null || c());
          };
        return (
          _.addEventListener(sd, V),
          _.addEventListener(ad, Y),
          () => {
            (_.removeEventListener(sd, V), _.removeEventListener(ad, Y));
          }
        );
      }
    }, [v.viewport, C, c, u, P]),
      d.useEffect(() => {
        s && !v.isClosePausedRef.current && P(C);
      }, [s, C, v.isClosePausedRef, P]),
      d.useEffect(() => (M(), () => D()), [M, D]));
    const U = d.useMemo(() => (w ? Z0(w) : null), [w]);
    return v.viewport
      ? a.jsxs(a.Fragment, {
          children: [
            U &&
              a.jsx(qC, {
                __scopeToast: n,
                role: 'status',
                'aria-live': r === 'foreground' ? 'assertive' : 'polite',
                'aria-atomic': !0,
                children: U,
              }),
            a.jsx(GC, {
              scope: n,
              onClose: W,
              children: ja.createPortal(
                a.jsx(Of.ItemSlot, {
                  scope: n,
                  children: a.jsx(kC, {
                    asChild: !0,
                    onEscapeKeyDown: $(l, () => {
                      (v.isFocusedToastEscapeKeyDownRef.current || W(),
                        (v.isFocusedToastEscapeKeyDownRef.current = !1));
                    }),
                    children: a.jsx(K.li, {
                      role: 'status',
                      'aria-live': 'off',
                      'aria-atomic': !0,
                      tabIndex: 0,
                      'data-state': s ? 'open' : 'closed',
                      'data-swipe-direction': v.swipeDirection,
                      ...b,
                      ref: g,
                      style: {
                        userSelect: 'none',
                        touchAction: 'none',
                        ...e.style,
                      },
                      onKeyDown: $(e.onKeyDown, (_) => {
                        _.key === 'Escape' &&
                          (l == null || l(_.nativeEvent),
                          _.nativeEvent.defaultPrevented ||
                            ((v.isFocusedToastEscapeKeyDownRef.current = !0),
                            W()));
                      }),
                      onPointerDown: $(e.onPointerDown, (_) => {
                        _.button === 0 &&
                          (y.current = { x: _.clientX, y: _.clientY });
                      }),
                      onPointerMove: $(e.onPointerMove, (_) => {
                        if (!y.current) return;
                        const Y = _.clientX - y.current.x,
                          V = _.clientY - y.current.y,
                          G = !!N.current,
                          T = ['left', 'right'].includes(v.swipeDirection),
                          E = ['left', 'up'].includes(v.swipeDirection)
                            ? Math.min
                            : Math.max,
                          I = T ? E(0, Y) : 0,
                          B = T ? 0 : E(0, V),
                          z = _.pointerType === 'touch' ? 10 : 2,
                          Q = { x: I, y: B },
                          Z = { originalEvent: _, delta: Q };
                        G
                          ? ((N.current = Q), Za(HC, m, Z, { discrete: !1 }))
                          : Jp(Q, v.swipeDirection, z)
                            ? ((N.current = Q),
                              Za(BC, f, Z, { discrete: !1 }),
                              _.target.setPointerCapture(_.pointerId))
                            : (Math.abs(Y) > z || Math.abs(V) > z) &&
                              (y.current = null);
                      }),
                      onPointerUp: $(e.onPointerUp, (_) => {
                        const Y = N.current,
                          V = _.target;
                        if (
                          (V.hasPointerCapture(_.pointerId) &&
                            V.releasePointerCapture(_.pointerId),
                          (N.current = null),
                          (y.current = null),
                          Y)
                        ) {
                          const G = _.currentTarget,
                            T = { originalEvent: _, delta: Y };
                          (Jp(Y, v.swipeDirection, v.swipeThreshold)
                            ? Za(YC, h, T, { discrete: !0 })
                            : Za(VC, p, T, { discrete: !0 }),
                            G.addEventListener(
                              'click',
                              (E) => E.preventDefault(),
                              { once: !0 }
                            ));
                        }
                      }),
                    }),
                  }),
                }),
                v.viewport
              ),
            }),
          ],
        })
      : null;
  }),
  qC = (e) => {
    const { __scopeToast: t, children: n, ...r } = e,
      o = zl(Sa, t),
      [s, i] = d.useState(!1),
      [l, c] = d.useState(!1);
    return (
      JC(() => i(!0)),
      d.useEffect(() => {
        const u = window.setTimeout(() => c(!0), 1e3);
        return () => window.clearTimeout(u);
      }, []),
      l
        ? null
        : a.jsx(Fl, {
            asChild: !0,
            children: a.jsx($l, {
              ...r,
              children:
                s && a.jsxs(a.Fragment, { children: [o.label, ' ', n] }),
            }),
          })
    );
  },
  XC = 'ToastTitle',
  Y0 = d.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e;
    return a.jsx(K.div, { ...r, ref: t });
  });
Y0.displayName = XC;
var ZC = 'ToastDescription',
  G0 = d.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e;
    return a.jsx(K.div, { ...r, ref: t });
  });
G0.displayName = ZC;
var K0 = 'ToastAction',
  Q0 = d.forwardRef((e, t) => {
    const { altText: n, ...r } = e;
    return n.trim()
      ? a.jsx(X0, {
          altText: n,
          asChild: !0,
          children: a.jsx(_f, { ...r, ref: t }),
        })
      : (console.error(
          `Invalid prop \`altText\` supplied to \`${K0}\`. Expected non-empty \`string\`.`
        ),
        null);
  });
Q0.displayName = K0;
var q0 = 'ToastClose',
  _f = d.forwardRef((e, t) => {
    const { __scopeToast: n, ...r } = e,
      o = KC(q0, n);
    return a.jsx(X0, {
      asChild: !0,
      children: a.jsx(K.button, {
        type: 'button',
        ...r,
        ref: t,
        onClick: $(e.onClick, o.onClose),
      }),
    });
  });
_f.displayName = q0;
var X0 = d.forwardRef((e, t) => {
  const { __scopeToast: n, altText: r, ...o } = e;
  return a.jsx(K.div, {
    'data-radix-toast-announce-exclude': '',
    'data-radix-toast-announce-alt': r || void 0,
    ...o,
    ref: t,
  });
});
function Z0(e) {
  const t = [];
  return (
    Array.from(e.childNodes).forEach((r) => {
      if (
        (r.nodeType === r.TEXT_NODE && r.textContent && t.push(r.textContent),
        eS(r))
      ) {
        const o = r.ariaHidden || r.hidden || r.style.display === 'none',
          s = r.dataset.radixToastAnnounceExclude === '';
        if (!o)
          if (s) {
            const i = r.dataset.radixToastAnnounceAlt;
            i && t.push(i);
          } else t.push(...Z0(r));
      }
    }),
    t
  );
}
function Za(e, t, n, { discrete: r }) {
  const o = n.originalEvent.currentTarget,
    s = new CustomEvent(e, { bubbles: !0, cancelable: !0, detail: n });
  (t && o.addEventListener(e, t, { once: !0 }),
    r ? Ll(o, s) : o.dispatchEvent(s));
}
var Jp = (e, t, n = 0) => {
  const r = Math.abs(e.x),
    o = Math.abs(e.y),
    s = r > o;
  return t === 'left' || t === 'right' ? s && r > n : !s && o > n;
};
function JC(e = () => {}) {
  const t = Oe(e);
  _e(() => {
    let n = 0,
      r = 0;
    return (
      (n = window.requestAnimationFrame(
        () => (r = window.requestAnimationFrame(t))
      )),
      () => {
        (window.cancelAnimationFrame(n), window.cancelAnimationFrame(r));
      }
    );
  }, [t]);
}
function eS(e) {
  return e.nodeType === e.ELEMENT_NODE;
}
function tS(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const o = r.tagName === 'INPUT' && r.type === 'hidden';
        return r.disabled || r.hidden || o
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
      },
    });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Gc(e) {
  const t = document.activeElement;
  return e.some((n) =>
    n === t ? !0 : (n.focus(), document.activeElement !== t)
  );
}
var nS = W0,
  J0 = B0,
  ex = V0,
  tx = Y0,
  nx = G0,
  rx = Q0,
  ox = _f;
function sx(e) {
  var t,
    n,
    r = '';
  if (typeof e == 'string' || typeof e == 'number') r += e;
  else if (typeof e == 'object')
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++)
        e[t] && (n = sx(e[t])) && (r && (r += ' '), (r += n));
    } else for (n in e) e[n] && (r && (r += ' '), (r += n));
  return r;
}
function ax() {
  for (var e, t, n = 0, r = '', o = arguments.length; n < o; n++)
    (e = arguments[n]) && (t = sx(e)) && (r && (r += ' '), (r += t));
  return r;
}
const eh = (e) => (typeof e == 'boolean' ? `${e}` : e === 0 ? '0' : e),
  th = ax,
  Wl = (e, t) => (n) => {
    var r;
    if ((t == null ? void 0 : t.variants) == null)
      return th(
        e,
        n == null ? void 0 : n.class,
        n == null ? void 0 : n.className
      );
    const { variants: o, defaultVariants: s } = t,
      i = Object.keys(o).map((u) => {
        const f = n == null ? void 0 : n[u],
          m = s == null ? void 0 : s[u];
        if (f === null) return null;
        const p = eh(f) || eh(m);
        return o[u][p];
      }),
      l =
        n &&
        Object.entries(n).reduce((u, f) => {
          let [m, p] = f;
          return (p === void 0 || (u[m] = p), u);
        }, {}),
      c =
        t == null || (r = t.compoundVariants) === null || r === void 0
          ? void 0
          : r.reduce((u, f) => {
              let { class: m, className: p, ...h } = f;
              return Object.entries(h).every((b) => {
                let [v, w] = b;
                return Array.isArray(w)
                  ? w.includes({ ...s, ...l }[v])
                  : { ...s, ...l }[v] === w;
              })
                ? [...u, m, p]
                : u;
            }, []);
    return th(
      e,
      i,
      c,
      n == null ? void 0 : n.class,
      n == null ? void 0 : n.className
    );
  };
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const rS = (e) => e.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
  ix = (...e) =>
    e
      .filter((t, n, r) => !!t && t.trim() !== '' && r.indexOf(t) === n)
      .join(' ')
      .trim();
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var oS = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const sS = d.forwardRef(
  (
    {
      color: e = 'currentColor',
      size: t = 24,
      strokeWidth: n = 2,
      absoluteStrokeWidth: r,
      className: o = '',
      children: s,
      iconNode: i,
      ...l
    },
    c
  ) =>
    d.createElement(
      'svg',
      {
        ref: c,
        ...oS,
        width: t,
        height: t,
        stroke: e,
        strokeWidth: r ? (Number(n) * 24) / Number(t) : n,
        className: ix('lucide', o),
        ...l,
      },
      [
        ...i.map(([u, f]) => d.createElement(u, f)),
        ...(Array.isArray(s) ? s : [s]),
      ]
    )
);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const H = (e, t) => {
  const n = d.forwardRef(({ className: r, ...o }, s) =>
    d.createElement(sS, {
      ref: s,
      iconNode: t,
      className: ix(`lucide-${rS(e)}`, r),
      ...o,
    })
  );
  return ((n.displayName = `${e}`), n);
};
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const aS = H('Archive', [
  [
    'rect',
    { width: '20', height: '5', x: '2', y: '3', rx: '1', key: '1wp1u1' },
  ],
  ['path', { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8', key: '1s80jp' }],
  ['path', { d: 'M10 12h4', key: 'a56b0p' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const iS = H('ArrowLeft', [
  ['path', { d: 'm12 19-7-7 7-7', key: '1l729n' }],
  ['path', { d: 'M19 12H5', key: 'x3x0zl' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const lx = H('Award', [
  [
    'path',
    {
      d: 'm15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526',
      key: '1yiouv',
    },
  ],
  ['circle', { cx: '12', cy: '8', r: '6', key: '1vp47v' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const lS = H('BookOpen', [
  ['path', { d: 'M12 7v14', key: '1akyts' }],
  [
    'path',
    {
      d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
      key: 'ruj8y',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const cS = H('Bot', [
  ['path', { d: 'M12 8V4H8', key: 'hb8ula' }],
  [
    'rect',
    { width: '16', height: '12', x: '4', y: '8', rx: '2', key: 'enze0r' },
  ],
  ['path', { d: 'M2 14h2', key: 'vft8re' }],
  ['path', { d: 'M20 14h2', key: '4cs60a' }],
  ['path', { d: 'M15 13v2', key: '1xurst' }],
  ['path', { d: 'M9 13v2', key: 'rq6x2g' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _t = H('Calendar', [
  ['path', { d: 'M8 2v4', key: '1cmpym' }],
  ['path', { d: 'M16 2v4', key: '4m81vk' }],
  [
    'rect',
    { width: '18', height: '18', x: '3', y: '4', rx: '2', key: '1hopcy' },
  ],
  ['path', { d: 'M3 10h18', key: '8toen8' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const uS = H('ChartColumn', [
  ['path', { d: 'M3 3v16a2 2 0 0 0 2 2h16', key: 'c24i48' }],
  ['path', { d: 'M18 17V9', key: '2bz60n' }],
  ['path', { d: 'M13 17V5', key: '1frdt8' }],
  ['path', { d: 'M8 17v-3', key: '17ska0' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const If = H('Check', [['path', { d: 'M20 6 9 17l-5-5', key: '1gmf2c' }]]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const No = H('ChevronDown', [
  ['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Lf = H('ChevronLeft', [
  ['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wn = H('ChevronRight', [
  ['path', { d: 'm9 18 6-6-6-6', key: 'mthhwq' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const dS = H('ChevronUp', [
  ['path', { d: 'm18 15-6-6-6 6', key: '153udz' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const cx = H('CircleAlert', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['line', { x1: '12', x2: '12', y1: '8', y2: '12', key: '1pkeuh' }],
  ['line', { x1: '12', x2: '12.01', y1: '16', y2: '16', key: '4dfq90' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const jo = H('CircleCheckBig', [
  ['path', { d: 'M21.801 10A10 10 0 1 1 17 3.335', key: 'yps3ct' }],
  ['path', { d: 'm9 11 3 3L22 4', key: '1pflzl' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const fS = H('CircleCheck', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['path', { d: 'm9 12 2 2 4-4', key: 'dzmm74' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ux = H('CircleHelp', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', key: '1u773s' }],
  ['path', { d: 'M12 17h.01', key: 'p32p05' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const dx = H('CirclePlay', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['polygon', { points: '10 8 16 12 10 16 10 8', key: '1cimsy' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const fx = H('Circle', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const nh = H('ClipboardList', [
  [
    'rect',
    {
      width: '8',
      height: '4',
      x: '8',
      y: '2',
      rx: '1',
      ry: '1',
      key: 'tgr4d6',
    },
  ],
  [
    'path',
    {
      d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
      key: '116196',
    },
  ],
  ['path', { d: 'M12 11h4', key: '1jrz19' }],
  ['path', { d: 'M12 16h4', key: 'n85exb' }],
  ['path', { d: 'M8 11h.01', key: '1dfujw' }],
  ['path', { d: 'M8 16h.01', key: '18s6g9' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Hr = H('Clock', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['polyline', { points: '12 6 12 12 16 14', key: '68esgv' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const ld = H('Code', [
  ['polyline', { points: '16 18 22 12 16 6', key: 'z7tu5w' }],
  ['polyline', { points: '8 6 2 12 8 18', key: '1eg1df' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ff = H('Crown', [
  [
    'path',
    {
      d: 'M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z',
      key: '1vdc57',
    },
  ],
  ['path', { d: 'M5 21h14', key: '11awu3' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const rh = H('Download', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h' }],
  ['polyline', { points: '7 10 12 15 17 10', key: '2ggqvy' }],
  ['line', { x1: '12', x2: '12', y1: '15', y2: '3', key: '1vk2je' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const mS = H('Ellipsis', [
  ['circle', { cx: '12', cy: '12', r: '1', key: '41hilf' }],
  ['circle', { cx: '19', cy: '12', r: '1', key: '1wjl8i' }],
  ['circle', { cx: '5', cy: '12', r: '1', key: '1pcz8c' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const mx = H('ExternalLink', [
  ['path', { d: 'M15 3h6v6', key: '1q9fwt' }],
  ['path', { d: 'M10 14 21 3', key: 'gplh6r' }],
  [
    'path',
    {
      d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
      key: 'a6xqqp',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Co = H('FileText', [
  [
    'path',
    {
      d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
      key: '1rqfz7',
    },
  ],
  ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
  ['path', { d: 'M10 9H8', key: 'b1mrlr' }],
  ['path', { d: 'M16 13H8', key: 't4e002' }],
  ['path', { d: 'M16 17H8', key: 'z1uh3a' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const px = H('FileUp', [
  [
    'path',
    {
      d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
      key: '1rqfz7',
    },
  ],
  ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
  ['path', { d: 'M12 12v6', key: '3ahymv' }],
  ['path', { d: 'm15 15-3-3-3 3', key: '15xj92' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const oh = H('File', [
  [
    'path',
    {
      d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z',
      key: '1rqfz7',
    },
  ],
  ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const pS = H('FolderKanban', [
  [
    'path',
    {
      d: 'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z',
      key: '1fr9dc',
    },
  ],
  ['path', { d: 'M8 10v4', key: 'tgpxqk' }],
  ['path', { d: 'M12 10v2', key: 'hh53o1' }],
  ['path', { d: 'M16 10v6', key: '1d6xys' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const hS = H('FolderOpen', [
  [
    'path',
    {
      d: 'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2',
      key: 'usdka0',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const gS = H('Gift', [
  ['rect', { x: '3', y: '8', width: '18', height: '4', rx: '1', key: 'bkv52' }],
  ['path', { d: 'M12 8v13', key: '1c76mn' }],
  ['path', { d: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7', key: '6wjy6b' }],
  [
    'path',
    {
      d: 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5',
      key: '1ihvrl',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const hx = H('Image', [
  [
    'rect',
    {
      width: '18',
      height: '18',
      x: '3',
      y: '3',
      rx: '2',
      ry: '2',
      key: '1m3agn',
    },
  ],
  ['circle', { cx: '9', cy: '9', r: '2', key: 'af1f0g' }],
  ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21', key: '1xmnt7' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Kc = H('ListChecks', [
  ['path', { d: 'm3 17 2 2 4-4', key: '1jhpwq' }],
  ['path', { d: 'm3 7 2 2 4-4', key: '1obspn' }],
  ['path', { d: 'M13 6h8', key: '15sg57' }],
  ['path', { d: 'M13 12h8', key: 'h98zly' }],
  ['path', { d: 'M13 18h8', key: 'oe0vm4' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const gx = H('Lock', [
  [
    'rect',
    {
      width: '18',
      height: '11',
      x: '3',
      y: '11',
      rx: '2',
      ry: '2',
      key: '1w4ew1',
    },
  ],
  ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4', key: 'fwvmzm' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const vx = H('MessageCircle', [
  ['path', { d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z', key: 'vv11sd' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Us = H('MessageSquare', [
  [
    'path',
    {
      d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
      key: '1lielz',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const vS = H('Mic', [
  [
    'path',
    {
      d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z',
      key: '131961',
    },
  ],
  ['path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2', key: '1vc78b' }],
  ['line', { x1: '12', x2: '12', y1: '19', y2: '22', key: 'x3vr5v' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xS = H('Pause', [
  [
    'rect',
    { x: '14', y: '4', width: '4', height: '16', rx: '1', key: 'zuxfzm' },
  ],
  [
    'rect',
    { x: '6', y: '4', width: '4', height: '16', rx: '1', key: '1okwgv' },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const jr = H('Pencil', [
  [
    'path',
    {
      d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      key: '1a8usu',
    },
  ],
  ['path', { d: 'm15 5 4 4', key: '1mk7zo' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const aa = H('Play', [
  ['polygon', { points: '6 3 20 12 6 21 6 3', key: '1oa8hb' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const cd = H('Plus', [
  ['path', { d: 'M5 12h14', key: '1ays0h' }],
  ['path', { d: 'M12 5v14', key: 's699le' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const yS = H('Presentation', [
  ['path', { d: 'M2 3h20', key: '91anmk' }],
  ['path', { d: 'M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3', key: '2k9sn8' }],
  ['path', { d: 'm7 21 5-5 5 5', key: 'bip4we' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wS = H('Reply', [
  ['polyline', { points: '9 17 4 12 9 7', key: 'hvgpf2' }],
  ['path', { d: 'M20 18v-2a4 4 0 0 0-4-4H4', key: '5vmcpk' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const $f = H('Rocket', [
  [
    'path',
    {
      d: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z',
      key: 'm3kijz',
    },
  ],
  [
    'path',
    {
      d: 'm12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z',
      key: '1fmvmk',
    },
  ],
  ['path', { d: 'M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0', key: '1f8sc4' }],
  ['path', { d: 'M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5', key: 'qeys4' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const xx = H('Search', [
  ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
  ['path', { d: 'm21 21-4.3-4.3', key: '1qie3q' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const yx = H('Send', [
  [
    'path',
    {
      d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      key: '1ffxy3',
    },
  ],
  ['path', { d: 'm21.854 2.147-10.94 10.939', key: '12cjpa' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ul = H('Sparkles', [
  [
    'path',
    {
      d: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
      key: '4pj2yx',
    },
  ],
  ['path', { d: 'M20 3v4', key: '1olli1' }],
  ['path', { d: 'M22 5h-4', key: '1gvqau' }],
  ['path', { d: 'M4 17v2', key: 'vumght' }],
  ['path', { d: 'M5 18H3', key: 'zchphs' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const wx = H('Star', [
  [
    'path',
    {
      d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
      key: 'r04s7s',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const sh = H('Target', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['circle', { cx: '12', cy: '12', r: '6', key: '1vlfrh' }],
  ['circle', { cx: '12', cy: '12', r: '2', key: '1c9p78' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const bS = H('ThumbsUp', [
  ['path', { d: 'M7 10v12', key: '1qc93n' }],
  [
    'path',
    {
      d: 'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
      key: 'emmmcr',
    },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const NS = H('Ticket', [
  [
    'path',
    {
      d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z',
      key: 'qn84l0',
    },
  ],
  ['path', { d: 'M13 5v2', key: 'dyzc3o' }],
  ['path', { d: 'M13 17v2', key: '1ont0d' }],
  ['path', { d: 'M13 11v2', key: '1wjjxi' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const jS = H('TrendingUp', [
  ['polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17', key: '126l90' }],
  ['polyline', { points: '16 7 22 7 22 13', key: 'kwv8wd' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const bx = H('TriangleAlert', [
  [
    'path',
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      key: 'wmoenq',
    },
  ],
  ['path', { d: 'M12 9v4', key: 'juzpu7' }],
  ['path', { d: 'M12 17h.01', key: 'p32p05' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const no = H('Upload', [
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', key: 'ih7n3h' }],
  ['polyline', { points: '17 8 12 3 7 8', key: 't8dd8p' }],
  ['line', { x1: '12', x2: '12', y1: '3', y2: '15', key: 'widbto' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Do = H('Users', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: '1yyitq' }],
  ['circle', { cx: '9', cy: '7', r: '4', key: 'nufk8' }],
  ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87', key: 'kshegd' }],
  ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75', key: '1da9ce' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Ea = H('Video', [
  [
    'path',
    {
      d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5',
      key: 'ftymec',
    },
  ],
  [
    'rect',
    { x: '2', y: '6', width: '14', height: '12', rx: '2', key: '158x01' },
  ],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const Bl = H('X', [
  ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
  ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
]);
/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const CS = H('Zap', [
    [
      'path',
      {
        d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
        key: '1xq2db',
      },
    ],
  ]),
  zf = '-',
  SS = (e) => {
    const t = kS(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
    return {
      getClassGroupId: (i) => {
        const l = i.split(zf);
        return (l[0] === '' && l.length !== 1 && l.shift(), Nx(l, t) || ES(i));
      },
      getConflictingClassGroupIds: (i, l) => {
        const c = n[i] || [];
        return l && r[i] ? [...c, ...r[i]] : c;
      },
    };
  },
  Nx = (e, t) => {
    var i;
    if (e.length === 0) return t.classGroupId;
    const n = e[0],
      r = t.nextPart.get(n),
      o = r ? Nx(e.slice(1), r) : void 0;
    if (o) return o;
    if (t.validators.length === 0) return;
    const s = e.join(zf);
    return (i = t.validators.find(({ validator: l }) => l(s))) == null
      ? void 0
      : i.classGroupId;
  },
  ah = /^\[(.+)\]$/,
  ES = (e) => {
    if (ah.test(e)) {
      const t = ah.exec(e)[1],
        n = t == null ? void 0 : t.substring(0, t.indexOf(':'));
      if (n) return 'arbitrary..' + n;
    }
  },
  kS = (e) => {
    const { theme: t, prefix: n } = e,
      r = { nextPart: new Map(), validators: [] };
    return (
      TS(Object.entries(e.classGroups), n).forEach(([s, i]) => {
        ud(i, r, s, t);
      }),
      r
    );
  },
  ud = (e, t, n, r) => {
    e.forEach((o) => {
      if (typeof o == 'string') {
        const s = o === '' ? t : ih(t, o);
        s.classGroupId = n;
        return;
      }
      if (typeof o == 'function') {
        if (PS(o)) {
          ud(o(r), t, n, r);
          return;
        }
        t.validators.push({ validator: o, classGroupId: n });
        return;
      }
      Object.entries(o).forEach(([s, i]) => {
        ud(i, ih(t, s), n, r);
      });
    });
  },
  ih = (e, t) => {
    let n = e;
    return (
      t.split(zf).forEach((r) => {
        (n.nextPart.has(r) ||
          n.nextPart.set(r, { nextPart: new Map(), validators: [] }),
          (n = n.nextPart.get(r)));
      }),
      n
    );
  },
  PS = (e) => e.isThemeGetter,
  TS = (e, t) =>
    t
      ? e.map(([n, r]) => {
          const o = r.map((s) =>
            typeof s == 'string'
              ? t + s
              : typeof s == 'object'
                ? Object.fromEntries(
                    Object.entries(s).map(([i, l]) => [t + i, l])
                  )
                : s
          );
          return [n, o];
        })
      : e,
  RS = (e) => {
    if (e < 1) return { get: () => {}, set: () => {} };
    let t = 0,
      n = new Map(),
      r = new Map();
    const o = (s, i) => {
      (n.set(s, i), t++, t > e && ((t = 0), (r = n), (n = new Map())));
    };
    return {
      get(s) {
        let i = n.get(s);
        if (i !== void 0) return i;
        if ((i = r.get(s)) !== void 0) return (o(s, i), i);
      },
      set(s, i) {
        n.has(s) ? n.set(s, i) : o(s, i);
      },
    };
  },
  jx = '!',
  DS = (e) => {
    const { separator: t, experimentalParseClassName: n } = e,
      r = t.length === 1,
      o = t[0],
      s = t.length,
      i = (l) => {
        const c = [];
        let u = 0,
          f = 0,
          m;
        for (let w = 0; w < l.length; w++) {
          let x = l[w];
          if (u === 0) {
            if (x === o && (r || l.slice(w, w + s) === t)) {
              (c.push(l.slice(f, w)), (f = w + s));
              continue;
            }
            if (x === '/') {
              m = w;
              continue;
            }
          }
          x === '[' ? u++ : x === ']' && u--;
        }
        const p = c.length === 0 ? l : l.substring(f),
          h = p.startsWith(jx),
          b = h ? p.substring(1) : p,
          v = m && m > f ? m - f : void 0;
        return {
          modifiers: c,
          hasImportantModifier: h,
          baseClassName: b,
          maybePostfixModifierPosition: v,
        };
      };
    return n ? (l) => n({ className: l, parseClassName: i }) : i;
  },
  MS = (e) => {
    if (e.length <= 1) return e;
    const t = [];
    let n = [];
    return (
      e.forEach((r) => {
        r[0] === '[' ? (t.push(...n.sort(), r), (n = [])) : n.push(r);
      }),
      t.push(...n.sort()),
      t
    );
  },
  AS = (e) => ({ cache: RS(e.cacheSize), parseClassName: DS(e), ...SS(e) }),
  OS = /\s+/,
  _S = (e, t) => {
    const {
        parseClassName: n,
        getClassGroupId: r,
        getConflictingClassGroupIds: o,
      } = t,
      s = [],
      i = e.trim().split(OS);
    let l = '';
    for (let c = i.length - 1; c >= 0; c -= 1) {
      const u = i[c],
        {
          modifiers: f,
          hasImportantModifier: m,
          baseClassName: p,
          maybePostfixModifierPosition: h,
        } = n(u);
      let b = !!h,
        v = r(b ? p.substring(0, h) : p);
      if (!v) {
        if (!b) {
          l = u + (l.length > 0 ? ' ' + l : l);
          continue;
        }
        if (((v = r(p)), !v)) {
          l = u + (l.length > 0 ? ' ' + l : l);
          continue;
        }
        b = !1;
      }
      const w = MS(f).join(':'),
        x = m ? w + jx : w,
        g = x + v;
      if (s.includes(g)) continue;
      s.push(g);
      const y = o(v, b);
      for (let N = 0; N < y.length; ++N) {
        const C = y[N];
        s.push(x + C);
      }
      l = u + (l.length > 0 ? ' ' + l : l);
    }
    return l;
  };
function IS() {
  let e = 0,
    t,
    n,
    r = '';
  for (; e < arguments.length; )
    (t = arguments[e++]) && (n = Cx(t)) && (r && (r += ' '), (r += n));
  return r;
}
const Cx = (e) => {
  if (typeof e == 'string') return e;
  let t,
    n = '';
  for (let r = 0; r < e.length; r++)
    e[r] && (t = Cx(e[r])) && (n && (n += ' '), (n += t));
  return n;
};
function LS(e, ...t) {
  let n,
    r,
    o,
    s = i;
  function i(c) {
    const u = t.reduce((f, m) => m(f), e());
    return ((n = AS(u)), (r = n.cache.get), (o = n.cache.set), (s = l), l(c));
  }
  function l(c) {
    const u = r(c);
    if (u) return u;
    const f = _S(c, n);
    return (o(c, f), f);
  }
  return function () {
    return s(IS.apply(null, arguments));
  };
}
const de = (e) => {
    const t = (n) => n[e] || [];
    return ((t.isThemeGetter = !0), t);
  },
  Sx = /^\[(?:([a-z-]+):)?(.+)\]$/i,
  FS = /^\d+\/\d+$/,
  $S = new Set(['px', 'full', 'screen']),
  zS = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  WS =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  US = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
  BS = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  HS =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  fn = (e) => Mo(e) || $S.has(e) || FS.test(e),
  _n = (e) => as(e, 'length', ZS),
  Mo = (e) => !!e && !Number.isNaN(Number(e)),
  Qc = (e) => as(e, 'number', Mo),
  Ns = (e) => !!e && Number.isInteger(Number(e)),
  VS = (e) => e.endsWith('%') && Mo(e.slice(0, -1)),
  J = (e) => Sx.test(e),
  In = (e) => zS.test(e),
  YS = new Set(['length', 'size', 'percentage']),
  GS = (e) => as(e, YS, Ex),
  KS = (e) => as(e, 'position', Ex),
  QS = new Set(['image', 'url']),
  qS = (e) => as(e, QS, eE),
  XS = (e) => as(e, '', JS),
  js = () => !0,
  as = (e, t, n) => {
    const r = Sx.exec(e);
    return r
      ? r[1]
        ? typeof t == 'string'
          ? r[1] === t
          : t.has(r[1])
        : n(r[2])
      : !1;
  },
  ZS = (e) => WS.test(e) && !US.test(e),
  Ex = () => !1,
  JS = (e) => BS.test(e),
  eE = (e) => HS.test(e),
  tE = () => {
    const e = de('colors'),
      t = de('spacing'),
      n = de('blur'),
      r = de('brightness'),
      o = de('borderColor'),
      s = de('borderRadius'),
      i = de('borderSpacing'),
      l = de('borderWidth'),
      c = de('contrast'),
      u = de('grayscale'),
      f = de('hueRotate'),
      m = de('invert'),
      p = de('gap'),
      h = de('gradientColorStops'),
      b = de('gradientColorStopPositions'),
      v = de('inset'),
      w = de('margin'),
      x = de('opacity'),
      g = de('padding'),
      y = de('saturate'),
      N = de('scale'),
      C = de('sepia'),
      j = de('skew'),
      S = de('space'),
      k = de('translate'),
      M = () => ['auto', 'contain', 'none'],
      D = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'],
      W = () => ['auto', J, t],
      P = () => [J, t],
      U = () => ['', fn, _n],
      _ = () => ['auto', Mo, J],
      Y = () => [
        'bottom',
        'center',
        'left',
        'left-bottom',
        'left-top',
        'right',
        'right-bottom',
        'right-top',
        'top',
      ],
      V = () => ['solid', 'dashed', 'dotted', 'double', 'none'],
      G = () => [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
      ],
      T = () => [
        'start',
        'end',
        'center',
        'between',
        'around',
        'evenly',
        'stretch',
      ],
      E = () => ['', '0', J],
      I = () => [
        'auto',
        'avoid',
        'all',
        'avoid-page',
        'page',
        'left',
        'right',
        'column',
      ],
      B = () => [Mo, J];
    return {
      cacheSize: 500,
      separator: ':',
      theme: {
        colors: [js],
        spacing: [fn, _n],
        blur: ['none', '', In, J],
        brightness: B(),
        borderColor: [e],
        borderRadius: ['none', '', 'full', In, J],
        borderSpacing: P(),
        borderWidth: U(),
        contrast: B(),
        grayscale: E(),
        hueRotate: B(),
        invert: E(),
        gap: P(),
        gradientColorStops: [e],
        gradientColorStopPositions: [VS, _n],
        inset: W(),
        margin: W(),
        opacity: B(),
        padding: P(),
        saturate: B(),
        scale: B(),
        sepia: E(),
        skew: B(),
        space: P(),
        translate: P(),
      },
      classGroups: {
        aspect: [{ aspect: ['auto', 'square', 'video', J] }],
        container: ['container'],
        columns: [{ columns: [In] }],
        'break-after': [{ 'break-after': I() }],
        'break-before': [{ 'break-before': I() }],
        'break-inside': [
          { 'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'] },
        ],
        'box-decoration': [{ 'box-decoration': ['slice', 'clone'] }],
        box: [{ box: ['border', 'content'] }],
        display: [
          'block',
          'inline-block',
          'inline',
          'flex',
          'inline-flex',
          'table',
          'inline-table',
          'table-caption',
          'table-cell',
          'table-column',
          'table-column-group',
          'table-footer-group',
          'table-header-group',
          'table-row-group',
          'table-row',
          'flow-root',
          'grid',
          'inline-grid',
          'contents',
          'list-item',
          'hidden',
        ],
        float: [{ float: ['right', 'left', 'none', 'start', 'end'] }],
        clear: [{ clear: ['left', 'right', 'both', 'none', 'start', 'end'] }],
        isolation: ['isolate', 'isolation-auto'],
        'object-fit': [
          { object: ['contain', 'cover', 'fill', 'none', 'scale-down'] },
        ],
        'object-position': [{ object: [...Y(), J] }],
        overflow: [{ overflow: D() }],
        'overflow-x': [{ 'overflow-x': D() }],
        'overflow-y': [{ 'overflow-y': D() }],
        overscroll: [{ overscroll: M() }],
        'overscroll-x': [{ 'overscroll-x': M() }],
        'overscroll-y': [{ 'overscroll-y': M() }],
        position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
        inset: [{ inset: [v] }],
        'inset-x': [{ 'inset-x': [v] }],
        'inset-y': [{ 'inset-y': [v] }],
        start: [{ start: [v] }],
        end: [{ end: [v] }],
        top: [{ top: [v] }],
        right: [{ right: [v] }],
        bottom: [{ bottom: [v] }],
        left: [{ left: [v] }],
        visibility: ['visible', 'invisible', 'collapse'],
        z: [{ z: ['auto', Ns, J] }],
        basis: [{ basis: W() }],
        'flex-direction': [
          { flex: ['row', 'row-reverse', 'col', 'col-reverse'] },
        ],
        'flex-wrap': [{ flex: ['wrap', 'wrap-reverse', 'nowrap'] }],
        flex: [{ flex: ['1', 'auto', 'initial', 'none', J] }],
        grow: [{ grow: E() }],
        shrink: [{ shrink: E() }],
        order: [{ order: ['first', 'last', 'none', Ns, J] }],
        'grid-cols': [{ 'grid-cols': [js] }],
        'col-start-end': [{ col: ['auto', { span: ['full', Ns, J] }, J] }],
        'col-start': [{ 'col-start': _() }],
        'col-end': [{ 'col-end': _() }],
        'grid-rows': [{ 'grid-rows': [js] }],
        'row-start-end': [{ row: ['auto', { span: [Ns, J] }, J] }],
        'row-start': [{ 'row-start': _() }],
        'row-end': [{ 'row-end': _() }],
        'grid-flow': [
          { 'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'] },
        ],
        'auto-cols': [{ 'auto-cols': ['auto', 'min', 'max', 'fr', J] }],
        'auto-rows': [{ 'auto-rows': ['auto', 'min', 'max', 'fr', J] }],
        gap: [{ gap: [p] }],
        'gap-x': [{ 'gap-x': [p] }],
        'gap-y': [{ 'gap-y': [p] }],
        'justify-content': [{ justify: ['normal', ...T()] }],
        'justify-items': [
          { 'justify-items': ['start', 'end', 'center', 'stretch'] },
        ],
        'justify-self': [
          { 'justify-self': ['auto', 'start', 'end', 'center', 'stretch'] },
        ],
        'align-content': [{ content: ['normal', ...T(), 'baseline'] }],
        'align-items': [
          { items: ['start', 'end', 'center', 'baseline', 'stretch'] },
        ],
        'align-self': [
          { self: ['auto', 'start', 'end', 'center', 'stretch', 'baseline'] },
        ],
        'place-content': [{ 'place-content': [...T(), 'baseline'] }],
        'place-items': [
          { 'place-items': ['start', 'end', 'center', 'baseline', 'stretch'] },
        ],
        'place-self': [
          { 'place-self': ['auto', 'start', 'end', 'center', 'stretch'] },
        ],
        p: [{ p: [g] }],
        px: [{ px: [g] }],
        py: [{ py: [g] }],
        ps: [{ ps: [g] }],
        pe: [{ pe: [g] }],
        pt: [{ pt: [g] }],
        pr: [{ pr: [g] }],
        pb: [{ pb: [g] }],
        pl: [{ pl: [g] }],
        m: [{ m: [w] }],
        mx: [{ mx: [w] }],
        my: [{ my: [w] }],
        ms: [{ ms: [w] }],
        me: [{ me: [w] }],
        mt: [{ mt: [w] }],
        mr: [{ mr: [w] }],
        mb: [{ mb: [w] }],
        ml: [{ ml: [w] }],
        'space-x': [{ 'space-x': [S] }],
        'space-x-reverse': ['space-x-reverse'],
        'space-y': [{ 'space-y': [S] }],
        'space-y-reverse': ['space-y-reverse'],
        w: [{ w: ['auto', 'min', 'max', 'fit', 'svw', 'lvw', 'dvw', J, t] }],
        'min-w': [{ 'min-w': [J, t, 'min', 'max', 'fit'] }],
        'max-w': [
          {
            'max-w': [
              J,
              t,
              'none',
              'full',
              'min',
              'max',
              'fit',
              'prose',
              { screen: [In] },
              In,
            ],
          },
        ],
        h: [{ h: [J, t, 'auto', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] }],
        'min-h': [
          { 'min-h': [J, t, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] },
        ],
        'max-h': [
          { 'max-h': [J, t, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'] },
        ],
        size: [{ size: [J, t, 'auto', 'min', 'max', 'fit'] }],
        'font-size': [{ text: ['base', In, _n] }],
        'font-smoothing': ['antialiased', 'subpixel-antialiased'],
        'font-style': ['italic', 'not-italic'],
        'font-weight': [
          {
            font: [
              'thin',
              'extralight',
              'light',
              'normal',
              'medium',
              'semibold',
              'bold',
              'extrabold',
              'black',
              Qc,
            ],
          },
        ],
        'font-family': [{ font: [js] }],
        'fvn-normal': ['normal-nums'],
        'fvn-ordinal': ['ordinal'],
        'fvn-slashed-zero': ['slashed-zero'],
        'fvn-figure': ['lining-nums', 'oldstyle-nums'],
        'fvn-spacing': ['proportional-nums', 'tabular-nums'],
        'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
        tracking: [
          {
            tracking: [
              'tighter',
              'tight',
              'normal',
              'wide',
              'wider',
              'widest',
              J,
            ],
          },
        ],
        'line-clamp': [{ 'line-clamp': ['none', Mo, Qc] }],
        leading: [
          {
            leading: [
              'none',
              'tight',
              'snug',
              'normal',
              'relaxed',
              'loose',
              fn,
              J,
            ],
          },
        ],
        'list-image': [{ 'list-image': ['none', J] }],
        'list-style-type': [{ list: ['none', 'disc', 'decimal', J] }],
        'list-style-position': [{ list: ['inside', 'outside'] }],
        'placeholder-color': [{ placeholder: [e] }],
        'placeholder-opacity': [{ 'placeholder-opacity': [x] }],
        'text-alignment': [
          { text: ['left', 'center', 'right', 'justify', 'start', 'end'] },
        ],
        'text-color': [{ text: [e] }],
        'text-opacity': [{ 'text-opacity': [x] }],
        'text-decoration': [
          'underline',
          'overline',
          'line-through',
          'no-underline',
        ],
        'text-decoration-style': [{ decoration: [...V(), 'wavy'] }],
        'text-decoration-thickness': [
          { decoration: ['auto', 'from-font', fn, _n] },
        ],
        'underline-offset': [{ 'underline-offset': ['auto', fn, J] }],
        'text-decoration-color': [{ decoration: [e] }],
        'text-transform': [
          'uppercase',
          'lowercase',
          'capitalize',
          'normal-case',
        ],
        'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
        'text-wrap': [{ text: ['wrap', 'nowrap', 'balance', 'pretty'] }],
        indent: [{ indent: P() }],
        'vertical-align': [
          {
            align: [
              'baseline',
              'top',
              'middle',
              'bottom',
              'text-top',
              'text-bottom',
              'sub',
              'super',
              J,
            ],
          },
        ],
        whitespace: [
          {
            whitespace: [
              'normal',
              'nowrap',
              'pre',
              'pre-line',
              'pre-wrap',
              'break-spaces',
            ],
          },
        ],
        break: [{ break: ['normal', 'words', 'all', 'keep'] }],
        hyphens: [{ hyphens: ['none', 'manual', 'auto'] }],
        content: [{ content: ['none', J] }],
        'bg-attachment': [{ bg: ['fixed', 'local', 'scroll'] }],
        'bg-clip': [{ 'bg-clip': ['border', 'padding', 'content', 'text'] }],
        'bg-opacity': [{ 'bg-opacity': [x] }],
        'bg-origin': [{ 'bg-origin': ['border', 'padding', 'content'] }],
        'bg-position': [{ bg: [...Y(), KS] }],
        'bg-repeat': [
          { bg: ['no-repeat', { repeat: ['', 'x', 'y', 'round', 'space'] }] },
        ],
        'bg-size': [{ bg: ['auto', 'cover', 'contain', GS] }],
        'bg-image': [
          {
            bg: [
              'none',
              { 'gradient-to': ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'] },
              qS,
            ],
          },
        ],
        'bg-color': [{ bg: [e] }],
        'gradient-from-pos': [{ from: [b] }],
        'gradient-via-pos': [{ via: [b] }],
        'gradient-to-pos': [{ to: [b] }],
        'gradient-from': [{ from: [h] }],
        'gradient-via': [{ via: [h] }],
        'gradient-to': [{ to: [h] }],
        rounded: [{ rounded: [s] }],
        'rounded-s': [{ 'rounded-s': [s] }],
        'rounded-e': [{ 'rounded-e': [s] }],
        'rounded-t': [{ 'rounded-t': [s] }],
        'rounded-r': [{ 'rounded-r': [s] }],
        'rounded-b': [{ 'rounded-b': [s] }],
        'rounded-l': [{ 'rounded-l': [s] }],
        'rounded-ss': [{ 'rounded-ss': [s] }],
        'rounded-se': [{ 'rounded-se': [s] }],
        'rounded-ee': [{ 'rounded-ee': [s] }],
        'rounded-es': [{ 'rounded-es': [s] }],
        'rounded-tl': [{ 'rounded-tl': [s] }],
        'rounded-tr': [{ 'rounded-tr': [s] }],
        'rounded-br': [{ 'rounded-br': [s] }],
        'rounded-bl': [{ 'rounded-bl': [s] }],
        'border-w': [{ border: [l] }],
        'border-w-x': [{ 'border-x': [l] }],
        'border-w-y': [{ 'border-y': [l] }],
        'border-w-s': [{ 'border-s': [l] }],
        'border-w-e': [{ 'border-e': [l] }],
        'border-w-t': [{ 'border-t': [l] }],
        'border-w-r': [{ 'border-r': [l] }],
        'border-w-b': [{ 'border-b': [l] }],
        'border-w-l': [{ 'border-l': [l] }],
        'border-opacity': [{ 'border-opacity': [x] }],
        'border-style': [{ border: [...V(), 'hidden'] }],
        'divide-x': [{ 'divide-x': [l] }],
        'divide-x-reverse': ['divide-x-reverse'],
        'divide-y': [{ 'divide-y': [l] }],
        'divide-y-reverse': ['divide-y-reverse'],
        'divide-opacity': [{ 'divide-opacity': [x] }],
        'divide-style': [{ divide: V() }],
        'border-color': [{ border: [o] }],
        'border-color-x': [{ 'border-x': [o] }],
        'border-color-y': [{ 'border-y': [o] }],
        'border-color-s': [{ 'border-s': [o] }],
        'border-color-e': [{ 'border-e': [o] }],
        'border-color-t': [{ 'border-t': [o] }],
        'border-color-r': [{ 'border-r': [o] }],
        'border-color-b': [{ 'border-b': [o] }],
        'border-color-l': [{ 'border-l': [o] }],
        'divide-color': [{ divide: [o] }],
        'outline-style': [{ outline: ['', ...V()] }],
        'outline-offset': [{ 'outline-offset': [fn, J] }],
        'outline-w': [{ outline: [fn, _n] }],
        'outline-color': [{ outline: [e] }],
        'ring-w': [{ ring: U() }],
        'ring-w-inset': ['ring-inset'],
        'ring-color': [{ ring: [e] }],
        'ring-opacity': [{ 'ring-opacity': [x] }],
        'ring-offset-w': [{ 'ring-offset': [fn, _n] }],
        'ring-offset-color': [{ 'ring-offset': [e] }],
        shadow: [{ shadow: ['', 'inner', 'none', In, XS] }],
        'shadow-color': [{ shadow: [js] }],
        opacity: [{ opacity: [x] }],
        'mix-blend': [{ 'mix-blend': [...G(), 'plus-lighter', 'plus-darker'] }],
        'bg-blend': [{ 'bg-blend': G() }],
        filter: [{ filter: ['', 'none'] }],
        blur: [{ blur: [n] }],
        brightness: [{ brightness: [r] }],
        contrast: [{ contrast: [c] }],
        'drop-shadow': [{ 'drop-shadow': ['', 'none', In, J] }],
        grayscale: [{ grayscale: [u] }],
        'hue-rotate': [{ 'hue-rotate': [f] }],
        invert: [{ invert: [m] }],
        saturate: [{ saturate: [y] }],
        sepia: [{ sepia: [C] }],
        'backdrop-filter': [{ 'backdrop-filter': ['', 'none'] }],
        'backdrop-blur': [{ 'backdrop-blur': [n] }],
        'backdrop-brightness': [{ 'backdrop-brightness': [r] }],
        'backdrop-contrast': [{ 'backdrop-contrast': [c] }],
        'backdrop-grayscale': [{ 'backdrop-grayscale': [u] }],
        'backdrop-hue-rotate': [{ 'backdrop-hue-rotate': [f] }],
        'backdrop-invert': [{ 'backdrop-invert': [m] }],
        'backdrop-opacity': [{ 'backdrop-opacity': [x] }],
        'backdrop-saturate': [{ 'backdrop-saturate': [y] }],
        'backdrop-sepia': [{ 'backdrop-sepia': [C] }],
        'border-collapse': [{ border: ['collapse', 'separate'] }],
        'border-spacing': [{ 'border-spacing': [i] }],
        'border-spacing-x': [{ 'border-spacing-x': [i] }],
        'border-spacing-y': [{ 'border-spacing-y': [i] }],
        'table-layout': [{ table: ['auto', 'fixed'] }],
        caption: [{ caption: ['top', 'bottom'] }],
        transition: [
          {
            transition: [
              'none',
              'all',
              '',
              'colors',
              'opacity',
              'shadow',
              'transform',
              J,
            ],
          },
        ],
        duration: [{ duration: B() }],
        ease: [{ ease: ['linear', 'in', 'out', 'in-out', J] }],
        delay: [{ delay: B() }],
        animate: [{ animate: ['none', 'spin', 'ping', 'pulse', 'bounce', J] }],
        transform: [{ transform: ['', 'gpu', 'none'] }],
        scale: [{ scale: [N] }],
        'scale-x': [{ 'scale-x': [N] }],
        'scale-y': [{ 'scale-y': [N] }],
        rotate: [{ rotate: [Ns, J] }],
        'translate-x': [{ 'translate-x': [k] }],
        'translate-y': [{ 'translate-y': [k] }],
        'skew-x': [{ 'skew-x': [j] }],
        'skew-y': [{ 'skew-y': [j] }],
        'transform-origin': [
          {
            origin: [
              'center',
              'top',
              'top-right',
              'right',
              'bottom-right',
              'bottom',
              'bottom-left',
              'left',
              'top-left',
              J,
            ],
          },
        ],
        accent: [{ accent: ['auto', e] }],
        appearance: [{ appearance: ['none', 'auto'] }],
        cursor: [
          {
            cursor: [
              'auto',
              'default',
              'pointer',
              'wait',
              'text',
              'move',
              'help',
              'not-allowed',
              'none',
              'context-menu',
              'progress',
              'cell',
              'crosshair',
              'vertical-text',
              'alias',
              'copy',
              'no-drop',
              'grab',
              'grabbing',
              'all-scroll',
              'col-resize',
              'row-resize',
              'n-resize',
              'e-resize',
              's-resize',
              'w-resize',
              'ne-resize',
              'nw-resize',
              'se-resize',
              'sw-resize',
              'ew-resize',
              'ns-resize',
              'nesw-resize',
              'nwse-resize',
              'zoom-in',
              'zoom-out',
              J,
            ],
          },
        ],
        'caret-color': [{ caret: [e] }],
        'pointer-events': [{ 'pointer-events': ['none', 'auto'] }],
        resize: [{ resize: ['none', 'y', 'x', ''] }],
        'scroll-behavior': [{ scroll: ['auto', 'smooth'] }],
        'scroll-m': [{ 'scroll-m': P() }],
        'scroll-mx': [{ 'scroll-mx': P() }],
        'scroll-my': [{ 'scroll-my': P() }],
        'scroll-ms': [{ 'scroll-ms': P() }],
        'scroll-me': [{ 'scroll-me': P() }],
        'scroll-mt': [{ 'scroll-mt': P() }],
        'scroll-mr': [{ 'scroll-mr': P() }],
        'scroll-mb': [{ 'scroll-mb': P() }],
        'scroll-ml': [{ 'scroll-ml': P() }],
        'scroll-p': [{ 'scroll-p': P() }],
        'scroll-px': [{ 'scroll-px': P() }],
        'scroll-py': [{ 'scroll-py': P() }],
        'scroll-ps': [{ 'scroll-ps': P() }],
        'scroll-pe': [{ 'scroll-pe': P() }],
        'scroll-pt': [{ 'scroll-pt': P() }],
        'scroll-pr': [{ 'scroll-pr': P() }],
        'scroll-pb': [{ 'scroll-pb': P() }],
        'scroll-pl': [{ 'scroll-pl': P() }],
        'snap-align': [{ snap: ['start', 'end', 'center', 'align-none'] }],
        'snap-stop': [{ snap: ['normal', 'always'] }],
        'snap-type': [{ snap: ['none', 'x', 'y', 'both'] }],
        'snap-strictness': [{ snap: ['mandatory', 'proximity'] }],
        touch: [{ touch: ['auto', 'none', 'manipulation'] }],
        'touch-x': [{ 'touch-pan': ['x', 'left', 'right'] }],
        'touch-y': [{ 'touch-pan': ['y', 'up', 'down'] }],
        'touch-pz': ['touch-pinch-zoom'],
        select: [{ select: ['none', 'text', 'all', 'auto'] }],
        'will-change': [
          { 'will-change': ['auto', 'scroll', 'contents', 'transform', J] },
        ],
        fill: [{ fill: [e, 'none'] }],
        'stroke-w': [{ stroke: [fn, _n, Qc] }],
        stroke: [{ stroke: [e, 'none'] }],
        sr: ['sr-only', 'not-sr-only'],
        'forced-color-adjust': [{ 'forced-color-adjust': ['auto', 'none'] }],
      },
      conflictingClassGroups: {
        overflow: ['overflow-x', 'overflow-y'],
        overscroll: ['overscroll-x', 'overscroll-y'],
        inset: [
          'inset-x',
          'inset-y',
          'start',
          'end',
          'top',
          'right',
          'bottom',
          'left',
        ],
        'inset-x': ['right', 'left'],
        'inset-y': ['top', 'bottom'],
        flex: ['basis', 'grow', 'shrink'],
        gap: ['gap-x', 'gap-y'],
        p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
        px: ['pr', 'pl'],
        py: ['pt', 'pb'],
        m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
        mx: ['mr', 'ml'],
        my: ['mt', 'mb'],
        size: ['w', 'h'],
        'font-size': ['leading'],
        'fvn-normal': [
          'fvn-ordinal',
          'fvn-slashed-zero',
          'fvn-figure',
          'fvn-spacing',
          'fvn-fraction',
        ],
        'fvn-ordinal': ['fvn-normal'],
        'fvn-slashed-zero': ['fvn-normal'],
        'fvn-figure': ['fvn-normal'],
        'fvn-spacing': ['fvn-normal'],
        'fvn-fraction': ['fvn-normal'],
        'line-clamp': ['display', 'overflow'],
        rounded: [
          'rounded-s',
          'rounded-e',
          'rounded-t',
          'rounded-r',
          'rounded-b',
          'rounded-l',
          'rounded-ss',
          'rounded-se',
          'rounded-ee',
          'rounded-es',
          'rounded-tl',
          'rounded-tr',
          'rounded-br',
          'rounded-bl',
        ],
        'rounded-s': ['rounded-ss', 'rounded-es'],
        'rounded-e': ['rounded-se', 'rounded-ee'],
        'rounded-t': ['rounded-tl', 'rounded-tr'],
        'rounded-r': ['rounded-tr', 'rounded-br'],
        'rounded-b': ['rounded-br', 'rounded-bl'],
        'rounded-l': ['rounded-tl', 'rounded-bl'],
        'border-spacing': ['border-spacing-x', 'border-spacing-y'],
        'border-w': [
          'border-w-s',
          'border-w-e',
          'border-w-t',
          'border-w-r',
          'border-w-b',
          'border-w-l',
        ],
        'border-w-x': ['border-w-r', 'border-w-l'],
        'border-w-y': ['border-w-t', 'border-w-b'],
        'border-color': [
          'border-color-s',
          'border-color-e',
          'border-color-t',
          'border-color-r',
          'border-color-b',
          'border-color-l',
        ],
        'border-color-x': ['border-color-r', 'border-color-l'],
        'border-color-y': ['border-color-t', 'border-color-b'],
        'scroll-m': [
          'scroll-mx',
          'scroll-my',
          'scroll-ms',
          'scroll-me',
          'scroll-mt',
          'scroll-mr',
          'scroll-mb',
          'scroll-ml',
        ],
        'scroll-mx': ['scroll-mr', 'scroll-ml'],
        'scroll-my': ['scroll-mt', 'scroll-mb'],
        'scroll-p': [
          'scroll-px',
          'scroll-py',
          'scroll-ps',
          'scroll-pe',
          'scroll-pt',
          'scroll-pr',
          'scroll-pb',
          'scroll-pl',
        ],
        'scroll-px': ['scroll-pr', 'scroll-pl'],
        'scroll-py': ['scroll-pt', 'scroll-pb'],
        touch: ['touch-x', 'touch-y', 'touch-pz'],
        'touch-x': ['touch'],
        'touch-y': ['touch'],
        'touch-pz': ['touch'],
      },
      conflictingClassGroupModifiers: { 'font-size': ['leading'] },
    };
  },
  nE = LS(tE);
function L(...e) {
  return nE(ax(e));
}
const rE = nS,
  kx = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(J0, {
      ref: n,
      className: L(
        'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
        e
      ),
      ...t,
    })
  );
kx.displayName = J0.displayName;
const oE = Wl(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
      variants: {
        variant: {
          default: 'border bg-background text-foreground',
          destructive:
            'destructive group border-destructive bg-destructive text-destructive-foreground',
        },
      },
      defaultVariants: { variant: 'default' },
    }
  ),
  Px = d.forwardRef(({ className: e, variant: t, ...n }, r) =>
    a.jsx(ex, { ref: r, className: L(oE({ variant: t }), e), ...n })
  );
Px.displayName = ex.displayName;
const sE = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(rx, {
    ref: n,
    className: L(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors group-[.destructive]:border-muted/40 hover:bg-secondary group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-[.destructive]:focus:ring-destructive disabled:pointer-events-none disabled:opacity-50',
      e
    ),
    ...t,
  })
);
sE.displayName = rx.displayName;
const Tx = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(ox, {
    ref: n,
    className: L(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 hover:text-foreground group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      e
    ),
    'toast-close': '',
    ...t,
    children: a.jsx(Bl, { className: 'h-4 w-4' }),
  })
);
Tx.displayName = ox.displayName;
const Rx = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(tx, { ref: n, className: L('text-sm font-semibold', e), ...t })
);
Rx.displayName = tx.displayName;
const Dx = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(nx, { ref: n, className: L('text-sm opacity-90', e), ...t })
);
Dx.displayName = nx.displayName;
function aE() {
  const { toasts: e } = mC();
  return a.jsxs(rE, {
    children: [
      e.map(function ({ id: t, title: n, description: r, action: o, ...s }) {
        return a.jsxs(
          Px,
          {
            ...s,
            children: [
              a.jsxs('div', {
                className: 'grid gap-1',
                children: [
                  n && a.jsx(Rx, { children: n }),
                  r && a.jsx(Dx, { children: r }),
                ],
              }),
              o,
              a.jsx(Tx, {}),
            ],
          },
          t
        );
      }),
      a.jsx(kx, {}),
    ],
  });
}
var lh = ['light', 'dark'],
  iE = '(prefers-color-scheme: dark)',
  lE = d.createContext(void 0),
  cE = { setTheme: (e) => {}, themes: [] },
  uE = () => {
    var e;
    return (e = d.useContext(lE)) != null ? e : cE;
  };
d.memo(
  ({
    forcedTheme: e,
    storageKey: t,
    attribute: n,
    enableSystem: r,
    enableColorScheme: o,
    defaultTheme: s,
    value: i,
    attrs: l,
    nonce: c,
  }) => {
    let u = s === 'system',
      f =
        n === 'class'
          ? `var d=document.documentElement,c=d.classList;${`c.remove(${l.map((b) => `'${b}'`).join(',')})`};`
          : `var d=document.documentElement,n='${n}',s='setAttribute';`,
      m = o
        ? lh.includes(s) && s
          ? `if(e==='light'||e==='dark'||!e)d.style.colorScheme=e||'${s}'`
          : "if(e==='light'||e==='dark')d.style.colorScheme=e"
        : '',
      p = (b, v = !1, w = !0) => {
        let x = i ? i[b] : b,
          g = v ? b + "|| ''" : `'${x}'`,
          y = '';
        return (
          o &&
            w &&
            !v &&
            lh.includes(b) &&
            (y += `d.style.colorScheme = '${b}';`),
          n === 'class'
            ? v || x
              ? (y += `c.add(${g})`)
              : (y += 'null')
            : x && (y += `d[s](n,${g})`),
          y
        );
      },
      h = e
        ? `!function(){${f}${p(e)}}()`
        : r
          ? `!function(){try{${f}var e=localStorage.getItem('${t}');if('system'===e||(!e&&${u})){var t='${iE}',m=window.matchMedia(t);if(m.media!==t||m.matches){${p('dark')}}else{${p('light')}}}else if(e){${i ? `var x=${JSON.stringify(i)};` : ''}${p(i ? 'x[e]' : 'e', !0)}}${u ? '' : 'else{' + p(s, !1, !1) + '}'}${m}}catch(e){}}()`
          : `!function(){try{${f}var e=localStorage.getItem('${t}');if(e){${i ? `var x=${JSON.stringify(i)};` : ''}${p(i ? 'x[e]' : 'e', !0)}}else{${p(s, !1, !1)};}${m}}catch(t){}}();`;
    return d.createElement('script', {
      nonce: c,
      dangerouslySetInnerHTML: { __html: h },
    });
  }
);
var dE = (e) => {
    switch (e) {
      case 'success':
        return pE;
      case 'info':
        return gE;
      case 'warning':
        return hE;
      case 'error':
        return vE;
      default:
        return null;
    }
  },
  fE = Array(12).fill(0),
  mE = ({ visible: e, className: t }) =>
    A.createElement(
      'div',
      {
        className: ['sonner-loading-wrapper', t].filter(Boolean).join(' '),
        'data-visible': e,
      },
      A.createElement(
        'div',
        { className: 'sonner-spinner' },
        fE.map((n, r) =>
          A.createElement('div', {
            className: 'sonner-loading-bar',
            key: `spinner-bar-${r}`,
          })
        )
      )
    ),
  pE = A.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    A.createElement('path', {
      fillRule: 'evenodd',
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z',
      clipRule: 'evenodd',
    })
  ),
  hE = A.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    A.createElement('path', {
      fillRule: 'evenodd',
      d: 'M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z',
      clipRule: 'evenodd',
    })
  ),
  gE = A.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    A.createElement('path', {
      fillRule: 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z',
      clipRule: 'evenodd',
    })
  ),
  vE = A.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 20 20',
      fill: 'currentColor',
      height: '20',
      width: '20',
    },
    A.createElement('path', {
      fillRule: 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z',
      clipRule: 'evenodd',
    })
  ),
  xE = A.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '12',
      height: '12',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    A.createElement('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
    A.createElement('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
  ),
  yE = () => {
    let [e, t] = A.useState(document.hidden);
    return (
      A.useEffect(() => {
        let n = () => {
          t(document.hidden);
        };
        return (
          document.addEventListener('visibilitychange', n),
          () => window.removeEventListener('visibilitychange', n)
        );
      }, []),
      e
    );
  },
  dd = 1,
  wE = class {
    constructor() {
      ((this.subscribe = (e) => (
        this.subscribers.push(e),
        () => {
          let t = this.subscribers.indexOf(e);
          this.subscribers.splice(t, 1);
        }
      )),
        (this.publish = (e) => {
          this.subscribers.forEach((t) => t(e));
        }),
        (this.addToast = (e) => {
          (this.publish(e), (this.toasts = [...this.toasts, e]));
        }),
        (this.create = (e) => {
          var t;
          let { message: n, ...r } = e,
            o =
              typeof (e == null ? void 0 : e.id) == 'number' ||
              ((t = e.id) == null ? void 0 : t.length) > 0
                ? e.id
                : dd++,
            s = this.toasts.find((l) => l.id === o),
            i = e.dismissible === void 0 ? !0 : e.dismissible;
          return (
            this.dismissedToasts.has(o) && this.dismissedToasts.delete(o),
            s
              ? (this.toasts = this.toasts.map((l) =>
                  l.id === o
                    ? (this.publish({ ...l, ...e, id: o, title: n }),
                      { ...l, ...e, id: o, dismissible: i, title: n })
                    : l
                ))
              : this.addToast({ title: n, ...r, dismissible: i, id: o }),
            o
          );
        }),
        (this.dismiss = (e) => (
          this.dismissedToasts.add(e),
          e ||
            this.toasts.forEach((t) => {
              this.subscribers.forEach((n) => n({ id: t.id, dismiss: !0 }));
            }),
          this.subscribers.forEach((t) => t({ id: e, dismiss: !0 })),
          e
        )),
        (this.message = (e, t) => this.create({ ...t, message: e })),
        (this.error = (e, t) =>
          this.create({ ...t, message: e, type: 'error' })),
        (this.success = (e, t) =>
          this.create({ ...t, type: 'success', message: e })),
        (this.info = (e, t) => this.create({ ...t, type: 'info', message: e })),
        (this.warning = (e, t) =>
          this.create({ ...t, type: 'warning', message: e })),
        (this.loading = (e, t) =>
          this.create({ ...t, type: 'loading', message: e })),
        (this.promise = (e, t) => {
          if (!t) return;
          let n;
          t.loading !== void 0 &&
            (n = this.create({
              ...t,
              promise: e,
              type: 'loading',
              message: t.loading,
              description:
                typeof t.description != 'function' ? t.description : void 0,
            }));
          let r = e instanceof Promise ? e : e(),
            o = n !== void 0,
            s,
            i = r
              .then(async (c) => {
                if (((s = ['resolve', c]), A.isValidElement(c)))
                  ((o = !1),
                    this.create({ id: n, type: 'default', message: c }));
                else if (NE(c) && !c.ok) {
                  o = !1;
                  let u =
                      typeof t.error == 'function'
                        ? await t.error(`HTTP error! status: ${c.status}`)
                        : t.error,
                    f =
                      typeof t.description == 'function'
                        ? await t.description(`HTTP error! status: ${c.status}`)
                        : t.description;
                  this.create({
                    id: n,
                    type: 'error',
                    message: u,
                    description: f,
                  });
                } else if (t.success !== void 0) {
                  o = !1;
                  let u =
                      typeof t.success == 'function'
                        ? await t.success(c)
                        : t.success,
                    f =
                      typeof t.description == 'function'
                        ? await t.description(c)
                        : t.description;
                  this.create({
                    id: n,
                    type: 'success',
                    message: u,
                    description: f,
                  });
                }
              })
              .catch(async (c) => {
                if (((s = ['reject', c]), t.error !== void 0)) {
                  o = !1;
                  let u =
                      typeof t.error == 'function' ? await t.error(c) : t.error,
                    f =
                      typeof t.description == 'function'
                        ? await t.description(c)
                        : t.description;
                  this.create({
                    id: n,
                    type: 'error',
                    message: u,
                    description: f,
                  });
                }
              })
              .finally(() => {
                var c;
                (o && (this.dismiss(n), (n = void 0)),
                  (c = t.finally) == null || c.call(t));
              }),
            l = () =>
              new Promise((c, u) =>
                i.then(() => (s[0] === 'reject' ? u(s[1]) : c(s[1]))).catch(u)
              );
          return typeof n != 'string' && typeof n != 'number'
            ? { unwrap: l }
            : Object.assign(n, { unwrap: l });
        }),
        (this.custom = (e, t) => {
          let n = (t == null ? void 0 : t.id) || dd++;
          return (this.create({ jsx: e(n), id: n, ...t }), n);
        }),
        (this.getActiveToasts = () =>
          this.toasts.filter((e) => !this.dismissedToasts.has(e.id))),
        (this.subscribers = []),
        (this.toasts = []),
        (this.dismissedToasts = new Set()));
    }
  },
  Xe = new wE(),
  bE = (e, t) => {
    let n = (t == null ? void 0 : t.id) || dd++;
    return (Xe.addToast({ title: e, ...t, id: n }), n);
  },
  NE = (e) =>
    e &&
    typeof e == 'object' &&
    'ok' in e &&
    typeof e.ok == 'boolean' &&
    'status' in e &&
    typeof e.status == 'number',
  jE = bE,
  CE = () => Xe.toasts,
  SE = () => Xe.getActiveToasts();
Object.assign(
  jE,
  {
    success: Xe.success,
    info: Xe.info,
    warning: Xe.warning,
    error: Xe.error,
    custom: Xe.custom,
    message: Xe.message,
    promise: Xe.promise,
    dismiss: Xe.dismiss,
    loading: Xe.loading,
  },
  { getHistory: CE, getToasts: SE }
);
function EE(e, { insertAt: t } = {}) {
  if (typeof document > 'u') return;
  let n = document.head || document.getElementsByTagName('head')[0],
    r = document.createElement('style');
  ((r.type = 'text/css'),
    t === 'top' && n.firstChild
      ? n.insertBefore(r, n.firstChild)
      : n.appendChild(r),
    r.styleSheet
      ? (r.styleSheet.cssText = e)
      : r.appendChild(document.createTextNode(e)));
}
EE(`:where(html[dir="ltr"]),:where([data-sonner-toaster][dir="ltr"]){--toast-icon-margin-start: -3px;--toast-icon-margin-end: 4px;--toast-svg-margin-start: -1px;--toast-svg-margin-end: 0px;--toast-button-margin-start: auto;--toast-button-margin-end: 0;--toast-close-button-start: 0;--toast-close-button-end: unset;--toast-close-button-transform: translate(-35%, -35%)}:where(html[dir="rtl"]),:where([data-sonner-toaster][dir="rtl"]){--toast-icon-margin-start: 4px;--toast-icon-margin-end: -3px;--toast-svg-margin-start: 0px;--toast-svg-margin-end: -1px;--toast-button-margin-start: 0;--toast-button-margin-end: auto;--toast-close-button-start: unset;--toast-close-button-end: 0;--toast-close-button-transform: translate(35%, -35%)}:where([data-sonner-toaster]){position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: 8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999;transition:transform .4s ease}:where([data-sonner-toaster][data-lifted="true"]){transform:translateY(-10px)}@media (hover: none) and (pointer: coarse){:where([data-sonner-toaster][data-lifted="true"]){transform:none}}:where([data-sonner-toaster][data-x-position="right"]){right:var(--offset-right)}:where([data-sonner-toaster][data-x-position="left"]){left:var(--offset-left)}:where([data-sonner-toaster][data-x-position="center"]){left:50%;transform:translate(-50%)}:where([data-sonner-toaster][data-y-position="top"]){top:var(--offset-top)}:where([data-sonner-toaster][data-y-position="bottom"]){bottom:var(--offset-bottom)}:where([data-sonner-toast]){--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}:where([data-sonner-toast][data-styled="true"]){padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}:where([data-sonner-toast]:focus-visible){box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast][data-y-position="top"]){top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}:where([data-sonner-toast][data-y-position="bottom"]){bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}:where([data-sonner-toast]) :where([data-description]){font-weight:400;line-height:1.4;color:inherit}:where([data-sonner-toast]) :where([data-title]){font-weight:500;line-height:1.5;color:inherit}:where([data-sonner-toast]) :where([data-icon]){display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}:where([data-sonner-toast][data-promise="true"]) :where([data-icon])>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}:where([data-sonner-toast]) :where([data-icon])>*{flex-shrink:0}:where([data-sonner-toast]) :where([data-icon]) svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}:where([data-sonner-toast]) :where([data-content]){display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}:where([data-sonner-toast]) :where([data-button]):focus-visible{box-shadow:0 0 0 2px #0006}:where([data-sonner-toast]) :where([data-button]):first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}:where([data-sonner-toast]) :where([data-cancel]){color:var(--normal-text);background:rgba(0,0,0,.08)}:where([data-sonner-toast][data-theme="dark"]) :where([data-cancel]){background:rgba(255,255,255,.3)}:where([data-sonner-toast]) :where([data-close-button]){position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]{background:var(--gray1)}:where([data-sonner-toast]) :where([data-close-button]):focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}:where([data-sonner-toast]) :where([data-disabled="true"]){cursor:not-allowed}:where([data-sonner-toast]):hover :where([data-close-button]):hover{background:var(--gray2);border-color:var(--gray5)}:where([data-sonner-toast][data-swiping="true"]):before{content:"";position:absolute;left:-50%;right:-50%;height:100%;z-index:-1}:where([data-sonner-toast][data-y-position="top"][data-swiping="true"]):before{bottom:50%;transform:scaleY(3) translateY(50%)}:where([data-sonner-toast][data-y-position="bottom"][data-swiping="true"]):before{top:50%;transform:scaleY(3) translateY(-50%)}:where([data-sonner-toast][data-swiping="false"][data-removed="true"]):before{content:"";position:absolute;inset:0;transform:scaleY(2)}:where([data-sonner-toast]):after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}:where([data-sonner-toast][data-mounted="true"]){--y: translateY(0);opacity:1}:where([data-sonner-toast][data-expanded="false"][data-front="false"]){--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}:where([data-sonner-toast])>*{transition:opacity .4s}:where([data-sonner-toast][data-expanded="false"][data-front="false"][data-styled="true"])>*{opacity:0}:where([data-sonner-toast][data-visible="false"]){opacity:0;pointer-events:none}:where([data-sonner-toast][data-mounted="true"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}:where([data-sonner-toast][data-removed="true"][data-front="true"][data-swipe-out="false"]){--y: translateY(calc(var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="true"]){--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}:where([data-sonner-toast][data-removed="true"][data-front="false"][data-swipe-out="false"][data-expanded="false"]){--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}:where([data-sonner-toast][data-removed="true"][data-front="false"]):before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y, 0px)) translate(var(--swipe-amount-x, 0px));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{0%{transform:var(--y) translate(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translate(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{0%{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width: 600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: #fff;--normal-border: var(--gray4);--normal-text: var(--gray12);--success-bg: hsl(143, 85%, 96%);--success-border: hsl(145, 92%, 91%);--success-text: hsl(140, 100%, 27%);--info-bg: hsl(208, 100%, 97%);--info-border: hsl(221, 91%, 91%);--info-text: hsl(210, 92%, 45%);--warning-bg: hsl(49, 100%, 97%);--warning-border: hsl(49, 91%, 91%);--warning-text: hsl(31, 92%, 45%);--error-bg: hsl(359, 100%, 97%);--error-border: hsl(359, 100%, 94%);--error-text: hsl(360, 100%, 45%)}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: #000;--normal-border: hsl(0, 0%, 20%);--normal-text: var(--gray1)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: #fff;--normal-border: var(--gray3);--normal-text: var(--gray12)}[data-sonner-toaster][data-theme=dark]{--normal-bg: #000;--normal-bg-hover: hsl(0, 0%, 12%);--normal-border: hsl(0, 0%, 20%);--normal-border-hover: hsl(0, 0%, 25%);--normal-text: var(--gray1);--success-bg: hsl(150, 100%, 6%);--success-border: hsl(147, 100%, 12%);--success-text: hsl(150, 86%, 65%);--info-bg: hsl(215, 100%, 6%);--info-border: hsl(223, 100%, 12%);--info-text: hsl(216, 87%, 65%);--warning-bg: hsl(64, 100%, 6%);--warning-border: hsl(60, 100%, 12%);--warning-text: hsl(46, 87%, 65%);--error-bg: hsl(358, 76%, 10%);--error-border: hsl(357, 89%, 16%);--error-text: hsl(358, 100%, 81%)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success],[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info],[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning],[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error],[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media (prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}
`);
function Ja(e) {
  return e.label !== void 0;
}
var kE = 3,
  PE = '32px',
  TE = '16px',
  ch = 4e3,
  RE = 356,
  DE = 14,
  ME = 20,
  AE = 200;
function Tt(...e) {
  return e.filter(Boolean).join(' ');
}
function OE(e) {
  let [t, n] = e.split('-'),
    r = [];
  return (t && r.push(t), n && r.push(n), r);
}
var _E = (e) => {
  var t, n, r, o, s, i, l, c, u, f, m;
  let {
      invert: p,
      toast: h,
      unstyled: b,
      interacting: v,
      setHeights: w,
      visibleToasts: x,
      heights: g,
      index: y,
      toasts: N,
      expanded: C,
      removeToast: j,
      defaultRichColors: S,
      closeButton: k,
      style: M,
      cancelButtonStyle: D,
      actionButtonStyle: W,
      className: P = '',
      descriptionClassName: U = '',
      duration: _,
      position: Y,
      gap: V,
      loadingIcon: G,
      expandByDefault: T,
      classNames: E,
      icons: I,
      closeButtonAriaLabel: B = 'Close toast',
      pauseWhenPageIsHidden: z,
    } = e,
    [Q, Z] = A.useState(null),
    [ue, he] = A.useState(null),
    [ee, ft] = A.useState(!1),
    [Ce, rt] = A.useState(!1),
    [jt, dn] = A.useState(!1),
    [qe, yr] = A.useState(!1),
    [ds, Xr] = A.useState(!1),
    [fs, wr] = A.useState(0),
    [Ct, Am] = A.useState(0),
    ms = A.useRef(h.duration || _ || ch),
    Om = A.useRef(null),
    br = A.useRef(null),
    k2 = y === 0,
    P2 = y + 1 <= x,
    mt = h.type,
    Zr = h.dismissible !== !1,
    T2 = h.className || '',
    R2 = h.descriptionClassName || '',
    Ma = A.useMemo(
      () => g.findIndex((q) => q.toastId === h.id) || 0,
      [g, h.id]
    ),
    D2 = A.useMemo(() => {
      var q;
      return (q = h.closeButton) != null ? q : k;
    }, [h.closeButton, k]),
    _m = A.useMemo(() => h.duration || _ || ch, [h.duration, _]),
    gc = A.useRef(0),
    Jr = A.useRef(0),
    Im = A.useRef(0),
    eo = A.useRef(null),
    [M2, A2] = Y.split('-'),
    Lm = A.useMemo(
      () => g.reduce((q, le, ge) => (ge >= Ma ? q : q + le.height), 0),
      [g, Ma]
    ),
    Fm = yE(),
    O2 = h.invert || p,
    vc = mt === 'loading';
  ((Jr.current = A.useMemo(() => Ma * V + Lm, [Ma, Lm])),
    A.useEffect(() => {
      ms.current = _m;
    }, [_m]),
    A.useEffect(() => {
      ft(!0);
    }, []),
    A.useEffect(() => {
      let q = br.current;
      if (q) {
        let le = q.getBoundingClientRect().height;
        return (
          Am(le),
          w((ge) => [
            { toastId: h.id, height: le, position: h.position },
            ...ge,
          ]),
          () => w((ge) => ge.filter((St) => St.toastId !== h.id))
        );
      }
    }, [w, h.id]),
    A.useLayoutEffect(() => {
      if (!ee) return;
      let q = br.current,
        le = q.style.height;
      q.style.height = 'auto';
      let ge = q.getBoundingClientRect().height;
      ((q.style.height = le),
        Am(ge),
        w((St) =>
          St.find((Et) => Et.toastId === h.id)
            ? St.map((Et) => (Et.toastId === h.id ? { ...Et, height: ge } : Et))
            : [{ toastId: h.id, height: ge, position: h.position }, ...St]
        ));
    }, [ee, h.title, h.description, w, h.id]));
  let Dn = A.useCallback(() => {
    (rt(!0),
      wr(Jr.current),
      w((q) => q.filter((le) => le.toastId !== h.id)),
      setTimeout(() => {
        j(h);
      }, AE));
  }, [h, j, w, Jr]);
  (A.useEffect(() => {
    if (
      (h.promise && mt === 'loading') ||
      h.duration === 1 / 0 ||
      h.type === 'loading'
    )
      return;
    let q;
    return (
      C || v || (z && Fm)
        ? (() => {
            if (Im.current < gc.current) {
              let le = new Date().getTime() - gc.current;
              ms.current = ms.current - le;
            }
            Im.current = new Date().getTime();
          })()
        : ms.current !== 1 / 0 &&
          ((gc.current = new Date().getTime()),
          (q = setTimeout(() => {
            var le;
            ((le = h.onAutoClose) == null || le.call(h, h), Dn());
          }, ms.current))),
      () => clearTimeout(q)
    );
  }, [C, v, h, mt, z, Fm, Dn]),
    A.useEffect(() => {
      h.delete && Dn();
    }, [Dn, h.delete]));
  function _2() {
    var q, le, ge;
    return I != null && I.loading
      ? A.createElement(
          'div',
          {
            className: Tt(
              E == null ? void 0 : E.loader,
              (q = h == null ? void 0 : h.classNames) == null
                ? void 0
                : q.loader,
              'sonner-loader'
            ),
            'data-visible': mt === 'loading',
          },
          I.loading
        )
      : G
        ? A.createElement(
            'div',
            {
              className: Tt(
                E == null ? void 0 : E.loader,
                (le = h == null ? void 0 : h.classNames) == null
                  ? void 0
                  : le.loader,
                'sonner-loader'
              ),
              'data-visible': mt === 'loading',
            },
            G
          )
        : A.createElement(mE, {
            className: Tt(
              E == null ? void 0 : E.loader,
              (ge = h == null ? void 0 : h.classNames) == null
                ? void 0
                : ge.loader
            ),
            visible: mt === 'loading',
          });
  }
  return A.createElement(
    'li',
    {
      tabIndex: 0,
      ref: br,
      className: Tt(
        P,
        T2,
        E == null ? void 0 : E.toast,
        (t = h == null ? void 0 : h.classNames) == null ? void 0 : t.toast,
        E == null ? void 0 : E.default,
        E == null ? void 0 : E[mt],
        (n = h == null ? void 0 : h.classNames) == null ? void 0 : n[mt]
      ),
      'data-sonner-toast': '',
      'data-rich-colors': (r = h.richColors) != null ? r : S,
      'data-styled': !(h.jsx || h.unstyled || b),
      'data-mounted': ee,
      'data-promise': !!h.promise,
      'data-swiped': ds,
      'data-removed': Ce,
      'data-visible': P2,
      'data-y-position': M2,
      'data-x-position': A2,
      'data-index': y,
      'data-front': k2,
      'data-swiping': jt,
      'data-dismissible': Zr,
      'data-type': mt,
      'data-invert': O2,
      'data-swipe-out': qe,
      'data-swipe-direction': ue,
      'data-expanded': !!(C || (T && ee)),
      style: {
        '--index': y,
        '--toasts-before': y,
        '--z-index': N.length - y,
        '--offset': `${Ce ? fs : Jr.current}px`,
        '--initial-height': T ? 'auto' : `${Ct}px`,
        ...M,
        ...h.style,
      },
      onDragEnd: () => {
        (dn(!1), Z(null), (eo.current = null));
      },
      onPointerDown: (q) => {
        vc ||
          !Zr ||
          ((Om.current = new Date()),
          wr(Jr.current),
          q.target.setPointerCapture(q.pointerId),
          q.target.tagName !== 'BUTTON' &&
            (dn(!0), (eo.current = { x: q.clientX, y: q.clientY })));
      },
      onPointerUp: () => {
        var q, le, ge, St;
        if (qe || !Zr) return;
        eo.current = null;
        let Et = Number(
            ((q = br.current) == null
              ? void 0
              : q.style
                  .getPropertyValue('--swipe-amount-x')
                  .replace('px', '')) || 0
          ),
          Mn = Number(
            ((le = br.current) == null
              ? void 0
              : le.style
                  .getPropertyValue('--swipe-amount-y')
                  .replace('px', '')) || 0
          ),
          Nr =
            new Date().getTime() -
            ((ge = Om.current) == null ? void 0 : ge.getTime()),
          kt = Q === 'x' ? Et : Mn,
          An = Math.abs(kt) / Nr;
        if (Math.abs(kt) >= ME || An > 0.11) {
          (wr(Jr.current),
            (St = h.onDismiss) == null || St.call(h, h),
            he(
              Q === 'x' ? (Et > 0 ? 'right' : 'left') : Mn > 0 ? 'down' : 'up'
            ),
            Dn(),
            yr(!0),
            Xr(!1));
          return;
        }
        (dn(!1), Z(null));
      },
      onPointerMove: (q) => {
        var le, ge, St, Et;
        if (
          !eo.current ||
          !Zr ||
          ((le = window.getSelection()) == null
            ? void 0
            : le.toString().length) > 0
        )
          return;
        let Mn = q.clientY - eo.current.y,
          Nr = q.clientX - eo.current.x,
          kt = (ge = e.swipeDirections) != null ? ge : OE(Y);
        !Q &&
          (Math.abs(Nr) > 1 || Math.abs(Mn) > 1) &&
          Z(Math.abs(Nr) > Math.abs(Mn) ? 'x' : 'y');
        let An = { x: 0, y: 0 };
        (Q === 'y'
          ? (kt.includes('top') || kt.includes('bottom')) &&
            ((kt.includes('top') && Mn < 0) ||
              (kt.includes('bottom') && Mn > 0)) &&
            (An.y = Mn)
          : Q === 'x' &&
            (kt.includes('left') || kt.includes('right')) &&
            ((kt.includes('left') && Nr < 0) ||
              (kt.includes('right') && Nr > 0)) &&
            (An.x = Nr),
          (Math.abs(An.x) > 0 || Math.abs(An.y) > 0) && Xr(!0),
          (St = br.current) == null ||
            St.style.setProperty('--swipe-amount-x', `${An.x}px`),
          (Et = br.current) == null ||
            Et.style.setProperty('--swipe-amount-y', `${An.y}px`));
      },
    },
    D2 && !h.jsx
      ? A.createElement(
          'button',
          {
            'aria-label': B,
            'data-disabled': vc,
            'data-close-button': !0,
            onClick:
              vc || !Zr
                ? () => {}
                : () => {
                    var q;
                    (Dn(), (q = h.onDismiss) == null || q.call(h, h));
                  },
            className: Tt(
              E == null ? void 0 : E.closeButton,
              (o = h == null ? void 0 : h.classNames) == null
                ? void 0
                : o.closeButton
            ),
          },
          (s = I == null ? void 0 : I.close) != null ? s : xE
        )
      : null,
    h.jsx || d.isValidElement(h.title)
      ? h.jsx
        ? h.jsx
        : typeof h.title == 'function'
          ? h.title()
          : h.title
      : A.createElement(
          A.Fragment,
          null,
          mt || h.icon || h.promise
            ? A.createElement(
                'div',
                {
                  'data-icon': '',
                  className: Tt(
                    E == null ? void 0 : E.icon,
                    (i = h == null ? void 0 : h.classNames) == null
                      ? void 0
                      : i.icon
                  ),
                },
                h.promise || (h.type === 'loading' && !h.icon)
                  ? h.icon || _2()
                  : null,
                h.type !== 'loading'
                  ? h.icon || (I == null ? void 0 : I[mt]) || dE(mt)
                  : null
              )
            : null,
          A.createElement(
            'div',
            {
              'data-content': '',
              className: Tt(
                E == null ? void 0 : E.content,
                (l = h == null ? void 0 : h.classNames) == null
                  ? void 0
                  : l.content
              ),
            },
            A.createElement(
              'div',
              {
                'data-title': '',
                className: Tt(
                  E == null ? void 0 : E.title,
                  (c = h == null ? void 0 : h.classNames) == null
                    ? void 0
                    : c.title
                ),
              },
              typeof h.title == 'function' ? h.title() : h.title
            ),
            h.description
              ? A.createElement(
                  'div',
                  {
                    'data-description': '',
                    className: Tt(
                      U,
                      R2,
                      E == null ? void 0 : E.description,
                      (u = h == null ? void 0 : h.classNames) == null
                        ? void 0
                        : u.description
                    ),
                  },
                  typeof h.description == 'function'
                    ? h.description()
                    : h.description
                )
              : null
          ),
          d.isValidElement(h.cancel)
            ? h.cancel
            : h.cancel && Ja(h.cancel)
              ? A.createElement(
                  'button',
                  {
                    'data-button': !0,
                    'data-cancel': !0,
                    style: h.cancelButtonStyle || D,
                    onClick: (q) => {
                      var le, ge;
                      Ja(h.cancel) &&
                        Zr &&
                        ((ge = (le = h.cancel).onClick) == null ||
                          ge.call(le, q),
                        Dn());
                    },
                    className: Tt(
                      E == null ? void 0 : E.cancelButton,
                      (f = h == null ? void 0 : h.classNames) == null
                        ? void 0
                        : f.cancelButton
                    ),
                  },
                  h.cancel.label
                )
              : null,
          d.isValidElement(h.action)
            ? h.action
            : h.action && Ja(h.action)
              ? A.createElement(
                  'button',
                  {
                    'data-button': !0,
                    'data-action': !0,
                    style: h.actionButtonStyle || W,
                    onClick: (q) => {
                      var le, ge;
                      Ja(h.action) &&
                        ((ge = (le = h.action).onClick) == null ||
                          ge.call(le, q),
                        !q.defaultPrevented && Dn());
                    },
                    className: Tt(
                      E == null ? void 0 : E.actionButton,
                      (m = h == null ? void 0 : h.classNames) == null
                        ? void 0
                        : m.actionButton
                    ),
                  },
                  h.action.label
                )
              : null
        )
  );
};
function uh() {
  if (typeof window > 'u' || typeof document > 'u') return 'ltr';
  let e = document.documentElement.getAttribute('dir');
  return e === 'auto' || !e
    ? window.getComputedStyle(document.documentElement).direction
    : e;
}
function IE(e, t) {
  let n = {};
  return (
    [e, t].forEach((r, o) => {
      let s = o === 1,
        i = s ? '--mobile-offset' : '--offset',
        l = s ? TE : PE;
      function c(u) {
        ['top', 'right', 'bottom', 'left'].forEach((f) => {
          n[`${i}-${f}`] = typeof u == 'number' ? `${u}px` : u;
        });
      }
      typeof r == 'number' || typeof r == 'string'
        ? c(r)
        : typeof r == 'object'
          ? ['top', 'right', 'bottom', 'left'].forEach((u) => {
              r[u] === void 0
                ? (n[`${i}-${u}`] = l)
                : (n[`${i}-${u}`] =
                    typeof r[u] == 'number' ? `${r[u]}px` : r[u]);
            })
          : c(l);
    }),
    n
  );
}
var LE = d.forwardRef(function (e, t) {
  let {
      invert: n,
      position: r = 'bottom-right',
      hotkey: o = ['altKey', 'KeyT'],
      expand: s,
      closeButton: i,
      className: l,
      offset: c,
      mobileOffset: u,
      theme: f = 'light',
      richColors: m,
      duration: p,
      style: h,
      visibleToasts: b = kE,
      toastOptions: v,
      dir: w = uh(),
      gap: x = DE,
      loadingIcon: g,
      icons: y,
      containerAriaLabel: N = 'Notifications',
      pauseWhenPageIsHidden: C,
    } = e,
    [j, S] = A.useState([]),
    k = A.useMemo(
      () =>
        Array.from(
          new Set(
            [r].concat(j.filter((z) => z.position).map((z) => z.position))
          )
        ),
      [j, r]
    ),
    [M, D] = A.useState([]),
    [W, P] = A.useState(!1),
    [U, _] = A.useState(!1),
    [Y, V] = A.useState(
      f !== 'system'
        ? f
        : typeof window < 'u' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    ),
    G = A.useRef(null),
    T = o.join('+').replace(/Key/g, '').replace(/Digit/g, ''),
    E = A.useRef(null),
    I = A.useRef(!1),
    B = A.useCallback((z) => {
      S((Q) => {
        var Z;
        return (
          ((Z = Q.find((ue) => ue.id === z.id)) != null && Z.delete) ||
            Xe.dismiss(z.id),
          Q.filter(({ id: ue }) => ue !== z.id)
        );
      });
    }, []);
  return (
    A.useEffect(
      () =>
        Xe.subscribe((z) => {
          if (z.dismiss) {
            S((Q) => Q.map((Z) => (Z.id === z.id ? { ...Z, delete: !0 } : Z)));
            return;
          }
          setTimeout(() => {
            D0.flushSync(() => {
              S((Q) => {
                let Z = Q.findIndex((ue) => ue.id === z.id);
                return Z !== -1
                  ? [...Q.slice(0, Z), { ...Q[Z], ...z }, ...Q.slice(Z + 1)]
                  : [z, ...Q];
              });
            });
          });
        }),
      []
    ),
    A.useEffect(() => {
      if (f !== 'system') {
        V(f);
        return;
      }
      if (
        (f === 'system' &&
          (window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
            ? V('dark')
            : V('light')),
        typeof window > 'u')
      )
        return;
      let z = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        z.addEventListener('change', ({ matches: Q }) => {
          V(Q ? 'dark' : 'light');
        });
      } catch {
        z.addListener(({ matches: Z }) => {
          try {
            V(Z ? 'dark' : 'light');
          } catch (ue) {
            console.error(ue);
          }
        });
      }
    }, [f]),
    A.useEffect(() => {
      j.length <= 1 && P(!1);
    }, [j]),
    A.useEffect(() => {
      let z = (Q) => {
        var Z, ue;
        (o.every((he) => Q[he] || Q.code === he) &&
          (P(!0), (Z = G.current) == null || Z.focus()),
          Q.code === 'Escape' &&
            (document.activeElement === G.current ||
              ((ue = G.current) != null &&
                ue.contains(document.activeElement))) &&
            P(!1));
      };
      return (
        document.addEventListener('keydown', z),
        () => document.removeEventListener('keydown', z)
      );
    }, [o]),
    A.useEffect(() => {
      if (G.current)
        return () => {
          E.current &&
            (E.current.focus({ preventScroll: !0 }),
            (E.current = null),
            (I.current = !1));
        };
    }, [G.current]),
    A.createElement(
      'section',
      {
        ref: t,
        'aria-label': `${N} ${T}`,
        tabIndex: -1,
        'aria-live': 'polite',
        'aria-relevant': 'additions text',
        'aria-atomic': 'false',
        suppressHydrationWarning: !0,
      },
      k.map((z, Q) => {
        var Z;
        let [ue, he] = z.split('-');
        return j.length
          ? A.createElement(
              'ol',
              {
                key: z,
                dir: w === 'auto' ? uh() : w,
                tabIndex: -1,
                ref: G,
                className: l,
                'data-sonner-toaster': !0,
                'data-theme': Y,
                'data-y-position': ue,
                'data-lifted': W && j.length > 1 && !s,
                'data-x-position': he,
                style: {
                  '--front-toast-height': `${((Z = M[0]) == null ? void 0 : Z.height) || 0}px`,
                  '--width': `${RE}px`,
                  '--gap': `${x}px`,
                  ...h,
                  ...IE(c, u),
                },
                onBlur: (ee) => {
                  I.current &&
                    !ee.currentTarget.contains(ee.relatedTarget) &&
                    ((I.current = !1),
                    E.current &&
                      (E.current.focus({ preventScroll: !0 }),
                      (E.current = null)));
                },
                onFocus: (ee) => {
                  (ee.target instanceof HTMLElement &&
                    ee.target.dataset.dismissible === 'false') ||
                    I.current ||
                    ((I.current = !0), (E.current = ee.relatedTarget));
                },
                onMouseEnter: () => P(!0),
                onMouseMove: () => P(!0),
                onMouseLeave: () => {
                  U || P(!1);
                },
                onDragEnd: () => P(!1),
                onPointerDown: (ee) => {
                  (ee.target instanceof HTMLElement &&
                    ee.target.dataset.dismissible === 'false') ||
                    _(!0);
                },
                onPointerUp: () => _(!1),
              },
              j
                .filter((ee) => (!ee.position && Q === 0) || ee.position === z)
                .map((ee, ft) => {
                  var Ce, rt;
                  return A.createElement(_E, {
                    key: ee.id,
                    icons: y,
                    index: ft,
                    toast: ee,
                    defaultRichColors: m,
                    duration:
                      (Ce = v == null ? void 0 : v.duration) != null ? Ce : p,
                    className: v == null ? void 0 : v.className,
                    descriptionClassName:
                      v == null ? void 0 : v.descriptionClassName,
                    invert: n,
                    visibleToasts: b,
                    closeButton:
                      (rt = v == null ? void 0 : v.closeButton) != null
                        ? rt
                        : i,
                    interacting: U,
                    position: z,
                    style: v == null ? void 0 : v.style,
                    unstyled: v == null ? void 0 : v.unstyled,
                    classNames: v == null ? void 0 : v.classNames,
                    cancelButtonStyle: v == null ? void 0 : v.cancelButtonStyle,
                    actionButtonStyle: v == null ? void 0 : v.actionButtonStyle,
                    removeToast: B,
                    toasts: j.filter((jt) => jt.position == ee.position),
                    heights: M.filter((jt) => jt.position == ee.position),
                    setHeights: D,
                    expandByDefault: s,
                    gap: x,
                    loadingIcon: g,
                    expanded: W,
                    pauseWhenPageIsHidden: C,
                    swipeDirections: e.swipeDirections,
                  });
                })
            )
          : null;
      })
    )
  );
});
const FE = ({ ...e }) => {
  const { theme: t = 'system' } = uE();
  return a.jsx(LE, {
    theme: t,
    className: 'toaster group',
    toastOptions: {
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton:
          'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton:
          'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
      },
    },
    ...e,
  });
};
function gn(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function (o) {
    if ((e == null || e(o), n === !1 || !o.defaultPrevented))
      return t == null ? void 0 : t(o);
  };
}
var $E = 'DismissableLayer',
  fd = 'dismissableLayer.update',
  zE = 'dismissableLayer.pointerDownOutside',
  WE = 'dismissableLayer.focusOutside',
  dh,
  Mx = d.createContext({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set(),
  }),
  Ax = d.forwardRef((e, t) => {
    const {
        disableOutsidePointerEvents: n = !1,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: s,
        onInteractOutside: i,
        onDismiss: l,
        ...c
      } = e,
      u = d.useContext(Mx),
      [f, m] = d.useState(null),
      p =
        (f == null ? void 0 : f.ownerDocument) ??
        (globalThis == null ? void 0 : globalThis.document),
      [, h] = d.useState({}),
      b = se(t, (S) => m(S)),
      v = Array.from(u.layers),
      [w] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1),
      x = v.indexOf(w),
      g = f ? v.indexOf(f) : -1,
      y = u.layersWithOutsidePointerEventsDisabled.size > 0,
      N = g >= x,
      C = HE((S) => {
        const k = S.target,
          M = [...u.branches].some((D) => D.contains(k));
        !N ||
          M ||
          (o == null || o(S),
          i == null || i(S),
          S.defaultPrevented || l == null || l());
      }, p),
      j = VE((S) => {
        const k = S.target;
        [...u.branches].some((D) => D.contains(k)) ||
          (s == null || s(S),
          i == null || i(S),
          S.defaultPrevented || l == null || l());
      }, p);
    return (
      I0((S) => {
        g === u.layers.size - 1 &&
          (r == null || r(S),
          !S.defaultPrevented && l && (S.preventDefault(), l()));
      }, p),
      d.useEffect(() => {
        if (f)
          return (
            n &&
              (u.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((dh = p.body.style.pointerEvents),
                (p.body.style.pointerEvents = 'none')),
              u.layersWithOutsidePointerEventsDisabled.add(f)),
            u.layers.add(f),
            fh(),
            () => {
              n &&
                u.layersWithOutsidePointerEventsDisabled.size === 1 &&
                (p.body.style.pointerEvents = dh);
            }
          );
      }, [f, p, n, u]),
      d.useEffect(
        () => () => {
          f &&
            (u.layers.delete(f),
            u.layersWithOutsidePointerEventsDisabled.delete(f),
            fh());
        },
        [f, u]
      ),
      d.useEffect(() => {
        const S = () => h({});
        return (
          document.addEventListener(fd, S),
          () => document.removeEventListener(fd, S)
        );
      }, []),
      a.jsx(K.div, {
        ...c,
        ref: b,
        style: {
          pointerEvents: y ? (N ? 'auto' : 'none') : void 0,
          ...e.style,
        },
        onFocusCapture: gn(e.onFocusCapture, j.onFocusCapture),
        onBlurCapture: gn(e.onBlurCapture, j.onBlurCapture),
        onPointerDownCapture: gn(
          e.onPointerDownCapture,
          C.onPointerDownCapture
        ),
      })
    );
  });
Ax.displayName = $E;
var UE = 'DismissableLayerBranch',
  BE = d.forwardRef((e, t) => {
    const n = d.useContext(Mx),
      r = d.useRef(null),
      o = se(t, r);
    return (
      d.useEffect(() => {
        const s = r.current;
        if (s)
          return (
            n.branches.add(s),
            () => {
              n.branches.delete(s);
            }
          );
      }, [n.branches]),
      a.jsx(K.div, { ...e, ref: o })
    );
  });
BE.displayName = UE;
function HE(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Oe(e),
    r = d.useRef(!1),
    o = d.useRef(() => {});
  return (
    d.useEffect(() => {
      const s = (l) => {
          if (l.target && !r.current) {
            let c = function () {
              Ox(zE, n, u, { discrete: !0 });
            };
            const u = { originalEvent: l };
            l.pointerType === 'touch'
              ? (t.removeEventListener('click', o.current),
                (o.current = c),
                t.addEventListener('click', o.current, { once: !0 }))
              : c();
          } else t.removeEventListener('click', o.current);
          r.current = !1;
        },
        i = window.setTimeout(() => {
          t.addEventListener('pointerdown', s);
        }, 0);
      return () => {
        (window.clearTimeout(i),
          t.removeEventListener('pointerdown', s),
          t.removeEventListener('click', o.current));
      };
    }, [t, n]),
    { onPointerDownCapture: () => (r.current = !0) }
  );
}
function VE(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = Oe(e),
    r = d.useRef(!1);
  return (
    d.useEffect(() => {
      const o = (s) => {
        s.target &&
          !r.current &&
          Ox(WE, n, { originalEvent: s }, { discrete: !1 });
      };
      return (
        t.addEventListener('focusin', o),
        () => t.removeEventListener('focusin', o)
      );
    }, [t, n]),
    {
      onFocusCapture: () => (r.current = !0),
      onBlurCapture: () => (r.current = !1),
    }
  );
}
function fh() {
  const e = new CustomEvent(fd);
  document.dispatchEvent(e);
}
function Ox(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target,
    s = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  (t && o.addEventListener(e, t, { once: !0 }),
    r ? Ll(o, s) : o.dispatchEvent(s));
}
var YE = Wd[' useId '.trim().toString()] || (() => {}),
  GE = 0;
function sn(e) {
  const [t, n] = d.useState(YE());
  return (
    _e(() => {
      n((r) => r ?? String(GE++));
    }, [e]),
    t ? `radix-${t}` : ''
  );
}
const KE = ['top', 'right', 'bottom', 'left'],
  dr = Math.min,
  st = Math.max,
  el = Math.round,
  ei = Math.floor,
  an = (e) => ({ x: e, y: e }),
  QE = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
  qE = { start: 'end', end: 'start' };
function md(e, t, n) {
  return st(e, dr(t, n));
}
function kn(e, t) {
  return typeof e == 'function' ? e(t) : e;
}
function Pn(e) {
  return e.split('-')[0];
}
function is(e) {
  return e.split('-')[1];
}
function Wf(e) {
  return e === 'x' ? 'y' : 'x';
}
function Uf(e) {
  return e === 'y' ? 'height' : 'width';
}
const XE = new Set(['top', 'bottom']);
function nn(e) {
  return XE.has(Pn(e)) ? 'y' : 'x';
}
function Bf(e) {
  return Wf(nn(e));
}
function ZE(e, t, n) {
  n === void 0 && (n = !1);
  const r = is(e),
    o = Bf(e),
    s = Uf(o);
  let i =
    o === 'x'
      ? r === (n ? 'end' : 'start')
        ? 'right'
        : 'left'
      : r === 'start'
        ? 'bottom'
        : 'top';
  return (t.reference[s] > t.floating[s] && (i = tl(i)), [i, tl(i)]);
}
function JE(e) {
  const t = tl(e);
  return [pd(e), t, pd(t)];
}
function pd(e) {
  return e.replace(/start|end/g, (t) => qE[t]);
}
const mh = ['left', 'right'],
  ph = ['right', 'left'],
  ek = ['top', 'bottom'],
  tk = ['bottom', 'top'];
function nk(e, t, n) {
  switch (e) {
    case 'top':
    case 'bottom':
      return n ? (t ? ph : mh) : t ? mh : ph;
    case 'left':
    case 'right':
      return t ? ek : tk;
    default:
      return [];
  }
}
function rk(e, t, n, r) {
  const o = is(e);
  let s = nk(Pn(e), n === 'start', r);
  return (
    o && ((s = s.map((i) => i + '-' + o)), t && (s = s.concat(s.map(pd)))),
    s
  );
}
function tl(e) {
  return e.replace(/left|right|bottom|top/g, (t) => QE[t]);
}
function ok(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function _x(e) {
  return typeof e != 'number'
    ? ok(e)
    : { top: e, right: e, bottom: e, left: e };
}
function nl(e) {
  const { x: t, y: n, width: r, height: o } = e;
  return {
    width: r,
    height: o,
    top: n,
    left: t,
    right: t + r,
    bottom: n + o,
    x: t,
    y: n,
  };
}
function hh(e, t, n) {
  let { reference: r, floating: o } = e;
  const s = nn(t),
    i = Bf(t),
    l = Uf(i),
    c = Pn(t),
    u = s === 'y',
    f = r.x + r.width / 2 - o.width / 2,
    m = r.y + r.height / 2 - o.height / 2,
    p = r[l] / 2 - o[l] / 2;
  let h;
  switch (c) {
    case 'top':
      h = { x: f, y: r.y - o.height };
      break;
    case 'bottom':
      h = { x: f, y: r.y + r.height };
      break;
    case 'right':
      h = { x: r.x + r.width, y: m };
      break;
    case 'left':
      h = { x: r.x - o.width, y: m };
      break;
    default:
      h = { x: r.x, y: r.y };
  }
  switch (is(t)) {
    case 'start':
      h[i] -= p * (n && u ? -1 : 1);
      break;
    case 'end':
      h[i] += p * (n && u ? -1 : 1);
      break;
  }
  return h;
}
const sk = async (e, t, n) => {
  const {
      placement: r = 'bottom',
      strategy: o = 'absolute',
      middleware: s = [],
      platform: i,
    } = n,
    l = s.filter(Boolean),
    c = await (i.isRTL == null ? void 0 : i.isRTL(t));
  let u = await i.getElementRects({ reference: e, floating: t, strategy: o }),
    { x: f, y: m } = hh(u, r, c),
    p = r,
    h = {},
    b = 0;
  for (let v = 0; v < l.length; v++) {
    const { name: w, fn: x } = l[v],
      {
        x: g,
        y,
        data: N,
        reset: C,
      } = await x({
        x: f,
        y: m,
        initialPlacement: r,
        placement: p,
        strategy: o,
        middlewareData: h,
        rects: u,
        platform: i,
        elements: { reference: e, floating: t },
      });
    ((f = g ?? f),
      (m = y ?? m),
      (h = { ...h, [w]: { ...h[w], ...N } }),
      C &&
        b <= 50 &&
        (b++,
        typeof C == 'object' &&
          (C.placement && (p = C.placement),
          C.rects &&
            (u =
              C.rects === !0
                ? await i.getElementRects({
                    reference: e,
                    floating: t,
                    strategy: o,
                  })
                : C.rects),
          ({ x: f, y: m } = hh(u, p, c))),
        (v = -1)));
  }
  return { x: f, y: m, placement: p, strategy: o, middlewareData: h };
};
async function ia(e, t) {
  var n;
  t === void 0 && (t = {});
  const { x: r, y: o, platform: s, rects: i, elements: l, strategy: c } = e,
    {
      boundary: u = 'clippingAncestors',
      rootBoundary: f = 'viewport',
      elementContext: m = 'floating',
      altBoundary: p = !1,
      padding: h = 0,
    } = kn(t, e),
    b = _x(h),
    w = l[p ? (m === 'floating' ? 'reference' : 'floating') : m],
    x = nl(
      await s.getClippingRect({
        element:
          (n = await (s.isElement == null ? void 0 : s.isElement(w))) == null ||
          n
            ? w
            : w.contextElement ||
              (await (s.getDocumentElement == null
                ? void 0
                : s.getDocumentElement(l.floating))),
        boundary: u,
        rootBoundary: f,
        strategy: c,
      })
    ),
    g =
      m === 'floating'
        ? { x: r, y: o, width: i.floating.width, height: i.floating.height }
        : i.reference,
    y = await (s.getOffsetParent == null
      ? void 0
      : s.getOffsetParent(l.floating)),
    N = (await (s.isElement == null ? void 0 : s.isElement(y)))
      ? (await (s.getScale == null ? void 0 : s.getScale(y))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    C = nl(
      s.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: l,
            rect: g,
            offsetParent: y,
            strategy: c,
          })
        : g
    );
  return {
    top: (x.top - C.top + b.top) / N.y,
    bottom: (C.bottom - x.bottom + b.bottom) / N.y,
    left: (x.left - C.left + b.left) / N.x,
    right: (C.right - x.right + b.right) / N.x,
  };
}
const ak = (e) => ({
    name: 'arrow',
    options: e,
    async fn(t) {
      const {
          x: n,
          y: r,
          placement: o,
          rects: s,
          platform: i,
          elements: l,
          middlewareData: c,
        } = t,
        { element: u, padding: f = 0 } = kn(e, t) || {};
      if (u == null) return {};
      const m = _x(f),
        p = { x: n, y: r },
        h = Bf(o),
        b = Uf(h),
        v = await i.getDimensions(u),
        w = h === 'y',
        x = w ? 'top' : 'left',
        g = w ? 'bottom' : 'right',
        y = w ? 'clientHeight' : 'clientWidth',
        N = s.reference[b] + s.reference[h] - p[h] - s.floating[b],
        C = p[h] - s.reference[h],
        j = await (i.getOffsetParent == null ? void 0 : i.getOffsetParent(u));
      let S = j ? j[y] : 0;
      (!S || !(await (i.isElement == null ? void 0 : i.isElement(j)))) &&
        (S = l.floating[y] || s.floating[b]);
      const k = N / 2 - C / 2,
        M = S / 2 - v[b] / 2 - 1,
        D = dr(m[x], M),
        W = dr(m[g], M),
        P = D,
        U = S - v[b] - W,
        _ = S / 2 - v[b] / 2 + k,
        Y = md(P, _, U),
        V =
          !c.arrow &&
          is(o) != null &&
          _ !== Y &&
          s.reference[b] / 2 - (_ < P ? D : W) - v[b] / 2 < 0,
        G = V ? (_ < P ? _ - P : _ - U) : 0;
      return {
        [h]: p[h] + G,
        data: {
          [h]: Y,
          centerOffset: _ - Y - G,
          ...(V && { alignmentOffset: G }),
        },
        reset: V,
      };
    },
  }),
  ik = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'flip',
        options: e,
        async fn(t) {
          var n, r;
          const {
              placement: o,
              middlewareData: s,
              rects: i,
              initialPlacement: l,
              platform: c,
              elements: u,
            } = t,
            {
              mainAxis: f = !0,
              crossAxis: m = !0,
              fallbackPlacements: p,
              fallbackStrategy: h = 'bestFit',
              fallbackAxisSideDirection: b = 'none',
              flipAlignment: v = !0,
              ...w
            } = kn(e, t);
          if ((n = s.arrow) != null && n.alignmentOffset) return {};
          const x = Pn(o),
            g = nn(l),
            y = Pn(l) === l,
            N = await (c.isRTL == null ? void 0 : c.isRTL(u.floating)),
            C = p || (y || !v ? [tl(l)] : JE(l)),
            j = b !== 'none';
          !p && j && C.push(...rk(l, v, b, N));
          const S = [l, ...C],
            k = await ia(t, w),
            M = [];
          let D = ((r = s.flip) == null ? void 0 : r.overflows) || [];
          if ((f && M.push(k[x]), m)) {
            const _ = ZE(o, i, N);
            M.push(k[_[0]], k[_[1]]);
          }
          if (
            ((D = [...D, { placement: o, overflows: M }]),
            !M.every((_) => _ <= 0))
          ) {
            var W, P;
            const _ = (((W = s.flip) == null ? void 0 : W.index) || 0) + 1,
              Y = S[_];
            if (
              Y &&
              (!(m === 'alignment' ? g !== nn(Y) : !1) ||
                D.every((T) => T.overflows[0] > 0 && nn(T.placement) === g))
            )
              return {
                data: { index: _, overflows: D },
                reset: { placement: Y },
              };
            let V =
              (P = D.filter((G) => G.overflows[0] <= 0).sort(
                (G, T) => G.overflows[1] - T.overflows[1]
              )[0]) == null
                ? void 0
                : P.placement;
            if (!V)
              switch (h) {
                case 'bestFit': {
                  var U;
                  const G =
                    (U = D.filter((T) => {
                      if (j) {
                        const E = nn(T.placement);
                        return E === g || E === 'y';
                      }
                      return !0;
                    })
                      .map((T) => [
                        T.placement,
                        T.overflows
                          .filter((E) => E > 0)
                          .reduce((E, I) => E + I, 0),
                      ])
                      .sort((T, E) => T[1] - E[1])[0]) == null
                      ? void 0
                      : U[0];
                  G && (V = G);
                  break;
                }
                case 'initialPlacement':
                  V = l;
                  break;
              }
            if (o !== V) return { reset: { placement: V } };
          }
          return {};
        },
      }
    );
  };
function gh(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  };
}
function vh(e) {
  return KE.some((t) => e[t] >= 0);
}
const lk = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'hide',
        options: e,
        async fn(t) {
          const { rects: n } = t,
            { strategy: r = 'referenceHidden', ...o } = kn(e, t);
          switch (r) {
            case 'referenceHidden': {
              const s = await ia(t, { ...o, elementContext: 'reference' }),
                i = gh(s, n.reference);
              return {
                data: { referenceHiddenOffsets: i, referenceHidden: vh(i) },
              };
            }
            case 'escaped': {
              const s = await ia(t, { ...o, altBoundary: !0 }),
                i = gh(s, n.floating);
              return { data: { escapedOffsets: i, escaped: vh(i) } };
            }
            default:
              return {};
          }
        },
      }
    );
  },
  Ix = new Set(['left', 'top']);
async function ck(e, t) {
  const { placement: n, platform: r, elements: o } = e,
    s = await (r.isRTL == null ? void 0 : r.isRTL(o.floating)),
    i = Pn(n),
    l = is(n),
    c = nn(n) === 'y',
    u = Ix.has(i) ? -1 : 1,
    f = s && c ? -1 : 1,
    m = kn(t, e);
  let {
    mainAxis: p,
    crossAxis: h,
    alignmentAxis: b,
  } = typeof m == 'number'
    ? { mainAxis: m, crossAxis: 0, alignmentAxis: null }
    : {
        mainAxis: m.mainAxis || 0,
        crossAxis: m.crossAxis || 0,
        alignmentAxis: m.alignmentAxis,
      };
  return (
    l && typeof b == 'number' && (h = l === 'end' ? b * -1 : b),
    c ? { x: h * f, y: p * u } : { x: p * u, y: h * f }
  );
}
const uk = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: 'offset',
        options: e,
        async fn(t) {
          var n, r;
          const { x: o, y: s, placement: i, middlewareData: l } = t,
            c = await ck(t, e);
          return i === ((n = l.offset) == null ? void 0 : n.placement) &&
            (r = l.arrow) != null &&
            r.alignmentOffset
            ? {}
            : { x: o + c.x, y: s + c.y, data: { ...c, placement: i } };
        },
      }
    );
  },
  dk = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'shift',
        options: e,
        async fn(t) {
          const { x: n, y: r, placement: o } = t,
            {
              mainAxis: s = !0,
              crossAxis: i = !1,
              limiter: l = {
                fn: (w) => {
                  let { x, y: g } = w;
                  return { x, y: g };
                },
              },
              ...c
            } = kn(e, t),
            u = { x: n, y: r },
            f = await ia(t, c),
            m = nn(Pn(o)),
            p = Wf(m);
          let h = u[p],
            b = u[m];
          if (s) {
            const w = p === 'y' ? 'top' : 'left',
              x = p === 'y' ? 'bottom' : 'right',
              g = h + f[w],
              y = h - f[x];
            h = md(g, h, y);
          }
          if (i) {
            const w = m === 'y' ? 'top' : 'left',
              x = m === 'y' ? 'bottom' : 'right',
              g = b + f[w],
              y = b - f[x];
            b = md(g, b, y);
          }
          const v = l.fn({ ...t, [p]: h, [m]: b });
          return {
            ...v,
            data: { x: v.x - n, y: v.y - r, enabled: { [p]: s, [m]: i } },
          };
        },
      }
    );
  },
  fk = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        options: e,
        fn(t) {
          const { x: n, y: r, placement: o, rects: s, middlewareData: i } = t,
            { offset: l = 0, mainAxis: c = !0, crossAxis: u = !0 } = kn(e, t),
            f = { x: n, y: r },
            m = nn(o),
            p = Wf(m);
          let h = f[p],
            b = f[m];
          const v = kn(l, t),
            w =
              typeof v == 'number'
                ? { mainAxis: v, crossAxis: 0 }
                : { mainAxis: 0, crossAxis: 0, ...v };
          if (c) {
            const y = p === 'y' ? 'height' : 'width',
              N = s.reference[p] - s.floating[y] + w.mainAxis,
              C = s.reference[p] + s.reference[y] - w.mainAxis;
            h < N ? (h = N) : h > C && (h = C);
          }
          if (u) {
            var x, g;
            const y = p === 'y' ? 'width' : 'height',
              N = Ix.has(Pn(o)),
              C =
                s.reference[m] -
                s.floating[y] +
                ((N && ((x = i.offset) == null ? void 0 : x[m])) || 0) +
                (N ? 0 : w.crossAxis),
              j =
                s.reference[m] +
                s.reference[y] +
                (N ? 0 : ((g = i.offset) == null ? void 0 : g[m]) || 0) -
                (N ? w.crossAxis : 0);
            b < C ? (b = C) : b > j && (b = j);
          }
          return { [p]: h, [m]: b };
        },
      }
    );
  },
  mk = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'size',
        options: e,
        async fn(t) {
          var n, r;
          const { placement: o, rects: s, platform: i, elements: l } = t,
            { apply: c = () => {}, ...u } = kn(e, t),
            f = await ia(t, u),
            m = Pn(o),
            p = is(o),
            h = nn(o) === 'y',
            { width: b, height: v } = s.floating;
          let w, x;
          m === 'top' || m === 'bottom'
            ? ((w = m),
              (x =
                p ===
                ((await (i.isRTL == null ? void 0 : i.isRTL(l.floating)))
                  ? 'start'
                  : 'end')
                  ? 'left'
                  : 'right'))
            : ((x = m), (w = p === 'end' ? 'top' : 'bottom'));
          const g = v - f.top - f.bottom,
            y = b - f.left - f.right,
            N = dr(v - f[w], g),
            C = dr(b - f[x], y),
            j = !t.middlewareData.shift;
          let S = N,
            k = C;
          if (
            ((n = t.middlewareData.shift) != null && n.enabled.x && (k = y),
            (r = t.middlewareData.shift) != null && r.enabled.y && (S = g),
            j && !p)
          ) {
            const D = st(f.left, 0),
              W = st(f.right, 0),
              P = st(f.top, 0),
              U = st(f.bottom, 0);
            h
              ? (k = b - 2 * (D !== 0 || W !== 0 ? D + W : st(f.left, f.right)))
              : (S =
                  v - 2 * (P !== 0 || U !== 0 ? P + U : st(f.top, f.bottom)));
          }
          await c({ ...t, availableWidth: k, availableHeight: S });
          const M = await i.getDimensions(l.floating);
          return b !== M.width || v !== M.height
            ? { reset: { rects: !0 } }
            : {};
        },
      }
    );
  };
function Hl() {
  return typeof window < 'u';
}
function ls(e) {
  return Lx(e) ? (e.nodeName || '').toLowerCase() : '#document';
}
function lt(e) {
  var t;
  return (
    (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) ||
    window
  );
}
function un(e) {
  var t;
  return (t = (Lx(e) ? e.ownerDocument : e.document) || window.document) == null
    ? void 0
    : t.documentElement;
}
function Lx(e) {
  return Hl() ? e instanceof Node || e instanceof lt(e).Node : !1;
}
function zt(e) {
  return Hl() ? e instanceof Element || e instanceof lt(e).Element : !1;
}
function ln(e) {
  return Hl() ? e instanceof HTMLElement || e instanceof lt(e).HTMLElement : !1;
}
function xh(e) {
  return !Hl() || typeof ShadowRoot > 'u'
    ? !1
    : e instanceof ShadowRoot || e instanceof lt(e).ShadowRoot;
}
const pk = new Set(['inline', 'contents']);
function ka(e) {
  const { overflow: t, overflowX: n, overflowY: r, display: o } = Wt(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !pk.has(o);
}
const hk = new Set(['table', 'td', 'th']);
function gk(e) {
  return hk.has(ls(e));
}
const vk = [':popover-open', ':modal'];
function Vl(e) {
  return vk.some((t) => {
    try {
      return e.matches(t);
    } catch {
      return !1;
    }
  });
}
const xk = ['transform', 'translate', 'scale', 'rotate', 'perspective'],
  yk = ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'],
  wk = ['paint', 'layout', 'strict', 'content'];
function Hf(e) {
  const t = Vf(),
    n = zt(e) ? Wt(e) : e;
  return (
    xk.some((r) => (n[r] ? n[r] !== 'none' : !1)) ||
    (n.containerType ? n.containerType !== 'normal' : !1) ||
    (!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
    (!t && (n.filter ? n.filter !== 'none' : !1)) ||
    yk.some((r) => (n.willChange || '').includes(r)) ||
    wk.some((r) => (n.contain || '').includes(r))
  );
}
function bk(e) {
  let t = fr(e);
  for (; ln(t) && !Jo(t); ) {
    if (Hf(t)) return t;
    if (Vl(t)) return null;
    t = fr(t);
  }
  return null;
}
function Vf() {
  return typeof CSS > 'u' || !CSS.supports
    ? !1
    : CSS.supports('-webkit-backdrop-filter', 'none');
}
const Nk = new Set(['html', 'body', '#document']);
function Jo(e) {
  return Nk.has(ls(e));
}
function Wt(e) {
  return lt(e).getComputedStyle(e);
}
function Yl(e) {
  return zt(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function fr(e) {
  if (ls(e) === 'html') return e;
  const t = e.assignedSlot || e.parentNode || (xh(e) && e.host) || un(e);
  return xh(t) ? t.host : t;
}
function Fx(e) {
  const t = fr(e);
  return Jo(t)
    ? e.ownerDocument
      ? e.ownerDocument.body
      : e.body
    : ln(t) && ka(t)
      ? t
      : Fx(t);
}
function la(e, t, n) {
  var r;
  (t === void 0 && (t = []), n === void 0 && (n = !0));
  const o = Fx(e),
    s = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
    i = lt(o);
  if (s) {
    const l = hd(i);
    return t.concat(
      i,
      i.visualViewport || [],
      ka(o) ? o : [],
      l && n ? la(l) : []
    );
  }
  return t.concat(o, la(o, [], n));
}
function hd(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function $x(e) {
  const t = Wt(e);
  let n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0;
  const o = ln(e),
    s = o ? e.offsetWidth : n,
    i = o ? e.offsetHeight : r,
    l = el(n) !== s || el(r) !== i;
  return (l && ((n = s), (r = i)), { width: n, height: r, $: l });
}
function Yf(e) {
  return zt(e) ? e : e.contextElement;
}
function Ao(e) {
  const t = Yf(e);
  if (!ln(t)) return an(1);
  const n = t.getBoundingClientRect(),
    { width: r, height: o, $: s } = $x(t);
  let i = (s ? el(n.width) : n.width) / r,
    l = (s ? el(n.height) : n.height) / o;
  return (
    (!i || !Number.isFinite(i)) && (i = 1),
    (!l || !Number.isFinite(l)) && (l = 1),
    { x: i, y: l }
  );
}
const jk = an(0);
function zx(e) {
  const t = lt(e);
  return !Vf() || !t.visualViewport
    ? jk
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function Ck(e, t, n) {
  return (t === void 0 && (t = !1), !n || (t && n !== lt(e)) ? !1 : t);
}
function Vr(e, t, n, r) {
  (t === void 0 && (t = !1), n === void 0 && (n = !1));
  const o = e.getBoundingClientRect(),
    s = Yf(e);
  let i = an(1);
  t && (r ? zt(r) && (i = Ao(r)) : (i = Ao(e)));
  const l = Ck(s, n, r) ? zx(s) : an(0);
  let c = (o.left + l.x) / i.x,
    u = (o.top + l.y) / i.y,
    f = o.width / i.x,
    m = o.height / i.y;
  if (s) {
    const p = lt(s),
      h = r && zt(r) ? lt(r) : r;
    let b = p,
      v = hd(b);
    for (; v && r && h !== b; ) {
      const w = Ao(v),
        x = v.getBoundingClientRect(),
        g = Wt(v),
        y = x.left + (v.clientLeft + parseFloat(g.paddingLeft)) * w.x,
        N = x.top + (v.clientTop + parseFloat(g.paddingTop)) * w.y;
      ((c *= w.x),
        (u *= w.y),
        (f *= w.x),
        (m *= w.y),
        (c += y),
        (u += N),
        (b = lt(v)),
        (v = hd(b)));
    }
  }
  return nl({ width: f, height: m, x: c, y: u });
}
function Gf(e, t) {
  const n = Yl(e).scrollLeft;
  return t ? t.left + n : Vr(un(e)).left + n;
}
function Wx(e, t, n) {
  n === void 0 && (n = !1);
  const r = e.getBoundingClientRect(),
    o = r.left + t.scrollLeft - (n ? 0 : Gf(e, r)),
    s = r.top + t.scrollTop;
  return { x: o, y: s };
}
function Sk(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: o } = e;
  const s = o === 'fixed',
    i = un(r),
    l = t ? Vl(t.floating) : !1;
  if (r === i || (l && s)) return n;
  let c = { scrollLeft: 0, scrollTop: 0 },
    u = an(1);
  const f = an(0),
    m = ln(r);
  if (
    (m || (!m && !s)) &&
    ((ls(r) !== 'body' || ka(i)) && (c = Yl(r)), ln(r))
  ) {
    const h = Vr(r);
    ((u = Ao(r)), (f.x = h.x + r.clientLeft), (f.y = h.y + r.clientTop));
  }
  const p = i && !m && !s ? Wx(i, c, !0) : an(0);
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - c.scrollLeft * u.x + f.x + p.x,
    y: n.y * u.y - c.scrollTop * u.y + f.y + p.y,
  };
}
function Ek(e) {
  return Array.from(e.getClientRects());
}
function kk(e) {
  const t = un(e),
    n = Yl(e),
    r = e.ownerDocument.body,
    o = st(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
    s = st(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let i = -n.scrollLeft + Gf(e);
  const l = -n.scrollTop;
  return (
    Wt(r).direction === 'rtl' && (i += st(t.clientWidth, r.clientWidth) - o),
    { width: o, height: s, x: i, y: l }
  );
}
function Pk(e, t) {
  const n = lt(e),
    r = un(e),
    o = n.visualViewport;
  let s = r.clientWidth,
    i = r.clientHeight,
    l = 0,
    c = 0;
  if (o) {
    ((s = o.width), (i = o.height));
    const u = Vf();
    (!u || (u && t === 'fixed')) && ((l = o.offsetLeft), (c = o.offsetTop));
  }
  return { width: s, height: i, x: l, y: c };
}
const Tk = new Set(['absolute', 'fixed']);
function Rk(e, t) {
  const n = Vr(e, !0, t === 'fixed'),
    r = n.top + e.clientTop,
    o = n.left + e.clientLeft,
    s = ln(e) ? Ao(e) : an(1),
    i = e.clientWidth * s.x,
    l = e.clientHeight * s.y,
    c = o * s.x,
    u = r * s.y;
  return { width: i, height: l, x: c, y: u };
}
function yh(e, t, n) {
  let r;
  if (t === 'viewport') r = Pk(e, n);
  else if (t === 'document') r = kk(un(e));
  else if (zt(t)) r = Rk(t, n);
  else {
    const o = zx(e);
    r = { x: t.x - o.x, y: t.y - o.y, width: t.width, height: t.height };
  }
  return nl(r);
}
function Ux(e, t) {
  const n = fr(e);
  return n === t || !zt(n) || Jo(n)
    ? !1
    : Wt(n).position === 'fixed' || Ux(n, t);
}
function Dk(e, t) {
  const n = t.get(e);
  if (n) return n;
  let r = la(e, [], !1).filter((l) => zt(l) && ls(l) !== 'body'),
    o = null;
  const s = Wt(e).position === 'fixed';
  let i = s ? fr(e) : e;
  for (; zt(i) && !Jo(i); ) {
    const l = Wt(i),
      c = Hf(i);
    (!c && l.position === 'fixed' && (o = null),
      (
        s
          ? !c && !o
          : (!c && l.position === 'static' && !!o && Tk.has(o.position)) ||
            (ka(i) && !c && Ux(e, i))
      )
        ? (r = r.filter((f) => f !== i))
        : (o = l),
      (i = fr(i)));
  }
  return (t.set(e, r), r);
}
function Mk(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: o } = e;
  const i = [
      ...(n === 'clippingAncestors'
        ? Vl(t)
          ? []
          : Dk(t, this._c)
        : [].concat(n)),
      r,
    ],
    l = i[0],
    c = i.reduce(
      (u, f) => {
        const m = yh(t, f, o);
        return (
          (u.top = st(m.top, u.top)),
          (u.right = dr(m.right, u.right)),
          (u.bottom = dr(m.bottom, u.bottom)),
          (u.left = st(m.left, u.left)),
          u
        );
      },
      yh(t, l, o)
    );
  return {
    width: c.right - c.left,
    height: c.bottom - c.top,
    x: c.left,
    y: c.top,
  };
}
function Ak(e) {
  const { width: t, height: n } = $x(e);
  return { width: t, height: n };
}
function Ok(e, t, n) {
  const r = ln(t),
    o = un(t),
    s = n === 'fixed',
    i = Vr(e, !0, s, t);
  let l = { scrollLeft: 0, scrollTop: 0 };
  const c = an(0);
  function u() {
    c.x = Gf(o);
  }
  if (r || (!r && !s))
    if (((ls(t) !== 'body' || ka(o)) && (l = Yl(t)), r)) {
      const h = Vr(t, !0, s, t);
      ((c.x = h.x + t.clientLeft), (c.y = h.y + t.clientTop));
    } else o && u();
  s && !r && o && u();
  const f = o && !r && !s ? Wx(o, l) : an(0),
    m = i.left + l.scrollLeft - c.x - f.x,
    p = i.top + l.scrollTop - c.y - f.y;
  return { x: m, y: p, width: i.width, height: i.height };
}
function qc(e) {
  return Wt(e).position === 'static';
}
function wh(e, t) {
  if (!ln(e) || Wt(e).position === 'fixed') return null;
  if (t) return t(e);
  let n = e.offsetParent;
  return (un(e) === n && (n = n.ownerDocument.body), n);
}
function Bx(e, t) {
  const n = lt(e);
  if (Vl(e)) return n;
  if (!ln(e)) {
    let o = fr(e);
    for (; o && !Jo(o); ) {
      if (zt(o) && !qc(o)) return o;
      o = fr(o);
    }
    return n;
  }
  let r = wh(e, t);
  for (; r && gk(r) && qc(r); ) r = wh(r, t);
  return r && Jo(r) && qc(r) && !Hf(r) ? n : r || bk(e) || n;
}
const _k = async function (e) {
  const t = this.getOffsetParent || Bx,
    n = this.getDimensions,
    r = await n(e.floating);
  return {
    reference: Ok(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: r.width, height: r.height },
  };
};
function Ik(e) {
  return Wt(e).direction === 'rtl';
}
const Lk = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Sk,
  getDocumentElement: un,
  getClippingRect: Mk,
  getOffsetParent: Bx,
  getElementRects: _k,
  getClientRects: Ek,
  getDimensions: Ak,
  getScale: Ao,
  isElement: zt,
  isRTL: Ik,
};
function Hx(e, t) {
  return (
    e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
  );
}
function Fk(e, t) {
  let n = null,
    r;
  const o = un(e);
  function s() {
    var l;
    (clearTimeout(r), (l = n) == null || l.disconnect(), (n = null));
  }
  function i(l, c) {
    (l === void 0 && (l = !1), c === void 0 && (c = 1), s());
    const u = e.getBoundingClientRect(),
      { left: f, top: m, width: p, height: h } = u;
    if ((l || t(), !p || !h)) return;
    const b = ei(m),
      v = ei(o.clientWidth - (f + p)),
      w = ei(o.clientHeight - (m + h)),
      x = ei(f),
      y = {
        rootMargin: -b + 'px ' + -v + 'px ' + -w + 'px ' + -x + 'px',
        threshold: st(0, dr(1, c)) || 1,
      };
    let N = !0;
    function C(j) {
      const S = j[0].intersectionRatio;
      if (S !== c) {
        if (!N) return i();
        S
          ? i(!1, S)
          : (r = setTimeout(() => {
              i(!1, 1e-7);
            }, 1e3));
      }
      (S === 1 && !Hx(u, e.getBoundingClientRect()) && i(), (N = !1));
    }
    try {
      n = new IntersectionObserver(C, { ...y, root: o.ownerDocument });
    } catch {
      n = new IntersectionObserver(C, y);
    }
    n.observe(e);
  }
  return (i(!0), s);
}
function Vx(e, t, n, r) {
  r === void 0 && (r = {});
  const {
      ancestorScroll: o = !0,
      ancestorResize: s = !0,
      elementResize: i = typeof ResizeObserver == 'function',
      layoutShift: l = typeof IntersectionObserver == 'function',
      animationFrame: c = !1,
    } = r,
    u = Yf(e),
    f = o || s ? [...(u ? la(u) : []), ...la(t)] : [];
  f.forEach((x) => {
    (o && x.addEventListener('scroll', n, { passive: !0 }),
      s && x.addEventListener('resize', n));
  });
  const m = u && l ? Fk(u, n) : null;
  let p = -1,
    h = null;
  i &&
    ((h = new ResizeObserver((x) => {
      let [g] = x;
      (g &&
        g.target === u &&
        h &&
        (h.unobserve(t),
        cancelAnimationFrame(p),
        (p = requestAnimationFrame(() => {
          var y;
          (y = h) == null || y.observe(t);
        }))),
        n());
    })),
    u && !c && h.observe(u),
    h.observe(t));
  let b,
    v = c ? Vr(e) : null;
  c && w();
  function w() {
    const x = Vr(e);
    (v && !Hx(v, x) && n(), (v = x), (b = requestAnimationFrame(w)));
  }
  return (
    n(),
    () => {
      var x;
      (f.forEach((g) => {
        (o && g.removeEventListener('scroll', n),
          s && g.removeEventListener('resize', n));
      }),
        m == null || m(),
        (x = h) == null || x.disconnect(),
        (h = null),
        c && cancelAnimationFrame(b));
    }
  );
}
const $k = uk,
  zk = dk,
  Wk = ik,
  Uk = mk,
  Bk = lk,
  bh = ak,
  Hk = fk,
  Vk = (e, t, n) => {
    const r = new Map(),
      o = { platform: Lk, ...n },
      s = { ...o.platform, _c: r };
    return sk(e, t, { ...o, platform: s });
  };
var Yk = typeof document < 'u',
  Gk = function () {},
  Ci = Yk ? d.useLayoutEffect : Gk;
function rl(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (typeof e == 'function' && e.toString() === t.toString()) return !0;
  let n, r, o;
  if (e && t && typeof e == 'object') {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1;
      for (r = n; r-- !== 0; ) if (!rl(e[r], t[r])) return !1;
      return !0;
    }
    if (((o = Object.keys(e)), (n = o.length), n !== Object.keys(t).length))
      return !1;
    for (r = n; r-- !== 0; ) if (!{}.hasOwnProperty.call(t, o[r])) return !1;
    for (r = n; r-- !== 0; ) {
      const s = o[r];
      if (!(s === '_owner' && e.$$typeof) && !rl(e[s], t[s])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function Yx(e) {
  return typeof window > 'u'
    ? 1
    : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function Nh(e, t) {
  const n = Yx(e);
  return Math.round(t * n) / n;
}
function Xc(e) {
  const t = d.useRef(e);
  return (
    Ci(() => {
      t.current = e;
    }),
    t
  );
}
function Gx(e) {
  e === void 0 && (e = {});
  const {
      placement: t = 'bottom',
      strategy: n = 'absolute',
      middleware: r = [],
      platform: o,
      elements: { reference: s, floating: i } = {},
      transform: l = !0,
      whileElementsMounted: c,
      open: u,
    } = e,
    [f, m] = d.useState({
      x: 0,
      y: 0,
      strategy: n,
      placement: t,
      middlewareData: {},
      isPositioned: !1,
    }),
    [p, h] = d.useState(r);
  rl(p, r) || h(r);
  const [b, v] = d.useState(null),
    [w, x] = d.useState(null),
    g = d.useCallback((T) => {
      T !== j.current && ((j.current = T), v(T));
    }, []),
    y = d.useCallback((T) => {
      T !== S.current && ((S.current = T), x(T));
    }, []),
    N = s || b,
    C = i || w,
    j = d.useRef(null),
    S = d.useRef(null),
    k = d.useRef(f),
    M = c != null,
    D = Xc(c),
    W = Xc(o),
    P = Xc(u),
    U = d.useCallback(() => {
      if (!j.current || !S.current) return;
      const T = { placement: t, strategy: n, middleware: p };
      (W.current && (T.platform = W.current),
        Vk(j.current, S.current, T).then((E) => {
          const I = { ...E, isPositioned: P.current !== !1 };
          _.current &&
            !rl(k.current, I) &&
            ((k.current = I),
            ja.flushSync(() => {
              m(I);
            }));
        }));
    }, [p, t, n, W, P]);
  Ci(() => {
    u === !1 &&
      k.current.isPositioned &&
      ((k.current.isPositioned = !1), m((T) => ({ ...T, isPositioned: !1 })));
  }, [u]);
  const _ = d.useRef(!1);
  (Ci(
    () => (
      (_.current = !0),
      () => {
        _.current = !1;
      }
    ),
    []
  ),
    Ci(() => {
      if ((N && (j.current = N), C && (S.current = C), N && C)) {
        if (D.current) return D.current(N, C, U);
        U();
      }
    }, [N, C, U, D, M]));
  const Y = d.useMemo(
      () => ({ reference: j, floating: S, setReference: g, setFloating: y }),
      [g, y]
    ),
    V = d.useMemo(() => ({ reference: N, floating: C }), [N, C]),
    G = d.useMemo(() => {
      const T = { position: n, left: 0, top: 0 };
      if (!V.floating) return T;
      const E = Nh(V.floating, f.x),
        I = Nh(V.floating, f.y);
      return l
        ? {
            ...T,
            transform: 'translate(' + E + 'px, ' + I + 'px)',
            ...(Yx(V.floating) >= 1.5 && { willChange: 'transform' }),
          }
        : { position: n, left: E, top: I };
    }, [n, l, V.floating, f.x, f.y]);
  return d.useMemo(
    () => ({ ...f, update: U, refs: Y, elements: V, floatingStyles: G }),
    [f, U, Y, V, G]
  );
}
const Kk = (e) => {
    function t(n) {
      return {}.hasOwnProperty.call(n, 'current');
    }
    return {
      name: 'arrow',
      options: e,
      fn(n) {
        const { element: r, padding: o } = typeof e == 'function' ? e(n) : e;
        return r && t(r)
          ? r.current != null
            ? bh({ element: r.current, padding: o }).fn(n)
            : {}
          : r
            ? bh({ element: r, padding: o }).fn(n)
            : {};
      },
    };
  },
  Kx = (e, t) => ({ ...$k(e), options: [e, t] }),
  Qx = (e, t) => ({ ...zk(e), options: [e, t] }),
  qx = (e, t) => ({ ...Hk(e), options: [e, t] }),
  Xx = (e, t) => ({ ...Wk(e), options: [e, t] }),
  Zx = (e, t) => ({ ...Uk(e), options: [e, t] }),
  Jx = (e, t) => ({ ...Bk(e), options: [e, t] }),
  ey = (e, t) => ({ ...Kk(e), options: [e, t] });
var Qk = 'Arrow',
  ty = d.forwardRef((e, t) => {
    const { children: n, width: r = 10, height: o = 5, ...s } = e;
    return a.jsx(K.svg, {
      ...s,
      ref: t,
      width: r,
      height: o,
      viewBox: '0 0 30 10',
      preserveAspectRatio: 'none',
      children: e.asChild ? n : a.jsx('polygon', { points: '0,0 30,0 15,10' }),
    });
  });
ty.displayName = Qk;
var ny = ty;
function ry(e) {
  const [t, n] = d.useState(void 0);
  return (
    _e(() => {
      if (e) {
        n({ width: e.offsetWidth, height: e.offsetHeight });
        const r = new ResizeObserver((o) => {
          if (!Array.isArray(o) || !o.length) return;
          const s = o[0];
          let i, l;
          if ('borderBoxSize' in s) {
            const c = s.borderBoxSize,
              u = Array.isArray(c) ? c[0] : c;
            ((i = u.inlineSize), (l = u.blockSize));
          } else ((i = e.offsetWidth), (l = e.offsetHeight));
          n({ width: i, height: l });
        });
        return (r.observe(e, { box: 'border-box' }), () => r.unobserve(e));
      } else n(void 0);
    }, [e]),
    t
  );
}
var Kf = 'Popper',
  [oy, sy] = Ue(Kf),
  [qk, ay] = oy(Kf),
  iy = (e) => {
    const { __scopePopper: t, children: n } = e,
      [r, o] = d.useState(null);
    return a.jsx(qk, { scope: t, anchor: r, onAnchorChange: o, children: n });
  };
iy.displayName = Kf;
var ly = 'PopperAnchor',
  cy = d.forwardRef((e, t) => {
    const { __scopePopper: n, virtualRef: r, ...o } = e,
      s = ay(ly, n),
      i = d.useRef(null),
      l = se(t, i),
      c = d.useRef(null);
    return (
      d.useEffect(() => {
        const u = c.current;
        ((c.current = (r == null ? void 0 : r.current) || i.current),
          u !== c.current && s.onAnchorChange(c.current));
      }),
      r ? null : a.jsx(K.div, { ...o, ref: l })
    );
  });
cy.displayName = ly;
var Qf = 'PopperContent',
  [Xk, Zk] = oy(Qf),
  uy = d.forwardRef((e, t) => {
    var ee, ft, Ce, rt, jt, dn;
    const {
        __scopePopper: n,
        side: r = 'bottom',
        sideOffset: o = 0,
        align: s = 'center',
        alignOffset: i = 0,
        arrowPadding: l = 0,
        avoidCollisions: c = !0,
        collisionBoundary: u = [],
        collisionPadding: f = 0,
        sticky: m = 'partial',
        hideWhenDetached: p = !1,
        updatePositionStrategy: h = 'optimized',
        onPlaced: b,
        ...v
      } = e,
      w = ay(Qf, n),
      [x, g] = d.useState(null),
      y = se(t, (qe) => g(qe)),
      [N, C] = d.useState(null),
      j = ry(N),
      S = (j == null ? void 0 : j.width) ?? 0,
      k = (j == null ? void 0 : j.height) ?? 0,
      M = r + (s !== 'center' ? '-' + s : ''),
      D =
        typeof f == 'number'
          ? f
          : { top: 0, right: 0, bottom: 0, left: 0, ...f },
      W = Array.isArray(u) ? u : [u],
      P = W.length > 0,
      U = { padding: D, boundary: W.filter(eP), altBoundary: P },
      {
        refs: _,
        floatingStyles: Y,
        placement: V,
        isPositioned: G,
        middlewareData: T,
      } = Gx({
        strategy: 'fixed',
        placement: M,
        whileElementsMounted: (...qe) =>
          Vx(...qe, { animationFrame: h === 'always' }),
        elements: { reference: w.anchor },
        middleware: [
          Kx({ mainAxis: o + k, alignmentAxis: i }),
          c &&
            Qx({
              mainAxis: !0,
              crossAxis: !1,
              limiter: m === 'partial' ? qx() : void 0,
              ...U,
            }),
          c && Xx({ ...U }),
          Zx({
            ...U,
            apply: ({
              elements: qe,
              rects: yr,
              availableWidth: ds,
              availableHeight: Xr,
            }) => {
              const { width: fs, height: wr } = yr.reference,
                Ct = qe.floating.style;
              (Ct.setProperty('--radix-popper-available-width', `${ds}px`),
                Ct.setProperty('--radix-popper-available-height', `${Xr}px`),
                Ct.setProperty('--radix-popper-anchor-width', `${fs}px`),
                Ct.setProperty('--radix-popper-anchor-height', `${wr}px`));
            },
          }),
          N && ey({ element: N, padding: l }),
          tP({ arrowWidth: S, arrowHeight: k }),
          p && Jx({ strategy: 'referenceHidden', ...U }),
        ],
      }),
      [E, I] = my(V),
      B = Oe(b);
    _e(() => {
      G && (B == null || B());
    }, [G, B]);
    const z = (ee = T.arrow) == null ? void 0 : ee.x,
      Q = (ft = T.arrow) == null ? void 0 : ft.y,
      Z = ((Ce = T.arrow) == null ? void 0 : Ce.centerOffset) !== 0,
      [ue, he] = d.useState();
    return (
      _e(() => {
        x && he(window.getComputedStyle(x).zIndex);
      }, [x]),
      a.jsx('div', {
        ref: _.setFloating,
        'data-radix-popper-content-wrapper': '',
        style: {
          ...Y,
          transform: G ? Y.transform : 'translate(0, -200%)',
          minWidth: 'max-content',
          zIndex: ue,
          '--radix-popper-transform-origin': [
            (rt = T.transformOrigin) == null ? void 0 : rt.x,
            (jt = T.transformOrigin) == null ? void 0 : jt.y,
          ].join(' '),
          ...(((dn = T.hide) == null ? void 0 : dn.referenceHidden) && {
            visibility: 'hidden',
            pointerEvents: 'none',
          }),
        },
        dir: e.dir,
        children: a.jsx(Xk, {
          scope: n,
          placedSide: E,
          onArrowChange: C,
          arrowX: z,
          arrowY: Q,
          shouldHideArrow: Z,
          children: a.jsx(K.div, {
            'data-side': E,
            'data-align': I,
            ...v,
            ref: y,
            style: { ...v.style, animation: G ? void 0 : 'none' },
          }),
        }),
      })
    );
  });
uy.displayName = Qf;
var dy = 'PopperArrow',
  Jk = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
  fy = d.forwardRef(function (t, n) {
    const { __scopePopper: r, ...o } = t,
      s = Zk(dy, r),
      i = Jk[s.placedSide];
    return a.jsx('span', {
      ref: s.onArrowChange,
      style: {
        position: 'absolute',
        left: s.arrowX,
        top: s.arrowY,
        [i]: 0,
        transformOrigin: {
          top: '',
          right: '0 0',
          bottom: 'center 0',
          left: '100% 0',
        }[s.placedSide],
        transform: {
          top: 'translateY(100%)',
          right: 'translateY(50%) rotate(90deg) translateX(-50%)',
          bottom: 'rotate(180deg)',
          left: 'translateY(50%) rotate(-90deg) translateX(50%)',
        }[s.placedSide],
        visibility: s.shouldHideArrow ? 'hidden' : void 0,
      },
      children: a.jsx(ny, {
        ...o,
        ref: n,
        style: { ...o.style, display: 'block' },
      }),
    });
  });
fy.displayName = dy;
function eP(e) {
  return e !== null;
}
var tP = (e) => ({
  name: 'transformOrigin',
  options: e,
  fn(t) {
    var w, x, g;
    const { placement: n, rects: r, middlewareData: o } = t,
      i = ((w = o.arrow) == null ? void 0 : w.centerOffset) !== 0,
      l = i ? 0 : e.arrowWidth,
      c = i ? 0 : e.arrowHeight,
      [u, f] = my(n),
      m = { start: '0%', center: '50%', end: '100%' }[f],
      p = (((x = o.arrow) == null ? void 0 : x.x) ?? 0) + l / 2,
      h = (((g = o.arrow) == null ? void 0 : g.y) ?? 0) + c / 2;
    let b = '',
      v = '';
    return (
      u === 'bottom'
        ? ((b = i ? m : `${p}px`), (v = `${-c}px`))
        : u === 'top'
          ? ((b = i ? m : `${p}px`), (v = `${r.floating.height + c}px`))
          : u === 'right'
            ? ((b = `${-c}px`), (v = i ? m : `${h}px`))
            : u === 'left' &&
              ((b = `${r.floating.width + c}px`), (v = i ? m : `${h}px`)),
      { data: { x: b, y: v } }
    );
  },
});
function my(e) {
  const [t, n = 'center'] = e.split('-');
  return [t, n];
}
var nP = iy,
  rP = cy,
  oP = uy,
  sP = fy;
function aP(e, t) {
  return d.useReducer((n, r) => t[n][r] ?? n, e);
}
var py = (e) => {
  const { present: t, children: n } = e,
    r = iP(t),
    o =
      typeof n == 'function' ? n({ present: r.isPresent }) : d.Children.only(n),
    s = se(r.ref, lP(o));
  return typeof n == 'function' || r.isPresent
    ? d.cloneElement(o, { ref: s })
    : null;
};
py.displayName = 'Presence';
function iP(e) {
  const [t, n] = d.useState(),
    r = d.useRef(null),
    o = d.useRef(e),
    s = d.useRef('none'),
    i = e ? 'mounted' : 'unmounted',
    [l, c] = aP(i, {
      mounted: { UNMOUNT: 'unmounted', ANIMATION_OUT: 'unmountSuspended' },
      unmountSuspended: { MOUNT: 'mounted', ANIMATION_END: 'unmounted' },
      unmounted: { MOUNT: 'mounted' },
    });
  return (
    d.useEffect(() => {
      const u = ti(r.current);
      s.current = l === 'mounted' ? u : 'none';
    }, [l]),
    _e(() => {
      const u = r.current,
        f = o.current;
      if (f !== e) {
        const p = s.current,
          h = ti(u);
        (e
          ? c('MOUNT')
          : h === 'none' || (u == null ? void 0 : u.display) === 'none'
            ? c('UNMOUNT')
            : c(f && p !== h ? 'ANIMATION_OUT' : 'UNMOUNT'),
          (o.current = e));
      }
    }, [e, c]),
    _e(() => {
      if (t) {
        let u;
        const f = t.ownerDocument.defaultView ?? window,
          m = (h) => {
            const v = ti(r.current).includes(CSS.escape(h.animationName));
            if (h.target === t && v && (c('ANIMATION_END'), !o.current)) {
              const w = t.style.animationFillMode;
              ((t.style.animationFillMode = 'forwards'),
                (u = f.setTimeout(() => {
                  t.style.animationFillMode === 'forwards' &&
                    (t.style.animationFillMode = w);
                })));
            }
          },
          p = (h) => {
            h.target === t && (s.current = ti(r.current));
          };
        return (
          t.addEventListener('animationstart', p),
          t.addEventListener('animationcancel', m),
          t.addEventListener('animationend', m),
          () => {
            (f.clearTimeout(u),
              t.removeEventListener('animationstart', p),
              t.removeEventListener('animationcancel', m),
              t.removeEventListener('animationend', m));
          }
        );
      } else c('ANIMATION_END');
    }, [t, c]),
    {
      isPresent: ['mounted', 'unmountSuspended'].includes(l),
      ref: d.useCallback((u) => {
        ((r.current = u ? getComputedStyle(u) : null), n(u));
      }, []),
    }
  );
}
function ti(e) {
  return (e == null ? void 0 : e.animationName) || 'none';
}
function lP(e) {
  var r, o;
  let t =
      (r = Object.getOwnPropertyDescriptor(e.props, 'ref')) == null
        ? void 0
        : r.get,
    n = t && 'isReactWarning' in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t =
        (o = Object.getOwnPropertyDescriptor(e, 'ref')) == null
          ? void 0
          : o.get),
      (n = t && 'isReactWarning' in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
var [Gl, oO] = Ue('Tooltip', [sy]),
  Kl = sy(),
  hy = 'TooltipProvider',
  cP = 700,
  gd = 'tooltip.open',
  [uP, qf] = Gl(hy),
  gy = (e) => {
    const {
        __scopeTooltip: t,
        delayDuration: n = cP,
        skipDelayDuration: r = 300,
        disableHoverableContent: o = !1,
        children: s,
      } = e,
      i = d.useRef(!0),
      l = d.useRef(!1),
      c = d.useRef(0);
    return (
      d.useEffect(() => {
        const u = c.current;
        return () => window.clearTimeout(u);
      }, []),
      a.jsx(uP, {
        scope: t,
        isOpenDelayedRef: i,
        delayDuration: n,
        onOpen: d.useCallback(() => {
          (window.clearTimeout(c.current), (i.current = !1));
        }, []),
        onClose: d.useCallback(() => {
          (window.clearTimeout(c.current),
            (c.current = window.setTimeout(() => (i.current = !0), r)));
        }, [r]),
        isPointerInTransitRef: l,
        onPointerInTransitChange: d.useCallback((u) => {
          l.current = u;
        }, []),
        disableHoverableContent: o,
        children: s,
      })
    );
  };
gy.displayName = hy;
var ca = 'Tooltip',
  [dP, Ql] = Gl(ca),
  vy = (e) => {
    const {
        __scopeTooltip: t,
        children: n,
        open: r,
        defaultOpen: o,
        onOpenChange: s,
        disableHoverableContent: i,
        delayDuration: l,
      } = e,
      c = qf(ca, e.__scopeTooltip),
      u = Kl(t),
      [f, m] = d.useState(null),
      p = sn(),
      h = d.useRef(0),
      b = i ?? c.disableHoverableContent,
      v = l ?? c.delayDuration,
      w = d.useRef(!1),
      [x, g] = cn({
        prop: r,
        defaultProp: o ?? !1,
        onChange: (S) => {
          (S
            ? (c.onOpen(), document.dispatchEvent(new CustomEvent(gd)))
            : c.onClose(),
            s == null || s(S));
        },
        caller: ca,
      }),
      y = d.useMemo(
        () => (x ? (w.current ? 'delayed-open' : 'instant-open') : 'closed'),
        [x]
      ),
      N = d.useCallback(() => {
        (window.clearTimeout(h.current),
          (h.current = 0),
          (w.current = !1),
          g(!0));
      }, [g]),
      C = d.useCallback(() => {
        (window.clearTimeout(h.current), (h.current = 0), g(!1));
      }, [g]),
      j = d.useCallback(() => {
        (window.clearTimeout(h.current),
          (h.current = window.setTimeout(() => {
            ((w.current = !0), g(!0), (h.current = 0));
          }, v)));
      }, [v, g]);
    return (
      d.useEffect(
        () => () => {
          h.current && (window.clearTimeout(h.current), (h.current = 0));
        },
        []
      ),
      a.jsx(nP, {
        ...u,
        children: a.jsx(dP, {
          scope: t,
          contentId: p,
          open: x,
          stateAttribute: y,
          trigger: f,
          onTriggerChange: m,
          onTriggerEnter: d.useCallback(() => {
            c.isOpenDelayedRef.current ? j() : N();
          }, [c.isOpenDelayedRef, j, N]),
          onTriggerLeave: d.useCallback(() => {
            b ? C() : (window.clearTimeout(h.current), (h.current = 0));
          }, [C, b]),
          onOpen: N,
          onClose: C,
          disableHoverableContent: b,
          children: n,
        }),
      })
    );
  };
vy.displayName = ca;
var vd = 'TooltipTrigger',
  xy = d.forwardRef((e, t) => {
    const { __scopeTooltip: n, ...r } = e,
      o = Ql(vd, n),
      s = qf(vd, n),
      i = Kl(n),
      l = d.useRef(null),
      c = se(t, l, o.onTriggerChange),
      u = d.useRef(!1),
      f = d.useRef(!1),
      m = d.useCallback(() => (u.current = !1), []);
    return (
      d.useEffect(
        () => () => document.removeEventListener('pointerup', m),
        [m]
      ),
      a.jsx(rP, {
        asChild: !0,
        ...i,
        children: a.jsx(K.button, {
          'aria-describedby': o.open ? o.contentId : void 0,
          'data-state': o.stateAttribute,
          ...r,
          ref: c,
          onPointerMove: gn(e.onPointerMove, (p) => {
            p.pointerType !== 'touch' &&
              !f.current &&
              !s.isPointerInTransitRef.current &&
              (o.onTriggerEnter(), (f.current = !0));
          }),
          onPointerLeave: gn(e.onPointerLeave, () => {
            (o.onTriggerLeave(), (f.current = !1));
          }),
          onPointerDown: gn(e.onPointerDown, () => {
            (o.open && o.onClose(),
              (u.current = !0),
              document.addEventListener('pointerup', m, { once: !0 }));
          }),
          onFocus: gn(e.onFocus, () => {
            u.current || o.onOpen();
          }),
          onBlur: gn(e.onBlur, o.onClose),
          onClick: gn(e.onClick, o.onClose),
        }),
      })
    );
  });
xy.displayName = vd;
var fP = 'TooltipPortal',
  [sO, mP] = Gl(fP, { forceMount: void 0 }),
  es = 'TooltipContent',
  yy = d.forwardRef((e, t) => {
    const n = mP(es, e.__scopeTooltip),
      { forceMount: r = n.forceMount, side: o = 'top', ...s } = e,
      i = Ql(es, e.__scopeTooltip);
    return a.jsx(py, {
      present: r || i.open,
      children: i.disableHoverableContent
        ? a.jsx(wy, { side: o, ...s, ref: t })
        : a.jsx(pP, { side: o, ...s, ref: t }),
    });
  }),
  pP = d.forwardRef((e, t) => {
    const n = Ql(es, e.__scopeTooltip),
      r = qf(es, e.__scopeTooltip),
      o = d.useRef(null),
      s = se(t, o),
      [i, l] = d.useState(null),
      { trigger: c, onClose: u } = n,
      f = o.current,
      { onPointerInTransitChange: m } = r,
      p = d.useCallback(() => {
        (l(null), m(!1));
      }, [m]),
      h = d.useCallback(
        (b, v) => {
          const w = b.currentTarget,
            x = { x: b.clientX, y: b.clientY },
            g = yP(x, w.getBoundingClientRect()),
            y = wP(x, g),
            N = bP(v.getBoundingClientRect()),
            C = jP([...y, ...N]);
          (l(C), m(!0));
        },
        [m]
      );
    return (
      d.useEffect(() => () => p(), [p]),
      d.useEffect(() => {
        if (c && f) {
          const b = (w) => h(w, f),
            v = (w) => h(w, c);
          return (
            c.addEventListener('pointerleave', b),
            f.addEventListener('pointerleave', v),
            () => {
              (c.removeEventListener('pointerleave', b),
                f.removeEventListener('pointerleave', v));
            }
          );
        }
      }, [c, f, h, p]),
      d.useEffect(() => {
        if (i) {
          const b = (v) => {
            const w = v.target,
              x = { x: v.clientX, y: v.clientY },
              g =
                (c == null ? void 0 : c.contains(w)) ||
                (f == null ? void 0 : f.contains(w)),
              y = !NP(x, i);
            g ? p() : y && (p(), u());
          };
          return (
            document.addEventListener('pointermove', b),
            () => document.removeEventListener('pointermove', b)
          );
        }
      }, [c, f, i, u, p]),
      a.jsx(wy, { ...e, ref: s })
    );
  }),
  [hP, gP] = Gl(ca, { isInside: !1 }),
  vP = _0('TooltipContent'),
  wy = d.forwardRef((e, t) => {
    const {
        __scopeTooltip: n,
        children: r,
        'aria-label': o,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        ...l
      } = e,
      c = Ql(es, n),
      u = Kl(n),
      { onClose: f } = c;
    return (
      d.useEffect(
        () => (
          document.addEventListener(gd, f),
          () => document.removeEventListener(gd, f)
        ),
        [f]
      ),
      d.useEffect(() => {
        if (c.trigger) {
          const m = (p) => {
            const h = p.target;
            h != null && h.contains(c.trigger) && f();
          };
          return (
            window.addEventListener('scroll', m, { capture: !0 }),
            () => window.removeEventListener('scroll', m, { capture: !0 })
          );
        }
      }, [c.trigger, f]),
      a.jsx(Ax, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: s,
        onPointerDownOutside: i,
        onFocusOutside: (m) => m.preventDefault(),
        onDismiss: f,
        children: a.jsxs(oP, {
          'data-state': c.stateAttribute,
          ...u,
          ...l,
          ref: t,
          style: {
            ...l.style,
            '--radix-tooltip-content-transform-origin':
              'var(--radix-popper-transform-origin)',
            '--radix-tooltip-content-available-width':
              'var(--radix-popper-available-width)',
            '--radix-tooltip-content-available-height':
              'var(--radix-popper-available-height)',
            '--radix-tooltip-trigger-width': 'var(--radix-popper-anchor-width)',
            '--radix-tooltip-trigger-height':
              'var(--radix-popper-anchor-height)',
          },
          children: [
            a.jsx(vP, { children: r }),
            a.jsx(hP, {
              scope: n,
              isInside: !0,
              children: a.jsx(FC, {
                id: c.contentId,
                role: 'tooltip',
                children: o || r,
              }),
            }),
          ],
        }),
      })
    );
  });
yy.displayName = es;
var by = 'TooltipArrow',
  xP = d.forwardRef((e, t) => {
    const { __scopeTooltip: n, ...r } = e,
      o = Kl(n);
    return gP(by, n).isInside ? null : a.jsx(sP, { ...o, ...r, ref: t });
  });
xP.displayName = by;
function yP(e, t) {
  const n = Math.abs(t.top - e.y),
    r = Math.abs(t.bottom - e.y),
    o = Math.abs(t.right - e.x),
    s = Math.abs(t.left - e.x);
  switch (Math.min(n, r, o, s)) {
    case s:
      return 'left';
    case o:
      return 'right';
    case n:
      return 'top';
    case r:
      return 'bottom';
    default:
      throw new Error('unreachable');
  }
}
function wP(e, t, n = 5) {
  const r = [];
  switch (t) {
    case 'top':
      r.push({ x: e.x - n, y: e.y + n }, { x: e.x + n, y: e.y + n });
      break;
    case 'bottom':
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x + n, y: e.y - n });
      break;
    case 'left':
      r.push({ x: e.x + n, y: e.y - n }, { x: e.x + n, y: e.y + n });
      break;
    case 'right':
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x - n, y: e.y + n });
      break;
  }
  return r;
}
function bP(e) {
  const { top: t, right: n, bottom: r, left: o } = e;
  return [
    { x: o, y: t },
    { x: n, y: t },
    { x: n, y: r },
    { x: o, y: r },
  ];
}
function NP(e, t) {
  const { x: n, y: r } = e;
  let o = !1;
  for (let s = 0, i = t.length - 1; s < t.length; i = s++) {
    const l = t[s],
      c = t[i],
      u = l.x,
      f = l.y,
      m = c.x,
      p = c.y;
    f > r != p > r && n < ((m - u) * (r - f)) / (p - f) + u && (o = !o);
  }
  return o;
}
function jP(e) {
  const t = e.slice();
  return (
    t.sort((n, r) =>
      n.x < r.x ? -1 : n.x > r.x ? 1 : n.y < r.y ? -1 : n.y > r.y ? 1 : 0
    ),
    CP(t)
  );
}
function CP(e) {
  if (e.length <= 1) return e.slice();
  const t = [];
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    for (; t.length >= 2; ) {
      const s = t[t.length - 1],
        i = t[t.length - 2];
      if ((s.x - i.x) * (o.y - i.y) >= (s.y - i.y) * (o.x - i.x)) t.pop();
      else break;
    }
    t.push(o);
  }
  t.pop();
  const n = [];
  for (let r = e.length - 1; r >= 0; r--) {
    const o = e[r];
    for (; n.length >= 2; ) {
      const s = n[n.length - 1],
        i = n[n.length - 2];
      if ((s.x - i.x) * (o.y - i.y) >= (s.y - i.y) * (o.x - i.x)) n.pop();
      else break;
    }
    n.push(o);
  }
  return (
    n.pop(),
    t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y
      ? t
      : t.concat(n)
  );
}
var SP = gy,
  EP = vy,
  kP = xy,
  Ny = yy;
const xd = SP,
  jh = EP,
  Ch = kP,
  yd = d.forwardRef(({ className: e, sideOffset: t = 4, ...n }, r) =>
    a.jsx(Ny, {
      ref: r,
      sideOffset: t,
      className: L(
        'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        e
      ),
      ...n,
    })
  );
yd.displayName = Ny.displayName;
var ql = class {
    constructor() {
      ((this.listeners = new Set()),
        (this.subscribe = this.subscribe.bind(this)));
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        this.onSubscribe(),
        () => {
          (this.listeners.delete(e), this.onUnsubscribe());
        }
      );
    }
    hasListeners() {
      return this.listeners.size > 0;
    }
    onSubscribe() {}
    onUnsubscribe() {}
  },
  Xl = typeof window > 'u' || 'Deno' in globalThis;
function Dt() {}
function PP(e, t) {
  return typeof e == 'function' ? e(t) : e;
}
function TP(e) {
  return typeof e == 'number' && e >= 0 && e !== 1 / 0;
}
function RP(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function wd(e, t) {
  return typeof e == 'function' ? e(t) : e;
}
function DP(e, t) {
  return typeof e == 'function' ? e(t) : e;
}
function Sh(e, t) {
  const {
    type: n = 'all',
    exact: r,
    fetchStatus: o,
    predicate: s,
    queryKey: i,
    stale: l,
  } = e;
  if (i) {
    if (r) {
      if (t.queryHash !== Xf(i, t.options)) return !1;
    } else if (!da(t.queryKey, i)) return !1;
  }
  if (n !== 'all') {
    const c = t.isActive();
    if ((n === 'active' && !c) || (n === 'inactive' && c)) return !1;
  }
  return !(
    (typeof l == 'boolean' && t.isStale() !== l) ||
    (o && o !== t.state.fetchStatus) ||
    (s && !s(t))
  );
}
function Eh(e, t) {
  const { exact: n, status: r, predicate: o, mutationKey: s } = e;
  if (s) {
    if (!t.options.mutationKey) return !1;
    if (n) {
      if (ua(t.options.mutationKey) !== ua(s)) return !1;
    } else if (!da(t.options.mutationKey, s)) return !1;
  }
  return !((r && t.state.status !== r) || (o && !o(t)));
}
function Xf(e, t) {
  return ((t == null ? void 0 : t.queryKeyHashFn) || ua)(e);
}
function ua(e) {
  return JSON.stringify(e, (t, n) =>
    bd(n)
      ? Object.keys(n)
          .sort()
          .reduce((r, o) => ((r[o] = n[o]), r), {})
      : n
  );
}
function da(e, t) {
  return e === t
    ? !0
    : typeof e != typeof t
      ? !1
      : e && t && typeof e == 'object' && typeof t == 'object'
        ? Object.keys(t).every((n) => da(e[n], t[n]))
        : !1;
}
function jy(e, t) {
  if (e === t) return e;
  const n = kh(e) && kh(t);
  if (n || (bd(e) && bd(t))) {
    const r = n ? e : Object.keys(e),
      o = r.length,
      s = n ? t : Object.keys(t),
      i = s.length,
      l = n ? [] : {},
      c = new Set(r);
    let u = 0;
    for (let f = 0; f < i; f++) {
      const m = n ? f : s[f];
      ((!n && c.has(m)) || n) && e[m] === void 0 && t[m] === void 0
        ? ((l[m] = void 0), u++)
        : ((l[m] = jy(e[m], t[m])), l[m] === e[m] && e[m] !== void 0 && u++);
    }
    return o === i && u === o ? e : l;
  }
  return t;
}
function kh(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function bd(e) {
  if (!Ph(e)) return !1;
  const t = e.constructor;
  if (t === void 0) return !0;
  const n = t.prototype;
  return !(
    !Ph(n) ||
    !n.hasOwnProperty('isPrototypeOf') ||
    Object.getPrototypeOf(e) !== Object.prototype
  );
}
function Ph(e) {
  return Object.prototype.toString.call(e) === '[object Object]';
}
function MP(e) {
  return new Promise((t) => {
    setTimeout(t, e);
  });
}
function AP(e, t, n) {
  return typeof n.structuralSharing == 'function'
    ? n.structuralSharing(e, t)
    : n.structuralSharing !== !1
      ? jy(e, t)
      : t;
}
function OP(e, t, n = 0) {
  const r = [...e, t];
  return n && r.length > n ? r.slice(1) : r;
}
function _P(e, t, n = 0) {
  const r = [t, ...e];
  return n && r.length > n ? r.slice(0, -1) : r;
}
var Zf = Symbol();
function Cy(e, t) {
  return !e.queryFn && t != null && t.initialPromise
    ? () => t.initialPromise
    : !e.queryFn || e.queryFn === Zf
      ? () => Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`))
      : e.queryFn;
}
var Rr,
  Yn,
  Lo,
  ug,
  IP =
    ((ug = class extends ql {
      constructor() {
        super();
        oe(this, Rr);
        oe(this, Yn);
        oe(this, Lo);
        X(this, Lo, (t) => {
          if (!Xl && window.addEventListener) {
            const n = () => t();
            return (
              window.addEventListener('visibilitychange', n, !1),
              () => {
                window.removeEventListener('visibilitychange', n);
              }
            );
          }
        });
      }
      onSubscribe() {
        R(this, Yn) || this.setEventListener(R(this, Lo));
      }
      onUnsubscribe() {
        var t;
        this.hasListeners() ||
          ((t = R(this, Yn)) == null || t.call(this), X(this, Yn, void 0));
      }
      setEventListener(t) {
        var n;
        (X(this, Lo, t),
          (n = R(this, Yn)) == null || n.call(this),
          X(
            this,
            Yn,
            t((r) => {
              typeof r == 'boolean' ? this.setFocused(r) : this.onFocus();
            })
          ));
      }
      setFocused(t) {
        R(this, Rr) !== t && (X(this, Rr, t), this.onFocus());
      }
      onFocus() {
        const t = this.isFocused();
        this.listeners.forEach((n) => {
          n(t);
        });
      }
      isFocused() {
        var t;
        return typeof R(this, Rr) == 'boolean'
          ? R(this, Rr)
          : ((t = globalThis.document) == null ? void 0 : t.visibilityState) !==
              'hidden';
      }
    }),
    (Rr = new WeakMap()),
    (Yn = new WeakMap()),
    (Lo = new WeakMap()),
    ug),
  Sy = new IP(),
  Fo,
  Gn,
  $o,
  dg,
  LP =
    ((dg = class extends ql {
      constructor() {
        super();
        oe(this, Fo, !0);
        oe(this, Gn);
        oe(this, $o);
        X(this, $o, (t) => {
          if (!Xl && window.addEventListener) {
            const n = () => t(!0),
              r = () => t(!1);
            return (
              window.addEventListener('online', n, !1),
              window.addEventListener('offline', r, !1),
              () => {
                (window.removeEventListener('online', n),
                  window.removeEventListener('offline', r));
              }
            );
          }
        });
      }
      onSubscribe() {
        R(this, Gn) || this.setEventListener(R(this, $o));
      }
      onUnsubscribe() {
        var t;
        this.hasListeners() ||
          ((t = R(this, Gn)) == null || t.call(this), X(this, Gn, void 0));
      }
      setEventListener(t) {
        var n;
        (X(this, $o, t),
          (n = R(this, Gn)) == null || n.call(this),
          X(this, Gn, t(this.setOnline.bind(this))));
      }
      setOnline(t) {
        R(this, Fo) !== t &&
          (X(this, Fo, t),
          this.listeners.forEach((r) => {
            r(t);
          }));
      }
      isOnline() {
        return R(this, Fo);
      }
    }),
    (Fo = new WeakMap()),
    (Gn = new WeakMap()),
    ($o = new WeakMap()),
    dg),
  ol = new LP();
function FP() {
  let e, t;
  const n = new Promise((o, s) => {
    ((e = o), (t = s));
  });
  ((n.status = 'pending'), n.catch(() => {}));
  function r(o) {
    (Object.assign(n, o), delete n.resolve, delete n.reject);
  }
  return (
    (n.resolve = (o) => {
      (r({ status: 'fulfilled', value: o }), e(o));
    }),
    (n.reject = (o) => {
      (r({ status: 'rejected', reason: o }), t(o));
    }),
    n
  );
}
function $P(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function Ey(e) {
  return (e ?? 'online') === 'online' ? ol.isOnline() : !0;
}
var ky = class extends Error {
  constructor(e) {
    (super('CancelledError'),
      (this.revert = e == null ? void 0 : e.revert),
      (this.silent = e == null ? void 0 : e.silent));
  }
};
function Zc(e) {
  return e instanceof ky;
}
function Py(e) {
  let t = !1,
    n = 0,
    r = !1,
    o;
  const s = FP(),
    i = (v) => {
      var w;
      r || (p(new ky(v)), (w = e.abort) == null || w.call(e));
    },
    l = () => {
      t = !0;
    },
    c = () => {
      t = !1;
    },
    u = () =>
      Sy.isFocused() &&
      (e.networkMode === 'always' || ol.isOnline()) &&
      e.canRun(),
    f = () => Ey(e.networkMode) && e.canRun(),
    m = (v) => {
      var w;
      r ||
        ((r = !0),
        (w = e.onSuccess) == null || w.call(e, v),
        o == null || o(),
        s.resolve(v));
    },
    p = (v) => {
      var w;
      r ||
        ((r = !0),
        (w = e.onError) == null || w.call(e, v),
        o == null || o(),
        s.reject(v));
    },
    h = () =>
      new Promise((v) => {
        var w;
        ((o = (x) => {
          (r || u()) && v(x);
        }),
          (w = e.onPause) == null || w.call(e));
      }).then(() => {
        var v;
        ((o = void 0), r || (v = e.onContinue) == null || v.call(e));
      }),
    b = () => {
      if (r) return;
      let v;
      const w = n === 0 ? e.initialPromise : void 0;
      try {
        v = w ?? e.fn();
      } catch (x) {
        v = Promise.reject(x);
      }
      Promise.resolve(v)
        .then(m)
        .catch((x) => {
          var j;
          if (r) return;
          const g = e.retry ?? (Xl ? 0 : 3),
            y = e.retryDelay ?? $P,
            N = typeof y == 'function' ? y(n, x) : y,
            C =
              g === !0 ||
              (typeof g == 'number' && n < g) ||
              (typeof g == 'function' && g(n, x));
          if (t || !C) {
            p(x);
            return;
          }
          (n++,
            (j = e.onFail) == null || j.call(e, n, x),
            MP(N)
              .then(() => (u() ? void 0 : h()))
              .then(() => {
                t ? p(x) : b();
              }));
        });
    };
  return {
    promise: s,
    cancel: i,
    continue: () => (o == null || o(), s),
    cancelRetry: l,
    continueRetry: c,
    canStart: f,
    start: () => (f() ? b() : h().then(b), s),
  };
}
var zP = (e) => setTimeout(e, 0);
function WP() {
  let e = [],
    t = 0,
    n = (l) => {
      l();
    },
    r = (l) => {
      l();
    },
    o = zP;
  const s = (l) => {
      t
        ? e.push(l)
        : o(() => {
            n(l);
          });
    },
    i = () => {
      const l = e;
      ((e = []),
        l.length &&
          o(() => {
            r(() => {
              l.forEach((c) => {
                n(c);
              });
            });
          }));
    };
  return {
    batch: (l) => {
      let c;
      t++;
      try {
        c = l();
      } finally {
        (t--, t || i());
      }
      return c;
    },
    batchCalls:
      (l) =>
      (...c) => {
        s(() => {
          l(...c);
        });
      },
    schedule: s,
    setNotifyFunction: (l) => {
      n = l;
    },
    setBatchNotifyFunction: (l) => {
      r = l;
    },
    setScheduler: (l) => {
      o = l;
    },
  };
}
var Ve = WP(),
  Dr,
  fg,
  Ty =
    ((fg = class {
      constructor() {
        oe(this, Dr);
      }
      destroy() {
        this.clearGcTimeout();
      }
      scheduleGc() {
        (this.clearGcTimeout(),
          TP(this.gcTime) &&
            X(
              this,
              Dr,
              setTimeout(() => {
                this.optionalRemove();
              }, this.gcTime)
            ));
      }
      updateGcTime(e) {
        this.gcTime = Math.max(
          this.gcTime || 0,
          e ?? (Xl ? 1 / 0 : 5 * 60 * 1e3)
        );
      }
      clearGcTimeout() {
        R(this, Dr) && (clearTimeout(R(this, Dr)), X(this, Dr, void 0));
      }
    }),
    (Dr = new WeakMap()),
    fg),
  zo,
  Mr,
  pt,
  Ar,
  $e,
  ga,
  Or,
  Mt,
  mn,
  mg,
  UP =
    ((mg = class extends Ty {
      constructor(t) {
        super();
        oe(this, Mt);
        oe(this, zo);
        oe(this, Mr);
        oe(this, pt);
        oe(this, Ar);
        oe(this, $e);
        oe(this, ga);
        oe(this, Or);
        (X(this, Or, !1),
          X(this, ga, t.defaultOptions),
          this.setOptions(t.options),
          (this.observers = []),
          X(this, Ar, t.client),
          X(this, pt, R(this, Ar).getQueryCache()),
          (this.queryKey = t.queryKey),
          (this.queryHash = t.queryHash),
          X(this, zo, HP(this.options)),
          (this.state = t.state ?? R(this, zo)),
          this.scheduleGc());
      }
      get meta() {
        return this.options.meta;
      }
      get promise() {
        var t;
        return (t = R(this, $e)) == null ? void 0 : t.promise;
      }
      setOptions(t) {
        ((this.options = { ...R(this, ga), ...t }),
          this.updateGcTime(this.options.gcTime));
      }
      optionalRemove() {
        !this.observers.length &&
          this.state.fetchStatus === 'idle' &&
          R(this, pt).remove(this);
      }
      setData(t, n) {
        const r = AP(this.state.data, t, this.options);
        return (
          Ie(this, Mt, mn).call(this, {
            data: r,
            type: 'success',
            dataUpdatedAt: n == null ? void 0 : n.updatedAt,
            manual: n == null ? void 0 : n.manual,
          }),
          r
        );
      }
      setState(t, n) {
        Ie(this, Mt, mn).call(this, {
          type: 'setState',
          state: t,
          setStateOptions: n,
        });
      }
      cancel(t) {
        var r, o;
        const n = (r = R(this, $e)) == null ? void 0 : r.promise;
        return (
          (o = R(this, $e)) == null || o.cancel(t),
          n ? n.then(Dt).catch(Dt) : Promise.resolve()
        );
      }
      destroy() {
        (super.destroy(), this.cancel({ silent: !0 }));
      }
      reset() {
        (this.destroy(), this.setState(R(this, zo)));
      }
      isActive() {
        return this.observers.some((t) => DP(t.options.enabled, this) !== !1);
      }
      isDisabled() {
        return this.getObserversCount() > 0
          ? !this.isActive()
          : this.options.queryFn === Zf ||
              this.state.dataUpdateCount + this.state.errorUpdateCount === 0;
      }
      isStatic() {
        return this.getObserversCount() > 0
          ? this.observers.some(
              (t) => wd(t.options.staleTime, this) === 'static'
            )
          : !1;
      }
      isStale() {
        return this.getObserversCount() > 0
          ? this.observers.some((t) => t.getCurrentResult().isStale)
          : this.state.data === void 0 || this.state.isInvalidated;
      }
      isStaleByTime(t = 0) {
        return this.state.data === void 0
          ? !0
          : t === 'static'
            ? !1
            : this.state.isInvalidated
              ? !0
              : !RP(this.state.dataUpdatedAt, t);
      }
      onFocus() {
        var n;
        const t = this.observers.find((r) => r.shouldFetchOnWindowFocus());
        (t == null || t.refetch({ cancelRefetch: !1 }),
          (n = R(this, $e)) == null || n.continue());
      }
      onOnline() {
        var n;
        const t = this.observers.find((r) => r.shouldFetchOnReconnect());
        (t == null || t.refetch({ cancelRefetch: !1 }),
          (n = R(this, $e)) == null || n.continue());
      }
      addObserver(t) {
        this.observers.includes(t) ||
          (this.observers.push(t),
          this.clearGcTimeout(),
          R(this, pt).notify({
            type: 'observerAdded',
            query: this,
            observer: t,
          }));
      }
      removeObserver(t) {
        this.observers.includes(t) &&
          ((this.observers = this.observers.filter((n) => n !== t)),
          this.observers.length ||
            (R(this, $e) &&
              (R(this, Or)
                ? R(this, $e).cancel({ revert: !0 })
                : R(this, $e).cancelRetry()),
            this.scheduleGc()),
          R(this, pt).notify({
            type: 'observerRemoved',
            query: this,
            observer: t,
          }));
      }
      getObserversCount() {
        return this.observers.length;
      }
      invalidate() {
        this.state.isInvalidated ||
          Ie(this, Mt, mn).call(this, { type: 'invalidate' });
      }
      fetch(t, n) {
        var u, f, m;
        if (this.state.fetchStatus !== 'idle') {
          if (this.state.data !== void 0 && n != null && n.cancelRefetch)
            this.cancel({ silent: !0 });
          else if (R(this, $e))
            return (R(this, $e).continueRetry(), R(this, $e).promise);
        }
        if ((t && this.setOptions(t), !this.options.queryFn)) {
          const p = this.observers.find((h) => h.options.queryFn);
          p && this.setOptions(p.options);
        }
        const r = new AbortController(),
          o = (p) => {
            Object.defineProperty(p, 'signal', {
              enumerable: !0,
              get: () => (X(this, Or, !0), r.signal),
            });
          },
          s = () => {
            const p = Cy(this.options, n),
              b = (() => {
                const v = {
                  client: R(this, Ar),
                  queryKey: this.queryKey,
                  meta: this.meta,
                };
                return (o(v), v);
              })();
            return (
              X(this, Or, !1),
              this.options.persister ? this.options.persister(p, b, this) : p(b)
            );
          },
          l = (() => {
            const p = {
              fetchOptions: n,
              options: this.options,
              queryKey: this.queryKey,
              client: R(this, Ar),
              state: this.state,
              fetchFn: s,
            };
            return (o(p), p);
          })();
        ((u = this.options.behavior) == null || u.onFetch(l, this),
          X(this, Mr, this.state),
          (this.state.fetchStatus === 'idle' ||
            this.state.fetchMeta !==
              ((f = l.fetchOptions) == null ? void 0 : f.meta)) &&
            Ie(this, Mt, mn).call(this, {
              type: 'fetch',
              meta: (m = l.fetchOptions) == null ? void 0 : m.meta,
            }));
        const c = (p) => {
          var h, b, v, w;
          ((Zc(p) && p.silent) ||
            Ie(this, Mt, mn).call(this, { type: 'error', error: p }),
            Zc(p) ||
              ((b = (h = R(this, pt).config).onError) == null ||
                b.call(h, p, this),
              (w = (v = R(this, pt).config).onSettled) == null ||
                w.call(v, this.state.data, p, this)),
            this.scheduleGc());
        };
        return (
          X(
            this,
            $e,
            Py({
              initialPromise: n == null ? void 0 : n.initialPromise,
              fn: l.fetchFn,
              abort: r.abort.bind(r),
              onSuccess: (p) => {
                var h, b, v, w;
                if (p === void 0) {
                  c(new Error(`${this.queryHash} data is undefined`));
                  return;
                }
                try {
                  this.setData(p);
                } catch (x) {
                  c(x);
                  return;
                }
                ((b = (h = R(this, pt).config).onSuccess) == null ||
                  b.call(h, p, this),
                  (w = (v = R(this, pt).config).onSettled) == null ||
                    w.call(v, p, this.state.error, this),
                  this.scheduleGc());
              },
              onError: c,
              onFail: (p, h) => {
                Ie(this, Mt, mn).call(this, {
                  type: 'failed',
                  failureCount: p,
                  error: h,
                });
              },
              onPause: () => {
                Ie(this, Mt, mn).call(this, { type: 'pause' });
              },
              onContinue: () => {
                Ie(this, Mt, mn).call(this, { type: 'continue' });
              },
              retry: l.options.retry,
              retryDelay: l.options.retryDelay,
              networkMode: l.options.networkMode,
              canRun: () => !0,
            })
          ),
          R(this, $e).start()
        );
      }
    }),
    (zo = new WeakMap()),
    (Mr = new WeakMap()),
    (pt = new WeakMap()),
    (Ar = new WeakMap()),
    ($e = new WeakMap()),
    (ga = new WeakMap()),
    (Or = new WeakMap()),
    (Mt = new WeakSet()),
    (mn = function (t) {
      const n = (r) => {
        switch (t.type) {
          case 'failed':
            return {
              ...r,
              fetchFailureCount: t.failureCount,
              fetchFailureReason: t.error,
            };
          case 'pause':
            return { ...r, fetchStatus: 'paused' };
          case 'continue':
            return { ...r, fetchStatus: 'fetching' };
          case 'fetch':
            return {
              ...r,
              ...BP(r.data, this.options),
              fetchMeta: t.meta ?? null,
            };
          case 'success':
            return (
              X(this, Mr, void 0),
              {
                ...r,
                data: t.data,
                dataUpdateCount: r.dataUpdateCount + 1,
                dataUpdatedAt: t.dataUpdatedAt ?? Date.now(),
                error: null,
                isInvalidated: !1,
                status: 'success',
                ...(!t.manual && {
                  fetchStatus: 'idle',
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                }),
              }
            );
          case 'error':
            const o = t.error;
            return Zc(o) && o.revert && R(this, Mr)
              ? { ...R(this, Mr), fetchStatus: 'idle' }
              : {
                  ...r,
                  error: o,
                  errorUpdateCount: r.errorUpdateCount + 1,
                  errorUpdatedAt: Date.now(),
                  fetchFailureCount: r.fetchFailureCount + 1,
                  fetchFailureReason: o,
                  fetchStatus: 'idle',
                  status: 'error',
                };
          case 'invalidate':
            return { ...r, isInvalidated: !0 };
          case 'setState':
            return { ...r, ...t.state };
        }
      };
      ((this.state = n(this.state)),
        Ve.batch(() => {
          (this.observers.forEach((r) => {
            r.onQueryUpdate();
          }),
            R(this, pt).notify({ query: this, type: 'updated', action: t }));
        }));
    }),
    mg);
function BP(e, t) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: Ey(t.networkMode) ? 'fetching' : 'paused',
    ...(e === void 0 && { error: null, status: 'pending' }),
  };
}
function HP(e) {
  const t =
      typeof e.initialData == 'function' ? e.initialData() : e.initialData,
    n = t !== void 0,
    r = n
      ? typeof e.initialDataUpdatedAt == 'function'
        ? e.initialDataUpdatedAt()
        : e.initialDataUpdatedAt
      : 0;
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: n ? (r ?? Date.now()) : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: n ? 'success' : 'pending',
    fetchStatus: 'idle',
  };
}
var Kt,
  pg,
  VP =
    ((pg = class extends ql {
      constructor(t = {}) {
        super();
        oe(this, Kt);
        ((this.config = t), X(this, Kt, new Map()));
      }
      build(t, n, r) {
        const o = n.queryKey,
          s = n.queryHash ?? Xf(o, n);
        let i = this.get(s);
        return (
          i ||
            ((i = new UP({
              client: t,
              queryKey: o,
              queryHash: s,
              options: t.defaultQueryOptions(n),
              state: r,
              defaultOptions: t.getQueryDefaults(o),
            })),
            this.add(i)),
          i
        );
      }
      add(t) {
        R(this, Kt).has(t.queryHash) ||
          (R(this, Kt).set(t.queryHash, t),
          this.notify({ type: 'added', query: t }));
      }
      remove(t) {
        const n = R(this, Kt).get(t.queryHash);
        n &&
          (t.destroy(),
          n === t && R(this, Kt).delete(t.queryHash),
          this.notify({ type: 'removed', query: t }));
      }
      clear() {
        Ve.batch(() => {
          this.getAll().forEach((t) => {
            this.remove(t);
          });
        });
      }
      get(t) {
        return R(this, Kt).get(t);
      }
      getAll() {
        return [...R(this, Kt).values()];
      }
      find(t) {
        const n = { exact: !0, ...t };
        return this.getAll().find((r) => Sh(n, r));
      }
      findAll(t = {}) {
        const n = this.getAll();
        return Object.keys(t).length > 0 ? n.filter((r) => Sh(t, r)) : n;
      }
      notify(t) {
        Ve.batch(() => {
          this.listeners.forEach((n) => {
            n(t);
          });
        });
      }
      onFocus() {
        Ve.batch(() => {
          this.getAll().forEach((t) => {
            t.onFocus();
          });
        });
      }
      onOnline() {
        Ve.batch(() => {
          this.getAll().forEach((t) => {
            t.onOnline();
          });
        });
      }
    }),
    (Kt = new WeakMap()),
    pg),
  Qt,
  Be,
  _r,
  qt,
  $n,
  hg,
  YP =
    ((hg = class extends Ty {
      constructor(t) {
        super();
        oe(this, qt);
        oe(this, Qt);
        oe(this, Be);
        oe(this, _r);
        ((this.mutationId = t.mutationId),
          X(this, Be, t.mutationCache),
          X(this, Qt, []),
          (this.state = t.state || GP()),
          this.setOptions(t.options),
          this.scheduleGc());
      }
      setOptions(t) {
        ((this.options = t), this.updateGcTime(this.options.gcTime));
      }
      get meta() {
        return this.options.meta;
      }
      addObserver(t) {
        R(this, Qt).includes(t) ||
          (R(this, Qt).push(t),
          this.clearGcTimeout(),
          R(this, Be).notify({
            type: 'observerAdded',
            mutation: this,
            observer: t,
          }));
      }
      removeObserver(t) {
        (X(
          this,
          Qt,
          R(this, Qt).filter((n) => n !== t)
        ),
          this.scheduleGc(),
          R(this, Be).notify({
            type: 'observerRemoved',
            mutation: this,
            observer: t,
          }));
      }
      optionalRemove() {
        R(this, Qt).length ||
          (this.state.status === 'pending'
            ? this.scheduleGc()
            : R(this, Be).remove(this));
      }
      continue() {
        var t;
        return (
          ((t = R(this, _r)) == null ? void 0 : t.continue()) ??
          this.execute(this.state.variables)
        );
      }
      async execute(t) {
        var s, i, l, c, u, f, m, p, h, b, v, w, x, g, y, N, C, j, S, k;
        const n = () => {
          Ie(this, qt, $n).call(this, { type: 'continue' });
        };
        X(
          this,
          _r,
          Py({
            fn: () =>
              this.options.mutationFn
                ? this.options.mutationFn(t)
                : Promise.reject(new Error('No mutationFn found')),
            onFail: (M, D) => {
              Ie(this, qt, $n).call(this, {
                type: 'failed',
                failureCount: M,
                error: D,
              });
            },
            onPause: () => {
              Ie(this, qt, $n).call(this, { type: 'pause' });
            },
            onContinue: n,
            retry: this.options.retry ?? 0,
            retryDelay: this.options.retryDelay,
            networkMode: this.options.networkMode,
            canRun: () => R(this, Be).canRun(this),
          })
        );
        const r = this.state.status === 'pending',
          o = !R(this, _r).canStart();
        try {
          if (r) n();
          else {
            (Ie(this, qt, $n).call(this, {
              type: 'pending',
              variables: t,
              isPaused: o,
            }),
              await ((i = (s = R(this, Be).config).onMutate) == null
                ? void 0
                : i.call(s, t, this)));
            const D = await ((c = (l = this.options).onMutate) == null
              ? void 0
              : c.call(l, t));
            D !== this.state.context &&
              Ie(this, qt, $n).call(this, {
                type: 'pending',
                context: D,
                variables: t,
                isPaused: o,
              });
          }
          const M = await R(this, _r).start();
          return (
            await ((f = (u = R(this, Be).config).onSuccess) == null
              ? void 0
              : f.call(u, M, t, this.state.context, this)),
            await ((p = (m = this.options).onSuccess) == null
              ? void 0
              : p.call(m, M, t, this.state.context)),
            await ((b = (h = R(this, Be).config).onSettled) == null
              ? void 0
              : b.call(
                  h,
                  M,
                  null,
                  this.state.variables,
                  this.state.context,
                  this
                )),
            await ((w = (v = this.options).onSettled) == null
              ? void 0
              : w.call(v, M, null, t, this.state.context)),
            Ie(this, qt, $n).call(this, { type: 'success', data: M }),
            M
          );
        } catch (M) {
          try {
            throw (
              await ((g = (x = R(this, Be).config).onError) == null
                ? void 0
                : g.call(x, M, t, this.state.context, this)),
              await ((N = (y = this.options).onError) == null
                ? void 0
                : N.call(y, M, t, this.state.context)),
              await ((j = (C = R(this, Be).config).onSettled) == null
                ? void 0
                : j.call(
                    C,
                    void 0,
                    M,
                    this.state.variables,
                    this.state.context,
                    this
                  )),
              await ((k = (S = this.options).onSettled) == null
                ? void 0
                : k.call(S, void 0, M, t, this.state.context)),
              M
            );
          } finally {
            Ie(this, qt, $n).call(this, { type: 'error', error: M });
          }
        } finally {
          R(this, Be).runNext(this);
        }
      }
    }),
    (Qt = new WeakMap()),
    (Be = new WeakMap()),
    (_r = new WeakMap()),
    (qt = new WeakSet()),
    ($n = function (t) {
      const n = (r) => {
        switch (t.type) {
          case 'failed':
            return {
              ...r,
              failureCount: t.failureCount,
              failureReason: t.error,
            };
          case 'pause':
            return { ...r, isPaused: !0 };
          case 'continue':
            return { ...r, isPaused: !1 };
          case 'pending':
            return {
              ...r,
              context: t.context,
              data: void 0,
              failureCount: 0,
              failureReason: null,
              error: null,
              isPaused: t.isPaused,
              status: 'pending',
              variables: t.variables,
              submittedAt: Date.now(),
            };
          case 'success':
            return {
              ...r,
              data: t.data,
              failureCount: 0,
              failureReason: null,
              error: null,
              status: 'success',
              isPaused: !1,
            };
          case 'error':
            return {
              ...r,
              data: void 0,
              error: t.error,
              failureCount: r.failureCount + 1,
              failureReason: t.error,
              isPaused: !1,
              status: 'error',
            };
        }
      };
      ((this.state = n(this.state)),
        Ve.batch(() => {
          (R(this, Qt).forEach((r) => {
            r.onMutationUpdate(t);
          }),
            R(this, Be).notify({ mutation: this, type: 'updated', action: t }));
        }));
    }),
    hg);
function GP() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: 'idle',
    variables: void 0,
    submittedAt: 0,
  };
}
var vn,
  At,
  va,
  gg,
  KP =
    ((gg = class extends ql {
      constructor(t = {}) {
        super();
        oe(this, vn);
        oe(this, At);
        oe(this, va);
        ((this.config = t),
          X(this, vn, new Set()),
          X(this, At, new Map()),
          X(this, va, 0));
      }
      build(t, n, r) {
        const o = new YP({
          mutationCache: this,
          mutationId: ++Aa(this, va)._,
          options: t.defaultMutationOptions(n),
          state: r,
        });
        return (this.add(o), o);
      }
      add(t) {
        R(this, vn).add(t);
        const n = ni(t);
        if (typeof n == 'string') {
          const r = R(this, At).get(n);
          r ? r.push(t) : R(this, At).set(n, [t]);
        }
        this.notify({ type: 'added', mutation: t });
      }
      remove(t) {
        if (R(this, vn).delete(t)) {
          const n = ni(t);
          if (typeof n == 'string') {
            const r = R(this, At).get(n);
            if (r)
              if (r.length > 1) {
                const o = r.indexOf(t);
                o !== -1 && r.splice(o, 1);
              } else r[0] === t && R(this, At).delete(n);
          }
        }
        this.notify({ type: 'removed', mutation: t });
      }
      canRun(t) {
        const n = ni(t);
        if (typeof n == 'string') {
          const r = R(this, At).get(n),
            o =
              r == null ? void 0 : r.find((s) => s.state.status === 'pending');
          return !o || o === t;
        } else return !0;
      }
      runNext(t) {
        var r;
        const n = ni(t);
        if (typeof n == 'string') {
          const o =
            (r = R(this, At).get(n)) == null
              ? void 0
              : r.find((s) => s !== t && s.state.isPaused);
          return (o == null ? void 0 : o.continue()) ?? Promise.resolve();
        } else return Promise.resolve();
      }
      clear() {
        Ve.batch(() => {
          (R(this, vn).forEach((t) => {
            this.notify({ type: 'removed', mutation: t });
          }),
            R(this, vn).clear(),
            R(this, At).clear());
        });
      }
      getAll() {
        return Array.from(R(this, vn));
      }
      find(t) {
        const n = { exact: !0, ...t };
        return this.getAll().find((r) => Eh(n, r));
      }
      findAll(t = {}) {
        return this.getAll().filter((n) => Eh(t, n));
      }
      notify(t) {
        Ve.batch(() => {
          this.listeners.forEach((n) => {
            n(t);
          });
        });
      }
      resumePausedMutations() {
        const t = this.getAll().filter((n) => n.state.isPaused);
        return Ve.batch(() =>
          Promise.all(t.map((n) => n.continue().catch(Dt)))
        );
      }
    }),
    (vn = new WeakMap()),
    (At = new WeakMap()),
    (va = new WeakMap()),
    gg);
function ni(e) {
  var t;
  return (t = e.options.scope) == null ? void 0 : t.id;
}
function Th(e) {
  return {
    onFetch: (t, n) => {
      var f, m, p, h, b;
      const r = t.options,
        o =
          (p =
            (m = (f = t.fetchOptions) == null ? void 0 : f.meta) == null
              ? void 0
              : m.fetchMore) == null
            ? void 0
            : p.direction,
        s = ((h = t.state.data) == null ? void 0 : h.pages) || [],
        i = ((b = t.state.data) == null ? void 0 : b.pageParams) || [];
      let l = { pages: [], pageParams: [] },
        c = 0;
      const u = async () => {
        let v = !1;
        const w = (y) => {
            Object.defineProperty(y, 'signal', {
              enumerable: !0,
              get: () => (
                t.signal.aborted
                  ? (v = !0)
                  : t.signal.addEventListener('abort', () => {
                      v = !0;
                    }),
                t.signal
              ),
            });
          },
          x = Cy(t.options, t.fetchOptions),
          g = async (y, N, C) => {
            if (v) return Promise.reject();
            if (N == null && y.pages.length) return Promise.resolve(y);
            const S = (() => {
                const W = {
                  client: t.client,
                  queryKey: t.queryKey,
                  pageParam: N,
                  direction: C ? 'backward' : 'forward',
                  meta: t.options.meta,
                };
                return (w(W), W);
              })(),
              k = await x(S),
              { maxPages: M } = t.options,
              D = C ? _P : OP;
            return {
              pages: D(y.pages, k, M),
              pageParams: D(y.pageParams, N, M),
            };
          };
        if (o && s.length) {
          const y = o === 'backward',
            N = y ? QP : Rh,
            C = { pages: s, pageParams: i },
            j = N(r, C);
          l = await g(C, j, y);
        } else {
          const y = e ?? s.length;
          do {
            const N = c === 0 ? (i[0] ?? r.initialPageParam) : Rh(r, l);
            if (c > 0 && N == null) break;
            ((l = await g(l, N)), c++);
          } while (c < y);
        }
        return l;
      };
      t.options.persister
        ? (t.fetchFn = () => {
            var v, w;
            return (w = (v = t.options).persister) == null
              ? void 0
              : w.call(
                  v,
                  u,
                  {
                    client: t.client,
                    queryKey: t.queryKey,
                    meta: t.options.meta,
                    signal: t.signal,
                  },
                  n
                );
          })
        : (t.fetchFn = u);
    },
  };
}
function Rh(e, { pages: t, pageParams: n }) {
  const r = t.length - 1;
  return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0;
}
function QP(e, { pages: t, pageParams: n }) {
  var r;
  return t.length > 0
    ? (r = e.getPreviousPageParam) == null
      ? void 0
      : r.call(e, t[0], t, n[0], n)
    : void 0;
}
var be,
  Kn,
  Qn,
  Wo,
  Uo,
  qn,
  Bo,
  Ho,
  vg,
  qP =
    ((vg = class {
      constructor(e = {}) {
        oe(this, be);
        oe(this, Kn);
        oe(this, Qn);
        oe(this, Wo);
        oe(this, Uo);
        oe(this, qn);
        oe(this, Bo);
        oe(this, Ho);
        (X(this, be, e.queryCache || new VP()),
          X(this, Kn, e.mutationCache || new KP()),
          X(this, Qn, e.defaultOptions || {}),
          X(this, Wo, new Map()),
          X(this, Uo, new Map()),
          X(this, qn, 0));
      }
      mount() {
        (Aa(this, qn)._++,
          R(this, qn) === 1 &&
            (X(
              this,
              Bo,
              Sy.subscribe(async (e) => {
                e &&
                  (await this.resumePausedMutations(), R(this, be).onFocus());
              })
            ),
            X(
              this,
              Ho,
              ol.subscribe(async (e) => {
                e &&
                  (await this.resumePausedMutations(), R(this, be).onOnline());
              })
            )));
      }
      unmount() {
        var e, t;
        (Aa(this, qn)._--,
          R(this, qn) === 0 &&
            ((e = R(this, Bo)) == null || e.call(this),
            X(this, Bo, void 0),
            (t = R(this, Ho)) == null || t.call(this),
            X(this, Ho, void 0)));
      }
      isFetching(e) {
        return R(this, be).findAll({ ...e, fetchStatus: 'fetching' }).length;
      }
      isMutating(e) {
        return R(this, Kn).findAll({ ...e, status: 'pending' }).length;
      }
      getQueryData(e) {
        var n;
        const t = this.defaultQueryOptions({ queryKey: e });
        return (n = R(this, be).get(t.queryHash)) == null
          ? void 0
          : n.state.data;
      }
      ensureQueryData(e) {
        const t = this.defaultQueryOptions(e),
          n = R(this, be).build(this, t),
          r = n.state.data;
        return r === void 0
          ? this.fetchQuery(e)
          : (e.revalidateIfStale &&
              n.isStaleByTime(wd(t.staleTime, n)) &&
              this.prefetchQuery(t),
            Promise.resolve(r));
      }
      getQueriesData(e) {
        return R(this, be)
          .findAll(e)
          .map(({ queryKey: t, state: n }) => {
            const r = n.data;
            return [t, r];
          });
      }
      setQueryData(e, t, n) {
        const r = this.defaultQueryOptions({ queryKey: e }),
          o = R(this, be).get(r.queryHash),
          s = o == null ? void 0 : o.state.data,
          i = PP(t, s);
        if (i !== void 0)
          return R(this, be)
            .build(this, r)
            .setData(i, { ...n, manual: !0 });
      }
      setQueriesData(e, t, n) {
        return Ve.batch(() =>
          R(this, be)
            .findAll(e)
            .map(({ queryKey: r }) => [r, this.setQueryData(r, t, n)])
        );
      }
      getQueryState(e) {
        var n;
        const t = this.defaultQueryOptions({ queryKey: e });
        return (n = R(this, be).get(t.queryHash)) == null ? void 0 : n.state;
      }
      removeQueries(e) {
        const t = R(this, be);
        Ve.batch(() => {
          t.findAll(e).forEach((n) => {
            t.remove(n);
          });
        });
      }
      resetQueries(e, t) {
        const n = R(this, be);
        return Ve.batch(
          () => (
            n.findAll(e).forEach((r) => {
              r.reset();
            }),
            this.refetchQueries({ type: 'active', ...e }, t)
          )
        );
      }
      cancelQueries(e, t = {}) {
        const n = { revert: !0, ...t },
          r = Ve.batch(() =>
            R(this, be)
              .findAll(e)
              .map((o) => o.cancel(n))
          );
        return Promise.all(r).then(Dt).catch(Dt);
      }
      invalidateQueries(e, t = {}) {
        return Ve.batch(
          () => (
            R(this, be)
              .findAll(e)
              .forEach((n) => {
                n.invalidate();
              }),
            (e == null ? void 0 : e.refetchType) === 'none'
              ? Promise.resolve()
              : this.refetchQueries(
                  {
                    ...e,
                    type:
                      (e == null ? void 0 : e.refetchType) ??
                      (e == null ? void 0 : e.type) ??
                      'active',
                  },
                  t
                )
          )
        );
      }
      refetchQueries(e, t = {}) {
        const n = { ...t, cancelRefetch: t.cancelRefetch ?? !0 },
          r = Ve.batch(() =>
            R(this, be)
              .findAll(e)
              .filter((o) => !o.isDisabled() && !o.isStatic())
              .map((o) => {
                let s = o.fetch(void 0, n);
                return (
                  n.throwOnError || (s = s.catch(Dt)),
                  o.state.fetchStatus === 'paused' ? Promise.resolve() : s
                );
              })
          );
        return Promise.all(r).then(Dt);
      }
      fetchQuery(e) {
        const t = this.defaultQueryOptions(e);
        t.retry === void 0 && (t.retry = !1);
        const n = R(this, be).build(this, t);
        return n.isStaleByTime(wd(t.staleTime, n))
          ? n.fetch(t)
          : Promise.resolve(n.state.data);
      }
      prefetchQuery(e) {
        return this.fetchQuery(e).then(Dt).catch(Dt);
      }
      fetchInfiniteQuery(e) {
        return ((e.behavior = Th(e.pages)), this.fetchQuery(e));
      }
      prefetchInfiniteQuery(e) {
        return this.fetchInfiniteQuery(e).then(Dt).catch(Dt);
      }
      ensureInfiniteQueryData(e) {
        return ((e.behavior = Th(e.pages)), this.ensureQueryData(e));
      }
      resumePausedMutations() {
        return ol.isOnline()
          ? R(this, Kn).resumePausedMutations()
          : Promise.resolve();
      }
      getQueryCache() {
        return R(this, be);
      }
      getMutationCache() {
        return R(this, Kn);
      }
      getDefaultOptions() {
        return R(this, Qn);
      }
      setDefaultOptions(e) {
        X(this, Qn, e);
      }
      setQueryDefaults(e, t) {
        R(this, Wo).set(ua(e), { queryKey: e, defaultOptions: t });
      }
      getQueryDefaults(e) {
        const t = [...R(this, Wo).values()],
          n = {};
        return (
          t.forEach((r) => {
            da(e, r.queryKey) && Object.assign(n, r.defaultOptions);
          }),
          n
        );
      }
      setMutationDefaults(e, t) {
        R(this, Uo).set(ua(e), { mutationKey: e, defaultOptions: t });
      }
      getMutationDefaults(e) {
        const t = [...R(this, Uo).values()],
          n = {};
        return (
          t.forEach((r) => {
            da(e, r.mutationKey) && Object.assign(n, r.defaultOptions);
          }),
          n
        );
      }
      defaultQueryOptions(e) {
        if (e._defaulted) return e;
        const t = {
          ...R(this, Qn).queries,
          ...this.getQueryDefaults(e.queryKey),
          ...e,
          _defaulted: !0,
        };
        return (
          t.queryHash || (t.queryHash = Xf(t.queryKey, t)),
          t.refetchOnReconnect === void 0 &&
            (t.refetchOnReconnect = t.networkMode !== 'always'),
          t.throwOnError === void 0 && (t.throwOnError = !!t.suspense),
          !t.networkMode && t.persister && (t.networkMode = 'offlineFirst'),
          t.queryFn === Zf && (t.enabled = !1),
          t
        );
      }
      defaultMutationOptions(e) {
        return e != null && e._defaulted
          ? e
          : {
              ...R(this, Qn).mutations,
              ...((e == null ? void 0 : e.mutationKey) &&
                this.getMutationDefaults(e.mutationKey)),
              ...e,
              _defaulted: !0,
            };
      }
      clear() {
        (R(this, be).clear(), R(this, Kn).clear());
      }
    }),
    (be = new WeakMap()),
    (Kn = new WeakMap()),
    (Qn = new WeakMap()),
    (Wo = new WeakMap()),
    (Uo = new WeakMap()),
    (qn = new WeakMap()),
    (Bo = new WeakMap()),
    (Ho = new WeakMap()),
    vg),
  XP = d.createContext(void 0),
  ZP = ({ client: e, children: t }) => (
    d.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount();
        }
      ),
      [e]
    ),
    a.jsx(XP.Provider, { value: e, children: t })
  );
/**
 * @remix-run/router v1.23.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function fa() {
  return (
    (fa = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n)
              Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    fa.apply(this, arguments)
  );
}
var Jn;
(function (e) {
  ((e.Pop = 'POP'), (e.Push = 'PUSH'), (e.Replace = 'REPLACE'));
})(Jn || (Jn = {}));
const Dh = 'popstate';
function JP(e) {
  e === void 0 && (e = {});
  function t(r, o) {
    let { pathname: s, search: i, hash: l } = r.location;
    return Nd(
      '',
      { pathname: s, search: i, hash: l },
      (o.state && o.state.usr) || null,
      (o.state && o.state.key) || 'default'
    );
  }
  function n(r, o) {
    return typeof o == 'string' ? o : sl(o);
  }
  return tT(t, n, null, e);
}
function je(e, t) {
  if (e === !1 || e === null || typeof e > 'u') throw new Error(t);
}
function Ry(e, t) {
  if (!e) {
    typeof console < 'u' && console.warn(t);
    try {
      throw new Error(t);
    } catch {}
  }
}
function eT() {
  return Math.random().toString(36).substr(2, 8);
}
function Mh(e, t) {
  return { usr: e.state, key: e.key, idx: t };
}
function Nd(e, t, n, r) {
  return (
    n === void 0 && (n = null),
    fa(
      { pathname: typeof e == 'string' ? e : e.pathname, search: '', hash: '' },
      typeof t == 'string' ? cs(t) : t,
      { state: n, key: (t && t.key) || r || eT() }
    )
  );
}
function sl(e) {
  let { pathname: t = '/', search: n = '', hash: r = '' } = e;
  return (
    n && n !== '?' && (t += n.charAt(0) === '?' ? n : '?' + n),
    r && r !== '#' && (t += r.charAt(0) === '#' ? r : '#' + r),
    t
  );
}
function cs(e) {
  let t = {};
  if (e) {
    let n = e.indexOf('#');
    n >= 0 && ((t.hash = e.substr(n)), (e = e.substr(0, n)));
    let r = e.indexOf('?');
    (r >= 0 && ((t.search = e.substr(r)), (e = e.substr(0, r))),
      e && (t.pathname = e));
  }
  return t;
}
function tT(e, t, n, r) {
  r === void 0 && (r = {});
  let { window: o = document.defaultView, v5Compat: s = !1 } = r,
    i = o.history,
    l = Jn.Pop,
    c = null,
    u = f();
  u == null && ((u = 0), i.replaceState(fa({}, i.state, { idx: u }), ''));
  function f() {
    return (i.state || { idx: null }).idx;
  }
  function m() {
    l = Jn.Pop;
    let w = f(),
      x = w == null ? null : w - u;
    ((u = w), c && c({ action: l, location: v.location, delta: x }));
  }
  function p(w, x) {
    l = Jn.Push;
    let g = Nd(v.location, w, x);
    u = f() + 1;
    let y = Mh(g, u),
      N = v.createHref(g);
    try {
      i.pushState(y, '', N);
    } catch (C) {
      if (C instanceof DOMException && C.name === 'DataCloneError') throw C;
      o.location.assign(N);
    }
    s && c && c({ action: l, location: v.location, delta: 1 });
  }
  function h(w, x) {
    l = Jn.Replace;
    let g = Nd(v.location, w, x);
    u = f();
    let y = Mh(g, u),
      N = v.createHref(g);
    (i.replaceState(y, '', N),
      s && c && c({ action: l, location: v.location, delta: 0 }));
  }
  function b(w) {
    let x = o.location.origin !== 'null' ? o.location.origin : o.location.href,
      g = typeof w == 'string' ? w : sl(w);
    return (
      (g = g.replace(/ $/, '%20')),
      je(
        x,
        'No window.location.(origin|href) available to create URL for href: ' +
          g
      ),
      new URL(g, x)
    );
  }
  let v = {
    get action() {
      return l;
    },
    get location() {
      return e(o, i);
    },
    listen(w) {
      if (c) throw new Error('A history only accepts one active listener');
      return (
        o.addEventListener(Dh, m),
        (c = w),
        () => {
          (o.removeEventListener(Dh, m), (c = null));
        }
      );
    },
    createHref(w) {
      return t(o, w);
    },
    createURL: b,
    encodeLocation(w) {
      let x = b(w);
      return { pathname: x.pathname, search: x.search, hash: x.hash };
    },
    push: p,
    replace: h,
    go(w) {
      return i.go(w);
    },
  };
  return v;
}
var Ah;
(function (e) {
  ((e.data = 'data'),
    (e.deferred = 'deferred'),
    (e.redirect = 'redirect'),
    (e.error = 'error'));
})(Ah || (Ah = {}));
function nT(e, t, n) {
  return (n === void 0 && (n = '/'), rT(e, t, n, !1));
}
function rT(e, t, n, r) {
  let o = typeof t == 'string' ? cs(t) : t,
    s = ts(o.pathname || '/', n);
  if (s == null) return null;
  let i = Dy(e);
  oT(i);
  let l = null;
  for (let c = 0; l == null && c < i.length; ++c) {
    let u = hT(s);
    l = mT(i[c], u, r);
  }
  return l;
}
function Dy(e, t, n, r) {
  (t === void 0 && (t = []),
    n === void 0 && (n = []),
    r === void 0 && (r = ''));
  let o = (s, i, l) => {
    let c = {
      relativePath: l === void 0 ? s.path || '' : l,
      caseSensitive: s.caseSensitive === !0,
      childrenIndex: i,
      route: s,
    };
    c.relativePath.startsWith('/') &&
      (je(
        c.relativePath.startsWith(r),
        'Absolute route path "' +
          c.relativePath +
          '" nested under path ' +
          ('"' + r + '" is not valid. An absolute child route path ') +
          'must start with the combined path of all its parent routes.'
      ),
      (c.relativePath = c.relativePath.slice(r.length)));
    let u = lr([r, c.relativePath]),
      f = n.concat(c);
    (s.children &&
      s.children.length > 0 &&
      (je(
        s.index !== !0,
        'Index routes must not have child routes. Please remove ' +
          ('all child routes from route path "' + u + '".')
      ),
      Dy(s.children, t, f, u)),
      !(s.path == null && !s.index) &&
        t.push({ path: u, score: dT(u, s.index), routesMeta: f }));
  };
  return (
    e.forEach((s, i) => {
      var l;
      if (s.path === '' || !((l = s.path) != null && l.includes('?'))) o(s, i);
      else for (let c of My(s.path)) o(s, i, c);
    }),
    t
  );
}
function My(e) {
  let t = e.split('/');
  if (t.length === 0) return [];
  let [n, ...r] = t,
    o = n.endsWith('?'),
    s = n.replace(/\?$/, '');
  if (r.length === 0) return o ? [s, ''] : [s];
  let i = My(r.join('/')),
    l = [];
  return (
    l.push(...i.map((c) => (c === '' ? s : [s, c].join('/')))),
    o && l.push(...i),
    l.map((c) => (e.startsWith('/') && c === '' ? '/' : c))
  );
}
function oT(e) {
  e.sort((t, n) =>
    t.score !== n.score
      ? n.score - t.score
      : fT(
          t.routesMeta.map((r) => r.childrenIndex),
          n.routesMeta.map((r) => r.childrenIndex)
        )
  );
}
const sT = /^:[\w-]+$/,
  aT = 3,
  iT = 2,
  lT = 1,
  cT = 10,
  uT = -2,
  Oh = (e) => e === '*';
function dT(e, t) {
  let n = e.split('/'),
    r = n.length;
  return (
    n.some(Oh) && (r += uT),
    t && (r += iT),
    n
      .filter((o) => !Oh(o))
      .reduce((o, s) => o + (sT.test(s) ? aT : s === '' ? lT : cT), r)
  );
}
function fT(e, t) {
  return e.length === t.length && e.slice(0, -1).every((r, o) => r === t[o])
    ? e[e.length - 1] - t[t.length - 1]
    : 0;
}
function mT(e, t, n) {
  let { routesMeta: r } = e,
    o = {},
    s = '/',
    i = [];
  for (let l = 0; l < r.length; ++l) {
    let c = r[l],
      u = l === r.length - 1,
      f = s === '/' ? t : t.slice(s.length) || '/',
      m = al(
        { path: c.relativePath, caseSensitive: c.caseSensitive, end: u },
        f
      ),
      p = c.route;
    if (
      (!m &&
        u &&
        n &&
        !r[r.length - 1].route.index &&
        (m = al(
          { path: c.relativePath, caseSensitive: c.caseSensitive, end: !1 },
          f
        )),
      !m)
    )
      return null;
    (Object.assign(o, m.params),
      i.push({
        params: o,
        pathname: lr([s, m.pathname]),
        pathnameBase: yT(lr([s, m.pathnameBase])),
        route: p,
      }),
      m.pathnameBase !== '/' && (s = lr([s, m.pathnameBase])));
  }
  return i;
}
function al(e, t) {
  typeof e == 'string' && (e = { path: e, caseSensitive: !1, end: !0 });
  let [n, r] = pT(e.path, e.caseSensitive, e.end),
    o = t.match(n);
  if (!o) return null;
  let s = o[0],
    i = s.replace(/(.)\/+$/, '$1'),
    l = o.slice(1);
  return {
    params: r.reduce((u, f, m) => {
      let { paramName: p, isOptional: h } = f;
      if (p === '*') {
        let v = l[m] || '';
        i = s.slice(0, s.length - v.length).replace(/(.)\/+$/, '$1');
      }
      const b = l[m];
      return (
        h && !b ? (u[p] = void 0) : (u[p] = (b || '').replace(/%2F/g, '/')),
        u
      );
    }, {}),
    pathname: s,
    pathnameBase: i,
    pattern: e,
  };
}
function pT(e, t, n) {
  (t === void 0 && (t = !1),
    n === void 0 && (n = !0),
    Ry(
      e === '*' || !e.endsWith('*') || e.endsWith('/*'),
      'Route path "' +
        e +
        '" will be treated as if it were ' +
        ('"' + e.replace(/\*$/, '/*') + '" because the `*` character must ') +
        'always follow a `/` in the pattern. To get rid of this warning, ' +
        ('please change the route path to "' + e.replace(/\*$/, '/*') + '".')
    ));
  let r = [],
    o =
      '^' +
      e
        .replace(/\/*\*?$/, '')
        .replace(/^\/*/, '/')
        .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (i, l, c) => (
            r.push({ paramName: l, isOptional: c != null }),
            c ? '/?([^\\/]+)?' : '/([^\\/]+)'
          )
        );
  return (
    e.endsWith('*')
      ? (r.push({ paramName: '*' }),
        (o += e === '*' || e === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'))
      : n
        ? (o += '\\/*$')
        : e !== '' && e !== '/' && (o += '(?:(?=\\/|$))'),
    [new RegExp(o, t ? void 0 : 'i'), r]
  );
}
function hT(e) {
  try {
    return e
      .split('/')
      .map((t) => decodeURIComponent(t).replace(/\//g, '%2F'))
      .join('/');
  } catch (t) {
    return (
      Ry(
        !1,
        'The URL path "' +
          e +
          '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' +
          ('encoding (' + t + ').')
      ),
      e
    );
  }
}
function ts(e, t) {
  if (t === '/') return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
  let n = t.endsWith('/') ? t.length - 1 : t.length,
    r = e.charAt(n);
  return r && r !== '/' ? null : e.slice(n) || '/';
}
function gT(e, t) {
  t === void 0 && (t = '/');
  let {
    pathname: n,
    search: r = '',
    hash: o = '',
  } = typeof e == 'string' ? cs(e) : e;
  return {
    pathname: n ? (n.startsWith('/') ? n : vT(n, t)) : t,
    search: wT(r),
    hash: bT(o),
  };
}
function vT(e, t) {
  let n = t.replace(/\/+$/, '').split('/');
  return (
    e.split('/').forEach((o) => {
      o === '..' ? n.length > 1 && n.pop() : o !== '.' && n.push(o);
    }),
    n.length > 1 ? n.join('/') : '/'
  );
}
function Jc(e, t, n, r) {
  return (
    "Cannot include a '" +
    e +
    "' character in a manually specified " +
    ('`to.' +
      t +
      '` field [' +
      JSON.stringify(r) +
      '].  Please separate it out to the ') +
    ('`to.' + n + '` field. Alternatively you may provide the full path as ') +
    'a string in <Link to="..."> and the router will parse it for you.'
  );
}
function xT(e) {
  return e.filter(
    (t, n) => n === 0 || (t.route.path && t.route.path.length > 0)
  );
}
function Ay(e, t) {
  let n = xT(e);
  return t
    ? n.map((r, o) => (o === n.length - 1 ? r.pathname : r.pathnameBase))
    : n.map((r) => r.pathnameBase);
}
function Oy(e, t, n, r) {
  r === void 0 && (r = !1);
  let o;
  typeof e == 'string'
    ? (o = cs(e))
    : ((o = fa({}, e)),
      je(
        !o.pathname || !o.pathname.includes('?'),
        Jc('?', 'pathname', 'search', o)
      ),
      je(
        !o.pathname || !o.pathname.includes('#'),
        Jc('#', 'pathname', 'hash', o)
      ),
      je(!o.search || !o.search.includes('#'), Jc('#', 'search', 'hash', o)));
  let s = e === '' || o.pathname === '',
    i = s ? '/' : o.pathname,
    l;
  if (i == null) l = n;
  else {
    let m = t.length - 1;
    if (!r && i.startsWith('..')) {
      let p = i.split('/');
      for (; p[0] === '..'; ) (p.shift(), (m -= 1));
      o.pathname = p.join('/');
    }
    l = m >= 0 ? t[m] : '/';
  }
  let c = gT(o, l),
    u = i && i !== '/' && i.endsWith('/'),
    f = (s || i === '.') && n.endsWith('/');
  return (!c.pathname.endsWith('/') && (u || f) && (c.pathname += '/'), c);
}
const lr = (e) => e.join('/').replace(/\/\/+/g, '/'),
  yT = (e) => e.replace(/\/+$/, '').replace(/^\/*/, '/'),
  wT = (e) => (!e || e === '?' ? '' : e.startsWith('?') ? e : '?' + e),
  bT = (e) => (!e || e === '#' ? '' : e.startsWith('#') ? e : '#' + e);
function NT(e) {
  return (
    e != null &&
    typeof e.status == 'number' &&
    typeof e.statusText == 'string' &&
    typeof e.internal == 'boolean' &&
    'data' in e
  );
}
const _y = ['post', 'put', 'patch', 'delete'];
new Set(_y);
const jT = ['get', ..._y];
new Set(jT);
/**
 * React Router v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function ma() {
  return (
    (ma = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n)
              Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    ma.apply(this, arguments)
  );
}
const Zl = d.createContext(null),
  Iy = d.createContext(null),
  vr = d.createContext(null),
  Jl = d.createContext(null),
  xr = d.createContext({ outlet: null, matches: [], isDataRoute: !1 }),
  Ly = d.createContext(null);
function CT(e, t) {
  let { relative: n } = t === void 0 ? {} : t;
  Pa() || je(!1);
  let { basename: r, navigator: o } = d.useContext(vr),
    { hash: s, pathname: i, search: l } = ec(e, { relative: n }),
    c = i;
  return (
    r !== '/' && (c = i === '/' ? r : lr([r, i])),
    o.createHref({ pathname: c, search: l, hash: s })
  );
}
function Pa() {
  return d.useContext(Jl) != null;
}
function us() {
  return (Pa() || je(!1), d.useContext(Jl).location);
}
function Fy(e) {
  d.useContext(vr).static || d.useLayoutEffect(e);
}
function ST() {
  let { isDataRoute: e } = d.useContext(xr);
  return e ? $T() : ET();
}
function ET() {
  Pa() || je(!1);
  let e = d.useContext(Zl),
    { basename: t, future: n, navigator: r } = d.useContext(vr),
    { matches: o } = d.useContext(xr),
    { pathname: s } = us(),
    i = JSON.stringify(Ay(o, n.v7_relativeSplatPath)),
    l = d.useRef(!1);
  return (
    Fy(() => {
      l.current = !0;
    }),
    d.useCallback(
      function (u, f) {
        if ((f === void 0 && (f = {}), !l.current)) return;
        if (typeof u == 'number') {
          r.go(u);
          return;
        }
        let m = Oy(u, JSON.parse(i), s, f.relative === 'path');
        (e == null &&
          t !== '/' &&
          (m.pathname = m.pathname === '/' ? t : lr([t, m.pathname])),
          (f.replace ? r.replace : r.push)(m, f.state, f));
      },
      [t, r, i, s, e]
    )
  );
}
function kT() {
  let { matches: e } = d.useContext(xr),
    t = e[e.length - 1];
  return t ? t.params : {};
}
function ec(e, t) {
  let { relative: n } = t === void 0 ? {} : t,
    { future: r } = d.useContext(vr),
    { matches: o } = d.useContext(xr),
    { pathname: s } = us(),
    i = JSON.stringify(Ay(o, r.v7_relativeSplatPath));
  return d.useMemo(() => Oy(e, JSON.parse(i), s, n === 'path'), [e, i, s, n]);
}
function PT(e, t) {
  return TT(e, t);
}
function TT(e, t, n, r) {
  Pa() || je(!1);
  let { navigator: o } = d.useContext(vr),
    { matches: s } = d.useContext(xr),
    i = s[s.length - 1],
    l = i ? i.params : {};
  i && i.pathname;
  let c = i ? i.pathnameBase : '/';
  i && i.route;
  let u = us(),
    f;
  if (t) {
    var m;
    let w = typeof t == 'string' ? cs(t) : t;
    (c === '/' || ((m = w.pathname) != null && m.startsWith(c)) || je(!1),
      (f = w));
  } else f = u;
  let p = f.pathname || '/',
    h = p;
  if (c !== '/') {
    let w = c.replace(/^\//, '').split('/');
    h = '/' + p.replace(/^\//, '').split('/').slice(w.length).join('/');
  }
  let b = nT(e, { pathname: h }),
    v = OT(
      b &&
        b.map((w) =>
          Object.assign({}, w, {
            params: Object.assign({}, l, w.params),
            pathname: lr([
              c,
              o.encodeLocation
                ? o.encodeLocation(w.pathname).pathname
                : w.pathname,
            ]),
            pathnameBase:
              w.pathnameBase === '/'
                ? c
                : lr([
                    c,
                    o.encodeLocation
                      ? o.encodeLocation(w.pathnameBase).pathname
                      : w.pathnameBase,
                  ]),
          })
        ),
      s,
      n,
      r
    );
  return t && v
    ? d.createElement(
        Jl.Provider,
        {
          value: {
            location: ma(
              {
                pathname: '/',
                search: '',
                hash: '',
                state: null,
                key: 'default',
              },
              f
            ),
            navigationType: Jn.Pop,
          },
        },
        v
      )
    : v;
}
function RT() {
  let e = FT(),
    t = NT(e)
      ? e.status + ' ' + e.statusText
      : e instanceof Error
        ? e.message
        : JSON.stringify(e),
    n = e instanceof Error ? e.stack : null,
    o = { padding: '0.5rem', backgroundColor: 'rgba(200,200,200, 0.5)' };
  return d.createElement(
    d.Fragment,
    null,
    d.createElement('h2', null, 'Unexpected Application Error!'),
    d.createElement('h3', { style: { fontStyle: 'italic' } }, t),
    n ? d.createElement('pre', { style: o }, n) : null,
    null
  );
}
const DT = d.createElement(RT, null);
class MT extends d.Component {
  constructor(t) {
    (super(t),
      (this.state = {
        location: t.location,
        revalidation: t.revalidation,
        error: t.error,
      }));
  }
  static getDerivedStateFromError(t) {
    return { error: t };
  }
  static getDerivedStateFromProps(t, n) {
    return n.location !== t.location ||
      (n.revalidation !== 'idle' && t.revalidation === 'idle')
      ? { error: t.error, location: t.location, revalidation: t.revalidation }
      : {
          error: t.error !== void 0 ? t.error : n.error,
          location: n.location,
          revalidation: t.revalidation || n.revalidation,
        };
  }
  componentDidCatch(t, n) {
    console.error(
      'React Router caught the following error during render',
      t,
      n
    );
  }
  render() {
    return this.state.error !== void 0
      ? d.createElement(
          xr.Provider,
          { value: this.props.routeContext },
          d.createElement(Ly.Provider, {
            value: this.state.error,
            children: this.props.component,
          })
        )
      : this.props.children;
  }
}
function AT(e) {
  let { routeContext: t, match: n, children: r } = e,
    o = d.useContext(Zl);
  return (
    o &&
      o.static &&
      o.staticContext &&
      (n.route.errorElement || n.route.ErrorBoundary) &&
      (o.staticContext._deepestRenderedBoundaryId = n.route.id),
    d.createElement(xr.Provider, { value: t }, r)
  );
}
function OT(e, t, n, r) {
  var o;
  if (
    (t === void 0 && (t = []),
    n === void 0 && (n = null),
    r === void 0 && (r = null),
    e == null)
  ) {
    var s;
    if (!n) return null;
    if (n.errors) e = n.matches;
    else if (
      (s = r) != null &&
      s.v7_partialHydration &&
      t.length === 0 &&
      !n.initialized &&
      n.matches.length > 0
    )
      e = n.matches;
    else return null;
  }
  let i = e,
    l = (o = n) == null ? void 0 : o.errors;
  if (l != null) {
    let f = i.findIndex(
      (m) => m.route.id && (l == null ? void 0 : l[m.route.id]) !== void 0
    );
    (f >= 0 || je(!1), (i = i.slice(0, Math.min(i.length, f + 1))));
  }
  let c = !1,
    u = -1;
  if (n && r && r.v7_partialHydration)
    for (let f = 0; f < i.length; f++) {
      let m = i[f];
      if (
        ((m.route.HydrateFallback || m.route.hydrateFallbackElement) && (u = f),
        m.route.id)
      ) {
        let { loaderData: p, errors: h } = n,
          b =
            m.route.loader &&
            p[m.route.id] === void 0 &&
            (!h || h[m.route.id] === void 0);
        if (m.route.lazy || b) {
          ((c = !0), u >= 0 ? (i = i.slice(0, u + 1)) : (i = [i[0]]));
          break;
        }
      }
    }
  return i.reduceRight((f, m, p) => {
    let h,
      b = !1,
      v = null,
      w = null;
    n &&
      ((h = l && m.route.id ? l[m.route.id] : void 0),
      (v = m.route.errorElement || DT),
      c &&
        (u < 0 && p === 0
          ? ((b = !0), (w = null))
          : u === p &&
            ((b = !0), (w = m.route.hydrateFallbackElement || null))));
    let x = t.concat(i.slice(0, p + 1)),
      g = () => {
        let y;
        return (
          h
            ? (y = v)
            : b
              ? (y = w)
              : m.route.Component
                ? (y = d.createElement(m.route.Component, null))
                : m.route.element
                  ? (y = m.route.element)
                  : (y = f),
          d.createElement(AT, {
            match: m,
            routeContext: { outlet: f, matches: x, isDataRoute: n != null },
            children: y,
          })
        );
      };
    return n && (m.route.ErrorBoundary || m.route.errorElement || p === 0)
      ? d.createElement(MT, {
          location: n.location,
          revalidation: n.revalidation,
          component: v,
          error: h,
          children: g(),
          routeContext: { outlet: null, matches: x, isDataRoute: !0 },
        })
      : g();
  }, null);
}
var $y = (function (e) {
    return (
      (e.UseBlocker = 'useBlocker'),
      (e.UseRevalidator = 'useRevalidator'),
      (e.UseNavigateStable = 'useNavigate'),
      e
    );
  })($y || {}),
  il = (function (e) {
    return (
      (e.UseBlocker = 'useBlocker'),
      (e.UseLoaderData = 'useLoaderData'),
      (e.UseActionData = 'useActionData'),
      (e.UseRouteError = 'useRouteError'),
      (e.UseNavigation = 'useNavigation'),
      (e.UseRouteLoaderData = 'useRouteLoaderData'),
      (e.UseMatches = 'useMatches'),
      (e.UseRevalidator = 'useRevalidator'),
      (e.UseNavigateStable = 'useNavigate'),
      (e.UseRouteId = 'useRouteId'),
      e
    );
  })(il || {});
function _T(e) {
  let t = d.useContext(Zl);
  return (t || je(!1), t);
}
function IT(e) {
  let t = d.useContext(Iy);
  return (t || je(!1), t);
}
function LT(e) {
  let t = d.useContext(xr);
  return (t || je(!1), t);
}
function zy(e) {
  let t = LT(),
    n = t.matches[t.matches.length - 1];
  return (n.route.id || je(!1), n.route.id);
}
function FT() {
  var e;
  let t = d.useContext(Ly),
    n = IT(il.UseRouteError),
    r = zy(il.UseRouteError);
  return t !== void 0 ? t : (e = n.errors) == null ? void 0 : e[r];
}
function $T() {
  let { router: e } = _T($y.UseNavigateStable),
    t = zy(il.UseNavigateStable),
    n = d.useRef(!1);
  return (
    Fy(() => {
      n.current = !0;
    }),
    d.useCallback(
      function (o, s) {
        (s === void 0 && (s = {}),
          n.current &&
            (typeof o == 'number'
              ? e.navigate(o)
              : e.navigate(o, ma({ fromRouteId: t }, s))));
      },
      [e, t]
    )
  );
}
function zT(e, t) {
  (e == null || e.v7_startTransition, e == null || e.v7_relativeSplatPath);
}
function Si(e) {
  je(!1);
}
function WT(e) {
  let {
    basename: t = '/',
    children: n = null,
    location: r,
    navigationType: o = Jn.Pop,
    navigator: s,
    static: i = !1,
    future: l,
  } = e;
  Pa() && je(!1);
  let c = t.replace(/^\/*/, '/'),
    u = d.useMemo(
      () => ({
        basename: c,
        navigator: s,
        static: i,
        future: ma({ v7_relativeSplatPath: !1 }, l),
      }),
      [c, l, s, i]
    );
  typeof r == 'string' && (r = cs(r));
  let {
      pathname: f = '/',
      search: m = '',
      hash: p = '',
      state: h = null,
      key: b = 'default',
    } = r,
    v = d.useMemo(() => {
      let w = ts(f, c);
      return w == null
        ? null
        : {
            location: { pathname: w, search: m, hash: p, state: h, key: b },
            navigationType: o,
          };
    }, [c, f, m, p, h, b, o]);
  return v == null
    ? null
    : d.createElement(
        vr.Provider,
        { value: u },
        d.createElement(Jl.Provider, { children: n, value: v })
      );
}
function UT(e) {
  let { children: t, location: n } = e;
  return PT(jd(t), n);
}
new Promise(() => {});
function jd(e, t) {
  t === void 0 && (t = []);
  let n = [];
  return (
    d.Children.forEach(e, (r, o) => {
      if (!d.isValidElement(r)) return;
      let s = [...t, o];
      if (r.type === d.Fragment) {
        n.push.apply(n, jd(r.props.children, s));
        return;
      }
      (r.type !== Si && je(!1), !r.props.index || !r.props.children || je(!1));
      let i = {
        id: r.props.id || s.join('-'),
        caseSensitive: r.props.caseSensitive,
        element: r.props.element,
        Component: r.props.Component,
        index: r.props.index,
        path: r.props.path,
        loader: r.props.loader,
        action: r.props.action,
        errorElement: r.props.errorElement,
        ErrorBoundary: r.props.ErrorBoundary,
        hasErrorBoundary:
          r.props.ErrorBoundary != null || r.props.errorElement != null,
        shouldRevalidate: r.props.shouldRevalidate,
        handle: r.props.handle,
        lazy: r.props.lazy,
      };
      (r.props.children && (i.children = jd(r.props.children, s)), n.push(i));
    }),
    n
  );
}
/**
 * React Router DOM v6.30.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function ll() {
  return (
    (ll = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n)
              Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    ll.apply(this, arguments)
  );
}
function Wy(e, t) {
  if (e == null) return {};
  var n = {},
    r = Object.keys(e),
    o,
    s;
  for (s = 0; s < r.length; s++)
    ((o = r[s]), !(t.indexOf(o) >= 0) && (n[o] = e[o]));
  return n;
}
function BT(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function HT(e, t) {
  return e.button === 0 && (!t || t === '_self') && !BT(e);
}
const VT = [
    'onClick',
    'relative',
    'reloadDocument',
    'replace',
    'state',
    'target',
    'to',
    'preventScrollReset',
    'viewTransition',
  ],
  YT = [
    'aria-current',
    'caseSensitive',
    'className',
    'end',
    'style',
    'to',
    'viewTransition',
    'children',
  ],
  GT = '6';
try {
  window.__reactRouterVersion = GT;
} catch {}
const KT = d.createContext({ isTransitioning: !1 }),
  QT = 'startTransition',
  _h = Wd[QT];
function qT(e) {
  let { basename: t, children: n, future: r, window: o } = e,
    s = d.useRef();
  s.current == null && (s.current = JP({ window: o, v5Compat: !0 }));
  let i = s.current,
    [l, c] = d.useState({ action: i.action, location: i.location }),
    { v7_startTransition: u } = r || {},
    f = d.useCallback(
      (m) => {
        u && _h ? _h(() => c(m)) : c(m);
      },
      [c, u]
    );
  return (
    d.useLayoutEffect(() => i.listen(f), [i, f]),
    d.useEffect(() => zT(r), [r]),
    d.createElement(WT, {
      basename: t,
      children: n,
      location: l.location,
      navigationType: l.action,
      navigator: i,
      future: r,
    })
  );
}
const XT =
    typeof window < 'u' &&
    typeof window.document < 'u' &&
    typeof window.document.createElement < 'u',
  ZT = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Fr = d.forwardRef(function (t, n) {
    let {
        onClick: r,
        relative: o,
        reloadDocument: s,
        replace: i,
        state: l,
        target: c,
        to: u,
        preventScrollReset: f,
        viewTransition: m,
      } = t,
      p = Wy(t, VT),
      { basename: h } = d.useContext(vr),
      b,
      v = !1;
    if (typeof u == 'string' && ZT.test(u) && ((b = u), XT))
      try {
        let y = new URL(window.location.href),
          N = u.startsWith('//') ? new URL(y.protocol + u) : new URL(u),
          C = ts(N.pathname, h);
        N.origin === y.origin && C != null
          ? (u = C + N.search + N.hash)
          : (v = !0);
      } catch {}
    let w = CT(u, { relative: o }),
      x = t4(u, {
        replace: i,
        state: l,
        target: c,
        preventScrollReset: f,
        relative: o,
        viewTransition: m,
      });
    function g(y) {
      (r && r(y), y.defaultPrevented || x(y));
    }
    return d.createElement(
      'a',
      ll({}, p, { href: b || w, onClick: v || s ? r : g, ref: n, target: c })
    );
  }),
  JT = d.forwardRef(function (t, n) {
    let {
        'aria-current': r = 'page',
        caseSensitive: o = !1,
        className: s = '',
        end: i = !1,
        style: l,
        to: c,
        viewTransition: u,
        children: f,
      } = t,
      m = Wy(t, YT),
      p = ec(c, { relative: m.relative }),
      h = us(),
      b = d.useContext(Iy),
      { navigator: v, basename: w } = d.useContext(vr),
      x = b != null && n4(p) && u === !0,
      g = v.encodeLocation ? v.encodeLocation(p).pathname : p.pathname,
      y = h.pathname,
      N =
        b && b.navigation && b.navigation.location
          ? b.navigation.location.pathname
          : null;
    (o ||
      ((y = y.toLowerCase()),
      (N = N ? N.toLowerCase() : null),
      (g = g.toLowerCase())),
      N && w && (N = ts(N, w) || N));
    const C = g !== '/' && g.endsWith('/') ? g.length - 1 : g.length;
    let j = y === g || (!i && y.startsWith(g) && y.charAt(C) === '/'),
      S =
        N != null &&
        (N === g || (!i && N.startsWith(g) && N.charAt(g.length) === '/')),
      k = { isActive: j, isPending: S, isTransitioning: x },
      M = j ? r : void 0,
      D;
    typeof s == 'function'
      ? (D = s(k))
      : (D = [
          s,
          j ? 'active' : null,
          S ? 'pending' : null,
          x ? 'transitioning' : null,
        ]
          .filter(Boolean)
          .join(' '));
    let W = typeof l == 'function' ? l(k) : l;
    return d.createElement(
      Fr,
      ll({}, m, {
        'aria-current': M,
        className: D,
        ref: n,
        style: W,
        to: c,
        viewTransition: u,
      }),
      typeof f == 'function' ? f(k) : f
    );
  });
var Cd;
(function (e) {
  ((e.UseScrollRestoration = 'useScrollRestoration'),
    (e.UseSubmit = 'useSubmit'),
    (e.UseSubmitFetcher = 'useSubmitFetcher'),
    (e.UseFetcher = 'useFetcher'),
    (e.useViewTransitionState = 'useViewTransitionState'));
})(Cd || (Cd = {}));
var Ih;
(function (e) {
  ((e.UseFetcher = 'useFetcher'),
    (e.UseFetchers = 'useFetchers'),
    (e.UseScrollRestoration = 'useScrollRestoration'));
})(Ih || (Ih = {}));
function e4(e) {
  let t = d.useContext(Zl);
  return (t || je(!1), t);
}
function t4(e, t) {
  let {
      target: n,
      replace: r,
      state: o,
      preventScrollReset: s,
      relative: i,
      viewTransition: l,
    } = t === void 0 ? {} : t,
    c = ST(),
    u = us(),
    f = ec(e, { relative: i });
  return d.useCallback(
    (m) => {
      if (HT(m, n)) {
        m.preventDefault();
        let p = r !== void 0 ? r : sl(u) === sl(f);
        c(e, {
          replace: p,
          state: o,
          preventScrollReset: s,
          relative: i,
          viewTransition: l,
        });
      }
    },
    [u, c, f, r, o, n, e, s, i, l]
  );
}
function n4(e, t) {
  t === void 0 && (t = {});
  let n = d.useContext(KT);
  n == null && je(!1);
  let { basename: r } = e4(Cd.useViewTransitionState),
    o = ec(e, { relative: t.relative });
  if (!n.isTransitioning) return !1;
  let s = ts(n.currentLocation.pathname, r) || n.currentLocation.pathname,
    i = ts(n.nextLocation.pathname, r) || n.nextLocation.pathname;
  return al(o.pathname, i) != null || al(o.pathname, s) != null;
}
const r4 = (e) =>
    new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: !0,
    }).format(e),
  o4 = {
    pro: {
      label: 'Pro',
      icon: a.jsx(wx, { className: 'w-3 h-3' }),
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    premium: {
      label: 'Premium',
      icon: a.jsx(Ff, { className: 'w-3 h-3' }),
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    both: {
      label: 'Pro & Premium',
      icon: a.jsx(Ul, { className: 'w-3 h-3' }),
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  },
  s4 = ({ course: e, index: t = 0 }) => {
    const n = o4[e.plan];
    return a.jsxs(Fr, {
      to: e.url,
      className: 'card-course opacity-0 animate-fade-up',
      style: { animationDelay: `${t * 80}ms` },
      children: [
        a.jsxs('div', {
          className: 'relative overflow-hidden',
          children: [
            a.jsx('img', {
              src: e.image,
              alt: e.title,
              className:
                'w-full h-44 object-cover transition-transform duration-300 hover:scale-105',
              loading: 'lazy',
            }),
            a.jsx('div', {
              className:
                'absolute inset-0 bg-gradient-to-t from-card/80 to-transparent pointer-events-none',
            }),
          ],
        }),
        a.jsxs('div', {
          className: 'p-4 flex flex-col gap-2',
          children: [
            a.jsx('h3', {
              className:
                'text-base md:text-lg font-semibold text-foreground leading-snug line-clamp-2',
              children: e.title,
            }),
            a.jsxs('div', {
              className: 'flex items-center justify-between gap-2',
              children: [
                a.jsxs('p', {
                  className: 'text-xs text-muted-foreground',
                  children: [
                    'Por: ',
                    a.jsx('span', {
                      className: 'text-primary font-medium',
                      children: e.educator,
                    }),
                  ],
                }),
                a.jsxs('div', {
                  className: `flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${n.className}`,
                  children: [n.icon, n.label],
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'mt-2 flex flex-wrap gap-2',
              children: [
                a.jsx('span', { className: 'chip', children: e.modality }),
                a.jsxs('span', {
                  className: 'chip',
                  children: ['Nivel ', e.level],
                }),
                a.jsx('span', { className: 'chip', children: e.campus }),
                a.jsx('span', { className: 'chip', children: e.schedule }),
              ],
            }),
            a.jsxs('p', {
              className:
                'mt-3 text-xs text-muted-foreground flex items-center gap-1.5',
              children: [
                a.jsx('span', { className: 'text-primary', children: '📅' }),
                'Empieza: ',
                r4(e.startDate),
              ],
            }),
          ],
        }),
      ],
    });
  },
  a4 = ({ course: e }) =>
    a.jsxs(Fr, {
      to: e.url,
      className:
        'group relative flex-shrink-0 w-[280px] md:w-[320px] rounded-2xl overflow-hidden bg-card border border-border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
      children: [
        a.jsxs('div', {
          className: 'relative h-40 overflow-hidden',
          children: [
            a.jsx('img', {
              src: e.image,
              alt: e.title,
              className:
                'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
              loading: 'lazy',
            }),
            a.jsx('div', {
              className:
                'absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent',
            }),
            a.jsxs('div', {
              className:
                'absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold',
              children: [
                a.jsxs('p', { children: ['Seguir: Clase ', e.currentClass] }),
                a.jsxs('p', {
                  className:
                    'text-[10px] font-normal opacity-90 truncate max-w-[140px]',
                  children: ['Clase ', e.currentClass, ': ', e.className],
                }),
              ],
            }),
          ],
        }),
        a.jsxs('div', {
          className: 'p-4',
          children: [
            a.jsx('h3', {
              className:
                'text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-1',
              children: e.title,
            }),
            a.jsx('p', {
              className: 'text-xs text-muted-foreground mb-3',
              children: e.category,
            }),
            a.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                a.jsx('div', {
                  className:
                    'flex-1 h-1 bg-secondary rounded-full overflow-hidden',
                  children: a.jsx('div', {
                    className:
                      'h-full bg-primary rounded-full transition-all duration-500',
                    style: { width: `${e.progress}%` },
                  }),
                }),
                a.jsxs('span', {
                  className: 'text-xs text-muted-foreground font-medium',
                  children: [e.progress, '%'],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  i4 = ({ courses: e }) => {
    const t = d.useRef(null),
      n = (r) => {
        t.current &&
          t.current.scrollBy({
            left: r === 'left' ? -340 : 340,
            behavior: 'smooth',
          });
      };
    return e.length === 0
      ? null
      : a.jsxs('section', {
          className: 'mb-12',
          children: [
            a.jsxs('div', {
              className: 'flex items-center justify-between mb-5',
              children: [
                a.jsx('h2', {
                  className:
                    'font-display text-2xl md:text-3xl font-bold text-primary',
                  children: 'Seguir viendo',
                }),
                a.jsx(Fr, {
                  to: '/mis-cursos',
                  className:
                    'text-sm text-primary hover:underline underline-offset-4 transition-colors',
                  children: 'Ver todos',
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'relative group',
              children: [
                a.jsx('button', {
                  onClick: () => n('left'),
                  className:
                    'absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card -translate-x-1/2',
                  'aria-label': 'Anterior',
                  children: a.jsx(Lf, { className: 'w-5 h-5 text-foreground' }),
                }),
                a.jsx('button', {
                  onClick: () => n('right'),
                  className:
                    'absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card translate-x-1/2',
                  'aria-label': 'Siguiente',
                  children: a.jsx(wn, { className: 'w-5 h-5 text-foreground' }),
                }),
                a.jsx('div', {
                  ref: t,
                  className:
                    'flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1',
                  style: { scrollbarWidth: 'none', msOverflowStyle: 'none' },
                  children: e.map((r) => a.jsx(a4, { course: r }, r.id)),
                }),
              ],
            }),
          ],
        });
  },
  Uy = [
    {
      id: '1',
      image:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
      title: 'Fundamentos de Inteligencia Artificial y Machine Learning',
      educator: 'Dr. Carlos Mendoza',
      modality: 'Sincrónica',
      level: 'Básico',
      campus: 'Virtual',
      schedule: 'Mañana',
      startDate: new Date('2025-12-09T11:30:00'),
      url: '/cursos/fundamentos-ia',
      plan: 'both',
    },
    {
      id: '2',
      image:
        'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop',
      title: 'Desarrollo Web Full Stack con React y Node.js',
      educator: 'Ana María Torres',
      modality: 'Virtual',
      level: 'Intermedio',
      campus: 'Virtual',
      schedule: 'Tarde',
      startDate: new Date('2025-12-15T14:00:00'),
      url: '/cursos/fullstack-react',
      plan: 'pro',
    },
    {
      id: '3',
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      title: 'Ciencia de Datos con Python: De Cero a Experto',
      educator: 'Luis Fernando Ríos',
      modality: 'Sincrónica',
      level: 'Avanzado',
      campus: 'Cali',
      schedule: 'Noche',
      startDate: new Date('2025-12-20T19:00:00'),
      url: '/cursos/ciencia-datos-python',
      plan: 'premium',
    },
    {
      id: '4',
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      title: 'Diseño UX/UI: Creando Experiencias Digitales',
      educator: 'María José Vargas',
      modality: 'Presencial',
      level: 'Básico',
      campus: 'Florencia',
      schedule: 'Mañana',
      startDate: new Date('2026-01-10T09:00:00'),
      url: '/cursos/diseno-ux-ui',
      plan: 'pro',
    },
    {
      id: '5',
      image:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
      title: 'Ciberseguridad y Hacking Ético Profesional',
      educator: 'Andrés Felipe Castro',
      modality: 'Virtual',
      level: 'Avanzado',
      campus: 'Virtual',
      schedule: 'Noche',
      startDate: new Date('2026-01-05T20:00:00'),
      url: '/cursos/ciberseguridad',
      plan: 'premium',
    },
    {
      id: '6',
      image:
        'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=600&h=400&fit=crop',
      title: 'Blockchain y Desarrollo de Smart Contracts',
      educator: 'Daniela Herrera',
      modality: 'Sincrónica',
      level: 'Intermedio',
      campus: 'Virtual',
      schedule: 'Tarde',
      startDate: new Date('2026-01-12T16:00:00'),
      url: '/cursos/blockchain',
      plan: 'both',
    },
    {
      id: '7',
      image:
        'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
      title: 'Robótica e Internet de las Cosas (IoT)',
      educator: 'Ing. Ricardo Gómez',
      modality: 'Presencial',
      level: 'Intermedio',
      campus: 'Cali',
      schedule: 'Mañana',
      startDate: new Date('2026-01-18T08:00:00'),
      url: '/cursos/robotica-iot',
      plan: 'pro',
    },
    {
      id: '8',
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
      title: 'Metodologías Ágiles y Scrum Master Certificado',
      educator: 'Paula Andrea Niño',
      modality: 'Virtual',
      level: 'Básico',
      campus: 'Virtual',
      schedule: 'Tarde',
      startDate: new Date('2026-01-22T15:00:00'),
      url: '/cursos/scrum-agile',
      plan: 'both',
    },
  ],
  l4 = () => {
    const e = d.useRef(null),
      t = (r) => {
        e.current &&
          e.current.scrollBy({
            left: r === 'left' ? -320 : 320,
            behavior: 'smooth',
          });
      },
      n = Uy.slice(0, 5);
    return a.jsxs('div', {
      className: 'py-6',
      children: [
        a.jsxs('div', {
          className: 'flex items-center justify-between mb-4',
          children: [
            a.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a.jsx(jS, { className: 'w-5 h-5 text-primary' }),
                a.jsx('h2', {
                  className:
                    'font-display text-xl md:text-2xl font-bold text-foreground',
                  children: 'Top cursos',
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a.jsx('button', {
                  onClick: () => t('left'),
                  className:
                    'p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors',
                  children: a.jsx(Lf, { className: 'w-5 h-5 text-foreground' }),
                }),
                a.jsx('button', {
                  onClick: () => t('right'),
                  className:
                    'p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors',
                  children: a.jsx(wn, { className: 'w-5 h-5 text-foreground' }),
                }),
              ],
            }),
          ],
        }),
        a.jsx('div', {
          ref: e,
          className: 'flex gap-4 overflow-x-auto scrollbar-hide pb-2',
          style: { scrollbarWidth: 'none', msOverflowStyle: 'none' },
          children: n.map((r, o) =>
            a.jsx(
              'div',
              {
                className: 'relative flex-shrink-0 w-72 group cursor-pointer',
                children: a.jsxs('div', {
                  className: 'relative overflow-hidden rounded-xl',
                  children: [
                    a.jsx('img', {
                      src: r.image,
                      alt: r.title,
                      className:
                        'w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105',
                    }),
                    a.jsx('div', {
                      className:
                        'absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent',
                    }),
                    a.jsx('div', {
                      className:
                        'absolute top-3 left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center',
                      children: a.jsx('span', {
                        className: 'text-primary-foreground font-bold text-sm',
                        children: o + 1,
                      }),
                    }),
                    a.jsxs('div', {
                      className: 'absolute bottom-3 left-3 right-3',
                      children: [
                        a.jsx('h3', {
                          className:
                            'font-semibold text-foreground text-sm line-clamp-2',
                          children: r.title,
                        }),
                        a.jsx('p', {
                          className: 'text-xs text-muted-foreground mt-1',
                          children: r.educator,
                        }),
                      ],
                    }),
                  ],
                }),
              },
              r.id
            )
          ),
        }),
      ],
    });
  },
  cl = d.forwardRef(({ className: e, type: t, ...n }, r) =>
    a.jsx('input', {
      type: t,
      className: L(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        e
      ),
      ref: r,
      ...n,
    })
  );
cl.displayName = 'Input';
const c4 = () => {
    const [e, t] = d.useState(''),
      [n, r] = d.useState(!1),
      o = (s) => {
        (s.preventDefault(), e.trim() && console.log('AI Search:', e));
      };
    return a.jsx('form', {
      onSubmit: o,
      className: 'w-full max-w-2xl',
      children: a.jsxs('div', {
        className: `relative group transition-all duration-300 ${n ? 'scale-[1.02]' : ''}`,
        children: [
          a.jsx('div', {
            className: `absolute -inset-1 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 rounded-2xl blur-lg transition-opacity duration-300 ${n ? 'opacity-100' : 'opacity-0'}`,
          }),
          a.jsxs('div', {
            className:
              'relative flex items-center bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-lg',
            children: [
              a.jsx('div', {
                className: 'flex items-center justify-center pl-4',
                children: a.jsx('div', {
                  className: 'relative',
                  children: a.jsx(Ul, {
                    className: `w-5 h-5 text-primary transition-all duration-300 ${n ? 'animate-pulse' : ''}`,
                  }),
                }),
              }),
              a.jsx(cl, {
                type: 'text',
                value: e,
                onChange: (s) => t(s.target.value),
                onFocus: () => r(!0),
                onBlur: () => r(!1),
                placeholder: 'Aprende con IA y construye proyectos reales',
                className:
                  'flex-1 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 py-4 px-3 text-base',
              }),
              a.jsxs('button', {
                type: 'submit',
                className:
                  'flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 m-1.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/25',
                children: [
                  a.jsx(xx, { className: 'w-4 h-4' }),
                  a.jsx('span', {
                    className: 'hidden sm:inline',
                    children: 'Buscar',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    });
  },
  u4 = [
    { id: 'cursos', label: 'Cursos' },
    { id: 'programas', label: 'Programas' },
    { id: 'eventos', label: 'Eventos' },
  ],
  d4 = ({ onFilterChange: e }) => {
    const [t, n] = d.useState('cursos'),
      r = (o) => {
        (n(o), e == null || e(o));
      };
    return a.jsx('div', {
      className: 'flex items-center gap-2 md:gap-3',
      children: u4.map((o) =>
        a.jsx(
          'button',
          {
            onClick: () => r(o.id),
            className: `px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${t === o.id ? 'bg-foreground text-background' : 'bg-transparent border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50'}`,
            children: o.label,
          },
          o.id
        )
      ),
    });
  },
  f4 = [
    { id: 'destacados', label: 'Destacados' },
    { id: 'tecnologia', label: 'Tecnología' },
    { id: 'negocios', label: 'Negocios' },
    { id: 'diseno', label: 'Diseño' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'ciencias', label: 'Ciencias' },
  ],
  m4 = ({ onFilterChange: e }) => {
    const [t, n] = d.useState('destacados'),
      r = (o) => {
        (n(o), e == null || e(o));
      };
    return a.jsx('div', {
      className:
        'flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide',
      style: { scrollbarWidth: 'none', msOverflowStyle: 'none' },
      children: f4.map((o) =>
        a.jsx(
          'button',
          {
            onClick: () => r(o.id),
            className: `px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${t === o.id ? 'bg-foreground text-background' : 'bg-transparent border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/50'}`,
            children: o.label,
          },
          o.id
        )
      ),
    });
  },
  Sd = d.forwardRef(
    (
      { className: e, activeClassName: t, pendingClassName: n, to: r, ...o },
      s
    ) =>
      a.jsx(JT, {
        ref: s,
        to: r,
        className: ({ isActive: i, isPending: l }) => L(e, i && t, l && n),
        ...o,
      })
  );
Sd.displayName = 'NavLink';
const Jf = Wl(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90',
          destructive:
            'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          outline:
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
          secondary:
            'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
          default: 'h-10 px-4 py-2',
          sm: 'h-9 rounded-md px-3',
          lg: 'h-11 rounded-md px-8',
          icon: 'h-10 w-10',
        },
      },
      defaultVariants: { variant: 'default', size: 'default' },
    }
  ),
  ne = d.forwardRef(
    ({ className: e, variant: t, size: n, asChild: r = !1, ...o }, s) => {
      const i = r ? A0 : 'button';
      return a.jsx(i, {
        className: L(Jf({ variant: t, size: n, className: e })),
        ref: s,
        ...o,
      });
    }
  );
ne.displayName = 'Button';
const p4 = [
    { label: 'Inicio', path: '/' },
    { label: 'Cursos', path: '/cursos' },
    { label: 'Proyectos', path: '/proyectos' },
    { label: 'Espacios', path: '/espacios' },
    { label: 'Planes', path: '/planes' },
  ],
  By = () => {
    const [e, t] = d.useState(''),
      n = (r) => {
        (r.preventDefault(), e.trim() && console.log('Search:', e));
      };
    return a.jsx('nav', {
      className:
        'sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/50',
      children: a.jsxs('div', {
        className: 'container flex items-center justify-between h-16 gap-4',
        children: [
          a.jsxs(Sd, {
            to: '/',
            className: 'flex items-center gap-2 shrink-0',
            children: [
              a.jsx('div', {
                className:
                  'w-8 h-8 bg-primary rounded-lg flex items-center justify-center',
                children: a.jsx('span', {
                  className: 'text-primary-foreground font-bold text-lg',
                  children: 'A',
                }),
              }),
              a.jsx('span', {
                className:
                  'font-display text-xl font-bold text-foreground hidden sm:block',
                children: 'Artiefy',
              }),
            ],
          }),
          a.jsx('form', {
            onSubmit: n,
            className: 'flex-1 max-w-xl hidden md:block',
            children: a.jsxs('div', {
              className: 'relative',
              children: [
                a.jsx(xx, {
                  className:
                    'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground',
                }),
                a.jsx('input', {
                  type: 'text',
                  value: e,
                  onChange: (r) => t(r.target.value),
                  placeholder: '¿Qué quieres aprender?',
                  className:
                    'w-full bg-muted/50 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all',
                }),
              ],
            }),
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              a.jsx('ul', {
                className: 'hidden lg:flex items-center gap-1',
                children: p4.map((r) =>
                  a.jsx(
                    'li',
                    {
                      children: a.jsx(Sd, {
                        to: r.path,
                        className:
                          'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50',
                        activeClassName: 'text-foreground bg-muted/50',
                        children: r.label,
                      }),
                    },
                    r.path
                  )
                ),
              }),
              a.jsx(ne, { size: 'sm', className: 'ml-2', children: 'Acceder' }),
            ],
          }),
        ],
      }),
    });
  },
  h4 = [
    { id: 'tickets', label: 'Tickets', icon: NS },
    { id: 'chat', label: 'Chat IA', icon: Us },
    { id: 'proyectos', label: 'Proyectos', icon: pS },
  ],
  g4 = ({ isOpen: e, onClose: t }) => {
    const [n, r] = d.useState([]),
      [o, s] = d.useState(''),
      [i, l] = d.useState(!1),
      [c, u] = d.useState('chat'),
      f = async () => {
        if (!o.trim() || i) return;
        const p = {
          id: Date.now().toString(),
          role: 'user',
          content: o.trim(),
          timestamp: new Date(),
        };
        (r((h) => [...h, p]),
          s(''),
          l(!0),
          setTimeout(() => {
            const h = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content:
                '¡Hola! Soy Artie IA, tu asistente de aprendizaje. ¿En qué puedo ayudarte hoy? Puedo recomendarte cursos, resolver dudas o guiarte en tu camino de aprendizaje.',
              timestamp: new Date(),
            };
            (r((b) => [...b, h]), l(!1));
          }, 1e3));
      },
      m = (p) => {
        p.key === 'Enter' && !p.shiftKey && (p.preventDefault(), f());
      };
    return a.jsx('div', {
      className: `fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] transition-all duration-300 ${e ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`,
      children: a.jsxs('div', {
        className:
          'bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl',
        children: [
          a.jsx('div', {
            className:
              'bg-gradient-to-r from-card to-muted/50 px-4 py-3 border-b border-border/50',
            children: a.jsxs('div', {
              className: 'flex items-center justify-between',
              children: [
                a.jsxs('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    a.jsx('div', {
                      className:
                        'w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center',
                      children: a.jsx(Ul, {
                        className: 'w-5 h-5 text-primary-foreground',
                      }),
                    }),
                    a.jsxs('div', {
                      children: [
                        a.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            a.jsx('h3', {
                              className: 'font-semibold text-foreground',
                              children: 'Artie IA',
                            }),
                            a.jsx('span', {
                              className:
                                'w-2 h-2 bg-green-500 rounded-full animate-pulse',
                            }),
                          ],
                        }),
                        a.jsx('p', {
                          className: 'text-xs text-muted-foreground',
                          children: 'Asistente de aprendizaje',
                        }),
                      ],
                    }),
                  ],
                }),
                a.jsx('button', {
                  onClick: t,
                  className:
                    'p-2 rounded-lg hover:bg-muted/50 transition-colors',
                  children: a.jsx(Bl, {
                    className: 'w-5 h-5 text-muted-foreground',
                  }),
                }),
              ],
            }),
          }),
          a.jsx('div', {
            className: 'px-3 py-2 border-b border-border/50 bg-muted/10',
            children: a.jsx('div', {
              className: 'flex items-center justify-center gap-1',
              children: h4.map((p) => {
                const h = p.icon;
                return a.jsxs(
                  'button',
                  {
                    onClick: () => u(p.id),
                    className: `flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${c === p.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`,
                    children: [a.jsx(h, { className: 'w-3.5 h-3.5' }), p.label],
                  },
                  p.id
                );
              }),
            }),
          }),
          a.jsxs('div', {
            className:
              'h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-minimal',
            children: [
              n.length === 0
                ? a.jsxs('div', {
                    className:
                      'h-full flex flex-col items-center justify-center text-center px-4',
                    children: [
                      a.jsx('div', {
                        className:
                          'w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4',
                        children: a.jsx(vx, {
                          className: 'w-8 h-8 text-primary',
                        }),
                      }),
                      a.jsx('h4', {
                        className: 'font-semibold text-foreground mb-2',
                        children: 'Chats con IA',
                      }),
                      a.jsx('p', {
                        className: 'text-sm text-muted-foreground mb-4',
                        children:
                          'Comienza una conversación con Artie IA para recibir recomendaciones personalizadas de cursos.',
                      }),
                      a.jsxs(ne, {
                        onClick: () => {
                          s('¿Qué cursos me recomiendas?');
                        },
                        className: 'bg-primary hover:bg-primary/90',
                        children: [
                          a.jsx(cd, { className: 'w-4 h-4 mr-2' }),
                          'Crear Nuevo Chat IA',
                        ],
                      }),
                    ],
                  })
                : n.map((p) =>
                    a.jsx(
                      'div',
                      {
                        className: `flex ${p.role === 'user' ? 'justify-end' : 'justify-start'}`,
                        children: a.jsxs('div', {
                          className: `max-w-[80%] rounded-2xl px-4 py-2.5 ${p.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted/50 text-foreground rounded-bl-md'}`,
                          children: [
                            a.jsx('p', {
                              className: 'text-sm',
                              children: p.content,
                            }),
                            a.jsx('span', {
                              className: 'text-[10px] opacity-60 mt-1 block',
                              children: p.timestamp.toLocaleTimeString(
                                'es-CO',
                                { hour: '2-digit', minute: '2-digit' }
                              ),
                            }),
                          ],
                        }),
                      },
                      p.id
                    )
                  ),
              i &&
                a.jsx('div', {
                  className: 'flex justify-start',
                  children: a.jsx('div', {
                    className:
                      'bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3',
                    children: a.jsxs('div', {
                      className: 'flex gap-1',
                      children: [
                        a.jsx('span', {
                          className:
                            'w-2 h-2 bg-primary rounded-full animate-bounce',
                        }),
                        a.jsx('span', {
                          className:
                            'w-2 h-2 bg-primary rounded-full animate-bounce',
                          style: { animationDelay: '0.1s' },
                        }),
                        a.jsx('span', {
                          className:
                            'w-2 h-2 bg-primary rounded-full animate-bounce',
                          style: { animationDelay: '0.2s' },
                        }),
                      ],
                    }),
                  }),
                }),
            ],
          }),
          a.jsx('div', {
            className: 'p-4 border-t border-border/50 bg-muted/20',
            children: a.jsxs('div', {
              className: 'flex gap-2',
              children: [
                a.jsx('input', {
                  type: 'text',
                  value: o,
                  onChange: (p) => s(p.target.value),
                  onKeyDown: m,
                  placeholder: 'Escribe tu mensaje...',
                  className:
                    'flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all',
                }),
                a.jsx('button', {
                  onClick: f,
                  disabled: !o.trim() || i,
                  className:
                    'w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all',
                  children: a.jsx(yx, {
                    className: 'w-4 h-4 text-primary-foreground',
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
    });
  },
  v4 = () => {
    const [e, t] = d.useState(!1);
    return a.jsxs(a.Fragment, {
      children: [
        !e &&
          a.jsx('button', {
            onClick: () => t(!0),
            className:
              'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
            style: { boxShadow: '0 4px 30px rgba(34, 211, 238, 0.4)' },
            children: a.jsx(Us, {
              className: 'w-6 h-6 text-primary-foreground',
            }),
          }),
        a.jsx(g4, { isOpen: e, onClose: () => t(!1) }),
      ],
    });
  },
  x4 = [
    {
      id: 'c1',
      image:
        'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&h=300&fit=crop',
      title: 'Fundamentos de Electricidad y Bases de Energía Solar',
      category: 'Energía Solar',
      currentClass: 1,
      className: 'Bienvenida',
      progress: 3,
      url: '/curso/energia-solar/clase-1',
    },
    {
      id: 'c2',
      image:
        'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=500&h=300&fit=crop',
      title: 'Programación Frontend Semana',
      category: 'Desarrollo Web',
      currentClass: 1,
      className: 'Introducción al desarrollo',
      progress: 0,
      url: '/curso/frontend/clase-1',
    },
    {
      id: 'c3',
      image:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=300&fit=crop',
      title: 'Desarrollo Backend y Bases de Datos Combinada',
      category: 'Desarrollo Web',
      currentClass: 1,
      className: 'Bienvenida',
      progress: 0,
      url: '/curso/backend/clase-1',
    },
    {
      id: 'c4',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&h=300&fit=crop',
      title: 'Inteligencia Artificial Aplicada',
      category: 'Inteligencia Artificial',
      currentClass: 2,
      className: 'Redes Neuronales',
      progress: 15,
      url: '/curso/ia/clase-2',
    },
    {
      id: 'c5',
      image:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
      title: 'Ciencia de Datos con Python',
      category: 'Data Science',
      currentClass: 3,
      className: 'Pandas y NumPy',
      progress: 28,
      url: '/curso/data-science/clase-3',
    },
  ],
  y4 = () =>
    a.jsxs('div', {
      className: 'min-h-screen bg-background',
      children: [
        a.jsx(By, {}),
        a.jsx(v4, {}),
        a.jsxs('main', {
          children: [
            a.jsx('header', {
              className: 'container py-10 md:py-12',
              children: a.jsxs('div', {
                className: 'flex flex-col items-center text-center',
                children: [
                  a.jsx('h1', {
                    className:
                      'font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
                    children: a.jsx('span', {
                      className:
                        'inline-block overflow-hidden whitespace-nowrap border-r-4 border-primary text-gradient animate-typing animate-blink-caret animate-glow-pulse',
                      children: 'Artie IA',
                    }),
                  }),
                  a.jsx('div', {
                    className: 'mt-8 w-full flex justify-center',
                    children: a.jsx(c4, {}),
                  }),
                  a.jsx('div', {
                    className: 'mt-6 w-full flex justify-start',
                    children: a.jsx(d4, {}),
                  }),
                ],
              }),
            }),
            a.jsx('section', {
              className: 'container',
              children: a.jsx(i4, { courses: x4 }),
            }),
            a.jsx('section', {
              className: 'container',
              children: a.jsx(l4, {}),
            }),
            a.jsxs('section', {
              className: 'container py-6',
              children: [
                a.jsx('h2', {
                  className:
                    'font-display text-xl md:text-2xl font-bold text-foreground mb-4',
                  children: 'Áreas de conocimiento',
                }),
                a.jsx(m4, {}),
              ],
            }),
            a.jsxs('section', {
              className: 'container pb-16',
              children: [
                a.jsx('h2', {
                  className:
                    'font-display text-2xl md:text-3xl font-bold text-foreground mb-6',
                  children: 'Todos los cursos',
                }),
                a.jsx('div', {
                  className: 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3',
                  children: Uy.map((e, t) =>
                    a.jsx(s4, { course: e, index: t }, e.id)
                  ),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  w4 = ({ course: e }) => {
    const t = (n) =>
      Array.from({ length: 5 }, (r, o) =>
        a.jsx(
          wx,
          {
            className: `w-4 h-4 ${o < Math.floor(n) ? 'fill-amber-400 text-amber-400' : o < n ? 'fill-amber-400/50 text-amber-400' : 'text-muted-foreground'}`,
          },
          o
        )
      );
    return a.jsxs('div', {
      className: 'space-y-6',
      children: [
        a.jsx('div', {
          className:
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20',
          children: a.jsx('span', {
            className: 'text-xs font-medium text-primary',
            children: e.area,
          }),
        }),
        a.jsx('h1', {
          className:
            'text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground leading-tight',
          children: e.title,
        }),
        a.jsxs('div', {
          className: 'flex flex-wrap items-center gap-4 text-sm',
          children: [
            a.jsxs('div', {
              className: 'flex items-center gap-1.5',
              children: [
                a.jsx('span', {
                  className: 'font-semibold text-amber-400',
                  children: e.rating,
                }),
                a.jsx('div', { className: 'flex', children: t(e.rating) }),
                a.jsxs('span', {
                  className: 'text-muted-foreground',
                  children: [
                    '(',
                    e.reviewsCount.toLocaleString(),
                    ' opiniones)',
                  ],
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'flex items-center gap-1.5 text-muted-foreground',
              children: [
                a.jsx(Do, { className: 'w-4 h-4' }),
                a.jsxs('span', {
                  children: [e.studentsCount.toLocaleString(), ' estudiantes'],
                }),
              ],
            }),
          ],
        }),
        a.jsxs('div', {
          className: 'flex flex-wrap gap-2',
          children: [
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-foreground text-xs font-medium',
              children: [
                a.jsx(lS, { className: 'w-3.5 h-3.5 text-primary' }),
                e.classesCount,
                ' clases',
              ],
            }),
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-foreground text-xs font-medium',
              children: [
                a.jsx(Hr, { className: 'w-3.5 h-3.5 text-primary' }),
                e.durationHours,
                'h contenido',
              ],
            }),
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/40 text-foreground text-xs font-medium',
              children: [
                a.jsx(CS, { className: 'w-3.5 h-3.5 text-primary' }),
                e.practiceHours,
                'h práctica',
              ],
            }),
          ],
        }),
        a.jsxs('div', {
          className: 'flex flex-wrap gap-2',
          children: [
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium',
              children: [a.jsx(uS, { className: 'w-3.5 h-3.5' }), e.level],
            }),
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium',
              children: [a.jsx(Ea, { className: 'w-3.5 h-3.5' }), e.modality],
            }),
            a.jsxs('span', {
              className:
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium',
              children: [a.jsx(_t, { className: 'w-3.5 h-3.5' }), e.schedule],
            }),
          ],
        }),
        a.jsx('p', {
          className: 'text-lg text-muted-foreground max-w-2xl',
          children: e.subtitle,
        }),
      ],
    });
  };
var eu = 'focusScope.autoFocusOnMount',
  tu = 'focusScope.autoFocusOnUnmount',
  Lh = { bubbles: !1, cancelable: !0 },
  b4 = 'FocusScope',
  em = d.forwardRef((e, t) => {
    const {
        loop: n = !1,
        trapped: r = !1,
        onMountAutoFocus: o,
        onUnmountAutoFocus: s,
        ...i
      } = e,
      [l, c] = d.useState(null),
      u = Oe(o),
      f = Oe(s),
      m = d.useRef(null),
      p = se(t, (v) => c(v)),
      h = d.useRef({
        paused: !1,
        pause() {
          this.paused = !0;
        },
        resume() {
          this.paused = !1;
        },
      }).current;
    (d.useEffect(() => {
      if (r) {
        let v = function (y) {
            if (h.paused || !l) return;
            const N = y.target;
            l.contains(N) ? (m.current = N) : zn(m.current, { select: !0 });
          },
          w = function (y) {
            if (h.paused || !l) return;
            const N = y.relatedTarget;
            N !== null && (l.contains(N) || zn(m.current, { select: !0 }));
          },
          x = function (y) {
            if (document.activeElement === document.body)
              for (const C of y) C.removedNodes.length > 0 && zn(l);
          };
        (document.addEventListener('focusin', v),
          document.addEventListener('focusout', w));
        const g = new MutationObserver(x);
        return (
          l && g.observe(l, { childList: !0, subtree: !0 }),
          () => {
            (document.removeEventListener('focusin', v),
              document.removeEventListener('focusout', w),
              g.disconnect());
          }
        );
      }
    }, [r, l, h.paused]),
      d.useEffect(() => {
        if (l) {
          $h.add(h);
          const v = document.activeElement;
          if (!l.contains(v)) {
            const x = new CustomEvent(eu, Lh);
            (l.addEventListener(eu, u),
              l.dispatchEvent(x),
              x.defaultPrevented ||
                (N4(k4(Hy(l)), { select: !0 }),
                document.activeElement === v && zn(l)));
          }
          return () => {
            (l.removeEventListener(eu, u),
              setTimeout(() => {
                const x = new CustomEvent(tu, Lh);
                (l.addEventListener(tu, f),
                  l.dispatchEvent(x),
                  x.defaultPrevented || zn(v ?? document.body, { select: !0 }),
                  l.removeEventListener(tu, f),
                  $h.remove(h));
              }, 0));
          };
        }
      }, [l, u, f, h]));
    const b = d.useCallback(
      (v) => {
        if ((!n && !r) || h.paused) return;
        const w = v.key === 'Tab' && !v.altKey && !v.ctrlKey && !v.metaKey,
          x = document.activeElement;
        if (w && x) {
          const g = v.currentTarget,
            [y, N] = j4(g);
          y && N
            ? !v.shiftKey && x === N
              ? (v.preventDefault(), n && zn(y, { select: !0 }))
              : v.shiftKey &&
                x === y &&
                (v.preventDefault(), n && zn(N, { select: !0 }))
            : x === g && v.preventDefault();
        }
      },
      [n, r, h.paused]
    );
    return a.jsx(K.div, { tabIndex: -1, ...i, ref: p, onKeyDown: b });
  });
em.displayName = b4;
function N4(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e)
    if ((zn(r, { select: t }), document.activeElement !== n)) return;
}
function j4(e) {
  const t = Hy(e),
    n = Fh(t, e),
    r = Fh(t.reverse(), e);
  return [n, r];
}
function Hy(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const o = r.tagName === 'INPUT' && r.type === 'hidden';
        return r.disabled || r.hidden || o
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
      },
    });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Fh(e, t) {
  for (const n of e) if (!C4(n, { upTo: t })) return n;
}
function C4(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === 'hidden') return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === 'none') return !0;
    e = e.parentElement;
  }
  return !1;
}
function S4(e) {
  return e instanceof HTMLInputElement && 'select' in e;
}
function zn(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    (e.focus({ preventScroll: !0 }), e !== n && S4(e) && t && e.select());
  }
}
var $h = E4();
function E4() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      (t !== n && (n == null || n.pause()), (e = zh(e, t)), e.unshift(t));
    },
    remove(t) {
      var n;
      ((e = zh(e, t)), (n = e[0]) == null || n.resume());
    },
  };
}
function zh(e, t) {
  const n = [...e],
    r = n.indexOf(t);
  return (r !== -1 && n.splice(r, 1), n);
}
function k4(e) {
  return e.filter((t) => t.tagName !== 'A');
}
var nu = 0;
function Vy() {
  d.useEffect(() => {
    const e = document.querySelectorAll('[data-radix-focus-guard]');
    return (
      document.body.insertAdjacentElement('afterbegin', e[0] ?? Wh()),
      document.body.insertAdjacentElement('beforeend', e[1] ?? Wh()),
      nu++,
      () => {
        (nu === 1 &&
          document
            .querySelectorAll('[data-radix-focus-guard]')
            .forEach((t) => t.remove()),
          nu--);
      }
    );
  }, []);
}
function Wh() {
  const e = document.createElement('span');
  return (
    e.setAttribute('data-radix-focus-guard', ''),
    (e.tabIndex = 0),
    (e.style.outline = 'none'),
    (e.style.opacity = '0'),
    (e.style.position = 'fixed'),
    (e.style.pointerEvents = 'none'),
    e
  );
}
var Jt = function () {
  return (
    (Jt =
      Object.assign ||
      function (t) {
        for (var n, r = 1, o = arguments.length; r < o; r++) {
          n = arguments[r];
          for (var s in n)
            Object.prototype.hasOwnProperty.call(n, s) && (t[s] = n[s]);
        }
        return t;
      }),
    Jt.apply(this, arguments)
  );
};
function Yy(e, t) {
  var n = {};
  for (var r in e)
    Object.prototype.hasOwnProperty.call(e, r) &&
      t.indexOf(r) < 0 &&
      (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == 'function')
    for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
      t.indexOf(r[o]) < 0 &&
        Object.prototype.propertyIsEnumerable.call(e, r[o]) &&
        (n[r[o]] = e[r[o]]);
  return n;
}
function P4(e, t, n) {
  if (n || arguments.length === 2)
    for (var r = 0, o = t.length, s; r < o; r++)
      (s || !(r in t)) &&
        (s || (s = Array.prototype.slice.call(t, 0, r)), (s[r] = t[r]));
  return e.concat(s || Array.prototype.slice.call(t));
}
var Ei = 'right-scroll-bar-position',
  ki = 'width-before-scroll-bar',
  T4 = 'with-scroll-bars-hidden',
  R4 = '--removed-body-scroll-bar-size';
function ru(e, t) {
  return (typeof e == 'function' ? e(t) : e && (e.current = t), e);
}
function D4(e, t) {
  var n = d.useState(function () {
    return {
      value: e,
      callback: t,
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var o = n.value;
          o !== r && ((n.value = r), n.callback(r, o));
        },
      },
    };
  })[0];
  return ((n.callback = t), n.facade);
}
var M4 = typeof window < 'u' ? d.useLayoutEffect : d.useEffect,
  Uh = new WeakMap();
function A4(e, t) {
  var n = D4(null, function (r) {
    return e.forEach(function (o) {
      return ru(o, r);
    });
  });
  return (
    M4(
      function () {
        var r = Uh.get(n);
        if (r) {
          var o = new Set(r),
            s = new Set(e),
            i = n.current;
          (o.forEach(function (l) {
            s.has(l) || ru(l, null);
          }),
            s.forEach(function (l) {
              o.has(l) || ru(l, i);
            }));
        }
        Uh.set(n, e);
      },
      [e]
    ),
    n
  );
}
function O4(e) {
  return e;
}
function _4(e, t) {
  t === void 0 && (t = O4);
  var n = [],
    r = !1,
    o = {
      read: function () {
        if (r)
          throw new Error(
            'Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.'
          );
        return n.length ? n[n.length - 1] : e;
      },
      useMedium: function (s) {
        var i = t(s, r);
        return (
          n.push(i),
          function () {
            n = n.filter(function (l) {
              return l !== i;
            });
          }
        );
      },
      assignSyncMedium: function (s) {
        for (r = !0; n.length; ) {
          var i = n;
          ((n = []), i.forEach(s));
        }
        n = {
          push: function (l) {
            return s(l);
          },
          filter: function () {
            return n;
          },
        };
      },
      assignMedium: function (s) {
        r = !0;
        var i = [];
        if (n.length) {
          var l = n;
          ((n = []), l.forEach(s), (i = n));
        }
        var c = function () {
            var f = i;
            ((i = []), f.forEach(s));
          },
          u = function () {
            return Promise.resolve().then(c);
          };
        (u(),
          (n = {
            push: function (f) {
              (i.push(f), u());
            },
            filter: function (f) {
              return ((i = i.filter(f)), n);
            },
          }));
      },
    };
  return o;
}
function I4(e) {
  e === void 0 && (e = {});
  var t = _4(null);
  return ((t.options = Jt({ async: !0, ssr: !1 }, e)), t);
}
var Gy = function (e) {
  var t = e.sideCar,
    n = Yy(e, ['sideCar']);
  if (!t)
    throw new Error(
      'Sidecar: please provide `sideCar` property to import the right car'
    );
  var r = t.read();
  if (!r) throw new Error('Sidecar medium not found');
  return d.createElement(r, Jt({}, n));
};
Gy.isSideCarExport = !0;
function L4(e, t) {
  return (e.useMedium(t), Gy);
}
var Ky = I4(),
  ou = function () {},
  tc = d.forwardRef(function (e, t) {
    var n = d.useRef(null),
      r = d.useState({
        onScrollCapture: ou,
        onWheelCapture: ou,
        onTouchMoveCapture: ou,
      }),
      o = r[0],
      s = r[1],
      i = e.forwardProps,
      l = e.children,
      c = e.className,
      u = e.removeScrollBar,
      f = e.enabled,
      m = e.shards,
      p = e.sideCar,
      h = e.noRelative,
      b = e.noIsolation,
      v = e.inert,
      w = e.allowPinchZoom,
      x = e.as,
      g = x === void 0 ? 'div' : x,
      y = e.gapMode,
      N = Yy(e, [
        'forwardProps',
        'children',
        'className',
        'removeScrollBar',
        'enabled',
        'shards',
        'sideCar',
        'noRelative',
        'noIsolation',
        'inert',
        'allowPinchZoom',
        'as',
        'gapMode',
      ]),
      C = p,
      j = A4([n, t]),
      S = Jt(Jt({}, N), o);
    return d.createElement(
      d.Fragment,
      null,
      f &&
        d.createElement(C, {
          sideCar: Ky,
          removeScrollBar: u,
          shards: m,
          noRelative: h,
          noIsolation: b,
          inert: v,
          setCallbacks: s,
          allowPinchZoom: !!w,
          lockRef: n,
          gapMode: y,
        }),
      i
        ? d.cloneElement(d.Children.only(l), Jt(Jt({}, S), { ref: j }))
        : d.createElement(g, Jt({}, S, { className: c, ref: j }), l)
    );
  });
tc.defaultProps = { enabled: !0, removeScrollBar: !0, inert: !1 };
tc.classNames = { fullWidth: ki, zeroRight: Ei };
var F4 = function () {
  if (typeof __webpack_nonce__ < 'u') return __webpack_nonce__;
};
function $4() {
  if (!document) return null;
  var e = document.createElement('style');
  e.type = 'text/css';
  var t = F4();
  return (t && e.setAttribute('nonce', t), e);
}
function z4(e, t) {
  e.styleSheet
    ? (e.styleSheet.cssText = t)
    : e.appendChild(document.createTextNode(t));
}
function W4(e) {
  var t = document.head || document.getElementsByTagName('head')[0];
  t.appendChild(e);
}
var U4 = function () {
    var e = 0,
      t = null;
    return {
      add: function (n) {
        (e == 0 && (t = $4()) && (z4(t, n), W4(t)), e++);
      },
      remove: function () {
        (e--,
          !e && t && (t.parentNode && t.parentNode.removeChild(t), (t = null)));
      },
    };
  },
  B4 = function () {
    var e = U4();
    return function (t, n) {
      d.useEffect(
        function () {
          return (
            e.add(t),
            function () {
              e.remove();
            }
          );
        },
        [t && n]
      );
    };
  },
  Qy = function () {
    var e = B4(),
      t = function (n) {
        var r = n.styles,
          o = n.dynamic;
        return (e(r, o), null);
      };
    return t;
  },
  H4 = { left: 0, top: 0, right: 0, gap: 0 },
  su = function (e) {
    return parseInt(e || '', 10) || 0;
  },
  V4 = function (e) {
    var t = window.getComputedStyle(document.body),
      n = t[e === 'padding' ? 'paddingLeft' : 'marginLeft'],
      r = t[e === 'padding' ? 'paddingTop' : 'marginTop'],
      o = t[e === 'padding' ? 'paddingRight' : 'marginRight'];
    return [su(n), su(r), su(o)];
  },
  Y4 = function (e) {
    if ((e === void 0 && (e = 'margin'), typeof window > 'u')) return H4;
    var t = V4(e),
      n = document.documentElement.clientWidth,
      r = window.innerWidth;
    return {
      left: t[0],
      top: t[1],
      right: t[2],
      gap: Math.max(0, r - n + t[2] - t[0]),
    };
  },
  G4 = Qy(),
  Oo = 'data-scroll-locked',
  K4 = function (e, t, n, r) {
    var o = e.left,
      s = e.top,
      i = e.right,
      l = e.gap;
    return (
      n === void 0 && (n = 'margin'),
      `
  .`
        .concat(
          T4,
          ` {
   overflow: hidden `
        )
        .concat(
          r,
          `;
   padding-right: `
        )
        .concat(l, 'px ')
        .concat(
          r,
          `;
  }
  body[`
        )
        .concat(
          Oo,
          `] {
    overflow: hidden `
        )
        .concat(
          r,
          `;
    overscroll-behavior: contain;
    `
        )
        .concat(
          [
            t && 'position: relative '.concat(r, ';'),
            n === 'margin' &&
              `
    padding-left: `
                .concat(
                  o,
                  `px;
    padding-top: `
                )
                .concat(
                  s,
                  `px;
    padding-right: `
                )
                .concat(
                  i,
                  `px;
    margin-left:0;
    margin-top:0;
    margin-right: `
                )
                .concat(l, 'px ')
                .concat(
                  r,
                  `;
    `
                ),
            n === 'padding' &&
              'padding-right: '.concat(l, 'px ').concat(r, ';'),
          ]
            .filter(Boolean)
            .join(''),
          `
  }
  
  .`
        )
        .concat(
          Ei,
          ` {
    right: `
        )
        .concat(l, 'px ')
        .concat(
          r,
          `;
  }
  
  .`
        )
        .concat(
          ki,
          ` {
    margin-right: `
        )
        .concat(l, 'px ')
        .concat(
          r,
          `;
  }
  
  .`
        )
        .concat(Ei, ' .')
        .concat(
          Ei,
          ` {
    right: 0 `
        )
        .concat(
          r,
          `;
  }
  
  .`
        )
        .concat(ki, ' .')
        .concat(
          ki,
          ` {
    margin-right: 0 `
        )
        .concat(
          r,
          `;
  }
  
  body[`
        )
        .concat(
          Oo,
          `] {
    `
        )
        .concat(R4, ': ')
        .concat(
          l,
          `px;
  }
`
        )
    );
  },
  Bh = function () {
    var e = parseInt(document.body.getAttribute(Oo) || '0', 10);
    return isFinite(e) ? e : 0;
  },
  Q4 = function () {
    d.useEffect(function () {
      return (
        document.body.setAttribute(Oo, (Bh() + 1).toString()),
        function () {
          var e = Bh() - 1;
          e <= 0
            ? document.body.removeAttribute(Oo)
            : document.body.setAttribute(Oo, e.toString());
        }
      );
    }, []);
  },
  q4 = function (e) {
    var t = e.noRelative,
      n = e.noImportant,
      r = e.gapMode,
      o = r === void 0 ? 'margin' : r;
    Q4();
    var s = d.useMemo(
      function () {
        return Y4(o);
      },
      [o]
    );
    return d.createElement(G4, { styles: K4(s, !t, o, n ? '' : '!important') });
  },
  Ed = !1;
if (typeof window < 'u')
  try {
    var ri = Object.defineProperty({}, 'passive', {
      get: function () {
        return ((Ed = !0), !0);
      },
    });
    (window.addEventListener('test', ri, ri),
      window.removeEventListener('test', ri, ri));
  } catch {
    Ed = !1;
  }
var ro = Ed ? { passive: !1 } : !1,
  X4 = function (e) {
    return e.tagName === 'TEXTAREA';
  },
  qy = function (e, t) {
    if (!(e instanceof Element)) return !1;
    var n = window.getComputedStyle(e);
    return (
      n[t] !== 'hidden' &&
      !(n.overflowY === n.overflowX && !X4(e) && n[t] === 'visible')
    );
  },
  Z4 = function (e) {
    return qy(e, 'overflowY');
  },
  J4 = function (e) {
    return qy(e, 'overflowX');
  },
  Hh = function (e, t) {
    var n = t.ownerDocument,
      r = t;
    do {
      typeof ShadowRoot < 'u' && r instanceof ShadowRoot && (r = r.host);
      var o = Xy(e, r);
      if (o) {
        var s = Zy(e, r),
          i = s[1],
          l = s[2];
        if (i > l) return !0;
      }
      r = r.parentNode;
    } while (r && r !== n.body);
    return !1;
  },
  eR = function (e) {
    var t = e.scrollTop,
      n = e.scrollHeight,
      r = e.clientHeight;
    return [t, n, r];
  },
  tR = function (e) {
    var t = e.scrollLeft,
      n = e.scrollWidth,
      r = e.clientWidth;
    return [t, n, r];
  },
  Xy = function (e, t) {
    return e === 'v' ? Z4(t) : J4(t);
  },
  Zy = function (e, t) {
    return e === 'v' ? eR(t) : tR(t);
  },
  nR = function (e, t) {
    return e === 'h' && t === 'rtl' ? -1 : 1;
  },
  rR = function (e, t, n, r, o) {
    var s = nR(e, window.getComputedStyle(t).direction),
      i = s * r,
      l = n.target,
      c = t.contains(l),
      u = !1,
      f = i > 0,
      m = 0,
      p = 0;
    do {
      if (!l) break;
      var h = Zy(e, l),
        b = h[0],
        v = h[1],
        w = h[2],
        x = v - w - s * b;
      (b || x) && Xy(e, l) && ((m += x), (p += b));
      var g = l.parentNode;
      l = g && g.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? g.host : g;
    } while ((!c && l !== document.body) || (c && (t.contains(l) || t === l)));
    return (
      ((f && (Math.abs(m) < 1 || !o)) || (!f && (Math.abs(p) < 1 || !o))) &&
        (u = !0),
      u
    );
  },
  oi = function (e) {
    return 'changedTouches' in e
      ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY]
      : [0, 0];
  },
  Vh = function (e) {
    return [e.deltaX, e.deltaY];
  },
  Yh = function (e) {
    return e && 'current' in e ? e.current : e;
  },
  oR = function (e, t) {
    return e[0] === t[0] && e[1] === t[1];
  },
  sR = function (e) {
    return `
  .block-interactivity-`
      .concat(
        e,
        ` {pointer-events: none;}
  .allow-interactivity-`
      )
      .concat(
        e,
        ` {pointer-events: all;}
`
      );
  },
  aR = 0,
  oo = [];
function iR(e) {
  var t = d.useRef([]),
    n = d.useRef([0, 0]),
    r = d.useRef(),
    o = d.useState(aR++)[0],
    s = d.useState(Qy)[0],
    i = d.useRef(e);
  (d.useEffect(
    function () {
      i.current = e;
    },
    [e]
  ),
    d.useEffect(
      function () {
        if (e.inert) {
          document.body.classList.add('block-interactivity-'.concat(o));
          var v = P4([e.lockRef.current], (e.shards || []).map(Yh), !0).filter(
            Boolean
          );
          return (
            v.forEach(function (w) {
              return w.classList.add('allow-interactivity-'.concat(o));
            }),
            function () {
              (document.body.classList.remove('block-interactivity-'.concat(o)),
                v.forEach(function (w) {
                  return w.classList.remove('allow-interactivity-'.concat(o));
                }));
            }
          );
        }
      },
      [e.inert, e.lockRef.current, e.shards]
    ));
  var l = d.useCallback(function (v, w) {
      if (
        ('touches' in v && v.touches.length === 2) ||
        (v.type === 'wheel' && v.ctrlKey)
      )
        return !i.current.allowPinchZoom;
      var x = oi(v),
        g = n.current,
        y = 'deltaX' in v ? v.deltaX : g[0] - x[0],
        N = 'deltaY' in v ? v.deltaY : g[1] - x[1],
        C,
        j = v.target,
        S = Math.abs(y) > Math.abs(N) ? 'h' : 'v';
      if ('touches' in v && S === 'h' && j.type === 'range') return !1;
      var k = Hh(S, j);
      if (!k) return !0;
      if ((k ? (C = S) : ((C = S === 'v' ? 'h' : 'v'), (k = Hh(S, j))), !k))
        return !1;
      if (
        (!r.current && 'changedTouches' in v && (y || N) && (r.current = C), !C)
      )
        return !0;
      var M = r.current || C;
      return rR(M, w, v, M === 'h' ? y : N, !0);
    }, []),
    c = d.useCallback(function (v) {
      var w = v;
      if (!(!oo.length || oo[oo.length - 1] !== s)) {
        var x = 'deltaY' in w ? Vh(w) : oi(w),
          g = t.current.filter(function (C) {
            return (
              C.name === w.type &&
              (C.target === w.target || w.target === C.shadowParent) &&
              oR(C.delta, x)
            );
          })[0];
        if (g && g.should) {
          w.cancelable && w.preventDefault();
          return;
        }
        if (!g) {
          var y = (i.current.shards || [])
              .map(Yh)
              .filter(Boolean)
              .filter(function (C) {
                return C.contains(w.target);
              }),
            N = y.length > 0 ? l(w, y[0]) : !i.current.noIsolation;
          N && w.cancelable && w.preventDefault();
        }
      }
    }, []),
    u = d.useCallback(function (v, w, x, g) {
      var y = { name: v, delta: w, target: x, should: g, shadowParent: lR(x) };
      (t.current.push(y),
        setTimeout(function () {
          t.current = t.current.filter(function (N) {
            return N !== y;
          });
        }, 1));
    }, []),
    f = d.useCallback(function (v) {
      ((n.current = oi(v)), (r.current = void 0));
    }, []),
    m = d.useCallback(function (v) {
      u(v.type, Vh(v), v.target, l(v, e.lockRef.current));
    }, []),
    p = d.useCallback(function (v) {
      u(v.type, oi(v), v.target, l(v, e.lockRef.current));
    }, []);
  d.useEffect(function () {
    return (
      oo.push(s),
      e.setCallbacks({
        onScrollCapture: m,
        onWheelCapture: m,
        onTouchMoveCapture: p,
      }),
      document.addEventListener('wheel', c, ro),
      document.addEventListener('touchmove', c, ro),
      document.addEventListener('touchstart', f, ro),
      function () {
        ((oo = oo.filter(function (v) {
          return v !== s;
        })),
          document.removeEventListener('wheel', c, ro),
          document.removeEventListener('touchmove', c, ro),
          document.removeEventListener('touchstart', f, ro));
      }
    );
  }, []);
  var h = e.removeScrollBar,
    b = e.inert;
  return d.createElement(
    d.Fragment,
    null,
    b ? d.createElement(s, { styles: sR(o) }) : null,
    h
      ? d.createElement(q4, { noRelative: e.noRelative, gapMode: e.gapMode })
      : null
  );
}
function lR(e) {
  for (var t = null; e !== null; )
    (e instanceof ShadowRoot && ((t = e.host), (e = e.host)),
      (e = e.parentNode));
  return t;
}
const cR = L4(Ky, iR);
var tm = d.forwardRef(function (e, t) {
  return d.createElement(tc, Jt({}, e, { ref: t, sideCar: cR }));
});
tm.classNames = tc.classNames;
var uR = function (e) {
    if (typeof document > 'u') return null;
    var t = Array.isArray(e) ? e[0] : e;
    return t.ownerDocument.body;
  },
  so = new WeakMap(),
  si = new WeakMap(),
  ai = {},
  au = 0,
  Jy = function (e) {
    return e && (e.host || Jy(e.parentNode));
  },
  dR = function (e, t) {
    return t
      .map(function (n) {
        if (e.contains(n)) return n;
        var r = Jy(n);
        return r && e.contains(r)
          ? r
          : (console.error(
              'aria-hidden',
              n,
              'in not contained inside',
              e,
              '. Doing nothing'
            ),
            null);
      })
      .filter(function (n) {
        return !!n;
      });
  },
  fR = function (e, t, n, r) {
    var o = dR(t, Array.isArray(e) ? e : [e]);
    ai[n] || (ai[n] = new WeakMap());
    var s = ai[n],
      i = [],
      l = new Set(),
      c = new Set(o),
      u = function (m) {
        !m || l.has(m) || (l.add(m), u(m.parentNode));
      };
    o.forEach(u);
    var f = function (m) {
      !m ||
        c.has(m) ||
        Array.prototype.forEach.call(m.children, function (p) {
          if (l.has(p)) f(p);
          else
            try {
              var h = p.getAttribute(r),
                b = h !== null && h !== 'false',
                v = (so.get(p) || 0) + 1,
                w = (s.get(p) || 0) + 1;
              (so.set(p, v),
                s.set(p, w),
                i.push(p),
                v === 1 && b && si.set(p, !0),
                w === 1 && p.setAttribute(n, 'true'),
                b || p.setAttribute(r, 'true'));
            } catch (x) {
              console.error('aria-hidden: cannot operate on ', p, x);
            }
        });
    };
    return (
      f(t),
      l.clear(),
      au++,
      function () {
        (i.forEach(function (m) {
          var p = so.get(m) - 1,
            h = s.get(m) - 1;
          (so.set(m, p),
            s.set(m, h),
            p || (si.has(m) || m.removeAttribute(r), si.delete(m)),
            h || m.removeAttribute(n));
        }),
          au--,
          au ||
            ((so = new WeakMap()),
            (so = new WeakMap()),
            (si = new WeakMap()),
            (ai = {})));
      }
    );
  },
  e1 = function (e, t, n) {
    n === void 0 && (n = 'data-aria-hidden');
    var r = Array.from(Array.isArray(e) ? e : [e]),
      o = uR(e);
    return o
      ? (r.push.apply(r, Array.from(o.querySelectorAll('[aria-live]'))),
        fR(r, o, n, 'aria-hidden'))
      : function () {
          return null;
        };
  },
  nc = 'Dialog',
  [t1, n1] = Ue(nc),
  [mR, Ut] = t1(nc),
  r1 = (e) => {
    const {
        __scopeDialog: t,
        children: n,
        open: r,
        defaultOpen: o,
        onOpenChange: s,
        modal: i = !0,
      } = e,
      l = d.useRef(null),
      c = d.useRef(null),
      [u, f] = cn({ prop: r, defaultProp: o ?? !1, onChange: s, caller: nc });
    return a.jsx(mR, {
      scope: t,
      triggerRef: l,
      contentRef: c,
      contentId: sn(),
      titleId: sn(),
      descriptionId: sn(),
      open: u,
      onOpenChange: f,
      onOpenToggle: d.useCallback(() => f((m) => !m), [f]),
      modal: i,
      children: n,
    });
  };
r1.displayName = nc;
var o1 = 'DialogTrigger',
  s1 = d.forwardRef((e, t) => {
    const { __scopeDialog: n, ...r } = e,
      o = Ut(o1, n),
      s = se(t, o.triggerRef);
    return a.jsx(K.button, {
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': o.open,
      'aria-controls': o.contentId,
      'data-state': om(o.open),
      ...r,
      ref: s,
      onClick: $(e.onClick, o.onOpenToggle),
    });
  });
s1.displayName = o1;
var nm = 'DialogPortal',
  [pR, a1] = t1(nm, { forceMount: void 0 }),
  i1 = (e) => {
    const { __scopeDialog: t, forceMount: n, children: r, container: o } = e,
      s = Ut(nm, t);
    return a.jsx(pR, {
      scope: t,
      forceMount: n,
      children: d.Children.map(r, (i) =>
        a.jsx(Nt, {
          present: n || s.open,
          children: a.jsx(Fl, { asChild: !0, container: o, children: i }),
        })
      ),
    });
  };
i1.displayName = nm;
var ul = 'DialogOverlay',
  l1 = d.forwardRef((e, t) => {
    const n = a1(ul, e.__scopeDialog),
      { forceMount: r = n.forceMount, ...o } = e,
      s = Ut(ul, e.__scopeDialog);
    return s.modal
      ? a.jsx(Nt, {
          present: r || s.open,
          children: a.jsx(gR, { ...o, ref: t }),
        })
      : null;
  });
l1.displayName = ul;
var hR = Zo('DialogOverlay.RemoveScroll'),
  gR = d.forwardRef((e, t) => {
    const { __scopeDialog: n, ...r } = e,
      o = Ut(ul, n);
    return a.jsx(tm, {
      as: hR,
      allowPinchZoom: !0,
      shards: [o.contentRef],
      children: a.jsx(K.div, {
        'data-state': om(o.open),
        ...r,
        ref: t,
        style: { pointerEvents: 'auto', ...r.style },
      }),
    });
  }),
  Yr = 'DialogContent',
  c1 = d.forwardRef((e, t) => {
    const n = a1(Yr, e.__scopeDialog),
      { forceMount: r = n.forceMount, ...o } = e,
      s = Ut(Yr, e.__scopeDialog);
    return a.jsx(Nt, {
      present: r || s.open,
      children: s.modal
        ? a.jsx(vR, { ...o, ref: t })
        : a.jsx(xR, { ...o, ref: t }),
    });
  });
c1.displayName = Yr;
var vR = d.forwardRef((e, t) => {
    const n = Ut(Yr, e.__scopeDialog),
      r = d.useRef(null),
      o = se(t, n.contentRef, r);
    return (
      d.useEffect(() => {
        const s = r.current;
        if (s) return e1(s);
      }, []),
      a.jsx(u1, {
        ...e,
        ref: o,
        trapFocus: n.open,
        disableOutsidePointerEvents: !0,
        onCloseAutoFocus: $(e.onCloseAutoFocus, (s) => {
          var i;
          (s.preventDefault(), (i = n.triggerRef.current) == null || i.focus());
        }),
        onPointerDownOutside: $(e.onPointerDownOutside, (s) => {
          const i = s.detail.originalEvent,
            l = i.button === 0 && i.ctrlKey === !0;
          (i.button === 2 || l) && s.preventDefault();
        }),
        onFocusOutside: $(e.onFocusOutside, (s) => s.preventDefault()),
      })
    );
  }),
  xR = d.forwardRef((e, t) => {
    const n = Ut(Yr, e.__scopeDialog),
      r = d.useRef(!1),
      o = d.useRef(!1);
    return a.jsx(u1, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      onCloseAutoFocus: (s) => {
        var i, l;
        ((i = e.onCloseAutoFocus) == null || i.call(e, s),
          s.defaultPrevented ||
            (r.current || (l = n.triggerRef.current) == null || l.focus(),
            s.preventDefault()),
          (r.current = !1),
          (o.current = !1));
      },
      onInteractOutside: (s) => {
        var c, u;
        ((c = e.onInteractOutside) == null || c.call(e, s),
          s.defaultPrevented ||
            ((r.current = !0),
            s.detail.originalEvent.type === 'pointerdown' && (o.current = !0)));
        const i = s.target;
        (((u = n.triggerRef.current) == null ? void 0 : u.contains(i)) &&
          s.preventDefault(),
          s.detail.originalEvent.type === 'focusin' &&
            o.current &&
            s.preventDefault());
      },
    });
  }),
  u1 = d.forwardRef((e, t) => {
    const {
        __scopeDialog: n,
        trapFocus: r,
        onOpenAutoFocus: o,
        onCloseAutoFocus: s,
        ...i
      } = e,
      l = Ut(Yr, n),
      c = d.useRef(null),
      u = se(t, c);
    return (
      Vy(),
      a.jsxs(a.Fragment, {
        children: [
          a.jsx(em, {
            asChild: !0,
            loop: !0,
            trapped: r,
            onMountAutoFocus: o,
            onUnmountAutoFocus: s,
            children: a.jsx(Ca, {
              role: 'dialog',
              id: l.contentId,
              'aria-describedby': l.descriptionId,
              'aria-labelledby': l.titleId,
              'data-state': om(l.open),
              ...i,
              ref: u,
              onDismiss: () => l.onOpenChange(!1),
            }),
          }),
          a.jsxs(a.Fragment, {
            children: [
              a.jsx(wR, { titleId: l.titleId }),
              a.jsx(NR, { contentRef: c, descriptionId: l.descriptionId }),
            ],
          }),
        ],
      })
    );
  }),
  rm = 'DialogTitle',
  d1 = d.forwardRef((e, t) => {
    const { __scopeDialog: n, ...r } = e,
      o = Ut(rm, n);
    return a.jsx(K.h2, { id: o.titleId, ...r, ref: t });
  });
d1.displayName = rm;
var f1 = 'DialogDescription',
  m1 = d.forwardRef((e, t) => {
    const { __scopeDialog: n, ...r } = e,
      o = Ut(f1, n);
    return a.jsx(K.p, { id: o.descriptionId, ...r, ref: t });
  });
m1.displayName = f1;
var p1 = 'DialogClose',
  h1 = d.forwardRef((e, t) => {
    const { __scopeDialog: n, ...r } = e,
      o = Ut(p1, n);
    return a.jsx(K.button, {
      type: 'button',
      ...r,
      ref: t,
      onClick: $(e.onClick, () => o.onOpenChange(!1)),
    });
  });
h1.displayName = p1;
function om(e) {
  return e ? 'open' : 'closed';
}
var g1 = 'DialogTitleWarning',
  [yR, v1] = pC(g1, { contentName: Yr, titleName: rm, docsSlug: 'dialog' }),
  wR = ({ titleId: e }) => {
    const t = v1(g1),
      n = `\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;
    return (
      d.useEffect(() => {
        e && (document.getElementById(e) || console.error(n));
      }, [n, e]),
      null
    );
  },
  bR = 'DialogDescriptionWarning',
  NR = ({ contentRef: e, descriptionId: t }) => {
    const r = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${v1(bR).contentName}}.`;
    return (
      d.useEffect(() => {
        var s;
        const o =
          (s = e.current) == null ? void 0 : s.getAttribute('aria-describedby');
        t && o && (document.getElementById(t) || console.warn(r));
      }, [r, e, t]),
      null
    );
  },
  x1 = r1,
  jR = s1,
  y1 = i1,
  sm = l1,
  am = c1,
  im = d1,
  lm = m1,
  cm = h1,
  w1 = 'AlertDialog',
  [CR, aO] = Ue(w1, [n1]),
  Rn = n1(),
  b1 = (e) => {
    const { __scopeAlertDialog: t, ...n } = e,
      r = Rn(t);
    return a.jsx(x1, { ...r, ...n, modal: !0 });
  };
b1.displayName = w1;
var SR = 'AlertDialogTrigger',
  ER = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      o = Rn(n);
    return a.jsx(jR, { ...o, ...r, ref: t });
  });
ER.displayName = SR;
var kR = 'AlertDialogPortal',
  N1 = (e) => {
    const { __scopeAlertDialog: t, ...n } = e,
      r = Rn(t);
    return a.jsx(y1, { ...r, ...n });
  };
N1.displayName = kR;
var PR = 'AlertDialogOverlay',
  j1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      o = Rn(n);
    return a.jsx(sm, { ...o, ...r, ref: t });
  });
j1.displayName = PR;
var _o = 'AlertDialogContent',
  [TR, RR] = CR(_o),
  DR = _0('AlertDialogContent'),
  C1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, children: r, ...o } = e,
      s = Rn(n),
      i = d.useRef(null),
      l = se(t, i),
      c = d.useRef(null);
    return a.jsx(yR, {
      contentName: _o,
      titleName: S1,
      docsSlug: 'alert-dialog',
      children: a.jsx(TR, {
        scope: n,
        cancelRef: c,
        children: a.jsxs(am, {
          role: 'alertdialog',
          ...s,
          ...o,
          ref: l,
          onOpenAutoFocus: $(o.onOpenAutoFocus, (u) => {
            var f;
            (u.preventDefault(),
              (f = c.current) == null || f.focus({ preventScroll: !0 }));
          }),
          onPointerDownOutside: (u) => u.preventDefault(),
          onInteractOutside: (u) => u.preventDefault(),
          children: [a.jsx(DR, { children: r }), a.jsx(AR, { contentRef: i })],
        }),
      }),
    });
  });
C1.displayName = _o;
var S1 = 'AlertDialogTitle',
  E1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      o = Rn(n);
    return a.jsx(im, { ...o, ...r, ref: t });
  });
E1.displayName = S1;
var k1 = 'AlertDialogDescription',
  P1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      o = Rn(n);
    return a.jsx(lm, { ...o, ...r, ref: t });
  });
P1.displayName = k1;
var MR = 'AlertDialogAction',
  T1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      o = Rn(n);
    return a.jsx(cm, { ...o, ...r, ref: t });
  });
T1.displayName = MR;
var R1 = 'AlertDialogCancel',
  D1 = d.forwardRef((e, t) => {
    const { __scopeAlertDialog: n, ...r } = e,
      { cancelRef: o } = RR(R1, n),
      s = Rn(n),
      i = se(t, o);
    return a.jsx(cm, { ...s, ...r, ref: i });
  });
D1.displayName = R1;
var AR = ({ contentRef: e }) => {
    const t = `\`${_o}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${_o}\` by passing a \`${k1}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${_o}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
    return (
      d.useEffect(() => {
        var r;
        document.getElementById(
          (r = e.current) == null ? void 0 : r.getAttribute('aria-describedby')
        ) || console.warn(t);
      }, [t, e]),
      null
    );
  },
  OR = b1,
  _R = N1,
  M1 = j1,
  A1 = C1,
  O1 = T1,
  _1 = D1,
  I1 = E1,
  L1 = P1;
const IR = OR,
  LR = _R,
  F1 = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(M1, {
      className: L(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        e
      ),
      ...t,
      ref: n,
    })
  );
F1.displayName = M1.displayName;
const $1 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsxs(LR, {
    children: [
      a.jsx(F1, {}),
      a.jsx(A1, {
        ref: n,
        className: L(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          e
        ),
        ...t,
      }),
    ],
  })
);
$1.displayName = A1.displayName;
const z1 = ({ className: e, ...t }) =>
  a.jsx('div', {
    className: L('flex flex-col space-y-2 text-center sm:text-left', e),
    ...t,
  });
z1.displayName = 'AlertDialogHeader';
const W1 = ({ className: e, ...t }) =>
  a.jsx('div', {
    className: L(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      e
    ),
    ...t,
  });
W1.displayName = 'AlertDialogFooter';
const U1 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(I1, { ref: n, className: L('text-lg font-semibold', e), ...t })
);
U1.displayName = I1.displayName;
const B1 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(L1, { ref: n, className: L('text-sm text-muted-foreground', e), ...t })
);
B1.displayName = L1.displayName;
const H1 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(O1, { ref: n, className: L(Jf(), e), ...t })
);
H1.displayName = O1.displayName;
const V1 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(_1, {
    ref: n,
    className: L(Jf({ variant: 'outline' }), 'mt-2 sm:mt-0', e),
    ...t,
  })
);
V1.displayName = _1.displayName;
const FR = {
    Free: {
      label: 'Curso gratuito',
      icon: a.jsx(gS, { className: 'w-4 h-4' }),
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    Premium: {
      label: 'Curso Premium',
      icon: a.jsx(Ff, { className: 'w-4 h-4' }),
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    ProIncluido: {
      label: 'Incluido en PRO',
      icon: a.jsx(Ul, { className: 'w-4 h-4' }),
      className: 'bg-primary/10 text-primary border-primary/20',
    },
  },
  $R = (e) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(e),
  Gh = ({ course: e }) => {
    const [t, n] = d.useState(!1),
      [r, o] = d.useState(!1),
      s = FR[e.plan],
      i = () => {
        n(!0);
      },
      l = () => {
        (n(!1), o(!1));
      };
    return a.jsxs(a.Fragment, {
      children: [
        a.jsxs('div', {
          className:
            'relative border border-border rounded-2xl overflow-hidden',
          children: [
            a.jsx('div', {
              className: 'absolute inset-0 bg-cover bg-center',
              style: { backgroundImage: `url(${e.thumbnailUrl})` },
            }),
            a.jsx('div', {
              className:
                'absolute inset-0 bg-gradient-to-t from-card via-card/95 to-card/80',
            }),
            a.jsxs('div', {
              className: 'relative z-10',
              children: [
                a.jsxs('div', {
                  className: 'relative aspect-video',
                  children: [
                    a.jsx('img', {
                      src: e.thumbnailUrl,
                      alt: e.title,
                      className: 'w-full h-full object-cover',
                    }),
                    a.jsx('div', {
                      className:
                        'absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent',
                    }),
                    e.trailerUrl &&
                      a.jsx('button', {
                        className:
                          'absolute inset-0 flex items-center justify-center group',
                        children: a.jsx('div', {
                          className:
                            'w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center transition-transform group-hover:scale-110',
                          children: a.jsx(aa, {
                            className: 'w-7 h-7 text-primary-foreground ml-1',
                          }),
                        }),
                      }),
                  ],
                }),
                a.jsxs('div', {
                  className: 'p-5 space-y-5',
                  children: [
                    a.jsxs('div', {
                      className: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${s.className}`,
                      children: [s.icon, s.label],
                    }),
                    e.plan !== 'Free' &&
                      !t &&
                      a.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          a.jsx('p', {
                            className: 'text-2xl font-bold text-foreground',
                            children: $R(e.price),
                          }),
                          a.jsx('p', {
                            className: 'text-xs text-muted-foreground',
                            children: 'Precio individual del curso',
                          }),
                        ],
                      }),
                    a.jsxs('div', {
                      className: 'space-y-3',
                      children: [
                        e.plan === 'ProIncluido' &&
                          !t &&
                          a.jsx('p', {
                            className: 'text-sm text-primary font-medium',
                            children: '✨ Incluido en tu plan PRO',
                          }),
                        t
                          ? a.jsxs(a.Fragment, {
                              children: [
                                a.jsxs(ne, {
                                  className:
                                    'w-full h-12 rounded-full text-base font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all relative group',
                                  children: [
                                    a.jsx(If, { className: 'w-5 h-5 mr-2' }),
                                    'Suscrito',
                                    a.jsx('button', {
                                      onClick: () => o(!0),
                                      className:
                                        'absolute right-3 p-1 rounded-full hover:bg-destructive/20 transition-colors',
                                      children: a.jsx(Bl, {
                                        className:
                                          'w-4 h-4 text-emerald-400 group-hover:text-destructive transition-colors',
                                      }),
                                    }),
                                  ],
                                }),
                                a.jsxs('div', {
                                  className:
                                    'pt-3 space-y-3 border-t border-border/50',
                                  children: [
                                    a.jsxs(ne, {
                                      className:
                                        'w-full h-11 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90',
                                      children: [
                                        a.jsx(aa, {
                                          className: 'w-4 h-4 mr-2',
                                        }),
                                        'Continuar curso',
                                      ],
                                    }),
                                    a.jsxs('div', {
                                      className: 'space-y-2',
                                      children: [
                                        a.jsxs('div', {
                                          className:
                                            'flex justify-between text-sm',
                                          children: [
                                            a.jsx('span', {
                                              className:
                                                'text-muted-foreground',
                                              children: 'Tu progreso',
                                            }),
                                            a.jsx('span', {
                                              className:
                                                'text-foreground font-medium',
                                              children: '25%',
                                            }),
                                          ],
                                        }),
                                        a.jsx('div', {
                                          className:
                                            'h-2 bg-muted rounded-full overflow-hidden',
                                          children: a.jsx('div', {
                                            className:
                                              'h-full w-1/4 bg-primary rounded-full',
                                          }),
                                        }),
                                      ],
                                    }),
                                    a.jsxs('div', {
                                      className: 'grid grid-cols-2 gap-2 pt-2',
                                      children: [
                                        a.jsxs('div', {
                                          className:
                                            'bg-muted/30 rounded-xl p-3 text-center',
                                          children: [
                                            a.jsx('p', {
                                              className:
                                                'text-lg font-bold text-foreground',
                                              children: '3/12',
                                            }),
                                            a.jsx('p', {
                                              className:
                                                'text-xs text-muted-foreground',
                                              children: 'Módulos',
                                            }),
                                          ],
                                        }),
                                        a.jsxs('div', {
                                          className:
                                            'bg-muted/30 rounded-xl p-3 text-center',
                                          children: [
                                            a.jsx('p', {
                                              className:
                                                'text-lg font-bold text-foreground',
                                              children: '2h 15m',
                                            }),
                                            a.jsx('p', {
                                              className:
                                                'text-xs text-muted-foreground',
                                              children: 'Tiempo visto',
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    a.jsx('div', {
                                      className:
                                        'pt-3 border-t border-border/50',
                                      children: a.jsxs('div', {
                                        className:
                                          'bg-muted/30 rounded-xl p-4 space-y-3',
                                        children: [
                                          a.jsxs('div', {
                                            className:
                                              'flex items-center gap-2',
                                            children: [
                                              a.jsx(lx, {
                                                className:
                                                  'w-5 h-5 text-amber-400',
                                              }),
                                              a.jsx('span', {
                                                className:
                                                  'text-sm font-medium text-foreground',
                                                children:
                                                  'Certificado del curso',
                                              }),
                                            ],
                                          }),
                                          a.jsx('p', {
                                            className:
                                              'text-xs text-muted-foreground',
                                            children:
                                              'Completa el 100% del curso para obtener tu certificado verificado.',
                                          }),
                                          a.jsxs('div', {
                                            className:
                                              'flex items-center gap-2',
                                            children: [
                                              a.jsx('div', {
                                                className:
                                                  'flex-1 h-1.5 bg-muted rounded-full overflow-hidden',
                                                children: a.jsx('div', {
                                                  className:
                                                    'h-full w-1/4 bg-amber-400 rounded-full',
                                                }),
                                              }),
                                              a.jsx('span', {
                                                className:
                                                  'text-xs text-muted-foreground',
                                                children: '25%',
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            })
                          : a.jsx(ne, {
                              onClick: i,
                              className:
                                'w-full h-12 rounded-full text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20',
                              children: 'Empezar ahora',
                            }),
                        e.plan !== 'Free' &&
                          !t &&
                          a.jsxs('p', {
                            className:
                              'text-xs text-center text-muted-foreground',
                            children: [
                              'Accede a este y a más de ',
                              a.jsx('span', {
                                className: 'text-foreground font-medium',
                                children: '200 cursos',
                              }),
                              ' con el plan PRO.',
                              ' ',
                              a.jsx('a', {
                                href: '/planes',
                                className: 'text-primary hover:underline',
                                children: 'Ver planes',
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        a.jsx(IR, {
          open: r,
          onOpenChange: o,
          children: a.jsxs($1, {
            className: 'bg-card border-border',
            children: [
              a.jsxs(z1, {
                children: [
                  a.jsx(U1, { children: '¿Estás seguro?' }),
                  a.jsx(B1, {
                    children:
                      '¿Estás seguro que quieres cancelar tu suscripción al curso?',
                  }),
                ],
              }),
              a.jsxs(W1, {
                children: [
                  a.jsx(V1, {
                    className: 'rounded-full',
                    children: 'Cancelar',
                  }),
                  a.jsx(H1, {
                    onClick: l,
                    className:
                      'rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90',
                    children: 'Aceptar',
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  },
  zR = ({ items: e }) =>
    a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsx('h2', {
          className:
            'text-xl md:text-2xl font-bold font-display text-foreground mb-6',
          children: 'Lo que aprenderás',
        }),
        a.jsx('ul', {
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
          children: e.map((t, n) =>
            a.jsxs(
              'li',
              {
                className: 'flex items-start gap-3',
                children: [
                  a.jsx('div', {
                    className:
                      'flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5',
                    children: a.jsx(If, { className: 'w-3 h-3 text-primary' }),
                  }),
                  a.jsx('span', {
                    className: 'text-sm text-muted-foreground leading-relaxed',
                    children: t,
                  }),
                ],
              },
              n
            )
          ),
        }),
      ],
    }),
  WR = ({ items: e }) =>
    a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsx('h2', {
          className:
            'text-xl md:text-2xl font-bold font-display text-foreground mb-2',
          children: 'Qué vas a construir',
        }),
        a.jsx('p', {
          className: 'text-sm text-muted-foreground mb-6',
          children: 'Proyectos reales que podrás añadir a tu portafolio',
        }),
        a.jsx('div', {
          className: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
          children: e.map((t, n) =>
            a.jsxs(
              'div',
              {
                className:
                  'flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors',
                children: [
                  a.jsx('div', {
                    className:
                      'flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center',
                    children: a.jsx($f, { className: 'w-5 h-5 text-primary' }),
                  }),
                  a.jsx('span', {
                    className: 'text-sm font-medium text-foreground',
                    children: t,
                  }),
                ],
              },
              n
            )
          ),
        }),
      ],
    }),
  UR = (e) => {
    const t = e.toLowerCase();
    return t.includes('comunidad')
      ? a.jsx(Do, { className: 'w-4 h-4' })
      : t.includes('foro') || t.includes('duda')
        ? a.jsx(vx, { className: 'w-4 h-4' })
        : t.includes('vivo') || t.includes('sesion')
          ? a.jsx(Ea, { className: 'w-4 h-4' })
          : t.includes('ia') || t.includes('asistente')
            ? a.jsx(cS, { className: 'w-4 h-4' })
            : t.includes('grabacion') || t.includes('acceso')
              ? a.jsx(dx, { className: 'w-4 h-4' })
              : t.includes('certificado')
                ? a.jsx(lx, { className: 'w-4 h-4' })
                : a.jsx(Do, { className: 'w-4 h-4' });
  },
  BR = ({ spaces: e }) =>
    a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsx('h2', {
          className:
            'text-xl md:text-2xl font-bold font-display text-foreground mb-2',
          children: 'Espacios Artiefy incluidos',
        }),
        a.jsx('p', {
          className: 'text-sm text-muted-foreground mb-6',
          children: 'Recursos exclusivos para potenciar tu aprendizaje',
        }),
        a.jsx('div', {
          className: 'flex flex-wrap gap-2',
          children: e.map((t, n) =>
            a.jsxs(
              'div',
              {
                className:
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/50 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80',
                children: [
                  a.jsx('span', { className: 'text-primary', children: UR(t) }),
                  t,
                ],
              },
              n
            )
          ),
        }),
      ],
    });
var rc = 'Collapsible',
  [HR, Y1] = Ue(rc),
  [VR, um] = HR(rc),
  G1 = d.forwardRef((e, t) => {
    const {
        __scopeCollapsible: n,
        open: r,
        defaultOpen: o,
        disabled: s,
        onOpenChange: i,
        ...l
      } = e,
      [c, u] = cn({ prop: r, defaultProp: o ?? !1, onChange: i, caller: rc });
    return a.jsx(VR, {
      scope: n,
      disabled: s,
      contentId: sn(),
      open: c,
      onOpenToggle: d.useCallback(() => u((f) => !f), [u]),
      children: a.jsx(K.div, {
        'data-state': fm(c),
        'data-disabled': s ? '' : void 0,
        ...l,
        ref: t,
      }),
    });
  });
G1.displayName = rc;
var K1 = 'CollapsibleTrigger',
  Q1 = d.forwardRef((e, t) => {
    const { __scopeCollapsible: n, ...r } = e,
      o = um(K1, n);
    return a.jsx(K.button, {
      type: 'button',
      'aria-controls': o.contentId,
      'aria-expanded': o.open || !1,
      'data-state': fm(o.open),
      'data-disabled': o.disabled ? '' : void 0,
      disabled: o.disabled,
      ...r,
      ref: t,
      onClick: $(e.onClick, o.onOpenToggle),
    });
  });
Q1.displayName = K1;
var dm = 'CollapsibleContent',
  q1 = d.forwardRef((e, t) => {
    const { forceMount: n, ...r } = e,
      o = um(dm, e.__scopeCollapsible);
    return a.jsx(Nt, {
      present: n || o.open,
      children: ({ present: s }) => a.jsx(YR, { ...r, ref: t, present: s }),
    });
  });
q1.displayName = dm;
var YR = d.forwardRef((e, t) => {
  const { __scopeCollapsible: n, present: r, children: o, ...s } = e,
    i = um(dm, n),
    [l, c] = d.useState(r),
    u = d.useRef(null),
    f = se(t, u),
    m = d.useRef(0),
    p = m.current,
    h = d.useRef(0),
    b = h.current,
    v = i.open || l,
    w = d.useRef(v),
    x = d.useRef(void 0);
  return (
    d.useEffect(() => {
      const g = requestAnimationFrame(() => (w.current = !1));
      return () => cancelAnimationFrame(g);
    }, []),
    _e(() => {
      const g = u.current;
      if (g) {
        ((x.current = x.current || {
          transitionDuration: g.style.transitionDuration,
          animationName: g.style.animationName,
        }),
          (g.style.transitionDuration = '0s'),
          (g.style.animationName = 'none'));
        const y = g.getBoundingClientRect();
        ((m.current = y.height),
          (h.current = y.width),
          w.current ||
            ((g.style.transitionDuration = x.current.transitionDuration),
            (g.style.animationName = x.current.animationName)),
          c(r));
      }
    }, [i.open, r]),
    a.jsx(K.div, {
      'data-state': fm(i.open),
      'data-disabled': i.disabled ? '' : void 0,
      id: i.contentId,
      hidden: !v,
      ...s,
      ref: f,
      style: {
        '--radix-collapsible-content-height': p ? `${p}px` : void 0,
        '--radix-collapsible-content-width': b ? `${b}px` : void 0,
        ...e.style,
      },
      children: v && o,
    })
  );
});
function fm(e) {
  return e ? 'open' : 'closed';
}
var GR = G1,
  KR = Q1,
  QR = q1,
  qR = d.createContext(void 0);
function oc(e) {
  const t = d.useContext(qR);
  return e || t || 'ltr';
}
var Bt = 'Accordion',
  XR = ['Home', 'End', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
  [mm, ZR, JR] = Il(Bt),
  [sc, iO] = Ue(Bt, [JR, Y1]),
  pm = Y1(),
  X1 = A.forwardRef((e, t) => {
    const { type: n, ...r } = e,
      o = r,
      s = r;
    return a.jsx(mm.Provider, {
      scope: e.__scopeAccordion,
      children:
        n === 'multiple'
          ? a.jsx(rD, { ...s, ref: t })
          : a.jsx(nD, { ...o, ref: t }),
    });
  });
X1.displayName = Bt;
var [Z1, eD] = sc(Bt),
  [J1, tD] = sc(Bt, { collapsible: !1 }),
  nD = A.forwardRef((e, t) => {
    const {
        value: n,
        defaultValue: r,
        onValueChange: o = () => {},
        collapsible: s = !1,
        ...i
      } = e,
      [l, c] = cn({ prop: n, defaultProp: r ?? '', onChange: o, caller: Bt });
    return a.jsx(Z1, {
      scope: e.__scopeAccordion,
      value: A.useMemo(() => (l ? [l] : []), [l]),
      onItemOpen: c,
      onItemClose: A.useCallback(() => s && c(''), [s, c]),
      children: a.jsx(J1, {
        scope: e.__scopeAccordion,
        collapsible: s,
        children: a.jsx(ew, { ...i, ref: t }),
      }),
    });
  }),
  rD = A.forwardRef((e, t) => {
    const { value: n, defaultValue: r, onValueChange: o = () => {}, ...s } = e,
      [i, l] = cn({ prop: n, defaultProp: r ?? [], onChange: o, caller: Bt }),
      c = A.useCallback((f) => l((m = []) => [...m, f]), [l]),
      u = A.useCallback((f) => l((m = []) => m.filter((p) => p !== f)), [l]);
    return a.jsx(Z1, {
      scope: e.__scopeAccordion,
      value: i,
      onItemOpen: c,
      onItemClose: u,
      children: a.jsx(J1, {
        scope: e.__scopeAccordion,
        collapsible: !0,
        children: a.jsx(ew, { ...s, ref: t }),
      }),
    });
  }),
  [oD, ac] = sc(Bt),
  ew = A.forwardRef((e, t) => {
    const {
        __scopeAccordion: n,
        disabled: r,
        dir: o,
        orientation: s = 'vertical',
        ...i
      } = e,
      l = A.useRef(null),
      c = se(l, t),
      u = ZR(n),
      m = oc(o) === 'ltr',
      p = $(e.onKeyDown, (h) => {
        var k;
        if (!XR.includes(h.key)) return;
        const b = h.target,
          v = u().filter((M) => {
            var D;
            return !((D = M.ref.current) != null && D.disabled);
          }),
          w = v.findIndex((M) => M.ref.current === b),
          x = v.length;
        if (w === -1) return;
        h.preventDefault();
        let g = w;
        const y = 0,
          N = x - 1,
          C = () => {
            ((g = w + 1), g > N && (g = y));
          },
          j = () => {
            ((g = w - 1), g < y && (g = N));
          };
        switch (h.key) {
          case 'Home':
            g = y;
            break;
          case 'End':
            g = N;
            break;
          case 'ArrowRight':
            s === 'horizontal' && (m ? C() : j());
            break;
          case 'ArrowDown':
            s === 'vertical' && C();
            break;
          case 'ArrowLeft':
            s === 'horizontal' && (m ? j() : C());
            break;
          case 'ArrowUp':
            s === 'vertical' && j();
            break;
        }
        const S = g % x;
        (k = v[S].ref.current) == null || k.focus();
      });
    return a.jsx(oD, {
      scope: n,
      disabled: r,
      direction: o,
      orientation: s,
      children: a.jsx(mm.Slot, {
        scope: n,
        children: a.jsx(K.div, {
          ...i,
          'data-orientation': s,
          ref: c,
          onKeyDown: r ? void 0 : p,
        }),
      }),
    });
  }),
  dl = 'AccordionItem',
  [sD, hm] = sc(dl),
  tw = A.forwardRef((e, t) => {
    const { __scopeAccordion: n, value: r, ...o } = e,
      s = ac(dl, n),
      i = eD(dl, n),
      l = pm(n),
      c = sn(),
      u = (r && i.value.includes(r)) || !1,
      f = s.disabled || e.disabled;
    return a.jsx(sD, {
      scope: n,
      open: u,
      disabled: f,
      triggerId: c,
      children: a.jsx(GR, {
        'data-orientation': s.orientation,
        'data-state': iw(u),
        ...l,
        ...o,
        ref: t,
        disabled: f,
        open: u,
        onOpenChange: (m) => {
          m ? i.onItemOpen(r) : i.onItemClose(r);
        },
      }),
    });
  });
tw.displayName = dl;
var nw = 'AccordionHeader',
  rw = A.forwardRef((e, t) => {
    const { __scopeAccordion: n, ...r } = e,
      o = ac(Bt, n),
      s = hm(nw, n);
    return a.jsx(K.h3, {
      'data-orientation': o.orientation,
      'data-state': iw(s.open),
      'data-disabled': s.disabled ? '' : void 0,
      ...r,
      ref: t,
    });
  });
rw.displayName = nw;
var kd = 'AccordionTrigger',
  ow = A.forwardRef((e, t) => {
    const { __scopeAccordion: n, ...r } = e,
      o = ac(Bt, n),
      s = hm(kd, n),
      i = tD(kd, n),
      l = pm(n);
    return a.jsx(mm.ItemSlot, {
      scope: n,
      children: a.jsx(KR, {
        'aria-disabled': (s.open && !i.collapsible) || void 0,
        'data-orientation': o.orientation,
        id: s.triggerId,
        ...l,
        ...r,
        ref: t,
      }),
    });
  });
ow.displayName = kd;
var sw = 'AccordionContent',
  aw = A.forwardRef((e, t) => {
    const { __scopeAccordion: n, ...r } = e,
      o = ac(Bt, n),
      s = hm(sw, n),
      i = pm(n);
    return a.jsx(QR, {
      role: 'region',
      'aria-labelledby': s.triggerId,
      'data-orientation': o.orientation,
      ...i,
      ...r,
      ref: t,
      style: {
        '--radix-accordion-content-height':
          'var(--radix-collapsible-content-height)',
        '--radix-accordion-content-width':
          'var(--radix-collapsible-content-width)',
        ...e.style,
      },
    });
  });
aw.displayName = sw;
function iw(e) {
  return e ? 'open' : 'closed';
}
var aD = X1,
  iD = tw,
  lD = rw,
  lw = ow,
  cw = aw;
const uw = aD,
  gm = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(iD, { ref: n, className: L('border-b', e), ...t })
  );
gm.displayName = 'AccordionItem';
const vm = d.forwardRef(({ className: e, children: t, ...n }, r) =>
  a.jsx(lD, {
    className: 'flex',
    children: a.jsxs(lw, {
      ref: r,
      className: L(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        e
      ),
      ...n,
      children: [
        t,
        a.jsx(No, {
          className: 'h-4 w-4 shrink-0 transition-transform duration-200',
        }),
      ],
    }),
  })
);
vm.displayName = lw.displayName;
const xm = d.forwardRef(({ className: e, children: t, ...n }, r) =>
  a.jsx(cw, {
    ref: r,
    className:
      'overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    ...n,
    children: a.jsx('div', { className: L('pb-4 pt-0', e), children: t }),
  })
);
xm.displayName = cw.displayName;
const cD = (e) => {
    const t = e.reduce((n, r) => {
      const o = r.duration.match(/(\d+)/);
      return n + (o ? parseInt(o[1]) : 0);
    }, 0);
    if (t >= 60) {
      const n = Math.floor(t / 60),
        r = t % 60;
      return r > 0 ? `${n}h ${r}min` : `${n}h`;
    }
    return `${t} min`;
  },
  uD = ({ modules: e }) => {
    const t = e.reduce((n, r) => n + r.lessons.length, 0);
    return a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsxs('div', {
          className: 'flex items-center justify-between mb-6',
          children: [
            a.jsx('h2', {
              className:
                'text-xl md:text-2xl font-bold font-display text-foreground',
              children: 'Contenido del curso',
            }),
            a.jsxs('span', {
              className: 'text-sm text-muted-foreground',
              children: [e.length, ' módulos · ', t, ' clases'],
            }),
          ],
        }),
        a.jsx(uw, {
          type: 'single',
          collapsible: !0,
          className: 'space-y-3',
          children: e.map((n, r) =>
            a.jsxs(
              gm,
              {
                value: `module-${r}`,
                className:
                  'border border-border/50 rounded-xl px-4 bg-secondary/20 data-[state=open]:bg-secondary/40',
                children: [
                  a.jsx(vm, {
                    className: 'hover:no-underline py-4',
                    children: a.jsx('div', {
                      className:
                        'flex items-center justify-between w-full pr-4',
                      children: a.jsxs('div', {
                        className: 'text-left',
                        children: [
                          a.jsx('h3', {
                            className: 'text-sm font-semibold text-foreground',
                            children: n.title,
                          }),
                          a.jsxs('p', {
                            className: 'text-xs text-muted-foreground mt-0.5',
                            children: [
                              n.lessons.length,
                              ' clases · ',
                              cD(n.lessons),
                            ],
                          }),
                        ],
                      }),
                    }),
                  }),
                  a.jsxs(xm, {
                    className: 'pb-4',
                    children: [
                      n.description &&
                        a.jsx('p', {
                          className: 'text-sm text-muted-foreground mb-4 pl-1',
                          children: n.description,
                        }),
                      a.jsx('ul', {
                        className: 'space-y-2',
                        children: n.lessons.map((o, s) =>
                          a.jsxs(
                            'li',
                            {
                              className:
                                'flex items-center justify-between p-3 rounded-lg hover:bg-background/50 transition-colors',
                              children: [
                                a.jsxs('div', {
                                  className: 'flex items-center gap-3',
                                  children: [
                                    a.jsx(dx, {
                                      className: 'w-4 h-4 text-primary',
                                    }),
                                    a.jsx('span', {
                                      className: 'text-sm text-foreground',
                                      children: o.title,
                                    }),
                                  ],
                                }),
                                a.jsxs('div', {
                                  className:
                                    'flex items-center gap-1.5 text-xs text-muted-foreground',
                                  children: [
                                    a.jsx(Hr, { className: 'w-3 h-3' }),
                                    o.duration,
                                  ],
                                }),
                              ],
                            },
                            s
                          )
                        ),
                      }),
                    ],
                  }),
                ],
              },
              r
            )
          ),
        }),
      ],
    });
  },
  dD = ({ educator: e }) =>
    a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsx('h2', {
          className:
            'text-xl md:text-2xl font-bold font-display text-foreground mb-6',
          children: 'Sobre el educador',
        }),
        a.jsxs('div', {
          className: 'flex items-start gap-4 sm:gap-6',
          children: [
            a.jsx('div', {
              className: 'flex-shrink-0',
              children: e.avatarUrl
                ? a.jsx('img', {
                    src: e.avatarUrl,
                    alt: e.name,
                    className:
                      'w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-primary/20',
                  })
                : a.jsx('div', {
                    className:
                      'w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-secondary flex items-center justify-center text-2xl font-bold text-primary',
                    children: e.name.charAt(0),
                  }),
            }),
            a.jsxs('div', {
              className: 'flex-1 min-w-0',
              children: [
                a.jsx('h3', {
                  className: 'text-lg font-semibold text-foreground',
                  children: e.name,
                }),
                e.role &&
                  a.jsx('p', {
                    className: 'text-sm text-primary font-medium mt-0.5',
                    children: e.role,
                  }),
                e.bio &&
                  a.jsx('p', {
                    className:
                      'text-sm text-muted-foreground mt-3 leading-relaxed',
                    children: e.bio,
                  }),
              ],
            }),
          ],
        }),
      ],
    }),
  fD = ({ faqs: e }) =>
    a.jsxs('section', {
      className: 'bg-card border border-border rounded-2xl p-6 md:p-8',
      children: [
        a.jsx('h2', {
          className:
            'text-xl md:text-2xl font-bold font-display text-foreground mb-6',
          children: 'Preguntas frecuentes',
        }),
        a.jsx(uw, {
          type: 'single',
          collapsible: !0,
          className: 'space-y-3',
          children: e.map((t, n) =>
            a.jsxs(
              gm,
              {
                value: `faq-${n}`,
                className:
                  'border border-border/50 rounded-xl px-4 bg-secondary/20 data-[state=open]:bg-secondary/40',
                children: [
                  a.jsx(vm, {
                    className: 'hover:no-underline py-4 text-left',
                    children: a.jsx('span', {
                      className: 'text-sm font-medium text-foreground pr-4',
                      children: t.question,
                    }),
                  }),
                  a.jsx(xm, {
                    className: 'pb-4',
                    children: a.jsx('p', {
                      className:
                        'text-sm text-muted-foreground leading-relaxed',
                      children: t.answer,
                    }),
                  }),
                ],
              },
              n
            )
          ),
        }),
      ],
    }),
  mD = [
    { id: 'curso', label: 'Curso' },
    { id: 'clases', label: 'Clases grabadas', notifications: 2 },
    { id: 'proyectos', label: 'Proyectos', notifications: 1 },
    { id: 'recursos', label: 'Recursos', notifications: 3 },
    { id: 'actividades', label: 'Actividades', notifications: 5 },
    { id: 'foro', label: 'Foro', notifications: 8 },
  ],
  pD = ({ activeTab: e, onTabChange: t }) => {
    const [n, r] = d.useState(!1),
      o = d.useRef(null),
      s = (i) => {
        o.current &&
          o.current.scrollBy({
            left: i === 'left' ? -200 : 200,
            behavior: 'smooth',
          });
      };
    return a.jsxs('div', {
      className: 'relative group',
      onMouseEnter: () => r(!0),
      onMouseLeave: () => r(!1),
      children: [
        a.jsx('button', {
          onClick: () => s('left'),
          className: L(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center',
            'bg-background/90 backdrop-blur-sm border border-border/50 rounded-full shadow-lg',
            'text-foreground hover:bg-card transition-all duration-200',
            n
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-90 pointer-events-none'
          ),
          children: a.jsx(Lf, { className: 'w-4 h-4' }),
        }),
        a.jsx('nav', {
          ref: o,
          className: 'flex items-center gap-2 overflow-x-auto px-10',
          style: { scrollbarWidth: 'none', msOverflowStyle: 'none' },
          children: mD.map((i) =>
            a.jsxs(
              'button',
              {
                onClick: () => t(i.id),
                className: L(
                  'relative px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2',
                  e === i.id
                    ? 'bg-card text-foreground border border-border/50 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                ),
                children: [
                  i.label,
                  i.notifications &&
                    i.notifications > 0 &&
                    a.jsx('span', {
                      className:
                        'inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full',
                      children: i.notifications > 99 ? '99+' : i.notifications,
                    }),
                ],
              },
              i.id
            )
          ),
        }),
        a.jsx('button', {
          onClick: () => s('right'),
          className: L(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center',
            'bg-background/90 backdrop-blur-sm border border-border/50 rounded-full shadow-lg',
            'text-foreground hover:bg-card transition-all duration-200',
            n
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-90 pointer-events-none'
          ),
          children: a.jsx(wn, { className: 'w-4 h-4' }),
        }),
      ],
    });
  },
  hD = ({ sessions: e }) =>
    a.jsxs('div', {
      className: 'space-y-4',
      children: [
        a.jsxs('div', {
          className: 'flex items-center gap-3',
          children: [
            a.jsx('div', {
              className: 'p-2 bg-red-500/20 rounded-lg',
              children: a.jsx(Ea, { className: 'w-5 h-5 text-red-400' }),
            }),
            a.jsx('h2', {
              className: 'text-xl font-semibold text-foreground',
              children: 'Clase en Vivo',
            }),
          ],
        }),
        a.jsx('div', {
          className: 'space-y-3',
          children: e.map((t) =>
            a.jsx(
              'div',
              {
                className:
                  'bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-3',
                children: a.jsxs('div', {
                  className: 'flex items-start justify-between gap-4',
                  children: [
                    a.jsxs('div', {
                      className: 'space-y-1',
                      children: [
                        a.jsxs('div', {
                          className: 'flex items-center gap-2',
                          children: [
                            t.isLive &&
                              a.jsxs('span', {
                                className:
                                  'flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full',
                                children: [
                                  a.jsx('span', {
                                    className:
                                      'w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse',
                                  }),
                                  'EN VIVO',
                                ],
                              }),
                            a.jsx('h3', {
                              className: 'font-medium text-foreground',
                              children: t.title,
                            }),
                          ],
                        }),
                        a.jsxs('div', {
                          className:
                            'flex flex-wrap items-center gap-3 text-sm text-muted-foreground',
                          children: [
                            a.jsxs('span', {
                              className: 'flex items-center gap-1.5',
                              children: [
                                a.jsx(_t, { className: 'w-4 h-4' }),
                                t.date,
                              ],
                            }),
                            a.jsxs('span', {
                              className: 'flex items-center gap-1.5',
                              children: [
                                a.jsx(Hr, { className: 'w-4 h-4' }),
                                t.time,
                                ' (',
                                t.duration,
                                ')',
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    a.jsx(ne, {
                      size: 'sm',
                      className: t.isLive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-accent/20 text-accent hover:bg-accent/30',
                      asChild: !0,
                      children: a.jsxs('a', {
                        href: t.meetingUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        children: [
                          a.jsx(mx, { className: 'w-4 h-4 mr-2' }),
                          t.isLive ? 'Unirse Ahora' : 'Ver enlace',
                        ],
                      }),
                    }),
                  ],
                }),
              },
              t.id
            )
          ),
        }),
      ],
    });
function pe(e) {
  const t = Object.prototype.toString.call(e);
  return e instanceof Date || (typeof e == 'object' && t === '[object Date]')
    ? new e.constructor(+e)
    : typeof e == 'number' ||
        t === '[object Number]' ||
        typeof e == 'string' ||
        t === '[object String]'
      ? new Date(e)
      : new Date(NaN);
}
function mr(e, t) {
  return e instanceof Date ? new e.constructor(t) : new Date(t);
}
function Pd(e, t) {
  const n = pe(e);
  return isNaN(t) ? mr(e, NaN) : (t && n.setDate(n.getDate() + t), n);
}
const dw = 6048e5,
  gD = 864e5,
  fw = 6e4,
  mw = 36e5;
let vD = {};
function ic() {
  return vD;
}
function bn(e, t) {
  var l, c, u, f;
  const n = ic(),
    r =
      (t == null ? void 0 : t.weekStartsOn) ??
      ((c = (l = t == null ? void 0 : t.locale) == null ? void 0 : l.options) ==
      null
        ? void 0
        : c.weekStartsOn) ??
      n.weekStartsOn ??
      ((f = (u = n.locale) == null ? void 0 : u.options) == null
        ? void 0
        : f.weekStartsOn) ??
      0,
    o = pe(e),
    s = o.getDay(),
    i = (s < r ? 7 : 0) + s - r;
  return (o.setDate(o.getDate() - i), o.setHours(0, 0, 0, 0), o);
}
function fl(e) {
  return bn(e, { weekStartsOn: 1 });
}
function pw(e) {
  const t = pe(e),
    n = t.getFullYear(),
    r = mr(e, 0);
  (r.setFullYear(n + 1, 0, 4), r.setHours(0, 0, 0, 0));
  const o = fl(r),
    s = mr(e, 0);
  (s.setFullYear(n, 0, 4), s.setHours(0, 0, 0, 0));
  const i = fl(s);
  return t.getTime() >= o.getTime()
    ? n + 1
    : t.getTime() >= i.getTime()
      ? n
      : n - 1;
}
function Kh(e) {
  const t = pe(e);
  return (t.setHours(0, 0, 0, 0), t);
}
function Qh(e) {
  const t = pe(e),
    n = new Date(
      Date.UTC(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        t.getHours(),
        t.getMinutes(),
        t.getSeconds(),
        t.getMilliseconds()
      )
    );
  return (n.setUTCFullYear(t.getFullYear()), +e - +n);
}
function hw(e, t) {
  const n = Kh(e),
    r = Kh(t),
    o = +n - Qh(n),
    s = +r - Qh(r);
  return Math.round((o - s) / gD);
}
function xD(e) {
  const t = pw(e),
    n = mr(e, 0);
  return (n.setFullYear(t, 0, 4), n.setHours(0, 0, 0, 0), fl(n));
}
function yD(e, t) {
  const n = t * 7;
  return Pd(e, n);
}
function wD(e) {
  return (
    e instanceof Date ||
    (typeof e == 'object' &&
      Object.prototype.toString.call(e) === '[object Date]')
  );
}
function bD(e) {
  if (!wD(e) && typeof e != 'number') return !1;
  const t = pe(e);
  return !isNaN(Number(t));
}
function iu(e, t) {
  const n = pe(e),
    r = pe(t),
    o = qh(n, r),
    s = Math.abs(hw(n, r));
  n.setDate(n.getDate() - o * s);
  const i = +(qh(n, r) === -o),
    l = o * (s - i);
  return l === 0 ? 0 : l;
}
function qh(e, t) {
  const n =
    e.getFullYear() - t.getFullYear() ||
    e.getMonth() - t.getMonth() ||
    e.getDate() - t.getDate() ||
    e.getHours() - t.getHours() ||
    e.getMinutes() - t.getMinutes() ||
    e.getSeconds() - t.getSeconds() ||
    e.getMilliseconds() - t.getMilliseconds();
  return n < 0 ? -1 : n > 0 ? 1 : n;
}
function ND(e) {
  const t = pe(e),
    n = t.getMonth();
  return (
    t.setFullYear(t.getFullYear(), n + 1, 0),
    t.setHours(23, 59, 59, 999),
    t
  );
}
function jD(e, t) {
  const n = pe(e.start),
    r = pe(e.end);
  let o = +n > +r;
  const s = o ? +n : +r,
    i = o ? r : n;
  i.setHours(0, 0, 0, 0);
  let l = 1;
  const c = [];
  for (; +i <= s; )
    (c.push(pe(i)), i.setDate(i.getDate() + l), i.setHours(0, 0, 0, 0));
  return o ? c.reverse() : c;
}
function CD(e, t) {
  const n = pe(e.start),
    r = pe(e.end);
  let o = +n > +r;
  const s = o ? +n : +r,
    i = o ? r : n;
  (i.setHours(0, 0, 0, 0), i.setDate(1));
  let l = 1;
  const c = [];
  for (; +i <= s; ) (c.push(pe(i)), i.setMonth(i.getMonth() + l));
  return o ? c.reverse() : c;
}
function SD(e, t) {
  const n = pe(e.start),
    r = pe(e.end);
  let o = +n > +r;
  const s = bn(o ? r : n, t),
    i = bn(o ? n : r, t);
  (s.setHours(15), i.setHours(15));
  const l = +i.getTime();
  let c = s,
    u = (t == null ? void 0 : t.step) ?? 1;
  if (!u) return [];
  u < 0 && ((u = -u), (o = !o));
  const f = [];
  for (; +c <= l; )
    (c.setHours(0), f.push(pe(c)), (c = yD(c, u)), c.setHours(15));
  return o ? f.reverse() : f;
}
function ED(e) {
  const t = pe(e),
    n = mr(e, 0);
  return (n.setFullYear(t.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n);
}
function kD(e, t) {
  const n = t == null ? void 0 : t.weekStartsOn,
    r = pe(e),
    o = r.getDay(),
    s = (o < n ? -7 : 0) + 6 - (o - n);
  return (r.setDate(r.getDate() + s), r.setHours(23, 59, 59, 999), r);
}
const PD = {
    lessThanXSeconds: {
      one: 'less than a second',
      other: 'less than {{count}} seconds',
    },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: {
      one: 'less than a minute',
      other: 'less than {{count}} minutes',
    },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  TD = (e, t, n) => {
    let r;
    const o = PD[e];
    return (
      typeof o == 'string'
        ? (r = o)
        : t === 1
          ? (r = o.one)
          : (r = o.other.replace('{{count}}', t.toString())),
      n != null && n.addSuffix
        ? n.comparison && n.comparison > 0
          ? 'in ' + r
          : r + ' ago'
        : r
    );
  };
function Io(e) {
  return (t = {}) => {
    const n = t.width ? String(t.width) : e.defaultWidth;
    return e.formats[n] || e.formats[e.defaultWidth];
  };
}
const RD = {
    full: 'EEEE, MMMM do, y',
    long: 'MMMM do, y',
    medium: 'MMM d, y',
    short: 'MM/dd/yyyy',
  },
  DD = {
    full: 'h:mm:ss a zzzz',
    long: 'h:mm:ss a z',
    medium: 'h:mm:ss a',
    short: 'h:mm a',
  },
  MD = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  AD = {
    date: Io({ formats: RD, defaultWidth: 'full' }),
    time: Io({ formats: DD, defaultWidth: 'full' }),
    dateTime: Io({ formats: MD, defaultWidth: 'full' }),
  },
  OD = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  _D = (e, t, n, r) => OD[e];
function en(e) {
  return (t, n) => {
    const r = n != null && n.context ? String(n.context) : 'standalone';
    let o;
    if (r === 'formatting' && e.formattingValues) {
      const i = e.defaultFormattingWidth || e.defaultWidth,
        l = n != null && n.width ? String(n.width) : i;
      o = e.formattingValues[l] || e.formattingValues[i];
    } else {
      const i = e.defaultWidth,
        l = n != null && n.width ? String(n.width) : e.defaultWidth;
      o = e.values[l] || e.values[i];
    }
    const s = e.argumentCallback ? e.argumentCallback(t) : t;
    return o[s];
  };
}
const ID = {
    narrow: ['B', 'A'],
    abbreviated: ['BC', 'AD'],
    wide: ['Before Christ', 'Anno Domini'],
  },
  LD = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  FD = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  $D = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
  },
  zD = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  WD = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  UD = (e, t) => {
    const n = Number(e),
      r = n % 100;
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + 'st';
        case 2:
          return n + 'nd';
        case 3:
          return n + 'rd';
      }
    return n + 'th';
  },
  BD = {
    ordinalNumber: UD,
    era: en({ values: ID, defaultWidth: 'wide' }),
    quarter: en({
      values: LD,
      defaultWidth: 'wide',
      argumentCallback: (e) => e - 1,
    }),
    month: en({ values: FD, defaultWidth: 'wide' }),
    day: en({ values: $D, defaultWidth: 'wide' }),
    dayPeriod: en({
      values: zD,
      defaultWidth: 'wide',
      formattingValues: WD,
      defaultFormattingWidth: 'wide',
    }),
  };
function tn(e) {
  return (t, n = {}) => {
    const r = n.width,
      o = (r && e.matchPatterns[r]) || e.matchPatterns[e.defaultMatchWidth],
      s = t.match(o);
    if (!s) return null;
    const i = s[0],
      l = (r && e.parsePatterns[r]) || e.parsePatterns[e.defaultParseWidth],
      c = Array.isArray(l) ? VD(l, (m) => m.test(i)) : HD(l, (m) => m.test(i));
    let u;
    ((u = e.valueCallback ? e.valueCallback(c) : c),
      (u = n.valueCallback ? n.valueCallback(u) : u));
    const f = t.slice(i.length);
    return { value: u, rest: f };
  };
}
function HD(e, t) {
  for (const n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function VD(e, t) {
  for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function gw(e) {
  return (t, n = {}) => {
    const r = t.match(e.matchPattern);
    if (!r) return null;
    const o = r[0],
      s = t.match(e.parsePattern);
    if (!s) return null;
    let i = e.valueCallback ? e.valueCallback(s[0]) : s[0];
    i = n.valueCallback ? n.valueCallback(i) : i;
    const l = t.slice(o.length);
    return { value: i, rest: l };
  };
}
const YD = /^(\d+)(th|st|nd|rd)?/i,
  GD = /\d+/i,
  KD = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  QD = { any: [/^b/i, /^(a|c)/i] },
  qD = {
    narrow: /^[1234]/i,
    abbreviated: /^q[1234]/i,
    wide: /^[1234](th|st|nd|rd)? quarter/i,
  },
  XD = { any: [/1/i, /2/i, /3/i, /4/i] },
  ZD = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  JD = {
    narrow: [
      /^j/i,
      /^f/i,
      /^m/i,
      /^a/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  e5 = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  t5 = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  n5 = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  r5 = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  o5 = {
    ordinalNumber: gw({
      matchPattern: YD,
      parsePattern: GD,
      valueCallback: (e) => parseInt(e, 10),
    }),
    era: tn({
      matchPatterns: KD,
      defaultMatchWidth: 'wide',
      parsePatterns: QD,
      defaultParseWidth: 'any',
    }),
    quarter: tn({
      matchPatterns: qD,
      defaultMatchWidth: 'wide',
      parsePatterns: XD,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: tn({
      matchPatterns: ZD,
      defaultMatchWidth: 'wide',
      parsePatterns: JD,
      defaultParseWidth: 'any',
    }),
    day: tn({
      matchPatterns: e5,
      defaultMatchWidth: 'wide',
      parsePatterns: t5,
      defaultParseWidth: 'any',
    }),
    dayPeriod: tn({
      matchPatterns: n5,
      defaultMatchWidth: 'any',
      parsePatterns: r5,
      defaultParseWidth: 'any',
    }),
  },
  s5 = {
    code: 'en-US',
    formatDistance: TD,
    formatLong: AD,
    formatRelative: _D,
    localize: BD,
    match: o5,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  };
function a5(e) {
  const t = pe(e);
  return hw(t, ED(t)) + 1;
}
function i5(e) {
  const t = pe(e),
    n = +fl(t) - +xD(t);
  return Math.round(n / dw) + 1;
}
function vw(e, t) {
  var f, m, p, h;
  const n = pe(e),
    r = n.getFullYear(),
    o = ic(),
    s =
      (t == null ? void 0 : t.firstWeekContainsDate) ??
      ((m = (f = t == null ? void 0 : t.locale) == null ? void 0 : f.options) ==
      null
        ? void 0
        : m.firstWeekContainsDate) ??
      o.firstWeekContainsDate ??
      ((h = (p = o.locale) == null ? void 0 : p.options) == null
        ? void 0
        : h.firstWeekContainsDate) ??
      1,
    i = mr(e, 0);
  (i.setFullYear(r + 1, 0, s), i.setHours(0, 0, 0, 0));
  const l = bn(i, t),
    c = mr(e, 0);
  (c.setFullYear(r, 0, s), c.setHours(0, 0, 0, 0));
  const u = bn(c, t);
  return n.getTime() >= l.getTime()
    ? r + 1
    : n.getTime() >= u.getTime()
      ? r
      : r - 1;
}
function l5(e, t) {
  var l, c, u, f;
  const n = ic(),
    r =
      (t == null ? void 0 : t.firstWeekContainsDate) ??
      ((c = (l = t == null ? void 0 : t.locale) == null ? void 0 : l.options) ==
      null
        ? void 0
        : c.firstWeekContainsDate) ??
      n.firstWeekContainsDate ??
      ((f = (u = n.locale) == null ? void 0 : u.options) == null
        ? void 0
        : f.firstWeekContainsDate) ??
      1,
    o = vw(e, t),
    s = mr(e, 0);
  return (s.setFullYear(o, 0, r), s.setHours(0, 0, 0, 0), bn(s, t));
}
function c5(e, t) {
  const n = pe(e),
    r = +bn(n, t) - +l5(n, t);
  return Math.round(r / dw) + 1;
}
function ae(e, t) {
  const n = e < 0 ? '-' : '',
    r = Math.abs(e).toString().padStart(t, '0');
  return n + r;
}
const Ln = {
    y(e, t) {
      const n = e.getFullYear(),
        r = n > 0 ? n : 1 - n;
      return ae(t === 'yy' ? r % 100 : r, t.length);
    },
    M(e, t) {
      const n = e.getMonth();
      return t === 'M' ? String(n + 1) : ae(n + 1, 2);
    },
    d(e, t) {
      return ae(e.getDate(), t.length);
    },
    a(e, t) {
      const n = e.getHours() / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return n.toUpperCase();
        case 'aaa':
          return n;
        case 'aaaaa':
          return n[0];
        case 'aaaa':
        default:
          return n === 'am' ? 'a.m.' : 'p.m.';
      }
    },
    h(e, t) {
      return ae(e.getHours() % 12 || 12, t.length);
    },
    H(e, t) {
      return ae(e.getHours(), t.length);
    },
    m(e, t) {
      return ae(e.getMinutes(), t.length);
    },
    s(e, t) {
      return ae(e.getSeconds(), t.length);
    },
    S(e, t) {
      const n = t.length,
        r = e.getMilliseconds(),
        o = Math.trunc(r * Math.pow(10, n - 3));
      return ae(o, t.length);
    },
  },
  ao = {
    am: 'am',
    pm: 'pm',
    midnight: 'midnight',
    noon: 'noon',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    night: 'night',
  },
  Xh = {
    G: function (e, t, n) {
      const r = e.getFullYear() > 0 ? 1 : 0;
      switch (t) {
        case 'G':
        case 'GG':
        case 'GGG':
          return n.era(r, { width: 'abbreviated' });
        case 'GGGGG':
          return n.era(r, { width: 'narrow' });
        case 'GGGG':
        default:
          return n.era(r, { width: 'wide' });
      }
    },
    y: function (e, t, n) {
      if (t === 'yo') {
        const r = e.getFullYear(),
          o = r > 0 ? r : 1 - r;
        return n.ordinalNumber(o, { unit: 'year' });
      }
      return Ln.y(e, t);
    },
    Y: function (e, t, n, r) {
      const o = vw(e, r),
        s = o > 0 ? o : 1 - o;
      if (t === 'YY') {
        const i = s % 100;
        return ae(i, 2);
      }
      return t === 'Yo'
        ? n.ordinalNumber(s, { unit: 'year' })
        : ae(s, t.length);
    },
    R: function (e, t) {
      const n = pw(e);
      return ae(n, t.length);
    },
    u: function (e, t) {
      const n = e.getFullYear();
      return ae(n, t.length);
    },
    Q: function (e, t, n) {
      const r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case 'Q':
          return String(r);
        case 'QQ':
          return ae(r, 2);
        case 'Qo':
          return n.ordinalNumber(r, { unit: 'quarter' });
        case 'QQQ':
          return n.quarter(r, { width: 'abbreviated', context: 'formatting' });
        case 'QQQQQ':
          return n.quarter(r, { width: 'narrow', context: 'formatting' });
        case 'QQQQ':
        default:
          return n.quarter(r, { width: 'wide', context: 'formatting' });
      }
    },
    q: function (e, t, n) {
      const r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case 'q':
          return String(r);
        case 'qq':
          return ae(r, 2);
        case 'qo':
          return n.ordinalNumber(r, { unit: 'quarter' });
        case 'qqq':
          return n.quarter(r, { width: 'abbreviated', context: 'standalone' });
        case 'qqqqq':
          return n.quarter(r, { width: 'narrow', context: 'standalone' });
        case 'qqqq':
        default:
          return n.quarter(r, { width: 'wide', context: 'standalone' });
      }
    },
    M: function (e, t, n) {
      const r = e.getMonth();
      switch (t) {
        case 'M':
        case 'MM':
          return Ln.M(e, t);
        case 'Mo':
          return n.ordinalNumber(r + 1, { unit: 'month' });
        case 'MMM':
          return n.month(r, { width: 'abbreviated', context: 'formatting' });
        case 'MMMMM':
          return n.month(r, { width: 'narrow', context: 'formatting' });
        case 'MMMM':
        default:
          return n.month(r, { width: 'wide', context: 'formatting' });
      }
    },
    L: function (e, t, n) {
      const r = e.getMonth();
      switch (t) {
        case 'L':
          return String(r + 1);
        case 'LL':
          return ae(r + 1, 2);
        case 'Lo':
          return n.ordinalNumber(r + 1, { unit: 'month' });
        case 'LLL':
          return n.month(r, { width: 'abbreviated', context: 'standalone' });
        case 'LLLLL':
          return n.month(r, { width: 'narrow', context: 'standalone' });
        case 'LLLL':
        default:
          return n.month(r, { width: 'wide', context: 'standalone' });
      }
    },
    w: function (e, t, n, r) {
      const o = c5(e, r);
      return t === 'wo'
        ? n.ordinalNumber(o, { unit: 'week' })
        : ae(o, t.length);
    },
    I: function (e, t, n) {
      const r = i5(e);
      return t === 'Io'
        ? n.ordinalNumber(r, { unit: 'week' })
        : ae(r, t.length);
    },
    d: function (e, t, n) {
      return t === 'do'
        ? n.ordinalNumber(e.getDate(), { unit: 'date' })
        : Ln.d(e, t);
    },
    D: function (e, t, n) {
      const r = a5(e);
      return t === 'Do'
        ? n.ordinalNumber(r, { unit: 'dayOfYear' })
        : ae(r, t.length);
    },
    E: function (e, t, n) {
      const r = e.getDay();
      switch (t) {
        case 'E':
        case 'EE':
        case 'EEE':
          return n.day(r, { width: 'abbreviated', context: 'formatting' });
        case 'EEEEE':
          return n.day(r, { width: 'narrow', context: 'formatting' });
        case 'EEEEEE':
          return n.day(r, { width: 'short', context: 'formatting' });
        case 'EEEE':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' });
      }
    },
    e: function (e, t, n, r) {
      const o = e.getDay(),
        s = (o - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'e':
          return String(s);
        case 'ee':
          return ae(s, 2);
        case 'eo':
          return n.ordinalNumber(s, { unit: 'day' });
        case 'eee':
          return n.day(o, { width: 'abbreviated', context: 'formatting' });
        case 'eeeee':
          return n.day(o, { width: 'narrow', context: 'formatting' });
        case 'eeeeee':
          return n.day(o, { width: 'short', context: 'formatting' });
        case 'eeee':
        default:
          return n.day(o, { width: 'wide', context: 'formatting' });
      }
    },
    c: function (e, t, n, r) {
      const o = e.getDay(),
        s = (o - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case 'c':
          return String(s);
        case 'cc':
          return ae(s, t.length);
        case 'co':
          return n.ordinalNumber(s, { unit: 'day' });
        case 'ccc':
          return n.day(o, { width: 'abbreviated', context: 'standalone' });
        case 'ccccc':
          return n.day(o, { width: 'narrow', context: 'standalone' });
        case 'cccccc':
          return n.day(o, { width: 'short', context: 'standalone' });
        case 'cccc':
        default:
          return n.day(o, { width: 'wide', context: 'standalone' });
      }
    },
    i: function (e, t, n) {
      const r = e.getDay(),
        o = r === 0 ? 7 : r;
      switch (t) {
        case 'i':
          return String(o);
        case 'ii':
          return ae(o, t.length);
        case 'io':
          return n.ordinalNumber(o, { unit: 'day' });
        case 'iii':
          return n.day(r, { width: 'abbreviated', context: 'formatting' });
        case 'iiiii':
          return n.day(r, { width: 'narrow', context: 'formatting' });
        case 'iiiiii':
          return n.day(r, { width: 'short', context: 'formatting' });
        case 'iiii':
        default:
          return n.day(r, { width: 'wide', context: 'formatting' });
      }
    },
    a: function (e, t, n) {
      const o = e.getHours() / 12 >= 1 ? 'pm' : 'am';
      switch (t) {
        case 'a':
        case 'aa':
          return n.dayPeriod(o, {
            width: 'abbreviated',
            context: 'formatting',
          });
        case 'aaa':
          return n
            .dayPeriod(o, { width: 'abbreviated', context: 'formatting' })
            .toLowerCase();
        case 'aaaaa':
          return n.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'aaaa':
        default:
          return n.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    b: function (e, t, n) {
      const r = e.getHours();
      let o;
      switch (
        (r === 12
          ? (o = ao.noon)
          : r === 0
            ? (o = ao.midnight)
            : (o = r / 12 >= 1 ? 'pm' : 'am'),
        t)
      ) {
        case 'b':
        case 'bb':
          return n.dayPeriod(o, {
            width: 'abbreviated',
            context: 'formatting',
          });
        case 'bbb':
          return n
            .dayPeriod(o, { width: 'abbreviated', context: 'formatting' })
            .toLowerCase();
        case 'bbbbb':
          return n.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'bbbb':
        default:
          return n.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    B: function (e, t, n) {
      const r = e.getHours();
      let o;
      switch (
        (r >= 17
          ? (o = ao.evening)
          : r >= 12
            ? (o = ao.afternoon)
            : r >= 4
              ? (o = ao.morning)
              : (o = ao.night),
        t)
      ) {
        case 'B':
        case 'BB':
        case 'BBB':
          return n.dayPeriod(o, {
            width: 'abbreviated',
            context: 'formatting',
          });
        case 'BBBBB':
          return n.dayPeriod(o, { width: 'narrow', context: 'formatting' });
        case 'BBBB':
        default:
          return n.dayPeriod(o, { width: 'wide', context: 'formatting' });
      }
    },
    h: function (e, t, n) {
      if (t === 'ho') {
        let r = e.getHours() % 12;
        return (r === 0 && (r = 12), n.ordinalNumber(r, { unit: 'hour' }));
      }
      return Ln.h(e, t);
    },
    H: function (e, t, n) {
      return t === 'Ho'
        ? n.ordinalNumber(e.getHours(), { unit: 'hour' })
        : Ln.H(e, t);
    },
    K: function (e, t, n) {
      const r = e.getHours() % 12;
      return t === 'Ko'
        ? n.ordinalNumber(r, { unit: 'hour' })
        : ae(r, t.length);
    },
    k: function (e, t, n) {
      let r = e.getHours();
      return (
        r === 0 && (r = 24),
        t === 'ko' ? n.ordinalNumber(r, { unit: 'hour' }) : ae(r, t.length)
      );
    },
    m: function (e, t, n) {
      return t === 'mo'
        ? n.ordinalNumber(e.getMinutes(), { unit: 'minute' })
        : Ln.m(e, t);
    },
    s: function (e, t, n) {
      return t === 'so'
        ? n.ordinalNumber(e.getSeconds(), { unit: 'second' })
        : Ln.s(e, t);
    },
    S: function (e, t) {
      return Ln.S(e, t);
    },
    X: function (e, t, n) {
      const r = e.getTimezoneOffset();
      if (r === 0) return 'Z';
      switch (t) {
        case 'X':
          return Jh(r);
        case 'XXXX':
        case 'XX':
          return Er(r);
        case 'XXXXX':
        case 'XXX':
        default:
          return Er(r, ':');
      }
    },
    x: function (e, t, n) {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'x':
          return Jh(r);
        case 'xxxx':
        case 'xx':
          return Er(r);
        case 'xxxxx':
        case 'xxx':
        default:
          return Er(r, ':');
      }
    },
    O: function (e, t, n) {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'O':
        case 'OO':
        case 'OOO':
          return 'GMT' + Zh(r, ':');
        case 'OOOO':
        default:
          return 'GMT' + Er(r, ':');
      }
    },
    z: function (e, t, n) {
      const r = e.getTimezoneOffset();
      switch (t) {
        case 'z':
        case 'zz':
        case 'zzz':
          return 'GMT' + Zh(r, ':');
        case 'zzzz':
        default:
          return 'GMT' + Er(r, ':');
      }
    },
    t: function (e, t, n) {
      const r = Math.trunc(e.getTime() / 1e3);
      return ae(r, t.length);
    },
    T: function (e, t, n) {
      const r = e.getTime();
      return ae(r, t.length);
    },
  };
function Zh(e, t = '') {
  const n = e > 0 ? '-' : '+',
    r = Math.abs(e),
    o = Math.trunc(r / 60),
    s = r % 60;
  return s === 0 ? n + String(o) : n + String(o) + t + ae(s, 2);
}
function Jh(e, t) {
  return e % 60 === 0
    ? (e > 0 ? '-' : '+') + ae(Math.abs(e) / 60, 2)
    : Er(e, t);
}
function Er(e, t = '') {
  const n = e > 0 ? '-' : '+',
    r = Math.abs(e),
    o = ae(Math.trunc(r / 60), 2),
    s = ae(r % 60, 2);
  return n + o + t + s;
}
const eg = (e, t) => {
    switch (e) {
      case 'P':
        return t.date({ width: 'short' });
      case 'PP':
        return t.date({ width: 'medium' });
      case 'PPP':
        return t.date({ width: 'long' });
      case 'PPPP':
      default:
        return t.date({ width: 'full' });
    }
  },
  xw = (e, t) => {
    switch (e) {
      case 'p':
        return t.time({ width: 'short' });
      case 'pp':
        return t.time({ width: 'medium' });
      case 'ppp':
        return t.time({ width: 'long' });
      case 'pppp':
      default:
        return t.time({ width: 'full' });
    }
  },
  u5 = (e, t) => {
    const n = e.match(/(P+)(p+)?/) || [],
      r = n[1],
      o = n[2];
    if (!o) return eg(e, t);
    let s;
    switch (r) {
      case 'P':
        s = t.dateTime({ width: 'short' });
        break;
      case 'PP':
        s = t.dateTime({ width: 'medium' });
        break;
      case 'PPP':
        s = t.dateTime({ width: 'long' });
        break;
      case 'PPPP':
      default:
        s = t.dateTime({ width: 'full' });
        break;
    }
    return s.replace('{{date}}', eg(r, t)).replace('{{time}}', xw(o, t));
  },
  d5 = { p: xw, P: u5 },
  f5 = /^D+$/,
  m5 = /^Y+$/,
  p5 = ['D', 'DD', 'YY', 'YYYY'];
function h5(e) {
  return f5.test(e);
}
function g5(e) {
  return m5.test(e);
}
function v5(e, t, n) {
  const r = x5(e, t, n);
  if ((console.warn(r), p5.includes(e))) throw new RangeError(r);
}
function x5(e, t, n) {
  const r = e[0] === 'Y' ? 'years' : 'days of the month';
  return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
const y5 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  w5 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  b5 = /^'([^]*?)'?$/,
  N5 = /''/g,
  j5 = /[a-zA-Z]/;
function Yt(e, t, n) {
  var f, m, p, h, b, v, w, x;
  const r = ic(),
    o = (n == null ? void 0 : n.locale) ?? r.locale ?? s5,
    s =
      (n == null ? void 0 : n.firstWeekContainsDate) ??
      ((m = (f = n == null ? void 0 : n.locale) == null ? void 0 : f.options) ==
      null
        ? void 0
        : m.firstWeekContainsDate) ??
      r.firstWeekContainsDate ??
      ((h = (p = r.locale) == null ? void 0 : p.options) == null
        ? void 0
        : h.firstWeekContainsDate) ??
      1,
    i =
      (n == null ? void 0 : n.weekStartsOn) ??
      ((v = (b = n == null ? void 0 : n.locale) == null ? void 0 : b.options) ==
      null
        ? void 0
        : v.weekStartsOn) ??
      r.weekStartsOn ??
      ((x = (w = r.locale) == null ? void 0 : w.options) == null
        ? void 0
        : x.weekStartsOn) ??
      0,
    l = pe(e);
  if (!bD(l)) throw new RangeError('Invalid time value');
  let c = t
    .match(w5)
    .map((g) => {
      const y = g[0];
      if (y === 'p' || y === 'P') {
        const N = d5[y];
        return N(g, o.formatLong);
      }
      return g;
    })
    .join('')
    .match(y5)
    .map((g) => {
      if (g === "''") return { isToken: !1, value: "'" };
      const y = g[0];
      if (y === "'") return { isToken: !1, value: C5(g) };
      if (Xh[y]) return { isToken: !0, value: g };
      if (y.match(j5))
        throw new RangeError(
          'Format string contains an unescaped latin alphabet character `' +
            y +
            '`'
        );
      return { isToken: !1, value: g };
    });
  o.localize.preprocessor && (c = o.localize.preprocessor(l, c));
  const u = { firstWeekContainsDate: s, weekStartsOn: i, locale: o };
  return c
    .map((g) => {
      if (!g.isToken) return g.value;
      const y = g.value;
      ((!(n != null && n.useAdditionalWeekYearTokens) && g5(y)) ||
        (!(n != null && n.useAdditionalDayOfYearTokens) && h5(y))) &&
        v5(y, t, String(e));
      const N = Xh[y[0]];
      return N(l, y, o.localize, u);
    })
    .join('');
}
function C5(e) {
  const t = e.match(b5);
  return t ? t[1].replace(N5, "'") : e;
}
function Fn(e, t) {
  const r = P5(e);
  let o;
  if (r.date) {
    const c = T5(r.date, 2);
    o = R5(c.restDateString, c.year);
  }
  if (!o || isNaN(o.getTime())) return new Date(NaN);
  const s = o.getTime();
  let i = 0,
    l;
  if (r.time && ((i = D5(r.time)), isNaN(i))) return new Date(NaN);
  if (r.timezone) {
    if (((l = M5(r.timezone)), isNaN(l))) return new Date(NaN);
  } else {
    const c = new Date(s + i),
      u = new Date(0);
    return (
      u.setFullYear(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate()),
      u.setHours(
        c.getUTCHours(),
        c.getUTCMinutes(),
        c.getUTCSeconds(),
        c.getUTCMilliseconds()
      ),
      u
    );
  }
  return new Date(s + i + l);
}
const ii = {
    dateTimeDelimiter: /[T ]/,
    timeZoneDelimiter: /[Z ]/i,
    timezone: /([Z+-].*)$/,
  },
  S5 = /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/,
  E5 =
    /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/,
  k5 = /^([+-])(\d{2})(?::?(\d{2}))?$/;
function P5(e) {
  const t = {},
    n = e.split(ii.dateTimeDelimiter);
  let r;
  if (n.length > 2) return t;
  if (
    (/:/.test(n[0])
      ? (r = n[0])
      : ((t.date = n[0]),
        (r = n[1]),
        ii.timeZoneDelimiter.test(t.date) &&
          ((t.date = e.split(ii.timeZoneDelimiter)[0]),
          (r = e.substr(t.date.length, e.length)))),
    r)
  ) {
    const o = ii.timezone.exec(r);
    o ? ((t.time = r.replace(o[1], '')), (t.timezone = o[1])) : (t.time = r);
  }
  return t;
}
function T5(e, t) {
  const n = new RegExp(
      '^(?:(\\d{4}|[+-]\\d{' +
        (4 + t) +
        '})|(\\d{2}|[+-]\\d{' +
        (2 + t) +
        '})$)'
    ),
    r = e.match(n);
  if (!r) return { year: NaN, restDateString: '' };
  const o = r[1] ? parseInt(r[1]) : null,
    s = r[2] ? parseInt(r[2]) : null;
  return {
    year: s === null ? o : s * 100,
    restDateString: e.slice((r[1] || r[2]).length),
  };
}
function R5(e, t) {
  if (t === null) return new Date(NaN);
  const n = e.match(S5);
  if (!n) return new Date(NaN);
  const r = !!n[4],
    o = Cs(n[1]),
    s = Cs(n[2]) - 1,
    i = Cs(n[3]),
    l = Cs(n[4]),
    c = Cs(n[5]) - 1;
  if (r) return L5(t, l, c) ? A5(t, l, c) : new Date(NaN);
  {
    const u = new Date(0);
    return !_5(t, s, i) || !I5(t, o)
      ? new Date(NaN)
      : (u.setUTCFullYear(t, s, Math.max(o, i)), u);
  }
}
function Cs(e) {
  return e ? parseInt(e) : 1;
}
function D5(e) {
  const t = e.match(E5);
  if (!t) return NaN;
  const n = lu(t[1]),
    r = lu(t[2]),
    o = lu(t[3]);
  return F5(n, r, o) ? n * mw + r * fw + o * 1e3 : NaN;
}
function lu(e) {
  return (e && parseFloat(e.replace(',', '.'))) || 0;
}
function M5(e) {
  if (e === 'Z') return 0;
  const t = e.match(k5);
  if (!t) return 0;
  const n = t[1] === '+' ? -1 : 1,
    r = parseInt(t[2]),
    o = (t[3] && parseInt(t[3])) || 0;
  return $5(r, o) ? n * (r * mw + o * fw) : NaN;
}
function A5(e, t, n) {
  const r = new Date(0);
  r.setUTCFullYear(e, 0, 4);
  const o = r.getUTCDay() || 7,
    s = (t - 1) * 7 + n + 1 - o;
  return (r.setUTCDate(r.getUTCDate() + s), r);
}
const O5 = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function yw(e) {
  return e % 400 === 0 || (e % 4 === 0 && e % 100 !== 0);
}
function _5(e, t, n) {
  return t >= 0 && t <= 11 && n >= 1 && n <= (O5[t] || (yw(e) ? 29 : 28));
}
function I5(e, t) {
  return t >= 1 && t <= (yw(e) ? 366 : 365);
}
function L5(e, t, n) {
  return t >= 1 && t <= 53 && n >= 0 && n <= 6;
}
function F5(e, t, n) {
  return e === 24
    ? t === 0 && n === 0
    : n >= 0 && n < 60 && t >= 0 && t < 60 && e >= 0 && e < 25;
}
function $5(e, t) {
  return t >= 0 && t <= 59;
}
const z5 = {
    lessThanXSeconds: {
      one: 'menos de un segundo',
      other: 'menos de {{count}} segundos',
    },
    xSeconds: { one: '1 segundo', other: '{{count}} segundos' },
    halfAMinute: 'medio minuto',
    lessThanXMinutes: {
      one: 'menos de un minuto',
      other: 'menos de {{count}} minutos',
    },
    xMinutes: { one: '1 minuto', other: '{{count}} minutos' },
    aboutXHours: {
      one: 'alrededor de 1 hora',
      other: 'alrededor de {{count}} horas',
    },
    xHours: { one: '1 hora', other: '{{count}} horas' },
    xDays: { one: '1 día', other: '{{count}} días' },
    aboutXWeeks: {
      one: 'alrededor de 1 semana',
      other: 'alrededor de {{count}} semanas',
    },
    xWeeks: { one: '1 semana', other: '{{count}} semanas' },
    aboutXMonths: {
      one: 'alrededor de 1 mes',
      other: 'alrededor de {{count}} meses',
    },
    xMonths: { one: '1 mes', other: '{{count}} meses' },
    aboutXYears: {
      one: 'alrededor de 1 año',
      other: 'alrededor de {{count}} años',
    },
    xYears: { one: '1 año', other: '{{count}} años' },
    overXYears: { one: 'más de 1 año', other: 'más de {{count}} años' },
    almostXYears: { one: 'casi 1 año', other: 'casi {{count}} años' },
  },
  W5 = (e, t, n) => {
    let r;
    const o = z5[e];
    return (
      typeof o == 'string'
        ? (r = o)
        : t === 1
          ? (r = o.one)
          : (r = o.other.replace('{{count}}', t.toString())),
      n != null && n.addSuffix
        ? n.comparison && n.comparison > 0
          ? 'en ' + r
          : 'hace ' + r
        : r
    );
  },
  U5 = {
    full: "EEEE, d 'de' MMMM 'de' y",
    long: "d 'de' MMMM 'de' y",
    medium: 'd MMM y',
    short: 'dd/MM/y',
  },
  B5 = {
    full: 'HH:mm:ss zzzz',
    long: 'HH:mm:ss z',
    medium: 'HH:mm:ss',
    short: 'HH:mm',
  },
  H5 = {
    full: "{{date}} 'a las' {{time}}",
    long: "{{date}} 'a las' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  V5 = {
    date: Io({ formats: U5, defaultWidth: 'full' }),
    time: Io({ formats: B5, defaultWidth: 'full' }),
    dateTime: Io({ formats: H5, defaultWidth: 'full' }),
  },
  Y5 = {
    lastWeek: "'el' eeee 'pasado a la' p",
    yesterday: "'ayer a la' p",
    today: "'hoy a la' p",
    tomorrow: "'mañana a la' p",
    nextWeek: "eeee 'a la' p",
    other: 'P',
  },
  G5 = {
    lastWeek: "'el' eeee 'pasado a las' p",
    yesterday: "'ayer a las' p",
    today: "'hoy a las' p",
    tomorrow: "'mañana a las' p",
    nextWeek: "eeee 'a las' p",
    other: 'P',
  },
  K5 = (e, t, n, r) => (t.getHours() !== 1 ? G5[e] : Y5[e]),
  Q5 = {
    narrow: ['AC', 'DC'],
    abbreviated: ['AC', 'DC'],
    wide: ['antes de cristo', 'después de cristo'],
  },
  q5 = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['T1', 'T2', 'T3', 'T4'],
    wide: ['1º trimestre', '2º trimestre', '3º trimestre', '4º trimestre'],
  },
  X5 = {
    narrow: ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
    abbreviated: [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ],
    wide: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
  },
  Z5 = {
    narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
    short: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'],
    abbreviated: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    wide: [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ],
  },
  J5 = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mn',
      noon: 'md',
      morning: 'mañana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'mañana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'mañana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
  },
  eM = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mn',
      noon: 'md',
      morning: 'de la mañana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'de la mañana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'de la mañana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
  },
  tM = (e, t) => Number(e) + 'º',
  nM = {
    ordinalNumber: tM,
    era: en({ values: Q5, defaultWidth: 'wide' }),
    quarter: en({
      values: q5,
      defaultWidth: 'wide',
      argumentCallback: (e) => Number(e) - 1,
    }),
    month: en({ values: X5, defaultWidth: 'wide' }),
    day: en({ values: Z5, defaultWidth: 'wide' }),
    dayPeriod: en({
      values: J5,
      defaultWidth: 'wide',
      formattingValues: eM,
      defaultFormattingWidth: 'wide',
    }),
  },
  rM = /^(\d+)(º)?/i,
  oM = /\d+/i,
  sM = {
    narrow: /^(ac|dc|a|d)/i,
    abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
    wide: /^(antes de cristo|antes de la era com[uú]n|despu[eé]s de cristo|era com[uú]n)/i,
  },
  aM = {
    any: [/^ac/i, /^dc/i],
    wide: [
      /^(antes de cristo|antes de la era com[uú]n)/i,
      /^(despu[eé]s de cristo|era com[uú]n)/i,
    ],
  },
  iM = {
    narrow: /^[1234]/i,
    abbreviated: /^T[1234]/i,
    wide: /^[1234](º)? trimestre/i,
  },
  lM = { any: [/1/i, /2/i, /3/i, /4/i] },
  cM = {
    narrow: /^[efmajsond]/i,
    abbreviated: /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
    wide: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  },
  uM = {
    narrow: [
      /^e/i,
      /^f/i,
      /^m/i,
      /^a/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
    any: [
      /^en/i,
      /^feb/i,
      /^mar/i,
      /^abr/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^ago/i,
      /^sep/i,
      /^oct/i,
      /^nov/i,
      /^dic/i,
    ],
  },
  dM = {
    narrow: /^[dlmjvs]/i,
    short: /^(do|lu|ma|mi|ju|vi|s[áa])/i,
    abbreviated: /^(dom|lun|mar|mi[ée]|jue|vie|s[áa]b)/i,
    wide: /^(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)/i,
  },
  fM = {
    narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
    any: [/^do/i, /^lu/i, /^ma/i, /^mi/i, /^ju/i, /^vi/i, /^sa/i],
  },
  mM = {
    narrow: /^(a|p|mn|md|(de la|a las) (mañana|tarde|noche))/i,
    any: /^([ap]\.?\s?m\.?|medianoche|mediodia|(de la|a las) (mañana|tarde|noche))/i,
  },
  pM = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mn/i,
      noon: /^md/i,
      morning: /mañana/i,
      afternoon: /tarde/i,
      evening: /tarde/i,
      night: /noche/i,
    },
  },
  hM = {
    ordinalNumber: gw({
      matchPattern: rM,
      parsePattern: oM,
      valueCallback: function (e) {
        return parseInt(e, 10);
      },
    }),
    era: tn({
      matchPatterns: sM,
      defaultMatchWidth: 'wide',
      parsePatterns: aM,
      defaultParseWidth: 'any',
    }),
    quarter: tn({
      matchPatterns: iM,
      defaultMatchWidth: 'wide',
      parsePatterns: lM,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: tn({
      matchPatterns: cM,
      defaultMatchWidth: 'wide',
      parsePatterns: uM,
      defaultParseWidth: 'any',
    }),
    day: tn({
      matchPatterns: dM,
      defaultMatchWidth: 'wide',
      parsePatterns: fM,
      defaultParseWidth: 'any',
    }),
    dayPeriod: tn({
      matchPatterns: mM,
      defaultMatchWidth: 'any',
      parsePatterns: pM,
      defaultParseWidth: 'any',
    }),
  },
  Gt = {
    code: 'es',
    formatDistance: W5,
    formatLong: V5,
    formatRelative: K5,
    localize: nM,
    match: hM,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  gM = [
    {
      id: '1',
      title: 'Introducción al curso y objetivos',
      duration: '12:34',
      recordedDate: new Date('2024-10-15'),
      isCompleted: !0,
      isLocked: !1,
    },
    {
      id: '2',
      title: 'Configuración del entorno de desarrollo',
      duration: '18:22',
      recordedDate: new Date('2024-10-18'),
      isCompleted: !0,
      isLocked: !1,
    },
    {
      id: '3',
      title: 'Fundamentos de la sintaxis básica',
      duration: '24:15',
      recordedDate: new Date('2024-10-22'),
      isCompleted: !0,
      isLocked: !1,
    },
    {
      id: '4',
      title: 'Estructuras de datos esenciales',
      duration: '32:40',
      recordedDate: new Date('2024-10-25'),
      isCompleted: !1,
      isLocked: !1,
    },
    {
      id: '5',
      title: 'Funciones y modularización',
      duration: '28:18',
      recordedDate: new Date('2024-10-29'),
      isCompleted: !1,
      isLocked: !1,
    },
    {
      id: '6',
      title: 'Manejo de errores y debugging',
      duration: '21:55',
      recordedDate: new Date('2024-11-01'),
      isCompleted: !1,
      isLocked: !1,
    },
    {
      id: '7',
      title: 'Proyecto práctico: Parte 1',
      duration: '45:12',
      recordedDate: new Date('2024-11-05'),
      isCompleted: !1,
      isLocked: !0,
    },
    {
      id: '8',
      title: 'Proyecto práctico: Parte 2',
      duration: '38:30',
      recordedDate: new Date('2024-11-08'),
      isCompleted: !1,
      isLocked: !0,
    },
  ],
  vM = ({ classes: e = gM }) => {
    const t = e.filter((n) => n.isCompleted).length;
    return a.jsxs('div', {
      className: 'space-y-4',
      children: [
        a.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            a.jsx('h3', {
              className: 'text-lg font-semibold text-foreground',
              children: 'Clases grabadas',
            }),
            a.jsxs('span', {
              className: 'text-sm text-muted-foreground',
              children: [t, '/', e.length, ' completadas'],
            }),
          ],
        }),
        a.jsx('div', {
          className: 'space-y-2',
          children: e.map((n, r) =>
            a.jsxs(
              'div',
              {
                className: L(
                  'group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
                  n.isLocked
                    ? 'bg-muted/20 border-border/30 opacity-60'
                    : 'bg-card/50 border-border/50 hover:bg-card hover:border-border cursor-pointer'
                ),
                children: [
                  a.jsx('div', {
                    className: L(
                      'relative w-16 h-10 rounded-lg flex items-center justify-center shrink-0',
                      n.isCompleted ? 'bg-accent/20' : 'bg-muted/50'
                    ),
                    children: n.isLocked
                      ? a.jsx(gx, {
                          className: 'w-4 h-4 text-muted-foreground',
                        })
                      : a.jsx(aa, {
                          className: L(
                            'w-4 h-4 transition-transform group-hover:scale-110',
                            n.isCompleted ? 'text-accent' : 'text-foreground'
                          ),
                        }),
                  }),
                  a.jsx('div', {
                    className: 'flex-1 min-w-0',
                    children: a.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        a.jsx('span', {
                          className:
                            'text-xs text-muted-foreground font-medium',
                          children: String(r + 1).padStart(2, '0'),
                        }),
                        a.jsx('h4', {
                          className: L(
                            'text-sm font-medium truncate',
                            n.isLocked
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                          ),
                          children: n.title,
                        }),
                      ],
                    }),
                  }),
                  a.jsxs('div', {
                    className: 'flex items-center gap-4 shrink-0',
                    children: [
                      a.jsxs('div', {
                        className:
                          'flex items-center gap-1 text-muted-foreground',
                        children: [
                          a.jsx(_t, { className: 'w-3.5 h-3.5' }),
                          a.jsx('span', {
                            className: 'text-xs',
                            children: Yt(n.recordedDate, 'd MMM yyyy', {
                              locale: Gt,
                            }),
                          }),
                        ],
                      }),
                      a.jsxs('div', {
                        className:
                          'flex items-center gap-1 text-muted-foreground',
                        children: [
                          a.jsx(Hr, { className: 'w-3.5 h-3.5' }),
                          a.jsx('span', {
                            className: 'text-xs',
                            children: n.duration,
                          }),
                        ],
                      }),
                      n.isCompleted &&
                        a.jsx(jo, { className: 'w-4 h-4 text-accent' }),
                    ],
                  }),
                ],
              },
              n.id
            )
          ),
        }),
      ],
    });
  },
  xM = (e) =>
    ({
      pdf: Co,
      image: hx,
      video: Ea,
      zip: aS,
      code: ld,
      presentation: yS,
      other: oh,
    })[e] || oh,
  yM = (e) =>
    ({
      pdf: 'text-red-400',
      image: 'text-emerald-400',
      video: 'text-purple-400',
      zip: 'text-amber-400',
      code: 'text-cyan-400',
      presentation: 'text-orange-400',
      other: 'text-muted-foreground',
    })[e] || 'text-muted-foreground',
  wM = [
    {
      id: '1',
      name: 'Guía de inicio rápido.pdf',
      type: 'pdf',
      size: '2.4 MB',
      classId: '1',
      className: 'Introducción al curso y objetivos',
      downloadUrl: '#',
    },
    {
      id: '2',
      name: 'Configuración del entorno.pdf',
      type: 'pdf',
      size: '1.8 MB',
      classId: '2',
      className: 'Configuración del entorno de desarrollo',
      downloadUrl: '#',
    },
    {
      id: '3',
      name: 'Diagramas de arquitectura.png',
      type: 'image',
      size: '856 KB',
      classId: '2',
      className: 'Configuración del entorno de desarrollo',
      downloadUrl: '#',
    },
    {
      id: '4',
      name: 'Código fuente - Módulo 1.zip',
      type: 'zip',
      size: '4.2 MB',
      classId: '3',
      className: 'Fundamentos de la sintaxis básica',
      downloadUrl: '#',
    },
    {
      id: '5',
      name: 'Ejemplos de sintaxis.js',
      type: 'code',
      size: '12 KB',
      classId: '3',
      className: 'Fundamentos de la sintaxis básica',
      downloadUrl: '#',
    },
    {
      id: '6',
      name: 'Estructuras de datos - Presentación.pptx',
      type: 'presentation',
      size: '5.1 MB',
      classId: '4',
      className: 'Estructuras de datos esenciales',
      downloadUrl: '#',
    },
    {
      id: '7',
      name: 'Cheatsheet funciones.pdf',
      type: 'pdf',
      size: '340 KB',
      classId: '5',
      className: 'Funciones y modularización',
      downloadUrl: '#',
    },
    {
      id: '8',
      name: 'Video complementario.mp4',
      type: 'video',
      size: '128 MB',
      classId: '6',
      className: 'Manejo de errores y debugging',
      downloadUrl: '#',
    },
  ],
  bM = ({ resources: e = wM }) => {
    const t = e.reduce(
        (o, s) => (
          o[s.classId] ||
            (o[s.classId] = { className: s.className, resources: [] }),
          o[s.classId].resources.push(s),
          o
        ),
        {}
      ),
      n = e.length,
      r = e.reduce((o, s) => {
        const i = parseFloat(s.size),
          l = s.size.replace(/[\d.]/g, '').trim().toUpperCase();
        return l === 'MB'
          ? o + i
          : l === 'KB'
            ? o + i / 1024
            : l === 'GB'
              ? o + i * 1024
              : o;
      }, 0);
    return a.jsxs('div', {
      className: 'space-y-6',
      children: [
        a.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            a.jsxs('div', {
              children: [
                a.jsx('h3', {
                  className: 'text-xl font-semibold text-foreground',
                  children: 'Recursos del curso',
                }),
                a.jsxs('p', {
                  className: 'text-sm text-muted-foreground mt-1',
                  children: [n, ' archivos · ', r.toFixed(1), ' MB en total'],
                }),
              ],
            }),
            a.jsxs(ne, {
              variant: 'outline',
              size: 'sm',
              className: 'gap-2',
              children: [a.jsx(rh, { className: 'w-4 h-4' }), 'Descargar todo'],
            }),
          ],
        }),
        a.jsx('div', {
          className: 'space-y-6',
          children: Object.entries(t).map(
            ([o, { className: s, resources: i }]) =>
              a.jsxs(
                'div',
                {
                  className: 'space-y-3',
                  children: [
                    a.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        a.jsx('div', {
                          className:
                            'w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center',
                          children: a.jsx('span', {
                            className: 'text-xs font-medium text-accent',
                            children: o,
                          }),
                        }),
                        a.jsx('h4', {
                          className: 'text-sm font-medium text-foreground',
                          children: s,
                        }),
                      ],
                    }),
                    a.jsx('div', {
                      className: 'grid gap-2 pl-8',
                      children: i.map((l) => {
                        const c = xM(l.type),
                          u = yM(l.type);
                        return a.jsxs(
                          'div',
                          {
                            className: L(
                              'group flex items-center justify-between p-3 rounded-xl',
                              'bg-card/50 border border-border/50',
                              'hover:bg-card hover:border-border transition-all duration-200'
                            ),
                            children: [
                              a.jsxs('div', {
                                className: 'flex items-center gap-3 min-w-0',
                                children: [
                                  a.jsx('div', {
                                    className: L(
                                      'p-2 rounded-lg bg-background/50',
                                      u
                                    ),
                                    children: a.jsx(c, {
                                      className: 'w-4 h-4',
                                    }),
                                  }),
                                  a.jsxs('div', {
                                    className: 'min-w-0',
                                    children: [
                                      a.jsx('p', {
                                        className:
                                          'text-sm font-medium text-foreground truncate',
                                        children: l.name,
                                      }),
                                      a.jsx('p', {
                                        className:
                                          'text-xs text-muted-foreground',
                                        children: l.size,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              a.jsx(ne, {
                                variant: 'ghost',
                                size: 'sm',
                                className:
                                  'opacity-0 group-hover:opacity-100 transition-opacity',
                                children: a.jsx(rh, { className: 'w-4 h-4' }),
                              }),
                            ],
                          },
                          l.id
                        );
                      }),
                    }),
                  ],
                },
                o
              )
          ),
        }),
      ],
    });
  },
  NM = Wl(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
      variants: {
        variant: {
          default:
            'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
          secondary:
            'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
          destructive:
            'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
          outline: 'text-foreground',
        },
      },
      defaultVariants: { variant: 'default' },
    }
  );
function Xt({ className: e, variant: t, ...n }) {
  return a.jsx('div', { className: L(NM({ variant: t }), e), ...n });
}
const jM = (e) => ({ quiz: ux, document: px, project: $f })[e],
  li = (e) =>
    ({
      quiz: 'text-purple-400 bg-purple-400/10',
      document: 'text-blue-400 bg-blue-400/10',
      project: 'text-emerald-400 bg-emerald-400/10',
    })[e],
  CM = (e) =>
    ({
      quiz: 'Cuestionario',
      document: 'Entrega de documento',
      project: 'Avance de proyecto',
    })[e],
  SM = (e, t, n) =>
    e === 'completed'
      ? a.jsxs(Xt, {
          variant: 'outline',
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          children: [
            a.jsx(jo, { className: 'w-3 h-3 mr-1' }),
            t !== void 0 && n !== void 0 ? `${t}/${n}` : 'Completado',
          ],
        })
      : e === 'locked'
        ? a.jsxs(Xt, {
            variant: 'outline',
            className: 'bg-muted/50 text-muted-foreground border-border',
            children: [a.jsx(gx, { className: 'w-3 h-3 mr-1' }), 'Bloqueado'],
          })
        : a.jsxs(Xt, {
            variant: 'outline',
            className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            children: [a.jsx(fx, { className: 'w-3 h-3 mr-1' }), 'Pendiente'],
          }),
  EM = [
    {
      id: '1',
      title: 'Quiz: Conceptos básicos del curso',
      type: 'quiz',
      classId: '1',
      className: 'Introducción al curso y objetivos',
      status: 'completed',
      score: 9,
      maxScore: 10,
    },
    {
      id: '2',
      title: 'Entrega: Captura de tu entorno configurado',
      type: 'document',
      classId: '2',
      className: 'Configuración del entorno de desarrollo',
      status: 'completed',
    },
    {
      id: '3',
      title: 'Quiz: Sintaxis y estructuras',
      type: 'quiz',
      classId: '3',
      className: 'Fundamentos de la sintaxis básica',
      status: 'completed',
      score: 8,
      maxScore: 10,
    },
    {
      id: '4',
      title: 'Avance: Estructura inicial del proyecto',
      type: 'project',
      classId: '3',
      className: 'Fundamentos de la sintaxis básica',
      status: 'completed',
    },
    {
      id: '5',
      title: 'Quiz: Estructuras de datos',
      type: 'quiz',
      classId: '4',
      className: 'Estructuras de datos esenciales',
      status: 'pending',
      dueDate: '15 Dic 2024',
    },
    {
      id: '6',
      title: 'Entrega: Diagrama de tu modelo de datos',
      type: 'document',
      classId: '4',
      className: 'Estructuras de datos esenciales',
      status: 'pending',
      dueDate: '18 Dic 2024',
    },
    {
      id: '7',
      title: 'Avance: Implementación de funciones principales',
      type: 'project',
      classId: '5',
      className: 'Funciones y modularización',
      status: 'pending',
      dueDate: '22 Dic 2024',
    },
    {
      id: '8',
      title: 'Quiz: Manejo de errores',
      type: 'quiz',
      classId: '6',
      className: 'Manejo de errores y debugging',
      status: 'locked',
    },
    {
      id: '9',
      title: 'Avance: MVP funcional del proyecto',
      type: 'project',
      classId: '7',
      className: 'Proyecto práctico: Parte 1',
      status: 'locked',
    },
    {
      id: '10',
      title: 'Entrega final: Proyecto completo',
      type: 'project',
      classId: '8',
      className: 'Proyecto práctico: Parte 2',
      status: 'locked',
    },
  ],
  kM = ({ activities: e = EM }) => {
    const t = e.reduce(
        (o, s) => (
          o[s.classId] ||
            (o[s.classId] = { className: s.className, activities: [] }),
          o[s.classId].activities.push(s),
          o
        ),
        {}
      ),
      n = e.filter((o) => o.status === 'completed').length,
      r = e.filter((o) => o.status === 'pending').length;
    return a.jsxs('div', {
      className: 'space-y-6',
      children: [
        a.jsxs('div', {
          children: [
            a.jsx('h3', {
              className: 'text-xl font-semibold text-foreground',
              children: 'Actividades del curso',
            }),
            a.jsxs('p', {
              className: 'text-sm text-muted-foreground mt-1',
              children: [
                n,
                ' completadas · ',
                r,
                ' pendientes · ',
                e.length,
                ' en total',
              ],
            }),
          ],
        }),
        a.jsxs('div', {
          className: 'flex flex-wrap gap-4 text-xs',
          children: [
            a.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a.jsx('div', {
                  className: L('p-1.5 rounded-lg', li('quiz')),
                  children: a.jsx(ux, { className: 'w-3.5 h-3.5' }),
                }),
                a.jsx('span', {
                  className: 'text-muted-foreground',
                  children: 'Cuestionario',
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a.jsx('div', {
                  className: L('p-1.5 rounded-lg', li('document')),
                  children: a.jsx(px, { className: 'w-3.5 h-3.5' }),
                }),
                a.jsx('span', {
                  className: 'text-muted-foreground',
                  children: 'Entrega de documento',
                }),
              ],
            }),
            a.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                a.jsx('div', {
                  className: L('p-1.5 rounded-lg', li('project')),
                  children: a.jsx($f, { className: 'w-3.5 h-3.5' }),
                }),
                a.jsx('span', {
                  className: 'text-muted-foreground',
                  children: 'Avance de proyecto',
                }),
              ],
            }),
          ],
        }),
        a.jsx('div', {
          className: 'space-y-6',
          children: Object.entries(t).map(
            ([o, { className: s, activities: i }]) =>
              a.jsxs(
                'div',
                {
                  className: 'space-y-3',
                  children: [
                    a.jsxs('div', {
                      className: 'flex items-center gap-2',
                      children: [
                        a.jsx('div', {
                          className:
                            'w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center',
                          children: a.jsx('span', {
                            className: 'text-xs font-medium text-accent',
                            children: o,
                          }),
                        }),
                        a.jsx('h4', {
                          className: 'text-sm font-medium text-foreground',
                          children: s,
                        }),
                      ],
                    }),
                    a.jsx('div', {
                      className: 'grid gap-2 pl-8',
                      children: i.map((l) => {
                        const c = jM(l.type),
                          u = li(l.type);
                        return a.jsxs(
                          'div',
                          {
                            className: L(
                              'group flex items-center justify-between p-3 rounded-xl',
                              'bg-card/50 border border-border/50',
                              l.status === 'locked'
                                ? 'opacity-60'
                                : 'hover:bg-card hover:border-border',
                              'transition-all duration-200'
                            ),
                            children: [
                              a.jsxs('div', {
                                className: 'flex items-center gap-3 min-w-0',
                                children: [
                                  a.jsx('div', {
                                    className: L('p-2 rounded-lg', u),
                                    children: a.jsx(c, {
                                      className: 'w-4 h-4',
                                    }),
                                  }),
                                  a.jsxs('div', {
                                    className: 'min-w-0',
                                    children: [
                                      a.jsx('p', {
                                        className:
                                          'text-sm font-medium text-foreground truncate',
                                        children: l.title,
                                      }),
                                      a.jsxs('div', {
                                        className:
                                          'flex items-center gap-2 text-xs text-muted-foreground',
                                        children: [
                                          a.jsx('span', {
                                            children: CM(l.type),
                                          }),
                                          l.dueDate &&
                                            a.jsxs(a.Fragment, {
                                              children: [
                                                a.jsx('span', {
                                                  children: '·',
                                                }),
                                                a.jsxs('span', {
                                                  children: [
                                                    'Fecha límite: ',
                                                    l.dueDate,
                                                  ],
                                                }),
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              a.jsx('div', {
                                className: 'shrink-0 ml-3',
                                children: SM(l.status, l.score, l.maxScore),
                              }),
                            ],
                          },
                          l.id
                        );
                      }),
                    }),
                  ],
                },
                o
              )
          ),
        }),
      ],
    });
  },
  ml = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx('textarea', {
      className: L(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        e
      ),
      ref: n,
      ...t,
    })
  );
ml.displayName = 'Textarea';
var ww = { exports: {} },
  bw = {};
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ns = d;
function PM(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var TM = typeof Object.is == 'function' ? Object.is : PM,
  RM = ns.useState,
  DM = ns.useEffect,
  MM = ns.useLayoutEffect,
  AM = ns.useDebugValue;
function OM(e, t) {
  var n = t(),
    r = RM({ inst: { value: n, getSnapshot: t } }),
    o = r[0].inst,
    s = r[1];
  return (
    MM(
      function () {
        ((o.value = n), (o.getSnapshot = t), cu(o) && s({ inst: o }));
      },
      [e, n, t]
    ),
    DM(
      function () {
        return (
          cu(o) && s({ inst: o }),
          e(function () {
            cu(o) && s({ inst: o });
          })
        );
      },
      [e]
    ),
    AM(n),
    n
  );
}
function cu(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !TM(e, n);
  } catch {
    return !0;
  }
}
function _M(e, t) {
  return t();
}
var IM =
  typeof window > 'u' ||
  typeof window.document > 'u' ||
  typeof window.document.createElement > 'u'
    ? _M
    : OM;
bw.useSyncExternalStore =
  ns.useSyncExternalStore !== void 0 ? ns.useSyncExternalStore : IM;
ww.exports = bw;
var LM = ww.exports;
function FM() {
  return LM.useSyncExternalStore(
    $M,
    () => !0,
    () => !1
  );
}
function $M() {
  return () => {};
}
var ym = 'Avatar',
  [zM, lO] = Ue(ym),
  [WM, Nw] = zM(ym),
  jw = d.forwardRef((e, t) => {
    const { __scopeAvatar: n, ...r } = e,
      [o, s] = d.useState('idle');
    return a.jsx(WM, {
      scope: n,
      imageLoadingStatus: o,
      onImageLoadingStatusChange: s,
      children: a.jsx(K.span, { ...r, ref: t }),
    });
  });
jw.displayName = ym;
var Cw = 'AvatarImage',
  Sw = d.forwardRef((e, t) => {
    const {
        __scopeAvatar: n,
        src: r,
        onLoadingStatusChange: o = () => {},
        ...s
      } = e,
      i = Nw(Cw, n),
      l = UM(r, s),
      c = Oe((u) => {
        (o(u), i.onImageLoadingStatusChange(u));
      });
    return (
      _e(() => {
        l !== 'idle' && c(l);
      }, [l, c]),
      l === 'loaded' ? a.jsx(K.img, { ...s, ref: t, src: r }) : null
    );
  });
Sw.displayName = Cw;
var Ew = 'AvatarFallback',
  kw = d.forwardRef((e, t) => {
    const { __scopeAvatar: n, delayMs: r, ...o } = e,
      s = Nw(Ew, n),
      [i, l] = d.useState(r === void 0);
    return (
      d.useEffect(() => {
        if (r !== void 0) {
          const c = window.setTimeout(() => l(!0), r);
          return () => window.clearTimeout(c);
        }
      }, [r]),
      i && s.imageLoadingStatus !== 'loaded'
        ? a.jsx(K.span, { ...o, ref: t })
        : null
    );
  });
kw.displayName = Ew;
function tg(e, t) {
  return e
    ? t
      ? (e.src !== t && (e.src = t),
        e.complete && e.naturalWidth > 0 ? 'loaded' : 'loading')
      : 'error'
    : 'idle';
}
function UM(e, { referrerPolicy: t, crossOrigin: n }) {
  const r = FM(),
    o = d.useRef(null),
    s = r ? (o.current || (o.current = new window.Image()), o.current) : null,
    [i, l] = d.useState(() => tg(s, e));
  return (
    _e(() => {
      l(tg(s, e));
    }, [s, e]),
    _e(() => {
      const c = (m) => () => {
        l(m);
      };
      if (!s) return;
      const u = c('loaded'),
        f = c('error');
      return (
        s.addEventListener('load', u),
        s.addEventListener('error', f),
        t && (s.referrerPolicy = t),
        typeof n == 'string' && (s.crossOrigin = n),
        () => {
          (s.removeEventListener('load', u), s.removeEventListener('error', f));
        }
      );
    }, [s, n, t]),
    i
  );
}
var Pw = jw,
  Tw = Sw,
  Rw = kw;
const Dw = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(Pw, {
    ref: n,
    className: L(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      e
    ),
    ...t,
  })
);
Dw.displayName = Pw.displayName;
const Mw = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(Tw, { ref: n, className: L('aspect-square h-full w-full', e), ...t })
);
Mw.displayName = Tw.displayName;
const Aw = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(Rw, {
    ref: n,
    className: L(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      e
    ),
    ...t,
  })
);
Aw.displayName = Rw.displayName;
const BM = [
    {
      id: '1',
      author: {
        id: 'edu1',
        name: 'Carlos Mendoza',
        avatar: '',
        isEducator: !0,
      },
      content: `¡Bienvenidos al foro del curso! 🎉

Este es el espacio para resolver dudas, compartir avances y conectar con tus compañeros. Recuerden ser respetuosos y constructivos en sus comentarios.

¿Qué les pareció la primera clase? ¿Tienen alguna duda sobre la configuración del entorno?`,
      createdAt: new Date('2024-10-15T10:00:00'),
      likes: 24,
      isLiked: !1,
      media: [],
      replies: [
        {
          id: '1-1',
          author: {
            id: 'stu1',
            name: 'María García',
            avatar: '',
            isEducator: !1,
          },
          content:
            '¡Excelente clase! Me encantó la explicación sobre arquitectura de componentes. Adjunto captura de mi setup funcionando 🚀',
          createdAt: new Date('2024-10-15T14:30:00'),
          likes: 8,
          isLiked: !0,
          media: [{ id: 'm1', type: 'image', url: '/placeholder.svg' }],
          replies: [
            {
              id: '1-1-1',
              author: {
                id: 'edu1',
                name: 'Carlos Mendoza',
                avatar: '',
                isEducator: !0,
              },
              content:
                '¡Perfecto María! Se ve muy bien tu configuración. Buen trabajo 👏',
              createdAt: new Date('2024-10-15T15:00:00'),
              likes: 3,
              isLiked: !1,
              media: [],
              replies: [],
            },
          ],
        },
        {
          id: '1-2',
          author: {
            id: 'stu2',
            name: 'Juan Pérez',
            avatar: '',
            isEducator: !1,
          },
          content:
            'Tengo una duda sobre la instalación de las dependencias. Me sale un error con npm install. Adjunto el video del problema.',
          createdAt: new Date('2024-10-15T16:00:00'),
          likes: 2,
          isLiked: !1,
          media: [
            {
              id: 'm2',
              type: 'video',
              url: '/placeholder.svg',
              thumbnail: '/placeholder.svg',
            },
          ],
          replies: [],
        },
      ],
    },
    {
      id: '2',
      author: {
        id: 'edu1',
        name: 'Carlos Mendoza',
        avatar: '',
        isEducator: !0,
      },
      content: `📢 Recordatorio: La próxima clase en vivo será el viernes a las 7PM. Preparen sus preguntas sobre hooks y estado.

Les dejo un audio con algunos tips para la práctica de esta semana:`,
      createdAt: new Date('2024-10-18T09:00:00'),
      likes: 15,
      isLiked: !1,
      media: [{ id: 'm3', type: 'audio', url: '/audio-sample.mp3' }],
      replies: [],
    },
  ],
  HM = ({ media: e }) => {
    const [t, n] = d.useState(!1);
    return e.type === 'image'
      ? a.jsx('div', {
          className: 'relative rounded-lg overflow-hidden max-w-sm',
          children: a.jsx('img', {
            src: e.url,
            alt: 'Adjunto',
            className: 'w-full h-auto',
          }),
        })
      : e.type === 'video'
        ? a.jsxs('div', {
            className:
              'relative rounded-lg overflow-hidden max-w-sm bg-black/50 aspect-video flex items-center justify-center',
            children: [
              a.jsx('img', {
                src: e.thumbnail || e.url,
                alt: 'Video',
                className:
                  'absolute inset-0 w-full h-full object-cover opacity-50',
              }),
              a.jsx(ne, {
                size: 'icon',
                variant: 'secondary',
                className: 'relative z-10 rounded-full',
                children: a.jsx(aa, { className: 'w-5 h-5' }),
              }),
            ],
          })
        : e.type === 'audio'
          ? a.jsxs('div', {
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 max-w-xs',
              children: [
                a.jsx(ne, {
                  size: 'icon',
                  variant: 'secondary',
                  className: 'rounded-full shrink-0',
                  onClick: () => n(!t),
                  children: t
                    ? a.jsx(xS, { className: 'w-4 h-4' })
                    : a.jsx(aa, { className: 'w-4 h-4' }),
                }),
                a.jsxs('div', {
                  className: 'flex-1',
                  children: [
                    a.jsx('div', {
                      className: 'h-1 bg-border rounded-full overflow-hidden',
                      children: a.jsx('div', {
                        className: 'h-full bg-accent w-1/3',
                      }),
                    }),
                    a.jsx('p', {
                      className: 'text-xs text-muted-foreground mt-1',
                      children: '0:45 / 2:30',
                    }),
                  ],
                }),
              ],
            })
          : null;
  },
  Ow = ({
    placeholder: e = 'Escribe un comentario...',
    onSubmit: t,
    isReply: n = !1,
  }) => {
    const [r, o] = d.useState(''),
      [s, i] = d.useState([]),
      l = () => {
        (r.trim() || s.length > 0) && (t == null || t(r, s), o(''), i([]));
      };
    return a.jsxs('div', {
      className: L(
        'space-y-3 p-4 rounded-xl bg-card/50 border border-border/50',
        n && 'p-3'
      ),
      children: [
        a.jsx(ml, {
          placeholder: e,
          value: r,
          onChange: (c) => o(c.target.value),
          className: L(
            'min-h-[80px] bg-background/50 border-border/50 resize-none',
            n && 'min-h-[60px]'
          ),
        }),
        a.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            a.jsxs('div', {
              className: 'flex items-center gap-1',
              children: [
                a.jsx(ne, {
                  variant: 'ghost',
                  size: 'icon',
                  className:
                    'h-8 w-8 text-muted-foreground hover:text-foreground',
                  children: a.jsx(hx, { className: 'w-4 h-4' }),
                }),
                a.jsx(ne, {
                  variant: 'ghost',
                  size: 'icon',
                  className:
                    'h-8 w-8 text-muted-foreground hover:text-foreground',
                  children: a.jsx(Ea, { className: 'w-4 h-4' }),
                }),
                a.jsx(ne, {
                  variant: 'ghost',
                  size: 'icon',
                  className:
                    'h-8 w-8 text-muted-foreground hover:text-foreground',
                  children: a.jsx(vS, { className: 'w-4 h-4' }),
                }),
              ],
            }),
            a.jsxs(ne, {
              size: 'sm',
              onClick: l,
              disabled: !r.trim() && s.length === 0,
              className: 'gap-2',
              children: [
                a.jsx(yx, { className: 'w-4 h-4' }),
                n ? 'Responder' : 'Publicar',
              ],
            }),
          ],
        }),
      ],
    });
  },
  _w = ({ comment: e, depth: t = 0 }) => {
    const [n, r] = d.useState(t < 2),
      [o, s] = d.useState(!1),
      [i, l] = d.useState(e.isLiked),
      [c, u] = d.useState(e.likes),
      f = () => {
        (l(!i), u(i ? c - 1 : c + 1));
      };
    return a.jsx('div', {
      className: L(
        'space-y-3',
        t > 0 && 'pl-4 md:pl-8 border-l-2 border-border/30'
      ),
      children: a.jsxs('div', {
        className: 'flex gap-3',
        children: [
          a.jsxs(Dw, {
            className: 'w-10 h-10 shrink-0',
            children: [
              a.jsx(Mw, { src: e.author.avatar }),
              a.jsx(Aw, {
                className: 'bg-accent/20 text-accent text-sm',
                children: e.author.name
                  .split(' ')
                  .map((m) => m[0])
                  .join(''),
              }),
            ],
          }),
          a.jsxs('div', {
            className: 'flex-1 space-y-2',
            children: [
              a.jsxs('div', {
                className: 'flex items-center gap-2 flex-wrap',
                children: [
                  a.jsx('span', {
                    className: 'font-medium text-foreground',
                    children: e.author.name,
                  }),
                  e.author.isEducator &&
                    a.jsxs(Xt, {
                      variant: 'outline',
                      className:
                        'bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs py-0',
                      children: [
                        a.jsx(Ff, { className: 'w-3 h-3 mr-1' }),
                        'Educador',
                      ],
                    }),
                  a.jsx('span', {
                    className: 'text-xs text-muted-foreground',
                    children: Yt(e.createdAt, 'd MMM yyyy, HH:mm', {
                      locale: Gt,
                    }),
                  }),
                ],
              }),
              a.jsx('p', {
                className: 'text-sm text-foreground/90 whitespace-pre-wrap',
                children: e.content,
              }),
              e.media.length > 0 &&
                a.jsx('div', {
                  className: 'flex flex-wrap gap-2 mt-2',
                  children: e.media.map((m) => a.jsx(HM, { media: m }, m.id)),
                }),
              a.jsxs('div', {
                className: 'flex items-center gap-4 pt-1',
                children: [
                  a.jsxs('button', {
                    onClick: f,
                    className: L(
                      'flex items-center gap-1.5 text-xs transition-colors',
                      i
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-foreground'
                    ),
                    children: [
                      a.jsx(bS, {
                        className: L('w-4 h-4', i && 'fill-current'),
                      }),
                      c,
                    ],
                  }),
                  a.jsxs('button', {
                    onClick: () => s(!o),
                    className:
                      'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors',
                    children: [
                      a.jsx(wS, { className: 'w-4 h-4' }),
                      'Responder',
                    ],
                  }),
                  e.replies.length > 0 &&
                    a.jsxs('button', {
                      onClick: () => r(!n),
                      className:
                        'flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors',
                      children: [
                        n
                          ? a.jsx(dS, { className: 'w-4 h-4' })
                          : a.jsx(No, { className: 'w-4 h-4' }),
                        e.replies.length,
                        ' ',
                        e.replies.length === 1 ? 'respuesta' : 'respuestas',
                      ],
                    }),
                  a.jsx('button', {
                    className:
                      'text-muted-foreground hover:text-foreground transition-colors ml-auto',
                    children: a.jsx(mS, { className: 'w-4 h-4' }),
                  }),
                ],
              }),
              o &&
                a.jsx('div', {
                  className: 'mt-3',
                  children: a.jsx(Ow, {
                    placeholder: `Responder a ${e.author.name}...`,
                    isReply: !0,
                    onSubmit: () => s(!1),
                  }),
                }),
              n &&
                e.replies.length > 0 &&
                a.jsx('div', {
                  className: 'mt-4 space-y-4',
                  children: e.replies.map((m) =>
                    a.jsx(_w, { comment: m, depth: t + 1 }, m.id)
                  ),
                }),
            ],
          }),
        ],
      }),
    });
  },
  VM = ({ comments: e = BM }) => {
    const t = e.reduce((n, r) => {
      const o = (s) => 1 + s.replies.reduce((i, l) => i + o(l), 0);
      return n + o(r);
    }, 0);
    return a.jsxs('div', {
      className: 'space-y-6',
      children: [
        a.jsxs('div', {
          children: [
            a.jsx('h3', {
              className: 'text-xl font-semibold text-foreground',
              children: 'Foro del curso',
            }),
            a.jsxs('p', {
              className: 'text-sm text-muted-foreground mt-1',
              children: [
                t,
                ' comentarios · Comparte dudas y avances con tus compañeros',
              ],
            }),
          ],
        }),
        a.jsx(Ow, {
          placeholder: 'Inicia una nueva discusión o comparte tu avance...',
          onSubmit: (n, r) => console.log('New comment:', n, r),
        }),
        a.jsx('div', {
          className: 'space-y-6',
          children: e.map((n) =>
            a.jsx(
              'div',
              {
                className: 'p-4 rounded-xl bg-card/50 border border-border/50',
                children: a.jsx(_w, { comment: n }),
              },
              n.id
            )
          ),
        }),
      ],
    });
  },
  YM = {
    completed: 'bg-green-500',
    'in-progress': 'bg-accent',
    pending: 'bg-muted-foreground/50',
    overdue: 'bg-red-500',
  };
function ng({ objectives: e, projectStartDate: t, projectEndDate: n }) {
  const [r, o] = d.useState('weeks'),
    {
      minDate: s,
      maxDate: i,
      allActivities: l,
    } = d.useMemo(() => {
      const f = [];
      let m = t ? Fn(t) : new Date(),
        p = n ? Fn(n) : new Date();
      return (
        e.forEach((h, b) => {
          h.activities.forEach((v) => {
            const w = Fn(v.startDate),
              x = Fn(v.endDate);
            (w < m && (m = w),
              x > p && (p = x),
              f.push({ ...v, objectiveIndex: b + 1, objectiveTitle: h.title }));
          });
        }),
        (m = Pd(m, -2)),
        (p = Pd(p, 2)),
        { minDate: m, maxDate: p, allActivities: f }
      );
    }, [e, t, n]),
    c = d.useMemo(() => {
      switch (r) {
        case 'days':
          return jD({ start: s, end: i }).map((f) => ({
            date: f,
            label: Yt(f, 'd', { locale: Gt }),
            subLabel: Yt(f, 'EEE', { locale: Gt }),
          }));
        case 'weeks':
          return SD({ start: s, end: i }, { weekStartsOn: 1 }).map((f) => ({
            date: f,
            endDate: kD(f, { weekStartsOn: 1 }),
            label: `${Yt(f, 'd MMM', { locale: Gt })}`,
            subLabel: `Sem ${Yt(f, 'w', { locale: Gt })}`,
          }));
        case 'months':
          return CD({ start: s, end: i }).map((f) => ({
            date: f,
            endDate: ND(f),
            label: Yt(f, 'MMMM', { locale: Gt }),
            subLabel: Yt(f, 'yyyy', { locale: Gt }),
          }));
      }
    }, [r, s, i]),
    u = (f) => {
      const m = Fn(f.startDate),
        p = Fn(f.endDate),
        h = iu(i, s) || 1,
        b = iu(m, s),
        v = iu(p, m) + 1,
        w = (b / h) * 100,
        x = (v / h) * 100;
      return { left: `${Math.max(0, w)}%`, width: `${Math.min(100 - w, x)}%` };
    };
  return a.jsxs('div', {
    className: 'bg-card/50 rounded-xl border border-border/50 p-5',
    children: [
      a.jsxs('div', {
        className: 'flex items-center justify-between mb-4',
        children: [
          a.jsxs('div', {
            className: 'flex items-center gap-3',
            children: [
              a.jsx('div', {
                className:
                  'w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center',
                children: a.jsx(_t, { className: 'w-4 h-4 text-purple-400' }),
              }),
              a.jsx('h3', {
                className: 'text-lg font-semibold text-foreground',
                children: 'Cronograma',
              }),
            ],
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1 bg-muted/30 rounded-lg p-1',
            children: [
              a.jsx(ne, {
                size: 'sm',
                variant: 'ghost',
                onClick: () => o('days'),
                className: L(
                  'h-7 px-3 text-xs',
                  r === 'days'
                    ? 'bg-accent text-background hover:bg-accent/90'
                    : 'text-muted-foreground hover:text-foreground'
                ),
                children: 'Días',
              }),
              a.jsx(ne, {
                size: 'sm',
                variant: 'ghost',
                onClick: () => o('weeks'),
                className: L(
                  'h-7 px-3 text-xs',
                  r === 'weeks'
                    ? 'bg-accent text-background hover:bg-accent/90'
                    : 'text-muted-foreground hover:text-foreground'
                ),
                children: 'Semanas',
              }),
              a.jsx(ne, {
                size: 'sm',
                variant: 'ghost',
                onClick: () => o('months'),
                className: L(
                  'h-7 px-3 text-xs',
                  r === 'months'
                    ? 'bg-accent text-background hover:bg-accent/90'
                    : 'text-muted-foreground hover:text-foreground'
                ),
                children: 'Meses',
              }),
            ],
          }),
        ],
      }),
      a.jsxs('div', {
        className: 'flex',
        children: [
          a.jsxs('div', {
            className: 'w-52 shrink-0 border-r border-border/30',
            children: [
              a.jsx('div', {
                className:
                  'h-10 flex items-end pb-2 pr-3 border-b border-border/50 mb-2',
                children: a.jsx('span', {
                  className: 'text-xs text-muted-foreground font-medium',
                  children: 'Actividad',
                }),
              }),
              a.jsx('div', {
                className: 'space-y-2',
                children: l.map((f, m) =>
                  a.jsx(
                    'div',
                    {
                      className: 'h-6 flex items-center pr-3',
                      children: a.jsxs('div', {
                        className: 'flex items-center gap-2',
                        children: [
                          a.jsxs('span', {
                            className: 'text-xs text-accent font-medium',
                            children: [f.objectiveIndex, '.', m + 1],
                          }),
                          a.jsx('span', {
                            className:
                              'text-xs text-foreground truncate max-w-[140px]',
                            title: f.title,
                            children: f.title,
                          }),
                        ],
                      }),
                    },
                    f.id
                  )
                ),
              }),
            ],
          }),
          a.jsx('div', {
            className:
              'flex-1 overflow-x-auto scrollbar-thin [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30',
            children: a.jsxs('div', {
              style: {
                minWidth: `${c.length * (r === 'days' ? 40 : r === 'weeks' ? 80 : 100)}px`,
              },
              children: [
                a.jsx('div', {
                  className: 'flex border-b border-border/50 mb-2 h-10',
                  children: c.map((f, m) =>
                    a.jsxs(
                      'div',
                      {
                        className:
                          'text-center border-l border-border/30 first:border-l-0 px-1 flex flex-col justify-end pb-2',
                        style: {
                          width:
                            r === 'days'
                              ? '40px'
                              : r === 'weeks'
                                ? '80px'
                                : '100px',
                        },
                        children: [
                          a.jsx('div', {
                            className: 'text-xs text-muted-foreground truncate',
                            children: f.subLabel,
                          }),
                          a.jsx('div', {
                            className:
                              'text-xs font-medium text-foreground truncate',
                            children: f.label,
                          }),
                        ],
                      },
                      m
                    )
                  ),
                }),
                a.jsx('div', {
                  className: 'space-y-2',
                  children: l.map((f) => {
                    const m = u(f);
                    return a.jsxs(
                      'div',
                      {
                        className: 'relative h-6 bg-muted/20 rounded group',
                        children: [
                          a.jsx('div', {
                            className: 'absolute inset-0 flex',
                            children: c.map((p, h) =>
                              a.jsx(
                                'div',
                                {
                                  className:
                                    'border-l border-border/20 first:border-l-0',
                                  style: {
                                    width:
                                      r === 'days'
                                        ? '40px'
                                        : r === 'weeks'
                                          ? '80px'
                                          : '100px',
                                  },
                                },
                                h
                              )
                            ),
                          }),
                          a.jsx('div', {
                            className: L(
                              'absolute top-1 h-4 rounded-full transition-all',
                              YM[f.status],
                              'group-hover:opacity-80'
                            ),
                            style: m,
                            title: `${f.title}: ${Yt(Fn(f.startDate), 'd MMM', { locale: Gt })} - ${Yt(Fn(f.endDate), 'd MMM', { locale: Gt })}`,
                          }),
                        ],
                      },
                      f.id
                    );
                  }),
                }),
              ],
            }),
          }),
        ],
      }),
      a.jsxs('div', {
        className:
          'flex items-center gap-4 mt-4 pt-4 border-t border-border/50',
        children: [
          a.jsx('span', {
            className: 'text-xs text-muted-foreground',
            children: 'Estado:',
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              a.jsx('div', { className: 'w-3 h-3 rounded-full bg-green-500' }),
              a.jsx('span', {
                className: 'text-xs text-muted-foreground',
                children: 'Completado',
              }),
            ],
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              a.jsx('div', { className: 'w-3 h-3 rounded-full bg-accent' }),
              a.jsx('span', {
                className: 'text-xs text-muted-foreground',
                children: 'En progreso',
              }),
            ],
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              a.jsx('div', {
                className: 'w-3 h-3 rounded-full bg-muted-foreground/50',
              }),
              a.jsx('span', {
                className: 'text-xs text-muted-foreground',
                children: 'Pendiente',
              }),
            ],
          }),
          a.jsxs('div', {
            className: 'flex items-center gap-1',
            children: [
              a.jsx('div', { className: 'w-3 h-3 rounded-full bg-red-500' }),
              a.jsx('span', {
                className: 'text-xs text-muted-foreground',
                children: 'Atrasado',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
const rg = x1,
  GM = y1,
  Iw = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(sm, {
      ref: n,
      className: L(
        'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        e
      ),
      ...t,
    })
  );
Iw.displayName = sm.displayName;
const Td = d.forwardRef(({ className: e, children: t, ...n }, r) =>
  a.jsxs(GM, {
    children: [
      a.jsx(Iw, {}),
      a.jsxs(am, {
        ref: r,
        className: L(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          e
        ),
        ...n,
        children: [
          t,
          a.jsxs(cm, {
            className:
              'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
            children: [
              a.jsx(Bl, { className: 'h-4 w-4' }),
              a.jsx('span', { className: 'sr-only', children: 'Close' }),
            ],
          }),
        ],
      }),
    ],
  })
);
Td.displayName = am.displayName;
const Rd = ({ className: e, ...t }) =>
  a.jsx('div', {
    className: L('flex flex-col space-y-1.5 text-center sm:text-left', e),
    ...t,
  });
Rd.displayName = 'DialogHeader';
const Dd = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(im, {
    ref: n,
    className: L('text-lg font-semibold leading-none tracking-tight', e),
    ...t,
  })
);
Dd.displayName = im.displayName;
const Md = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(lm, { ref: n, className: L('text-sm text-muted-foreground', e), ...t })
);
Md.displayName = lm.displayName;
var KM = 'Label',
  Lw = d.forwardRef((e, t) =>
    a.jsx(K.label, {
      ...e,
      ref: t,
      onMouseDown: (n) => {
        var o;
        n.target.closest('button, input, select, textarea') ||
          ((o = e.onMouseDown) == null || o.call(e, n),
          !n.defaultPrevented && n.detail > 1 && n.preventDefault());
      },
    })
  );
Lw.displayName = KM;
var Fw = Lw;
const QM = Wl(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
  ),
  Ts = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(Fw, { ref: n, className: L(QM(), e), ...t })
  );
Ts.displayName = Fw.displayName;
var wm = 'Progress',
  bm = 100,
  [qM, cO] = Ue(wm),
  [XM, ZM] = qM(wm),
  $w = d.forwardRef((e, t) => {
    const {
      __scopeProgress: n,
      value: r = null,
      max: o,
      getValueLabel: s = JM,
      ...i
    } = e;
    (o || o === 0) && !og(o) && console.error(eA(`${o}`, 'Progress'));
    const l = og(o) ? o : bm;
    r !== null && !sg(r, l) && console.error(tA(`${r}`, 'Progress'));
    const c = sg(r, l) ? r : null,
      u = pl(c) ? s(c, l) : void 0;
    return a.jsx(XM, {
      scope: n,
      value: c,
      max: l,
      children: a.jsx(K.div, {
        'aria-valuemax': l,
        'aria-valuemin': 0,
        'aria-valuenow': pl(c) ? c : void 0,
        'aria-valuetext': u,
        role: 'progressbar',
        'data-state': Uw(c, l),
        'data-value': c ?? void 0,
        'data-max': l,
        ...i,
        ref: t,
      }),
    });
  });
$w.displayName = wm;
var zw = 'ProgressIndicator',
  Ww = d.forwardRef((e, t) => {
    const { __scopeProgress: n, ...r } = e,
      o = ZM(zw, n);
    return a.jsx(K.div, {
      'data-state': Uw(o.value, o.max),
      'data-value': o.value ?? void 0,
      'data-max': o.max,
      ...r,
      ref: t,
    });
  });
Ww.displayName = zw;
function JM(e, t) {
  return `${Math.round((e / t) * 100)}%`;
}
function Uw(e, t) {
  return e == null ? 'indeterminate' : e === t ? 'complete' : 'loading';
}
function pl(e) {
  return typeof e == 'number';
}
function og(e) {
  return pl(e) && !isNaN(e) && e > 0;
}
function sg(e, t) {
  return pl(e) && !isNaN(e) && e <= t && e >= 0;
}
function eA(e, t) {
  return `Invalid prop \`max\` of value \`${e}\` supplied to \`${t}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${bm}\`.`;
}
function tA(e, t) {
  return `Invalid prop \`value\` of value \`${e}\` supplied to \`${t}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${bm} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Bw = $w,
  nA = Ww;
const Ad = d.forwardRef(({ className: e, value: t, ...n }, r) =>
  a.jsx(Bw, {
    ref: r,
    className: L(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
      e
    ),
    ...n,
    children: a.jsx(nA, {
      className: 'h-full w-full flex-1 bg-primary transition-all',
      style: { transform: `translateX(-${100 - (t || 0)}%)` },
    }),
  })
);
Ad.displayName = Bw.displayName;
var uu = 'rovingFocusGroup.onEntryFocus',
  rA = { bubbles: !1, cancelable: !0 },
  Ta = 'RovingFocusGroup',
  [Od, Hw, oA] = Il(Ta),
  [sA, lc] = Ue(Ta, [oA]),
  [aA, iA] = sA(Ta),
  Vw = d.forwardRef((e, t) =>
    a.jsx(Od.Provider, {
      scope: e.__scopeRovingFocusGroup,
      children: a.jsx(Od.Slot, {
        scope: e.__scopeRovingFocusGroup,
        children: a.jsx(lA, { ...e, ref: t }),
      }),
    })
  );
Vw.displayName = Ta;
var lA = d.forwardRef((e, t) => {
    const {
        __scopeRovingFocusGroup: n,
        orientation: r,
        loop: o = !1,
        dir: s,
        currentTabStopId: i,
        defaultCurrentTabStopId: l,
        onCurrentTabStopIdChange: c,
        onEntryFocus: u,
        preventScrollOnEntryFocus: f = !1,
        ...m
      } = e,
      p = d.useRef(null),
      h = se(t, p),
      b = oc(s),
      [v, w] = cn({ prop: i, defaultProp: l ?? null, onChange: c, caller: Ta }),
      [x, g] = d.useState(!1),
      y = Oe(u),
      N = Hw(n),
      C = d.useRef(!1),
      [j, S] = d.useState(0);
    return (
      d.useEffect(() => {
        const k = p.current;
        if (k)
          return (
            k.addEventListener(uu, y),
            () => k.removeEventListener(uu, y)
          );
      }, [y]),
      a.jsx(aA, {
        scope: n,
        orientation: r,
        dir: b,
        loop: o,
        currentTabStopId: v,
        onItemFocus: d.useCallback((k) => w(k), [w]),
        onItemShiftTab: d.useCallback(() => g(!0), []),
        onFocusableItemAdd: d.useCallback(() => S((k) => k + 1), []),
        onFocusableItemRemove: d.useCallback(() => S((k) => k - 1), []),
        children: a.jsx(K.div, {
          tabIndex: x || j === 0 ? -1 : 0,
          'data-orientation': r,
          ...m,
          ref: h,
          style: { outline: 'none', ...e.style },
          onMouseDown: $(e.onMouseDown, () => {
            C.current = !0;
          }),
          onFocus: $(e.onFocus, (k) => {
            const M = !C.current;
            if (k.target === k.currentTarget && M && !x) {
              const D = new CustomEvent(uu, rA);
              if ((k.currentTarget.dispatchEvent(D), !D.defaultPrevented)) {
                const W = N().filter((V) => V.focusable),
                  P = W.find((V) => V.active),
                  U = W.find((V) => V.id === v),
                  Y = [P, U, ...W].filter(Boolean).map((V) => V.ref.current);
                Kw(Y, f);
              }
            }
            C.current = !1;
          }),
          onBlur: $(e.onBlur, () => g(!1)),
        }),
      })
    );
  }),
  Yw = 'RovingFocusGroupItem',
  Gw = d.forwardRef((e, t) => {
    const {
        __scopeRovingFocusGroup: n,
        focusable: r = !0,
        active: o = !1,
        tabStopId: s,
        children: i,
        ...l
      } = e,
      c = sn(),
      u = s || c,
      f = iA(Yw, n),
      m = f.currentTabStopId === u,
      p = Hw(n),
      {
        onFocusableItemAdd: h,
        onFocusableItemRemove: b,
        currentTabStopId: v,
      } = f;
    return (
      d.useEffect(() => {
        if (r) return (h(), () => b());
      }, [r, h, b]),
      a.jsx(Od.ItemSlot, {
        scope: n,
        id: u,
        focusable: r,
        active: o,
        children: a.jsx(K.span, {
          tabIndex: m ? 0 : -1,
          'data-orientation': f.orientation,
          ...l,
          ref: t,
          onMouseDown: $(e.onMouseDown, (w) => {
            r ? f.onItemFocus(u) : w.preventDefault();
          }),
          onFocus: $(e.onFocus, () => f.onItemFocus(u)),
          onKeyDown: $(e.onKeyDown, (w) => {
            if (w.key === 'Tab' && w.shiftKey) {
              f.onItemShiftTab();
              return;
            }
            if (w.target !== w.currentTarget) return;
            const x = dA(w, f.orientation, f.dir);
            if (x !== void 0) {
              if (w.metaKey || w.ctrlKey || w.altKey || w.shiftKey) return;
              w.preventDefault();
              let y = p()
                .filter((N) => N.focusable)
                .map((N) => N.ref.current);
              if (x === 'last') y.reverse();
              else if (x === 'prev' || x === 'next') {
                x === 'prev' && y.reverse();
                const N = y.indexOf(w.currentTarget);
                y = f.loop ? fA(y, N + 1) : y.slice(N + 1);
              }
              setTimeout(() => Kw(y));
            }
          }),
          children:
            typeof i == 'function'
              ? i({ isCurrentTabStop: m, hasTabStop: v != null })
              : i,
        }),
      })
    );
  });
Gw.displayName = Yw;
var cA = {
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  ArrowRight: 'next',
  ArrowDown: 'next',
  PageUp: 'first',
  Home: 'first',
  PageDown: 'last',
  End: 'last',
};
function uA(e, t) {
  return t !== 'rtl'
    ? e
    : e === 'ArrowLeft'
      ? 'ArrowRight'
      : e === 'ArrowRight'
        ? 'ArrowLeft'
        : e;
}
function dA(e, t, n) {
  const r = uA(e.key, n);
  if (
    !(t === 'vertical' && ['ArrowLeft', 'ArrowRight'].includes(r)) &&
    !(t === 'horizontal' && ['ArrowUp', 'ArrowDown'].includes(r))
  )
    return cA[r];
}
function Kw(e, t = !1) {
  const n = document.activeElement;
  for (const r of e)
    if (
      r === n ||
      (r.focus({ preventScroll: t }), document.activeElement !== n)
    )
      return;
}
function fA(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
var Qw = Vw,
  qw = Gw,
  cc = 'Tabs',
  [mA, uO] = Ue(cc, [lc]),
  Xw = lc(),
  [pA, Nm] = mA(cc),
  Zw = d.forwardRef((e, t) => {
    const {
        __scopeTabs: n,
        value: r,
        onValueChange: o,
        defaultValue: s,
        orientation: i = 'horizontal',
        dir: l,
        activationMode: c = 'automatic',
        ...u
      } = e,
      f = oc(l),
      [m, p] = cn({ prop: r, onChange: o, defaultProp: s ?? '', caller: cc });
    return a.jsx(pA, {
      scope: n,
      baseId: sn(),
      value: m,
      onValueChange: p,
      orientation: i,
      dir: f,
      activationMode: c,
      children: a.jsx(K.div, { dir: f, 'data-orientation': i, ...u, ref: t }),
    });
  });
Zw.displayName = cc;
var Jw = 'TabsList',
  eb = d.forwardRef((e, t) => {
    const { __scopeTabs: n, loop: r = !0, ...o } = e,
      s = Nm(Jw, n),
      i = Xw(n);
    return a.jsx(Qw, {
      asChild: !0,
      ...i,
      orientation: s.orientation,
      dir: s.dir,
      loop: r,
      children: a.jsx(K.div, {
        role: 'tablist',
        'aria-orientation': s.orientation,
        ...o,
        ref: t,
      }),
    });
  });
eb.displayName = Jw;
var tb = 'TabsTrigger',
  nb = d.forwardRef((e, t) => {
    const { __scopeTabs: n, value: r, disabled: o = !1, ...s } = e,
      i = Nm(tb, n),
      l = Xw(n),
      c = sb(i.baseId, r),
      u = ab(i.baseId, r),
      f = r === i.value;
    return a.jsx(qw, {
      asChild: !0,
      ...l,
      focusable: !o,
      active: f,
      children: a.jsx(K.button, {
        type: 'button',
        role: 'tab',
        'aria-selected': f,
        'aria-controls': u,
        'data-state': f ? 'active' : 'inactive',
        'data-disabled': o ? '' : void 0,
        disabled: o,
        id: c,
        ...s,
        ref: t,
        onMouseDown: $(e.onMouseDown, (m) => {
          !o && m.button === 0 && m.ctrlKey === !1
            ? i.onValueChange(r)
            : m.preventDefault();
        }),
        onKeyDown: $(e.onKeyDown, (m) => {
          [' ', 'Enter'].includes(m.key) && i.onValueChange(r);
        }),
        onFocus: $(e.onFocus, () => {
          const m = i.activationMode !== 'manual';
          !f && !o && m && i.onValueChange(r);
        }),
      }),
    });
  });
nb.displayName = tb;
var rb = 'TabsContent',
  ob = d.forwardRef((e, t) => {
    const { __scopeTabs: n, value: r, forceMount: o, children: s, ...i } = e,
      l = Nm(rb, n),
      c = sb(l.baseId, r),
      u = ab(l.baseId, r),
      f = r === l.value,
      m = d.useRef(f);
    return (
      d.useEffect(() => {
        const p = requestAnimationFrame(() => (m.current = !1));
        return () => cancelAnimationFrame(p);
      }, []),
      a.jsx(Nt, {
        present: o || f,
        children: ({ present: p }) =>
          a.jsx(K.div, {
            'data-state': f ? 'active' : 'inactive',
            'data-orientation': l.orientation,
            role: 'tabpanel',
            'aria-labelledby': c,
            hidden: !p,
            id: u,
            tabIndex: 0,
            ...i,
            ref: t,
            style: { ...e.style, animationDuration: m.current ? '0s' : void 0 },
            children: p && s,
          }),
      })
    );
  });
ob.displayName = rb;
function sb(e, t) {
  return `${e}-trigger-${t}`;
}
function ab(e, t) {
  return `${e}-content-${t}`;
}
var hA = Zw,
  ib = eb,
  lb = nb,
  cb = ob;
const gA = hA,
  ub = d.forwardRef(({ className: e, ...t }, n) =>
    a.jsx(ib, {
      ref: n,
      className: L(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        e
      ),
      ...t,
    })
  );
ub.displayName = ib.displayName;
const io = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(lb, {
    ref: n,
    className: L(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      e
    ),
    ...t,
  })
);
io.displayName = lb.displayName;
const lo = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(cb, {
    ref: n,
    className: L(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      e
    ),
    ...t,
  })
);
lo.displayName = cb.displayName;
var jm = 'Popper',
  [db, uc] = Ue(jm),
  [vA, fb] = db(jm),
  mb = (e) => {
    const { __scopePopper: t, children: n } = e,
      [r, o] = d.useState(null);
    return a.jsx(vA, { scope: t, anchor: r, onAnchorChange: o, children: n });
  };
mb.displayName = jm;
var pb = 'PopperAnchor',
  hb = d.forwardRef((e, t) => {
    const { __scopePopper: n, virtualRef: r, ...o } = e,
      s = fb(pb, n),
      i = d.useRef(null),
      l = se(t, i);
    return (
      d.useEffect(() => {
        s.onAnchorChange((r == null ? void 0 : r.current) || i.current);
      }),
      r ? null : a.jsx(K.div, { ...o, ref: l })
    );
  });
hb.displayName = pb;
var Cm = 'PopperContent',
  [xA, yA] = db(Cm),
  gb = d.forwardRef((e, t) => {
    var ee, ft, Ce, rt, jt, dn;
    const {
        __scopePopper: n,
        side: r = 'bottom',
        sideOffset: o = 0,
        align: s = 'center',
        alignOffset: i = 0,
        arrowPadding: l = 0,
        avoidCollisions: c = !0,
        collisionBoundary: u = [],
        collisionPadding: f = 0,
        sticky: m = 'partial',
        hideWhenDetached: p = !1,
        updatePositionStrategy: h = 'optimized',
        onPlaced: b,
        ...v
      } = e,
      w = fb(Cm, n),
      [x, g] = d.useState(null),
      y = se(t, (qe) => g(qe)),
      [N, C] = d.useState(null),
      j = ry(N),
      S = (j == null ? void 0 : j.width) ?? 0,
      k = (j == null ? void 0 : j.height) ?? 0,
      M = r + (s !== 'center' ? '-' + s : ''),
      D =
        typeof f == 'number'
          ? f
          : { top: 0, right: 0, bottom: 0, left: 0, ...f },
      W = Array.isArray(u) ? u : [u],
      P = W.length > 0,
      U = { padding: D, boundary: W.filter(bA), altBoundary: P },
      {
        refs: _,
        floatingStyles: Y,
        placement: V,
        isPositioned: G,
        middlewareData: T,
      } = Gx({
        strategy: 'fixed',
        placement: M,
        whileElementsMounted: (...qe) =>
          Vx(...qe, { animationFrame: h === 'always' }),
        elements: { reference: w.anchor },
        middleware: [
          Kx({ mainAxis: o + k, alignmentAxis: i }),
          c &&
            Qx({
              mainAxis: !0,
              crossAxis: !1,
              limiter: m === 'partial' ? qx() : void 0,
              ...U,
            }),
          c && Xx({ ...U }),
          Zx({
            ...U,
            apply: ({
              elements: qe,
              rects: yr,
              availableWidth: ds,
              availableHeight: Xr,
            }) => {
              const { width: fs, height: wr } = yr.reference,
                Ct = qe.floating.style;
              (Ct.setProperty('--radix-popper-available-width', `${ds}px`),
                Ct.setProperty('--radix-popper-available-height', `${Xr}px`),
                Ct.setProperty('--radix-popper-anchor-width', `${fs}px`),
                Ct.setProperty('--radix-popper-anchor-height', `${wr}px`));
            },
          }),
          N && ey({ element: N, padding: l }),
          NA({ arrowWidth: S, arrowHeight: k }),
          p && Jx({ strategy: 'referenceHidden', ...U }),
        ],
      }),
      [E, I] = yb(V),
      B = Oe(b);
    _e(() => {
      G && (B == null || B());
    }, [G, B]);
    const z = (ee = T.arrow) == null ? void 0 : ee.x,
      Q = (ft = T.arrow) == null ? void 0 : ft.y,
      Z = ((Ce = T.arrow) == null ? void 0 : Ce.centerOffset) !== 0,
      [ue, he] = d.useState();
    return (
      _e(() => {
        x && he(window.getComputedStyle(x).zIndex);
      }, [x]),
      a.jsx('div', {
        ref: _.setFloating,
        'data-radix-popper-content-wrapper': '',
        style: {
          ...Y,
          transform: G ? Y.transform : 'translate(0, -200%)',
          minWidth: 'max-content',
          zIndex: ue,
          '--radix-popper-transform-origin': [
            (rt = T.transformOrigin) == null ? void 0 : rt.x,
            (jt = T.transformOrigin) == null ? void 0 : jt.y,
          ].join(' '),
          ...(((dn = T.hide) == null ? void 0 : dn.referenceHidden) && {
            visibility: 'hidden',
            pointerEvents: 'none',
          }),
        },
        dir: e.dir,
        children: a.jsx(xA, {
          scope: n,
          placedSide: E,
          onArrowChange: C,
          arrowX: z,
          arrowY: Q,
          shouldHideArrow: Z,
          children: a.jsx(K.div, {
            'data-side': E,
            'data-align': I,
            ...v,
            ref: y,
            style: { ...v.style, animation: G ? void 0 : 'none' },
          }),
        }),
      })
    );
  });
gb.displayName = Cm;
var vb = 'PopperArrow',
  wA = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' },
  xb = d.forwardRef(function (t, n) {
    const { __scopePopper: r, ...o } = t,
      s = yA(vb, r),
      i = wA[s.placedSide];
    return a.jsx('span', {
      ref: s.onArrowChange,
      style: {
        position: 'absolute',
        left: s.arrowX,
        top: s.arrowY,
        [i]: 0,
        transformOrigin: {
          top: '',
          right: '0 0',
          bottom: 'center 0',
          left: '100% 0',
        }[s.placedSide],
        transform: {
          top: 'translateY(100%)',
          right: 'translateY(50%) rotate(90deg) translateX(-50%)',
          bottom: 'rotate(180deg)',
          left: 'translateY(50%) rotate(-90deg) translateX(50%)',
        }[s.placedSide],
        visibility: s.shouldHideArrow ? 'hidden' : void 0,
      },
      children: a.jsx(ny, {
        ...o,
        ref: n,
        style: { ...o.style, display: 'block' },
      }),
    });
  });
xb.displayName = vb;
function bA(e) {
  return e !== null;
}
var NA = (e) => ({
  name: 'transformOrigin',
  options: e,
  fn(t) {
    var w, x, g;
    const { placement: n, rects: r, middlewareData: o } = t,
      i = ((w = o.arrow) == null ? void 0 : w.centerOffset) !== 0,
      l = i ? 0 : e.arrowWidth,
      c = i ? 0 : e.arrowHeight,
      [u, f] = yb(n),
      m = { start: '0%', center: '50%', end: '100%' }[f],
      p = (((x = o.arrow) == null ? void 0 : x.x) ?? 0) + l / 2,
      h = (((g = o.arrow) == null ? void 0 : g.y) ?? 0) + c / 2;
    let b = '',
      v = '';
    return (
      u === 'bottom'
        ? ((b = i ? m : `${p}px`), (v = `${-c}px`))
        : u === 'top'
          ? ((b = i ? m : `${p}px`), (v = `${r.floating.height + c}px`))
          : u === 'right'
            ? ((b = `${-c}px`), (v = i ? m : `${h}px`))
            : u === 'left' &&
              ((b = `${r.floating.width + c}px`), (v = i ? m : `${h}px`)),
      { data: { x: b, y: v } }
    );
  },
});
function yb(e) {
  const [t, n = 'center'] = e.split('-');
  return [t, n];
}
var wb = mb,
  bb = hb,
  Nb = gb,
  jb = xb,
  du,
  dc = 'HoverCard',
  [Cb, dO] = Ue(dc, [uc]),
  fc = uc(),
  [jA, Sm] = Cb(dc),
  Sb = (e) => {
    const {
        __scopeHoverCard: t,
        children: n,
        open: r,
        defaultOpen: o,
        onOpenChange: s,
        openDelay: i = 700,
        closeDelay: l = 300,
      } = e,
      c = fc(t),
      u = d.useRef(0),
      f = d.useRef(0),
      m = d.useRef(!1),
      p = d.useRef(!1),
      [h, b] = cn({ prop: r, defaultProp: o ?? !1, onChange: s, caller: dc }),
      v = d.useCallback(() => {
        (clearTimeout(f.current),
          (u.current = window.setTimeout(() => b(!0), i)));
      }, [i, b]),
      w = d.useCallback(() => {
        (clearTimeout(u.current),
          !m.current &&
            !p.current &&
            (f.current = window.setTimeout(() => b(!1), l)));
      }, [l, b]),
      x = d.useCallback(() => b(!1), [b]);
    return (
      d.useEffect(
        () => () => {
          (clearTimeout(u.current), clearTimeout(f.current));
        },
        []
      ),
      a.jsx(jA, {
        scope: t,
        open: h,
        onOpenChange: b,
        onOpen: v,
        onClose: w,
        onDismiss: x,
        hasSelectionRef: m,
        isPointerDownOnContentRef: p,
        children: a.jsx(wb, { ...c, children: n }),
      })
    );
  };
Sb.displayName = dc;
var Eb = 'HoverCardTrigger',
  kb = d.forwardRef((e, t) => {
    const { __scopeHoverCard: n, ...r } = e,
      o = Sm(Eb, n),
      s = fc(n);
    return a.jsx(bb, {
      asChild: !0,
      ...s,
      children: a.jsx(K.a, {
        'data-state': o.open ? 'open' : 'closed',
        ...r,
        ref: t,
        onPointerEnter: $(e.onPointerEnter, gl(o.onOpen)),
        onPointerLeave: $(e.onPointerLeave, gl(o.onClose)),
        onFocus: $(e.onFocus, o.onOpen),
        onBlur: $(e.onBlur, o.onClose),
        onTouchStart: $(e.onTouchStart, (i) => i.preventDefault()),
      }),
    });
  });
kb.displayName = Eb;
var CA = 'HoverCardPortal',
  [fO, SA] = Cb(CA, { forceMount: void 0 }),
  hl = 'HoverCardContent',
  Pb = d.forwardRef((e, t) => {
    const n = SA(hl, e.__scopeHoverCard),
      { forceMount: r = n.forceMount, ...o } = e,
      s = Sm(hl, e.__scopeHoverCard);
    return a.jsx(Nt, {
      present: r || s.open,
      children: a.jsx(EA, {
        'data-state': s.open ? 'open' : 'closed',
        ...o,
        onPointerEnter: $(e.onPointerEnter, gl(s.onOpen)),
        onPointerLeave: $(e.onPointerLeave, gl(s.onClose)),
        ref: t,
      }),
    });
  });
Pb.displayName = hl;
var EA = d.forwardRef((e, t) => {
    const {
        __scopeHoverCard: n,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: s,
        onInteractOutside: i,
        ...l
      } = e,
      c = Sm(hl, n),
      u = fc(n),
      f = d.useRef(null),
      m = se(t, f),
      [p, h] = d.useState(!1);
    return (
      d.useEffect(() => {
        if (p) {
          const b = document.body;
          return (
            (du = b.style.userSelect || b.style.webkitUserSelect),
            (b.style.userSelect = 'none'),
            (b.style.webkitUserSelect = 'none'),
            () => {
              ((b.style.userSelect = du), (b.style.webkitUserSelect = du));
            }
          );
        }
      }, [p]),
      d.useEffect(() => {
        if (f.current) {
          const b = () => {
            (h(!1),
              (c.isPointerDownOnContentRef.current = !1),
              setTimeout(() => {
                var w;
                ((w = document.getSelection()) == null
                  ? void 0
                  : w.toString()) !== '' && (c.hasSelectionRef.current = !0);
              }));
          };
          return (
            document.addEventListener('pointerup', b),
            () => {
              (document.removeEventListener('pointerup', b),
                (c.hasSelectionRef.current = !1),
                (c.isPointerDownOnContentRef.current = !1));
            }
          );
        }
      }, [c.isPointerDownOnContentRef, c.hasSelectionRef]),
      d.useEffect(() => {
        f.current &&
          TA(f.current).forEach((v) => v.setAttribute('tabindex', '-1'));
      }),
      a.jsx(Ca, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onInteractOutside: i,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: $(s, (b) => {
          b.preventDefault();
        }),
        onDismiss: c.onDismiss,
        children: a.jsx(Nb, {
          ...u,
          ...l,
          onPointerDown: $(l.onPointerDown, (b) => {
            (b.currentTarget.contains(b.target) && h(!0),
              (c.hasSelectionRef.current = !1),
              (c.isPointerDownOnContentRef.current = !0));
          }),
          ref: m,
          style: {
            ...l.style,
            userSelect: p ? 'text' : void 0,
            WebkitUserSelect: p ? 'text' : void 0,
            '--radix-hover-card-content-transform-origin':
              'var(--radix-popper-transform-origin)',
            '--radix-hover-card-content-available-width':
              'var(--radix-popper-available-width)',
            '--radix-hover-card-content-available-height':
              'var(--radix-popper-available-height)',
            '--radix-hover-card-trigger-width':
              'var(--radix-popper-anchor-width)',
            '--radix-hover-card-trigger-height':
              'var(--radix-popper-anchor-height)',
          },
        }),
      })
    );
  }),
  kA = 'HoverCardArrow',
  PA = d.forwardRef((e, t) => {
    const { __scopeHoverCard: n, ...r } = e,
      o = fc(n);
    return a.jsx(jb, { ...o, ...r, ref: t });
  });
PA.displayName = kA;
function gl(e) {
  return (t) => (t.pointerType === 'touch' ? void 0 : e());
}
function TA(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) =>
        r.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
    });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
var RA = Sb,
  DA = kb,
  Tb = Pb;
const ag = RA,
  ig = DA,
  _d = d.forwardRef(
    ({ className: e, align: t = 'center', sideOffset: n = 4, ...r }, o) =>
      a.jsx(Tb, {
        ref: o,
        align: t,
        sideOffset: n,
        className: L(
          'z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          e
        ),
        ...r,
      })
  );
_d.displayName = Tb.displayName;
var Id = ['Enter', ' '],
  MA = ['ArrowDown', 'PageUp', 'Home'],
  Rb = ['ArrowUp', 'PageDown', 'End'],
  AA = [...MA, ...Rb],
  OA = { ltr: [...Id, 'ArrowRight'], rtl: [...Id, 'ArrowLeft'] },
  _A = { ltr: ['ArrowLeft'], rtl: ['ArrowRight'] },
  Ra = 'Menu',
  [pa, IA, LA] = Il(Ra),
  [Qr, Db] = Ue(Ra, [LA, uc, lc]),
  mc = uc(),
  Mb = lc(),
  [FA, qr] = Qr(Ra),
  [$A, Da] = Qr(Ra),
  Ab = (e) => {
    const {
        __scopeMenu: t,
        open: n = !1,
        children: r,
        dir: o,
        onOpenChange: s,
        modal: i = !0,
      } = e,
      l = mc(t),
      [c, u] = d.useState(null),
      f = d.useRef(!1),
      m = Oe(s),
      p = oc(o);
    return (
      d.useEffect(() => {
        const h = () => {
            ((f.current = !0),
              document.addEventListener('pointerdown', b, {
                capture: !0,
                once: !0,
              }),
              document.addEventListener('pointermove', b, {
                capture: !0,
                once: !0,
              }));
          },
          b = () => (f.current = !1);
        return (
          document.addEventListener('keydown', h, { capture: !0 }),
          () => {
            (document.removeEventListener('keydown', h, { capture: !0 }),
              document.removeEventListener('pointerdown', b, { capture: !0 }),
              document.removeEventListener('pointermove', b, { capture: !0 }));
          }
        );
      }, []),
      a.jsx(wb, {
        ...l,
        children: a.jsx(FA, {
          scope: t,
          open: n,
          onOpenChange: m,
          content: c,
          onContentChange: u,
          children: a.jsx($A, {
            scope: t,
            onClose: d.useCallback(() => m(!1), [m]),
            isUsingKeyboardRef: f,
            dir: p,
            modal: i,
            children: r,
          }),
        }),
      })
    );
  };
Ab.displayName = Ra;
var zA = 'MenuAnchor',
  Em = d.forwardRef((e, t) => {
    const { __scopeMenu: n, ...r } = e,
      o = mc(n);
    return a.jsx(bb, { ...o, ...r, ref: t });
  });
Em.displayName = zA;
var km = 'MenuPortal',
  [WA, Ob] = Qr(km, { forceMount: void 0 }),
  _b = (e) => {
    const { __scopeMenu: t, forceMount: n, children: r, container: o } = e,
      s = qr(km, t);
    return a.jsx(WA, {
      scope: t,
      forceMount: n,
      children: a.jsx(Nt, {
        present: n || s.open,
        children: a.jsx(Fl, { asChild: !0, container: o, children: r }),
      }),
    });
  };
_b.displayName = km;
var yt = 'MenuContent',
  [UA, Pm] = Qr(yt),
  Ib = d.forwardRef((e, t) => {
    const n = Ob(yt, e.__scopeMenu),
      { forceMount: r = n.forceMount, ...o } = e,
      s = qr(yt, e.__scopeMenu),
      i = Da(yt, e.__scopeMenu);
    return a.jsx(pa.Provider, {
      scope: e.__scopeMenu,
      children: a.jsx(Nt, {
        present: r || s.open,
        children: a.jsx(pa.Slot, {
          scope: e.__scopeMenu,
          children: i.modal
            ? a.jsx(BA, { ...o, ref: t })
            : a.jsx(HA, { ...o, ref: t }),
        }),
      }),
    });
  }),
  BA = d.forwardRef((e, t) => {
    const n = qr(yt, e.__scopeMenu),
      r = d.useRef(null),
      o = se(t, r);
    return (
      d.useEffect(() => {
        const s = r.current;
        if (s) return e1(s);
      }, []),
      a.jsx(Tm, {
        ...e,
        ref: o,
        trapFocus: n.open,
        disableOutsidePointerEvents: n.open,
        disableOutsideScroll: !0,
        onFocusOutside: $(e.onFocusOutside, (s) => s.preventDefault(), {
          checkForDefaultPrevented: !1,
        }),
        onDismiss: () => n.onOpenChange(!1),
      })
    );
  }),
  HA = d.forwardRef((e, t) => {
    const n = qr(yt, e.__scopeMenu);
    return a.jsx(Tm, {
      ...e,
      ref: t,
      trapFocus: !1,
      disableOutsidePointerEvents: !1,
      disableOutsideScroll: !1,
      onDismiss: () => n.onOpenChange(!1),
    });
  }),
  VA = Zo('MenuContent.ScrollLock'),
  Tm = d.forwardRef((e, t) => {
    const {
        __scopeMenu: n,
        loop: r = !1,
        trapFocus: o,
        onOpenAutoFocus: s,
        onCloseAutoFocus: i,
        disableOutsidePointerEvents: l,
        onEntryFocus: c,
        onEscapeKeyDown: u,
        onPointerDownOutside: f,
        onFocusOutside: m,
        onInteractOutside: p,
        onDismiss: h,
        disableOutsideScroll: b,
        ...v
      } = e,
      w = qr(yt, n),
      x = Da(yt, n),
      g = mc(n),
      y = Mb(n),
      N = IA(n),
      [C, j] = d.useState(null),
      S = d.useRef(null),
      k = se(t, S, w.onContentChange),
      M = d.useRef(0),
      D = d.useRef(''),
      W = d.useRef(0),
      P = d.useRef(null),
      U = d.useRef('right'),
      _ = d.useRef(0),
      Y = b ? tm : d.Fragment,
      V = b ? { as: VA, allowPinchZoom: !0 } : void 0,
      G = (E) => {
        var ee, ft;
        const I = D.current + E,
          B = N().filter((Ce) => !Ce.disabled),
          z = document.activeElement,
          Q =
            (ee = B.find((Ce) => Ce.ref.current === z)) == null
              ? void 0
              : ee.textValue,
          Z = B.map((Ce) => Ce.textValue),
          ue = r3(Z, I, Q),
          he =
            (ft = B.find((Ce) => Ce.textValue === ue)) == null
              ? void 0
              : ft.ref.current;
        ((function Ce(rt) {
          ((D.current = rt),
            window.clearTimeout(M.current),
            rt !== '' && (M.current = window.setTimeout(() => Ce(''), 1e3)));
        })(I),
          he && setTimeout(() => he.focus()));
      };
    (d.useEffect(() => () => window.clearTimeout(M.current), []), Vy());
    const T = d.useCallback((E) => {
      var B, z;
      return (
        U.current === ((B = P.current) == null ? void 0 : B.side) &&
        s3(E, (z = P.current) == null ? void 0 : z.area)
      );
    }, []);
    return a.jsx(UA, {
      scope: n,
      searchRef: D,
      onItemEnter: d.useCallback(
        (E) => {
          T(E) && E.preventDefault();
        },
        [T]
      ),
      onItemLeave: d.useCallback(
        (E) => {
          var I;
          T(E) || ((I = S.current) == null || I.focus(), j(null));
        },
        [T]
      ),
      onTriggerLeave: d.useCallback(
        (E) => {
          T(E) && E.preventDefault();
        },
        [T]
      ),
      pointerGraceTimerRef: W,
      onPointerGraceIntentChange: d.useCallback((E) => {
        P.current = E;
      }, []),
      children: a.jsx(Y, {
        ...V,
        children: a.jsx(em, {
          asChild: !0,
          trapped: o,
          onMountAutoFocus: $(s, (E) => {
            var I;
            (E.preventDefault(),
              (I = S.current) == null || I.focus({ preventScroll: !0 }));
          }),
          onUnmountAutoFocus: i,
          children: a.jsx(Ca, {
            asChild: !0,
            disableOutsidePointerEvents: l,
            onEscapeKeyDown: u,
            onPointerDownOutside: f,
            onFocusOutside: m,
            onInteractOutside: p,
            onDismiss: h,
            children: a.jsx(Qw, {
              asChild: !0,
              ...y,
              dir: x.dir,
              orientation: 'vertical',
              loop: r,
              currentTabStopId: C,
              onCurrentTabStopIdChange: j,
              onEntryFocus: $(c, (E) => {
                x.isUsingKeyboardRef.current || E.preventDefault();
              }),
              preventScrollOnEntryFocus: !0,
              children: a.jsx(Nb, {
                role: 'menu',
                'aria-orientation': 'vertical',
                'data-state': Zb(w.open),
                'data-radix-menu-content': '',
                dir: x.dir,
                ...g,
                ...v,
                ref: k,
                style: { outline: 'none', ...v.style },
                onKeyDown: $(v.onKeyDown, (E) => {
                  const B =
                      E.target.closest('[data-radix-menu-content]') ===
                      E.currentTarget,
                    z = E.ctrlKey || E.altKey || E.metaKey,
                    Q = E.key.length === 1;
                  B &&
                    (E.key === 'Tab' && E.preventDefault(),
                    !z && Q && G(E.key));
                  const Z = S.current;
                  if (E.target !== Z || !AA.includes(E.key)) return;
                  E.preventDefault();
                  const he = N()
                    .filter((ee) => !ee.disabled)
                    .map((ee) => ee.ref.current);
                  (Rb.includes(E.key) && he.reverse(), t3(he));
                }),
                onBlur: $(e.onBlur, (E) => {
                  E.currentTarget.contains(E.target) ||
                    (window.clearTimeout(M.current), (D.current = ''));
                }),
                onPointerMove: $(
                  e.onPointerMove,
                  ha((E) => {
                    const I = E.target,
                      B = _.current !== E.clientX;
                    if (E.currentTarget.contains(I) && B) {
                      const z = E.clientX > _.current ? 'right' : 'left';
                      ((U.current = z), (_.current = E.clientX));
                    }
                  })
                ),
              }),
            }),
          }),
        }),
      }),
    });
  });
Ib.displayName = yt;
var YA = 'MenuGroup',
  Rm = d.forwardRef((e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return a.jsx(K.div, { role: 'group', ...r, ref: t });
  });
Rm.displayName = YA;
var GA = 'MenuLabel',
  Lb = d.forwardRef((e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return a.jsx(K.div, { ...r, ref: t });
  });
Lb.displayName = GA;
var vl = 'MenuItem',
  lg = 'menu.itemSelect',
  pc = d.forwardRef((e, t) => {
    const { disabled: n = !1, onSelect: r, ...o } = e,
      s = d.useRef(null),
      i = Da(vl, e.__scopeMenu),
      l = Pm(vl, e.__scopeMenu),
      c = se(t, s),
      u = d.useRef(!1),
      f = () => {
        const m = s.current;
        if (!n && m) {
          const p = new CustomEvent(lg, { bubbles: !0, cancelable: !0 });
          (m.addEventListener(lg, (h) => (r == null ? void 0 : r(h)), {
            once: !0,
          }),
            Ll(m, p),
            p.defaultPrevented ? (u.current = !1) : i.onClose());
        }
      };
    return a.jsx(Fb, {
      ...o,
      ref: c,
      disabled: n,
      onClick: $(e.onClick, f),
      onPointerDown: (m) => {
        var p;
        ((p = e.onPointerDown) == null || p.call(e, m), (u.current = !0));
      },
      onPointerUp: $(e.onPointerUp, (m) => {
        var p;
        u.current || (p = m.currentTarget) == null || p.click();
      }),
      onKeyDown: $(e.onKeyDown, (m) => {
        const p = l.searchRef.current !== '';
        n ||
          (p && m.key === ' ') ||
          (Id.includes(m.key) && (m.currentTarget.click(), m.preventDefault()));
      }),
    });
  });
pc.displayName = vl;
var Fb = d.forwardRef((e, t) => {
    const { __scopeMenu: n, disabled: r = !1, textValue: o, ...s } = e,
      i = Pm(vl, n),
      l = Mb(n),
      c = d.useRef(null),
      u = se(t, c),
      [f, m] = d.useState(!1),
      [p, h] = d.useState('');
    return (
      d.useEffect(() => {
        const b = c.current;
        b && h((b.textContent ?? '').trim());
      }, [s.children]),
      a.jsx(pa.ItemSlot, {
        scope: n,
        disabled: r,
        textValue: o ?? p,
        children: a.jsx(qw, {
          asChild: !0,
          ...l,
          focusable: !r,
          children: a.jsx(K.div, {
            role: 'menuitem',
            'data-highlighted': f ? '' : void 0,
            'aria-disabled': r || void 0,
            'data-disabled': r ? '' : void 0,
            ...s,
            ref: u,
            onPointerMove: $(
              e.onPointerMove,
              ha((b) => {
                r
                  ? i.onItemLeave(b)
                  : (i.onItemEnter(b),
                    b.defaultPrevented ||
                      b.currentTarget.focus({ preventScroll: !0 }));
              })
            ),
            onPointerLeave: $(
              e.onPointerLeave,
              ha((b) => i.onItemLeave(b))
            ),
            onFocus: $(e.onFocus, () => m(!0)),
            onBlur: $(e.onBlur, () => m(!1)),
          }),
        }),
      })
    );
  }),
  KA = 'MenuCheckboxItem',
  $b = d.forwardRef((e, t) => {
    const { checked: n = !1, onCheckedChange: r, ...o } = e;
    return a.jsx(Hb, {
      scope: e.__scopeMenu,
      checked: n,
      children: a.jsx(pc, {
        role: 'menuitemcheckbox',
        'aria-checked': xl(n) ? 'mixed' : n,
        ...o,
        ref: t,
        'data-state': Mm(n),
        onSelect: $(
          o.onSelect,
          () => (r == null ? void 0 : r(xl(n) ? !0 : !n)),
          { checkForDefaultPrevented: !1 }
        ),
      }),
    });
  });
$b.displayName = KA;
var zb = 'MenuRadioGroup',
  [QA, qA] = Qr(zb, { value: void 0, onValueChange: () => {} }),
  Wb = d.forwardRef((e, t) => {
    const { value: n, onValueChange: r, ...o } = e,
      s = Oe(r);
    return a.jsx(QA, {
      scope: e.__scopeMenu,
      value: n,
      onValueChange: s,
      children: a.jsx(Rm, { ...o, ref: t }),
    });
  });
Wb.displayName = zb;
var Ub = 'MenuRadioItem',
  Bb = d.forwardRef((e, t) => {
    const { value: n, ...r } = e,
      o = qA(Ub, e.__scopeMenu),
      s = n === o.value;
    return a.jsx(Hb, {
      scope: e.__scopeMenu,
      checked: s,
      children: a.jsx(pc, {
        role: 'menuitemradio',
        'aria-checked': s,
        ...r,
        ref: t,
        'data-state': Mm(s),
        onSelect: $(
          r.onSelect,
          () => {
            var i;
            return (i = o.onValueChange) == null ? void 0 : i.call(o, n);
          },
          { checkForDefaultPrevented: !1 }
        ),
      }),
    });
  });
Bb.displayName = Ub;
var Dm = 'MenuItemIndicator',
  [Hb, XA] = Qr(Dm, { checked: !1 }),
  Vb = d.forwardRef((e, t) => {
    const { __scopeMenu: n, forceMount: r, ...o } = e,
      s = XA(Dm, n);
    return a.jsx(Nt, {
      present: r || xl(s.checked) || s.checked === !0,
      children: a.jsx(K.span, { ...o, ref: t, 'data-state': Mm(s.checked) }),
    });
  });
Vb.displayName = Dm;
var ZA = 'MenuSeparator',
  Yb = d.forwardRef((e, t) => {
    const { __scopeMenu: n, ...r } = e;
    return a.jsx(K.div, {
      role: 'separator',
      'aria-orientation': 'horizontal',
      ...r,
      ref: t,
    });
  });
Yb.displayName = ZA;
var JA = 'MenuArrow',
  Gb = d.forwardRef((e, t) => {
    const { __scopeMenu: n, ...r } = e,
      o = mc(n);
    return a.jsx(jb, { ...o, ...r, ref: t });
  });
Gb.displayName = JA;
var e3 = 'MenuSub',
  [mO, Kb] = Qr(e3),
  Rs = 'MenuSubTrigger',
  Qb = d.forwardRef((e, t) => {
    const n = qr(Rs, e.__scopeMenu),
      r = Da(Rs, e.__scopeMenu),
      o = Kb(Rs, e.__scopeMenu),
      s = Pm(Rs, e.__scopeMenu),
      i = d.useRef(null),
      { pointerGraceTimerRef: l, onPointerGraceIntentChange: c } = s,
      u = { __scopeMenu: e.__scopeMenu },
      f = d.useCallback(() => {
        (i.current && window.clearTimeout(i.current), (i.current = null));
      }, []);
    return (
      d.useEffect(() => f, [f]),
      d.useEffect(() => {
        const m = l.current;
        return () => {
          (window.clearTimeout(m), c(null));
        };
      }, [l, c]),
      a.jsx(Em, {
        asChild: !0,
        ...u,
        children: a.jsx(Fb, {
          id: o.triggerId,
          'aria-haspopup': 'menu',
          'aria-expanded': n.open,
          'aria-controls': o.contentId,
          'data-state': Zb(n.open),
          ...e,
          ref: _l(t, o.onTriggerChange),
          onClick: (m) => {
            var p;
            ((p = e.onClick) == null || p.call(e, m),
              !(e.disabled || m.defaultPrevented) &&
                (m.currentTarget.focus(), n.open || n.onOpenChange(!0)));
          },
          onPointerMove: $(
            e.onPointerMove,
            ha((m) => {
              (s.onItemEnter(m),
                !m.defaultPrevented &&
                  !e.disabled &&
                  !n.open &&
                  !i.current &&
                  (s.onPointerGraceIntentChange(null),
                  (i.current = window.setTimeout(() => {
                    (n.onOpenChange(!0), f());
                  }, 100))));
            })
          ),
          onPointerLeave: $(
            e.onPointerLeave,
            ha((m) => {
              var h, b;
              f();
              const p =
                (h = n.content) == null ? void 0 : h.getBoundingClientRect();
              if (p) {
                const v = (b = n.content) == null ? void 0 : b.dataset.side,
                  w = v === 'right',
                  x = w ? -5 : 5,
                  g = p[w ? 'left' : 'right'],
                  y = p[w ? 'right' : 'left'];
                (s.onPointerGraceIntentChange({
                  area: [
                    { x: m.clientX + x, y: m.clientY },
                    { x: g, y: p.top },
                    { x: y, y: p.top },
                    { x: y, y: p.bottom },
                    { x: g, y: p.bottom },
                  ],
                  side: v,
                }),
                  window.clearTimeout(l.current),
                  (l.current = window.setTimeout(
                    () => s.onPointerGraceIntentChange(null),
                    300
                  )));
              } else {
                if ((s.onTriggerLeave(m), m.defaultPrevented)) return;
                s.onPointerGraceIntentChange(null);
              }
            })
          ),
          onKeyDown: $(e.onKeyDown, (m) => {
            var h;
            const p = s.searchRef.current !== '';
            e.disabled ||
              (p && m.key === ' ') ||
              (OA[r.dir].includes(m.key) &&
                (n.onOpenChange(!0),
                (h = n.content) == null || h.focus(),
                m.preventDefault()));
          }),
        }),
      })
    );
  });
Qb.displayName = Rs;
var qb = 'MenuSubContent',
  Xb = d.forwardRef((e, t) => {
    const n = Ob(yt, e.__scopeMenu),
      { forceMount: r = n.forceMount, ...o } = e,
      s = qr(yt, e.__scopeMenu),
      i = Da(yt, e.__scopeMenu),
      l = Kb(qb, e.__scopeMenu),
      c = d.useRef(null),
      u = se(t, c);
    return a.jsx(pa.Provider, {
      scope: e.__scopeMenu,
      children: a.jsx(Nt, {
        present: r || s.open,
        children: a.jsx(pa.Slot, {
          scope: e.__scopeMenu,
          children: a.jsx(Tm, {
            id: l.contentId,
            'aria-labelledby': l.triggerId,
            ...o,
            ref: u,
            align: 'start',
            side: i.dir === 'rtl' ? 'left' : 'right',
            disableOutsidePointerEvents: !1,
            disableOutsideScroll: !1,
            trapFocus: !1,
            onOpenAutoFocus: (f) => {
              var m;
              (i.isUsingKeyboardRef.current &&
                ((m = c.current) == null || m.focus()),
                f.preventDefault());
            },
            onCloseAutoFocus: (f) => f.preventDefault(),
            onFocusOutside: $(e.onFocusOutside, (f) => {
              f.target !== l.trigger && s.onOpenChange(!1);
            }),
            onEscapeKeyDown: $(e.onEscapeKeyDown, (f) => {
              (i.onClose(), f.preventDefault());
            }),
            onKeyDown: $(e.onKeyDown, (f) => {
              var h;
              const m = f.currentTarget.contains(f.target),
                p = _A[i.dir].includes(f.key);
              m &&
                p &&
                (s.onOpenChange(!1),
                (h = l.trigger) == null || h.focus(),
                f.preventDefault());
            }),
          }),
        }),
      }),
    });
  });
Xb.displayName = qb;
function Zb(e) {
  return e ? 'open' : 'closed';
}
function xl(e) {
  return e === 'indeterminate';
}
function Mm(e) {
  return xl(e) ? 'indeterminate' : e ? 'checked' : 'unchecked';
}
function t3(e) {
  const t = document.activeElement;
  for (const n of e)
    if (n === t || (n.focus(), document.activeElement !== t)) return;
}
function n3(e, t) {
  return e.map((n, r) => e[(t + r) % e.length]);
}
function r3(e, t, n) {
  const o = t.length > 1 && Array.from(t).every((u) => u === t[0]) ? t[0] : t,
    s = n ? e.indexOf(n) : -1;
  let i = n3(e, Math.max(s, 0));
  o.length === 1 && (i = i.filter((u) => u !== n));
  const c = i.find((u) => u.toLowerCase().startsWith(o.toLowerCase()));
  return c !== n ? c : void 0;
}
function o3(e, t) {
  const { x: n, y: r } = e;
  let o = !1;
  for (let s = 0, i = t.length - 1; s < t.length; i = s++) {
    const l = t[s],
      c = t[i],
      u = l.x,
      f = l.y,
      m = c.x,
      p = c.y;
    f > r != p > r && n < ((m - u) * (r - f)) / (p - f) + u && (o = !o);
  }
  return o;
}
function s3(e, t) {
  if (!t) return !1;
  const n = { x: e.clientX, y: e.clientY };
  return o3(n, t);
}
function ha(e) {
  return (t) => (t.pointerType === 'mouse' ? e(t) : void 0);
}
var a3 = Ab,
  i3 = Em,
  l3 = _b,
  c3 = Ib,
  u3 = Rm,
  d3 = Lb,
  f3 = pc,
  m3 = $b,
  p3 = Wb,
  h3 = Bb,
  g3 = Vb,
  v3 = Yb,
  x3 = Gb,
  y3 = Qb,
  w3 = Xb,
  hc = 'DropdownMenu',
  [b3, pO] = Ue(hc, [Db]),
  Qe = Db(),
  [N3, Jb] = b3(hc),
  e2 = (e) => {
    const {
        __scopeDropdownMenu: t,
        children: n,
        dir: r,
        open: o,
        defaultOpen: s,
        onOpenChange: i,
        modal: l = !0,
      } = e,
      c = Qe(t),
      u = d.useRef(null),
      [f, m] = cn({ prop: o, defaultProp: s ?? !1, onChange: i, caller: hc });
    return a.jsx(N3, {
      scope: t,
      triggerId: sn(),
      triggerRef: u,
      contentId: sn(),
      open: f,
      onOpenChange: m,
      onOpenToggle: d.useCallback(() => m((p) => !p), [m]),
      modal: l,
      children: a.jsx(a3, {
        ...c,
        open: f,
        onOpenChange: m,
        dir: r,
        modal: l,
        children: n,
      }),
    });
  };
e2.displayName = hc;
var t2 = 'DropdownMenuTrigger',
  n2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, disabled: r = !1, ...o } = e,
      s = Jb(t2, n),
      i = Qe(n);
    return a.jsx(i3, {
      asChild: !0,
      ...i,
      children: a.jsx(K.button, {
        type: 'button',
        id: s.triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': s.open,
        'aria-controls': s.open ? s.contentId : void 0,
        'data-state': s.open ? 'open' : 'closed',
        'data-disabled': r ? '' : void 0,
        disabled: r,
        ...o,
        ref: _l(t, s.triggerRef),
        onPointerDown: $(e.onPointerDown, (l) => {
          !r &&
            l.button === 0 &&
            l.ctrlKey === !1 &&
            (s.onOpenToggle(), s.open || l.preventDefault());
        }),
        onKeyDown: $(e.onKeyDown, (l) => {
          r ||
            (['Enter', ' '].includes(l.key) && s.onOpenToggle(),
            l.key === 'ArrowDown' && s.onOpenChange(!0),
            ['Enter', ' ', 'ArrowDown'].includes(l.key) && l.preventDefault());
        }),
      }),
    });
  });
n2.displayName = t2;
var j3 = 'DropdownMenuPortal',
  r2 = (e) => {
    const { __scopeDropdownMenu: t, ...n } = e,
      r = Qe(t);
    return a.jsx(l3, { ...r, ...n });
  };
r2.displayName = j3;
var o2 = 'DropdownMenuContent',
  s2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Jb(o2, n),
      s = Qe(n),
      i = d.useRef(!1);
    return a.jsx(c3, {
      id: o.contentId,
      'aria-labelledby': o.triggerId,
      ...s,
      ...r,
      ref: t,
      onCloseAutoFocus: $(e.onCloseAutoFocus, (l) => {
        var c;
        (i.current || (c = o.triggerRef.current) == null || c.focus(),
          (i.current = !1),
          l.preventDefault());
      }),
      onInteractOutside: $(e.onInteractOutside, (l) => {
        const c = l.detail.originalEvent,
          u = c.button === 0 && c.ctrlKey === !0,
          f = c.button === 2 || u;
        (!o.modal || f) && (i.current = !0);
      }),
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin':
          'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width':
          'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height':
          'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width':
          'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height':
          'var(--radix-popper-anchor-height)',
      },
    });
  });
s2.displayName = o2;
var C3 = 'DropdownMenuGroup',
  S3 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(u3, { ...o, ...r, ref: t });
  });
S3.displayName = C3;
var E3 = 'DropdownMenuLabel',
  a2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(d3, { ...o, ...r, ref: t });
  });
a2.displayName = E3;
var k3 = 'DropdownMenuItem',
  i2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(f3, { ...o, ...r, ref: t });
  });
i2.displayName = k3;
var P3 = 'DropdownMenuCheckboxItem',
  l2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(m3, { ...o, ...r, ref: t });
  });
l2.displayName = P3;
var T3 = 'DropdownMenuRadioGroup',
  R3 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(p3, { ...o, ...r, ref: t });
  });
R3.displayName = T3;
var D3 = 'DropdownMenuRadioItem',
  c2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(h3, { ...o, ...r, ref: t });
  });
c2.displayName = D3;
var M3 = 'DropdownMenuItemIndicator',
  u2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(g3, { ...o, ...r, ref: t });
  });
u2.displayName = M3;
var A3 = 'DropdownMenuSeparator',
  d2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(v3, { ...o, ...r, ref: t });
  });
d2.displayName = A3;
var O3 = 'DropdownMenuArrow',
  _3 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(x3, { ...o, ...r, ref: t });
  });
_3.displayName = O3;
var I3 = 'DropdownMenuSubTrigger',
  f2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(y3, { ...o, ...r, ref: t });
  });
f2.displayName = I3;
var L3 = 'DropdownMenuSubContent',
  m2 = d.forwardRef((e, t) => {
    const { __scopeDropdownMenu: n, ...r } = e,
      o = Qe(n);
    return a.jsx(w3, {
      ...o,
      ...r,
      ref: t,
      style: {
        ...e.style,
        '--radix-dropdown-menu-content-transform-origin':
          'var(--radix-popper-transform-origin)',
        '--radix-dropdown-menu-content-available-width':
          'var(--radix-popper-available-width)',
        '--radix-dropdown-menu-content-available-height':
          'var(--radix-popper-available-height)',
        '--radix-dropdown-menu-trigger-width':
          'var(--radix-popper-anchor-width)',
        '--radix-dropdown-menu-trigger-height':
          'var(--radix-popper-anchor-height)',
      },
    });
  });
m2.displayName = L3;
var F3 = e2,
  $3 = n2,
  z3 = r2,
  p2 = s2,
  h2 = a2,
  g2 = i2,
  v2 = l2,
  x2 = c2,
  y2 = u2,
  w2 = d2,
  b2 = f2,
  N2 = m2;
const W3 = F3,
  U3 = $3,
  B3 = d.forwardRef(({ className: e, inset: t, children: n, ...r }, o) =>
    a.jsxs(b2, {
      ref: o,
      className: L(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent focus:bg-accent',
        t && 'pl-8',
        e
      ),
      ...r,
      children: [n, a.jsx(wn, { className: 'ml-auto h-4 w-4' })],
    })
  );
B3.displayName = b2.displayName;
const H3 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(N2, {
    ref: n,
    className: L(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      e
    ),
    ...t,
  })
);
H3.displayName = N2.displayName;
const j2 = d.forwardRef(({ className: e, sideOffset: t = 4, ...n }, r) =>
  a.jsx(z3, {
    children: a.jsx(p2, {
      ref: r,
      sideOffset: t,
      className: L(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        e
      ),
      ...n,
    }),
  })
);
j2.displayName = p2.displayName;
const Wn = d.forwardRef(({ className: e, inset: t, ...n }, r) =>
  a.jsx(g2, {
    ref: r,
    className: L(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground',
      t && 'pl-8',
      e
    ),
    ...n,
  })
);
Wn.displayName = g2.displayName;
const V3 = d.forwardRef(({ className: e, children: t, checked: n, ...r }, o) =>
  a.jsxs(v2, {
    ref: o,
    className: L(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground',
      e
    ),
    checked: n,
    ...r,
    children: [
      a.jsx('span', {
        className:
          'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
        children: a.jsx(y2, { children: a.jsx(If, { className: 'h-4 w-4' }) }),
      }),
      t,
    ],
  })
);
V3.displayName = v2.displayName;
const Y3 = d.forwardRef(({ className: e, children: t, ...n }, r) =>
  a.jsxs(x2, {
    ref: r,
    className: L(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground',
      e
    ),
    ...n,
    children: [
      a.jsx('span', {
        className:
          'absolute left-2 flex h-3.5 w-3.5 items-center justify-center',
        children: a.jsx(y2, {
          children: a.jsx(fx, { className: 'h-2 w-2 fill-current' }),
        }),
      }),
      t,
    ],
  })
);
Y3.displayName = x2.displayName;
const G3 = d.forwardRef(({ className: e, inset: t, ...n }, r) =>
  a.jsx(h2, {
    ref: r,
    className: L('px-2 py-1.5 text-sm font-semibold', t && 'pl-8', e),
    ...n,
  })
);
G3.displayName = h2.displayName;
const K3 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx(w2, { ref: n, className: L('-mx-1 my-1 h-px bg-muted', e), ...t })
);
K3.displayName = w2.displayName;
const Q3 = [
    {
      id: '1',
      title: 'Landing Page Responsiva',
      description:
        'Diseñar y desarrollar una landing page completamente responsiva utilizando React y Tailwind CSS. El proyecto debe incluir secciones de hero, características, testimonios y formulario de contacto.',
      status: 'in-progress',
      dueDate: '2024-02-15',
      progress: 65,
      collaborators: 3,
      problem:
        'Las pequeñas empresas necesitan una presencia web profesional pero no cuentan con los recursos para contratar desarrolladores especializados. Esto limita su capacidad de llegar a nuevos clientes y competir en el mercado digital.',
      requirements: [
        'Diseño mobile-first con breakpoints para tablet y desktop',
        'Animaciones suaves con Framer Motion',
        'Formulario funcional con validación de campos',
        'Optimización SEO básica (meta tags, Open Graph)',
        'Deploy en Vercel o Netlify con dominio personalizado',
      ],
      generalObjective:
        'Desarrollar una landing page profesional, responsiva y optimizada que permita a pequeñas empresas establecer su presencia digital de manera efectiva.',
      specificObjectives: [
        {
          id: 'obj-1',
          title: 'Diseñar la estructura y wireframes de la landing page',
          activities: [
            {
              id: 'act-1-1',
              title: 'Wireframes de baja fidelidad',
              description:
                'Crear bocetos iniciales de la estructura de cada sección de la landing page.',
              startDate: '2024-01-15',
              startTime: '09:00',
              endDate: '2024-01-18',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'wireframes-low.pdf',
                submittedAt: '2024-01-17T18:30:00',
                feedback: 'Buenos bocetos, clara la jerarquía.',
              },
            },
            {
              id: 'act-1-2',
              title: 'Mockups de alta fidelidad en Figma',
              description:
                'Diseñar los mockups finales con colores, tipografía y assets.',
              startDate: '2024-01-19',
              startTime: '09:00',
              endDate: '2024-01-22',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'mockups-figma.fig',
                submittedAt: '2024-01-21T20:00:00',
                feedback: 'Excelente diseño visual.',
              },
            },
          ],
        },
        {
          id: 'obj-2',
          title: 'Implementar la estructura HTML/JSX responsive',
          activities: [
            {
              id: 'act-2-1',
              title: 'Estructura semántica HTML',
              description:
                'Desarrollar la estructura HTML semántica de todas las secciones.',
              startDate: '2024-01-23',
              startTime: '09:00',
              endDate: '2024-01-26',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'estructura-html.zip',
                submittedAt: '2024-01-25T19:00:00',
                feedback: 'Buena estructura semántica.',
              },
            },
            {
              id: 'act-2-2',
              title: 'Estilos responsive con Tailwind',
              description:
                'Aplicar estilos mobile-first con breakpoints para tablet y desktop.',
              startDate: '2024-01-27',
              startTime: '09:00',
              endDate: '2024-01-30',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'estilos-tailwind.zip',
                submittedAt: '2024-01-29T20:15:00',
                feedback: 'Revisar espaciado en tablets.',
              },
            },
          ],
        },
        {
          id: 'obj-3',
          title: 'Añadir animaciones y microinteracciones',
          activities: [
            {
              id: 'act-3-1',
              title: 'Animaciones de entrada con Framer Motion',
              description:
                'Implementar animaciones de fade-in y slide para elementos principales.',
              startDate: '2024-01-31',
              startTime: '09:00',
              endDate: '2024-02-03',
              endTime: '23:59',
              status: 'in-progress',
            },
            {
              id: 'act-3-2',
              title: 'Microinteracciones en botones y hover',
              description:
                'Añadir efectos hover y transiciones suaves en elementos interactivos.',
              startDate: '2024-02-04',
              startTime: '09:00',
              endDate: '2024-02-07',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
        {
          id: 'obj-4',
          title: 'Desarrollar el formulario de contacto funcional',
          activities: [
            {
              id: 'act-4-1',
              title: 'Formulario con validación',
              description:
                'Crear formulario de contacto con validación de campos usando React Hook Form.',
              startDate: '2024-02-08',
              startTime: '09:00',
              endDate: '2024-02-10',
              endTime: '23:59',
              status: 'pending',
            },
            {
              id: 'act-4-2',
              title: 'Integración con servicio de email',
              description:
                'Conectar formulario con EmailJS o similar para envío de correos.',
              startDate: '2024-02-11',
              startTime: '09:00',
              endDate: '2024-02-12',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
        {
          id: 'obj-5',
          title: 'Realizar el deploy y optimización final',
          activities: [
            {
              id: 'act-5-1',
              title: 'Deploy en Vercel',
              description:
                'Publicar el proyecto en Vercel y configurar dominio.',
              startDate: '2024-02-13',
              startTime: '09:00',
              endDate: '2024-02-14',
              endTime: '23:59',
              status: 'pending',
            },
            {
              id: 'act-5-2',
              title: 'Optimización SEO y Lighthouse',
              description:
                'Aplicar meta tags, Open Graph y optimizar score de Lighthouse.',
              startDate: '2024-02-14',
              startTime: '09:00',
              endDate: '2024-02-15',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
      ],
      submissions: [
        {
          date: '2024-01-20',
          type: 'Avance 1',
          feedback:
            'Buen progreso en la estructura. Revisar espaciado en mobile.',
        },
        {
          date: '2024-01-28',
          type: 'Avance 2',
          feedback: 'Excelente diseño. Continúa con las animaciones.',
        },
      ],
    },
    {
      id: '2',
      title: 'API REST con Node.js',
      description:
        'Desarrollar una API RESTful completa con autenticación JWT y conexión a base de datos.',
      status: 'completed',
      dueDate: '2024-02-01',
      progress: 100,
      problem:
        'Muchas aplicaciones frontend necesitan un backend robusto para gestionar datos de usuarios, pero la implementación de APIs seguras y escalables es compleja sin conocimientos previos.',
      requirements: [
        'Endpoints CRUD completos para recursos principales',
        'Autenticación JWT con refresh tokens',
        'Validación de datos con Joi o Zod',
        'Documentación con Swagger/OpenAPI',
        'Tests unitarios con Jest (cobertura mínima 80%)',
      ],
      generalObjective:
        'Construir una API REST segura, documentada y probada que sirva como backend para aplicaciones web y móviles.',
      specificObjectives: [
        {
          id: 'obj-1',
          title: 'Configurar el servidor Express con TypeScript',
          activities: [
            {
              id: 'act-1-1',
              title: 'Setup inicial del proyecto',
              description:
                'Configurar Node.js con Express y TypeScript, incluyendo ESLint y Prettier.',
              startDate: '2024-01-05',
              startTime: '09:00',
              endDate: '2024-01-08',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'server-setup.zip',
                submittedAt: '2024-01-07T16:00:00',
                feedback: 'Configuración correcta y bien organizada.',
              },
            },
          ],
        },
        {
          id: 'obj-2',
          title: 'Implementar modelos y conexión a base de datos',
          activities: [
            {
              id: 'act-2-1',
              title: 'Esquemas de datos con Prisma',
              description: 'Definir modelos de datos y relaciones.',
              startDate: '2024-01-09',
              startTime: '09:00',
              endDate: '2024-01-12',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'prisma-schema.zip',
                submittedAt: '2024-01-11T17:00:00',
                feedback: 'Modelos bien definidos.',
              },
            },
            {
              id: 'act-2-2',
              title: 'Conexión a PostgreSQL',
              description:
                'Configurar conexión a base de datos con migraciones.',
              startDate: '2024-01-13',
              startTime: '09:00',
              endDate: '2024-01-15',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'database-config.zip',
                submittedAt: '2024-01-14T19:30:00',
                feedback: 'Considerar índices para optimización.',
              },
            },
          ],
        },
        {
          id: 'obj-3',
          title: 'Desarrollar endpoints CRUD y autenticación',
          activities: [
            {
              id: 'act-3-1',
              title: 'Endpoints CRUD',
              description:
                'Implementar todos los endpoints para recursos principales.',
              startDate: '2024-01-16',
              startTime: '09:00',
              endDate: '2024-01-20',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'crud-endpoints.zip',
                submittedAt: '2024-01-19T20:00:00',
                feedback: 'Endpoints bien estructurados.',
              },
            },
            {
              id: 'act-3-2',
              title: 'Autenticación JWT',
              description: 'Implementar middleware de autenticación con JWT.',
              startDate: '2024-01-21',
              startTime: '09:00',
              endDate: '2024-01-25',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'jwt-auth.zip',
                submittedAt: '2024-01-24T21:00:00',
                feedback: 'Excelente implementación de autenticación.',
              },
            },
          ],
        },
        {
          id: 'obj-4',
          title: 'Documentar y testear la API',
          activities: [
            {
              id: 'act-4-1',
              title: 'Documentación Swagger',
              description: 'Generar documentación interactiva con Swagger.',
              startDate: '2024-01-26',
              startTime: '09:00',
              endDate: '2024-01-28',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'swagger-docs.zip',
                submittedAt: '2024-01-27T18:00:00',
                feedback: 'Documentación clara y completa.',
              },
            },
            {
              id: 'act-4-2',
              title: 'Tests unitarios con Jest',
              description:
                'Escribir tests unitarios con cobertura mínima del 80%.',
              startDate: '2024-01-29',
              startTime: '09:00',
              endDate: '2024-02-01',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'api-tests.zip',
                submittedAt: '2024-01-31T22:00:00',
                feedback:
                  'Excelente trabajo. API bien estructurada y documentada.',
              },
            },
          ],
        },
      ],
      submissions: [
        {
          date: '2024-01-15',
          type: 'Entrega final',
          feedback: 'Excelente trabajo. API bien estructurada y documentada.',
        },
      ],
    },
    {
      id: '3',
      title: 'Dashboard Interactivo',
      description:
        'Construir un dashboard con gráficos interactivos y manejo de estado global.',
      status: 'pending',
      dueDate: '2024-02-28',
      progress: 0,
      problem:
        'Los equipos de análisis de datos necesitan visualizar métricas clave de forma rápida y accesible, pero las herramientas existentes son costosas o requieren configuración técnica avanzada.',
      requirements: [
        'Gráficos interactivos con Recharts o Chart.js',
        'Estado global con Context API o Redux Toolkit',
        'Filtros dinámicos por fecha, categoría y métricas',
        'Exportación de datos a CSV/Excel',
        'Diseño responsive con soporte para tablets',
      ],
      generalObjective:
        'Desarrollar un dashboard interactivo que permita visualizar y analizar datos de negocio de forma intuitiva y personalizable.',
      specificObjectives: [
        {
          id: 'obj-1',
          title: 'Configurar proyecto y estado global',
          activities: [
            {
              id: 'act-1-1',
              title: 'Setup con Redux Toolkit',
              description:
                'Crear la estructura del proyecto React con TypeScript y configurar Redux Toolkit.',
              startDate: '2024-02-15',
              startTime: '09:00',
              endDate: '2024-02-18',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
        {
          id: 'obj-2',
          title: 'Implementar componentes de gráficos',
          activities: [
            {
              id: 'act-2-1',
              title: 'Gráfico de líneas',
              description:
                'Desarrollar componente reutilizable de gráfico de líneas.',
              startDate: '2024-02-19',
              startTime: '09:00',
              endDate: '2024-02-21',
              endTime: '23:59',
              status: 'pending',
            },
            {
              id: 'act-2-2',
              title: 'Gráficos de barras y pie',
              description:
                'Desarrollar componentes de gráficos de barras y circulares.',
              startDate: '2024-02-22',
              startTime: '09:00',
              endDate: '2024-02-23',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
        {
          id: 'obj-3',
          title: 'Crear sistema de filtros dinámicos',
          activities: [
            {
              id: 'act-3-1',
              title: 'Filtros y exportación',
              description:
                'Implementar filtros por fecha y categoría, más funcionalidad de exportación.',
              startDate: '2024-02-24',
              startTime: '09:00',
              endDate: '2024-02-28',
              endTime: '23:59',
              status: 'pending',
            },
          ],
        },
      ],
      submissions: [],
    },
    {
      id: '4',
      title: 'Integración con IA',
      description:
        'Implementar funcionalidades de IA usando APIs de OpenAI para análisis de texto.',
      status: 'review',
      dueDate: '2024-02-10',
      progress: 100,
      collaborators: 2,
      problem:
        'El procesamiento manual de grandes volúmenes de texto (feedback de clientes, documentos, emails) consume mucho tiempo y es propenso a errores humanos.',
      requirements: [
        'Integración con OpenAI API (GPT-4)',
        'Manejo eficiente de prompts y tokens',
        'Análisis de sentimiento en tiempo real',
        'Generación de resúmenes automáticos',
        'UI intuitiva para interacción con IA',
      ],
      generalObjective:
        'Crear una aplicación que utilice IA para automatizar el análisis de texto, ahorrando tiempo y mejorando la precisión del procesamiento de información.',
      specificObjectives: [
        {
          id: 'obj-1',
          title: 'Configurar conexión segura con OpenAI API',
          activities: [
            {
              id: 'act-1-1',
              title: 'Setup de API con manejo de errores',
              description:
                'Configurar la conexión a OpenAI API con manejo de rate limiting y errores.',
              startDate: '2024-02-01',
              startTime: '09:00',
              endDate: '2024-02-03',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'api-config.zip',
                submittedAt: '2024-02-02T17:00:00',
                feedback: 'Configuración segura implementada correctamente.',
              },
            },
          ],
        },
        {
          id: 'obj-2',
          title: 'Implementar análisis de sentimiento',
          activities: [
            {
              id: 'act-2-1',
              title: 'Componente de análisis',
              description:
                'Crear interfaz para analizar el sentimiento de textos ingresados.',
              startDate: '2024-02-04',
              startTime: '09:00',
              endDate: '2024-02-05',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'sentiment-component.zip',
                submittedAt: '2024-02-05T15:00:00',
                feedback: 'Buen diseño de interfaz.',
              },
            },
            {
              id: 'act-2-2',
              title: 'Visualización de resultados',
              description:
                'Mostrar resultados del análisis con gráficos y métricas.',
              startDate: '2024-02-05',
              startTime: '09:00',
              endDate: '2024-02-06',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'sentiment-viz.zip',
                submittedAt: '2024-02-05T20:00:00',
                feedback: 'Buen trabajo en la visualización.',
              },
            },
          ],
        },
        {
          id: 'obj-3',
          title: 'Desarrollar generador de resúmenes',
          activities: [
            {
              id: 'act-3-1',
              title: 'Resúmenes automáticos con UI',
              description:
                'Implementar la funcionalidad de resumen con controles de longitud y estilo.',
              startDate: '2024-02-07',
              startTime: '09:00',
              endDate: '2024-02-10',
              endTime: '23:59',
              status: 'completed',
              submission: {
                file: 'text-summarizer.zip',
                submittedAt: '2024-02-08T21:30:00',
                feedback: 'En revisión por el educador...',
              },
            },
          ],
        },
      ],
      submissions: [
        {
          date: '2024-02-08',
          type: 'Entrega final',
          feedback: 'En revisión por el educador...',
        },
      ],
    },
  ],
  cg = {
    'in-progress': {
      label: 'En progreso',
      icon: Hr,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    completed: {
      label: 'Completado',
      icon: fS,
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    pending: {
      label: 'Pendiente',
      icon: cx,
      className: 'bg-muted text-muted-foreground border-border',
    },
    review: {
      label: 'En revisión',
      icon: Co,
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    overdue: {
      label: 'Vencido',
      icon: bx,
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  },
  ci = {
    pending: {
      label: 'Pendiente',
      className: 'bg-muted text-muted-foreground',
    },
    'in-progress': {
      label: 'En progreso',
      className: 'bg-blue-500/20 text-blue-400',
    },
    completed: {
      label: 'Completado',
      className: 'bg-green-500/20 text-green-400',
    },
    overdue: { label: 'Vencido', className: 'bg-red-500/20 text-red-400' },
  },
  q3 = () => {
    const [e, t] = d.useState(!1),
      [n, r] = d.useState(!1),
      [o, s] = d.useState(null),
      [i, l] = d.useState(null),
      [c, u] = d.useState(null),
      [f, m] = d.useState({ title: '', description: '' }),
      [p, h] = d.useState({ name: '', description: '' }),
      b = () => {
        (console.log('Creating project:', f),
          t(!1),
          m({ title: '', description: '' }));
      },
      v = (y) => {
        s(y);
      },
      w = () => {
        (s(null), l(null));
      },
      x = (y, N) =>
        new Date(`${y}T${N}`).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      g = (y) => {
        const N = y.every((S) => S.status === 'completed'),
          C = y.some((S) => S.status === 'in-progress'),
          j = y.some((S) => S.status === 'completed');
        return N ? 'completed' : C || j ? 'in-progress' : 'pending';
      };
    if (o) {
      const y = cg[o.status],
        N = o.specificObjectives.filter(
          (j) => g(j.activities) === 'completed'
        ).length,
        C = o.specificObjectives.length;
      return a.jsxs('section', {
        className: 'space-y-6',
        children: [
          a.jsxs(ne, {
            variant: 'ghost',
            onClick: w,
            className: 'text-muted-foreground hover:text-foreground -ml-2',
            children: [
              a.jsx(iS, { className: 'w-4 h-4 mr-2' }),
              'Volver a proyectos',
            ],
          }),
          a.jsxs('div', {
            className: 'bg-card/50 rounded-xl border border-border/50 p-6',
            children: [
              a.jsxs('div', {
                className:
                  'flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6',
                children: [
                  a.jsxs('div', {
                    className: 'flex-1',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center gap-3 mb-3',
                        children: [
                          a.jsx(Xt, {
                            className: y.className,
                            children: y.label,
                          }),
                          o.collaborators &&
                            a.jsxs('div', {
                              className:
                                'flex items-center gap-1.5 text-sm text-muted-foreground',
                              children: [
                                a.jsx(Do, { className: 'w-4 h-4' }),
                                o.collaborators,
                                ' colaboradores',
                              ],
                            }),
                        ],
                      }),
                      a.jsx('h2', {
                        className:
                          'text-xl md:text-2xl font-bold text-foreground mb-3',
                        children: o.title,
                      }),
                      a.jsx('p', {
                        className: 'text-muted-foreground leading-relaxed',
                        children: o.description,
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg shrink-0',
                    children: [
                      a.jsx(_t, { className: 'w-4 h-4' }),
                      a.jsxs('span', {
                        children: [
                          'Entrega: ',
                          new Date(o.dueDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              a.jsxs('div', {
                className: 'space-y-2',
                children: [
                  a.jsxs('div', {
                    className: 'flex items-center justify-between text-sm',
                    children: [
                      a.jsx('span', {
                        className: 'text-muted-foreground',
                        children: 'Progreso del proyecto',
                      }),
                      a.jsxs('span', {
                        className: 'text-accent font-medium',
                        children: [o.progress, '%'],
                      }),
                    ],
                  }),
                  a.jsx(Ad, { value: o.progress, className: 'h-2' }),
                ],
              }),
            ],
          }),
          a.jsxs(gA, {
            defaultValue: 'overview',
            className: 'space-y-4',
            children: [
              a.jsxs(ub, {
                className: 'bg-card/50 border border-border/50 p-1 h-auto',
                children: [
                  a.jsxs(io, {
                    value: 'overview',
                    className:
                      'data-[state=active]:bg-accent data-[state=active]:text-background gap-1.5 text-xs px-2.5 py-1.5',
                    children: [
                      a.jsx(Co, { className: 'w-3.5 h-3.5' }),
                      'Resumen',
                    ],
                  }),
                  a.jsxs(io, {
                    value: 'submissions',
                    className:
                      'data-[state=active]:bg-accent data-[state=active]:text-background gap-1.5 text-xs px-2.5 py-1.5',
                    children: [
                      a.jsx(no, { className: 'w-3.5 h-3.5' }),
                      'Entregas',
                    ],
                  }),
                  a.jsxs(io, {
                    value: 'feedback',
                    className:
                      'data-[state=active]:bg-accent data-[state=active]:text-background gap-1.5 text-xs px-2.5 py-1.5',
                    children: [
                      a.jsx(Us, { className: 'w-3.5 h-3.5' }),
                      'Retroalimentación',
                    ],
                  }),
                  a.jsxs(io, {
                    value: 'timeline',
                    className:
                      'data-[state=active]:bg-accent data-[state=active]:text-background gap-1.5 text-xs px-2.5 py-1.5',
                    children: [
                      a.jsx(_t, { className: 'w-3.5 h-3.5' }),
                      'Cronograma',
                    ],
                  }),
                  a.jsxs(io, {
                    value: 'code',
                    className:
                      'data-[state=active]:bg-accent data-[state=active]:text-background gap-1.5 text-xs px-2.5 py-1.5',
                    children: [
                      a.jsx(ld, { className: 'w-3.5 h-3.5' }),
                      'Código',
                    ],
                  }),
                ],
              }),
              a.jsxs(lo, {
                value: 'overview',
                className: 'space-y-4',
                children: [
                  a.jsx('div', {
                    className: 'flex justify-end',
                    children: a.jsxs(W3, {
                      children: [
                        a.jsx(U3, {
                          asChild: !0,
                          children: a.jsxs(ne, {
                            variant: 'ghost',
                            size: 'sm',
                            className:
                              'text-muted-foreground hover:text-foreground gap-2 h-8',
                            children: [
                              a.jsx(cd, { className: 'w-4 h-4' }),
                              'Agregar sección',
                            ],
                          }),
                        }),
                        a.jsxs(j2, {
                          align: 'end',
                          className: 'w-48 bg-card border-border/50',
                          children: [
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(Co, {
                                  className: 'w-4 h-4 text-blue-400',
                                }),
                                'Introducción',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(sh, {
                                  className: 'w-4 h-4 text-purple-400',
                                }),
                                'Justificación',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(Kc, {
                                  className: 'w-4 h-4 text-green-400',
                                }),
                                'Marco Teórico',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(nh, {
                                  className: 'w-4 h-4 text-amber-400',
                                }),
                                'Metodología',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(cx, {
                                  className: 'w-4 h-4 text-cyan-400',
                                }),
                                'Alcance',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className: 'cursor-pointer gap-2',
                              children: [
                                a.jsx(Do, {
                                  className: 'w-4 h-4 text-pink-400',
                                }),
                                'Equipo',
                              ],
                            }),
                            a.jsxs(Wn, {
                              className:
                                'cursor-pointer gap-2 border-t border-border/50 mt-1 pt-2',
                              onClick: () => r(!0),
                              children: [
                                a.jsx(jr, {
                                  className: 'w-4 h-4 text-muted-foreground',
                                }),
                                'Personalizar...',
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-4',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center',
                                children: a.jsx(bx, {
                                  className: 'w-4 h-4 text-red-400',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Problema',
                              }),
                            ],
                          }),
                          a.jsx(ne, {
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'h-8 w-8 text-muted-foreground hover:text-foreground',
                            children: a.jsx(jr, { className: 'w-4 h-4' }),
                          }),
                        ],
                      }),
                      a.jsx('p', {
                        className: 'text-muted-foreground leading-relaxed',
                        children: o.problem,
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-4',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center',
                                children: a.jsx(nh, {
                                  className: 'w-4 h-4 text-amber-400',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Requisitos',
                              }),
                            ],
                          }),
                          a.jsx(ne, {
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'h-8 w-8 text-muted-foreground hover:text-foreground',
                            children: a.jsx(jr, { className: 'w-4 h-4' }),
                          }),
                        ],
                      }),
                      a.jsx('ul', {
                        className: 'space-y-3',
                        children: o.requirements.map((j, S) =>
                          a.jsxs(
                            'li',
                            {
                              className:
                                'flex items-start gap-3 text-muted-foreground text-sm',
                              children: [
                                a.jsx('div', {
                                  className:
                                    'w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium shrink-0 mt-0.5',
                                  children: S + 1,
                                }),
                                j,
                              ],
                            },
                            S
                          )
                        ),
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-4',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center',
                                children: a.jsx(sh, {
                                  className: 'w-4 h-4 text-accent',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Objetivo General',
                              }),
                            ],
                          }),
                          a.jsx(ne, {
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'h-8 w-8 text-muted-foreground hover:text-foreground',
                            children: a.jsx(jr, { className: 'w-4 h-4' }),
                          }),
                        ],
                      }),
                      a.jsx('p', {
                        className: 'text-muted-foreground leading-relaxed',
                        children: o.generalObjective,
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-4',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center',
                                children: a.jsx(Kc, {
                                  className: 'w-4 h-4 text-blue-400',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Objetivos Específicos',
                              }),
                              a.jsxs('span', {
                                className: 'text-sm text-muted-foreground',
                                children: [N, '/', C, ' completados'],
                              }),
                            ],
                          }),
                          a.jsx(ne, {
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'h-8 w-8 text-muted-foreground hover:text-foreground',
                            children: a.jsx(jr, { className: 'w-4 h-4' }),
                          }),
                        ],
                      }),
                      a.jsx('div', {
                        className: 'space-y-3',
                        children: o.specificObjectives.map((j, S) => {
                          const k = g(j.activities),
                            M = ci[k],
                            D = i === j.id,
                            W = j.activities.filter(
                              (P) => P.status === 'completed'
                            ).length;
                          return a.jsxs(
                            'div',
                            {
                              className:
                                'border border-border/50 rounded-lg overflow-hidden',
                              children: [
                                a.jsxs(ag, {
                                  openDelay: 200,
                                  closeDelay: 100,
                                  children: [
                                    a.jsx(ig, {
                                      asChild: !0,
                                      children: a.jsxs('button', {
                                        onClick: () => l(D ? null : j.id),
                                        className:
                                          'w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left',
                                        children: [
                                          a.jsx('div', {
                                            className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${k === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`,
                                            children:
                                              k === 'completed'
                                                ? a.jsx(jo, {
                                                    className: 'w-4 h-4',
                                                  })
                                                : S + 1,
                                          }),
                                          a.jsx('span', {
                                            className: `flex-1 text-sm ${k === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`,
                                            children: j.title,
                                          }),
                                          a.jsxs('span', {
                                            className:
                                              'text-xs text-muted-foreground mr-2',
                                            children: [
                                              W,
                                              '/',
                                              j.activities.length,
                                              ' actividades',
                                            ],
                                          }),
                                          a.jsx(Xt, {
                                            className: `${M.className} text-xs`,
                                            children: M.label,
                                          }),
                                          D
                                            ? a.jsx(No, {
                                                className:
                                                  'w-4 h-4 text-muted-foreground',
                                              })
                                            : a.jsx(wn, {
                                                className:
                                                  'w-4 h-4 text-muted-foreground',
                                              }),
                                        ],
                                      }),
                                    }),
                                    a.jsx(_d, {
                                      side: 'right',
                                      align: 'start',
                                      className:
                                        'w-80 bg-card border-border/50 p-4',
                                      children: a.jsxs('div', {
                                        className: 'space-y-3',
                                        children: [
                                          a.jsxs('div', {
                                            children: [
                                              a.jsxs('h4', {
                                                className:
                                                  'font-semibold text-sm text-foreground mb-1',
                                                children: ['Objetivo ', S + 1],
                                              }),
                                              a.jsx('p', {
                                                className:
                                                  'text-xs text-muted-foreground',
                                                children: j.title,
                                              }),
                                            ],
                                          }),
                                          a.jsxs('div', {
                                            className:
                                              'border-t border-border/50 pt-3',
                                            children: [
                                              a.jsxs('span', {
                                                className:
                                                  'text-xs font-medium text-muted-foreground mb-2 block',
                                                children: [
                                                  'Actividades (',
                                                  j.activities.length,
                                                  ')',
                                                ],
                                              }),
                                              a.jsx('div', {
                                                className: 'space-y-2',
                                                children: j.activities.map(
                                                  (P, U) =>
                                                    a.jsxs(
                                                      'div',
                                                      {
                                                        className:
                                                          'bg-muted/30 rounded-md p-2',
                                                        children: [
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center gap-2 mb-1',
                                                            children: [
                                                              a.jsxs('span', {
                                                                className:
                                                                  'text-xs text-accent font-medium',
                                                                children: [
                                                                  U + 1,
                                                                  '.',
                                                                ],
                                                              }),
                                                              a.jsx('span', {
                                                                className:
                                                                  'text-xs text-foreground font-medium truncate',
                                                                children:
                                                                  P.title,
                                                              }),
                                                            ],
                                                          }),
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center gap-2 text-xs text-muted-foreground',
                                                            children: [
                                                              a.jsx(_t, {
                                                                className:
                                                                  'w-3 h-3',
                                                              }),
                                                              a.jsx('span', {
                                                                children: x(
                                                                  P.startDate,
                                                                  P.startTime
                                                                ),
                                                              }),
                                                              a.jsx('span', {
                                                                children: '-',
                                                              }),
                                                              a.jsx('span', {
                                                                children: x(
                                                                  P.endDate,
                                                                  P.endTime
                                                                ),
                                                              }),
                                                            ],
                                                          }),
                                                        ],
                                                      },
                                                      P.id
                                                    )
                                                ),
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                                D &&
                                  a.jsx('div', {
                                    className:
                                      'border-t border-border/50 bg-muted/20',
                                    children: j.activities.map((P, U) => {
                                      const _ = ci[P.status],
                                        Y = c === P.id;
                                      return a.jsxs(
                                        'div',
                                        {
                                          className: L(
                                            U !== j.activities.length - 1 &&
                                              'border-b border-border/30'
                                          ),
                                          children: [
                                            a.jsxs('button', {
                                              onClick: () => u(Y ? null : P.id),
                                              className:
                                                'w-full p-4 hover:bg-muted/30 transition-colors text-left',
                                              children: [
                                                a.jsxs('div', {
                                                  className:
                                                    'flex items-center gap-2 mb-1',
                                                  children: [
                                                    a.jsxs('span', {
                                                      className:
                                                        'text-xs text-muted-foreground',
                                                      children: [
                                                        'Actividad ',
                                                        U + 1,
                                                      ],
                                                    }),
                                                    a.jsx(Xt, {
                                                      className: `${_.className} text-xs`,
                                                      children: _.label,
                                                    }),
                                                  ],
                                                }),
                                                a.jsxs('div', {
                                                  className:
                                                    'flex items-center justify-between',
                                                  children: [
                                                    a.jsxs('div', {
                                                      className:
                                                        'flex items-center flex-wrap gap-x-3 gap-y-1',
                                                      children: [
                                                        a.jsx('h4', {
                                                          className:
                                                            'font-medium text-foreground text-sm',
                                                          children: P.title,
                                                        }),
                                                        a.jsxs('div', {
                                                          className:
                                                            'flex items-center gap-3 text-xs text-muted-foreground',
                                                          children: [
                                                            a.jsxs('span', {
                                                              className:
                                                                'flex items-center gap-1',
                                                              children: [
                                                                a.jsx(_t, {
                                                                  className:
                                                                    'w-3 h-3',
                                                                }),
                                                                x(
                                                                  P.startDate,
                                                                  P.startTime
                                                                ),
                                                              ],
                                                            }),
                                                            a.jsx('span', {
                                                              children: '-',
                                                            }),
                                                            a.jsxs('span', {
                                                              className:
                                                                'flex items-center gap-1',
                                                              children: [
                                                                a.jsx(Hr, {
                                                                  className:
                                                                    'w-3 h-3',
                                                                }),
                                                                x(
                                                                  P.endDate,
                                                                  P.endTime
                                                                ),
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                    a.jsxs('div', {
                                                      className:
                                                        'flex items-center gap-2',
                                                      children: [
                                                        !Y &&
                                                          !P.submission &&
                                                          P.status !==
                                                            'completed' &&
                                                          a.jsx(xd, {
                                                            children: a.jsxs(
                                                              jh,
                                                              {
                                                                children: [
                                                                  a.jsx(Ch, {
                                                                    asChild: !0,
                                                                    children:
                                                                      a.jsx(
                                                                        'span',
                                                                        {
                                                                          className:
                                                                            'bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse',
                                                                          children:
                                                                            'Entregar',
                                                                        }
                                                                      ),
                                                                  }),
                                                                  a.jsx(yd, {
                                                                    side: 'top',
                                                                    className:
                                                                      'bg-card border-border',
                                                                    children:
                                                                      a.jsx(
                                                                        'p',
                                                                        {
                                                                          className:
                                                                            'text-xs',
                                                                          children:
                                                                            'Pendiente de entrega',
                                                                        }
                                                                      ),
                                                                  }),
                                                                ],
                                                              }
                                                            ),
                                                          }),
                                                        Y
                                                          ? a.jsx(No, {
                                                              className:
                                                                'w-4 h-4 text-muted-foreground flex-shrink-0',
                                                            })
                                                          : a.jsx(wn, {
                                                              className:
                                                                'w-4 h-4 text-muted-foreground flex-shrink-0',
                                                            }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            Y &&
                                              a.jsxs('div', {
                                                className:
                                                  'px-4 pb-4 space-y-3',
                                                children: [
                                                  a.jsxs('div', {
                                                    className:
                                                      'bg-muted/30 rounded-lg p-3',
                                                    children: [
                                                      a.jsx('span', {
                                                        className:
                                                          'text-xs font-medium text-muted-foreground block mb-1',
                                                        children: 'Descripción',
                                                      }),
                                                      a.jsx('p', {
                                                        className:
                                                          'text-foreground text-sm',
                                                        children: P.description,
                                                      }),
                                                    ],
                                                  }),
                                                  P.submission
                                                    ? a.jsxs('div', {
                                                        className:
                                                          'bg-green-500/10 border border-green-500/20 rounded-lg p-3',
                                                        children: [
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center justify-between mb-2',
                                                            children: [
                                                              a.jsxs('span', {
                                                                className:
                                                                  'text-green-400 text-sm font-medium flex items-center gap-2',
                                                                children: [
                                                                  a.jsx(jo, {
                                                                    className:
                                                                      'w-4 h-4',
                                                                  }),
                                                                  'Entregado',
                                                                ],
                                                              }),
                                                              a.jsx('span', {
                                                                className:
                                                                  'text-xs text-muted-foreground',
                                                                children:
                                                                  P.submission
                                                                    .submittedAt &&
                                                                  new Date(
                                                                    P.submission
                                                                      .submittedAt
                                                                  ).toLocaleDateString(
                                                                    'es-ES',
                                                                    {
                                                                      day: 'numeric',
                                                                      month:
                                                                        'short',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute:
                                                                        '2-digit',
                                                                    }
                                                                  ),
                                                              }),
                                                            ],
                                                          }),
                                                          P.submission.file &&
                                                            a.jsxs('div', {
                                                              className:
                                                                'flex items-center gap-2 text-sm text-muted-foreground mb-2',
                                                              children: [
                                                                a.jsx(Co, {
                                                                  className:
                                                                    'w-4 h-4',
                                                                }),
                                                                P.submission
                                                                  .file,
                                                              ],
                                                            }),
                                                          P.submission
                                                            .feedback &&
                                                            a.jsxs('div', {
                                                              className:
                                                                'mt-2 pt-2 border-t border-green-500/20',
                                                              children: [
                                                                a.jsx('span', {
                                                                  className:
                                                                    'text-xs text-muted-foreground',
                                                                  children:
                                                                    'Retroalimentación:',
                                                                }),
                                                                a.jsx('p', {
                                                                  className:
                                                                    'text-sm text-foreground mt-1',
                                                                  children:
                                                                    P.submission
                                                                      .feedback,
                                                                }),
                                                              ],
                                                            }),
                                                        ],
                                                      })
                                                    : a.jsxs('div', {
                                                        className:
                                                          'bg-muted/30 rounded-lg p-3',
                                                        children: [
                                                          a.jsx('span', {
                                                            className:
                                                              'text-xs font-medium text-muted-foreground block mb-2',
                                                            children: 'Entrega',
                                                          }),
                                                          a.jsxs(ne, {
                                                            size: 'sm',
                                                            className:
                                                              'bg-accent hover:bg-accent/90 text-background',
                                                            disabled:
                                                              P.status ===
                                                              'pending',
                                                            children: [
                                                              a.jsx(no, {
                                                                className:
                                                                  'w-4 h-4 mr-2',
                                                              }),
                                                              'Subir entregable',
                                                            ],
                                                          }),
                                                        ],
                                                      }),
                                                ],
                                              }),
                                          ],
                                        },
                                        P.id
                                      );
                                    }),
                                  }),
                              ],
                            },
                            j.id
                          );
                        }),
                      }),
                    ],
                  }),
                  a.jsx(ng, {
                    objectives: o.specificObjectives,
                    projectEndDate: o.dueDate,
                  }),
                ],
              }),
              a.jsxs(lo, {
                value: 'submissions',
                className: 'space-y-4',
                children: [
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-4',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center',
                                children: a.jsx(Kc, {
                                  className: 'w-4 h-4 text-blue-400',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Entregas por Objetivo',
                              }),
                              a.jsxs('span', {
                                className: 'text-sm text-muted-foreground',
                                children: [N, '/', C, ' completados'],
                              }),
                            ],
                          }),
                          a.jsx(ne, {
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'h-8 w-8 text-muted-foreground hover:text-foreground',
                            children: a.jsx(jr, { className: 'w-4 h-4' }),
                          }),
                        ],
                      }),
                      a.jsx('div', {
                        className: 'space-y-3',
                        children: o.specificObjectives.map((j, S) => {
                          const k = g(j.activities),
                            M = ci[k],
                            D = i === j.id,
                            W = j.activities.filter(
                              (P) => P.status === 'completed'
                            ).length;
                          return a.jsxs(
                            'div',
                            {
                              className:
                                'border border-border/50 rounded-lg overflow-hidden',
                              children: [
                                a.jsxs(ag, {
                                  openDelay: 200,
                                  closeDelay: 100,
                                  children: [
                                    a.jsx(ig, {
                                      asChild: !0,
                                      children: a.jsxs('button', {
                                        onClick: () => l(D ? null : j.id),
                                        className:
                                          'w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left',
                                        children: [
                                          a.jsx('div', {
                                            className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${k === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`,
                                            children:
                                              k === 'completed'
                                                ? a.jsx(jo, {
                                                    className: 'w-4 h-4',
                                                  })
                                                : S + 1,
                                          }),
                                          a.jsx('span', {
                                            className: `flex-1 text-sm ${k === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`,
                                            children: j.title,
                                          }),
                                          a.jsxs('span', {
                                            className:
                                              'text-xs text-muted-foreground mr-2',
                                            children: [
                                              W,
                                              '/',
                                              j.activities.length,
                                              ' actividades',
                                            ],
                                          }),
                                          a.jsx(Xt, {
                                            className: `${M.className} text-xs`,
                                            children: M.label,
                                          }),
                                          D
                                            ? a.jsx(No, {
                                                className:
                                                  'w-4 h-4 text-muted-foreground',
                                              })
                                            : a.jsx(wn, {
                                                className:
                                                  'w-4 h-4 text-muted-foreground',
                                              }),
                                        ],
                                      }),
                                    }),
                                    a.jsx(_d, {
                                      side: 'right',
                                      align: 'start',
                                      className:
                                        'w-80 bg-card border-border/50 p-4',
                                      children: a.jsxs('div', {
                                        className: 'space-y-3',
                                        children: [
                                          a.jsxs('div', {
                                            children: [
                                              a.jsxs('h4', {
                                                className:
                                                  'font-semibold text-sm text-foreground mb-1',
                                                children: ['Objetivo ', S + 1],
                                              }),
                                              a.jsx('p', {
                                                className:
                                                  'text-xs text-muted-foreground',
                                                children: j.title,
                                              }),
                                            ],
                                          }),
                                          a.jsxs('div', {
                                            className:
                                              'border-t border-border/50 pt-3',
                                            children: [
                                              a.jsxs('span', {
                                                className:
                                                  'text-xs font-medium text-muted-foreground mb-2 block',
                                                children: [
                                                  'Actividades (',
                                                  j.activities.length,
                                                  ')',
                                                ],
                                              }),
                                              a.jsx('div', {
                                                className: 'space-y-2',
                                                children: j.activities.map(
                                                  (P, U) =>
                                                    a.jsxs(
                                                      'div',
                                                      {
                                                        className:
                                                          'bg-muted/30 rounded-md p-2',
                                                        children: [
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center gap-2 mb-1',
                                                            children: [
                                                              a.jsxs('span', {
                                                                className:
                                                                  'text-xs text-accent font-medium',
                                                                children: [
                                                                  U + 1,
                                                                  '.',
                                                                ],
                                                              }),
                                                              a.jsx('span', {
                                                                className:
                                                                  'text-xs text-foreground font-medium truncate',
                                                                children:
                                                                  P.title,
                                                              }),
                                                            ],
                                                          }),
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center gap-2 text-xs text-muted-foreground',
                                                            children: [
                                                              a.jsx(_t, {
                                                                className:
                                                                  'w-3 h-3',
                                                              }),
                                                              a.jsx('span', {
                                                                children: x(
                                                                  P.startDate,
                                                                  P.startTime
                                                                ),
                                                              }),
                                                              a.jsx('span', {
                                                                children: '-',
                                                              }),
                                                              a.jsx('span', {
                                                                children: x(
                                                                  P.endDate,
                                                                  P.endTime
                                                                ),
                                                              }),
                                                            ],
                                                          }),
                                                        ],
                                                      },
                                                      P.id
                                                    )
                                                ),
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    }),
                                  ],
                                }),
                                D &&
                                  a.jsx('div', {
                                    className:
                                      'border-t border-border/50 bg-muted/20',
                                    children: j.activities.map((P, U) => {
                                      const _ = ci[P.status],
                                        Y = c === P.id;
                                      return a.jsxs(
                                        'div',
                                        {
                                          className: L(
                                            U !== j.activities.length - 1 &&
                                              'border-b border-border/30'
                                          ),
                                          children: [
                                            a.jsxs('button', {
                                              onClick: () => u(Y ? null : P.id),
                                              className:
                                                'w-full p-4 hover:bg-muted/30 transition-colors text-left',
                                              children: [
                                                a.jsxs('div', {
                                                  className:
                                                    'flex items-center gap-2 mb-1',
                                                  children: [
                                                    a.jsxs('span', {
                                                      className:
                                                        'text-xs text-muted-foreground',
                                                      children: [
                                                        'Actividad ',
                                                        U + 1,
                                                      ],
                                                    }),
                                                    a.jsx(Xt, {
                                                      className: `${_.className} text-xs`,
                                                      children: _.label,
                                                    }),
                                                  ],
                                                }),
                                                a.jsxs('div', {
                                                  className:
                                                    'flex items-center justify-between',
                                                  children: [
                                                    a.jsxs('div', {
                                                      className:
                                                        'flex items-center flex-wrap gap-x-3 gap-y-1',
                                                      children: [
                                                        a.jsx('h4', {
                                                          className:
                                                            'font-medium text-foreground text-sm',
                                                          children: P.title,
                                                        }),
                                                        a.jsxs('div', {
                                                          className:
                                                            'flex items-center gap-3 text-xs text-muted-foreground',
                                                          children: [
                                                            a.jsxs('span', {
                                                              className:
                                                                'flex items-center gap-1',
                                                              children: [
                                                                a.jsx(_t, {
                                                                  className:
                                                                    'w-3 h-3',
                                                                }),
                                                                x(
                                                                  P.startDate,
                                                                  P.startTime
                                                                ),
                                                              ],
                                                            }),
                                                            a.jsx('span', {
                                                              children: '-',
                                                            }),
                                                            a.jsxs('span', {
                                                              className:
                                                                'flex items-center gap-1',
                                                              children: [
                                                                a.jsx(Hr, {
                                                                  className:
                                                                    'w-3 h-3',
                                                                }),
                                                                x(
                                                                  P.endDate,
                                                                  P.endTime
                                                                ),
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                    a.jsxs('div', {
                                                      className:
                                                        'flex items-center gap-2',
                                                      children: [
                                                        !Y &&
                                                          !P.submission &&
                                                          P.status !==
                                                            'completed' &&
                                                          a.jsx(xd, {
                                                            children: a.jsxs(
                                                              jh,
                                                              {
                                                                children: [
                                                                  a.jsx(Ch, {
                                                                    asChild: !0,
                                                                    children:
                                                                      a.jsx(
                                                                        'span',
                                                                        {
                                                                          className:
                                                                            'bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse',
                                                                          children:
                                                                            'Entregar',
                                                                        }
                                                                      ),
                                                                  }),
                                                                  a.jsx(yd, {
                                                                    side: 'top',
                                                                    className:
                                                                      'bg-card border-border',
                                                                    children:
                                                                      a.jsx(
                                                                        'p',
                                                                        {
                                                                          className:
                                                                            'text-xs',
                                                                          children:
                                                                            'Pendiente de entrega',
                                                                        }
                                                                      ),
                                                                  }),
                                                                ],
                                                              }
                                                            ),
                                                          }),
                                                        Y
                                                          ? a.jsx(No, {
                                                              className:
                                                                'w-4 h-4 text-muted-foreground flex-shrink-0',
                                                            })
                                                          : a.jsx(wn, {
                                                              className:
                                                                'w-4 h-4 text-muted-foreground flex-shrink-0',
                                                            }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            Y &&
                                              a.jsxs('div', {
                                                className:
                                                  'px-4 pb-4 space-y-3',
                                                children: [
                                                  a.jsxs('div', {
                                                    className:
                                                      'bg-muted/30 rounded-lg p-3',
                                                    children: [
                                                      a.jsx('span', {
                                                        className:
                                                          'text-xs font-medium text-muted-foreground block mb-1',
                                                        children: 'Descripción',
                                                      }),
                                                      a.jsx('p', {
                                                        className:
                                                          'text-foreground text-sm',
                                                        children: P.description,
                                                      }),
                                                    ],
                                                  }),
                                                  P.submission
                                                    ? a.jsxs('div', {
                                                        className:
                                                          'bg-green-500/10 border border-green-500/20 rounded-lg p-3',
                                                        children: [
                                                          a.jsxs('div', {
                                                            className:
                                                              'flex items-center justify-between mb-2',
                                                            children: [
                                                              a.jsxs('span', {
                                                                className:
                                                                  'text-green-400 text-sm font-medium flex items-center gap-2',
                                                                children: [
                                                                  a.jsx(jo, {
                                                                    className:
                                                                      'w-4 h-4',
                                                                  }),
                                                                  'Entregado',
                                                                ],
                                                              }),
                                                              a.jsx('span', {
                                                                className:
                                                                  'text-xs text-muted-foreground',
                                                                children:
                                                                  P.submission
                                                                    .submittedAt &&
                                                                  new Date(
                                                                    P.submission
                                                                      .submittedAt
                                                                  ).toLocaleDateString(
                                                                    'es-ES',
                                                                    {
                                                                      day: 'numeric',
                                                                      month:
                                                                        'short',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute:
                                                                        '2-digit',
                                                                    }
                                                                  ),
                                                              }),
                                                            ],
                                                          }),
                                                          P.submission.file &&
                                                            a.jsxs('div', {
                                                              className:
                                                                'flex items-center gap-2 text-sm text-muted-foreground mb-2',
                                                              children: [
                                                                a.jsx(Co, {
                                                                  className:
                                                                    'w-4 h-4',
                                                                }),
                                                                P.submission
                                                                  .file,
                                                              ],
                                                            }),
                                                          P.submission
                                                            .feedback &&
                                                            a.jsxs('div', {
                                                              className:
                                                                'mt-2 pt-2 border-t border-green-500/20',
                                                              children: [
                                                                a.jsx('span', {
                                                                  className:
                                                                    'text-xs text-muted-foreground',
                                                                  children:
                                                                    'Retroalimentación:',
                                                                }),
                                                                a.jsx('p', {
                                                                  className:
                                                                    'text-sm text-foreground mt-1',
                                                                  children:
                                                                    P.submission
                                                                      .feedback,
                                                                }),
                                                              ],
                                                            }),
                                                        ],
                                                      })
                                                    : a.jsxs('div', {
                                                        className:
                                                          'bg-muted/30 rounded-lg p-3',
                                                        children: [
                                                          a.jsx('span', {
                                                            className:
                                                              'text-xs font-medium text-muted-foreground block mb-2',
                                                            children: 'Entrega',
                                                          }),
                                                          a.jsxs(ne, {
                                                            size: 'sm',
                                                            className:
                                                              'bg-accent hover:bg-accent/90 text-background',
                                                            disabled:
                                                              P.status ===
                                                              'pending',
                                                            children: [
                                                              a.jsx(no, {
                                                                className:
                                                                  'w-4 h-4 mr-2',
                                                              }),
                                                              'Subir entregable',
                                                            ],
                                                          }),
                                                        ],
                                                      }),
                                                ],
                                              }),
                                          ],
                                        },
                                        P.id
                                      );
                                    }),
                                  }),
                              ],
                            },
                            j.id
                          );
                        }),
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'bg-card/50 rounded-xl border border-border/50 p-5',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between mb-6',
                        children: [
                          a.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              a.jsx('div', {
                                className:
                                  'w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center',
                                children: a.jsx(no, {
                                  className: 'w-4 h-4 text-purple-400',
                                }),
                              }),
                              a.jsx('h3', {
                                className:
                                  'text-lg font-semibold text-foreground',
                                children: 'Historial de entregas generales',
                              }),
                            ],
                          }),
                          a.jsxs('div', {
                            className: 'flex items-center gap-2',
                            children: [
                              a.jsx(ne, {
                                variant: 'ghost',
                                size: 'icon',
                                className:
                                  'h-8 w-8 text-muted-foreground hover:text-foreground',
                                children: a.jsx(jr, { className: 'w-4 h-4' }),
                              }),
                              a.jsxs(ne, {
                                size: 'sm',
                                className:
                                  'bg-accent hover:bg-accent/90 text-background',
                                children: [
                                  a.jsx(no, { className: 'w-4 h-4 mr-2' }),
                                  'Nueva entrega',
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      o.submissions && o.submissions.length > 0
                        ? a.jsx('div', {
                            className: 'space-y-3',
                            children: o.submissions.map((j, S) =>
                              a.jsxs(
                                'div',
                                {
                                  className:
                                    'bg-muted/30 rounded-lg p-4 border border-border/50',
                                  children: [
                                    a.jsxs('div', {
                                      className:
                                        'flex items-center justify-between mb-2',
                                      children: [
                                        a.jsx('span', {
                                          className:
                                            'font-medium text-foreground text-sm',
                                          children: j.type,
                                        }),
                                        a.jsx('span', {
                                          className:
                                            'text-xs text-muted-foreground',
                                          children: new Date(
                                            j.date
                                          ).toLocaleDateString('es-ES'),
                                        }),
                                      ],
                                    }),
                                    a.jsx('p', {
                                      className:
                                        'text-muted-foreground text-sm',
                                      children: j.feedback,
                                    }),
                                  ],
                                },
                                S
                              )
                            ),
                          })
                        : a.jsxs('div', {
                            className:
                              'text-center py-10 text-muted-foreground',
                            children: [
                              a.jsx(no, {
                                className: 'w-10 h-10 mx-auto mb-3 opacity-50',
                              }),
                              a.jsx('p', {
                                className: 'text-sm',
                                children:
                                  'Aún no hay entregas generales para este proyecto',
                              }),
                            ],
                          }),
                    ],
                  }),
                ],
              }),
              a.jsx(lo, {
                value: 'feedback',
                children: a.jsxs('div', {
                  className:
                    'bg-card/50 rounded-xl border border-border/50 p-5',
                  children: [
                    a.jsx('h3', {
                      className: 'text-lg font-semibold text-foreground mb-6',
                      children: 'Retroalimentación del educador',
                    }),
                    o.submissions && o.submissions.length > 0
                      ? a.jsx('div', {
                          className: 'space-y-4',
                          children: o.submissions.map((j, S) =>
                            a.jsxs(
                              'div',
                              {
                                className: 'flex gap-3',
                                children: [
                                  a.jsx('div', {
                                    className:
                                      'w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0',
                                    children: a.jsx(Us, {
                                      className: 'w-4 h-4 text-accent',
                                    }),
                                  }),
                                  a.jsxs('div', {
                                    className:
                                      'flex-1 bg-muted/30 rounded-lg p-4 border border-border/50',
                                    children: [
                                      a.jsxs('div', {
                                        className:
                                          'flex items-center gap-2 mb-2',
                                        children: [
                                          a.jsx('span', {
                                            className:
                                              'font-medium text-foreground text-sm',
                                            children: 'Educador',
                                          }),
                                          a.jsx('span', {
                                            className:
                                              'text-xs text-muted-foreground',
                                            children: new Date(
                                              j.date
                                            ).toLocaleDateString('es-ES'),
                                          }),
                                        ],
                                      }),
                                      a.jsx('p', {
                                        className:
                                          'text-muted-foreground text-sm',
                                        children: j.feedback,
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              S
                            )
                          ),
                        })
                      : a.jsxs('div', {
                          className: 'text-center py-10 text-muted-foreground',
                          children: [
                            a.jsx(Us, {
                              className: 'w-10 h-10 mx-auto mb-3 opacity-50',
                            }),
                            a.jsx('p', {
                              className: 'text-sm',
                              children: 'Aún no hay retroalimentación',
                            }),
                          ],
                        }),
                  ],
                }),
              }),
              a.jsx(lo, {
                value: 'timeline',
                children: a.jsx(ng, {
                  objectives: o.specificObjectives,
                  projectEndDate: o.dueDate,
                }),
              }),
              a.jsx(lo, {
                value: 'code',
                children: a.jsxs('div', {
                  className:
                    'bg-card/50 rounded-xl border border-border/50 p-5',
                  children: [
                    a.jsx('h3', {
                      className: 'text-lg font-semibold text-foreground mb-4',
                      children: 'Editor de código',
                    }),
                    a.jsxs('div', {
                      className:
                        'bg-[#1e1e1e] rounded-lg p-6 font-mono text-sm text-gray-300 min-h-[300px] border border-border/50',
                      children: [
                        a.jsxs('div', {
                          className:
                            'flex items-center gap-2 text-muted-foreground mb-4',
                          children: [
                            a.jsx(ld, { className: 'w-5 h-5' }),
                            a.jsx('span', {
                              children:
                                'Próximamente: Editor de código integrado',
                            }),
                          ],
                        }),
                        a.jsx('p', {
                          className: 'text-muted-foreground text-sm',
                          children:
                            'Aquí podrás escribir y ejecutar código directamente.',
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      });
    }
    return a.jsxs('section', {
      className: 'space-y-6',
      children: [
        a.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            a.jsxs('div', {
              className: 'flex items-center gap-3',
              children: [
                a.jsx('div', {
                  className:
                    'w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center',
                  children: a.jsx(hS, { className: 'w-5 h-5 text-accent' }),
                }),
                a.jsxs('div', {
                  children: [
                    a.jsx('h2', {
                      className: 'text-xl font-semibold text-foreground',
                      children: 'Proyectos del Curso',
                    }),
                    a.jsx('p', {
                      className: 'text-sm text-muted-foreground',
                      children: 'Crea y gestiona tus proyectos prácticos',
                    }),
                  ],
                }),
              ],
            }),
            a.jsxs(ne, {
              onClick: () => t(!0),
              className:
                'bg-accent hover:bg-accent/90 text-accent-foreground gap-2',
              children: [a.jsx(cd, { className: 'w-4 h-4' }), 'Crear Proyecto'],
            }),
          ],
        }),
        a.jsx('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
          children: Q3.map((y) => {
            const N = cg[y.status],
              C = N.icon;
            return a.jsxs(
              'div',
              {
                className:
                  'group bg-card/50 border border-border/50 rounded-xl p-5 hover:bg-card/80 hover:border-border transition-all duration-200 cursor-pointer',
                onClick: () => v(y),
                children: [
                  a.jsxs('div', {
                    className: 'flex items-start justify-between mb-3',
                    children: [
                      a.jsx('h3', {
                        className:
                          'font-semibold text-foreground group-hover:text-accent transition-colors flex-1 pr-3',
                        children: y.title,
                      }),
                      a.jsxs(Xt, {
                        className: N.className,
                        children: [
                          a.jsx(C, { className: 'w-3 h-3 mr-1' }),
                          N.label,
                        ],
                      }),
                    ],
                  }),
                  a.jsx('p', {
                    className:
                      'text-muted-foreground text-sm mb-4 line-clamp-2',
                    children: y.description,
                  }),
                  a.jsxs('div', {
                    className: 'space-y-2 mb-4',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center justify-between text-xs',
                        children: [
                          a.jsx('span', {
                            className: 'text-muted-foreground',
                            children: 'Progreso',
                          }),
                          a.jsxs('span', {
                            className: 'text-accent font-medium',
                            children: [y.progress, '%'],
                          }),
                        ],
                      }),
                      a.jsx(Ad, { value: y.progress, className: 'h-1.5' }),
                    ],
                  }),
                  a.jsxs('div', {
                    className:
                      'flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50',
                    children: [
                      a.jsxs('div', {
                        className: 'flex items-center gap-1.5',
                        children: [
                          a.jsx(_t, { className: 'w-3.5 h-3.5' }),
                          a.jsx('span', {
                            children: new Date(y.dueDate).toLocaleDateString(
                              'es-ES',
                              { day: 'numeric', month: 'short' }
                            ),
                          }),
                        ],
                      }),
                      y.collaborators &&
                        a.jsxs('div', {
                          className: 'flex items-center gap-1.5',
                          children: [
                            a.jsx(Do, { className: 'w-3.5 h-3.5' }),
                            a.jsx('span', { children: y.collaborators }),
                          ],
                        }),
                      a.jsxs('div', {
                        className:
                          'flex items-center gap-1 text-accent group-hover:translate-x-0.5 transition-transform',
                        children: [
                          a.jsx('span', { children: 'Entrar' }),
                          a.jsx(mx, { className: 'w-3.5 h-3.5' }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              y.id
            );
          }),
        }),
        a.jsx(rg, {
          open: e,
          onOpenChange: t,
          children: a.jsxs(Td, {
            className: 'bg-card border-border max-w-md',
            children: [
              a.jsxs(Rd, {
                children: [
                  a.jsx(Dd, {
                    className: 'text-foreground',
                    children: 'Crear nuevo proyecto',
                  }),
                  a.jsx(Md, {
                    className: 'text-muted-foreground',
                    children:
                      'Define los detalles de tu nuevo proyecto práctico.',
                  }),
                ],
              }),
              a.jsxs('div', {
                className: 'space-y-4 pt-4',
                children: [
                  a.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      a.jsx(Ts, {
                        htmlFor: 'title',
                        className: 'text-foreground',
                        children: 'Título del proyecto',
                      }),
                      a.jsx(cl, {
                        id: 'title',
                        placeholder: 'Ej: Landing Page para E-commerce',
                        value: f.title,
                        onChange: (y) => m({ ...f, title: y.target.value }),
                        className: 'bg-muted/30 border-border',
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      a.jsx(Ts, {
                        htmlFor: 'description',
                        className: 'text-foreground',
                        children: 'Descripción',
                      }),
                      a.jsx(ml, {
                        id: 'description',
                        placeholder:
                          'Describe el objetivo y alcance del proyecto...',
                        value: f.description,
                        onChange: (y) =>
                          m({ ...f, description: y.target.value }),
                        className: 'bg-muted/30 border-border min-h-[100px]',
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className: 'flex justify-end gap-3 pt-4',
                    children: [
                      a.jsx(ne, {
                        variant: 'outline',
                        onClick: () => t(!1),
                        children: 'Cancelar',
                      }),
                      a.jsx(ne, {
                        onClick: b,
                        className:
                          'bg-accent hover:bg-accent/90 text-accent-foreground',
                        disabled: !f.title.trim(),
                        children: 'Crear Proyecto',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        a.jsx(rg, {
          open: n,
          onOpenChange: r,
          children: a.jsxs(Td, {
            className: 'bg-card border-border/50 max-w-md',
            children: [
              a.jsxs(Rd, {
                children: [
                  a.jsx(Dd, {
                    className: 'text-foreground',
                    children: 'Nueva sección personalizada',
                  }),
                  a.jsx(Md, {
                    className: 'text-muted-foreground',
                    children:
                      'Crea una sección con el nombre y contenido que necesites.',
                  }),
                ],
              }),
              a.jsxs('div', {
                className: 'space-y-4 pt-4',
                children: [
                  a.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      a.jsx(Ts, {
                        htmlFor: 'section-name',
                        className: 'text-foreground',
                        children: 'Nombre de la sección',
                      }),
                      a.jsx(cl, {
                        id: 'section-name',
                        placeholder:
                          'Ej: Introducción, Justificación, Antecedentes...',
                        value: p.name,
                        onChange: (y) =>
                          h((N) => ({ ...N, name: y.target.value })),
                        className: 'bg-muted/50 border-border/50',
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      a.jsx(Ts, {
                        htmlFor: 'section-description',
                        className: 'text-foreground',
                        children: 'Descripción',
                      }),
                      a.jsx(ml, {
                        id: 'section-description',
                        placeholder: 'Escribe el contenido de esta sección...',
                        value: p.description,
                        onChange: (y) =>
                          h((N) => ({ ...N, description: y.target.value })),
                        className:
                          'bg-muted/50 border-border/50 min-h-[120px] resize-none',
                      }),
                    ],
                  }),
                  a.jsxs('div', {
                    className: 'flex justify-end gap-3 pt-2',
                    children: [
                      a.jsx(ne, {
                        variant: 'outline',
                        onClick: () => {
                          (r(!1), h({ name: '', description: '' }));
                        },
                        children: 'Cancelar',
                      }),
                      a.jsx(ne, {
                        onClick: () => {
                          (console.log('Creating custom section:', p),
                            r(!1),
                            h({ name: '', description: '' }));
                        },
                        className:
                          'bg-accent hover:bg-accent/90 text-accent-foreground',
                        disabled: !p.name.trim(),
                        children: 'Agregar sección',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  },
  X3 = {
    id: 'course-001',
    slug: 'programacion-frontend-semana',
    title: 'Programación Frontend con React',
    subtitle:
      'Domina React, TypeScript y construye aplicaciones web profesionales desde cero hasta producción',
    area: 'Desarrollo Web',
    level: 'Intermedio',
    modality: 'Sincrónica · Virtual Semana',
    campus: 'Virtual',
    schedule: 'Lunes a Viernes · 7:00 p.m. - 9:00 p.m.',
    startDate: new Date('2025-02-01'),
    durationHours: 40,
    practiceHours: 25,
    classesCount: 32,
    plan: 'ProIncluido',
    price: 45e4,
    rating: 4.8,
    reviewsCount: 234,
    studentsCount: 1520,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    trailerUrl: void 0,
    educator: {
      name: 'Carlos Mendoza',
      role: 'Senior Frontend Engineer en Google',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Más de 10 años de experiencia en desarrollo web. He trabajado en startups y grandes empresas como Google y Meta. Apasionado por enseñar y compartir conocimiento.',
    },
    whatYouWillLearn: [
      'Fundamentos sólidos de React y su ecosistema moderno',
      'TypeScript aplicado a proyectos reales de frontend',
      'Gestión de estado con Context API y React Query',
      'Estilos modernos con TailwindCSS y CSS-in-JS',
      'Testing con Jest y React Testing Library',
      'Optimización de rendimiento y mejores prácticas',
      'Deploy a producción con Vercel y configuración de CI/CD',
      'Integración con APIs REST y GraphQL',
    ],
    whatYouWillBuild: [
      'Landing page responsive con animaciones fluidas',
      'Dashboard de administración con gráficas interactivas',
      'E-commerce completo con carrito y pasarela de pagos',
      'Aplicación con autenticación y roles de usuario',
      'Portafolio profesional listo para mostrar a empleadores',
    ],
    spacesIncluded: [
      'Comunidad privada de estudiantes',
      'Foros de dudas con respuesta en 24h',
      'Sesiones en vivo de Q&A semanales',
      'Asistente con IA para el curso',
      'Acceso a grabaciones por 1 año',
      'Certificado digital verificable',
    ],
    modules: [
      {
        title: 'Fundamentos de React',
        description: 'Aprende los conceptos base de React desde cero',
        lessons: [
          { title: 'Introducción a React y su filosofía', duration: '15 min' },
          { title: 'JSX y el Virtual DOM', duration: '20 min' },
          { title: 'Componentes funcionales y props', duration: '25 min' },
          { title: 'Estado con useState', duration: '30 min' },
          { title: 'Efectos con useEffect', duration: '25 min' },
        ],
      },
      {
        title: 'TypeScript para React',
        description: 'Tipado estático para aplicaciones robustas',
        lessons: [
          { title: 'Introducción a TypeScript', duration: '20 min' },
          { title: 'Tipos básicos y interfaces', duration: '25 min' },
          { title: 'Tipando componentes React', duration: '30 min' },
          { title: 'Generics y utilidades avanzadas', duration: '35 min' },
        ],
      },
      {
        title: 'Estilos y UI Components',
        description: 'Crea interfaces atractivas y consistentes',
        lessons: [
          { title: 'TailwindCSS desde cero', duration: '25 min' },
          { title: 'Componentes reutilizables', duration: '30 min' },
          { title: 'Animaciones y transiciones', duration: '20 min' },
          { title: 'Diseño responsivo avanzado', duration: '25 min' },
        ],
      },
      {
        title: 'Gestión de Estado',
        description: 'Maneja el estado de tu aplicación eficientemente',
        lessons: [
          { title: 'Context API y useReducer', duration: '30 min' },
          { title: 'React Query para datos del servidor', duration: '35 min' },
          { title: 'Zustand como alternativa ligera', duration: '25 min' },
          { title: 'Patrones de estado avanzados', duration: '30 min' },
        ],
      },
      {
        title: 'Proyecto Final: E-commerce',
        description: 'Aplica todo lo aprendido en un proyecto real',
        lessons: [
          { title: 'Planificación y arquitectura', duration: '20 min' },
          { title: 'Implementación del catálogo', duration: '45 min' },
          { title: 'Carrito de compras y checkout', duration: '50 min' },
          { title: 'Autenticación y perfiles', duration: '40 min' },
          { title: 'Deploy y optimización', duration: '30 min' },
        ],
      },
    ],
    faqs: [
      {
        question: '¿Necesito experiencia previa en programación?',
        answer:
          'Se recomienda tener conocimientos básicos de HTML, CSS y JavaScript. Si eres principiante total, te recomendamos tomar primero nuestro curso de fundamentos web.',
      },
      {
        question: '¿Qué pasa si no puedo asistir a una clase en vivo?',
        answer:
          'Todas las clases quedan grabadas y disponibles en la plataforma dentro de las 24 horas siguientes. Puedes verlas cuando quieras durante tu acceso al curso.',
      },
      {
        question: '¿El curso incluye certificado?',
        answer:
          'Sí, al completar el 80% del curso y aprobar el proyecto final, recibirás un certificado digital verificable que puedes compartir en LinkedIn.',
      },
      {
        question: '¿Puedo acceder al curso si tengo el plan PRO?',
        answer:
          '¡Exacto! Este curso está incluido en el plan PRO sin costo adicional. Si ya eres suscriptor PRO, puedes empezar inmediatamente.',
      },
      {
        question: '¿Hay soporte si me quedo atascado?',
        answer:
          'Absolutamente. Tienes acceso a foros de dudas con respuesta en menos de 24 horas, sesiones de Q&A en vivo cada semana, y nuestro asistente con IA disponible 24/7.',
      },
    ],
    liveSessions: [
      {
        id: 'live-1',
        title: 'Clase en vivo: Introducción a React',
        date: '15 de Diciembre, 2025',
        time: '7:00 p.m.',
        duration: '2 horas',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        isLive: !0,
      },
      {
        id: 'live-2',
        title: 'Q&A: Dudas sobre componentes y props',
        date: '17 de Diciembre, 2025',
        time: '7:00 p.m.',
        duration: '1 hora',
        meetingUrl: 'https://meet.google.com/xyz-uvwx-yz',
        isLive: !1,
      },
    ],
  },
  C2 = d.forwardRef(({ ...e }, t) =>
    a.jsx('nav', { ref: t, 'aria-label': 'breadcrumb', ...e })
  );
C2.displayName = 'Breadcrumb';
const S2 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx('ol', {
    ref: n,
    className: L(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      e
    ),
    ...t,
  })
);
S2.displayName = 'BreadcrumbList';
const Ds = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx('li', {
    ref: n,
    className: L('inline-flex items-center gap-1.5', e),
    ...t,
  })
);
Ds.displayName = 'BreadcrumbItem';
const Pi = d.forwardRef(({ asChild: e, className: t, ...n }, r) => {
  const o = e ? A0 : 'a';
  return a.jsx(o, {
    ref: r,
    className: L('transition-colors hover:text-foreground', t),
    ...n,
  });
});
Pi.displayName = 'BreadcrumbLink';
const E2 = d.forwardRef(({ className: e, ...t }, n) =>
  a.jsx('span', {
    ref: n,
    role: 'link',
    'aria-disabled': 'true',
    'aria-current': 'page',
    className: L('font-normal text-foreground', e),
    ...t,
  })
);
E2.displayName = 'BreadcrumbPage';
const Ti = ({ children: e, className: t, ...n }) =>
  a.jsx('li', {
    role: 'presentation',
    'aria-hidden': 'true',
    className: L('[&>svg]:size-3.5', t),
    ...n,
    children: e ?? a.jsx(wn, {}),
  });
Ti.displayName = 'BreadcrumbSeparator';
const Z3 = () => {
    kT();
    const [e, t] = d.useState('curso'),
      n = X3;
    return a.jsxs('div', {
      className: 'min-h-screen bg-background',
      children: [
        a.jsx(By, {}),
        a.jsxs('main', {
          className: 'max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8',
          children: [
            a.jsx(C2, {
              className: 'mb-6 text-xs',
              children: a.jsxs(S2, {
                children: [
                  a.jsx(Ds, {
                    children: a.jsx(Pi, {
                      asChild: !0,
                      children: a.jsx(Fr, { to: '/', children: 'Inicio' }),
                    }),
                  }),
                  a.jsx(Ti, {}),
                  a.jsx(Ds, {
                    children: a.jsx(Pi, {
                      asChild: !0,
                      children: a.jsx(Fr, {
                        to: '/cursos',
                        children: 'Cursos',
                      }),
                    }),
                  }),
                  a.jsx(Ti, {}),
                  a.jsx(Ds, {
                    children: a.jsx(Pi, {
                      asChild: !0,
                      children: a.jsx(Fr, {
                        to: `/cursos?area=${encodeURIComponent(n.area)}`,
                        children: n.area,
                      }),
                    }),
                  }),
                  a.jsx(Ti, {}),
                  a.jsx(Ds, { children: a.jsx(E2, { children: n.title }) }),
                ],
              }),
            }),
            a.jsxs('div', {
              className:
                'relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20',
              style: {
                backgroundImage: `url(${n.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              },
              children: [
                a.jsx('div', {
                  className:
                    'absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80 rounded-2xl',
                }),
                a.jsx('div', {
                  className: 'relative z-10 lg:hidden mb-8',
                  children: a.jsx(Gh, { course: n }),
                }),
                a.jsxs('div', {
                  className:
                    'relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8',
                  children: [
                    a.jsxs('div', {
                      className: 'lg:col-span-2 space-y-8',
                      children: [
                        a.jsx(w4, { course: n }),
                        a.jsx(pD, { activeTab: e, onTabChange: t }),
                        e === 'curso' &&
                          a.jsxs(a.Fragment, {
                            children: [
                              n.liveSessions &&
                                n.liveSessions.length > 0 &&
                                a.jsx(hD, { sessions: n.liveSessions }),
                              a.jsx(uD, { modules: n.modules }),
                              a.jsx(zR, { items: n.whatYouWillLearn }),
                              a.jsx(WR, { items: n.whatYouWillBuild }),
                              a.jsx(BR, { spaces: n.spacesIncluded }),
                              a.jsx(dD, { educator: n.educator }),
                              a.jsx(fD, { faqs: n.faqs }),
                            ],
                          }),
                        e === 'clases' && a.jsx(vM, {}),
                        e === 'recursos' && a.jsx(bM, {}),
                        e === 'actividades' && a.jsx(kM, {}),
                        e === 'proyectos' && a.jsx(q3, {}),
                        e === 'foro' && a.jsx(VM, {}),
                      ],
                    }),
                    a.jsx('div', {
                      className:
                        'hidden lg:block self-start sticky top-24 max-h-[calc(100vh-8rem)]',
                      children: a.jsx(Gh, { course: n }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  },
  J3 = () => {
    const e = us();
    return (
      d.useEffect(() => {
        console.error(
          '404 Error: User attempted to access non-existent route:',
          e.pathname
        );
      }, [e.pathname]),
      a.jsx('div', {
        className: 'flex min-h-screen items-center justify-center bg-muted',
        children: a.jsxs('div', {
          className: 'text-center',
          children: [
            a.jsx('h1', {
              className: 'mb-4 text-4xl font-bold',
              children: '404',
            }),
            a.jsx('p', {
              className: 'mb-4 text-xl text-muted-foreground',
              children: 'Oops! Page not found',
            }),
            a.jsx('a', {
              href: '/',
              className: 'text-primary underline hover:text-primary/90',
              children: 'Return to Home',
            }),
          ],
        }),
      })
    );
  },
  eO = new qP(),
  tO = () =>
    a.jsx(ZP, {
      client: eO,
      children: a.jsxs(xd, {
        children: [
          a.jsx(aE, {}),
          a.jsx(FE, {}),
          a.jsx(qT, {
            children: a.jsxs(UT, {
              children: [
                a.jsx(Si, { path: '/', element: a.jsx(y4, {}) }),
                a.jsx(Si, { path: '/cursos/:slug', element: a.jsx(Z3, {}) }),
                a.jsx(Si, { path: '*', element: a.jsx(J3, {}) }),
              ],
            }),
          }),
        ],
      }),
    });
M0(document.getElementById('root')).render(a.jsx(tO, {}));
