var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../solid-tools/node_modules/@muze-nl/metro-core/src/metro.mjs
function fetchOptionsFrom(...options) {
  const result = {};
  for (const option of options) {
    if (!isPlainObject2(option)) {
      continue;
    }
    for (const key of TRACE_OPTION_KEYS) {
      if (key in option) {
        result[key] = option[key];
      }
    }
  }
  return result;
}
function createTraceContext(req, options = {}) {
  const parent = traceParentFrom(options.trace || options.tracer || options.tracers);
  let localTracers = [];
  if (parent) {
    localTracers = parent.localTracers || [];
  } else {
    localTracers = normalizeTracers(options.trace).concat(normalizeTracers(options.tracer)).concat(normalizeTracers(options.tracers));
  }
  const globalTracers = Object.values(Client.tracers || {});
  const context = {
    __metroTraceContext: true,
    id: "metro-trace-context-" + ++traceContextId,
    parent,
    request: req,
    options,
    globalTracers,
    localTracers,
    tracers: globalTracers.concat(localTracers)
  };
  return context;
}
function traceParentFrom(value) {
  if (!value) {
    return null;
  }
  if (value.context?.__metroTraceContext) {
    return value.context;
  }
  if (value.__metroTraceContext) {
    return value;
  }
  return null;
}
function normalizeTracers(value) {
  if (!value || value.__metroTraceContext || value.context?.__metroTraceContext) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(normalizeTracers);
  }
  if (isTracer(value)) {
    return [value];
  }
  if (isPlainObject2(value)) {
    return Object.values(value).flatMap(normalizeTracers);
  }
  return [];
}
function isTracer(value) {
  return value && typeof value == "object" && [
    "request",
    "response",
    "error",
    "event",
    "diagnostic",
    "span",
    "link",
    "current"
  ].some((name) => typeof value[name] == "function");
}
function createMiddlewareContext(client3, options, traceContext) {
  const trace3 = createTraceAPI(traceContext);
  return Object.freeze({
    client: client3,
    options,
    trace: trace3,
    fetch(req, fetchOptions = {}) {
      return client3.fetch(req, Object.assign({}, fetchOptions, { trace: trace3 }));
    }
  });
}
function createTraceAPI(context) {
  const api3 = {
    __metroTraceContext: true,
    context,
    event(name, data = {}) {
      callTracers2(context.tracers, "event", name, data, context);
    },
    diagnostic(diagnostic = {}) {
      callTracers2(context.tracers, "diagnostic", diagnostic, context);
    },
    current() {
      for (const tracer of context.tracers) {
        if (typeof tracer.current == "function") {
          const current = tracer.current(context);
          if (current) {
            return current;
          }
        }
      }
      return { traceId: null, spanId: null };
    },
    async span(name, fn, data = {}) {
      const tracer = context.tracers.find((tracer2) => typeof tracer2.span == "function");
      if (!tracer) {
        return fn();
      }
      return tracer.span(name, fn, data, context);
    },
    link(key) {
      let traceId = null;
      for (const tracer of context.tracers) {
        if (typeof tracer.link == "function") {
          traceId = tracer.link(key, void 0, context) || traceId;
        }
      }
      return traceId;
    },
    options(extra = {}) {
      return Object.assign({}, extra, { trace: api3 });
    }
  };
  return api3;
}
function callTracers2(tracers2, method, ...args) {
  for (const tracer of tracers2) {
    if (tracer && typeof tracer[method] == "function") {
      tracer[method].call(tracer, ...args);
    }
  }
}
function isPlainObject2(value) {
  return value && typeof value == "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function client(...options) {
  return new Client(...deepClone(options));
}
function getRequestParams(req, current) {
  let params = current || {};
  if (!params.url && current.url) {
    params.url = current.url;
  }
  for (let prop of [
    "method",
    "headers",
    "body",
    "mode",
    "credentials",
    "cache",
    "redirect",
    "referrer",
    "referrerPolicy",
    "integrity",
    "keepalive",
    "signal",
    "priority",
    "url"
  ]) {
    let value = req[prop];
    if (typeof value == "undefined" || value == null) {
      continue;
    }
    if (value?.[Symbol.metroProxy]) {
      value = value[Symbol.metroSource];
    }
    if (typeof value == "function") {
      params[prop] = value(params[prop], params);
    } else {
      if (prop == "url") {
        params.url = url(params.url, value);
      } else if (prop == "headers") {
        params.headers = new Headers(current.headers);
        if (!(value instanceof Headers)) {
          value = new Headers(req.headers);
        }
        for (let [key, val] of value.entries()) {
          params.headers.set(key, val);
        }
      } else {
        params[prop] = value;
      }
    }
  }
  if (req instanceof Request && req.data) {
    params.body = req.data;
  }
  return params;
}
function request(...options) {
  let requestParams = {
    url: typeof window != "undefined" ? url(window.location) : url("https://localhost/"),
    duplex: "half"
    // required when setting body to ReadableStream, just set it here by default already
  };
  for (let option of options) {
    if (typeof option == "string" || option instanceof URL || option instanceof URLSearchParams) {
      requestParams.url = url(requestParams.url, option);
    } else if (option && (option instanceof FormData || option instanceof ReadableStream || option instanceof Blob || option instanceof ArrayBuffer || option instanceof DataView)) {
      requestParams.body = option;
    } else if (option && typeof option == "object") {
      Object.assign(requestParams, getRequestParams(option, requestParams));
    }
  }
  let r = new Request(requestParams.url, requestParams);
  let data = requestParams.body;
  if (data) {
    if (typeof data == "object" && !(data instanceof String) && !(data instanceof ReadableStream) && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && !(data instanceof DataView) && !(data instanceof FormData) && !(data instanceof URLSearchParams) && (globalThis.ArrayBuffer && ArrayBuffer.isView(data))) {
      if (typeof data.toString == "function") {
        requestParams.body = data.toString({ headers: r.headers });
        r = new Request(requestParams.url, requestParams);
      }
    }
  }
  Object.freeze(r);
  return new Proxy(r, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroSource:
          result = target;
          break;
        case Symbol.metroProxy:
          result = true;
          break;
        case "with":
          result = function(...options2) {
            if (typeof data !== "undefined") {
              options2.unshift({ body: data });
            }
            return request(target, ...options2);
          };
          break;
        case "data":
          result = data;
          break;
        default:
          if (target[prop] instanceof Function) {
            if (prop === "clone") {
              result = function() {
                const cloned = target.clone();
                if (typeof data != "undefined" && !(typeof ReadableStream != "undefined" && data instanceof ReadableStream)) {
                  return request(cloned, { body: data });
                }
                return request(cloned);
              };
            } else {
              result = target[prop].bind(target);
            }
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function getResponseParams(res, current) {
  let params = current || {};
  if (!params.url && current.url) {
    params.url = current.url;
  }
  for (let prop of ["status", "statusText", "headers", "body", "url", "type", "redirected"]) {
    let value = res[prop];
    if (typeof value == "undefined" || value == null) {
      continue;
    }
    if (value?.[Symbol.metroProxy]) {
      value = value[Symbol.metroSource];
    }
    if (typeof value == "function") {
      params[prop] = value(params[prop], params);
    } else {
      if (prop == "url") {
        params.url = new URL(value, params.url || "https://localhost/");
      } else {
        params[prop] = value;
      }
    }
  }
  if (res instanceof Response && res.data) {
    params.body = res.data;
  }
  return params;
}
function response(...options) {
  let responseParams = {};
  for (let option of options) {
    if (typeof option == "string") {
      responseParams.body = option;
    } else if (option instanceof Response) {
      Object.assign(responseParams, getResponseParams(option, responseParams));
    } else if (option && typeof option == "object") {
      if (option instanceof FormData || option instanceof Blob || option instanceof ArrayBuffer || option instanceof DataView || option instanceof ReadableStream || option instanceof URLSearchParams || option instanceof String || typeof globalThis.TypedArray != "undefined" && option instanceof globalThis.TypedArray) {
        responseParams.body = option;
      } else {
        Object.assign(responseParams, getResponseParams(option, responseParams));
      }
    }
  }
  let data = void 0;
  if (responseParams.body) {
    data = responseParams.body;
  }
  if ([101, 204, 205, 304].includes(responseParams.status)) {
    responseParams.body = null;
  }
  let r = new Response(responseParams.body, responseParams);
  Object.freeze(r);
  return new Proxy(r, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        case "with":
          result = function(...options2) {
            return response(target, ...options2);
          };
          break;
        case "data":
          result = data;
          break;
        case "ok":
          result = target.status >= 200 && target.status < 300;
          break;
        default:
          if (typeof target[prop] == "function") {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function appendSearchParams(url3, params) {
  if (typeof params == "function") {
    params(url3.searchParams, url3);
  } else {
    params = new URLSearchParams(params);
    params.forEach((value, key) => {
      url3.searchParams.append(key, value);
    });
  }
}
function appendHashParams(value, params) {
  const target = value[Symbol.metroSource] || value;
  if (!(params instanceof URLSearchParams)) {
    params = new URLSearchParams(params);
  }
  let hash = target.hash || "#";
  hash += "?" + params;
  return url(target, { hash });
}
function url(...options) {
  let validParams = [
    "hash",
    "fragment",
    "host",
    "hostname",
    "href",
    "password",
    "pathname",
    "port",
    "protocol",
    "username",
    "search",
    "searchParams",
    "hashParams"
  ];
  let u = new URL("https://localhost/");
  let hParams = null;
  for (let option of options) {
    if (typeof option == "string" || option instanceof String) {
      u = new URL(option, u);
    } else if (option instanceof URL || typeof Location != "undefined" && option instanceof Location) {
      u = new URL(option);
    } else if (option instanceof URLSearchParams) {
      appendSearchParams(u, option);
    } else if (option && typeof option == "object") {
      for (let param in option) {
        switch (param) {
          case "search":
            if (typeof option.search == "function") {
              option.search(u.search, u);
            } else {
              u.search = new URLSearchParams(option.search);
            }
            break;
          case "searchParams":
            appendSearchParams(u, option.searchParams);
            break;
          default:
            if (!validParams.includes(param)) {
              throw metroError("metro.url: unknown url parameter " + metroURL + "url/unknown-param-name/", param);
            }
            if (param == "fragment") {
              let fragment = option.fragment;
              if (fragment && typeof fragment == "string" && fragment[0] != "#") {
                fragment = "#" + fragment;
              }
              option.hash = fragment;
              param = "hash";
            } else if (param == "hashParams") {
              hParams = option.hashParams;
            }
            if (typeof option[param] == "function") {
              option[param](u[param], u);
            } else if (typeof option[param] == "string" || option[param] instanceof String || typeof option[param] == "number" || option[param] instanceof Number || typeof option[param] == "boolean" || option[param] instanceof Boolean) {
              u[param] = "" + option[param];
            } else if (typeof option[param] == "object" && option[param].toString) {
              u[param] = option[param].toString();
            } else {
              throw metroError("metro.url: unsupported value for " + param + " " + metroURL + "url/unsupported-param-value/", options[param]);
            }
            break;
        }
      }
    } else {
      throw metroError("metro.url: unsupported option value " + metroURL + "url/unsupported-option-value/", option);
    }
  }
  if (hParams) {
    if (!u.hash) {
      u.hash = "#";
    }
    if (typeof hParams == "string") {
      u.hash += hParams;
    } else {
      u = appendHashParams(u, hParams);
    }
  }
  Object.freeze(u);
  return new Proxy(u, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        case "with":
          result = function(...options2) {
            return url(target, ...options2);
          };
          break;
        case "filename":
          result = target.pathname.split("/").pop();
          break;
        case "folderpath":
          result = target.pathname.substring(0, target.pathname.lastIndexOf("/") + 1);
          break;
        case "authority":
          result = target.username ?? "";
          result += target.password ? ":" + target.password : "";
          result += result ? "@" : "";
          result += target.hostname;
          result += target.port ? ":" + target.port : "";
          result += "/";
          result = target.protocol + "//" + result;
          break;
        case "fragment":
          result = target.hash.substring(1);
          break;
        case "scheme":
          if (target.protocol) {
            result = target.protocol.substring(0, target.protocol.length - 1);
          } else {
            result = "";
          }
          break;
        default:
          if (target[prop] instanceof Function) {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function metroError(message, ...details) {
  metroConsole.error(message, ...details);
  return new Error(message, ...details);
}
function deepClone(object) {
  if (Array.isArray(object)) {
    return object.slice().map(deepClone);
  }
  if (object && typeof object === "object") {
    if (object.__proto__?.constructor == Object || !object.__proto__) {
      let result = Object.assign({}, object);
      Object.keys(result).forEach((key) => {
        result[key] = deepClone(object[key]);
      });
      return result;
    } else {
      return object;
    }
  }
  return object;
}
var metroURL, Client, traceContextId, TRACE_OPTION_KEYS, metroConsole;
var init_metro = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-core/src/metro.mjs"() {
    metroURL = "https://metro.muze.nl/details/";
    if (!Symbol.metroProxy) {
      Symbol.metroProxy = Symbol("isProxy");
    }
    if (!Symbol.metroSource) {
      Symbol.metroSource = Symbol("source");
    }
    Client = class _Client {
      clientOptions = {
        url: typeof window != "undefined" ? url(window.location) : url("https://localhost"),
        verbs: ["get", "post", "put", "delete", "patch", "head", "options", "query"]
      };
      static tracers = {};
      /**
       * @typedef {Object} ClientOptions
       * @property {Array} middlewares - list of middleware functions
       * @property {string|URL} url - default url of the client
       * @property {[string]} verbs - a list of verb methods to expose, e.g. ['get','post']
       * 
       * Constructs a new metro client. Can have any number of params.
       * @params {ClientOptions|URL|Function|Client}
       * @returns {Client} - A metro client object with given or default verb methods
       */
      constructor(...options) {
        for (let option of options) {
          if (typeof option == "string" || option instanceof String) {
            this.clientOptions.url = url(this.clientOptions.url.href, option);
          } else if (option instanceof _Client) {
            Object.assign(this.clientOptions, option.clientOptions);
          } else if (option instanceof Function) {
            this.#addMiddlewares([option]);
          } else if (option && typeof option == "object") {
            for (let param in option) {
              if (param == "middlewares") {
                this.#addMiddlewares(option[param]);
              } else if (param == "url") {
                this.clientOptions.url = url(this.clientOptions.url.href, option[param]);
              } else if (typeof option[param] == "function") {
                this.clientOptions[param] = option[param](this.clientOptions[param], this.clientOptions);
              } else {
                this.clientOptions[param] = option[param];
              }
            }
          }
        }
        for (const verb of this.clientOptions.verbs) {
          this[verb] = async function(...options2) {
            return this.fetch(
              request(
                this.clientOptions,
                ...options2,
                { method: verb.toUpperCase() }
              ),
              fetchOptionsFrom(...options2)
            );
          };
        }
      }
      #addMiddlewares(middlewares) {
        if (typeof middlewares == "function") {
          middlewares = [middlewares];
        }
        let index = middlewares.findIndex((m) => typeof m != "function");
        if (index >= 0) {
          throw metroError("metro.client: middlewares must be a function or an array of functions " + metroURL + "client/invalid-middlewares/", middlewares[index]);
        }
        if (!Array.isArray(this.clientOptions.middlewares)) {
          this.clientOptions.middlewares = [];
        }
        this.clientOptions.middlewares = this.clientOptions.middlewares.concat(middlewares);
      }
      /**
       * Mimics the standard browser fetch method, but uses any middleware installed through
       * the constructor.
       * @param {Request|string|Object} - Required. The URL or Request object, accepts all types that are accepted by metro.request
       * @param {Object} - Optional. Any object that is accepted by metro.request
       * @return {Promise<Response|*>} - The metro.response to this request, or any other result as changed by any included middleware.
       */
      fetch(req, options) {
        req = request(req, options);
        if (!req.url) {
          throw metroError("metro.client." + req.method.toLowerCase() + ": Missing url parameter " + metroURL + "client/fetch-missing-url/", req);
        }
        if (!options) {
          options = {};
        }
        if (!(typeof options === "object") || options instanceof String) {
          throw metroError("metro.client.fetch: Invalid options parameter " + metroURL + "client/fetch-invalid-options/", options);
        }
        const metrofetch = async function browserFetch(req2) {
          if (req2[Symbol.metroProxy]) {
            req2 = req2[Symbol.metroSource];
          }
          const res = await fetch(req2);
          return response(res);
        };
        let middlewares = [metrofetch].concat(this.clientOptions?.middlewares?.slice() || []);
        options = Object.assign({}, this.clientOptions, options);
        const traceContext = createTraceContext(req, options);
        const middlewareContext = createMiddlewareContext(this, options, traceContext);
        let next;
        for (let middleware of middlewares) {
          next = /* @__PURE__ */ (function(next2, middleware2) {
            return async function(req2) {
              let res;
              let tracers2 = traceContext.tracers;
              callTracers2(tracers2, "request", req2, middleware2, traceContext);
              try {
                res = await middleware2(req2, next2, middlewareContext);
              } catch (error4) {
                callTracers2(tracers2, "error", error4, req2, middleware2, traceContext);
                throw error4;
              }
              callTracers2(tracers2, "response", res, middleware2, traceContext);
              return res;
            };
          })(next, middleware);
        }
        return next(req);
      }
      with(...options) {
        return new _Client(deepClone(this.clientOptions), ...options);
      }
      get location() {
        return this.clientOptions.url;
      }
    };
    traceContextId = 0;
    TRACE_OPTION_KEYS = ["trace", "tracer", "tracers"];
    metroConsole = {
      error: (message, ...details) => {
        console.error("\u24C2\uFE0F  ", message, ...details);
      },
      info: (message, ...details) => {
        console.info("\u24C2\uFE0F  ", message, ...details);
      },
      group: (name) => {
        console.group("\u24C2\uFE0F  " + name);
      },
      groupEnd: (name) => {
        console.groupEnd("\u24C2\uFE0F  " + name);
      }
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-core/src/index.mjs
var src_exports3 = {};
__export(src_exports3, {
  Client: () => Client,
  client: () => client,
  deepClone: () => deepClone,
  metroError: () => metroError,
  request: () => request,
  response: () => response,
  url: () => url
});
var init_src = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-core/src/index.mjs"() {
    init_metro();
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/json.mjs
function jsonmw(options) {
  options = Object.assign({
    contentType: "application/json",
    reviver: null,
    replacer: null,
    space: ""
  }, options);
  return async function json(req, next) {
    if (!req.headers.get("Accept")) {
      req = req.with({
        headers: {
          "Accept": options.accept ?? options.contentType
        }
      });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.data && typeof req.data == "object" && !(req.data instanceof ReadableStream)) {
        const contentType = req.headers.get("Content-Type");
        if (!contentType || isPlainText(contentType)) {
          req = req.with({
            headers: {
              "Content-Type": options.contentType
            }
          });
        }
        if (isJSON(req.headers.get("Content-Type"))) {
          req = req.with({
            body: JSON.stringify(req.data, options.replacer, options.space)
          });
        }
      }
    }
    let res = await next(req);
    if (res && isJSON(res.headers?.get("Content-Type"))) {
      let tempRes = res.clone();
      let body = await tempRes.text();
      try {
        let json2 = JSON.parse(body, options.reviver);
        return res.with({
          body: json2
        });
      } catch (e) {
      }
    }
    return res;
  };
}
function isJSON(contentType) {
  return jsonRE.exec(contentType);
}
function isPlainText(contentType) {
  return /^text\/plain\b/.exec(contentType);
}
var jsonRE;
var init_json = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/json.mjs"() {
    jsonRE = /^application\/([a-zA-Z0-9\-_]+\+)?json\b/;
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/thrower.mjs
function throwermw(options) {
  return async function thrower(req, next) {
    let res = await next(req);
    if (!res.ok) {
      if (options && typeof options[res.status] == "function") {
        res = options[res.status].apply(res, req);
      } else {
        throw new Error(res.status + ": " + res.statusText, {
          cause: res
        });
      }
    }
    return res;
  };
}
var init_thrower = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/thrower.mjs"() {
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/getdata.mjs
function getdatamw() {
  return async function getdata(req, next) {
    let res = await next(req);
    if (res.ok && res.data) {
      return res.data;
    }
    return res;
  };
}
var init_getdata = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/getdata.mjs"() {
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/_trace.mjs
function traceEvent(name, data = {}, context = null) {
  for (const tracer of tracersFor(context)) {
    if (tracer && typeof tracer.event == "function") {
      tracer.event.call(tracer, name, data, context);
    }
  }
}
function traceDiagnostic(diagnostic = {}, context = null) {
  for (const tracer of tracersFor(context)) {
    if (tracer && typeof tracer.diagnostic == "function") {
      tracer.diagnostic.call(tracer, diagnostic, context);
    }
  }
}
function tracersFor(context) {
  return context?.tracers || Object.values(Client.tracers || {});
}
var init_trace = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/_trace.mjs"() {
    init_src();
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/backoff.mjs
function backoffmw(options = {}) {
  options = Object.assign({
    name: "backoff",
    store: memoryBackoffStore(),
    scope: "origin",
    statuses: DEFAULT_BACKOFF_STATUSES,
    maxDelay: 6e4,
    sleep,
    now: () => Date.now()
  }, options);
  async function backoff(req, next, context) {
    const key = backoffKey(req, options);
    const until = options.store.get(key) || 0;
    const wait = Math.max(0, until - options.now());
    if (wait > 0) {
      traceEvent("server backoff wait", {
        severity: "warning",
        label: formatDelay(wait),
        method: req.method,
        url: req.url,
        wait,
        key
      }, context);
      await options.sleep(wait, req.signal);
    }
    const res = await next(req);
    const delay = responseBackoffDelay(res, options);
    if (delay > 0) {
      options.store.set(key, options.now() + delay);
      traceEvent("server requested backoff", {
        severity: res.status >= 400 ? "warning" : "info",
        label: formatDelay(delay),
        method: req.method,
        url: req.url,
        status: res.status,
        delay,
        key
      }, context);
      traceDiagnostic({
        severity: res.status >= 400 ? "warning" : "info",
        code: "server-backoff",
        message: `Server asked Metro to back off ${formatDelay(delay)}`,
        data: {
          method: req.method,
          url: req.url,
          status: res.status,
          delay,
          key
        }
      }, context);
    }
    return res;
  }
  backoff.traceName = options.name;
  return backoff;
}
function responseBackoffDelay(res, options = {}) {
  options = Object.assign({
    statuses: DEFAULT_BACKOFF_STATUSES,
    maxDelay: 6e4
  }, options);
  if (!res?.headers) {
    return 0;
  }
  const retryAfter = parseRetryAfter(res.headers.get("Retry-After"));
  if (retryAfter > 0 && statusAllowsBackoff(res.status, options)) {
    return capDelay(retryAfter, options.maxDelay);
  }
  const rateLimitReset = parseRateLimitReset(res.headers.get("RateLimit-Reset"));
  const rateLimitRemaining = parseNumberHeader(res.headers.get("RateLimit-Remaining"));
  if (rateLimitReset > 0 && rateLimitRemaining === 0) {
    return capDelay(rateLimitReset, options.maxDelay);
  }
  const combinedRateLimit = parseCombinedRateLimit(res.headers.get("RateLimit"));
  if (combinedRateLimit.delay > 0 && combinedRateLimit.remaining === 0) {
    return capDelay(combinedRateLimit.delay, options.maxDelay);
  }
  return 0;
}
function parseRetryAfter(value, now2 = Date.now()) {
  if (!value) {
    return 0;
  }
  value = String(value).trim();
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10) * 1e3;
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - now2);
  }
  return 0;
}
function parseRateLimitReset(value) {
  if (!value) {
    return 0;
  }
  const match = String(value).trim().match(/^\d+(?:\.\d+)?/);
  if (!match) {
    return 0;
  }
  return Math.ceil(parseFloat(match[0]) * 1e3);
}
function parseCombinedRateLimit(value) {
  const result = { remaining: null, delay: 0 };
  if (!value) {
    return result;
  }
  for (const part of String(value).split(/[;,]/)) {
    const [rawName, rawValue] = part.split("=").map((item) => item?.trim());
    const name = rawName?.toLowerCase();
    const value2 = rawValue?.replace(/^"|"$/g, "");
    if (name == "r") {
      result.remaining = parseNumberHeader(value2);
    } else if (name == "t") {
      result.delay = parseRateLimitReset(value2);
    }
  }
  return result;
}
function memoryBackoffStore() {
  const values5 = /* @__PURE__ */ new Map();
  return {
    get(key) {
      return values5.get(key) || 0;
    },
    set(key, until) {
      values5.set(key, until);
    },
    clear(key = null) {
      if (key == null) {
        values5.clear();
      } else {
        values5.delete(key);
      }
    }
  };
}
function localStorageBackoffStore(options = {}) {
  const storage = options.storage || safeLocalStorage();
  if (!storage) {
    return memoryBackoffStore();
  }
  const prefix = options.prefix || "metro:backoff:";
  return {
    get(key) {
      const until = parseInt(storage.getItem(prefix + key), 10);
      return Number.isNaN(until) ? 0 : until;
    },
    set(key, until) {
      storage.setItem(prefix + key, String(until));
    },
    clear(key = null) {
      if (key != null) {
        storage.removeItem(prefix + key);
        return;
      }
      const keys = [];
      for (let index = 0; index < storage.length; index++) {
        const name = storage.key(index);
        if (name?.startsWith(prefix)) {
          keys.push(name);
        }
      }
      for (const name of keys) {
        storage.removeItem(name);
      }
    }
  };
}
function sleep(ms, signal3) {
  if (!ms || ms <= 0) {
    return Promise.resolve();
  }
  if (signal3?.aborted) {
    return Promise.reject(signal3.reason || new Error("Request was aborted"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, ms);
    function done() {
      cleanup();
      resolve();
    }
    function abort() {
      cleanup();
      reject(signal3.reason || new Error("Request was aborted"));
    }
    function cleanup() {
      clearTimeout(timer);
      signal3?.removeEventListener?.("abort", abort);
    }
    signal3?.addEventListener?.("abort", abort, { once: true });
  });
}
function statusAllowsBackoff(status2, options) {
  return options.statuses == "*" || options.statuses.includes(status2);
}
function capDelay(delay, maxDelay) {
  if (!maxDelay || maxDelay < 0) {
    return delay;
  }
  return Math.min(delay, maxDelay);
}
function parseNumberHeader(value) {
  if (value == null) {
    return null;
  }
  const match = String(value).trim().match(/^\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}
function backoffKey(req, options) {
  if (typeof options.scope == "function") {
    return options.scope(req);
  }
  const url3 = new URL(req.url);
  if (options.scope == "url") {
    return url3.href;
  }
  if (options.scope == "path") {
    return `${url3.origin}${url3.pathname}`;
  }
  return url3.origin;
}
function formatDelay(delay) {
  return delay < 1e3 ? `${Math.round(delay)}ms` : `${(delay / 1e3).toFixed(delay < 1e4 ? 1 : 0)}s`;
}
function safeLocalStorage() {
  try {
    return typeof localStorage != "undefined" ? localStorage : null;
  } catch (e) {
    return null;
  }
}
var DEFAULT_BACKOFF_STATUSES;
var init_backoff = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/backoff.mjs"() {
    init_trace();
    DEFAULT_BACKOFF_STATUSES = [429, 503];
    backoffmw.memoryStore = memoryBackoffStore;
    backoffmw.localStorageStore = localStorageBackoffStore;
    backoffmw.parseRetryAfter = parseRetryAfter;
    backoffmw.responseDelay = responseBackoffDelay;
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/retry.mjs
function retrymw(options = {}) {
  if (typeof options == "number") {
    options = { attempts: options };
  }
  options = Object.assign({
    name: "retry",
    attempts: 3,
    delay: 250,
    factor: 2,
    maxDelay: 3e4,
    jitter: true,
    methods: DEFAULT_RETRY_METHODS,
    status: DEFAULT_RETRY_STATUS,
    respectRetryAfter: true,
    respectRateLimit: true,
    sleep,
    random: Math.random
  }, options);
  async function retry(req, next, context) {
    const attempts = attemptsFor(options.attempts, req);
    if (attempts <= 1 || !methodCanRetry(req, options)) {
      return next(req);
    }
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        if (attempt > 1) {
          traceEvent("retry attempt", {
            severity: "info",
            label: `${attempt}/${attempts}`,
            attempt,
            attempts,
            method: req.method,
            url: req.url
          }, context);
        }
        const res = await next(req.with ? req.with() : req);
        if (!responseCanRetry(res, options) || attempt >= attempts) {
          return res;
        }
        const delay = retryDelay(options, attempt, res);
        traceEvent("retry scheduled", {
          severity: "warning",
          label: `${res.status}, ${formatDelay2(delay)}`,
          attempt,
          attempts,
          status: res.status,
          method: req.method,
          url: req.url,
          delay
        }, context);
        traceDiagnostic({
          severity: "warning",
          code: "retry",
          message: `Retrying ${req.method} ${displayURL(req.url)} after HTTP ${res.status}`,
          data: { attempt, attempts, status: res.status, delay, method: req.method, url: req.url }
        }, context);
        await options.sleep(delay, req.signal);
      } catch (error4) {
        lastError = error4;
        if (!errorCanRetry(error4, options) || attempt >= attempts || req.signal?.aborted) {
          throw error4;
        }
        const delay = retryDelay(options, attempt);
        traceEvent("retry scheduled", {
          severity: "warning",
          label: `${error4.name || "Error"}, ${formatDelay2(delay)}`,
          attempt,
          attempts,
          method: req.method,
          url: req.url,
          delay
        }, context);
        traceDiagnostic({
          severity: "warning",
          code: "retry",
          message: `Retrying ${req.method} ${displayURL(req.url)} after ${error4.message || error4}`,
          data: { attempt, attempts, delay, method: req.method, url: req.url, error: error4.message }
        }, context);
        await options.sleep(delay, req.signal);
      }
    }
    throw lastError;
  }
  retry.traceName = options.name;
  return retry;
}
function retryDelay(options, attempt, res = null) {
  let serverDelay = 0;
  if (res && (options.respectRetryAfter || options.respectRateLimit)) {
    serverDelay = responseBackoffDelay(res, {
      statuses: options.status,
      maxDelay: options.maxDelay
    });
  }
  let delay = delayFor(options.delay, attempt, res);
  if (delay > 0 && options.factor && attempt > 1) {
    delay = delay * Math.pow(options.factor, attempt - 1);
  }
  if (options.jitter && delay > 0) {
    delay = delay * (0.5 + options.random());
  }
  if (options.maxDelay && options.maxDelay > 0) {
    delay = Math.min(delay, options.maxDelay);
  }
  return Math.max(serverDelay, Math.round(delay));
}
function methodCanRetry(req, options) {
  if (options.methods == "*") {
    return true;
  }
  return options.methods.map((method) => method.toUpperCase()).includes(req.method.toUpperCase());
}
function responseCanRetry(res, options) {
  if (typeof options.when == "function") {
    return options.when(res);
  }
  return options.status == "*" || options.status.includes(res.status);
}
function errorCanRetry(error4, options) {
  if (typeof options.onError == "function") {
    return options.onError(error4);
  }
  return error4?.name != "AbortError" && error4?.name != "TimeoutError";
}
function attemptsFor(attempts, req) {
  return typeof attempts == "function" ? attempts(req) : attempts;
}
function delayFor(delay, attempt, res) {
  return typeof delay == "function" ? delay(attempt, res) : delay;
}
function formatDelay2(delay) {
  return delay < 1e3 ? `${Math.round(delay)}ms` : `${(delay / 1e3).toFixed(delay < 1e4 ? 1 : 0)}s`;
}
function displayURL(value) {
  try {
    const url3 = new URL(value, "https://localhost/");
    return url3.origin == "https://localhost" ? url3.pathname + url3.search : url3.href;
  } catch (e) {
    return String(value);
  }
}
var DEFAULT_RETRY_STATUS, DEFAULT_RETRY_METHODS;
var init_retry = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/retry.mjs"() {
    init_backoff();
    init_trace();
    DEFAULT_RETRY_STATUS = [408, 425, 429, 500, 502, 503, 504];
    DEFAULT_RETRY_METHODS = ["GET", "HEAD", "OPTIONS"];
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/abort.mjs
function abortmw(options = {}) {
  if (isAbortSignal(options)) {
    options = { signal: options };
  }
  if (typeof options == "function") {
    options = { signal: options };
  }
  options = Object.assign({
    name: "abort"
  }, options);
  async function abort(req, next, context) {
    const signal3 = signalFor(options.signal, req);
    if (!signal3) {
      return next(req);
    }
    if (signal3.aborted) {
      const error4 = signal3.reason || abortError();
      traceDiagnostic({
        severity: "error",
        code: "aborted",
        message: error4.message || "Request was aborted",
        data: { method: req.method, url: req.url }
      }, context);
      throw error4;
    }
    traceEvent("abort signal attached", {
      severity: "info",
      method: req.method,
      url: req.url
    }, context);
    return next(req.with({ signal: combineSignals(req.signal, signal3) }));
  }
  abort.traceName = options.name;
  return abort;
}
function combineSignals(...signals2) {
  signals2 = signals2.filter(Boolean);
  if (!signals2.length) {
    return null;
  }
  if (signals2.length == 1) {
    return signals2[0];
  }
  const controller = new AbortController();
  const cleanup = [];
  const abort = (event) => {
    for (const remove2 of cleanup) {
      remove2();
    }
    const source = event?.target || signals2.find((signal3) => signal3.aborted);
    if (!controller.signal.aborted) {
      controller.abort(source?.reason || abortError());
    }
  };
  for (const signal3 of signals2) {
    if (signal3.aborted) {
      abort({ target: signal3 });
      break;
    }
    signal3.addEventListener("abort", abort, { once: true });
    cleanup.push(() => signal3.removeEventListener("abort", abort));
  }
  return controller.signal;
}
function abortError(message = "Request was aborted") {
  if (typeof DOMException != "undefined") {
    return new DOMException(message, "AbortError");
  }
  const error4 = new Error(message);
  error4.name = "AbortError";
  return error4;
}
function signalFor(signal3, req) {
  return typeof signal3 == "function" ? signal3(req) : signal3;
}
function isAbortSignal(value) {
  return value && typeof value == "object" && typeof value.aborted == "boolean" && typeof value.addEventListener == "function";
}
var init_abort = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/abort.mjs"() {
    init_trace();
    abortmw.combineSignals = combineSignals;
    abortmw.abortError = abortError;
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/timeout.mjs
function timeoutmw(options = 3e4) {
  if (typeof options == "number") {
    options = { ms: options };
  }
  options = Object.assign({
    ms: 3e4,
    name: "timeout"
  }, options);
  async function timeout(req, next, context) {
    const ms = delayFor2(options.ms, req);
    if (!ms || ms <= 0) {
      return next(req);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(timeoutError(ms));
    }, ms);
    const signal3 = combineSignals(req.signal, options.signal, controller.signal);
    traceEvent("timeout armed", {
      severity: "info",
      label: `${ms}ms`,
      method: req.method,
      url: req.url,
      ms
    }, context);
    try {
      return await next(req.with({ signal: signal3 }));
    } catch (error4) {
      if (controller.signal.aborted) {
        traceDiagnostic({
          severity: "error",
          code: "timeout",
          message: `Request timed out after ${ms}ms`,
          data: { method: req.method, url: req.url, ms }
        }, context);
      }
      throw error4;
    } finally {
      clearTimeout(timer);
    }
  }
  timeout.traceName = options.name;
  return timeout;
}
function timeoutError(ms) {
  const error4 = new Error(`Request timed out after ${ms}ms`);
  error4.name = "TimeoutError";
  error4.code = "ETIMEDOUT";
  return error4;
}
function delayFor2(ms, req) {
  return typeof ms == "function" ? ms(req) : ms;
}
var init_timeout = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/timeout.mjs"() {
    init_abort();
    init_trace();
    timeoutmw.timeoutError = timeoutError;
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/echo.mock.mjs
function echomw() {
  return async function echo(req) {
    let options = {
      status: 200,
      statusText: "OK",
      url: req.url,
      headers: req.headers,
      body: req.body
    };
    return response(options);
  };
}
var init_echo_mock = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/echo.mock.mjs"() {
    init_src();
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/error.mock.mjs
function errormw(options) {
  const customStatus = Object.assign({}, status, options);
  return async function error4(req) {
    let url3 = url(req.url);
    if (status[url3.pathname]) {
      let error5 = {
        code: parseInt(url3.pathname.substring(1)),
        message: customStatus[url3.pathname]
      };
      return response(badRequest(error5));
    } else {
      return response(baseResponse);
    }
  };
}
var baseResponse, badRequest, status;
var init_error_mock = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/error.mock.mjs"() {
    init_src();
    baseResponse = {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json"
      }
    };
    badRequest = (error4) => {
      return {
        status: error4.code,
        statusText: error4.message,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(error4)
      };
    };
    status = {
      "/400/": "Bad Request",
      "/401/": "Unauthorized",
      "/402/": "Payment Required",
      "/403/": "Forbidden",
      "/404/": "Not Found",
      "/405/": "Method Not Allowed",
      "/406/": "Not Acceptable",
      "/407/": "Proxy Authentication Required",
      "/408/": "Request Timeout",
      "/409/": "Conflict",
      "/410/": "Gone",
      "/411/": "Length Required",
      "/412/": "Precondition Failed",
      "/413/": "Payload Too Large",
      "/414/": "URI Too Long",
      "/415/": "Unsupported Media Type",
      "/416/": "Range Not Satisfiable",
      "/417/": "Expectation Failed",
      "/418/": "I'm a teapot",
      "/421/": "Misdireceted Request",
      "/422/": "Unprocessable Content",
      "/423/": "Locked",
      "/424/": "Failed Dependency",
      "/425/": "Too Early",
      "/426/": "Upgrade Required",
      "/428/": "Precondition Required",
      "/429/": "Too Many Requests",
      "/431/": "Request Header Fields Too Large",
      "/451/": "Unavailable For Legal Reasons",
      "/500/": "Internal Server Error",
      "/501/": "Not Implemented",
      "/502/": "Bad Gateway",
      "/503/": "Service Unavailable",
      "/504/": "Gateway Timeout",
      "/505/": "HTTP Version Not Supported",
      "/506/": "Variant Also Negotiated",
      "/507/": "Insufficient Storage",
      "/508/": "Loop Detected",
      "/510/": "Not Extended",
      "/511/": "Network Authentication Required"
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-middleware/src/index.mjs
var src_default2;
var init_src2 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-middleware/src/index.mjs"() {
    init_json();
    init_thrower();
    init_getdata();
    init_retry();
    init_timeout();
    init_abort();
    init_backoff();
    init_echo_mock();
    init_error_mock();
    init_json();
    init_thrower();
    init_getdata();
    init_retry();
    init_timeout();
    init_abort();
    init_backoff();
    init_echo_mock();
    init_error_mock();
    src_default2 = {
      json: jsonmw,
      thrower: throwermw,
      getdata: getdatamw,
      retry: retrymw,
      timeout: timeoutmw,
      abort: abortmw,
      backoff: backoffmw,
      echoMock: echomw,
      errorMock: errormw
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-api/src/index.mjs
function api(...options) {
  return new API(...deepClone(options));
}
function jsonApi(...options) {
  return new JsonAPI(...deepClone(options));
}
var API, JsonAPI;
var init_src3 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-api/src/index.mjs"() {
    init_src();
    init_src2();
    init_src2();
    init_src2();
    API = class extends Client {
      #methods = null;
      #base = "";
      constructor(base, methods, bind2 = null) {
        if (base instanceof Client) {
          super(base.clientOptions, throwermw(), getdatamw());
        } else {
          super(base, throwermw(), getdatamw());
        }
        if (!bind2) {
          bind2 = this;
        }
        this.#methods = methods;
        this.#base = base;
        for (const methodName in methods) {
          if (typeof methods[methodName] == "function") {
            this[methodName] = methods[methodName].bind(bind2);
          } else if (methods[methodName] && typeof methods[methodName] == "object" && (Object.getPrototypeOf(methods[methodName]) === null || Object.getPrototypeOf(methods[methodName]).constructor === Object)) {
            this[methodName] = new this.constructor(base, methods[methodName], bind2);
          } else {
            this[methodName] = methods[methodName];
          }
        }
      }
      extend(methods) {
        return new this.constructor(this.#base, Object.assign({}, this.#methods, methods));
      }
    };
    JsonAPI = class extends API {
      constructor(base, methods, bind2 = null) {
        if (base instanceof Client) {
          super(base.with(jsonmw()), methods, bind2);
        } else {
          super(client(base, jsonmw()), methods, bind2);
        }
      }
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-trace/src/tracegraph.mjs
function graph(options = {}) {
  return new GraphTracer(options);
}
function localConsole(options = {}) {
  return graph(options);
}
function traceState() {
  return {
    stack: [],
    activeTraceId: null,
    activeParentSpanId: null,
    lastTraceId: null
  };
}
function renderTrace(trace3, options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const diagnostics = trace3.diagnostics || [];
  const lines = [];
  lines.push(`${traceTitle(trace3)} ${trace3.status || ""} ${formatDuration(trace3.duration || elapsed(trace3))}`.trim());
  const primary = primaryDiagnostic(diagnostics);
  if (primary) {
    lines.push("");
    lines.push("Primary diagnostic:");
    lines.push(`${symbol(primary.severity)} ${primary.code}: ${primary.message}`);
  }
  if (diagnostics.length) {
    lines.push("");
    lines.push("Diagnostics:");
    for (const diagnostic of diagnostics) {
      lines.push(`${symbol(diagnostic.severity)} ${diagnostic.code}: ${diagnostic.message}`);
    }
  }
  lines.push("");
  lines.push(options.view == "sequence" ? renderSequence(trace3, options) : renderTree(trace3, options));
  return lines.join("\n");
}
function renderTree(trace3, options = {}) {
  const spans = trace3.spans || [];
  const events = trace3.events || [];
  const children = /* @__PURE__ */ new Map();
  for (const span of spans) {
    const parent = span.parentSpanId || "";
    if (!children.has(parent)) {
      children.set(parent, []);
    }
    children.get(parent).push(span);
  }
  for (const group2 of children.values()) {
    group2.sort((a, b) => a.start - b.start);
  }
  const eventsBySpan = /* @__PURE__ */ new Map();
  for (const event of events) {
    const spanId = event.spanId || "";
    if (!eventsBySpan.has(spanId)) {
      eventsBySpan.set(spanId, []);
    }
    eventsBySpan.get(spanId).push(event);
  }
  for (const group2 of eventsBySpan.values()) {
    group2.sort((a, b) => a.time - b.time);
  }
  const roots = children.get("") || [];
  const lines = [];
  if (!roots.length && !events.length) {
    return "(empty trace)";
  }
  for (let index = 0; index < roots.length; index++) {
    appendSpan(lines, roots[index], children, eventsBySpan, "", index == roots.length - 1);
  }
  for (const event of eventsBySpan.get("") || []) {
    lines.push(`${symbol(event.severity)} ${event.name}${eventLabel(event)}`);
  }
  return lines.join("\n");
}
function renderSequence(trace3, options = {}) {
  const arrows = sequenceArrows(trace3);
  if (!arrows.length) {
    return renderTree(trace3, options);
  }
  const actors = collectActors(arrows);
  const width = Math.max(14, ...actors.map((actor) => actor.length));
  const gap = "    ";
  const lines = [];
  lines.push(actors.map((actor) => pad(actor, width)).join(gap));
  lines.push(actors.map(() => pad("\u2502", width)).join(gap));
  for (const arrow of arrows) {
    lines.push(sequenceLine(actors, arrow, width, gap));
  }
  return lines.join("\n");
}
function printTrace(trace3, options = {}) {
  const output = renderTrace(trace3, options);
  const out = options.console || console;
  if (!out) {
    return output;
  }
  const title = `${symbol(trace3.severity)} ${traceTitle(trace3)} ${trace3.status || ""} ${formatDuration(trace3.duration || elapsed(trace3))}`.trim();
  if (out.groupCollapsed) {
    out.groupCollapsed("\u24C2\uFE0F  " + title);
  } else if (out.group) {
    out.group("\u24C2\uFE0F  " + title);
  }
  printDiagnostics(trace3.diagnostics || [], out);
  for (const line of output.split("\n")) {
    printLine(line, out);
  }
  if (options.includeRawTrace && out.dir) {
    out.dir(trace3);
  }
  if (out.groupEnd) {
    out.groupEnd();
  }
  return output;
}
function memoryStore() {
  let traces = /* @__PURE__ */ new Map();
  let spans = /* @__PURE__ */ new Map();
  let events = /* @__PURE__ */ new Map();
  let diagnostics = /* @__PURE__ */ new Map();
  let links = /* @__PURE__ */ new Map();
  let last = null;
  return {
    saveTrace(trace3) {
      traces.set(trace3.id, Object.assign({}, trace3));
      last = trace3.id;
    },
    saveSpan(span) {
      spans.set(span.spanId, Object.assign({}, span));
    },
    saveEvent(event) {
      events.set(event.id, Object.assign({}, event));
    },
    saveDiagnostic(diagnostic) {
      diagnostics.set(diagnostic.id, Object.assign({}, diagnostic));
    },
    read(traceId) {
      return assemble(traceId, traces, spans, events, diagnostics);
    },
    lastTraceId() {
      return last;
    },
    link(key, traceId) {
      links.set(key, traceId);
    },
    lookup(key) {
      return links.get(key);
    },
    cleanup() {
    },
    clear() {
      traces.clear();
      spans.clear();
      events.clear();
      diagnostics.clear();
      links.clear();
      last = null;
    }
  };
}
function localStorageStore(options = {}) {
  const storage = options.storage || safeLocalStorage2();
  if (!storage) {
    return memoryStore();
  }
  const prefix = options.prefix || "metro:trace:";
  const key = (suffix) => prefix + suffix;
  return {
    saveTrace(trace3) {
      safeStore(() => {
        storage.setItem(key(`trace:${trace3.id}`), JSON.stringify(trace3));
        storage.setItem(key("last"), trace3.id);
        updateIndex(storage, prefix, trace3.id);
      });
    },
    saveSpan(span) {
      safeStore(() => storage.setItem(key(`span:${span.traceId}:${span.spanId}`), JSON.stringify(span)));
    },
    saveEvent(event) {
      safeStore(() => storage.setItem(key(`event:${event.traceId}:${event.id}`), JSON.stringify(event)));
    },
    saveDiagnostic(diagnostic) {
      safeStore(() => storage.setItem(key(`diagnostic:${diagnostic.traceId}:${diagnostic.id}`), JSON.stringify(diagnostic)));
    },
    read(traceId) {
      return safeStore(() => readLocalTrace(storage, prefix, traceId), null);
    },
    lastTraceId() {
      return safeStore(() => storage.getItem(key("last")), null);
    },
    link(linkKey, traceId) {
      safeStore(() => storage.setItem(key(`link:${linkKey}`), traceId));
    },
    lookup(linkKey) {
      return safeStore(() => storage.getItem(key(`link:${linkKey}`)), null);
    },
    cleanup(cleanupOptions = options) {
      safeStore(() => cleanupLocalStorage(storage, prefix, cleanupOptions));
    },
    clear() {
      safeStore(() => clearLocalStorage(storage, prefix));
    }
  };
}
function safeStore(fn, fallback = void 0) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}
function appendSpan(lines, span, children, eventsBySpan, prefix, isLast) {
  const branch = isLast ? "\u2514\u2500 " : "\u251C\u2500 ";
  lines.push(`${prefix}${branch}${spanLine(span)}`);
  const childPrefix = prefix + (isLast ? "   " : "\u2502  ");
  const childSpans = children.get(span.spanId) || [];
  const childEvents = eventsBySpan.get(span.spanId) || [];
  const items = [
    ...childSpans.map((item) => ({ type: "span", item, time: item.start })),
    ...childEvents.map((item) => ({ type: "event", item, time: item.time }))
  ].sort((a, b) => a.time - b.time);
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const last = index == items.length - 1;
    if (item.type == "span") {
      appendSpan(lines, item.item, children, eventsBySpan, childPrefix, last);
    } else {
      lines.push(`${childPrefix}${last ? "\u2514\u2500 " : "\u251C\u2500 "}${symbol(item.item.severity)} ${item.item.name}${eventLabel(item.item)}`);
    }
  }
}
function spanLine(span) {
  const status2 = span.status == "running" ? "pending" : span.severity || span.status || "ok";
  const response3 = span.response?.status ? ` HTTP ${span.response.status}` : "";
  const url3 = span.data?.url ? ` ${displayURL2(span.data.url)}` : "";
  return `${symbol(status2)} ${span.name}${response3}${url3} ${formatDuration(span.duration || elapsed(span))}`.trim();
}
function eventLabel(event) {
  if (event.data?.label) {
    return ` \u2014 ${event.data.label}`;
  }
  if (event.data?.url) {
    return ` ${displayURL2(event.data.url)}`;
  }
  return "";
}
function sequenceArrows(trace3) {
  const arrows = [];
  const spans = [...trace3.spans || []].sort((a, b) => a.start - b.start);
  const roots = spans.filter((span) => !span.parentSpanId);
  for (const span of roots) {
    arrows.push({
      from: "App",
      to: "Metro",
      label: `${span.data?.method || ""} ${displayURL2(span.data?.url)}`.trim() || span.name,
      severity: span.severity,
      time: span.start
    });
  }
  for (const span of spans) {
    if (span.kind == "fetch" || span.name == "browserFetch") {
      const host = hostActor(span.data?.url);
      arrows.push({
        from: "Metro",
        to: host,
        label: `${span.data?.method || "GET"} ${pathLabel(span.data?.url)}`,
        severity: span.severity,
        time: span.start
      });
      if (span.response || span.error || span.status == "running") {
        arrows.push({
          from: host,
          to: "Metro",
          label: span.error ? `error: ${span.error.message}` : span.response?.status ? `${span.response.status}` : "pending",
          severity: span.severity,
          time: span.end || now()
        });
      }
    }
  }
  for (const event of trace3.events || []) {
    if (event.data?.from && event.data?.to) {
      arrows.push({
        from: event.data.from,
        to: event.data.to,
        label: event.data.label || event.name,
        severity: event.severity,
        time: event.time
      });
    }
  }
  return arrows.sort((a, b) => a.time - b.time);
}
function collectActors(arrows) {
  const actors = [];
  for (const arrow of arrows) {
    if (!actors.includes(arrow.from)) {
      actors.push(arrow.from);
    }
    if (!actors.includes(arrow.to)) {
      actors.push(arrow.to);
    }
  }
  return actors;
}
function sequenceLine(actors, arrow, width, gap) {
  const from = actors.indexOf(arrow.from);
  const to = actors.indexOf(arrow.to);
  const left = Math.min(from, to);
  const right = Math.max(from, to);
  const cells = actors.map(() => pad("\u2502", width));
  const label = `${symbol(arrow.severity)} ${arrow.label}`.trim();
  for (let index = left; index <= right; index++) {
    if (index == from) {
      cells[index] = pad(from < to ? "\u251C" : "\u25C0", width);
    } else if (index == to) {
      cells[index] = pad(from < to ? "\u25B6" : "\u2524", width);
    } else {
      cells[index] = pad("\u2500", width);
    }
  }
  return cells.join(gap) + "  " + label;
}
function printDiagnostics(diagnostics, out) {
  const primary = primaryDiagnostic(diagnostics);
  if (primary && out.error) {
    out.error(`${symbol(primary.severity)} ${primary.code}: ${primary.message}`);
  }
  for (const diagnostic of diagnostics) {
    if (diagnostic == primary) {
      continue;
    }
    printLine(`${symbol(diagnostic.severity)} ${diagnostic.code}: ${diagnostic.message}`, out);
  }
}
function printLine(line, out) {
  if (/✖|⛔/.test(line) && out.error) {
    out.error(line);
  } else if (/⚠/.test(line) && out.warn) {
    out.warn(line);
  } else if (out.log) {
    out.log(line);
  }
}
function assemble(traceId, traces, spans, events, diagnostics) {
  const trace3 = traces.get(traceId);
  if (!trace3) {
    return null;
  }
  const result = Object.assign({}, trace3);
  result.spans = [...spans.values()].filter((span) => span.traceId == traceId);
  result.events = [...events.values()].filter((event) => event.traceId == traceId);
  result.diagnostics = [...diagnostics.values()].filter((diagnostic) => diagnostic.traceId == traceId);
  result.status = result.status == "running" ? traceStatus(result) : result.status;
  result.severity = traceSeverity(result);
  return result;
}
function readLocalTrace(storage, prefix, traceId) {
  if (!traceId) {
    return null;
  }
  const trace3 = parseJSON(storage.getItem(prefix + `trace:${traceId}`));
  if (!trace3) {
    return null;
  }
  trace3.spans = [];
  trace3.events = [];
  trace3.diagnostics = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(prefix + `span:${traceId}:`)) {
      trace3.spans.push(parseJSON(storage.getItem(key)));
    } else if (key?.startsWith(prefix + `event:${traceId}:`)) {
      trace3.events.push(parseJSON(storage.getItem(key)));
    } else if (key?.startsWith(prefix + `diagnostic:${traceId}:`)) {
      trace3.diagnostics.push(parseJSON(storage.getItem(key)));
    }
  }
  trace3.spans = trace3.spans.filter(Boolean);
  trace3.events = trace3.events.filter(Boolean);
  trace3.diagnostics = trace3.diagnostics.filter(Boolean);
  trace3.status = trace3.status == "running" ? traceStatus(trace3) : trace3.status;
  trace3.severity = traceSeverity(trace3);
  return trace3;
}
function updateIndex(storage, prefix, traceId) {
  const indexKey = prefix + "index";
  const index = parseJSON(storage.getItem(indexKey)) || [];
  const next = [traceId, ...index.filter((id2) => id2 != traceId)];
  storage.setItem(indexKey, JSON.stringify(next));
}
function cleanupLocalStorage(storage, prefix, options = {}) {
  const indexKey = prefix + "index";
  const index = parseJSON(storage.getItem(indexKey)) || [];
  const maxAge = options.maxAge ?? DEFAULT_OPTIONS.maxAge;
  const maxTraces = options.maxTraces ?? DEFAULT_OPTIONS.maxTraces;
  const keep = [];
  const remove2 = [];
  const cutoff = now() - maxAge;
  for (const traceId of index) {
    const trace3 = parseJSON(storage.getItem(prefix + `trace:${traceId}`));
    if (!trace3 || trace3.start < cutoff || keep.length >= maxTraces) {
      remove2.push(traceId);
    } else {
      keep.push(traceId);
    }
  }
  for (const traceId of remove2) {
    removeTrace(storage, prefix, traceId);
  }
  storage.setItem(indexKey, JSON.stringify(keep));
}
function clearLocalStorage(storage, prefix) {
  const keys = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    storage.removeItem(key);
  }
}
function removeTrace(storage, prefix, traceId) {
  const keys = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key == prefix + `trace:${traceId}` || key?.startsWith(prefix + `span:${traceId}:`) || key?.startsWith(prefix + `event:${traceId}:`) || key?.startsWith(prefix + `diagnostic:${traceId}:`)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    storage.removeItem(key);
  }
}
function traceStatus(trace3) {
  const spans = trace3.spans || [];
  if (spans.some((span) => span.status == "running")) {
    return "incomplete";
  }
  if ((trace3.diagnostics || []).some((diagnostic) => diagnostic.severity == "error" || diagnostic.severity == "blocked")) {
    return "error";
  }
  if ((trace3.diagnostics || []).some((diagnostic) => diagnostic.severity == "warning")) {
    return "warning";
  }
  return "ok";
}
function traceSeverity(trace3) {
  let severity = trace3.status == "running" ? "pending" : "ok";
  for (const span of trace3.spans || []) {
    severity = maxSeverity(severity, span.severity || span.status || "ok");
  }
  for (const diagnostic of trace3.diagnostics || []) {
    severity = maxSeverity(severity, diagnostic.severity || "warning");
  }
  return severity;
}
function primaryDiagnostic(diagnostics) {
  return [...diagnostics].sort((a, b) => (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0))[0];
}
function maxSeverity(a, b) {
  return (SEVERITY_WEIGHT[b] || 0) > (SEVERITY_WEIGHT[a] || 0) ? b : a;
}
function symbol(status2) {
  return SEVERITY_SYMBOL[status2] || SEVERITY_SYMBOL.info;
}
function requestName(req) {
  return `${req?.method || "GET"} ${displayURL2(req?.url)}`;
}
function middlewareName(middleware) {
  return middleware?.displayName || middleware?.traceName || middleware?.name || "anonymous middleware";
}
function middlewareKind(middleware) {
  return middlewareName(middleware) == "browserFetch" ? "fetch" : "middleware";
}
function responseSummary(res) {
  if (!res) {
    return null;
  }
  return {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    url: safeURL(res.url),
    redirected: res.redirected,
    type: res.type
  };
}
function errorSummary(error4) {
  return {
    name: error4?.name,
    message: error4?.message || String(error4),
    stack: error4?.stack
  };
}
function traceTitle(trace3) {
  return trace3?.name || trace3?.id || "Metro trace";
}
function safeURL(value) {
  if (!value) {
    return value;
  }
  try {
    const url3 = new URL(value, typeof window != "undefined" ? window.location.href : "https://localhost/");
    url3.username = "";
    url3.password = "";
    for (const param of [...url3.searchParams.keys()]) {
      if (isSecretName(param)) {
        url3.searchParams.set(param, "\u2026");
      }
    }
    return url3.href;
  } catch (e) {
    return String(value);
  }
}
function displayURL2(value) {
  if (!value) {
    return "";
  }
  try {
    const url3 = new URL(value, "https://localhost/");
    return url3.origin == "https://localhost" ? url3.pathname + url3.search : url3.href;
  } catch (e) {
    return String(value);
  }
}
function hostActor(value) {
  try {
    return new URL(value, "https://localhost/").host || "Network";
  } catch (e) {
    return "Network";
  }
}
function pathLabel(value) {
  try {
    const url3 = new URL(value, "https://localhost/");
    return url3.pathname + url3.search;
  } catch (e) {
    return displayURL2(value);
  }
}
function sanitizeData(data) {
  const result = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (["traceId", "parentSpanId", "severity"].includes(key)) {
      continue;
    }
    if (isSecretName(key)) {
      result[key] = "\u2026";
    } else if (value instanceof URL) {
      result[key] = safeURL(value.href);
    } else if (typeof value == "string" && looksLikeURL(value)) {
      result[key] = safeURL(value);
    } else if (value == null || ["string", "number", "boolean"].includes(typeof value)) {
      result[key] = value;
    } else {
      result[key] = String(value);
    }
  }
  return result;
}
function isSecretName(name) {
  return /token|secret|password|credential|cookie|authorization|verifier|assertion|code/i.test(name);
}
function looksLikeURL(value) {
  return /^https?:\/\//.test(value) || /^\//.test(value);
}
function formatDuration(duration) {
  if (typeof duration != "number" || Number.isNaN(duration)) {
    return "";
  }
  if (duration < 1e3) {
    return `${Math.round(duration)}ms`;
  }
  return `${(duration / 1e3).toFixed(2)}s`;
}
function elapsed(item) {
  return item?.start ? now() - item.start : 0;
}
function now() {
  return Date.now();
}
function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
function pad(value, width) {
  value = String(value);
  return value + " ".repeat(Math.max(0, width - value.length));
}
function parseJSON(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (e) {
    return null;
  }
}
function safeLocalStorage2() {
  try {
    return typeof localStorage != "undefined" ? localStorage : null;
  } catch (e) {
    return null;
  }
}
var DEFAULT_OPTIONS, SEVERITY_WEIGHT, SEVERITY_SYMBOL, GraphTracer;
var init_tracegraph = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-trace/src/tracegraph.mjs"() {
    DEFAULT_OPTIONS = {
      name: "Metro trace",
      view: "tree",
      persist: true,
      autoPrint: true,
      includeRawTrace: false,
      maxAge: 10 * 60 * 1e3,
      maxTraces: 20,
      slowStepMs: 1e3,
      store: null,
      expectedStatus: (status2) => status2 < 400,
      console: typeof console != "undefined" ? console : null
    };
    SEVERITY_WEIGHT = {
      ok: 0,
      info: 1,
      warning: 2,
      error: 3,
      blocked: 4
    };
    SEVERITY_SYMBOL = {
      ok: "\u2713",
      info: "\u2139",
      warning: "\u26A0",
      error: "\u2716",
      blocked: "\u26D4",
      skipped: "\u23ED",
      pending: "\u2026"
    };
    GraphTracer = class {
      constructor(options = {}) {
        this.options = Object.assign({}, DEFAULT_OPTIONS, options);
        if (!this.options.store) {
          this.options.store = this.options.persist ? localStorageStore(this.options) : memoryStore();
        }
        this.store = this.options.store;
        this.defaultState = traceState();
        this.runs = /* @__PURE__ */ new Map();
        this.lastTraceId = null;
        this.store.cleanup?.(this.options);
      }
      request(req, middleware, context = null) {
        const state = this.state(context);
        if (!state.activeTraceId) {
          this.startTrace(requestName(req), {}, context);
        }
        this.startSpan(middlewareName(middleware), {
          kind: middlewareKind(middleware),
          method: req?.method,
          url: safeURL(req?.url)
        }, context);
      }
      response(res, middleware, context = null) {
        const state = this.state(context);
        const span = state.stack.pop();
        if (!span) {
          return;
        }
        span.end = now();
        span.duration = span.end - span.start;
        span.response = responseSummary(res);
        span.status = "ok";
        span.severity = "ok";
        this.addResponseDiagnostics(span, res, context);
        this.store.saveSpan(span);
        this.finishTraceIfComplete(null, context);
      }
      error(error4, req, middleware, context = null) {
        const state = this.state(context);
        const span = state.stack.pop();
        if (!span) {
          return;
        }
        span.end = now();
        span.duration = span.end - span.start;
        span.status = "error";
        span.severity = "error";
        span.error = errorSummary(error4);
        this.store.saveSpan(span);
        const message = error4?.message || "Middleware failed";
        const trace3 = this.store.read(span.traceId);
        const alreadyReported = trace3?.diagnostics?.some((diagnostic) => diagnostic.data?.errorMessage == message);
        if (span.kind == "fetch" || !alreadyReported) {
          this.diagnostic({
            traceId: span.traceId,
            spanId: span.spanId,
            severity: "error",
            code: span.kind == "fetch" ? "network-error" : "middleware-error",
            message,
            data: {
              middleware: middlewareName(middleware),
              method: req?.method,
              url: safeURL(req?.url),
              name: error4?.name,
              errorMessage: message
            }
          }, context);
        }
        this.finishTraceIfComplete("error", context);
      }
      /**
       * Add a custom event to the current trace. Use from/to metadata to make it
       * appear in sequence diagrams.
       */
      event(name, data = {}, context = null) {
        const state = this.state(context);
        const traceId = data.traceId || state.activeTraceId || state.lastTraceId || this.lastTraceId || this.startTrace(this.options.name, {}, context);
        const parent = data.parentSpanId || state.stack[state.stack.length - 1]?.spanId || state.activeParentSpanId || null;
        const event = {
          id: id("event"),
          traceId,
          spanId: parent,
          time: now(),
          name,
          severity: data.severity || "info",
          data: sanitizeData(data)
        };
        this.store.saveEvent(event);
        return event;
      }
      /**
       * Record a manual span. This is useful for middleware internals that are not
       * represented by a Metro fetch call, for example token validation or PKCE.
       */
      async span(name, fn, data = {}, context = null) {
        this.startSpan(name, data, context);
        try {
          const result = await fn();
          this.response(data.response || { status: 200 }, { name }, context);
          return result;
        } catch (error4) {
          this.error(error4, null, { name }, context);
          throw error4;
        }
      }
      startTrace(name, data = {}, context = null) {
        const state = this.state(context);
        const trace3 = {
          id: data.traceId || id("trace"),
          name,
          start: now(),
          status: "running",
          severity: "ok",
          data: sanitizeData(data)
        };
        state.activeTraceId = trace3.id;
        state.lastTraceId = trace3.id;
        this.lastTraceId = trace3.id;
        this.store.saveTrace(trace3);
        return trace3.id;
      }
      startSpan(name, data = {}, context = null) {
        const state = this.state(context);
        const traceId = data.traceId || state.activeTraceId || this.startTrace(this.options.name, {}, context);
        const parentSpanId = data.parentSpanId || state.stack[state.stack.length - 1]?.spanId || state.activeParentSpanId || null;
        const span = {
          traceId,
          spanId: id("span"),
          parentSpanId,
          name,
          kind: data.kind || "manual",
          start: now(),
          status: "running",
          severity: "ok",
          data: sanitizeData(data)
        };
        state.stack.push(span);
        this.store.saveSpan(span);
        return span;
      }
      diagnostic(diagnostic, context = null) {
        const state = this.state(context);
        const currentSpan = state.stack[state.stack.length - 1];
        const traceId = diagnostic.traceId || currentSpan?.traceId || state.activeTraceId || state.lastTraceId || this.lastTraceId;
        if (!traceId) {
          return null;
        }
        const result = Object.assign({
          id: id("diagnostic"),
          traceId,
          spanId: diagnostic.spanId || currentSpan?.spanId || null,
          time: now(),
          severity: "warning"
        }, diagnostic);
        result.data = sanitizeData(result.data || {});
        this.store.saveDiagnostic(result);
        return result;
      }
      current(context = null) {
        const state = this.state(context);
        return {
          traceId: state.activeTraceId,
          spanId: state.stack[state.stack.length - 1]?.spanId || state.activeParentSpanId || null
        };
      }
      /**
       * Remember a trace id under a stable key, for example an OAuth state value.
       * The key is local to this trace store.
       */
      link(key, traceId = void 0, context = null) {
        const state = this.state(context);
        traceId = traceId || state.activeTraceId || state.lastTraceId || this.lastTraceId;
        if (key && traceId) {
          this.store.link(key, traceId);
        }
        return traceId;
      }
      /**
       * Resume adding manual events/spans to a trace after a redirect or popup.
       */
      resume(traceId, parentSpanId = null, context = null) {
        if (!traceId) {
          return null;
        }
        const state = this.state(context);
        state.activeTraceId = traceId;
        state.activeParentSpanId = parentSpanId;
        state.lastTraceId = traceId;
        this.lastTraceId = traceId;
        return this.current(context);
      }
      resumeLink(key, parentSpanId = null, context = null) {
        return this.resume(this.store.lookup(key), parentSpanId, context);
      }
      pause(context = null) {
        if (context?.__metroTraceContext) {
          this.runs.delete(context.id);
          return;
        }
        this.defaultState = traceState();
      }
      get(traceId = this.lastTraceId) {
        return this.store.read(traceId);
      }
      print(traceId = this.lastTraceId, options = {}) {
        const trace3 = typeof traceId == "object" ? traceId : this.get(traceId);
        if (!trace3) {
          return null;
        }
        return printTrace(trace3, Object.assign({}, this.options, options));
      }
      printLast(options = {}) {
        return this.print(this.lastTraceId || this.store.lastTraceId?.(), options);
      }
      render(traceId = this.lastTraceId, options = {}) {
        const trace3 = typeof traceId == "object" ? traceId : this.get(traceId);
        if (!trace3) {
          return "";
        }
        return renderTrace(trace3, Object.assign({}, this.options, options));
      }
      clear() {
        this.store.clear();
        this.defaultState = traceState();
        this.runs.clear();
        this.lastTraceId = null;
      }
      addResponseDiagnostics(span, res, context = null) {
        if (span.duration >= this.options.slowStepMs) {
          span.severity = maxSeverity(span.severity, "warning");
          this.diagnostic({
            traceId: span.traceId,
            spanId: span.spanId,
            severity: "warning",
            code: "slow-step",
            message: `${span.name} took ${formatDuration(span.duration)}`,
            data: { threshold: this.options.slowStepMs, actual: span.duration }
          }, context);
        }
        if (!res || typeof res.status == "undefined" || span.kind != "fetch") {
          return;
        }
        if (this.statusExpected(res.status, span) === false) {
          const severity = res.status >= 500 ? "error" : "warning";
          span.status = severity == "error" ? "error" : "warning";
          span.severity = maxSeverity(span.severity, severity);
          this.diagnostic({
            traceId: span.traceId,
            spanId: span.spanId,
            severity,
            code: "unexpected-status",
            message: `${span.name} returned unexpected HTTP ${res.status}`,
            data: { status: res.status, url: span.data?.url }
          }, context);
        }
      }
      statusExpected(status2, span) {
        const expected = this.options.expectedStatus;
        if (typeof expected == "function") {
          return expected(status2, span);
        }
        if (Array.isArray(expected)) {
          return expected.includes(status2);
        }
        return status2 < 400;
      }
      finishTraceIfComplete(status2 = null, context = null) {
        const state = this.state(context);
        if (state.stack.length || !state.activeTraceId) {
          return;
        }
        if (context?.parent) {
          this.runs.delete(context.id);
          return;
        }
        const trace3 = this.store.read(state.activeTraceId);
        if (!trace3) {
          this.pause(context);
          return;
        }
        trace3.end = now();
        trace3.duration = trace3.end - trace3.start;
        trace3.status = status2 || traceStatus(trace3);
        trace3.severity = traceSeverity(trace3);
        this.store.saveTrace(trace3);
        state.lastTraceId = trace3.id;
        this.lastTraceId = trace3.id;
        if (this.options.autoPrint) {
          this.print(trace3.id);
        }
        this.pause(context);
      }
      state(context = null) {
        if (!context?.__metroTraceContext) {
          return this.defaultState;
        }
        let state = this.runs.get(context.id);
        if (state) {
          return state;
        }
        state = traceState();
        const parentState = context.parent ? this.runs.get(context.parent.id) : null;
        if (parentState) {
          state.activeTraceId = parentState.activeTraceId;
          state.activeParentSpanId = parentState.stack[parentState.stack.length - 1]?.spanId || parentState.activeParentSpanId || null;
          state.lastTraceId = parentState.lastTraceId;
        }
        this.runs.set(context.id, state);
        return state;
      }
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-trace/src/index.mjs
var src_exports4 = {};
__export(src_exports4, {
  GraphTracer: () => GraphTracer,
  add: () => add,
  clear: () => clear,
  default: () => src_default3,
  delete: () => remove,
  graph: () => graph,
  group: () => group,
  localConsole: () => localConsole,
  remove: () => remove
});
function add(name, tracer) {
  Client.tracers[name] = tracer;
}
function remove(name) {
  delete Client.tracers[name];
}
function clear() {
  Client.tracers = {};
}
function group() {
  let group2 = 0;
  return {
    request: (req, middleware) => {
      group2++;
      metroConsole2.group(group2);
      metroConsole2.info(req?.url, req, middleware);
    },
    response: (res, middleware) => {
      metroConsole2.info(res?.body ? res.body[Symbol.metroSource] : null, res, middleware);
      metroConsole2.groupEnd(group2);
      group2--;
    },
    error: (error4) => {
      metroConsole2.info(error4);
      metroConsole2.groupEnd(group2);
      group2--;
    }
  };
}
var metroConsole2, src_default3;
var init_src4 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-trace/src/index.mjs"() {
    init_src();
    init_tracegraph();
    init_tracegraph();
    metroConsole2 = {
      info: (message, ...details) => console.info("\u24C2\uFE0F  ", message, ...details),
      group: (name) => console.group("\u24C2\uFE0F  " + name),
      groupEnd: (name) => console.groupEnd("\u24C2\uFE0F  " + name)
    };
    src_default3 = {
      add,
      delete: remove,
      remove,
      clear,
      group,
      graph: (...args) => graph(...args),
      localConsole: (...args) => localConsole(...args)
    };
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-hashparams/src/index.mjs
var src_exports5 = {};
__export(src_exports5, {
  append: () => append,
  clear: () => clear2,
  parse: () => parse
});
function parse(url3) {
  const hash = url(url3).hash.substr(1);
  const query = /\?[^#]*/.exec(hash)?.[0];
  return new URLSearchParams(query);
}
function append(url3, params) {
  url3 = url(url3);
  if (!(params instanceof URLSearchParams)) {
    params = new URLSearchParams(params);
  }
  let hash = url3.hash || "#";
  hash += "?" + params;
  return url3.with({ hash });
}
function clear2(url3) {
  url3 = url(url3);
  let hash = url3.hash.replace(/\?[^#]*/, "");
  if (hash.substr(0, 2) === "##") {
    hash = hash.substr(1);
  }
  return url3.with({ hash });
}
var init_src5 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-hashparams/src/index.mjs"() {
    init_src();
  }
});

// ../solid-tools/node_modules/@muze-nl/metro-formdata/src/index.mjs
function formdata(...options) {
  var params = new FormData();
  for (let option of options) {
    if (typeof HTMLFormElement != "undefined" && option instanceof HTMLFormElement) {
      option = new FormData(option);
    }
    if (option instanceof FormData) {
      for (let entry of option.entries()) {
        params.append(entry[0], entry[1]);
      }
    } else if (option && typeof option == "object") {
      for (let entry of Object.entries(option)) {
        if (Array.isArray(entry[1])) {
          for (let value of entry[1]) {
            params.append(entry[0], value);
          }
        } else {
          params.append(entry[0], entry[1]);
        }
      }
    } else {
      throw metroError("metro.formdata: unknown option type " + metroURL2 + "formdata/unknown-option-value/", option);
    }
  }
  Object.freeze(params);
  return new Proxy(params, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        //TODO: add toString() that can check
        //headers param: toString({headers:request.headers})
        //for the content-type
        case "with":
          result = function(...options2) {
            return formdata(target, ...options2);
          };
          break;
        default:
          if (target[prop] instanceof Function) {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
var metroURL2;
var init_src6 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro-formdata/src/index.mjs"() {
    init_src();
    metroURL2 = "https://metro.muze.nl/details/";
    if (!Symbol.metroProxy) {
      Symbol.metroProxy = Symbol("isProxy");
    }
    if (!Symbol.metroSource) {
      Symbol.metroSource = Symbol("source");
    }
  }
});

// ../solid-tools/node_modules/@muze-nl/metro/src/index.mjs
var src_exports6 = {};
__export(src_exports6, {
  API: () => API,
  Client: () => Client,
  JsonAPI: () => JsonAPI,
  api: () => api,
  client: () => client,
  deepClone: () => deepClone,
  default: () => src_default4,
  formdata: () => formdata,
  hashParams: () => src_exports5,
  jsonApi: () => jsonApi,
  metroError: () => metroError,
  mw: () => src_default2,
  request: () => request,
  response: () => response,
  trace: () => src_exports4,
  url: () => url
});
var metro, src_default4;
var init_src7 = __esm({
  "../solid-tools/node_modules/@muze-nl/metro/src/index.mjs"() {
    init_src();
    init_src3();
    init_src2();
    init_src4();
    init_src5();
    init_src6();
    init_src();
    init_src3();
    init_src2();
    init_src4();
    init_src5();
    init_src6();
    metro = Object.assign({}, src_exports3, {
      API,
      JsonAPI,
      api,
      jsonApi,
      mw: src_default2,
      trace: src_exports4,
      hashParams: src_exports5,
      formdata
    });
    src_default4 = metro;
  }
});

// ../solid-tools/node_modules/base64-js/index.js
var require_base64_js = __commonJS({
  "../solid-tools/node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// ../solid-tools/node_modules/ieee754/index.js
var require_ieee754 = __commonJS({
  "../solid-tools/node_modules/ieee754/index.js"(exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// ../solid-tools/node_modules/buffer/index.js
var require_buffer = __commonJS({
  "../solid-tools/node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js();
    var ieee754 = require_ieee754();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer4;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer4.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer4.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer4.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer4.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer4.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer4.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf2 = new Uint8Array(length);
      Object.setPrototypeOf(buf2, Buffer4.prototype);
      return buf2;
    }
    function Buffer4(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer4.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer4.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer4.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer4.from = function(value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer4.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer4, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer4.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer4.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer4.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer4.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf2 = createBuffer(length);
      const actual = buf2.write(string, encoding);
      if (actual !== length) {
        buf2 = buf2.slice(0, actual);
      }
      return buf2;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf2 = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf2[i] = array[i] & 255;
      }
      return buf2;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf2;
      if (byteOffset === void 0 && length === void 0) {
        buf2 = new Uint8Array(array);
      } else if (length === void 0) {
        buf2 = new Uint8Array(array, byteOffset);
      } else {
        buf2 = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf2, Buffer4.prototype);
      return buf2;
    }
    function fromObject(obj) {
      if (Buffer4.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf2 = createBuffer(len);
        if (buf2.length === 0) {
          return buf2;
        }
        obj.copy(buf2, 0, 0, len);
        return buf2;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer4.alloc(+length);
    }
    Buffer4.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer4.prototype;
    };
    Buffer4.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer4.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer4.from(b, b.offset, b.byteLength);
      if (!Buffer4.isBuffer(a) || !Buffer4.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer4.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer4.concat = function concat(list2, length) {
      if (!Array.isArray(list2)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list2.length === 0) {
        return Buffer4.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list2.length; ++i) {
          length += list2[i].length;
        }
      }
      const buffer = Buffer4.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list2.length; ++i) {
        let buf2 = list2[i];
        if (isInstance(buf2, Uint8Array)) {
          if (pos + buf2.length > buffer.length) {
            if (!Buffer4.isBuffer(buf2)) buf2 = Buffer4.from(buf2);
            buf2.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf2,
              pos
            );
          }
        } else if (!Buffer4.isBuffer(buf2)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf2.copy(buffer, pos);
        }
        pos += buf2.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer4.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer4.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer4.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer4.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer4.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer4.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer4.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer4.prototype.toLocaleString = Buffer4.prototype.toString;
    Buffer4.prototype.equals = function equals(b) {
      if (!Buffer4.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer4.compare(this, b) === 0;
    };
    Buffer4.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer4.prototype[customInspectSymbol] = Buffer4.prototype.inspect;
    }
    Buffer4.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer4.from(target, target.offset, target.byteLength);
      }
      if (!Buffer4.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer4.from(val, encoding);
      }
      if (Buffer4.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf2, i2) {
        if (indexSize === 1) {
          return buf2[i2];
        } else {
          return buf2.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer4.prototype.includes = function includes2(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer4.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer4.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf2, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf2.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf2[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf2, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf2.length - offset), buf2, offset, length);
    }
    function asciiWrite(buf2, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf2, offset, length);
    }
    function base64Write(buf2, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf2, offset, length);
    }
    function ucs2Write(buf2, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf2.length - offset), buf2, offset, length);
    }
    Buffer4.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer4.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf2, start, end) {
      if (start === 0 && end === buf2.length) {
        return base64.fromByteArray(buf2);
      } else {
        return base64.fromByteArray(buf2.slice(start, end));
      }
    }
    function utf8Slice(buf2, start, end) {
      end = Math.min(buf2.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf2[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf2[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf2[i + 1];
              thirdByte = buf2[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf2[i + 1];
              thirdByte = buf2[i + 2];
              fourthByte = buf2[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf2, start, end) {
      let ret = "";
      end = Math.min(buf2.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf2[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf2, start, end) {
      let ret = "";
      end = Math.min(buf2.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf2[i]);
      }
      return ret;
    }
    function hexSlice(buf2, start, end) {
      const len = buf2.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf2[i]];
      }
      return out;
    }
    function utf16leSlice(buf2, start, end) {
      const bytes = buf2.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer4.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer4.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer4.prototype.readUintLE = Buffer4.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer4.prototype.readUintBE = Buffer4.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer4.prototype.readUint8 = Buffer4.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer4.prototype.readUint16LE = Buffer4.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer4.prototype.readUint16BE = Buffer4.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer4.prototype.readUint32LE = Buffer4.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer4.prototype.readUint32BE = Buffer4.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer4.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first3 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer4.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first3 * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer4.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer4.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer4.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer4.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer4.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer4.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer4.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer4.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first3 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer4.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first3 << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer4.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer4.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer4.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer4.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf2, value, offset, ext, max, min) {
      if (!Buffer4.isBuffer(buf2)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf2.length) throw new RangeError("Index out of range");
    }
    Buffer4.prototype.writeUintLE = Buffer4.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeUintBE = Buffer4.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeUint8 = Buffer4.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer4.prototype.writeUint16LE = Buffer4.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer4.prototype.writeUint16BE = Buffer4.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer4.prototype.writeUint32LE = Buffer4.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer4.prototype.writeUint32BE = Buffer4.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf2, value, offset, min, max) {
      checkIntBI(value, min, max, buf2, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf2, value, offset, min, max) {
      checkIntBI(value, min, max, buf2, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf2[offset + 7] = lo;
      lo = lo >> 8;
      buf2[offset + 6] = lo;
      lo = lo >> 8;
      buf2[offset + 5] = lo;
      lo = lo >> 8;
      buf2[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf2[offset + 3] = hi;
      hi = hi >> 8;
      buf2[offset + 2] = hi;
      hi = hi >> 8;
      buf2[offset + 1] = hi;
      hi = hi >> 8;
      buf2[offset] = hi;
      return offset + 8;
    }
    Buffer4.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer4.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer4.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer4.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer4.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer4.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer4.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer4.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer4.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf2, value, offset, ext, max, min) {
      if (offset + ext > buf2.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf2, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf2, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf2, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer4.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer4.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf2, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf2, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf2, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer4.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer4.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer4.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer4.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer4.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer4.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer4.isBuffer(val) ? val : Buffer4.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input2) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input2;
        if (Number.isInteger(input2) && Math.abs(input2) > 2 ** 32) {
          received = addNumericalSeparator(String(input2));
        } else if (typeof input2 === "bigint") {
          received = String(input2);
          if (input2 > BigInt(2) ** BigInt(32) || input2 < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf2, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf2[offset] === void 0 || buf2[offset + byteLength2] === void 0) {
        boundsError(offset, buf2.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf2, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf2, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// node_modules/base64-js/index.js
var require_base64_js2 = __commonJS({
  "node_modules/base64-js/index.js"(exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }
    var i;
    var len;
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function getLens(b64) {
      var len2 = b64.length;
      if (len2 % 4 > 0) {
        throw new Error("Invalid string. Length must be a multiple of 4");
      }
      var validLen = b64.indexOf("=");
      if (validLen === -1) validLen = len2;
      var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
      return [validLen, placeHoldersLen];
    }
    function byteLength(b64) {
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function _byteLength(b64, validLen, placeHoldersLen) {
      return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
    }
    function toByteArray(b64) {
      var tmp;
      var lens = getLens(b64);
      var validLen = lens[0];
      var placeHoldersLen = lens[1];
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
      var curByte = 0;
      var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
      var i2;
      for (i2 = 0; i2 < len2; i2 += 4) {
        tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
        arr[curByte++] = tmp >> 16 & 255;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 2) {
        tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
        arr[curByte++] = tmp & 255;
      }
      if (placeHoldersLen === 1) {
        tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
        arr[curByte++] = tmp >> 8 & 255;
        arr[curByte++] = tmp & 255;
      }
      return arr;
    }
    function tripletToBase64(num) {
      return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];
      for (var i2 = start; i2 < end; i2 += 3) {
        tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
        output.push(tripletToBase64(tmp));
      }
      return output.join("");
    }
    function fromByteArray(uint8) {
      var tmp;
      var len2 = uint8.length;
      var extraBytes = len2 % 3;
      var parts = [];
      var maxChunkLength = 16383;
      for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
        parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
      }
      if (extraBytes === 1) {
        tmp = uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
        );
      } else if (extraBytes === 2) {
        tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
        parts.push(
          lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
        );
      }
      return parts.join("");
    }
  }
});

// node_modules/ieee754/index.js
var require_ieee7542 = __commonJS({
  "node_modules/ieee754/index.js"(exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? nBytes - 1 : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];
      i += d;
      e = s & (1 << -nBits) - 1;
      s >>= -nBits;
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      m = e & (1 << -nBits) - 1;
      e >>= -nBits;
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {
      }
      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : (s ? -1 : 1) * Infinity;
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
      var i = isLE ? 0 : nBytes - 1;
      var d = isLE ? 1 : -1;
      var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
      value = Math.abs(value);
      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }
        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }
      for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
      }
      e = e << mLen | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
      }
      buffer[offset + i - d] |= s * 128;
    };
  }
});

// node_modules/buffer/index.js
var require_buffer2 = __commonJS({
  "node_modules/buffer/index.js"(exports) {
    "use strict";
    var base64 = require_base64_js2();
    var ieee754 = require_ieee7542();
    var customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
    exports.Buffer = Buffer4;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;
    var K_MAX_LENGTH = 2147483647;
    exports.kMaxLength = K_MAX_LENGTH;
    Buffer4.TYPED_ARRAY_SUPPORT = typedArraySupport();
    if (!Buffer4.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
      console.error(
        "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
      );
    }
    function typedArraySupport() {
      try {
        const arr = new Uint8Array(1);
        const proto = { foo: function() {
          return 42;
        } };
        Object.setPrototypeOf(proto, Uint8Array.prototype);
        Object.setPrototypeOf(arr, proto);
        return arr.foo() === 42;
      } catch (e) {
        return false;
      }
    }
    Object.defineProperty(Buffer4.prototype, "parent", {
      enumerable: true,
      get: function() {
        if (!Buffer4.isBuffer(this)) return void 0;
        return this.buffer;
      }
    });
    Object.defineProperty(Buffer4.prototype, "offset", {
      enumerable: true,
      get: function() {
        if (!Buffer4.isBuffer(this)) return void 0;
        return this.byteOffset;
      }
    });
    function createBuffer(length) {
      if (length > K_MAX_LENGTH) {
        throw new RangeError('The value "' + length + '" is invalid for option "size"');
      }
      const buf2 = new Uint8Array(length);
      Object.setPrototypeOf(buf2, Buffer4.prototype);
      return buf2;
    }
    function Buffer4(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        if (typeof encodingOrOffset === "string") {
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        }
        return allocUnsafe(arg);
      }
      return from(arg, encodingOrOffset, length);
    }
    Buffer4.poolSize = 8192;
    function from(value, encodingOrOffset, length) {
      if (typeof value === "string") {
        return fromString(value, encodingOrOffset);
      }
      if (ArrayBuffer.isView(value)) {
        return fromArrayView(value);
      }
      if (value == null) {
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
        );
      }
      if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer)) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof SharedArrayBuffer !== "undefined" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer))) {
        return fromArrayBuffer(value, encodingOrOffset, length);
      }
      if (typeof value === "number") {
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      }
      const valueOf = value.valueOf && value.valueOf();
      if (valueOf != null && valueOf !== value) {
        return Buffer4.from(valueOf, encodingOrOffset, length);
      }
      const b = fromObject(value);
      if (b) return b;
      if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
        return Buffer4.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
      }
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value
      );
    }
    Buffer4.from = function(value, encodingOrOffset, length) {
      return from(value, encodingOrOffset, length);
    };
    Object.setPrototypeOf(Buffer4.prototype, Uint8Array.prototype);
    Object.setPrototypeOf(Buffer4, Uint8Array);
    function assertSize(size) {
      if (typeof size !== "number") {
        throw new TypeError('"size" argument must be of type number');
      } else if (size < 0) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
    }
    function alloc(size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(size);
      }
      if (fill !== void 0) {
        return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
      }
      return createBuffer(size);
    }
    Buffer4.alloc = function(size, fill, encoding) {
      return alloc(size, fill, encoding);
    };
    function allocUnsafe(size) {
      assertSize(size);
      return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }
    Buffer4.allocUnsafe = function(size) {
      return allocUnsafe(size);
    };
    Buffer4.allocUnsafeSlow = function(size) {
      return allocUnsafe(size);
    };
    function fromString(string, encoding) {
      if (typeof encoding !== "string" || encoding === "") {
        encoding = "utf8";
      }
      if (!Buffer4.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      const length = byteLength(string, encoding) | 0;
      let buf2 = createBuffer(length);
      const actual = buf2.write(string, encoding);
      if (actual !== length) {
        buf2 = buf2.slice(0, actual);
      }
      return buf2;
    }
    function fromArrayLike(array) {
      const length = array.length < 0 ? 0 : checked(array.length) | 0;
      const buf2 = createBuffer(length);
      for (let i = 0; i < length; i += 1) {
        buf2[i] = array[i] & 255;
      }
      return buf2;
    }
    function fromArrayView(arrayView) {
      if (isInstance(arrayView, Uint8Array)) {
        const copy = new Uint8Array(arrayView);
        return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
      }
      return fromArrayLike(arrayView);
    }
    function fromArrayBuffer(array, byteOffset, length) {
      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('"offset" is outside of buffer bounds');
      }
      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('"length" is outside of buffer bounds');
      }
      let buf2;
      if (byteOffset === void 0 && length === void 0) {
        buf2 = new Uint8Array(array);
      } else if (length === void 0) {
        buf2 = new Uint8Array(array, byteOffset);
      } else {
        buf2 = new Uint8Array(array, byteOffset, length);
      }
      Object.setPrototypeOf(buf2, Buffer4.prototype);
      return buf2;
    }
    function fromObject(obj) {
      if (Buffer4.isBuffer(obj)) {
        const len = checked(obj.length) | 0;
        const buf2 = createBuffer(len);
        if (buf2.length === 0) {
          return buf2;
        }
        obj.copy(buf2, 0, 0, len);
        return buf2;
      }
      if (obj.length !== void 0) {
        if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
          return createBuffer(0);
        }
        return fromArrayLike(obj);
      }
      if (obj.type === "Buffer" && Array.isArray(obj.data)) {
        return fromArrayLike(obj.data);
      }
    }
    function checked(length) {
      if (length >= K_MAX_LENGTH) {
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
      }
      return length | 0;
    }
    function SlowBuffer(length) {
      if (+length != length) {
        length = 0;
      }
      return Buffer4.alloc(+length);
    }
    Buffer4.isBuffer = function isBuffer(b) {
      return b != null && b._isBuffer === true && b !== Buffer4.prototype;
    };
    Buffer4.compare = function compare(a, b) {
      if (isInstance(a, Uint8Array)) a = Buffer4.from(a, a.offset, a.byteLength);
      if (isInstance(b, Uint8Array)) b = Buffer4.from(b, b.offset, b.byteLength);
      if (!Buffer4.isBuffer(a) || !Buffer4.isBuffer(b)) {
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      }
      if (a === b) return 0;
      let x = a.length;
      let y = b.length;
      for (let i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    Buffer4.isEncoding = function isEncoding(encoding) {
      switch (String(encoding).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return true;
        default:
          return false;
      }
    };
    Buffer4.concat = function concat(list2, length) {
      if (!Array.isArray(list2)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      if (list2.length === 0) {
        return Buffer4.alloc(0);
      }
      let i;
      if (length === void 0) {
        length = 0;
        for (i = 0; i < list2.length; ++i) {
          length += list2[i].length;
        }
      }
      const buffer = Buffer4.allocUnsafe(length);
      let pos = 0;
      for (i = 0; i < list2.length; ++i) {
        let buf2 = list2[i];
        if (isInstance(buf2, Uint8Array)) {
          if (pos + buf2.length > buffer.length) {
            if (!Buffer4.isBuffer(buf2)) buf2 = Buffer4.from(buf2);
            buf2.copy(buffer, pos);
          } else {
            Uint8Array.prototype.set.call(
              buffer,
              buf2,
              pos
            );
          }
        } else if (!Buffer4.isBuffer(buf2)) {
          throw new TypeError('"list" argument must be an Array of Buffers');
        } else {
          buf2.copy(buffer, pos);
        }
        pos += buf2.length;
      }
      return buffer;
    };
    function byteLength(string, encoding) {
      if (Buffer4.isBuffer(string)) {
        return string.length;
      }
      if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
        return string.byteLength;
      }
      if (typeof string !== "string") {
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string
        );
      }
      const len = string.length;
      const mustMatch = arguments.length > 2 && arguments[2] === true;
      if (!mustMatch && len === 0) return 0;
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "ascii":
          case "latin1":
          case "binary":
            return len;
          case "utf8":
          case "utf-8":
            return utf8ToBytes(string).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return len * 2;
          case "hex":
            return len >>> 1;
          case "base64":
            return base64ToBytes(string).length;
          default:
            if (loweredCase) {
              return mustMatch ? -1 : utf8ToBytes(string).length;
            }
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer4.byteLength = byteLength;
    function slowToString(encoding, start, end) {
      let loweredCase = false;
      if (start === void 0 || start < 0) {
        start = 0;
      }
      if (start > this.length) {
        return "";
      }
      if (end === void 0 || end > this.length) {
        end = this.length;
      }
      if (end <= 0) {
        return "";
      }
      end >>>= 0;
      start >>>= 0;
      if (end <= start) {
        return "";
      }
      if (!encoding) encoding = "utf8";
      while (true) {
        switch (encoding) {
          case "hex":
            return hexSlice(this, start, end);
          case "utf8":
          case "utf-8":
            return utf8Slice(this, start, end);
          case "ascii":
            return asciiSlice(this, start, end);
          case "latin1":
          case "binary":
            return latin1Slice(this, start, end);
          case "base64":
            return base64Slice(this, start, end);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return utf16leSlice(this, start, end);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = (encoding + "").toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer4.prototype._isBuffer = true;
    function swap(b, n, m) {
      const i = b[n];
      b[n] = b[m];
      b[m] = i;
    }
    Buffer4.prototype.swap16 = function swap16() {
      const len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      }
      for (let i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this;
    };
    Buffer4.prototype.swap32 = function swap32() {
      const len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this;
    };
    Buffer4.prototype.swap64 = function swap64() {
      const len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      }
      for (let i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this;
    };
    Buffer4.prototype.toString = function toString() {
      const length = this.length;
      if (length === 0) return "";
      if (arguments.length === 0) return utf8Slice(this, 0, length);
      return slowToString.apply(this, arguments);
    };
    Buffer4.prototype.toLocaleString = Buffer4.prototype.toString;
    Buffer4.prototype.equals = function equals(b) {
      if (!Buffer4.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
      if (this === b) return true;
      return Buffer4.compare(this, b) === 0;
    };
    Buffer4.prototype.inspect = function inspect() {
      let str = "";
      const max = exports.INSPECT_MAX_BYTES;
      str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
      if (this.length > max) str += " ... ";
      return "<Buffer " + str + ">";
    };
    if (customInspectSymbol) {
      Buffer4.prototype[customInspectSymbol] = Buffer4.prototype.inspect;
    }
    Buffer4.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
      if (isInstance(target, Uint8Array)) {
        target = Buffer4.from(target, target.offset, target.byteLength);
      }
      if (!Buffer4.isBuffer(target)) {
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target
        );
      }
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = target ? target.length : 0;
      }
      if (thisStart === void 0) {
        thisStart = 0;
      }
      if (thisEnd === void 0) {
        thisEnd = this.length;
      }
      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError("out of range index");
      }
      if (thisStart >= thisEnd && start >= end) {
        return 0;
      }
      if (thisStart >= thisEnd) {
        return -1;
      }
      if (start >= end) {
        return 1;
      }
      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;
      if (this === target) return 0;
      let x = thisEnd - thisStart;
      let y = end - start;
      const len = Math.min(x, y);
      const thisCopy = this.slice(thisStart, thisEnd);
      const targetCopy = target.slice(start, end);
      for (let i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break;
        }
      }
      if (x < y) return -1;
      if (y < x) return 1;
      return 0;
    };
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
      if (buffer.length === 0) return -1;
      if (typeof byteOffset === "string") {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 2147483647) {
        byteOffset = 2147483647;
      } else if (byteOffset < -2147483648) {
        byteOffset = -2147483648;
      }
      byteOffset = +byteOffset;
      if (numberIsNaN(byteOffset)) {
        byteOffset = dir ? 0 : buffer.length - 1;
      }
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1;
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1;
      }
      if (typeof val === "string") {
        val = Buffer4.from(val, encoding);
      }
      if (Buffer4.isBuffer(val)) {
        if (val.length === 0) {
          return -1;
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
      } else if (typeof val === "number") {
        val = val & 255;
        if (typeof Uint8Array.prototype.indexOf === "function") {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
          }
        }
        return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
      }
      throw new TypeError("val must be string, number or Buffer");
    }
    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
      let indexSize = 1;
      let arrLength = arr.length;
      let valLength = val.length;
      if (encoding !== void 0) {
        encoding = String(encoding).toLowerCase();
        if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
          if (arr.length < 2 || val.length < 2) {
            return -1;
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }
      function read(buf2, i2) {
        if (indexSize === 1) {
          return buf2[i2];
        } else {
          return buf2.readUInt16BE(i2 * indexSize);
        }
      }
      let i;
      if (dir) {
        let foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          let found = true;
          for (let j = 0; j < valLength; j++) {
            if (read(arr, i + j) !== read(val, j)) {
              found = false;
              break;
            }
          }
          if (found) return i;
        }
      }
      return -1;
    }
    Buffer4.prototype.includes = function includes2(val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1;
    };
    Buffer4.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };
    Buffer4.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };
    function hexWrite(buf2, string, offset, length) {
      offset = Number(offset) || 0;
      const remaining = buf2.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }
      const strLen = string.length;
      if (length > strLen / 2) {
        length = strLen / 2;
      }
      let i;
      for (i = 0; i < length; ++i) {
        const parsed = parseInt(string.substr(i * 2, 2), 16);
        if (numberIsNaN(parsed)) return i;
        buf2[offset + i] = parsed;
      }
      return i;
    }
    function utf8Write(buf2, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf2.length - offset), buf2, offset, length);
    }
    function asciiWrite(buf2, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf2, offset, length);
    }
    function base64Write(buf2, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf2, offset, length);
    }
    function ucs2Write(buf2, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf2.length - offset), buf2, offset, length);
    }
    Buffer4.prototype.write = function write(string, offset, length, encoding) {
      if (offset === void 0) {
        encoding = "utf8";
        length = this.length;
        offset = 0;
      } else if (length === void 0 && typeof offset === "string") {
        encoding = offset;
        length = this.length;
        offset = 0;
      } else if (isFinite(offset)) {
        offset = offset >>> 0;
        if (isFinite(length)) {
          length = length >>> 0;
          if (encoding === void 0) encoding = "utf8";
        } else {
          encoding = length;
          length = void 0;
        }
      } else {
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      }
      const remaining = this.length - offset;
      if (length === void 0 || length > remaining) length = remaining;
      if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
        throw new RangeError("Attempt to write outside buffer bounds");
      }
      if (!encoding) encoding = "utf8";
      let loweredCase = false;
      for (; ; ) {
        switch (encoding) {
          case "hex":
            return hexWrite(this, string, offset, length);
          case "utf8":
          case "utf-8":
            return utf8Write(this, string, offset, length);
          case "ascii":
          case "latin1":
          case "binary":
            return asciiWrite(this, string, offset, length);
          case "base64":
            return base64Write(this, string, offset, length);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return ucs2Write(this, string, offset, length);
          default:
            if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
            encoding = ("" + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };
    Buffer4.prototype.toJSON = function toJSON() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function base64Slice(buf2, start, end) {
      if (start === 0 && end === buf2.length) {
        return base64.fromByteArray(buf2);
      } else {
        return base64.fromByteArray(buf2.slice(start, end));
      }
    }
    function utf8Slice(buf2, start, end) {
      end = Math.min(buf2.length, end);
      const res = [];
      let i = start;
      while (i < end) {
        const firstByte = buf2[i];
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (i + bytesPerSequence <= end) {
          let secondByte, thirdByte, fourthByte, tempCodePoint;
          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 128) {
                codePoint = firstByte;
              }
              break;
            case 2:
              secondByte = buf2[i + 1];
              if ((secondByte & 192) === 128) {
                tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                if (tempCodePoint > 127) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 3:
              secondByte = buf2[i + 1];
              thirdByte = buf2[i + 2];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                  codePoint = tempCodePoint;
                }
              }
              break;
            case 4:
              secondByte = buf2[i + 1];
              thirdByte = buf2[i + 2];
              fourthByte = buf2[i + 3];
              if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          res.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        res.push(codePoint);
        i += bytesPerSequence;
      }
      return decodeCodePointsArray(res);
    }
    var MAX_ARGUMENTS_LENGTH = 4096;
    function decodeCodePointsArray(codePoints) {
      const len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints);
      }
      let res = "";
      let i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res;
    }
    function asciiSlice(buf2, start, end) {
      let ret = "";
      end = Math.min(buf2.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf2[i] & 127);
      }
      return ret;
    }
    function latin1Slice(buf2, start, end) {
      let ret = "";
      end = Math.min(buf2.length, end);
      for (let i = start; i < end; ++i) {
        ret += String.fromCharCode(buf2[i]);
      }
      return ret;
    }
    function hexSlice(buf2, start, end) {
      const len = buf2.length;
      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;
      let out = "";
      for (let i = start; i < end; ++i) {
        out += hexSliceLookupTable[buf2[i]];
      }
      return out;
    }
    function utf16leSlice(buf2, start, end) {
      const bytes = buf2.slice(start, end);
      let res = "";
      for (let i = 0; i < bytes.length - 1; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res;
    }
    Buffer4.prototype.slice = function slice(start, end) {
      const len = this.length;
      start = ~~start;
      end = end === void 0 ? len : ~~end;
      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }
      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }
      if (end < start) end = start;
      const newBuf = this.subarray(start, end);
      Object.setPrototypeOf(newBuf, Buffer4.prototype);
      return newBuf;
    };
    function checkOffset(offset, ext, length) {
      if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
      if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }
    Buffer4.prototype.readUintLE = Buffer4.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      return val;
    };
    Buffer4.prototype.readUintBE = Buffer4.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        checkOffset(offset, byteLength2, this.length);
      }
      let val = this[offset + --byteLength2];
      let mul = 1;
      while (byteLength2 > 0 && (mul *= 256)) {
        val += this[offset + --byteLength2] * mul;
      }
      return val;
    };
    Buffer4.prototype.readUint8 = Buffer4.prototype.readUInt8 = function readUInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset];
    };
    Buffer4.prototype.readUint16LE = Buffer4.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | this[offset + 1] << 8;
    };
    Buffer4.prototype.readUint16BE = Buffer4.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] << 8 | this[offset + 1];
    };
    Buffer4.prototype.readUint32LE = Buffer4.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
    };
    Buffer4.prototype.readUint32BE = Buffer4.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
    };
    Buffer4.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const lo = first3 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
      const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
      return BigInt(lo) + (BigInt(hi) << BigInt(32));
    });
    Buffer4.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const hi = first3 * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
      return (BigInt(hi) << BigInt(32)) + BigInt(lo);
    });
    Buffer4.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let val = this[offset];
      let mul = 1;
      let i = 0;
      while (++i < byteLength2 && (mul *= 256)) {
        val += this[offset + i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer4.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) checkOffset(offset, byteLength2, this.length);
      let i = byteLength2;
      let mul = 1;
      let val = this[offset + --i];
      while (i > 0 && (mul *= 256)) {
        val += this[offset + --i] * mul;
      }
      mul *= 128;
      if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
      return val;
    };
    Buffer4.prototype.readInt8 = function readInt8(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 128)) return this[offset];
      return (255 - this[offset] + 1) * -1;
    };
    Buffer4.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset] | this[offset + 1] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer4.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 2, this.length);
      const val = this[offset + 1] | this[offset] << 8;
      return val & 32768 ? val | 4294901760 : val;
    };
    Buffer4.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
    };
    Buffer4.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
    };
    Buffer4.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
      return (BigInt(val) << BigInt(32)) + BigInt(first3 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
    });
    Buffer4.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
      offset = offset >>> 0;
      validateNumber(offset, "offset");
      const first3 = this[offset];
      const last = this[offset + 7];
      if (first3 === void 0 || last === void 0) {
        boundsError(offset, this.length - 8);
      }
      const val = (first3 << 24) + // Overflow
      this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
      return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
    });
    Buffer4.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, true, 23, 4);
    };
    Buffer4.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 4, this.length);
      return ieee754.read(this, offset, false, 23, 4);
    };
    Buffer4.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, true, 52, 8);
    };
    Buffer4.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
      offset = offset >>> 0;
      if (!noAssert) checkOffset(offset, 8, this.length);
      return ieee754.read(this, offset, false, 52, 8);
    };
    function checkInt(buf2, value, offset, ext, max, min) {
      if (!Buffer4.isBuffer(buf2)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
      if (offset + ext > buf2.length) throw new RangeError("Index out of range");
    }
    Buffer4.prototype.writeUintLE = Buffer4.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let mul = 1;
      let i = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeUintBE = Buffer4.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      byteLength2 = byteLength2 >>> 0;
      if (!noAssert) {
        const maxBytes = Math.pow(2, 8 * byteLength2) - 1;
        checkInt(this, value, offset, byteLength2, maxBytes, 0);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        this[offset + i] = value / mul & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeUint8 = Buffer4.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer4.prototype.writeUint16LE = Buffer4.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer4.prototype.writeUint16BE = Buffer4.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer4.prototype.writeUint32LE = Buffer4.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 255;
      return offset + 4;
    };
    Buffer4.prototype.writeUint32BE = Buffer4.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    function wrtBigUInt64LE(buf2, value, offset, min, max) {
      checkIntBI(value, min, max, buf2, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      lo = lo >> 8;
      buf2[offset++] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      hi = hi >> 8;
      buf2[offset++] = hi;
      return offset;
    }
    function wrtBigUInt64BE(buf2, value, offset, min, max) {
      checkIntBI(value, min, max, buf2, offset, 7);
      let lo = Number(value & BigInt(4294967295));
      buf2[offset + 7] = lo;
      lo = lo >> 8;
      buf2[offset + 6] = lo;
      lo = lo >> 8;
      buf2[offset + 5] = lo;
      lo = lo >> 8;
      buf2[offset + 4] = lo;
      let hi = Number(value >> BigInt(32) & BigInt(4294967295));
      buf2[offset + 3] = hi;
      hi = hi >> 8;
      buf2[offset + 2] = hi;
      hi = hi >> 8;
      buf2[offset + 1] = hi;
      hi = hi >> 8;
      buf2[offset] = hi;
      return offset + 8;
    }
    Buffer4.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer4.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
    });
    Buffer4.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = 0;
      let mul = 1;
      let sub = 0;
      this[offset] = value & 255;
      while (++i < byteLength2 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        const limit = Math.pow(2, 8 * byteLength2 - 1);
        checkInt(this, value, offset, byteLength2, limit - 1, -limit);
      }
      let i = byteLength2 - 1;
      let mul = 1;
      let sub = 0;
      this[offset + i] = value & 255;
      while (--i >= 0 && (mul *= 256)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = (value / mul >> 0) - sub & 255;
      }
      return offset + byteLength2;
    };
    Buffer4.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
      if (value < 0) value = 255 + value + 1;
      this[offset] = value & 255;
      return offset + 1;
    };
    Buffer4.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      return offset + 2;
    };
    Buffer4.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
      this[offset] = value >>> 8;
      this[offset + 1] = value & 255;
      return offset + 2;
    };
    Buffer4.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      this[offset] = value & 255;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
      return offset + 4;
    };
    Buffer4.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
      if (value < 0) value = 4294967295 + value + 1;
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 255;
      return offset + 4;
    };
    Buffer4.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
      return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    Buffer4.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
      return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function checkIEEE754(buf2, value, offset, ext, max, min) {
      if (offset + ext > buf2.length) throw new RangeError("Index out of range");
      if (offset < 0) throw new RangeError("Index out of range");
    }
    function writeFloat(buf2, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf2, value, offset, 4, 34028234663852886e22, -34028234663852886e22);
      }
      ieee754.write(buf2, value, offset, littleEndian, 23, 4);
      return offset + 4;
    }
    Buffer4.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert);
    };
    Buffer4.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert);
    };
    function writeDouble(buf2, value, offset, littleEndian, noAssert) {
      value = +value;
      offset = offset >>> 0;
      if (!noAssert) {
        checkIEEE754(buf2, value, offset, 8, 17976931348623157e292, -17976931348623157e292);
      }
      ieee754.write(buf2, value, offset, littleEndian, 52, 8);
      return offset + 8;
    }
    Buffer4.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert);
    };
    Buffer4.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert);
    };
    Buffer4.prototype.copy = function copy(target, targetStart, start, end) {
      if (!Buffer4.isBuffer(target)) throw new TypeError("argument should be a Buffer");
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;
      if (end === start) return 0;
      if (target.length === 0 || this.length === 0) return 0;
      if (targetStart < 0) {
        throw new RangeError("targetStart out of bounds");
      }
      if (start < 0 || start >= this.length) throw new RangeError("Index out of range");
      if (end < 0) throw new RangeError("sourceEnd out of bounds");
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }
      const len = end - start;
      if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
        this.copyWithin(targetStart, start, end);
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, end),
          targetStart
        );
      }
      return len;
    };
    Buffer4.prototype.fill = function fill(val, start, end, encoding) {
      if (typeof val === "string") {
        if (typeof start === "string") {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === "string") {
          encoding = end;
          end = this.length;
        }
        if (encoding !== void 0 && typeof encoding !== "string") {
          throw new TypeError("encoding must be a string");
        }
        if (typeof encoding === "string" && !Buffer4.isEncoding(encoding)) {
          throw new TypeError("Unknown encoding: " + encoding);
        }
        if (val.length === 1) {
          const code = val.charCodeAt(0);
          if (encoding === "utf8" && code < 128 || encoding === "latin1") {
            val = code;
          }
        }
      } else if (typeof val === "number") {
        val = val & 255;
      } else if (typeof val === "boolean") {
        val = Number(val);
      }
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError("Out of range index");
      }
      if (end <= start) {
        return this;
      }
      start = start >>> 0;
      end = end === void 0 ? this.length : end >>> 0;
      if (!val) val = 0;
      let i;
      if (typeof val === "number") {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        const bytes = Buffer4.isBuffer(val) ? val : Buffer4.from(val, encoding);
        const len = bytes.length;
        if (len === 0) {
          throw new TypeError('The value "' + val + '" is invalid for argument "value"');
        }
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }
      return this;
    };
    var errors = {};
    function E(sym, getMessage, Base) {
      errors[sym] = class NodeError extends Base {
        constructor() {
          super();
          Object.defineProperty(this, "message", {
            value: getMessage.apply(this, arguments),
            writable: true,
            configurable: true
          });
          this.name = `${this.name} [${sym}]`;
          this.stack;
          delete this.name;
        }
        get code() {
          return sym;
        }
        set code(value) {
          Object.defineProperty(this, "code", {
            configurable: true,
            enumerable: true,
            value,
            writable: true
          });
        }
        toString() {
          return `${this.name} [${sym}]: ${this.message}`;
        }
      };
    }
    E(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(name) {
        if (name) {
          return `${name} is outside of buffer bounds`;
        }
        return "Attempt to access memory outside buffer bounds";
      },
      RangeError
    );
    E(
      "ERR_INVALID_ARG_TYPE",
      function(name, actual) {
        return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
      },
      TypeError
    );
    E(
      "ERR_OUT_OF_RANGE",
      function(str, range, input2) {
        let msg = `The value of "${str}" is out of range.`;
        let received = input2;
        if (Number.isInteger(input2) && Math.abs(input2) > 2 ** 32) {
          received = addNumericalSeparator(String(input2));
        } else if (typeof input2 === "bigint") {
          received = String(input2);
          if (input2 > BigInt(2) ** BigInt(32) || input2 < -(BigInt(2) ** BigInt(32))) {
            received = addNumericalSeparator(received);
          }
          received += "n";
        }
        msg += ` It must be ${range}. Received ${received}`;
        return msg;
      },
      RangeError
    );
    function addNumericalSeparator(val) {
      let res = "";
      let i = val.length;
      const start = val[0] === "-" ? 1 : 0;
      for (; i >= start + 4; i -= 3) {
        res = `_${val.slice(i - 3, i)}${res}`;
      }
      return `${val.slice(0, i)}${res}`;
    }
    function checkBounds(buf2, offset, byteLength2) {
      validateNumber(offset, "offset");
      if (buf2[offset] === void 0 || buf2[offset + byteLength2] === void 0) {
        boundsError(offset, buf2.length - (byteLength2 + 1));
      }
    }
    function checkIntBI(value, min, max, buf2, offset, byteLength2) {
      if (value > max || value < min) {
        const n = typeof min === "bigint" ? "n" : "";
        let range;
        if (byteLength2 > 3) {
          if (min === 0 || min === BigInt(0)) {
            range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
          } else {
            range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
          }
        } else {
          range = `>= ${min}${n} and <= ${max}${n}`;
        }
        throw new errors.ERR_OUT_OF_RANGE("value", range, value);
      }
      checkBounds(buf2, offset, byteLength2);
    }
    function validateNumber(value, name) {
      if (typeof value !== "number") {
        throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
      }
    }
    function boundsError(value, length, type) {
      if (Math.floor(value) !== value) {
        validateNumber(value, type);
        throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
      }
      if (length < 0) {
        throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
      }
      throw new errors.ERR_OUT_OF_RANGE(
        type || "offset",
        `>= ${type ? 1 : 0} and <= ${length}`,
        value
      );
    }
    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
    function base64clean(str) {
      str = str.split("=")[0];
      str = str.trim().replace(INVALID_BASE64_RE, "");
      if (str.length < 2) return "";
      while (str.length % 4 !== 0) {
        str = str + "=";
      }
      return str;
    }
    function utf8ToBytes(string, units) {
      units = units || Infinity;
      let codePoint;
      const length = string.length;
      let leadSurrogate = null;
      const bytes = [];
      for (let i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);
        if (codePoint > 55295 && codePoint < 57344) {
          if (!leadSurrogate) {
            if (codePoint > 56319) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            } else if (i + 1 === length) {
              if ((units -= 3) > -1) bytes.push(239, 191, 189);
              continue;
            }
            leadSurrogate = codePoint;
            continue;
          }
          if (codePoint < 56320) {
            if ((units -= 3) > -1) bytes.push(239, 191, 189);
            leadSurrogate = codePoint;
            continue;
          }
          codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
        } else if (leadSurrogate) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
        }
        leadSurrogate = null;
        if (codePoint < 128) {
          if ((units -= 1) < 0) break;
          bytes.push(codePoint);
        } else if (codePoint < 2048) {
          if ((units -= 2) < 0) break;
          bytes.push(
            codePoint >> 6 | 192,
            codePoint & 63 | 128
          );
        } else if (codePoint < 65536) {
          if ((units -= 3) < 0) break;
          bytes.push(
            codePoint >> 12 | 224,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else if (codePoint < 1114112) {
          if ((units -= 4) < 0) break;
          bytes.push(
            codePoint >> 18 | 240,
            codePoint >> 12 & 63 | 128,
            codePoint >> 6 & 63 | 128,
            codePoint & 63 | 128
          );
        } else {
          throw new Error("Invalid code point");
        }
      }
      return bytes;
    }
    function asciiToBytes(str) {
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        byteArray.push(str.charCodeAt(i) & 255);
      }
      return byteArray;
    }
    function utf16leToBytes(str, units) {
      let c, hi, lo;
      const byteArray = [];
      for (let i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break;
        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }
      return byteArray;
    }
    function base64ToBytes(str) {
      return base64.toByteArray(base64clean(str));
    }
    function blitBuffer(src, dst, offset, length) {
      let i;
      for (i = 0; i < length; ++i) {
        if (i + offset >= dst.length || i >= src.length) break;
        dst[i + offset] = src[i];
      }
      return i;
    }
    function isInstance(obj, type) {
      return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
    }
    function numberIsNaN(obj) {
      return obj !== obj;
    }
    var hexSliceLookupTable = (function() {
      const alphabet = "0123456789abcdef";
      const table = new Array(256);
      for (let i = 0; i < 16; ++i) {
        const i16 = i * 16;
        for (let j = 0; j < 16; ++j) {
          table[i16 + j] = alphabet[i] + alphabet[j];
        }
      }
      return table;
    })();
    function defineBigIntMethod(fn) {
      return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
    }
    function BufferBigIntNotDefined() {
      throw new Error("BigInt not supported");
    }
  }
});

// ../simplyflow/packages/state/src/index.mjs
var src_exports = {};
__export(src_exports, {
  addTracer: () => addTracer,
  batch: () => batch,
  clockEffect: () => clockEffect,
  clone: () => clone,
  createSignal: () => createSignal,
  destroy: () => destroy,
  effect: () => effect,
  getSignal: () => getSignal,
  isSignal: () => isSignal,
  makeContext: () => makeContext,
  notifyGet: () => notifyGet,
  notifySet: () => notifySet,
  raw: () => raw,
  registerSignal: () => registerSignal,
  signal: () => signal,
  signals: () => signals,
  throttledEffect: () => throttledEffect,
  trace: () => trace,
  untracked: () => untracked
});

// ../simplyflow/packages/state/src/symbols.mjs
var DEP = {
  ITERATE: Symbol.for("@simplyedit/simplyflow.iterate"),
  XRAY: Symbol.for("@simplyedit/simplyflow.xRay"),
  SIGNAL: Symbol.for("@simplyedit/simplyflow.Signal"),
  TEMPLATE: Symbol.for("@simplyedit/simplyflow.bindTemplate"),
  VALUE: Symbol.for("@simplyedit/simplyflow.bindValue"),
  LENGTH: "length",
  SIZE: "size"
};

// ../simplyflow/packages/state/src/index.mjs
var MAP_READS_KEY = /* @__PURE__ */ new Set(["get", "has"]);
var MAP_READS_ITERATION = /* @__PURE__ */ new Set(["keys", "values", "entries", "forEach", Symbol.iterator]);
var MAP_WRITES = /* @__PURE__ */ new Set(["set", "delete", "clear"]);
var SET_WRITES = /* @__PURE__ */ new Set(["add", "delete", "clear"]);
var SET_ITERATION_PROPERTIES = {
  entries: {},
  forEach: {},
  has: {},
  keys: {},
  values: {},
  [Symbol.iterator]: {}
};
function isObjectLike(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}
function isSignal(value) {
  return Boolean(isObjectLike(value) && value[DEP.SIGNAL]);
}
function raw(value) {
  return isSignal(value) ? value[DEP.XRAY] : value;
}
function getSignal(value) {
  return isSignal(value) ? value : signals.get(value);
}
function targetSignal(target) {
  return signals.get(target);
}
function readTarget(target, property) {
  return target?.[property];
}
function bindMethod(target, receiver, value) {
  if (target instanceof HTMLElement || target instanceof Number || target instanceof String || target instanceof Boolean) {
    return value.bind(target);
  }
  return value.bind(receiver);
}
function collectRemovedArrayValues(target, nextLength) {
  const values5 = /* @__PURE__ */ new Map();
  if (!Array.isArray(target) || nextLength >= target.length) {
    return values5;
  }
  for (let index = nextLength; index < target.length; index++) {
    if (Object.hasOwn(target, index)) {
      values5.set(index, target[index]);
    }
  }
  return values5;
}
function addArrayLengthChanges(context, target, oldLength, removedValues = /* @__PURE__ */ new Map()) {
  if (!Array.isArray(target) || oldLength === target.length) {
    return;
  }
  context.set(DEP.LENGTH, { was: oldLength, now: target.length });
  context.set(DEP.ITERATE, {});
  for (const [index, oldValue] of removedValues) {
    context.set(String(index), { delete: true, was: oldValue, now: void 0 });
  }
}
function notifyContext(receiver, context) {
  if (context.size) {
    notifySet(receiver, context);
  }
}
function wrapArrayMethod(target, property, receiver, value) {
  return (...args) => {
    const oldLength = target.length;
    const result = value.apply(receiver, args);
    if (oldLength !== target.length) {
      notifySet(receiver, makeContext(DEP.LENGTH, { was: oldLength, now: target.length }));
    }
    return result;
  };
}
function addMapWriteChanges(context, target, property, args, oldSize) {
  if (property === "set") {
    const [key, nextValue] = args;
    const hadKey = target.has(key);
    const oldValue = target.get(key);
    return () => {
      if (!hadKey || !Object.is(oldValue, nextValue)) {
        context.set(key, { was: oldValue, now: nextValue });
        context.set(DEP.ITERATE, {});
      }
      if (!hadKey) {
        context.set(DEP.SIZE, { was: oldSize, now: target.size });
      }
    };
  }
  if (property === "delete") {
    const [key] = args;
    const hadKey = target.has(key);
    const oldValue = target.get(key);
    return () => {
      if (hadKey) {
        context.set(key, { delete: true, was: oldValue, now: void 0 });
        context.set(DEP.SIZE, { was: oldSize, now: target.size });
        context.set(DEP.ITERATE, {});
      }
    };
  }
  if (property === "clear") {
    const oldEntries = oldSize ? Array.from(target.entries()) : [];
    return () => {
      if (oldEntries.length) {
        for (const [key, oldValue] of oldEntries) {
          context.set(key, { delete: true, was: oldValue, now: void 0 });
        }
        context.set(DEP.SIZE, { was: oldSize, now: target.size });
        context.set(DEP.ITERATE, {});
      }
    };
  }
  return () => {
  };
}
function wrapMapMethod(target, property, receiver, value) {
  return (...args) => {
    if (MAP_READS_KEY.has(property)) {
      notifyGet(receiver, args[0]);
    }
    if (MAP_READS_ITERATION.has(property)) {
      notifyGet(receiver, DEP.ITERATE);
    }
    const oldSize = target.size;
    const context = /* @__PURE__ */ new Map();
    const addChanges = MAP_WRITES.has(property) ? addMapWriteChanges(context, target, property, args, oldSize) : () => {
    };
    const result = value.apply(target, args);
    addChanges();
    notifyContext(receiver, context);
    return result;
  };
}
function addSetWriteChanges(context, target, property, args, oldSize) {
  const [value] = args;
  const hadValue = property === "add" || property === "delete" ? target.has(value) : false;
  return () => {
    const changed = property === "clear" ? oldSize > 0 : target.size !== oldSize || property === "delete" && hadValue;
    if (!changed) {
      return;
    }
    context.set(DEP.SIZE, { was: oldSize, now: target.size });
    for (const prop of Reflect.ownKeys(SET_ITERATION_PROPERTIES)) {
      context.set(prop, {});
    }
  };
}
function wrapSetMethod(target, property, receiver, value) {
  return (...args) => {
    const oldSize = target.size;
    const context = /* @__PURE__ */ new Map();
    const addChanges = SET_WRITES.has(property) ? addSetWriteChanges(context, target, property, args, oldSize) : () => {
    };
    const result = value.apply(target, args);
    addChanges();
    notifyContext(receiver, context);
    return result;
  };
}
function propertyValueChanged(descriptor, oldDescriptor, oldValue, newDescriptor, newValue) {
  return Object.hasOwn(descriptor, "value") && !Object.is(oldValue, newValue) || Object.hasOwn(descriptor, "get") && oldDescriptor?.get !== newDescriptor?.get || Object.hasOwn(descriptor, "set") && oldDescriptor?.set !== newDescriptor?.set;
}
var signalHandler = {
  get(target, property, receiver) {
    const value = readTarget(target, property);
    notifyGet(receiver, property);
    if (typeof value === "function") {
      if (Array.isArray(target)) {
        return wrapArrayMethod(target, property, receiver, value);
      }
      if (target instanceof Map) {
        return wrapMapMethod(target, property, receiver, value);
      }
      if (target instanceof Set) {
        return wrapSetMethod(target, property, receiver, value);
      }
      return bindMethod(target, receiver, value);
    }
    return isObjectLike(value) ? signal(value) : value;
  },
  set(target, property, value, receiver) {
    const hadOwn = Object.hasOwn(target, property);
    const oldLength = Array.isArray(target) ? target.length : void 0;
    const removedValues = property === DEP.LENGTH ? collectRemovedArrayValues(target, Number(value)) : /* @__PURE__ */ new Map();
    const oldValue = target[property];
    target[property] = value;
    const hasOwn = Object.hasOwn(target, property);
    const newValue = target[property];
    const context = /* @__PURE__ */ new Map();
    if (!Object.is(oldValue, newValue) || !hadOwn && hasOwn) {
      context.set(property, { was: oldValue, now: newValue });
    }
    if (!hadOwn && hasOwn) {
      context.set(DEP.ITERATE, {});
    }
    addArrayLengthChanges(context, target, oldLength, removedValues);
    notifyContext(receiver, context);
    return true;
  },
  has(target, property) {
    const receiver = targetSignal(target);
    if (receiver) {
      notifyGet(receiver, property);
    }
    return Reflect.has(target, property);
  },
  deleteProperty(target, property) {
    const hadOwn = Object.hasOwn(target, property);
    if (!hadOwn) {
      return true;
    }
    const oldValue = target[property];
    const oldLength = Array.isArray(target) ? target.length : void 0;
    const result = Reflect.deleteProperty(target, property);
    if (!result) {
      return result;
    }
    const receiver = targetSignal(target);
    const context = makeContext(property, { delete: true, was: oldValue, now: void 0 });
    context.set(DEP.ITERATE, { delete: true, property });
    addArrayLengthChanges(context, target, oldLength);
    notifySet(receiver, context);
    return result;
  },
  defineProperty(target, property, descriptor) {
    const hadOwn = Object.hasOwn(target, property);
    const oldDescriptor = Object.getOwnPropertyDescriptor(target, property);
    const oldValue = target[property];
    const oldLength = Array.isArray(target) ? target.length : void 0;
    const removedValues = property === DEP.LENGTH && Object.hasOwn(descriptor, "value") ? collectRemovedArrayValues(target, Number(descriptor.value)) : /* @__PURE__ */ new Map();
    const result = Reflect.defineProperty(target, property, descriptor);
    if (!result) {
      return result;
    }
    const hasOwn = Object.hasOwn(target, property);
    const newDescriptor = Object.getOwnPropertyDescriptor(target, property);
    const newValue = target[property];
    const context = /* @__PURE__ */ new Map();
    if (!hadOwn && hasOwn) {
      context.set(property, { was: oldValue, now: newValue });
      context.set(DEP.ITERATE, {});
    } else if (hadOwn && hasOwn) {
      if (propertyValueChanged(descriptor, oldDescriptor, oldValue, newDescriptor, newValue)) {
        context.set(property, { was: oldValue, now: newValue });
      }
      if (oldDescriptor?.enumerable !== newDescriptor?.enumerable) {
        context.set(DEP.ITERATE, {});
      }
    }
    addArrayLengthChanges(context, target, oldLength, removedValues);
    notifyContext(targetSignal(target), context);
    return result;
  },
  ownKeys(target) {
    const receiver = targetSignal(target);
    notifyGet(receiver, DEP.ITERATE);
    return Reflect.ownKeys(target);
  }
};
var signals = /* @__PURE__ */ new WeakMap();
function assertSignalTarget(value, name) {
  if (!isObjectLike(value)) {
    throw new TypeError(
      `simplyflow/state: ${name}() expects an object, array, Map, Set, class instance, function, or DOM node; received ${typeof value}`
    );
  }
}
function assertProxyHandler(handler, name) {
  if (!handler || typeof handler !== "object") {
    throw new TypeError(`simplyflow/state: ${name}() expects a Proxy handler object`);
  }
}
function signalProxyHandler(handler) {
  return {
    ...handler,
    get(target, property, receiver) {
      if (property === DEP.XRAY) {
        return target;
      }
      if (property === DEP.SIGNAL) {
        return true;
      }
      if (handler.get) {
        return handler.get(target, property, receiver);
      }
      return readTarget(target, property);
    }
  };
}
function registerSignal(target, proxy) {
  const rawTarget = raw(target);
  assertSignalTarget(rawTarget, "registerSignal");
  if (!isSignal(proxy)) {
    throw new TypeError("simplyflow/state: registerSignal() expects a signal proxy");
  }
  const existing = signals.get(rawTarget);
  if (existing && existing !== proxy) {
    throw new Error("simplyflow/state: registerSignal() target already has a different signal");
  }
  signals.set(rawTarget, proxy);
  return proxy;
}
function createSignal(target, handler = {}, init) {
  assertSignalTarget(target, "createSignal");
  assertProxyHandler(handler, "createSignal");
  if (init !== void 0 && typeof init !== "function") {
    throw new TypeError("simplyflow/state: createSignal() expects init to be a function");
  }
  if (isSignal(target)) {
    return target;
  }
  const existing = getSignal(target);
  if (existing) {
    return existing;
  }
  const proxy = new Proxy(target, signalProxyHandler(handler));
  registerSignal(target, proxy);
  init?.(target, proxy);
  return proxy;
}
function signal(value = {}) {
  if (!isObjectLike(value)) {
    throw new TypeError(
      `simplyflow/state: signal() expects an object, array, Map, Set, class instance, or function; received ${typeof value}`
    );
  }
  return createSignal(value, signalHandler);
}
var tracers = [];
var tracing = false;
function trace(target, prop) {
  if (typeof target === "function") {
    tracing = true;
    try {
      return target();
    } finally {
      tracing = false;
    }
  }
  if (!isSignal(target)) {
    throw new TypeError("simplyflow/state: trace() expects either a function or a signal");
  }
  return getListeners(target, prop).map((listener) => ({
    effect: listener.effectType,
    fn: listener.effectFunction,
    signal: signals.get(listener.effectFunction)
  }));
}
function addTracer(tracer) {
  if (!tracer || typeof tracer !== "object") {
    throw new TypeError("simplyflow/state: addTracer() expects a tracer object");
  }
  if (!tracer.get && !tracer.set) {
    throw new Error('simplyflow/state: addTracer: missing "get" or "set" property in tracer');
  }
  if (tracer.get && typeof tracer.get !== "function") {
    throw new Error('simplyflow/state: addTracer: "get" is not a function');
  }
  if (tracer.set && typeof tracer.set !== "function") {
    throw new Error('simplyflow/state: addTracer: "set" is not a function');
  }
  tracers.push(tracer);
}
function callTracers(kind, ...params) {
  for (const tracer of tracers) {
    tracer[kind]?.(...params);
  }
}
var batchedListeners = /* @__PURE__ */ new Set();
var batchDepth = 0;
function notifySet(self, context = /* @__PURE__ */ new Map()) {
  if (!isSignal(self)) {
    throw new TypeError("simplyflow/state: notifySet() expects a signal as first argument");
  }
  if (!(context instanceof Map)) {
    throw new TypeError("simplyflow/state: notifySet() expects context to be a Map; use makeContext()");
  }
  const listeners = /* @__PURE__ */ new Set();
  context.forEach((change, property) => {
    for (const listener of listenersFor(self, property)) {
      addContextChange(listener, property, change);
      listeners.add(listener);
    }
  });
  if (!listeners.size) {
    return;
  }
  if (batchDepth) {
    for (const listener of listeners) {
      batchedListeners.add(listener);
    }
    return;
  }
  runListeners(listeners, self, context);
}
function makeContext(property, change) {
  const context = /* @__PURE__ */ new Map();
  if (property instanceof Map) {
    property.forEach((change2, prop) => context.set(prop, change2));
    return context;
  }
  if (property !== null && typeof property === "object") {
    for (const prop of Reflect.ownKeys(property)) {
      context.set(prop, property[prop]);
    }
  } else {
    context.set(property, change);
  }
  return context;
}
function addContextChange(listener, property, change) {
  if (!listener.context) {
    listener.context = /* @__PURE__ */ new Map();
  }
  listener.context.set(property, change);
  listener.needsUpdate = true;
}
function clearContext(listener) {
  delete listener.context;
  delete listener.needsUpdate;
}
function notifyGet(self, property) {
  const currentCompute = computeStack[computeStack.length - 1];
  if (!currentCompute || currentCompute.skipDependency?.(self, property)) {
    return;
  }
  if (tracing && tracers.length) {
    callTracers("get", self, property);
  }
  setListeners(self, property, currentCompute);
}
var listenersMap = /* @__PURE__ */ new WeakMap();
var computeMap = /* @__PURE__ */ new WeakMap();
var emptyListeners = /* @__PURE__ */ new Set();
function listenersFor(self, property) {
  return listenersMap.get(self)?.get(property) || emptyListeners;
}
function getListeners(self, property) {
  return Array.from(listenersFor(self, property));
}
function setListeners(self, property, compute) {
  if (!listenersMap.has(self)) {
    listenersMap.set(self, /* @__PURE__ */ new Map());
  }
  const listeners = listenersMap.get(self);
  if (!listeners.has(property)) {
    listeners.set(property, /* @__PURE__ */ new Set());
  }
  listeners.get(property).add(compute);
  if (!computeMap.has(compute)) {
    computeMap.set(compute, /* @__PURE__ */ new Map());
  }
  const dependencies = computeMap.get(compute);
  if (!dependencies.has(property)) {
    dependencies.set(property, /* @__PURE__ */ new Set());
  }
  dependencies.get(property).add(self);
}
function clearListeners(compute) {
  const dependencies = computeMap.get(compute);
  if (!dependencies) {
    return;
  }
  dependencies.forEach((signals2, property) => {
    signals2.forEach((signal3) => {
      const listeners = listenersMap.get(signal3);
      listeners?.get(property)?.delete(compute);
    });
  });
  computeMap.delete(compute);
}
var computeStack = [];
var effectStack = [];
var signalStack = [];
var effectMap = /* @__PURE__ */ new WeakMap();
function assertFunction(fn, name) {
  if (typeof fn !== "function") {
    throw new TypeError(`simplyflow/state: ${name}() expects a function`);
  }
}
function assertNotRecursive(fn) {
  if (effectStack.includes(fn)) {
    throw new Error("Recursive update() call", { cause: fn });
  }
}
function effectSignal(fn) {
  let connectedSignal = signals.get(fn);
  if (!connectedSignal) {
    connectedSignal = signal({ current: null });
    signals.set(fn, connectedSignal);
  }
  return connectedSignal;
}
function setEffectResult(connectedSignal, result) {
  if (result instanceof Promise) {
    result.then((value) => {
      connectedSignal.current = value;
    });
  } else {
    connectedSignal.current = result;
  }
}
function runTracked(compute, connectedSignal, fn, effectType, args = [compute, computeStack, signalStack]) {
  if (signalStack.includes(connectedSignal)) {
    throw new Error("Cyclical dependency in update() call", { cause: fn });
  }
  clearListeners(compute);
  compute.effectFunction = fn;
  compute.effectType = effectType;
  computeStack.push(compute);
  signalStack.push(connectedSignal);
  let result;
  try {
    result = fn(...args);
  } finally {
    computeStack.pop();
    signalStack.pop();
    setEffectResult(connectedSignal, result);
  }
}
function runListeners(listeners, signal3, context) {
  const currentEffect = computeStack[computeStack.length - 1];
  for (const listener of listeners) {
    if (listener !== currentEffect && listener?.needsUpdate) {
      if (listener.scheduleClock) {
        listener.scheduleClock();
      } else {
        if (signal3 && tracing && tracers.length) {
          callTracers("set", signal3, context, listener);
        }
        listener();
      }
    }
    clearContext(listener);
  }
}
function effect(fn) {
  assertFunction(fn, "effect");
  assertNotRecursive(fn);
  effectStack.push(fn);
  const connectedSignal = effectSignal(fn);
  const compute = function computeEffect() {
    runTracked(compute, connectedSignal, fn, effect);
  };
  compute.fn = fn;
  effectMap.set(connectedSignal, compute);
  compute();
  return connectedSignal;
}
function destroy(connectedSignal) {
  if (!isSignal(connectedSignal)) {
    throw new TypeError("simplyflow/state: destroy() expects an effect signal");
  }
  const compute = effectMap.get(connectedSignal);
  if (!compute) {
    return;
  }
  compute.destroy?.();
  clearListeners(compute);
  if (compute.fn) {
    signals.delete(compute.fn);
    const index = effectStack.findIndex((fn) => fn === compute.fn);
    if (index !== -1) {
      effectStack.splice(index, 1);
    }
  }
  effectMap.delete(connectedSignal);
}
function batch(fn) {
  assertFunction(fn, "batch");
  batchDepth++;
  let result;
  try {
    result = fn();
  } finally {
    const finish = () => {
      batchDepth--;
      if (!batchDepth) {
        runBatchedListeners();
      }
    };
    if (result instanceof Promise) {
      result.then(finish, finish);
    } else {
      finish();
    }
  }
  return result;
}
function runBatchedListeners() {
  const listeners = batchedListeners;
  batchedListeners = /* @__PURE__ */ new Set();
  const clocked = /* @__PURE__ */ new Set();
  const ready = /* @__PURE__ */ new Set();
  for (const listener of listeners) {
    if (listener.scheduleClock) {
      clocked.add(listener);
    } else {
      ready.add(listener);
    }
  }
  runListeners(clocked);
  runListeners(ready);
}
function throttledEffect(fn, throttleTime) {
  assertFunction(fn, "throttledEffect");
  if (!Number.isFinite(throttleTime) || throttleTime < 0) {
    throw new TypeError("simplyflow/state: throttledEffect() expects throttleTime to be a non-negative number");
  }
  assertNotRecursive(fn);
  effectStack.push(fn);
  const connectedSignal = effectSignal(fn);
  let throttledUntil = 0;
  let hasChange = true;
  let timeout = null;
  const compute = function computeEffect() {
    const now2 = Date.now();
    if (throttledUntil > now2) {
      hasChange = true;
      schedule();
      return;
    }
    runTracked(compute, connectedSignal, fn, throttledEffect);
    hasChange = false;
    throttledUntil = Date.now() + throttleTime;
  };
  function schedule() {
    if (timeout) {
      return;
    }
    const delay = Math.max(0, throttledUntil - Date.now());
    timeout = globalThis.setTimeout(() => {
      timeout = null;
      if (hasChange) {
        compute();
      }
    }, delay);
  }
  compute.fn = fn;
  compute.destroy = () => {
    if (timeout) {
      globalThis.clearTimeout(timeout);
      timeout = null;
    }
    hasChange = false;
  };
  effectMap.set(connectedSignal, compute);
  compute();
  return connectedSignal;
}
var clockQueues = /* @__PURE__ */ new WeakMap();
function readClockTime(clock) {
  return raw(clock).time;
}
function getClockQueue(clock) {
  if (!clockQueues.has(clock)) {
    const queue = {
      clock,
      effects: /* @__PURE__ */ new Set(),
      pending: /* @__PURE__ */ new Set(),
      time: readClockTime(clock)
    };
    queue.tick = function tickClockEffects() {
      const time = readClockTime(clock);
      if (time <= queue.time) {
        return;
      }
      queue.time = time;
      const pending = Array.from(queue.pending);
      queue.pending.clear();
      for (const compute of pending) {
        compute.clockPending = false;
        if (queue.effects.has(compute)) {
          compute();
        }
      }
    };
    queue.tick.effectFunction = queue.tick;
    queue.tick.effectType = clockEffect;
    setListeners(clock, "time", queue.tick);
    clockQueues.set(clock, queue);
  }
  return clockQueues.get(clock);
}
function detachClockEffect(compute) {
  const queue = compute.clockQueue;
  if (!queue) {
    return;
  }
  queue.pending.delete(compute);
  queue.effects.delete(compute);
  if (!queue.effects.size) {
    clearListeners(queue.tick);
    clockQueues.delete(queue.clock);
  }
}
function clockEffect(fn, clock) {
  assertFunction(fn, "clockEffect");
  if (!clock || typeof clock !== "object" || typeof raw(clock).time !== "number") {
    throw new TypeError("simplyflow/state: clockEffect() expects a clock object with a numeric .time property");
  }
  const clockSignal = isSignal(clock) ? clock : signal(raw(clock));
  const connectedSignal = effectSignal(fn);
  const queue = getClockQueue(clockSignal);
  const compute = function computeEffect() {
    clearListeners(compute);
    compute.effectFunction = fn;
    compute.effectType = clockEffect;
    computeStack.push(compute);
    let result;
    try {
      result = fn(compute, computeStack);
    } finally {
      computeStack.pop();
      setEffectResult(connectedSignal, result);
    }
  };
  compute.fn = fn;
  compute.clockQueue = queue;
  compute.skipDependency = (self, property) => self === clockSignal && property === "time";
  compute.scheduleClock = () => {
    if (!compute.clockPending) {
      compute.clockPending = true;
      queue.pending.add(compute);
    }
  };
  compute.destroy = () => detachClockEffect(compute);
  queue.effects.add(compute);
  effectMap.set(connectedSignal, compute);
  compute();
  return connectedSignal;
}
function untracked(fn) {
  assertFunction(fn, "untracked");
  const index = computeStack.length - 1;
  const current = computeStack[index];
  computeStack[index] = false;
  try {
    return fn();
  } finally {
    computeStack[index] = current;
  }
}
function cloneOptions(options) {
  if (typeof options === "boolean") {
    return { deep: options };
  }
  if (options === void 0) {
    return { deep: true };
  }
  if (!options || typeof options !== "object") {
    throw new TypeError("simplyflow/state: clone() expects options to be a boolean or object");
  }
  return { deep: options.deep !== false };
}
function typeName(value) {
  return value?.constructor?.name || Object.prototype.toString.call(value).slice(8, -1);
}
function isPlainObject(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}
function isIntegerKey(property) {
  if (typeof property !== "string" || property === "") {
    return false;
  }
  const index = Number(property);
  return Number.isInteger(index) && index >= 0 && String(index) === property;
}
function hasToClone(value) {
  return typeof value.toClone === "function";
}
function cannotClone(value, path2) {
  throw new TypeError(
    `simplyflow/state: clone() cannot clone ${typeName(value)} at ${path2}; add a toClone() method for custom objects`
  );
}
function cloneDescriptorProperties(source, result, cloneValue, skip = () => false) {
  const descriptors = Object.getOwnPropertyDescriptors(source);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (skip(key)) {
      delete descriptors[key];
      continue;
    }
    const descriptor = descriptors[key];
    if (!Object.hasOwn(descriptor, "value")) {
      cannotClone(source, String(key));
    }
    descriptor.value = cloneValue(descriptor.value, String(key));
  }
  Object.defineProperties(result, descriptors);
  return result;
}
function cloneArrayBuffer(value) {
  return value.slice(0);
}
function cloneSharedArrayBuffer(value) {
  const result = new SharedArrayBuffer(value.byteLength);
  new Uint8Array(result).set(new Uint8Array(value));
  return result;
}
function cloneErrorObject(value, cloneValue, path2) {
  const standardErrors = /* @__PURE__ */ new Set([
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    typeof AggregateError === "undefined" ? void 0 : AggregateError
  ]);
  if (!standardErrors.has(value.constructor)) {
    cannotClone(value, path2);
  }
  const options = Object.hasOwn(value, "cause") ? { cause: cloneValue(value.cause, "cause") } : void 0;
  if (typeof AggregateError !== "undefined" && value instanceof AggregateError) {
    const errors = Array.from(value.errors || [], (error4, index) => cloneValue(error4, `errors.${index}`));
    return new AggregateError(errors, value.message, options);
  }
  return new value.constructor(value.message, options);
}
function clone(value, options) {
  const { deep } = cloneOptions(options);
  const seen = /* @__PURE__ */ new Map();
  function cloneChild(value2, path2) {
    return deep ? cloneValue(value2, path2) : raw(value2);
  }
  function cloneValue(value2, path2 = "value") {
    const source = raw(value2);
    if (!isObjectLike(source)) {
      return source;
    }
    if (seen.has(source)) {
      return seen.get(source);
    }
    if (hasToClone(source)) {
      const result = raw(source.toClone());
      if (Object.is(result, source)) {
        throw new TypeError(`simplyflow/state: clone() toClone() returned the original object at ${path2}`);
      }
      seen.set(source, result);
      return result;
    }
    if (Array.isArray(source)) {
      const result = new Array(source.length);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild, (key) => key === "length");
    }
    if (isPlainObject(source)) {
      const result = Object.create(Object.getPrototypeOf(source));
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (source instanceof Map) {
      const result = /* @__PURE__ */ new Map();
      seen.set(source, result);
      source.forEach((mapValue, mapKey) => {
        result.set(cloneChild(mapKey, "map key"), cloneChild(mapValue, "map value"));
      });
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (source instanceof Set) {
      const result = /* @__PURE__ */ new Set();
      seen.set(source, result);
      source.forEach((setValue) => result.add(cloneChild(setValue, "set value")));
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (source instanceof Date) {
      const result = new Date(source.getTime());
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (source instanceof RegExp) {
      const result = new RegExp(source.source, source.flags);
      result.lastIndex = source.lastIndex;
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild, (key) => key === "lastIndex");
    }
    if (source instanceof ArrayBuffer) {
      const result = cloneArrayBuffer(source);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (typeof SharedArrayBuffer !== "undefined" && source instanceof SharedArrayBuffer) {
      const result = cloneSharedArrayBuffer(source);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (source instanceof DataView) {
      const buffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
      const result = new DataView(buffer);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild);
    }
    if (isTypedArray(source)) {
      const result = new source.constructor(source);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild, isIntegerKey);
    }
    if (typeof URL !== "undefined" && source instanceof URL) {
      const result = new URL(source.href);
      seen.set(source, result);
      return result;
    }
    if (typeof URLSearchParams !== "undefined" && source instanceof URLSearchParams) {
      const result = new URLSearchParams(source);
      seen.set(source, result);
      return result;
    }
    if (typeof File !== "undefined" && source instanceof File) {
      const result = new File([source], source.name, {
        type: source.type,
        lastModified: source.lastModified
      });
      seen.set(source, result);
      return result;
    }
    if (typeof Blob !== "undefined" && source instanceof Blob) {
      const result = source.slice(0, source.size, source.type);
      seen.set(source, result);
      return result;
    }
    if (source instanceof Error) {
      const result = cloneErrorObject(source, cloneChild, path2);
      seen.set(source, result);
      return cloneDescriptorProperties(source, result, cloneChild, (key) => key === "message" || key === "cause" || key === "errors" || key === "stack");
    }
    if (typeof Node !== "undefined" && source instanceof Node && typeof source.cloneNode === "function") {
      const result = source.cloneNode(deep);
      seen.set(source, result);
      return result;
    }
    cannotClone(source, path2);
  }
  return cloneValue(value);
}

// ../simplyflow/packages/bind/src/dom.mjs
var dom_exports = {};
__export(dom_exports, {
  findAttribute: () => findAttribute,
  signal: () => signal2,
  trackDomField: () => trackDomField,
  trackDomList: () => trackDomList
});

// ../simplyflow/packages/bind/src/render.mjs
function writesFromDom(binding, context) {
  return binding.options.twoway || context.edit;
}
function field(context) {
  if (context.templates?.length) {
    fieldByTemplates.call(this, context);
  } else if (Object.hasOwnProperty.call(this.options.renderers, context.element.tagName)) {
    const renderer = this.options.renderers[context.element.tagName];
    if (renderer) {
      renderer.call(this, context);
    }
  } else if (this.options.renderers["*"]) {
    this.options.renderers["*"].call(this, context);
  }
  return context;
}
function list(context) {
  if (!Array.isArray(context.value)) {
    context.value = [context.value];
  }
  const length = context.value.length;
  if (!context.templates?.length) {
    console.error("No templates found in", context.element);
  } else {
    arrayByTemplates.call(this, context);
  }
  return context;
}
function map(context) {
  if (typeof context.value != "object" || !context.value) {
    console.error("Value is not an object.", context.element, context.path, context.value);
  } else if (!context.templates?.length) {
    console.error("No templates found in", context.element);
  } else {
    objectByTemplates.call(this, context);
  }
  return context;
}
function isInt(s) {
  if (parseInt(s) == s) {
    return true;
  }
}
function setValueByPath(root, path2, value, options = {}) {
  batch(() => {
    let parts = path2.split(".");
    let curr = root;
    let part;
    part = parts.shift();
    let prev = null;
    let prevPart = null;
    let prevCurr = curr;
    while (part && curr) {
      prevCurr = curr;
      part = decodeURIComponent(part);
      if (part == "0" && !Array.isArray(curr)) {
      } else if (part == ":key") {
        throw new Error("setting key not yet supported");
        curr = prevPart;
      } else if (part == ":value") {
      } else if (Array.isArray(curr) && !isInt(part) && typeof curr[part] == "undefined") {
        prev = curr[0];
        curr = curr[0][part];
      } else {
        prev = curr;
        curr = curr[part];
      }
      prevPart = part;
      part = parts.shift();
      if (part && !curr) {
        const intKey = parseInt(part);
        if (intKey >= 0 && part === "" + intKey) {
          prevCurr[prevPart] = [];
        } else {
          prevCurr[prevPart] = {};
        }
        curr = prevCurr[prevPart];
      }
    }
    if (prev && prevPart && options.replace) {
      prev[prevPart] = value;
    } else if (prev && prevPart && prev[prevPart] !== value) {
      if (Array.isArray(value)) {
        prev[prevPart] = value;
      } else if (value && typeof value == "object") {
        curr = prev[prevPart];
        if (!curr) {
          prev[prevPart] = {};
          curr = prev[prevPart];
        }
        for (const prop in value) {
          if (curr[prop] !== value[prop]) {
            curr[prop] = value[prop];
          }
        }
      } else {
        prev[prevPart] = value;
      }
    }
  });
}
function arrayByTemplates(context) {
  const attribute = this.options.attribute;
  const attributes2 = [attribute + "-field", attribute + "-edit", attribute + "-list", attribute + "-map", attribute + "-value-path"];
  const attrQuery = "[" + attributes2.join("],[") + "]";
  const keyAttribute = attribute + "-key";
  const items = Array.from(context.element.querySelectorAll(":scope > [" + keyAttribute + "]"));
  const usedItems = /* @__PURE__ */ new Set();
  let cursor = 0;
  context.list = context.value;
  for (let index = 0; index < context.value.length; index++) {
    context.index = index;
    const value = context.list[index];
    let item = nextUnusedItem(items, usedItems, cursor);
    if (!item) {
      context.element.appendChild(this.applyTemplate(context));
      continue;
    }
    const newTemplate = this.findTemplate(context.templates, value);
    const currentValueMatches = item[DEP.VALUE] === value;
    let reusableItem = currentValueMatches ? item : findReusableItem(items, usedItems, value, newTemplate, cursor + 1);
    if (reusableItem) {
      if (newTemplate != reusableItem[DEP.TEMPLATE]) {
        context.element.replaceChild(this.applyTemplate(context), reusableItem);
      } else {
        if (reusableItem !== item) {
          context.element.insertBefore(reusableItem, item);
        }
        updateItemKey(reusableItem, index, context.path, keyAttribute, attributes2, attrQuery);
        reusableItem[DEP.VALUE] = value;
      }
      usedItems.add(reusableItem);
      if (reusableItem === item) {
        cursor++;
      }
      continue;
    }
    context.element.insertBefore(this.applyTemplate(context), item);
  }
  for (let item of items) {
    if (!usedItems.has(item)) {
      item.remove();
    }
  }
  if (this.options.twoway) {
    trackDomList.call(this, context.element);
  }
}
function nextUnusedItem(items, usedItems, start) {
  while (start < items.length) {
    const item = items[start];
    if (!usedItems.has(item)) {
      return item;
    }
    start++;
  }
}
function findReusableItem(items, usedItems, value, template, start) {
  for (let i = start; i < items.length; i++) {
    const item = items[i];
    if (!usedItems.has(item) && item[DEP.VALUE] === value && item[DEP.TEMPLATE] === template) {
      return item;
    }
  }
}
function updateItemKey(item, key, path2, keyAttribute, attributes2, attrQuery) {
  const oldKey = item.getAttribute(keyAttribute);
  const newKey = "" + key;
  if (oldKey === newKey) {
    return;
  }
  item.setAttribute(keyAttribute, newKey);
  const oldPrefix = path2 + "." + oldKey;
  const newPrefix = path2 + "." + newKey;
  const bindings = Array.from(item.querySelectorAll(attrQuery));
  if (item.matches(attrQuery)) {
    bindings.unshift(item);
  }
  for (let binding of bindings) {
    for (let attr of attributes2) {
      const bindPath = binding.getAttribute(attr);
      if (!bindPath || bindPath.substr(0, 5) === ":root") {
        continue;
      }
      if (bindPath === oldPrefix) {
        binding.setAttribute(attr, newPrefix);
      } else if (bindPath.startsWith(oldPrefix + ".")) {
        binding.setAttribute(attr, newPrefix + bindPath.substr(oldPrefix.length));
      }
    }
  }
}
function objectByTemplates(context) {
  const attribute = this.options.attribute;
  const attributes2 = [attribute + "-field", attribute + "-edit", attribute + "-list", attribute + "-map", attribute + "-value-path"];
  const attrQuery = "[" + attributes2.join("],[") + "]";
  const keyAttribute = attribute + "-key";
  const items = Array.from(context.element.querySelectorAll(":scope > [" + keyAttribute + "]"));
  const usedItems = /* @__PURE__ */ new Set();
  let cursor = 0;
  context.list = context.value;
  for (let key in context.list) {
    context.index = key;
    const value = context.list[key];
    let item = nextUnusedItem(items, usedItems, cursor);
    if (!item) {
      context.element.appendChild(this.applyTemplate(context));
      continue;
    }
    const newTemplate = this.findTemplate(context.templates, value);
    let reusableItem;
    if (item.getAttribute(keyAttribute) === key) {
      reusableItem = item;
    } else {
      reusableItem = findItemByKey(items, usedItems, key, keyAttribute) || findReusableItem(items, usedItems, value, newTemplate, cursor);
    }
    if (reusableItem) {
      if (newTemplate != reusableItem[DEP.TEMPLATE]) {
        context.element.replaceChild(this.applyTemplate(context), reusableItem);
      } else {
        if (reusableItem !== item) {
          context.element.insertBefore(reusableItem, item);
        }
        updateItemKey(reusableItem, key, context.path, keyAttribute, attributes2, attrQuery);
        reusableItem[DEP.VALUE] = value;
      }
      usedItems.add(reusableItem);
      if (reusableItem === item) {
        cursor++;
      }
      continue;
    }
    context.element.insertBefore(this.applyTemplate(context), item);
  }
  for (let item of items) {
    if (!usedItems.has(item)) {
      item.remove();
    }
  }
}
function findItemByKey(items, usedItems, key, keyAttribute) {
  const stringKey = "" + key;
  for (let item of items) {
    if (!usedItems.has(item) && item.getAttribute(keyAttribute) === stringKey) {
      return item;
    }
  }
}
function fieldByTemplates(context) {
  const rendered = context.element.querySelector(":scope > :not(template)");
  const template = this.findTemplate(context.templates, context.value);
  context.parent = getParentPath(context.element);
  if (rendered) {
    if (template) {
      if (rendered?.[DEP.TEMPLATE] != template) {
        const clone2 = this.applyTemplate(context);
        context.element.replaceChild(clone2, rendered);
      }
    } else {
      context.element.removeChild(rendered);
    }
  } else if (template) {
    const clone2 = this.applyTemplate(context);
    context.element.appendChild(clone2);
  }
}
function getParentPath(el, attribute) {
  const parentEl = el.parentElement?.closest(`[${attribute}-list],[${attribute}-map]`);
  if (!parentEl) {
    return "";
  }
  if (parentEl.hasAttribute(`${attribute}-list`)) {
    return parentEl.getAttribute(`${attribute}-list`) + ".";
  }
  return parentEl.getAttribute(`${attribute}-map`) + ".";
}
function input(context) {
  const el = context.element;
  let value = context.value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    setProperties(el, value, "title", "id", "className", "value", "checked");
    value = value.value;
  }
  if (typeof value == "undefined") {
    value = "";
  }
  if (el.type == "checkbox") {
    el.checked = checkboxIsChecked(el, value);
  } else if (el.type == "radio") {
    el.checked = matchValue(el.value, value);
  } else if (!matchValue(el.value, value)) {
    el.value = "" + value;
  }
  if (writesFromDom(this, context)) {
    if (el.type == "checkbox") {
      trackDomField.call(this, context.element, ["checked"], true, "checked", checkboxEditValue, context);
    } else if (el.type == "radio") {
      trackDomField.call(this, context.element, ["checked"], true, "checked", radioEditValue, context);
    } else {
      trackDomField.call(this, context.element, ["value"], true, "value", void 0, context);
    }
  }
}
function checkboxIsChecked(el, value) {
  if (Array.isArray(value)) {
    return value.some((selected) => matchValue(el.value, selected));
  }
  if (typeof value === "boolean") {
    return value;
  }
  return matchValue(el.value, value);
}
function checkboxEditValue(el, currentValue) {
  if (Array.isArray(currentValue)) {
    const value = el.value;
    const values5 = currentValue.filter((item) => !matchValue(item, value));
    if (el.checked) {
      values5.push(value);
    }
    return values5;
  }
  if (typeof currentValue === "boolean") {
    return el.checked;
  }
  if (el.checked && matchValue(el.value, currentValue)) {
    return currentValue;
  }
  return el.checked;
}
function radioEditValue(el, currentValue) {
  if (!el.checked) {
    return void 0;
  }
  return el.value;
}
function button(context) {
  element.call(this, context, "value");
}
function select(context) {
  const el = context.element;
  let value = context.value;
  if (value === null) {
    value = "";
  }
  if (Array.isArray(value)) {
    for (let option of el.options) {
      option.selected = value.some((selected) => matchValue(option.value, selected));
      if (option.selected) {
        option.setAttribute("selected", true);
      } else {
        option.removeAttribute("selected");
      }
    }
  } else if (typeof value != "object") {
    let option = Array.from(el.options).find((o) => matchValue(o.value, value));
    if (option) {
      option.selected = true;
      option.setAttribute("selected", true);
    }
  } else {
    if (value.options) {
      setSelectOptions(el, value.options);
    }
    if (typeof value.selected !== "undefined") {
      select.call(this, Object.assign({}, context, { value: value.selected }));
    }
    setProperties(el, value, "name", "id", "selectedIndex", "className");
  }
  if (writesFromDom(this, context)) {
    if (el.multiple) {
      trackDomField.call(this, context.element, ["value"], true, "value", selectMultipleEditValue, context);
    } else {
      trackDomField.call(this, context.element, ["value"], true, "value", void 0, context);
    }
  }
}
function selectMultipleEditValue(el) {
  const value = el.value;
  return Array.from(el.options).filter((option) => option.selected).map((option) => option.value);
}
function addOption(select2, option) {
  if (!option) {
    return;
  }
  if (typeof option !== "object") {
    select2.options.add(new Option("" + option));
  } else if (option.text) {
    select2.options.add(new Option(option.text, option.value, option.defaultSelected, option.selected));
  } else if (typeof option.value != "undefined") {
    select2.options.add(new Option("" + option.value, option.value, option.defaultSelected, option.selected));
  }
}
function setSelectOptions(select2, options) {
  select2.innerHTML = "";
  if (Array.isArray(options)) {
    for (const option of options) {
      addOption(select2, option);
    }
  } else if (options && typeof options == "object") {
    for (const option in options) {
      addOption(select2, { text: options[option], value: option });
    }
  }
}
function anchor(context) {
  element.call(this, context, "target", "href", "name", "newwindow", "nofollow");
  if (writesFromDom(this, context)) {
    batch(() => {
      updateProperties.call(this, context, ["target", "href", "name", "newwindow", "nofollow"]);
    });
  }
}
function image(context) {
  setProperties(context.element, context.value, "title", "alt", "src", "id");
  if (writesFromDom(this, context)) {
    batch(() => {
      updateProperties.call(this, context, ["title", "alt", "src", "id"]);
    });
  }
}
function iframe(context) {
  setProperties(context.element, context.value, "title", "src", "id");
  if (writesFromDom(this, context)) {
    batch(() => {
      updateProperties.call(this, context, ["title", "src", "id"]);
    });
  }
}
function meta(context) {
  setProperties(context.element, context.value, "content", "id");
  if (writesFromDom(this, context)) {
    batch(() => {
      updateProperties.call(this, context, ["content", "id"]);
    });
  }
}
function element(context, ...extraprops) {
  const el = context.element;
  let value = context.value;
  let valueIsString = false;
  if (typeof value != "undefined" && value !== null) {
    let strValue = "" + value;
    if (typeof value != "object" || strValue.substring(0, 8) != "[object ") {
      value = { innerHTML: value };
      valueIsString = true;
    }
  }
  const props = ["innerHTML", "title", "id", "className"].concat(extraprops);
  setProperties(el, value, ...props);
  if (writesFromDom(this, context)) {
    trackDomField.call(this, context.element, props, valueIsString, "innerHTML", void 0, context);
  }
}
function setProperties(el, data, ...properties) {
  if (!data || typeof data !== "object") {
    return;
  }
  for (const property of properties) {
    if (typeof data[property] === "undefined") {
      continue;
    }
    if (matchValue(el[property], data[property])) {
      continue;
    }
    if (data[property] === null) {
      el[property] = "";
    } else {
      el[property] = "" + data[property];
    }
  }
}
function updateProperties(context, properties) {
  trackDomField.call(this, context.element, properties, false, "innerHTML", void 0, context);
}
function getProperties(el, ...properties) {
  const result = {};
  for (const property of properties) {
    switch (property) {
      default:
        result[property] = el[property];
        break;
    }
  }
  return result;
}
function matchValue(a, b) {
  if (a == ":empty" && !b) {
    return true;
  }
  if (b == ":empty" && !a) {
    return true;
  }
  if ("" + a == "" + b) {
    return true;
  }
  return false;
}

// ../simplyflow/packages/bind/src/dom.mjs
var domSignals = /* @__PURE__ */ new WeakMap();
var observers = /* @__PURE__ */ new WeakMap();
var domSignalHandler = {
  get: (target, property, receiver) => {
    const value = target?.[property];
    notifyGet(receiver, property);
    if (typeof value === "function") {
      return value.bind(target);
    }
    if (value && typeof value == "object") {
      return signal(value);
    }
    return value;
  },
  set: (target, property, value, receiver) => {
    const current = target[property];
    target[property] = value;
    const now2 = target[property];
    if (!Object.is(current, now2)) {
      notifySet(receiver, makeContext(property, { was: current, now: now2 }));
    }
    return true;
  },
  has: (target, property) => {
    const receiver = getSignal(target);
    if (receiver) {
      notifyGet(receiver, property);
    }
    return Reflect.has(target, property);
  },
  ownKeys: (target) => {
    const receiver = getSignal(target);
    if (receiver) {
      notifyGet(receiver, DEP.ITERATE);
    }
    return Reflect.ownKeys(target);
  }
};
function signal2(el, options) {
  if (isSignal(el)) {
    return el;
  }
  const existing = getSignal(el);
  if (existing) {
    return existing;
  }
  return createSignal(el, domSignalHandler, (target, proxy) => {
    domListen(target, proxy, options);
  });
}
function domListen(el, signal3, options) {
  const defaultOptions = {
    characterData: true,
    subtree: true,
    attributes: true,
    attributesOldValue: true,
    childList: true
  };
  if (!options) {
    options = defaultOptions;
  }
  let oldContentHTML = el.innerHTML;
  let oldContentText = el.innerText;
  if (!observers.has(el)) {
    const observer = new MutationObserver((mutationList, observer2) => {
      const changes = {};
      for (const mutation of mutationList) {
        if (mutation.type === "attributes") {
          changes[mutation.attributeName] = mutation.attributeOldValue;
        } else if (mutation.type === "subtree" || mutation.type === "characterData") {
          if (el.innerHTML != oldContentHTML) {
            changes.innerHTML = oldContentHTML;
            oldContentHTML = el.innerHTML;
          }
          if (el.innerText != oldContentText) {
            changes.innerText = oldContentText;
            oldContentText = el.innerText;
          }
        } else if (mutation.type === "childList") {
          changes.children = {
            //FIXME: overwrites changes in this list path if list is rendered multiple times
            was: Array.from(el.children)
            //FIXME; fill in 'now'
          };
          changes.length = -1;
          if (el.innerHTML != oldContentHTML) {
            changes.innerHTML = oldContentHTML;
            oldContentHTML = el.innerHTML;
          }
          if (el.innerText != oldContentText) {
            changes.innerText = oldContentText;
            oldContentText = el.innerText;
          }
        } else {
          console.log("nothing to do for", el, mutation.type);
        }
      }
      for (const prop in changes) {
        notifySet(signal3, makeContext(prop, { was: changes[prop], now: el[prop] }));
      }
    });
    observer.observe(el, options);
    observers.set(el, observer);
    if (el.matches("input, textarea, select")) {
      let prevValue = el.value;
      let prevChecked = el.checked;
      const notifyFormValue = () => {
        notifySet(signal3, makeContext("value", { was: prevValue, now: el.value }));
        prevValue = el.value;
        if ("checked" in el) {
          notifySet(signal3, makeContext("checked", { was: prevChecked, now: el.checked }));
          prevChecked = el.checked;
        }
      };
      el.addEventListener("change", notifyFormValue);
      if (el.matches("input, textarea")) {
        el.addEventListener("input", notifyFormValue);
      }
    }
  }
}
function trackDomList(element2) {
  const path2 = this.getBindingPath(element2);
  if (!path2) {
    throw new Error("Could not find binding path for element", { cause: element2 });
  }
  const s = signal2(element2, {
    childList: true
  });
  throttledEffect(() => {
    const children = Array.from(s.children);
    untracked(() => {
      batch(() => {
        let key = 0;
        const currentList = getValueByPath(this.options.root, path2);
        const source = currentList.slice();
        for (const item of children) {
          if (item.tagName === "TEMPLATE") {
            continue;
          }
          if (item.dataset.flowKey) {
            if (item.dataset.flowKey != key) {
              setValueByPath(
                this.options.root,
                path2 + "." + key,
                source[item.dataset.flowKey]
              );
            }
            key++;
          }
        }
        if (currentList.length > key) {
          currentList.length = key;
        }
      });
    });
  }, 50);
  return s;
}
function trackDomField(element2, props, valueIsString, stringProperty = "innerHTML", getUpdateValue, context) {
  if (domSignals.has(element2)) {
    return;
  }
  const path2 = this.getBindingPath(element2);
  if (!path2) {
    throw new Error("Could not find binding path for element", { cause: element2 });
  }
  const s = signal2(element2);
  domSignals.set(element2, s);
  batch(() => {
    throttledEffect(() => {
      let updateValue;
      if (getUpdateValue) {
        for (const prop of props) {
          s[prop];
        }
      } else {
        updateValue = s[stringProperty];
        if (!valueIsString) {
          updateValue = getProperties(s, ...props);
        }
      }
      untracked(() => {
        const currentValue = getValueByPath(this.options.root, path2);
        if (getUpdateValue) {
          updateValue = getUpdateValue.call(this, s, currentValue);
        }
        if (typeof updateValue === "undefined") {
          return;
        }
        updateValue = this.extractValue?.(context, updateValue, currentValue) ?? updateValue;
        if (typeof updateValue === "undefined") {
          return;
        }
        if (valueIsString && !Object.is(currentValue, updateValue) && String(currentValue) === updateValue) {
          return;
        }
        setValueByPath(this.options.root, path2, updateValue, { replace: context?.replaceValue });
      });
    }, 50);
  });
  return s;
}
function findAttribute(el, attr) {
  return el.closest("[" + attr + "]")?.getAttribute(attr);
}

// ../simplyflow/packages/bind/src/transformers.mjs
var escape_html = {
  render(context, next) {
    if (typeof context.value !== "string") {
      return next(context);
    }
    if (usesValueProperty(context.element)) {
      context.value = { value: context.value };
    } else {
      context.value = { innerHTML: escapeHTML(context.value) };
    }
    return next(context);
  },
  extract(context, next) {
    if (typeof context.value === "string") {
      context.value = unescapeHTML(context.value);
    } else if (context.value && typeof context.value === "object") {
      if (typeof context.value.innerHTML === "string") {
        context.value = unescapeHTML(context.value.innerHTML);
      } else if (typeof context.value.value === "string") {
        context.value = context.value.value;
      }
    }
    return next(context);
  }
};
function usesValueProperty(element2) {
  return element2?.tagName === "INPUT" || element2?.tagName === "TEXTAREA";
}
function escapeHTML(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function unescapeHTML(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}
function fixed_content(context, next) {
  if (typeof context.value == "string") {
    context.value = {};
  } else {
    delete context.value?.innerHTML;
  }
  next(context);
}
var attributes = {
  render(context) {
    const names = getAttributeNames.call(this, context);
    setAttributes(context.element, context.value, names);
    if (context.edit) {
      trackDomField.call(
        this,
        context.element,
        names,
        false,
        "innerHTML",
        () => readAttributes(context.element, names),
        context
      );
    }
    return context;
  },
  extract(context, next) {
    const names = getAttributeNames.call(this, context);
    context.value = readAttributes(context.element, names);
    context.replaceValue = true;
    return next ? next(context) : context;
  }
};
function getAttributeNames(context) {
  const attribute = this.options.attribute + "-attributes";
  const configured = context.element.getAttribute(attribute);
  if (configured) {
    return configured.split(/[\s,]+/).filter(Boolean);
  }
  if (context.value && typeof context.value === "object" && !Array.isArray(context.value)) {
    return Object.keys(context.value);
  }
  if (context.currentValue && typeof context.currentValue === "object" && !Array.isArray(context.currentValue)) {
    return Object.keys(context.currentValue);
  }
  return [];
}
function setAttributes(element2, data, names) {
  if (!names.length || !data || typeof data !== "object" || Array.isArray(data)) {
    return;
  }
  for (const name of names) {
    const value = data[name];
    if (typeof value === "undefined" || value === null) {
      element2.removeAttribute(name);
    } else if (element2.getAttribute(name) !== "" + value) {
      element2.setAttribute(name, "" + value);
    }
  }
}
function readAttributes(element2, names) {
  const data = {};
  for (const name of names) {
    if (element2.hasAttribute(name)) {
      data[name] = element2.getAttribute(name);
    }
  }
  return data;
}

// ../simplyflow/packages/bind/src/index.mjs
var SimplyBind = class {
  /**
   * @param Object options - a set of options for this instance, options may include:
   *  - root (signal) (required) - the root data object that contains al signals that can be bound
   *  - container (HTMLElement) - the dom element to use as the root for all bindings
   *  - attribute (string) - the prefix for the field, edit, list and map attributes, e.g. 'data-bind'
   *  - transformers (object name:function) - a map of transformer names and functions
   *  - render (object with field, list and map properties); edit uses field renderers
   */
  constructor(options) {
    this.bindings = /* @__PURE__ */ new Map();
    const defaultTransformers = {
      escape_html,
      fixed_content,
      attributes
    };
    const defaultOptions = {
      container: document.body,
      attribute: "data-flow",
      transformers: defaultTransformers,
      render: {
        field: [field],
        list: [list],
        map: [map]
      },
      renderers: {
        "INPUT": input,
        "TEXTAREA": input,
        "BUTTON": button,
        "SELECT": select,
        "A": anchor,
        "IMG": image,
        "IFRAME": iframe,
        "META": meta,
        "TEMPLATE": null,
        "*": element
      },
      twoway: false
    };
    if (!options?.root) {
      throw new Error("bind needs at least options.root set");
    }
    this.options = Object.assign({}, defaultOptions, options);
    if (options.transformers) {
      this.options.transformers = Object.assign({}, defaultTransformers, options?.transformers);
    } else {
      this.options.transformers = defaultTransformers;
    }
    const attribute = this.options.attribute;
    const bindAttributes = [attribute + "-field", attribute + "-edit", attribute + "-list", attribute + "-map"];
    const getBindingAttribute = (el) => {
      const foundAttribute = bindAttributes.find((attr) => el.hasAttribute(attr));
      if (!foundAttribute) {
        console.error("No matching attribute found", el, bindAttributes);
      }
      return foundAttribute;
    };
    const renderElement = (el) => {
      this.bindings.set(el, throttledEffect(() => {
        if (!el.isConnected) {
          untrack(el, this.getBindingPath(el));
          const binding = this.bindings.get(el);
          if (binding) {
            destroy(binding);
            this.bindings.delete(el);
          }
          return;
        }
        let context = {
          templates: el.querySelectorAll(":scope > template"),
          attribute: getBindingAttribute(el)
        };
        context.edit = context.attribute === this.options.attribute + "-edit";
        context.path = this.getBindingPath(el);
        context.value = getValueByPath(this.options.root, context.path);
        context.element = el;
        track(el, context);
        runTransformers(context);
      }, 50));
    };
    const runTransformers = (context) => {
      let transformers;
      switch (context.attribute) {
        case this.options.attribute + "-field":
        case this.options.attribute + "-edit":
          transformers = Array.from(this.options.render.field);
          break;
        case this.options.attribute + "-list":
          transformers = Array.from(this.options.render.list);
          break;
        case this.options.attribute + "-map":
          transformers = Array.from(this.options.render.map);
          break;
        default:
          throw new Error("no valid context attribute specified", context);
          break;
      }
      transformers.push(...this.getNamedTransformers(context.element).map((transformer) => getTransformerPhase(transformer, "render")).filter(Boolean));
      runTransformerStack.call(this, transformers, context);
    };
    const applyBindings = (bindings2) => {
      for (let bindingEl of bindings2) {
        if (!this.bindings.get(bindingEl)) {
          renderElement(bindingEl);
        }
      }
    };
    const updateBindings = (changes) => {
      const selector = `[${attribute}-field],[${attribute}-edit],[${attribute}-list],[${attribute}-map]`;
      for (const change of changes) {
        if (change.type == "childList" && change.addedNodes) {
          for (let node of change.addedNodes) {
            if (node instanceof HTMLElement) {
              let bindings2 = Array.from(node.querySelectorAll(selector));
              if (node.matches(selector)) {
                bindings2.unshift(node);
              }
              if (bindings2.length) {
                applyBindings(bindings2);
              }
            }
          }
        }
      }
    };
    this.observer = new MutationObserver((changes) => {
      updateBindings(changes);
    });
    this.observer.observe(this.options.container, {
      subtree: true,
      childList: true
    });
    const bindings = this.options.container.querySelectorAll(
      ":is([" + this.options.attribute + "-field],[" + this.options.attribute + "-edit],[" + this.options.attribute + "-list],[" + this.options.attribute + "-map]):not(template)"
    );
    try {
      if (bindings.length) {
        applyBindings(bindings);
      }
    } catch (error4) {
      this.destroy();
      throw error4;
    }
  }
  /**
   * Finds the first matching template and creates a new DocumentFragment
   * with the correct data bind attributes in it (prepends the current path)
   * @param Context context
   * @return DocumentFragment
   */
  applyTemplate(context) {
    const path2 = context.path;
    const parent = context.parent;
    const templates = context.templates;
    const list2 = context.list;
    const index = context.index;
    const value = list2 ? list2[index] : context.value;
    let template = this.findTemplate(templates, value);
    if (!template) {
      let result = new DocumentFragment();
      result.innerHTML = "<!-- no matching template -->";
      return result;
    }
    let clone2 = template.content.cloneNode(true);
    if (!clone2.children?.length) {
      return clone2;
    }
    if (clone2.children.length > 1) {
      throw new Error("template must contain a single root node", { cause: template });
    }
    const attribute = this.options.attribute;
    const attributes2 = [attribute + "-field", attribute + "-edit", attribute + "-list", attribute + "-map"];
    const bindings = clone2.querySelectorAll(`[${attribute}-field],[${attribute}-edit],[${attribute}-list],[${attribute}-map]`);
    for (let binding of bindings) {
      if (binding.tagName == "TEMPLATE") {
        continue;
      }
      const attr = attributes2.find((attr2) => binding.hasAttribute(attr2));
      let bind2 = binding.getAttribute(attr);
      bind2 = this.applyLinks(template.links, bind2);
      if (bind2.substring(0, ":root.".length) == ":root.") {
        binding.setAttribute(attr, bind2.substring(":root.".length));
      } else if (bind2 == ":value" && index != null) {
        binding.setAttribute(attr, path2 + "." + index);
      } else if (index != null) {
        binding.setAttribute(attr, path2 + "." + index + "." + bind2);
      } else {
        binding.setAttribute(attr, parent + bind2);
      }
    }
    this.applyTemplateCommandValues(clone2, template.links, path2, index);
    if (typeof index !== "undefined") {
      clone2.children[0].setAttribute(attribute + "-key", index);
    }
    clone2.children[0][DEP.TEMPLATE] = template;
    clone2.children[0][DEP.VALUE] = value;
    return clone2;
  }
  applyTemplateCommandValues(fragment, links, path2, index) {
    const valueAttribute = this.options.attribute + "-value";
    const valuePathAttribute = this.options.attribute + "-value-path";
    const valueSelector = "[" + valueAttribute + "]";
    const elements = Array.from(fragment.querySelectorAll(valueSelector));
    for (const element2 of elements) {
      let value = element2.getAttribute(valueAttribute);
      value = this.applyLinks(links, value);
      const resolved = templateCommandValue(value, path2, index);
      if (!resolved) {
        continue;
      }
      if (Object.hasOwn(resolved, "path")) {
        element2.setAttribute(valuePathAttribute, resolved.path);
      } else {
        element2.setAttribute(valueAttribute, resolved.value);
        element2.removeAttribute(valuePathAttribute);
      }
    }
  }
  parseLinks(links) {
    let result = {};
    links = links.split(";").map((link) => link.trim());
    for (let link of links) {
      link = link.split("=");
      result[link[0].trim()] = link[1].trim();
    }
    return result;
  }
  applyLinks(links, value) {
    for (let link in links) {
      if (value.startsWith(link + ".")) {
        return links[link] + value.substr(link.length);
      } else if (value == link) {
        return links[link];
      }
    }
    return value;
  }
  /**
   * Returns the path referenced in either the field, list or map attribute
   * @param HTMLElement el
   * @return string The path referenced, or void
   */
  getBindingPath(el) {
    const attributes2 = [
      this.options.attribute + "-field",
      this.options.attribute + "-edit",
      this.options.attribute + "-list",
      this.options.attribute + "-map"
    ];
    for (let attr of attributes2) {
      if (el.hasAttribute(attr)) {
        return el.getAttribute(attr);
      }
    }
  }
  getNamedTransformers(el) {
    const transformAttribute = this.options.attribute + "-transform";
    if (!el.hasAttribute(transformAttribute)) {
      return [];
    }
    return el.getAttribute(transformAttribute).split(" ").filter(Boolean).map((name) => {
      const transformer = this.options.transformers[name];
      if (!transformer) {
        console.warn("No transformer with name " + name + " configured", { cause: el });
        return null;
      }
      return transformer;
    }).filter(Boolean);
  }
  extractValue(context, value, currentValue) {
    if (!context?.element) {
      return value;
    }
    const transformers = this.getNamedTransformers(context.element).map((transformer) => getTransformerPhase(transformer, "extract")).filter(Boolean).reverse();
    if (!transformers.length) {
      return value;
    }
    delete context.replaceValue;
    const extractContext = Object.assign({}, context, {
      value,
      currentValue,
      originalValue: currentValue
    });
    runTransformerStack.call(this, transformers, extractContext);
    context.replaceValue = extractContext.replaceValue;
    return extractContext.value;
  }
  /**
   * Finds the first template from an array of templates that
   * matches the given value. 
   */
  findTemplate(templates, value) {
    const templateMatches = (t) => {
      let path2 = this.getBindingPath(t);
      let currentItem;
      if (path2) {
        if (path2.substr(0, 6) == ":root.") {
          currentItem = getValueByPath(this.options.root, path2.substring(6));
        } else {
          currentItem = getValueByPath(value, path2);
        }
      } else {
        currentItem = value;
      }
      const strItem = "" + currentItem;
      let matches = t.getAttribute(this.options.attribute + "-match");
      if (matches) {
        if (matches === ":empty" && !currentItem) {
          return t;
        } else if (matches === ":notempty" && currentItem) {
          return t;
        }
        if (strItem == matches) {
          return t;
        }
      }
      if (!matches) {
        return t;
      }
    };
    let template = Array.from(templates).find(templateMatches);
    let links = null;
    if (template?.hasAttribute(this.options.attribute + "-link")) {
      links = this.parseLinks(template.getAttribute(this.options.attribute + "-link"));
    }
    let rel = template?.getAttribute("rel");
    if (rel) {
      let replacement = document.querySelector("template#" + rel);
      if (!replacement) {
        throw new Error("Could not find template with id " + rel);
      }
      template = replacement;
    }
    if (template) {
      template.links = links;
    }
    return template;
  }
  destroy() {
    this.bindings.forEach((binding, element2) => {
      untrack(element2, this.getBindingPath(element2));
      destroy(binding);
    });
    this.bindings = /* @__PURE__ */ new Map();
    this.observer.disconnect();
  }
};
function bind(options) {
  return new SimplyBind(options);
}
function getTransformerPhase(transformer, phase) {
  if (typeof transformer === "function") {
    return phase === "render" ? transformer : null;
  }
  if (transformer && typeof transformer[phase] === "function") {
    return transformer[phase];
  }
  return null;
}
function runTransformerStack(transformers, context) {
  let next = (context2) => context2;
  for (let transformer of transformers) {
    next = /* @__PURE__ */ ((next2, transformer2) => {
      return (context2) => {
        return transformer2.call(this, context2, next2);
      };
    })(next, transformer);
  }
  return next?.(context);
}
var tracking = /* @__PURE__ */ new Map();
function track(el, context) {
  untrack(el);
  if (!tracking.has(context.path)) {
    tracking.set(context.path, [context]);
  } else {
    tracking.get(context.path).push(context);
  }
}
function untrack(el, path2) {
  if (path2) {
    let list2 = tracking.get(path2);
    if (list2) {
      list2 = list2.filter((context) => context.element !== el);
      tracking.set(path2, list2);
    }
    return;
  }
  tracking.forEach((list2, trackedPath) => {
    list2 = list2.filter((context) => context.element !== el);
    tracking.set(trackedPath, list2);
  });
}
function templateCommandValue(value, path2, index) {
  if (!value || value[0] !== ":") {
    return null;
  }
  if (value === ":key") {
    return { value: "" + index };
  }
  if (value === ":value") {
    return { path: templateItemPath(path2, index) };
  }
  if (value.startsWith(":value.")) {
    return { path: joinPath(templateItemPath(path2, index), value.substring(":value".length)) };
  }
  if (value.startsWith(":root.")) {
    return { path: value.substring(":root.".length) };
  }
  return null;
}
function templateItemPath(path2, index) {
  if (typeof index === "undefined") {
    return path2;
  }
  return joinPath(path2, "." + index);
}
function joinPath(path2, suffix) {
  if (!path2) {
    return suffix.replace(/^\./, "");
  }
  return path2 + suffix;
}
function getValueByPath(root, path2) {
  let parts = path2.split(".");
  let curr = root;
  let part;
  part = parts.shift();
  let prevPart = null;
  while (part && curr) {
    part = decodeURIComponent(part);
    if (part == "0" && !Array.isArray(curr)) {
    } else if (part == ":key") {
      curr = prevPart;
    } else if (part == ":value") {
    } else if (Array.isArray(curr) && typeof curr[part] == "undefined" && curr[0]) {
      curr = curr[0][part];
    } else {
      curr = curr[part];
    }
    prevPart = part;
    part = parts.shift();
  }
  return curr;
}

// ../simplyflow/packages/model/src/index.mjs
var SimplyFlowModel = class {
  /**
   * Creates a new datamodel, with a state property that contains
   * all the data passed to this constructor
   * @param state	Object with all the data for this model
   * @throws Error if state is not set
   */
  constructor(state) {
    if (!state) {
      throw new Error("no options set");
    }
    if (state.data == null || typeof state.data[Symbol.iterator] !== "function") {
      console.warn("SimplyFlowModel: options.data is not iterable");
    }
    this.state = signal(state);
    if (!this.state.options) {
      this.state.options = {};
    }
    this.effects = [{ current: this.state.data }];
    this.view = {
      current: this.state.data
    };
  }
  /**
   * Adds an effect to run whenever a signal it depends on
   * changes. this.state is the usual signal.
   * The `fn` function param is not itself an effect, but must return
   * and effect function. `fn` takes one param, which is the data signal.
   * This signal will always have at least a `current` property.
   * The result of the effect function is pushed on to the this.effects
   * list. And the last effect added is set as this.view
   */
  addEffect(fn) {
    if (!fn || typeof fn !== "function") {
      throw new Error("addEffect requires an effect function as its parameter", { cause: fn });
    }
    const dataSignal = this.effects[this.effects.length - 1];
    const connectedSignal = fn.call(this, dataSignal);
    if (!isSignal(connectedSignal)) {
      throw new Error("addEffect function parameter must return a Signal", { cause: fn });
    }
    this.view = connectedSignal;
    this.effects.push(this.view);
  }
};
function model(options) {
  return new SimplyFlowModel(options);
}
function sort(options = {}) {
  return function(data) {
    this.state.options.sort = Object.assign({
      direction: "asc",
      sortBy: null,
      sortFn: ((a, b) => {
        const sort2 = this.state.options.sort;
        const sortBy = sort2.sortBy;
        if (!sort2.sortBy) {
          return 0;
        }
        const direction = sort2.sortDirection || sort2.direction || "asc";
        const larger = direction == "asc" ? 1 : -1;
        const smaller = direction == "asc" ? -1 : 1;
        if (typeof a?.[sortBy] === "undefined") {
          if (typeof b?.[sortBy] === "undefined") {
            return 0;
          }
          return larger;
        }
        if (typeof b?.[sortBy] === "undefined") {
          return smaller;
        }
        if (a[sortBy] < b[sortBy]) {
          return smaller;
        } else if (a[sortBy] > b[sortBy]) {
          return larger;
        } else {
          return 0;
        }
      })
    }, options);
    return throttledEffect(() => {
      const sort2 = this.state.options.sort;
      const direction = sort2?.sortDirection || sort2?.direction;
      if (sort2?.sortBy && direction) {
        const trackedSortFn = sort2.sortFn;
        const sortFn = raw(sort2).sortFn || trackedSortFn;
        return data.current.toSorted((a, b) => sortFn.call(this, a, b));
      }
      return data.current;
    }, 50);
  };
}
function paging(options = {}) {
  return function(data) {
    this.state.options.paging = Object.assign({
      page: 1,
      pageSize: 20,
      max: 1
    }, options);
    return throttledEffect(() => {
      return batch(() => {
        const paging2 = this.state.options.paging;
        if (!paging2.pageSize) {
          paging2.pageSize = 20;
        }
        paging2.max = Math.ceil(data.current.length / paging2.pageSize);
        paging2.page = Math.max(1, Math.min(paging2.max, paging2.page));
        const start = (paging2.page - 1) * paging2.pageSize;
        const end = start + paging2.pageSize;
        return data.current.slice(start, end);
      });
    }, 50);
  };
}
function filter(options) {
  if (!options?.name || typeof options.name !== "string") {
    throw new Error("filter requires options.name to be a string");
  }
  if (!options.matches || typeof options.matches !== "function") {
    throw new Error("filter requires options.matches to be a function");
  }
  return function(data) {
    if (this.state.options[options.name]) {
      throw new Error("a filter with this name already exists on this model");
    }
    this.state.options[options.name] = options;
    return throttledEffect(() => {
      const filterOptions = this.state.options[options.name];
      if (filterOptions.enabled) {
        const trackedMatches = filterOptions.matches;
        const matches = raw(filterOptions).matches || trackedMatches;
        return data.current.filter((row) => matches.call(this, row));
      }
      return data.current;
    }, 50);
  };
}
function columns(options = {}) {
  const columnOptions = options?.columns && typeof options.columns === "object" ? options.columns : options;
  if (!columnOptions || typeof columnOptions !== "object" || Object.keys(columnOptions).length === 0) {
    throw new Error("columns requires options to be an object with at least one property");
  }
  return function(data) {
    this.state.options.columns = columnOptions;
    const projections = /* @__PURE__ */ new WeakMap();
    return throttledEffect(() => {
      const visibleKeys = [];
      const visible = /* @__PURE__ */ new Set();
      const columns2 = this.state.options.columns;
      for (let key of Object.keys(columns2)) {
        if (columns2[key]?.visible !== false) {
          visibleKeys.push(key);
          visible.add(key);
        }
      }
      return data.current.map((input2) => {
        const source = raw(input2);
        let result = source && typeof source === "object" ? projections.get(source) : null;
        if (!result) {
          result = {};
          if (source && typeof source === "object") {
            projections.set(source, result);
          }
        }
        for (let key of visibleKeys) {
          const value = input2?.[key] ?? null;
          if (result[key] !== value) {
            result[key] = value;
          }
        }
        for (let key of Object.keys(result)) {
          if (!visible.has(key)) {
            delete result[key];
          }
        }
        return result;
      });
    }, 50);
  };
}
function scroll(options) {
  return function(data) {
    this.state.options.scroll = Object.assign({
      offset: 0,
      rowHeight: 26,
      rowCount: 20,
      itemsPerRow: 1,
      size: data.current.length
    }, options);
    const scrollOptions = this.state.options.scroll;
    const scrollbar = scrollOptions.scrollbar || scrollOptions.container?.querySelector("[data-flow-scrollbar]");
    if (scrollbar) {
      if (scrollOptions.container) {
        scrollOptions.container.addEventListener("scroll", (evt) => {
          scrollOptions.offset = Math.floor(
            scrollOptions.container.scrollTop / (scrollOptions.rowHeight * scrollOptions.itemsPerRow)
          );
        });
      }
      throttledEffect(() => {
        scrollOptions.size = data.current.length * scrollOptions.rowHeight;
        scrollbar.style.height = scrollOptions.size + "px";
      }, 50);
    }
    return throttledEffect(() => {
      if (scrollOptions.container) {
        scrollOptions.rowCount = Math.ceil(
          scrollOptions.container.getBoundingClientRect().height / scrollOptions.rowHeight
        );
      }
      scrollOptions.data = data.current;
      let start = Math.min(scrollOptions.offset, data.current.length - 1);
      let end = start + scrollOptions.rowCount;
      if (end > data.current.length) {
        end = data.current.length;
        start = end - scrollOptions.rowCount;
      }
      return data.current.slice(start, end);
    }, 50);
  };
}

// ../simplyflow/packages/simplyflow/src/render.mjs
var SimplyRender = class extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    let templateId = this.getAttribute("rel");
    let template = document.getElementById(templateId);
    if (template) {
      let content = template.content.cloneNode(true);
      for (const node of content.childNodes) {
        const clone2 = node.cloneNode(true);
        if (clone2.nodeType == document.ELEMENT_NODE) {
          clone2.querySelectorAll("template").forEach(function(t) {
            t.setAttribute("simply-render", "");
          });
          if (this.attributes) {
            for (const attr of this.attributes) {
              if (attr.name != "rel") {
                clone2.setAttribute(attr.name, attr.value);
              }
            }
          }
        }
        this.parentNode.insertBefore(clone2, this);
      }
      this.parentNode.removeChild(this);
    } else {
      const observe = () => {
        const observer = new MutationObserver(() => {
          template = document.getElementById(templateId);
          if (template) {
            observer.disconnect();
            this.replaceWith(this);
          }
        });
        observer.observe(globalThis.document, {
          subtree: true,
          childList: true
        });
      };
      observe();
    }
  }
};
if (!customElements.get("simply-render")) {
  customElements.define("simply-render", SimplyRender);
}

// ../simplyflow/packages/app/src/suggest.mjs
function closest(name, options, { maxDistance = 2, minLength = 4 } = {}) {
  if (name.length < minLength) {
    return;
  }
  let result;
  let resultDistance = Infinity;
  for (const option of options) {
    const distance = editDistance(name, option, maxDistance);
    if (distance < resultDistance) {
      result = option;
      resultDistance = distance;
    }
  }
  return resultDistance <= maxDistance ? result : void 0;
}
function editDistance(a, b, maxDistance = 2) {
  const tooFar = maxDistance + 1;
  if (Math.abs(a.length - b.length) > maxDistance) {
    return tooFar;
  }
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);
  for (let ai = 1; ai <= a.length; ai++) {
    current[0] = ai;
    for (let bi = 1; bi <= b.length; bi++) {
      const cost = a[ai - 1] === b[bi - 1] ? 0 : 1;
      current[bi] = Math.min(
        previous[bi] + 1,
        current[bi - 1] + 1,
        previous[bi - 1] + cost
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[b.length];
}

// ../simplyflow/packages/app/src/route.mjs
function routes(options) {
  return new SimplyRoute(options);
}
var SimplyRoute = class {
  constructor(options = {}) {
    this.options = options;
    this.baseURL = options.baseURL || "/";
    this.app = options.app || {};
    this.addMissingSlash = !!options.addMissingSlash;
    this.matchExact = !!options.matchExact;
    this.hijackLinks = !!options.hijackLinks;
    this.clear();
    if (options.routes) {
      this.load(options.routes);
    }
  }
  load(routes2) {
    parseRoutes(routes2, this.routeInfo, this.matchExact);
  }
  clear() {
    this.routeInfo = [];
    this.listeners = {
      match: {},
      call: {},
      goto: {},
      finish: {}
    };
  }
  match(path2, options) {
    let args = {
      path: path2,
      options
    };
    args = this.runListeners("match", args);
    path2 = args.path ? args.path : path2;
    let searchParams;
    if (!path2) {
      const currentPath = document.location.pathname + document.location.hash;
      if (this.has(currentPath)) {
        path2 = currentPath;
      } else {
        path2 = document.location.pathname;
      }
      searchParams = new URLSearchParams(document.location.search);
    } else {
      searchParams = searchParamsForPath(path2);
    }
    path2 = getPath(routePath(path2), this.baseURL);
    for (let route of this.routeInfo) {
      let params = route.pattern.match(path2);
      if (this.addMissingSlash && !params) {
        if (path2 && path2[path2.length - 1] != "/") {
          const pathWithSlash = path2 + "/";
          params = route.pattern.match(pathWithSlash);
          if (params) {
            path2 = pathWithSlash;
            history.replaceState({}, "", getURL(path2, this.baseURL));
          }
        }
      }
      if (params) {
        Object.assign(params, options);
        args.route = route;
        args.params = params;
        args = this.runListeners("call", args);
        params = args.params ? args.params : params;
        args.searchParams = searchParams;
        args.result = callRouteAction(this.app, route, params, searchParams);
        this.runListeners("finish", args);
        return args.result;
      }
    }
    return false;
  }
  runListeners(action, params) {
    if (!this.listeners[action] || !Object.keys(this.listeners[action])) {
      return;
    }
    Object.keys(this.listeners[action]).forEach((route) => {
      const pattern = compileRoutePattern(route);
      if (pattern.match(routePath(params.path))) {
        var result;
        for (let callback of this.listeners[action][route]) {
          result = callback.call(this.app, params);
          if (result) {
            params = result;
          }
        }
      }
    });
    return params;
  }
  handleEvents() {
    this.removeEvents();
    const popstateHandler = () => {
      this.match();
    };
    const clickHandler = (evt) => {
      if (evt.ctrlKey) {
        return;
      }
      if (evt.which != 1) {
        return;
      }
      var link = evt.target;
      while (link && link.tagName != "A") {
        link = link.parentElement;
      }
      if (link && link.pathname && link.hostname == globalThis.location.hostname && !link.link && !link.dataset.simplyCommand) {
        let check = [
          { match: link.hash, goto: link.hash },
          { match: link.pathname + link.hash, goto: link.pathname + link.search + link.hash },
          { match: link.pathname, goto: link.pathname + link.search }
        ];
        let target;
        do {
          target = check.shift();
          target.match = getPath(target.match, this.baseURL);
        } while (check.length && !this.has(target.match));
        if (this.has(target.match)) {
          let params = this.runListeners("goto", { path: target.goto });
          if (params.path) {
            const followLink = this.goto(params.path);
            if (!followLink || this.options.hijackLinks && followLink !== false) {
              evt.preventDefault();
              return false;
            }
          }
        }
      }
    };
    globalThis.addEventListener("popstate", popstateHandler);
    this.app.container.addEventListener("click", clickHandler);
    this.eventHandlers = {
      container: this.app.container,
      popstateHandler,
      clickHandler
    };
  }
  removeEvents() {
    if (!this.eventHandlers) {
      return;
    }
    globalThis.removeEventListener("popstate", this.eventHandlers.popstateHandler);
    this.eventHandlers.container.removeEventListener("click", this.eventHandlers.clickHandler);
    this.eventHandlers = void 0;
  }
  destroy() {
    this.removeEvents();
  }
  goto(path2) {
    history.pushState({}, "", getURL(path2, this.baseURL));
    return this.match(path2);
  }
  has(path2) {
    path2 = getPath(routePath(path2), this.baseURL);
    for (let route of this.routeInfo) {
      if (route.pattern.match(path2)) {
        return true;
      }
    }
    return false;
  }
  addListener(action, route, callback) {
    if (["goto", "match", "call", "finish"].indexOf(action) == -1) {
      throw new TypeError(`simplyflow/route: unknown listener type "${action}"`);
    }
    if (!this.listeners[action][route]) {
      this.listeners[action][route] = [];
    }
    this.listeners[action][route].push(callback);
  }
  removeListener(action, route, callback) {
    if (["goto", "match", "call", "finish"].indexOf(action) == -1) {
      throw new TypeError(`simplyflow/route: unknown listener type "${action}"`);
    }
    if (!this.listeners[action][route]) {
      return;
    }
    this.listeners[action][route] = this.listeners[action][route].filter((listener) => {
      return listener != callback;
    });
  }
  init(options) {
    if (options.baseURL) {
      this.baseURL = options.baseURL;
    }
  }
};
function callRouteAction(app2, route, params, searchParams) {
  if (typeof route.action === "function") {
    return route.action.call(app2, params, searchParams);
  }
  if (typeof route.action === "string") {
    const action = app2.actions?.[route.action];
    if (typeof action === "function") {
      return action.call(app2, routeActionParams(route, params, searchParams));
    }
    throw unknownRouteActionError(route, app2.actions);
  }
  throw new TypeError(`simplyflow/route: route "${route.path}" must use a function or action name`);
}
var warnedRouteQueryConflicts = /* @__PURE__ */ new Set();
function routeActionParams(route, params, searchParams) {
  const query = queryParams(searchParams);
  for (const key of Object.keys(query)) {
    if (Object.hasOwn(params, key)) {
      warnRouteQueryConflict(route, key);
    }
  }
  return Object.assign(query, params);
}
function queryParams(searchParams) {
  const params = {};
  for (const [key, value] of searchParams.entries()) {
    if (!Object.hasOwn(params, key)) {
      params[key] = value;
    } else if (Array.isArray(params[key])) {
      params[key].push(value);
    } else {
      params[key] = [params[key], value];
    }
  }
  return params;
}
function warnRouteQueryConflict(route, key) {
  const warningKey = `${route.path}\0${key}`;
  if (warnedRouteQueryConflicts.has(warningKey)) {
    return;
  }
  warnedRouteQueryConflicts.add(warningKey);
  console.warn(`simplyflow/route: query parameter "${key}" was ignored because route "${route.path}" already provides a route parameter with that name.`);
}
function unknownRouteActionError(route, actions2) {
  const suggestion = closest(route.action, Object.keys(actions2 || {}));
  const hint = suggestion ? ` Did you mean "${suggestion}"?` : "";
  return new TypeError(`simplyflow/route: route "${route.path}" uses unknown action "${route.action}".${hint}`);
}
function searchParamsForPath(path2) {
  const index = typeof path2 === "string" ? path2.indexOf("?") : -1;
  if (index === -1) {
    return new URLSearchParams();
  }
  const hashIndex = path2.indexOf("#", index);
  const search = hashIndex === -1 ? path2.substring(index) : path2.substring(index, hashIndex);
  return new URLSearchParams(search);
}
function routePath(path2) {
  const index = typeof path2 === "string" ? path2.indexOf("?") : -1;
  if (index === -1) {
    return path2;
  }
  const hashIndex = path2.indexOf("#", index);
  if (hashIndex === -1) {
    return path2.substring(0, index);
  }
  return path2.substring(0, index) + path2.substring(hashIndex);
}
function getPath(path2, baseURL = "/") {
  if (path2.substring(0, baseURL.length) == baseURL || baseURL[baseURL.length - 1] == "/" && path2.length == baseURL.length - 1 && path2 == baseURL.substring(0, path2.length)) {
    path2 = path2.substring(baseURL.length);
  }
  if (path2[0] != "/") {
    path2 = "/" + path2;
  }
  return path2;
}
function getURL(path2, baseURL) {
  path2 = getPath(path2, baseURL);
  if (baseURL[baseURL.length - 1] === "/" && path2[0] === "/") {
    path2 = path2.substring(1);
  }
  if (path2[0] == "#") {
    return path2;
  }
  return baseURL + path2;
}
function compileRoutePattern(path2, exact = false) {
  const params = [];
  const regexp = routeRegexp(path2, exact, params);
  return {
    path: path2,
    params,
    regexp,
    match(value) {
      const matches = regexp.exec(value);
      if (!matches) {
        return null;
      }
      const result = {};
      params.forEach((name, i) => {
        result[name] = matches[i + 1];
      });
      return result;
    }
  };
}
function routeRegexp(route, exact = false, params = []) {
  if (route.includes(":*")) {
    throw new TypeError(`simplyflow/route: route "${route}" uses the old wildcard syntax ":*". Use a named wildcard like ":path*" instead.`);
  }
  const prefix = route[0] === "#" ? "" : "^";
  const suffix = exact ? "$" : "";
  return new RegExp(prefix + routeRegexpSource(route, params) + suffix);
}
function routeRegexpSource(route, params) {
  let source = "";
  let index = 0;
  while (index < route.length) {
    if (route[index] === ":") {
      const match = /^:([A-Za-z_][A-Za-z0-9_]*)(\*)?/.exec(route.substring(index));
      if (!match) {
        throw new TypeError(`simplyflow/route: invalid route parameter in "${route}"`);
      }
      params.push(match[1]);
      source += match[2] ? "(.*)" : "([^/]+)";
      index += match[0].length;
      continue;
    }
    if (route[index] === "*") {
      source += ".*";
      index++;
      continue;
    }
    source += escapeRegexp(route[index]);
    index++;
  }
  return source;
}
function escapeRegexp(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
function parseRoutes(routes2, routeInfo, exact = false) {
  const paths = Object.keys(routes2);
  for (let path2 of paths) {
    routeInfo.push({
      path: path2,
      pattern: compileRoutePattern(path2, exact),
      action: routes2[path2]
    });
  }
  return routeInfo;
}

// ../simplyflow/packages/app/src/path.mjs
var path = {
  get(dataset, pointer) {
    if (typeof pointer !== "string") {
      return pointer;
    }
    if (!pointer) {
      return dataset;
    }
    return pointer.split(".").reduce(function(acc, name) {
      if (acc == null) {
        return null;
      }
      if (!Reflect.has(Object(acc), name)) {
        return null;
      }
      return acc[name];
    }, dataset);
  },
  set: function(dataset, pointer, value) {
    const parent = path.get(dataset, path.parent(pointer));
    if (parent == null) {
      throw new TypeError(`simplyflow/path: cannot set "${pointer}" because its parent path does not exist`);
    }
    parent[path.pop(pointer)] = value;
  },
  pop: function(pointer) {
    return pointer.split(".").pop();
  },
  push: function(pointer, name) {
    return (pointer ? pointer + "." : "") + name;
  },
  parent: function(pointer) {
    const names = pointer.split(".");
    names.pop();
    return names.join(".");
  },
  parents: function(dataset, pointer) {
    let result = [];
    while (pointer) {
      pointer = path.parent(pointer);
      result.unshift(pointer);
    }
    return result;
  }
};
var path_default = path;

// ../simplyflow/packages/app/src/command.mjs
var commandState = /* @__PURE__ */ new WeakMap();
var COMMAND_OPTIONS = [
  "commands",
  "handlers",
  "app",
  "container"
];
var SimplyCommands = class {
  constructor(options = {}) {
    if (!options.app) {
      options.app = {};
    }
    if (!options.app.container) {
      options.app.container = document.body;
    }
    this.app = options.app;
    this.$handlers = options.handlers || defaultHandlers;
    if (options.commands) {
      Object.assign(this, options.commands);
    }
    const commandHandler = (evt) => {
      const command = getCommand(evt, this.$handlers, this.app);
      if (!command) {
        return;
      }
      if (!this[command.name]) {
        warnUnknownCommand(this, command.name, command.source);
        return;
      }
      const shouldContinue = this[command.name].call(options.app, command.source, command.value, evt);
      if (shouldContinue !== true) {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
      }
    };
    const container = options.app.container;
    container.addEventListener("click", commandHandler);
    container.addEventListener("submit", commandHandler);
    container.addEventListener("change", commandHandler);
    container.addEventListener("input", commandHandler);
    commandState.set(this, { container, commandHandler });
  }
  call(command, el, value, event) {
    if (!this[command]) {
      warnUnknownCommand(this, command, el);
      return;
    }
    return this[command].call(this.app, el, value, event);
  }
  appendHandler(handler) {
    this.$handlers.push(handler);
  }
  prependHandler(handler) {
    this.$handlers.unshift(handler);
  }
};
function commands(options = {}) {
  return new SimplyCommands(options);
}
function destroyCommands(commandApi) {
  const state = commandState.get(commandApi);
  if (!state) {
    return;
  }
  state.container.removeEventListener("click", state.commandHandler);
  state.container.removeEventListener("submit", state.commandHandler);
  state.container.removeEventListener("change", state.commandHandler);
  state.container.removeEventListener("input", state.commandHandler);
  commandState.delete(commandApi);
}
function getCommand(evt, handlers, app2) {
  var el = evt.target.closest("[data-simply-command]");
  if (el) {
    for (let handler of handlers) {
      if (el.matches(handler.match)) {
        if (handler.check(el, evt)) {
          return {
            name: el.dataset.simplyCommand,
            source: el,
            value: handler.get(el, app2)
          };
        }
        return null;
      }
    }
  }
  return null;
}
function getConfiguredCommandValue(el, app2) {
  const pathAttribute = "simplyValuePath";
  if (Object.hasOwn(el.dataset, pathAttribute)) {
    return {
      found: true,
      value: path_default.get(app2?.data, el.dataset[pathAttribute])
    };
  }
  if (Object.hasOwn(el.dataset, "simplyValue")) {
    return { found: true, value: el.dataset.simplyValue };
  }
  return { found: false, value: void 0 };
}
var defaultHandlers = [
  {
    match: "input,select,textarea",
    get: function(el, app2) {
      const configuredValue = getConfiguredCommandValue(el, app2);
      if (configuredValue.found) {
        return configuredValue.value;
      }
      if (el.tagName === "SELECT" && el.multiple) {
        let values5 = [];
        for (let option of el.options) {
          if (option.selected) {
            values5.push(option.value);
          }
        }
        return values5;
      }
      return el.value;
    },
    check: function(el, evt) {
      return evt.type == "change" || el.dataset.simplyImmediate && evt.type == "input";
    }
  },
  {
    match: "a,button",
    get: function(el, app2) {
      const configuredValue = getConfiguredCommandValue(el, app2);
      if (configuredValue.found) {
        return configuredValue.value;
      }
      return el.href || el.value;
    },
    check: function(el, evt) {
      return evt.type == "click" && evt.ctrlKey == false && evt.button == 0;
    }
  },
  {
    match: "form",
    get: function(el) {
      let data = {};
      for (let input2 of Array.from(el.elements)) {
        if (input2.tagName == "INPUT" && (input2.type == "checkbox" || input2.type == "radio")) {
          if (!input2.checked) {
            return;
          }
        }
        if (data[input2.name] && !Array.isArray(data[input2.name])) {
          data[input2.name] = [data[input2.name]];
        }
        if (Array.isArray(data[input2.name])) {
          data[input2.name].push(input2.value);
        } else {
          data[input2.name] = input2.value;
        }
      }
      return data;
    },
    check: function(el, evt) {
      return evt.type == "submit";
    }
  },
  {
    match: "*",
    get: function(el, app2) {
      return getConfiguredCommandValue(el, app2).value;
    },
    check: function(el, evt) {
      return evt.type == "click" && evt.ctrlKey == false && evt.button == 0;
    }
  }
];
var unknownCommandWarnings = /* @__PURE__ */ new WeakMap();
function warnUnknownCommand(commands2, command, source) {
  let warned = unknownCommandWarnings.get(commands2);
  if (!warned) {
    warned = /* @__PURE__ */ new Set();
    unknownCommandWarnings.set(commands2, warned);
  }
  if (warned.has(command)) {
    return;
  }
  warned.add(command);
  const suggestion = closest(command, commandNames(commands2));
  const suffix = suggestion ? `. Did you mean "${suggestion}"?` : "";
  if (source) {
    console.warn(`simplyflow/command: unknown command "${command}"${suffix}`, { cause: source });
  } else {
    console.warn(`simplyflow/command: unknown command "${command}"${suffix}`);
  }
}
function commandNames(commands2) {
  return Object.keys(commands2).filter((command) => {
    return !command.startsWith("$") && !COMMAND_OPTIONS.includes(command) && typeof commands2[command] === "function";
  });
}

// ../simplyflow/packages/app/src/action.mjs
var warnedUnknownActions = /* @__PURE__ */ new WeakMap();
function actions(options) {
  if (options.app) {
    const functionHandler = {
      apply(target, thisArg, argumentsList) {
        try {
          const result = target(...argumentsList);
          if (result instanceof Promise) {
            return result.catch((err) => {
              return options.app.onError.call(this, err, target);
            });
          }
          return result;
        } catch (err) {
          return options.app.onError.call(this, err, target);
        }
      }
    };
    const actionHandler = {
      get(target, property) {
        if (!Object.hasOwn(target, property)) {
          warnUnknownAction(target, property);
          return void 0;
        }
        if (options.app.onError) {
          return new Proxy(target[property].bind(options.app), functionHandler);
        } else {
          return target[property].bind(options.app);
        }
      }
    };
    return new Proxy(options.actions, actionHandler);
  } else {
    return options;
  }
}
function warnUnknownAction(actions2, property) {
  if (typeof property !== "string") {
    return;
  }
  let warned = warnedUnknownActions.get(actions2);
  if (!warned) {
    warned = /* @__PURE__ */ new Set();
    warnedUnknownActions.set(actions2, warned);
  }
  if (warned.has(property)) {
    return;
  }
  warned.add(property);
  const suggestion = closest(property, Object.keys(actions2));
  const suffix = suggestion ? `. Did you mean "${suggestion}"?` : "";
  console.warn(`simplyflow/action: unknown action "${property}"${suffix}`);
}

// ../simplyflow/packages/app/src/shortcut.mjs
var shortcutState = /* @__PURE__ */ new WeakMap();
var accesskeyState = /* @__PURE__ */ new WeakMap();
var KEY = Object.freeze({
  Compose: 229,
  Control: 17,
  Meta: 224,
  Alt: 18,
  Shift: 16
});
var SimplyShortcuts = class {
  constructor(options = {}) {
    if (!options.app) {
      options.app = {};
    }
    if (!options.app.container) {
      options.app.container = document.body;
    }
    Object.assign(this, options.shortcuts);
    const keyHandler = (e) => {
      let shortcutScopes = [];
      let shortcutElement = e.target.closest("[data-simply-shortcuts]");
      while (shortcutElement) {
        shortcutScopes.push(shortcutElement.dataset.simplyShortcuts);
        shortcutElement = shortcutElement.parentNode.closest("[data-simply-shortcuts]");
      }
      if (shortcutScopes[shortcutScopes.length - 1] != "default") {
        shortcutScopes.push("default");
      }
      let shortcutScope;
      let separators = ["+", "-"];
      for (let separator of separators) {
        const keyString = getKeyString(e, separator);
        for (let i in shortcutScopes) {
          shortcutScope = shortcutScopes[i];
          if (this[shortcutScope] && typeof this[shortcutScope][keyString] == "function") {
            let _continue = this[shortcutScope][keyString].call(options.app, e);
            if (!_continue) {
              e.preventDefault();
              return;
            }
          }
          if (typeof this[shortcutScope + "." + keyString] == "function") {
            let _continue = this[shortcutScope + "." + keyString].call(options.app, e);
            if (!_continue) {
              e.preventDefault();
              return;
            }
          }
          if (typeof this[keyString] == "function") {
            let _continue = this[keyString].call(options.app, e);
            if (!_continue) {
              e.preventDefault();
              return;
            }
          }
        }
      }
    };
    const container = options.app.container;
    container.addEventListener("keydown", keyHandler);
    shortcutState.set(this, { container, keyHandler });
  }
};
function getKeyString(e, separator = "+") {
  if (e.isComposing || e.keyCode === KEY.Compose) {
    return;
  }
  if (e.defaultPrevented) {
    return;
  }
  if (!e.target) {
    return;
  }
  let keyCombination = [];
  if (e.ctrlKey && e.keyCode != KEY.Control) {
    keyCombination.push("Control");
  }
  if (e.metaKey && e.keyCode != KEY.Meta) {
    keyCombination.push("Meta");
  }
  if (e.altKey && e.keyCode != KEY.Alt) {
    keyCombination.push("Alt");
  }
  if (e.shiftKey && e.keyCode != KEY.Shift) {
    keyCombination.push("Shift");
  }
  keyCombination.push(e.key.toLowerCase());
  return keyCombination.join(separator);
}
function shortcuts(options = {}) {
  return new SimplyShortcuts(options);
}
function destroyShortcuts(shortcutApi) {
  const state = shortcutState.get(shortcutApi);
  if (!state) {
    return;
  }
  state.container.removeEventListener("keydown", state.keyHandler);
  shortcutState.delete(shortcutApi);
}
function accesskeys(options = {}) {
  const container = options.container || options.app?.container || document.body;
  const keyHandler = (e) => {
    const separators = ["+", "-"];
    for (const separator of separators) {
      const keyString = getKeyString(e, separator);
      const selector = "[data-simply-accesskey='" + keyString + "']";
      const targets = container.querySelectorAll(selector);
      if (targets.length) {
        targets.forEach(function(target) {
          target.click();
        });
      }
    }
  };
  container.addEventListener("keydown", keyHandler);
  const controller = {};
  accesskeyState.set(controller, { container, keyHandler });
  return controller;
}
function destroyAccesskeys(accesskeyApi) {
  const state = accesskeyState.get(accesskeyApi);
  if (!state) {
    return;
  }
  state.container.removeEventListener("keydown", state.keyHandler);
  accesskeyState.delete(accesskeyApi);
}

// ../simplyflow/packages/app/src/behavior.mjs
var BEHAVIOR_SELECTOR = "[data-simply-behavior]";
var SimplyBehaviors = class {
  constructor(options = {}) {
    this.app = options.app;
    this.container = options.container || document.body;
    this.behaviors = options.behaviors || {};
    this.active = /* @__PURE__ */ new Set();
    this.cleanups = /* @__PURE__ */ new WeakMap();
    this.unknown = /* @__PURE__ */ new Set();
    this.observer = new MutationObserver((changes) => this.handleChanges(changes));
    this.observer.observe(this.container, {
      subtree: true,
      childList: true
    });
    for (const node of behaviorNodes(this.container)) {
      this.start(node);
    }
  }
  start(node) {
    if (this.active.has(node)) {
      return;
    }
    const name = node?.dataset?.simplyBehavior;
    const behavior = this.behaviors[name];
    if (!name || typeof behavior !== "function") {
      this.warnUnknown(name, node);
      return;
    }
    this.active.add(node);
    const cleanup = behavior.call(this.app || node, node);
    if (typeof cleanup === "function") {
      this.cleanups.set(node, cleanup);
    } else if (typeof cleanup !== "undefined") {
      console.warn("simplyflow/behavior: behavior may only return a cleanup function", { cause: cleanup });
    }
  }
  stop(node) {
    if (!this.active.has(node)) {
      return;
    }
    this.active.delete(node);
    const cleanup = this.cleanups.get(node);
    this.cleanups.delete(node);
    if (cleanup) {
      cleanup.call(this.app || node, node);
    }
  }
  handleChanges(changes) {
    const added = [];
    for (const change of changes) {
      if (change.type !== "childList") {
        continue;
      }
      for (const node of change.removedNodes) {
        for (const behaviorNode of behaviorNodes(node)) {
          this.stop(behaviorNode);
        }
      }
      for (const node of change.addedNodes) {
        added.push(...behaviorNodes(node));
      }
    }
    for (const node of added) {
      this.start(node);
    }
  }
  warnUnknown(name, node) {
    if (!name || this.unknown.has(name)) {
      return;
    }
    this.unknown.add(name);
    const suggestion = closest(name, Object.keys(this.behaviors));
    const suffix = suggestion ? `. Did you mean "${suggestion}"?` : "";
    console.warn(`simplyflow/behavior: unknown behavior "${name}"${suffix}`, { cause: node });
  }
  destroy() {
    this.observer.disconnect();
    for (const node of Array.from(this.active)) {
      this.stop(node);
    }
  }
};
function behaviors(options = {}) {
  return new SimplyBehaviors(options);
}
function behaviorNodes(root) {
  if (!root?.querySelectorAll) {
    return [];
  }
  const nodes = Array.from(root.querySelectorAll(BEHAVIOR_SELECTOR));
  if (root.matches?.(BEHAVIOR_SELECTOR)) {
    nodes.unshift(root);
  }
  return nodes;
}

// ../simplyflow/packages/app/src/include.mjs
function throttle(callbackFunction, intervalTime) {
  let eventId = 0;
  return function throttledCallback(...params) {
    if (eventId) {
      return;
    }
    eventId = globalThis.setTimeout(() => {
      eventId = 0;
      callbackFunction.apply(this, params);
    }, intervalTime);
  };
}
var runWhenIdle = (() => {
  if (globalThis.requestIdleCallback) {
    return (callback) => {
      globalThis.requestIdleCallback(callback, { timeout: 500 });
    };
  }
  return globalThis.requestAnimationFrame || ((callback) => globalThis.setTimeout(callback, 0));
})();
function rebaseHref(relative, base, cacheBuster) {
  const url3 = new URL(relative, base);
  if (cacheBuster) {
    url3.searchParams.set("cb", cacheBuster);
  }
  return url3.href;
}
function cloneScript(script, base, cacheBuster) {
  const clone2 = globalThis.document.createElement("script");
  for (const attr of script.attributes) {
    clone2.setAttribute(attr.name, attr.value);
  }
  clone2.removeAttribute("data-simply-location");
  if (clone2.hasAttribute("src")) {
    clone2.src = rebaseHref(clone2.getAttribute("src"), base, cacheBuster);
  } else {
    clone2.textContent = script.textContent;
  }
  return clone2;
}
function insertScript(script, placeholder) {
  placeholder.parentNode.insertBefore(script, placeholder);
  placeholder.parentNode.removeChild(placeholder);
}
function shouldWaitForScript(script) {
  return script.hasAttribute("src") && !script.hasAttribute("async");
}
function insertAndWaitForScript(script, placeholder) {
  return new Promise((resolve) => {
    const done = () => {
      script.removeEventListener("load", done);
      script.removeEventListener("error", done);
      resolve();
    };
    script.addEventListener("load", done);
    script.addEventListener("error", done);
    insertScript(script, placeholder);
  });
}
function findIncludeLinks(container) {
  const selector = 'link[rel="simply-include"],link[rel="simply-include-once"]';
  const links = Array.from(container.querySelectorAll(selector));
  if (container.matches?.(selector)) {
    links.unshift(container);
  }
  return links;
}
var SimplyIncludes = class {
  constructor(options = {}) {
    this.container = options.container || globalThis.document;
    this.cacheBuster = options.cacheBuster ?? defaultCacheBuster;
    this.included = /* @__PURE__ */ Object.create(null);
    this.scriptLocations = [];
    this.destroyed = false;
    this.handleChanges = throttle(() => {
      runWhenIdle(() => {
        if (!this.destroyed) {
          this.includeLinks(findIncludeLinks(this.container));
        }
      });
    }, 10);
    if (options.observe !== false) {
      this.observer = new MutationObserver(this.handleChanges);
      this.observer.observe(this.container, {
        subtree: true,
        childList: true
      });
      this.handleChanges();
    }
  }
  async scripts(scripts, base) {
    const arr = scripts.slice();
    for (const script of arr) {
      if (this.destroyed) {
        return;
      }
      const clone2 = cloneScript(script, base, this.cacheBuster);
      const node = this.scriptLocations[script.dataset.simplyLocation];
      if (!node?.parentNode) {
        continue;
      }
      const waitForLoad = shouldWaitForScript(clone2);
      if (waitForLoad) {
        clone2.async = false;
        await insertAndWaitForScript(clone2, node);
      } else {
        insertScript(clone2, node);
      }
    }
  }
  html(html2, link) {
    const fragment = globalThis.document.createRange().createContextualFragment(html2);
    const stylesheets = fragment.querySelectorAll('link[rel="stylesheet"],style');
    for (const stylesheet of stylesheets) {
      const href = stylesheet.getAttribute("href");
      if (href) {
        stylesheet.href = rebaseHref(href, link.href, this.cacheBuster);
      }
      globalThis.document.head.appendChild(stylesheet);
    }
    const scriptsFragment = globalThis.document.createDocumentFragment();
    const scripts = fragment.querySelectorAll("script");
    if (scripts.length) {
      for (const script of scripts) {
        const placeholder = globalThis.document.createComment(script.src || "inline script");
        script.parentNode.insertBefore(placeholder, script);
        script.dataset.simplyLocation = this.scriptLocations.length;
        this.scriptLocations.push(placeholder);
        scriptsFragment.appendChild(script);
      }
      globalThis.setTimeout(() => {
        this.scripts(Array.from(scriptsFragment.children), link ? link.href : globalThis.location.href);
      }, 10);
    }
    link.parentNode.insertBefore(fragment, link);
  }
  async includeLinks(links) {
    const remainingLinks = links.reduce((remainder, link) => {
      if (link.rel === "simply-include-once" && this.included[link.href]) {
        link.parentNode.removeChild(link);
      } else {
        this.included[link.href] = true;
        link.rel = "simply-include-loading";
        remainder.push(link);
      }
      return remainder;
    }, []);
    for (const link of remainingLinks) {
      if (this.destroyed || !link.href) {
        continue;
      }
      try {
        const response3 = await fetch(link.href);
        if (!response3.ok) {
          console.warn(`simplyflow/include: failed to load "${link.href}" (${response3.status})`);
          link.rel = "simply-include-error";
          continue;
        }
        const html2 = await response3.text();
        if (this.destroyed || !link.parentNode) {
          continue;
        }
        this.html(html2, link);
        link.parentNode?.removeChild(link);
      } catch (error4) {
        console.warn(`simplyflow/include: failed to load "${link.href}"`, { cause: error4 });
        link.rel = "simply-include-error";
      }
    }
  }
  destroy() {
    this.destroyed = true;
    this.observer?.disconnect();
    this.observer = void 0;
  }
};
function includes(options = {}) {
  return new SimplyIncludes(options);
}
var defaultCacheBuster = null;
var defaultInclude = () => new SimplyIncludes({
  container: globalThis.document,
  cacheBuster: defaultCacheBuster,
  observe: false
});
var include = {
  get cacheBuster() {
    return defaultCacheBuster;
  },
  set cacheBuster(value) {
    defaultCacheBuster = value;
  },
  scripts: (scripts, base) => defaultInclude().scripts(scripts, base),
  html: (html2, link) => defaultInclude().html(html2, link),
  links: (links) => defaultInclude().includeLinks(Array.from(links))
};

// ../simplyflow/packages/app/src/index.mjs
var APP_OPTIONS = [
  "container",
  "data",
  "templates",
  "styles",
  "start",
  "onError",
  "components",
  "behaviors",
  "baseURL",
  "commands",
  "shortcuts",
  "routes",
  "actions",
  "transformers"
];
var SimplyApp = class {
  constructor(options = {}) {
    if (options.components) {
      const mergedOptions = {};
      mergeComponents(mergedOptions, options.components);
      mergeOptions(mergedOptions, options);
      options = mergedOptions;
    }
    this.container = options.container || document.body;
    this.destroyed = false;
    this.data = signal(options.data || {});
    this.start = options.start;
    this.onError = options.onError;
    this.components = options.components;
    this.baseURL = options.baseURL;
    this.transformers = options.transformers;
    installTemplates(this.container, options.templates);
    installStyles(this.container, options.styles);
    for (const key of Object.keys(options)) {
      switch (key) {
        case "container":
        case "data":
        case "templates":
        case "styles":
        case "start":
        case "onError":
        case "components":
        case "baseURL":
        case "transformers":
          break;
        case "commands":
          this.commands = commands({ app: this, container: this.container, commands: options.commands });
          break;
        case "shortcuts":
          this.shortcuts = shortcuts({ app: this, shortcuts: options.shortcuts });
          break;
        case "behaviors":
          this.behaviors = behaviors({ app: this, container: this.container, behaviors: options.behaviors });
          break;
        case "routes":
          this.routes = routes({ app: this, routes: options.routes });
          break;
        case "actions":
          this.actions = actions({ app: this, actions: options.actions });
          break;
        case "prototype":
        case "__proto__":
          break;
        default:
          warnLikelyOptionTypo(key);
          this[key] = options[key];
          break;
      }
    }
    this.binding = bind({
      root: this.data,
      container: this.container,
      attribute: "data-simply",
      transformers: this.transformers
    });
    this.includes = includes({ container: this.container });
    this.accesskeys = accesskeys({ app: this, container: this.container });
  }
  get app() {
    return this;
  }
  destroy() {
    this.destroyed = true;
    if (this.binding) {
      this.binding.destroy();
      this.binding = void 0;
    }
    if (this.commands) {
      destroyCommands(this.commands);
    }
    if (this.shortcuts) {
      destroyShortcuts(this.shortcuts);
    }
    if (this.accesskeys) {
      destroyAccesskeys(this.accesskeys);
      this.accesskeys = void 0;
    }
    if (this.routes) {
      this.routes.destroy();
      this.routes = void 0;
    }
    if (this.behaviors) {
      this.behaviors.destroy();
      this.behaviors = void 0;
    }
    if (this.includes) {
      this.includes.destroy();
      this.includes = void 0;
    }
  }
};
function installTemplates(container, templates) {
  if (!templates) {
    return;
  }
  for (const name of Object.keys(templates)) {
    const element2 = document.createElement("div");
    element2.innerHTML = templates[name];
    let template = container.querySelector("template#" + name);
    if (!template) {
      template = document.createElement("template");
      template.id = name;
      template.content.append(...element2.children);
      container.appendChild(template);
    } else {
      template.content.replaceChildren(...element2.children);
    }
  }
}
function installStyles(container, styles) {
  if (!styles) {
    return;
  }
  for (const name of Object.keys(styles)) {
    let style = container.querySelector("style#" + name + ".css");
    if (!style) {
      style = document.createElement("style");
      style.id = name + ".css";
      container.appendChild(style);
    }
    style.innerHTML = styles[name];
  }
}
function warnLikelyOptionTypo(key) {
  const suggestion = closest(key, APP_OPTIONS);
  if (suggestion) {
    console.warn(`simplyflow/app: unknown option "${key}". Did you mean "${suggestion}"? The option was still added to the app as "app.${key}".`);
  }
}
function initRoutes(app2) {
  if (app2.destroyed) {
    return;
  }
  if (app2.routes) {
    if (app2.baseURL) {
      app2.routes.init({ baseURL: app2.baseURL });
    }
    app2.routes.handleEvents();
    globalThis.setTimeout(() => {
      if (app2.destroyed || !app2.routes) {
        return;
      }
      if (app2.routes.has(globalThis.location?.hash)) {
        app2.routes.match(globalThis.location.hash);
      } else {
        app2.routes.match(globalThis.location?.pathname + globalThis.location?.hash);
      }
    });
  }
}
function handleAppError(app2, error4, context) {
  if (app2.onError) {
    return app2.onError.call(app2, error4, context);
  }
  throw error4;
}
function app(options = {}) {
  const app2 = new SimplyApp(options);
  if (!app2.start) {
    initRoutes(app2);
    return app2;
  }
  try {
    const result = app2.start.call(app2);
    if (result instanceof Promise) {
      result.then(() => initRoutes(app2)).catch((error4) => handleAppError(app2, error4, app2.start));
    } else {
      initRoutes(app2);
    }
  } catch (error4) {
    handleAppError(app2, error4, app2.start);
  }
  return app2;
}
function mergeOptions(options, otherOptions) {
  for (const key of Object.keys(otherOptions)) {
    switch (typeof otherOptions[key]) {
      case "object":
        if (!otherOptions[key]) {
          continue;
        }
        if (!options[key]) {
          options[key] = otherOptions[key];
        } else {
          mergeOptions(options[key], otherOptions[key]);
        }
        break;
      default:
        options[key] = otherOptions[key];
    }
  }
}
function mergeComponents(options, components) {
  for (const name of Object.keys(components)) {
    const component = components[name];
    if (component.components) {
      mergeComponents(options, component.components);
    }
    if (!options.components) {
      options.components = {};
    }
    options.components[name] = component;
    for (const key of Object.keys(component)) {
      switch (key) {
        case "start":
        case "onError":
        // App lifecycle functions are app-level behavior, not merged component state.
        case "components":
          break;
        default:
          if (!options[key]) {
            options[key] = /* @__PURE__ */ Object.create(null);
          }
          mergeOptions(options[key], component[key]);
          break;
      }
    }
  }
}

// ../simplyflow/packages/app/src/highlight.mjs
function html(strings, ...values5) {
  const outputArray = values5.map(
    (value, index) => `${strings[index]}${value}`
  );
  return outputArray.join("") + strings[strings.length - 1];
}
function css(strings, ...values5) {
  return html(strings, ...values5);
}

// ../simplyflow/packages/simplyflow/src/index.mjs
if (!globalThis.simply) {
  globalThis.simply = {};
}
globalThis.html = html;
globalThis.css = css;
var modelApi = Object.assign(model, {
  model,
  sort,
  paging,
  filter,
  columns,
  scroll
});
Object.assign(globalThis.simply, {
  app,
  bind,
  model: modelApi,
  state: src_exports,
  signal,
  effect,
  batch,
  clone,
  destroy,
  untracked,
  throttledEffect,
  clockEffect,
  createSignal,
  isSignal,
  raw,
  dom: dom_exports,
  behaviors,
  actions,
  commands,
  include,
  includes,
  shortcuts,
  path: path_default,
  routes
});
delete globalThis.simply.advanced;
var src_default = globalThis.simply;

// ../../poef/cobalt-note/packages/rich-text-note/dist/fragment.js
function getJoinOffsetAfterSeparator(first3, second, separator) {
  if (separator.length > 0) {
    return first3.text.length + separator.length;
  }
  if (first3.text.endsWith("\n")) {
    return first3.text.length;
  }
  if (second.text.startsWith("\n")) {
    return first3.text.length + 1;
  }
  return first3.text.length;
}
function getNextOrder(fragment) {
  if (fragment.annotations.length === 0) {
    return 1;
  }
  return Math.max(...fragment.annotations.map((annotation) => annotation.order)) + 1;
}
function addAnnotation(fragment, range, tag) {
  const [start, end] = range;
  if (end <= start) {
    return null;
  }
  const annotation = {
    range: [start, end],
    tag,
    order: getNextOrder(fragment)
  };
  fragment.annotations.push(annotation);
  return annotation;
}
function insertText(fragment, offset, text, options = {}) {
  if (text.length === 0) {
    return;
  }
  const normalizedOffset = clamp(offset, 0, fragment.text.length);
  const growAtEnd = options.growAtEnd ?? true;
  const delta = text.length;
  fragment.text = fragment.text.slice(0, normalizedOffset) + text + fragment.text.slice(normalizedOffset);
  for (const annotation of fragment.annotations) {
    let [start, end] = annotation.range;
    if (normalizedOffset <= start) {
      start += delta;
      end += delta;
    } else if (normalizedOffset < end || growAtEnd && normalizedOffset === end) {
      end += delta;
    }
    annotation.range = [start, end];
  }
}
function deleteRange(fragment, startOffset, endOffset) {
  const start = clamp(startOffset, 0, fragment.text.length);
  const end = clamp(endOffset, 0, fragment.text.length);
  if (end <= start) {
    return;
  }
  fragment.text = fragment.text.slice(0, start) + fragment.text.slice(end);
  fragment.annotations = mergeAdjacentMatchingAnnotations(fragment.annotations.map((annotation) => {
    const [annotationStart, annotationEnd] = annotation.range;
    return {
      ...annotation,
      range: [
        transformDeletedOffset(annotationStart, start, end),
        transformDeletedOffset(annotationEnd, start, end)
      ]
    };
  }).filter((annotation) => annotation.range[1] > annotation.range[0]));
}
function sliceFragment(fragment, startOffset, endOffset) {
  const start = clamp(startOffset, 0, fragment.text.length);
  const end = clamp(endOffset, 0, fragment.text.length);
  if (end <= start) {
    return {
      text: "",
      annotations: []
    };
  }
  return {
    text: fragment.text.slice(start, end),
    annotations: fragment.annotations.map((annotation) => {
      const annotationStart = Math.max(annotation.range[0], start);
      const annotationEnd = Math.min(annotation.range[1], end);
      if (annotationEnd <= annotationStart) {
        return null;
      }
      return {
        ...annotation,
        range: [
          annotationStart - start,
          annotationEnd - start
        ]
      };
    }).filter((annotation) => annotation !== null)
  };
}
function insertFragment(fragment, offset, inserted, options = {}) {
  const normalizedOffset = clamp(offset, 0, fragment.text.length);
  if (inserted.text.length === 0) {
    return;
  }
  const maxOrder = getNextOrder(fragment) - 1;
  insertText(fragment, normalizedOffset, inserted.text, options);
  const sortedAnnotations = [...inserted.annotations].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.range[0] !== b.range[0]) {
      return a.range[0] - b.range[0];
    }
    return a.range[1] - b.range[1];
  });
  for (let i = 0; i < sortedAnnotations.length; i++) {
    const annotation = sortedAnnotations[i];
    fragment.annotations.push({
      ...annotation,
      range: [
        annotation.range[0] + normalizedOffset,
        annotation.range[1] + normalizedOffset
      ],
      order: maxOrder + i + 1
    });
  }
  fragment.annotations = mergeAdjacentMatchingAnnotations(fragment.annotations);
}
function splitFragment(fragment, offset) {
  const splitOffset = clamp(offset, 0, fragment.text.length);
  const before = {
    text: fragment.text.slice(0, splitOffset),
    annotations: []
  };
  const after = {
    text: fragment.text.slice(splitOffset),
    annotations: []
  };
  for (const annotation of fragment.annotations) {
    const [start, end] = annotation.range;
    const beforeStart = start;
    const beforeEnd = Math.min(end, splitOffset);
    if (beforeEnd > beforeStart) {
      before.annotations.push({
        ...annotation,
        range: [beforeStart, beforeEnd]
      });
    }
    const afterStart = Math.max(start, splitOffset) - splitOffset;
    const afterEnd = end - splitOffset;
    if (afterEnd > afterStart) {
      after.annotations.push({
        ...annotation,
        range: [afterStart, afterEnd]
      });
    }
  }
  return { before, after };
}
function concatFragments(first3, second, separator = "") {
  const joinOffset = getJoinOffsetAfterSeparator(first3, second, separator);
  const secondOffset = first3.text.length + separator.length;
  return {
    fragment: {
      text: first3.text + separator + second.text,
      annotations: mergeAdjacentMatchingAnnotations([
        ...first3.annotations.map((annotation) => ({
          ...annotation,
          range: [...annotation.range]
        })),
        ...second.annotations.map((annotation) => ({
          ...annotation,
          range: [
            annotation.range[0] + secondOffset,
            annotation.range[1] + secondOffset
          ]
        }))
      ])
    },
    joinOffset
  };
}
function joinFragments(first3, second) {
  return concatFragments(first3, second, needsJoinSeparator(first3, second) ? "\n" : "");
}
function mergeAdjacentMatchingAnnotations(annotations) {
  const sorted = [...annotations].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    if (a.tag !== b.tag) {
      return a.tag.localeCompare(b.tag);
    }
    if (a.range[0] !== b.range[0]) {
      return a.range[0] - b.range[0];
    }
    return a.range[1] - b.range[1];
  });
  const merged = [];
  for (const annotation of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && previous.order === annotation.order && previous.tag === annotation.tag && previous.range[1] === annotation.range[0]) {
      previous.range = [
        previous.range[0],
        annotation.range[1]
      ];
    } else {
      merged.push({
        ...annotation,
        range: [...annotation.range]
      });
    }
  }
  return merged;
}
function needsJoinSeparator(first3, second) {
  if (first3.text.length === 0 || second.text.length === 0) {
    return false;
  }
  return !first3.text.endsWith("\n") && !second.text.startsWith("\n");
}
function transformDeletedOffset(offset, deleteStart, deleteEnd) {
  if (offset <= deleteStart) {
    return offset;
  }
  if (offset >= deleteEnd) {
    return offset - (deleteEnd - deleteStart);
  }
  return deleteStart;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/commands.js
var InsertTextCommand = class {
  offset;
  text;
  options;
  constructor(offset, text, options = {}) {
    this.offset = offset;
    this.text = text;
    this.options = options;
  }
  apply(fragment) {
    insertText(fragment, this.offset, this.text, this.options);
  }
};
var InsertFragmentCommand = class {
  offset;
  fragmentToInsert;
  options;
  constructor(offset, fragmentToInsert, options = {}) {
    this.offset = offset;
    this.fragmentToInsert = fragmentToInsert;
    this.options = options;
  }
  apply(fragment) {
    insertFragment(fragment, this.offset, this.fragmentToInsert, this.options);
  }
};
var DeleteRangeCommand = class {
  startOffset;
  endOffset;
  constructor(startOffset, endOffset) {
    this.startOffset = startOffset;
    this.endOffset = endOffset;
  }
  apply(fragment) {
    deleteRange(fragment, this.startOffset, this.endOffset);
  }
};
var AddAnnotationCommand = class {
  range;
  tag;
  constructor(range, tag) {
    this.range = range;
    this.tag = tag;
  }
  apply(fragment) {
    addAnnotation(fragment, this.range, this.tag);
  }
};
function applyCommands(fragment, commands2) {
  for (const command of commands2) {
    command.apply(fragment);
  }
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/registry.js
var AnnotationRegistry = class {
  definitions = /* @__PURE__ */ new Map();
  register(definition) {
    this.definitions.set(definition.name, definition);
  }
  get(name) {
    return this.definitions.get(name);
  }
  getAll() {
    return Array.from(this.definitions.values());
  }
  findByShortcut(event) {
    const key = shortcutFromKeyboardEvent(event);
    return this.getAll().find((definition) => definition.shortcut?.toLowerCase() === key);
  }
  findByTag(tag) {
    const trimmed = tag.trim();
    for (const definition of this.definitions.values()) {
      if (trimmed === definition.tag) {
        return {
          name: definition.name,
          enabled: true,
          tag: definition.tag,
          closeTag: createHtmlCloseTag(definition.tag),
          priority: definition.priority ?? 100
        };
      }
      if (trimmed === createInverseAnnotationTag(definition.tag)) {
        return {
          name: definition.name,
          enabled: false,
          priority: definition.priority ?? 100
        };
      }
    }
    return null;
  }
};
var defaultRegistry = new AnnotationRegistry();
defaultRegistry.register({
  name: "__selection",
  tag: '<span data-cobalt-selection="true">',
  priority: -100,
  supportsPending: false
});
defaultRegistry.register({
  name: "link",
  tag: "<a>",
  priority: 0,
  shortcut: "Ctrl+K",
  supportsPending: false
});
defaultRegistry.register({
  name: "underline",
  tag: "<u>",
  priority: 10,
  shortcut: "Ctrl+U",
  supportsPending: true
});
defaultRegistry.register({
  name: "em",
  tag: "<em>",
  priority: 20,
  shortcut: "Ctrl+I",
  supportsPending: true
});
defaultRegistry.register({
  name: "strong",
  tag: "<strong>",
  priority: 30,
  shortcut: "Ctrl+B",
  supportsPending: true
});
function parseAnnotationTag(tag, registry = defaultRegistry) {
  const trimmed = tag.trim();
  const registryMatch = registry.findByTag(trimmed);
  if (registryMatch) {
    return registryMatch;
  }
  if (isOpeningTag(trimmed, "a")) {
    return {
      name: "link",
      enabled: true,
      tag: trimmed,
      closeTag: createHtmlCloseTag(trimmed),
      priority: registry.get("link")?.priority ?? 0
    };
  }
  if (isClosingTag(trimmed, "a")) {
    return {
      name: "link",
      enabled: false,
      priority: registry.get("link")?.priority ?? 0
    };
  }
  if (isCobaltSelectionOpeningTag(trimmed)) {
    return {
      name: "__selection",
      enabled: true,
      tag: trimmed,
      closeTag: createHtmlCloseTag(trimmed),
      priority: registry.get("__selection")?.priority ?? -100
    };
  }
  return null;
}
function createAnnotationTag(name, enabled, registry = defaultRegistry) {
  const definition = registry.get(name);
  if (!definition) {
    throw new Error(`Unknown annotation type: ${name}`);
  }
  return enabled ? definition.tag : createInverseAnnotationTag(definition.tag);
}
function createLinkAnnotationTag(href) {
  return `<a href="${escapeAttribute(href)}">`;
}
function createInverseAnnotationTag(openingTag) {
  const trimmed = openingTag.trim();
  if (!trimmed.startsWith("<") || trimmed.startsWith("</")) {
    throw new Error(`Expected opening annotation tag: ${openingTag}`);
  }
  return `</${trimmed.slice(1)}`;
}
function createHtmlCloseTag(tag) {
  const tagName = getTagName(tag);
  if (!tagName) {
    throw new Error(`Could not determine tag name: ${tag}`);
  }
  return `</${tagName}>`;
}
function getTagName(tag) {
  const match = tag.trim().match(/^<\/?\s*([^\s>/]+)/);
  return match?.[1] ?? null;
}
function isOpeningTag(tag, tagName) {
  return new RegExp(`^<${tagName}(?:\\s[^>]*)?>$`, "i").test(tag);
}
function isClosingTag(tag, tagName) {
  return new RegExp(`^</${tagName}(?:\\s[^>]*)?>$`, "i").test(tag);
}
function isCobaltSelectionOpeningTag(tag) {
  return /^<span\s[^>]*data-cobalt-selection=["']true["'][^>]*>$/i.test(tag);
}
function shortcutFromKeyboardEvent(event) {
  const parts = [];
  if (event.ctrlKey) {
    parts.push("ctrl");
  }
  if (event.metaKey) {
    parts.push("meta");
  }
  if (event.altKey) {
    parts.push("alt");
  }
  if (event.shiftKey) {
    parts.push("shift");
  }
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/editor-state.js
function createEditorState() {
  return {
    pending: {}
  };
}
function buildPendingAnnotations(state, start, end, registry = defaultRegistry) {
  const result = [];
  for (const name of Object.keys(state.pending)) {
    const enabled = state.pending[name];
    if (enabled === void 0) {
      continue;
    }
    result.push({
      start,
      end,
      tag: createAnnotationTag(name, enabled, registry)
    });
  }
  return result;
}
function clearPendingAnnotations(state) {
  for (const name of Object.keys(state.pending)) {
    delete state.pending[name];
  }
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/clipboard.js
var COBALT_CLIPBOARD_MIME = "application/x-cobalt-fragment+json";
function writeFragmentToClipboard(clipboardData, fragment) {
  clipboardData.setData("text/plain", fragment.text);
  clipboardData.setData(COBALT_CLIPBOARD_MIME, JSON.stringify(fragment));
}
function readFragmentFromClipboard(clipboardData) {
  const serialized = clipboardData.getData(COBALT_CLIPBOARD_MIME);
  if (serialized) {
    const parsed = JSON.parse(serialized);
    return normalizeClipboardFragment(parsed);
  }
  return {
    text: clipboardData.getData("text/plain"),
    annotations: []
  };
}
function getClipboardFragment(fragment, start, end) {
  return sliceFragment(fragment, start, end);
}
function normalizeClipboardFragment(fragment) {
  const text = typeof fragment.text === "string" ? fragment.text : "";
  const annotations = Array.isArray(fragment.annotations) ? fragment.annotations.filter((annotation) => Array.isArray(annotation.range) && annotation.range.length === 2 && typeof annotation.range[0] === "number" && typeof annotation.range[1] === "number" && typeof annotation.tag === "string" && typeof annotation.order === "number").map((annotation) => ({
    range: [
      Math.max(0, Math.min(text.length, annotation.range[0])),
      Math.max(0, Math.min(text.length, annotation.range[1]))
    ],
    tag: annotation.tag,
    order: annotation.order
  })).filter((annotation) => annotation.range[1] > annotation.range[0]) : [];
  return {
    text,
    annotations
  };
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/runs.js
function createEmptyState() {
  return {};
}
function getEffectiveState(annotations, offset) {
  const state = createEmptyState();
  const activeAnnotations = annotations.filter((annotation) => offset >= annotation.range[0] && offset < annotation.range[1]).sort((a, b) => a.order - b.order);
  for (const annotation of activeAnnotations) {
    applyAnnotationToState(state, annotation.tag);
  }
  return state;
}
function getTypingEffectiveState(annotations, offset) {
  const state = createEmptyState();
  const activeAnnotations = annotations.filter((annotation) => {
    const [start, end] = annotation.range;
    return start < offset && offset <= end;
  }).sort((a, b) => a.order - b.order);
  for (const annotation of activeAnnotations) {
    applyAnnotationToState(state, annotation.tag);
  }
  return state;
}
function generateRuns(fragment) {
  const boundaries = /* @__PURE__ */ new Set();
  boundaries.add(0);
  boundaries.add(fragment.text.length);
  for (const annotation of fragment.annotations) {
    boundaries.add(annotation.range[0]);
    boundaries.add(annotation.range[1]);
  }
  const sortedBoundaries = Array.from(boundaries).filter((boundary) => boundary >= 0 && boundary <= fragment.text.length).sort((a, b) => a - b);
  const runs = [];
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (start === end) {
      continue;
    }
    runs.push({
      start,
      end,
      state: getEffectiveState(fragment.annotations, start)
    });
  }
  return mergeAdjacentRuns(runs);
}
function stateEquals(a, b) {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (key !== bKeys[i]) {
      return false;
    }
    if (a[key].tag !== b[key].tag || a[key].priority !== b[key].priority) {
      return false;
    }
  }
  return true;
}
function mergeAdjacentRuns(runs) {
  if (runs.length === 0) {
    return [];
  }
  const merged = [
    {
      start: runs[0].start,
      end: runs[0].end,
      state: copyState(runs[0].state)
    }
  ];
  for (let i = 1; i < runs.length; i++) {
    const current = runs[i];
    const previous = merged[merged.length - 1];
    if (previous.end === current.start && stateEquals(previous.state, current.state)) {
      previous.end = current.end;
    } else {
      merged.push({
        start: current.start,
        end: current.end,
        state: copyState(current.state)
      });
    }
  }
  return merged;
}
function copyState(state) {
  return Object.fromEntries(Object.entries(state).map(([key, value]) => [
    key,
    { ...value }
  ]));
}
function applyAnnotationToState(state, tag) {
  const parsed = parseAnnotationTag(tag);
  if (!parsed) {
    return;
  }
  if (!parsed.enabled) {
    delete state[parsed.name];
    return;
  }
  if (!parsed.tag) {
    return;
  }
  state[parsed.name] = {
    name: parsed.name,
    tag: parsed.tag,
    priority: parsed.priority
  };
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/render.js
function render(fragment) {
  const runs = generateRuns(fragment);
  let html2 = "";
  let openTags = [];
  for (const run of runs) {
    const nextTags = getRenderTags(run.state);
    const sharedPrefixLength = getSharedPrefixLength(openTags, nextTags);
    for (let i = openTags.length - 1; i >= sharedPrefixLength; i--) {
      html2 += openTags[i].close;
    }
    for (let i = sharedPrefixLength; i < nextTags.length; i++) {
      html2 += nextTags[i].open;
    }
    html2 += escapeHtml(fragment.text.slice(run.start, run.end));
    openTags = nextTags;
  }
  for (let i = openTags.length - 1; i >= 0; i--) {
    html2 += openTags[i].close;
  }
  return appendTrailingNewlineSentinel(fragment, html2);
}
function appendTrailingNewlineSentinel(fragment, html2) {
  if (!fragment.text.endsWith("\n")) {
    return html2;
  }
  return `${html2}<span data-cobalt-sentinel="true">\u200B</span>`;
}
function getRenderTags(state) {
  return Object.values(state).sort(compareActiveAnnotations).map((annotation) => ({
    key: `${annotation.name}:${annotation.tag}`,
    open: annotation.tag,
    close: createHtmlCloseTag(annotation.tag)
  }));
}
function compareActiveAnnotations(a, b) {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return a.name.localeCompare(b.name);
}
function getSharedPrefixLength(current, next) {
  const length = Math.min(current.length, next.length);
  for (let i = 0; i < length; i++) {
    if (current[i].key !== next[i].key) {
      return i;
    }
  }
  return length;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ../../poef/cobalt-note/packages/note-core/dist/selection.js
function getTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let current = walker.nextNode();
  while (current) {
    const text = current;
    if (!isSentinelTextNode(text)) {
      nodes.push(text);
    }
    current = walker.nextNode();
  }
  return nodes;
}
function getOffset(root, targetNode, targetOffset) {
  const result = getOffsetFromPosition(root, targetNode, targetOffset);
  return result ?? getTextLength(root);
}
function getDomPosition(root, offset) {
  const textNodes = getTextNodes(root);
  if (textNodes.length === 0) {
    return {
      node: root,
      offset: 0
    };
  }
  let currentOffset = 0;
  for (const node of textNodes) {
    const length = node.textContent?.length ?? 0;
    if (offset <= currentOffset + length) {
      return {
        node,
        offset: offset - currentOffset
      };
    }
    currentOffset += length;
  }
  const lastNode = textNodes[textNodes.length - 1];
  return {
    node: lastNode,
    offset: lastNode.textContent?.length ?? 0
  };
}
function getSelectionRange(root) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }
  const start = getOffset(root, range.startContainer, range.startOffset);
  const end = getOffset(root, range.endContainer, range.endOffset);
  return {
    start: Math.min(start, end),
    end: Math.max(start, end)
  };
}
function setSelectionRange(root, start, end) {
  const startPosition = getDomPosition(root, start);
  const endPosition = getDomPosition(root, end);
  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);
  const selection = window.getSelection();
  if (!selection) {
    return false;
  }
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}
function getCaretClientRect(root, offset) {
  const textLength = getTextLength(root);
  if (offset === textLength) {
    const sentinel = getSentinelTextNode(root);
    if (sentinel) {
      const sentinelRect = getTextNodeCaretRect(sentinel, 0);
      if (sentinelRect) {
        return sentinelRect;
      }
    }
  }
  const position = getDomPosition(root, offset);
  const range = document.createRange();
  range.setStart(position.node, position.offset);
  range.collapse(true);
  const rect = firstRect(range);
  if (rect) {
    return rect;
  }
  return getMarkerRect(root, range);
}
function isOffsetOnFirstVisualLine(root, offset, tolerance = 3) {
  const current = getCaretClientRect(root, offset);
  const first3 = getCaretClientRect(root, 0);
  if (!current || !first3) {
    return false;
  }
  return current.top <= first3.top + tolerance;
}
function isOffsetOnLastVisualLine(root, offset, textLength, tolerance = 3) {
  const current = getCaretClientRect(root, offset);
  const last = getCaretClientRect(root, textLength);
  if (!current || !last) {
    return false;
  }
  return current.bottom >= last.bottom - tolerance;
}
function getOffsetAtPoint(root, x, y) {
  const nearestOffset = getNearestCaretOffset(root, x, y);
  if (nearestOffset !== null) {
    return nearestOffset;
  }
  const position = getDomPositionFromPoint(x, y);
  if (!position || !root.contains(position.node)) {
    return getNearestBoundaryOffset(root, y);
  }
  return getOffset(root, position.node, position.offset);
}
function getWordRangeAtPoint(root, x, y) {
  const offset = getOffsetAtPoint(root, x, y);
  const text = getRootText(root);
  return getWordRange(text, offset);
}
function getParagraphRangeAtPoint(root, x, y) {
  const offset = getOffsetAtPoint(root, x, y);
  const text = getRootText(root);
  return getParagraphRange(text, offset);
}
function getWordRange(text, offset) {
  if (text.length === 0) {
    return { start: 0, end: 0 };
  }
  const clampedOffset = Math.max(0, Math.min(offset, text.length));
  let index = clampedOffset;
  if (index === text.length || !isWordCharacter(text[index])) {
    index = Math.max(0, index - 1);
  }
  if (!isWordCharacter(text[index])) {
    return {
      start: clampedOffset,
      end: clampedOffset
    };
  }
  let start = index;
  let end = index + 1;
  while (start > 0 && isWordCharacter(text[start - 1])) {
    start--;
  }
  while (end < text.length && isWordCharacter(text[end])) {
    end++;
  }
  return { start, end };
}
function getParagraphRange(text, offset) {
  const clampedOffset = Math.max(0, Math.min(offset, text.length));
  let start = clampedOffset;
  let end = clampedOffset;
  while (start > 0 && text[start - 1] !== "\n") {
    start--;
  }
  while (end < text.length && text[end] !== "\n") {
    end++;
  }
  return { start, end };
}
function isWordCharacter(character) {
  return character !== void 0 && /[\p{L}\p{N}_]/u.test(character);
}
function getRootText(root) {
  return getTextNodes(root).map((node) => node.textContent ?? "").join("");
}
function getNearestCaretOffset(root, x, y) {
  const textLength = getTextLength(root);
  let best = null;
  for (let offset = 0; offset <= textLength; offset++) {
    const rect = getCaretClientRect(root, offset);
    if (!rect) {
      continue;
    }
    const verticalDistance = getVerticalDistanceToRect(y, rect);
    const horizontalDistance = Math.abs(x - rect.left);
    if (!best || verticalDistance < best.verticalDistance || verticalDistance === best.verticalDistance && horizontalDistance < best.horizontalDistance) {
      best = {
        offset,
        verticalDistance,
        horizontalDistance
      };
    }
  }
  return best?.offset ?? null;
}
function getVerticalDistanceToRect(y, rect) {
  if (y >= rect.top && y <= rect.bottom) {
    return 0;
  }
  return Math.min(Math.abs(y - rect.top), Math.abs(y - rect.bottom));
}
function getDomPositionFromPoint(x, y) {
  const doc = document;
  if (doc.caretPositionFromPoint) {
    const position = doc.caretPositionFromPoint(x, y);
    if (position) {
      return {
        node: position.offsetNode,
        offset: position.offset
      };
    }
  }
  if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) {
      return {
        node: range.startContainer,
        offset: range.startOffset
      };
    }
  }
  return null;
}
function getNearestBoundaryOffset(root, y) {
  const rect = root.getBoundingClientRect();
  if (y <= rect.top) {
    return 0;
  }
  return getTextLength(root);
}
function getTextNodeCaretRect(node, offset) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const rect = firstRect(range);
  if (rect) {
    return rect;
  }
  return node.parentElement?.getBoundingClientRect() ?? null;
}
function getSentinelTextNode(root) {
  const sentinel = root.querySelector('[data-cobalt-sentinel="true"]');
  const node = sentinel?.firstChild;
  return node?.nodeType === Node.TEXT_NODE ? node : null;
}
function firstRect(range) {
  const rects = Array.from(range.getClientRects());
  return rects.length > 0 ? rects[0] : null;
}
function getMarkerRect(root, range) {
  const marker = document.createElement("span");
  marker.setAttribute("data-cobalt-caret-marker", "true");
  marker.textContent = "\u200B";
  range.insertNode(marker);
  const rect = marker.getBoundingClientRect();
  marker.remove();
  root.normalize();
  return rect.width === 0 && rect.height === 0 ? null : rect;
}
function getOffsetFromPosition(root, targetNode, targetOffset) {
  let offset = 0;
  let found = false;
  function walk(node) {
    if (found) {
      return;
    }
    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node;
        if (!isSentinelTextNode(text)) {
          offset += Math.min(targetOffset, text.textContent?.length ?? 0);
        }
      } else {
        for (let i = 0; i < targetOffset; i++) {
          offset += getTextLength(node.childNodes[i]);
        }
      }
      found = true;
      return;
    }
    if (node.nodeType === Node.TEXT_NODE) {
      offset += getTextLength(node);
      return;
    }
    for (const child of Array.from(node.childNodes)) {
      walk(child);
    }
  }
  walk(root);
  return found ? offset : null;
}
function getTextLength(node) {
  if (!node) {
    return 0;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node;
    return isSentinelTextNode(text) ? 0 : text.textContent?.length ?? 0;
  }
  let length = 0;
  for (const child of Array.from(node.childNodes)) {
    length += getTextLength(child);
  }
  return length;
}
function isSentinelTextNode(node) {
  return node.parentElement?.hasAttribute("data-cobalt-sentinel") ?? false;
}

// ../../poef/cobalt-note/packages/rich-text-note/dist/editor.js
var RICH_TEXT_NOTE_FRAGMENT_TYPE = "cobalt.rich-text";
function cloneFragment(fragment) {
  return {
    text: fragment.text,
    annotations: fragment.annotations.map((annotation) => ({
      ...annotation,
      range: [...annotation.range]
    }))
  };
}
function replaceFragment(target, source) {
  target.text = source.text;
  target.annotations = source.annotations.map((annotation) => ({
    ...annotation,
    range: [...annotation.range]
  }));
}
function wrapRichTextFragment(fragment) {
  return {
    type: RICH_TEXT_NOTE_FRAGMENT_TYPE,
    data: cloneFragment(fragment)
  };
}
function isFragment(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const fragment = value;
  return typeof fragment.text === "string" && Array.isArray(fragment.annotations);
}
function isRichTextNotebookFragment(fragment) {
  return fragment.type === RICH_TEXT_NOTE_FRAGMENT_TYPE && isFragment(fragment.data);
}
function renderDecoratedFragment(fragment, ranges, active = true) {
  if (ranges.length === 0) {
    return render(fragment);
  }
  const maxOrder = fragment.annotations.reduce((max, annotation) => Math.max(max, annotation.order), 0);
  const annotations = [
    ...fragment.annotations,
    ...ranges.filter((range) => range !== null && range.end > range.start).map((range, index) => ({
      range: [range.start, range.end],
      tag: active ? '<span data-cobalt-selection="true" data-cobalt-selection-active="true">' : '<span data-cobalt-selection="true" data-cobalt-selection-active="false">',
      order: maxOrder + index + 1
    }))
  ];
  return render({
    text: fragment.text,
    annotations
  });
}
function edit(element2, fragment) {
  const state = createEditorState();
  let selectionDecorationRanges = [];
  let selectionDecorationActive = true;
  function rerender(start, end) {
    element2.innerHTML = renderDecoratedFragment(fragment, selectionDecorationRanges, selectionDecorationActive);
    if (start !== void 0 && end !== void 0) {
      setSelectionRange(element2, start, end);
    }
  }
  const editor = {
    element: element2,
    fragment,
    state,
    getType() {
      return RICH_TEXT_NOTE_FRAGMENT_TYPE;
    },
    getValue() {
      return cloneFragment(fragment);
    },
    setValue(value) {
      if (!isFragment(value)) {
        throw new Error("Expected a rich-text fragment value.");
      }
      replaceFragment(fragment, value);
      const selection = getSelectionRange(element2);
      rerender(selection?.start, selection?.end);
    },
    getLength() {
      return fragment.text.length;
    },
    getText(start = 0, end = fragment.text.length) {
      return fragment.text.slice(Math.max(0, Math.min(fragment.text.length, start)), Math.max(0, Math.min(fragment.text.length, end)));
    },
    focus(start = 0, end = start) {
      element2.focus();
      setSelectionRange(element2, start, end);
    },
    getSelection() {
      return getSelectionRange(element2);
    },
    getCaretClientRect(offset) {
      if (offset !== void 0) {
        return getCaretClientRect(element2, offset);
      }
      const selection = getSelectionRange(element2);
      if (!selection || selection.start !== selection.end) {
        return null;
      }
      return getCaretClientRect(element2, selection.start);
    },
    isCaretOnFirstVisualLine() {
      const selection = getSelectionRange(element2);
      if (!selection || selection.start !== selection.end) {
        return false;
      }
      return isOffsetOnFirstVisualLine(element2, selection.start);
    },
    isCaretOnLastVisualLine() {
      const selection = getSelectionRange(element2);
      if (!selection || selection.start !== selection.end) {
        return false;
      }
      return isOffsetOnLastVisualLine(element2, selection.start, fragment.text.length);
    },
    focusNearestPoint(x, y) {
      const offset = getOffsetAtPoint(element2, x, y);
      this.focus(offset, offset);
    },
    getOffsetAtPoint(x, y) {
      return getOffsetAtPoint(element2, x, y);
    },
    getWordRangeAtPoint(x, y) {
      return getWordRangeAtPoint(element2, x, y);
    },
    getParagraphRangeAtPoint(x, y) {
      return getParagraphRangeAtPoint(element2, x, y);
    },
    getClientRect() {
      return element2.getBoundingClientRect();
    },
    showSelectionRanges(ranges, active = true) {
      selectionDecorationActive = active;
      selectionDecorationRanges = ranges.filter((range) => range !== null && range.end > range.start);
      const selection = getSelectionRange(element2);
      rerender(selection?.start, selection?.end);
    },
    clearSelectionRanges() {
      if (selectionDecorationRanges.length === 0) {
        return;
      }
      selectionDecorationRanges = [];
      const selection = getSelectionRange(element2);
      rerender(selection?.start, selection?.end);
    },
    deleteRange(start, end) {
      deleteRange(fragment, start, end);
      rerender(start, start);
    },
    insertText(offset, text) {
      insertText(fragment, offset, text);
      const caret = Math.min(fragment.text.length, Math.max(0, offset) + text.length);
      rerender(caret, caret);
    },
    sliceFragment(start, end) {
      return wrapRichTextFragment(sliceFragment(fragment, start, end));
    },
    canInsertFragment(notebookFragment) {
      return isRichTextNotebookFragment(notebookFragment);
    },
    insertFragment(offset, notebookFragment) {
      if (!isRichTextNotebookFragment(notebookFragment)) {
        return offset;
      }
      const inserted = notebookFragment.data;
      insertFragment(fragment, offset, inserted);
      const caret = Math.min(fragment.text.length, Math.max(0, offset) + inserted.text.length);
      rerender(caret, caret);
      return caret;
    },
    splitFragment(offset) {
      const result = splitFragment(fragment, offset);
      return {
        before: wrapRichTextFragment(result.before),
        after: wrapRichTextFragment(result.after)
      };
    },
    canMergeFragment(notebookFragment, _direction) {
      return isRichTextNotebookFragment(notebookFragment);
    },
    mergeFragment(notebookFragment, direction) {
      if (!isRichTextNotebookFragment(notebookFragment)) {
        return null;
      }
      const result = direction === "after" ? joinFragments(fragment, notebookFragment.data) : joinFragments(notebookFragment.data, fragment);
      return {
        fragment: wrapRichTextFragment(result.fragment),
        joinOffset: result.joinOffset
      };
    },
    canApplyCommand(command, range, value) {
      if (range.end <= range.start || command === "__selection") {
        return false;
      }
      if (command === "link") {
        return typeof value === "string" && value.length > 0;
      }
      return defaultRegistry.get(command) !== void 0;
    },
    getCommandState(command, offset) {
      return getEffectiveState(fragment.annotations, offset)[command];
    },
    applyCommand(command, range, value) {
      if (!this.canApplyCommand(command, range, value)) {
        return false;
      }
      const tag = command === "link" && typeof value === "string" ? createLinkAnnotationTag(value) : createAnnotationTag(command, value !== false);
      addAnnotation(fragment, [range.start, range.end], tag);
      rerender(range.start, range.end);
      return true;
    },
    destroy() {
      element2.removeEventListener("keydown", handleKeyDown);
      element2.removeEventListener("beforeinput", handleBeforeInput);
      element2.removeEventListener("copy", handleCopy);
      element2.removeEventListener("cut", handleCut);
      element2.removeEventListener("paste", handlePaste);
      element2.removeAttribute("contenteditable");
    }
  };
  function handleKeyDown(event) {
    if (event.key === "Enter") {
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      event.preventDefault();
      insertNewline();
      return;
    }
    if (!event.ctrlKey) {
      return;
    }
    const definition = defaultRegistry.findByShortcut(event);
    if (!definition) {
      return;
    }
    event.preventDefault();
    if (definition.name === "link") {
      addLink();
      return;
    }
    toggleAnnotation(definition);
  }
  function handleBeforeInput(event) {
    const inputEvent = event;
    const selection = getSelectionRange(element2);
    if (!selection) {
      return;
    }
    const commands2 = buildInputCommands(inputEvent, selection.start, selection.end);
    if (commands2.length === 0) {
      return;
    }
    event.preventDefault();
    applyCommands(fragment, commands2);
    const caret = getNextCaretPosition(inputEvent, selection.start, selection.end);
    rerender(caret, caret);
  }
  function handleCopy(event) {
    const selection = getSelectionRange(element2);
    if (!selection || selection.start === selection.end || !event.clipboardData) {
      return;
    }
    event.preventDefault();
    writeFragmentToClipboard(event.clipboardData, getClipboardFragment(fragment, selection.start, selection.end));
  }
  function handleCut(event) {
    const selection = getSelectionRange(element2);
    if (!selection || selection.start === selection.end || !event.clipboardData) {
      return;
    }
    event.preventDefault();
    writeFragmentToClipboard(event.clipboardData, getClipboardFragment(fragment, selection.start, selection.end));
    applyCommands(fragment, [
      new DeleteRangeCommand(selection.start, selection.end)
    ]);
    rerender(selection.start, selection.start);
  }
  function handlePaste(event) {
    const selection = getSelectionRange(element2);
    if (!selection || !event.clipboardData) {
      return;
    }
    event.preventDefault();
    const pastedFragment = readFragmentFromClipboard(event.clipboardData);
    const commands2 = [];
    if (selection.start !== selection.end) {
      commands2.push(new DeleteRangeCommand(selection.start, selection.end));
    }
    commands2.push(new InsertFragmentCommand(selection.start, pastedFragment));
    applyCommands(fragment, commands2);
    const caret = selection.start + pastedFragment.text.length;
    rerender(caret, caret);
  }
  function toggleAnnotation(definition) {
    const selection = getSelectionRange(element2);
    if (!selection) {
      return;
    }
    if (selection.start === selection.end) {
      const inheritedState = getTypingEffectiveState(fragment.annotations, selection.start);
      if (!definition.supportsPending) {
        return;
      }
      const inheritedEnabled = inheritedState[definition.name] !== void 0;
      const currentTypingEnabled = state.pending[definition.name] ?? inheritedEnabled;
      const nextTypingEnabled = !currentTypingEnabled;
      if (nextTypingEnabled === inheritedEnabled) {
        delete state.pending[definition.name];
      } else {
        state.pending[definition.name] = nextTypingEnabled;
      }
      rerender(selection.start, selection.end);
      return;
    }
    const currentState = getEffectiveState(fragment.annotations, selection.start);
    const tag = createAnnotationTag(definition.name, currentState[definition.name] === void 0);
    applyCommands(fragment, [
      new AddAnnotationCommand([selection.start, selection.end], tag)
    ]);
    rerender(selection.start, selection.end);
  }
  function insertNewline() {
    const selection = getSelectionRange(element2);
    if (!selection) {
      return;
    }
    const commands2 = [];
    if (selection.start !== selection.end) {
      commands2.push(new DeleteRangeCommand(selection.start, selection.end));
    }
    commands2.push(new InsertTextCommand(selection.start, "\n", { growAtEnd: false }));
    applyCommands(fragment, commands2);
    const caret = selection.start + 1;
    rerender(caret, caret);
  }
  function addLink() {
    const selection = getSelectionRange(element2);
    if (!selection || selection.start === selection.end) {
      return;
    }
    const href = promptForHref();
    if (!href) {
      return;
    }
    applyCommands(fragment, [
      new AddAnnotationCommand([selection.start, selection.end], createLinkAnnotationTag(href))
    ]);
    rerender(selection.start, selection.end);
  }
  function promptForHref() {
    const href = window.prompt("Enter URL");
    if (href === null) {
      return null;
    }
    const trimmed = href.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  function buildInputCommands(event, selectionStart, selectionEnd) {
    switch (event.inputType) {
      case "insertText":
      case "insertFromPaste":
        return buildInsertCommands(selectionStart, selectionEnd, event.data ?? "");
      case "deleteContentBackward":
        return buildDeleteBackwardCommands(selectionStart, selectionEnd);
      case "deleteContentForward":
        return buildDeleteForwardCommands(selectionStart, selectionEnd);
      case "insertParagraph":
      case "insertLineBreak": {
        const commands2 = [];
        if (selectionStart !== selectionEnd) {
          commands2.push(new DeleteRangeCommand(selectionStart, selectionEnd));
        }
        commands2.push(new InsertTextCommand(selectionStart, "\n", { growAtEnd: false }));
        return commands2;
      }
      default:
        return [];
    }
  }
  function buildInsertCommands(selectionStart, selectionEnd, text) {
    const commands2 = [];
    if (selectionStart !== selectionEnd) {
      commands2.push(new DeleteRangeCommand(selectionStart, selectionEnd));
    }
    if (text.length === 0) {
      return commands2;
    }
    commands2.push(new InsertTextCommand(selectionStart, text));
    const pendingAnnotations = buildPendingAnnotations(state, selectionStart, selectionStart + text.length);
    for (const pending of pendingAnnotations) {
      commands2.push(new AddAnnotationCommand([pending.start, pending.end], pending.tag));
    }
    if (pendingAnnotations.length > 0) {
      clearPendingAnnotations(state);
    }
    return commands2;
  }
  function buildDeleteBackwardCommands(selectionStart, selectionEnd) {
    if (selectionStart !== selectionEnd) {
      return [
        new DeleteRangeCommand(selectionStart, selectionEnd)
      ];
    }
    if (selectionStart === 0) {
      return [];
    }
    return [
      new DeleteRangeCommand(selectionStart - 1, selectionStart)
    ];
  }
  function buildDeleteForwardCommands(selectionStart, selectionEnd) {
    if (selectionStart !== selectionEnd) {
      return [
        new DeleteRangeCommand(selectionStart, selectionEnd)
      ];
    }
    if (selectionStart >= fragment.text.length) {
      return [];
    }
    return [
      new DeleteRangeCommand(selectionStart, selectionStart + 1)
    ];
  }
  function getNextCaretPosition(event, selectionStart, selectionEnd) {
    switch (event.inputType) {
      case "insertText":
      case "insertFromPaste":
        return selectionStart + (event.data?.length ?? 0);
      case "deleteContentBackward":
        return selectionStart === selectionEnd ? Math.max(0, selectionStart - 1) : selectionStart;
      case "deleteContentForward":
        return selectionStart;
      case "insertParagraph":
      case "insertLineBreak":
        return selectionStart + 1;
      default:
        return selectionStart;
    }
  }
  element2.contentEditable = "true";
  rerender();
  element2.addEventListener("keydown", handleKeyDown);
  element2.addEventListener("beforeinput", handleBeforeInput);
  element2.addEventListener("copy", handleCopy);
  element2.addEventListener("cut", handleCut);
  element2.addEventListener("paste", handlePaste);
  return editor;
}

// src/cobalt-editor-modal.html
var cobalt_editor_modal_default = '<div class="margin-notes-editor-modal-dialog ds-dialog">\n  <div class="margin-notes-editor-modal-header">\n    <h2 data-title></h2>\n    <button type="button" data-action="cancel" class="margin-notes-editor-close ds-button ds-button-naked" aria-label="Close">x</button>\n  </div>\n  <div class="margin-notes-editor-modal-content">\n    <div class="margin-notes-cobalt-editor" data-editor-container></div>\n  </div>\n  <div class="margin-notes-editor-modal-footer">\n    <button type="button" data-action="cancel" class="margin-notes-editor-btn-cancel ds-button ds-button-default">Cancel</button>\n    <button type="button" data-action="save" class="margin-notes-editor-btn-save ds-button ds-button-primary">Save</button>\n  </div>\n</div>\n';

// src/cobalt-editor-modal.css
var cobalt_editor_modal_default2 = '.margin-notes-editor-modal {\n  background: transparent;\n  border: 0;\n  color: inherit;\n  color-scheme: var(--ds-color-scheme, light);\n  font-family: var(--ds-font-body, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);\n  margin: auto;\n  max-height: min(80vh, 100%);\n  max-width: min(90vw, 600px);\n  overflow: visible;\n  padding: 0;\n  width: min(90vw, 600px);\n}\n\n.margin-notes-editor-modal:not(:popover-open) {\n  display: none;\n}\n\n.margin-notes-editor-modal:popover-open {\n  display: flex;\n}\n\n.margin-notes-editor-modal::backdrop {\n  background: rgba(0, 0, 0, 0.5);\n}\n\n.margin-notes-editor-modal-dialog {\n  display: flex;\n  flex-direction: column;\n  max-height: 80vh;\n  max-width: 600px;\n  position: relative;\n  width: 100%;\n}\n\n.margin-notes-editor-modal-header {\n  justify-content: space-between;\n  align-items: center;\n  border-bottom: 1px solid var(--ds-grey-low, #e5e7eb);\n  display: flex;\n  padding: var(--ds-space, 1.5rem);\n}\n\n.margin-notes-editor-modal-header h2 {\n  font-family: var(--ds-font-heading, inherit);\n  margin: 0;\n  font-size: 1.25rem;\n  font-weight: var(--ds-heading-weight, 600);\n}\n\n.margin-notes-editor-close {\n  align-items: center;\n  color: var(--ds-grey-medium, #6b7280);\n  display: flex;\n  font-size: 2rem;\n  height: 32px;\n  justify-content: center;\n  line-height: 1;\n  margin: 0;\n  padding: 0;\n  width: 32px;\n}\n\n.margin-notes-editor-close:hover {\n  background: var(--ds-grey-low, #f3f4f6);\n  color: var(--ds-grey-high, #1f2937);\n}\n\n.margin-notes-editor-modal-content {\n  flex: 1;\n  overflow-y: auto;\n  padding: var(--ds-space, 1.5rem);\n}\n\n.margin-notes-cobalt-editor {\n  background: var(--ds-color-background, #fff);\n  border: 1px solid var(--ds-input-border, #d1d5db);\n  border-radius: var(--ds-box-radius, 4px);\n  color: var(--ds-color-contrast, #111);\n  font-family: inherit;\n  font-size: 1rem;\n  line-height: 1.5;\n  max-height: 400px;\n  min-height: 150px;\n  overflow-y: auto;\n  padding: var(--ds-space-d2, 0.75rem);\n}\n\n.margin-notes-cobalt-editor[contenteditable="true"],\n.margin-notes-cobalt-editor textarea,\n.margin-notes-cobalt-editor input {\n  background: var(--ds-color-background, #fff);\n  color: var(--ds-color-contrast, #111);\n  caret-color: var(--ds-color-contrast, #111);\n}\n\n.margin-notes-cobalt-editor:focus-within {\n  background: var(--ds-color-background, white);\n  border-color: var(--ds-primary-high, #3b82f6);\n  outline: none;\n}\n\n.margin-notes-editor-modal-footer {\n  display: flex;\n  gap: var(--ds-space-d2, 0.75rem);\n  justify-content: flex-end;\n  border-top: 1px solid var(--ds-grey-low, #e5e7eb);\n  padding: var(--ds-space, 1.5rem);\n}\n\n.margin-notes-editor-btn-cancel,\n.margin-notes-editor-btn-save {\n  font-weight: 500;\n  margin: 0;\n}\n\n.margin-notes-editor-btn-cancel {\n  color: var(--ds-grey-high, #374151);\n}\n\n.margin-notes-editor-btn-cancel:hover {\n  background: var(--ds-grey-low, #f3f4f6);\n}\n';

// src/cobalt-editor-modal.js
var modalId = 0;
var CobaltEditorModal = class {
  constructor(options = {}) {
    this.options = options;
    this.modal = null;
    this.editor = null;
    this.fragment = options.initialFragment || { text: "", annotations: [] };
  }
  /**
   * Show the modal and return a promise that resolves with the edited fragment.
   * 
   * @returns {Promise<Object>} The edited fragment, or null if cancelled
   */
  async show() {
    return new Promise((resolve) => {
      this.createModal();
      const modal = this.modal;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (modal.matches(":popover-open")) {
          modal.hidePopover();
        }
        this.destroy();
        resolve(value);
      };
      const onSave = async () => {
        const edited = this.editor.getValue();
        finish(edited);
      };
      const onCancel = () => {
        finish(null);
      };
      const onModalKeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          e.stopPropagation();
          onSave();
          return;
        }
        e.stopPropagation();
      };
      const onToggle = (e) => {
        if (e.newState === "closed") {
          onCancel();
        }
      };
      modal.querySelector('[data-action="save"]').addEventListener("click", onSave);
      modal.addEventListener("keydown", onModalKeydown);
      modal.addEventListener("toggle", onToggle);
      modal.showPopover();
      setTimeout(() => {
        this.editor.focus();
      }, 0);
    });
  }
  /**
   * Create the modal DOM structure.
   * 
   * @private
   */
  createModal() {
    this.modal = document.createElement("div");
    this.modal.className = "margin-notes-editor-modal";
    modalId += 1;
    this.modal.id = `margin-notes-editor-modal-${modalId}`;
    this.modal.dataset.readerKeyScope = "margin-notes-editor";
    this.modal.setAttribute("popover", "auto");
    this.modal.innerHTML = cobalt_editor_modal_default;
    this.modal.querySelector("[data-title]").textContent = this.options.title || "Edit note";
    this.modal.querySelectorAll('[data-action="cancel"]').forEach((cancelBtn) => {
      cancelBtn.setAttribute("popovertarget", this.modal.id);
      cancelBtn.setAttribute("popovertargetaction", "hide");
    });
    document.body.appendChild(this.modal);
    const editorContainer = this.modal.querySelector("[data-editor-container]");
    this.editor = edit(editorContainer, this.fragment);
  }
  /**
   * Destroy the modal and clean up.
   * 
   * @private
   */
  destroy() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
};

// src/features/paragraph-note-stacks/annotation-model.js
var annotationModel = {
  vocabulary: {
    prefixes: {
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      dcterms: "http://purl.org/dc/terms/",
      oa: "http://www.w3.org/ns/oa#",
      schema: "https://schema.org/",
      cobalt: "https://vocab.muze.nl/cobalt#"
    },
    classes: {
      annotation: "oa$Annotation",
      textualBody: "oa$TextualBody",
      specificResource: "oa$SpecificResource",
      fragmentSelector: "oa$FragmentSelector",
      cobaltFragment: "cobalt$Fragment"
    },
    predicates: {
      type: "rdf$type",
      label: "rdfs$label",
      created: "dcterms$created",
      modified: "dcterms$modified",
      format: "dcterms$format",
      value: "rdf$value",
      hasBody: "oa$hasBody",
      hasTarget: "oa$hasTarget",
      hasSource: "oa$hasSource",
      hasSelector: "oa$hasSelector",
      text: "schema$text",
      cobaltFragment: "cobalt$fragment"
    },
    mediaTypes: {
      cobaltFragment: "application/vnd.cobalt.fragment+json"
    }
  },
  createAnnotationNote({ anchorId, fragment, now: now2 = (/* @__PURE__ */ new Date()).toISOString() }) {
    const annotationId = this.createLocalSubjectId({});
    const body = {
      id: `${annotationId}#body`,
      rdf$type: [
        this.vocabulary.classes.textualBody,
        this.vocabulary.classes.cobaltFragment
      ],
      dcterms$format: this.vocabulary.mediaTypes.cobaltFragment,
      rdf$value: this.noteText({ fragment }),
      schema$text: this.noteText({ fragment }),
      cobalt$fragment: fragment
    };
    const target = {
      id: `${annotationId}#target`,
      rdf$type: this.vocabulary.classes.specificResource,
      oa$hasSource: this.currentDocumentIri({}),
      oa$hasSelector: {
        id: `${annotationId}#selector-fragment`,
        rdf$type: this.vocabulary.classes.fragmentSelector,
        rdf$value: anchorId
      }
    };
    return {
      id: annotationId,
      rdf$type: this.vocabulary.classes.annotation,
      dcterms$created: now2,
      dcterms$modified: now2,
      oa$hasBody: body,
      oa$hasTarget: target
    };
  },
  createLocalSubjectId() {
    if (globalThis.crypto?.randomUUID) {
      return `urn:uuid:${globalThis.crypto.randomUUID()}`;
    }
    return `urn:muze:margin-notes:${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },
  currentDocumentIri() {
    const href = globalThis.location?.href;
    if (!href) {
      return "urn:muze:margin-notes:local-document";
    }
    return href.replace(/#.*/, "");
  },
  annotationAnchorId({ annotation }) {
    const target = this.firstValue({ value: annotation?.oa$hasTarget });
    const selectors = this.values({ value: target?.oa$hasSelector });
    const fragment = selectors.find((selector) => {
      return this.values({ value: selector?.rdf$type }).includes(this.vocabulary.classes.fragmentSelector);
    });
    return fragment?.rdf$value;
  },
  annotationBody({ annotation }) {
    return this.firstValue({ value: annotation?.oa$hasBody });
  },
  annotationBodyFragment({ annotation }) {
    return this.annotationBody({ annotation })?.cobalt$fragment || { text: "", annotations: [] };
  },
  updateAnnotationBody({ annotation, fragment, now: now2 = (/* @__PURE__ */ new Date()).toISOString() }) {
    const body = this.annotationBody({ annotation });
    if (!body) return;
    body.rdf$value = this.noteText({ fragment });
    body.schema$text = this.noteText({ fragment });
    body.cobalt$fragment = fragment;
    annotation.dcterms$modified = now2;
  },
  removeAnnotationFromGraph({ app: app2, annotationId }) {
    const index = app2.data.marginNotes.graph.findIndex((annotation) => annotation.id === annotationId);
    if (index >= 0) {
      app2.data.marginNotes.graph.splice(index, 1);
    }
  },
  toRenderableNote({ annotation }) {
    const note = {
      id: annotation.id,
      annotation,
      anchorId: this.annotationAnchorId({ annotation }),
      body: this.annotationBodyFragment({ annotation }),
      created: annotation.dcterms$created,
      modified: annotation.dcterms$modified
    };
    return this.syncRenderableNote({ note });
  },
  syncRenderableNote({ note }) {
    const annotation = note.annotation;
    const fragment = this.annotationBodyFragment({ annotation });
    note.anchorId = this.annotationAnchorId({ annotation });
    note.body = fragment;
    note.bodyText = this.noteText({ fragment });
    note.created = annotation.dcterms$created;
    note.modified = annotation.dcterms$modified;
    note.createdLabel = `Created: ${(note.created || "").substring(0, 10)}`;
    return note;
  },
  toStoredAnnotation({ annotation }) {
    return this.cloneValue({ value: annotation });
  },
  toStorageDocument({ subjects }) {
    return {
      format: "margin-notes-oldmed-graph",
      version: 1,
      prefixes: this.vocabulary.prefixes,
      subjects: Array.from(subjects).filter((annotation) => this.isMarginNoteAnnotation({ value: annotation })).map((annotation) => this.toStoredAnnotation({ annotation }))
    };
  },
  toStoredGraph({ value }) {
    if (Array.isArray(value)) {
      return Array.from(value, (note) => {
        return this.isMarginNoteAnnotation({ value: note }) ? note : this.annotationFromLegacyNote({ note });
      }).filter((annotation) => this.isMarginNoteAnnotation({ value: annotation }));
    }
    if (Array.isArray(value?.subjects)) {
      return value.subjects.filter((subject) => this.isMarginNoteAnnotation({ value: subject }));
    }
    return [];
  },
  isOldmedAnnotation({ value }) {
    return this.values({ value: value?.rdf$type }).includes(this.vocabulary.classes.annotation);
  },
  isMarginNoteAnnotation({ value }) {
    return Boolean(
      this.isOldmedAnnotation({ value }) && this.annotationBody({ annotation: value }) && this.annotationAnchorId({ annotation: value })
    );
  },
  annotationFromLegacyNote({ note }) {
    const annotation = this.createAnnotationNote({
      anchorId: note.anchorId,
      fragment: note.body || { text: "", annotations: [] },
      now: note.created || (/* @__PURE__ */ new Date()).toISOString()
    });
    annotation.id = this.legacyLocalSubjectId({ id: note.id });
    annotation.dcterms$created = note.created || annotation.dcterms$created;
    annotation.dcterms$modified = note.modified || annotation.dcterms$modified;
    annotation.oa$hasBody.id = `${annotation.id}#body`;
    annotation.oa$hasTarget.id = `${annotation.id}#target`;
    annotation.oa$hasTarget.oa$hasSelector.id = `${annotation.id}#selector-fragment`;
    return annotation;
  },
  legacyLocalSubjectId({ id: id2 }) {
    if (typeof id2 === "string" && /^(?:[a-z][a-z0-9+.-]*:)/i.test(id2)) {
      return id2;
    }
    return `urn:muze:margin-notes:${encodeURIComponent(id2 || this.createLocalSubjectId({}))}`;
  },
  firstValue({ value }) {
    return Array.isArray(value) ? value[0] : value;
  },
  values({ value }) {
    if (value === void 0 || value === null) return [];
    return Array.isArray(value) ? value : [value];
  },
  cloneValue({ value }) {
    return JSON.parse(JSON.stringify(value));
  },
  noteText({ fragment }) {
    return fragment?.text || "(empty note)";
  }
};

// src/features/paragraph-note-stacks/root.html
var root_default = '<div class="margin-notes-root" hidden></div>\n';

// src/features/paragraph-note-stacks/anchor-widget.html
var anchor_widget_default = '<span class="margin-notes-anchor-widget">\n  <button\n    type="button"\n    class="margin-notes-target-add-btn"\n    title="Add note"\n    aria-label="Add note"\n    data-simply-command="createNote"\n    data-simply-value=":value"\n  >+</button>\n  <span class="margin-notes-target-note-list" data-simply-shortcuts="marginNotesNote">\n    <span class="margin-notes-target-note-items" data-simply-list="visibleNotes">\n      <template rel="margin-notes-inline-note"></template>\n    </span>\n    <button\n      type="button"\n      class="margin-notes-target-note-count"\n      aria-expanded="false"\n      data-margin-notes-empty="true"\n      data-simply-command="toggleAnchorNoteList"\n      data-simply-value=":value"\n    ><span data-simply-field="overflowLabel"></span></button>\n  </span>\n</span>\n';

// src/features/paragraph-note-stacks/inline-note.html
var inline_note_default = '<article class="margin-notes-target-note">\n  <button\n    type="button"\n    class="margin-notes-target-note-toggle"\n    aria-expanded="false"\n    data-simply-shortcuts="marginNotesNote"\n    data-simply-command="expandInlineNote"\n    data-simply-value=":value"\n  ><span class="margin-notes-target-note-text" data-simply-field="bodyText"></span></button>\n  <button\n    type="button"\n    class="margin-notes-target-note-close"\n    aria-label="Close note"\n    data-simply-command="collapseInlineNote"\n    data-simply-value=":value"\n  >x</button>\n  <span class="margin-notes-target-note-actions">\n    <button\n      type="button"\n      class="margin-notes-target-note-action"\n      data-simply-command="updateNote"\n      data-simply-value=":value"\n    >Edit</button>\n    <button\n      type="button"\n      class="margin-notes-target-note-action"\n      data-simply-command="deleteNote"\n      data-simply-value=":value"\n    >Delete</button>\n  </span>\n</article>\n';

// src/features/solid-connection/control.html
var control_default = '<form class="margin-notes-solid-connection" data-margin-notes-solid-connection>\n  <label class="margin-notes-solid-connection-webid">\n    <span>WebID</span>\n    <input\n      type="url"\n      inputmode="url"\n      autocomplete="url"\n      placeholder="https://example.solidcommunity.net/profile/card#me"\n      data-margin-notes-solid-webid\n    >\n  </label>\n  <button type="submit" class="ds-button ds-button-primary">Connect</button>\n  <p class="margin-notes-solid-connection-status" data-margin-notes-solid-status>Not connected</p>\n</form>\n';

// src/design-system.css
var design_system_default = '/*\n * Curated the-ds subset for margin-notes.\n *\n * This intentionally does not import the-ds wholesale. Margin notes is embedded\n * into host documents, so this file only defines design tokens and the small\n * button/dialog primitives used by the component.\n */\n\n@layer reset, setup, theme, base, component, page, utility;\n\n@layer setup {\n  :root,\n  :host {\n    --ds-black: #000;\n    --ds-white: #fff;\n    --ds-primary: oklch(0.7388 0.1792 126.69);\n    --ds-support: oklch(0.7388 0.1792 216.69);\n\n    --ds-grey-0: #eef1f8;\n    --ds-grey-5: #e9edf6;\n    --ds-grey-10: #e4eaf4;\n    --ds-grey-20: #dae2ed;\n    --ds-grey-30: #cdd7e3;\n    --ds-grey-40: #bdc8d4;\n    --ds-grey-50: #a8b4c0;\n    --ds-grey-60: #8f9ba6;\n    --ds-grey-70: #707c84;\n    --ds-grey-80: #4d565c;\n    --ds-grey-90: #262c2f;\n    --ds-grey-100: #000;\n\n    --ds-color-error: rgb(253, 143, 143);\n    --ds-color-warning: #ffffcc;\n    --ds-color-info: rgb(140, 180, 250);\n  }\n}\n\n@layer theme {\n  :root,\n  :host {\n    --ds-color-scheme: light;\n    --ds-font-heading: var(--margin-notes-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n    --ds-font-body: var(--margin-notes-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n    --ds-font-weight: 400;\n    --ds-font-size: 1rem;\n    --ds-line-height: 1.5rem;\n\n    --ds-heading-weight: 600;\n    --ds-space: var(--ds-line-height);\n    --ds-space-d4: calc(var(--ds-space) / 4);\n    --ds-space-d3: calc(var(--ds-space) / 3);\n    --ds-space-d2: calc(var(--ds-space) / 2);\n    --ds-space-x2: calc(2 * var(--ds-space));\n    --ds-space-x3: calc(3 * var(--ds-space));\n    --ds-space-x4: calc(4 * var(--ds-space));\n\n    --ds-primary-10: oklch(from var(--ds-primary) calc(l + 0.3) c h);\n    --ds-primary-90: oklch(from var(--ds-primary) calc(l - 0.3) c h);\n    --ds-primary-high: var(--ds-primary-90);\n    --ds-primary-low: var(--ds-primary-10);\n    --ds-primary-contrast: var(--ds-white);\n\n    --ds-support-10: oklch(from var(--ds-support) calc(l + 0.3) c h);\n    --ds-support-90: oklch(from var(--ds-support) calc(l - 0.3) c h);\n    --ds-support-high: var(--ds-support-90);\n    --ds-support-low: var(--ds-support-10);\n    --ds-support-contrast: var(--ds-white);\n\n    --ds-grey-high: var(--ds-grey-90);\n    --ds-grey-medium: var(--ds-grey-60);\n    --ds-grey-low: var(--ds-grey-10);\n    --ds-color: var(--ds-black);\n    --ds-color-background: var(--ds-white);\n    --ds-color-contrast: var(--ds-color);\n\n    --ds-shadow-light: rgba(0, 0, 0, 0.07);\n    --ds-shadow-middle: rgba(0, 0, 0, 0.09);\n    --ds-shadow-dark: rgba(0, 0, 0, 0.11);\n    --ds-shadow-tiny: 0 1px 1px var(--ds-shadow-dark);\n    --ds-shadow-small:\n      0 1px 1px var(--ds-shadow-dark),\n      0 2px 2px var(--ds-shadow-middle),\n      0 4px 4px var(--ds-shadow-light);\n    --ds-shadow-medium:\n      0 1px 1px var(--ds-shadow-middle),\n      0 2px 2px var(--ds-shadow-middle),\n      0 4px 4px var(--ds-shadow-middle),\n      0 6px 8px var(--ds-shadow-middle),\n      0 8px 16px var(--ds-shadow-middle);\n    --ds-shadow-large:\n      0 -2px 2px var(--ds-shadow-light),\n      0 4px 2px var(--ds-shadow-light),\n      0 8px 4px var(--ds-shadow-light),\n      0 16px 8px var(--ds-shadow-light),\n      0 32px 16px var(--ds-shadow-light);\n\n    --ds-box-radius: 4px;\n\n    --ds-input-border: var(--ds-grey-medium);\n    --ds-input-space: var(--ds-space);\n    --ds-input-font: var(--ds-font-body);\n    --ds-input-height: calc(var(--ds-line-height) * 1.5);\n    --ds-input-margin: calc(var(--ds-line-height) * 0.5);\n\n    --ds-button-space: calc(0.5 * var(--ds-input-space));\n    --ds-button-bg-color: var(--ds-grey-low);\n    --ds-button-default-bg-color: var(--ds-white);\n    --ds-button-border: 1px solid var(--ds-grey-low);\n    --ds-button-disabled-color: var(--ds-grey-medium);\n    --ds-button-disabled-bg-color: var(--ds-white);\n    --ds-button-primary-bg-color: var(--ds-primary);\n    --ds-button-primary-color: var(--ds-primary-contrast);\n    --ds-button-primary-border-color: transparent;\n    --ds-button-support-bg-color: var(--ds-support);\n    --ds-button-support-color: var(--ds-support-contrast);\n    --ds-button-support-border-color: transparent;\n    --ds-button-line-height: calc(var(--ds-line-height) * 1.5);\n    --ds-button-shadow: 0;\n    --ds-button-shadow-hover: var(--ds-shadow-small);\n    --ds-button-radius: var(--ds-box-radius);\n    --ds-button-padding: calc(0.5 * var(--ds-line-height));\n    --ds-button-font-size: calc(0.875 * var(--ds-font-size));\n\n    --ds-dialog-background: var(--ds-color-background);\n    --ds-dialog-color: var(--ds-color-contrast);\n    --ds-dialog-shadow: var(--ds-shadow-large);\n    --ds-dialog-radius: calc(2 * var(--ds-box-radius));\n    --ds-dialog-size: calc(50% - (1 / 2 * var(--ds-space)));\n    --ds-dialog-min-width: 25em;\n  }\n\n  :root[data-margin-notes-theme="dark"],\n  :host([data-margin-notes-theme="dark"]) {\n    --ds-color-scheme: dark;\n    --ds-primary: oklch(0.78 0.14 142);\n    --ds-support: oklch(0.78 0.13 225);\n    --ds-primary-high: oklch(0.84 0.11 142);\n    --ds-primary-low: oklch(0.3 0.08 142);\n    --ds-support-high: oklch(0.82 0.1 225);\n    --ds-support-low: oklch(0.3 0.08 225);\n    --ds-grey-high: #f3f3ed;\n    --ds-grey-medium: #b8bbad;\n    --ds-grey-low: #343831;\n    --ds-color: #f3f3ed;\n    --ds-color-background: #1b1d19;\n    --ds-color-contrast: #f3f3ed;\n    --ds-shadow-light: rgba(0, 0, 0, 0.18);\n    --ds-shadow-middle: rgba(0, 0, 0, 0.24);\n    --ds-shadow-dark: rgba(0, 0, 0, 0.32);\n    --ds-input-border: #5b6054;\n    --ds-button-bg-color: #343831;\n    --ds-button-default-bg-color: #242720;\n    --ds-button-border: 1px solid #4a5045;\n    --ds-button-disabled-color: #8e9285;\n    --ds-button-disabled-bg-color: #242720;\n    --ds-dialog-background: #1f211d;\n  }\n\n  @media (prefers-color-scheme: dark) {\n    :root[data-margin-notes-theme="system"],\n    :host([data-margin-notes-theme="system"]) {\n      --ds-color-scheme: dark;\n      --ds-primary: oklch(0.78 0.14 142);\n      --ds-support: oklch(0.78 0.13 225);\n      --ds-primary-high: oklch(0.84 0.11 142);\n      --ds-primary-low: oklch(0.3 0.08 142);\n      --ds-support-high: oklch(0.82 0.1 225);\n      --ds-support-low: oklch(0.3 0.08 225);\n      --ds-grey-high: #f3f3ed;\n      --ds-grey-medium: #b8bbad;\n      --ds-grey-low: #343831;\n      --ds-color: #f3f3ed;\n      --ds-color-background: #1b1d19;\n      --ds-color-contrast: #f3f3ed;\n      --ds-shadow-light: rgba(0, 0, 0, 0.18);\n      --ds-shadow-middle: rgba(0, 0, 0, 0.24);\n      --ds-shadow-dark: rgba(0, 0, 0, 0.32);\n      --ds-input-border: #5b6054;\n      --ds-button-bg-color: #343831;\n      --ds-button-default-bg-color: #242720;\n      --ds-button-border: 1px solid #4a5045;\n      --ds-button-disabled-color: #8e9285;\n      --ds-button-disabled-bg-color: #242720;\n      --ds-dialog-background: #1f211d;\n    }\n  }\n}\n\n@layer component {\n  .ds-button {\n    background-color: var(--ds-button-bg-color);\n    border: 0;\n    border-radius: var(--ds-button-radius);\n    box-shadow: var(--ds-button-shadow);\n    box-sizing: border-box;\n    color: inherit;\n    cursor: pointer;\n    display: inline-block;\n    font: inherit;\n    font-size: var(--ds-button-font-size);\n    line-height: var(--ds-button-line-height);\n    margin: 0 var(--ds-button-space) var(--ds-button-space) 0;\n    min-height: var(--ds-button-line-height);\n    outline: var(--ds-button-border);\n    overflow: visible;\n    padding: 0 var(--ds-button-padding);\n    text-align: center;\n    text-decoration: none;\n    white-space: nowrap;\n  }\n\n  .ds-button:hover,\n  .ds-button:focus {\n    box-shadow: var(--ds-button-shadow-hover);\n    text-decoration: none;\n  }\n\n  .ds-button-default {\n    background-color: var(--ds-button-default-bg-color);\n  }\n\n  .ds-button-primary,\n  .ds-button-primary:hover {\n    background-color: var(--ds-button-primary-bg-color);\n    color: var(--ds-button-primary-color);\n    outline: 1px solid var(--ds-button-primary-border-color);\n  }\n\n  .ds-button-support,\n  .ds-button-support:hover {\n    background-color: var(--ds-button-support-bg-color);\n    color: var(--ds-button-support-color);\n    outline: 1px solid var(--ds-button-support-border-color);\n  }\n\n  .ds-button-naked {\n    background: none;\n    box-shadow: none;\n    outline: none;\n  }\n\n  .ds-dialog {\n    background: var(--ds-dialog-background);\n    border: 0;\n    border-radius: var(--ds-dialog-radius);\n    box-shadow: var(--ds-dialog-shadow);\n    color: var(--ds-dialog-color);\n    max-width: 100%;\n    min-width: min(100%, var(--ds-dialog-min-width));\n    padding: 0;\n    width: var(--ds-dialog-size);\n  }\n}\n';

// src/features/paragraph-note-stacks/ui.css
var ui_default = '[data-margin-notes-target],\n.margin-notes-anchor-widget {\n  --margin-notes-paper-background: var(--ds-color-background, #fff);\n  --margin-notes-open-background: var(--ds-color-background, #fffefb);\n  --margin-notes-note-color: var(--ds-grey-high, #302a1d);\n  --margin-notes-muted-color: var(--ds-grey-medium, #5d5a51);\n  --margin-notes-rule-color: var(--ds-grey-low, #ebe4d1);\n  --margin-notes-marker-color: var(--ds-support, #c9a84f);\n  --margin-notes-action-color: var(--ds-primary-high, #4d5f8f);\n  --margin-notes-focus-color: var(--ds-primary-high, #3162d4);\n  --margin-notes-radius: var(--ds-box-radius, 4px);\n  --margin-notes-shadow: var(--ds-shadow-small, 0 4px 14px rgba(20, 31, 56, 0.16));\n  --margin-notes-font: var(--ds-font-body, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n  color-scheme: var(--ds-color-scheme, light);\n}\n\n[data-margin-notes-target] {\n  position: relative;\n  outline: none;\n}\n\n.margin-notes-anchor-widget,\n.margin-notes-anchor-widget-host {\n  display: contents;\n}\n\n[data-margin-notes-target]::before {\n  bottom: 0;\n  content: "";\n  left: -3rem;\n  position: absolute;\n  top: 0;\n  width: 3rem;\n}\n\n[data-margin-notes-target].margin-notes-target-tabstop:focus-visible {\n  outline: 2px solid var(--margin-notes-focus-color);\n  outline-offset: 4px;\n}\n\n.margin-notes-target-add-btn {\n  align-items: center;\n  background: var(--margin-notes-paper-background);\n  border: 1px solid var(--ds-grey-30, #cfd6e6);\n  border-radius: 999px;\n  box-shadow: var(--margin-notes-shadow);\n  color: var(--margin-notes-action-color);\n  cursor: pointer;\n  display: inline-flex;\n  font: 600 1rem/1 var(--margin-notes-font);\n  height: 2rem;\n  justify-content: center;\n  left: -2.75rem;\n  opacity: 0;\n  pointer-events: none;\n  position: absolute;\n  top: 0.35rem;\n  transform: translateX(0.25rem);\n  transition: opacity 120ms ease, transform 120ms ease, border-color 120ms ease;\n  width: 2rem;\n  z-index: 2;\n}\n\n[data-margin-notes-target]:hover .margin-notes-target-add-btn,\n[data-margin-notes-target]:focus .margin-notes-target-add-btn,\n[data-margin-notes-target]:focus-within .margin-notes-target-add-btn,\n.margin-notes-target-add-btn:focus-visible {\n  opacity: 1;\n  pointer-events: auto;\n  transform: translateX(0);\n}\n\n.margin-notes-target-add-btn:hover,\n.margin-notes-target-add-btn:focus-visible {\n  border-color: var(--margin-notes-focus-color);\n}\n\n.margin-notes-target-note-list {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n  left: calc(100% + 1.25rem);\n  position: absolute;\n  top: 0;\n  width: min(17rem, 34vw);\n  z-index: 3;\n}\n\n.margin-notes-target-note-list.is-expanded {\n  background: var(--margin-notes-open-background);\n  border-radius: var(--margin-notes-radius);\n  box-shadow: 0 0 0 0.35rem var(--margin-notes-open-background);\n  z-index: 30;\n}\n\n.margin-notes-target-note-count {\n  align-items: center;\n  align-self: flex-start;\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-muted-color);\n  cursor: pointer;\n  display: inline-flex;\n  font: 600 0.78rem/1 var(--margin-notes-font);\n  gap: 0.25rem;\n  padding: 0.05rem 0.2rem;\n}\n\n.margin-notes-target-note-count::before,\n.margin-notes-target-note-toggle::before {\n  background: var(--margin-notes-marker-color);\n  border-radius: 1px;\n  content: "";\n  display: inline-block;\n  flex: 0 0 auto;\n  height: 0.72rem;\n  opacity: 0.72;\n  transform: rotate(-2deg);\n  width: 0.58rem;\n}\n\n.margin-notes-target-note-count[hidden],\n.margin-notes-target-note-count[data-margin-notes-empty="true"],\n.margin-notes-target-note[hidden] {\n  display: none;\n}\n\n.margin-notes-target-note-items {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n}\n\n.margin-notes-target-note {\n  background: transparent;\n  border-radius: var(--margin-notes-radius);\n  color: var(--margin-notes-note-color);\n  min-height: 2rem;\n  position: relative;\n}\n\n.margin-notes-target-note.is-expanded {\n  background: var(--margin-notes-open-background);\n  left: 0;\n  position: absolute;\n  right: auto;\n  top: var(--margin-notes-expanded-top, 0);\n  width: min(24rem, 54vw);\n  z-index: 20;\n}\n\n.margin-notes-target-note-toggle {\n  align-items: baseline;\n  background: transparent;\n  border: 0;\n  color: inherit;\n  cursor: pointer;\n  display: flex;\n  gap: 0.38rem;\n  font: 0.875rem/1.35 var(--margin-notes-font);\n  overflow: hidden;\n  padding: 0.16rem 0;\n  text-align: left;\n  width: 100%;\n}\n\n.margin-notes-target-note-text {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-toggle {\n  cursor: text;\n  overflow: visible;\n  padding: 0.35rem 2rem 0.55rem 0;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-text {\n  overflow: visible;\n  text-overflow: clip;\n  white-space: normal;\n}\n\n.margin-notes-target-note-actions {\n  border-top: 1px solid var(--margin-notes-rule-color);\n  display: none;\n  gap: 0.35rem;\n  justify-content: flex-end;\n  padding: 0 0.45rem 0.45rem;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-actions {\n  display: flex;\n}\n\n.margin-notes-target-note-action {\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-action-color);\n  cursor: pointer;\n  font: 600 0.78rem/1 var(--margin-notes-font);\n  padding: 0.35rem;\n}\n\n.margin-notes-target-note-close {\n  align-items: center;\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-muted-color);\n  cursor: pointer;\n  display: none;\n  font: 1.1rem/1 var(--margin-notes-font);\n  height: 1.65rem;\n  justify-content: center;\n  padding: 0;\n  position: absolute;\n  right: 0.25rem;\n  top: 0.25rem;\n  width: 1.65rem;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-close {\n  display: inline-flex;\n}\n\n@media (max-width: 760px) {\n  [data-margin-notes-target]::before {\n    display: none;\n  }\n\n  .margin-notes-target-add-btn {\n    left: auto;\n    right: 0;\n    top: -0.85rem;\n  }\n\n  .margin-notes-target-note-list {\n    left: 0;\n    position: relative;\n    top: auto;\n    width: 100%;\n  }\n\n  .margin-notes-target-note.is-expanded {\n    width: min(100%, 24rem);\n  }\n}\n';

// src/features/solid-connection/ui.css
var ui_default2 = '.margin-notes-solid-connection {\n  color: var(--ds-color-contrast);\n  display: grid;\n  font-family: var(--ds-font-body);\n  font-size: 0.875rem;\n  gap: calc(var(--ds-space) / 3);\n  line-height: 1.35;\n}\n\n.margin-notes-solid-connection-webid {\n  display: grid;\n  gap: calc(var(--ds-space) / 4);\n}\n\n.margin-notes-solid-connection-webid span {\n  color: var(--ds-grey-medium);\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n\n.margin-notes-solid-connection-webid input {\n  background: var(--ds-color-background);\n  border: 1px solid var(--ds-input-border);\n  border-radius: var(--ds-box-radius);\n  box-sizing: border-box;\n  color: var(--ds-color-contrast);\n  font: inherit;\n  inline-size: 100%;\n  min-block-size: var(--ds-input-height);\n  padding: 0 calc(var(--ds-space) / 3);\n}\n\n.margin-notes-solid-connection-status {\n  color: var(--ds-grey-medium);\n  margin: 0;\n}\n\n.margin-notes-solid-connection-status[data-status="connected"] {\n  color: var(--ds-primary-high);\n}\n\n.margin-notes-solid-connection-status[data-status="error"] {\n  color: var(--ds-color-error);\n}\n';

// node_modules/@muze-nl/assert/src/assert-core.mjs
var assert_core_exports = {};
__export(assert_core_exports, {
  Optional: () => Optional,
  Recommended: () => Recommended,
  Required: () => Required,
  allOf: () => allOf,
  anyOf: () => anyOf,
  assert: () => assert,
  disable: () => disable,
  enable: () => enable,
  error: () => error,
  fails: () => fails,
  formatIssue: () => formatIssue,
  formatIssues: () => formatIssues,
  instanceOf: () => instanceOf,
  issues: () => issues,
  not: () => not,
  oneOf: () => oneOf,
  validEmail: () => validEmail,
  validURL: () => validURL,
  warn: () => warn
});
var assertEnabled = false;
function enable() {
  assertEnabled = true;
}
function disable() {
  assertEnabled = false;
}
function appendPath(path2 = "", key) {
  if (typeof path2 == "undefined" || path2 == null) {
    path2 = "";
  }
  if (typeof key == "number") {
    return `${path2}[${key}]`;
  }
  return `${path2}.${key}`;
}
function pathToArray(path2 = "") {
  if (Array.isArray(path2)) {
    return path2;
  }
  if (!path2) {
    return [];
  }
  let result = [];
  let matcher = /(?:^|\.)([^.\[\]]+)|\[(\d+)\]/g;
  let match;
  while (match = matcher.exec(path2)) {
    if (typeof match[1] != "undefined") {
      result.push(match[1]);
    } else if (typeof match[2] != "undefined") {
      result.push(Number(match[2]));
    }
  }
  return result;
}
function pathToString(path2 = []) {
  if (typeof path2 == "string") {
    return path2.startsWith(".") ? path2.slice(1) : path2;
  }
  return path2.map((part, index) => {
    if (typeof part == "number") {
      return `[${part}]`;
    }
    return `${index ? "." : ""}${part}`;
  }).join("");
}
function describeFunction(value) {
  if (value === String) {
    return "string";
  }
  if (value === Number) {
    return "number";
  }
  if (value === Boolean) {
    return "boolean";
  }
  return value.name || "function";
}
function clip(text, maxLength = 60) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + "\u2026";
}
function quoteString(value) {
  return `'${clip(String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n"))}'`;
}
function jsonSummary(value) {
  try {
    let json = JSON.stringify(value);
    if (typeof json == "string") {
      return clip(json);
    }
  } catch (e) {
  }
  let name = value?.constructor?.name;
  if (name && name != "Object") {
    return name;
  }
  return Object.prototype.toString.call(value);
}
function formatValue(value) {
  if (typeof value == "string") {
    return quoteString(value);
  }
  if (typeof value == "undefined") {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value == "function") {
    return describeFunction(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (typeof value == "number" || typeof value == "boolean" || typeof value == "bigint") {
    return String(value);
  }
  if (typeof value == "symbol") {
    return value.toString();
  }
  return jsonSummary(value);
}
function describeExpected(value) {
  if (value === String || value === Number || value === Boolean) {
    return describeFunction(value);
  }
  if (typeof value == "function") {
    return describeFunction(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return "[" + value.map(describeExpected).join(", ") + "]";
  }
  return formatValue(value);
}
function describeOneOf(patterns) {
  return patterns.map(describeExpected).join(", ");
}
function conciseMessage(message, actual, expected) {
  if (message == "data and pattern are not equal") {
    return `expected ${formatValue(expected)}, found ${formatValue(actual)}`;
  }
  if (message == "data does not match pattern" || /^data\[\d+\] does not match pattern$/.test(message)) {
    return `expected ${describeExpected(expected)}, found ${formatValue(actual)}`;
  }
  if (message == "data is undefined, should match pattern") {
    return `missing; expected ${describeExpected(expected)}`;
  }
  if (message == "data is required") {
    return "required";
  }
  if (message == "data is an empty string, which is not allowed") {
    return "empty string is not allowed";
  }
  if (message == "data is not an object, pattern is") {
    return "data is not an object";
  }
  if (message == "data is not an instanceof pattern") {
    return `expected instance of ${describeExpected(expected)}, found ${formatValue(actual)}`;
  }
  if (message == "data does not match oneOf patterns" || message == "data does not match anyOf patterns") {
    return `expected one of ${describeOneOf(expected)}, found ${formatValue(actual)}`;
  }
  if (message == "data matches pattern, when required not to") {
    return `must not match ${describeExpected(expected)}`;
  }
  return message;
}
function formatIssue(issue, options = {}) {
  if (!issue || typeof issue != "object") {
    return String(issue);
  }
  let path2 = issue.pathString || pathToString(issue.path || []) || "value";
  let indent = options.indent ?? "";
  return `${indent}${path2}: ${issue.message}`;
}
function formatIssues(issues3, options = {}) {
  if (!issues3) {
    return false;
  }
  let indent = options.indent ?? "  - ";
  return (Array.isArray(issues3) ? issues3 : [issues3]).map((issue) => formatIssue(issue, { ...options, indent }));
}
function issueFromProblem(problem) {
  if (!problem || typeof problem != "object") {
    return {
      path: [],
      pathString: "",
      message: String(problem),
      expected: void 0,
      actual: void 0
    };
  }
  let path2 = pathToArray(problem.path);
  let pathString = pathToString(path2);
  let actual = problem.actual ?? problem.found;
  let expected = describeExpected(problem.expected);
  let message = conciseMessage(problem.message, actual, problem.expected);
  return {
    path: path2,
    pathString,
    message,
    expected,
    actual
  };
}
function problemsToIssues(problems) {
  if (!problems) {
    return [];
  }
  let result = [];
  for (let problem of Array.isArray(problems) ? problems : [problems]) {
    if (!problem) {
      continue;
    }
    if (problem && typeof problem == "object" && problem.problems) {
      let nested = problemsToIssues(problem.problems);
      if (nested.length) {
        result = result.concat(nested);
        continue;
      }
    }
    result.push(issueFromProblem(problem));
  }
  return result;
}
function assert(source, test) {
  if (assertEnabled) {
    let problems = fails(source, test);
    if (problems) {
      let assertionIssues = problemsToIssues(problems);
      let formattedIssues = formatIssues(assertionIssues);
      let message = "Assertions failed:\n" + formattedIssues.join("\n");
      console.error("\u{1F170}\uFE0F  " + message);
      throw new Error(message, {
        cause: { problems, issues: assertionIssues, source }
      });
    }
  }
}
function Optional(pattern) {
  return function _Optional(data, root, path2) {
    if (typeof data != "undefined" && data != null && typeof pattern != "undefined") {
      return fails(data, pattern, root, path2);
    }
  };
}
function Required(pattern) {
  return function _Required(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      return error("data is required", data, pattern || "any value", path2);
    } else if (typeof pattern != "undefined") {
      return fails(data, pattern, root, path2);
    } else {
      return false;
    }
  };
}
function Recommended(pattern) {
  return function _Recommended(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      warn("data does not contain recommended value", data, pattern, path2);
      return false;
    } else {
      return fails(data, pattern, root, path2);
    }
  };
}
function oneOf(...patterns) {
  return function _oneOf(data, root, path2) {
    for (let pattern of patterns) {
      if (!fails(data, pattern, root, path2)) {
        return false;
      }
    }
    return error("data does not match oneOf patterns", data, patterns, path2);
  };
}
function anyOf(...patterns) {
  return function _anyOf(data, root, path2) {
    if (!Array.isArray(data)) {
      return error("data is not an array", data, "anyOf", path2);
    }
    for (let [index, value] of data.entries()) {
      let itemPath = appendPath(path2, index);
      if (oneOf(...patterns)(value, root, itemPath)) {
        return error("data does not match anyOf patterns", value, patterns, itemPath);
      }
    }
    return false;
  };
}
function allOf(...patterns) {
  return function _allOf(data, root, path2) {
    let problems = [];
    for (let pattern of patterns) {
      problems = problems.concat(fails(data, pattern, root, path2));
    }
    problems = problems.filter(Boolean);
    if (problems.length) {
      return error("data does not match all given patterns", data, patterns, path2, problems);
    }
  };
}
function validURL(data, root, path2) {
  try {
    if (data instanceof URL) {
      data = data.href;
    }
    let url3 = new URL(data);
    if (url3.href != data) {
      if (!(url3.href + "/" == data || url3.href == data + "/")) {
        return error("data is not a valid url", data, "validURL", path2);
      }
    }
  } catch (e) {
    return error("data is not a valid url", data, "validURL", path2);
  }
}
function validEmail(data, root, path2) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
    return error("data is not a valid email", data, "validEmail", path2);
  }
}
function instanceOf(constructor) {
  return function _instanceOf(data, root, path2) {
    if (!(data instanceof constructor)) {
      return error("data is not an instanceof pattern", data, constructor, path2);
    }
  };
}
function not(pattern) {
  return function _not(data, root, path2) {
    if (!fails(data, pattern, root, path2)) {
      return error("data matches pattern, when required not to", data, pattern, path2);
    }
  };
}
function issues(data, pattern, root) {
  let problems = fails(data, pattern, root);
  if (!problems) {
    return false;
  }
  return problemsToIssues(problems);
}
function fails(data, pattern, root, path2 = "") {
  if (typeof root == "undefined") {
    root = data;
  }
  let problems = [];
  if (pattern === Boolean) {
    if (typeof data != "boolean" && !(data instanceof Boolean)) {
      problems.push(error("data is not a boolean", data, pattern, path2));
    }
  } else if (pattern === Number) {
    if (typeof data != "number" && !(data instanceof Number)) {
      problems.push(error("data is not a number", data, pattern, path2));
    }
  } else if (pattern === String) {
    if (typeof data != "string" && !(data instanceof String)) {
      problems.push(error("data is not a string", data, pattern, path2));
    }
    if (data == "") {
      problems.push(error("data is an empty string, which is not allowed", data, pattern, path2));
    }
  } else if (pattern instanceof RegExp) {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails(element2, pattern, root, appendPath(path2, index2)));
      if (index > -1) {
        problems.push(error("data[" + index + "] does not match pattern", data[index], pattern, appendPath(path2, index)));
      }
    } else if (typeof data == "undefined") {
      problems.push(error("data is undefined, should match pattern", data, pattern, path2));
    } else if (!pattern.test(data)) {
      problems.push(error("data does not match pattern", data, pattern, path2));
    }
  } else if (pattern instanceof Function) {
    let problem = pattern(data, root, path2);
    if (problem) {
      if (Array.isArray(problem)) {
        problems = problems.concat(problem);
      } else {
        problems.push(problem);
      }
    }
  } else if (Array.isArray(pattern)) {
    if (!Array.isArray(data)) {
      problems.push(error("data is not an array", data, [], path2));
    } else {
      for (let p of pattern) {
        for (let index of data.keys()) {
          let problem = fails(data[index], p, root, appendPath(path2, index));
          if (Array.isArray(problem)) {
            problems = problems.concat(problem);
          } else if (problem) {
            problems.push(problem);
          }
        }
      }
    }
  } else if (pattern && typeof pattern == "object") {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails(element2, pattern, root, appendPath(path2, index2)));
      if (index > -1) {
        problems.push(error("data[" + index + "] does not match pattern", data[index], pattern, appendPath(path2, index)));
      }
    } else if (!data || typeof data != "object") {
      problems.push(error("data is not an object, pattern is", data, pattern, path2));
    } else {
      if (data instanceof URLSearchParams) {
        data = Object.fromEntries(data);
      }
      if (pattern instanceof Function) {
        let result = fails(data, pattern, root, path2);
        if (result) {
          problems = problems.concat(result);
        }
      } else {
        for (const [patternKey, subpattern] of Object.entries(pattern)) {
          let result = fails(data[patternKey], subpattern, root, appendPath(path2, patternKey));
          if (result) {
            problems = problems.concat(result);
          }
        }
      }
    }
  } else {
    if (pattern != data) {
      problems.push(error("data and pattern are not equal", data, pattern, path2));
    }
  }
  if (problems.length) {
    return problems;
  }
  return false;
}
function error(message, found, expected, path2 = "", problems) {
  let pathParts = pathToArray(path2);
  let result = {
    path: path2,
    pathString: pathToString(pathParts),
    pathParts,
    message,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn(message, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message, pattern, data);
}

// node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assert = { ...assert_core_exports };

// ../solid-tools/packages/lading/src/headers.mjs
var BASIC_CONTAINER = "http://www.w3.org/ns/ldp#BasicContainer";
function headersObject(headers = {}) {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (typeof headers.entries === "function" && typeof headers.get === "function") {
    return Object.fromEntries(headers.entries());
  }
  return { ...headers };
}
function getHeader(headers, name) {
  if (!headers) {
    return null;
  }
  if (typeof headers.get === "function") {
    return headers.get(name);
  }
  const wanted = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted);
  return entry ? entry[1] : null;
}
function mergeHeaders(...parts) {
  return parts.reduce((merged, part) => ({ ...merged, ...headersObject(part) }), {});
}
function solidRequestHeaders(options = {}) {
  const headers = headersObject(options.headers);
  if (options.accept) {
    headers.Accept = options.accept;
  }
  if (options.contentType || options.type) {
    headers["Content-Type"] = options.contentType ?? options.type;
  }
  if (options.slug) {
    headers.Slug = options.slug;
  }
  if (options.ifMatch) {
    headers["If-Match"] = options.ifMatch;
  }
  if (options.ifNoneMatch) {
    headers["If-None-Match"] = options.ifNoneMatch;
  }
  if (options.etag && !headers["If-Match"]) {
    headers["If-Match"] = options.etag;
  }
  return headers;
}
function containerLinkHeader(type = BASIC_CONTAINER) {
  return `<${type}>; rel="type"`;
}
function containerHeaders(options = {}) {
  return solidRequestHeaders({
    ...options,
    headers: mergeHeaders({ Link: containerLinkHeader(options.containerType) }, options.headers)
  });
}
function getLocation(response3) {
  return getHeader(response3?.headers, "Location");
}
function getETag(response3) {
  return getHeader(response3?.headers, "ETag");
}

// ../solid-tools/packages/lading/src/client.mjs
var metro2 = null;
try {
  const imported = await Promise.resolve().then(() => (init_src7(), src_exports6));
  metro2 = imported.default ?? imported;
} catch {
  metro2 = null;
}
var LINKED_DATA_ACCEPT = "text/turtle, application/ld+json;q=0.9, */*;q=0.1";
var CONTAINER_ACCEPT = "text/turtle, application/ld+json;q=0.9, */*;q=0.1";
function ensureSlash(url3) {
  return String(url3).endsWith("/") ? String(url3) : `${url3}/`;
}
function values(value) {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
function ids(value) {
  return values(value).map((item) => typeof item === "string" ? item : item?.id).filter(Boolean);
}
function unique(items) {
  return [...new Set(items)];
}
function storageUrlsFromProfile(profile) {
  if (!profile) {
    return [];
  }
  return unique([
    ...ids(profile.space$storage),
    ...ids(profile.pim$storage),
    ...ids(profile.solid$storage)
  ].map(ensureSlash));
}
function storageFromProfile(profile, options = {}) {
  return storageUrlsFromProfile(profile).map((url3) => ({
    profile,
    response: options.response ?? null,
    id: url3,
    url: url3
  }));
}
function throwerFactory(options = {}) {
  if (options.thrower === false) {
    return null;
  }
  if (typeof options.thrower === "function") {
    return options.thrower;
  }
  return metro2?.mw?.thrower ?? null;
}
function withThrower(client3, options = {}) {
  const createThrower = throwerFactory(options);
  if (!createThrower || !client3 || typeof client3.with !== "function") {
    return client3;
  }
  return client3.with(createThrower(options.thrower));
}
function bodyOptions(body, options = {}) {
  return {
    ...options,
    body,
    headers: solidRequestHeaders(options)
  };
}
function requestOptions(options = {}) {
  return {
    ...options,
    headers: solidRequestHeaders(options)
  };
}
function safeCreateOptions(options = {}) {
  if (Object.hasOwn(options, "ifNoneMatch")) {
    return options;
  }
  return {
    ...options,
    ifNoneMatch: "*"
  };
}
var LadingClient = class {
  constructor(metroClient, options = {}) {
    if (!metroClient) {
      throw new TypeError("lading: metro client is required");
    }
    this.metro = withThrower(metroClient, options);
    this.options = options;
  }
  resource(url3) {
    return new SolidResource(this, url3);
  }
  container(url3) {
    return new SolidContainer(this, url3);
  }
  async discoverProfile(webId, options = {}) {
    const response3 = await this.resource(webId).get({
      accept: LINKED_DATA_ACCEPT,
      ...options
    });
    return {
      response: response3,
      profile: response3?.data?.primary ?? null
    };
  }
  async discoverStorage(webId, options = {}) {
    const { profile, response: response3 } = await this.discoverProfile(webId, options);
    return storageFromProfile(profile, { response: response3 });
  }
  async discoverWebId(webId, options = {}) {
    const { profile, response: response3 } = await this.discoverProfile(webId, options);
    if (!profile) {
      return { webId, profile: null, storage: [], issuer: null, inbox: null, response: response3 };
    }
    return {
      webId,
      profile,
      storage: storageUrlsFromProfile(profile),
      issuer: ids(profile.solid$oidcIssuer)[0] ?? null,
      inbox: ids(profile.ldp$inbox)[0] ?? null,
      response: response3
    };
  }
  storageFromProfile(profile, options = {}) {
    return storageFromProfile(profile, options);
  }
};
var SolidResource = class {
  constructor(client3, url3) {
    this.client = client3;
    this.url = String(url3);
  }
  get(options = {}) {
    return this.client.metro.get(this.url, requestOptions(options));
  }
  head(options = {}) {
    return this.client.metro.head(this.url, requestOptions(options));
  }
  put(body, options = {}) {
    return this.client.metro.put(this.url, bodyOptions(body, options));
  }
  create(body, options = {}) {
    return this.put(body, safeCreateOptions(options));
  }
  patch(body, options = {}) {
    return this.client.metro.patch(this.url, bodyOptions(body, options));
  }
  delete(options = {}) {
    return this.client.metro.delete(this.url, requestOptions(options));
  }
};
var SolidContainer = class extends SolidResource {
  constructor(client3, url3) {
    super(client3, ensureSlash(url3));
  }
  get(options = {}) {
    return this.client.metro.get(this.url, requestOptions({
      accept: CONTAINER_ACCEPT,
      ...options
    }));
  }
  create(options = {}) {
    const createOptions = safeCreateOptions(options);
    return this.client.metro.put(this.url, bodyOptions(createOptions.body ?? "", {
      ...createOptions,
      headers: containerHeaders(createOptions)
    }));
  }
  async post(body, options = {}) {
    const response3 = await this.client.metro.post(this.url, bodyOptions(body, options));
    return {
      response: response3,
      location: getLocation(response3),
      etag: getETag(response3)
    };
  }
  async contains(options = {}) {
    const response3 = await this.get(options);
    const contains = values(response3?.data?.primary?.ldp$contains);
    return contains.map((resource) => {
      const id2 = typeof resource === "string" ? resource : resource?.id;
      return id2 ? { id: id2, url: id2, resource, response: response3 } : null;
    }).filter(Boolean);
  }
};
function lading(metroClient, options = {}) {
  return new LadingClient(metroClient, options);
}

// ../solid-tools/packages/jsfs-solid/src/metro.mjs
init_src7();

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/metro.mjs
var metro_exports = {};
__export(metro_exports, {
  Client: () => Client2,
  client: () => client2,
  deepClone: () => deepClone2,
  formdata: () => formdata2,
  metroError: () => metroError2,
  request: () => request2,
  response: () => response2,
  trace: () => trace2,
  url: () => url2
});
var metroURL3 = "https://metro.muze.nl/details/";
if (!Symbol.metroProxy) {
  Symbol.metroProxy = Symbol("isProxy");
}
if (!Symbol.metroSource) {
  Symbol.metroSource = Symbol("source");
}
var Client2 = class _Client {
  clientOptions = {
    url: typeof window != "undefined" ? url2(window.location) : url2("https://localhost"),
    verbs: ["get", "post", "put", "delete", "patch", "head", "options", "query"]
  };
  static tracers = {};
  /**
   * @typedef {Object} ClientOptions
   * @property {Array} middlewares - list of middleware functions
   * @property {string|URL} url - default url of the client
   * @property {[string]} verbs - a list of verb methods to expose, e.g. ['get','post']
   * 
   * Constructs a new metro client. Can have any number of params.
   * @params {ClientOptions|URL|Function|Client}
   * @returns {Client} - A metro client object with given or default verb methods
   */
  constructor(...options) {
    for (let option of options) {
      if (typeof option == "string" || option instanceof String) {
        this.clientOptions.url = url2(this.clientOptions.url.href, option);
      } else if (option instanceof _Client) {
        Object.assign(this.clientOptions, option.clientOptions);
      } else if (option instanceof Function) {
        this.#addMiddlewares([option]);
      } else if (option && typeof option == "object") {
        for (let param in option) {
          if (param == "middlewares") {
            this.#addMiddlewares(option[param]);
          } else if (param == "url") {
            this.clientOptions.url = url2(this.clientOptions.url.href, option[param]);
          } else if (typeof option[param] == "function") {
            this.clientOptions[param] = option[param](this.clientOptions[param], this.clientOptions);
          } else {
            this.clientOptions[param] = option[param];
          }
        }
      }
    }
    for (const verb of this.clientOptions.verbs) {
      this[verb] = async function(...options2) {
        return this.fetch(request2(
          this.clientOptions,
          ...options2,
          { method: verb.toUpperCase() }
        ));
      };
    }
  }
  #addMiddlewares(middlewares) {
    if (typeof middlewares == "function") {
      middlewares = [middlewares];
    }
    let index = middlewares.findIndex((m) => typeof m != "function");
    if (index >= 0) {
      throw metroError2("metro.client: middlewares must be a function or an array of functions " + metroURL3 + "client/invalid-middlewares/", middlewares[index]);
    }
    if (!Array.isArray(this.clientOptions.middlewares)) {
      this.clientOptions.middlewares = [];
    }
    this.clientOptions.middlewares = this.clientOptions.middlewares.concat(middlewares);
  }
  /**
   * Mimics the standard browser fetch method, but uses any middleware installed through
   * the constructor.
   * @param {Request|string|Object} - Required. The URL or Request object, accepts all types that are accepted by metro.request
   * @param {Object} - Optional. Any object that is accepted by metro.request
   * @return {Promise<Response|*>} - The metro.response to this request, or any other result as changed by any included middleware.
   */
  fetch(req, options) {
    req = request2(req, options);
    if (!req.url) {
      throw metroError2("metro.client." + req.method.toLowerCase() + ": Missing url parameter " + metroURL3 + "client/fetch-missing-url/", req);
    }
    if (!options) {
      options = {};
    }
    if (!(typeof options === "object") || options instanceof String) {
      throw metroError2("metro.client.fetch: Invalid options parameter " + metroURL3 + "client/fetch-invalid-options/", options);
    }
    const metrofetch = async function browserFetch(req2) {
      if (req2[Symbol.metroProxy]) {
        req2 = req2[Symbol.metroSource];
      }
      const res = await fetch(req2);
      return response2(res);
    };
    let middlewares = [metrofetch].concat(this.clientOptions?.middlewares?.slice() || []);
    options = Object.assign({}, this.clientOptions, options);
    let next;
    for (let middleware of middlewares) {
      next = /* @__PURE__ */ (function(next2, middleware2) {
        return async function(req2) {
          let res;
          let tracers2 = Object.values(_Client.tracers);
          for (let tracer of tracers2) {
            if (tracer.request) {
              tracer.request.call(tracer, req2, middleware2);
            }
          }
          res = await middleware2(req2, next2);
          for (let tracer of tracers2) {
            if (tracer.response) {
              tracer.response.call(tracer, res, middleware2);
            }
          }
          return res;
        };
      })(next, middleware);
    }
    return next(req);
  }
  with(...options) {
    return new _Client(deepClone2(this.clientOptions), ...options);
  }
  get location() {
    return this.clientOptions.url;
  }
};
function client2(...options) {
  return new Client2(...deepClone2(options));
}
function getRequestParams2(req, current) {
  let params = current || {};
  if (!params.url && current.url) {
    params.url = current.url;
  }
  for (let prop of [
    "method",
    "headers",
    "body",
    "mode",
    "credentials",
    "cache",
    "redirect",
    "referrer",
    "referrerPolicy",
    "integrity",
    "keepalive",
    "signal",
    "priority",
    "url"
  ]) {
    let value = req[prop];
    if (typeof value == "undefined" || value == null) {
      continue;
    }
    if (value?.[Symbol.metroProxy]) {
      value = value[Symbol.metroSource];
    }
    if (typeof value == "function") {
      params[prop] = value(params[prop], params);
    } else {
      if (prop == "url") {
        params.url = url2(params.url, value);
      } else if (prop == "headers") {
        params.headers = new Headers(current.headers);
        if (!(value instanceof Headers)) {
          value = new Headers(req.headers);
        }
        for (let [key, val] of value.entries()) {
          params.headers.set(key, val);
        }
      } else {
        params[prop] = value;
      }
    }
  }
  if (req instanceof Request && req.data) {
    params.body = req.data;
  }
  return params;
}
function request2(...options) {
  let requestParams = {
    url: typeof window != "undefined" ? url2(window.location) : url2("https://localhost/"),
    duplex: "half"
    // required when setting body to ReadableStream, just set it here by default already
  };
  for (let option of options) {
    if (typeof option == "string" || option instanceof URL || option instanceof URLSearchParams) {
      requestParams.url = url2(requestParams.url, option);
    } else if (option && (option instanceof FormData || option instanceof ReadableStream || option instanceof Blob || option instanceof ArrayBuffer || option instanceof DataView)) {
      requestParams.body = option;
    } else if (option && typeof option == "object") {
      Object.assign(requestParams, getRequestParams2(option, requestParams));
    }
  }
  let r = new Request(requestParams.url, requestParams);
  let data = requestParams.body;
  if (data) {
    if (typeof data == "object" && !(data instanceof String) && !(data instanceof ReadableStream) && !(data instanceof Blob) && !(data instanceof ArrayBuffer) && !(data instanceof DataView) && !(data instanceof FormData) && !(data instanceof URLSearchParams) && (typeof globalThis.TypedArray == "undefined" || !(data instanceof globalThis.TypedArray))) {
      if (typeof data.toString == "function") {
        requestParams.body = data.toString({ headers: r.headers });
        r = new Request(requestParams.url, requestParams);
      }
    }
  }
  Object.freeze(r);
  return new Proxy(r, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroSource:
          result = target;
          break;
        case Symbol.metroProxy:
          result = true;
          break;
        case "with":
          result = function(...options2) {
            if (data) {
              options2.unshift({ body: data });
            }
            return request2(target, ...options2);
          };
          break;
        case "data":
          result = data;
          break;
        default:
          if (target[prop] instanceof Function) {
            if (prop === "clone") {
            }
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function getResponseParams2(res, current) {
  let params = current || {};
  if (!params.url && current.url) {
    params.url = current.url;
  }
  for (let prop of ["status", "statusText", "headers", "body", "url", "type", "redirected"]) {
    let value = res[prop];
    if (typeof value == "undefined" || value == null) {
      continue;
    }
    if (value?.[Symbol.metroProxy]) {
      value = value[Symbol.metroSource];
    }
    if (typeof value == "function") {
      params[prop] = value(params[prop], params);
    } else {
      if (prop == "url") {
        params.url = new URL(value, params.url || "https://localhost/");
      } else {
        params[prop] = value;
      }
    }
  }
  if (res instanceof Response && res.data) {
    params.body = res.data;
  }
  return params;
}
function response2(...options) {
  let responseParams = {};
  for (let option of options) {
    if (typeof option == "string") {
      responseParams.body = option;
    } else if (option instanceof Response) {
      Object.assign(responseParams, getResponseParams2(option, responseParams));
    } else if (option && typeof option == "object") {
      if (option instanceof FormData || option instanceof Blob || option instanceof ArrayBuffer || option instanceof DataView || option instanceof ReadableStream || option instanceof URLSearchParams || option instanceof String || typeof globalThis.TypedArray != "undefined" && option instanceof globalThis.TypedArray) {
        responseParams.body = option;
      } else {
        Object.assign(responseParams, getResponseParams2(option, responseParams));
      }
    }
  }
  let data = void 0;
  if (responseParams.body) {
    data = responseParams.body;
  }
  if ([101, 204, 205, 304].includes(responseParams.status)) {
    responseParams.body = null;
  }
  let r = new Response(responseParams.body, responseParams);
  Object.freeze(r);
  return new Proxy(r, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        case "with":
          result = function(...options2) {
            return response2(target, ...options2);
          };
          break;
        case "data":
          result = data;
          break;
        case "ok":
          result = target.status >= 200 && target.status < 400;
          break;
        default:
          if (typeof target[prop] == "function") {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function appendSearchParams2(url3, params) {
  if (typeof params == "function") {
    params(url3.searchParams, url3);
  } else {
    params = new URLSearchParams(params);
    params.forEach((value, key) => {
      url3.searchParams.append(key, value);
    });
  }
}
function url2(...options) {
  let validParams = [
    "hash",
    "host",
    "hostname",
    "href",
    "password",
    "pathname",
    "port",
    "protocol",
    "username",
    "search",
    "searchParams"
  ];
  let u = new URL("https://localhost/");
  for (let option of options) {
    if (typeof option == "string" || option instanceof String) {
      u = new URL(option, u);
    } else if (option instanceof URL || typeof Location != "undefined" && option instanceof Location) {
      u = new URL(option);
    } else if (option instanceof URLSearchParams) {
      appendSearchParams2(u, option);
    } else if (option && typeof option == "object") {
      for (let param in option) {
        switch (param) {
          case "search":
            if (typeof option.search == "function") {
              option.search(u.search, u);
            } else {
              u.search = new URLSearchParams(option.search);
            }
            break;
          case "searchParams":
            appendSearchParams2(u, option.searchParams);
            break;
          default:
            if (!validParams.includes(param)) {
              throw metroError2("metro.url: unknown url parameter " + metroURL3 + "url/unknown-param-name/", param);
            }
            if (typeof option[param] == "function") {
              option[param](u[param], u);
            } else if (typeof option[param] == "string" || option[param] instanceof String || typeof option[param] == "number" || option[param] instanceof Number || typeof option[param] == "boolean" || option[param] instanceof Boolean) {
              u[param] = "" + option[param];
            } else if (typeof option[param] == "object" && option[param].toString) {
              u[param] = option[param].toString();
            } else {
              throw metroError2("metro.url: unsupported value for " + param + " " + metroURL3 + "url/unsupported-param-value/", options[param]);
            }
            break;
        }
      }
    } else {
      throw metroError2("metro.url: unsupported option value " + metroURL3 + "url/unsupported-option-value/", option);
    }
  }
  Object.freeze(u);
  return new Proxy(u, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        case "with":
          result = function(...options2) {
            return url2(target, ...options2);
          };
          break;
        case "filename":
          result = target.pathname.split("/").pop();
          break;
        case "folderpath":
          result = target.pathname.substring(0, target.pathname.lastIndexOf("\\") + 1);
          break;
        case "authority":
          result = target.username ?? "";
          result += target.password ? ":" + target.password : "";
          result += result ? "@" : "";
          result += target.hostname;
          result += target.port ? ":" + target.port : "";
          result += "/";
          result = target.protocol + "//" + result;
          break;
        case "origin":
          result = target.protocol + "//" + target.hostname;
          result += target.port ? ":" + target.port : "";
          result += "/";
          break;
        case "fragment":
          result = target.hash.substring(1);
          break;
        case "scheme":
          if (target.protocol) {
            result = target.protocol.substring(0, target.protocol.length - 1);
          } else {
            result = "";
          }
          break;
        default:
          if (target[prop] instanceof Function) {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
function formdata2(...options) {
  var params = new FormData();
  for (let option of options) {
    if (option instanceof HTMLFormElement) {
      option = new FormData(option);
    }
    if (option instanceof FormData) {
      for (let entry of option.entries()) {
        params.append(entry[0], entry[1]);
      }
    } else if (option && typeof option == "object") {
      for (let entry of Object.entries(option)) {
        if (Array.isArray(entry[1])) {
          for (let value of entry[1]) {
            params.append(entry[0], value);
          }
        } else {
          params.append(entry[0], entry[1]);
        }
      }
    } else {
      throw new metroError2("metro.formdata: unknown option type " + metroURL3 + "formdata/unknown-option-value/", option);
    }
  }
  Object.freeze(params);
  return new Proxy(params, {
    get(target, prop) {
      let result;
      switch (prop) {
        case Symbol.metroProxy:
          result = true;
          break;
        case Symbol.metroSource:
          result = target;
          break;
        //TODO: add toString() that can check
        //headers param: toString({headers:request.headers})
        //for the content-type
        case "with":
          result = function(...options2) {
            return formdata2(target, ...options2);
          };
          break;
        default:
          if (target[prop] instanceof Function) {
            result = target[prop].bind(target);
          } else {
            result = target[prop];
          }
          break;
      }
      return result;
    }
  });
}
var metroConsole3 = {
  error: (message, ...details) => {
    console.error("\u24C2\uFE0F  ", message, ...details);
  },
  info: (message, ...details) => {
    console.info("\u24C2\uFE0F  ", message, ...details);
  },
  group: (name) => {
    console.group("\u24C2\uFE0F  " + name);
  },
  groupEnd: (name) => {
    console.groupEnd("\u24C2\uFE0F  " + name);
  }
};
function metroError2(message, ...details) {
  metroConsole3.error(message, ...details);
  return new Error(message, ...details);
}
var trace2 = {
  /**
   * Adds a named tracer function
   * @param {string} name - the name of the tracer
   * @param {Function} tracer - the tracer function to call
   */
  add(name, tracer) {
    Client2.tracers[name] = tracer;
  },
  /**
   * Removes a named tracer function
   * @param {string} name
   */
  delete(name) {
    delete Client2.tracers[name];
  },
  /**
   * Removes all tracer functions
   */
  clear() {
    Client2.tracers = {};
  },
  /**
   * Returns a set of request and response tracer functions that use the
   * console.group feature to shows nested request/response pairs, with
   * most commonly needed information for debugging
   */
  group() {
    let group2 = 0;
    return {
      request: (req, middleware) => {
        group2++;
        metroConsole3.group(group2);
        metroConsole3.info(req?.url, req, middleware);
      },
      response: (res, middleware) => {
        metroConsole3.info(res?.body ? res.body[Symbol.metroSource] : null, res, middleware);
        metroConsole3.groupEnd(group2);
        group2--;
      }
    };
  }
};
function deepClone2(object) {
  if (Array.isArray(object)) {
    return object.slice().map(deepClone2);
  }
  if (object && typeof object === "object") {
    if (object.__proto__.constructor == Object || !object.__proto__) {
      let result = Object.assign({}, object);
      Object.keys(result).forEach((key) => {
        result[key] = deepClone2(object[key]);
      });
      return result;
    } else {
      return object;
    }
  }
  return object;
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/mw/json.mjs
function jsonmw2(options) {
  options = Object.assign({
    contentType: "application/json",
    reviver: null,
    replacer: null,
    space: ""
  }, options);
  return async function json(req, next) {
    if (!req.headers.get("Accept")) {
      req = req.with({
        headers: {
          "Accept": options.accept ?? options.contentType
        }
      });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.data && typeof req.data == "object" && !(req.data instanceof ReadableStream)) {
        const contentType = req.headers.get("Content-Type");
        if (!contentType || isPlainText2(contentType)) {
          req = req.with({
            headers: {
              "Content-Type": options.contentType
            }
          });
        }
        if (isJSON2(req.headers.get("Content-Type"))) {
          req = req.with({
            body: JSON.stringify(req.data, options.replacer, options.space)
          });
        }
      }
    }
    let res = await next(req);
    if (res && isJSON2(res.headers?.get("Content-Type"))) {
      let tempRes = res.clone();
      let body = await tempRes.text();
      try {
        let json2 = JSON.parse(body, options.reviver);
        return res.with({
          body: json2
        });
      } catch (e) {
      }
    }
    return res;
  };
}
var jsonRE2 = /^application\/([a-zA-Z0-9\-_]+\+)?json\b/;
function isJSON2(contentType) {
  return jsonRE2.exec(contentType);
}
function isPlainText2(contentType) {
  return /^text\/plain\b/.exec(contentType);
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/mw/thrower.mjs
function throwermw2(options) {
  return async function thrower(req, next) {
    let res = await next(req);
    if (!res.ok) {
      if (options && typeof options[res.status] == "function") {
        res = options[res.status].apply(res, req);
      } else {
        throw new Error(res.status + ": " + res.statusText, {
          cause: res
        });
      }
    }
    return res;
  };
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/mw/getdata.mjs
function getdatamw2() {
  return async function getdata(req, next) {
    let res = await next(req);
    if (res.ok && res.data) {
      return res.data;
    }
    return res;
  };
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/api.mjs
var API2 = class extends Client2 {
  #methods = null;
  #base = "";
  constructor(base, methods, bind2 = null) {
    if (base instanceof Client2) {
      super(base.clientOptions, throwermw2(), getdatamw2());
    } else {
      super(base, throwermw2(), getdatamw2());
    }
    if (!bind2) {
      bind2 = this;
    }
    this.#methods = methods;
    this.#base = base;
    for (const methodName in methods) {
      if (typeof methods[methodName] == "function") {
        this[methodName] = methods[methodName].bind(bind2);
      } else if (methods[methodName] && typeof methods[methodName] == "object" && (Object.getPrototypeOf(methods[methodName]) === null || Object.getPrototypeOf(methods[methodName]).constructor === Object)) {
        this[methodName] = new this.constructor(base, methods[methodName], bind2);
      } else {
        this[methodName] = methods[methodName];
      }
    }
  }
  extend(methods) {
    return new this.constructor(this.#base, Object.assign({}, this.#methods, methods));
  }
};
var JsonAPI2 = class extends API2 {
  constructor(base, methods, bind2 = null) {
    if (base instanceof Client2) {
      super(base.with(jsonmw2()), methods, bind2);
    } else {
      super(client2(base, jsonmw2()), methods, bind2);
    }
  }
};
function api2(...options) {
  return new API2(...deepClone2(options));
}
function jsonApi2(...options) {
  return new JsonAPI2(...deepClone2(options));
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/metro/src/everything.mjs
var metro3 = Object.assign({}, metro_exports, {
  mw: {
    json: jsonmw2,
    thrower: throwermw2,
    getdata: getdatamw2
  },
  api: api2,
  jsonApi: jsonApi2
});
if (!globalThis.metro) {
  globalThis.metro = metro3;
}
var everything_default = metro3;

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.mjs
var oauth2_exports = {};
__export(oauth2_exports, {
  base64url_encode: () => base64url_encode,
  createState: () => createState,
  default: () => oauth2mw,
  generateCodeChallenge: () => generateCodeChallenge,
  generateCodeVerifier: () => generateCodeVerifier,
  getExpires: () => getExpires,
  isAuthorized: () => isAuthorized,
  isExpired: () => isExpired,
  isRedirected: () => isRedirected,
  parseBearerChallenge: () => parseBearerChallenge
});
init_src();

// ../solid-tools/node_modules/@muze-nl/assert/src/assert-core.mjs
var assert_core_exports2 = {};
__export(assert_core_exports2, {
  Optional: () => Optional2,
  Recommended: () => Recommended2,
  Required: () => Required2,
  allOf: () => allOf2,
  anyOf: () => anyOf2,
  assert: () => assert2,
  disable: () => disable2,
  enable: () => enable2,
  error: () => error2,
  fails: () => fails2,
  formatIssue: () => formatIssue2,
  formatIssues: () => formatIssues2,
  instanceOf: () => instanceOf2,
  issues: () => issues2,
  not: () => not2,
  oneOf: () => oneOf2,
  validEmail: () => validEmail2,
  validURL: () => validURL2,
  warn: () => warn2
});
var assertEnabled2 = false;
function enable2() {
  assertEnabled2 = true;
}
function disable2() {
  assertEnabled2 = false;
}
function appendPath2(path2 = "", key) {
  if (typeof path2 == "undefined" || path2 == null) {
    path2 = "";
  }
  if (typeof key == "number") {
    return `${path2}[${key}]`;
  }
  return `${path2}.${key}`;
}
function pathToArray2(path2 = "") {
  if (Array.isArray(path2)) {
    return path2;
  }
  if (!path2) {
    return [];
  }
  let result = [];
  let matcher = /(?:^|\.)([^.\[\]]+)|\[(\d+)\]/g;
  let match;
  while (match = matcher.exec(path2)) {
    if (typeof match[1] != "undefined") {
      result.push(match[1]);
    } else if (typeof match[2] != "undefined") {
      result.push(Number(match[2]));
    }
  }
  return result;
}
function pathToString2(path2 = []) {
  if (typeof path2 == "string") {
    return path2.startsWith(".") ? path2.slice(1) : path2;
  }
  return path2.map((part, index) => {
    if (typeof part == "number") {
      return `[${part}]`;
    }
    return `${index ? "." : ""}${part}`;
  }).join("");
}
function describeFunction2(value) {
  if (value === String) {
    return "string";
  }
  if (value === Number) {
    return "number";
  }
  if (value === Boolean) {
    return "boolean";
  }
  return value.name || "function";
}
function clip2(text, maxLength = 60) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + "\u2026";
}
function quoteString2(value) {
  return `'${clip2(String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n"))}'`;
}
function jsonSummary2(value) {
  try {
    let json = JSON.stringify(value);
    if (typeof json == "string") {
      return clip2(json);
    }
  } catch (e) {
  }
  let name = value?.constructor?.name;
  if (name && name != "Object") {
    return name;
  }
  return Object.prototype.toString.call(value);
}
function formatValue2(value) {
  if (typeof value == "string") {
    return quoteString2(value);
  }
  if (typeof value == "undefined") {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value == "function") {
    return describeFunction2(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (typeof value == "number" || typeof value == "boolean" || typeof value == "bigint") {
    return String(value);
  }
  if (typeof value == "symbol") {
    return value.toString();
  }
  return jsonSummary2(value);
}
function describeExpected2(value) {
  if (value === String || value === Number || value === Boolean) {
    return describeFunction2(value);
  }
  if (typeof value == "function") {
    return describeFunction2(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return "[" + value.map(describeExpected2).join(", ") + "]";
  }
  return formatValue2(value);
}
function describeOneOf2(patterns) {
  return patterns.map(describeExpected2).join(", ");
}
function conciseMessage2(message, actual, expected) {
  if (message == "data and pattern are not equal") {
    return `expected ${formatValue2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message == "data does not match pattern" || /^data\[\d+\] does not match pattern$/.test(message)) {
    return `expected ${describeExpected2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message == "data is undefined, should match pattern") {
    return `missing; expected ${describeExpected2(expected)}`;
  }
  if (message == "data is required") {
    return "required";
  }
  if (message == "data is an empty string, which is not allowed") {
    return "empty string is not allowed";
  }
  if (message == "data is not an object, pattern is") {
    return "data is not an object";
  }
  if (message == "data is not an instanceof pattern") {
    return `expected instance of ${describeExpected2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message == "data does not match oneOf patterns" || message == "data does not match anyOf patterns") {
    return `expected one of ${describeOneOf2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message == "data matches pattern, when required not to") {
    return `must not match ${describeExpected2(expected)}`;
  }
  return message;
}
function formatIssue2(issue, options = {}) {
  if (!issue || typeof issue != "object") {
    return String(issue);
  }
  let path2 = issue.pathString || pathToString2(issue.path || []) || "value";
  let indent = options.indent ?? "";
  return `${indent}${path2}: ${issue.message}`;
}
function formatIssues2(issues3, options = {}) {
  if (!issues3) {
    return false;
  }
  let indent = options.indent ?? "  - ";
  return (Array.isArray(issues3) ? issues3 : [issues3]).map((issue) => formatIssue2(issue, { ...options, indent }));
}
function issueFromProblem2(problem) {
  if (!problem || typeof problem != "object") {
    return {
      path: [],
      pathString: "",
      message: String(problem),
      expected: void 0,
      actual: void 0
    };
  }
  let path2 = pathToArray2(problem.path);
  let pathString = pathToString2(path2);
  let actual = problem.actual ?? problem.found;
  let expected = describeExpected2(problem.expected);
  let message = conciseMessage2(problem.message, actual, problem.expected);
  return {
    path: path2,
    pathString,
    message,
    expected,
    actual
  };
}
function problemsToIssues2(problems) {
  if (!problems) {
    return [];
  }
  let result = [];
  for (let problem of Array.isArray(problems) ? problems : [problems]) {
    if (!problem) {
      continue;
    }
    if (problem && typeof problem == "object" && problem.problems) {
      let nested = problemsToIssues2(problem.problems);
      if (nested.length) {
        result = result.concat(nested);
        continue;
      }
    }
    result.push(issueFromProblem2(problem));
  }
  return result;
}
function assert2(source, test) {
  if (assertEnabled2) {
    let problems = fails2(source, test);
    if (problems) {
      let assertionIssues = problemsToIssues2(problems);
      let formattedIssues = formatIssues2(assertionIssues);
      let message = "Assertions failed:\n" + formattedIssues.join("\n");
      console.error("\u{1F170}\uFE0F  " + message);
      throw new Error(message, {
        cause: { problems, issues: assertionIssues, source }
      });
    }
  }
}
function Optional2(pattern) {
  return function _Optional(data, root, path2) {
    if (typeof data != "undefined" && data != null && typeof pattern != "undefined") {
      return fails2(data, pattern, root, path2);
    }
  };
}
function Required2(pattern) {
  return function _Required(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      return error2("data is required", data, pattern || "any value", path2);
    } else if (typeof pattern != "undefined") {
      return fails2(data, pattern, root, path2);
    } else {
      return false;
    }
  };
}
function Recommended2(pattern) {
  return function _Recommended(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      warn2("data does not contain recommended value", data, pattern, path2);
      return false;
    } else {
      return fails2(data, pattern, root, path2);
    }
  };
}
function oneOf2(...patterns) {
  return function _oneOf(data, root, path2) {
    for (let pattern of patterns) {
      if (!fails2(data, pattern, root, path2)) {
        return false;
      }
    }
    return error2("data does not match oneOf patterns", data, patterns, path2);
  };
}
function anyOf2(...patterns) {
  return function _anyOf(data, root, path2) {
    if (!Array.isArray(data)) {
      return error2("data is not an array", data, "anyOf", path2);
    }
    for (let [index, value] of data.entries()) {
      let itemPath = appendPath2(path2, index);
      if (oneOf2(...patterns)(value, root, itemPath)) {
        return error2("data does not match anyOf patterns", value, patterns, itemPath);
      }
    }
    return false;
  };
}
function allOf2(...patterns) {
  return function _allOf(data, root, path2) {
    let problems = [];
    for (let pattern of patterns) {
      problems = problems.concat(fails2(data, pattern, root, path2));
    }
    problems = problems.filter(Boolean);
    if (problems.length) {
      return error2("data does not match all given patterns", data, patterns, path2, problems);
    }
  };
}
function validURL2(data, root, path2) {
  try {
    if (data instanceof URL) {
      data = data.href;
    }
    let url3 = new URL(data);
    if (url3.href != data) {
      if (!(url3.href + "/" == data || url3.href == data + "/")) {
        return error2("data is not a valid url", data, "validURL", path2);
      }
    }
  } catch (e) {
    return error2("data is not a valid url", data, "validURL", path2);
  }
}
function validEmail2(data, root, path2) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
    return error2("data is not a valid email", data, "validEmail", path2);
  }
}
function instanceOf2(constructor) {
  return function _instanceOf(data, root, path2) {
    if (!(data instanceof constructor)) {
      return error2("data is not an instanceof pattern", data, constructor, path2);
    }
  };
}
function not2(pattern) {
  return function _not(data, root, path2) {
    if (!fails2(data, pattern, root, path2)) {
      return error2("data matches pattern, when required not to", data, pattern, path2);
    }
  };
}
function issues2(data, pattern, root) {
  let problems = fails2(data, pattern, root);
  if (!problems) {
    return false;
  }
  return problemsToIssues2(problems);
}
function fails2(data, pattern, root, path2 = "") {
  if (typeof root == "undefined") {
    root = data;
  }
  let problems = [];
  if (pattern === Boolean) {
    if (typeof data != "boolean" && !(data instanceof Boolean)) {
      problems.push(error2("data is not a boolean", data, pattern, path2));
    }
  } else if (pattern === Number) {
    if (typeof data != "number" && !(data instanceof Number)) {
      problems.push(error2("data is not a number", data, pattern, path2));
    }
  } else if (pattern === String) {
    if (typeof data != "string" && !(data instanceof String)) {
      problems.push(error2("data is not a string", data, pattern, path2));
    }
    if (data == "") {
      problems.push(error2("data is an empty string, which is not allowed", data, pattern, path2));
    }
  } else if (pattern instanceof RegExp) {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails2(element2, pattern, root, appendPath2(path2, index2)));
      if (index > -1) {
        problems.push(error2("data[" + index + "] does not match pattern", data[index], pattern, appendPath2(path2, index)));
      }
    } else if (typeof data == "undefined") {
      problems.push(error2("data is undefined, should match pattern", data, pattern, path2));
    } else if (!pattern.test(data)) {
      problems.push(error2("data does not match pattern", data, pattern, path2));
    }
  } else if (pattern instanceof Function) {
    let problem = pattern(data, root, path2);
    if (problem) {
      if (Array.isArray(problem)) {
        problems = problems.concat(problem);
      } else {
        problems.push(problem);
      }
    }
  } else if (Array.isArray(pattern)) {
    if (!Array.isArray(data)) {
      problems.push(error2("data is not an array", data, [], path2));
    } else {
      for (let p of pattern) {
        for (let index of data.keys()) {
          let problem = fails2(data[index], p, root, appendPath2(path2, index));
          if (Array.isArray(problem)) {
            problems = problems.concat(problem);
          } else if (problem) {
            problems.push(problem);
          }
        }
      }
    }
  } else if (pattern && typeof pattern == "object") {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails2(element2, pattern, root, appendPath2(path2, index2)));
      if (index > -1) {
        problems.push(error2("data[" + index + "] does not match pattern", data[index], pattern, appendPath2(path2, index)));
      }
    } else if (!data || typeof data != "object") {
      problems.push(error2("data is not an object, pattern is", data, pattern, path2));
    } else {
      if (data instanceof URLSearchParams) {
        data = Object.fromEntries(data);
      }
      if (pattern instanceof Function) {
        let result = fails2(data, pattern, root, path2);
        if (result) {
          problems = problems.concat(result);
        }
      } else {
        for (const [patternKey, subpattern] of Object.entries(pattern)) {
          let result = fails2(data[patternKey], subpattern, root, appendPath2(path2, patternKey));
          if (result) {
            problems = problems.concat(result);
          }
        }
      }
    }
  } else {
    if (pattern != data) {
      problems.push(error2("data and pattern are not equal", data, pattern, path2));
    }
  }
  if (problems.length) {
    return problems;
  }
  return false;
}
function error2(message, found, expected, path2 = "", problems) {
  let pathParts = pathToArray2(path2);
  let result = {
    path: path2,
    pathString: pathToString2(pathParts),
    pathParts,
    message,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn2(message, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message, pattern, data);
}

// ../solid-tools/node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assert = { ...assert_core_exports2 };

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/tokenstore.mjs
function tokenStore(site) {
  let localState, localTokens;
  if (typeof localStorage !== "undefined") {
    localState = {
      get: () => localStorage.getItem("metro/state:" + site),
      set: (value) => localStorage.setItem("metro/state:" + site, value),
      has: () => localStorage.getItem("metro/state:" + site) !== null,
      delete: () => localStorage.removeItem("metro/state:" + site)
    };
    localTokens = {
      get: (name) => JSON.parse(localStorage.getItem(site + ":" + name)),
      set: (name, value) => localStorage.setItem(site + ":" + name, JSON.stringify(value)),
      has: (name) => localStorage.getItem(site + ":" + name) !== null,
      delete: (name) => localStorage.removeItem(site + ":" + name)
    };
  } else {
    let stateMap = /* @__PURE__ */ new Map();
    localState = {
      get: () => stateMap.get("metro/state:" + site),
      set: (value) => stateMap.set("metro/state:" + site, value),
      has: () => stateMap.has("metro/state:" + site),
      delete: () => stateMap.delete("metro/state:" + site)
    };
    localTokens = /* @__PURE__ */ new Map();
  }
  return {
    state: localState,
    tokens: localTokens
  };
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.mjs
var SUPPORTED_TOKEN_TYPES = /* @__PURE__ */ new Map([
  ["bearer", "Bearer"],
  ["dpop", "DPoP"]
]);
var SUPPORTED_TOKEN_ENDPOINT_AUTH_METHODS = /* @__PURE__ */ new Set([
  "none",
  "client_secret_post",
  "client_secret_basic"
]);
function oauth2mw(options) {
  const defaultOptions = {
    client: client(),
    force_authorization: false,
    site: "default",
    oauth2_configuration: {
      authorization_endpoint: "/authorize",
      token_endpoint: "/token",
      redirect_uri: globalThis.document?.location.href,
      grant_type: "authorization_code",
      code_verifier: generateCodeVerifier(64)
    },
    authorize_callback: async (url3) => {
      if (window.location.href != url3.href) {
        window.location.replace(url3.href);
      }
      return false;
    }
  };
  assert2(options, {});
  const oauth22 = Object.assign({}, defaultOptions.oauth2_configuration, options?.oauth2_configuration);
  options = Object.assign({}, defaultOptions, options);
  options.oauth2_configuration = oauth22;
  const store = tokenStore(options.site);
  if (!options.tokens) {
    options.tokens = store.tokens;
  }
  if (!options.state) {
    options.state = store.state;
  }
  assert2(options, {
    oauth2_configuration: {
      client_id: Required2(/.+/),
      grant_type: "authorization_code",
      authorization_endpoint: Required2(validURL2),
      token_endpoint: Required2(validURL2),
      redirect_uri: Required2(validURL2)
    }
  });
  for (let option in oauth22) {
    switch (option) {
      case "access_token":
      case "authorization_code":
      case "refresh_token":
        options.tokens.set(option, normalizeInitialToken(option, oauth22[option]));
        break;
    }
  }
  return async function(req, next) {
    if (options.force_authorization) {
      return oauth2authorized(req, next);
    }
    const res = await next(req);
    if (res.ok || !shouldAuthorizeResponse(res)) {
      return res;
    }
    return oauth2authorized(req, next);
  };
  async function oauth2authorized(req, next, retryState = {}) {
    getTokensFromLocation();
    const accessToken = options.tokens.get("access_token");
    const refreshToken = options.tokens.get("refresh_token");
    const tokenIsExpired = isExpired(accessToken);
    if (!accessToken || tokenIsExpired && !refreshToken) {
      const token = await fetchAccessToken();
      if (!token) {
        return response("false");
      }
      return oauth2authorized(req, next);
    } else if (tokenIsExpired && refreshToken) {
      const token = await refreshAccessToken();
      if (!token) {
        return response("false");
      }
      return oauth2authorized(req, next);
    } else {
      const authorizedReq = request(req, {
        headers: {
          Authorization: accessToken.type + " " + accessToken.value
        }
      });
      const res = await next(authorizedReq);
      if (!shouldAuthorizeResponse(res) || retryState.handledRejectedToken) {
        return res;
      }
      options.tokens.delete("access_token");
      const token = refreshToken ? await refreshAccessToken() : await fetchAccessToken();
      if (!token) {
        return response("false");
      }
      return oauth2authorized(req, next, { handledRejectedToken: true });
    }
  }
  function getTokensFromLocation() {
    if (typeof window !== "undefined" && window?.location) {
      let url3 = url(window.location);
      let code, state, params;
      if (url3.searchParams.has("code") || url3.searchParams.has("error")) {
        params = url3.searchParams;
        url3 = url3.with({ search: "" });
        history.pushState({}, "", url3.href);
      } else if (url3.hash) {
        let query = url3.hash.substr(1);
        params = new URLSearchParams("?" + query);
        url3 = url3.with({ hash: "" });
        history.pushState({}, "", url3.href);
      }
      if (params) {
        if (params.has("error")) {
          throw metroError("oauth2mw: authorization failed: " + params.get("error") + (params.get("error_description") ? " (" + params.get("error_description") + ")" : ""));
        }
        code = params.get("code");
        state = params.get("state");
        validateState(state);
        if (code) {
          options.tokens.set("authorization_code", code);
        }
      }
    }
  }
  async function fetchAccessToken() {
    if (oauth22.grant_type === "authorization_code" && !options.tokens.has("authorization_code")) {
      let authReqURL = await getAuthorizationCodeURL();
      if (!options.authorize_callback || typeof options.authorize_callback !== "function") {
        throw metroError("oauth2mw: oauth2 with grant_type:authorization_code requires a callback function in client options.authorize_callback");
      }
      let authorization = await options.authorize_callback(authReqURL);
      if (authorization) {
        storeAuthorizationResult(authorization);
      } else {
        return false;
      }
    }
    let tokenReq = getAccessTokenRequest();
    let response3 = await options.client.post(tokenReq);
    if (!response3.ok) {
      let msg = await response3.text();
      throw metroError("OAuth2mw: fetch access_token: " + response3.status + ": " + response3.statusText + " (" + msg + ")", { cause: tokenReq });
    }
    let data = await response3.json();
    storeTokenResponse(data);
    options.tokens.delete("authorization_code");
    return data;
  }
  async function refreshAccessToken() {
    let refreshTokenReq = getAccessTokenRequest("refresh_token");
    let response3 = await options.client.post(refreshTokenReq);
    if (!response3.ok) {
      let msg = await response3.text();
      throw metroError("OAuth2mw: refresh access_token: " + response3.status + ": " + response3.statusText + " (" + msg + ")", { cause: refreshTokenReq });
    }
    let data = await response3.json();
    storeTokenResponse(data);
    return data;
  }
  async function getAuthorizationCodeURL() {
    if (!oauth22.authorization_endpoint) {
      throw metroError("oauth2mw: Missing options.oauth2_configuration.authorization_endpoint");
    }
    let url3 = url(oauth22.authorization_endpoint, { hash: "" });
    assert2(oauth22, {
      client_id: /.+/,
      redirect_uri: /.+/,
      scope: /.*/
    });
    let search = {
      response_type: "code",
      client_id: oauth22.client_id,
      redirect_uri: oauth22.redirect_uri,
      state: oauth22.state || createState(40)
    };
    if (oauth22.response_type) {
      search.response_type = oauth22.response_type;
    }
    if (oauth22.response_mode) {
      search.response_mode = oauth22.response_mode;
    }
    options.state.set(search.state);
    if (oauth22.code_verifier) {
      options.tokens.set("code_verifier", oauth22.code_verifier);
      search.code_challenge = await generateCodeChallenge(oauth22.code_verifier);
      search.code_challenge_method = "S256";
    }
    if (oauth22.scope) {
      search.scope = oauth22.scope;
    }
    if (oauth22.prompt) {
      search.prompt = oauth22.prompt;
    }
    if (oauth22.nonce) {
      search.nonce = oauth22.nonce;
    }
    return url(url3, { search });
  }
  function getAccessTokenRequest(grant_type = null) {
    assert2(oauth22, {
      client_id: /.+/,
      redirect_uri: /.+/
    });
    if (!oauth22.token_endpoint) {
      throw metroError("oauth2mw: Missing options.endpoints.token url");
    }
    let url3 = url(oauth22.token_endpoint, { hash: "" });
    let params = {
      grant_type: grant_type || oauth22.grant_type
    };
    let headers = {};
    applyTokenEndpointAuthentication(params, headers);
    if (oauth22.scope) {
      params.scope = oauth22.scope;
    }
    switch (params.grant_type) {
      case "authorization_code":
        params.redirect_uri = oauth22.redirect_uri;
        params.code = options.tokens.get("authorization_code");
        const code_verifier = options.tokens.get("code_verifier");
        if (code_verifier) {
          params.code_verifier = code_verifier;
        }
        break;
      case "client_credentials":
        break;
      case "refresh_token":
        params.refresh_token = tokenValue(options.tokens.get("refresh_token"));
        break;
      default:
        throw new Error("Unknown grant_type: " + params.grant_type);
        break;
    }
    return request(url3, { method: "POST", headers, body: new URLSearchParams(params) });
  }
  function applyTokenEndpointAuthentication(params, headers) {
    const method = tokenEndpointAuthMethod(oauth22);
    if (method === "none") {
      params.client_id = oauth22.client_id;
      return;
    }
    if (!oauth22.client_secret) {
      throw metroError("oauth2mw: token_endpoint_auth_method " + method + " requires oauth2_configuration.client_secret");
    }
    if (method === "client_secret_post") {
      params.client_id = oauth22.client_id;
      params.client_secret = oauth22.client_secret;
      return;
    }
    if (method === "client_secret_basic") {
      headers.Authorization = basicAuth(oauth22.client_id, oauth22.client_secret);
      return;
    }
  }
  function storeAuthorizationResult(authorization) {
    let code = authorization;
    if (authorization && typeof authorization === "object") {
      if (authorization.error) {
        throw metroError("oauth2mw: authorization failed: " + authorization.error);
      }
      validateState(authorization.state);
      code = authorization.authorization_code || authorization.code;
    }
    if (!code) {
      throw metroError("oauth2mw: authorization callback did not return an authorization code");
    }
    options.tokens.set("authorization_code", code);
  }
  function validateState(state) {
    let storedState = options.state.get();
    if (!state || state !== storedState) {
      throw metroError("oauth2mw: authorization state mismatch");
    }
  }
  function storeTokenResponse(data) {
    const token = validateTokenResponse(data);
    options.tokens.set("access_token", token);
    if (data.refresh_token) {
      options.tokens.set("refresh_token", { value: data.refresh_token });
    }
  }
}
function shouldAuthorizeResponse(res) {
  if (!res) {
    return false;
  }
  if (res.status === 400) {
    return true;
  }
  const challenge = parseBearerChallenge(res.headers?.get("WWW-Authenticate"));
  if (challenge?.error === "insufficient_scope") {
    return false;
  }
  return res.status === 401;
}
function normalizeInitialToken(name, token) {
  if (name === "access_token" && token && typeof token === "object") {
    return token;
  }
  if (name === "access_token") {
    return { value: token, type: "Bearer", expires: null };
  }
  if (name === "refresh_token" && token && typeof token === "object") {
    return token;
  }
  return token;
}
function validateTokenResponse(data) {
  if (!data || typeof data !== "object") {
    throw metroError("OAuth2mw: token endpoint did not return a JSON object");
  }
  if (!data.access_token) {
    throw metroError("OAuth2mw: token response did not include access_token");
  }
  if (!data.token_type) {
    throw metroError("OAuth2mw: token response did not include token_type");
  }
  const tokenType = normalizeTokenType(data.token_type);
  return {
    value: data.access_token,
    expires: data.expires_in === void 0 ? null : getExpires(data.expires_in),
    type: tokenType,
    scope: data.scope
  };
}
function normalizeTokenType(type) {
  const normalized = SUPPORTED_TOKEN_TYPES.get(String(type).toLowerCase());
  if (!normalized) {
    throw metroError("OAuth2mw: unsupported token_type " + type);
  }
  return normalized;
}
function tokenEndpointAuthMethod(oauth22) {
  const method = oauth22.token_endpoint_auth_method || (oauth22.client_secret ? "client_secret_post" : "none");
  if (!SUPPORTED_TOKEN_ENDPOINT_AUTH_METHODS.has(method)) {
    throw metroError("oauth2mw: unsupported token_endpoint_auth_method " + method);
  }
  return method;
}
function basicAuth(clientId, clientSecret) {
  const value = formEncode(clientId) + ":" + formEncode(clientSecret);
  return "Basic " + base64_encode(value);
}
function formEncode(value) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}
function base64_encode(value) {
  if (typeof btoa === "function") {
    return btoa(value);
  }
  return Buffer.from(value, "binary").toString("base64");
}
function tokenValue(token) {
  return token && typeof token === "object" ? token.value : token;
}
function isExpired(token) {
  if (!token) {
    return true;
  }
  if (!token.expires) {
    return false;
  }
  let expires = new Date(token.expires);
  let now2 = /* @__PURE__ */ new Date();
  return now2.getTime() > expires.getTime();
}
function getExpires(duration) {
  if (duration instanceof Date) {
    return new Date(duration.getTime());
  }
  if (typeof duration === "number") {
    let date = /* @__PURE__ */ new Date();
    date.setSeconds(date.getSeconds() + duration);
    return date;
  }
  throw new TypeError("Unknown expires type " + duration);
}
function generateCodeVerifier(size = 64) {
  const code_verifier = new Uint8Array(size);
  globalThis.crypto.getRandomValues(code_verifier);
  return base64url_encode(code_verifier);
}
async function generateCodeChallenge(code_verifier) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(code_verifier);
  const challenge = await globalThis.crypto.subtle.digest("SHA-256", data);
  return base64url_encode(challenge);
}
function base64url_encode(buffer) {
  const byteString = Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join("");
  return btoa(byteString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function createState(length) {
  const bytes = new Uint8Array(Math.ceil(length * 3 / 4) + 1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return base64url_encode(bytes).slice(0, length);
  }
  const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomState = "";
  let counter = 0;
  while (counter < length) {
    randomState += validChars.charAt(Math.floor(Math.random() * validChars.length));
    counter++;
  }
  return randomState;
}
function isRedirected() {
  let url3 = new URL(document.location.href);
  if (!url3.searchParams.has("code")) {
    if (url3.hash) {
      let query = url3.hash.substr(1);
      const params = new URLSearchParams("?" + query);
      if (params.has("code")) {
        return true;
      }
    }
    return false;
  }
  return true;
}
function isAuthorized(tokens) {
  if (typeof tokens == "string") {
    tokens = tokenStore(tokens).tokens;
  }
  let accessToken = tokens.get("access_token");
  if (accessToken && !isExpired(accessToken)) {
    return true;
  }
  let refreshToken = tokens.get("refresh_token");
  if (refreshToken) {
    return true;
  }
  return false;
}
function parseBearerChallenge(value) {
  if (!value || typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  const index = trimmed.search(/\s/);
  const scheme = index < 0 ? trimmed : trimmed.slice(0, index);
  const rest = index < 0 ? "" : trimmed.slice(index + 1);
  if (!["bearer", "dpop"].includes(scheme.toLowerCase())) {
    return null;
  }
  const result = { scheme };
  const pattern = /([A-Za-z][A-Za-z0-9_-]*)=("(?:[^"\\]|\\.)*"|[^,\s]*)/g;
  let match;
  while (match = pattern.exec(rest)) {
    let value2 = match[2];
    if (value2.startsWith('"') && value2.endsWith('"')) {
      value2 = value2.slice(1, -1).replace(/\\"/g, '"');
    }
    result[match[1]] = value2;
  }
  return result;
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.discovery.mjs
var oauth2_discovery_exports = {};
__export(oauth2_discovery_exports, {
  default: () => makeClient
});
init_src();
var validAlgorithms = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512"
];
var validAuthMethods = [
  "client_secret_post",
  "client_secret_base",
  "client_secret_jwt",
  "private_key_jwt"
];
var oauth_authorization_server_metadata = {
  authorization_endpoint: Required2(validURL2),
  issuer: Required2(validURL2),
  response_types_supported: Required2(anyOf2("code", "token")),
  token_endpoint: Required2(validURL2),
  scopes_supported: Recommended2([]),
  code_challendge_methods_supported: Optional2([]),
  grant_types_supported: Optional2([]),
  introspection_endpoint: Optional2(validURL2),
  introspection_endpoint_auth_methods_supported: Optional2(validAuthMethods),
  introspection_endpoint_auth_signing_alg_values_supported: Optional2(validAlgorithms),
  jwks_uri: Optional2(validURL2),
  op_policy_uri: Optional2(validURL2),
  op_tos_uri: Optional2(validURL2),
  registration_endpoint: Optional2(validURL2),
  response_modes_supported: Optional2([]),
  revocation_endpoint: Optional2(validURL2),
  revocation_endpoint_auth_methods_supported: Optional2(validAuthMethods),
  revocation_endpoint_auth_signing_alg_values_supported: Optional2(validAlgorithms),
  service_documentation: Optional2(validURL2),
  token_endpoint_auth_methods_supported: Optional2([]),
  token_endpoint_auth_signing_alg_values_supported: Optional2([]),
  ui_locales_supported: Optional2([])
};
function makeClient(options = {}) {
  const defaultOptions = {
    client: client()
  };
  options = Object.assign({}, defaultOptions, options);
  assert2(options, {
    issuer: Required2(validURL2)
  });
  const oauth_authorization_server_configuration = fetchWellknownOauthAuthorizationServer(options.issuer);
  return options.client.with(options.issuer);
}
async function fetchWellknownOauthAuthorizationServer(issuer, client3) {
  let res = client3.get(url(issuer, ".wellknown/oauth_authorization_server"));
  if (!res.ok) {
    throw metroError("metro.oidcmw: Error while fetching " + issuer + ".wellknown/oauth_authorization_server", res);
  }
  assert2(res.headers.get("Content-Type"), /application\/json.*/);
  let configuration = await res.json();
  assert2(configuration, oauth_authorization_server_metadata);
  return configuration;
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.popup.mjs
function handleRedirect(origin = null) {
  let success = false;
  origin = origin || window.location.origin;
  let params = new URLSearchParams(window.location.search);
  if (!params.has("code") && !params.has("error") && window.location.hash) {
    let query = window.location.hash.substring(1);
    params = new URLSearchParams("?" + query);
  }
  let parent = window.parent !== window ? window.parent : window.opener;
  if (!parent) {
    console.error("No parent window found, cannot post authorization code (or error)");
  } else {
    let message;
    if (params.has("code")) {
      success = true;
      message = {
        authorization_code: params.get("code"),
        state: params.get("state")
      };
    } else if (params.has("error")) {
      message = {
        error: params.get("error"),
        error_description: params.get("error_description"),
        state: params.get("state")
      };
    } else {
      message = { error: "Could not find an authorization_code" };
    }
    parent.postMessage(message, origin);
  }
  return success;
}
function authorizePopup(authorizationCodeURL, options = {}) {
  const url3 = new URL(authorizationCodeURL, window.location.href);
  const expectedState = url3.searchParams.get("state");
  const redirectUri = url3.searchParams.get("redirect_uri");
  const expectedOrigin = redirectUri ? new URL(redirectUri, window.location.href).origin : window.location.origin;
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      if (typeof removeEventListener === "function") {
        removeEventListener("message", handler);
      }
    };
    const handler = (event) => {
      if (event.origin && event.origin !== expectedOrigin) {
        return;
      }
      if (event.data.authorization_code) {
        if (expectedState && event.data.state !== expectedState) {
          cleanup();
          reject("OAuth2 authorization state mismatch");
          return;
        }
        cleanup();
        resolve(event.data.authorization_code);
      } else if (event.data.error) {
        if (expectedState && event.data.state && event.data.state !== expectedState) {
          cleanup();
          reject("OAuth2 authorization state mismatch");
          return;
        }
        cleanup();
        reject(event.data.error_description || event.data.error);
      } else {
        cleanup();
        reject("Unknown authorization error");
      }
    };
    addEventListener("message", handler);
    const popup = options.popup || window.open(authorizationCodeURL);
    if (!popup || popup.closed) {
      cleanup();
      reject("OAuth2 popup was blocked");
      return;
    }
    if (options.popup) {
      popup.location.href = authorizationCodeURL;
    }
  });
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/keysstore.mjs
function keysStore() {
  return new Promise((resolve, reject) => {
    const request3 = globalThis.indexedDB.open("metro", 1);
    request3.onupgradeneeded = () => request3.result.createObjectStore("keyPairs", { keyPath: "domain" });
    request3.onerror = (event) => {
      reject(event);
    };
    request3.onsuccess = (event) => {
      const db = event.target.result;
      resolve({
        set: function(value, key) {
          return new Promise((resolve2, reject2) => {
            const tx = db.transaction("keyPairs", "readwrite", { durability: "strict" });
            const objectStore = tx.objectStore("keyPairs");
            tx.oncomplete = () => {
              resolve2();
            };
            tx.onerror = reject2;
            objectStore.put(value, key);
          });
        },
        get: function(key) {
          return new Promise((resolve2, reject2) => {
            const tx = db.transaction("keyPairs", "readonly");
            const objectStore = tx.objectStore("keyPairs");
            const request4 = objectStore.get(key);
            request4.onsuccess = () => {
              resolve2(request4.result);
            };
            request4.onerror = reject2;
            tx.onerror = reject2;
          });
        },
        clear: function() {
          return new Promise((resolve2, reject2) => {
            const tx = db.transaction("keyPairs", "readwrite");
            const objectStore = tx.objectStore("keyPairs");
            const request4 = objectStore.clear();
            request4.onsuccess = () => {
              resolve2();
            };
            request4.onerror = reject2;
            tx.onerror = reject2;
          });
        }
      });
    };
  });
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.dpop.mjs
init_src();

// ../solid-tools/node_modules/dpop/build/index.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
function buf(input2) {
  if (typeof input2 === "string") {
    return encoder.encode(input2);
  }
  return decoder.decode(input2);
}
function checkRsaKeyAlgorithm(algorithm) {
  if (typeof algorithm.modulusLength !== "number" || algorithm.modulusLength < 2048) {
    throw new OperationProcessingError(`${algorithm.name} modulusLength must be at least 2048 bits`);
  }
}
function subtleAlgorithm(key) {
  switch (key.algorithm.name) {
    case "ECDSA":
      return { name: key.algorithm.name, hash: "SHA-256" };
    case "RSA-PSS":
      checkRsaKeyAlgorithm(key.algorithm);
      return {
        name: key.algorithm.name,
        saltLength: 256 >> 3
      };
    case "RSASSA-PKCS1-v1_5":
      checkRsaKeyAlgorithm(key.algorithm);
      return { name: key.algorithm.name };
    case "Ed25519":
      return { name: key.algorithm.name };
  }
  throw new UnsupportedOperationError();
}
async function jwt(header, claimsSet, key) {
  if (key.usages.includes("sign") === false) {
    throw new TypeError('private CryptoKey instances used for signing assertions must include "sign" in their "usages"');
  }
  const input2 = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(claimsSet)))}`;
  const signature = b64u(await crypto.subtle.sign(subtleAlgorithm(key), key, buf(input2)));
  return `${input2}.${signature}`;
}
var encodeBase64Url;
if (Uint8Array.prototype.toBase64) {
  encodeBase64Url = (input2) => {
    if (input2 instanceof ArrayBuffer) {
      input2 = new Uint8Array(input2);
    }
    return input2.toBase64({ alphabet: "base64url", omitPadding: true });
  };
} else {
  const CHUNK_SIZE = 32768;
  encodeBase64Url = (input2) => {
    if (input2 instanceof ArrayBuffer) {
      input2 = new Uint8Array(input2);
    }
    const arr = [];
    for (let i = 0; i < input2.byteLength; i += CHUNK_SIZE) {
      arr.push(String.fromCharCode.apply(null, input2.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(arr.join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  };
}
function b64u(input2) {
  return encodeBase64Url(input2);
}
var UnsupportedOperationError = class extends Error {
  constructor(message) {
    var _a;
    super(message !== null && message !== void 0 ? message : "operation not supported");
    this.name = this.constructor.name;
    (_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, this, this.constructor);
  }
};
var OperationProcessingError = class extends Error {
  constructor(message) {
    var _a;
    super(message);
    this.name = this.constructor.name;
    (_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, this, this.constructor);
  }
};
function psAlg(key) {
  switch (key.algorithm.hash.name) {
    case "SHA-256":
      return "PS256";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name");
  }
}
function rsAlg(key) {
  switch (key.algorithm.hash.name) {
    case "SHA-256":
      return "RS256";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name");
  }
}
function esAlg(key) {
  switch (key.algorithm.namedCurve) {
    case "P-256":
      return "ES256";
    default:
      throw new UnsupportedOperationError("unsupported EcKeyAlgorithm namedCurve");
  }
}
function determineJWSAlgorithm(key) {
  switch (key.algorithm.name) {
    case "RSA-PSS":
      return psAlg(key);
    case "RSASSA-PKCS1-v1_5":
      return rsAlg(key);
    case "ECDSA":
      return esAlg(key);
    case "Ed25519":
      return "Ed25519";
    default:
      throw new UnsupportedOperationError("unsupported CryptoKey algorithm name");
  }
}
function isCryptoKey(key) {
  return key instanceof CryptoKey;
}
function isPrivateKey(key) {
  return isCryptoKey(key) && key.type === "private";
}
function isPublicKey(key) {
  return isCryptoKey(key) && key.type === "public";
}
function epochTime() {
  return Math.floor(Date.now() / 1e3);
}
async function generateProof(keypair, htu, htm, nonce, accessToken, additional) {
  const privateKey = keypair === null || keypair === void 0 ? void 0 : keypair.privateKey;
  const publicKey = keypair === null || keypair === void 0 ? void 0 : keypair.publicKey;
  if (!isPrivateKey(privateKey)) {
    throw new TypeError('"keypair.privateKey" must be a private CryptoKey');
  }
  if (!isPublicKey(publicKey)) {
    throw new TypeError('"keypair.publicKey" must be a public CryptoKey');
  }
  if (publicKey.extractable !== true) {
    throw new TypeError('"keypair.publicKey.extractable" must be true');
  }
  if (typeof htu !== "string") {
    throw new TypeError('"htu" must be a string');
  }
  if (typeof htm !== "string") {
    throw new TypeError('"htm" must be a string');
  }
  if (nonce !== void 0 && typeof nonce !== "string") {
    throw new TypeError('"nonce" must be a string or undefined');
  }
  if (accessToken !== void 0 && typeof accessToken !== "string") {
    throw new TypeError('"accessToken" must be a string or undefined');
  }
  if (additional !== void 0 && (typeof additional !== "object" || additional === null || Array.isArray(additional))) {
    throw new TypeError('"additional" must be an object');
  }
  return jwt({
    alg: determineJWSAlgorithm(privateKey),
    typ: "dpop+jwt",
    jwk: await publicJwk(publicKey)
  }, Object.assign(Object.assign({}, additional), {
    iat: epochTime(),
    jti: crypto.randomUUID(),
    htm,
    nonce,
    htu,
    ath: accessToken ? b64u(await crypto.subtle.digest("SHA-256", buf(accessToken))) : void 0
  }), privateKey);
}
async function publicJwk(key) {
  const { kty, e, n, x, y, crv } = await crypto.subtle.exportKey("jwk", key);
  return { kty, crv, e, n, x, y };
}
async function generateKeyPair(alg, options) {
  var _a;
  let algorithm;
  if (typeof alg !== "string" || alg.length === 0) {
    throw new TypeError('"alg" must be a non-empty string');
  }
  switch (alg) {
    case "PS256":
      algorithm = {
        name: "RSA-PSS",
        hash: "SHA-256",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1])
      };
      break;
    case "RS256":
      algorithm = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1])
      };
      break;
    case "ES256":
      algorithm = { name: "ECDSA", namedCurve: "P-256" };
      break;
    case "Ed25519":
      algorithm = { name: "Ed25519" };
      break;
    default:
      throw new UnsupportedOperationError();
  }
  return crypto.subtle.generateKey(algorithm, (_a = options === null || options === void 0 ? void 0 : options.extractable) !== null && _a !== void 0 ? _a : false, ["sign", "verify"]);
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/oauth2.dpop.mjs
function dpopmw(options) {
  assert2(options, {
    site: Required2(validURL2),
    authorization_endpoint: Required2(validURL2),
    token_endpoint: Required2(validURL2),
    dpop_signing_alg_values_supported: Optional2([])
    // this property is unfortunately rarely supported
  });
  return async (req, next) => {
    const keys = await keysStore();
    let keyInfo = await keys.get(options.site);
    if (!keyInfo) {
      let keyPair = await generateKeyPair("ES256");
      keyInfo = { domain: options.site, keyPair };
      await keys.set(keyInfo);
    }
    const url3 = url(req.url);
    if (req.url.startsWith(options.authorization_endpoint)) {
      let params = req.body;
      if (params instanceof URLSearchParams || params instanceof FormData) {
        params.set("dpop_jkt", keyInfo.keyPair.publicKey);
      } else {
        params.dpop_jkt = keyInfo.keyPair.publicKey;
      }
    } else if (req.url.startsWith(options.token_endpoint)) {
      const dpopHeader = await generateProof(keyInfo.keyPair, req.url, req.method);
      req = req.with({
        headers: {
          "DPoP": dpopHeader
        }
      });
    } else if (req.headers.has("Authorization")) {
      const nonce = localStorage.getItem(url3.host + ":nonce") || void 0;
      const accessToken = req.headers.get("Authorization").split(" ")[1];
      const dpopHeader = await generateProof(keyInfo.keyPair, req.url, req.method, nonce, accessToken);
      req = req.with({
        headers: {
          "Authorization": "DPoP " + accessToken,
          "DPoP": dpopHeader
        }
      });
    }
    let response3 = await next(req);
    if (response3.headers.get("DPoP-Nonce")) {
      localStorage.setItem(url3.host + ":nonce", response3.headers.get("DPoP-Nonce"));
    }
    return response3;
  };
}

// ../solid-tools/node_modules/@muze-nl/metro-oauth2/src/index.mjs
var oauth2 = Object.assign({}, oauth2_exports, {
  oauth2mw,
  discover: oauth2_discovery_exports,
  tokenstore: tokenStore,
  dpopmw,
  keysstore: keysStore,
  authorizePopup,
  popupHandleRedirect: handleRedirect
});

// ../solid-tools/node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assertEnabled = false;
function enable3() {
  globalThis.assertEnabled = true;
}
function disable3() {
  globalThis.assertEnabled = false;
}
function assert3(source, test) {
  if (globalThis.assertEnabled) {
    let problems = fails3(source, test);
    if (problems) {
      console.error("\u{1F170}\uFE0F  Assertions failed because of:", problems, "in this source:", source);
      throw new Error("Assertions failed", {
        cause: { problems, source }
      });
    }
  }
}
function Optional3(pattern) {
  return function _Optional(data, root, path2) {
    if (typeof data != "undefined" && data != null && typeof pattern != "undefined") {
      return fails3(data, pattern, root, path2);
    }
  };
}
function Required3(pattern) {
  return function _Required(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      return error3("data is required", data, pattern || "any value", path2);
    } else if (typeof pattern != "undefined") {
      return fails3(data, pattern, root, path2);
    } else {
      return false;
    }
  };
}
function Recommended3(pattern) {
  return function _Recommended(data, root, path2) {
    if (data == null || typeof data == "undefined") {
      warn3("data does not contain recommended value", data, pattern, path2);
      return false;
    } else {
      return fails3(data, pattern, root, path2);
    }
  };
}
function oneOf3(...patterns) {
  return function _oneOf(data, root, path2) {
    for (let pattern of patterns) {
      if (!fails3(data, pattern, root, path2)) {
        return false;
      }
    }
    return error3("data does not match oneOf patterns", data, patterns, path2);
  };
}
function anyOf3(...patterns) {
  return function _anyOf(data, root, path2) {
    if (!Array.isArray(data)) {
      return error3("data is not an array", data, "anyOf", path2);
    }
    for (let value of data) {
      if (oneOf3(...patterns)(value)) {
        return error3("data does not match anyOf patterns", value, patterns, path2);
      }
    }
    return false;
  };
}
function allOf3(...patterns) {
  return function _allOf(data, root, path2) {
    let problems = [];
    for (let pattern of patterns) {
      problems = problems.concat(fails3(data, pattern, root, path2));
    }
    problems = problems.filter(Boolean);
    if (problems.length) {
      return error3("data does not match all given patterns", data, patterns, path2, problems);
    }
  };
}
function validURL3(data, root, path2) {
  try {
    if (data instanceof URL) {
      data = data.href;
    }
    let url3 = new URL(data);
    if (url3.href != data) {
      if (!(url3.href + "/" == data || url3.href == data + "/")) {
        return error3("data is not a valid url", data, "validURL", path2);
      }
    }
  } catch (e) {
    return error3("data is not a valid url", data, "validURL", path2);
  }
}
function validEmail3(data, root, path2) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
    return error3("data is not a valid email", data, "validEmail", path2);
  }
}
function instanceOf3(constructor) {
  return function _instanceOf(data, root, path2) {
    if (!(data instanceof constructor)) {
      return error3("data is not an instanceof pattern", data, constructor, path2);
    }
  };
}
function not3(pattern) {
  return function _not(data, root, path2) {
    if (!fails3(data, pattern, root, path2)) {
      return error3("data matches pattern, when required not to", data, pattern, path2);
    }
  };
}
function fails3(data, pattern, root, path2 = "") {
  if (!root) {
    root = data;
  }
  let problems = [];
  if (pattern === Boolean) {
    if (typeof data != "boolean" && !(data instanceof Boolean)) {
      problems.push(error3("data is not a boolean", data, pattern, path2));
    }
  } else if (pattern === Number) {
    if (typeof data != "number" && !(data instanceof Number)) {
      problems.push(error3("data is not a number", data, pattern, path2));
    }
  } else if (pattern === String) {
    if (typeof data != "string" && !(data instanceof String)) {
      problems.push(error3("data is not a string", data, pattern, path2));
    }
    if (data == "") {
      problems.push(error3("data is an empty string, which is not allowed", data, pattern, path2));
    }
  } else if (pattern instanceof RegExp) {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails3(element2, pattern, root, path2 + "[" + index2 + "]"));
      if (index > -1) {
        problems.push(error3("data[" + index + "] does not match pattern", data[index], pattern, path2 + "[" + index + "]"));
      }
    } else if (typeof data == "undefined") {
      problems.push(error3("data is undefined, should match pattern", data, pattern, path2));
    } else if (!pattern.test(data)) {
      problems.push(error3("data does not match pattern", data, pattern, path2));
    }
  } else if (pattern instanceof Function) {
    let problem = pattern(data, root, path2);
    if (problem) {
      if (Array.isArray(problem)) {
        problems = problems.concat(problem);
      } else {
        problems.push(problem);
      }
    }
  } else if (Array.isArray(pattern)) {
    if (!Array.isArray(data)) {
      problems.push(error3("data is not an array", data, [], path2));
    }
    for (let p of pattern) {
      for (let index of data.keys()) {
        let problem = fails3(data[index], p, root, path2 + "[" + index + "]");
        if (Array.isArray(problem)) {
          problems = problems.concat(problem);
        } else if (problem) {
          problems.push(problem);
        }
      }
    }
  } else if (pattern && typeof pattern == "object") {
    if (Array.isArray(data)) {
      let index = data.findIndex((element2, index2) => fails3(element2, pattern, root, path2 + "[" + index2 + "]"));
      if (index > -1) {
        problems.push(error3("data[" + index + "] does not match pattern", data[index], pattern, path2 + "[" + index + "]"));
      }
    } else if (!data || typeof data != "object") {
      problems.push(error3("data is not an object, pattern is", data, pattern, path2));
    } else {
      if (data instanceof URLSearchParams) {
        data = Object.fromEntries(data);
      }
      if (pattern instanceof Function) {
        let result = fails3(data, pattern, root, path2);
        if (result) {
          problems = problems.concat(result);
        }
      } else {
        for (const [patternKey, subpattern] of Object.entries(pattern)) {
          let result = fails3(data[patternKey], subpattern, root, path2 + "." + patternKey);
          if (result) {
            problems = problems.concat(result);
          }
        }
      }
    }
  } else {
    if (pattern != data) {
      problems.push(error3("data and pattern are not equal", data, pattern, path2));
    }
  }
  if (problems.length) {
    return problems;
  }
  return false;
}
function error3(message, found, expected, path2, problems) {
  let result = {
    path: path2,
    message,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn3(message, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message, pattern, data);
}
globalThis.assert = {
  warn: warn3,
  error: error3,
  assert: assert3,
  enable: enable3,
  disable: disable3,
  Required: Required3,
  Recommended: Recommended3,
  Optional: Optional3,
  oneOf: oneOf3,
  anyOf: anyOf3,
  allOf: allOf3,
  validURL: validURL3,
  validEmail: validEmail3,
  instanceOf: instanceOf3,
  not: not3,
  fails: fails3
};

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/oidc.util.mjs
var MustHave = (...options) => (value, root) => {
  if (options.filter((o) => root.hasOwnKey(o)).length > 0) {
    return false;
  }
  return error3("root data must have all of", root, options);
};
var MustInclude = (...options) => (value) => {
  if (Array.isArray(value) && options.filter((o) => !value.includes(o)).length == 0) {
    return false;
  } else {
    return error3("data must be an array which includes", value, options);
  }
};
var validJWA = [
  "HS256",
  "HS384",
  "HS512",
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512"
];
var validAuthMethods2 = [
  "client_secret_post",
  "client_secret_basic",
  "client_secret_jwt",
  "private_key_jwt"
];

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/oidc.discovery.mjs
async function oidcDiscovery(options = {}) {
  assert3(options, {
    client: Optional3(instanceOf3(everything_default.client().constructor)),
    issuer: Required3(validURL3)
  });
  const defaultOptions = {
    client: everything_default.client().with(throwermw2()).with(jsonmw2()),
    requireDynamicRegistration: false
  };
  options = Object.assign({}, defaultOptions, options);
  const TestSucceeded = false;
  function MustUseHTTPS(url3) {
    return TestSucceeded;
  }
  const openid_provider_metadata = {
    issuer: Required3(allOf3(options.issuer, MustUseHTTPS)),
    authorization_endpoint: Required3(validURL3),
    token_endpoint: Required3(validURL3),
    userinfo_endpoint: Recommended3(validURL3),
    // todo: test for https protocol
    jwks_uri: Required3(validURL3),
    registration_endpoint: options.requireDynamicRegistration ? Required3(validURL3) : Recommended3(validURL3),
    scopes_supported: Recommended3(MustInclude("openid")),
    response_types_supported: options.requireDynamicRegistration ? Required3(MustInclude("code", "id_token", "id_token token")) : Required3([]),
    response_modes_supported: Optional3([]),
    grant_types_supported: options.requireDynamicRegistration ? Optional3(MustInclude("authorization_code")) : Optional3([]),
    acr_values_supported: Optional3([]),
    subject_types_supported: Required3([]),
    id_token_signing_alg_values_supported: Required3(MustInclude("RS256")),
    id_token_encryption_alg_values_supported: Optional3([]),
    id_token_encryption_enc_values_supported: Optional3([]),
    userinfo_signing_alg_values_supported: Optional3([]),
    userinfo_encryption_alg_values_supported: Optional3([]),
    userinfo_encryption_enc_values_supported: Optional3([]),
    request_object_signing_alg_values_supported: Optional3(MustInclude("RS256")),
    // not testing for 'none'
    request_object_encryption_alg_values_supported: Optional3([]),
    request_object_encryption_enc_values_supported: Optional3([]),
    token_endpoint_auth_methods_supported: Optional3(anyOf3(...validAuthMethods2)),
    token_endpoint_auth_signing_alg_values_supported: Optional3(MustInclude("RS256"), not3(MustInclude("none"))),
    display_values_supported: Optional3(anyOf3("page", "popup", "touch", "wap")),
    claim_types_supported: Optional3(anyOf3("normal", "aggregated", "distributed")),
    claims_supported: Recommended3([]),
    service_documentation: Optional3(validURL3),
    claims_locales_supported: Optional3([]),
    ui_locales_supported: Optional3([]),
    claims_parameter_supported: Optional3(Boolean),
    request_parameter_supported: Optional3(Boolean),
    request_uri_parameter_supported: Optional3(Boolean),
    op_policy_uri: Optional3(validURL3),
    op_tos_uri: Optional3(validURL3)
  };
  const configURL = everything_default.url(options.issuer, ".well-known/openid-configuration");
  const response3 = await options.client.get(
    // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
    // note: this allows path components in the options.issuer url
    configURL
  );
  const openid_config = response3.data;
  assert3(openid_config, openid_provider_metadata);
  assert3(openid_config.issuer, options.issuer);
  return openid_config;
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/oidc.register.mjs
async function register(options) {
  const openid_client_metadata = {
    redirect_uris: Required3([validURL3]),
    response_types: Optional3([]),
    grant_types: Optional3(anyOf3("authorization_code", "refresh_token")),
    //TODO: match response_types with grant_types
    application_type: Optional3(oneOf3("native", "web")),
    contacts: Optional3([validEmail3]),
    client_name: Optional3(String),
    logo_uri: Optional3(validURL3),
    client_uri: Optional3(validURL3),
    policy_uri: Optional3(validURL3),
    tos_uri: Optional3(validURL3),
    jwks_uri: Optional3(validURL3, not3(MustHave("jwks"))),
    jwks: Optional3(validURL3, not3(MustHave("jwks_uri"))),
    sector_identifier_uri: Optional3(validURL3),
    subject_type: Optional3(String),
    id_token_signed_response_alg: Optional3(oneOf3(...validJWA)),
    id_token_encrypted_response_alg: Optional3(oneOf3(...validJWA)),
    id_token_encrypted_response_enc: Optional3(oneOf3(...validJWA), MustHave("id_token_encrypted_response_alg")),
    userinfo_signed_response_alg: Optional3(oneOf3(...validJWA)),
    userinfo_encrypted_response_alg: Optional3(oneOf3(...validJWA)),
    userinfo_encrypted_response_enc: Optional3(oneOf3(...validJWA), MustHave("userinfo_encrypted_response_alg")),
    request_object_signing_alg: Optional3(oneOf3(...validJWA)),
    request_object_encryption_alg: Optional3(oneOf3(...validJWA)),
    request_object_encryption_enc: Optional3(oneOf3(...validJWA)),
    token_endpoint_auth_method: Optional3(oneOf3(...validAuthMethods2)),
    token_endpoint_auth_signing_alg: Optional3(oneOf3(...validJWA)),
    default_max_age: Optional3(Number),
    require_auth_time: Optional3(Boolean),
    default_acr_values: Optional3([String]),
    initiate_login_uri: Optional3([validURL3]),
    request_uris: Optional3([validURL3])
  };
  assert3(options, {
    client: Optional3(instanceOf3(everything_default.client().constructor)),
    registration_endpoint: validURL3,
    client_info: openid_client_metadata
  });
  const defaultOptions = {
    client: everything_default.client().with(throwermw2()).with(jsonmw2()),
    client_info: {
      redirect_uris: [globalThis.document?.location.href]
    }
  };
  options = Object.assign({}, defaultOptions, options);
  if (!options.client_info) {
    options.client_info = {};
  }
  if (!options.client_info.redirect_uris) {
    options.client_info.redirect_uris = [globalThis.document?.location.href];
  }
  let response3 = await options.client.post(options.registration_endpoint, {
    body: options.client_info
  });
  let info = response3.data;
  if (!info.client_id || !info.client_secret) {
    throw everything_default.metroError("metro.oidc: Error: dynamic registration of client failed, no client_id or client_secret returned", response3);
  }
  options.client_info = Object.assign(options.client_info, info);
  return options.client_info;
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/oidc.store.mjs
function oidcStore(site) {
  let store;
  if (typeof localStorage !== "undefined") {
    store = {
      get: (name) => JSON.parse(localStorage.getItem("metro/oidc:" + site + ":" + name)),
      set: (name, value) => localStorage.setItem("metro/oidc:" + site + ":" + name, JSON.stringify(value)),
      has: (name) => localStorage.getItem("metro/oidc:" + site + ":" + name) !== null
    };
  } else {
    let storeMap = /* @__PURE__ */ new Map();
    store = {
      get: (name) => JSON.parse(storeMap.get("metro/oidc:" + site + ":" + name) || null),
      set: (name, value) => storeMap.set("metro/oidc:" + site + ":" + name, JSON.stringify(value)),
      has: (name) => storeMap.has("metro/oidc:" + site + ":" + name)
    };
  }
  return store;
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/oidcmw.mjs
function oidcmw(options = {}) {
  const defaultOptions = {
    client: client2(),
    force_authorization: false,
    use_dpop: true,
    authorize_callback: async (url3) => {
      if (window.location.href != url3.href) {
        window.location.replace(url3.href);
      }
      return false;
    }
  };
  options = Object.assign({}, defaultOptions, options);
  const requestedClientInfo = options.client_info;
  assert3(options, {
    client: Required3(instanceOf3(client2().constructor)),
    // required because it is set in defaultOptions
    client_info: Required3(),
    issuer: Required3(validURL3),
    oauth2: Optional3({}),
    openid_configuration: Optional3()
  });
  if (!options.store) {
    options.store = oidcStore(options.issuer);
  }
  if (!options.openid_configuration && options.store.has("openid_configuration")) {
    options.openid_configuration = options.store.get("openid_configuration");
  }
  if (!options.client_info?.client_id && options.store.has("client_info")) {
    const storedClientInfo = options.store.get("client_info");
    if (clientInfoMatchesRequest(storedClientInfo, requestedClientInfo)) {
      options.client_info = storedClientInfo;
    }
  }
  return async (req, next) => {
    let res;
    if (!options.force_authorization) {
      try {
        res = await next(req);
      } catch (err) {
        if (res.status != 401 && res.status != 403) {
          throw err;
        }
      }
      if (res.ok || res.status != 401 && res.status != 403) {
        return res;
      }
    }
    if (!options.openid_configuration) {
      options.openid_configuration = await oidcDiscovery({
        issuer: options.issuer
      });
      options.store.set("openid_configuration", options.openid_configuration);
    }
    if (!options.client_info?.client_id) {
      if (!options.openid_configuration.registration_endpoint) {
        throw metroError2("metro.oidcmw: Error: issuer " + options.issuer + " does not support dynamic client registration, but you haven't specified a client_id");
      }
      options.client_info = await register({
        registration_endpoint: options.openid_configuration.registration_endpoint,
        client_info: options.client_info
      });
      options.store.set("client_info", options.client_info);
    }
    const scope = options.scope || "openid";
    const oauth2Options = Object.assign(
      {
        site: options.issuer,
        client: options.client,
        force_authorization: true,
        authorize_callback: options.authorize_callback,
        oauth2_configuration: {
          client_id: options.client_info?.client_id,
          client_secret: options.client_info?.client_secret,
          grant_type: "authorization_code",
          response_type: "code",
          response_mode: "query",
          authorization_endpoint: options.openid_configuration.authorization_endpoint,
          token_endpoint: options.openid_configuration.token_endpoint,
          scope,
          //FIXME: should only use scopes supported by server
          redirect_uri: options.client_info.redirect_uris[0]
        }
      }
      //...
    );
    const storeIdToken = async (req2, next2) => {
      const res2 = await next2(req2);
      const contentType = res2.headers.get("content-type");
      if (contentType?.startsWith("application/json")) {
        let id_token = res2.data?.id_token;
        if (!id_token) {
          const res22 = res2.clone();
          try {
            let data = await res22.json();
            if (data && data.id_token) {
              id_token = data.id_token;
            }
          } catch (e) {
          }
        }
        if (id_token) {
          options.store.set("id_token", id_token);
        }
      }
      return res2;
    };
    let oauth2client = options.client.with(options.issuer).with(storeIdToken);
    if (options.use_dpop) {
      const dpopOptions = {
        site: options.issuer,
        authorization_endpoint: options.openid_configuration.authorization_endpoint,
        token_endpoint: options.openid_configuration.token_endpoint,
        dpop_signing_alg_values_supported: options.openid_configuration.dpop_signing_alg_values_supported
      };
      oauth2client = oauth2client.with(dpopmw(dpopOptions));
      oauth2Options.client = oauth2client;
    }
    oauth2client = oauth2client.with(oauth2mw(oauth2Options));
    res = await oauth2client.fetch(req);
    return res;
  };
}
function clientInfoMatchesRequest(storedClientInfo, requestedClientInfo) {
  if (!storedClientInfo?.client_id) {
    return false;
  }
  if (!Array.isArray(requestedClientInfo?.redirect_uris)) {
    return true;
  }
  const storedRedirectUris = new Set(storedClientInfo.redirect_uris || []);
  return requestedClientInfo.redirect_uris.every((uri) => storedRedirectUris.has(uri));
}
function isRedirected2() {
  return isRedirected();
}
function idToken(options) {
  if (!options.store) {
    if (!options.issuer) {
      throw metroError2("Must supply options.issuer or options.store to get the id_token");
    }
    options.store = oidcStore(options.issuer);
  }
  return options.store.get("id_token");
}

// ../solid-tools/node_modules/@muze-nl/metro-oidc/src/browser.mjs
var oidc = {
  oidcmw,
  discover: oidcDiscovery,
  register,
  isRedirected: isRedirected2,
  idToken
};
if (!globalThis.metro.oidc) {
  globalThis.metro.oidc = oidc;
}
var browser_default = oidc;

// ../solid-tools/node_modules/@muze-nl/oldm-core/src/oldm.mjs
var oldm_exports = {};
__export(oldm_exports, {
  BlankNode: () => BlankNode,
  Collection: () => Collection,
  Context: () => Context,
  Graph: () => Graph,
  NamedNode: () => NamedNode,
  default: () => oldm,
  first: () => first,
  many: () => many,
  one: () => one,
  prefixes: () => prefixes,
  rdfType: () => rdfType
});
function oldm(options) {
  return new Context(options);
}
var rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var prefixes = {
  acl: "http://www.w3.org/ns/auth/acl#",
  acp: "http://www.w3.org/ns/solid/acp#",
  dcterms: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  ldn: "https://www.w3.org/ns/ldn#",
  ldp: "http://www.w3.org/ns/ldp#",
  notify: "http://www.w3.org/ns/solid/notifications#",
  oidc: "http://www.w3.org/ns/solid/oidc#",
  owl: "http://www.w3.org/2002/07/owl#",
  pim: "http://www.w3.org/ns/pim/space#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  schema: "http://schema.org/",
  solid: "http://www.w3.org/ns/solid/terms#",
  stat: "http://www.w3.org/ns/posix/stat#",
  turtle: "http://www.w3.org/ns/iana/media-types/text/turtle#",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#"
};
function one(values5, whichOne = "last") {
  let result = values5;
  if (Array.isArray(values5)) {
    if (whichOne == "last") {
      result = values5[values5.length - 1];
    } else if (whichOne == "first") {
      result = values5[0];
    } else if (typeof whichOne == "function") {
      result = whichOne(values5);
    } else {
      throw new Error("Unknown value for whichOne parameter");
    }
  }
  return result;
}
function many(values5) {
  if (Array.isArray(values5)) {
    return values5;
  }
  if (values5 == null) {
    return [];
  }
  return [values5];
}
function first(...values5) {
  for (const value of values5) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return null;
}
function values2(value) {
  if (Array.isArray(value) && !(value instanceof Collection)) {
    return value;
  }
  if (value === void 0) {
    return [];
  }
  return [value];
}
function mergeValue(existing, value) {
  const result = values2(existing);
  for (const item of values2(value)) {
    if (!result.some((existingItem) => sameValue(existingItem, item))) {
      result.push(item);
    }
  }
  if (result.length == 0) {
    return void 0;
  }
  if (result.length == 1) {
    return result[0];
  }
  return result;
}
function sameValue(left, right) {
  if (left === right) {
    return true;
  }
  if (left instanceof NamedNode && right instanceof NamedNode) {
    return left.id == right.id;
  }
  if (left instanceof NamedNode && typeof right == "string") {
    return left.id == right;
  }
  if (typeof left == "string" && right instanceof NamedNode) {
    return left == right.id;
  }
  if (left instanceof Collection && right instanceof Collection) {
    return left.length == right.length && left.every((item, index) => sameValue(item, right[index]));
  }
  if (isLiteral(left) && isLiteral(right)) {
    return String(left) == String(right) && left?.type == right?.type && left?.language == right?.language;
  }
  return false;
}
function sameSourceValue(left, right) {
  if (left === right) {
    return true;
  }
  if (left instanceof NamedNode && right instanceof NamedNode) {
    return left.id == right.id;
  }
  if (left instanceof NamedNode && typeof right == "string") {
    return left.id == right;
  }
  if (typeof left == "string" && right instanceof NamedNode) {
    return left == right.id;
  }
  if (left instanceof Collection && right instanceof Collection) {
    return left.length == right.length && left.every((item, index) => sameSourceValue(item, right[index]));
  }
  if (isLiteral(left) && isLiteral(right)) {
    const leftType = left?.type;
    const rightType = right?.type;
    const leftLanguage = left?.language;
    const rightLanguage = right?.language;
    return String(left) == String(right) && (!leftType || !rightType || leftType == rightType) && (!leftLanguage || !rightLanguage || leftLanguage == rightLanguage);
  }
  return false;
}
function resolveValue(value, subjects, context) {
  if (value instanceof Collection) {
    const collection = new Collection(context);
    for (const item of value) {
      collection.push(resolveValue(item, subjects, context));
    }
    return collection;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, subjects, context));
  }
  if (value instanceof NamedNode && subjects[value.id]) {
    return subjects[value.id];
  }
  return value;
}
function isLiteral(value) {
  return value instanceof String || value instanceof Number || typeof value == "boolean" || typeof value == "string" || typeof value == "number";
}
var Context = class {
  #buildingSubjects = false;
  constructor(options) {
    const clientPrefixes = options?.prefixes ?? {};
    this.prefixes = { ...prefixes, ...clientPrefixes };
    this.prefixOrder = [
      ...Object.keys(clientPrefixes),
      ...Object.keys(prefixes).filter((prefix) => !(prefix in clientPrefixes))
    ];
    if (!this.prefixes["xsd"]) {
      this.prefixes["xsd"] = "http://www.w3.org/2001/XMLSchema#";
      this.prefixOrder.push("xsd");
    }
    this.parser = options?.parser;
    this.writer = options?.writer;
    this.patchWriter = options?.patchWriter;
    this.graphs = [];
    this.graphsByUrl = /* @__PURE__ */ Object.create(null);
    this.defaultGraph = options?.defaultGraph ?? null;
    this.separator = options?.separator ?? "$";
    Object.defineProperty(this, "subjects", {
      get() {
        return this.getSubjects();
      }
    });
    Object.defineProperty(this, "data", {
      get() {
        return Object.values(this.subjects);
      }
    });
  }
  parse(input2, url3, type) {
    const { quads, prefixes: prefixes4 } = this.parser(input2, url3, type);
    if (prefixes4) {
      for (let prefix in prefixes4) {
        let prefixURL = prefixes4[prefix];
        if (prefixURL.match(/^http(s?):\/\/$/i)) {
          prefixURL += url3.substring(prefixURL.length);
        } else try {
          prefixURL = new URL(prefixes4[prefix], url3).href;
        } catch (err) {
          console.error("Could not parse prefix", prefixes4[prefix], err.message);
        }
        if (!this.prefixes[prefix]) {
          this.prefixes[prefix] = prefixURL;
          this.prefixOrder.push(prefix);
        }
      }
    }
    return this.addGraph(new Graph(quads, url3, type, prefixes4, this, input2));
  }
  addGraph(graph2) {
    if (!graph2?.url) {
      throw new Error("Cannot add graph without a url");
    }
    const existing = this.graphsByUrl[graph2.url];
    if (existing) {
      const index = this.graphs.indexOf(existing);
      if (index >= 0) {
        this.graphs[index] = graph2;
      }
    } else {
      this.graphs.push(graph2);
    }
    this.graphsByUrl[graph2.url] = graph2;
    return graph2;
  }
  graph(url3) {
    return this.graphsByUrl[this.fullURI(url3)];
  }
  set(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).set(subject, predicate, value, { prefixPreference: "context" });
  }
  add(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).add(subject, predicate, value, { prefixPreference: "context" });
  }
  delete(subject, predicate = null, value = void 0, options = {}) {
    const graph2 = this.resolveGraph(subject, options);
    if (arguments.length < 3) {
      return graph2.delete(subject, predicate, void 0, { prefixPreference: "context", hasValue: false });
    }
    return graph2.delete(subject, predicate, value, { prefixPreference: "context", hasValue: true });
  }
  resolveGraph(subject, options = {}) {
    if (options.graph) {
      return this.getGraphOption(options.graph);
    }
    if (subject instanceof BlankNode && subject.graph instanceof Graph) {
      return subject.graph;
    }
    const id2 = this.subjectID(subject);
    if (id2) {
      const exactGraph = this.graphsByUrl[id2];
      if (exactGraph) {
        return exactGraph;
      }
      const documentGraph = this.graphsByUrl[this.documentURL(id2)];
      if (documentGraph) {
        return documentGraph;
      }
      const subjectSources = this.graphs.filter((graph2) => graph2.subjects[id2]);
      if (subjectSources.length == 1) {
        return subjectSources[0];
      }
      if (subjectSources.length > 1) {
        throw new Error(`Cannot choose a source graph for ${id2}. Use context.set/add/delete(..., { graph }) or graph.set/add/delete(...) to choose one explicitly.`);
      }
    }
    if (this.defaultGraph) {
      return this.getGraphOption(this.defaultGraph);
    }
    if (this.graphs.length == 1) {
      return this.graphs[0];
    }
    throw new Error("Cannot choose a source graph. Use context.set/add/delete(..., { graph }) or graph.set/add/delete(...) to choose one explicitly.");
  }
  getGraphOption(graph2) {
    if (graph2 instanceof Graph) {
      if (!this.graphs.includes(graph2)) {
        throw new Error("The selected graph is not part of this context");
      }
      return graph2;
    }
    const resolved = this.graph(graph2);
    if (!resolved) {
      throw new Error(`Unknown graph: ${graph2}`);
    }
    return resolved;
  }
  documentURL(id2) {
    try {
      const url3 = new URL(id2);
      url3.hash = "";
      return url3.href;
    } catch (err) {
      return id2;
    }
  }
  sources(subject, predicate = null, value = void 0) {
    if (!subject) {
      return [...this.graphs];
    }
    if (subject instanceof BlankNode && !(subject instanceof NamedNode)) {
      return this.sourcesForBlankNode(subject, predicate, value, arguments.length >= 3);
    }
    const id2 = this.subjectID(subject);
    if (!id2) {
      return [];
    }
    return this.graphs.filter((graph2) => {
      const graphSubject = graph2.subjects[id2];
      return graphSubject && this.subjectHasSource(graphSubject, predicate, value, arguments.length >= 3);
    });
  }
  sourcesForBlankNode(subject, predicate, value, hasValue) {
    const graph2 = subject.graph;
    if (!(graph2 instanceof Graph)) {
      return [];
    }
    if (this.subjectHasSource(subject, predicate, value, hasValue)) {
      return [graph2];
    }
    return [];
  }
  subjectHasSource(subject, predicate, value, hasValue) {
    if (!predicate) {
      return true;
    }
    const property = subject.graph instanceof Graph ? subject.graph.propertyName(this.fullURI(predicate), "context") : this.propertyName(predicate);
    if (!(property in subject)) {
      return false;
    }
    if (!hasValue) {
      return true;
    }
    return values2(subject[property]).some((item) => sameSourceValue(item, value));
  }
  subjectID(subject) {
    if (subject?.id) {
      return this.fullURI(subject.id);
    }
    if (typeof subject == "string") {
      return this.fullURI(subject);
    }
    return null;
  }
  propertyName(predicate) {
    if (predicate?.id) {
      predicate = predicate.id;
    }
    if (predicate == "a" || predicate == rdfType || this.fullURI(predicate) == rdfType) {
      return "a";
    }
    return this.shortURI(this.fullURI(predicate));
  }
  get(shortID) {
    return this.subjects[this.fullURI(shortID)];
  }
  getSubjects() {
    const subjects = /* @__PURE__ */ Object.create(null);
    this.#buildingSubjects = true;
    try {
      for (const graph2 of this.graphs) {
        for (const id2 of Object.keys(graph2.subjects)) {
          if (!subjects[id2]) {
            subjects[id2] = this.contextSubject(new NamedNode(id2, this));
          }
        }
      }
      for (const graph2 of this.graphs) {
        for (const [id2, subject] of Object.entries(graph2.subjects)) {
          this.mergeSubject(subjects[id2], subject, subjects);
        }
      }
    } finally {
      this.#buildingSubjects = false;
    }
    return subjects;
  }
  mergeSubject(target, source, subjects) {
    for (const [predicate, value] of Object.entries(source)) {
      if (predicate == "id") {
        continue;
      }
      const contextPredicate = predicate == "a" ? "a" : this.propertyName(source.graph.fullURI(predicate, null, "source"));
      target[contextPredicate] = mergeValue(
        target[contextPredicate],
        resolveValue(value, subjects, this)
      );
    }
  }
  contextSubject(subject) {
    const context = this;
    return new Proxy(subject, {
      set(target, property, value, receiver) {
        if (context.#buildingSubjects || typeof property == "symbol" || property == "id" || property == "graph") {
          return Reflect.set(target, property, value, receiver);
        }
        context.set(target.id, property, value);
        context.updateContextProperty(target, property);
        return true;
      },
      deleteProperty(target, property) {
        if (context.#buildingSubjects || typeof property == "symbol" || property == "id" || property == "graph") {
          return Reflect.deleteProperty(target, property);
        }
        context.delete(target.id, property);
        context.updateContextProperty(target, property);
        return true;
      }
    });
  }
  updateContextProperty(target, property) {
    const updated = this.get(target.id);
    if (updated && property in updated) {
      target[property] = updated[property];
    } else {
      delete target[property];
    }
  }
  fullURI(shortURI, separator = null) {
    if (!separator) {
      separator = this.separator;
    }
    const [prefix, path2] = shortURI.split(separator);
    if (path2 && this.prefixes[prefix]) {
      return this.prefixes[prefix] + path2;
    }
    return shortURI;
  }
  shortURI(fullURI, separator = null) {
    if (!separator) {
      separator = this.separator;
    }
    for (const prefix of this.prefixOrder) {
      if (fullURI.startsWith(this.prefixes[prefix])) {
        return prefix + separator + fullURI.substring(this.prefixes[prefix].length);
      }
    }
    return fullURI;
  }
  setType(literal3, shortType) {
    if (!shortType) {
      return literal3;
    }
    if (typeof literal3 == "string") {
      literal3 = new String(literal3);
    } else if (typeof literal3 == "number") {
      literal3 = new Number(literal3);
    }
    if (typeof literal3 !== "object") {
      throw new Error("cannot set type on ", literal3, shortType);
    }
    literal3.type = shortType;
    return literal3;
  }
  getType(literal3) {
    if (literal3 && typeof literal3 == "object") {
      return literal3.type;
    }
    return null;
  }
};
var Graph = class {
  #blankNodes = /* @__PURE__ */ Object.create(null);
  constructor(quads, url3, mimetype, prefixes4, context, originalSource = null) {
    this.mimetype = mimetype;
    this.url = url3;
    this.prefixes = prefixes4;
    this.context = context;
    this.originalSource = originalSource;
    this.subjects = /* @__PURE__ */ Object.create(null);
    for (let quad3 of quads) {
      let subject;
      if (quad3.subject.termType == "BlankNode") {
        let shortPred = this.shortURI(quad3.predicate.id, ":");
        let shortObj;
        switch (shortPred) {
          case "rdf:first":
            subject = this.addCollection(quad3.subject.id);
            shortObj = quad3.object.id ? this.shortURI(quad3.object.id, ":") : null;
            if (shortObj != "rdf:nil") {
              const value = this.getValue(quad3.object);
              if (value) {
                subject.push(value);
              }
            }
            continue;
          case "rdf:rest":
            this.#blankNodes[quad3.object.id] = this.#blankNodes[quad3.subject.id];
            continue;
          default:
            subject = this.addBlankNode(quad3.subject.id);
            break;
        }
      } else {
        subject = this.addNamedNode(quad3.subject.id);
      }
      subject.addPredicate(quad3.predicate.id, quad3.object);
    }
    if (this.subjects[url3]) {
      this.primary = this.subjects[url3];
    } else {
      this.primary = null;
    }
    Object.defineProperty(this, "data", {
      get() {
        return Object.values(this.subjects);
      }
    });
  }
  addNamedNode(uri) {
    let absURI = new URL(uri, this.url).href;
    if (!this.subjects[absURI]) {
      this.subjects[absURI] = new NamedNode(absURI, this);
    }
    return this.subjects[absURI];
  }
  addBlankNode(id2) {
    if (!this.#blankNodes[id2]) {
      this.#blankNodes[id2] = new BlankNode(this);
    }
    return this.#blankNodes[id2];
  }
  addCollection(id2) {
    if (!this.#blankNodes[id2]) {
      this.#blankNodes[id2] = new Collection(this);
    }
    return this.#blankNodes[id2];
  }
  write() {
    return this.context.writer(this);
  }
  patch() {
    if (!this.context.patchWriter) {
      throw new Error("Cannot generate a patch without a configured patchWriter");
    }
    return this.context.patchWriter(this);
  }
  get(shortID) {
    return this.subjects[this.fullURI(shortID)];
  }
  prefixEntries(preference = "source") {
    const sourcePrefixes = this.prefixes ?? {};
    const sourceOrder = Object.keys(sourcePrefixes);
    const contextPrefixes = this.context.prefixes ?? {};
    const contextOrder = this.context.prefixOrder ?? Object.keys(contextPrefixes);
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const seenIRIs = /* @__PURE__ */ new Set();
    const add2 = (prefixes4, order, skipKnownIRIs = false) => {
      for (const prefix of order) {
        if (!Object.prototype.hasOwnProperty.call(prefixes4, prefix)) {
          continue;
        }
        const iri = prefixes4[prefix];
        if (!seen.has(prefix) && (!skipKnownIRIs || !seenIRIs.has(iri))) {
          entries.push([prefix, iri]);
          seen.add(prefix);
          seenIRIs.add(iri);
        }
      }
      for (const prefix of Object.keys(prefixes4)) {
        const iri = prefixes4[prefix];
        if (!seen.has(prefix) && (!skipKnownIRIs || !seenIRIs.has(iri))) {
          entries.push([prefix, iri]);
          seen.add(prefix);
          seenIRIs.add(iri);
        }
      }
    };
    if (preference == "context") {
      add2(contextPrefixes, contextOrder);
      add2(sourcePrefixes, sourceOrder, true);
    } else {
      add2(sourcePrefixes, sourceOrder);
      add2(contextPrefixes, contextOrder, true);
    }
    return entries;
  }
  prefixDeclarations(preference = "source") {
    return Object.fromEntries(this.prefixEntries(preference));
  }
  propertyName(predicate, preference = "source") {
    if (predicate?.id) {
      predicate = predicate.id;
    }
    const fullPredicate = this.fullURI(predicate, null, preference);
    if (predicate == "a" || fullPredicate == rdfType) {
      return "a";
    }
    return this.shortURI(fullPredicate, null, "source");
  }
  set(subject, predicate, value, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const node = this.ensureSubject(subject, preference);
    const property = this.propertyName(predicate, preference);
    if (property == "a") {
      node.a = this.normalizeTypeValues(value, preference);
    } else {
      node[property] = this.normalizeValues(value, preference);
    }
    return node;
  }
  add(subject, predicate, value, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const node = this.ensureSubject(subject, preference);
    const property = this.propertyName(predicate, preference);
    const newValue = property == "a" ? this.normalizeTypeValues(value, preference) : this.normalizeValues(value, preference);
    node[property] = mergeValue(node[property], newValue);
    return node;
  }
  delete(subject, predicate = null, value = void 0, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const hasValue = options.hasValue ?? arguments.length >= 3;
    const node = this.findSubject(subject, preference);
    if (!node) {
      return false;
    }
    if (!predicate) {
      if (node.id) {
        delete this.subjects[node.id];
        if (this.primary === node) {
          this.primary = null;
        }
      }
      return true;
    }
    const property = this.propertyName(predicate, preference);
    if (!(property in node)) {
      return false;
    }
    if (!hasValue) {
      delete node[property];
      return true;
    }
    const deleteValues = property == "a" ? values2(this.normalizeTypeValues(value, preference)) : values2(this.normalizeValues(value, preference));
    const remaining = values2(node[property]).filter((item) => !deleteValues.some((deleteValue) => sameValue(item, deleteValue)));
    if (remaining.length == values2(node[property]).length) {
      return false;
    }
    if (remaining.length == 0) {
      delete node[property];
    } else if (remaining.length == 1) {
      node[property] = remaining[0];
    } else {
      node[property] = remaining;
    }
    return true;
  }
  ensureSubject(subject, preference = "source") {
    if (subject instanceof BlankNode && !(subject instanceof NamedNode)) {
      if (subject.graph !== this) {
        throw new Error("Cannot write a blank node into a different graph");
      }
      return subject;
    }
    if (subject instanceof NamedNode) {
      return this.addNamedNode(subject.id);
    }
    return this.addNamedNode(this.fullURI(subject, null, preference));
  }
  findSubject(subject, preference = "source") {
    if (subject instanceof BlankNode && !(subject instanceof NamedNode)) {
      return subject.graph === this ? subject : null;
    }
    const id2 = subject?.id ? subject.id : this.fullURI(subject, null, preference);
    return this.subjects[id2];
  }
  normalizeValues(value, preference = "source") {
    if (Array.isArray(value) && !(value instanceof Collection)) {
      return value.map((item) => this.normalizeValue(item, preference));
    }
    return this.normalizeValue(value, preference);
  }
  normalizeValue(value, preference = "source") {
    if (value instanceof Collection) {
      const collection = new Collection(this);
      for (const item of value) {
        collection.push(this.normalizeValue(item, preference));
      }
      return collection;
    }
    if (value instanceof NamedNode) {
      return this.addNamedNode(value.id);
    }
    if (value instanceof BlankNode) {
      if (value.graph !== this) {
        throw new Error("Cannot write a blank node into a different graph");
      }
      return value;
    }
    if (this.looksLikeURI(value, preference)) {
      return this.addNamedNode(this.fullURI(value, null, preference));
    }
    return value;
  }
  normalizeTypeValues(value, preference = "source") {
    if (Array.isArray(value) && !(value instanceof Collection)) {
      return value.map((item) => this.normalizeTypeValue(item, preference));
    }
    return this.normalizeTypeValue(value, preference);
  }
  normalizeTypeValue(value, preference = "source") {
    if (value instanceof NamedNode) {
      return this.shortURI(value.id, null, "source");
    }
    return this.shortURI(this.fullURI(value, null, preference), null, "source");
  }
  looksLikeURI(value, preference = "source") {
    if (typeof value != "string") {
      return false;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return true;
    }
    const [prefix, path2] = value.split(this.context.separator);
    return Boolean(path2 && this.prefixEntries(preference).some(([candidate]) => candidate == prefix));
  }
  fullURI(shortURI, separator = null, preference = "source") {
    if (!separator) {
      separator = this.context.separator;
    }
    const [prefix, path2] = String(shortURI).split(separator);
    if (path2) {
      for (const [candidate, iri] of this.prefixEntries(preference)) {
        if (candidate == prefix) {
          return iri + path2;
        }
      }
    }
    return shortURI;
  }
  shortURI(fullURI, separator = null, preference = "source") {
    if (!separator) {
      separator = this.context.separator;
    }
    for (const [prefix, iri] of this.prefixEntries(preference)) {
      if (fullURI.startsWith(iri)) {
        return prefix + separator + fullURI.substring(iri.length);
      }
    }
    if (this.url && fullURI.startsWith(this.url)) {
      return fullURI.substring(this.url.length);
    }
    return fullURI;
  }
  /**
   * This sets the type of a literal, usually one of the xsd types
   */
  setType(literal3, type) {
    const shortType = this.shortURI(type);
    return this.context.setType(literal3, shortType);
  }
  /**
   * This returns the type of a literal, or null
   */
  getType(literal3) {
    return this.context.getType(literal3);
  }
  setLanguage(literal3, language) {
    if (typeof literal3 == "string") {
      literal3 = new String(literal3);
    } else if (typeof literal3 == "number") {
      literal3 = new Number(literal3);
    }
    if (typeof literal3 !== "object") {
      throw new Error("cannot set language on ", literal3);
    }
    literal3.language = language;
    return literal3;
  }
  getValue(object) {
    let result;
    if (object.termType == "Literal") {
      result = object.value;
      let datatype = object.datatype?.id;
      if (datatype) {
        result = this.setType(result, datatype);
      }
      let language = object.language;
      if (language) {
        result = this.setLanguage(result, language);
      }
    } else if (object.termType == "BlankNode") {
      result = this.addBlankNode(object.id);
    } else {
      result = this.addNamedNode(object.id);
    }
    return result;
  }
};
var BlankNode = class {
  constructor(graph2) {
    Object.defineProperty(this, "graph", {
      value: graph2,
      writable: false,
      enumerable: false
    });
  }
  addPredicate(predicate, object) {
    if (predicate.id) {
      predicate = predicate.id;
    }
    if (predicate == rdfType) {
      let type = this.graph.shortURI(object.id);
      this.addType(type);
    } else {
      const value = this.graph.getValue(object);
      predicate = this.graph.shortURI(predicate);
      if (!this[predicate]) {
        this[predicate] = value;
      } else if (Array.isArray(this[predicate])) {
        this[predicate].push(value);
      } else {
        this[predicate] = [this[predicate], value];
      }
    }
  }
  /**
   * Adds a rdfType value, stored in this.a
   * Subjects can have more than one type (or class), unlike literals
   * The type value can be any URI, xsdTypes are unexpected here
   */
  addType(type) {
    if (!this.a) {
      this.a = type;
    } else {
      if (!Array.isArray(this.a)) {
        this.a = [this.a];
      }
      this.a.push(type);
    }
  }
};
var NamedNode = class extends BlankNode {
  constructor(id2, graph2) {
    super(graph2);
    Object.defineProperty(this, "id", {
      value: id2,
      writable: false,
      enumerable: true
    });
  }
};
var Collection = class extends Array {
  constructor(graph2) {
    super();
    Object.defineProperty(this, "graph", {
      value: graph2,
      writable: false,
      enumerable: false
    });
  }
};

// ../solid-tools/node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var oldm_n3_exports = {};
__export(oldm_n3_exports, {
  n3Parser: () => n3Parser,
  n3PatchWriter: () => n3PatchWriter,
  n3Writer: () => n3Writer
});

// ../solid-tools/node_modules/n3/src/N3Lexer.js
var import_buffer = __toESM(require_buffer());

// ../solid-tools/node_modules/n3/src/IRIs.js
var RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var XSD = "http://www.w3.org/2001/XMLSchema#";
var SWAP = "http://www.w3.org/2000/10/swap/";
var IRIs_default = {
  xsd: {
    decimal: `${XSD}decimal`,
    boolean: `${XSD}boolean`,
    double: `${XSD}double`,
    integer: `${XSD}integer`,
    string: `${XSD}string`
  },
  rdf: {
    type: `${RDF}type`,
    nil: `${RDF}nil`,
    first: `${RDF}first`,
    rest: `${RDF}rest`,
    langString: `${RDF}langString`,
    dirLangString: `${RDF}dirLangString`,
    reifies: `${RDF}reifies`
  },
  owl: {
    sameAs: "http://www.w3.org/2002/07/owl#sameAs"
  },
  r: {
    forSome: `${SWAP}reify#forSome`,
    forAll: `${SWAP}reify#forAll`
  },
  log: {
    implies: `${SWAP}log#implies`,
    isImpliedBy: `${SWAP}log#isImpliedBy`
  }
};

// ../solid-tools/node_modules/n3/src/N3Lexer.js
var { xsd } = IRIs_default;
var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\([^])/g;
var escapeReplacements = {
  "\\": "\\",
  "'": "'",
  '"': '"',
  "n": "\n",
  "r": "\r",
  "t": "	",
  "f": "\f",
  "b": "\b",
  "_": "_",
  "~": "~",
  ".": ".",
  "-": "-",
  "!": "!",
  "$": "$",
  "&": "&",
  "(": "(",
  ")": ")",
  "*": "*",
  "+": "+",
  ",": ",",
  ";": ";",
  "=": "=",
  "/": "/",
  "?": "?",
  "#": "#",
  "@": "@",
  "%": "%"
};
var illegalIriChars = /[\x00-\x20<>\\"\{\}\|\^\`]/;
function isSurrogateCodePoint(charCode) {
  return charCode >= 55296 && charCode <= 57343;
}
var lineModeRegExps = {
  _iri: true,
  _unescapedIri: true,
  _simpleQuotedString: true,
  _langcode: true,
  _dircode: true,
  _blank: true,
  _newline: true,
  _comment: true,
  _whitespace: true,
  _endOfFile: true
};
var invalidRegExp = /$0^/;
var N3Lexer = class {
  constructor(options) {
    this._iri = /^<((?:[^ <>{}\\]|\\[uU])+)>[ \t]*/;
    this._unescapedIri = /^<([^\x00-\x20<>\\"\{\}\|\^\`]*)>[ \t]*/;
    this._simpleQuotedString = /^"([^"\\\r\n]*)"(?=[^"])/;
    this._simpleApostropheString = /^'([^'\\\r\n]*)'(?=[^'])/;
    this._langcode = /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9])/i;
    this._dircode = /^--(ltr)|(rtl)/;
    this._prefix = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=[#\s<])/;
    this._prefixed = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?:[ \t]+|(?=\.?[,;!\^\s#()\[\]\{\}"'<>]))/;
    this._variable = /^\?(?:(?:[A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=[.,;!\^\s#()\[\]\{\}"'<>])/;
    this._blank = /^_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?:[ \t]+|(?=\.?[,;:\s#()\[\]\{\}"'<>]))/;
    this._number = /^[\-+]?(?:(\d+\.\d*|\.?\d+)[eE][\-+]?|\d*(\.)?)\d+(?=\.?[,;:\s#()\[\]\{\}"'<>])/;
    this._boolean = /^(?:true|false)(?=[.,;\s#()\[\]\{\}"'<>])/;
    this._atKeyword = /^@[a-z]+(?=[\s#<:])/i;
    this._keyword = /^(?:PREFIX|BASE|VERSION|GRAPH)(?=[\s#<])/i;
    this._shortPredicates = /^a(?=[\s#()\[\]\{\}"'<>])/;
    this._newline = /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/;
    this._comment = /#([^\n\r]*)/;
    this._whitespace = /^[ \t]+/;
    this._endOfFile = /^(?:#[^\n\r]*)?$/;
    options = options || {};
    this._isImpliedBy = options.isImpliedBy;
    if (this._lineMode = !!options.lineMode) {
      this._n3Mode = false;
      for (const key in this) {
        if (!(key in lineModeRegExps) && this[key] instanceof RegExp)
          this[key] = invalidRegExp;
      }
    } else {
      this._n3Mode = options.n3 !== false;
    }
    this.comments = !!options.comments;
    this._literalClosingPos = 0;
  }
  // ## Private methods
  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback
  _tokenizeToEnd(callback, inputFinished) {
    let input2 = this._input;
    let currentLineLength = input2.length;
    while (true) {
      let whiteSpaceMatch, comment;
      while (whiteSpaceMatch = this._newline.exec(input2)) {
        if (this.comments && (comment = this._comment.exec(whiteSpaceMatch[0])))
          emitToken("comment", comment[1], "", this._line, whiteSpaceMatch[0].length);
        input2 = input2.substr(whiteSpaceMatch[0].length, input2.length);
        currentLineLength = input2.length;
        this._line++;
      }
      if (!whiteSpaceMatch && (whiteSpaceMatch = this._whitespace.exec(input2)))
        input2 = input2.substr(whiteSpaceMatch[0].length, input2.length);
      if (this._endOfFile.test(input2)) {
        if (inputFinished) {
          if (this.comments && (comment = this._comment.exec(input2)))
            emitToken("comment", comment[1], "", this._line, input2.length);
          input2 = null;
          emitToken("eof", "", "", this._line, 0);
        }
        return this._input = input2;
      }
      const line = this._line, firstChar = input2[0];
      let type = "", value = "", prefix = "", match = null, matchLength = 0, inconclusive = false;
      switch (firstChar) {
        case "^":
          if (input2.length < 3)
            break;
          else if (input2[1] === "^") {
            this._previousMarker = "^^";
            input2 = input2.substr(2);
            if (input2[0] !== "<") {
              inconclusive = true;
              break;
            }
          } else {
            if (this._n3Mode) {
              matchLength = 1;
              type = "^";
            }
            break;
          }
        // Fall through in case the type is an IRI
        case "<":
          if (match = this._unescapedIri.exec(input2))
            type = "IRI", value = match[1];
          else if (match = this._iri.exec(input2)) {
            value = this._unescape(match[1]);
            if (value === null || illegalIriChars.test(value))
              return reportSyntaxError(this);
            type = "IRI";
          } else if (input2.length > 2 && input2[1] === "<" && input2[2] === "(")
            type = "<<(", matchLength = 3;
          else if (!this._lineMode && input2.length > (inputFinished ? 1 : 2) && input2[1] === "<")
            type = "<<", matchLength = 2;
          else if (this._n3Mode && input2.length > 1 && input2[1] === "=") {
            matchLength = 2;
            if (this._isImpliedBy) type = "abbreviation", value = "<";
            else type = "inverse", value = ">";
          }
          break;
        case ">":
          if (input2.length > 1 && input2[1] === ">")
            type = ">>", matchLength = 2;
          break;
        case "_":
          if ((match = this._blank.exec(input2)) || inputFinished && (match = this._blank.exec(`${input2} `)))
            type = "blank", prefix = "_", value = match[1];
          break;
        case '"':
          if (match = this._simpleQuotedString.exec(input2))
            value = match[1];
          else {
            ({ value, matchLength } = this._parseLiteral(input2));
            if (value === null)
              return reportSyntaxError(this);
          }
          if (match !== null || matchLength !== 0) {
            type = "literal";
            this._literalClosingPos = 0;
          }
          break;
        case "'":
          if (!this._lineMode) {
            if (match = this._simpleApostropheString.exec(input2))
              value = match[1];
            else {
              ({ value, matchLength } = this._parseLiteral(input2));
              if (value === null)
                return reportSyntaxError(this);
            }
            if (match !== null || matchLength !== 0) {
              type = "literal";
              this._literalClosingPos = 0;
            }
          }
          break;
        case "?":
          if (this._n3Mode && (match = this._variable.exec(input2)))
            type = "var", value = match[0];
          break;
        case "@":
          if (this._previousMarker === "literal" && (match = this._langcode.exec(input2)) && match[1] !== "version")
            type = "langcode", value = match[1];
          else if (match = this._atKeyword.exec(input2))
            type = match[0];
          break;
        case ".":
          if (input2.length === 1 ? inputFinished : input2[1] < "0" || input2[1] > "9") {
            type = ".";
            matchLength = 1;
            break;
          }
        // Fall through to numerical case (could be a decimal dot)
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "+":
        case "-":
          if (input2[1] === "-") {
            if (this._previousMarker === "langcode" && (match = this._dircode.exec(input2)))
              type = "dircode", matchLength = 2, value = match[1] || match[2], matchLength = value.length + 2;
            break;
          }
          if (match = this._number.exec(input2) || inputFinished && (match = this._number.exec(`${input2} `))) {
            type = "literal", value = match[0];
            prefix = typeof match[1] === "string" ? xsd.double : typeof match[2] === "string" ? xsd.decimal : xsd.integer;
          }
          break;
        case "B":
        case "b":
        case "p":
        case "P":
        case "G":
        case "g":
        case "V":
        case "v":
          if (match = this._keyword.exec(input2))
            type = match[0].toUpperCase();
          else
            inconclusive = true;
          break;
        case "f":
        case "t":
          if (match = this._boolean.exec(input2))
            type = "literal", value = match[0], prefix = xsd.boolean;
          else
            inconclusive = true;
          break;
        case "a":
          if (match = this._shortPredicates.exec(input2))
            type = "abbreviation", value = "a";
          else
            inconclusive = true;
          break;
        case "=":
          if (this._n3Mode && input2.length > 1) {
            type = "abbreviation";
            if (input2[1] !== ">")
              matchLength = 1, value = "=";
            else
              matchLength = 2, value = ">";
          }
          break;
        case "!":
          if (!this._n3Mode)
            break;
        case ")":
          if (!inputFinished && (input2.length === 1 || input2.length === 2 && input2[1] === ">")) {
            break;
          }
          if (input2.length > 2 && input2[1] === ">" && input2[2] === ">") {
            type = ")>>", matchLength = 3;
            break;
          }
        case ",":
        case ";":
        case "[":
        case "]":
        case "(":
        case "}":
        case "~":
          if (!this._lineMode) {
            matchLength = 1;
            type = firstChar;
          }
          break;
        case "{":
          if (!this._lineMode && input2.length >= 2) {
            if (input2[1] === "|")
              type = "{|", matchLength = 2;
            else
              type = firstChar, matchLength = 1;
          }
          break;
        case "|":
          if (input2.length >= 2 && input2[1] === "}")
            type = "|}", matchLength = 2;
          break;
        default:
          inconclusive = true;
      }
      if (inconclusive) {
        if ((this._previousMarker === "@prefix" || this._previousMarker === "PREFIX") && (match = this._prefix.exec(input2)))
          type = "prefix", value = match[1] || "";
        else if ((match = this._prefixed.exec(input2)) || inputFinished && (match = this._prefixed.exec(`${input2} `)))
          type = "prefixed", prefix = match[1] || "", value = this._unescape(match[2]);
      }
      if (this._previousMarker === "^^") {
        switch (type) {
          case "prefixed":
            type = "type";
            break;
          case "IRI":
            type = "typeIRI";
            break;
          default:
            type = "";
        }
      }
      if (!type) {
        if (inputFinished || !/^'''|^"""/.test(input2) && /\n|\r/.test(input2))
          return reportSyntaxError(this);
        else
          return this._input = input2;
      }
      const length = matchLength || match[0].length;
      const token = emitToken(type, value, prefix, line, length);
      this.previousToken = token;
      this._previousMarker = type;
      input2 = input2.substr(length, input2.length);
    }
    function emitToken(type, value, prefix, line, length) {
      const start = input2 ? currentLineLength - input2.length : currentLineLength;
      const end = start + length;
      const token = { type, value, prefix, line, start, end };
      callback(null, token);
      return token;
    }
    function reportSyntaxError(self) {
      callback(self._syntaxError(/^\S*/.exec(input2)[0]));
    }
  }
  // ### `_unescape` replaces N3 escape codes by their corresponding characters
  _unescape(item) {
    let invalid = false;
    const replaced = item.replace(escapeSequence, (sequence, unicode4, unicode8, escapedChar) => {
      if (typeof unicode4 === "string") {
        const charCode = Number.parseInt(unicode4, 16);
        if (isSurrogateCodePoint(charCode)) {
          invalid = true;
          return "";
        }
        return String.fromCharCode(charCode);
      }
      if (typeof unicode8 === "string") {
        let charCode = Number.parseInt(unicode8, 16);
        if (isSurrogateCodePoint(charCode)) {
          invalid = true;
          return "";
        }
        return charCode <= 65535 ? String.fromCharCode(Number.parseInt(unicode8, 16)) : String.fromCharCode(55296 + ((charCode -= 65536) >> 10), 56320 + (charCode & 1023));
      }
      if (escapedChar in escapeReplacements)
        return escapeReplacements[escapedChar];
      invalid = true;
      return "";
    });
    return invalid ? null : replaced;
  }
  // ### `_parseLiteral` parses a literal into an unescaped value
  _parseLiteral(input2) {
    if (input2.length >= 3) {
      const opening = input2.match(/^(?:"""|"|'''|'|)/)[0];
      const openingLength = opening.length;
      let closingPos = Math.max(this._literalClosingPos, openingLength);
      while ((closingPos = input2.indexOf(opening, closingPos)) > 0) {
        let backslashCount = 0;
        while (input2[closingPos - backslashCount - 1] === "\\")
          backslashCount++;
        if (backslashCount % 2 === 0) {
          const raw2 = input2.substring(openingLength, closingPos);
          const lines = raw2.split(/\r\n|\r|\n/).length - 1;
          const matchLength = closingPos + openingLength;
          if (openingLength === 1 && lines !== 0 || openingLength === 3 && this._lineMode)
            break;
          this._line += lines;
          return { value: this._unescape(raw2), matchLength };
        }
        closingPos++;
      }
      this._literalClosingPos = input2.length - openingLength + 1;
    }
    return { value: "", matchLength: 0 };
  }
  // ### `_syntaxError` creates a syntax error for the given issue
  _syntaxError(issue) {
    this._input = null;
    const err = new Error(`Unexpected "${issue}" on line ${this._line}.`);
    err.context = {
      token: void 0,
      line: this._line,
      previousToken: this.previousToken
    };
    return err;
  }
  // ### Strips off any starting UTF BOM mark.
  _readStartingBom(input2) {
    return input2.startsWith("\uFEFF") ? input2.substr(1) : input2;
  }
  // ## Public methods
  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  tokenize(input2, callback) {
    this._line = 1;
    if (typeof input2 === "string") {
      this._input = this._readStartingBom(input2);
      if (typeof callback === "function")
        queueMicrotask(() => this._tokenizeToEnd(callback, true));
      else {
        const tokens = [];
        let error4;
        this._tokenizeToEnd((e, t) => e ? error4 = e : tokens.push(t), true);
        if (error4) throw error4;
        return tokens;
      }
    } else {
      this._pendingBuffer = null;
      if (typeof input2.setEncoding === "function")
        input2.setEncoding("utf8");
      input2.on("data", (data) => {
        if (this._input !== null && data.length !== 0) {
          if (this._pendingBuffer) {
            data = import_buffer.Buffer.concat([this._pendingBuffer, data]);
            this._pendingBuffer = null;
          }
          if (data[data.length - 1] & 128) {
            this._pendingBuffer = data;
          } else {
            if (typeof this._input === "undefined")
              this._input = this._readStartingBom(typeof data === "string" ? data : data.toString());
            else
              this._input += data;
            this._tokenizeToEnd(callback, false);
          }
        }
      });
      input2.on("end", () => {
        if (typeof this._input === "string")
          this._tokenizeToEnd(callback, true);
      });
      input2.on("error", callback);
    }
  }
};

// ../solid-tools/node_modules/n3/src/N3DataFactory.js
var { rdf, xsd: xsd2 } = IRIs_default;
var DEFAULTGRAPH;
var _blankNodeCounter = 0;
var DataFactory = {
  namedNode,
  blankNode,
  variable,
  literal,
  defaultGraph,
  quad,
  triple: quad,
  fromTerm,
  fromQuad
};
var N3DataFactory_default = DataFactory;
var Term = class _Term {
  constructor(id2) {
    this.id = id2;
  }
  // ### The value of this term
  get value() {
    return this.id;
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    if (other instanceof _Term)
      return this.id === other.id;
    return !!other && this.termType === other.termType && this.value === other.value;
  }
  // ### Implement hashCode for Immutable.js, since we implement `equals`
  // https://immutable-js.com/docs/v4.0.0/ValueObject/#hashCode()
  hashCode() {
    return 0;
  }
  // ### Returns a plain object representation of this term
  toJSON() {
    return {
      termType: this.termType,
      value: this.value
    };
  }
};
var NamedNode2 = class extends Term {
  // ### The term type of this term
  get termType() {
    return "NamedNode";
  }
};
var Literal = class _Literal extends Term {
  // ### The term type of this term
  get termType() {
    return "Literal";
  }
  // ### The text value of this literal
  get value() {
    return this.id.substring(1, this.id.lastIndexOf('"'));
  }
  // ### The language of this literal
  get language() {
    const id2 = this.id;
    let atPos = id2.lastIndexOf('"') + 1;
    const dirPos = id2.lastIndexOf("--");
    return atPos < id2.length && id2[atPos++] === "@" ? (dirPos > atPos ? id2.substr(0, dirPos) : id2).substr(atPos).toLowerCase() : "";
  }
  // ### The direction of this literal
  get direction() {
    const id2 = this.id;
    const endPos = id2.lastIndexOf('"');
    const dirPos = id2.lastIndexOf("--");
    return dirPos > endPos && dirPos + 2 < id2.length ? id2.substr(dirPos + 2).toLowerCase() : "";
  }
  // ### The datatype IRI of this literal
  get datatype() {
    return new NamedNode2(this.datatypeString);
  }
  // ### The datatype string of this literal
  get datatypeString() {
    const id2 = this.id, dtPos = id2.lastIndexOf('"') + 1;
    const char = dtPos < id2.length ? id2[dtPos] : "";
    return char === "^" ? id2.substr(dtPos + 2) : (
      // If "@" follows, return rdf:langString or rdf:dirLangString; xsd:string otherwise
      char !== "@" ? xsd2.string : id2.indexOf("--", dtPos) > 0 ? rdf.dirLangString : rdf.langString
    );
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    if (other instanceof _Literal)
      return this.id === other.id;
    return !!other && !!other.datatype && this.termType === other.termType && this.value === other.value && this.language === other.language && (this.direction === other.direction || this.direction === "" && !other.direction) && this.datatype.value === other.datatype.value;
  }
  toJSON() {
    return {
      termType: this.termType,
      value: this.value,
      language: this.language,
      direction: this.direction,
      datatype: { termType: "NamedNode", value: this.datatypeString }
    };
  }
};
var BlankNode2 = class extends Term {
  constructor(name) {
    super(`_:${name}`);
  }
  // ### The term type of this term
  get termType() {
    return "BlankNode";
  }
  // ### The name of this blank node
  get value() {
    return this.id.substr(2);
  }
};
var Variable = class extends Term {
  constructor(name) {
    super(`?${name}`);
  }
  // ### The term type of this term
  get termType() {
    return "Variable";
  }
  // ### The name of this variable
  get value() {
    return this.id.substr(1);
  }
};
var DefaultGraph = class extends Term {
  constructor() {
    super("");
    return DEFAULTGRAPH || this;
  }
  // ### The term type of this term
  get termType() {
    return "DefaultGraph";
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    return this === other || !!other && this.termType === other.termType;
  }
};
DEFAULTGRAPH = new DefaultGraph();
var Quad = class extends Term {
  constructor(subject, predicate, object, graph2) {
    super("");
    this._subject = subject;
    this._predicate = predicate;
    this._object = object;
    this._graph = graph2 || DEFAULTGRAPH;
  }
  // ### The term type of this term
  get termType() {
    return "Quad";
  }
  get subject() {
    return this._subject;
  }
  get predicate() {
    return this._predicate;
  }
  get object() {
    return this._object;
  }
  get graph() {
    return this._graph;
  }
  // ### Returns a plain object representation of this quad
  toJSON() {
    return {
      termType: this.termType,
      subject: this._subject.toJSON(),
      predicate: this._predicate.toJSON(),
      object: this._object.toJSON(),
      graph: this._graph.toJSON()
    };
  }
  // ### Returns whether this object represents the same quad as the other
  equals(other) {
    return !!other && this._subject.equals(other.subject) && this._predicate.equals(other.predicate) && this._object.equals(other.object) && this._graph.equals(other.graph);
  }
};
function namedNode(iri) {
  return new NamedNode2(iri);
}
function blankNode(name) {
  return new BlankNode2(name || `n3-${_blankNodeCounter++}`);
}
function literal(value, languageOrDataType) {
  if (typeof languageOrDataType === "string")
    return new Literal(`"${value}"@${languageOrDataType.toLowerCase()}`);
  if (languageOrDataType !== void 0 && !("termType" in languageOrDataType)) {
    return new Literal(`"${value}"@${languageOrDataType.language.toLowerCase()}${languageOrDataType.direction ? `--${languageOrDataType.direction.toLowerCase()}` : ""}`);
  }
  let datatype = languageOrDataType ? languageOrDataType.value : "";
  if (datatype === "") {
    if (typeof value === "boolean")
      datatype = xsd2.boolean;
    else if (typeof value === "number") {
      if (Number.isFinite(value))
        datatype = Number.isInteger(value) ? xsd2.integer : xsd2.double;
      else {
        datatype = xsd2.double;
        if (!Number.isNaN(value))
          value = value > 0 ? "INF" : "-INF";
      }
    }
  }
  return datatype === "" || datatype === xsd2.string ? new Literal(`"${value}"`) : new Literal(`"${value}"^^${datatype}`);
}
function variable(name) {
  return new Variable(name);
}
function defaultGraph() {
  return DEFAULTGRAPH;
}
function quad(subject, predicate, object, graph2) {
  return new Quad(subject, predicate, object, graph2);
}
function fromTerm(term) {
  if (term instanceof Term)
    return term;
  switch (term.termType) {
    case "NamedNode":
      return namedNode(term.value);
    case "BlankNode":
      return blankNode(term.value);
    case "Variable":
      return variable(term.value);
    case "DefaultGraph":
      return DEFAULTGRAPH;
    case "Literal":
      return literal(term.value, term.language || term.datatype);
    case "Quad":
      return fromQuad(term);
    default:
      throw new Error(`Unexpected termType: ${term.termType}`);
  }
}
function fromQuad(inQuad) {
  if (inQuad instanceof Quad)
    return inQuad;
  if (inQuad.termType !== "Quad")
    throw new Error(`Unexpected termType: ${inQuad.termType}`);
  return quad(fromTerm(inQuad.subject), fromTerm(inQuad.predicate), fromTerm(inQuad.object), fromTerm(inQuad.graph));
}

// ../solid-tools/node_modules/n3/src/N3Parser.js
var blankNodePrefix = 0;
var N3Parser = class _N3Parser {
  constructor(options) {
    this._contextStack = [];
    this._graph = null;
    options = options || {};
    this._setBase(options.baseIRI);
    options.factory && initDataFactory(this, options.factory);
    const format = typeof options.format === "string" ? options.format.match(/\w*$/)[0].toLowerCase() : "", isTurtle = /turtle/.test(format), isTriG = /trig/.test(format), isNTriples = /triple/.test(format), isNQuads = /quad/.test(format), isN3 = this._n3Mode = /n3/.test(format), isLineMode = isNTriples || isNQuads;
    if (!(this._supportsNamedGraphs = !(isTurtle || isN3)))
      this._readPredicateOrNamedGraph = this._readPredicate;
    this._supportsQuads = !(isTurtle || isTriG || isNTriples || isN3);
    this._isImpliedBy = options.isImpliedBy;
    if (isLineMode)
      this._resolveRelativeIRI = (iri) => {
        return null;
      };
    this._blankNodePrefix = typeof options.blankNodePrefix !== "string" ? "" : options.blankNodePrefix.replace(/^(?!_:)/, "_:");
    this._lexer = options.lexer || new N3Lexer({ lineMode: isLineMode, n3: isN3, isImpliedBy: this._isImpliedBy });
    this._explicitQuantifiers = !!options.explicitQuantifiers;
    this._parseUnsupportedVersions = !!options.parseUnsupportedVersions;
    this._version = options.version;
  }
  // ## Static class methods
  // ### `_resetBlankNodePrefix` restarts blank node prefix identification
  static _resetBlankNodePrefix() {
    blankNodePrefix = 0;
  }
  // ## Private methods
  // ### `_setBase` sets the base IRI to resolve relative IRIs
  _setBase(baseIRI) {
    if (!baseIRI) {
      this._base = "";
      this._basePath = "";
    } else {
      const fragmentPos = baseIRI.indexOf("#");
      if (fragmentPos >= 0)
        baseIRI = baseIRI.substr(0, fragmentPos);
      this._base = baseIRI;
      this._basePath = baseIRI.indexOf("/") < 0 ? baseIRI : baseIRI.replace(/[^\/?]*(?:\?.*)?$/, "");
      baseIRI = baseIRI.match(/^(?:([a-z][a-z0-9+.-]*:))?(?:\/\/[^\/]*)?/i);
      this._baseRoot = baseIRI[0];
      this._baseScheme = baseIRI[1];
    }
  }
  // ### `_saveContext` stores the current parsing context
  // when entering a new scope (list, blank node, formula)
  _saveContext(type, graph2, subject, predicate, object) {
    const n3Mode = this._n3Mode;
    this._contextStack.push({
      type,
      subject,
      predicate,
      object,
      graph: graph2,
      inverse: n3Mode ? this._inversePredicate : false,
      blankPrefix: n3Mode ? this._prefixes._ : "",
      quantified: n3Mode ? this._quantified : null
    });
    if (n3Mode) {
      this._inversePredicate = false;
      this._prefixes._ = this._graph ? `${this._graph.value}.` : ".";
      this._quantified = Object.create(this._quantified);
    }
  }
  // ### `_restoreContext` restores the parent context
  // when leaving a scope (list, blank node, formula)
  _restoreContext(type, token) {
    const context = this._contextStack.pop();
    if (!context || context.type !== type)
      return this._error(`Unexpected ${token.type}`, token);
    this._subject = context.subject;
    this._predicate = context.predicate;
    this._object = context.object;
    this._graph = context.graph;
    if (this._n3Mode) {
      this._inversePredicate = context.inverse;
      this._prefixes._ = context.blankPrefix;
      this._quantified = context.quantified;
    }
  }
  // ### `_readBeforeTopContext` is called once only at the start of parsing.
  _readBeforeTopContext(token) {
    if (this._version && !this._isValidVersion(this._version))
      return this._error(`Detected unsupported version as media type parameter: "${this._version}"`, token);
    return this._readInTopContext(token);
  }
  // ### `_readInTopContext` reads a token when in the top context
  _readInTopContext(token) {
    switch (token.type) {
      // If an EOF token arrives in the top context, signal that we're done
      case "eof":
        if (this._graph !== null)
          return this._error("Unclosed graph", token);
        delete this._prefixes._;
        return this._callback(null, null, this._prefixes);
      // It could be a prefix declaration
      case "PREFIX":
        this._sparqlStyle = true;
      case "@prefix":
        return this._readPrefix;
      // It could be a base declaration
      case "BASE":
        this._sparqlStyle = true;
      case "@base":
        return this._readBaseIRI;
      // It could be a version declaration
      case "VERSION":
        this._sparqlStyle = true;
      case "@version":
        return this._readVersion;
      // It could be a graph
      case "{":
        if (this._supportsNamedGraphs) {
          this._graph = "";
          this._subject = null;
          return this._readSubject;
        }
      case "GRAPH":
        if (this._supportsNamedGraphs)
          return this._readNamedGraphLabel;
      // Otherwise, the next token must be a subject
      default:
        return this._readSubject(token);
    }
  }
  // ### `_readEntity` reads an IRI, prefixed name, blank node, or variable
  _readEntity(token, quantifier) {
    let value;
    switch (token.type) {
      // Read a relative or absolute IRI
      case "IRI":
      case "typeIRI":
        const iri = this._resolveIRI(token.value);
        if (iri === null)
          return this._error("Invalid IRI", token);
        value = this._factory.namedNode(iri);
        break;
      // Read a prefixed name
      case "type":
      case "prefixed":
        const prefix = this._prefixes[token.prefix];
        if (prefix === void 0)
          return this._error(`Undefined prefix "${token.prefix}:"`, token);
        value = this._factory.namedNode(prefix + token.value);
        break;
      // Read a blank node
      case "blank":
        value = this._factory.blankNode(this._prefixes[token.prefix] + token.value);
        break;
      // Read a variable
      case "var":
        value = this._factory.variable(token.value.substr(1));
        break;
      // Everything else is not an entity
      default:
        return this._error(`Expected entity but got ${token.type}`, token);
    }
    if (!quantifier && this._n3Mode && value.id in this._quantified)
      value = this._quantified[value.id];
    return value;
  }
  // ### `_readSubject` reads a quad's subject
  _readSubject(token) {
    this._predicate = null;
    switch (token.type) {
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          this._subject = this._factory.blankNode(),
          null,
          null
        );
        return this._readBlankNodeHead;
      case "(":
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent.type === "<<") {
          return this._error("Unexpected list in reified triple", token);
        }
        this._saveContext("list", this._graph, this.RDF_NIL, null, null);
        this._subject = null;
        return this._readListItem;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._graph = this._factory.blankNode(),
          null,
          null
        );
        return this._readSubject;
      case "}":
        return this._readPunctuation(token);
      case "@forSome":
        if (!this._n3Mode)
          return this._error('Unexpected "@forSome"', token);
        this._subject = null;
        this._predicate = this.N3_FORSOME;
        this._quantifier = "blankNode";
        return this._readQuantifierList;
      case "@forAll":
        if (!this._n3Mode)
          return this._error('Unexpected "@forAll"', token);
        this._subject = null;
        this._predicate = this.N3_FORALL;
        this._quantifier = "variable";
        return this._readQuantifierList;
      case "literal":
        if (!this._n3Mode)
          return this._error("Unexpected literal", token);
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._completeSubjectLiteral;
        } else
          this._subject = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
        break;
      case "<<(":
        if (!this._n3Mode)
          return this._error("Disallowed triple term as subject", token);
        this._saveContext("<<(", this._graph, null, null, null);
        this._graph = null;
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, null, null, null);
        this._graph = null;
        return this._readSubject;
      default:
        if ((this._subject = this._readEntity(token)) === void 0)
          return;
        if (this._n3Mode)
          return this._getPathReader(this._readPredicateOrNamedGraph);
    }
    return this._readPredicateOrNamedGraph;
  }
  // ### `_readPredicate` reads a quad's predicate
  _readPredicate(token) {
    const type = token.type;
    switch (type) {
      case "inverse":
        this._inversePredicate = true;
      case "abbreviation":
        this._predicate = this.ABBREVIATIONS[token.value];
        break;
      case ".":
      case "]":
      case "}":
      case "|}":
        if (this._predicate === null)
          return this._error(`Unexpected ${type}`, token);
        this._subject = null;
        return type === "]" ? this._readBlankNodeTail(token) : this._readPunctuation(token);
      case ";":
        return this._predicate !== null ? this._readPredicate : this._error("Expected predicate but got ;", token);
      case "[":
        if (this._n3Mode) {
          this._saveContext(
            "blank",
            this._graph,
            this._subject,
            this._subject = this._factory.blankNode(),
            null
          );
          return this._readBlankNodeHead;
        }
      case "blank":
        if (!this._n3Mode)
          return this._error("Disallowed blank node as predicate", token);
      default:
        if ((this._predicate = this._readEntity(token)) === void 0)
          return;
    }
    this._validAnnotation = true;
    return this._readObject;
  }
  // ### `_readObject` reads a quad's object
  _readObject(token) {
    switch (token.type) {
      case "literal":
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._readDataTypeOrLang;
        } else
          this._object = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
        break;
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          this._subject,
          this._predicate,
          this._subject = this._factory.blankNode()
        );
        return this._readBlankNodeHead;
      case "(":
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent.type === "<<") {
          return this._error("Unexpected list in reified triple", token);
        }
        this._saveContext("list", this._graph, this._subject, this._predicate, this.RDF_NIL);
        this._subject = null;
        return this._readListItem;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._subject,
          this._predicate,
          this._graph = this._factory.blankNode()
        );
        return this._readSubject;
      case "<<(":
        this._saveContext("<<(", this._graph, this._subject, this._predicate, null);
        this._graph = null;
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, this._subject, this._predicate, null);
        this._graph = null;
        return this._readSubject;
      default:
        if ((this._object = this._readEntity(token)) === void 0)
          return;
        if (this._n3Mode)
          return this._getPathReader(this._getContextEndReader());
    }
    return this._getContextEndReader();
  }
  // ### `_readPredicateOrNamedGraph` reads a quad's predicate, or a named graph
  _readPredicateOrNamedGraph(token) {
    return token.type === "{" ? this._readGraph(token) : this._readPredicate(token);
  }
  // ### `_readGraph` reads a graph
  _readGraph(token) {
    if (token.type !== "{")
      return this._error(`Expected graph but got ${token.type}`, token);
    this._graph = this._subject, this._subject = null;
    return this._readSubject;
  }
  // ### `_readBlankNodeHead` reads the head of a blank node
  _readBlankNodeHead(token) {
    if (token.type === "]") {
      this._subject = null;
      return this._readBlankNodeTail(token);
    } else {
      const stack = this._contextStack, parentParent = stack.length > 1 && stack[stack.length - 2];
      if (parentParent.type === "<<") {
        return this._error("Unexpected compound blank node expression in reified triple", token);
      }
      this._predicate = null;
      return this._readPredicate(token);
    }
  }
  // ### `_readBlankNodeTail` reads the end of a blank node
  _readBlankNodeTail(token) {
    if (token.type !== "]")
      return this._readBlankNodePunctuation(token);
    if (this._subject !== null)
      this._emit(this._subject, this._predicate, this._object, this._graph);
    const empty = this._predicate === null;
    this._restoreContext("blank", token);
    if (this._object !== null)
      return this._getContextEndReader();
    else if (this._predicate !== null)
      return this._readObject;
    else
      return empty ? this._readPredicateOrNamedGraph : this._readPredicateAfterBlank;
  }
  // ### `_readPredicateAfterBlank` reads a predicate after an anonymous blank node
  _readPredicateAfterBlank(token) {
    switch (token.type) {
      case ".":
      case "}":
        this._subject = null;
        return this._readPunctuation(token);
      default:
        return this._readPredicate(token);
    }
  }
  // ### `_readListItem` reads items from a list
  _readListItem(token) {
    let item = null, list2 = null, next = this._readListItem;
    const previousList = this._subject, stack = this._contextStack, parent = stack[stack.length - 1];
    switch (token.type) {
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          list2 = this._factory.blankNode(),
          this.RDF_FIRST,
          this._subject = item = this._factory.blankNode()
        );
        next = this._readBlankNodeHead;
        break;
      case "(":
        this._saveContext(
          "list",
          this._graph,
          list2 = this._factory.blankNode(),
          this.RDF_FIRST,
          this.RDF_NIL
        );
        this._subject = null;
        break;
      case ")":
        this._restoreContext("list", token);
        if (stack.length !== 0 && stack[stack.length - 1].type === "list")
          this._emit(this._subject, this._predicate, this._object, this._graph);
        if (this._predicate === null) {
          next = this._readPredicate;
          if (this._subject === this.RDF_NIL)
            return next;
        } else {
          next = this._getContextEndReader();
          if (this._object === this.RDF_NIL)
            return next;
        }
        list2 = this.RDF_NIL;
        break;
      case "literal":
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          next = this._readListItemDataTypeOrLang;
        } else {
          item = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
          next = this._getContextEndReader();
        }
        break;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._subject,
          this._predicate,
          this._graph = this._factory.blankNode()
        );
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, null, null, null);
        this._graph = null;
        next = this._readSubject;
        break;
      default:
        if ((item = this._readEntity(token)) === void 0)
          return;
    }
    if (list2 === null)
      this._subject = list2 = this._factory.blankNode();
    if (token.type === "<<")
      stack[stack.length - 1].subject = this._subject;
    if (previousList === null) {
      if (parent.predicate === null)
        parent.subject = list2;
      else
        parent.object = list2;
    } else {
      this._emit(previousList, this.RDF_REST, list2, this._graph);
    }
    if (item !== null) {
      if (this._n3Mode && (token.type === "IRI" || token.type === "prefixed")) {
        this._saveContext("item", this._graph, list2, this.RDF_FIRST, item);
        this._subject = item, this._predicate = null;
        return this._getPathReader(this._readListItem);
      }
      this._emit(list2, this.RDF_FIRST, item, this._graph);
    }
    return next;
  }
  // ### `_readDataTypeOrLang` reads an _optional_ datatype or language
  _readDataTypeOrLang(token) {
    return this._completeObjectLiteral(token, false);
  }
  // ### `_readListItemDataTypeOrLang` reads an _optional_ datatype or language in a list
  _readListItemDataTypeOrLang(token) {
    return this._completeObjectLiteral(token, true);
  }
  // ### `_completeLiteral` completes a literal with an optional datatype or language
  _completeLiteral(token, component) {
    let literal3 = this._factory.literal(this._literalValue);
    let readCb;
    switch (token.type) {
      // Create a datatyped literal
      case "type":
      case "typeIRI":
        const datatype = this._readEntity(token);
        if (datatype === void 0) return;
        if (datatype.value === IRIs_default.rdf.langString || datatype.value === IRIs_default.rdf.dirLangString) {
          return this._error("Detected illegal (directional) languaged-tagged string with explicit datatype", token);
        }
        literal3 = this._factory.literal(this._literalValue, datatype);
        token = null;
        break;
      // Create a language-tagged string
      case "langcode":
        if (token.value.split("-").some((t) => t.length > 8))
          return this._error("Detected language tag with subtag longer than 8 characters", token);
        literal3 = this._factory.literal(this._literalValue, token.value);
        this._literalLanguage = token.value;
        token = null;
        readCb = this._readDirCode.bind(this, component);
        break;
    }
    return { token, literal: literal3, readCb };
  }
  _readDirCode(component, listItem, token) {
    if (token.type === "dircode") {
      const term = this._factory.literal(this._literalValue, { language: this._literalLanguage, direction: token.value });
      if (component === "subject")
        this._subject = term;
      else
        this._object = term;
      this._literalLanguage = void 0;
      token = null;
    }
    if (component === "subject")
      return token === null ? this._readPredicateOrNamedGraph : this._readPredicateOrNamedGraph(token);
    return this._completeObjectLiteralPost(token, listItem);
  }
  // Completes a literal in subject position
  _completeSubjectLiteral(token) {
    const completed = this._completeLiteral(token, "subject");
    this._subject = completed.literal;
    if (completed.readCb)
      return completed.readCb.bind(this, false);
    return this._readPredicateOrNamedGraph;
  }
  // Completes a literal in object position
  _completeObjectLiteral(token, listItem) {
    const completed = this._completeLiteral(token, "object");
    if (!completed)
      return;
    this._object = completed.literal;
    if (completed.readCb)
      return completed.readCb.bind(this, listItem);
    return this._completeObjectLiteralPost(completed.token, listItem);
  }
  _completeObjectLiteralPost(token, listItem) {
    if (listItem)
      this._emit(this._subject, this.RDF_FIRST, this._object, this._graph);
    if (token === null)
      return this._getContextEndReader();
    else {
      this._readCallback = this._getContextEndReader();
      return this._readCallback(token);
    }
  }
  // ### `_readFormulaTail` reads the end of a formula
  _readFormulaTail(token) {
    if (token.type !== "}")
      return this._readPunctuation(token);
    if (this._subject !== null)
      this._emit(this._subject, this._predicate, this._object, this._graph);
    this._restoreContext("formula", token);
    return this._object === null ? this._readPredicate : this._getContextEndReader();
  }
  // ### `_readPunctuation` reads punctuation between quads or quad parts
  _readPunctuation(token) {
    let next, graph2 = this._graph, startingAnnotation = false;
    const subject = this._subject, inversePredicate = this._inversePredicate;
    switch (token.type) {
      // A closing brace ends a graph
      case "}":
        if (this._graph === null)
          return this._error("Unexpected graph closing", token);
        if (this._n3Mode)
          return this._readFormulaTail(token);
        this._graph = null;
      // A dot just ends the statement, without sharing anything with the next
      case ".":
        this._subject = null;
        this._tripleTerm = null;
        next = this._contextStack.length ? this._readSubject : this._readInTopContext;
        if (inversePredicate) this._inversePredicate = false;
        break;
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      // ~ is allowed in the annotation syntax
      case "~":
        next = this._readReifierInAnnotation;
        startingAnnotation = true;
        break;
      // {| means that the current triple is annotated with predicate-object pairs.
      case "{|":
        this._subject = this._readTripleTerm();
        this._validAnnotation = false;
        startingAnnotation = true;
        next = this._readPredicate;
        break;
      // |} means that the current reified triple in annotation syntax is finalized.
      case "|}":
        if (!this._annotation)
          return this._error("Unexpected annotation syntax closing", token);
        if (!this._validAnnotation)
          return this._error("Annotation block can not be empty", token);
        this._subject = null;
        this._annotation = false;
        next = this._readPunctuation;
        break;
      default:
        if (this._supportsQuads && this._graph === null && (graph2 = this._readEntity(token)) !== void 0) {
          next = this._readQuadPunctuation;
          break;
        }
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    if (subject !== null && (!startingAnnotation || startingAnnotation && !this._annotation)) {
      const predicate = this._predicate, object = this._object;
      if (!inversePredicate)
        this._emit(subject, predicate, object, graph2);
      else
        this._emit(object, predicate, subject, graph2);
    }
    if (startingAnnotation) {
      this._annotation = true;
    }
    return next;
  }
  // ### `_readBlankNodePunctuation` reads punctuation in a blank node
  _readBlankNodePunctuation(token) {
    let next;
    switch (token.type) {
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      default:
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    this._emit(this._subject, this._predicate, this._object, this._graph);
    return next;
  }
  // ### `_readQuadPunctuation` reads punctuation after a quad
  _readQuadPunctuation(token) {
    if (token.type !== ".")
      return this._error("Expected dot to follow quad", token);
    return this._readInTopContext;
  }
  // ### `_readPrefix` reads the prefix of a prefix declaration
  _readPrefix(token) {
    if (token.type !== "prefix")
      return this._error("Expected prefix to follow @prefix", token);
    this._prefix = token.value;
    return this._readPrefixIRI;
  }
  // ### `_readPrefixIRI` reads the IRI of a prefix declaration
  _readPrefixIRI(token) {
    if (token.type !== "IRI")
      return this._error(`Expected IRI to follow prefix "${this._prefix}:"`, token);
    const prefixNode = this._readEntity(token);
    this._prefixes[this._prefix] = prefixNode.value;
    this._prefixCallback(this._prefix, prefixNode);
    return this._readDeclarationPunctuation;
  }
  // ### `_readBaseIRI` reads the IRI of a base declaration
  _readBaseIRI(token) {
    const iri = token.type === "IRI" && this._resolveIRI(token.value);
    if (!iri)
      return this._error("Expected valid IRI to follow base declaration", token);
    this._setBase(iri);
    return this._readDeclarationPunctuation;
  }
  // ### `_isValidVersion` checks if the given version is valid for this parser to handle.
  _isValidVersion(version) {
    return this._parseUnsupportedVersions || _N3Parser.SUPPORTED_VERSIONS.includes(version);
  }
  // ### `_readVersion` reads version string declaration
  _readVersion(token) {
    if (token.type !== "literal")
      return this._error("Expected literal to follow version declaration", token);
    if (token.end - token.start !== token.value.length + 2)
      return this._error("Version declarations must use single quotes", token);
    this._versionCallback(token.value);
    if (!this._isValidVersion(token.value))
      return this._error(`Detected unsupported version: "${token.value}"`, token);
    return this._readDeclarationPunctuation;
  }
  // ### `_readNamedGraphLabel` reads the label of a named graph
  _readNamedGraphLabel(token) {
    switch (token.type) {
      case "IRI":
      case "blank":
      case "prefixed":
        return this._readSubject(token), this._readGraph;
      case "[":
        return this._readNamedGraphBlankLabel;
      default:
        return this._error("Invalid graph label", token);
    }
  }
  // ### `_readNamedGraphLabel` reads a blank node label of a named graph
  _readNamedGraphBlankLabel(token) {
    if (token.type !== "]")
      return this._error("Invalid graph label", token);
    this._subject = this._factory.blankNode();
    return this._readGraph;
  }
  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration
  _readDeclarationPunctuation(token) {
    if (this._sparqlStyle) {
      this._sparqlStyle = false;
      return this._readInTopContext(token);
    }
    if (token.type !== ".")
      return this._error("Expected declaration to end with a dot", token);
    return this._readInTopContext;
  }
  // Reads a list of quantified symbols from a @forSome or @forAll statement
  _readQuantifierList(token) {
    let entity;
    switch (token.type) {
      case "IRI":
      case "prefixed":
        if ((entity = this._readEntity(token, true)) !== void 0)
          break;
      default:
        return this._error(`Unexpected ${token.type}`, token);
    }
    if (!this._explicitQuantifiers)
      this._quantified[entity.id] = this._factory[this._quantifier](this._factory.blankNode().value);
    else {
      if (this._subject === null)
        this._emit(
          this._graph || this.DEFAULTGRAPH,
          this._predicate,
          this._subject = this._factory.blankNode(),
          this.QUANTIFIERS_GRAPH
        );
      else
        this._emit(
          this._subject,
          this.RDF_REST,
          this._subject = this._factory.blankNode(),
          this.QUANTIFIERS_GRAPH
        );
      this._emit(this._subject, this.RDF_FIRST, entity, this.QUANTIFIERS_GRAPH);
    }
    return this._readQuantifierPunctuation;
  }
  // Reads punctuation from a @forSome or @forAll statement
  _readQuantifierPunctuation(token) {
    if (token.type === ",")
      return this._readQuantifierList;
    else {
      if (this._explicitQuantifiers) {
        this._emit(this._subject, this.RDF_REST, this.RDF_NIL, this.QUANTIFIERS_GRAPH);
        this._subject = null;
      }
      this._readCallback = this._getContextEndReader();
      return this._readCallback(token);
    }
  }
  // ### `_getPathReader` reads a potential path and then resumes with the given function
  _getPathReader(afterPath) {
    this._afterPath = afterPath;
    return this._readPath;
  }
  // ### `_readPath` reads a potential path
  _readPath(token) {
    switch (token.type) {
      // Forward path
      case "!":
        return this._readForwardPath;
      // Backward path
      case "^":
        return this._readBackwardPath;
      // Not a path; resume reading where we left off
      default:
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent && parent.type === "item") {
          const item = this._subject;
          this._restoreContext("item", token);
          this._emit(this._subject, this.RDF_FIRST, item, this._graph);
        }
        return this._afterPath(token);
    }
  }
  // ### `_readForwardPath` reads a '!' path
  _readForwardPath(token) {
    let subject, predicate;
    const object = this._factory.blankNode();
    if ((predicate = this._readEntity(token)) === void 0)
      return;
    if (this._predicate === null)
      subject = this._subject, this._subject = object;
    else
      subject = this._object, this._object = object;
    this._emit(subject, predicate, object, this._graph);
    return this._readPath;
  }
  // ### `_readBackwardPath` reads a '^' path
  _readBackwardPath(token) {
    const subject = this._factory.blankNode();
    let predicate, object;
    if ((predicate = this._readEntity(token)) === void 0)
      return;
    if (this._predicate === null)
      object = this._subject, this._subject = subject;
    else
      object = this._object, this._object = subject;
    this._emit(subject, predicate, object, this._graph);
    return this._readPath;
  }
  // ### `_readTripleTermTail` reads the end of a triple term
  _readTripleTermTail(token) {
    if (token.type !== ")>>")
      return this._error(`Expected )>> but got ${token.type}`, token);
    const quad3 = this._factory.quad(
      this._subject,
      this._predicate,
      this._object,
      this._graph || this.DEFAULTGRAPH
    );
    this._restoreContext("<<(", token);
    if (this._subject === null) {
      this._subject = quad3;
      return this._readPredicate;
    } else {
      this._object = quad3;
      return this._getContextEndReader();
    }
  }
  // ### `_readReifiedTripleTailOrReifier` reads a reifier or the end of a nested reified triple
  _readReifiedTripleTailOrReifier(token) {
    if (token.type === "~") {
      return this._readReifier;
    }
    return this._readReifiedTripleTail(token);
  }
  // ### `_readReifiedTripleTail` reads the end of a nested reified triple
  _readReifiedTripleTail(token) {
    if (token.type !== ">>")
      return this._error(`Expected >> but got ${token.type}`, token);
    this._tripleTerm = null;
    const reifier = this._readTripleTerm();
    this._restoreContext("<<", token);
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    if (parent && parent.type === "list") {
      this._emit(this._subject, this.RDF_FIRST, reifier, this._graph);
      return this._getContextEndReader();
    } else if (this._subject === null) {
      this._subject = reifier;
      return this._readPredicateOrReifierTripleEnd;
    } else {
      this._object = reifier;
      return this._getContextEndReader();
    }
  }
  _readPredicateOrReifierTripleEnd(token) {
    if (token.type === ".") {
      this._subject = null;
      return this._readPunctuation(token);
    }
    return this._readPredicate(token);
  }
  // ### `_readReifier` reads the triple term identifier after a tilde when in a reifying triple.
  _readReifier(token) {
    this._reifier = this._readEntity(token);
    return this._readReifiedTripleTail;
  }
  // ### `_readReifier` reads the optional triple term identifier after a tilde when in annotation syntax.
  _readReifierInAnnotation(token) {
    if (token.type === "IRI" || token.type === "typeIRI" || token.type === "type" || token.type === "prefixed" || token.type === "blank" || token.type === "var") {
      this._reifier = this._readEntity(token);
      return this._readPunctuation;
    }
    this._readTripleTerm();
    this._subject = null;
    return this._readPunctuation(token);
  }
  _readTripleTerm() {
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    const parentGraph = parent ? parent.graph : void 0;
    const reifier = this._reifier || this._factory.blankNode();
    this._reifier = null;
    this._tripleTerm = this._tripleTerm || this._factory.quad(this._subject, this._predicate, this._object);
    this._emit(reifier, this.RDF_REIFIES, this._tripleTerm, parentGraph || this.DEFAULTGRAPH);
    return reifier;
  }
  // ### `_getContextEndReader` gets the next reader function at the end of a context
  _getContextEndReader() {
    const contextStack = this._contextStack;
    if (!contextStack.length)
      return this._readPunctuation;
    switch (contextStack[contextStack.length - 1].type) {
      case "blank":
        return this._readBlankNodeTail;
      case "list":
        return this._readListItem;
      case "formula":
        return this._readFormulaTail;
      case "<<(":
        return this._readTripleTermTail;
      case "<<":
        return this._readReifiedTripleTailOrReifier;
    }
  }
  // ### `_emit` sends a quad through the callback
  _emit(subject, predicate, object, graph2) {
    this._callback(null, this._factory.quad(subject, predicate, object, graph2 || this.DEFAULTGRAPH));
  }
  // ### `_error` emits an error message through the callback
  _error(message, token) {
    const err = new Error(`${message} on line ${token.line}.`);
    err.context = {
      token,
      line: token.line,
      previousToken: this._lexer.previousToken
    };
    this._callback(err);
    this._callback = noop;
  }
  // ### `_resolveIRI` resolves an IRI against the base path
  _resolveIRI(iri) {
    return /^[a-z][a-z0-9+.-]*:/i.test(iri) ? iri : this._resolveRelativeIRI(iri);
  }
  // ### `_resolveRelativeIRI` resolves an IRI against the base path,
  // assuming that a base path has been set and that the IRI is indeed relative
  _resolveRelativeIRI(iri) {
    if (!iri.length)
      return this._base;
    switch (iri[0]) {
      // Resolve relative fragment IRIs against the base IRI
      case "#":
        return this._base + iri;
      // Resolve relative query string IRIs by replacing the query string
      case "?":
        return this._base.replace(/(?:\?.*)?$/, iri);
      // Resolve root-relative IRIs at the root of the base IRI
      case "/":
        return (iri[1] === "/" ? this._baseScheme : this._baseRoot) + this._removeDotSegments(iri);
      // Resolve all other IRIs at the base IRI's path
      default:
        return /^[^/:]*:/.test(iri) ? null : this._removeDotSegments(this._basePath + iri);
    }
  }
  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986
  _removeDotSegments(iri) {
    if (!/(^|\/)\.\.?($|[/#?])/.test(iri))
      return iri;
    const length = iri.length;
    let result = "", i = -1, pathStart = -1, segmentStart = 0, next = "/";
    while (i < length) {
      switch (next) {
        // The path starts with the first slash after the authority
        case ":":
          if (pathStart < 0) {
            if (iri[++i] === "/" && iri[++i] === "/")
              while ((pathStart = i + 1) < length && iri[pathStart] !== "/")
                i = pathStart;
          }
          break;
        // Don't modify a query string or fragment
        case "?":
        case "#":
          i = length;
          break;
        // Handle '/.' or '/..' path segments
        case "/":
          if (iri[i + 1] === ".") {
            next = iri[++i + 1];
            switch (next) {
              // Remove a '/.' segment
              case "/":
                result += iri.substring(segmentStart, i - 1);
                segmentStart = i + 1;
                break;
              // Remove a trailing '/.' segment
              case void 0:
              case "?":
              case "#":
                return result + iri.substring(segmentStart, i) + iri.substr(i + 1);
              // Remove a '/..' segment
              case ".":
                next = iri[++i + 1];
                if (next === void 0 || next === "/" || next === "?" || next === "#") {
                  result += iri.substring(segmentStart, i - 2);
                  if ((segmentStart = result.lastIndexOf("/")) >= pathStart)
                    result = result.substr(0, segmentStart);
                  if (next !== "/")
                    return `${result}/${iri.substr(i + 1)}`;
                  segmentStart = i + 1;
                }
            }
          }
      }
      next = iri[++i];
    }
    return result + iri.substring(segmentStart);
  }
  // ## Public methods
  // ### `parse` parses the N3 input and emits each parsed quad through the onQuad callback.
  parse(input2, quadCallback, prefixCallback, versionCallback) {
    let onQuad, onPrefix, onComment, onVersion;
    if (quadCallback && (quadCallback.onQuad || quadCallback.onPrefix || quadCallback.onComment || quadCallback.onVersion)) {
      onQuad = quadCallback.onQuad;
      onPrefix = quadCallback.onPrefix;
      onComment = quadCallback.onComment;
      onVersion = quadCallback.onVersion;
    } else {
      onQuad = quadCallback;
      onPrefix = prefixCallback;
      onVersion = versionCallback;
    }
    this._readCallback = this._readBeforeTopContext;
    this._sparqlStyle = false;
    this._prefixes = /* @__PURE__ */ Object.create(null);
    this._prefixes._ = this._blankNodePrefix ? this._blankNodePrefix.substr(2) : `b${blankNodePrefix++}_`;
    this._prefixCallback = onPrefix || noop;
    this._versionCallback = onVersion || noop;
    this._inversePredicate = false;
    this._quantified = /* @__PURE__ */ Object.create(null);
    if (!onQuad) {
      const quads = [];
      let error4;
      this._callback = (e, t) => {
        e ? error4 = e : t && quads.push(t);
      };
      this._lexer.tokenize(input2).every((token) => {
        return this._readCallback = this._readCallback(token);
      });
      if (error4) throw error4;
      return quads;
    }
    let processNextToken = (error4, token) => {
      if (error4 !== null)
        this._callback(error4), this._callback = noop;
      else if (this._readCallback)
        this._readCallback = this._readCallback(token);
    };
    if (onComment) {
      this._lexer.comments = true;
      processNextToken = (error4, token) => {
        if (error4 !== null)
          this._callback(error4), this._callback = noop;
        else if (this._readCallback) {
          if (token.type === "comment")
            onComment(token.value);
          else
            this._readCallback = this._readCallback(token);
        }
      };
    }
    this._callback = onQuad;
    this._lexer.tokenize(input2, processNextToken);
  }
};
function noop() {
}
function initDataFactory(parser, factory) {
  parser._factory = factory;
  parser.DEFAULTGRAPH = factory.defaultGraph();
  parser.RDF_FIRST = factory.namedNode(IRIs_default.rdf.first);
  parser.RDF_REST = factory.namedNode(IRIs_default.rdf.rest);
  parser.RDF_NIL = factory.namedNode(IRIs_default.rdf.nil);
  parser.RDF_REIFIES = factory.namedNode(IRIs_default.rdf.reifies);
  parser.N3_FORALL = factory.namedNode(IRIs_default.r.forAll);
  parser.N3_FORSOME = factory.namedNode(IRIs_default.r.forSome);
  parser.ABBREVIATIONS = {
    "a": factory.namedNode(IRIs_default.rdf.type),
    "=": factory.namedNode(IRIs_default.owl.sameAs),
    ">": factory.namedNode(IRIs_default.log.implies),
    "<": factory.namedNode(IRIs_default.log.isImpliedBy)
  };
  parser.QUANTIFIERS_GRAPH = factory.namedNode("urn:n3:quantifiers");
}
N3Parser.SUPPORTED_VERSIONS = [
  "1.2",
  "1.2-basic",
  "1.1"
];
initDataFactory(N3Parser.prototype, N3DataFactory_default);

// ../solid-tools/node_modules/n3/src/N3Util.js
function isDefaultGraph(term) {
  return !!term && term.termType === "DefaultGraph";
}

// ../solid-tools/node_modules/n3/src/Util.js
function escapeRegex(regex) {
  return regex.replace(/[\]\/\(\)\*\+\?\.\\\$]/g, "\\$&");
}

// ../solid-tools/node_modules/n3/src/BaseIRI.js
var BASE_UNSUPPORTED = /^:?[^:?#]*(?:[?#]|$)|^file:|^[^:]*:\/*[^?#]+?\/(?:\.\.?(?:\/|$)|\/)/i;
var SUFFIX_SUPPORTED = /^(?:(?:[^/?#]{3,}|\.?[^/?#.]\.?)(?:\/[^/?#]{3,}|\.?[^/?#.]\.?)*\/?)?(?:[?#]|$)/;
var CURRENT = "./";
var PARENT = "../";
var QUERY = "?";
var FRAGMENT = "#";
var BaseIRI = class _BaseIRI {
  constructor(base) {
    this.base = base;
    this._baseLength = 0;
    this._baseMatcher = null;
    this._pathReplacements = new Array(base.length + 1);
  }
  static supports(base) {
    return !BASE_UNSUPPORTED.test(base);
  }
  _getBaseMatcher() {
    if (this._baseMatcher)
      return this._baseMatcher;
    if (!_BaseIRI.supports(this.base))
      return this._baseMatcher = /.^/;
    const scheme = /^[^:]*:\/*/.exec(this.base)[0];
    const regexHead = ["^", escapeRegex(scheme)];
    const regexTail = [];
    const segments = [], segmenter = /[^/?#]*([/?#])/y;
    let segment, query = 0, fragment = 0, last = segmenter.lastIndex = scheme.length;
    while (!query && !fragment && (segment = segmenter.exec(this.base))) {
      if (segment[1] === FRAGMENT)
        fragment = segmenter.lastIndex - 1;
      else {
        regexHead.push(escapeRegex(segment[0]), "(?:");
        regexTail.push(")?");
        if (segment[1] !== QUERY)
          segments.push(last = segmenter.lastIndex);
        else {
          query = last = segmenter.lastIndex;
          fragment = this.base.indexOf(FRAGMENT, query);
          this._pathReplacements[query] = QUERY;
        }
      }
    }
    for (let i = 0; i < segments.length; i++)
      this._pathReplacements[segments[i]] = PARENT.repeat(segments.length - i - 1);
    this._pathReplacements[segments[segments.length - 1]] = CURRENT;
    this._baseLength = fragment > 0 ? fragment : this.base.length;
    regexHead.push(
      escapeRegex(this.base.substring(last, this._baseLength)),
      query ? "(?:#|$)" : "(?:[?#]|$)"
    );
    return this._baseMatcher = new RegExp([...regexHead, ...regexTail].join(""));
  }
  toRelative(iri) {
    const match = this._getBaseMatcher().exec(iri);
    if (!match)
      return iri;
    const length = match[0].length;
    if (length === this._baseLength && length === iri.length)
      return "";
    const parentPath = this._pathReplacements[length];
    if (parentPath) {
      const suffix = iri.substring(length);
      if (parentPath !== QUERY && !SUFFIX_SUPPORTED.test(suffix))
        return iri;
      if (parentPath === CURRENT && /^[^?#]/.test(suffix))
        return suffix;
      return parentPath + suffix;
    }
    return iri.substring(length - 1);
  }
};

// ../solid-tools/node_modules/n3/src/N3Writer.js
var DEFAULTGRAPH2 = N3DataFactory_default.defaultGraph();
var { rdf: rdf2, xsd: xsd3 } = IRIs_default;
var escape = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/;
var escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
var escapedCharacters = {
  "\\": "\\\\",
  '"': '\\"',
  "	": "\\t",
  "\n": "\\n",
  "\r": "\\r",
  "\b": "\\b",
  "\f": "\\f"
};
var SerializedTerm = class extends Term {
  // Pretty-printed nodes are not equal to any other node
  // (e.g., [] does not equal [])
  equals(other) {
    return other === this;
  }
};
var N3Writer = class {
  constructor(outputStream, options) {
    this._prefixRegex = /$0^/;
    if (outputStream && typeof outputStream.write !== "function")
      options = outputStream, outputStream = null;
    options = options || {};
    this._lists = options.lists;
    if (!outputStream) {
      let output = "";
      this._outputStream = {
        write(chunk, encoding, done) {
          output += chunk;
          done && done();
        },
        end: (done) => {
          done && done(null, output);
        }
      };
      this._endStream = true;
    } else {
      this._outputStream = outputStream;
      this._endStream = options.end === void 0 ? true : !!options.end;
    }
    this._subject = null;
    if (!/triple|quad/i.test(options.format)) {
      this._lineMode = false;
      this._graph = DEFAULTGRAPH2;
      this._prefixIRIs = /* @__PURE__ */ Object.create(null);
      options.prefixes && this.addPrefixes(options.prefixes);
      if (options.baseIRI) {
        this._baseIri = new BaseIRI(options.baseIRI);
      }
    } else {
      this._lineMode = true;
      this._writeQuad = this._writeQuadLine;
    }
  }
  // ## Private methods
  // ### Whether the current graph is the default graph
  get _inDefaultGraph() {
    return DEFAULTGRAPH2.equals(this._graph);
  }
  // ### `_write` writes the argument to the output stream
  _write(string, callback) {
    this._outputStream.write(string, "utf8", callback);
  }
  // ### `_writeQuad` writes the quad to the output stream
  _writeQuad(subject, predicate, object, graph2, done) {
    try {
      if (!graph2.equals(this._graph) || graph2.termType !== this._graph.termType) {
        this._write((this._subject === null ? "" : this._inDefaultGraph ? ".\n" : "\n}\n") + (DEFAULTGRAPH2.equals(graph2) ? "" : `${this._encodeIriOrBlank(graph2)} {
`));
        this._graph = graph2;
        this._subject = null;
      }
      if (subject.equals(this._subject)) {
        if (predicate.equals(this._predicate))
          this._write(`, ${this._encodeObject(object)}`, done);
        else
          this._write(`;
    ${this._encodePredicate(this._predicate = predicate)} ${this._encodeObject(object)}`, done);
      } else
        this._write(`${(this._subject === null ? "" : ".\n") + this._encodeSubject(this._subject = subject)} ${this._encodePredicate(this._predicate = predicate)} ${this._encodeObject(object)}`, done);
    } catch (error4) {
      done && done(error4);
    }
  }
  // ### `_writeQuadLine` writes the quad to the output stream as a single line
  _writeQuadLine(subject, predicate, object, graph2, done) {
    delete this._prefixMatch;
    this._write(this.quadToString(subject, predicate, object, graph2), done);
  }
  // ### `quadToString` serializes a quad as a string
  quadToString(subject, predicate, object, graph2) {
    return `${this._encodeSubject(subject)} ${this._encodeIriOrBlank(predicate)} ${this._encodeObject(object)}${graph2 && !isDefaultGraph(graph2) ? ` ${this._encodeIriOrBlank(graph2)} .
` : " .\n"}`;
  }
  // ### `quadsToString` serializes an array of quads as a string
  quadsToString(quads) {
    let quadsString = "";
    for (const quad3 of quads)
      quadsString += this.quadToString(quad3.subject, quad3.predicate, quad3.object, quad3.graph);
    return quadsString;
  }
  // ### `_encodeSubject` represents a subject
  _encodeSubject(entity) {
    return entity.termType === "Quad" ? this._encodeQuad(entity) : this._encodeIriOrBlank(entity);
  }
  // ### `_encodeIriOrBlank` represents an IRI or blank node
  _encodeIriOrBlank(entity) {
    if (entity.termType !== "NamedNode") {
      if (this._lists && entity.value in this._lists)
        entity = this.list(this._lists[entity.value]);
      return "id" in entity ? entity.id : `_:${entity.value}`;
    }
    let iri = entity.value;
    if (this._baseIri) {
      iri = this._baseIri.toRelative(iri);
    }
    if (escape.test(iri))
      iri = iri.replace(escapeAll, characterReplacer);
    const prefixMatch = this._prefixRegex.exec(iri);
    return !prefixMatch ? `<${iri}>` : !prefixMatch[1] ? iri : this._prefixIRIs[prefixMatch[1]] + prefixMatch[2];
  }
  // ### `_encodeLiteral` represents a literal
  _encodeLiteral(literal3) {
    let value = literal3.value;
    if (escape.test(value))
      value = value.replace(escapeAll, characterReplacer);
    const direction = literal3.direction ? `--${literal3.direction}` : "";
    if (literal3.language)
      return `"${value}"@${literal3.language}${direction}`;
    if (this._lineMode) {
      if (literal3.datatype.value === xsd3.string)
        return `"${value}"`;
    } else {
      switch (literal3.datatype.value) {
        case xsd3.string:
          return `"${value}"`;
        case xsd3.boolean:
          if (value === "true" || value === "false")
            return value;
          break;
        case xsd3.integer:
          if (/^[+-]?\d+$/.test(value))
            return value;
          break;
        case xsd3.decimal:
          if (/^[+-]?\d*\.\d+$/.test(value))
            return value;
          break;
        case xsd3.double:
          if (/^[+-]?(?:\d+\.\d*|\.?\d+)[eE][+-]?\d+$/.test(value))
            return value;
          break;
      }
    }
    return `"${value}"^^${this._encodeIriOrBlank(literal3.datatype)}`;
  }
  // ### `_encodePredicate` represents a predicate
  _encodePredicate(predicate) {
    return predicate.value === rdf2.type ? "a" : this._encodeIriOrBlank(predicate);
  }
  // ### `_encodeObject` represents an object
  _encodeObject(object) {
    switch (object.termType) {
      case "Quad":
        return this._encodeQuad(object);
      case "Literal":
        return this._encodeLiteral(object);
      default:
        return this._encodeIriOrBlank(object);
    }
  }
  // ### `_encodeQuad` encodes an RDF-star quad
  _encodeQuad({ subject, predicate, object, graph: graph2 }) {
    return `<<(${this._encodeSubject(subject)} ${this._encodePredicate(predicate)} ${this._encodeObject(object)}${isDefaultGraph(graph2) ? "" : ` ${this._encodeIriOrBlank(graph2)}`})>>`;
  }
  // ### `_blockedWrite` replaces `_write` after the writer has been closed
  _blockedWrite() {
    throw new Error("Cannot write because the writer has been closed.");
  }
  // ### `addQuad` adds the quad to the output stream
  addQuad(subject, predicate, object, graph2, done) {
    if (object === void 0)
      this._writeQuad(subject.subject, subject.predicate, subject.object, subject.graph, predicate);
    else if (typeof graph2 === "function")
      this._writeQuad(subject, predicate, object, DEFAULTGRAPH2, graph2);
    else
      this._writeQuad(subject, predicate, object, graph2 || DEFAULTGRAPH2, done);
  }
  // ### `addQuads` adds the quads to the output stream
  addQuads(quads) {
    for (let i = 0; i < quads.length; i++)
      this.addQuad(quads[i]);
  }
  // ### `addPrefix` adds the prefix to the output stream
  addPrefix(prefix, iri, done) {
    const prefixes4 = {};
    prefixes4[prefix] = iri;
    this.addPrefixes(prefixes4, done);
  }
  // ### `addPrefixes` adds the prefixes to the output stream
  addPrefixes(prefixes4, done) {
    if (!this._prefixIRIs)
      return done && done();
    let hasPrefixes = false;
    for (let prefix in prefixes4) {
      let iri = prefixes4[prefix];
      if (typeof iri !== "string")
        iri = iri.value;
      hasPrefixes = true;
      if (this._subject !== null) {
        this._write(this._inDefaultGraph ? ".\n" : "\n}\n");
        this._subject = null, this._graph = "";
      }
      this._prefixIRIs[iri] = prefix += ":";
      this._write(`@prefix ${prefix} <${iri}>.
`);
    }
    if (hasPrefixes) {
      let IRIlist = "", prefixList = "";
      for (const prefixIRI in this._prefixIRIs) {
        IRIlist += IRIlist ? `|${prefixIRI}` : prefixIRI;
        prefixList += (prefixList ? "|" : "") + this._prefixIRIs[prefixIRI];
      }
      IRIlist = escapeRegex(IRIlist, /[\]\/\(\)\*\+\?\.\\\$]/g, "\\$&");
      this._prefixRegex = new RegExp(`^(?:${prefixList})[^/]*$|^(${IRIlist})([_a-zA-Z0-9][\\-_a-zA-Z0-9]*)$`);
    }
    this._write(hasPrefixes ? "\n" : "", done);
  }
  // ### `blank` creates a blank node with the given content
  blank(predicate, object) {
    let children = predicate, child, length;
    if (predicate === void 0)
      children = [];
    else if (predicate.termType)
      children = [{ predicate, object }];
    else if (!("length" in predicate))
      children = [predicate];
    switch (length = children.length) {
      // Generate an empty blank node
      case 0:
        return new SerializedTerm("[]");
      // Generate a non-nested one-triple blank node
      case 1:
        child = children[0];
        if (!(child.object instanceof SerializedTerm))
          return new SerializedTerm(`[ ${this._encodePredicate(child.predicate)} ${this._encodeObject(child.object)} ]`);
      // Generate a multi-triple or nested blank node
      default:
        let contents = "[";
        for (let i = 0; i < length; i++) {
          child = children[i];
          if (child.predicate.equals(predicate))
            contents += `, ${this._encodeObject(child.object)}`;
          else {
            contents += `${(i ? ";\n  " : "\n  ") + this._encodePredicate(child.predicate)} ${this._encodeObject(child.object)}`;
            predicate = child.predicate;
          }
        }
        return new SerializedTerm(`${contents}
]`);
    }
  }
  // ### `list` creates a list node with the given content
  list(elements) {
    const length = elements && elements.length || 0, contents = new Array(length);
    for (let i = 0; i < length; i++)
      contents[i] = this._encodeObject(elements[i]);
    return new SerializedTerm(`(${contents.join(" ")})`);
  }
  // ### `end` signals the end of the output stream
  end(done) {
    if (this._subject !== null) {
      this._write(this._inDefaultGraph ? ".\n" : "\n}\n");
      this._subject = null;
    }
    this._write = this._blockedWrite;
    let singleDone = done && ((error4, result) => {
      singleDone = null, done(error4, result);
    });
    if (this._endStream) {
      try {
        return this._outputStream.end(singleDone);
      } catch (error4) {
      }
    }
    singleDone && singleDone();
  }
};
function characterReplacer(character) {
  let result = escapedCharacters[character];
  if (result === void 0) {
    if (character.length === 1) {
      result = character.charCodeAt(0).toString(16);
      result = "\\u0000".substr(0, 6 - result.length) + result;
    } else {
      result = ((character.charCodeAt(0) - 55296) * 1024 + character.charCodeAt(1) + 9216).toString(16);
      result = "\\U00000000".substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

// ../solid-tools/node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var solidNamespace = "http://www.w3.org/ns/solid/terms#";
var rdfNamespace = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var n3Parser = (input2, uri, type) => {
  const parser = new N3Parser({
    baseIRI: uri,
    blankNodePrefix: "",
    format: type
  });
  let prefixes4 = /* @__PURE__ */ Object.create(null);
  const quads = parser.parse(input2, null, (prefix, url3) => {
    prefixes4[prefix] = url3.id;
  });
  return { quads, prefixes: prefixes4 };
};
var n3Writer = (source) => {
  return new Promise((resolve, reject) => {
    const writer = new N3Writer({
      format: source.mimetype,
      prefixes: source.prefixDeclarations("source")
    });
    const xsd7 = source.prefixes.xsd;
    const { quad: quad3, namedNode: namedNode3, literal: literal3, blankNode: blankNode3 } = N3DataFactory_default;
    const writeClassNames = (id2, subject) => {
      let classNames = subject.a;
      if (!classNames) {
        return;
      }
      if (!Array.isArray(classNames)) {
        classNames = [classNames];
      }
      if (classNames?.length) {
        for (let name of classNames) {
          name = source.fullURI(name);
          writer.addQuad(quad3(
            namedNode3(id2),
            namedNode3(rdfType),
            namedNode3(name)
          ));
        }
      }
    };
    const writeProperties = (id2, subject) => {
      if (!subject) {
        return;
      }
      let preds = getPredicates(subject);
      for (let pred of preds) {
        if (pred.predicate.id == "id" || pred.predicate.id == "a") {
          continue;
        }
        if (!Array.isArray(pred.object)) {
          pred.object = [pred.object];
        }
        for (let o of pred.object) {
          writer.addQuad(quad3(
            namedNode3(id2),
            pred.predicate,
            o
          ));
        }
      }
    };
    const getPredicates = (object) => {
      let preds = [];
      Object.entries(object).forEach((entry) => {
        const predicate = entry[0];
        let object2 = entry[1];
        const fullPred = source.fullURI(predicate);
        let pred = {
          predicate: namedNode3(fullPred)
        };
        if (object2 instanceof Collection) {
          pred.object = getCollection(object2);
        } else if (Array.isArray(object2)) {
          pred.object = getArray(object2);
        } else if (object2 instanceof NamedNode) {
          pred.object = namedNode3(object2.id);
        } else if (object2 instanceof BlankNode) {
          pred.object = getBlankNode(object2);
        } else if (isLiteral3(object2)) {
          pred.object = getLiteral(object2);
        } else {
          console.log("oldm-ns: encountered unknown object", object2, predicate);
        }
        preds.push(pred);
      });
      return preds;
    };
    const getLiteral = (object) => {
      let type = source.getType(object) || void 0;
      if (type) {
        if (type == xsd7 + source.context.separator + "string" || type == xsd7 + source.context.separator + "number") {
          type = void 0;
        } else {
          type = source.fullURI(type);
        }
        type = namedNode3(type);
      } else {
        let language = object?.language;
        if (language) {
          type = language;
        }
      }
      if (object instanceof String) {
        object = "" + object;
      } else if (object instanceof Number) {
        object = +object;
      }
      return literal3(object, type);
    };
    const isLiteral3 = (value) => {
      return value instanceof String || value instanceof Number || typeof value == "boolean" || typeof value == "string" || typeof value == "number";
    };
    const getCollection = (object) => {
      let list2 = [];
      for (let value of object) {
        if (isLiteral3(value)) {
          list2.push(getLiteral(value));
        } else if (value.id) {
          list2.push(namedNode3(value.id));
        } else {
          list2.push(getBlankNode(value));
        }
      }
      return writer.list(list2);
    };
    const getBlankNode = (object) => {
      return writer.blank(getPredicates(object));
    };
    const getArray = (object) => {
      let list2 = [];
      for (const o of object) {
        if (isLiteral3(o)) {
          list2.push(getLiteral(o));
        } else if (o instanceof NamedNode) {
          list2.push(namedNode3(o.id));
        } else if (o instanceof BlankNode) {
          list2.push(getBlankNode(o));
        } else if (o instanceof Collection) {
          list2.push(getCollection(o));
        }
      }
      return list2;
    };
    Object.entries(source.subjects).forEach(([id2, subject]) => {
      id2 = source.shortURI(id2, ":");
      writeClassNames(id2, subject);
      writeProperties(id2, subject);
    });
    writer.end((error4, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error4);
      }
    });
  });
};
var n3PatchWriter = async (source) => {
  if (source.originalSource == null) {
    throw new Error("Cannot generate a patch without the original graph source");
  }
  const currentSource = await n3Writer(source);
  const original = n3Parser(source.originalSource, source.url, source.mimetype).quads;
  const current = n3Parser(currentSource, source.url, source.mimetype).quads;
  const patch = solidPatchChanges(original, current, {
    quad: N3DataFactory_default.quad,
    variable: N3DataFactory_default.variable,
    blankNode: N3DataFactory_default.blankNode
  });
  return serializePatch(source, patch.inserts, patch.deletes, patch.where);
};
function diffQuads(original, current) {
  const originalByKey = new Map(original.map((quad3) => [quadKey(quad3), quad3]));
  const currentByKey = new Map(current.map((quad3) => [quadKey(quad3), quad3]));
  const deletes = [];
  const inserts = [];
  for (const [key, quad3] of originalByKey) {
    if (!currentByKey.has(key)) {
      deletes.push(quad3);
    }
  }
  for (const [key, quad3] of currentByKey) {
    if (!originalByKey.has(key)) {
      inserts.push(quad3);
    }
  }
  return { inserts, deletes };
}
function quadKey(quad3) {
  return [
    termKey(quad3.subject),
    termKey(quad3.predicate),
    termKey(quad3.object),
    termKey(quad3.graph)
  ].join(" ");
}
function termKey(term) {
  if (!term) {
    return "";
  }
  if (term.termType == "Literal") {
    return [
      "Literal",
      term.value,
      term.language ?? "",
      term.datatype?.value ?? term.datatype?.id ?? ""
    ].join("\0");
  }
  return `${term.termType}\0${term.value ?? term.id ?? ""}`;
}
function solidPatchChanges(original, current, factory) {
  const originalAnonymous = anonymousUnits(original);
  const currentAnonymous = anonymousUnits(current);
  const { deletedUnits, insertedUnits } = diffAnonymousUnits(originalAnonymous.units, currentAnonymous.units);
  const anonymousDeletes = [];
  const anonymousInserts = [];
  const where = [];
  for (const unit of deletedUnits) {
    assertOwnedAnonymousUnit(unit, "delete");
    const variableQuads = mapBlankNodes(unit.quads, (name) => factory.variable(name), factory.quad, "old");
    where.push(...variableQuads);
    anonymousDeletes.push(...variableQuads);
  }
  for (const unit of insertedUnits) {
    assertOwnedAnonymousUnit(unit, "insert");
    anonymousInserts.push(...mapBlankNodes(unit.quads, (name) => factory.blankNode(name), factory.quad, "insert"));
  }
  const plainOriginal = original.filter((quad3) => !originalAnonymous.quadKeys.has(quadKey(quad3)));
  const plainCurrent = current.filter((quad3) => !currentAnonymous.quadKeys.has(quadKey(quad3)));
  const plainDiff = diffQuads(plainOriginal, plainCurrent);
  assertPatchable(plainDiff.inserts, "insert changes outside an owned anonymous value");
  assertPatchable(plainDiff.deletes, "delete changes outside an owned anonymous value");
  return {
    where,
    deletes: [...plainDiff.deletes, ...anonymousDeletes],
    inserts: [...plainDiff.inserts, ...anonymousInserts]
  };
}
function anonymousUnits(quads) {
  const outgoing = blankSubjectIndex(quads);
  const incoming = blankObjectIndex(quads);
  const units = [];
  const quadKeys = /* @__PURE__ */ new Set();
  for (const edge of quads) {
    if (!isBlankNode(edge.object) || isBlankNode(edge.subject)) {
      continue;
    }
    const closure = blankNodeClosure(edge.object, outgoing);
    const canonical = canonicalBlankNode(edge.object, outgoing);
    const unitQuads = [edge, ...closure.quads];
    for (const quad3 of unitQuads) {
      quadKeys.add(quadKey(quad3));
    }
    units.push({
      edge,
      quads: unitQuads,
      blankNodeIds: closure.blankNodeIds,
      incoming,
      cyclic: closure.cyclic || canonical.cyclic,
      signature: [termKey(edge.subject), termKey(edge.predicate), canonical.key].join(" ")
    });
  }
  return { units, quadKeys };
}
function blankSubjectIndex(quads) {
  const index = /* @__PURE__ */ new Map();
  for (const quad3 of quads) {
    if (!isBlankNode(quad3.subject)) {
      continue;
    }
    const id2 = termValue(quad3.subject);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad3);
  }
  return index;
}
function blankObjectIndex(quads) {
  const index = /* @__PURE__ */ new Map();
  for (const quad3 of quads) {
    if (!isBlankNode(quad3.object)) {
      continue;
    }
    const id2 = termValue(quad3.object);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad3);
  }
  return index;
}
function blankNodeClosure(root, outgoing) {
  const blankNodeIds = /* @__PURE__ */ new Set();
  const quads = [];
  const stack = [root];
  let cyclic = false;
  while (stack.length) {
    const term = stack.pop();
    const id2 = termValue(term);
    if (blankNodeIds.has(id2)) {
      cyclic = true;
      continue;
    }
    blankNodeIds.add(id2);
    for (const quad3 of outgoing.get(id2) ?? []) {
      quads.push(quad3);
      if (isBlankNode(quad3.object)) {
        stack.push(quad3.object);
      }
    }
  }
  return { quads, blankNodeIds, cyclic };
}
function canonicalBlankNode(term, outgoing, memo = /* @__PURE__ */ new Map(), path2 = /* @__PURE__ */ new Set()) {
  const id2 = termValue(term);
  if (memo.has(id2)) {
    return memo.get(id2);
  }
  if (path2.has(id2)) {
    return { key: "[cycle]", cyclic: true };
  }
  path2.add(id2);
  let cyclic = false;
  const properties = (outgoing.get(id2) ?? []).map((quad3) => {
    const object = canonicalTerm(quad3.object, outgoing, memo, path2);
    cyclic ||= object.cyclic;
    return `${termKey(quad3.predicate)} ${object.key}`;
  }).sort();
  path2.delete(id2);
  const result = {
    key: `BlankNode(${properties.join("|")})`,
    cyclic
  };
  memo.set(id2, result);
  return result;
}
function canonicalTerm(term, outgoing, memo, path2) {
  if (isBlankNode(term)) {
    return canonicalBlankNode(term, outgoing, memo, path2);
  }
  return { key: termKey(term), cyclic: false };
}
function diffAnonymousUnits(original, current) {
  const originalBySignature = groupUnitsBySignature(original);
  const currentBySignature = groupUnitsBySignature(current);
  const signatures = /* @__PURE__ */ new Set([...originalBySignature.keys(), ...currentBySignature.keys()]);
  const deletedUnits = [];
  const insertedUnits = [];
  for (const signature of signatures) {
    const originalUnits = originalBySignature.get(signature) ?? [];
    const currentUnits = currentBySignature.get(signature) ?? [];
    const unchanged = Math.min(originalUnits.length, currentUnits.length);
    deletedUnits.push(...originalUnits.slice(unchanged));
    insertedUnits.push(...currentUnits.slice(unchanged));
  }
  return { deletedUnits, insertedUnits };
}
function groupUnitsBySignature(units) {
  const grouped = /* @__PURE__ */ new Map();
  for (const unit of units) {
    if (!grouped.has(unit.signature)) {
      grouped.set(unit.signature, []);
    }
    grouped.get(unit.signature).push(unit);
  }
  return grouped;
}
function assertOwnedAnonymousUnit(unit, operation) {
  if (unit.cyclic) {
    throw new Error(`Cannot generate a Solid PATCH to ${operation} a cyclic anonymous value; use graph.write() and PUT instead`);
  }
  for (const id2 of unit.blankNodeIds) {
    const incoming = unit.incoming.get(id2) ?? [];
    if (incoming.length != 1) {
      throw new Error(`Cannot generate a Solid PATCH to ${operation} a shared anonymous value; use graph.write() and PUT instead`);
    }
  }
}
function mapBlankNodes(quads, createTerm, createQuad, prefix) {
  const terms = /* @__PURE__ */ new Map();
  const mapTerm = (term) => {
    if (!isBlankNode(term)) {
      return term;
    }
    const id2 = termValue(term);
    if (!terms.has(id2)) {
      terms.set(id2, createTerm(`${prefix}${terms.size}`));
    }
    return terms.get(id2);
  };
  return quads.map((quad3) => createQuad(mapTerm(quad3.subject), quad3.predicate, mapTerm(quad3.object), quad3.graph));
}
function assertPatchable(quads, operation) {
  const hasBlankNode = quads.some(
    (quad3) => isBlankNode(quad3.subject) || isBlankNode(quad3.predicate) || isBlankNode(quad3.object)
  );
  if (hasBlankNode) {
    throw new Error(`Cannot generate a Solid PATCH with blank nodes in ${operation}; use graph.write() and PUT instead`);
  }
}
function isBlankNode(term) {
  return term?.termType == "BlankNode";
}
function termValue(term) {
  return term?.value ?? term?.id ?? "";
}
function serializePatch(source, inserts, deletes, where = []) {
  const prefixes4 = {
    ...source.prefixDeclarations("source")
  };
  if (quadsUseNamespace([...where, ...deletes, ...inserts], rdfNamespace)) {
    prefixes4.rdf ??= rdfNamespace;
  }
  prefixes4.solid = solidNamespace;
  const writer = new N3Writer({
    format: "text/turtle",
    prefixes: prefixes4
  });
  const lines = [];
  for (const [prefix, iri] of Object.entries(prefixes4)) {
    lines.push(`@prefix ${prefix}: <${iri}> .`);
  }
  if (lines.length) {
    lines.push("");
  }
  const predicates = [];
  if (where.length) {
    predicates.push(`solid:where ${formula(writer, where)}`);
  }
  if (deletes.length) {
    predicates.push(`solid:deletes ${formula(writer, deletes)}`);
  }
  if (inserts.length) {
    predicates.push(`solid:inserts ${formula(writer, inserts)}`);
  }
  let patch = `_:patch a solid:InsertDeletePatch`;
  if (predicates.length) {
    patch += ";\n	" + predicates.join(";\n	");
  }
  lines.push(`${patch} .`);
  return lines.join("\n") + "\n";
}
function quadsUseNamespace(quads, namespace) {
  return quads.some(
    (quad3) => termUsesNamespace(quad3.subject, namespace) || termUsesNamespace(quad3.predicate, namespace) || termUsesNamespace(quad3.object, namespace)
  );
}
function termUsesNamespace(term, namespace) {
  return term?.termType == "NamedNode" && termValue(term).startsWith(namespace);
}
function formula(writer, quads) {
  if (!quads.length) {
    return "{}";
  }
  const lines = quads.map((quad3) => `
		${writer.quadToString(quad3.subject, quad3.predicate, quad3.object).trim()}`);
  return `{${lines.join("")}
	}`;
}

// ../solid-tools/node_modules/@muze-nl/oldm/src/index.mjs
var { default: _coreDefault, ...core } = oldm_exports;
var oldm2 = {
  context(options = {}) {
    const {
      parser = n3Parser,
      writer = n3Writer,
      patchWriter = n3PatchWriter,
      ...contextOptions
    } = options;
    return oldm({
      ...contextOptions,
      parser,
      writer,
      patchWriter
    });
  },
  ...core,
  ...oldm_n3_exports
};
globalThis.oldm = oldm2;
var src_default5 = oldm2;

// ../solid-tools/node_modules/@muze-nl/metro-oldm/src/oldmmw.mjs
function oldmmw(options) {
  options = Object.assign({
    contentType: "text/turtle",
    prefixes: {
      "ldp": "http://www.w3.org/ns/ldp#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "dct": "http://purl.org/dc/terms/",
      "stat": "http://www.w3.org/ns/posix/stat#",
      "turtle": "http://www.w3.org/ns/iana/media-types/text/turtle#",
      "schem": "https://schema.org/",
      "solid": "http://www.w3.org/ns/solid/terms#",
      "acl": "http://www.w3.org/ns/auth/acl#",
      "pims": "http://www.w3.org/ns/pim/space#",
      "vcard": "http://www.w3.org/2006/vcard/ns#",
      "foaf": "http://xmlns.com/foaf/0.1/"
    },
    parser: src_default5.n3Parser,
    writer: src_default5.n3Writer
  }, options);
  if (!options.prefixes["ldp"]) {
    options.prefixes["ldp"] = "http://www.w3.org/ns/ldp#";
  }
  const context = src_default5.context(options);
  return async function oldmmw2(req, next) {
    if (!req.headers.get("Accept")) {
      req = req.with({
        headers: {
          "Accept": options.accept ?? options.contentType
        }
      });
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.data && typeof req.data == "object" && !(req.data instanceof ReadableStream)) {
        const contentType = req.headers.get("Content-Type");
        if (!contentType || isPlainText3(contentType)) {
          req = req.with({
            headers: {
              "Content-Type": options.contentType
            }
          });
        }
        if (isLinkedData(req.headers.get("Content-Type"))) {
          req = req.with({
            body: await context.writer(req.data)
          });
        }
      }
    }
    let res = await next(req);
    if (res && isLinkedData(res.headers?.get("Content-Type"))) {
      let tempRes = res.clone();
      let body = await tempRes.text();
      try {
        let ld = context.parse(body, req.url, res.headers.get("Content-Type"));
        return res.with({
          body: ld
        });
      } catch (e) {
      }
    }
    return res;
  };
}
var mimetypes = [
  /^text\/turtle\b/,
  /^application\/n-quads\b/,
  /^text\/x-nquads\b/,
  /^appliction\/n-triples\b/,
  /^application\/trig\b/
];
function isLinkedData(contentType) {
  for (const re of mimetypes) {
    if (re.exec(contentType)) {
      return true;
    }
  }
  return false;
}
function isPlainText3(contentType) {
  return /^text\/plain\b/.exec(contentType);
}

// ../solid-tools/node_modules/@muze-nl/metro-oldm/src/index.mjs
var src_default6 = oldmmw;

// ../solid-tools/packages/jsfs-solid/src/metro.mjs
function createSolidMetroClient(input2, options = {}) {
  const providedClient = options.metroClient ?? options.metro ?? options.client;
  let metroClient = providedClient ?? input2;
  if (!(metroClient instanceof src_default4.Client)) {
    metroClient = src_default4.client(metroClient);
  }
  if (providedClient && options.configureMetro !== true) {
    return metroClient;
  }
  if (options.oidc !== false && browser_default?.oidcmw && typeof metroClient?.with === "function") {
    metroClient = metroClient.with(browser_default.oidcmw(options));
  }
  if (options.oldm !== false && typeof src_default6 === "function" && typeof metroClient?.with === "function") {
    metroClient = metroClient.with(src_default6(options));
  }
  return metroClient;
}

// node_modules/@muze-nl/oldm-core/src/oldm.mjs
var oldm_exports2 = {};
__export(oldm_exports2, {
  BlankNode: () => BlankNode3,
  Collection: () => Collection2,
  Context: () => Context2,
  Graph: () => Graph2,
  NamedNode: () => NamedNode3,
  default: () => oldm3,
  first: () => first2,
  many: () => many2,
  one: () => one2,
  prefixes: () => prefixes2,
  rdfType: () => rdfType2
});
function oldm3(options) {
  return new Context2(options);
}
var rdfType2 = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var prefixes2 = {
  acl: "http://www.w3.org/ns/auth/acl#",
  acp: "http://www.w3.org/ns/solid/acp#",
  dcterms: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  ldn: "https://www.w3.org/ns/ldn#",
  ldp: "http://www.w3.org/ns/ldp#",
  notify: "http://www.w3.org/ns/solid/notifications#",
  oidc: "http://www.w3.org/ns/solid/oidc#",
  owl: "http://www.w3.org/2002/07/owl#",
  pim: "http://www.w3.org/ns/pim/space#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  schema: "http://schema.org/",
  solid: "http://www.w3.org/ns/solid/terms#",
  stat: "http://www.w3.org/ns/posix/stat#",
  turtle: "http://www.w3.org/ns/iana/media-types/text/turtle#",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#"
};
function one2(values5, whichOne = "last") {
  let result = values5;
  if (Array.isArray(values5)) {
    if (whichOne == "last") {
      result = values5[values5.length - 1];
    } else if (whichOne == "first") {
      result = values5[0];
    } else if (typeof whichOne == "function") {
      result = whichOne(values5);
    } else {
      throw new Error("Unknown value for whichOne parameter");
    }
  }
  return result;
}
function many2(values5) {
  if (Array.isArray(values5)) {
    return values5;
  }
  if (values5 == null) {
    return [];
  }
  return [values5];
}
function first2(...values5) {
  for (const value of values5) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return null;
}
function values3(value) {
  if (Array.isArray(value) && !(value instanceof Collection2)) {
    return value;
  }
  if (value === void 0) {
    return [];
  }
  return [value];
}
function mergeValue2(existing, value) {
  const result = values3(existing);
  for (const item of values3(value)) {
    if (!result.some((existingItem) => sameValue2(existingItem, item))) {
      result.push(item);
    }
  }
  if (result.length == 0) {
    return void 0;
  }
  if (result.length == 1) {
    return result[0];
  }
  return result;
}
function sameValue2(left, right) {
  if (left === right) {
    return true;
  }
  if (left instanceof NamedNode3 && right instanceof NamedNode3) {
    return left.id == right.id;
  }
  if (left instanceof NamedNode3 && typeof right == "string") {
    return left.id == right;
  }
  if (typeof left == "string" && right instanceof NamedNode3) {
    return left == right.id;
  }
  if (left instanceof Collection2 && right instanceof Collection2) {
    return left.length == right.length && left.every((item, index) => sameValue2(item, right[index]));
  }
  if (isLiteral2(left) && isLiteral2(right)) {
    return String(left) == String(right) && left?.type == right?.type && left?.language == right?.language;
  }
  return false;
}
function sameSourceValue2(left, right) {
  if (left === right) {
    return true;
  }
  if (left instanceof NamedNode3 && right instanceof NamedNode3) {
    return left.id == right.id;
  }
  if (left instanceof NamedNode3 && typeof right == "string") {
    return left.id == right;
  }
  if (typeof left == "string" && right instanceof NamedNode3) {
    return left == right.id;
  }
  if (left instanceof Collection2 && right instanceof Collection2) {
    return left.length == right.length && left.every((item, index) => sameSourceValue2(item, right[index]));
  }
  if (isLiteral2(left) && isLiteral2(right)) {
    const leftType = left?.type;
    const rightType = right?.type;
    const leftLanguage = left?.language;
    const rightLanguage = right?.language;
    return String(left) == String(right) && (!leftType || !rightType || leftType == rightType) && (!leftLanguage || !rightLanguage || leftLanguage == rightLanguage);
  }
  return false;
}
function resolveValue2(value, subjects, context) {
  if (value instanceof Collection2) {
    const collection = new Collection2(context);
    for (const item of value) {
      collection.push(resolveValue2(item, subjects, context));
    }
    return collection;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue2(item, subjects, context));
  }
  if (value instanceof NamedNode3 && subjects[value.id]) {
    return subjects[value.id];
  }
  return value;
}
function isLiteral2(value) {
  return value instanceof String || value instanceof Number || typeof value == "boolean" || typeof value == "string" || typeof value == "number";
}
var Context2 = class {
  #buildingSubjects = false;
  constructor(options) {
    const clientPrefixes = options?.prefixes ?? {};
    this.prefixes = { ...prefixes2, ...clientPrefixes };
    this.prefixOrder = [
      ...Object.keys(clientPrefixes),
      ...Object.keys(prefixes2).filter((prefix) => !(prefix in clientPrefixes))
    ];
    if (!this.prefixes["xsd"]) {
      this.prefixes["xsd"] = "http://www.w3.org/2001/XMLSchema#";
      this.prefixOrder.push("xsd");
    }
    this.parser = options?.parser;
    this.writer = options?.writer;
    this.patchWriter = options?.patchWriter;
    this.graphs = [];
    this.graphsByUrl = /* @__PURE__ */ Object.create(null);
    this.defaultGraph = options?.defaultGraph ?? null;
    this.separator = options?.separator ?? "$";
    Object.defineProperty(this, "subjects", {
      get() {
        return this.getSubjects();
      }
    });
    Object.defineProperty(this, "data", {
      get() {
        return Object.values(this.subjects);
      }
    });
  }
  parse(input2, url3, type) {
    const { quads, prefixes: prefixes4 } = this.parser(input2, url3, type);
    if (prefixes4) {
      for (let prefix in prefixes4) {
        let prefixURL = prefixes4[prefix];
        if (prefixURL.match(/^http(s?):\/\/$/i)) {
          prefixURL += url3.substring(prefixURL.length);
        } else try {
          prefixURL = new URL(prefixes4[prefix], url3).href;
        } catch (err) {
          console.error("Could not parse prefix", prefixes4[prefix], err.message);
        }
        if (!this.prefixes[prefix]) {
          this.prefixes[prefix] = prefixURL;
          this.prefixOrder.push(prefix);
        }
      }
    }
    return this.addGraph(new Graph2(quads, url3, type, prefixes4, this, input2));
  }
  addGraph(graph2) {
    if (!graph2?.url) {
      throw new Error("Cannot add graph without a url");
    }
    const existing = this.graphsByUrl[graph2.url];
    if (existing) {
      const index = this.graphs.indexOf(existing);
      if (index >= 0) {
        this.graphs[index] = graph2;
      }
    } else {
      this.graphs.push(graph2);
    }
    this.graphsByUrl[graph2.url] = graph2;
    return graph2;
  }
  graph(url3) {
    return this.graphsByUrl[this.fullURI(url3)];
  }
  set(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).set(subject, predicate, value, { prefixPreference: "context" });
  }
  add(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).add(subject, predicate, value, { prefixPreference: "context" });
  }
  delete(subject, predicate = null, value = void 0, options = {}) {
    const graph2 = this.resolveGraph(subject, options);
    if (arguments.length < 3) {
      return graph2.delete(subject, predicate, void 0, { prefixPreference: "context", hasValue: false });
    }
    return graph2.delete(subject, predicate, value, { prefixPreference: "context", hasValue: true });
  }
  resolveGraph(subject, options = {}) {
    if (options.graph) {
      return this.getGraphOption(options.graph);
    }
    if (subject instanceof BlankNode3 && subject.graph instanceof Graph2) {
      return subject.graph;
    }
    const id2 = this.subjectID(subject);
    if (id2) {
      const exactGraph = this.graphsByUrl[id2];
      if (exactGraph) {
        return exactGraph;
      }
      const documentGraph = this.graphsByUrl[this.documentURL(id2)];
      if (documentGraph) {
        return documentGraph;
      }
      const subjectSources = this.graphs.filter((graph2) => graph2.subjects[id2]);
      if (subjectSources.length == 1) {
        return subjectSources[0];
      }
      if (subjectSources.length > 1) {
        throw new Error(`Cannot choose a source graph for ${id2}. Use context.set/add/delete(..., { graph }) or graph.set/add/delete(...) to choose one explicitly.`);
      }
    }
    if (this.defaultGraph) {
      return this.getGraphOption(this.defaultGraph);
    }
    if (this.graphs.length == 1) {
      return this.graphs[0];
    }
    throw new Error("Cannot choose a source graph. Use context.set/add/delete(..., { graph }) or graph.set/add/delete(...) to choose one explicitly.");
  }
  getGraphOption(graph2) {
    if (graph2 instanceof Graph2) {
      if (!this.graphs.includes(graph2)) {
        throw new Error("The selected graph is not part of this context");
      }
      return graph2;
    }
    const resolved = this.graph(graph2);
    if (!resolved) {
      throw new Error(`Unknown graph: ${graph2}`);
    }
    return resolved;
  }
  documentURL(id2) {
    try {
      const url3 = new URL(id2);
      url3.hash = "";
      return url3.href;
    } catch (err) {
      return id2;
    }
  }
  sources(subject, predicate = null, value = void 0) {
    if (!subject) {
      return [...this.graphs];
    }
    if (subject instanceof BlankNode3 && !(subject instanceof NamedNode3)) {
      return this.sourcesForBlankNode(subject, predicate, value, arguments.length >= 3);
    }
    const id2 = this.subjectID(subject);
    if (!id2) {
      return [];
    }
    return this.graphs.filter((graph2) => {
      const graphSubject = graph2.subjects[id2];
      return graphSubject && this.subjectHasSource(graphSubject, predicate, value, arguments.length >= 3);
    });
  }
  sourcesForBlankNode(subject, predicate, value, hasValue) {
    const graph2 = subject.graph;
    if (!(graph2 instanceof Graph2)) {
      return [];
    }
    if (this.subjectHasSource(subject, predicate, value, hasValue)) {
      return [graph2];
    }
    return [];
  }
  subjectHasSource(subject, predicate, value, hasValue) {
    if (!predicate) {
      return true;
    }
    const property = subject.graph instanceof Graph2 ? subject.graph.propertyName(this.fullURI(predicate), "context") : this.propertyName(predicate);
    if (!(property in subject)) {
      return false;
    }
    if (!hasValue) {
      return true;
    }
    return values3(subject[property]).some((item) => sameSourceValue2(item, value));
  }
  subjectID(subject) {
    if (subject?.id) {
      return this.fullURI(subject.id);
    }
    if (typeof subject == "string") {
      return this.fullURI(subject);
    }
    return null;
  }
  propertyName(predicate) {
    if (predicate?.id) {
      predicate = predicate.id;
    }
    if (predicate == "a" || predicate == rdfType2 || this.fullURI(predicate) == rdfType2) {
      return "a";
    }
    return this.shortURI(this.fullURI(predicate));
  }
  get(shortID) {
    return this.subjects[this.fullURI(shortID)];
  }
  getSubjects() {
    const subjects = /* @__PURE__ */ Object.create(null);
    this.#buildingSubjects = true;
    try {
      for (const graph2 of this.graphs) {
        for (const id2 of Object.keys(graph2.subjects)) {
          if (!subjects[id2]) {
            subjects[id2] = this.contextSubject(new NamedNode3(id2, this));
          }
        }
      }
      for (const graph2 of this.graphs) {
        for (const [id2, subject] of Object.entries(graph2.subjects)) {
          this.mergeSubject(subjects[id2], subject, subjects);
        }
      }
    } finally {
      this.#buildingSubjects = false;
    }
    return subjects;
  }
  mergeSubject(target, source, subjects) {
    for (const [predicate, value] of Object.entries(source)) {
      if (predicate == "id") {
        continue;
      }
      const contextPredicate = predicate == "a" ? "a" : this.propertyName(source.graph.fullURI(predicate, null, "source"));
      target[contextPredicate] = mergeValue2(
        target[contextPredicate],
        resolveValue2(value, subjects, this)
      );
    }
  }
  contextSubject(subject) {
    const context = this;
    return new Proxy(subject, {
      set(target, property, value, receiver) {
        if (context.#buildingSubjects || typeof property == "symbol" || property == "id" || property == "graph") {
          return Reflect.set(target, property, value, receiver);
        }
        context.set(target.id, property, value);
        context.updateContextProperty(target, property);
        return true;
      },
      deleteProperty(target, property) {
        if (context.#buildingSubjects || typeof property == "symbol" || property == "id" || property == "graph") {
          return Reflect.deleteProperty(target, property);
        }
        context.delete(target.id, property);
        context.updateContextProperty(target, property);
        return true;
      }
    });
  }
  updateContextProperty(target, property) {
    const updated = this.get(target.id);
    if (updated && property in updated) {
      target[property] = updated[property];
    } else {
      delete target[property];
    }
  }
  fullURI(shortURI, separator = null) {
    if (!separator) {
      separator = this.separator;
    }
    const [prefix, path2] = shortURI.split(separator);
    if (path2 && this.prefixes[prefix]) {
      return this.prefixes[prefix] + path2;
    }
    return shortURI;
  }
  shortURI(fullURI, separator = null) {
    if (!separator) {
      separator = this.separator;
    }
    for (const prefix of this.prefixOrder) {
      if (fullURI.startsWith(this.prefixes[prefix])) {
        return prefix + separator + fullURI.substring(this.prefixes[prefix].length);
      }
    }
    return fullURI;
  }
  setType(literal3, shortType) {
    if (!shortType) {
      return literal3;
    }
    if (typeof literal3 == "string") {
      literal3 = new String(literal3);
    } else if (typeof literal3 == "number") {
      literal3 = new Number(literal3);
    }
    if (typeof literal3 !== "object") {
      throw new Error("cannot set type on ", literal3, shortType);
    }
    literal3.type = shortType;
    return literal3;
  }
  getType(literal3) {
    if (literal3 && typeof literal3 == "object") {
      return literal3.type;
    }
    return null;
  }
};
var Graph2 = class {
  #blankNodes = /* @__PURE__ */ Object.create(null);
  constructor(quads, url3, mimetype, prefixes4, context, originalSource = null) {
    this.mimetype = mimetype;
    this.url = url3;
    this.prefixes = prefixes4;
    this.context = context;
    this.originalSource = originalSource;
    this.subjects = /* @__PURE__ */ Object.create(null);
    for (let quad3 of quads) {
      let subject;
      if (quad3.subject.termType == "BlankNode") {
        let shortPred = this.shortURI(quad3.predicate.id, ":");
        let shortObj;
        switch (shortPred) {
          case "rdf:first":
            subject = this.addCollection(quad3.subject.id);
            shortObj = quad3.object.id ? this.shortURI(quad3.object.id, ":") : null;
            if (shortObj != "rdf:nil") {
              const value = this.getValue(quad3.object);
              if (value) {
                subject.push(value);
              }
            }
            continue;
          case "rdf:rest":
            this.#blankNodes[quad3.object.id] = this.#blankNodes[quad3.subject.id];
            continue;
          default:
            subject = this.addBlankNode(quad3.subject.id);
            break;
        }
      } else {
        subject = this.addNamedNode(quad3.subject.id);
      }
      subject.addPredicate(quad3.predicate.id, quad3.object);
    }
    if (this.subjects[url3]) {
      this.primary = this.subjects[url3];
    } else {
      this.primary = null;
    }
    Object.defineProperty(this, "data", {
      get() {
        return Object.values(this.subjects);
      }
    });
  }
  addNamedNode(uri) {
    let absURI = new URL(uri, this.url).href;
    if (!this.subjects[absURI]) {
      this.subjects[absURI] = new NamedNode3(absURI, this);
    }
    return this.subjects[absURI];
  }
  addBlankNode(id2) {
    if (!this.#blankNodes[id2]) {
      this.#blankNodes[id2] = new BlankNode3(this);
    }
    return this.#blankNodes[id2];
  }
  addCollection(id2) {
    if (!this.#blankNodes[id2]) {
      this.#blankNodes[id2] = new Collection2(this);
    }
    return this.#blankNodes[id2];
  }
  write() {
    return this.context.writer(this);
  }
  patch() {
    if (!this.context.patchWriter) {
      throw new Error("Cannot generate a patch without a configured patchWriter");
    }
    return this.context.patchWriter(this);
  }
  get(shortID) {
    return this.subjects[this.fullURI(shortID)];
  }
  prefixEntries(preference = "source") {
    const sourcePrefixes = this.prefixes ?? {};
    const sourceOrder = Object.keys(sourcePrefixes);
    const contextPrefixes = this.context.prefixes ?? {};
    const contextOrder = this.context.prefixOrder ?? Object.keys(contextPrefixes);
    const entries = [];
    const seen = /* @__PURE__ */ new Set();
    const seenIRIs = /* @__PURE__ */ new Set();
    const add2 = (prefixes4, order, skipKnownIRIs = false) => {
      for (const prefix of order) {
        if (!Object.prototype.hasOwnProperty.call(prefixes4, prefix)) {
          continue;
        }
        const iri = prefixes4[prefix];
        if (!seen.has(prefix) && (!skipKnownIRIs || !seenIRIs.has(iri))) {
          entries.push([prefix, iri]);
          seen.add(prefix);
          seenIRIs.add(iri);
        }
      }
      for (const prefix of Object.keys(prefixes4)) {
        const iri = prefixes4[prefix];
        if (!seen.has(prefix) && (!skipKnownIRIs || !seenIRIs.has(iri))) {
          entries.push([prefix, iri]);
          seen.add(prefix);
          seenIRIs.add(iri);
        }
      }
    };
    if (preference == "context") {
      add2(contextPrefixes, contextOrder);
      add2(sourcePrefixes, sourceOrder, true);
    } else {
      add2(sourcePrefixes, sourceOrder);
      add2(contextPrefixes, contextOrder, true);
    }
    return entries;
  }
  prefixDeclarations(preference = "source") {
    return Object.fromEntries(this.prefixEntries(preference));
  }
  propertyName(predicate, preference = "source") {
    if (predicate?.id) {
      predicate = predicate.id;
    }
    const fullPredicate = this.fullURI(predicate, null, preference);
    if (predicate == "a" || fullPredicate == rdfType2) {
      return "a";
    }
    return this.shortURI(fullPredicate, null, "source");
  }
  set(subject, predicate, value, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const node = this.ensureSubject(subject, preference);
    const property = this.propertyName(predicate, preference);
    if (property == "a") {
      node.a = this.normalizeTypeValues(value, preference);
    } else {
      node[property] = this.normalizeValues(value, preference);
    }
    return node;
  }
  add(subject, predicate, value, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const node = this.ensureSubject(subject, preference);
    const property = this.propertyName(predicate, preference);
    const newValue = property == "a" ? this.normalizeTypeValues(value, preference) : this.normalizeValues(value, preference);
    node[property] = mergeValue2(node[property], newValue);
    return node;
  }
  delete(subject, predicate = null, value = void 0, options = {}) {
    const preference = options.prefixPreference ?? "source";
    const hasValue = options.hasValue ?? arguments.length >= 3;
    const node = this.findSubject(subject, preference);
    if (!node) {
      return false;
    }
    if (!predicate) {
      if (node.id) {
        delete this.subjects[node.id];
        if (this.primary === node) {
          this.primary = null;
        }
      }
      return true;
    }
    const property = this.propertyName(predicate, preference);
    if (!(property in node)) {
      return false;
    }
    if (!hasValue) {
      delete node[property];
      return true;
    }
    const deleteValues = property == "a" ? values3(this.normalizeTypeValues(value, preference)) : values3(this.normalizeValues(value, preference));
    const remaining = values3(node[property]).filter((item) => !deleteValues.some((deleteValue) => sameValue2(item, deleteValue)));
    if (remaining.length == values3(node[property]).length) {
      return false;
    }
    if (remaining.length == 0) {
      delete node[property];
    } else if (remaining.length == 1) {
      node[property] = remaining[0];
    } else {
      node[property] = remaining;
    }
    return true;
  }
  ensureSubject(subject, preference = "source") {
    if (subject instanceof BlankNode3 && !(subject instanceof NamedNode3)) {
      if (subject.graph !== this) {
        throw new Error("Cannot write a blank node into a different graph");
      }
      return subject;
    }
    if (subject instanceof NamedNode3) {
      return this.addNamedNode(subject.id);
    }
    return this.addNamedNode(this.fullURI(subject, null, preference));
  }
  findSubject(subject, preference = "source") {
    if (subject instanceof BlankNode3 && !(subject instanceof NamedNode3)) {
      return subject.graph === this ? subject : null;
    }
    const id2 = subject?.id ? subject.id : this.fullURI(subject, null, preference);
    return this.subjects[id2];
  }
  normalizeValues(value, preference = "source") {
    if (Array.isArray(value) && !(value instanceof Collection2)) {
      return value.map((item) => this.normalizeValue(item, preference));
    }
    return this.normalizeValue(value, preference);
  }
  normalizeValue(value, preference = "source") {
    if (value instanceof Collection2) {
      const collection = new Collection2(this);
      for (const item of value) {
        collection.push(this.normalizeValue(item, preference));
      }
      return collection;
    }
    if (value instanceof NamedNode3) {
      return this.addNamedNode(value.id);
    }
    if (value instanceof BlankNode3) {
      if (value.graph !== this) {
        throw new Error("Cannot write a blank node into a different graph");
      }
      return value;
    }
    if (this.looksLikeURI(value, preference)) {
      return this.addNamedNode(this.fullURI(value, null, preference));
    }
    return value;
  }
  normalizeTypeValues(value, preference = "source") {
    if (Array.isArray(value) && !(value instanceof Collection2)) {
      return value.map((item) => this.normalizeTypeValue(item, preference));
    }
    return this.normalizeTypeValue(value, preference);
  }
  normalizeTypeValue(value, preference = "source") {
    if (value instanceof NamedNode3) {
      return this.shortURI(value.id, null, "source");
    }
    return this.shortURI(this.fullURI(value, null, preference), null, "source");
  }
  looksLikeURI(value, preference = "source") {
    if (typeof value != "string") {
      return false;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return true;
    }
    const [prefix, path2] = value.split(this.context.separator);
    return Boolean(path2 && this.prefixEntries(preference).some(([candidate]) => candidate == prefix));
  }
  fullURI(shortURI, separator = null, preference = "source") {
    if (!separator) {
      separator = this.context.separator;
    }
    const [prefix, path2] = String(shortURI).split(separator);
    if (path2) {
      for (const [candidate, iri] of this.prefixEntries(preference)) {
        if (candidate == prefix) {
          return iri + path2;
        }
      }
    }
    return shortURI;
  }
  shortURI(fullURI, separator = null, preference = "source") {
    if (!separator) {
      separator = this.context.separator;
    }
    for (const [prefix, iri] of this.prefixEntries(preference)) {
      if (fullURI.startsWith(iri)) {
        return prefix + separator + fullURI.substring(iri.length);
      }
    }
    if (this.url && fullURI.startsWith(this.url)) {
      return fullURI.substring(this.url.length);
    }
    return fullURI;
  }
  /**
   * This sets the type of a literal, usually one of the xsd types
   */
  setType(literal3, type) {
    const shortType = this.shortURI(type);
    return this.context.setType(literal3, shortType);
  }
  /**
   * This returns the type of a literal, or null
   */
  getType(literal3) {
    return this.context.getType(literal3);
  }
  setLanguage(literal3, language) {
    if (typeof literal3 == "string") {
      literal3 = new String(literal3);
    } else if (typeof literal3 == "number") {
      literal3 = new Number(literal3);
    }
    if (typeof literal3 !== "object") {
      throw new Error("cannot set language on ", literal3);
    }
    literal3.language = language;
    return literal3;
  }
  getValue(object) {
    let result;
    if (object.termType == "Literal") {
      result = object.value;
      let datatype = object.datatype?.id;
      if (datatype) {
        result = this.setType(result, datatype);
      }
      let language = object.language;
      if (language) {
        result = this.setLanguage(result, language);
      }
    } else if (object.termType == "BlankNode") {
      result = this.addBlankNode(object.id);
    } else {
      result = this.addNamedNode(object.id);
    }
    return result;
  }
};
var BlankNode3 = class {
  constructor(graph2) {
    Object.defineProperty(this, "graph", {
      value: graph2,
      writable: false,
      enumerable: false
    });
  }
  addPredicate(predicate, object) {
    if (predicate.id) {
      predicate = predicate.id;
    }
    if (predicate == rdfType2) {
      let type = this.graph.shortURI(object.id);
      this.addType(type);
    } else {
      const value = this.graph.getValue(object);
      predicate = this.graph.shortURI(predicate);
      if (!this[predicate]) {
        this[predicate] = value;
      } else if (Array.isArray(this[predicate])) {
        this[predicate].push(value);
      } else {
        this[predicate] = [this[predicate], value];
      }
    }
  }
  /**
   * Adds a rdfType value, stored in this.a
   * Subjects can have more than one type (or class), unlike literals
   * The type value can be any URI, xsdTypes are unexpected here
   */
  addType(type) {
    if (!this.a) {
      this.a = type;
    } else {
      if (!Array.isArray(this.a)) {
        this.a = [this.a];
      }
      this.a.push(type);
    }
  }
};
var NamedNode3 = class extends BlankNode3 {
  constructor(id2, graph2) {
    super(graph2);
    Object.defineProperty(this, "id", {
      value: id2,
      writable: false,
      enumerable: true
    });
  }
};
var Collection2 = class extends Array {
  constructor(graph2) {
    super();
    Object.defineProperty(this, "graph", {
      value: graph2,
      writable: false,
      enumerable: false
    });
  }
};

// node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var oldm_n3_exports2 = {};
__export(oldm_n3_exports2, {
  n3Parser: () => n3Parser2,
  n3PatchWriter: () => n3PatchWriter2,
  n3Writer: () => n3Writer2
});

// node_modules/n3/src/N3Lexer.js
var import_buffer2 = __toESM(require_buffer2());

// node_modules/n3/src/IRIs.js
var RDF2 = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var XSD2 = "http://www.w3.org/2001/XMLSchema#";
var SWAP2 = "http://www.w3.org/2000/10/swap/";
var IRIs_default2 = {
  xsd: {
    decimal: `${XSD2}decimal`,
    boolean: `${XSD2}boolean`,
    double: `${XSD2}double`,
    integer: `${XSD2}integer`,
    string: `${XSD2}string`
  },
  rdf: {
    type: `${RDF2}type`,
    nil: `${RDF2}nil`,
    first: `${RDF2}first`,
    rest: `${RDF2}rest`,
    langString: `${RDF2}langString`,
    dirLangString: `${RDF2}dirLangString`,
    reifies: `${RDF2}reifies`
  },
  owl: {
    sameAs: "http://www.w3.org/2002/07/owl#sameAs"
  },
  r: {
    forSome: `${SWAP2}reify#forSome`,
    forAll: `${SWAP2}reify#forAll`
  },
  log: {
    implies: `${SWAP2}log#implies`,
    isImpliedBy: `${SWAP2}log#isImpliedBy`
  }
};

// node_modules/n3/src/N3Lexer.js
var { xsd: xsd4 } = IRIs_default2;
var escapeSequence2 = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\([^])/g;
var escapeReplacements2 = {
  "\\": "\\",
  "'": "'",
  '"': '"',
  "n": "\n",
  "r": "\r",
  "t": "	",
  "f": "\f",
  "b": "\b",
  "_": "_",
  "~": "~",
  ".": ".",
  "-": "-",
  "!": "!",
  "$": "$",
  "&": "&",
  "(": "(",
  ")": ")",
  "*": "*",
  "+": "+",
  ",": ",",
  ";": ";",
  "=": "=",
  "/": "/",
  "?": "?",
  "#": "#",
  "@": "@",
  "%": "%"
};
var illegalIriChars2 = /[\x00-\x20<>\\"\{\}\|\^\`]/;
function isSurrogateCodePoint2(charCode) {
  return charCode >= 55296 && charCode <= 57343;
}
var lineModeRegExps2 = {
  _iri: true,
  _unescapedIri: true,
  _simpleQuotedString: true,
  _langcode: true,
  _dircode: true,
  _blank: true,
  _newline: true,
  _comment: true,
  _whitespace: true,
  _endOfFile: true
};
var invalidRegExp2 = /$0^/;
var N3Lexer2 = class {
  constructor(options) {
    this._iri = /^<((?:[^ <>{}\\]|\\[uU])+)>[ \t]*/;
    this._unescapedIri = /^<([^\x00-\x20<>\\"\{\}\|\^\`]*)>[ \t]*/;
    this._simpleQuotedString = /^"([^"\\\r\n]*)"(?=[^"])/;
    this._simpleApostropheString = /^'([^'\\\r\n]*)'(?=[^'])/;
    this._langcode = /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9])/i;
    this._dircode = /^--(ltr)|(rtl)/;
    this._prefix = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=[#\s<])/;
    this._prefixed = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?:[ \t]+|(?=\.?[,;!\^\s#()\[\]\{\}"'<>]))/;
    this._variable = /^\?(?:(?:[A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=[.,;!\^\s#()\[\]\{\}"'<>])/;
    this._blank = /^_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?:[ \t]+|(?=\.?[,;:\s#()\[\]\{\}"'<>]))/;
    this._number = /^[\-+]?(?:(\d+\.\d*|\.?\d+)[eE][\-+]?|\d*(\.)?)\d+(?=\.?[,;:\s#()\[\]\{\}"'<>])/;
    this._boolean = /^(?:true|false)(?=[.,;\s#()\[\]\{\}"'<>])/;
    this._atKeyword = /^@[a-z]+(?=[\s#<:])/i;
    this._keyword = /^(?:PREFIX|BASE|VERSION|GRAPH)(?=[\s#<])/i;
    this._shortPredicates = /^a(?=[\s#()\[\]\{\}"'<>])/;
    this._newline = /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/;
    this._comment = /#([^\n\r]*)/;
    this._whitespace = /^[ \t]+/;
    this._endOfFile = /^(?:#[^\n\r]*)?$/;
    options = options || {};
    this._isImpliedBy = options.isImpliedBy;
    if (this._lineMode = !!options.lineMode) {
      this._n3Mode = false;
      for (const key in this) {
        if (!(key in lineModeRegExps2) && this[key] instanceof RegExp)
          this[key] = invalidRegExp2;
      }
    } else {
      this._n3Mode = options.n3 !== false;
    }
    this.comments = !!options.comments;
    this._literalClosingPos = 0;
  }
  // ## Private methods
  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback
  _tokenizeToEnd(callback, inputFinished) {
    let input2 = this._input;
    let currentLineLength = input2.length;
    while (true) {
      let whiteSpaceMatch, comment;
      while (whiteSpaceMatch = this._newline.exec(input2)) {
        if (this.comments && (comment = this._comment.exec(whiteSpaceMatch[0])))
          emitToken("comment", comment[1], "", this._line, whiteSpaceMatch[0].length);
        input2 = input2.substr(whiteSpaceMatch[0].length, input2.length);
        currentLineLength = input2.length;
        this._line++;
      }
      if (!whiteSpaceMatch && (whiteSpaceMatch = this._whitespace.exec(input2)))
        input2 = input2.substr(whiteSpaceMatch[0].length, input2.length);
      if (this._endOfFile.test(input2)) {
        if (inputFinished) {
          if (this.comments && (comment = this._comment.exec(input2)))
            emitToken("comment", comment[1], "", this._line, input2.length);
          input2 = null;
          emitToken("eof", "", "", this._line, 0);
        }
        return this._input = input2;
      }
      const line = this._line, firstChar = input2[0];
      let type = "", value = "", prefix = "", match = null, matchLength = 0, inconclusive = false;
      switch (firstChar) {
        case "^":
          if (input2.length < 3)
            break;
          else if (input2[1] === "^") {
            this._previousMarker = "^^";
            input2 = input2.substr(2);
            if (input2[0] !== "<") {
              inconclusive = true;
              break;
            }
          } else {
            if (this._n3Mode) {
              matchLength = 1;
              type = "^";
            }
            break;
          }
        // Fall through in case the type is an IRI
        case "<":
          if (match = this._unescapedIri.exec(input2))
            type = "IRI", value = match[1];
          else if (match = this._iri.exec(input2)) {
            value = this._unescape(match[1]);
            if (value === null || illegalIriChars2.test(value))
              return reportSyntaxError(this);
            type = "IRI";
          } else if (input2.length > 2 && input2[1] === "<" && input2[2] === "(")
            type = "<<(", matchLength = 3;
          else if (!this._lineMode && input2.length > (inputFinished ? 1 : 2) && input2[1] === "<")
            type = "<<", matchLength = 2;
          else if (this._n3Mode && input2.length > 1 && input2[1] === "=") {
            matchLength = 2;
            if (this._isImpliedBy) type = "abbreviation", value = "<";
            else type = "inverse", value = ">";
          }
          break;
        case ">":
          if (input2.length > 1 && input2[1] === ">")
            type = ">>", matchLength = 2;
          break;
        case "_":
          if ((match = this._blank.exec(input2)) || inputFinished && (match = this._blank.exec(`${input2} `)))
            type = "blank", prefix = "_", value = match[1];
          break;
        case '"':
          if (match = this._simpleQuotedString.exec(input2))
            value = match[1];
          else {
            ({ value, matchLength } = this._parseLiteral(input2));
            if (value === null)
              return reportSyntaxError(this);
          }
          if (match !== null || matchLength !== 0) {
            type = "literal";
            this._literalClosingPos = 0;
          }
          break;
        case "'":
          if (!this._lineMode) {
            if (match = this._simpleApostropheString.exec(input2))
              value = match[1];
            else {
              ({ value, matchLength } = this._parseLiteral(input2));
              if (value === null)
                return reportSyntaxError(this);
            }
            if (match !== null || matchLength !== 0) {
              type = "literal";
              this._literalClosingPos = 0;
            }
          }
          break;
        case "?":
          if (this._n3Mode && (match = this._variable.exec(input2)))
            type = "var", value = match[0];
          break;
        case "@":
          if (this._previousMarker === "literal" && (match = this._langcode.exec(input2)) && match[1] !== "version")
            type = "langcode", value = match[1];
          else if (match = this._atKeyword.exec(input2))
            type = match[0];
          break;
        case ".":
          if (input2.length === 1 ? inputFinished : input2[1] < "0" || input2[1] > "9") {
            type = ".";
            matchLength = 1;
            break;
          }
        // Fall through to numerical case (could be a decimal dot)
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "+":
        case "-":
          if (input2[1] === "-") {
            if (this._previousMarker === "langcode" && (match = this._dircode.exec(input2)))
              type = "dircode", matchLength = 2, value = match[1] || match[2], matchLength = value.length + 2;
            break;
          }
          if (match = this._number.exec(input2) || inputFinished && (match = this._number.exec(`${input2} `))) {
            type = "literal", value = match[0];
            prefix = typeof match[1] === "string" ? xsd4.double : typeof match[2] === "string" ? xsd4.decimal : xsd4.integer;
          }
          break;
        case "B":
        case "b":
        case "p":
        case "P":
        case "G":
        case "g":
        case "V":
        case "v":
          if (match = this._keyword.exec(input2))
            type = match[0].toUpperCase();
          else
            inconclusive = true;
          break;
        case "f":
        case "t":
          if (match = this._boolean.exec(input2))
            type = "literal", value = match[0], prefix = xsd4.boolean;
          else
            inconclusive = true;
          break;
        case "a":
          if (match = this._shortPredicates.exec(input2))
            type = "abbreviation", value = "a";
          else
            inconclusive = true;
          break;
        case "=":
          if (this._n3Mode && input2.length > 1) {
            type = "abbreviation";
            if (input2[1] !== ">")
              matchLength = 1, value = "=";
            else
              matchLength = 2, value = ">";
          }
          break;
        case "!":
          if (!this._n3Mode)
            break;
        case ")":
          if (!inputFinished && (input2.length === 1 || input2.length === 2 && input2[1] === ">")) {
            break;
          }
          if (input2.length > 2 && input2[1] === ">" && input2[2] === ">") {
            type = ")>>", matchLength = 3;
            break;
          }
        case ",":
        case ";":
        case "[":
        case "]":
        case "(":
        case "}":
        case "~":
          if (!this._lineMode) {
            matchLength = 1;
            type = firstChar;
          }
          break;
        case "{":
          if (!this._lineMode && input2.length >= 2) {
            if (input2[1] === "|")
              type = "{|", matchLength = 2;
            else
              type = firstChar, matchLength = 1;
          }
          break;
        case "|":
          if (input2.length >= 2 && input2[1] === "}")
            type = "|}", matchLength = 2;
          break;
        default:
          inconclusive = true;
      }
      if (inconclusive) {
        if ((this._previousMarker === "@prefix" || this._previousMarker === "PREFIX") && (match = this._prefix.exec(input2)))
          type = "prefix", value = match[1] || "";
        else if ((match = this._prefixed.exec(input2)) || inputFinished && (match = this._prefixed.exec(`${input2} `)))
          type = "prefixed", prefix = match[1] || "", value = this._unescape(match[2]);
      }
      if (this._previousMarker === "^^") {
        switch (type) {
          case "prefixed":
            type = "type";
            break;
          case "IRI":
            type = "typeIRI";
            break;
          default:
            type = "";
        }
      }
      if (!type) {
        if (inputFinished || !/^'''|^"""/.test(input2) && /\n|\r/.test(input2))
          return reportSyntaxError(this);
        else
          return this._input = input2;
      }
      const length = matchLength || match[0].length;
      const token = emitToken(type, value, prefix, line, length);
      this.previousToken = token;
      this._previousMarker = type;
      input2 = input2.substr(length, input2.length);
    }
    function emitToken(type, value, prefix, line, length) {
      const start = input2 ? currentLineLength - input2.length : currentLineLength;
      const end = start + length;
      const token = { type, value, prefix, line, start, end };
      callback(null, token);
      return token;
    }
    function reportSyntaxError(self) {
      callback(self._syntaxError(/^\S*/.exec(input2)[0]));
    }
  }
  // ### `_unescape` replaces N3 escape codes by their corresponding characters
  _unescape(item) {
    let invalid = false;
    const replaced = item.replace(escapeSequence2, (sequence, unicode4, unicode8, escapedChar) => {
      if (typeof unicode4 === "string") {
        const charCode = Number.parseInt(unicode4, 16);
        if (isSurrogateCodePoint2(charCode)) {
          invalid = true;
          return "";
        }
        return String.fromCharCode(charCode);
      }
      if (typeof unicode8 === "string") {
        let charCode = Number.parseInt(unicode8, 16);
        if (isSurrogateCodePoint2(charCode)) {
          invalid = true;
          return "";
        }
        return charCode <= 65535 ? String.fromCharCode(Number.parseInt(unicode8, 16)) : String.fromCharCode(55296 + ((charCode -= 65536) >> 10), 56320 + (charCode & 1023));
      }
      if (escapedChar in escapeReplacements2)
        return escapeReplacements2[escapedChar];
      invalid = true;
      return "";
    });
    return invalid ? null : replaced;
  }
  // ### `_parseLiteral` parses a literal into an unescaped value
  _parseLiteral(input2) {
    if (input2.length >= 3) {
      const opening = input2.match(/^(?:"""|"|'''|'|)/)[0];
      const openingLength = opening.length;
      let closingPos = Math.max(this._literalClosingPos, openingLength);
      while ((closingPos = input2.indexOf(opening, closingPos)) > 0) {
        let backslashCount = 0;
        while (input2[closingPos - backslashCount - 1] === "\\")
          backslashCount++;
        if (backslashCount % 2 === 0) {
          const raw2 = input2.substring(openingLength, closingPos);
          const lines = raw2.split(/\r\n|\r|\n/).length - 1;
          const matchLength = closingPos + openingLength;
          if (openingLength === 1 && lines !== 0 || openingLength === 3 && this._lineMode)
            break;
          this._line += lines;
          return { value: this._unescape(raw2), matchLength };
        }
        closingPos++;
      }
      this._literalClosingPos = input2.length - openingLength + 1;
    }
    return { value: "", matchLength: 0 };
  }
  // ### `_syntaxError` creates a syntax error for the given issue
  _syntaxError(issue) {
    this._input = null;
    const err = new Error(`Unexpected "${issue}" on line ${this._line}.`);
    err.context = {
      token: void 0,
      line: this._line,
      previousToken: this.previousToken
    };
    return err;
  }
  // ### Strips off any starting UTF BOM mark.
  _readStartingBom(input2) {
    return input2.startsWith("\uFEFF") ? input2.substr(1) : input2;
  }
  // ## Public methods
  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  tokenize(input2, callback) {
    this._line = 1;
    if (typeof input2 === "string") {
      this._input = this._readStartingBom(input2);
      if (typeof callback === "function")
        queueMicrotask(() => this._tokenizeToEnd(callback, true));
      else {
        const tokens = [];
        let error4;
        this._tokenizeToEnd((e, t) => e ? error4 = e : tokens.push(t), true);
        if (error4) throw error4;
        return tokens;
      }
    } else {
      this._pendingBuffer = null;
      if (typeof input2.setEncoding === "function")
        input2.setEncoding("utf8");
      input2.on("data", (data) => {
        if (this._input !== null && data.length !== 0) {
          if (this._pendingBuffer) {
            data = import_buffer2.Buffer.concat([this._pendingBuffer, data]);
            this._pendingBuffer = null;
          }
          if (data[data.length - 1] & 128) {
            this._pendingBuffer = data;
          } else {
            if (typeof this._input === "undefined")
              this._input = this._readStartingBom(typeof data === "string" ? data : data.toString());
            else
              this._input += data;
            this._tokenizeToEnd(callback, false);
          }
        }
      });
      input2.on("end", () => {
        if (typeof this._input === "string")
          this._tokenizeToEnd(callback, true);
      });
      input2.on("error", callback);
    }
  }
};

// node_modules/n3/src/N3DataFactory.js
var { rdf: rdf3, xsd: xsd5 } = IRIs_default2;
var DEFAULTGRAPH3;
var _blankNodeCounter2 = 0;
var DataFactory2 = {
  namedNode: namedNode2,
  blankNode: blankNode2,
  variable: variable2,
  literal: literal2,
  defaultGraph: defaultGraph2,
  quad: quad2,
  triple: quad2,
  fromTerm: fromTerm2,
  fromQuad: fromQuad2
};
var N3DataFactory_default2 = DataFactory2;
var Term2 = class _Term {
  constructor(id2) {
    this.id = id2;
  }
  // ### The value of this term
  get value() {
    return this.id;
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    if (other instanceof _Term)
      return this.id === other.id;
    return !!other && this.termType === other.termType && this.value === other.value;
  }
  // ### Implement hashCode for Immutable.js, since we implement `equals`
  // https://immutable-js.com/docs/v4.0.0/ValueObject/#hashCode()
  hashCode() {
    return 0;
  }
  // ### Returns a plain object representation of this term
  toJSON() {
    return {
      termType: this.termType,
      value: this.value
    };
  }
};
var NamedNode4 = class extends Term2 {
  // ### The term type of this term
  get termType() {
    return "NamedNode";
  }
};
var Literal2 = class _Literal extends Term2 {
  // ### The term type of this term
  get termType() {
    return "Literal";
  }
  // ### The text value of this literal
  get value() {
    return this.id.substring(1, this.id.lastIndexOf('"'));
  }
  // ### The language of this literal
  get language() {
    const id2 = this.id;
    let atPos = id2.lastIndexOf('"') + 1;
    const dirPos = id2.lastIndexOf("--");
    return atPos < id2.length && id2[atPos++] === "@" ? (dirPos > atPos ? id2.substr(0, dirPos) : id2).substr(atPos).toLowerCase() : "";
  }
  // ### The direction of this literal
  get direction() {
    const id2 = this.id;
    const endPos = id2.lastIndexOf('"');
    const dirPos = id2.lastIndexOf("--");
    return dirPos > endPos && dirPos + 2 < id2.length ? id2.substr(dirPos + 2).toLowerCase() : "";
  }
  // ### The datatype IRI of this literal
  get datatype() {
    return new NamedNode4(this.datatypeString);
  }
  // ### The datatype string of this literal
  get datatypeString() {
    const id2 = this.id, dtPos = id2.lastIndexOf('"') + 1;
    const char = dtPos < id2.length ? id2[dtPos] : "";
    return char === "^" ? id2.substr(dtPos + 2) : (
      // If "@" follows, return rdf:langString or rdf:dirLangString; xsd:string otherwise
      char !== "@" ? xsd5.string : id2.indexOf("--", dtPos) > 0 ? rdf3.dirLangString : rdf3.langString
    );
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    if (other instanceof _Literal)
      return this.id === other.id;
    return !!other && !!other.datatype && this.termType === other.termType && this.value === other.value && this.language === other.language && (this.direction === other.direction || this.direction === "" && !other.direction) && this.datatype.value === other.datatype.value;
  }
  toJSON() {
    return {
      termType: this.termType,
      value: this.value,
      language: this.language,
      direction: this.direction,
      datatype: { termType: "NamedNode", value: this.datatypeString }
    };
  }
};
var BlankNode4 = class extends Term2 {
  constructor(name) {
    super(`_:${name}`);
  }
  // ### The term type of this term
  get termType() {
    return "BlankNode";
  }
  // ### The name of this blank node
  get value() {
    return this.id.substr(2);
  }
};
var Variable2 = class extends Term2 {
  constructor(name) {
    super(`?${name}`);
  }
  // ### The term type of this term
  get termType() {
    return "Variable";
  }
  // ### The name of this variable
  get value() {
    return this.id.substr(1);
  }
};
var DefaultGraph2 = class extends Term2 {
  constructor() {
    super("");
    return DEFAULTGRAPH3 || this;
  }
  // ### The term type of this term
  get termType() {
    return "DefaultGraph";
  }
  // ### Returns whether this object represents the same term as the other
  equals(other) {
    return this === other || !!other && this.termType === other.termType;
  }
};
DEFAULTGRAPH3 = new DefaultGraph2();
var Quad2 = class extends Term2 {
  constructor(subject, predicate, object, graph2) {
    super("");
    this._subject = subject;
    this._predicate = predicate;
    this._object = object;
    this._graph = graph2 || DEFAULTGRAPH3;
  }
  // ### The term type of this term
  get termType() {
    return "Quad";
  }
  get subject() {
    return this._subject;
  }
  get predicate() {
    return this._predicate;
  }
  get object() {
    return this._object;
  }
  get graph() {
    return this._graph;
  }
  // ### Returns a plain object representation of this quad
  toJSON() {
    return {
      termType: this.termType,
      subject: this._subject.toJSON(),
      predicate: this._predicate.toJSON(),
      object: this._object.toJSON(),
      graph: this._graph.toJSON()
    };
  }
  // ### Returns whether this object represents the same quad as the other
  equals(other) {
    return !!other && this._subject.equals(other.subject) && this._predicate.equals(other.predicate) && this._object.equals(other.object) && this._graph.equals(other.graph);
  }
};
function namedNode2(iri) {
  return new NamedNode4(iri);
}
function blankNode2(name) {
  return new BlankNode4(name || `n3-${_blankNodeCounter2++}`);
}
function literal2(value, languageOrDataType) {
  if (typeof languageOrDataType === "string")
    return new Literal2(`"${value}"@${languageOrDataType.toLowerCase()}`);
  if (languageOrDataType !== void 0 && !("termType" in languageOrDataType)) {
    return new Literal2(`"${value}"@${languageOrDataType.language.toLowerCase()}${languageOrDataType.direction ? `--${languageOrDataType.direction.toLowerCase()}` : ""}`);
  }
  let datatype = languageOrDataType ? languageOrDataType.value : "";
  if (datatype === "") {
    if (typeof value === "boolean")
      datatype = xsd5.boolean;
    else if (typeof value === "number") {
      if (Number.isFinite(value))
        datatype = Number.isInteger(value) ? xsd5.integer : xsd5.double;
      else {
        datatype = xsd5.double;
        if (!Number.isNaN(value))
          value = value > 0 ? "INF" : "-INF";
      }
    }
  }
  return datatype === "" || datatype === xsd5.string ? new Literal2(`"${value}"`) : new Literal2(`"${value}"^^${datatype}`);
}
function variable2(name) {
  return new Variable2(name);
}
function defaultGraph2() {
  return DEFAULTGRAPH3;
}
function quad2(subject, predicate, object, graph2) {
  return new Quad2(subject, predicate, object, graph2);
}
function fromTerm2(term) {
  if (term instanceof Term2)
    return term;
  switch (term.termType) {
    case "NamedNode":
      return namedNode2(term.value);
    case "BlankNode":
      return blankNode2(term.value);
    case "Variable":
      return variable2(term.value);
    case "DefaultGraph":
      return DEFAULTGRAPH3;
    case "Literal":
      return literal2(term.value, term.language || term.datatype);
    case "Quad":
      return fromQuad2(term);
    default:
      throw new Error(`Unexpected termType: ${term.termType}`);
  }
}
function fromQuad2(inQuad) {
  if (inQuad instanceof Quad2)
    return inQuad;
  if (inQuad.termType !== "Quad")
    throw new Error(`Unexpected termType: ${inQuad.termType}`);
  return quad2(fromTerm2(inQuad.subject), fromTerm2(inQuad.predicate), fromTerm2(inQuad.object), fromTerm2(inQuad.graph));
}

// node_modules/n3/src/N3Parser.js
var blankNodePrefix2 = 0;
var N3Parser2 = class _N3Parser {
  constructor(options) {
    this._contextStack = [];
    this._graph = null;
    options = options || {};
    this._setBase(options.baseIRI);
    options.factory && initDataFactory2(this, options.factory);
    const format = typeof options.format === "string" ? options.format.match(/\w*$/)[0].toLowerCase() : "", isTurtle = /turtle/.test(format), isTriG = /trig/.test(format), isNTriples = /triple/.test(format), isNQuads = /quad/.test(format), isN3 = this._n3Mode = /n3/.test(format), isLineMode = isNTriples || isNQuads;
    if (!(this._supportsNamedGraphs = !(isTurtle || isN3)))
      this._readPredicateOrNamedGraph = this._readPredicate;
    this._supportsQuads = !(isTurtle || isTriG || isNTriples || isN3);
    this._isImpliedBy = options.isImpliedBy;
    if (isLineMode)
      this._resolveRelativeIRI = (iri) => {
        return null;
      };
    this._blankNodePrefix = typeof options.blankNodePrefix !== "string" ? "" : options.blankNodePrefix.replace(/^(?!_:)/, "_:");
    this._lexer = options.lexer || new N3Lexer2({ lineMode: isLineMode, n3: isN3, isImpliedBy: this._isImpliedBy });
    this._explicitQuantifiers = !!options.explicitQuantifiers;
    this._parseUnsupportedVersions = !!options.parseUnsupportedVersions;
    this._version = options.version;
  }
  // ## Static class methods
  // ### `_resetBlankNodePrefix` restarts blank node prefix identification
  static _resetBlankNodePrefix() {
    blankNodePrefix2 = 0;
  }
  // ## Private methods
  // ### `_setBase` sets the base IRI to resolve relative IRIs
  _setBase(baseIRI) {
    if (!baseIRI) {
      this._base = "";
      this._basePath = "";
    } else {
      const fragmentPos = baseIRI.indexOf("#");
      if (fragmentPos >= 0)
        baseIRI = baseIRI.substr(0, fragmentPos);
      this._base = baseIRI;
      this._basePath = baseIRI.indexOf("/") < 0 ? baseIRI : baseIRI.replace(/[^\/?]*(?:\?.*)?$/, "");
      baseIRI = baseIRI.match(/^(?:([a-z][a-z0-9+.-]*:))?(?:\/\/[^\/]*)?/i);
      this._baseRoot = baseIRI[0];
      this._baseScheme = baseIRI[1];
    }
  }
  // ### `_saveContext` stores the current parsing context
  // when entering a new scope (list, blank node, formula)
  _saveContext(type, graph2, subject, predicate, object) {
    const n3Mode = this._n3Mode;
    this._contextStack.push({
      type,
      subject,
      predicate,
      object,
      graph: graph2,
      inverse: n3Mode ? this._inversePredicate : false,
      blankPrefix: n3Mode ? this._prefixes._ : "",
      quantified: n3Mode ? this._quantified : null
    });
    if (n3Mode) {
      this._inversePredicate = false;
      this._prefixes._ = this._graph ? `${this._graph.value}.` : ".";
      this._quantified = Object.create(this._quantified);
    }
  }
  // ### `_restoreContext` restores the parent context
  // when leaving a scope (list, blank node, formula)
  _restoreContext(type, token) {
    const context = this._contextStack.pop();
    if (!context || context.type !== type)
      return this._error(`Unexpected ${token.type}`, token);
    this._subject = context.subject;
    this._predicate = context.predicate;
    this._object = context.object;
    this._graph = context.graph;
    if (this._n3Mode) {
      this._inversePredicate = context.inverse;
      this._prefixes._ = context.blankPrefix;
      this._quantified = context.quantified;
    }
  }
  // ### `_readBeforeTopContext` is called once only at the start of parsing.
  _readBeforeTopContext(token) {
    if (this._version && !this._isValidVersion(this._version))
      return this._error(`Detected unsupported version as media type parameter: "${this._version}"`, token);
    return this._readInTopContext(token);
  }
  // ### `_readInTopContext` reads a token when in the top context
  _readInTopContext(token) {
    switch (token.type) {
      // If an EOF token arrives in the top context, signal that we're done
      case "eof":
        if (this._graph !== null)
          return this._error("Unclosed graph", token);
        delete this._prefixes._;
        return this._callback(null, null, this._prefixes);
      // It could be a prefix declaration
      case "PREFIX":
        this._sparqlStyle = true;
      case "@prefix":
        return this._readPrefix;
      // It could be a base declaration
      case "BASE":
        this._sparqlStyle = true;
      case "@base":
        return this._readBaseIRI;
      // It could be a version declaration
      case "VERSION":
        this._sparqlStyle = true;
      case "@version":
        return this._readVersion;
      // It could be a graph
      case "{":
        if (this._supportsNamedGraphs) {
          this._graph = "";
          this._subject = null;
          return this._readSubject;
        }
      case "GRAPH":
        if (this._supportsNamedGraphs)
          return this._readNamedGraphLabel;
      // Otherwise, the next token must be a subject
      default:
        return this._readSubject(token);
    }
  }
  // ### `_readEntity` reads an IRI, prefixed name, blank node, or variable
  _readEntity(token, quantifier) {
    let value;
    switch (token.type) {
      // Read a relative or absolute IRI
      case "IRI":
      case "typeIRI":
        const iri = this._resolveIRI(token.value);
        if (iri === null)
          return this._error("Invalid IRI", token);
        value = this._factory.namedNode(iri);
        break;
      // Read a prefixed name
      case "type":
      case "prefixed":
        const prefix = this._prefixes[token.prefix];
        if (prefix === void 0)
          return this._error(`Undefined prefix "${token.prefix}:"`, token);
        value = this._factory.namedNode(prefix + token.value);
        break;
      // Read a blank node
      case "blank":
        value = this._factory.blankNode(this._prefixes[token.prefix] + token.value);
        break;
      // Read a variable
      case "var":
        value = this._factory.variable(token.value.substr(1));
        break;
      // Everything else is not an entity
      default:
        return this._error(`Expected entity but got ${token.type}`, token);
    }
    if (!quantifier && this._n3Mode && value.id in this._quantified)
      value = this._quantified[value.id];
    return value;
  }
  // ### `_readSubject` reads a quad's subject
  _readSubject(token) {
    this._predicate = null;
    switch (token.type) {
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          this._subject = this._factory.blankNode(),
          null,
          null
        );
        return this._readBlankNodeHead;
      case "(":
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent.type === "<<") {
          return this._error("Unexpected list in reified triple", token);
        }
        this._saveContext("list", this._graph, this.RDF_NIL, null, null);
        this._subject = null;
        return this._readListItem;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._graph = this._factory.blankNode(),
          null,
          null
        );
        return this._readSubject;
      case "}":
        return this._readPunctuation(token);
      case "@forSome":
        if (!this._n3Mode)
          return this._error('Unexpected "@forSome"', token);
        this._subject = null;
        this._predicate = this.N3_FORSOME;
        this._quantifier = "blankNode";
        return this._readQuantifierList;
      case "@forAll":
        if (!this._n3Mode)
          return this._error('Unexpected "@forAll"', token);
        this._subject = null;
        this._predicate = this.N3_FORALL;
        this._quantifier = "variable";
        return this._readQuantifierList;
      case "literal":
        if (!this._n3Mode)
          return this._error("Unexpected literal", token);
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._completeSubjectLiteral;
        } else
          this._subject = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
        break;
      case "<<(":
        if (!this._n3Mode)
          return this._error("Disallowed triple term as subject", token);
        this._saveContext("<<(", this._graph, null, null, null);
        this._graph = null;
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, null, null, null);
        this._graph = null;
        return this._readSubject;
      default:
        if ((this._subject = this._readEntity(token)) === void 0)
          return;
        if (this._n3Mode)
          return this._getPathReader(this._readPredicateOrNamedGraph);
    }
    return this._readPredicateOrNamedGraph;
  }
  // ### `_readPredicate` reads a quad's predicate
  _readPredicate(token) {
    const type = token.type;
    switch (type) {
      case "inverse":
        this._inversePredicate = true;
      case "abbreviation":
        this._predicate = this.ABBREVIATIONS[token.value];
        break;
      case ".":
      case "]":
      case "}":
      case "|}":
        if (this._predicate === null)
          return this._error(`Unexpected ${type}`, token);
        this._subject = null;
        return type === "]" ? this._readBlankNodeTail(token) : this._readPunctuation(token);
      case ";":
        return this._predicate !== null ? this._readPredicate : this._error("Expected predicate but got ;", token);
      case "[":
        if (this._n3Mode) {
          this._saveContext(
            "blank",
            this._graph,
            this._subject,
            this._subject = this._factory.blankNode(),
            null
          );
          return this._readBlankNodeHead;
        }
      case "blank":
        if (!this._n3Mode)
          return this._error("Disallowed blank node as predicate", token);
      default:
        if ((this._predicate = this._readEntity(token)) === void 0)
          return;
    }
    this._validAnnotation = true;
    return this._readObject;
  }
  // ### `_readObject` reads a quad's object
  _readObject(token) {
    switch (token.type) {
      case "literal":
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._readDataTypeOrLang;
        } else
          this._object = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
        break;
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          this._subject,
          this._predicate,
          this._subject = this._factory.blankNode()
        );
        return this._readBlankNodeHead;
      case "(":
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent.type === "<<") {
          return this._error("Unexpected list in reified triple", token);
        }
        this._saveContext("list", this._graph, this._subject, this._predicate, this.RDF_NIL);
        this._subject = null;
        return this._readListItem;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._subject,
          this._predicate,
          this._graph = this._factory.blankNode()
        );
        return this._readSubject;
      case "<<(":
        this._saveContext("<<(", this._graph, this._subject, this._predicate, null);
        this._graph = null;
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, this._subject, this._predicate, null);
        this._graph = null;
        return this._readSubject;
      default:
        if ((this._object = this._readEntity(token)) === void 0)
          return;
        if (this._n3Mode)
          return this._getPathReader(this._getContextEndReader());
    }
    return this._getContextEndReader();
  }
  // ### `_readPredicateOrNamedGraph` reads a quad's predicate, or a named graph
  _readPredicateOrNamedGraph(token) {
    return token.type === "{" ? this._readGraph(token) : this._readPredicate(token);
  }
  // ### `_readGraph` reads a graph
  _readGraph(token) {
    if (token.type !== "{")
      return this._error(`Expected graph but got ${token.type}`, token);
    this._graph = this._subject, this._subject = null;
    return this._readSubject;
  }
  // ### `_readBlankNodeHead` reads the head of a blank node
  _readBlankNodeHead(token) {
    if (token.type === "]") {
      this._subject = null;
      return this._readBlankNodeTail(token);
    } else {
      const stack = this._contextStack, parentParent = stack.length > 1 && stack[stack.length - 2];
      if (parentParent.type === "<<") {
        return this._error("Unexpected compound blank node expression in reified triple", token);
      }
      this._predicate = null;
      return this._readPredicate(token);
    }
  }
  // ### `_readBlankNodeTail` reads the end of a blank node
  _readBlankNodeTail(token) {
    if (token.type !== "]")
      return this._readBlankNodePunctuation(token);
    if (this._subject !== null)
      this._emit(this._subject, this._predicate, this._object, this._graph);
    const empty = this._predicate === null;
    this._restoreContext("blank", token);
    if (this._object !== null)
      return this._getContextEndReader();
    else if (this._predicate !== null)
      return this._readObject;
    else
      return empty ? this._readPredicateOrNamedGraph : this._readPredicateAfterBlank;
  }
  // ### `_readPredicateAfterBlank` reads a predicate after an anonymous blank node
  _readPredicateAfterBlank(token) {
    switch (token.type) {
      case ".":
      case "}":
        this._subject = null;
        return this._readPunctuation(token);
      default:
        return this._readPredicate(token);
    }
  }
  // ### `_readListItem` reads items from a list
  _readListItem(token) {
    let item = null, list2 = null, next = this._readListItem;
    const previousList = this._subject, stack = this._contextStack, parent = stack[stack.length - 1];
    switch (token.type) {
      case "[":
        this._saveContext(
          "blank",
          this._graph,
          list2 = this._factory.blankNode(),
          this.RDF_FIRST,
          this._subject = item = this._factory.blankNode()
        );
        next = this._readBlankNodeHead;
        break;
      case "(":
        this._saveContext(
          "list",
          this._graph,
          list2 = this._factory.blankNode(),
          this.RDF_FIRST,
          this.RDF_NIL
        );
        this._subject = null;
        break;
      case ")":
        this._restoreContext("list", token);
        if (stack.length !== 0 && stack[stack.length - 1].type === "list")
          this._emit(this._subject, this._predicate, this._object, this._graph);
        if (this._predicate === null) {
          next = this._readPredicate;
          if (this._subject === this.RDF_NIL)
            return next;
        } else {
          next = this._getContextEndReader();
          if (this._object === this.RDF_NIL)
            return next;
        }
        list2 = this.RDF_NIL;
        break;
      case "literal":
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          next = this._readListItemDataTypeOrLang;
        } else {
          item = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
          next = this._getContextEndReader();
        }
        break;
      case "{":
        if (!this._n3Mode)
          return this._error("Unexpected graph", token);
        this._saveContext(
          "formula",
          this._graph,
          this._subject,
          this._predicate,
          this._graph = this._factory.blankNode()
        );
        return this._readSubject;
      case "<<":
        this._saveContext("<<", this._graph, null, null, null);
        this._graph = null;
        next = this._readSubject;
        break;
      default:
        if ((item = this._readEntity(token)) === void 0)
          return;
    }
    if (list2 === null)
      this._subject = list2 = this._factory.blankNode();
    if (token.type === "<<")
      stack[stack.length - 1].subject = this._subject;
    if (previousList === null) {
      if (parent.predicate === null)
        parent.subject = list2;
      else
        parent.object = list2;
    } else {
      this._emit(previousList, this.RDF_REST, list2, this._graph);
    }
    if (item !== null) {
      if (this._n3Mode && (token.type === "IRI" || token.type === "prefixed")) {
        this._saveContext("item", this._graph, list2, this.RDF_FIRST, item);
        this._subject = item, this._predicate = null;
        return this._getPathReader(this._readListItem);
      }
      this._emit(list2, this.RDF_FIRST, item, this._graph);
    }
    return next;
  }
  // ### `_readDataTypeOrLang` reads an _optional_ datatype or language
  _readDataTypeOrLang(token) {
    return this._completeObjectLiteral(token, false);
  }
  // ### `_readListItemDataTypeOrLang` reads an _optional_ datatype or language in a list
  _readListItemDataTypeOrLang(token) {
    return this._completeObjectLiteral(token, true);
  }
  // ### `_completeLiteral` completes a literal with an optional datatype or language
  _completeLiteral(token, component) {
    let literal3 = this._factory.literal(this._literalValue);
    let readCb;
    switch (token.type) {
      // Create a datatyped literal
      case "type":
      case "typeIRI":
        const datatype = this._readEntity(token);
        if (datatype === void 0) return;
        if (datatype.value === IRIs_default2.rdf.langString || datatype.value === IRIs_default2.rdf.dirLangString) {
          return this._error("Detected illegal (directional) languaged-tagged string with explicit datatype", token);
        }
        literal3 = this._factory.literal(this._literalValue, datatype);
        token = null;
        break;
      // Create a language-tagged string
      case "langcode":
        if (token.value.split("-").some((t) => t.length > 8))
          return this._error("Detected language tag with subtag longer than 8 characters", token);
        literal3 = this._factory.literal(this._literalValue, token.value);
        this._literalLanguage = token.value;
        token = null;
        readCb = this._readDirCode.bind(this, component);
        break;
    }
    return { token, literal: literal3, readCb };
  }
  _readDirCode(component, listItem, token) {
    if (token.type === "dircode") {
      const term = this._factory.literal(this._literalValue, { language: this._literalLanguage, direction: token.value });
      if (component === "subject")
        this._subject = term;
      else
        this._object = term;
      this._literalLanguage = void 0;
      token = null;
    }
    if (component === "subject")
      return token === null ? this._readPredicateOrNamedGraph : this._readPredicateOrNamedGraph(token);
    return this._completeObjectLiteralPost(token, listItem);
  }
  // Completes a literal in subject position
  _completeSubjectLiteral(token) {
    const completed = this._completeLiteral(token, "subject");
    this._subject = completed.literal;
    if (completed.readCb)
      return completed.readCb.bind(this, false);
    return this._readPredicateOrNamedGraph;
  }
  // Completes a literal in object position
  _completeObjectLiteral(token, listItem) {
    const completed = this._completeLiteral(token, "object");
    if (!completed)
      return;
    this._object = completed.literal;
    if (completed.readCb)
      return completed.readCb.bind(this, listItem);
    return this._completeObjectLiteralPost(completed.token, listItem);
  }
  _completeObjectLiteralPost(token, listItem) {
    if (listItem)
      this._emit(this._subject, this.RDF_FIRST, this._object, this._graph);
    if (token === null)
      return this._getContextEndReader();
    else {
      this._readCallback = this._getContextEndReader();
      return this._readCallback(token);
    }
  }
  // ### `_readFormulaTail` reads the end of a formula
  _readFormulaTail(token) {
    if (token.type !== "}")
      return this._readPunctuation(token);
    if (this._subject !== null)
      this._emit(this._subject, this._predicate, this._object, this._graph);
    this._restoreContext("formula", token);
    return this._object === null ? this._readPredicate : this._getContextEndReader();
  }
  // ### `_readPunctuation` reads punctuation between quads or quad parts
  _readPunctuation(token) {
    let next, graph2 = this._graph, startingAnnotation = false;
    const subject = this._subject, inversePredicate = this._inversePredicate;
    switch (token.type) {
      // A closing brace ends a graph
      case "}":
        if (this._graph === null)
          return this._error("Unexpected graph closing", token);
        if (this._n3Mode)
          return this._readFormulaTail(token);
        this._graph = null;
      // A dot just ends the statement, without sharing anything with the next
      case ".":
        this._subject = null;
        this._tripleTerm = null;
        next = this._contextStack.length ? this._readSubject : this._readInTopContext;
        if (inversePredicate) this._inversePredicate = false;
        break;
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      // ~ is allowed in the annotation syntax
      case "~":
        next = this._readReifierInAnnotation;
        startingAnnotation = true;
        break;
      // {| means that the current triple is annotated with predicate-object pairs.
      case "{|":
        this._subject = this._readTripleTerm();
        this._validAnnotation = false;
        startingAnnotation = true;
        next = this._readPredicate;
        break;
      // |} means that the current reified triple in annotation syntax is finalized.
      case "|}":
        if (!this._annotation)
          return this._error("Unexpected annotation syntax closing", token);
        if (!this._validAnnotation)
          return this._error("Annotation block can not be empty", token);
        this._subject = null;
        this._annotation = false;
        next = this._readPunctuation;
        break;
      default:
        if (this._supportsQuads && this._graph === null && (graph2 = this._readEntity(token)) !== void 0) {
          next = this._readQuadPunctuation;
          break;
        }
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    if (subject !== null && (!startingAnnotation || startingAnnotation && !this._annotation)) {
      const predicate = this._predicate, object = this._object;
      if (!inversePredicate)
        this._emit(subject, predicate, object, graph2);
      else
        this._emit(object, predicate, subject, graph2);
    }
    if (startingAnnotation) {
      this._annotation = true;
    }
    return next;
  }
  // ### `_readBlankNodePunctuation` reads punctuation in a blank node
  _readBlankNodePunctuation(token) {
    let next;
    switch (token.type) {
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      default:
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    this._emit(this._subject, this._predicate, this._object, this._graph);
    return next;
  }
  // ### `_readQuadPunctuation` reads punctuation after a quad
  _readQuadPunctuation(token) {
    if (token.type !== ".")
      return this._error("Expected dot to follow quad", token);
    return this._readInTopContext;
  }
  // ### `_readPrefix` reads the prefix of a prefix declaration
  _readPrefix(token) {
    if (token.type !== "prefix")
      return this._error("Expected prefix to follow @prefix", token);
    this._prefix = token.value;
    return this._readPrefixIRI;
  }
  // ### `_readPrefixIRI` reads the IRI of a prefix declaration
  _readPrefixIRI(token) {
    if (token.type !== "IRI")
      return this._error(`Expected IRI to follow prefix "${this._prefix}:"`, token);
    const prefixNode = this._readEntity(token);
    this._prefixes[this._prefix] = prefixNode.value;
    this._prefixCallback(this._prefix, prefixNode);
    return this._readDeclarationPunctuation;
  }
  // ### `_readBaseIRI` reads the IRI of a base declaration
  _readBaseIRI(token) {
    const iri = token.type === "IRI" && this._resolveIRI(token.value);
    if (!iri)
      return this._error("Expected valid IRI to follow base declaration", token);
    this._setBase(iri);
    return this._readDeclarationPunctuation;
  }
  // ### `_isValidVersion` checks if the given version is valid for this parser to handle.
  _isValidVersion(version) {
    return this._parseUnsupportedVersions || _N3Parser.SUPPORTED_VERSIONS.includes(version);
  }
  // ### `_readVersion` reads version string declaration
  _readVersion(token) {
    if (token.type !== "literal")
      return this._error("Expected literal to follow version declaration", token);
    if (token.end - token.start !== token.value.length + 2)
      return this._error("Version declarations must use single quotes", token);
    this._versionCallback(token.value);
    if (!this._isValidVersion(token.value))
      return this._error(`Detected unsupported version: "${token.value}"`, token);
    return this._readDeclarationPunctuation;
  }
  // ### `_readNamedGraphLabel` reads the label of a named graph
  _readNamedGraphLabel(token) {
    switch (token.type) {
      case "IRI":
      case "blank":
      case "prefixed":
        return this._readSubject(token), this._readGraph;
      case "[":
        return this._readNamedGraphBlankLabel;
      default:
        return this._error("Invalid graph label", token);
    }
  }
  // ### `_readNamedGraphLabel` reads a blank node label of a named graph
  _readNamedGraphBlankLabel(token) {
    if (token.type !== "]")
      return this._error("Invalid graph label", token);
    this._subject = this._factory.blankNode();
    return this._readGraph;
  }
  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration
  _readDeclarationPunctuation(token) {
    if (this._sparqlStyle) {
      this._sparqlStyle = false;
      return this._readInTopContext(token);
    }
    if (token.type !== ".")
      return this._error("Expected declaration to end with a dot", token);
    return this._readInTopContext;
  }
  // Reads a list of quantified symbols from a @forSome or @forAll statement
  _readQuantifierList(token) {
    let entity;
    switch (token.type) {
      case "IRI":
      case "prefixed":
        if ((entity = this._readEntity(token, true)) !== void 0)
          break;
      default:
        return this._error(`Unexpected ${token.type}`, token);
    }
    if (!this._explicitQuantifiers)
      this._quantified[entity.id] = this._factory[this._quantifier](this._factory.blankNode().value);
    else {
      if (this._subject === null)
        this._emit(
          this._graph || this.DEFAULTGRAPH,
          this._predicate,
          this._subject = this._factory.blankNode(),
          this.QUANTIFIERS_GRAPH
        );
      else
        this._emit(
          this._subject,
          this.RDF_REST,
          this._subject = this._factory.blankNode(),
          this.QUANTIFIERS_GRAPH
        );
      this._emit(this._subject, this.RDF_FIRST, entity, this.QUANTIFIERS_GRAPH);
    }
    return this._readQuantifierPunctuation;
  }
  // Reads punctuation from a @forSome or @forAll statement
  _readQuantifierPunctuation(token) {
    if (token.type === ",")
      return this._readQuantifierList;
    else {
      if (this._explicitQuantifiers) {
        this._emit(this._subject, this.RDF_REST, this.RDF_NIL, this.QUANTIFIERS_GRAPH);
        this._subject = null;
      }
      this._readCallback = this._getContextEndReader();
      return this._readCallback(token);
    }
  }
  // ### `_getPathReader` reads a potential path and then resumes with the given function
  _getPathReader(afterPath) {
    this._afterPath = afterPath;
    return this._readPath;
  }
  // ### `_readPath` reads a potential path
  _readPath(token) {
    switch (token.type) {
      // Forward path
      case "!":
        return this._readForwardPath;
      // Backward path
      case "^":
        return this._readBackwardPath;
      // Not a path; resume reading where we left off
      default:
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent && parent.type === "item") {
          const item = this._subject;
          this._restoreContext("item", token);
          this._emit(this._subject, this.RDF_FIRST, item, this._graph);
        }
        return this._afterPath(token);
    }
  }
  // ### `_readForwardPath` reads a '!' path
  _readForwardPath(token) {
    let subject, predicate;
    const object = this._factory.blankNode();
    if ((predicate = this._readEntity(token)) === void 0)
      return;
    if (this._predicate === null)
      subject = this._subject, this._subject = object;
    else
      subject = this._object, this._object = object;
    this._emit(subject, predicate, object, this._graph);
    return this._readPath;
  }
  // ### `_readBackwardPath` reads a '^' path
  _readBackwardPath(token) {
    const subject = this._factory.blankNode();
    let predicate, object;
    if ((predicate = this._readEntity(token)) === void 0)
      return;
    if (this._predicate === null)
      object = this._subject, this._subject = subject;
    else
      object = this._object, this._object = subject;
    this._emit(subject, predicate, object, this._graph);
    return this._readPath;
  }
  // ### `_readTripleTermTail` reads the end of a triple term
  _readTripleTermTail(token) {
    if (token.type !== ")>>")
      return this._error(`Expected )>> but got ${token.type}`, token);
    const quad3 = this._factory.quad(
      this._subject,
      this._predicate,
      this._object,
      this._graph || this.DEFAULTGRAPH
    );
    this._restoreContext("<<(", token);
    if (this._subject === null) {
      this._subject = quad3;
      return this._readPredicate;
    } else {
      this._object = quad3;
      return this._getContextEndReader();
    }
  }
  // ### `_readReifiedTripleTailOrReifier` reads a reifier or the end of a nested reified triple
  _readReifiedTripleTailOrReifier(token) {
    if (token.type === "~") {
      return this._readReifier;
    }
    return this._readReifiedTripleTail(token);
  }
  // ### `_readReifiedTripleTail` reads the end of a nested reified triple
  _readReifiedTripleTail(token) {
    if (token.type !== ">>")
      return this._error(`Expected >> but got ${token.type}`, token);
    this._tripleTerm = null;
    const reifier = this._readTripleTerm();
    this._restoreContext("<<", token);
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    if (parent && parent.type === "list") {
      this._emit(this._subject, this.RDF_FIRST, reifier, this._graph);
      return this._getContextEndReader();
    } else if (this._subject === null) {
      this._subject = reifier;
      return this._readPredicateOrReifierTripleEnd;
    } else {
      this._object = reifier;
      return this._getContextEndReader();
    }
  }
  _readPredicateOrReifierTripleEnd(token) {
    if (token.type === ".") {
      this._subject = null;
      return this._readPunctuation(token);
    }
    return this._readPredicate(token);
  }
  // ### `_readReifier` reads the triple term identifier after a tilde when in a reifying triple.
  _readReifier(token) {
    this._reifier = this._readEntity(token);
    return this._readReifiedTripleTail;
  }
  // ### `_readReifier` reads the optional triple term identifier after a tilde when in annotation syntax.
  _readReifierInAnnotation(token) {
    if (token.type === "IRI" || token.type === "typeIRI" || token.type === "type" || token.type === "prefixed" || token.type === "blank" || token.type === "var") {
      this._reifier = this._readEntity(token);
      return this._readPunctuation;
    }
    this._readTripleTerm();
    this._subject = null;
    return this._readPunctuation(token);
  }
  _readTripleTerm() {
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    const parentGraph = parent ? parent.graph : void 0;
    const reifier = this._reifier || this._factory.blankNode();
    this._reifier = null;
    this._tripleTerm = this._tripleTerm || this._factory.quad(this._subject, this._predicate, this._object);
    this._emit(reifier, this.RDF_REIFIES, this._tripleTerm, parentGraph || this.DEFAULTGRAPH);
    return reifier;
  }
  // ### `_getContextEndReader` gets the next reader function at the end of a context
  _getContextEndReader() {
    const contextStack = this._contextStack;
    if (!contextStack.length)
      return this._readPunctuation;
    switch (contextStack[contextStack.length - 1].type) {
      case "blank":
        return this._readBlankNodeTail;
      case "list":
        return this._readListItem;
      case "formula":
        return this._readFormulaTail;
      case "<<(":
        return this._readTripleTermTail;
      case "<<":
        return this._readReifiedTripleTailOrReifier;
    }
  }
  // ### `_emit` sends a quad through the callback
  _emit(subject, predicate, object, graph2) {
    this._callback(null, this._factory.quad(subject, predicate, object, graph2 || this.DEFAULTGRAPH));
  }
  // ### `_error` emits an error message through the callback
  _error(message, token) {
    const err = new Error(`${message} on line ${token.line}.`);
    err.context = {
      token,
      line: token.line,
      previousToken: this._lexer.previousToken
    };
    this._callback(err);
    this._callback = noop2;
  }
  // ### `_resolveIRI` resolves an IRI against the base path
  _resolveIRI(iri) {
    return /^[a-z][a-z0-9+.-]*:/i.test(iri) ? iri : this._resolveRelativeIRI(iri);
  }
  // ### `_resolveRelativeIRI` resolves an IRI against the base path,
  // assuming that a base path has been set and that the IRI is indeed relative
  _resolveRelativeIRI(iri) {
    if (!iri.length)
      return this._base;
    switch (iri[0]) {
      // Resolve relative fragment IRIs against the base IRI
      case "#":
        return this._base + iri;
      // Resolve relative query string IRIs by replacing the query string
      case "?":
        return this._base.replace(/(?:\?.*)?$/, iri);
      // Resolve root-relative IRIs at the root of the base IRI
      case "/":
        return (iri[1] === "/" ? this._baseScheme : this._baseRoot) + this._removeDotSegments(iri);
      // Resolve all other IRIs at the base IRI's path
      default:
        return /^[^/:]*:/.test(iri) ? null : this._removeDotSegments(this._basePath + iri);
    }
  }
  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986
  _removeDotSegments(iri) {
    if (!/(^|\/)\.\.?($|[/#?])/.test(iri))
      return iri;
    const length = iri.length;
    let result = "", i = -1, pathStart = -1, segmentStart = 0, next = "/";
    while (i < length) {
      switch (next) {
        // The path starts with the first slash after the authority
        case ":":
          if (pathStart < 0) {
            if (iri[++i] === "/" && iri[++i] === "/")
              while ((pathStart = i + 1) < length && iri[pathStart] !== "/")
                i = pathStart;
          }
          break;
        // Don't modify a query string or fragment
        case "?":
        case "#":
          i = length;
          break;
        // Handle '/.' or '/..' path segments
        case "/":
          if (iri[i + 1] === ".") {
            next = iri[++i + 1];
            switch (next) {
              // Remove a '/.' segment
              case "/":
                result += iri.substring(segmentStart, i - 1);
                segmentStart = i + 1;
                break;
              // Remove a trailing '/.' segment
              case void 0:
              case "?":
              case "#":
                return result + iri.substring(segmentStart, i) + iri.substr(i + 1);
              // Remove a '/..' segment
              case ".":
                next = iri[++i + 1];
                if (next === void 0 || next === "/" || next === "?" || next === "#") {
                  result += iri.substring(segmentStart, i - 2);
                  if ((segmentStart = result.lastIndexOf("/")) >= pathStart)
                    result = result.substr(0, segmentStart);
                  if (next !== "/")
                    return `${result}/${iri.substr(i + 1)}`;
                  segmentStart = i + 1;
                }
            }
          }
      }
      next = iri[++i];
    }
    return result + iri.substring(segmentStart);
  }
  // ## Public methods
  // ### `parse` parses the N3 input and emits each parsed quad through the onQuad callback.
  parse(input2, quadCallback, prefixCallback, versionCallback) {
    let onQuad, onPrefix, onComment, onVersion;
    if (quadCallback && (quadCallback.onQuad || quadCallback.onPrefix || quadCallback.onComment || quadCallback.onVersion)) {
      onQuad = quadCallback.onQuad;
      onPrefix = quadCallback.onPrefix;
      onComment = quadCallback.onComment;
      onVersion = quadCallback.onVersion;
    } else {
      onQuad = quadCallback;
      onPrefix = prefixCallback;
      onVersion = versionCallback;
    }
    this._readCallback = this._readBeforeTopContext;
    this._sparqlStyle = false;
    this._prefixes = /* @__PURE__ */ Object.create(null);
    this._prefixes._ = this._blankNodePrefix ? this._blankNodePrefix.substr(2) : `b${blankNodePrefix2++}_`;
    this._prefixCallback = onPrefix || noop2;
    this._versionCallback = onVersion || noop2;
    this._inversePredicate = false;
    this._quantified = /* @__PURE__ */ Object.create(null);
    if (!onQuad) {
      const quads = [];
      let error4;
      this._callback = (e, t) => {
        e ? error4 = e : t && quads.push(t);
      };
      this._lexer.tokenize(input2).every((token) => {
        return this._readCallback = this._readCallback(token);
      });
      if (error4) throw error4;
      return quads;
    }
    let processNextToken = (error4, token) => {
      if (error4 !== null)
        this._callback(error4), this._callback = noop2;
      else if (this._readCallback)
        this._readCallback = this._readCallback(token);
    };
    if (onComment) {
      this._lexer.comments = true;
      processNextToken = (error4, token) => {
        if (error4 !== null)
          this._callback(error4), this._callback = noop2;
        else if (this._readCallback) {
          if (token.type === "comment")
            onComment(token.value);
          else
            this._readCallback = this._readCallback(token);
        }
      };
    }
    this._callback = onQuad;
    this._lexer.tokenize(input2, processNextToken);
  }
};
function noop2() {
}
function initDataFactory2(parser, factory) {
  parser._factory = factory;
  parser.DEFAULTGRAPH = factory.defaultGraph();
  parser.RDF_FIRST = factory.namedNode(IRIs_default2.rdf.first);
  parser.RDF_REST = factory.namedNode(IRIs_default2.rdf.rest);
  parser.RDF_NIL = factory.namedNode(IRIs_default2.rdf.nil);
  parser.RDF_REIFIES = factory.namedNode(IRIs_default2.rdf.reifies);
  parser.N3_FORALL = factory.namedNode(IRIs_default2.r.forAll);
  parser.N3_FORSOME = factory.namedNode(IRIs_default2.r.forSome);
  parser.ABBREVIATIONS = {
    "a": factory.namedNode(IRIs_default2.rdf.type),
    "=": factory.namedNode(IRIs_default2.owl.sameAs),
    ">": factory.namedNode(IRIs_default2.log.implies),
    "<": factory.namedNode(IRIs_default2.log.isImpliedBy)
  };
  parser.QUANTIFIERS_GRAPH = factory.namedNode("urn:n3:quantifiers");
}
N3Parser2.SUPPORTED_VERSIONS = [
  "1.2",
  "1.2-basic",
  "1.1"
];
initDataFactory2(N3Parser2.prototype, N3DataFactory_default2);

// node_modules/n3/src/N3Util.js
function isDefaultGraph2(term) {
  return !!term && term.termType === "DefaultGraph";
}

// node_modules/n3/src/Util.js
function escapeRegex2(regex) {
  return regex.replace(/[\]\/\(\)\*\+\?\.\\\$]/g, "\\$&");
}

// node_modules/n3/src/BaseIRI.js
var BASE_UNSUPPORTED2 = /^:?[^:?#]*(?:[?#]|$)|^file:|^[^:]*:\/*[^?#]+?\/(?:\.\.?(?:\/|$)|\/)/i;
var SUFFIX_SUPPORTED2 = /^(?:(?:[^/?#]{3,}|\.?[^/?#.]\.?)(?:\/[^/?#]{3,}|\.?[^/?#.]\.?)*\/?)?(?:[?#]|$)/;
var CURRENT2 = "./";
var PARENT2 = "../";
var QUERY2 = "?";
var FRAGMENT2 = "#";
var BaseIRI2 = class _BaseIRI {
  constructor(base) {
    this.base = base;
    this._baseLength = 0;
    this._baseMatcher = null;
    this._pathReplacements = new Array(base.length + 1);
  }
  static supports(base) {
    return !BASE_UNSUPPORTED2.test(base);
  }
  _getBaseMatcher() {
    if (this._baseMatcher)
      return this._baseMatcher;
    if (!_BaseIRI.supports(this.base))
      return this._baseMatcher = /.^/;
    const scheme = /^[^:]*:\/*/.exec(this.base)[0];
    const regexHead = ["^", escapeRegex2(scheme)];
    const regexTail = [];
    const segments = [], segmenter = /[^/?#]*([/?#])/y;
    let segment, query = 0, fragment = 0, last = segmenter.lastIndex = scheme.length;
    while (!query && !fragment && (segment = segmenter.exec(this.base))) {
      if (segment[1] === FRAGMENT2)
        fragment = segmenter.lastIndex - 1;
      else {
        regexHead.push(escapeRegex2(segment[0]), "(?:");
        regexTail.push(")?");
        if (segment[1] !== QUERY2)
          segments.push(last = segmenter.lastIndex);
        else {
          query = last = segmenter.lastIndex;
          fragment = this.base.indexOf(FRAGMENT2, query);
          this._pathReplacements[query] = QUERY2;
        }
      }
    }
    for (let i = 0; i < segments.length; i++)
      this._pathReplacements[segments[i]] = PARENT2.repeat(segments.length - i - 1);
    this._pathReplacements[segments[segments.length - 1]] = CURRENT2;
    this._baseLength = fragment > 0 ? fragment : this.base.length;
    regexHead.push(
      escapeRegex2(this.base.substring(last, this._baseLength)),
      query ? "(?:#|$)" : "(?:[?#]|$)"
    );
    return this._baseMatcher = new RegExp([...regexHead, ...regexTail].join(""));
  }
  toRelative(iri) {
    const match = this._getBaseMatcher().exec(iri);
    if (!match)
      return iri;
    const length = match[0].length;
    if (length === this._baseLength && length === iri.length)
      return "";
    const parentPath = this._pathReplacements[length];
    if (parentPath) {
      const suffix = iri.substring(length);
      if (parentPath !== QUERY2 && !SUFFIX_SUPPORTED2.test(suffix))
        return iri;
      if (parentPath === CURRENT2 && /^[^?#]/.test(suffix))
        return suffix;
      return parentPath + suffix;
    }
    return iri.substring(length - 1);
  }
};

// node_modules/n3/src/N3Writer.js
var DEFAULTGRAPH4 = N3DataFactory_default2.defaultGraph();
var { rdf: rdf4, xsd: xsd6 } = IRIs_default2;
var escape2 = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/;
var escapeAll2 = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
var escapedCharacters2 = {
  "\\": "\\\\",
  '"': '\\"',
  "	": "\\t",
  "\n": "\\n",
  "\r": "\\r",
  "\b": "\\b",
  "\f": "\\f"
};
var SerializedTerm2 = class extends Term2 {
  // Pretty-printed nodes are not equal to any other node
  // (e.g., [] does not equal [])
  equals(other) {
    return other === this;
  }
};
var N3Writer2 = class {
  constructor(outputStream, options) {
    this._prefixRegex = /$0^/;
    if (outputStream && typeof outputStream.write !== "function")
      options = outputStream, outputStream = null;
    options = options || {};
    this._lists = options.lists;
    if (!outputStream) {
      let output = "";
      this._outputStream = {
        write(chunk, encoding, done) {
          output += chunk;
          done && done();
        },
        end: (done) => {
          done && done(null, output);
        }
      };
      this._endStream = true;
    } else {
      this._outputStream = outputStream;
      this._endStream = options.end === void 0 ? true : !!options.end;
    }
    this._subject = null;
    if (!/triple|quad/i.test(options.format)) {
      this._lineMode = false;
      this._graph = DEFAULTGRAPH4;
      this._prefixIRIs = /* @__PURE__ */ Object.create(null);
      options.prefixes && this.addPrefixes(options.prefixes);
      if (options.baseIRI) {
        this._baseIri = new BaseIRI2(options.baseIRI);
      }
    } else {
      this._lineMode = true;
      this._writeQuad = this._writeQuadLine;
    }
  }
  // ## Private methods
  // ### Whether the current graph is the default graph
  get _inDefaultGraph() {
    return DEFAULTGRAPH4.equals(this._graph);
  }
  // ### `_write` writes the argument to the output stream
  _write(string, callback) {
    this._outputStream.write(string, "utf8", callback);
  }
  // ### `_writeQuad` writes the quad to the output stream
  _writeQuad(subject, predicate, object, graph2, done) {
    try {
      if (!graph2.equals(this._graph) || graph2.termType !== this._graph.termType) {
        this._write((this._subject === null ? "" : this._inDefaultGraph ? ".\n" : "\n}\n") + (DEFAULTGRAPH4.equals(graph2) ? "" : `${this._encodeIriOrBlank(graph2)} {
`));
        this._graph = graph2;
        this._subject = null;
      }
      if (subject.equals(this._subject)) {
        if (predicate.equals(this._predicate))
          this._write(`, ${this._encodeObject(object)}`, done);
        else
          this._write(`;
    ${this._encodePredicate(this._predicate = predicate)} ${this._encodeObject(object)}`, done);
      } else
        this._write(`${(this._subject === null ? "" : ".\n") + this._encodeSubject(this._subject = subject)} ${this._encodePredicate(this._predicate = predicate)} ${this._encodeObject(object)}`, done);
    } catch (error4) {
      done && done(error4);
    }
  }
  // ### `_writeQuadLine` writes the quad to the output stream as a single line
  _writeQuadLine(subject, predicate, object, graph2, done) {
    delete this._prefixMatch;
    this._write(this.quadToString(subject, predicate, object, graph2), done);
  }
  // ### `quadToString` serializes a quad as a string
  quadToString(subject, predicate, object, graph2) {
    return `${this._encodeSubject(subject)} ${this._encodeIriOrBlank(predicate)} ${this._encodeObject(object)}${graph2 && !isDefaultGraph2(graph2) ? ` ${this._encodeIriOrBlank(graph2)} .
` : " .\n"}`;
  }
  // ### `quadsToString` serializes an array of quads as a string
  quadsToString(quads) {
    let quadsString = "";
    for (const quad3 of quads)
      quadsString += this.quadToString(quad3.subject, quad3.predicate, quad3.object, quad3.graph);
    return quadsString;
  }
  // ### `_encodeSubject` represents a subject
  _encodeSubject(entity) {
    return entity.termType === "Quad" ? this._encodeQuad(entity) : this._encodeIriOrBlank(entity);
  }
  // ### `_encodeIriOrBlank` represents an IRI or blank node
  _encodeIriOrBlank(entity) {
    if (entity.termType !== "NamedNode") {
      if (this._lists && entity.value in this._lists)
        entity = this.list(this._lists[entity.value]);
      return "id" in entity ? entity.id : `_:${entity.value}`;
    }
    let iri = entity.value;
    if (this._baseIri) {
      iri = this._baseIri.toRelative(iri);
    }
    if (escape2.test(iri))
      iri = iri.replace(escapeAll2, characterReplacer2);
    const prefixMatch = this._prefixRegex.exec(iri);
    return !prefixMatch ? `<${iri}>` : !prefixMatch[1] ? iri : this._prefixIRIs[prefixMatch[1]] + prefixMatch[2];
  }
  // ### `_encodeLiteral` represents a literal
  _encodeLiteral(literal3) {
    let value = literal3.value;
    if (escape2.test(value))
      value = value.replace(escapeAll2, characterReplacer2);
    const direction = literal3.direction ? `--${literal3.direction}` : "";
    if (literal3.language)
      return `"${value}"@${literal3.language}${direction}`;
    if (this._lineMode) {
      if (literal3.datatype.value === xsd6.string)
        return `"${value}"`;
    } else {
      switch (literal3.datatype.value) {
        case xsd6.string:
          return `"${value}"`;
        case xsd6.boolean:
          if (value === "true" || value === "false")
            return value;
          break;
        case xsd6.integer:
          if (/^[+-]?\d+$/.test(value))
            return value;
          break;
        case xsd6.decimal:
          if (/^[+-]?\d*\.\d+$/.test(value))
            return value;
          break;
        case xsd6.double:
          if (/^[+-]?(?:\d+\.\d*|\.?\d+)[eE][+-]?\d+$/.test(value))
            return value;
          break;
      }
    }
    return `"${value}"^^${this._encodeIriOrBlank(literal3.datatype)}`;
  }
  // ### `_encodePredicate` represents a predicate
  _encodePredicate(predicate) {
    return predicate.value === rdf4.type ? "a" : this._encodeIriOrBlank(predicate);
  }
  // ### `_encodeObject` represents an object
  _encodeObject(object) {
    switch (object.termType) {
      case "Quad":
        return this._encodeQuad(object);
      case "Literal":
        return this._encodeLiteral(object);
      default:
        return this._encodeIriOrBlank(object);
    }
  }
  // ### `_encodeQuad` encodes an RDF-star quad
  _encodeQuad({ subject, predicate, object, graph: graph2 }) {
    return `<<(${this._encodeSubject(subject)} ${this._encodePredicate(predicate)} ${this._encodeObject(object)}${isDefaultGraph2(graph2) ? "" : ` ${this._encodeIriOrBlank(graph2)}`})>>`;
  }
  // ### `_blockedWrite` replaces `_write` after the writer has been closed
  _blockedWrite() {
    throw new Error("Cannot write because the writer has been closed.");
  }
  // ### `addQuad` adds the quad to the output stream
  addQuad(subject, predicate, object, graph2, done) {
    if (object === void 0)
      this._writeQuad(subject.subject, subject.predicate, subject.object, subject.graph, predicate);
    else if (typeof graph2 === "function")
      this._writeQuad(subject, predicate, object, DEFAULTGRAPH4, graph2);
    else
      this._writeQuad(subject, predicate, object, graph2 || DEFAULTGRAPH4, done);
  }
  // ### `addQuads` adds the quads to the output stream
  addQuads(quads) {
    for (let i = 0; i < quads.length; i++)
      this.addQuad(quads[i]);
  }
  // ### `addPrefix` adds the prefix to the output stream
  addPrefix(prefix, iri, done) {
    const prefixes4 = {};
    prefixes4[prefix] = iri;
    this.addPrefixes(prefixes4, done);
  }
  // ### `addPrefixes` adds the prefixes to the output stream
  addPrefixes(prefixes4, done) {
    if (!this._prefixIRIs)
      return done && done();
    let hasPrefixes = false;
    for (let prefix in prefixes4) {
      let iri = prefixes4[prefix];
      if (typeof iri !== "string")
        iri = iri.value;
      hasPrefixes = true;
      if (this._subject !== null) {
        this._write(this._inDefaultGraph ? ".\n" : "\n}\n");
        this._subject = null, this._graph = "";
      }
      this._prefixIRIs[iri] = prefix += ":";
      this._write(`@prefix ${prefix} <${iri}>.
`);
    }
    if (hasPrefixes) {
      let IRIlist = "", prefixList = "";
      for (const prefixIRI in this._prefixIRIs) {
        IRIlist += IRIlist ? `|${prefixIRI}` : prefixIRI;
        prefixList += (prefixList ? "|" : "") + this._prefixIRIs[prefixIRI];
      }
      IRIlist = escapeRegex2(IRIlist, /[\]\/\(\)\*\+\?\.\\\$]/g, "\\$&");
      this._prefixRegex = new RegExp(`^(?:${prefixList})[^/]*$|^(${IRIlist})([_a-zA-Z0-9][\\-_a-zA-Z0-9]*)$`);
    }
    this._write(hasPrefixes ? "\n" : "", done);
  }
  // ### `blank` creates a blank node with the given content
  blank(predicate, object) {
    let children = predicate, child, length;
    if (predicate === void 0)
      children = [];
    else if (predicate.termType)
      children = [{ predicate, object }];
    else if (!("length" in predicate))
      children = [predicate];
    switch (length = children.length) {
      // Generate an empty blank node
      case 0:
        return new SerializedTerm2("[]");
      // Generate a non-nested one-triple blank node
      case 1:
        child = children[0];
        if (!(child.object instanceof SerializedTerm2))
          return new SerializedTerm2(`[ ${this._encodePredicate(child.predicate)} ${this._encodeObject(child.object)} ]`);
      // Generate a multi-triple or nested blank node
      default:
        let contents = "[";
        for (let i = 0; i < length; i++) {
          child = children[i];
          if (child.predicate.equals(predicate))
            contents += `, ${this._encodeObject(child.object)}`;
          else {
            contents += `${(i ? ";\n  " : "\n  ") + this._encodePredicate(child.predicate)} ${this._encodeObject(child.object)}`;
            predicate = child.predicate;
          }
        }
        return new SerializedTerm2(`${contents}
]`);
    }
  }
  // ### `list` creates a list node with the given content
  list(elements) {
    const length = elements && elements.length || 0, contents = new Array(length);
    for (let i = 0; i < length; i++)
      contents[i] = this._encodeObject(elements[i]);
    return new SerializedTerm2(`(${contents.join(" ")})`);
  }
  // ### `end` signals the end of the output stream
  end(done) {
    if (this._subject !== null) {
      this._write(this._inDefaultGraph ? ".\n" : "\n}\n");
      this._subject = null;
    }
    this._write = this._blockedWrite;
    let singleDone = done && ((error4, result) => {
      singleDone = null, done(error4, result);
    });
    if (this._endStream) {
      try {
        return this._outputStream.end(singleDone);
      } catch (error4) {
      }
    }
    singleDone && singleDone();
  }
};
function characterReplacer2(character) {
  let result = escapedCharacters2[character];
  if (result === void 0) {
    if (character.length === 1) {
      result = character.charCodeAt(0).toString(16);
      result = "\\u0000".substr(0, 6 - result.length) + result;
    } else {
      result = ((character.charCodeAt(0) - 55296) * 1024 + character.charCodeAt(1) + 9216).toString(16);
      result = "\\U00000000".substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

// node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var solidNamespace2 = "http://www.w3.org/ns/solid/terms#";
var rdfNamespace2 = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var n3Parser2 = (input2, uri, type) => {
  const parser = new N3Parser2({
    baseIRI: uri,
    blankNodePrefix: "",
    format: type
  });
  let prefixes4 = /* @__PURE__ */ Object.create(null);
  const quads = parser.parse(input2, null, (prefix, url3) => {
    prefixes4[prefix] = url3.id;
  });
  return { quads, prefixes: prefixes4 };
};
var n3Writer2 = (source) => {
  return new Promise((resolve, reject) => {
    const writer = new N3Writer2({
      format: source.mimetype,
      prefixes: source.prefixDeclarations("source")
    });
    const xsd7 = source.prefixes.xsd;
    const { quad: quad3, namedNode: namedNode3, literal: literal3, blankNode: blankNode3 } = N3DataFactory_default2;
    const writeClassNames = (id2, subject) => {
      let classNames = subject.a;
      if (!classNames) {
        return;
      }
      if (!Array.isArray(classNames)) {
        classNames = [classNames];
      }
      if (classNames?.length) {
        for (let name of classNames) {
          name = source.fullURI(name);
          writer.addQuad(quad3(
            namedNode3(id2),
            namedNode3(rdfType2),
            namedNode3(name)
          ));
        }
      }
    };
    const writeProperties = (id2, subject) => {
      if (!subject) {
        return;
      }
      let preds = getPredicates(subject);
      for (let pred of preds) {
        if (pred.predicate.id == "id" || pred.predicate.id == "a") {
          continue;
        }
        if (!Array.isArray(pred.object)) {
          pred.object = [pred.object];
        }
        for (let o of pred.object) {
          writer.addQuad(quad3(
            namedNode3(id2),
            pred.predicate,
            o
          ));
        }
      }
    };
    const getPredicates = (object) => {
      let preds = [];
      Object.entries(object).forEach((entry) => {
        const predicate = entry[0];
        let object2 = entry[1];
        const fullPred = source.fullURI(predicate);
        let pred = {
          predicate: namedNode3(fullPred)
        };
        if (object2 instanceof Collection2) {
          pred.object = getCollection(object2);
        } else if (Array.isArray(object2)) {
          pred.object = getArray(object2);
        } else if (object2 instanceof NamedNode3) {
          pred.object = namedNode3(object2.id);
        } else if (object2 instanceof BlankNode3) {
          pred.object = getBlankNode(object2);
        } else if (isLiteral3(object2)) {
          pred.object = getLiteral(object2);
        } else {
          console.log("oldm-ns: encountered unknown object", object2, predicate);
        }
        preds.push(pred);
      });
      return preds;
    };
    const getLiteral = (object) => {
      let type = source.getType(object) || void 0;
      if (type) {
        if (type == xsd7 + source.context.separator + "string" || type == xsd7 + source.context.separator + "number") {
          type = void 0;
        } else {
          type = source.fullURI(type);
        }
        type = namedNode3(type);
      } else {
        let language = object?.language;
        if (language) {
          type = language;
        }
      }
      if (object instanceof String) {
        object = "" + object;
      } else if (object instanceof Number) {
        object = +object;
      }
      return literal3(object, type);
    };
    const isLiteral3 = (value) => {
      return value instanceof String || value instanceof Number || typeof value == "boolean" || typeof value == "string" || typeof value == "number";
    };
    const getCollection = (object) => {
      let list2 = [];
      for (let value of object) {
        if (isLiteral3(value)) {
          list2.push(getLiteral(value));
        } else if (value.id) {
          list2.push(namedNode3(value.id));
        } else {
          list2.push(getBlankNode(value));
        }
      }
      return writer.list(list2);
    };
    const getBlankNode = (object) => {
      return writer.blank(getPredicates(object));
    };
    const getArray = (object) => {
      let list2 = [];
      for (const o of object) {
        if (isLiteral3(o)) {
          list2.push(getLiteral(o));
        } else if (o instanceof NamedNode3) {
          list2.push(namedNode3(o.id));
        } else if (o instanceof BlankNode3) {
          list2.push(getBlankNode(o));
        } else if (o instanceof Collection2) {
          list2.push(getCollection(o));
        }
      }
      return list2;
    };
    Object.entries(source.subjects).forEach(([id2, subject]) => {
      id2 = source.shortURI(id2, ":");
      writeClassNames(id2, subject);
      writeProperties(id2, subject);
    });
    writer.end((error4, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error4);
      }
    });
  });
};
var n3PatchWriter2 = async (source) => {
  if (source.originalSource == null) {
    throw new Error("Cannot generate a patch without the original graph source");
  }
  const currentSource = await n3Writer2(source);
  const original = n3Parser2(source.originalSource, source.url, source.mimetype).quads;
  const current = n3Parser2(currentSource, source.url, source.mimetype).quads;
  const patch = solidPatchChanges2(original, current, {
    quad: N3DataFactory_default2.quad,
    variable: N3DataFactory_default2.variable,
    blankNode: N3DataFactory_default2.blankNode
  });
  return serializePatch2(source, patch.inserts, patch.deletes, patch.where);
};
function diffQuads2(original, current) {
  const originalByKey = new Map(original.map((quad3) => [quadKey2(quad3), quad3]));
  const currentByKey = new Map(current.map((quad3) => [quadKey2(quad3), quad3]));
  const deletes = [];
  const inserts = [];
  for (const [key, quad3] of originalByKey) {
    if (!currentByKey.has(key)) {
      deletes.push(quad3);
    }
  }
  for (const [key, quad3] of currentByKey) {
    if (!originalByKey.has(key)) {
      inserts.push(quad3);
    }
  }
  return { inserts, deletes };
}
function quadKey2(quad3) {
  return [
    termKey2(quad3.subject),
    termKey2(quad3.predicate),
    termKey2(quad3.object),
    termKey2(quad3.graph)
  ].join(" ");
}
function termKey2(term) {
  if (!term) {
    return "";
  }
  if (term.termType == "Literal") {
    return [
      "Literal",
      term.value,
      term.language ?? "",
      term.datatype?.value ?? term.datatype?.id ?? ""
    ].join("\0");
  }
  return `${term.termType}\0${term.value ?? term.id ?? ""}`;
}
function solidPatchChanges2(original, current, factory) {
  const originalAnonymous = anonymousUnits2(original);
  const currentAnonymous = anonymousUnits2(current);
  const { deletedUnits, insertedUnits } = diffAnonymousUnits2(originalAnonymous.units, currentAnonymous.units);
  const anonymousDeletes = [];
  const anonymousInserts = [];
  const where = [];
  for (const unit of deletedUnits) {
    assertOwnedAnonymousUnit2(unit, "delete");
    const variableQuads = mapBlankNodes2(unit.quads, (name) => factory.variable(name), factory.quad, "old");
    where.push(...variableQuads);
    anonymousDeletes.push(...variableQuads);
  }
  for (const unit of insertedUnits) {
    assertOwnedAnonymousUnit2(unit, "insert");
    anonymousInserts.push(...mapBlankNodes2(unit.quads, (name) => factory.blankNode(name), factory.quad, "insert"));
  }
  const plainOriginal = original.filter((quad3) => !originalAnonymous.quadKeys.has(quadKey2(quad3)));
  const plainCurrent = current.filter((quad3) => !currentAnonymous.quadKeys.has(quadKey2(quad3)));
  const plainDiff = diffQuads2(plainOriginal, plainCurrent);
  assertPatchable2(plainDiff.inserts, "insert changes outside an owned anonymous value");
  assertPatchable2(plainDiff.deletes, "delete changes outside an owned anonymous value");
  return {
    where,
    deletes: [...plainDiff.deletes, ...anonymousDeletes],
    inserts: [...plainDiff.inserts, ...anonymousInserts]
  };
}
function anonymousUnits2(quads) {
  const outgoing = blankSubjectIndex2(quads);
  const incoming = blankObjectIndex2(quads);
  const units = [];
  const quadKeys = /* @__PURE__ */ new Set();
  for (const edge of quads) {
    if (!isBlankNode2(edge.object) || isBlankNode2(edge.subject)) {
      continue;
    }
    const closure = blankNodeClosure2(edge.object, outgoing);
    const canonical = canonicalBlankNode2(edge.object, outgoing);
    const unitQuads = [edge, ...closure.quads];
    for (const quad3 of unitQuads) {
      quadKeys.add(quadKey2(quad3));
    }
    units.push({
      edge,
      quads: unitQuads,
      blankNodeIds: closure.blankNodeIds,
      incoming,
      cyclic: closure.cyclic || canonical.cyclic,
      signature: [termKey2(edge.subject), termKey2(edge.predicate), canonical.key].join(" ")
    });
  }
  return { units, quadKeys };
}
function blankSubjectIndex2(quads) {
  const index = /* @__PURE__ */ new Map();
  for (const quad3 of quads) {
    if (!isBlankNode2(quad3.subject)) {
      continue;
    }
    const id2 = termValue2(quad3.subject);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad3);
  }
  return index;
}
function blankObjectIndex2(quads) {
  const index = /* @__PURE__ */ new Map();
  for (const quad3 of quads) {
    if (!isBlankNode2(quad3.object)) {
      continue;
    }
    const id2 = termValue2(quad3.object);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad3);
  }
  return index;
}
function blankNodeClosure2(root, outgoing) {
  const blankNodeIds = /* @__PURE__ */ new Set();
  const quads = [];
  const stack = [root];
  let cyclic = false;
  while (stack.length) {
    const term = stack.pop();
    const id2 = termValue2(term);
    if (blankNodeIds.has(id2)) {
      cyclic = true;
      continue;
    }
    blankNodeIds.add(id2);
    for (const quad3 of outgoing.get(id2) ?? []) {
      quads.push(quad3);
      if (isBlankNode2(quad3.object)) {
        stack.push(quad3.object);
      }
    }
  }
  return { quads, blankNodeIds, cyclic };
}
function canonicalBlankNode2(term, outgoing, memo = /* @__PURE__ */ new Map(), path2 = /* @__PURE__ */ new Set()) {
  const id2 = termValue2(term);
  if (memo.has(id2)) {
    return memo.get(id2);
  }
  if (path2.has(id2)) {
    return { key: "[cycle]", cyclic: true };
  }
  path2.add(id2);
  let cyclic = false;
  const properties = (outgoing.get(id2) ?? []).map((quad3) => {
    const object = canonicalTerm2(quad3.object, outgoing, memo, path2);
    cyclic ||= object.cyclic;
    return `${termKey2(quad3.predicate)} ${object.key}`;
  }).sort();
  path2.delete(id2);
  const result = {
    key: `BlankNode(${properties.join("|")})`,
    cyclic
  };
  memo.set(id2, result);
  return result;
}
function canonicalTerm2(term, outgoing, memo, path2) {
  if (isBlankNode2(term)) {
    return canonicalBlankNode2(term, outgoing, memo, path2);
  }
  return { key: termKey2(term), cyclic: false };
}
function diffAnonymousUnits2(original, current) {
  const originalBySignature = groupUnitsBySignature2(original);
  const currentBySignature = groupUnitsBySignature2(current);
  const signatures = /* @__PURE__ */ new Set([...originalBySignature.keys(), ...currentBySignature.keys()]);
  const deletedUnits = [];
  const insertedUnits = [];
  for (const signature of signatures) {
    const originalUnits = originalBySignature.get(signature) ?? [];
    const currentUnits = currentBySignature.get(signature) ?? [];
    const unchanged = Math.min(originalUnits.length, currentUnits.length);
    deletedUnits.push(...originalUnits.slice(unchanged));
    insertedUnits.push(...currentUnits.slice(unchanged));
  }
  return { deletedUnits, insertedUnits };
}
function groupUnitsBySignature2(units) {
  const grouped = /* @__PURE__ */ new Map();
  for (const unit of units) {
    if (!grouped.has(unit.signature)) {
      grouped.set(unit.signature, []);
    }
    grouped.get(unit.signature).push(unit);
  }
  return grouped;
}
function assertOwnedAnonymousUnit2(unit, operation) {
  if (unit.cyclic) {
    throw new Error(`Cannot generate a Solid PATCH to ${operation} a cyclic anonymous value; use graph.write() and PUT instead`);
  }
  for (const id2 of unit.blankNodeIds) {
    const incoming = unit.incoming.get(id2) ?? [];
    if (incoming.length != 1) {
      throw new Error(`Cannot generate a Solid PATCH to ${operation} a shared anonymous value; use graph.write() and PUT instead`);
    }
  }
}
function mapBlankNodes2(quads, createTerm, createQuad, prefix) {
  const terms = /* @__PURE__ */ new Map();
  const mapTerm = (term) => {
    if (!isBlankNode2(term)) {
      return term;
    }
    const id2 = termValue2(term);
    if (!terms.has(id2)) {
      terms.set(id2, createTerm(`${prefix}${terms.size}`));
    }
    return terms.get(id2);
  };
  return quads.map((quad3) => createQuad(mapTerm(quad3.subject), quad3.predicate, mapTerm(quad3.object), quad3.graph));
}
function assertPatchable2(quads, operation) {
  const hasBlankNode = quads.some(
    (quad3) => isBlankNode2(quad3.subject) || isBlankNode2(quad3.predicate) || isBlankNode2(quad3.object)
  );
  if (hasBlankNode) {
    throw new Error(`Cannot generate a Solid PATCH with blank nodes in ${operation}; use graph.write() and PUT instead`);
  }
}
function isBlankNode2(term) {
  return term?.termType == "BlankNode";
}
function termValue2(term) {
  return term?.value ?? term?.id ?? "";
}
function serializePatch2(source, inserts, deletes, where = []) {
  const prefixes4 = {
    ...source.prefixDeclarations("source")
  };
  if (quadsUseNamespace2([...where, ...deletes, ...inserts], rdfNamespace2)) {
    prefixes4.rdf ??= rdfNamespace2;
  }
  prefixes4.solid = solidNamespace2;
  const writer = new N3Writer2({
    format: "text/turtle",
    prefixes: prefixes4
  });
  const lines = [];
  for (const [prefix, iri] of Object.entries(prefixes4)) {
    lines.push(`@prefix ${prefix}: <${iri}> .`);
  }
  if (lines.length) {
    lines.push("");
  }
  const predicates = [];
  if (where.length) {
    predicates.push(`solid:where ${formula2(writer, where)}`);
  }
  if (deletes.length) {
    predicates.push(`solid:deletes ${formula2(writer, deletes)}`);
  }
  if (inserts.length) {
    predicates.push(`solid:inserts ${formula2(writer, inserts)}`);
  }
  let patch = `_:patch a solid:InsertDeletePatch`;
  if (predicates.length) {
    patch += ";\n	" + predicates.join(";\n	");
  }
  lines.push(`${patch} .`);
  return lines.join("\n") + "\n";
}
function quadsUseNamespace2(quads, namespace) {
  return quads.some(
    (quad3) => termUsesNamespace2(quad3.subject, namespace) || termUsesNamespace2(quad3.predicate, namespace) || termUsesNamespace2(quad3.object, namespace)
  );
}
function termUsesNamespace2(term, namespace) {
  return term?.termType == "NamedNode" && termValue2(term).startsWith(namespace);
}
function formula2(writer, quads) {
  if (!quads.length) {
    return "{}";
  }
  const lines = quads.map((quad3) => `
		${writer.quadToString(quad3.subject, quad3.predicate, quad3.object).trim()}`);
  return `{${lines.join("")}
	}`;
}

// node_modules/@muze-nl/oldm/src/index.mjs
var { default: _coreDefault2, ...core2 } = oldm_exports2;
var oldm4 = {
  context(options = {}) {
    const {
      parser = n3Parser2,
      writer = n3Writer2,
      patchWriter = n3PatchWriter2,
      ...contextOptions
    } = options;
    return oldm3({
      ...contextOptions,
      parser,
      writer,
      patchWriter
    });
  },
  ...core2,
  ...oldm_n3_exports2
};
globalThis.oldm = oldm4;
var src_default7 = oldm4;

// src/storage/solid-resource-store.js
var DEFAULT_ACCEPT = "text/turtle, application/ld+json;q=0.9, application/json;q=0.2";
var DEFAULT_CONTENT_TYPE = "text/turtle";
var DEFAULT_FORMAT = "margin-notes-oldmed-graph";
var DEFAULT_VERSION = 1;
var NODE_PREDICATES = /* @__PURE__ */ new Set([
  "oa$hasBody",
  "oa$hasTarget",
  "oa$hasSource",
  "oa$hasSelector",
  "schema$about"
]);
var INLINE_PREDICATES = /* @__PURE__ */ new Set([
  "oa$hasBody",
  "oa$hasTarget",
  "oa$hasSelector"
]);
function createSolidResourceStore(options = {}) {
  assertOptions(options);
  const defaultResourceUrl = options.resourceUrl || "";
  const accept = options.accept || DEFAULT_ACCEPT;
  const contentType = options.contentType || DEFAULT_CONTENT_TYPE;
  const providedSolid = options.solid || options.lading || null;
  const generatedClient = {
    clients: /* @__PURE__ */ new Map()
  };
  function solidFor(resourceUrl, requestOptions2 = {}) {
    return solidClientFor({ options, providedSolid, resourceUrl, generatedClient, requestOptions: requestOptions2 });
  }
  return {
    name: "solidResourceStore",
    async load({ key } = {}) {
      const resourceUrl = resourceUrlFrom({ key, defaultResourceUrl });
      const solid = solidFor(resourceUrl);
      const response3 = await callResource(() => solid.resource(resourceUrl).get({ accept }));
      if (isMissing(response3)) return null;
      await ensureOk({ response: response3, operation: "load" });
      if (isOldmGraph(response3?.data)) {
        return storageDocumentFromGraph({ graph: response3.data, resourceUrl });
      }
      if (isStorageDocument(response3?.data)) {
        return response3.data;
      }
      const text = await responseText(response3);
      if (!text.trim()) return null;
      if (isLinkedDataResponse(response3)) {
        return storageDocumentFromGraph({
          graph: oldmContext({ resourceUrl }).parse(text, resourceUrl, responseContentType(response3) || DEFAULT_CONTENT_TYPE),
          resourceUrl
        });
      }
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error4) {
        throw new Error(`Solid resource load returned invalid linked data or JSON from ${resourceUrl}: ${error4.message}`);
      }
      if (!isStorageDocument(parsed) && !Array.isArray(parsed)) {
        throw new Error(`Solid resource load returned JSON that is not a notes document from ${resourceUrl}`);
      }
      return parsed;
    },
    async save({ key, value } = {}) {
      const resourceUrl = resourceUrlFrom({ key, defaultResourceUrl });
      const solid = solidFor(resourceUrl, { writesBody: true });
      const graph2 = graphFromStorageDocument({ document: value, resourceUrl });
      const response3 = await callResource(() => solid.resource(resourceUrl).put(
        graph2,
        { contentType }
      ));
      await ensureOk({ response: response3, operation: "save" });
      return {
        key: resourceUrl,
        resourceUrl,
        status: response3.status
      };
    },
    async remove({ key } = {}) {
      const resourceUrl = resourceUrlFrom({ key, defaultResourceUrl });
      const solid = solidFor(resourceUrl, { needsAuthorization: true });
      const response3 = await callResource(() => solid.resource(resourceUrl).delete());
      if (isMissing(response3) || response3.status === 410) {
        return {
          key: resourceUrl,
          resourceUrl,
          status: response3.status
        };
      }
      await ensureOk({ response: response3, operation: "remove" });
      return {
        key: resourceUrl,
        resourceUrl,
        status: response3.status
      };
    }
  };
}
function assertOptions(options) {
  const optionIssues = issues(options, {
    resourceUrl: Optional(String),
    rootUrl: Optional(String),
    storageUrl: Optional(String),
    accept: Optional(String),
    contentType: Optional(String),
    force_authorization: Optional(Boolean),
    forceAuthorizationForWrites: Optional(Boolean)
  });
  if (optionIssues) {
    throw new TypeError(`Invalid Solid resource store options: ${optionIssues[0].pathString} ${optionIssues[0].message}`);
  }
}
function oldmContext({ resourceUrl, prefixes: prefixes4 = {} }) {
  return src_default7.context({
    defaultGraph: resourceUrl,
    prefixes: annotationPrefixes(prefixes4)
  });
}
function annotationPrefixes(prefixes4 = {}) {
  return {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    dcterms: "http://purl.org/dc/terms/",
    oa: "http://www.w3.org/ns/oa#",
    schema: "https://schema.org/",
    cobalt: "https://vocab.muze.nl/cobalt#",
    ...prefixes4
  };
}
function graphFromStorageDocument({ document: document2, resourceUrl }) {
  const storageDocument = isStorageDocument(document2) ? document2 : { subjects: [] };
  const context = oldmContext({
    resourceUrl,
    prefixes: storageDocument.prefixes
  });
  const graph2 = context.parse("", resourceUrl, DEFAULT_CONTENT_TYPE);
  for (const subject of storageDocument.subjects) {
    writeSubjectToGraph({ graph: graph2, subject });
  }
  return graph2;
}
function writeSubjectToGraph({ graph: graph2, subject }) {
  if (!subject?.id) return null;
  for (const [predicate, value] of Object.entries(subject)) {
    if (predicate === "id") continue;
    if (predicate === "rdf$type") {
      graph2.set(subject.id, "rdf$type", value);
      continue;
    }
    graph2.set(subject.id, predicate, graphValueFromStorageValue({ graph: graph2, predicate, value }));
  }
  return subject.id;
}
function graphValueFromStorageValue({ graph: graph2, predicate, value }) {
  if (Array.isArray(value)) {
    return value.map((item) => graphValueFromStorageValue({ graph: graph2, predicate, value: item }));
  }
  if (value && typeof value === "object") {
    if (predicate === "cobalt$fragment") {
      return JSON.stringify(value);
    }
    if (value.id) {
      writeSubjectToGraph({ graph: graph2, subject: value });
      return value.id;
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string" && !NODE_PREDICATES.has(predicate)) {
    return new String(value);
  }
  return value;
}
function storageDocumentFromGraph({ graph: graph2, resourceUrl }) {
  const subjects = graphSubjects(graph2).filter((subject) => values4(subject.a).includes("oa$Annotation") || values4(subject.rdf$type).includes("oa$Annotation")).map((subject) => repairConventionalAnnotationParts({
    graph: graph2,
    annotation: storageSubjectFromOldmSubject({ graph: graph2, subject })
  }));
  return {
    format: DEFAULT_FORMAT,
    version: DEFAULT_VERSION,
    prefixes: annotationPrefixes(graph2?.prefixes ?? graph2?.context?.prefixes),
    resourceUrl,
    subjects
  };
}
function repairConventionalAnnotationParts({ graph: graph2, annotation }) {
  if (!annotation?.id) return annotation;
  const body = annotation.oa$hasBody || conventionalSubject({
    graph: graph2,
    subjectId: annotation.id,
    suffixes: ["#body", "-body"],
    types: ["oa$TextualBody", "cobalt$Fragment"]
  });
  if (body) {
    annotation.oa$hasBody = body;
  }
  const target = annotation.oa$hasTarget || conventionalSubject({
    graph: graph2,
    subjectId: annotation.id,
    suffixes: ["#target", "-target"],
    types: ["oa$SpecificResource"]
  });
  if (target) {
    target.oa$hasSelector = target.oa$hasSelector || conventionalSubject({
      graph: graph2,
      subjectId: annotation.id,
      suffixes: ["#selector-fragment", "-selector", "#selector"],
      types: ["oa$FragmentSelector"]
    });
    annotation.oa$hasTarget = target;
  }
  return annotation;
}
function conventionalSubject({ graph: graph2, subjectId, suffixes, types }) {
  const subject = suffixes.map((suffix) => graph2?.subjects?.[`${subjectId}${suffix}`]).find((candidate) => candidate && values4(candidate.a).some((type) => types.includes(type)));
  if (!subject) return null;
  return storageSubjectFromOldmSubject({ graph: graph2, subject });
}
function storageSubjectFromOldmSubject({ graph: graph2, subject, seen = /* @__PURE__ */ new Set() }) {
  if (!subject || seen.has(subject.id)) {
    return subject?.id;
  }
  seen.add(subject.id);
  const result = {};
  for (const [predicate, value] of Object.entries(subject)) {
    if (predicate === "graph") continue;
    if (predicate === "a") {
      result.rdf$type = storageValueFromOldmValue({ graph: graph2, predicate, value, seen });
      continue;
    }
    result[predicate] = storageValueFromOldmValue({ graph: graph2, predicate, value, seen });
  }
  return result;
}
function storageValueFromOldmValue({ graph: graph2, predicate, value, seen }) {
  if (Array.isArray(value)) {
    return value.map((item) => storageValueFromOldmValue({ graph: graph2, predicate, value: item, seen }));
  }
  if (isOldmNamedNode(value)) {
    const linkedSubject = graph2?.subjects?.[value.id];
    if (linkedSubject && INLINE_PREDICATES.has(predicate)) {
      return storageSubjectFromOldmSubject({ graph: graph2, subject: linkedSubject, seen });
    }
    return value.id;
  }
  if (value instanceof String) {
    return storageLiteralValue({ predicate, value: value.toString() });
  }
  if (value && typeof value === "object") {
    return storageSubjectFromOldmSubject({ graph: graph2, subject: value, seen });
  }
  return storageLiteralValue({ predicate, value });
}
function storageLiteralValue({ predicate, value }) {
  if (predicate === "cobalt$fragment" && typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { text: value, annotations: [] };
    }
  }
  return value;
}
function graphSubjects(graph2) {
  if (Array.isArray(graph2?.data)) {
    return graph2.data;
  }
  if (Array.isArray(graph2?.subjects)) {
    return graph2.subjects;
  }
  if (graph2?.subjects && typeof graph2.subjects === "object") {
    return Object.values(graph2.subjects);
  }
  return [];
}
function resourceUrlFrom({ key, defaultResourceUrl }) {
  const resourceUrl = defaultResourceUrl || key;
  if (issues(resourceUrl, String)) {
    throw new Error("Solid resource store requires a resourceUrl option or key");
  }
  return resourceUrl;
}
function solidClientFor({ options, providedSolid, resourceUrl, generatedClient, requestOptions: requestOptions2 = {} }) {
  if (providedSolid) {
    assertSolidClient(providedSolid);
    return providedSolid;
  }
  const rootUrl = options.rootUrl || options.storageUrl || resourceUrl;
  const forceAuthorization = forceAuthorizationForRequest({ options, requestOptions: requestOptions2 });
  const cacheKey = `${rootUrl}
force:${forceAuthorization}`;
  if (generatedClient.clients.has(cacheKey)) {
    return generatedClient.clients.get(cacheKey);
  }
  const metroClient = createSolidMetroClient(rootUrl, {
    ...options,
    oidc: options.oidc ?? Boolean(options.issuer),
    force_authorization: forceAuthorization,
    configureMetro: options.configureMetro ?? true
  });
  const solid = lading(metroClient, {
    thrower: options.thrower ?? false
  });
  generatedClient.clients.set(cacheKey, solid);
  return solid;
}
function forceAuthorizationForRequest({ options, requestOptions: requestOptions2 }) {
  if (options.force_authorization !== void 0) {
    return options.force_authorization;
  }
  if (requestOptions2.writesBody || requestOptions2.needsAuthorization) {
    return Boolean(options.forceAuthorizationForWrites);
  }
  return false;
}
function assertSolidClient(solid) {
  const clientIssues = issues(solid, {
    resource: callable
  });
  if (clientIssues) {
    throw new TypeError("Solid resource store requires a Lading-style client with resource(url)");
  }
}
function callable(value, _root, path2) {
  if (typeof value !== "function") {
    return error("data is not a function", value, "function", path2);
  }
  return false;
}
async function callResource(operation) {
  try {
    return await operation();
  } catch (error4) {
    if (isMissing(error4?.cause)) {
      return error4.cause;
    }
    throw error4;
  }
}
function isMissing(response3) {
  return response3?.status === 404;
}
function isStorageDocument(value) {
  return Boolean(value && typeof value === "object" && Array.isArray(value.subjects));
}
function isOldmGraph(value) {
  return Boolean(value && typeof value === "object" && typeof value.write === "function" && value.subjects);
}
function isOldmNamedNode(value) {
  return Boolean(value && typeof value === "object" && typeof value.id === "string" && value.graph);
}
function values4(value) {
  if (value === void 0 || value === null) return [];
  return Array.isArray(value) ? value : [value];
}
function isLinkedDataResponse(response3) {
  return /^text\/turtle\b|^application\/ld\+json\b|^application\/n-quads\b|^application\/trig\b/.test(responseContentType(response3));
}
function responseContentType(response3) {
  return response3?.headers?.get?.("Content-Type") || response3?.headers?.get?.("content-type") || "";
}
async function ensureOk({ response: response3, operation }) {
  if (response3.ok) return;
  const body = await responseText(response3).catch(() => "");
  const detail = body.trim() ? `: ${body.trim()}` : "";
  throw new Error(`Solid resource ${operation} failed (${response3.status} ${response3.statusText})${detail}`);
}
async function responseText(response3) {
  if (typeof response3?.text === "function") {
    return response3.text();
  }
  if (typeof response3?.data === "string") {
    return response3.data;
  }
  return "";
}

// src/storage/solid-notes-location.js
var DEFAULT_ROOT_FOLDER_NAME = "margin-notes";
var DEFAULT_PREFERENCES_FILENAME = "preferences.ttl";
var DEFAULT_CLIENT_NAME = "Margin Notes";
var LINKED_DATA_ACCEPT2 = "text/turtle, application/ld+json;q=0.9, */*;q=0.1";
var TURTLE = "text/turtle";
var SPARQL_UPDATE = "application/sparql-update";
var PREFERENCES_SUBJECT = "#margin-notes";
var prefixes3 = {
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  pim: "http://www.w3.org/ns/pim/space#",
  solid: "http://www.w3.org/ns/solid/terms#",
  ldp: "http://www.w3.org/ns/ldp#",
  mn: "https://vocab.muze.nl/margin-notes#"
};
async function createSolidNotesConnection(options = {}) {
  assertConnectionOptions(options);
  const webId = normalizeUrl(options.webId, "WebID");
  const pageUrl = currentPageUrl(options.pageUrl);
  const discoverySolid = options.discoverySolid || options.solid || createDiscoverySolid({ webId, options });
  const profile = await discoverySolid.discoverWebId(webId);
  const storageUrl = firstValue(profile?.storage);
  if (!storageUrl) {
    throw new Error(`No Solid storage root found in WebID profile: ${webId}`);
  }
  const issuer = profile?.issuer || firstId(profile?.profile?.solid$oidcIssuer);
  const preferences = preferencesUrlForProfile({
    profile: profile?.profile,
    storageUrl,
    options
  });
  const solid = options.solid || createStorageSolid({
    issuer,
    rootUrl: storageUrl,
    options: storageOptions({ options, pageUrl })
  });
  const rootFolderUrl = await marginNotesRootFolder({
    solid,
    preferencesUrl: preferences.url,
    storageUrl,
    rootFolderName: options.rootFolderName || DEFAULT_ROOT_FOLDER_NAME
  });
  const notesResourceUrl = await notesResourceUrlForPage({
    rootFolderUrl,
    pageUrl
  });
  const store = createSolidResourceStore({
    ...storageOptions({ options, pageUrl }),
    resourceUrl: notesResourceUrl,
    rootUrl: storageUrl,
    issuer,
    solid: options.solidForStore || options.solid || void 0
  });
  return {
    webId,
    profile,
    issuer,
    storageUrl,
    preferencesUrl: preferences.url,
    preferencesUrlSource: preferences.source,
    rootFolderUrl,
    pageUrl,
    resourceUrl: notesResourceUrl,
    store
  };
}
function preferencesUrlForProfile({ profile, storageUrl, options }) {
  if (options.preferencesUrl) {
    return {
      url: normalizeUrl(options.preferencesUrl, "preferencesUrl"),
      source: "configured"
    };
  }
  const profilePreferencesUrl = firstId(profile?.pim$preferencesFile);
  if (profilePreferencesUrl) {
    return {
      url: profilePreferencesUrl,
      source: "profile"
    };
  }
  return {
    url: new URL(options.preferencesFilename || DEFAULT_PREFERENCES_FILENAME, ensureSlash2(storageUrl)).href,
    source: "default"
  };
}
async function notesResourceUrlForPage({ rootFolderUrl, pageUrl } = {}) {
  const root = ensureSlash2(normalizeUrl(rootFolderUrl, "rootFolderUrl"));
  const page = currentPageUrl(pageUrl);
  return new URL(`page-${await sha256Hex(page)}.ttl`, root).href;
}
async function marginNotesRootFolder({ solid, preferencesUrl, storageUrl, rootFolderName }) {
  const existing = await loadMarginNotesRootFolder({ solid, preferencesUrl });
  if (existing) return ensureSlash2(existing);
  const rootFolderUrl = new URL(`${encodePathSegment(rootFolderName)}/`, ensureSlash2(storageUrl)).href;
  await saveDefaultMarginNotesRootFolder({ solid, preferencesUrl, rootFolderUrl });
  await ensureRootFolder({ solid, rootFolderUrl });
  return rootFolderUrl;
}
async function loadMarginNotesRootFolder({ solid, preferencesUrl }) {
  const response3 = await solid.resource(preferencesUrl).get({ accept: LINKED_DATA_ACCEPT2 });
  if (response3?.status === 404) return "";
  await ensureOk2({ response: response3, operation: "read preferences" });
  const graph2 = await graphFromResponse({ response: response3, resourceUrl: preferencesUrl });
  const subject = graphSubjects2(graph2).find((subject2) => firstId(subject2.mn$rootFolder));
  return firstId(subject?.mn$rootFolder);
}
async function saveDefaultMarginNotesRootFolder({ solid, preferencesUrl, rootFolderUrl }) {
  const exists = await resourceExists({ solid, resourceUrl: preferencesUrl });
  if (!exists) {
    const response4 = await solid.resource(preferencesUrl).put(preferencesTurtle({ preferencesUrl, rootFolderUrl }), {
      contentType: TURTLE
    });
    await ensureOk2({ response: response4, operation: "create preferences" });
    return;
  }
  const response3 = await solid.resource(preferencesUrl).patch(preferencesPatch({ preferencesUrl, rootFolderUrl }), {
    contentType: SPARQL_UPDATE
  });
  await ensureOk2({ response: response3, operation: "update preferences" });
}
async function ensureRootFolder({ solid, rootFolderUrl }) {
  if (typeof solid.container !== "function") return;
  const response3 = await solid.container(rootFolderUrl).create();
  if (response3?.ok || [200, 201, 204, 205, 409, 412].includes(response3?.status)) return;
  await ensureOk2({ response: response3, operation: "create margin-notes folder" });
}
async function resourceExists({ solid, resourceUrl }) {
  const response3 = typeof solid.resource(resourceUrl).head === "function" ? await solid.resource(resourceUrl).head() : await solid.resource(resourceUrl).get({ accept: LINKED_DATA_ACCEPT2 });
  if (response3?.status === 404) return false;
  await ensureOk2({ response: response3, operation: "check preferences" });
  return true;
}
async function graphFromResponse({ response: response3, resourceUrl }) {
  if (response3?.data?.subjects || response3?.data?.primary) {
    return response3.data;
  }
  return src_default7.context({
    defaultGraph: resourceUrl,
    prefixes: prefixes3
  }).parse(await responseText2(response3), resourceUrl, responseContentType2(response3) || TURTLE);
}
function graphSubjects2(graph2) {
  if (Array.isArray(graph2?.data)) return graph2.data;
  if (Array.isArray(graph2?.subjects)) return graph2.subjects;
  if (graph2?.subjects && typeof graph2.subjects === "object") return Object.values(graph2.subjects);
  if (graph2?.primary) return [graph2.primary];
  return [];
}
async function responseText2(response3) {
  if (typeof response3?.text === "function") return response3.text();
  if (typeof response3?.data === "string") return response3.data;
  return "";
}
function responseContentType2(response3) {
  return response3?.headers?.get?.("Content-Type") || response3?.headers?.get?.("content-type") || "";
}
function preferencesTurtle({ preferencesUrl, rootFolderUrl }) {
  return `@prefix mn: <${prefixes3.mn}>.

<${preferencesSubject(preferencesUrl)}> a mn:Preferences;
  mn:rootFolder <${rootFolderUrl}>.
`;
}
function preferencesPatch({ preferencesUrl, rootFolderUrl }) {
  return `PREFIX mn: <${prefixes3.mn}>
INSERT DATA { <${preferencesSubject(preferencesUrl)}> a mn:Preferences; mn:rootFolder <${rootFolderUrl}>. }`;
}
function preferencesSubject(preferencesUrl) {
  return new URL(PREFERENCES_SUBJECT, preferencesUrl).href;
}
function createDiscoverySolid({ webId, options }) {
  const metroClient = createSolidMetroClient(webId, {
    ...storageOptions({ options, pageUrl: currentPageUrl(options.pageUrl) }),
    oidc: false,
    configureMetro: true
  });
  return lading(metroClient, { thrower: false });
}
function createStorageSolid({ issuer, rootUrl, options }) {
  const metroClient = createSolidMetroClient(rootUrl, {
    ...options,
    issuer,
    oidc: Boolean(issuer),
    configureMetro: true
  });
  return lading(metroClient, { thrower: false });
}
function storageOptions({ options, pageUrl }) {
  const redirectUri = options.callbackUrl || pageUrl;
  const solidOptions = { ...options.solidOptions || {} };
  if (solidOptions.authorize_callback === void 0 && options.authorize_callback === void 0 && options.usePopupAuth !== false) {
    solidOptions.authorize_callback = authorizePopup;
  }
  const authorizeCallback = options.authorize_callback || solidOptions.authorize_callback;
  if (solidOptions.forceAuthorizationForWrites === void 0 && options.forceAuthorizationForWrites === void 0 && authorizeCallback) {
    solidOptions.forceAuthorizationForWrites = true;
  }
  return {
    ...solidOptions,
    ...options.authorize_callback ? { authorize_callback: options.authorize_callback } : {},
    ...options.force_authorization !== void 0 ? { force_authorization: options.force_authorization } : {},
    ...options.forceAuthorizationForWrites !== void 0 ? { forceAuthorizationForWrites: options.forceAuthorizationForWrites } : {},
    client_info: {
      client_name: options.clientName || DEFAULT_CLIENT_NAME,
      redirect_uris: [redirectUri],
      ...options.client_info || {}
    }
  };
}
function assertConnectionOptions(options) {
  const optionIssues = issues(options, {
    webId: Required(String),
    pageUrl: Optional(String),
    callbackUrl: Optional(String),
    preferencesUrl: Optional(String),
    preferencesFilename: Optional(String),
    rootFolderName: Optional(String),
    clientName: Optional(String),
    usePopupAuth: Optional(Boolean),
    authorize_callback: Optional(callable2),
    force_authorization: Optional(Boolean),
    forceAuthorizationForWrites: Optional(Boolean),
    client_info: Optional(Object),
    solidOptions: Optional(Object)
  });
  if (optionIssues) {
    throw new TypeError(`Invalid Solid notes connection options: ${optionIssues[0].pathString} ${optionIssues[0].message}`);
  }
}
function callable2(value, _root, path2) {
  if (typeof value !== "function") {
    return error("data is not a function", value, "function", path2);
  }
  return false;
}
function normalizeUrl(value, name) {
  try {
    return new URL(value).href;
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}
function currentPageUrl(value) {
  const href = value || globalThis.location?.href || "";
  const url3 = new URL(href);
  url3.hash = "";
  return url3.href;
}
function ensureSlash2(url3) {
  return String(url3).endsWith("/") ? String(url3) : `${url3}/`;
}
function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}
function firstId(value) {
  const item = firstValue(value);
  return typeof item === "string" ? item : item?.id || "";
}
function encodePathSegment(value) {
  return String(value).split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return fallbackHash(value);
}
function fallbackHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
async function ensureOk2({ response: response3, operation }) {
  if (response3?.ok) return;
  const detail = (await responseText2(response3)).trim();
  const suffix = detail ? `: ${detail}` : "";
  throw new Error(`Solid ${operation} failed (${response3?.status || "unknown"} ${response3?.statusText || ""})${suffix}`);
}

// src/features/paragraph-note-stacks.js
var paragraphNoteStacks = {
  templates: {
    "margin-notes": root_default,
    "margin-notes-anchor-widget": anchor_widget_default,
    "margin-notes-inline-note": inline_note_default,
    "margin-notes-solid-connection": control_default
  },
  styles: {
    "margin-notes-design-system": design_system_default,
    "margin-notes-ui": ui_default,
    "margin-notes-solid-connection": ui_default2,
    "margin-notes-cobalt-editor": cobalt_editor_modal_default2
  },
  actions: {
    async setupParagraphNoteStacks({ anchors, storeKey }) {
      const notesApi = this.api.notes;
      this.data.marginNotes.storeKey = storeKey;
      await this.actions.setTheme({
        theme: this.data.marginNotes.theme
      });
      await this.actions.installAnchorAffordances({ anchors });
      this.data.marginNotes.graph = await notesApi.loadGraph({
        app: this,
        key: storeKey
      });
      const notesByAnchor = notesApi.groupNotesByAnchor({
        notes: this.data.marginNotes.graph
      });
      const anchorState = anchors.map((anchor2) => {
        const notes = notesByAnchor[anchor2.id] || [];
        return {
          id: anchor2.id,
          label: notesApi.anchorLabel({ anchor: anchor2 }),
          notes,
          visibleNotes: [],
          noteCount: notes.length,
          overflowLabel: "",
          hasOverflow: false,
          expanded: false
        };
      });
      this.data.marginNotes.anchors = anchorState;
      this.data.marginNotes.anchorViews = Array.from(anchorState, (anchor2) => [anchor2]);
      for (const anchor2 of this.data.marginNotes.anchors) {
        await this.actions.renderAnchorNotes({ anchor: anchor2 });
      }
    },
    async destroyParagraphNoteStacks() {
      const notesApi = this.api.notes;
      this.marginNotesRuntime.resizeObserver?.disconnect();
      this.marginNotesRuntime.resizeObserver = null;
      for (const timer of this.marginNotesRuntime.syncTimers.values()) {
        clearTimeout(timer);
      }
      this.marginNotesRuntime.syncTimers.clear();
      await this.actions.removeAnchorAffordances({});
      notesApi.removeInstalledViewAssets({ app: this });
      notesApi.restoreTheme({ app: this });
      this.marginNotesRuntime.mountContainer?.replaceChildren();
    },
    async setupSolidConnection({ config }) {
      if (!config) return;
      const notesApi = this.api.notes;
      const container = notesApi.hostElement(config.container);
      if (!container) return;
      container.innerHTML = notesApi.templates.solidConnection;
      const element2 = container.querySelector("[data-margin-notes-solid-connection]");
      const input2 = container.querySelector("[data-margin-notes-solid-webid]");
      if (!element2 || !input2) return;
      const rememberedConnection = notesApi.loadRememberedSolidConnection({ app: this });
      const initialWebId = config.webId || rememberedConnection?.webId || "";
      input2.value = initialWebId;
      notesApi.setSolidConnectionStatus({
        app: this,
        status: "idle",
        webId: initialWebId,
        message: rememberedConnection ? "Reconnecting..." : "Not connected"
      });
      notesApi.renderSolidConnectionStatus({ app: this });
      const onSubmit = (event) => {
        event.preventDefault();
        void this.actions.connectSolidStorage({
          webId: input2.value
        });
      };
      element2.addEventListener("submit", onSubmit);
      this.marginNotesRuntime.solidConnectionElement = element2;
      this.marginNotesRuntime.solidConnectionCleanup = () => {
        element2.removeEventListener("submit", onSubmit);
        container.replaceChildren();
      };
      if (rememberedConnection && config.autoConnect !== false) {
        void this.actions.connectSolidStorage({
          webId: initialWebId
        });
      }
    },
    async destroySolidConnection() {
      this.marginNotesRuntime.solidConnectionCleanup?.();
      this.marginNotesRuntime.solidConnectionCleanup = null;
      this.marginNotesRuntime.solidConnectionElement = null;
    },
    async setTheme({ theme }) {
      const notesApi = this.api.notes;
      const normalizedTheme = notesApi.normalizeTheme({ theme });
      this.data.marginNotes.theme = normalizedTheme;
      notesApi.applyTheme({
        app: this,
        theme: normalizedTheme
      });
      return normalizedTheme;
    },
    async createNote({ anchorId }) {
      const notesApi = this.api.notes;
      const anchor2 = notesApi.findAnchor({ app: this, anchorId });
      if (!anchor2) return;
      const modal = new notesApi.CobaltEditorModal({
        title: "New note",
        initialFragment: { text: "", annotations: [] }
      });
      const fragment = await modal.show();
      if (!fragment) return;
      const annotation = notesApi.createAnnotationNote({ anchorId, fragment });
      this.data.marginNotes.graph.push(annotation);
      anchor2.notes.push(notesApi.toRenderableNote({ annotation }));
      await this.actions.updateAnchorNoteState({ anchor: anchor2 });
      await this.actions.renderAnchorNotes({ anchor: anchor2 });
      await this.actions.saveNotes({});
    },
    async updateNote({ noteId }) {
      const notesApi = this.api.notes;
      const match = notesApi.findNote({ app: this, noteId });
      if (!match) return;
      const modal = new notesApi.CobaltEditorModal({
        title: "Edit note",
        initialFragment: match.note.body
      });
      const fragment = await modal.show();
      if (!fragment) return;
      notesApi.updateAnnotationBody({
        annotation: match.note.annotation,
        fragment
      });
      notesApi.syncRenderableNote({ note: match.note });
      await this.actions.renderAnchorNotes({ anchor: match.anchor });
      await this.actions.saveNotes({});
    },
    async deleteNote({ noteId }) {
      const notesApi = this.api.notes;
      const match = notesApi.findNote({ app: this, noteId });
      if (!match) return;
      match.anchor.notes.splice(match.index, 1);
      notesApi.removeAnnotationFromGraph({
        app: this,
        annotationId: match.note.id
      });
      await this.actions.updateAnchorNoteState({ anchor: match.anchor });
      await this.actions.renderAnchorNotes({ anchor: match.anchor });
      await this.actions.saveNotes({});
    },
    async saveNotes() {
      const notesApi = this.api.notes;
      await notesApi.saveGraph({
        app: this,
        key: this.data.marginNotes.storeKey,
        subjects: this.data.marginNotes.graph
      });
    },
    async connectSolidStorage({ webId }) {
      const notesApi = this.api.notes;
      const config = this.marginNotesRuntime.solidConnectionConfig || {};
      const localGraph = this.data.marginNotes.graph || [];
      try {
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "connecting",
          webId,
          message: "Resolving Solid storage..."
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        const connection = await notesApi.createSolidNotesConnection({
          ...config,
          ...notesApi.prepareSolidAuthorization({ config }),
          webId
        });
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "connecting",
          webId: connection.webId,
          storageUrl: connection.storageUrl,
          resourceUrl: connection.resourceUrl,
          message: "Syncing local notes..."
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        const solidGraph = await notesApi.loadGraphFromStore({
          store: connection.store,
          key: connection.resourceUrl,
          throwOnError: true
        });
        const merged = notesApi.mergeAnnotationGraphs({
          storedNotes: solidGraph,
          incomingNotes: localGraph
        });
        if (merged.changed) {
          await notesApi.saveGraphToStore({
            store: connection.store,
            key: connection.resourceUrl,
            subjects: merged.graph,
            throwOnError: true
          });
        }
        this.marginNotesRuntime.store = connection.store;
        this.data.marginNotes.storeKey = connection.resourceUrl;
        this.marginNotesRuntime.solidConnection = connection;
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "connected",
          webId: connection.webId,
          storageUrl: connection.storageUrl,
          resourceUrl: connection.resourceUrl,
          message: `Connected to ${connection.storageUrl}`
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        await this.actions.replaceNotesGraph({ graph: merged.graph });
        notesApi.rememberSolidConnection({
          app: this,
          connection
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        return connection;
      } catch (error4) {
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "error",
          webId,
          message: error4.message
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        throw error4;
      }
    },
    async reloadNotesFromStore() {
      const notesApi = this.api.notes;
      const graph2 = await notesApi.loadGraph({
        app: this,
        key: this.data.marginNotes.storeKey,
        throwOnError: true
      });
      await this.actions.replaceNotesGraph({ graph: graph2 });
    },
    async replaceNotesGraph({ graph: graph2 }) {
      const notesApi = this.api.notes;
      this.data.marginNotes.graph = graph2;
      const notesByAnchor = notesApi.groupNotesByAnchor({
        notes: graph2
      });
      for (const anchor2 of this.data.marginNotes.anchors) {
        anchor2.notes = notesByAnchor[anchor2.id] || [];
        anchor2.visibleNotes = [];
        anchor2.noteCount = anchor2.notes.length;
        anchor2.overflowLabel = "";
        anchor2.hasOverflow = false;
        anchor2.expanded = false;
        await this.actions.renderAnchorNotes({ anchor: anchor2 });
      }
    },
    async installAnchorAffordances({ anchors }) {
      const notesApi = this.api.notes;
      await this.actions.removeAnchorAffordances({});
      this.marginNotesRuntime.resizeObserver?.disconnect();
      this.marginNotesRuntime.resizeObserver = notesApi.createResizeObserver({ app: this });
      anchors.forEach((anchor2, index) => {
        if (!notesApi.isValidHostAnchor({ anchor: anchor2 })) {
          return;
        }
        const widget = document.createElement("span");
        widget.className = "margin-notes-anchor-widget-host";
        widget.dataset.marginNotesAnchor = anchor2.id;
        widget.setAttribute("data-simply-list", `marginNotes.anchorViews.${index}`);
        widget.innerHTML = '<template rel="margin-notes-anchor-widget"></template>';
        const hadTabIndex = anchor2.element.hasAttribute("tabindex");
        const previousTabIndex = anchor2.element.getAttribute("tabindex");
        const hadTargetAttribute = anchor2.element.hasAttribute("data-margin-notes-target");
        const previousTargetAttribute = anchor2.element.getAttribute("data-margin-notes-target");
        anchor2.element.dataset.marginNotesTarget = anchor2.id;
        if (!hadTabIndex && !notesApi.isNaturallyFocusable({ element: anchor2.element })) {
          anchor2.element.tabIndex = 0;
          anchor2.element.classList.add("margin-notes-target-tabstop");
        }
        const slot = notesApi.anchorSlot({ anchor: anchor2 });
        slot.appendChild(widget);
        this.marginNotesRuntime.anchorAffordances.push({
          element: anchor2.element,
          slot,
          widget,
          anchorId: anchor2.id,
          expanded: false,
          hasOverflow: false,
          hadTabIndex,
          previousTabIndex,
          hadTargetAttribute,
          previousTargetAttribute
        });
        this.marginNotesRuntime.resizeObserver?.observe(anchor2.element);
      });
    },
    async removeAnchorAffordances() {
      for (const affordance of this.marginNotesRuntime.anchorAffordances) {
        affordance.widget.remove();
        affordance.element.classList.remove("margin-notes-target-tabstop");
        if (affordance.hadTabIndex) {
          affordance.element.setAttribute("tabindex", affordance.previousTabIndex);
        } else {
          affordance.element.removeAttribute("tabindex");
        }
        if (affordance.hadTargetAttribute) {
          affordance.element.setAttribute("data-margin-notes-target", affordance.previousTargetAttribute);
        } else {
          affordance.element.removeAttribute("data-margin-notes-target");
        }
      }
      this.marginNotesRuntime.anchorAffordances = [];
    },
    async renderAnchorNotes({ anchor: anchor2 }) {
      const notesApi = this.api.notes;
      const affordance = notesApi.findAnchorAffordance({ app: this, anchorId: anchor2.id });
      if (!affordance) return;
      if (anchor2.notes.length === 0) {
        affordance.expanded = false;
        anchor2.expanded = false;
      }
      await this.actions.layoutAnchorNotes({ anchorId: anchor2.id });
    },
    async moveNoteFocus({ event, direction }) {
      const notesApi = this.api.notes;
      const note = notesApi.noteFromElement({ app: this, source: event.target });
      if (!note) return;
      const match = notesApi.findNote({ app: this, noteId: note.id });
      if (!match) return;
      const next = match.anchor.notes[match.index + direction];
      if (!next) return;
      const nextIsVisible = match.anchor.visibleNotes.some((visibleNote) => visibleNote.id === next.id);
      if (!match.anchor.expanded && !nextIsVisible) {
        await this.actions.expandAnchorNoteList({ anchorId: match.anchor.id });
      }
      await this.actions.focusNoteAfterRender({ noteId: next.id });
    },
    async blurAndCollapseNote({ event }) {
      const notesApi = this.api.notes;
      const note = notesApi.noteFromElement({ app: this, source: event.target });
      const match = note ? notesApi.findNote({ app: this, noteId: note.id }) : null;
      const list2 = event.target?.closest?.(".margin-notes-target-note-list");
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
      if (list2) {
        await this.actions.collapseExpandedInlineNotes({ list: list2 });
      }
      if (match?.anchor.expanded) {
        await this.actions.collapseAnchorNoteList({ anchorId: match.anchor.id });
      }
    },
    async layoutAnchorNotes({ anchorId }) {
      const notesApi = this.api.notes;
      const affordance = notesApi.findAnchorAffordance({ app: this, anchorId });
      const anchor2 = notesApi.findAnchor({ app: this, anchorId });
      if (!affordance || !anchor2) return;
      const notes = Array.from(anchor2.notes);
      const noteCount = notes.length;
      anchor2.noteCount = noteCount;
      anchor2.expanded = affordance.expanded && noteCount > 0;
      if (affordance.expanded) {
        anchor2.visibleNotes = notes;
        anchor2.overflowLabel = affordance.hasOverflow ? "show fewer notes" : "";
        await this.actions.syncAnchorLayoutDom({ anchorId });
        return;
      }
      if (noteCount === 0) {
        affordance.hasOverflow = false;
        anchor2.hasOverflow = false;
        anchor2.visibleNotes = [];
        anchor2.overflowLabel = "";
        await this.actions.syncAnchorLayoutDom({ anchorId });
        return;
      }
      if (noteCount === 1) {
        affordance.hasOverflow = false;
        anchor2.hasOverflow = false;
        anchor2.visibleNotes = notes;
        anchor2.overflowLabel = "";
        await this.actions.syncAnchorLayoutDom({ anchorId });
        return;
      }
      const availableHeight = Math.max(0, affordance.element.getBoundingClientRect().height);
      const collapsedNoteHeight = 32;
      const overflowToggleHeight = 22;
      let visibleCount = Math.floor(availableHeight / collapsedNoteHeight);
      if (visibleCount >= noteCount) {
        affordance.hasOverflow = false;
        anchor2.hasOverflow = false;
        anchor2.visibleNotes = notes;
        anchor2.overflowLabel = "";
        await this.actions.syncAnchorLayoutDom({ anchorId });
        return;
      }
      affordance.hasOverflow = true;
      anchor2.hasOverflow = true;
      visibleCount = Math.floor((availableHeight - overflowToggleHeight) / collapsedNoteHeight);
      visibleCount = Math.max(0, Math.min(visibleCount, noteCount - 1));
      const hiddenCount = Math.max(0, noteCount - visibleCount);
      anchor2.visibleNotes = notes.slice(0, visibleCount);
      anchor2.overflowLabel = visibleCount > 0 ? `${hiddenCount} more notes...` : `${noteCount} notes`;
      await this.actions.syncAnchorLayoutDom({ anchorId });
    },
    async toggleAnchorNoteList({ anchorId }) {
      if (!anchorId) return;
      const notesApi = this.api.notes;
      const affordance = notesApi.findAnchorAffordance({ app: this, anchorId });
      if (!affordance) return;
      if (affordance.expanded) {
        await this.actions.collapseAnchorNoteList({ anchorId });
      } else {
        await this.actions.expandAnchorNoteList({ anchorId });
      }
    },
    async expandAnchorNoteList({ anchorId }) {
      const notesApi = this.api.notes;
      const affordance = notesApi.findAnchorAffordance({ app: this, anchorId });
      if (!affordance || affordance.expanded) return;
      for (const other of this.marginNotesRuntime.anchorAffordances) {
        if (other.expanded) {
          other.expanded = false;
          await this.actions.collapseExpandedInlineNotes({ list: notesApi.noteListElement({ affordance: other }) });
          await this.actions.layoutAnchorNotes({ anchorId: other.anchorId });
        }
      }
      affordance.expanded = true;
      await this.actions.layoutAnchorNotes({ anchorId });
    },
    async collapseAnchorNoteList({ anchorId }) {
      const notesApi = this.api.notes;
      const affordance = notesApi.findAnchorAffordance({ app: this, anchorId });
      if (!affordance) return;
      affordance.expanded = false;
      await this.actions.collapseExpandedInlineNotes({ list: notesApi.noteListElement({ affordance }) });
      await this.actions.layoutAnchorNotes({ anchorId });
    },
    async expandInlineNote({ source }) {
      const item = source?.closest?.(".margin-notes-target-note");
      if (!item) return;
      const list2 = item.closest(".margin-notes-target-note-list");
      const toggle = item.querySelector(".margin-notes-target-note-toggle");
      const top = item.offsetTop;
      for (const expanded of list2?.querySelectorAll(".margin-notes-target-note.is-expanded") || []) {
        await this.actions.collapseInlineNote({ item: expanded });
      }
      item.style.setProperty("--margin-notes-expanded-top", `${top}px`);
      item.classList.add("is-expanded");
      toggle?.setAttribute("aria-expanded", "true");
    },
    async collapseInlineNote({ item }) {
      const toggle = item.querySelector(".margin-notes-target-note-toggle");
      item.classList.remove("is-expanded");
      item.style.removeProperty("--margin-notes-expanded-top");
      toggle?.setAttribute("aria-expanded", "false");
    },
    async collapseExpandedInlineNotes({ list: list2 }) {
      if (!list2) return;
      for (const note of list2.querySelectorAll(".margin-notes-target-note.is-expanded")) {
        await this.actions.collapseInlineNote({ item: note });
      }
    },
    async closeInlineNote({ source }) {
      const item = source?.closest?.(".margin-notes-target-note");
      if (!item) return;
      await this.actions.collapseInlineNote({ item });
      item.querySelector(".margin-notes-target-note-toggle")?.focus();
    },
    async focusNoteAfterRender({ noteId }) {
      setTimeout(() => this.actions.focusNote({ noteId }), 75);
    },
    async focusNote({ noteId }) {
      const notesApi = this.api.notes;
      const buttons = document.body.querySelectorAll(".margin-notes-target-note-toggle[data-simply-value-path]");
      for (const button2 of buttons) {
        if (notesApi.noteFromElement({ app: this, source: button2 })?.id === noteId) {
          button2.focus();
          return;
        }
      }
    },
    async syncAnchorLayoutDom({ anchorId }) {
      const notesApi = this.api.notes;
      const existing = this.marginNotesRuntime.syncTimers.get(anchorId);
      if (existing) {
        clearTimeout(existing);
      }
      const sync = () => notesApi.syncAnchorLayoutDomNow({ app: this, anchorId });
      sync();
      await notesApi.waitForViewRender();
      sync();
      this.marginNotesRuntime.syncTimers.set(anchorId, setTimeout(sync, 75));
    },
    async updateAnchorNoteState({ anchor: anchor2 }) {
      anchor2.noteCount = anchor2.notes.length;
    }
  },
  commands: {
    createNote(_element, anchor2) {
      return this.actions.createNote({ anchorId: anchor2?.id });
    },
    toggleAnchorNoteList(_element, anchor2) {
      return this.actions.toggleAnchorNoteList({ anchorId: anchor2?.id });
    },
    expandInlineNote(element2) {
      return this.actions.expandInlineNote({ source: element2 });
    },
    collapseInlineNote(element2) {
      return this.actions.closeInlineNote({ source: element2 });
    },
    updateNote(_element, note) {
      return this.actions.updateNote({ noteId: note?.id });
    },
    deleteNote(_element, note) {
      return this.actions.deleteNote({ noteId: note?.id });
    }
  },
  shortcuts: {
    marginNotesNote: {
      arrowdown(event) {
        this.actions.moveNoteFocus({ event, direction: 1 });
        return false;
      },
      arrowright(event) {
        this.actions.moveNoteFocus({ event, direction: 1 });
        return false;
      },
      arrowup(event) {
        this.actions.moveNoteFocus({ event, direction: -1 });
        return false;
      },
      arrowleft(event) {
        this.actions.moveNoteFocus({ event, direction: -1 });
        return false;
      },
      escape(event) {
        this.actions.blurAndCollapseNote({ event });
        return false;
      }
    }
  },
  api: {
    notes: {
      ...annotationModel,
      CobaltEditorModal,
      createSolidNotesConnection,
      authorizePopup,
      path: path_default,
      templates: {
        solidConnection: control_default
      },
      installedViewAssets: [
        "margin-notes",
        "margin-notes-anchor-widget",
        "margin-notes-inline-note",
        "margin-notes-design-system.css",
        "margin-notes-ui.css",
        "margin-notes-solid-connection.css",
        "margin-notes-cobalt-editor.css"
      ],
      normalizeTheme({ theme }) {
        if (theme === void 0) return "system";
        if (["system", "light", "dark"].includes(theme)) return theme;
        throw new Error('Theme must be "system", "light", or "dark"');
      },
      applyTheme({ app: app2, theme }) {
        app2.marginNotesRuntime.themeRoot?.setAttribute("data-margin-notes-theme", theme);
      },
      restoreTheme({ app: app2 }) {
        const root = app2.marginNotesRuntime.themeRoot;
        if (!root) return;
        if (app2.marginNotesRuntime.hadThemeAttribute) {
          root.setAttribute("data-margin-notes-theme", app2.marginNotesRuntime.previousThemeAttribute);
        } else {
          root.removeAttribute("data-margin-notes-theme");
        }
      },
      getNotesForAnchor({ app: app2, anchorId }) {
        const anchor2 = this.findAnchor({ app: app2, anchorId });
        if (!anchor2) return [];
        return Array.from(anchor2.notes, (note) => this.toStoredAnnotation({ annotation: note.annotation }));
      },
      hostElement(value) {
        return value?.element || value || null;
      },
      prepareSolidAuthorization({ config }) {
        if (config.solid || config.discoverySolid || config.authorize_callback || config.usePopupAuth === false) return {};
        const popup = this.openSolidAuthPopup();
        return {
          authorize_callback: (authorizationCodeURL) => {
            return this.authorizeSolidPopup({ authorizationCodeURL, popup });
          }
        };
      },
      openSolidAuthPopup() {
        if (typeof globalThis.window?.open !== "function") return null;
        try {
          return globalThis.window.open("", "margin-notes-solid-oauth", "popup,width=520,height=720");
        } catch {
          return null;
        }
      },
      authorizeSolidPopup({ authorizationCodeURL, popup }) {
        return this.authorizePopup(
          authorizationCodeURL,
          popup ? { popup } : {}
        );
      },
      setSolidConnectionStatus({ app: app2, status: status2, message, webId, storageUrl, resourceUrl }) {
        app2.data.marginNotes.solidConnection = {
          ...app2.data.marginNotes.solidConnection,
          status: status2,
          message,
          webId: webId ?? app2.data.marginNotes.solidConnection.webId,
          storageUrl: storageUrl ?? app2.data.marginNotes.solidConnection.storageUrl,
          resourceUrl: resourceUrl ?? app2.data.marginNotes.solidConnection.resourceUrl
        };
      },
      solidConnectionMemoryKey({ app: app2 }) {
        return `margin-notes.solidConnection.${app2.data.marginNotes.namespace || "default"}`;
      },
      loadRememberedSolidConnection({ app: app2 }) {
        if (!globalThis.localStorage) return null;
        try {
          const value = globalThis.localStorage.getItem(this.solidConnectionMemoryKey({ app: app2 }));
          if (!value) return null;
          const connection = JSON.parse(value);
          if (typeof connection?.webId !== "string" || connection.webId.length === 0) return null;
          return connection;
        } catch {
          return null;
        }
      },
      rememberSolidConnection({ app: app2, connection }) {
        if (!globalThis.localStorage) return;
        const value = {
          webId: connection.webId,
          storageUrl: connection.storageUrl,
          resourceUrl: connection.resourceUrl,
          preferencesUrl: connection.preferencesUrl,
          rootFolderUrl: connection.rootFolderUrl,
          issuer: connection.issuer
        };
        try {
          globalThis.localStorage.setItem(
            this.solidConnectionMemoryKey({ app: app2 }),
            JSON.stringify(value)
          );
        } catch {
        }
      },
      renderSolidConnectionStatus({ app: app2 }) {
        const element2 = app2.marginNotesRuntime.solidConnectionElement;
        const statusElement = element2?.querySelector("[data-margin-notes-solid-status]");
        const input2 = element2?.querySelector("[data-margin-notes-solid-webid]");
        const button2 = element2?.querySelector('button[type="submit"]');
        const state = app2.data.marginNotes.solidConnection;
        if (!statusElement) return;
        statusElement.textContent = state.message || "Not connected";
        statusElement.dataset.status = state.status || "idle";
        if (input2 && state.webId && input2.value !== state.webId) {
          input2.value = state.webId;
        }
        if (button2) {
          button2.disabled = state.status === "connecting";
        }
      },
      removeInstalledViewAssets() {
        for (const id2 of this.installedViewAssets) {
          document.getElementById(id2)?.remove();
        }
      },
      async loadGraph({ app: app2, key, throwOnError = false }) {
        return this.loadGraphFromStore({
          store: app2.marginNotesRuntime.store,
          key,
          throwOnError
        });
      },
      async loadGraphFromStore({ store, key, throwOnError = false }) {
        try {
          const value = await store.load({ key });
          if (!value) return [];
          return this.toStoredGraph({ value });
        } catch (error4) {
          if (throwOnError) {
            throw error4;
          }
          console.error("Failed to load notes:", error4);
          return [];
        }
      },
      async saveGraph({ app: app2, key, subjects }) {
        return this.saveGraphToStore({
          store: app2.marginNotesRuntime.store,
          key,
          subjects
        });
      },
      async saveGraphToStore({ store, key, subjects, throwOnError = false }) {
        try {
          await store.save({
            key,
            value: this.toStorageDocument({ subjects })
          });
          return true;
        } catch (error4) {
          if (throwOnError) {
            throw error4;
          }
          console.error("Failed to save notes:", error4);
          return false;
        }
      },
      mergeAnnotationGraphs({ storedNotes = [], incomingNotes = [] }) {
        const graphById = /* @__PURE__ */ new Map();
        let changed = false;
        for (const note of storedNotes) {
          graphById.set(note.id, note);
        }
        for (const note of incomingNotes) {
          const storedNote = graphById.get(note.id);
          if (!storedNote) {
            graphById.set(note.id, note);
            changed = true;
            continue;
          }
          if (this.annotationModifiedAt({ annotation: note }) > this.annotationModifiedAt({ annotation: storedNote })) {
            graphById.set(note.id, note);
            changed = true;
          }
        }
        return {
          graph: Array.from(graphById.values()),
          changed
        };
      },
      annotationModifiedAt({ annotation }) {
        const modified = annotation?.dcterms$modified || annotation?.modified || annotation?.updatedAt || "";
        const timestamp = Date.parse(Array.isArray(modified) ? modified[0] : modified);
        return Number.isFinite(timestamp) ? timestamp : 0;
      },
      groupNotesByAnchor({ notes }) {
        return notes.reduce((grouped, note) => {
          const anchorId = this.annotationAnchorId({ annotation: note }) || note.anchorId;
          if (!anchorId) return grouped;
          if (!grouped[anchorId]) {
            grouped[anchorId] = [];
          }
          grouped[anchorId].push(this.toRenderableNote({ annotation: note }));
          return grouped;
        }, {});
      },
      createResizeObserver({ app: app2 }) {
        if (typeof ResizeObserver === "undefined") {
          return;
        }
        return new ResizeObserver((entries) => {
          for (const entry of entries) {
            const affordance = app2.marginNotesRuntime.anchorAffordances.find((item) => item.element === entry.target);
            if (affordance) {
              app2.actions.layoutAnchorNotes({ anchorId: affordance.anchorId });
            }
          }
        });
      },
      isValidHostAnchor({ anchor: anchor2 }) {
        return Boolean(
          anchor2?.id && typeof HTMLElement !== "undefined" && anchor2.element instanceof HTMLElement && (anchor2.slot === void 0 || anchor2.slot instanceof HTMLElement)
        );
      },
      anchorSlot({ anchor: anchor2 }) {
        return anchor2.slot || anchor2.element;
      },
      findAnchor({ app: app2, anchorId }) {
        return app2?.data.marginNotes.anchors.find((anchor2) => anchor2.id === anchorId);
      },
      findAnchorAffordance({ app: app2, anchorId }) {
        return app2.marginNotesRuntime.anchorAffordances.find((affordance) => affordance.anchorId === anchorId);
      },
      findNote({ app: app2, noteId }) {
        for (const anchor2 of app2?.data.marginNotes.anchors || []) {
          const index = anchor2.notes.findIndex((note) => note.id === noteId);
          if (index >= 0) {
            return { anchor: anchor2, note: anchor2.notes[index], index };
          }
        }
      },
      noteListElement({ affordance }) {
        return affordance?.widget.querySelector(".margin-notes-target-note-list");
      },
      noteFromElement({ app: app2, source }) {
        const element2 = source?.closest?.("[data-simply-value-path]");
        const valuePath = element2?.dataset?.simplyValuePath;
        if (!valuePath || !app2) return;
        return this.path.get(app2.data, valuePath);
      },
      waitForViewRender() {
        return new Promise((resolve) => globalThis.setTimeout(resolve, 75));
      },
      syncAnchorLayoutDomNow({ app: app2, anchorId }) {
        app2.marginNotesRuntime.syncTimers.delete(anchorId);
        const affordance = this.findAnchorAffordance({ app: app2, anchorId });
        const anchor2 = this.findAnchor({ app: app2, anchorId });
        if (!affordance || !anchor2) return;
        const list2 = this.noteListElement({ affordance });
        const count = affordance.widget.querySelector(".margin-notes-target-note-count");
        if (!list2 || !count) return;
        list2.classList.toggle("is-expanded", anchor2.expanded);
        list2.setAttribute("aria-label", `Notes for ${anchor2.label}`);
        list2.style.setProperty("--margin-notes-open-background", app2.marginNotesRuntime.expandedStackBackground);
        count.hidden = !anchor2.overflowLabel;
        count.dataset.marginNotesEmpty = anchor2.overflowLabel ? "false" : "true";
        count.setAttribute("aria-expanded", anchor2.expanded ? "true" : "false");
        if (anchor2.expanded) {
          count.setAttribute("aria-label", `Collapse ${anchor2.noteCount} notes`);
        } else if (anchor2.visibleNotes.length > 0) {
          const hiddenCount = Math.max(0, anchor2.noteCount - anchor2.visibleNotes.length);
          count.setAttribute("aria-label", `Show ${hiddenCount} more notes`);
        } else {
          count.setAttribute("aria-label", `Show ${anchor2.noteCount} notes`);
        }
      },
      anchorLabel({ anchor: anchor2 }) {
        return (anchor2.label || anchor2.id).replace(/\s+/g, " ").trim();
      },
      isNaturallyFocusable({ element: element2 }) {
        return element2.matches("a[href], button, input, select, textarea, summary, [tabindex]");
      }
    }
  }
};

// src/host-contract.js
function validateHostConfig(config) {
  if (!config) {
    throw new Error("Config is required");
  }
  if (!Array.isArray(config.anchors)) {
    throw new Error("Config must have anchors array");
  }
  if (!config.container || !isElementLike(config.container.element)) {
    throw new Error("Config must have container with element");
  }
  if (config.store) {
    validateStore(config.store);
  }
  validateSolidConnection(config.solidConnection);
  validateTheme(config.theme);
  const anchorIds = /* @__PURE__ */ new Set();
  config.anchors.forEach((anchor2, index) => {
    validateAnchor(anchor2, index);
    if (anchorIds.has(anchor2.id)) {
      throw new Error(`Config anchors must have unique ids: ${anchor2.id}`);
    }
    anchorIds.add(anchor2.id);
  });
  return config;
}
function storeKeyFromConfig(config) {
  const namespace = config?.namespace || "default";
  return config?.storeKey || config?.storageKey || `margin-notes-${namespace}`;
}
function validateAnchor(anchor2, index) {
  if (!anchor2 || typeof anchor2.id !== "string" || anchor2.id.length === 0) {
    throw new Error(`Config anchor at index ${index} must have an id`);
  }
  if (!isElementLike(anchor2.element)) {
    throw new Error(`Config anchor "${anchor2.id}" must have an element`);
  }
  if (anchor2.slot !== void 0 && !isElementLike(anchor2.slot)) {
    throw new Error(`Config anchor "${anchor2.id}" slot must be an element`);
  }
}
function validateStore(store) {
  for (const method of ["load", "save", "remove"]) {
    if (typeof store[method] !== "function") {
      throw new Error(`Config store must provide ${method}()`);
    }
  }
}
function validateSolidConnection(solidConnection) {
  if (solidConnection === void 0) return;
  if (!solidConnection || typeof solidConnection !== "object") {
    throw new Error("Config solidConnection must be an object");
  }
  const container = solidConnection.container?.element || solidConnection.container;
  if (!isElementLike(container)) {
    throw new Error("Config solidConnection must have a container element");
  }
}
function validateTheme(theme) {
  if (theme === void 0) return;
  if (!["system", "light", "dark"].includes(theme)) {
    throw new Error('Config theme must be "system", "light", or "dark"');
  }
}
function isElementLike(value) {
  return value && typeof value === "object" && value.nodeType === 1;
}

// src/storage/local-store.js
var DEFAULT_NAME = "margin-notes";
var DEFAULT_COLLECTION = "values";
function createLocalStore(options = {}) {
  const name = options.name || DEFAULT_NAME;
  const collection = options.collection || DEFAULT_COLLECTION;
  const indexedDB = options.indexedDB ?? globalThis.indexedDB;
  let database;
  return {
    name: "localStore",
    async load({ key }) {
      const store = await objectStore({ mode: "readonly" });
      const record = await requestValue(store.get(key));
      return record?.value ?? null;
    },
    async save({ key, value }) {
      const store = await objectStore({ mode: "readwrite" });
      await requestValue(store.put({ key, value }));
      return { key };
    },
    async remove({ key }) {
      const store = await objectStore({ mode: "readwrite" });
      await requestValue(store.delete(key));
      return { key };
    }
  };
  async function objectStore({ mode }) {
    database ||= openDatabase({ indexedDB, name, collection });
    const db = await database;
    return db.transaction(collection, mode).objectStore(collection);
  }
}
function openDatabase({ indexedDB, name, collection }) {
  if (!indexedDB) {
    return Promise.reject(new Error("Browser local storage is not available"));
  }
  return new Promise((resolve, reject) => {
    const request3 = indexedDB.open(name, 1);
    request3.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(collection)) {
        db.createObjectStore(collection, { keyPath: "key" });
      }
    };
    request3.onsuccess = (event) => resolve(event.target.result);
    request3.onerror = (event) => reject(event.target.error);
  });
}
function requestValue(request3) {
  return new Promise((resolve, reject) => {
    request3.onsuccess = (event) => resolve(event.target.result);
    request3.onerror = (event) => reject(event.target.error);
  });
}

// src/component.js
function mount(config) {
  validateHostConfig(config);
  const mountContainer = config.container.element;
  const storeKey = storeKeyFromConfig(config);
  const store = config.store || createLocalStore();
  const themeRoot = document.documentElement;
  mountContainer.innerHTML = '<simply-render rel="margin-notes"></simply-render>';
  const marginApp = app({
    container: document.body,
    components: {
      paragraphNoteStacks
    },
    data: {
      marginNotes: {
        namespace: config.namespace || "default",
        anchors: [],
        anchorViews: [],
        graph: [],
        storeKey,
        solidConnection: {
          status: "idle",
          message: "Not connected",
          webId: "",
          storageUrl: "",
          resourceUrl: ""
        },
        theme: config.theme || "system"
      }
    },
    marginNotesRuntime: {
      mountContainer,
      hostAnchors: config.anchors,
      store,
      expandedStackBackground: config.expandedStackBackground || "#fffefb",
      anchorAffordances: [],
      resizeObserver: null,
      syncTimers: /* @__PURE__ */ new Map(),
      solidConnectionConfig: config.solidConnection || null,
      solidConnectionElement: null,
      solidConnectionCleanup: null,
      themeRoot,
      hadThemeAttribute: themeRoot.hasAttribute("data-margin-notes-theme"),
      previousThemeAttribute: themeRoot.getAttribute("data-margin-notes-theme")
    },
    async start() {
      await this.actions.setupParagraphNoteStacks({
        anchors: this.marginNotesRuntime.hostAnchors,
        storeKey
      });
      await this.actions.setupSolidConnection({
        config: this.marginNotesRuntime.solidConnectionConfig
      });
    }
  });
  const destroyApp = marginApp.destroy.bind(marginApp);
  marginApp.destroy = async function destroyMarginNotesApp() {
    await this.actions.destroySolidConnection({});
    await this.actions.destroyParagraphNoteStacks({});
    destroyApp();
  };
  marginApp.getNotesForAnchor = function getMountedNotesForAnchor(anchorId) {
    return this.api.notes.getNotesForAnchor({
      app: this,
      anchorId
    });
  };
  marginApp.setTheme = function setMountedTheme(theme) {
    return this.actions.setTheme({ theme });
  };
  marginApp.getTheme = function getMountedTheme() {
    return this.data.marginNotes.theme;
  };
  marginApp.connectSolidStorage = function connectMountedSolidStorage(webId) {
    return this.actions.connectSolidStorage({ webId });
  };
  marginApp.getSolidConnection = function getMountedSolidConnection() {
    return { ...this.data.marginNotes.solidConnection };
  };
  return marginApp;
}
var MarginNotes = class {
  constructor() {
    this.app = null;
  }
  async initialize(config) {
    if (this.app) {
      await this.destroy();
    }
    this.app = mount(config);
  }
  async destroy() {
    if (!this.app) return;
    await this.app.destroy();
    this.app = null;
  }
  async createNote(anchorId) {
    return this.app?.actions.createNote({ anchorId });
  }
  async updateNote(noteId) {
    return this.app?.actions.updateNote({ noteId });
  }
  async deleteNote(noteId) {
    return this.app?.actions.deleteNote({ noteId });
  }
  getNotesForAnchor(anchorId) {
    return this.app?.getNotesForAnchor(anchorId) || [];
  }
  setTheme(theme) {
    return this.app?.setTheme(theme);
  }
  getTheme() {
    return this.app?.getTheme() || "system";
  }
  connectSolidStorage(webId) {
    return this.app?.connectSolidStorage(webId);
  }
  getSolidConnection() {
    return this.app?.getSolidConnection() || null;
  }
};

// src/index.js
var MarginNotesAPI = {
  mount(config) {
    return mount(config);
  },
  create() {
    return new MarginNotes();
  },
  createSolidResourceStore(options) {
    return createSolidResourceStore(options);
  },
  createSolidNotesConnection(options) {
    return createSolidNotesConnection(options);
  },
  notesResourceUrlForPage(options) {
    return notesResourceUrlForPage(options);
  },
  popupHandleRedirect(origin) {
    return handleRedirect(origin);
  }
};
if (typeof window !== "undefined") {
  window.MarginNotes = MarginNotesAPI;
}
export {
  MarginNotes,
  MarginNotesAPI,
  createSolidNotesConnection,
  createSolidResourceStore,
  mount,
  notesResourceUrlForPage,
  handleRedirect as popupHandleRedirect
};
/*! Bundled license information:

ieee754/index.js:
ieee754/index.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)

buffer/index.js:
buffer/index.js:
  (*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <https://feross.org>
   * @license  MIT
   *)
*/
//# sourceMappingURL=index.js.map
