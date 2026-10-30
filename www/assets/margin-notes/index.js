var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@muze-labs/simplyflow-state/src/index.mjs
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

// node_modules/@muze-labs/simplyflow-state/src/symbols.mjs
var DEP = {
  ITERATE: Symbol.for("@simplyedit/simplyflow.iterate"),
  XRAY: Symbol.for("@simplyedit/simplyflow.xRay"),
  SIGNAL: Symbol.for("@simplyedit/simplyflow.Signal"),
  TEMPLATE: Symbol.for("@simplyedit/simplyflow.bindTemplate"),
  VALUE: Symbol.for("@simplyedit/simplyflow.bindValue"),
  LENGTH: "length",
  SIZE: "size"
};

// node_modules/@muze-labs/simplyflow-state/src/index.mjs
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
  const values3 = /* @__PURE__ */ new Map();
  if (!Array.isArray(target) || nextLength >= target.length) {
    return values3;
  }
  for (let index = nextLength; index < target.length; index++) {
    if (Object.hasOwn(target, index)) {
      values3.set(index, target[index]);
    }
  }
  return values3;
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
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    if (descriptor?.configurable === false && (Object.hasOwn(descriptor, "value") && descriptor.writable === false || Object.hasOwn(descriptor, "get") && descriptor.get === void 0)) return value;
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
function cloneDescriptorProperties(source2, result, cloneValue, skip = () => false) {
  const descriptors = Object.getOwnPropertyDescriptors(source2);
  for (const key of Reflect.ownKeys(descriptors)) {
    if (skip(key)) {
      delete descriptors[key];
      continue;
    }
    const descriptor = descriptors[key];
    if (!Object.hasOwn(descriptor, "value")) {
      cannotClone(source2, String(key));
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
    const source2 = raw(value2);
    if (!isObjectLike(source2)) {
      return source2;
    }
    if (seen.has(source2)) {
      return seen.get(source2);
    }
    if (hasToClone(source2)) {
      const result = raw(source2.toClone());
      if (Object.is(result, source2)) {
        throw new TypeError(`simplyflow/state: clone() toClone() returned the original object at ${path2}`);
      }
      seen.set(source2, result);
      return result;
    }
    if (Array.isArray(source2)) {
      const result = new Array(source2.length);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild, (key) => key === "length");
    }
    if (isPlainObject(source2)) {
      const result = Object.create(Object.getPrototypeOf(source2));
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (source2 instanceof Map) {
      const result = /* @__PURE__ */ new Map();
      seen.set(source2, result);
      source2.forEach((mapValue, mapKey) => {
        result.set(cloneChild(mapKey, "map key"), cloneChild(mapValue, "map value"));
      });
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (source2 instanceof Set) {
      const result = /* @__PURE__ */ new Set();
      seen.set(source2, result);
      source2.forEach((setValue) => result.add(cloneChild(setValue, "set value")));
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (source2 instanceof Date) {
      const result = new Date(source2.getTime());
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (source2 instanceof RegExp) {
      const result = new RegExp(source2.source, source2.flags);
      result.lastIndex = source2.lastIndex;
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild, (key) => key === "lastIndex");
    }
    if (source2 instanceof ArrayBuffer) {
      const result = cloneArrayBuffer(source2);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (typeof SharedArrayBuffer !== "undefined" && source2 instanceof SharedArrayBuffer) {
      const result = cloneSharedArrayBuffer(source2);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (source2 instanceof DataView) {
      const buffer = source2.buffer.slice(source2.byteOffset, source2.byteOffset + source2.byteLength);
      const result = new DataView(buffer);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild);
    }
    if (isTypedArray(source2)) {
      const result = new source2.constructor(source2);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild, isIntegerKey);
    }
    if (typeof URL !== "undefined" && source2 instanceof URL) {
      const result = new URL(source2.href);
      seen.set(source2, result);
      return result;
    }
    if (typeof URLSearchParams !== "undefined" && source2 instanceof URLSearchParams) {
      const result = new URLSearchParams(source2);
      seen.set(source2, result);
      return result;
    }
    if (typeof File !== "undefined" && source2 instanceof File) {
      const result = new File([source2], source2.name, {
        type: source2.type,
        lastModified: source2.lastModified
      });
      seen.set(source2, result);
      return result;
    }
    if (typeof Blob !== "undefined" && source2 instanceof Blob) {
      const result = source2.slice(0, source2.size, source2.type);
      seen.set(source2, result);
      return result;
    }
    if (source2 instanceof Error) {
      const result = cloneErrorObject(source2, cloneChild, path2);
      seen.set(source2, result);
      return cloneDescriptorProperties(source2, result, cloneChild, (key) => key === "message" || key === "cause" || key === "errors" || key === "stack");
    }
    if (typeof Node !== "undefined" && source2 instanceof Node && typeof source2.cloneNode === "function") {
      const result = source2.cloneNode(deep);
      seen.set(source2, result);
      return result;
    }
    cannotClone(source2, path2);
  }
  return cloneValue(value);
}

// node_modules/@muze-labs/simplyflow-bind/src/dom.mjs
var dom_exports = {};
__export(dom_exports, {
  findAttribute: () => findAttribute,
  signal: () => signal2,
  trackDomField: () => trackDomField,
  trackDomList: () => trackDomList
});

// node_modules/@muze-labs/simplyflow-bind/src/render.mjs
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
    let parts2 = path2.split(".");
    let curr = root;
    let part;
    part = parts2.shift();
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
      part = parts2.shift();
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
    const values3 = currentValue.filter((item) => !matchValue(item, value));
    if (el.checked) {
      values3.push(value);
    }
    return values3;
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

// node_modules/@muze-labs/simplyflow-bind/src/dom.mjs
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
        const source2 = currentList.slice();
        for (const item of children) {
          if (item.tagName === "TEMPLATE") {
            continue;
          }
          if (item.dataset.flowKey) {
            if (item.dataset.flowKey != key) {
              setValueByPath(
                this.options.root,
                path2 + "." + key,
                source2[item.dataset.flowKey]
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

// node_modules/@muze-labs/simplyflow-bind/src/transformers.mjs
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

// node_modules/@muze-labs/simplyflow-bind/src/index.mjs
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
  let parts2 = path2.split(".");
  let curr = root;
  let part;
  part = parts2.shift();
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
    part = parts2.shift();
  }
  return curr;
}

// node_modules/@muze-labs/simplyflow-model/src/index.mjs
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
        const source2 = raw(input2);
        let result = source2 && typeof source2 === "object" ? projections.get(source2) : null;
        if (!result) {
          result = {};
          if (source2 && typeof source2 === "object") {
            projections.set(source2, result);
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

// node_modules/@muze-labs/simplyflow/src/render.mjs
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

// node_modules/@muze-labs/simplyflow-app/src/suggest.mjs
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
  const previous = Array.from({ length: b.length + 1 }, (_2, index) => index);
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

// node_modules/@muze-labs/simplyflow-app/src/route.mjs
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
        let check2 = [
          { match: link.hash, goto: link.hash },
          { match: link.pathname + link.hash, goto: link.pathname + link.search + link.hash },
          { match: link.pathname, goto: link.pathname + link.search }
        ];
        let target;
        do {
          target = check2.shift();
          target.match = getPath(target.match, this.baseURL);
        } while (check2.length && !this.has(target.match));
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
  let source2 = "";
  let index = 0;
  while (index < route.length) {
    if (route[index] === ":") {
      const match = /^:([A-Za-z_][A-Za-z0-9_]*)(\*)?/.exec(route.substring(index));
      if (!match) {
        throw new TypeError(`simplyflow/route: invalid route parameter in "${route}"`);
      }
      params.push(match[1]);
      source2 += match[2] ? "(.*)" : "([^/]+)";
      index += match[0].length;
      continue;
    }
    if (route[index] === "*") {
      source2 += ".*";
      index++;
      continue;
    }
    source2 += escapeRegexp(route[index]);
    index++;
  }
  return source2;
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

// node_modules/@muze-labs/simplyflow-app/src/path.mjs
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

// node_modules/@muze-labs/simplyflow-app/src/command.mjs
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
        let values3 = [];
        for (let option of el.options) {
          if (option.selected) {
            values3.push(option.value);
          }
        }
        return values3;
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
function warnUnknownCommand(commands2, command, source2) {
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
  if (source2) {
    console.warn(`simplyflow/command: unknown command "${command}"${suffix}`, { cause: source2 });
  } else {
    console.warn(`simplyflow/command: unknown command "${command}"${suffix}`);
  }
}
function commandNames(commands2) {
  return Object.keys(commands2).filter((command) => {
    return !command.startsWith("$") && !COMMAND_OPTIONS.includes(command) && typeof commands2[command] === "function";
  });
}

// node_modules/@muze-labs/simplyflow-app/src/action.mjs
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

// node_modules/@muze-labs/simplyflow-app/src/shortcut.mjs
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

// node_modules/@muze-labs/simplyflow-app/src/behavior.mjs
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

// node_modules/@muze-labs/simplyflow-app/src/include.mjs
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
  const url2 = new URL(relative, base);
  if (cacheBuster) {
    url2.searchParams.set("cb", cacheBuster);
  }
  return url2.href;
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
        const response2 = await fetch(link.href);
        if (!response2.ok) {
          console.warn(`simplyflow/include: failed to load "${link.href}" (${response2.status})`);
          link.rel = "simply-include-error";
          continue;
        }
        const html2 = await response2.text();
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

// node_modules/@muze-labs/simplyflow-app/src/index.mjs
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
    const component2 = components[name];
    if (component2.components) {
      mergeComponents(options, component2.components);
    }
    if (!options.components) {
      options.components = {};
    }
    options.components[name] = component2;
    for (const key of Object.keys(component2)) {
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
          mergeOptions(options[key], component2[key]);
          break;
      }
    }
  }
}

// node_modules/@muze-labs/simplyflow-app/src/highlight.mjs
function html(strings, ...values3) {
  const outputArray = values3.map(
    (value, index) => `${strings[index]}${value}`
  );
  return outputArray.join("") + strings[strings.length - 1];
}
function css(strings, ...values3) {
  return html(strings, ...values3);
}

// node_modules/@muze-labs/simplyflow/src/index.mjs
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

// node_modules/@muze-nl/oldm-core/src/oldm.mjs
var oldm_exports = {};
__export(oldm_exports, {
  BlankNode: () => BlankNode,
  Collection: () => Collection,
  Context: () => Context,
  Graph: () => Graph,
  NamedNode: () => NamedNode,
  aliases: () => aliases,
  default: () => oldm,
  first: () => first,
  literal: () => literal,
  many: () => many,
  one: () => one,
  prefixes: () => prefixes,
  rdfType: () => rdfType
});

// node_modules/@muze-nl/oldm-core/src/iri.mjs
var ucschar = "\\u00A0-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFEF\\u{10000}-\\u{1FFFD}\\u{20000}-\\u{2FFFD}\\u{30000}-\\u{3FFFD}\\u{40000}-\\u{4FFFD}\\u{50000}-\\u{5FFFD}\\u{60000}-\\u{6FFFD}\\u{70000}-\\u{7FFFD}\\u{80000}-\\u{8FFFD}\\u{90000}-\\u{9FFFD}\\u{A0000}-\\u{AFFFD}\\u{B0000}-\\u{BFFFD}\\u{C0000}-\\u{CFFFD}\\u{D0000}-\\u{DFFFD}\\u{E1000}-\\u{EFFFD}";
var iprivate = "\\uE000-\\uF8FF\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}";
var nameChars = `a-zA-Z0-9._~!$&'()*+,;=\\-${ucschar}`;
var component = (extra) => new RegExp(`^(?:[${nameChars}${extra}]|%[0-9a-fA-F]{2})*$`, "u");
var pathPattern = component(":@/");
var queryPattern = component(":@/?" + iprivate);
var fragmentPattern = component(":@/?");
var userPattern = component(":");
var hostPattern = component("");
function parts(value, requireAbsolute = false, requireHTTPHost = true) {
  if (typeof value != "string") throw new TypeError("Expected an IRI string");
  if (/[\u0000-\u0020\u007F-\u009F]/.test(value)) throw new TypeError(`Invalid IRI: ${value}`);
  const match = /^(?:([a-z][a-z0-9+.-]*):)?(?:\/\/([^/?#]*))?([^?#]*)(\?[^#]*)?(#.*)?$/is.exec(value);
  if (!match) throw new TypeError(`Invalid IRI: ${value}`);
  const [, scheme, authority, path2, query, fragment] = match;
  if (requireAbsolute && !scheme) throw new TypeError(`Expected an absolute IRI: ${value}`);
  if (!pathPattern.test(path2) || query && !queryPattern.test(query.slice(1)) || fragment && !fragmentPattern.test(fragment.slice(1)) || !scheme && authority === void 0 && path2.split("/")[0].includes(":")) {
    throw new TypeError(`Invalid IRI: ${value}`);
  }
  if (authority !== void 0) {
    const host = authority.slice(authority.lastIndexOf("@") + 1);
    const user = authority.includes("@") ? authority.slice(0, authority.lastIndexOf("@")) : "";
    const match2 = /^(\[[^\]]+\]|[^:]*)(?::([0-9]*))?$/.exec(host);
    if (!userPattern.test(user) || !match2) throw new TypeError(`Invalid IRI authority: ${value}`);
    if (match2[1].startsWith("[")) {
      if (!/^\[v[0-9a-f]+\.[a-z0-9._~!$&'()*+,;=:\-]+\]$/i.test(match2[1])) {
        try {
          new URL(`http://${match2[1]}/`);
        } catch {
          throw new TypeError(`Invalid IP literal: ${value}`);
        }
      }
    } else if (!hostPattern.test(match2[1])) throw new TypeError(`Invalid IRI host: ${value}`);
    if (requireHTTPHost && /^https?$/i.test(scheme) && !match2[1]) throw new TypeError(`Missing HTTP host: ${value}`);
  } else if (requireHTTPHost && /^https?$/i.test(scheme)) throw new TypeError(`Missing HTTP authority: ${value}`);
  return { scheme, authority, path: path2, query, fragment };
}
var validatedIRIs = /* @__PURE__ */ new Set();
function absoluteIRI(value) {
  if (!validatedIRIs.has(value)) {
    parts(value, true);
    if (validatedIRIs.size >= 1024) validatedIRIs.delete(validatedIRIs.values().next().value);
    validatedIRIs.add(value);
  }
  return value;
}
function join({ scheme, authority, path: path2, query, fragment }) {
  return (scheme ? scheme + ":" : "") + (authority === void 0 ? "" : "//" + authority) + path2 + (query ?? "") + (fragment ?? "");
}
function removeDotSegments(path2) {
  let output = "";
  while (path2) {
    if (path2.startsWith("../")) path2 = path2.slice(3);
    else if (path2.startsWith("./")) path2 = path2.slice(2);
    else if (path2.startsWith("/./") || path2 == "/.") path2 = "/" + path2.slice(3);
    else if (path2.startsWith("/../") || path2 == "/..") {
      path2 = "/" + path2.slice(4);
      output = output.slice(0, Math.max(0, output.lastIndexOf("/")));
    } else if (path2 == "." || path2 == "..") path2 = "";
    else {
      const end = path2.indexOf("/", path2.startsWith("/") ? 1 : 0);
      if (end < 0) {
        output += path2;
        path2 = "";
      } else {
        output += path2.slice(0, end);
        path2 = path2.slice(end);
      }
    }
  }
  return output;
}
function namespaceIRI(value) {
  parts(value, true, false);
  return value;
}
function resolveNamespaceReference(value, base) {
  return resolveReference(value, base, namespaceIRI);
}
function resolveIRIReference(value, base) {
  return resolveReference(value, base, absoluteIRI);
}
function resolveReference(value, base, validate) {
  if (typeof value == "string" && /^[a-z][a-z0-9+.-]*:/i.test(value)) return validate(value);
  const ref = parts(value);
  if (base == null) throw new TypeError(`Cannot resolve a relative IRI without a base: ${value}`);
  const target = parts(base, true);
  if (ref.authority !== void 0) {
    target.authority = ref.authority;
    target.path = removeDotSegments(ref.path);
    target.query = ref.query;
  } else if (!ref.path) {
    target.query = ref.query ?? target.query;
  } else {
    if (!ref.path.startsWith("/") && target.authority === void 0 && !target.path.startsWith("/")) {
      throw new TypeError(`Base IRI does not support relative paths: ${base}`);
    }
    const directory = target.authority !== void 0 && !target.path ? "/" : target.path.slice(0, target.path.lastIndexOf("/") + 1);
    target.path = removeDotSegments(ref.path.startsWith("/") ? ref.path : directory + ref.path);
    target.query = ref.query;
  }
  target.fragment = ref.fragment;
  return validate(join(target));
}
function expandIRI(value, namespaceFor, separator, base) {
  value = value?.id ?? value;
  if (typeof value != "string") throw new TypeError("Expected an IRI string");
  const index = value.indexOf(separator);
  if (index >= 0) {
    const prefix = value.slice(0, index);
    const namespace = namespaceFor(prefix);
    if (namespace !== void 0) return absoluteIRI(namespaceIRI(namespace) + value.slice(index + separator.length));
    if (separator != ":" && !/[:/?#]/.test(prefix)) throw new TypeError(`Unknown prefix: ${prefix}`);
  }
  return resolveIRIReference(value, base);
}
function shortenIRI(value, entries, separator, canonicalize = (value2) => value2) {
  value = canonicalize(value);
  for (const [prefix, iri] of entries) {
    const namespace = canonicalize(iri);
    if (value.startsWith(namespace)) {
      namespaceIRI(iri);
      return prefix + separator + value.slice(namespace.length);
    }
  }
  return value;
}
function relativeIRI(value, base, separator = "$") {
  const target = parts(value, true);
  if (base == null) return value;
  const origin = parts(base, true);
  if (target.scheme !== origin.scheme || target.authority !== origin.authority) return value;
  const suffix = (target.query ?? "") + (target.fragment ?? "");
  const candidates = [];
  if (target.path == origin.path) {
    if (target.query == origin.query) candidates.push(target.fragment ?? "");
    if (target.query !== void 0) candidates.push(suffix);
  }
  if (origin.authority !== void 0 || origin.path.startsWith("/")) {
    const directory = origin.authority !== void 0 && !origin.path ? "/" : origin.path.slice(0, origin.path.lastIndexOf("/") + 1);
    const from2 = directory.split("/").slice(0, -1);
    const to = target.path.split("/");
    let common = 0;
    while (common < from2.length && common < to.length - 1 && from2[common] == to[common]) common++;
    let path2 = "../".repeat(from2.length - common) + to.slice(common).join("/");
    if (!path2 || path2.startsWith("/") || path2.split("/")[0].includes(":") || path2.split("/")[0].includes(separator)) path2 = "./" + path2;
    candidates.push(path2 + suffix);
    if (target.path.startsWith("/") && !target.path.startsWith("//")) candidates.push(target.path + suffix);
  }
  return candidates.filter((candidate) => {
    try {
      return resolveIRIReference(candidate, base) === value;
    } catch {
      return false;
    }
  }).sort((a, b) => a.length - b.length)[0] ?? value;
}
var pnBase = "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}";
var pnChars = pnBase + "0-9_\\-\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var prefixPattern = new RegExp(`^(?:[${pnBase}](?:[${pnChars}.]*[${pnChars}])?)?$`, "u");
var firstLocal = new RegExp(`^[${pnBase}_:0-9]$`, "u");
var restLocal = new RegExp(`^[${pnChars}:]$`, "u");
function turtlePrefixedIRI(value, entries) {
  for (const [prefix, namespace] of entries) {
    if (!prefixPattern.test(prefix) || !value.startsWith(namespace)) continue;
    const local2 = Array.from(value.slice(namespace.length));
    let escaped = "";
    let valid = true;
    for (let i = 0; i < local2.length; i++) {
      const char = local2[i];
      if (char == "%" && /^[0-9a-f]{2}$/i.test(local2.slice(i + 1, i + 3).join(""))) {
        escaped += local2.slice(i, i + 3).join("");
        i += 2;
      } else if ((i ? restLocal : firstLocal).test(char) || char == "." && i && i < local2.length - 1) escaped += char;
      else if ("_~.-!$&'()*+,;=/?#@%".includes(char)) escaped += "\\" + char;
      else {
        valid = false;
        break;
      }
    }
    if (valid) return prefix + ":" + escaped;
  }
  return null;
}

// node_modules/@muze-nl/oldm-core/src/oldm.mjs
function* orderedPrefixes(context) {
  for (const prefix of context.prefixOrder) {
    yield [prefix, context.prefixes[prefix]];
  }
}
function oldm(options) {
  return new Context(options);
}
var rdfType = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var rdfFirst = "http://www.w3.org/1999/02/22-rdf-syntax-ns#first";
var rdfRest = "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest";
var aliases = {
  "http://schema.org/": "https://schema.org/"
};
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
  schema: "https://schema.org/",
  solid: "http://www.w3.org/ns/solid/terms#",
  stat: "http://www.w3.org/ns/posix/stat#",
  turtle: "http://www.w3.org/ns/iana/media-types/text/turtle#",
  vcard: "http://www.w3.org/2006/vcard/ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#"
};
function literal(value, options = {}) {
  let result;
  if (typeof value == "string" || value instanceof String) {
    result = new String(value);
  } else if (typeof value == "number" || value instanceof Number) {
    result = new Number(value);
  } else {
    throw new TypeError("literal expects a string or number");
  }
  const type = options.type ?? value?.type;
  const language = options.language ?? value?.language;
  if (type !== void 0) {
    result.type = absoluteIRI(type);
  }
  if (language !== void 0) {
    result.language = language;
  }
  return result;
}
function one(values3, whichOne = "last") {
  let result = values3;
  if (Array.isArray(values3)) {
    if (whichOne == "last") {
      result = values3[values3.length - 1];
    } else if (whichOne == "first") {
      result = values3[0];
    } else if (typeof whichOne == "function") {
      result = whichOne(values3);
    } else {
      throw new Error("Unknown value for whichOne parameter");
    }
  }
  return result;
}
function many(values3) {
  if (Array.isArray(values3)) {
    return values3;
  }
  if (values3 == null) {
    return [];
  }
  return [values3];
}
function first(...values3) {
  for (const value of values3) {
    if (value !== null && value !== void 0) {
      return value;
    }
  }
  return null;
}
function values(value) {
  if (Array.isArray(value) && !(value instanceof Collection)) {
    return value;
  }
  if (value === void 0) {
    return [];
  }
  return [value];
}
function mergeValue(existing, value, graph3 = null) {
  const result = values(existing);
  for (const item of values(value)) {
    const comparable = normalizeStringLiteral(item, graph3);
    if (!result.some((existingItem) => sameValue(normalizeStringLiteral(existingItem, graph3), comparable))) {
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
    return String(left) == String(right) && left?.type == right?.type && (left?.language ?? "") == (right?.language ?? "");
  }
  return false;
}
function normalizeStringLiteral(value, graph3) {
  if (!graph3 || typeof value != "string" && !(value instanceof String)) {
    return value;
  }
  const defaultType = value.language ? "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString" : "http://www.w3.org/2001/XMLSchema#string";
  return literal(value, {
    type: graph3.fullURI(value.type ?? defaultType),
    language: value.language ?? ""
  });
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
    const collection2 = new Collection(context);
    for (const item of value) {
      collection2.push(resolveValue(item, subjects, context));
    }
    return collection2;
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
    this.baseURI = options?.baseURI;
    this.aliases = { ...aliases, ...options?.aliases ?? {} };
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
  parse(input2, url2, type) {
    const { quads, prefixes: prefixes3 } = this.parser(input2, url2, type);
    if (prefixes3) {
      for (let prefix in prefixes3) {
        let prefixURL = prefixes3[prefix];
        prefixURL = resolveNamespaceReference(prefixURL, url2);
        if (!this.prefixes[prefix]) {
          this.prefixes[prefix] = prefixURL;
          this.prefixOrder.push(prefix);
        }
      }
    }
    return this.addGraph(new Graph(quads, url2, type, prefixes3, this, input2));
  }
  addGraph(graph3) {
    if (!graph3?.url) {
      throw new Error("Cannot add graph without a url");
    }
    const existing = this.graphsByUrl[graph3.url];
    if (existing) {
      const index = this.graphs.indexOf(existing);
      if (index >= 0) {
        this.graphs[index] = graph3;
      }
    } else {
      this.graphs.push(graph3);
    }
    this.graphsByUrl[graph3.url] = graph3;
    return graph3;
  }
  graph(url2) {
    return this.graphsByUrl[this.fullURI(url2)];
  }
  set(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).set(subject, predicate, value, { prefixPreference: "context" });
  }
  add(subject, predicate, value, options = {}) {
    return this.resolveGraph(subject, options).add(subject, predicate, value, { prefixPreference: "context" });
  }
  delete(subject, predicate = null, value = void 0, options = {}) {
    const graph3 = this.resolveGraph(subject, options);
    if (arguments.length < 3) {
      return graph3.delete(subject, predicate, void 0, { prefixPreference: "context", hasValue: false });
    }
    return graph3.delete(subject, predicate, value, { prefixPreference: "context", hasValue: true });
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
      const subjectSources = this.graphs.filter((graph3) => graph3.subjects[id2]);
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
  getGraphOption(graph3) {
    if (graph3 instanceof Graph) {
      if (!this.graphs.includes(graph3)) {
        throw new Error("The selected graph is not part of this context");
      }
      return graph3;
    }
    const resolved = this.graph(graph3);
    if (!resolved) {
      throw new Error(`Unknown graph: ${graph3}`);
    }
    return resolved;
  }
  documentURL(id2) {
    try {
      const url2 = new URL(id2);
      url2.hash = "";
      return url2.href;
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
    return this.graphs.filter((graph3) => {
      const graphSubject = graph3.subjects[id2];
      return graphSubject && this.subjectHasSource(graphSubject, predicate, value, arguments.length >= 3);
    });
  }
  sourcesForBlankNode(subject, predicate, value, hasValue) {
    const graph3 = subject.graph;
    if (!(graph3 instanceof Graph)) {
      return [];
    }
    if (this.subjectHasSource(subject, predicate, value, hasValue)) {
      return [graph3];
    }
    return [];
  }
  subjectHasSource(subject, predicate, value, hasValue) {
    if (!predicate) {
      return true;
    }
    const property = subject.graph instanceof Graph ? subject.graph.propertyName(predicate == "a" ? rdfType : this.fullURI(predicate), "context") : this.propertyName(predicate);
    if (!(property in subject)) {
      return false;
    }
    if (!hasValue) {
      return true;
    }
    if (property == "a" && subject.graph instanceof Graph) {
      const graph3 = subject.graph;
      value = graph3.fullURI(value?.id ?? value, null, "context");
    }
    return values(subject[property]).some((item) => sameSourceValue(item, value));
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
    const fullPredicate = predicate == "a" ? rdfType : this.fullURI(predicate);
    if (fullPredicate == rdfType) {
      return "a";
    }
    return shortenIRI(fullPredicate, orderedPrefixes(this), this.separator, (iri) => this.canonicalURI(iri));
  }
  get(shortID) {
    return this.subjects[this.fullURI(shortID)];
  }
  getSubjects() {
    const subjects = /* @__PURE__ */ Object.create(null);
    this.#buildingSubjects = true;
    try {
      for (const graph3 of this.graphs) {
        for (const id2 of Object.keys(graph3.subjects)) {
          if (!subjects[id2]) {
            subjects[id2] = this.contextSubject(new NamedNode(id2, this));
          }
        }
      }
      for (const graph3 of this.graphs) {
        for (const [id2, subject] of Object.entries(graph3.subjects)) {
          this.mergeSubject(subjects[id2], subject, subjects);
        }
      }
    } finally {
      this.#buildingSubjects = false;
    }
    return subjects;
  }
  mergeSubject(target, source2, subjects) {
    for (const [predicate, value] of Object.entries(source2)) {
      if (predicate == "id") {
        continue;
      }
      const contextPredicate = predicate == "a" ? "a" : this.propertyName(source2.graph.fullURI(predicate, null, "source"));
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
  fullURI(value, separator = null) {
    return expandIRI(value, (prefix) => Object.hasOwn(this.prefixes, prefix) ? this.prefixes[prefix] : void 0, separator ?? this.separator, this.baseURI);
  }
  shortURI(iri, separator = null) {
    return shortenIRI(absoluteIRI(iri), orderedPrefixes(this), separator ?? this.separator);
  }
  relativeURI(iri, base = this.baseURI) {
    return relativeIRI(iri, base, this.separator);
  }
  canonicalURI(uri) {
    uri = String(uri);
    for (const [alias, canonical] of Object.entries(this.aliases)) {
      if (uri.startsWith(alias)) {
        return canonical + uri.substring(alias.length);
      }
    }
    return uri;
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
    literal3.type = this.fullURI(shortType);
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
  constructor(quads, url2, mimetype, prefixes3, context, originalSource = null) {
    this.mimetype = mimetype;
    this.url = url2;
    this.baseURI = url2.split("#")[0];
    this.prefixes = prefixes3;
    this.context = context;
    this.originalSource = originalSource;
    this.subjects = /* @__PURE__ */ Object.create(null);
    this.#readCollections(quads);
    for (let quad2 of quads) {
      let subject;
      if (quad2.subject.termType == "BlankNode") {
        if (quad2.predicate.id == rdfFirst || quad2.predicate.id == rdfRest) {
          continue;
        }
        subject = this.addBlankNode(quad2.subject.id);
      } else {
        subject = this.addNamedNode(quad2.subject.id);
      }
      subject.addPredicate(quad2.predicate.id, quad2.object);
    }
    if (this.subjects[url2]) {
      this.primary = this.subjects[url2];
    } else {
      this.primary = null;
    }
    Object.defineProperty(this, "data", {
      get() {
        return Object.values(this.subjects);
      }
    });
  }
  #readCollections(quads) {
    const first2 = /* @__PURE__ */ new Map();
    const rest = /* @__PURE__ */ new Map();
    for (const quad2 of quads) {
      if (quad2.subject.termType != "BlankNode") {
        continue;
      }
      if (quad2.predicate.id == rdfFirst) {
        first2.set(quad2.subject.id, quad2.object);
      } else if (quad2.predicate.id == rdfRest) {
        rest.set(quad2.subject.id, quad2.object.id);
      }
    }
    const collections = /* @__PURE__ */ new Map();
    for (const quad2 of quads) {
      if (quad2.object.termType == "BlankNode" && quad2.predicate.id != rdfRest && first2.has(quad2.object.id)) {
        collections.set(quad2.object.id, this.addCollection(quad2.object.id));
      }
    }
    for (const [head, collection2] of collections) {
      const visited = /* @__PURE__ */ new Set();
      let id2 = head;
      while (first2.has(id2) && !visited.has(id2)) {
        visited.add(id2);
        collection2.push(this.getValue(first2.get(id2)));
        id2 = rest.get(id2);
      }
    }
  }
  addNamedNode(uri) {
    const absURI = this.fullURI(uri);
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
    const add2 = (prefixes3, order, skipKnownIRIs = false) => {
      for (const prefix of order) {
        if (!Object.prototype.hasOwnProperty.call(prefixes3, prefix)) {
          continue;
        }
        const iri = prefixes3[prefix];
        if (!seen.has(prefix) && (!skipKnownIRIs || !seenIRIs.has(iri))) {
          entries.push([prefix, iri]);
          seen.add(prefix);
          seenIRIs.add(iri);
        }
      }
      for (const prefix of Object.keys(prefixes3)) {
        const iri = prefixes3[prefix];
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
    const fullPredicate = predicate == "a" ? rdfType : this.fullURI(predicate, null, preference);
    if (predicate == "a" || fullPredicate == rdfType) {
      return "a";
    }
    return shortenIRI(fullPredicate, this.prefixEntries("source"), this.context.separator, (iri) => this.context.canonicalURI(iri));
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
    node[property] = mergeValue(node[property], newValue, this);
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
    const deleteValues = (property == "a" ? values(this.normalizeTypeValues(value, preference)) : values(this.normalizeValues(value, preference))).map((item) => normalizeStringLiteral(item, this));
    const remaining = values(node[property]).filter((item) => !deleteValues.some((deleteValue) => sameValue(normalizeStringLiteral(item, this), deleteValue)));
    if (remaining.length == values(node[property]).length) {
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
      const collection2 = new Collection(this);
      for (const item of value) {
        collection2.push(this.normalizeValue(item, preference));
      }
      return collection2;
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
    if ((value instanceof String || value instanceof Number) && value.type !== void 0) {
      const type = this.fullURI(value.type, null, preference);
      if (type !== value.type) {
        return literal(value, { type });
      }
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
    return this.fullURI(value, null, preference);
  }
  looksLikeURI(value, preference = "source") {
    if (typeof value != "string") {
      return false;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return true;
    }
    const index = value.indexOf(this.context.separator);
    return index >= 0 && this.prefixEntries(preference).some(([prefix]) => prefix == value.slice(0, index));
  }
  fullURI(value, separator = null, preference = "source") {
    return expandIRI(value, (prefix) => this.prefixEntries(preference).find(([name]) => name == prefix)?.[1], separator ?? this.context.separator, this.baseURI);
  }
  shortURI(iri, separator = null, preference = "source") {
    return shortenIRI(absoluteIRI(iri), this.prefixEntries(preference), separator ?? this.context.separator);
  }
  relativeURI(iri, base = this.baseURI) {
    return relativeIRI(iri, base, this.context.separator);
  }
  /**
   * This sets the type of a literal, usually one of the xsd types
   */
  setType(literal3, type) {
    const fullType = this.fullURI(type);
    return this.context.setType(literal3, fullType);
  }
  /**
   * This returns the type of a literal, or null
   */
  getType(literal3) {
    return this.context.getType(literal3);
  }
  setLanguage(value, language) {
    if (typeof value == "string" || typeof value == "number") {
      value = literal(value);
    }
    if (typeof value !== "object") {
      throw new Error("cannot set language on ", value);
    }
    value.language = language;
    return value;
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
        result = literal(result, { language });
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
  constructor(graph3) {
    Object.defineProperty(this, "graph", {
      value: graph3,
      writable: false,
      enumerable: false
    });
  }
  addPredicate(predicate, object) {
    if (predicate.id) {
      predicate = predicate.id;
    }
    if (predicate == rdfType) {
      this.addType(object.id);
    } else {
      const value = this.graph.getValue(object);
      predicate = this.graph.propertyName(predicate);
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
    type = this.graph.fullURI(type);
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
  constructor(id2, graph3) {
    super(graph3);
    Object.defineProperty(this, "id", {
      value: id2,
      writable: false,
      enumerable: true
    });
  }
};
var Collection = class extends Array {
  constructor(graph3) {
    super();
    Object.defineProperty(this, "graph", {
      value: graph3,
      writable: false,
      enumerable: false
    });
  }
};

// node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var oldm_n3_exports = {};
__export(oldm_n3_exports, {
  n3Parser: () => n3Parser,
  n3PatchWriter: () => n3PatchWriter,
  n3Writer: () => n3Writer
});

// node_modules/n3/src/IRIs.js
var RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var XSD = "http://www.w3.org/2001/XMLSchema#";
var SWAP = "http://www.w3.org/2000/10/swap/";
var IRIs_default = {
  xsd: {
    decimal: `${XSD}decimal`,
    boolean: `${XSD}boolean`,
    dateTime: `${XSD}dateTime`,
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

// node_modules/n3/src/N3Lexer.js
var { xsd } = IRIs_default;
var SPACE = 32;
var TAB = 9;
var LF = 10;
var CR = 13;
var HASH = 35;
var DOT = 46;
var COLON = 58;
var ZERO = 48;
var NINE = 57;
var PERCENT = 37;
var BACKSLASH = 92;
function isWhitespace(charCode) {
  return charCode === SPACE || charCode >= TAB && charCode <= CR || charCode >= 160 && (charCode === 160 || charCode === 5760 || charCode >= 8192 && charCode <= 8202 || charCode === 8232 || charCode === 8233 || charCode === 8239 || charCode === 8287 || charCode === 12288 || charCode === 65279);
}
var asciiDelimiters = new Uint8Array(128);
for (const char of `,;!^#()[]{}"'<> 	
\v\f\r`)
  asciiDelimiters[char.charCodeAt(0)] = 1;
function isDelimiter(charCode) {
  return charCode < 128 ? asciiDelimiters[charCode] === 1 : isWhitespace(charCode);
}
function canEndName(input2, pos, inputFinished) {
  let charCode = input2.charCodeAt(pos);
  if (charCode === DOT)
    charCode = input2.charCodeAt(++pos);
  if (pos >= input2.length)
    return inputFinished;
  return isDelimiter(charCode);
}
var stringEscapeReplacements = {
  "\\": "\\",
  "'": "'",
  '"': '"',
  "n": "\n",
  "r": "\r",
  "t": "	",
  "f": "\f",
  "b": "\b"
};
var localNameEscapeReplacements = {
  "_": "_",
  "~": "~",
  ".": ".",
  "-": "-",
  "!": "!",
  "$": "$",
  "&": "&",
  "'": "'",
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
var PREFIX_START = 1;
var LOCAL_START = 2;
var NAME_CHAR = 4;
var LOCAL_CHAR = 8;
var LOCAL_ESCAPE = 16;
var asciiNameClasses = new Uint8Array(128);
for (let charCode = 0; charCode < 128; charCode++) {
  const char = String.fromCharCode(charCode);
  const letter = char >= "A" && char <= "Z" || char >= "a" && char <= "z";
  const nameChar = letter || char === "_" || char === "-" || char >= "0" && char <= "9";
  asciiNameClasses[charCode] = (letter ? PREFIX_START : 0) | (nameChar && char !== "-" || char === ":" ? LOCAL_START : 0) | (nameChar ? NAME_CHAR : 0) | (nameChar || char === ":" ? LOCAL_CHAR : 0) | (char in localNameEscapeReplacements ? LOCAL_ESCAPE : 0);
}
function nameCharLength(input2, pos, charClass) {
  const charCode = input2.charCodeAt(pos);
  if (charCode < 128)
    return (asciiNameClasses[charCode] & charClass) !== 0 ? 1 : 0;
  if (charCode >= 55296 && charCode <= 56191) {
    const low = input2.charCodeAt(pos + 1);
    return low >= 56320 && low <= 57343 ? 2 : 0;
  }
  if (charClass >= NAME_CHAR && (charCode === 183 || charCode >= 768 && charCode <= 879 || charCode === 8255 || charCode === 8256))
    return 1;
  return charCode >= 192 && charCode <= 8191 && charCode !== 215 && charCode !== 247 && (charCode < 768 || charCode >= 880 && charCode !== 894) || charCode >= 8204 && charCode <= 8205 || charCode >= 8304 && charCode <= 8591 || charCode >= 11264 && charCode <= 12271 || charCode >= 12289 && charCode <= 55295 || charCode >= 63744 && charCode <= 64975 || charCode >= 65008 && charCode <= 65533 ? 1 : 0;
}
function isLocalEscape(charCode) {
  return charCode < 128 && (asciiNameClasses[charCode] & LOCAL_ESCAPE) !== 0;
}
function isHexDigit(charCode) {
  return charCode >= ZERO && charCode <= NINE || charCode >= 65 && charCode <= 70 || charCode >= 97 && charCode <= 102;
}
function skipPrefix(input2, pos) {
  let length = nameCharLength(input2, pos, PREFIX_START);
  while (length !== 0) {
    pos += length;
    const next = input2.charCodeAt(pos) === DOT ? pos + 1 : pos;
    const charCode = input2.charCodeAt(next);
    length = charCode < 128 ? (asciiNameClasses[charCode] & NAME_CHAR) !== 0 ? 1 : 0 : nameCharLength(input2, next, NAME_CHAR);
    if (length !== 0)
      pos = next;
  }
  return pos;
}
function skipLocalName(input2, pos) {
  let end = pos, charClass = LOCAL_START;
  while (true) {
    const charCode = input2.charCodeAt(pos);
    let length = charCode < 128 ? (asciiNameClasses[charCode] & charClass) !== 0 ? 1 : 0 : nameCharLength(input2, pos, charClass);
    if (length === 0 && charCode === PERCENT && isHexDigit(input2.charCodeAt(pos + 1)) && isHexDigit(input2.charCodeAt(pos + 2)))
      length = 3;
    else if (length === 0 && charCode === BACKSLASH && isLocalEscape(input2.charCodeAt(pos + 1)))
      length = 2;
    if (length !== 0) {
      end = pos += length;
      charClass = LOCAL_CHAR;
    } else if (charCode === DOT && charClass === LOCAL_CHAR)
      pos++;
    else
      return end;
  }
}
function skipPrefixedName(input2, pos, inputFinished) {
  const colon = skipPrefix(input2, pos);
  if (input2.charCodeAt(colon) !== COLON)
    return -1;
  const end = skipLocalName(input2, colon + 1);
  return canEndName(input2, end, inputFinished) ? end : -1;
}
function isValidCodePoint(charCode) {
  return charCode <= 1114111 && (charCode < 55296 || charCode > 57343);
}
var lineModeRegExps = {
  _iri: true,
  _unescapedIri: true,
  _simpleQuotedString: true,
  _langcode: true,
  _blank: true,
  _commentLine: true,
  _whitespace: true
};
var invalidRegExp = /$0^/;
var nonWhitespace = /\S*/y;
function execAt(regExp, input2, pos) {
  regExp.lastIndex = pos;
  return regExp.exec(input2);
}
function testAt(regExp, input2, pos) {
  regExp.lastIndex = pos;
  return regExp.test(input2);
}
function execAtEnd(regExp, input2, pos) {
  regExp.lastIndex = 0;
  return regExp.exec(`${input2.slice(pos)} `);
}
function isSeparatorCode(code) {
  return code === SPACE || code === TAB || code === LF || code === CR || code === HASH;
}
var reservedWords = /^(?:prefix|base|version|graph|forsome|forall|iri|a|true|false|has|is|of|id)$/i;
var MIN_RESCAN_LENGTH = 1024;
var N3Lexer = class {
  constructor(options) {
    this._iri = /<((?:[^ <>{}\\]|\\[uU])+)>[ \t]*/y;
    this._unescapedIri = /<([^\x00-\x20<>\\"\{\}\|\^\`]*)>[ \t]*/y;
    this._simpleQuotedString = /"([^"\\\r\n]*)"(?=[^"])/y;
    this._simpleApostropheString = /'([^'\\\r\n]*)'(?=[^'])/y;
    this._langcode = /@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9])/iy;
    this._variable = /\?(?:(?:[A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\-0-9:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?=[.,;!\^\s#()\[\]\{\}"'<>])/y;
    this._blank = /_:((?:[0-9A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:\.?[\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)(?:[ \t]+|(?=\.?[,;:!\^\s#()\[\]\{\}"'<>]))/y;
    this._number = /[\-+]?(?:(\d+\.\d*|\.?\d+)[eE][\-+]?\d+|(?=\.?\d)\d*(?:(\.)\d+)?)(?=\.?[,;:!\^\s#()\[\]\{\}"'<>])/y;
    this._boolean = /(?:true|false)(?=[.,;!\^\s#()\[\]\{\}"'<>])/y;
    this._atKeyword = /@[a-z]+(?=[\s#<:"'.])/iy;
    this._keyword = /(?:PREFIX|BASE|VERSION|GRAPH)(?=[\s#<"'])/iy;
    this._n3Verb = /(?:has|is|of)(?=[\s#()\[\]\{\}"'<>?_+\-0-9])/y;
    this._n3Id = /id(?=[\s#<])/y;
    this._shortPredicates = /a(?=[\s#()\[\]\{\}"'<>])/y;
    this._commentLine = /[ \t]*#([^\n\r]*)(?:\r\n|\n|\r)([ \t]*)/y;
    this._whitespace = /[ \t]+/y;
    options = options || {};
    this._isImpliedBy = options.isImpliedBy;
    if (this._lineMode = !!options.lineMode) {
      this._n3Mode = false;
      for (const key in this) {
        if (!(key in lineModeRegExps) && this[key] instanceof RegExp)
          this[key] = invalidRegExp;
      }
      this._keyword = /VERSION(?=[\s#<"])/y;
    } else {
      this._n3Mode = options.n3 !== false;
    }
    this._directive = null;
    if (options.directives && options.directives.length !== 0) {
      for (const name of options.directives) {
        if (!/^[a-z]+$/i.test(name) || reservedWords.test(name))
          throw new Error(`Invalid directive name: "${name}"`);
      }
      this._directive = new RegExp(`(?:${options.directives.join("|")})(?=[\\s#<])`, "iy");
      this._directiveMaxLength = Math.max(...options.directives.map((name) => name.length));
      this._directiveStarts = options.directives.map((name) => name[0].toLowerCase() + name[0].toUpperCase()).join("");
    }
    this.comments = !!options.comments;
    this._literalClosingPos = 0;
  }
  // ## Private methods
  // ### `_tokenizeToEnd` tokenizes as for as possible, emitting tokens through the callback
  _tokenizeToEnd(callback, inputFinished) {
    const input2 = this._input;
    let pos = 0;
    let currentLineLength = this._linePosition + input2.length;
    while (true) {
      while (true) {
        let charCode = input2.charCodeAt(pos), separatorLength = 0;
        if (charCode === SPACE || charCode === TAB) {
          const next = input2.charCodeAt(pos + 1);
          separatorLength = next === SPACE || next === TAB ? execAt(this._whitespace, input2, pos)[0].length : 1;
          charCode = input2.charCodeAt(pos + separatorLength);
        }
        if (charCode === HASH) {
          const comment = execAt(this._commentLine, input2, pos);
          if (comment) {
            const commentLength = comment[0].length;
            if (!inputFinished && pos + commentLength === input2.length && input2.charCodeAt(input2.length - 1) === CR)
              return this._suspend(input2, pos, currentLineLength);
            if (this.comments)
              emitComment(comment[1], this._line, currentLineLength - (input2.length - pos) + separatorLength);
            pos += commentLength;
            currentLineLength = input2.length - pos + comment[2].length;
            this._line++;
          } else {
            pos += separatorLength;
            if (!inputFinished)
              return this._suspend(input2, pos, currentLineLength);
            if (this.comments)
              emitComment(input2.slice(pos + 1), this._line, currentLineLength - (input2.length - pos));
            pos = input2.length;
            break;
          }
        } else if (charCode === LF || charCode === CR) {
          if (!inputFinished && charCode === CR && pos + separatorLength + 1 === input2.length)
            return this._suspend(input2, pos, currentLineLength);
          separatorLength += charCode === CR && input2.charCodeAt(pos + separatorLength + 1) === LF ? 2 : 1;
          let indentationLength = 0;
          const next = input2.charCodeAt(pos + separatorLength);
          if (next === SPACE || next === TAB) {
            const following = input2.charCodeAt(pos + separatorLength + 1);
            indentationLength = following === SPACE || following === TAB ? execAt(this._whitespace, input2, pos + separatorLength)[0].length : 1;
          }
          pos += separatorLength + indentationLength;
          currentLineLength = input2.length - pos + indentationLength;
          this._line++;
        } else {
          pos += separatorLength;
          break;
        }
      }
      if (pos >= input2.length) {
        if (inputFinished && this._previousMarker === "^^")
          return reportSyntaxError(this, input2, pos);
        this._linePosition = currentLineLength;
        if (inputFinished) {
          emitToken("eof", "", "", this._line, currentLineLength, 0);
          return this._input = null;
        }
        return this._input = "";
      }
      const line = this._line, firstChar = input2[pos];
      let type = "", value = "", prefix = "", match = null, matchLength = 0, lexicalLength = 0, finalLineLength = 0, inconclusive = false, tripleQuoted = false;
      switch (firstChar) {
        case "^":
          if (this._previousMarker === "^^")
            return reportSyntaxError(this, input2, pos);
          if (input2.length - pos < 3)
            break;
          else if (input2[pos + 1] === "^") {
            this._previousMarker = "^^";
            pos += 2;
            if (input2[pos] !== "<") {
              if (isSeparatorCode(input2.charCodeAt(pos)))
                continue;
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
          if (match = execAt(this._unescapedIri, input2, pos)) {
            type = "IRI", value = match[1];
            lexicalLength = match[1].length + 2;
          } else if (match = execAt(this._iri, input2, pos)) {
            value = this._unescape(match[1], stringEscapeReplacements);
            if (value === null || illegalIriChars.test(value))
              return reportSyntaxError(this, input2, pos);
            type = "IRI";
            lexicalLength = match[1].length + 2;
          } else if (input2.length - pos > 2 && input2[pos + 1] === "<" && input2[pos + 2] === "(")
            type = "<<(", matchLength = 3;
          else if (!this._lineMode && input2.length - pos > (inputFinished ? 1 : 2) && input2[pos + 1] === "<")
            type = "<<", matchLength = 2;
          else if (this._n3Mode && input2.length - pos > 1 && input2[pos + 1] === "=") {
            matchLength = 2;
            if (this._isImpliedBy) type = "abbreviation", value = "<";
            else type = "inverse", value = ">";
          } else if (this._n3Mode && input2.length - pos > 1 && input2[pos + 1] === "-")
            type = "inversePredicate", matchLength = 2;
          break;
        case ">":
          if (input2.length - pos > 1 && input2[pos + 1] === ">")
            type = ">>", matchLength = 2;
          break;
        case "_":
          if ((match = execAt(this._blank, input2, pos)) || inputFinished && (match = execAtEnd(this._blank, input2, pos))) {
            type = "blank", prefix = "_", value = match[1];
            lexicalLength = match[1].length + 2;
          }
          break;
        case '"':
          if (match = execAt(this._simpleQuotedString, input2, pos))
            value = match[1];
          else {
            ({ value, matchLength, finalLineLength, tripleQuoted } = this._parseLiteral(input2, pos));
            if (value === null)
              return reportSyntaxError(this, input2, pos);
          }
          if (match !== null || matchLength !== 0) {
            type = "literal";
            this._literalClosingPos = 0;
          }
          break;
        case "'":
          if (!this._lineMode) {
            if (match = execAt(this._simpleApostropheString, input2, pos))
              value = match[1];
            else {
              ({ value, matchLength, finalLineLength, tripleQuoted } = this._parseLiteral(input2, pos));
              if (value === null)
                return reportSyntaxError(this, input2, pos);
            }
            if (match !== null || matchLength !== 0) {
              type = "literal";
              this._literalClosingPos = 0;
            }
          }
          break;
        case "?":
          if (this._n3Mode && (match = execAt(this._variable, input2, pos)))
            type = "var", value = match[0];
          break;
        case "@":
          if (this._previousMarker === "literal" && (match = execAt(this._langcode, input2, pos)) && match[1] !== "version") {
            const end = pos + match[0].length;
            if (!inputFinished && input2[end] === "-" && input2[end + 1] !== "-")
              match = null;
            else
              type = "langcode", value = match[1];
          } else if (match = execAt(this._atKeyword, input2, pos))
            type = match[0];
          break;
        case ".":
          if (input2.length - pos === 1 ? inputFinished : input2[pos + 1] < "0" || input2[pos + 1] > "9") {
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
          if (input2[pos + 1] === "-") {
            if (this._previousMarker === "langcode") {
              if (input2.startsWith("--ltr", pos))
                type = "dircode", value = "ltr", matchLength = 5;
              else if (input2.startsWith("--rtl", pos))
                type = "dircode", value = "rtl", matchLength = 5;
            }
            break;
          }
          if (match = execAt(this._number, input2, pos) || inputFinished && (match = execAtEnd(this._number, input2, pos))) {
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
          if (match = execAt(this._keyword, input2, pos))
            type = match[0].toUpperCase();
          else
            inconclusive = true;
          break;
        case "f":
        case "t":
          if (testAt(this._boolean, input2, pos))
            type = "literal", value = firstChar === "t" ? "true" : "false", prefix = xsd.boolean, matchLength = value.length;
          else
            inconclusive = true;
          break;
        case "a":
          if (testAt(this._shortPredicates, input2, pos))
            type = "abbreviation", value = "a", matchLength = 1;
          else
            inconclusive = true;
          break;
        case "h":
        case "o":
          if (this._n3Mode && (match = this._matchN3Verb(input2, pos, inputFinished)))
            type = match[0];
          else
            inconclusive = true;
          break;
        case "i":
          if (this._n3Mode && testAt(this._n3Id, input2, pos))
            type = "id", matchLength = 2;
          else if (this._n3Mode && (match = this._matchN3Verb(input2, pos, inputFinished)))
            type = match[0];
          else
            inconclusive = true;
          break;
        case "=":
          if (this._n3Mode && input2.length - pos > 1) {
            type = "abbreviation";
            if (input2[pos + 1] !== ">")
              matchLength = 1, value = "=";
            else
              matchLength = 2, value = ">";
          }
          break;
        case "!":
          if (!this._n3Mode)
            break;
        case ")":
          if (!inputFinished && (input2.length - pos === 1 || input2.length - pos === 2 && input2[pos + 1] === ">")) {
            break;
          }
          if (input2.length - pos > 2 && input2[pos + 1] === ">" && input2[pos + 2] === ">") {
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
          if (!this._lineMode && input2.length - pos >= 2) {
            if (input2[pos + 1] === "|")
              type = "{|", matchLength = 2;
            else
              type = firstChar, matchLength = 1;
          }
          break;
        case "|":
          if (input2.length - pos >= 2 && input2[pos + 1] === "}")
            type = "|}", matchLength = 2;
          break;
        default:
          inconclusive = true;
      }
      if (inconclusive) {
        let end;
        if ((this._previousMarker === "@prefix" || this._previousMarker === "PREFIX") && input2.charCodeAt(end = skipPrefix(input2, pos)) === COLON && end + 1 < input2.length && (input2[end + 1] === "#" || input2[end + 1] === "<" || isWhitespace(input2.charCodeAt(end + 1)))) {
          type = "prefix", value = input2.slice(pos, end);
          matchLength = end + 1 - pos;
        } else if (this._directive !== null && this._directiveStarts.includes(firstChar) && ((match = execAt(this._directive, input2, pos)) || inputFinished && input2.length - pos <= this._directiveMaxLength && (match = execAtEnd(this._directive, input2, pos))))
          type = match[0].toUpperCase();
        else if (!this._lineMode && (end = skipPrefixedName(input2, pos, inputFinished)) >= 0) {
          const colon = input2.indexOf(":", pos);
          type = "prefixed", prefix = input2.slice(pos, colon);
          value = this._unescape(input2.slice(colon + 1, end), localNameEscapeReplacements);
          matchLength = end - pos;
        }
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
        if (inputFinished || !input2.startsWith("'''", pos) && !input2.startsWith('"""', pos) && /\n|\r/.test(input2.slice(pos)))
          return reportSyntaxError(this, input2, pos);
        else
          return this._suspend(input2, pos, currentLineLength);
      }
      const length = matchLength || match[0].length;
      const start = currentLineLength - (input2.length - pos);
      let token;
      if (finalLineLength) {
        token = {
          type,
          value,
          prefix,
          line,
          start,
          end: finalLineLength,
          endLine: this._line,
          tripleQuoted
        };
        callback(null, token);
      } else if (tripleQuoted) {
        token = { type, value, prefix, line, start, end: start + length, tripleQuoted };
        callback(null, token);
      } else
        token = emitToken(type, value, prefix, line, start, lexicalLength || length);
      this.previousToken = token;
      this._previousMarker = type === "literal" && (this._previousMarker === "VERSION" || this._previousMarker === "@version") ? "version" : type;
      pos = Math.min(pos + length, input2.length);
      if (finalLineLength)
        currentLineLength = input2.length - pos + finalLineLength;
    }
    function emitComment(value, line, start) {
      callback(null, {
        type: "comment",
        value,
        prefix: "",
        line,
        start,
        end: start + value.length + 1
      });
    }
    function emitToken(type, value, prefix, line, start, length) {
      const token = { type, value, prefix, line, start, end: start + length };
      callback(null, token);
      return token;
    }
    function reportSyntaxError(self, input3, pos2) {
      callback(self._syntaxError(execAt(nonWhitespace, input3, pos2)[0]));
    }
  }
  // ### `_suspend` keeps the unconsumed input until more input arrives
  _suspend(input2, pos, currentLineLength) {
    this._linePosition = currentLineLength - (input2.length - pos);
    return this._input = input2.slice(pos);
  }
  // ### `_matchN3Verb` matches an N3 verb unless the input is a longer prefixed name
  _matchN3Verb(input2, pos, inputFinished) {
    const verb = execAt(this._n3Verb, input2, pos);
    if (!verb)
      return null;
    const next = input2[pos + verb[0].length];
    if (next !== "-" && next !== "_" && (next < "0" || next > "9") && next !== "\u1680" && next !== "\uFEFF")
      return verb;
    if (skipPrefixedName(input2, pos, true) >= 0)
      return null;
    if (!inputFinished && skipPrefix(input2, pos) === input2.length)
      return null;
    return verb;
  }
  // ### `_unescape` replaces N3 escape codes by their corresponding characters,
  // allowing only the fixed escape sequences from the given replacement table
  _unescape(item, replacements) {
    let backslash = item.indexOf("\\");
    if (backslash < 0)
      return item;
    let result = "", start = 0;
    while (backslash >= 0 && backslash + 1 < item.length) {
      const escapedChar = item[backslash + 1];
      let end = backslash + 2, replacement;
      if (escapedChar === "u" || escapedChar === "U") {
        end += escapedChar === "u" ? 4 : 8;
        if (end > item.length)
          return null;
        let charCode = 0;
        for (let i = backslash + 2; i < end; i++) {
          let digit = item.charCodeAt(i);
          if (digit >= 48 && digit <= 57)
            digit -= 48;
          else if (digit >= 65 && digit <= 70)
            digit -= 65 - 10;
          else if (digit >= 97 && digit <= 102)
            digit -= 97 - 10;
          else
            return null;
          charCode = charCode * 16 + digit;
        }
        if (!isValidCodePoint(charCode))
          return null;
        replacement = String.fromCodePoint(charCode);
      } else {
        if (!(escapedChar in replacements))
          return null;
        replacement = replacements[escapedChar];
      }
      result += item.slice(start, backslash) + replacement;
      start = end;
      backslash = item.indexOf("\\", start);
    }
    return result + item.slice(start);
  }
  // ### `_parseLiteral` parses a literal at the given position into an unescaped value
  _parseLiteral(input2, pos) {
    if (input2.length - pos >= 3) {
      const quote = input2[pos];
      const openingLength = input2[pos + 1] === quote && input2[pos + 2] === quote ? 3 : 1;
      let opening = quote;
      if (openingLength === 3)
        opening = quote === '"' ? '"""' : "'''";
      let closingPos = pos + Math.max(this._literalClosingPos, openingLength);
      while ((closingPos = input2.indexOf(opening, closingPos)) > pos) {
        let backslashCount = 0;
        while (input2[closingPos - backslashCount - 1] === "\\")
          backslashCount++;
        if (backslashCount % 2 === 0) {
          const raw2 = input2.substring(pos + openingLength, closingPos), lines = raw2.split(/\r\n|\r|\n/), lineCount = lines.length - 1;
          const matchLength = closingPos - pos + openingLength;
          if (openingLength === 1 && lineCount !== 0 || openingLength === 3 && this._lineMode)
            break;
          this._line += lineCount;
          const finalLineLength = lineCount === 0 ? 0 : lines[lines.length - 1].length + openingLength;
          return {
            value: this._unescape(raw2, stringEscapeReplacements),
            matchLength,
            finalLineLength,
            tripleQuoted: openingLength === 3
          };
        }
        closingPos++;
      }
      this._literalClosingPos = input2.length - pos - openingLength + 1;
    }
    return { value: "", matchLength: 0, finalLineLength: 0, tripleQuoted: false };
  }
  // ### `_tryTokenizeToEnd` tokenizes as far as possible, reporting failures through the callback
  _tryTokenizeToEnd(callback, inputFinished) {
    let callbackError;
    try {
      this._tokenizeToEnd((error4, token) => {
        try {
          return callback(error4, token);
        } catch (thrown) {
          throw callbackError = thrown;
        }
      }, inputFinished);
    } catch (error4) {
      if (error4 === callbackError || !(error4 instanceof RangeError))
        throw error4;
      callback(this._syntaxError(null, `Token too long on line ${this._line}.`));
    }
  }
  // ### `_syntaxError` creates a syntax error for the given issue
  _syntaxError(issue, message2 = `Unexpected "${issue}" on line ${this._line}.`) {
    this._input = null;
    const err = new Error(message2);
    err.context = {
      token: void 0,
      line: this._line,
      previousToken: this.previousToken
    };
    return err;
  }
  // ### `_startTokenization` resets the lexer state for a new input
  _startTokenization() {
    this._line = 1;
    this._linePosition = 0;
    this._previousMarker = void 0;
    this.previousToken = void 0;
    this._literalClosingPos = 0;
    this._input = void 0;
    return this._tokenization = {};
  }
  // ### `_tokenizeString` synchronously emits the tokens of a complete string through the callback,
  // so that the caller can consume each token without the lexer collecting them all first
  _tokenizeString(input2, callback) {
    this._startTokenization();
    this._input = this._readStartingBom(input2);
    this._tryTokenizeToEnd(callback, true);
  }
  // ### Strips off any starting UTF BOM mark.
  _readStartingBom(input2) {
    if (input2.startsWith("\uFEFF")) {
      this._linePosition = 1;
      return input2.slice(1);
    }
    return input2;
  }
  // ## Public methods
  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  // Token ranges use one-based lines and zero-based, end-exclusive UTF-16 columns.
  // Separator whitespace counts towards the next token's start, outside either range.
  // Multiline tokens also have endLine; their end column is relative to that line.
  tokenize(input2, callback) {
    const tokenization = this._startTokenization();
    if (typeof input2 === "string") {
      this._input = this._readStartingBom(input2);
      if (typeof callback === "function")
        queueMicrotask(() => {
          if (this._tokenization === tokenization)
            this._tryTokenizeToEnd(callback, true);
        });
      else {
        const tokens = [];
        let error4;
        this._tryTokenizeToEnd((e, t) => e ? error4 = e : tokens.push(t), true);
        if (error4) throw error4;
        return tokens;
      }
    } else {
      let decoder3, retryLength = 0;
      if (typeof input2.setEncoding === "function")
        input2.setEncoding("utf8");
      input2.on("data", (data) => {
        if (this._tokenization === tokenization && this._input !== null && data.length !== 0) {
          if (typeof data !== "string") {
            decoder3 = decoder3 || new TextDecoder("utf-8", { ignoreBOM: true });
            if (!(data = decoder3.decode(data, { stream: true })))
              return;
          }
          if (typeof this._input === "undefined")
            this._input = this._readStartingBom(data);
          else
            this._input += data;
          if (this._input.length >= retryLength) {
            this._tryTokenizeToEnd(callback, false);
            retryLength = this._input !== null && this._input.length > MIN_RESCAN_LENGTH ? 2 * this._input.length : 0;
          }
        }
      });
      input2.on("end", () => {
        if (this._tokenization === tokenization && this._input !== null) {
          const rest = decoder3 ? decoder3.decode() : "";
          if (rest)
            this._input = typeof this._input === "string" ? this._input + rest : rest;
          if (typeof this._input === "string")
            this._tryTokenizeToEnd(callback, true);
        }
      });
      input2.on("error", (error4) => {
        if (this._tokenization === tokenization)
          callback(error4);
      });
    }
  }
};

// node_modules/n3/src/N3DataFactory.js
var { rdf, xsd: xsd2 } = IRIs_default;
var DEFAULTGRAPH;
var _blankNodeCounter = 0;
var EMPTY_IRI_ID = "<>";
var DataFactory = {
  namedNode,
  blankNode,
  variable,
  literal: literal2,
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
      return this.id === other.id && this.termType === other.termType;
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
  // ### Creates a named node
  /**
   * @deprecated Create named nodes through a data factory instead
   * (`DataFactory.namedNode(iri)`), so that term validation can be applied;
   * the constructor assumes an already-validated IRI.
   */
  constructor(iri) {
    if (iri !== "")
      super(iri);
    else {
      super(EMPTY_IRI_ID);
      Object.defineProperty(this, "value", { value: "" });
    }
  }
  // ### The term type of this term
  get termType() {
    return "NamedNode";
  }
};
var Literal = class _Literal extends Term {
  // ### Creates a literal
  /**
   * @deprecated Create literals through a data factory instead
   * (`DataFactory.literal(value, languageOrDatatype)`), so that term
   * validation can be applied; the constructor takes the internal
   * id representation and assumes it is already valid.
   */
  constructor(id2) {
    super(id2);
  }
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
    const dirPos = id2[endPos + 1] === "@" ? id2.lastIndexOf("--") : -1;
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
  // ### Creates a blank node
  /**
   * @deprecated Create blank nodes through a data factory instead
   * (`DataFactory.blankNode(name)`), so that term validation can be applied;
   * the constructor assumes an already-validated name.
   */
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
  // ### Creates a variable
  /**
   * @deprecated Create variables through a data factory instead
   * (`DataFactory.variable(name)`), so that term validation can be applied;
   * the constructor assumes an already-validated name.
   */
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
  // ### Creates the default graph
  /**
   * @deprecated Obtain the default graph through a data factory instead
   * (`DataFactory.defaultGraph()`).
   */
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
  // ### Creates a quad
  /**
   * @deprecated Create quads through a data factory instead
   * (`DataFactory.quad(subject, predicate, object, graph)`), so that term
   * validation can be applied; the constructor assumes already-validated terms.
   */
  constructor(subject, predicate, object, graph3) {
    super("");
    this._subject = subject;
    this._predicate = predicate;
    this._object = object;
    this._graph = graph3 || DEFAULTGRAPH;
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
function literal2(value, languageOrDataType) {
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
        datatype = Number.isInteger(value) && Math.abs(value) < 1e21 ? xsd2.integer : xsd2.double;
      else {
        datatype = xsd2.double;
        if (!Number.isNaN(value))
          value = value > 0 ? "INF" : "-INF";
      }
    } else if (typeof value === "bigint")
      datatype = xsd2.integer;
    else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      datatype = xsd2.dateTime;
      value = value.toISOString();
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
function quad(subject, predicate, object, graph3) {
  return new Quad(subject, predicate, object, graph3);
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
      return literal2(term.value, !term.language ? term.datatype : term.direction ? { language: term.language, direction: term.direction } : term.language);
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

// node_modules/n3/src/N3Parser.js
var blankNodePrefix = 0;
var dotSegments = /(^|\/)\.\.?($|[/#?])/;
var pathDotSegments = /^[^?#]*(?:^|\/)\.\.?(?:$|[/#?])/;
var N3Parser = class _N3Parser {
  constructor(options) {
    this._contextStack = [];
    this._graph = null;
    options = options || {};
    this._setBase(options.baseIRI);
    options.factory && initDataFactory(this, options.factory);
    const format = typeof options.format === "string" ? options.format.match(/(?:^|\W)(\w*)$/)[1].toLowerCase() : "", isTurtle = /turtle/.test(format), isTriG = /trig/.test(format), isNTriples = /triple/.test(format), isNQuads = /quad/.test(format), isN3 = this._n3Mode = /n3/.test(format), isLineMode = isNTriples || isNQuads;
    this._emitCurrent = this._emit;
    if (isN3) {
      this._createQuad = this._createQuadInDirection;
      this._emit = this._emitInDirection;
      this._emitCurrent = this._emitCurrentInDirection;
    }
    if (!(this._supportsNamedGraphs = !(isTurtle || isN3)))
      this._readPredicateOrNamedGraph = this._readPredicate;
    this._supportsQuads = !(isTurtle || isTriG || isNTriples || isN3);
    this._isImpliedBy = options.isImpliedBy;
    this._implicitEmptyPrefix = !!options.implicitEmptyPrefix;
    this._emptyFormulaAsTrue = !!options.emptyFormulaAsTrue;
    if (isLineMode)
      this._resolveRelativeIRI = (iri) => {
        return null;
      };
    this._blankNodePrefix = typeof options.blankNodePrefix !== "string" ? "" : options.blankNodePrefix.replace(/^(?!_:)/, "_:");
    this._directives = null;
    if (options.directives) {
      this._directives = /* @__PURE__ */ Object.create(null);
      for (const name of options.directives)
        this._directives[`@${name.toLowerCase()}`] = this._directives[name.toUpperCase()] = name;
    }
    this._lexer = options.lexer || new N3Lexer({
      lineMode: isLineMode,
      n3: isN3,
      isImpliedBy: this._isImpliedBy,
      directives: options.directives
    });
    this._explicitQuantifiers = !!options.explicitQuantifiers;
    this._formulaScopedBlankNodes = !!options.formulaScopedBlankNodes;
    this._parseUnsupportedVersions = !!options.parseUnsupportedVersions;
    this._version = options.version;
    const maxTripleTermDepth = options.maxTripleTermDepth;
    this._maxTripleTermDepth = maxTripleTermDepth === Infinity || Number.isInteger(maxTripleTermDepth) && maxTripleTermDepth >= 0 ? maxTripleTermDepth : 1024;
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
      this._basePathHasDotSegments = false;
    } else {
      const fragmentPos = baseIRI.indexOf("#");
      if (fragmentPos >= 0)
        baseIRI = baseIRI.substr(0, fragmentPos);
      this._base = baseIRI;
      const queryPos = baseIRI.indexOf("?");
      const path2 = queryPos < 0 ? baseIRI : baseIRI.substr(0, queryPos);
      this._basePath = baseIRI.indexOf("/") < 0 ? baseIRI : path2.substr(0, path2.lastIndexOf("/") + 1);
      const base = baseIRI;
      baseIRI = baseIRI.match(/^(?:([a-z][a-z0-9+.-]*:))?(\/\/[^\/?#]*)?/i);
      this._baseRoot = baseIRI[0];
      this._baseScheme = baseIRI[1];
      if (baseIRI[2] !== void 0 && (base.length === this._baseRoot.length || base[this._baseRoot.length] === "?"))
        this._basePath = `${this._baseRoot}/`;
      this._basePathHasDotSegments = dotSegments.test(this._basePath);
    }
  }
  // ### `_enterTripleTerm` stores the current parsing context when entering a triple term,
  // failing if triple terms nest deeper than the maximum depth
  _enterTripleTerm(type, subject, predicate, token) {
    if (this._tripleTermDepth >= this._maxTripleTermDepth) {
      this._error(`Triple terms nested deeper than ${this._maxTripleTermDepth} level${this._maxTripleTermDepth === 1 ? "" : "s"}`, token);
      return false;
    }
    this._tripleTermDepth++;
    this._saveContext(type, this._graph, subject, predicate, null);
    this._graph = null;
    return true;
  }
  // ### `_saveContext` stores the current parsing context
  // when entering a new scope (list, blank node, formula)
  _saveContext(type, graph3, subject, predicate, object) {
    if (!this._n3Mode) {
      this._contextStack.push({ type, subject, predicate, object, graph: graph3 });
      return;
    }
    const context = {
      type,
      subject,
      predicate,
      object,
      graph: graph3,
      inverse: this._inversePredicate,
      expectOf: this._expectOf,
      blankPrefix: this._prefixes._,
      prefixChanges: this._prefixChanges,
      quantifiedChanges: this._quantifiedChanges,
      emptyFormula: this._emptyFormula
    };
    if (type === "formula") {
      context.base = [
        this._base,
        this._basePath,
        this._baseRoot,
        this._baseScheme,
        this._basePathHasDotSegments
      ];
      this._prefixChanges = [];
    }
    this._contextStack.push(context);
    this._inversePredicate = false;
    this._expectOf = false;
    if (!this._formulaScopedBlankNodes || type === "formula") {
      this._prefixes._ = this._graph ? `${this._graph.value}.` : ".";
      this._quantifiedChanges = [];
    }
    if (type === "formula") {
      this._subject = null;
      this._emptyFormula = true;
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
      this._expectOf = context.expectOf;
      if (type === "formula")
        [
          this._base,
          this._basePath,
          this._baseRoot,
          this._baseScheme,
          this._basePathHasDotSegments
        ] = context.base;
      if (this._prefixChanges !== context.prefixChanges) {
        undoChanges(this._prefixes, this._prefixChanges);
        this._prefixChanges = context.prefixChanges;
      }
      this._prefixes._ = context.blankPrefix;
      if (this._quantifiedChanges !== context.quantifiedChanges) {
        undoChanges(this._quantified, this._quantifiedChanges);
        this._quantifiedChanges = context.quantifiedChanges;
      }
      this._emptyFormula = context.emptyFormula;
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
      // Otherwise, the next token must be a subject, unless it is an additional directive
      default:
        if (this._directives !== null && token.type in this._directives && this._graph === null) {
          this._sparqlStyle = token.type[0] !== "@";
          this._directiveCallback(this._directives[token.type]);
          return this._readDeclarationPunctuation;
        }
        return this._readSubject(token);
    }
  }
  // ### `_readInFormulaContext` reads a token at the statement level of a formula
  _readInFormulaContext(token) {
    switch (token.type) {
      case "PREFIX":
        this._sparqlStyle = true;
      case "@prefix":
        return this._readPrefix;
      case "BASE":
        this._sparqlStyle = true;
      case "@base":
        return this._readBaseIRI;
      default:
        return this._readSubject(token);
    }
  }
  // ### `_getStatementReader` returns the reader for the current statement scope
  _getStatementReader() {
    const context = this._contextStack[this._contextStack.length - 1];
    return context && context.type === "formula" ? this._readInFormulaContext : this._readInTopContext;
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
  // ### `_readList` starts reading a list in the subject, predicate, or object position
  _readList(token, subject, predicate, object) {
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    if (parent.type === "<<") {
      return this._error("Unexpected list in reified triple", token);
    }
    this._saveContext("list", this._graph, subject, predicate, object);
    this._subject = null;
    return this._readListItem;
  }
  // ### `_readSubject` reads a quad's subject
  _readSubject(token) {
    this._predicate = null;
    if (token.type !== "}")
      this._emptyFormula = false;
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
        return this._readList(token, this.RDF_NIL, null, null);
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
        return this._readInFormulaContext;
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
        } else {
          this._subject = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
          return this._getPathReader(this._readPredicateOrNamedGraph);
        }
      case "<<(":
        if (!this._n3Mode)
          return this._error("Disallowed triple term as subject", token);
        return this._enterTripleTerm("<<(", null, null, token) && this._readSubject;
      case "<<":
        return this._enterTripleTerm("<<", null, null, token) && this._readSubject;
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
    let pathable = false;
    switch (type) {
      case "inverse":
        this._inversePredicate = true;
      case "abbreviation":
        this._predicate = this.ABBREVIATIONS[token.value];
        break;
      case "has":
        return this._readPredicateAfterVerb;
      case "is":
        this._inversePredicate = true;
        this._expectOf = true;
        return this._readPredicateAfterVerb;
      case "inversePredicate":
        this._inversePredicate = true;
        return this._readPredicateAfterVerb;
      case "|}":
        this._subject = null;
        return this._readAnnotationBlockPunctuation(token);
      case ".":
      case "]":
      case "}":
        if (this._predicate === null && !this._n3Mode)
          return this._error(`Unexpected ${type}`, token);
        this._subject = null;
        return type === "]" ? this._readBlankNodeTail(token) : this._readPunctuation(token);
      case ";":
        return this._predicate !== null ? this._readPredicate : this._error("Expected predicate but got ;", token);
      case "literal":
        if (!this._n3Mode)
          return this._error("Unexpected literal", token);
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._completePredicateLiteral;
        } else
          this._predicate = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
        pathable = true;
        break;
      case "(":
        return this._n3Mode ? this._readList(token, this._subject, this.RDF_NIL, null) : this._error(`Expected entity but got ${type}`, token);
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
        return this._error("Disallowed blank node as predicate", token);
      case "{":
        if (this._n3Mode) {
          this._saveContext(
            "formula",
            this._graph,
            this._subject,
            this._graph = this._factory.blankNode(),
            null
          );
          return this._readSubject;
        }
        return this._readEntity(token);
      case "blank":
        if (!this._n3Mode)
          return this._error("Disallowed blank node as predicate", token);
      default:
        if ((this._predicate = this._readEntity(token)) === void 0)
          return;
        pathable = this._n3Mode;
    }
    this._validAnnotation = true;
    return pathable ? this._getPathReader(this._readObject, "predicate") : this._readObject;
  }
  // ### `_readPredicateAfterVerb` reads the predicate following `has` or `is`
  _readPredicateAfterVerb(token) {
    if (token.type === "has" || token.type === "is" || token.type === "of" || token.type === "inversePredicate")
      return this._error(`Expected expression but got ${token.type}`, token);
    return this._readPredicate(token);
  }
  // ### `_readObject` reads a quad's object
  _readObject(token) {
    if (this._expectOf) {
      if (token.type !== "of")
        return this._error(`Expected of but got ${token.type}`, token);
      this._expectOf = false;
      return this._readObject;
    }
    switch (token.type) {
      case "literal":
        if (token.prefix.length === 0) {
          this._literalValue = token.value;
          return this._readDataTypeOrLang;
        } else {
          this._object = this._factory.literal(token.value, this._factory.namedNode(token.prefix));
          if (this._n3Mode)
            return this._getPathReader(this._getContextEndReader());
        }
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
        return this._readList(token, this._subject, this._predicate, this.RDF_NIL);
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
        return this._readInFormulaContext;
      case "<<(":
        return this._enterTripleTerm("<<(", this._subject, this._predicate, token) && this._readSubject;
      case "<<":
        return this._enterTripleTerm("<<", this._subject, this._predicate, token) && this._readSubject;
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
      if (token.type === "id")
        return this._readIriPropertyListId;
      this._predicate = null;
      return this._readPredicate(token);
    }
  }
  // ### `_readIriPropertyListId` replaces a property list's blank node with its IRI
  _readIriPropertyListId(token) {
    const iri = this._readEntity(token);
    if (iri === void 0)
      return;
    if (iri.termType !== "NamedNode")
      return this._error(`Expected IRI after id but got ${token.type}`, token);
    const placeholder = this._subject;
    this._subject = iri;
    const context = this._contextStack[this._contextStack.length - 1];
    if (context.subject === placeholder)
      context.subject = iri;
    if (context.predicate === placeholder)
      context.predicate = iri;
    if (context.object === placeholder)
      context.object = iri;
    this._predicate = null;
    return this._readIriPropertyListPredicate;
  }
  // ### `_readIriPropertyListPredicate` requires properties after an IRI property list ID
  _readIriPropertyListPredicate(token) {
    if (token.type === ";" || token.type === "]" || token.type === "." || token.type === "}")
      return this._error(`Expected predicate but got ${token.type}`, token);
    return this._readPredicate(token);
  }
  // ### `_readBlankNodeTail` reads the end of a blank node
  _readBlankNodeTail(token) {
    if (token.type !== "]")
      return this._readBlankNodePunctuation(token);
    if (this._subject !== null)
      this._emitCurrent(this._subject, this._predicate, this._object, this._graph);
    const empty = this._predicate === null;
    this._restoreContext("blank", token);
    if (this._object !== null)
      return this._getContextEndReader();
    else if (this._predicate !== null)
      return this._getPathReader(this._readObject, "predicate");
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
        if (stack.length !== 0 && stack[stack.length - 1].type === "list") {
          if (this._n3Mode) {
            if (previousList !== null)
              this._emit(previousList, this.RDF_REST, this.RDF_NIL, this._graph);
            this._saveContext("item", this._graph, this._subject, this._predicate, this._object);
            this._subject = this._object, this._predicate = null;
            return this._getPathReader(this._readListItem);
          }
          this._emit(this._subject, this._predicate, this._object, this._graph);
        }
        if (this._predicate === null) {
          next = this._n3Mode ? this._getPathReader(this._readPredicate) : this._readPredicate;
          if (this._subject === this.RDF_NIL)
            return next;
        } else if (this._object === null) {
          next = this._getPathReader(this._readObject, "predicate");
          if (this._predicate === this.RDF_NIL)
            return next;
        } else {
          next = this._getContextEndReader();
          if (this._n3Mode)
            next = this._getPathReader(next);
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
        list2 = this._factory.blankNode();
        item = this._factory.blankNode();
        if (previousList === null) {
          if (parent.predicate === null)
            parent.subject = list2;
          else
            parent.object = list2;
        } else {
          this._emit(previousList, this.RDF_REST, list2, this._graph);
        }
        this._emit(list2, this.RDF_FIRST, item, this._graph);
        this._saveContext(
          "formula",
          this._graph,
          list2,
          this.RDF_FIRST,
          this._graph = item
        );
        this._subject = null;
        return this._readInFormulaContext;
      case "<<(":
      case "<<":
        if (!this._enterTripleTerm(token.type, null, null, token))
          return;
        next = this._readSubject;
        break;
      default:
        if ((item = this._readEntity(token)) === void 0)
          return;
    }
    if (list2 === null)
      this._subject = list2 = this._factory.blankNode();
    if (token.type === "<<" || token.type === "<<(")
      stack[stack.length - 1].subject = this._subject;
    if (previousList === null) {
      if (parent.predicate === null)
        parent.subject = list2;
      else if (parent.object === null)
        parent.predicate = list2;
      else
        parent.object = list2;
    } else {
      this._emit(previousList, this.RDF_REST, list2, this._graph);
    }
    if (item !== null) {
      if (this._n3Mode && (token.type === "IRI" || token.type === "prefixed" || token.type === "var" || token.type === "blank" || token.type === "literal")) {
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
  // Defers possible direction tags without allocating bound callbacks.
  _completeLiteral(token, component2) {
    let literal3, readCb = false;
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
        this._literalComponent = component2;
        readCb = true;
        break;
      // Create a simple string literal by default
      default:
        literal3 = this._factory.literal(this._literalValue);
    }
    return { token, literal: literal3, readCb };
  }
  // ### `_readDirCode` reads an optional directional language tag
  _readDirCode(token) {
    const component2 = this._literalComponent, listItem = this._literalListItem;
    if (token.type === "dircode") {
      const term = this._factory.literal(this._literalValue, { language: this._literalLanguage, direction: token.value });
      if (component2 === "subject")
        this._subject = term;
      else if (component2 === "predicate")
        this._predicate = term;
      else
        this._object = term;
      this._literalLanguage = void 0;
      token = null;
    }
    if (component2 === "subject" || component2 === "predicate") {
      const next = component2 === "subject" ? this._readPredicateOrNamedGraph : this._readObject;
      const reader = this._getPathEndReader(token, next, component2);
      return reader || next.call(this, token);
    }
    return this._completeObjectLiteralPost(token, listItem);
  }
  // Completes a literal in subject or predicate position
  _completeTermLiteral(token, component2) {
    const completed = this._completeLiteral(token, component2);
    if (!completed)
      return;
    let next;
    if (component2 === "subject") {
      this._subject = completed.literal;
      next = this._readPredicateOrNamedGraph;
    } else {
      this._predicate = completed.literal;
      this._validAnnotation = true;
      next = this._readObject;
    }
    if (completed.readCb) {
      this._literalListItem = false;
      return this._readDirCode;
    }
    const reader = this._getPathEndReader(completed.token, next, component2);
    if (reader)
      return reader;
    return next.call(this, completed.token);
  }
  // Completes a literal in subject position
  _completeSubjectLiteral(token) {
    return this._completeTermLiteral(token, "subject");
  }
  // Completes a literal in predicate position
  _completePredicateLiteral(token) {
    return this._completeTermLiteral(token, "predicate");
  }
  // Completes a literal in object position
  _completeObjectLiteral(token, listItem) {
    const completed = this._completeLiteral(token, "object");
    if (!completed)
      return;
    this._object = completed.literal;
    if (completed.readCb) {
      this._literalListItem = listItem;
      return this._readDirCode;
    }
    return this._completeObjectLiteralPost(completed.token, listItem);
  }
  _completeObjectLiteralPost(token, listItem) {
    if (this._n3Mode && (token === null || token.type === "!" || token.type === "^")) {
      if (listItem) {
        this._saveContext("item", this._graph, this._subject, this.RDF_FIRST, this._object);
        this._subject = this._object, this._predicate = null;
        return this._getPathEndReader(token, this._readListItem);
      }
      return this._getPathEndReader(token, this._getContextEndReader());
    }
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
      this._emitCurrent(this._subject, this._predicate, this._object, this._graph);
    const formula2 = this._graph, empty = this._emptyFormula;
    this._restoreContext("formula", token);
    if (empty && this._emptyFormulaAsTrue) {
      if (this._subject === formula2)
        this._subject = this.N3_TRUE;
      else if (this._predicate === formula2)
        this._predicate = this.N3_TRUE;
      else
        this._object = this.N3_TRUE;
    }
    if (this._object !== null)
      return this._getPathReader(this._getContextEndReader(), "object");
    if (this._predicate !== null)
      return this._getPathReader(this._readObject, "predicate");
    return this._getPathReader(this._readPredicate, "subject");
  }
  // ### `_readPunctuation` reads punctuation between quads or quad parts
  _readPunctuation(token) {
    let next, graph3 = this._graph;
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
        next = this._getStatementReader();
        if (inversePredicate) this._inversePredicate = false;
        break;
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        if (inversePredicate) this._inversePredicate = false;
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      // A reifier or annotation block annotates the triple just read
      case "~":
      case "{|":
        return this._readAnnotationStart(token);
      // An annotation block can only be closed from within one
      case "|}":
        return this._error("Unexpected annotation syntax closing", token);
      default:
        if (this._supportsQuads && this._graph === null && (graph3 = this._readEntity(token)) !== void 0) {
          next = this._readQuadPunctuation;
          break;
        }
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    if (subject !== null) {
      const predicate = this._predicate, object = this._object;
      this._emit(subject, predicate, object, graph3, inversePredicate);
    }
    return next;
  }
  // ### `_readBlankNodePunctuation` reads punctuation in a blank node
  _readBlankNodePunctuation(token) {
    let next, resetInversePredicate = false;
    switch (token.type) {
      // Semicolon means the subject is shared; predicate and object are different
      case ";":
        resetInversePredicate = this._inversePredicate;
        next = this._readPredicate;
        break;
      // Comma means both the subject and predicate are shared; the object is different
      case ",":
        next = this._readObject;
        break;
      // Annotation syntax applies to the quad just read, exactly as it does
      // outside of a blank node property list
      case "~":
      case "{|":
        return this._readAnnotationStart(token);
      case "|}":
        return this._error("Unexpected annotation syntax closing", token);
      default:
        return this._error(`Expected punctuation to follow "${this._object.id}"`, token);
    }
    this._emitCurrent(this._subject, this._predicate, this._object, this._graph);
    if (resetInversePredicate)
      this._inversePredicate = false;
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
    if (this._prefixChanges !== null)
      this._prefixChanges.push(this._prefix, this._prefixes[this._prefix]);
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
    if (token.prefix !== "" || token.tripleQuoted)
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
      return this._getStatementReader().call(this, token);
    }
    if (token.type !== ".")
      return this._error("Expected declaration to end with a dot", token);
    return this._getStatementReader();
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
    if (!this._explicitQuantifiers) {
      if (this._quantifiedChanges !== null)
        this._quantifiedChanges.push(entity.id, this._quantified[entity.id]);
      this._quantified[entity.id] = this._factory[this._quantifier](this._factory.blankNode().value);
    } else {
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
  _getPathReader(afterPath, position) {
    this._afterPath = afterPath;
    this._pathPosition = position || (this._predicate === null ? "subject" : "object");
    return this._readPath;
  }
  // ### `_getPathEndReader` continues reading after a term that might start a path,
  // given the pending token that follows the term (or `null` if it was consumed)
  _getPathEndReader(token, afterPath, position) {
    if (token !== null && token.type !== "!" && token.type !== "^")
      return null;
    const reader = this._getPathReader(afterPath, position);
    return token === null ? reader : reader.call(this, token);
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
        const afterPath = this._afterPath;
        const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
        if (parent && parent.type === "item") {
          const item = this._subject;
          this._restoreContext("item", token);
          this._emit(this._subject, this.RDF_FIRST, item, this._graph);
        }
        this._afterPath = null;
        this._pathPosition = null;
        return afterPath.call(this, token);
    }
  }
  // ### `_readForwardPath` reads a '!' path
  _readForwardPath(token) {
    let subject, predicate;
    const object = this._factory.blankNode();
    if ((predicate = this._readEntity(token)) === void 0)
      return;
    if (this._pathPosition === "subject")
      subject = this._subject, this._subject = object;
    else if (this._pathPosition === "predicate")
      subject = this._predicate, this._predicate = object;
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
    if (this._pathPosition === "subject")
      object = this._subject, this._subject = subject;
    else if (this._pathPosition === "predicate")
      object = this._predicate, this._predicate = subject;
    else
      object = this._object, this._object = subject;
    this._emit(subject, predicate, object, this._graph);
    return this._readPath;
  }
  // ### `_readTripleTermTail` reads the end of a triple term
  _readTripleTermTail(token) {
    if (token.type !== ")>>")
      return this._error(`Expected )>> but got ${token.type}`, token);
    const quad2 = this._createQuad(
      this._subject,
      this._predicate,
      this._object,
      this._graph,
      this._inversePredicate
    );
    this._restoreContext("<<(", token);
    this._tripleTermDepth--;
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    if (parent && parent.type === "list") {
      this._emit(this._subject, this.RDF_FIRST, quad2, this._graph);
      return this._getContextEndReader();
    }
    if (this._subject === null) {
      this._subject = quad2;
      return this._readPredicate;
    } else {
      this._object = quad2;
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
    this._tripleTermDepth--;
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
    if (token.type === ">>")
      return this._readReifiedTripleTail(token);
    this._reifier = this._readEntity(token);
    return this._readReifiedTripleTail;
  }
  // ### `_readAnnotationStart` reads the first reifier or annotation block after an object,
  // which completes the annotated quad
  _readAnnotationStart(token) {
    this._emitCurrent(this._subject, this._predicate, this._object, this._graph);
    this._tripleTerm = null;
    return this._readAnnotation(token);
  }
  // ### `_readAnnotation` reads what follows an annotated quad:
  // further reifiers or annotation blocks for that same quad, or punctuation
  _readAnnotation(token) {
    switch (token.type) {
      case "~":
        return this._readReifierInAnnotation;
      case "{|":
        return this._readAnnotationBlockHead(token);
    }
    this._tripleTerm = null;
    switch (token.type) {
      // The subject stays shared with the next predicate-object pair
      case ";":
        this._inversePredicate = false;
        return this._readPredicate;
      // The subject and predicate stay shared with the next object
      case ",":
        return this._readObject;
      default:
        this._subject = null;
        return this._getContextEndReader().call(this, token);
    }
  }
  // ### `_readReifierInAnnotation` reads the optional reifier after a tilde in annotation syntax
  _readReifierInAnnotation(token) {
    switch (token.type) {
      case "IRI":
      case "typeIRI":
      case "type":
      case "prefixed":
      case "blank":
      case "var":
        this._reifier = this._readEntity(token);
        return this._readAnnotationBlockOrReifier;
    }
    this._reifier = this._factory.blankNode();
    return this._readAnnotationBlockOrReifier(token);
  }
  // ### `_readAnnotationBlockOrReifier` reads what follows a reifier:
  // either an annotation block, which uses the reifier as its subject,
  // or anything else, in which case the reifier stands alone
  _readAnnotationBlockOrReifier(token) {
    if (token.type === "{|")
      return this._readAnnotationBlockHead(token);
    this._readTripleTerm();
    return this._readAnnotation(token);
  }
  // ### `_readAnnotationBlockHead` opens an annotation block,
  // whose predicate-object pairs describe the reifier of the annotated quad
  _readAnnotationBlockHead(token) {
    const reifier = this._readTripleTerm();
    this._saveContext("annotation", this._graph, this._subject, this._predicate, this._object);
    this._contextStack[this._contextStack.length - 1].tripleTerm = this._tripleTerm;
    this._subject = reifier;
    this._predicate = this._object = this._tripleTerm = null;
    this._inversePredicate = false;
    this._validAnnotation = false;
    return this._readPredicate;
  }
  // ### `_readAnnotationBlockPunctuation` reads punctuation inside an annotation block
  _readAnnotationBlockPunctuation(token) {
    const stack = this._contextStack;
    if (token.type === "|}") {
      if (!stack.length || stack[stack.length - 1].type !== "annotation")
        return this._error("Unexpected annotation syntax closing", token);
      if (!this._validAnnotation)
        return this._error("Annotation block can not be empty", token);
      if (this._subject !== null)
        this._emitCurrent(this._subject, this._predicate, this._object, this._graph);
      const { tripleTerm } = stack[stack.length - 1];
      this._restoreContext("annotation", token);
      this._tripleTerm = tripleTerm;
      return this._readAnnotation;
    }
    return this._readBlankNodePunctuation(token);
  }
  _readTripleTerm() {
    const stack = this._contextStack, parent = stack.length && stack[stack.length - 1];
    const parentGraph = parent ? parent.graph : void 0;
    const reifier = this._reifier || this._factory.blankNode();
    this._reifier = null;
    this._tripleTerm = this._tripleTerm || this._createQuad(
      this._subject,
      this._predicate,
      this._object,
      null,
      this._inversePredicate
    );
    this._emit(reifier, this.RDF_REIFIES, this._tripleTerm, parentGraph || this._graph || this.DEFAULTGRAPH);
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
      case "annotation":
        return this._readAnnotationBlockPunctuation;
    }
  }
  // ### `_createQuad` creates a quad
  _createQuad(subject, predicate, object, graph3) {
    return this._factory.quad(subject, predicate, object, graph3 || this.DEFAULTGRAPH);
  }
  // ### `_createQuadInDirection` creates a quad in the active predicate direction
  _createQuadInDirection(subject, predicate, object, graph3, inversePredicate) {
    return inversePredicate ? this._factory.quad(object, predicate, subject, graph3 || this.DEFAULTGRAPH) : this._factory.quad(subject, predicate, object, graph3 || this.DEFAULTGRAPH);
  }
  // ### `_emitInDirection` sends a quad in the active predicate direction
  _emitInDirection(subject, predicate, object, graph3, inversePredicate) {
    this._callback(null, this._createQuad(subject, predicate, object, graph3, inversePredicate));
  }
  // ### `_emitCurrentInDirection` sends a quad in the current predicate direction
  _emitCurrentInDirection(subject, predicate, object, graph3) {
    this._callback(null, this._createQuad(subject, predicate, object, graph3, this._inversePredicate));
  }
  // ### `_emit` sends a quad through the callback
  _emit(subject, predicate, object, graph3) {
    this._callback(null, this._factory.quad(subject, predicate, object, graph3 || this.DEFAULTGRAPH));
  }
  // ### `_error` emits an error message through the callback
  _error(message2, token) {
    const suffix = ` on line ${token.line}.`;
    if (message2.length + suffix.length > 200)
      message2 = `${message2.slice(0, 199 - suffix.length)}\u2026`;
    const err = new Error(`${message2}${suffix}`);
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
      case "?": {
        const queryPos = this._base.indexOf("?");
        return (queryPos < 0 ? this._base : this._base.substr(0, queryPos)) + iri;
      }
      // Resolve root-relative IRIs at the root of the base IRI
      case "/":
        if (iri[1] !== "/")
          return this._baseRoot + this._removeDotSegments(iri);
        return this._baseScheme ? this._removeDotSegments(this._baseScheme + iri) : this._removeDotSegments(`:${iri}`).substr(1);
      // Resolve all other IRIs at the base IRI's path
      default:
        if (/^[^/:]*:/.test(iri))
          return null;
        return this._basePathHasDotSegments || pathDotSegments.test(iri) ? this._removeDotSegments(this._basePath + iri) : this._basePath + iri;
    }
  }
  // ### `_removeDotSegments` resolves './' and '../' path segments in an IRI as per RFC3986
  _removeDotSegments(iri) {
    if (!dotSegments.test(iri))
      return iri;
    const length = iri.length;
    let result = "", i = -1, pathStart = -1, segmentStart = 0, next = "/";
    while (i < length) {
      switch (next) {
        // The path starts with the first slash after the authority
        case ":":
          if (pathStart < 0) {
            if (iri[++i] === "/" && iri[++i] === "/")
              while ((pathStart = i + 1) < length && iri[pathStart] !== "/" && iri[pathStart] !== "?" && iri[pathStart] !== "#")
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
    let onQuad, onPrefix, onComment, onVersion, onDirective, onToken, onTokenEnd;
    if (quadCallback && (quadCallback.onQuad || quadCallback.onPrefix || quadCallback.onComment || quadCallback.onVersion || quadCallback.onDirective || quadCallback.onToken || quadCallback.onTokenEnd)) {
      onQuad = quadCallback.onQuad;
      onPrefix = quadCallback.onPrefix;
      onComment = quadCallback.onComment;
      onVersion = quadCallback.onVersion;
      onDirective = quadCallback.onDirective;
      onToken = quadCallback.onToken;
      onTokenEnd = quadCallback.onTokenEnd;
    } else {
      onQuad = quadCallback;
      onPrefix = prefixCallback;
      onVersion = versionCallback;
    }
    this._readCallback = this._readBeforeTopContext;
    this._contextStack = [];
    this._graph = this._subject = this._predicate = this._object = null;
    this._tripleTerm = this._reifier = null;
    this._sparqlStyle = false;
    this._prefixes = /* @__PURE__ */ Object.create(null);
    this._prefixes._ = this._blankNodePrefix ? this._blankNodePrefix.substr(2) : `b${blankNodePrefix++}_`;
    if (this._n3Mode && this._implicitEmptyPrefix && this._base)
      this._prefixes[""] = this._resolveIRI("#");
    this._prefixCallback = onPrefix || noop;
    this._versionCallback = onVersion || noop;
    this._directiveCallback = onDirective || noop;
    this._inversePredicate = false;
    this._expectOf = false;
    this._quantified = /* @__PURE__ */ Object.create(null);
    this._prefixChanges = null;
    this._quantifiedChanges = null;
    this._emptyFormula = false;
    this._tripleTermDepth = 0;
    const readGrammarToken = (token) => {
      return this._readCallback = this._readCallback(token);
    };
    let readToken = readGrammarToken;
    if (onComment || this._lexer.comments) {
      this._lexer.comments = true;
      readToken = (token) => {
        if (token.type !== "comment")
          return readGrammarToken(token);
        if (onComment) onComment(token.value);
        return this._readCallback;
      };
    }
    if (onToken || onTokenEnd) {
      const consumeToken = readToken;
      readToken = (token) => {
        try {
          try {
            if (onToken) onToken(token);
            return consumeToken(token);
          } finally {
            if (onTokenEnd) onTokenEnd(token);
          }
        } catch (error4) {
          this._readCallback = null;
          throw error4;
        }
      };
    }
    if (!onQuad) {
      const quads = [];
      let error4;
      this._callback = (e, t) => {
        e ? error4 = e : t && quads.push(t);
      };
      const lexer = this._lexer;
      if (!onPrefix && !onVersion && !onDirective && !onComment && !onToken && !onTokenEnd && lexer.tokenize === N3Lexer.prototype.tokenize && typeof lexer._tokenizeString === "function") {
        const base = [this._base, this._basePath, this._baseRoot, this._baseScheme];
        lexer._tokenizeString(input2, (e, token) => {
          if (e) {
            [this._base, this._basePath, this._baseRoot, this._baseScheme] = base;
            this._callback(e), this._callback = noop;
          } else if (this._readCallback) readToken(token);
        });
      } else
        lexer.tokenize(input2).every(readToken);
      if (error4) throw error4;
      return quads;
    }
    const processNextToken = (error4, token) => {
      if (error4 !== null)
        this._callback(error4), this._callback = noop;
      else if (this._readCallback)
        readToken(token);
    };
    this._callback = onQuad;
    this._lexer.tokenize(input2, processNextToken);
  }
};
function undoChanges(map2, changes) {
  for (let i = changes.length - 2; i >= 0; i -= 2) {
    if (changes[i + 1] === void 0)
      delete map2[changes[i]];
    else
      map2[changes[i]] = changes[i + 1];
  }
}
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
  parser.N3_TRUE = factory.literal("true", factory.namedNode(IRIs_default.xsd.boolean));
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

// node_modules/n3/src/N3Util.js
function isDefaultGraph(term) {
  return !!term && term.termType === "DefaultGraph";
}

// node_modules/n3/src/Util.js
function escapeRegex(regex) {
  return regex.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
}

// node_modules/n3/src/BaseIRI.js
var BASE_UNSUPPORTED = /^:?[^:?#]*(?:[?#]|$)|^file:|^[^:]*:\/*[^?#]+?\/(?:\.\.?(?:\/|$)|\/)/i;
var SUFFIX_SUPPORTED = /^(?:(?!\.\.?(?:[/?#]|$))[^/?#]+(?:\/[^/?#]{3,})*\/?)?(?:[?#]|$)/;
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
      if (parentPath === CURRENT && /^[^?#]/.test(suffix) && (suffix.indexOf(":") < 0 || !/^[^/?#]*:/.test(suffix)))
        return suffix;
      return parentPath + suffix;
    }
    return iri.substring(length - 1);
  }
};

// node_modules/n3/src/N3Writer.js
var DEFAULTGRAPH2 = N3DataFactory_default.defaultGraph();
var { rdf: rdf2, xsd: xsd3 } = IRIs_default;
var { hasOwnProperty } = Object.prototype;
var escape = /["\\\t\n\r\b\f\u0000-\u0019\ud800-\udbff]/;
var escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
var canonicalEscape = /[^ !#-\[\]-~\u0080-\uFFFD]/;
var canonicalEscapeAll = /[^ !#-\[\]-~\u0080-\uFFFD]/g;
var escapedCharacters = {
  "\\": "\\\\",
  '"': '\\"',
  "	": "\\t",
  "\n": "\\n",
  "\r": "\\r",
  "\b": "\\b",
  "\f": "\\f"
};
var invalidVersionLabel = /["\\\u0000-\u001f\u007f]|[\ud800-\udbff](?![\udc00-\udfff])|(?:^|[^\ud800-\udbff])[\udc00-\udfff]/;
var localNameStart = "A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD_:0-9";
var localNameChar = `${localNameStart}\\-\\u00B7\\u0300-\\u036F\\u203F\\u2040`;
var percent = "%[0-9A-Fa-f]{2}";
var localName = new RegExp(`^(?:(?:[${localNameStart}]|${percent})(?:(?:[${localNameChar}.]|${percent})*(?:[${localNameChar}]|${percent}))?)?$`);
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
    this._hasPrefixes = false;
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
    if (options.version && invalidVersionLabel.test(options.version))
      throw new Error(`Invalid version label: ${JSON.stringify(options.version)}`);
    this._subject = null;
    if (!/triple|quad/i.test(options.format)) {
      this._lineMode = false;
      this._escape = escape, this._escapeAll = escapeAll, this._characterReplacer = characterReplacer;
      this._graph = DEFAULTGRAPH2;
      if (options.version)
        this._write(`@version "${options.version}".
`);
      this._prefixIRIs = /* @__PURE__ */ Object.create(null);
      this._prefixPatterns = /* @__PURE__ */ Object.create(null);
      if (options.baseIRI) {
        this._baseIri = new BaseIRI(options.baseIRI);
        if (options.writeBase)
          this._write(`@base <${options.baseIRI}>.
`);
      }
      options.prefixes && this.addPrefixes(options.prefixes);
    } else {
      this._lineMode = true;
      this._writeQuad = this._writeQuadLine;
      this._escape = canonicalEscape, this._escapeAll = canonicalEscapeAll;
      this._characterReplacer = canonicalCharacterReplacer;
      if (options.version)
        this._write(`VERSION "${options.version}"
`);
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
  // ### `_endStatement` finishes a pending statement and closes an open graph block
  _endStatement() {
    if (this._subject !== null) {
      this._write(this._inDefaultGraph ? ".\n" : "\n}\n");
      this._subject = null;
      this._graph = DEFAULTGRAPH2;
    }
  }
  // ### `_writeQuad` writes the quad to the output stream
  _writeQuad(subject, predicate, object, graph3, done) {
    try {
      if (graph3 !== this._graph && (!graph3.equals(this._graph) || graph3.termType !== this._graph.termType)) {
        this._write((this._subject === null ? "" : this._inDefaultGraph ? ".\n" : "\n}\n") + (DEFAULTGRAPH2.equals(graph3) ? "" : `${this._encodeIriOrBlank(graph3)} {
`));
        this._graph = graph3;
        this._subject = null;
      }
      if (subject === this._subject || subject.equals(this._subject)) {
        if (predicate === this._predicate || predicate.equals(this._predicate))
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
  _writeQuadLine(subject, predicate, object, graph3, done) {
    delete this._prefixMatch;
    this._write(this.quadToString(subject, predicate, object, graph3), done);
  }
  // ### `quadToString` serializes a quad as a string
  quadToString(subject, predicate, object, graph3) {
    return `${this._encodeSubject(subject)} ${predicate.termType === "Literal" ? this._encodeLiteral(predicate) : this._encodeIriOrBlank(predicate)} ${this._encodeObject(object)}${graph3 && !isDefaultGraph(graph3) ? ` ${this._encodeIriOrBlank(graph3)} .
` : " .\n"}`;
  }
  // ### `quadsToString` serializes an array of quads as a string
  quadsToString(quads) {
    let quadsString = "";
    for (const quad2 of quads)
      quadsString += this.quadToString(quad2.subject, quad2.predicate, quad2.object, quad2.graph);
    return quadsString;
  }
  // ### `_encodeSubject` represents a subject
  _encodeSubject(entity) {
    switch (entity.termType) {
      case "Quad":
        return this._encodeQuad(entity);
      // Literal subjects are only valid in N3
      case "Literal":
        return this._encodeLiteral(entity);
      default:
        return this._encodeIriOrBlank(entity);
    }
  }
  // ### `_encodeIriOrBlank` represents an IRI or blank node
  _encodeIriOrBlank(entity) {
    if (entity.termType !== "NamedNode") {
      if (this._lists && hasOwnProperty.call(this._lists, entity.value))
        entity = this.list(this._lists[entity.value]);
      if (entity instanceof Term)
        return entity.id;
      return entity.termType === "Variable" ? `?${entity.value}` : `_:${entity.value}`;
    }
    let iri = entity.value;
    if (this._baseIri) {
      iri = this._baseIri.toRelative(iri);
    }
    if (this._escape.test(iri))
      iri = iri.replace(this._escapeAll, this._characterReplacer);
    const prefixMatch = this._hasPrefixes ? (this._prefixRegex || this._createPrefixRegex()).exec(iri) : null;
    if (!prefixMatch)
      return `<${iri}>`;
    if (prefixMatch[1])
      return this._prefixIRIs[prefixMatch[1]] + prefixMatch[2];
    return localName.test(iri.slice(prefixMatch[0].length)) ? iri : `<${iri}>`;
  }
  // ### `_encodeLiteral` represents a literal
  _encodeLiteral(literal3) {
    let value = literal3.value;
    if (this._escape.test(value))
      value = value.replace(this._escapeAll, this._characterReplacer);
    const language = literal3.language;
    if (language) {
      const literalDirection = literal3.direction;
      const direction = literalDirection ? `--${literalDirection}` : "";
      return `"${value}"@${language}${direction}`;
    }
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
    switch (predicate.termType) {
      case "NamedNode":
        return predicate.value === rdf2.type ? "a" : this._encodeIriOrBlank(predicate);
      // Literal predicates are only valid in N3
      case "Literal":
        return this._encodeLiteral(predicate);
      default:
        return this._encodeIriOrBlank(predicate);
    }
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
  _encodeQuad({ subject, predicate, object, graph: graph3 }) {
    const space = this._lineMode ? " " : "";
    return `<<(${space}${this._encodeSubject(subject)} ${this._encodePredicate(predicate)} ${this._encodeObject(object)}${isDefaultGraph(graph3) ? "" : ` ${this._encodeIriOrBlank(graph3)}`}${space})>>`;
  }
  // ### `_blockedWrite` replaces `_write` after the writer has been closed
  _blockedWrite() {
    throw new Error("Cannot write because the writer has been closed.");
  }
  // ### `addQuad` adds the quad to the output stream
  addQuad(subject, predicate, object, graph3, done) {
    if (object === void 0)
      this._writeQuad(subject.subject, subject.predicate, subject.object, subject.graph, predicate);
    else if (typeof graph3 === "function")
      this._writeQuad(subject, predicate, object, DEFAULTGRAPH2, graph3);
    else
      this._writeQuad(subject, predicate, object, graph3 || DEFAULTGRAPH2, done);
  }
  // ### `addQuads` adds the quads to the output stream
  addQuads(quads) {
    for (let i = 0; i < quads.length; i++)
      this.addQuad(quads[i]);
  }
  // ### `addPrefix` adds the prefix to the output stream
  addPrefix(prefix, iri, done) {
    const prefixes3 = {};
    prefixes3[prefix] = iri;
    this.addPrefixes(prefixes3, done);
  }
  // ### `addPrefixes` adds the prefixes to the output stream
  addPrefixes(prefixes3, done) {
    if (!this._prefixIRIs)
      return done && done();
    let hasPrefixes = false;
    for (let prefix in prefixes3) {
      let iri = prefixes3[prefix];
      if (typeof iri !== "string")
        iri = iri.value;
      hasPrefixes = true;
      this._endStatement();
      this._prefixIRIs[iri] = prefix += ":";
      this._prefixPatterns[iri] = [escapeRegex(iri), escapeRegex(prefix)];
      this._write(`@prefix ${prefix} <${iri}>.
`);
    }
    if (hasPrefixes) {
      this._hasPrefixes = true;
      this._prefixRegex = null;
    }
    this._write(hasPrefixes ? "\n" : "", done);
  }
  // ### `_createPrefixRegex` creates the matcher for the current prefixes
  _createPrefixRegex() {
    let IRIlist = "", prefixList = "";
    for (const prefixIRI in this._prefixPatterns) {
      const [IRIpattern, prefixPattern2] = this._prefixPatterns[prefixIRI];
      IRIlist += IRIlist ? `|${IRIpattern}` : IRIpattern;
      prefixList += prefixList ? `|${prefixPattern2}` : prefixPattern2;
    }
    return this._prefixRegex = new RegExp(`^(${IRIlist})([_a-zA-Z0-9](?:\\.?[\\-_a-zA-Z0-9])*)$|^(?:${prefixList})`);
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
    this._endStatement();
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
function canonicalCharacterReplacer(character) {
  let result = escapedCharacters[character];
  if (result === void 0) {
    result = character.charCodeAt(0).toString(16).toUpperCase();
    result = "\\u0000".substr(0, 6 - result.length) + result;
  }
  return result;
}

// node_modules/@muze-nl/oldm-n3/src/oldm-n3.mjs
var solidNamespace = "http://www.w3.org/ns/solid/terms#";
var rdfNamespace = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
var n3Parser = (input2, uri, type) => {
  const parser = new N3Parser({
    baseIRI: uri,
    blankNodePrefix: "",
    format: type
  });
  let prefixes3 = /* @__PURE__ */ Object.create(null);
  const quads = parser.parse(input2, null, (prefix, url2) => {
    prefixes3[prefix] = url2.id;
  });
  return { quads, prefixes: prefixes3 };
};
var ResourceWriter = class extends N3Writer {
  constructor(source2, options) {
    super({ ...options, prefixes: {} });
    this.usedPrefixes = /* @__PURE__ */ new Set();
    this.relative = options.relative ?? true;
    this.source = source2;
    this.entries = Object.entries(options.prefixes);
  }
  _encodeIriOrBlank(term) {
    if (term.termType != "NamedNode" || this._lineMode) return super._encodeIriOrBlank(term);
    const iri = absoluteIRI(term.value);
    const prefixed = turtlePrefixedIRI(iri, this.entries);
    if (prefixed !== null) {
      this.usedPrefixes.add(prefixed.slice(0, prefixed.indexOf(":")));
      return prefixed;
    }
    return `<${this.relative ? this.source.relativeURI(iri) : iri}>`;
  }
  declarations() {
    return this.entries.filter(([prefix]) => this.usedPrefixes.has(prefix)).map(([prefix, iri]) => `@prefix ${prefix}: <${iri}> .
`).join("");
  }
};
var n3Writer = (source2) => {
  return new Promise((resolve, reject) => {
    const prefixes3 = source2.prefixDeclarations("source");
    const writer = new ResourceWriter(source2, { format: source2.mimetype, prefixes: prefixes3 });
    const xsd4 = source2.prefixes.xsd;
    const { quad: quad2, namedNode: namedNode2, literal: literal3, blankNode: blankNode2 } = N3DataFactory_default;
    const blankNodes = /* @__PURE__ */ new Map();
    const getClassPredicates = (subject) => {
      const predicates = [];
      let classNames = subject.a;
      if (!classNames) {
        return predicates;
      }
      if (!Array.isArray(classNames)) {
        classNames = [classNames];
      }
      for (const name of classNames) {
        predicates.push({
          predicate: namedNode2(rdfType),
          object: namedNode2(source2.fullURI(name))
        });
      }
      return predicates;
    };
    const writeProperties = (subjectNode, subject) => {
      if (!subject) {
        return;
      }
      let preds = getPredicates(subject);
      for (let pred of preds) {
        if (!Array.isArray(pred.object)) {
          pred.object = [pred.object];
        }
        for (let o of pred.object) {
          writer.addQuad(quad2(
            subjectNode,
            pred.predicate,
            o
          ));
        }
      }
    };
    const getPredicates = (object) => {
      let preds = getClassPredicates(object);
      Object.entries(object).forEach((entry) => {
        const predicate = entry[0];
        if (predicate == "id" || predicate == "a") {
          return;
        }
        let object2 = entry[1];
        const fullPred = source2.fullURI(predicate);
        let pred = {
          predicate: namedNode2(fullPred)
        };
        if (object2 instanceof Collection) {
          pred.object = getCollection(object2);
        } else if (Array.isArray(object2)) {
          pred.object = getArray(object2);
        } else if (object2 instanceof NamedNode) {
          pred.object = namedNode2(object2.id);
        } else if (object2 instanceof BlankNode) {
          pred.object = getBlankNode(object2);
        } else if (isLiteral2(object2)) {
          pred.object = getLiteral(object2);
        } else {
          console.log("oldm-ns: encountered unknown object", object2, predicate);
        }
        preds.push(pred);
      });
      return preds;
    };
    const getLiteral = (object) => {
      const language = object?.language;
      let type = source2.getType(object) || void 0;
      if (language) {
        type = language;
      } else if (type) {
        if (type == xsd4 + source2.context.separator + "string" || type == xsd4 + source2.context.separator + "number") {
          type = void 0;
        } else {
          type = source2.fullURI(type);
        }
        type = namedNode2(type);
      }
      if (object instanceof String) {
        object = "" + object;
      } else if (object instanceof Number) {
        object = +object;
      }
      return literal3(object, type);
    };
    const isLiteral2 = (value) => {
      return value instanceof String || value instanceof Number || typeof value == "boolean" || typeof value == "string" || typeof value == "number";
    };
    const getCollection = (object) => {
      let list2 = [];
      for (let value of object) {
        if (isLiteral2(value)) {
          list2.push(getLiteral(value));
        } else if (value.id) {
          list2.push(namedNode2(value.id));
        } else {
          list2.push(getBlankNode(value));
        }
      }
      return writer.list(list2);
    };
    const getBlankNode = (object) => {
      if (!blankNodes.has(object)) {
        const node = blankNode2();
        blankNodes.set(object, node);
        writeProperties(node, object);
      }
      return blankNodes.get(object);
    };
    const getArray = (object) => {
      let list2 = [];
      for (const o of object) {
        if (isLiteral2(o)) {
          list2.push(getLiteral(o));
        } else if (o instanceof NamedNode) {
          list2.push(namedNode2(o.id));
        } else if (o instanceof BlankNode) {
          list2.push(getBlankNode(o));
        } else if (o instanceof Collection) {
          list2.push(getCollection(o));
        }
      }
      return list2;
    };
    Object.entries(source2.subjects).forEach(([id2, subject]) => {
      writeProperties(namedNode2(id2), subject);
    });
    writer.end((error4, result) => {
      if (!error4) {
        resolve(writer._lineMode ? result : `@base <${absoluteIRI(source2.baseURI)}> .
` + writer.declarations() + result);
      } else {
        reject(error4);
      }
    });
  });
};
var n3PatchWriter = async (source2) => {
  if (source2.originalSource == null) {
    throw new Error("Cannot generate a patch without the original graph source");
  }
  const currentSource = await n3Writer(source2);
  const original = n3Parser(source2.originalSource, source2.url, source2.mimetype).quads;
  const current = n3Parser(currentSource, source2.url, source2.mimetype).quads;
  const patch = solidPatchChanges(original, current, {
    quad: N3DataFactory_default.quad,
    variable: N3DataFactory_default.variable,
    blankNode: N3DataFactory_default.blankNode
  });
  return serializePatch(source2, patch.inserts, patch.deletes, patch.where);
};
function diffQuads(original, current) {
  const originalByKey = new Map(original.map((quad2) => [quadKey(quad2), quad2]));
  const currentByKey = new Map(current.map((quad2) => [quadKey(quad2), quad2]));
  const deletes = [];
  const inserts = [];
  for (const [key, quad2] of originalByKey) {
    if (!currentByKey.has(key)) {
      deletes.push(quad2);
    }
  }
  for (const [key, quad2] of currentByKey) {
    if (!originalByKey.has(key)) {
      inserts.push(quad2);
    }
  }
  return { inserts, deletes };
}
function quadKey(quad2) {
  return [
    termKey(quad2.subject),
    termKey(quad2.predicate),
    termKey(quad2.object),
    termKey(quad2.graph)
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
  const originalTerms = /* @__PURE__ */ new Map();
  const replacementTerms = /* @__PURE__ */ new Map();
  for (const unit of deletedUnits) {
    assertOwnedAnonymousUnit(unit, "delete");
    const variableQuads = mapBlankNodes(
      unit.quads,
      (name) => factory.variable(name),
      factory.quad,
      "old",
      originalTerms
    );
    where.push(...variableQuads);
    anonymousDeletes.push(...variableQuads);
  }
  for (const unit of insertedUnits) {
    assertOwnedAnonymousUnit(unit, "insert");
    const insertedQuads = mapBlankNodes(
      unit.quads,
      (name) => factory.blankNode(name),
      factory.quad,
      "insert",
      replacementTerms
    );
    anonymousInserts.push(...insertedQuads);
  }
  const plainOriginal = original.filter((quad2) => !originalAnonymous.quadKeys.has(quadKey(quad2)));
  const plainCurrent = current.filter((quad2) => !currentAnonymous.quadKeys.has(quadKey(quad2)));
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
    for (const quad2 of unitQuads) {
      quadKeys.add(quadKey(quad2));
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
  for (const quad2 of quads) {
    if (!isBlankNode(quad2.subject)) {
      continue;
    }
    const id2 = termValue(quad2.subject);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad2);
  }
  return index;
}
function blankObjectIndex(quads) {
  const index = /* @__PURE__ */ new Map();
  for (const quad2 of quads) {
    if (!isBlankNode(quad2.object)) {
      continue;
    }
    const id2 = termValue(quad2.object);
    if (!index.has(id2)) {
      index.set(id2, []);
    }
    index.get(id2).push(quad2);
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
    for (const quad2 of outgoing.get(id2) ?? []) {
      quads.push(quad2);
      if (isBlankNode(quad2.object)) {
        stack.push(quad2.object);
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
  const properties = (outgoing.get(id2) ?? []).map((quad2) => {
    const object = canonicalTerm(quad2.object, outgoing, memo, path2);
    cyclic ||= object.cyclic;
    return `${termKey(quad2.predicate)} ${object.key}`;
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
function mapBlankNodes(quads, createTerm, createQuad, prefix, terms) {
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
  return quads.map((quad2) => createQuad(mapTerm(quad2.subject), quad2.predicate, mapTerm(quad2.object), quad2.graph));
}
function assertPatchable(quads, operation) {
  const hasBlankNode = quads.some(
    (quad2) => isBlankNode(quad2.subject) || isBlankNode(quad2.predicate) || isBlankNode(quad2.object)
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
function serializePatch(source2, inserts, deletes, where = []) {
  const prefixes3 = {
    ...source2.prefixDeclarations("source")
  };
  if (quadsUseNamespace([...where, ...deletes, ...inserts], rdfNamespace)) {
    prefixes3.rdf ??= rdfNamespace;
  }
  prefixes3.solid = solidNamespace;
  const writer = new ResourceWriter(source2, {
    format: "text/turtle",
    prefixes: prefixes3,
    relative: false
  });
  writer.usedPrefixes.add("solid");
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
  return writer.declarations() + `
${patch} .
`;
}
function quadsUseNamespace(quads, namespace) {
  return quads.some(
    (quad2) => termUsesNamespace(quad2.subject, namespace) || termUsesNamespace(quad2.predicate, namespace) || termUsesNamespace(quad2.object, namespace)
  );
}
function termUsesNamespace(term, namespace) {
  return term?.termType == "NamedNode" && termValue(term).startsWith(namespace);
}
function formula(writer, quads) {
  if (!quads.length) {
    return "{}";
  }
  const lines = quads.map((quad2) => `
		${writer.quadToString(quad2.subject, quad2.predicate, quad2.object).trim()}`);
  return `{${lines.join("")}
	}`;
}

// node_modules/@muze-nl/oldm/src/index.mjs
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
var src_default2 = oldm2;

// node_modules/@muze-labs/solid-workspace/src/graphs.mjs
var { BlankNode: BlankNode3, Collection: Collection2 } = src_default2;
function emptyGraph({
  context = src_default2.context(),
  url: url2 = `urn:uuid:${globalThis.crypto.randomUUID()}`,
  prefixes: prefixes3 = {},
  baseURI = url2.split("#")[0]
} = {}) {
  const graph3 = new src_default2.Graph([], url2, "text/turtle", prefixes3, context);
  graph3.baseURI = baseURI;
  return graph3;
}
function parseGraph(turtle, { url: url2, prefixes: prefixes3 = {}, baseURI } = {}) {
  if (typeof turtle !== "string") {
    throw new TypeError("solid-workspace: expected Turtle text");
  }
  const graph3 = src_default2.context({ prefixes: prefixes3 }).parse(turtle, url2, "text/turtle");
  if (baseURI !== void 0) {
    graph3.baseURI = baseURI;
  }
  return graph3;
}
function copyGraph(source2, options = {}) {
  if (!(source2 instanceof src_default2.Graph)) {
    throw new TypeError("solid-workspace: expected an OLDM Graph");
  }
  const graph3 = emptyGraph({
    url: source2.url,
    prefixes: source2.prefixDeclarations(),
    ...options,
    baseURI: options.baseURI ?? source2.baseURI
  });
  importGraph(graph3, source2);
  return graph3;
}
function mergeGraphs(sources, { baseURI = sources[0]?.baseURI, prefixes: preferredPrefixes = {} } = {}) {
  const prefixes3 = {};
  for (const source2 of sources) {
    for (const [prefix, iri] of Object.entries(source2.prefixDeclarations())) {
      if (!Object.hasOwn(prefixes3, prefix)) {
        prefixes3[prefix] = iri;
      }
    }
  }
  Object.assign(prefixes3, preferredPrefixes);
  const graph3 = emptyGraph({ prefixes: prefixes3, baseURI });
  for (const source2 of sources) {
    importGraph(graph3, source2);
  }
  return graph3;
}
function importGraph(graph3, source2) {
  const copied = /* @__PURE__ */ new WeakMap();
  for (const subject of source2.data) {
    writeSubjectToGraph({ graph: graph3, subject, copied });
  }
}
function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && !isPrimitiveWrapper(value));
}
function valueKey(value) {
  if (value instanceof Collection2) return `list:${JSON.stringify(sortObject(value))}`;
  if (isPrimitiveWrapper(value)) {
    return `literal:${JSON.stringify(sortObject(primitiveWrapperData(value)))}`;
  }
  if (isObject(value)) {
    return value.id ? `id:${value.id}` : `json:${JSON.stringify(sortObject(value))}`;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `literal:${JSON.stringify({ value })}`;
  }
  return `${typeof value}:${String(value)}`;
}
function sortObject(value, seen = /* @__PURE__ */ new Map()) {
  if (isPrimitiveWrapper(value)) return { literal: primitiveWrapperData(value) };
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return { reference: seen.get(value) };
  seen.set(value, value.id ?? seen.size);
  if (Array.isArray(value)) {
    const items = Array.from(value, (item) => sortObject(item, seen));
    return value instanceof Collection2 ? { list: items } : items;
  }
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortObject(item, seen)]));
}
function isPrimitiveWrapper(value) {
  return value instanceof String || value instanceof Number || value instanceof Boolean;
}
function primitiveWrapperData(value) {
  const data = {
    value: value.type ? String(value) : value.valueOf()
  };
  for (const [key, item] of Object.entries(value)) {
    if (!/^\d+$/.test(key)) {
      if (key === "language" && !item) {
        continue;
      }
      if (value instanceof String && key === "type" && item === "http://www.w3.org/2001/XMLSchema#string") {
        continue;
      }
      data[key] = item;
    }
  }
  return data;
}
function writeSubjectToGraph({
  graph: graph3,
  subject,
  id: id2 = subject.id,
  copied = /* @__PURE__ */ new WeakMap(),
  replace = false
}) {
  if (copied.has(subject)) {
    return copied.get(subject);
  }
  const node = id2 ? graph3.addNamedNode(id2) : new BlankNode3(graph3);
  copied.set(subject, node);
  for (const [predicate, value] of Object.entries(subject)) {
    if (predicate === "id") {
      continue;
    }
    const name = predicate === "a" ? "a" : subject.graph?.fullURI(predicate) ?? predicate;
    const imported = graphValueFromObjectValue({ graph: graph3, value, copied, replace });
    if (replace || Array.isArray(value) && value.length === 0) {
      graph3.set(node, name, imported);
    } else {
      graph3.add(node, name, imported);
    }
  }
  return node;
}
function graphValueFromObjectValue({ graph: graph3, value, copied, replace = false }) {
  if (value instanceof String || value instanceof Number) {
    return src_default2.literal(value);
  }
  if (value instanceof Boolean) {
    return Object.assign(new Boolean(value.valueOf()), value);
  }
  if (value instanceof Collection2) {
    if (copied.has(value)) {
      return copied.get(value);
    }
    const list2 = new Collection2(graph3);
    copied.set(value, list2);
    for (const item of value) {
      list2.push(graphValueFromObjectValue({
        graph: graph3,
        value: item,
        copied,
        replace
      }));
    }
    return list2;
  }
  if (Array.isArray(value)) {
    return value.map((item) => graphValueFromObjectValue({
      graph: graph3,
      value: item,
      copied,
      replace
    }));
  }
  if (isObject(value)) {
    if (value.id || value instanceof BlankNode3) {
      return writeSubjectToGraph({ graph: graph3, subject: value, copied, replace });
    }
    throw new TypeError(
      "solid-workspace: RDF objects need an id or an OLDM BlankNode; encode application literals explicitly"
    );
  }
  return value;
}

// node_modules/@muze-labs/solid-workspace/src/replicas.mjs
var modified = "http://purl.org/dc/terms/modified";
var deleted = "https://purl.org/pdsinterop/link-metadata#deleted";
function isDeleted(subject, context = subject.graph ?? src_default2.context()) {
  return Object.hasOwn(subject, deleted) || Object.hasOwn(subject, context.propertyName(deleted));
}
function markDeleted(subject, now2 = (/* @__PURE__ */ new Date()).toISOString()) {
  const context = subject.graph ?? src_default2.context();
  const keys = /* @__PURE__ */ new Set([
    deleted,
    modified,
    context.propertyName(deleted),
    context.propertyName(modified)
  ]);
  const previous = Object.entries(subject).filter(([key]) => keys.has(key));
  function clear3() {
    for (const key of Object.keys(subject)) {
      if (keys.has(key)) {
        delete subject[key];
      }
    }
  }
  clear3();
  subject[context.propertyName(deleted)] = "Deleted by the user";
  subject[context.propertyName(modified)] = now2;
  return () => {
    clear3();
    for (const [key, value] of previous) {
      subject[key] = value;
    }
  };
}
function mergeReplicas(graphs, {
  scalarPredicates = [],
  ownedPredicates = [],
  baseURI,
  prefixes: prefixes3
} = {}) {
  const copies = graphs.map((graph3) => copyGraph(graph3));
  const snapshots = copies.map((context) => {
    const subjects = /* @__PURE__ */ new Map();
    visit(context.subjects, (subject) => {
      if (subject.id) {
        subjects.set(subject.id, { subject, context });
      }
    });
    return subjects;
  });
  const owners = editOwners(snapshots, ownedPredicates);
  const versions = /* @__PURE__ */ new Map();
  for (const subjects of snapshots) {
    const groups = /* @__PURE__ */ new Map();
    for (const [id2, candidate] of subjects) {
      const root = editRoot(id2, owners);
      if (!groups.has(root)) {
        groups.set(root, /* @__PURE__ */ new Map());
      }
      groups.get(root).set(id2, candidate);
    }
    for (const [root, members] of groups) {
      const candidates = versions.get(root) ?? [];
      candidates.push({ root: subjects.get(root), members });
      versions.set(root, candidates);
    }
  }
  const scalars = /* @__PURE__ */ new Set([modified, deleted, ...scalarPredicates]);
  for (const candidates of versions.values()) {
    const dated = candidates.filter((candidate) => timestamp(candidate.root) != null);
    if (dated.length === 0) {
      continue;
    }
    dated.sort((left, right) => timestamp(left.root) - timestamp(right.root) || Number(isDeleted(left.root.subject, left.root.context)) - Number(isDeleted(right.root.subject, right.root.context)) || revisionKey(left, scalars).localeCompare(revisionKey(right, scalars)));
    const winner = dated.at(-1);
    const selected = new Map([...winner.members].map(([id2, member]) => [
      id2,
      Object.entries(member.subject).map(([key, value]) => [predicateIRI(key, member), value]).filter(([iri]) => scalars.has(iri))
    ]));
    for (const candidate of candidates) {
      for (const [id2, member] of candidate.members) {
        for (const key of Object.keys(member.subject)) {
          if (scalars.has(predicateIRI(key, member))) {
            delete member.subject[key];
          }
        }
        for (const [iri, value] of selected.get(id2) ?? []) {
          member.subject[member.context.propertyName(iri)] = value;
        }
      }
    }
  }
  return mergeGraphs(copies, { baseURI, prefixes: prefixes3 });
}
function editOwners(snapshots, predicates) {
  const owners = /* @__PURE__ */ new Map();
  for (const subjects of snapshots) {
    for (const [id2, candidate] of subjects) {
      for (const predicate of predicates) {
        for (const child of values2(field2(candidate, predicate))) {
          if (child?.id === "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
            continue;
          }
          if (!(child instanceof src_default2.NamedNode)) {
            throw new TypeError("solid-workspace: owned links must reference named subjects");
          }
          const parent = owners.get(child.id);
          if (parent && parent !== id2) {
            throw new Error(`solid-workspace: multiple owners for ${child.id}`);
          }
          owners.set(child.id, id2);
        }
      }
    }
  }
  return owners;
}
function editRoot(id2, owners) {
  const visited = /* @__PURE__ */ new Set();
  while (owners.has(id2)) {
    if (visited.has(id2)) {
      throw new Error(`solid-workspace: ownership cycle at ${id2}`);
    }
    visited.add(id2);
    id2 = owners.get(id2);
  }
  return id2;
}
function revisionKey(candidate, scalars) {
  return JSON.stringify([...candidate.members].sort(([a], [b]) => a.localeCompare(b)).map(([id2, member]) => [id2, scalarKey(member, scalars)]));
}
function values2(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}
function predicateIRI(key, { context }) {
  if (key === "id") return key;
  return key === "a" ? "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : context.fullURI(key);
}
function field2(candidate, iri) {
  if (!candidate) {
    return void 0;
  }
  return Object.entries(candidate.subject).find(([key]) => predicateIRI(key, candidate) === iri)?.[1];
}
function timestamp(candidate) {
  const times = values2(field2(candidate, modified)).map((value) => Date.parse(String(value))).filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
}
function scalarKey(candidate, scalars) {
  return JSON.stringify([...scalars].sort().map((iri) => {
    const value = field2(candidate, iri);
    return valueKey(value);
  }));
}
function visit(value, fn, seen = /* @__PURE__ */ new WeakSet()) {
  if (!value || typeof value !== "object" || value instanceof String || value instanceof Number || value instanceof Boolean || seen.has(value)) return;
  seen.add(value);
  fn(value);
  for (const item of Object.values(value)) visit(item, fn, seen);
}

// node_modules/@muze-nl/jaqt/src/jaqt.mjs
function isPrimitiveWrapper2(data) {
  return [String, Boolean, Number, BigInt].includes(data?.constructor);
}
function getSelectFn(filter2) {
  let fns = [];
  if (filter2 instanceof Function) {
    fns.push(filter2);
  } else for (const [filterKey, filterValue] of Object.entries(filter2)) {
    if (filterValue instanceof Function) {
      fns.push((data) => {
        if (filterKey == "_") {
          return filterValue(data, filterKey, "select");
        } else {
          return {
            [filterKey]: filterValue(data, filterKey, "select")
          };
        }
      });
    } else if (!isPrimitiveWrapper2(filterValue)) {
      fns.push((data) => {
        if (filterKey == "_") {
          return from(data[filterKey]).select(filterValue);
        } else {
          return {
            [filterKey]: from(data[filterKey]).select(filterValue)
          };
        }
      });
    } else {
      fns.push(() => {
        if (filterKey == "_") {
          return filterValue;
        } else {
          return {
            [filterKey]: filterValue
          };
        }
      });
    }
  }
  if (fns.length == 1) {
    return fns[0];
  }
  return (data) => {
    let result = {};
    for (let fn of fns) {
      Object.assign(result, fn(data));
    }
    return result;
  };
}
function getMatchFn(pattern) {
  let fns = [];
  if (Array.isArray(pattern)) {
    fns.push(anyOf(...pattern));
  } else if (pattern instanceof RegExp) {
    fns.push((data) => pattern.test(data));
  } else if (pattern instanceof Function) {
    fns.push((data) => pattern(data));
  } else if (!isPrimitiveWrapper2(pattern)) {
    let patternMatches = {};
    for (const [wKey, wVal] of Object.entries(pattern)) {
      patternMatches[wKey] = getMatchFn(wVal);
    }
    let matchFn = (data) => {
      if (Array.isArray(data)) {
        return data.filter((element2) => matchFn(element2)).length > 0;
      }
      if (isPrimitiveWrapper2(data)) {
        return false;
      }
      for (let wKey in patternMatches) {
        let patternMatchFn = patternMatches[wKey];
        if (!patternMatchFn(data?.[wKey])) {
          return false;
        }
      }
      return true;
    };
    fns.push(matchFn);
  } else {
    fns.push((data) => {
      if (Array.isArray(data)) {
        return data.filter((element2) => pattern == element2).length > 0;
      } else {
        return pattern == data;
      }
    });
  }
  if (fns.length == 1) {
    return fns[0];
  }
  return (data) => {
    for (let fn of fns) {
      if (!fn(data)) {
        return false;
      }
    }
    return true;
  };
}
var asc = Symbol("asc");
var desc = Symbol("desc");
function getSortFn(pattern) {
  let comparisons = Object.entries(pattern);
  let fns = [];
  for (let [key, compare] of comparisons) {
    if (compare instanceof Function) {
      fns.push(compare);
    } else if (compare === asc) {
      fns.push((a, b) => a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
    } else if (compare === desc) {
      fns.push((a, b) => a[key] < b[key] ? 1 : a[key] > b[key] ? -1 : 0);
    } else if (!isPrimitiveWrapper2(compare)) {
      let subFn = getSortFn(compare);
      fns.push((a, b) => subFn(a[key], b[key]));
    } else {
      throw new Error("Unknown sort order", compare);
    }
  }
  if (fns.length == 1) {
    return fns[0];
  }
  return (a, b) => {
    for (let fn of fns) {
      let result = fn(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}
function getAggregateFn(filter2) {
  let fns = [];
  if (filter2 instanceof Function) {
    fns.push(filter2);
  } else for (const [filterKey, filterValue] of Object.entries(filter2)) {
    if (filterValue instanceof Function) {
      fns.push((a, o, i, l) => {
        if (isPrimitiveWrapper2(a)) {
          a = {};
        }
        if (o.reduce) {
          a[filterKey] = o.reduce(filterValue, a[filterKey] || []);
        } else {
          a[filterKey] = filterValue(a[filterKey] || [], o, i, l);
        }
        return a;
      });
    } else if (!isPrimitiveWrapper2(filterValue)) {
      fns.push((a, o) => {
        if (isPrimitiveWrapper2(a)) {
          a = {};
        }
        a[filterKey] = from(o[filterKey]).reduce(filterValue, []);
        return a;
      });
    } else {
      fns.push((a) => {
        if (isPrimitiveWrapper2(a)) {
          a = {};
        }
        a[filterKey] = filterValue;
        return a;
      });
    }
  }
  if (fns.length == 1) {
    return fns[0];
  }
  return (a, o, i, l) => {
    let result = {};
    for (let fn of fns) {
      Object.assign(result, fn(a, o, i, l));
    }
    return result;
  };
}
function getMatchingGroups(data, pointerFn) {
  let result = {};
  for (let entity of data) {
    let groups = pointerFn(entity);
    if (!Array.isArray(groups)) {
      groups = [groups];
    }
    for (let group2 of groups) {
      if (typeof group2 != "string" && !(group2 instanceof String)) {
        console.warn("JAQT: groupBy(selector) can only handle string values, got:", group2);
        continue;
      }
      if (!result[group2]) {
        result[group2] = [];
      }
      result[group2].push(entity);
    }
  }
  return result;
}
function groupBy(data, pointerFunctions) {
  let pointerFn = pointerFunctions.shift();
  if (typeof pointerFn == "string") {
    pointerFn = _[pointerFn];
  }
  if (typeof pointerFn != "function") {
    throw new Error("groupBy parameters must be either a property name or a pointer function (e.g.: _.name)");
  }
  let groups = getMatchingGroups(data, pointerFn);
  if (pointerFunctions.length) {
    for (let group2 in groups) {
      groups[group2] = groupBy(groups[group2], pointerFunctions);
    }
  }
  return groups;
}
function anyOf(...patterns) {
  let matchFns = patterns.map((pattern) => getMatchFn(pattern));
  return (data) => matchFns.some((fn) => fn(data));
}
var FunctionProxyHandler = {
  apply(target, thisArg, argumentsList) {
    let result = target.apply(thisArg, argumentsList);
    if (typeof result === "object") {
      return new Proxy(result, DataProxyHandler);
    }
    return result;
  }
};
var DataProxyHandler = {
  get(target, property) {
    let result = null;
    if (typeof property === "symbol") {
      result = target[property];
    }
    if (property === "toArray") {
      result = function() {
        if (Array.isArray(target)) {
          return Array.from(target);
        }
        return [target];
      };
    }
    if (Array.isArray(target)) {
      switch (property) {
        case "where":
          result = function(shape) {
            let matchFn = getMatchFn(shape);
            return new Proxy(
              target.filter((element2) => matchFn(element2)),
              DataProxyHandler
            );
          };
          break;
        case "select":
          result = function(filter2) {
            let selectFn = getSelectFn(filter2);
            return new Proxy(
              target.map(selectFn),
              DataProxyHandler
            );
          };
          break;
        case "reduce":
          result = function(pattern, initial = []) {
            let aggregateFn = getAggregateFn(pattern);
            let temp = target.reduce(aggregateFn, initial);
            if (Array.isArray(temp)) {
              return new Proxy(temp, DataProxyHandler);
            } else if (!isPrimitiveWrapper2(temp)) {
              return new Proxy(temp, GroupByProxyHandler);
            } else {
              return temp;
            }
          };
          break;
        case "orderBy":
          result = function(pattern) {
            let sortFn = getSortFn(pattern);
            return new Proxy(
              target.toSorted(sortFn),
              DataProxyHandler
            );
          };
          break;
        case "groupBy":
          result = function(...groups) {
            let temp = groupBy(target, groups);
            return new Proxy(
              temp,
              GroupByProxyHandler
            );
          };
          break;
      }
    }
    if (!result && target && typeof target === "object") {
      if (property === "select") {
        result = function(filter2) {
          let selector = getSelectFn(filter2);
          return new Proxy(selector(target), DataProxyHandler);
        };
      }
    }
    if (!result && target && typeof target[property] === "function") {
      result = new Proxy(target[property], FunctionProxyHandler);
    }
    if (!result) {
      result = target[property];
    }
    return result;
  }
};
var GroupByProxyHandler = {
  get(target, property) {
    let result = null;
    switch (property) {
      case "select":
        result = function(filter2) {
          let selectFn = getSelectFn(filter2);
          let result2 = {};
          for (let group2 in target) {
            if (Array.isArray(target[group2])) {
              result2[group2] = new Proxy(target[group2].map(selectFn), DataProxyHandler);
            } else {
              result2[group2] = new Proxy(target[group2], GroupByProxyHandler);
            }
          }
          return result2;
        };
        break;
      case "reduce":
        result = function(pattern, initial = []) {
          let aggregateFn = getAggregateFn(pattern);
          let result2 = {};
          for (let group2 in target) {
            if (Array.isArray(target[group2])) {
              let temp = target[group2].reduce(aggregateFn, initial);
              if (Array.isArray(temp)) {
                result2[group2] = new Proxy(temp, DataProxyHandler);
              } else if (!isPrimitiveWrapper2(temp)) {
                result2[group2] = new Proxy(temp, GroupByProxyHandler);
              } else {
                result2[group2] = temp;
              }
            } else {
              result2[group2] = new Proxy(target[group2], GroupByProxyHandler);
            }
          }
          return result2;
        };
        break;
      default:
        if (Array.isArray(target[property])) {
          result = from(target[property]);
        } else {
          result = target[property];
        }
        break;
    }
    return result;
  }
};
var EmptyHandler = {
  get(target, property) {
    let result = null;
    switch (property) {
      case "toArray":
        result = function() {
          return [];
        };
        break;
      case "where":
        result = function() {
          return new Proxy(new Null(), EmptyHandler);
        };
        break;
      case "reduce":
      case "select":
        result = function() {
          return null;
        };
        break;
      case "orderBy":
        result = function() {
          return new Proxy(new Null(), EmptyHandler);
        };
        break;
      case "groupBy":
        result = function() {
          return new Proxy(new Null(), EmptyHandler);
        };
        break;
    }
    if (!result && typeof target?.[property] == "function") {
      result = target[property];
    }
    return result;
  }
};
var Null = class {
  toJSON() {
    return null;
  }
};
function from(data) {
  if (!data || typeof data !== "object") {
    return new Proxy(new Null(), EmptyHandler);
  }
  return new Proxy(data, DataProxyHandler);
}
function getPointerFn(path2) {
  return (data, key) => {
    if (path2?.length > 0) {
      let localPath = path2.slice();
      let prop = localPath.shift();
      while (prop) {
        if (Array.isArray(data) && parseInt(prop) != prop) {
          localPath.unshift(prop);
          return data.map(getPointerFn(localPath));
        } else if (typeof data?.[prop] != "undefined") {
          data = data[prop];
        } else {
          data = null;
        }
        prop = localPath.shift();
      }
      return data;
    } else if (key && key !== "_") {
      if (typeof data?.[key] != "undefined") {
        return data[key];
      } else {
        return null;
      }
    } else {
      return data;
    }
  };
}
var pointerHandler = (path2) => {
  if (!path2) {
    path2 = [];
  }
  return {
    get(target, property) {
      if (property == "constructor" || typeof property == "symbol") {
        return target[property];
      }
      let newpath = path2.concat([property]);
      return new Proxy(getPointerFn(newpath), pointerHandler(newpath));
    },
    apply(target, thisArg, argumentsList) {
      let result = target(...argumentsList);
      if (Array.isArray(result)) {
        result = result.flat(Infinity);
      }
      return result;
    }
  };
};
var _ = new Proxy(getPointerFn(), pointerHandler());

// node_modules/@muze-nl/assert/src/assert-core.mjs
var assert_core_exports = {};
__export(assert_core_exports, {
  Optional: () => Optional,
  Recommended: () => Recommended,
  Required: () => Required,
  allOf: () => allOf,
  anyOf: () => anyOf2,
  assert: () => assert,
  check: () => check,
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
  if (value === Array) {
    return "array";
  }
  if (value === Object) {
    return "object";
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
  if (value === String || value === Number || value === Boolean || value === Array || value === Object) {
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
function conciseMessage(message2, actual, expected) {
  if (message2 == "data and pattern are not equal") {
    return `expected ${formatValue(expected)}, found ${formatValue(actual)}`;
  }
  if (message2 == "data does not match pattern" || /^data\[\d+\] does not match pattern$/.test(message2)) {
    return `expected ${describeExpected(expected)}, found ${formatValue(actual)}`;
  }
  if (message2 == "data is undefined, should match pattern") {
    return `missing; expected ${describeExpected(expected)}`;
  }
  if (message2 == "data is required") {
    return "required";
  }
  if (message2 == "data is an empty string, which is not allowed") {
    return "empty string is not allowed";
  }
  if (message2 == "data is not an object, pattern is") {
    return "data is not an object";
  }
  if (message2 == "data is not an instanceof pattern") {
    return `expected instance of ${describeExpected(expected)}, found ${formatValue(actual)}`;
  }
  if (message2 == "data does not match oneOf patterns" || message2 == "data does not match anyOf patterns") {
    return `expected one of ${describeOneOf(expected)}, found ${formatValue(actual)}`;
  }
  if (message2 == "data matches pattern, when required not to") {
    return `must not match ${describeExpected(expected)}`;
  }
  return message2;
}
function formatIssue(issue, options = {}) {
  if (!issue || typeof issue != "object") {
    return String(issue);
  }
  let path2 = issue.pathString || pathToString(issue.path || []) || "value";
  let indent = options.indent ?? "";
  return `${indent}${path2}: ${issue.message}`;
}
function formatIssues(issues4, options = {}) {
  if (!issues4) {
    return false;
  }
  let indent = options.indent ?? "  - ";
  return (Array.isArray(issues4) ? issues4 : [issues4]).map((issue) => formatIssue(issue, { ...options, indent }));
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
  let message2 = conciseMessage(problem.message, actual, problem.expected);
  return {
    path: path2,
    pathString,
    message: message2,
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
function assertionError(source2, problems, message2 = "Assertions failed", ErrorType = Error) {
  let assertionIssues = problemsToIssues(problems);
  let formattedIssues = formatIssues(assertionIssues);
  return new ErrorType(message2 + ":\n" + formattedIssues.join("\n"), {
    cause: { problems, issues: assertionIssues, source: source2 }
  });
}
function assert(source2, test) {
  if (assertEnabled) {
    let problems = fails(source2, test);
    if (problems) {
      let error4 = assertionError(source2, problems);
      console.error("\u{1F170}\uFE0F  " + error4.message);
      throw error4;
    }
  }
}
function check(source2, test, message2 = "Assertions failed", ErrorType = Error) {
  let problems = fails(source2, test);
  if (problems) {
    throw assertionError(source2, problems, message2, ErrorType);
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
function anyOf2(...patterns) {
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
    let url2 = new URL(data);
    if (url2.href != data) {
      if (!(url2.href + "/" == data || url2.href == data + "/")) {
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
  } else if (pattern === Array) {
    if (!Array.isArray(data)) {
      problems.push(error("data is not an array", data, pattern, path2));
    }
  } else if (pattern === Object) {
    if (!data || typeof data != "object" || Array.isArray(data)) {
      problems.push(error("data is not an object", data, pattern, path2));
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
function error(message2, found, expected, path2 = "", problems) {
  let pathParts = pathToArray(path2);
  let result = {
    path: path2,
    pathString: pathToString(pathParts),
    pathParts,
    message: message2,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn(message2, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message2, pattern, data);
}

// node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assert = { ...assert_core_exports };

// node_modules/@muze-labs/solid-workspace/src/collection.mjs
function collection(options = {}) {
  return {
    kind: "collection",
    ...options
  };
}
var WorkspaceCollection = class {
  constructor(workspace2, name, descriptor = {}) {
    check(descriptor, Object, "solid-workspace: collection descriptor must be an object", TypeError);
    check(descriptor.sources, Optional(Array), "solid-workspace: collection sources must be an array", TypeError);
    this.workspace = workspace2;
    this.name = name;
    this.descriptor = descriptor;
  }
  list() {
    const className = this.descriptor.shape?.for;
    return from(this.workspace.sourceSubjects(this.descriptor.sources)).where((object) => !isDeleted(object)).where((object) => !this.workspace.recordFor(object)?.deleted).where((object) => !className || src_default2.many(object.a).includes(className)).toArray();
  }
  get(id2) {
    return this.list().find((object) => object.id === id2) ?? null;
  }
  async create(object = {}, options = {}) {
    const createIn = options.createIn ?? this.descriptor.createIn;
    if (!createIn) {
      throw new Error(`solid-workspace: collection ${this.name} needs createIn to create objects`);
    }
    let data = { ...object };
    if (this.descriptor.shape?.applyDefaults) {
      data = this.descriptor.shape.applyDefaults(object);
    }
    if (this.descriptor.shape) {
      this.descriptor.shape.assert(data, {
        message: `solid-workspace: ${this.name} object does not match its shape`
      });
    }
    return this.workspace.createIn(createIn, data, {
      ...options,
      save: options.save ?? false
    });
  }
  update(object, changes = {}) {
    if (changes.id != null && changes.id !== object.id) {
      throw new Error("solid-workspace: an update cannot change subject identity");
    }
    if (!this.workspace.recordFor(object)) {
      throw new Error("solid-workspace: cannot update a detached subject");
    }
    return writeSubjectToGraph({
      graph: object.graph,
      subject: changes,
      id: object.id,
      replace: true
    });
  }
  delete(object, options = {}) {
    return this.workspace.delete(object, options);
  }
  save(object, options = {}) {
    return this.workspace.save(object, options);
  }
  saveAll() {
    const className = this.descriptor.shape?.for;
    const subjects = this.workspace.sourceSubjects(this.descriptor.sources).filter((object) => !className || src_default2.many(object.a).includes(className));
    return this.workspace.saveAll(subjects);
  }
};

// node_modules/@muze-labs/solid-workspace/src/sources.mjs
function resource(idOrOptions, options = {}) {
  let config = { ...idOrOptions };
  if (typeof idOrOptions === "string") {
    config = { ...options, id: idOrOptions };
  }
  if (!config.id) {
    throw new TypeError("solid-workspace: resource id is required");
  }
  if (!config.local && !config.remote) {
    throw new TypeError("solid-workspace: resource() needs a local or remote replica");
  }
  if (config.local) {
    assertWorkspaceSource(config.local, "local");
  }
  if (config.remote) {
    assertWorkspaceSource(config.remote, "remote");
  }
  return Object.freeze({
    ...config,
    workspacePart: "resource",
    type: config.type ?? "replicated-resource",
    id: String(config.id)
  });
}
var solid = {
  resource(url2, options = {}) {
    return source("resource", url2, {
      type: "solid-resource",
      ...options
    });
  },
  container(url2, options = {}) {
    return source("container", ensureSlash(url2), {
      type: "solid-container",
      ...options
    });
  },
  client(client2, options = {}) {
    if (!client2) {
      throw new TypeError("solid-workspace: solid client is required");
    }
    return Object.freeze({
      ...options,
      workspacePart: "client",
      type: options.type ?? "solid-api-client",
      client: client2
    });
  }
};
var graph = {
  resource(options = {}) {
    return graphResource(options);
  }
};
var WorkspaceSources = class {
  #sourceById;
  #resourceById;
  #sourcePatterns;
  constructor() {
    this.sources = [];
    this.resources = [];
    this.#sourceById = /* @__PURE__ */ new Map();
    this.#resourceById = /* @__PURE__ */ new Map();
    this.#sourcePatterns = /* @__PURE__ */ new Map();
  }
  add(sourceOrSources) {
    const selected = Array.isArray(sourceOrSources) ? sourceOrSources : [sourceOrSources];
    const sources = normalizeSources(selected);
    for (const source2 of sources) {
      const index = this.sources.findIndex((item) => item.id === source2.id);
      if (index >= 0) {
        this.sources[index] = source2;
      } else {
        this.sources.push(source2);
      }
      this.#sourceById.set(source2.id, source2);
      this.#sourcePatterns.set(source2.id, source2.id);
    }
    return sources;
  }
  addResource(part) {
    if (part?.workspacePart !== "resource") {
      throw new TypeError("solid-workspace: addResource() expects a resource() workspace part");
    }
    const existing = this.#resourceById.get(part.id);
    let current = {
      id: part.id,
      type: part.type ?? "replicated-resource",
      local: null,
      remote: null
    };
    if (existing) {
      current = { ...existing };
    }
    current.baseURI = part.baseURI ?? current.baseURI;
    current.prefixes = part.prefixes ?? current.prefixes;
    current.scalarPredicates = part.scalarPredicates ?? current.scalarPredicates ?? [];
    current.ownedPredicates = part.ownedPredicates ?? current.ownedPredicates ?? [];
    let remoteSource = current.remote;
    if (part.remote) {
      remoteSource = resourceReplicaSource(part.remote, {
        resource: current,
        replica: "remote"
      });
    }
    let localSource = current.local;
    if (part.local) {
      localSource = resourceReplicaSource(part.local, {
        resource: current,
        replica: "local",
        syncTo: remoteSource?.id
      });
    } else if (current.local && remoteSource) {
      localSource = resourceReplicaSource(current.local, {
        resource: current,
        replica: "local",
        syncTo: remoteSource.id
      });
    }
    if (localSource) {
      current.local = this.add(localSource)[0];
    }
    if (remoteSource) {
      current.remote = this.add(remoteSource)[0];
    }
    const index = this.resources.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      this.resources[index] = current;
    } else {
      this.resources.push(current);
    }
    this.#resourceById.set(current.id, current);
    this.#sourcePatterns.set(current.id, (current.local ?? current.remote).id);
    return current;
  }
  isResource(value) {
    return Boolean(value?.workspacePart === "resource" || typeof value === "string" && this.#resourceById.has(value));
  }
  sourceIds(sources) {
    return new Set(sources.map((source2) => this.#sourcePatterns.get(source2?.id ?? source2) ?? source2?.id ?? source2));
  }
  resolveSources(sources = this.sources) {
    const selected = Array.isArray(sources) ? sources : [sources];
    return selected.map((source2) => this.resolveSource(source2));
  }
  resolveSource(sourceOrId) {
    if (!sourceOrId) {
      throw new TypeError("solid-workspace: source is required");
    }
    if (typeof sourceOrId === "string") {
      const descriptor = this.#sourceById.get(sourceOrId);
      if (!descriptor) {
        throw new Error(`solid-workspace: unknown source ${sourceOrId}`);
      }
      return descriptor;
    }
    return sourceOrId;
  }
  resolveResource(resourceOrId) {
    if (!resourceOrId) {
      throw new TypeError("solid-workspace: resource is required");
    }
    if (typeof resourceOrId === "string") {
      const logicalResource = this.#resourceById.get(resourceOrId);
      if (!logicalResource) {
        throw new Error(`solid-workspace: unknown resource ${resourceOrId}`);
      }
      return logicalResource;
    }
    if (resourceOrId.workspacePart === "resource") {
      return this.#resourceById.get(resourceOrId.id) ?? resourceOrId;
    }
    return resourceOrId;
  }
  resolveCreateSource(sourceOrResourceOrId) {
    if (this.isResource(sourceOrResourceOrId)) {
      const logicalResource = this.resolveResource(sourceOrResourceOrId);
      if (!logicalResource.local) {
        throw new Error(`solid-workspace: resource ${logicalResource.id} needs a local replica for local-first writes`);
      }
      return logicalResource.local;
    }
    return this.resolveSource(sourceOrResourceOrId);
  }
};
function graphResource(options = {}) {
  check(options, Object, "solid-workspace: graph resource options must be an object", TypeError);
  if (!options.id) {
    throw new TypeError("solid-workspace: graph resource id is required");
  }
  if (!options.url) {
    throw new TypeError("solid-workspace: graph resource url is required");
  }
  if (typeof options.load !== "function") {
    throw new TypeError("solid-workspace: graph resource load() is required");
  }
  return Object.freeze({
    ...options,
    workspacePart: "source",
    kind: "resource",
    type: options.type ?? "graph-resource",
    readOnly: Boolean(options.readOnly),
    shape: options.shape ?? null,
    options: options.options ?? {},
    writeOptions: options.writeOptions,
    id: options.id,
    url: String(options.url)
  });
}
function source(kind, url2, options) {
  if (!url2) {
    throw new TypeError("solid-workspace: source url is required");
  }
  return Object.freeze({
    ...options,
    workspacePart: "source",
    kind,
    type: options.type ?? kind,
    id: options.id ?? String(url2),
    url: String(url2),
    readOnly: Boolean(options.readOnly),
    shape: options.shape ?? null,
    options: options.options ?? {}
  });
}
function assertWorkspaceSource(descriptor, role = "source") {
  if (descriptor?.workspacePart !== "source") {
    throw new TypeError(`solid-workspace: resource ${role} replica must be a source from a factory`);
  }
}
function resourceReplicaSource(descriptor, { resource: resource2, replica, syncTo } = {}) {
  assertWorkspaceSource(descriptor, replica);
  return Object.freeze({
    ...descriptor,
    baseURI: resource2.baseURI ?? descriptor.baseURI,
    prefixes: resource2.prefixes ?? descriptor.prefixes,
    logicalResource: resource2.id,
    replica,
    syncTo: syncTo ?? descriptor.syncTo
  });
}
function normalizeSources(sources) {
  check(sources, Array, "solid-workspace: sources must be an array", TypeError);
  return sources.map((descriptor) => {
    check(descriptor, {
      kind: oneOf("resource", "container")
    }, "solid-workspace: sources must be solid.resource() or solid.container() descriptors", TypeError);
    return descriptor;
  });
}
function ensureSlash(url2) {
  return String(url2).endsWith("/") ? String(url2) : `${url2}/`;
}
function resourceSources(logicalResource) {
  return [logicalResource.local, logicalResource.remote].filter(Boolean);
}
function recordSourceId(record) {
  return record.source?.parent?.id ?? record.source?.id ?? null;
}

// node_modules/@muze-labs/solid-workspace/src/working-graphs.mjs
var WorkingGraphs = class {
  #graphSources;
  #records;
  #objects;
  constructor(context) {
    this.context = context;
    this.#graphSources = /* @__PURE__ */ new Map();
    this.#records = [];
    this.#objects = /* @__PURE__ */ new WeakMap();
  }
  graph(source2) {
    return this.context.graph(source2.url) ?? null;
  }
  snapshot(url2) {
    return copyGraph(this.context.graph(url2));
  }
  replaceSource(descriptor) {
    for (const [url2, owner] of this.#graphSources) {
      if (recordSourceId({ source: owner }) === descriptor.id) {
        const source2 = owner.parent ? { ...owner, parent: descriptor, readOnly: descriptor.readOnly } : descriptor;
        this.#graphSources.set(url2, source2);
      }
    }
    for (const record of this.#records) {
      const source2 = this.#graphSources.get(record.sourceUrl);
      if (source2) {
        record.source = source2;
        record.sourceId = recordSourceId(record);
        record.readOnly = Boolean(source2.readOnly);
      }
    }
  }
  installGraph(source2, snapshot) {
    const options = {
      context: this.context,
      url: source2.url,
      baseURI: source2.baseURI,
      prefixes: { ...snapshot?.prefixDeclarations(), ...source2.prefixes }
    };
    const graph3 = snapshot ? copyGraph(snapshot, options) : emptyGraph({
      ...options,
      prefixes: source2.prefixes
    });
    this.context.addGraph(graph3);
    this.#graphSources.set(graph3.url, source2);
    this.refreshGraphRecords(graph3, source2);
    return graph3;
  }
  refreshGraphRecords(graph3, source2) {
    const retained = new Map(this.#records.filter((record) => record.sourceUrl === graph3.url).map((record) => [record.object, record]));
    this.#records = this.#records.filter((record) => record.sourceUrl !== graph3.url);
    this.#objects = /* @__PURE__ */ new WeakMap();
    for (const record of this.#records) {
      this.#objects.set(record.object, record);
    }
    for (const object of graph3.data) {
      if (Object.keys(object).length > 1) {
        const record = retained.get(object);
        if (record) {
          record.source = source2;
          this.#records.push(record);
          this.#objects.set(object, record);
        } else {
          this.track(object, {
            source: source2,
            sourceUrl: graph3.url,
            data: graph3,
            status: "loaded"
          });
        }
      }
    }
  }
  clearSourceGraphs(source2) {
    for (const [url2, owner] of this.#graphSources) {
      if (recordSourceId({ source: owner }) === source2.id) {
        this.installGraph(owner, null);
        this.#graphSources.delete(url2);
      }
    }
  }
  recordFor(object) {
    const graph3 = object?.graph;
    if (!graph3 || this.context.graph(graph3.url) !== graph3) {
      return null;
    }
    const source2 = this.#graphSources.get(graph3.url);
    if (!source2 || graph3.get(object.id) !== object) {
      return null;
    }
    return this.#objects.get(object) ?? this.track(object, {
      source: source2,
      sourceUrl: graph3.url,
      data: graph3,
      status: "loaded"
    });
  }
  track(object, options = {}) {
    check(object, Object, "solid-workspace: can only track object values", TypeError);
    const record = {
      object,
      source: options.source ?? null,
      sourceId: recordSourceId(options),
      sourceUrl: options.sourceUrl ?? options.source?.url ?? object.id ?? null,
      data: options.data ?? null,
      response: options.response ?? null,
      status: options.status ?? "loaded",
      readOnly: Boolean(options.readOnly ?? options.source?.readOnly),
      created: Boolean(options.created),
      deleted: Boolean(options.deleted),
      error: null
    };
    this.#records.push(record);
    this.#objects.set(object, record);
    return record;
  }
  sourcesOf(object, predicate, value) {
    let graphs;
    if (arguments.length < 3) {
      graphs = this.context.sources(object, predicate);
    } else {
      graphs = this.context.sources(object, predicate, value);
    }
    return graphs.map((graph3) => ({
      sourceUrl: graph3.url,
      source: this.#graphSources.get(graph3.url) ?? null,
      record: this.#records.find((record) => record.sourceUrl === graph3.url && record.object.id === object.id) ?? null
    }));
  }
  subjects(ids2) {
    const subjects = [];
    for (const [url2, source2] of this.#graphSources) {
      if (ids2.size === 0 || ids2.has(recordSourceId({ source: source2 }))) {
        const graph3 = this.context.graph(url2);
        for (const object of graph3.data) {
          if (Object.keys(object).length > 1) {
            subjects.push(object);
          }
        }
      }
    }
    return subjects;
  }
  create(descriptor, object) {
    let source2 = descriptor;
    if (descriptor.kind === "container") {
      source2 = {
        ...descriptor,
        kind: "resource",
        url: `urn:solid-workspace:new:${globalThis.crypto.randomUUID()}`,
        parent: descriptor,
        createContainer: descriptor.url
      };
    }
    let graph3 = this.context.graph(source2.url);
    if (!graph3) {
      graph3 = this.installGraph(source2, null);
    }
    const node = writeSubjectToGraph({
      graph: graph3,
      subject: object,
      id: object.id ?? `urn:uuid:${globalThis.crypto.randomUUID()}`
    });
    this.refreshGraphRecords(graph3, source2);
    const record = this.#objects.get(node) ?? this.track(node, {
      source: source2,
      sourceUrl: graph3.url,
      data: graph3
    });
    record.status = "new";
    record.created = true;
    return node;
  }
  relocate(record, location) {
    const previous = record.source;
    const source2 = { ...previous, url: location };
    delete source2.createContainer;
    const graph3 = this.context.graph(previous.url);
    this.installGraph(previous, null);
    this.#graphSources.delete(previous.url);
    graph3.url = source2.url;
    graph3.baseURI = source2.url.split("#")[0];
    this.context.addGraph(graph3);
    this.#graphSources.set(source2.url, source2);
    record.source = source2;
    record.sourceUrl = source2.url;
    this.#records.push(record);
    this.#objects.set(record.object, record);
  }
};

// node_modules/@muze-labs/solid-workspace/src/status.mjs
function updateRecordStatus(record, status2) {
  record.status = status2.status;
  record.error = status2.error ?? null;
  record.response = status2.response ?? record.response;
  return statusFor(record, status2);
}
function statusFor(record, status2 = {}) {
  return {
    object: record.object,
    sourceUrl: record.sourceUrl,
    source: record.source,
    ...status2
  };
}
function sourceStatus(source2, status2 = {}) {
  return {
    id: source2.id,
    type: source2.type ?? source2.kind ?? "source",
    url: source2.url ?? null,
    local: Boolean(source2.local),
    logicalResource: source2.logicalResource ?? null,
    replica: source2.replica ?? null,
    state: status2.state ?? "idle",
    error: status2.error ?? null,
    syncPending: Boolean(status2.syncPending),
    pendingFrom: src_default2.many(status2.pendingFrom)
  };
}
function workspaceState(status2) {
  const states = Object.values(status2.sources).map((status3) => status3.state);
  if (states.length === 0) {
    return "idle";
  }
  if (states.some((state) => state === "ready" || state === "sync-pending")) {
    return "ready";
  }
  if (states.some((state) => state === "opening" || state === "syncing")) {
    return "opening";
  }
  return "error";
}
function resourceState(status2, logicalResource) {
  const states = resourceSources(logicalResource).map((source2) => status2.sources[source2.id]?.state).filter(Boolean);
  if (states.length === 0) {
    return "idle";
  }
  if (states.some((state) => state === "sync-pending")) {
    return "sync-pending";
  }
  if (states.some((state) => state === "ready")) {
    return "ready";
  }
  if (states.some((state) => state === "opening" || state === "syncing")) {
    return "opening";
  }
  return states[0] ?? "idle";
}
function sourceFailureState(error4) {
  const status2 = errorStatus(error4);
  if (status2 === 401 || status2 === 403) {
    return "auth-needed";
  }
  if (!status2 || error4?.name === "TypeError") {
    return "offline";
  }
  return "error";
}
function errorStatus(error4) {
  return error4?.cause?.status;
}
var WorkspaceStatus = class {
  constructor() {
    this.value = { state: "idle", error: null, sources: {}, resources: {} };
  }
  source(descriptor, status2 = {}) {
    const source2 = descriptor?.parent ?? descriptor;
    if (!source2?.id) {
      return null;
    }
    const current = this.value?.sources?.[source2.id] ?? {};
    const next = sourceStatus(source2, {
      ...current,
      ...status2
    });
    this.value.sources[source2.id] = next;
    return next;
  }
  resource(logicalResource, status2 = {}) {
    if (!logicalResource?.id) {
      return null;
    }
    const current = this.value?.resources?.[logicalResource.id] ?? {};
    const next = {
      id: logicalResource.id,
      type: logicalResource.type ?? "replicated-resource",
      local: logicalResource.local?.id ?? null,
      remote: logicalResource.remote?.id ?? null,
      state: status2.state ?? current.state ?? "idle",
      error: Object.hasOwn(status2, "error") ? status2.error : current.error ?? null
    };
    this.value.resources[logicalResource.id] = next;
    return next;
  }
  pending(from2, targets) {
    for (const source2 of targets) {
      const current = this.value.sources[source2.id] ?? sourceStatus(source2, { state: "idle" });
      let state = "sync-pending";
      if (current.state === "opening" || current.state === "syncing") {
        state = current.state;
      }
      this.source(source2, {
        ...current,
        state,
        syncPending: true,
        pendingFrom: [.../* @__PURE__ */ new Set([
          ...src_default2.many(current.pendingFrom),
          ...src_default2.many(from2)
        ])]
      });
    }
    return this;
  }
  clearPending(source2) {
    const current = this.value.sources[source2.id] ?? sourceStatus(source2, { state: "idle" });
    let state = current.state;
    if (current.state === "sync-pending") {
      state = "ready";
    }
    this.source(source2, {
      ...current,
      state,
      syncPending: false,
      pendingFrom: []
    });
    return this;
  }
};

// node_modules/@muze-labs/solid-workspace/src/source-io.mjs
var SourceIO = class {
  constructor(solid2, workspace2) {
    this.solid = solid2;
    this.workspace = workspace2;
  }
  contains(source2) {
    assertSolidClient(this.solid);
    return this.solid.contains(source2.url, source2.options);
  }
  async read(source2, options = {}) {
    if (source2.kind !== "resource") {
      throw new Error("solid-workspace: graphs can only be loaded from resource sources");
    }
    if (typeof source2.load === "function") {
      const turtle = await source2.load({
        source: source2,
        workspace: this.workspace,
        ...options.readOptions
      });
      return parseGraph(turtle, source2);
    }
    assertSolidClient(this.solid);
    try {
      const response2 = await this.solid.get(source2.url, requestOptions({
        ...source2.options,
        ...options.readOptions
      }));
      if (response2 instanceof src_default2.Graph) {
        return copyGraph(response2, { url: source2.url });
      }
      return parseGraph(response2, source2);
    } catch (error4) {
      const status2 = errorStatus(error4);
      if (status2 === 404 || status2 === 410) {
        return emptyGraph(source2);
      }
      throw error4;
    }
  }
  async write(source2, snapshot, options = {}) {
    if (typeof source2.save === "function") {
      const result = await source2.save(await this.serialize(source2, snapshot), {
        source: source2,
        workspace: this.workspace,
        ...options
      });
      if (result?.ok === false) {
        throw result.error ?? new Error("solid-workspace: source save failed", { cause: result });
      }
      return result;
    }
    assertSolidClient(this.solid);
    const response2 = await this.solid.put(source2.url, bodyOptions(await this.serialize(source2, snapshot), writeOptions(source2, options)));
    assertWriteSucceeded(response2);
    return response2;
  }
  async create(source2, snapshot, options = {}) {
    assertSolidClient(this.solid);
    const turtle = await this.serialize(source2, snapshot);
    const request2 = writeOptions(source2, options);
    const response2 = source2.createContainer ? await this.solid.postToContainer(source2.createContainer, turtle, request2) : await this.solid.create(source2.url, turtle, request2);
    assertWriteSucceeded(response2);
    return response2;
  }
  serialize(source2, snapshot) {
    const output = source2.prefixes ? copyGraph(snapshot, {
      prefixes: { ...snapshot.prefixDeclarations(), ...source2.prefixes }
    }) : snapshot;
    return output.write();
  }
  async remove(url2, options = {}) {
    assertSolidClient(this.solid);
    const response2 = await this.solid.delete(url2, requestOptions(options));
    assertWriteSucceeded(response2);
    return response2;
  }
};
function assertWriteSucceeded(response2) {
  if (response2?.ok === false) {
    throw new Error(
      `solid-workspace: remote save failed (${response2.status})`,
      { cause: response2 }
    );
  }
}
function assertSolidClient(solid2) {
  if (!solid2) {
    throw new TypeError("solid-workspace: a Solid API client is required for Solid sources");
  }
}
function writeOptions(source2, options) {
  const headers = new Headers(source2?.writeOptions?.headers);
  for (const [key, value] of new Headers(options?.headers)) {
    headers.set(key, value);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "text/turtle");
  }
  return {
    ...source2?.writeOptions,
    ...options,
    headers
  };
}
function requestOptions(options = {}) {
  return {
    ...options,
    headers: new Headers(options.headers)
  };
}
function bodyOptions(body, options = {}) {
  return {
    ...options,
    body,
    headers: new Headers(options.headers)
  };
}

// node_modules/@muze-labs/solid-workspace/src/operations.mjs
var ResourceOperations = class {
  #operations;
  #revisions;
  constructor() {
    this.#operations = /* @__PURE__ */ new Map();
    this.#revisions = /* @__PURE__ */ new Map();
  }
  admit(key) {
    this.#revisions.set(key, this.revision(key) + 1);
  }
  revision(key) {
    return this.#revisions.get(key) ?? 0;
  }
  sequence(key, operation) {
    const previous = this.#operations.get(key) ?? Promise.resolve();
    const current = previous.catch(() => {
    }).then(operation);
    this.#operations.set(key, current);
    current.finally(() => {
      if (this.#operations.get(key) === current) {
        this.#operations.delete(key);
      }
    }).catch(() => {
    });
    return current;
  }
};

// node_modules/@muze-labs/solid-workspace/src/replica-sync.mjs
var ReplicaSync = class {
  constructor({ graphs, io, state, operations }) {
    this.graphs = graphs;
    this.io = io;
    this.state = state;
    this.operations = operations;
  }
  open(resource2, options = {}) {
    return this.operations.sequence(resource2.id, () => this.openReplica(resource2, options));
  }
  sync(resource2, options = {}) {
    return this.operations.sequence(resource2.id, () => this.syncReplica(resource2, options));
  }
  async openReplica(logicalResource, options) {
    const revision = this.operations.revision(logicalResource.id);
    const sources = resourceSources(logicalResource);
    const loaded = [];
    const failures = [];
    this.state.value.state = "opening";
    this.state.value.error = null;
    this.state.resource(logicalResource, { state: "opening", error: null });
    for (const source2 of sources) {
      this.state.source(source2, { state: "opening", error: null });
      try {
        const snapshot = await this.io.read(source2, options);
        loaded.push({ source: source2, snapshot });
        this.state.source(source2, { state: "ready", error: null });
      } catch (error4) {
        failures.push({ source: source2, error: error4 });
        this.state.source(source2, { state: sourceFailureState(error4), error: error4 });
      }
    }
    const isCurrent = () => this.operations.revision(logicalResource.id) === revision;
    const local2 = loaded.find((entry) => entry.source === logicalResource.local);
    const remote = loaded.find((entry) => entry.source === logicalResource.remote);
    if (isCurrent() && local2 && remote) {
      try {
        local2.snapshot = mergeReplicas([local2.snapshot, remote.snapshot], logicalResource);
        await this.io.write(local2.source, local2.snapshot, options.writeOptions);
      } catch (error4) {
        failures.push({ source: local2.source, error: error4 });
        this.state.source(local2.source, { state: sourceFailureState(error4), error: error4 });
      }
    }
    if (isCurrent()) {
      for (const { source: source2, snapshot } of loaded) {
        if (failures.some((failure) => failure.source === source2)) {
          continue;
        }
        this.graphs.installGraph(source2, snapshot);
      }
    }
    this.state.value.lastOpen = { resource: logicalResource, sources, loaded, failures };
    this.state.value.state = workspaceState(this.state.value);
    this.state.value.error = failures[0]?.error ?? null;
    this.state.resource(logicalResource, {
      state: failures.some((failure) => failure.source === logicalResource.local) ? "error" : resourceState(this.state.value, logicalResource),
      error: failures[0]?.error ?? null
    });
    if (options.throwOnError && failures.length) {
      throw failures[0].error;
    }
  }
  async syncReplica(logicalResource, options = {}) {
    const localSource = logicalResource.local;
    const remoteSource = logicalResource.remote;
    if (!localSource || !remoteSource) {
      throw new Error(`solid-workspace: resource ${logicalResource.id} needs local and remote replicas to sync`);
    }
    if (remoteSource.readOnly) {
      throw new Error(`solid-workspace: source ${remoteSource.id} is read-only`);
    }
    const revision = this.operations.revision(logicalResource.id);
    const isCurrent = () => this.operations.revision(logicalResource.id) === revision;
    this.state.resource(logicalResource, { state: "syncing", error: null });
    this.state.source(remoteSource, { state: "syncing", error: null });
    let activeSource = remoteSource;
    let snapshot;
    let localSaved = false;
    try {
      const remoteGraph = await this.io.read(remoteSource, options);
      if (!isCurrent()) {
        return this.pendingReplica(logicalResource);
      }
      snapshot = mergeReplicas([
        remoteGraph,
        this.graphs.graph(localSource)
      ], logicalResource);
      activeSource = localSource;
      await this.io.write(localSource, snapshot, options.localWriteOptions ?? options.writeOptions);
      localSaved = true;
      this.state.source(localSource, { state: "ready", error: null });
      if (!isCurrent()) {
        return this.pendingReplica(logicalResource);
      }
      activeSource = remoteSource;
      const response2 = await this.io.write(remoteSource, snapshot, options.writeOptions);
      if (!isCurrent()) {
        return this.pendingReplica(logicalResource);
      }
      this.publishReplica(localSource, snapshot);
      this.publishReplica(remoteSource, snapshot);
      this.state.clearPending(remoteSource);
      this.state.resource(logicalResource, { state: "ready", error: null });
      return { ok: true, status: "synced", resource: logicalResource, source: remoteSource, sourceUrl: remoteSource.url, graph: snapshot, response: response2 };
    } catch (error4) {
      if (localSaved && isCurrent()) {
        this.publishReplica(localSource, snapshot);
      }
      this.pendingReplica(logicalResource);
      this.state.source(activeSource, { state: sourceFailureState(error4), error: error4 });
      this.state.resource(logicalResource, {
        state: activeSource === localSource ? "error" : "sync-pending",
        error: error4
      });
      return { ok: false, status: this.state.value.sources[activeSource.id].state, resource: logicalResource, source: activeSource, sourceUrl: activeSource.url, localSaved, error: error4 };
    }
  }
  publishReplica(source2, snapshot) {
    this.graphs.installGraph(source2, snapshot);
    this.state.source(source2, { state: "ready", error: null });
  }
  pendingReplica(logicalResource) {
    this.state.pending(logicalResource.local.id, [logicalResource.remote]);
    this.state.source(logicalResource.remote, { state: "sync-pending" });
    this.state.resource(logicalResource, { state: "sync-pending", error: null });
    return { ok: true, status: "sync-pending", resource: logicalResource };
  }
};

// node_modules/@muze-labs/solid-workspace/src/writes.mjs
var WorkspaceWrites = class {
  constructor({ sources, graphs, io, state, operations }) {
    this.sources = sources;
    this.graphs = graphs;
    this.io = io;
    this.state = state;
    this.operations = operations;
  }
  async createIn(sourceOrId, object, options = {}) {
    const descriptor = this.sources.resolveCreateSource(sourceOrId);
    if (descriptor.readOnly) {
      throw new Error(`solid-workspace: source ${descriptor.id} is read-only`);
    }
    object = this.graphs.create(descriptor, object);
    if (options.save === false) {
      return object;
    }
    const result = await this.save(object, options);
    if (!result.ok) {
      throw result.error ?? new Error(`solid-workspace: create failed: ${result.status}`, { cause: result });
    }
    return object;
  }
  save(object, options = {}) {
    const record = this.graphs.recordFor(object);
    if (!record) {
      return Promise.reject(new Error("solid-workspace: cannot save an object that is not tracked by this workspace"));
    }
    if (record.source.logicalResource) {
      record.deleted = isDeleted(object);
    }
    const key = record.source.logicalResource ?? record.source.id;
    this.operations.admit(key);
    const snapshot = this.graphs.snapshot(record.sourceUrl);
    return this.operations.sequence(key, () => this.saveRecord(record, options, snapshot));
  }
  async saveRecord(record, options, snapshot) {
    const issues4 = validateRecord(record);
    if (issues4) {
      return updateRecordStatus(record, {
        ok: false,
        status: "validation_failed",
        issues: issues4
      });
    }
    if (record.readOnly) {
      return updateRecordStatus(record, {
        ok: false,
        status: "read_only",
        error: new Error(`solid-workspace: source ${record.source?.id ?? record.sourceUrl} is read-only`)
      });
    }
    try {
      if (typeof record.source?.save === "function") {
        const response3 = await this.io.write(record.source, snapshot, options);
        record.sourceUrl = record.source.url;
        record.created = false;
        this.state.source(record.source, { state: "ready", error: null });
        const syncTo = options.syncTo ?? record.source.syncTo;
        if (syncTo) {
          this.state.pending(record.source.id, this.sources.resolveSources(syncTo));
        }
        return updateRecordStatus(record, {
          ok: true,
          status: record.deleted ? "deleted" : "saved",
          response: response3
        });
      }
      if (record.deleted) {
        const response3 = await this.io.remove(record.sourceUrl, options);
        this.graphs.installGraph(record.source, null);
        this.state.source(record.source, { state: "ready", error: null });
        return updateRecordStatus(record, { ok: true, status: "deleted", response: response3 });
      }
      const source2 = { ...record.source, url: record.sourceUrl };
      const response2 = record.created ? await this.io.create(source2, snapshot, options) : await this.io.write(source2, snapshot, options);
      const created = record.created;
      if (record.source.createContainer && response2.location) {
        this.graphs.relocate(record, response2.location);
      }
      record.created = false;
      this.state.source(record.source, { state: "ready", error: null });
      return updateRecordStatus(record, {
        ok: true,
        status: created ? "created" : "saved",
        response: response2
      });
    } catch (error4) {
      this.state.source(record.source, {
        state: sourceFailureState(error4),
        error: error4
      });
      return updateRecordStatus(record, { ok: false, status: "error", error: error4 });
    }
  }
  async delete(object, options = {}) {
    const record = this.graphs.recordFor(object);
    if (!record) {
      throw new Error("solid-workspace: cannot delete an object that is not tracked by this workspace");
    }
    if (record.readOnly) {
      return statusFor(record, {
        ok: false,
        status: "read_only",
        error: new Error("solid-workspace: source is read-only")
      });
    }
    const wasDeleted = record.deleted;
    const rollback = record.source.logicalResource ? markDeleted(object) : null;
    record.deleted = true;
    if (options.save === false) {
      record.status = "deleted_pending";
      return statusFor(record, { ok: true, status: record.status });
    }
    const result = await this.save(object, options);
    if (!result.ok) {
      record.deleted = wasDeleted;
      rollback?.();
    }
    return result;
  }
  async saveAll(records) {
    const statuses = [];
    for (const recordOrObject of records) {
      const object = recordOrObject?.object ?? recordOrObject;
      statuses.push(await this.save(object));
    }
    const failures = statuses.filter((status2) => !status2.ok);
    if (failures.length > 0) {
      const error4 = new Error("solid-workspace: saveAll failed", {
        cause: {
          failures
        }
      });
      error4.statuses = statuses;
      throw error4;
    }
    return statuses;
  }
};
function validateRecord(record) {
  if (record.source.shape) {
    return record.source.shape.fails(record.object);
  }
  return false;
}

// node_modules/@muze-labs/solid-workspace/src/workspace.mjs
function workspace(options = {}) {
  return new SolidWorkspace(options);
}
var SolidWorkspace = class {
  #sources;
  #graphs;
  #io;
  #state;
  #replicas;
  #writes;
  constructor(options = {}) {
    check(options, Object, "solid-workspace: workspace options must be an object", TypeError);
    this.#sources = new WorkspaceSources();
    this.#graphs = new WorkingGraphs(options.context ?? src_default2.context(options));
    this.#state = new WorkspaceStatus();
    this.#io = new SourceIO(options.solid, this);
    const dependencies = {
      graphs: this.#graphs,
      io: this.#io,
      state: this.#state,
      operations: new ResourceOperations()
    };
    this.#replicas = new ReplicaSync(dependencies);
    this.#writes = new WorkspaceWrites({ ...dependencies, sources: this.#sources });
    if (options.sources) {
      this.addSource(options.sources);
    }
    if (options.resources) {
      this.add(options.resources);
    }
    this.collections = Object.fromEntries(
      Object.entries(options.collections ?? {}).map(([name, descriptor]) => [
        name,
        new WorkspaceCollection(this, name, descriptor)
      ])
    );
  }
  get context() {
    return this.#graphs.context;
  }
  get status() {
    return this.#state.value;
  }
  get sources() {
    return this.#sources.sources;
  }
  get resources() {
    return this.#sources.resources;
  }
  get solid() {
    return this.#io.solid;
  }
  add(part) {
    if (Array.isArray(part)) {
      for (const item of part) {
        this.add(item);
      }
      return this;
    }
    if (part?.workspacePart === "source") {
      this.addSource(part);
      return this;
    }
    if (part?.workspacePart === "resource") {
      this.addResource(part);
      return this;
    }
    if (part?.workspacePart === "client") {
      this.setClient(part.client);
      return this;
    }
    throw new TypeError("solid-workspace: add() expects a workspace part from a factory");
  }
  addSource(sourceOrSources) {
    const sources = this.#sources.add(sourceOrSources);
    for (const source2 of sources) {
      this.#acceptSource(source2);
    }
    return sources.length === 1 ? sources[0] : sources;
  }
  #acceptSource(source2) {
    this.#graphs.replaceSource(source2);
    this.#state.source(source2, this.status.sources[source2.id] ?? { state: "idle" });
  }
  addResource(part) {
    const resource2 = this.#sources.addResource(part);
    for (const source2 of resourceSources(resource2)) {
      this.#acceptSource(source2);
    }
    this.#state.resource(resource2);
    return resource2;
  }
  setClient(client2) {
    this.#io.solid = client2;
    return this;
  }
  async open(options = {}) {
    if (this.#sources.isResource(options)) {
      return this.openResource(options);
    }
    if (isOpenAllOptions(options) && this.resources.length > 0) {
      const resourceSourceIds = new Set(this.resources.flatMap((item) => resourceSources(item).map((source2) => source2.id)));
      for (const item of this.resources) {
        await this.openResource(item, options);
      }
      const directSources = this.sources.filter((source2) => !resourceSourceIds.has(source2.id));
      if (directSources.length > 0) {
        await this.load({
          ...options,
          sources: directSources,
          throwOnError: options.throwOnError ?? false
        });
      }
      return this;
    }
    if (Array.isArray(options) && options.some((item) => this.#sources.isResource(item))) {
      for (const item of options) {
        if (this.#sources.isResource(item)) {
          await this.openResource(item);
        } else {
          await this.load({ sources: item, throwOnError: false });
        }
      }
      return this;
    }
    if (options?.resources) {
      const resources = Array.isArray(options.resources) ? options.resources : [options.resources];
      for (const item of resources) {
        await this.openResource(item, options);
      }
      return this;
    }
    if (typeof options === "string" || Array.isArray(options) || options?.workspacePart === "source") {
      return this.load({ sources: options, throwOnError: false });
    }
    return this.load({
      throwOnError: false,
      ...options
    });
  }
  async openResource(resourceOrId, options = {}) {
    const resource2 = this.#sources.resolveResource(resourceOrId);
    await this.#replicas.open(resource2, options);
    return this;
  }
  async load(options = {}) {
    const sources = this.#sources.resolveSources(options.sources ?? this.sources);
    const failures = [];
    const loaded = [];
    const throwOnError = options.throwOnError ?? true;
    this.status.state = "opening";
    this.status.error = null;
    for (const source2 of sources) {
      try {
        loaded.push(await this.loadSource(source2));
      } catch (error4) {
        failures.push({ source: source2, error: error4 });
        if (throwOnError) {
          this.status.state = "error";
          this.status.error = error4;
          throw error4;
        }
      }
    }
    this.status.lastOpen = { sources, loaded, failures };
    this.status.state = workspaceState(this.status);
    this.status.error = failures[0]?.error ?? null;
    return this;
  }
  async loadSource(sourceOrId) {
    const descriptor = this.#sources.resolveSource(sourceOrId);
    this.#state.source(descriptor, { state: "opening", error: null });
    try {
      if (descriptor.kind === "container") {
        const entries = await this.#io.contains(descriptor);
        this.#graphs.clearSourceGraphs(descriptor);
        for (const entry of entries) {
          await this.loadSource({
            ...descriptor,
            append: true,
            kind: "resource",
            url: entry.url,
            parent: descriptor
          });
        }
        this.#state.source(descriptor, { state: "ready", error: null });
        return entries;
      }
      const snapshot = await this.#io.read(descriptor);
      const graph3 = this.#graphs.installGraph(descriptor, snapshot);
      this.#state.source(descriptor, { state: "ready", error: null });
      return graph3.data;
    } catch (error4) {
      this.#state.source(descriptor, {
        state: sourceFailureState(error4),
        error: error4
      });
      throw error4;
    }
  }
  graph(sourceOrResource) {
    let source2;
    if (this.#sources.isResource(sourceOrResource)) {
      const resource2 = this.#sources.resolveResource(sourceOrResource);
      source2 = resource2.local ?? resource2.remote;
    } else {
      source2 = this.#sources.resolveSource(sourceOrResource);
    }
    return this.#graphs.graph(source2);
  }
  sourceSubjects(sources = this.sources) {
    return this.#graphs.subjects(this.#sources.sourceIds(sources));
  }
  recordFor(object) {
    return this.#graphs.recordFor(object);
  }
  sourceOf(...args) {
    return src_default2.one(this.sourcesOf(...args), "first") ?? null;
  }
  sourcesOf(...args) {
    return this.#graphs.sourcesOf(...args);
  }
  createIn(source2, object, options = {}) {
    return this.#writes.createIn(source2, object, options);
  }
  save(object, options = {}) {
    return this.#writes.save(object, options);
  }
  delete(object, options = {}) {
    return this.#writes.delete(object, options);
  }
  saveAll(objects = this.sourceSubjects()) {
    return this.#writes.saveAll(objects);
  }
  sync(resourceOrId, options = {}) {
    return this.#replicas.sync(this.#sources.resolveResource(resourceOrId), options);
  }
};
function isOpenAllOptions(options) {
  return Boolean(
    isObject(options) && !Array.isArray(options) && !options.sources && !options.resources && !options.workspacePart
  );
}

// node_modules/@muze-labs/solid-workspace/src/indexeddb.mjs
function openIndexedDatabase({ indexedDB, name, version, storeName }) {
  const factory = indexedDB ?? globalThis.indexedDB;
  if (!factory) {
    throw new TypeError("solid-workspace: IndexedDB is not available");
  }
  return new Promise((resolve, reject) => {
    const request2 = factory.open(name, version);
    request2.onerror = () => reject(request2.error ?? new Error(`solid-workspace: could not open IndexedDB database ${name}`));
    request2.onblocked = () => reject(new Error(`solid-workspace: IndexedDB database ${name} is blocked`));
    request2.onupgradeneeded = () => {
      const database = request2.result;
      if (!objectStoreExists(database.objectStoreNames, storeName)) {
        database.createObjectStore(storeName, { keyPath: "key" });
      }
    };
    request2.onsuccess = () => resolve(request2.result);
  });
}
function indexedDBGet(database, storeName, key) {
  const transaction = database.transaction(storeName, "readonly");
  return indexedDBRequest(
    transaction,
    transaction.objectStore(storeName).get(key)
  );
}
function indexedDBPut(database, storeName, value) {
  const transaction = database.transaction(storeName, "readwrite");
  return indexedDBRequest(
    transaction,
    transaction.objectStore(storeName).put(value)
  );
}
function indexedDBRequest(transaction, request2) {
  return new Promise((resolve, reject) => {
    request2.onerror = () => reject(request2.error ?? new Error("solid-workspace: IndexedDB request failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("solid-workspace: IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? request2.error ?? new Error("solid-workspace: IndexedDB transaction failed"));
    transaction.oncomplete = () => resolve(request2.result);
  });
}
function objectStoreExists(objectStoreNames, storeName) {
  if (typeof objectStoreNames?.contains === "function") {
    return objectStoreNames.contains(storeName);
  }
  return src_default2.many(objectStoreNames).includes(storeName);
}

// node_modules/@muze-labs/solid-workspace/src/local.mjs
function turtleText(value) {
  if (typeof value !== "string") {
    throw new TypeError("solid-workspace: local sources store Turtle text");
  }
  return value;
}
var local = {
  memory(id2, options = {}) {
    if (typeof id2 !== "string" || !id2) {
      throw new TypeError("solid-workspace: memory source id must be a string");
    }
    const url2 = options.url ?? `memory://${encodeURIComponent(id2)}`;
    let turtle = turtleText(options.turtle ?? "");
    return graphResource({
      ...options,
      id: id2,
      url: url2,
      local: true,
      type: "local-memory",
      async load() {
        return turtle;
      },
      async save(value) {
        turtle = turtleText(value);
        return { ok: true, status: "saved", sourceUrl: url2 };
      }
    });
  },
  indexedDB(name, options = {}) {
    if (typeof name !== "string" || !name) {
      throw new TypeError("solid-workspace: IndexedDB database name is required");
    }
    const storeName = options.store ?? "resources";
    const key = options.key ?? options.id ?? "default";
    const id2 = options.id ?? `${name}:${key}`;
    const url2 = options.url ?? `indexeddb://${encodeURIComponent(name)}/${encodeURIComponent(storeName)}/${encodeURIComponent(key)}`;
    const initialTurtle = turtleText(options.turtle ?? "");
    const {
      indexedDB,
      databaseVersion = 1,
      ...sourceOptions
    } = options;
    async function database() {
      return openIndexedDatabase({
        indexedDB,
        name,
        version: databaseVersion,
        storeName
      });
    }
    return graphResource({
      ...sourceOptions,
      id: id2,
      url: url2,
      local: true,
      type: "local-indexeddb",
      async load() {
        const db = await database();
        try {
          const entry = await indexedDBGet(db, storeName, key);
          return entry ? turtleText(entry.turtle) : initialTurtle;
        } finally {
          db.close?.();
        }
      },
      async save(value) {
        const turtle = turtleText(value);
        const db = await database();
        try {
          await indexedDBPut(db, storeName, {
            key,
            turtle,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        } finally {
          db.close?.();
        }
        return { ok: true, status: "saved", sourceUrl: url2 };
      }
    });
  }
};

// node_modules/@muze-labs/simplysolid/src/index.mjs
function simplySolid(config = {}) {
  return new SimplySolid(config);
}
var SimplySolid = class {
  constructor(config = {}) {
    if (!config || typeof config !== "object") {
      throw new TypeError("simplysolid: config must be an object");
    }
    const normalized = normalizeConfig(config);
    this.solid = normalized.client ?? config.workspace?.solid ?? null;
    this.conventions = normalized.conventions;
    this.settings = normalized.settings;
    this.registrations = normalized.registrations;
    this.status = {
      state: "idle",
      error: null,
      profile: config.profile ?? null,
      storage: normalizeStorage(config.storage),
      setup: setupStatus("unknown", normalized.conventions, normalized.registrations),
      collections: {},
      resources: {}
    };
    this.workspace = config.workspace ?? workspace({
      context: config.context,
      solid: normalized.client,
      sources: normalized.sources,
      resources: normalized.resources,
      collections: normalized.collections
    });
    this.status.resources = this.workspace.status.resources;
    this.data = Object.fromEntries(
      Object.entries(this.workspace.collections).map(([name, collection2]) => [
        name,
        new SimplySolidCollection(this, name, collection2)
      ])
    );
    for (const name of Object.keys(this.data)) {
      this.status.collections[name] = this.data[name].status;
    }
  }
  install(app2) {
    app2.solid = this;
    if (app2.data && typeof app2.data === "object") {
      app2.data.solid = this.status;
    }
    return this;
  }
  async open(options = {}) {
    this.status.state = "opening";
    this.status.error = null;
    try {
      await this.workspace.open(options);
      for (const handle of Object.values(this.data)) {
        handle.refresh();
      }
      this.acceptOpenedWorkspace();
      this.status.lastOpen = /* @__PURE__ */ new Date();
      return this.data;
    } catch (error4) {
      this.status.state = "error";
      this.status.error = error4;
      throw error4;
    }
  }
  async connect(options = {}) {
    this.status.state = "connecting";
    this.status.error = null;
    try {
      const client2 = options.solid;
      if (client2) {
        this.solid = client2;
        this.workspace.setClient(client2);
      }
      const resources = connectionResources(options);
      const opened = [];
      for (const [name, descriptor] of Object.entries(resources)) {
        const part = remoteResourcePart(name, descriptor, this);
        this.workspace.add(part);
        opened.push(name);
      }
      if (options.open !== false && opened.length > 0) {
        await this.workspace.open({ resources: opened });
      }
      for (const handle of Object.values(this.data)) {
        handle.refresh();
      }
      this.acceptOpenedWorkspace();
      this.status.lastConnect = /* @__PURE__ */ new Date();
      return this;
    } catch (error4) {
      this.status.state = "error";
      this.status.error = error4;
      throw error4;
    }
  }
  async sync(resourceOrId, options = {}) {
    this.status.state = "syncing";
    this.status.error = null;
    try {
      const status2 = await this.workspace.sync(resourceOrId, options);
      for (const handle of Object.values(this.data)) {
        handle.refresh();
      }
      this.status.state = status2.ok === false || status2.status === "sync-pending" ? this.workspace.status.resources[status2.resource?.id]?.state ?? "error" : "ready";
      this.status.error = status2.error ?? null;
      if (this.status.state === "ready") this.status.lastSync = /* @__PURE__ */ new Date();
      return status2;
    } catch (error4) {
      this.status.state = "error";
      this.status.error = error4;
      throw error4;
    }
  }
  acceptOpenedWorkspace() {
    const sources = Object.values(this.workspace.status.sources);
    const localFailure = sources.find((source2) => source2.local && source2.error);
    if (localFailure || this.workspace.status.state === "error") {
      throw localFailure?.error ?? this.workspace.status.error ?? new Error("simplysolid: workspace could not be opened");
    }
    const remoteFailure = sources.find((source2) => source2.error);
    this.status.state = remoteFailure ? "sync-pending" : "ready";
    this.status.error = remoteFailure?.error ?? null;
  }
  async checkSetup() {
    if (!this.solid) {
      this.status.setup = setupStatus("unknown", this.conventions, this.registrations, {
        error: new Error("simplysolid: setup checks require a Solid API client")
      });
      return this.status.setup;
    }
    const checks = [];
    for (const url2 of this.conventions.requiredContainers) {
      checks.push(await checkContainer(this.solid, url2));
    }
    const missing = checks.filter((check2) => check2.status === "missing");
    const repair = checks.filter((check2) => check2.status === "error");
    const state = repair.length > 0 ? "repair-needed" : missing.length > 0 ? "setup-needed" : "ready";
    this.status.setup = setupStatus(state, this.conventions, this.registrations, {
      checks,
      needed: missing,
      repair
    });
    return this.status.setup;
  }
  async setup() {
    const setup = await this.checkSetup();
    if (setup.state === "ready") {
      return setup;
    }
    if (setup.state === "repair-needed") {
      return setup;
    }
    this.status.setup = {
      ...setup,
      state: "creating"
    };
    const created = [];
    const repair = [];
    for (const item of setup.needed) {
      try {
        const response2 = await this.solid.createContainer(item.url);
        created.push({ ...item, response: response2 });
      } catch (error4) {
        repair.push({ ...item, status: "error", error: error4 });
      }
    }
    if (repair.length > 0) {
      this.status.setup = setupStatus("repair-needed", this.conventions, this.registrations, {
        created,
        repair
      });
      return this.status.setup;
    }
    return this.checkSetup();
  }
};
var SimplySolidCollection = class {
  constructor(service, name, collection2) {
    this.solid = service;
    this.name = name;
    this.collection = collection2;
    this.items = [];
    this.status = {
      state: "idle",
      error: null,
      lastSync: null,
      lastSave: null
    };
  }
  refresh() {
    this.items = this.collection.list();
    if (this.status.state === "idle") this.status.state = "ready";
    this.status.lastSync = /* @__PURE__ */ new Date();
    return this.items;
  }
  async open() {
    this.status.state = "syncing";
    this.status.error = null;
    try {
      await this.solid.workspace.open(this.collection.descriptor.sources);
      this.solid.acceptOpenedWorkspace();
      this.status.state = this.solid.status.state;
      this.status.error = this.solid.status.error;
      return this.refresh();
    } catch (error4) {
      this.status.state = "error";
      this.status.error = error4;
      throw error4;
    }
  }
  list() {
    return this.refresh();
  }
  get(id2) {
    return this.collection.get(id2);
  }
  async create(data = {}, options = {}) {
    return this.write("creating", async () => {
      const object = await this.collection.create(data, {
        ...options,
        save: false
      });
      if (options.save === false) {
        this.refresh();
        return object;
      }
      const status2 = await this.collection.save(object, options);
      this.status.lastSave = status2;
      if (!status2.ok) throw status2.error ?? new Error(`simplysolid: ${this.name} save failed: ${status2.status}`, { cause: status2 });
      this.refresh();
      return object;
    });
  }
  async update(idOrObject, changes = {}, options = {}) {
    return this.write("saving", async () => {
      const object = this.resolve(idOrObject);
      this.collection.update(object, changes);
      if (options.save === false) {
        this.refresh();
        return object;
      }
      const status2 = await this.collection.save(object, options);
      this.status.lastSave = status2;
      if (!status2.ok) throw status2.error ?? new Error(`simplysolid: ${this.name} save failed: ${status2.status}`, { cause: status2 });
      this.refresh();
      return object;
    });
  }
  async delete(idOrObject, options = {}) {
    return this.write("deleting", async () => {
      const object = this.resolve(idOrObject);
      const status2 = await this.collection.delete(object, {
        ...options,
        save: options.save ?? true
      });
      this.status.lastSave = status2;
      if (!status2.ok) throw status2.error ?? new Error(`simplysolid: ${this.name} save failed: ${status2.status}`, { cause: status2 });
      this.refresh();
      return status2;
    });
  }
  async save(idOrObject, options = {}) {
    return this.write("saving", async () => {
      const object = this.resolve(idOrObject);
      const status2 = await this.collection.save(object, options);
      this.status.lastSave = status2;
      if (!status2.ok) {
        throw status2.error ?? new Error(
          `simplysolid: ${this.name} save failed: ${status2.status}`,
          { cause: status2 }
        );
      }
      this.refresh();
      return status2;
    });
  }
  async saveAll() {
    return this.write("saving", async () => {
      const statuses = await this.collection.saveAll();
      this.status.lastSave = statuses;
      this.refresh();
      return statuses;
    });
  }
  async write(state, fn) {
    this.status.state = state;
    this.status.error = null;
    try {
      const result = await fn();
      this.status.state = "ready";
      return result;
    } catch (error4) {
      this.status.state = "error";
      this.status.error = error4;
      throw error4;
    }
  }
  resolve(idOrObject) {
    if (typeof idOrObject === "string") {
      const object = this.get(idOrObject);
      if (!object) {
        throw new Error(`simplysolid: ${this.name} item ${idOrObject} was not found`);
      }
      return object;
    }
    if (!idOrObject || typeof idOrObject !== "object") {
      throw new TypeError(`simplysolid: ${this.name} item must be an object or id`);
    }
    return idOrObject;
  }
};
function normalizeConfig(config) {
  if (config.workspace) {
    const conventions2 = setupConventions(config, {
      sources: config.workspace.sources ?? [],
      resources: config.workspace.resources ?? [],
      collections: config.workspace.collections ?? {}
    });
    return {
      client: null,
      sources: [],
      resources: [],
      collections: {},
      conventions: conventions2,
      settings: settingsFor(config, conventions2),
      registrations: registrationsFor(config, conventions2)
    };
  }
  const client2 = config.solid;
  const explicitSources = config.sources ?? [];
  const explicitResources = config.resources ?? [];
  const data = config.data ?? {};
  const generatedSources = [];
  const generatedResources = [];
  const collections = {};
  const hasLocalFirstData = Object.values(data).some((descriptor) => isLocalFirstDescriptor(null, descriptor, config));
  if (!client2 && explicitSources.length === 0 && explicitResources.length === 0 && !hasLocalFirstData) {
    throw new TypeError("simplysolid: a Solid API client, workspace, source, resource, or local-first data config is required");
  }
  for (const [name, descriptor] of Object.entries(data)) {
    const normalized = normalizeCollection(name, descriptor, config);
    collections[name] = normalized.collection;
    if (normalized.source) {
      generatedSources.push(normalized.source);
    }
    if (normalized.resource) {
      generatedResources.push(normalized.resource);
    }
  }
  const sources = [...explicitSources, ...generatedSources];
  const resources = [...explicitResources, ...generatedResources];
  const conventions = setupConventions(config, { sources, resources, collections });
  return {
    client: client2,
    sources,
    resources,
    collections,
    conventions,
    settings: settingsFor(config, conventions),
    registrations: registrationsFor(config, conventions)
  };
}
function normalizeCollection(name, descriptor = {}, config = {}) {
  if (!descriptor || typeof descriptor !== "object") {
    throw new TypeError(`simplysolid: collection ${name} must be an object`);
  }
  if (descriptor.kind === "collection" && !descriptor.path) {
    return {
      collection: descriptor,
      source: null,
      resource: null
    };
  }
  if (isLocalFirstDescriptor(name, descriptor, config)) {
    const resourceId = descriptor.resourceId ?? descriptor.resource ?? descriptor.source ?? name;
    const resource2 = resource(resourceId, {
      scalarPredicates: descriptor.scalarPredicates ?? [],
      ownedPredicates: descriptor.ownedPredicates ?? [],
      baseURI: descriptor.baseURI,
      prefixes: descriptor.prefixes,
      local: localSourceForResource(name, descriptor, config),
      remote: remoteSourceForResource(name, descriptor, config, resourceId)
    });
    return {
      source: null,
      resource: resource2,
      collection: collection({
        ...descriptor,
        sources: descriptor.sources ?? [resourceId],
        createIn: descriptor.createIn ?? resourceId
      })
    };
  }
  const source2 = descriptor.path ? sourceFromPath(name, descriptor, config) : null;
  const sourceId = descriptor.source ?? source2?.id;
  const sources = descriptor.sources ?? (sourceId ? [sourceId] : []);
  const createIn = descriptor.createIn ?? sourceId ?? sources[0];
  return {
    source: source2,
    resource: null,
    collection: collection({
      ...descriptor,
      sources,
      createIn
    })
  };
}
function isLocalFirstDescriptor(_name, descriptor = {}, config = {}) {
  if (!descriptor || typeof descriptor !== "object") {
    return false;
  }
  return Boolean(
    descriptor.local || descriptor.localFirst || config.localFirst && (descriptor.kind === "resource" || descriptor.resource === true || descriptor.path && !String(descriptor.path).endsWith("/"))
  );
}
function localSourceForResource(name, descriptor = {}, config = {}) {
  const localConfig = descriptor.local === true ? {} : descriptor.local ?? {};
  if (localConfig?.workspacePart === "source") {
    return localConfig;
  }
  const databaseName = localConfig.indexedDB ?? config.local?.indexedDB ?? slugFrom(config.app?.slug ?? config.app?.id ?? defaultAppId());
  return local.indexedDB(databaseName, {
    ...localConfig,
    id: localConfig.id ?? `${descriptor.resourceId ?? descriptor.resource ?? descriptor.source ?? name}:local`,
    key: localConfig.key ?? name,
    prefixes: localConfig.prefixes ?? descriptor.prefixes,
    turtle: localConfig.turtle,
    indexedDB: localConfig.indexedDBFactory
  });
}
function remoteSourceForResource(name, descriptor = {}, config = {}, resourceId = name) {
  if (descriptor.remote === false) {
    return null;
  }
  const remoteConfig = descriptor.remote === true ? {} : descriptor.remote ?? {};
  if (remoteConfig?.workspacePart === "source") {
    return remoteConfig;
  }
  const url2 = remoteConfig.url ?? remoteConfig.resourceUrl ?? (descriptor.path && firstStorage(config.storage) ? new URL(descriptor.path, firstStorage(config.storage)).href : null);
  if (!url2) {
    return null;
  }
  return solid.resource(url2, {
    id: remoteConfig.id ?? descriptor.remoteSource ?? `${resourceId}:solid`,
    readOnly: Boolean(remoteConfig.readOnly ?? descriptor.readOnly),
    shape: remoteConfig.shape ?? descriptor.shape ?? null,
    load: remoteConfig.load ?? descriptor.load,
    save: remoteConfig.save ?? descriptor.save,
    options: remoteConfig.options ?? descriptor.options ?? {},
    writeOptions: remoteConfig.writeOptions ?? descriptor.writeOptions
  });
}
function connectionResources(options = {}) {
  if (options.resourceUrl) {
    return {
      [options.resource ?? options.name ?? "default"]: {
        ...options,
        url: options.resourceUrl
      }
    };
  }
  return options.resources ?? options.data ?? {};
}
function remoteResourcePart(name, descriptor = {}, service) {
  const config = typeof descriptor === "string" ? { url: descriptor } : descriptor;
  const resourceId = config.resourceId ?? config.resource ?? name;
  const url2 = config.url ?? config.resourceUrl ?? (config.path && firstStorage(service.status.storage) ? new URL(config.path, firstStorage(service.status.storage)).href : null);
  if (!url2) {
    throw new TypeError(`simplysolid: connected resource ${name} needs a url, resourceUrl, or path`);
  }
  return resource(resourceId, {
    remote: solid.resource(url2, {
      id: config.id ?? config.source ?? `${resourceId}:solid`,
      readOnly: Boolean(config.readOnly),
      shape: config.shape ?? null,
      load: config.load,
      save: config.save,
      options: config.options ?? {},
      writeOptions: config.writeOptions
    })
  });
}
function sourceFromPath(name, descriptor, config) {
  const storage = firstStorage(config.storage);
  if (!storage) {
    throw new TypeError(`simplysolid: collection ${name} uses path but no storage root was configured`);
  }
  const url2 = new URL(descriptor.path, storage).href;
  const options = {
    id: descriptor.source ?? name,
    readOnly: Boolean(descriptor.readOnly),
    shape: descriptor.shape ?? null,
    options: descriptor.options ?? {},
    writeOptions: descriptor.writeOptions
  };
  return descriptor.kind === "resource" || descriptor.resource === true || !url2.endsWith("/") ? solid.resource(url2, options) : solid.container(url2, options);
}
function normalizeStorage(storage) {
  if (!storage) {
    return [];
  }
  if (Array.isArray(storage)) {
    return storage.map(storageUrl);
  }
  return [storageUrl(storage)];
}
function firstStorage(storage) {
  return normalizeStorage(storage)[0] ?? null;
}
function storageUrl(storage) {
  const url2 = typeof storage === "string" ? storage : storage?.url ?? storage?.id;
  return url2 && !String(url2).endsWith("/") ? `${url2}/` : url2;
}
function setupConventions(config, normalized) {
  const storage = firstStorage(config.storage);
  const appId = config.app?.id ?? config.id ?? defaultAppId();
  const appSlug = config.app?.slug ?? config.slug ?? slugFrom(appId);
  const appStorage = ensureSlash2(config.appStorage ?? config.setup?.appStorage ?? (storage ? new URL(`apps/${appSlug}/`, storage).href : null));
  const settingsUrl = config.settings?.url ?? config.setup?.settingsUrl ?? (appStorage ? new URL("settings.ttl", appStorage).href : null);
  const sourceContainers = (normalized.sources ?? []).filter((source2) => source2.kind === "container").map((source2) => source2.url);
  const requiredContainers = unique([
    appStorage,
    ...sourceContainers,
    ...config.setup?.containers ?? []
  ].filter(Boolean).map(ensureSlash2));
  return {
    appId,
    appSlug,
    appStorage,
    settingsUrl,
    requiredContainers
  };
}
function settingsFor(config, conventions) {
  return {
    url: conventions.settingsUrl,
    data: config.settings?.data ?? {},
    shape: config.settings?.shape ?? null
  };
}
function registrationsFor(config, conventions) {
  if (config.registrations) {
    return config.registrations;
  }
  const data = config.data ?? {};
  return Object.entries(data).map(([name, descriptor]) => {
    const forClass = descriptor.shape?.for;
    if (!forClass) {
      return null;
    }
    const sourceUrl = descriptor.path && conventions.appStorage ? new URL(descriptor.path, firstStorage(config.storage)).href : descriptor.url ?? null;
    return {
      collection: name,
      forClass,
      instanceContainer: sourceUrl?.endsWith("/") ? sourceUrl : null,
      instance: sourceUrl && !sourceUrl.endsWith("/") ? sourceUrl : null,
      private: descriptor.private ?? true,
      registered: false
    };
  }).filter(Boolean);
}
function setupStatus(state, conventions, registrations, options = {}) {
  return {
    state,
    needed: options.needed ?? [],
    repair: options.repair ?? [],
    checks: options.checks ?? [],
    created: options.created ?? [],
    error: options.error ?? null,
    appStorage: conventions.appStorage,
    settingsUrl: conventions.settingsUrl,
    registrations
  };
}
async function checkContainer(client2, url2) {
  try {
    const response2 = await client2.head(url2);
    const status2 = response2?.status ?? 200;
    if (status2 === 404) {
      return { url: url2, status: "missing", response: response2 };
    }
    if (status2 >= 400) {
      return { url: url2, status: "error", response: response2 };
    }
    return { url: url2, status: "ready", response: response2 };
  } catch (error4) {
    const status2 = error4.cause?.status ?? error4.response?.status;
    if (status2 === 404) {
      return { url: url2, status: "missing", error: error4 };
    }
    return { url: url2, status: "error", error: error4 };
  }
}
function defaultAppId() {
  const location = globalThis.location?.href;
  if (!location) {
    return "app";
  }
  const url2 = new URL(location);
  url2.hash = "";
  return url2.href;
}
function slugFrom(value) {
  const input2 = String(value);
  let source2 = input2;
  try {
    const url2 = new URL(input2);
    source2 = url2.pathname.split("/").filter(Boolean).at(-1) ?? url2.hostname;
  } catch {
    source2 = input2;
  }
  return source2.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "app";
}
function ensureSlash2(url2) {
  return url2 && !String(url2).endsWith("/") ? `${url2}/` : url2;
}
function unique(values3) {
  return [...new Set(values3)];
}

// node_modules/@muze-labs/cobalt-rich-text-note/dist/fragment.js
function getJoinOffsetAfterSeparator(first2, second, separator) {
  if (separator.length > 0) {
    return first2.text.length + separator.length;
  }
  if (first2.text.endsWith("\n")) {
    return first2.text.length;
  }
  if (second.text.startsWith("\n")) {
    return first2.text.length + 1;
  }
  return first2.text.length;
}
function getNextOrder(fragment) {
  if (fragment.annotations.length === 0) {
    return 1;
  }
  return Math.max(...fragment.annotations.map((annotation) => annotation.order)) + 1;
}
function addAnnotation(fragment, range, tag2) {
  const [start, end] = range;
  if (end <= start) {
    return null;
  }
  const annotation = {
    range: [start, end],
    tag: tag2,
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
function concatFragments(first2, second, separator = "") {
  const joinOffset = getJoinOffsetAfterSeparator(first2, second, separator);
  const secondOffset = first2.text.length + separator.length;
  return {
    fragment: {
      text: first2.text + separator + second.text,
      annotations: mergeAdjacentMatchingAnnotations([
        ...first2.annotations.map((annotation) => ({
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
function joinFragments(first2, second) {
  return concatFragments(first2, second, needsJoinSeparator(first2, second) ? "\n" : "");
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
function needsJoinSeparator(first2, second) {
  if (first2.text.length === 0 || second.text.length === 0) {
    return false;
  }
  return !first2.text.endsWith("\n") && !second.text.startsWith("\n");
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/commands.js
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
  constructor(range, tag2) {
    this.range = range;
    this.tag = tag2;
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/registry.js
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
  findByTag(tag2) {
    const trimmed = tag2.trim();
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
function parseAnnotationTag(tag2, registry = defaultRegistry) {
  const trimmed = tag2.trim();
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
function createHtmlCloseTag(tag2) {
  const tagName = getTagName(tag2);
  if (!tagName) {
    throw new Error(`Could not determine tag name: ${tag2}`);
  }
  return `</${tagName}>`;
}
function getTagName(tag2) {
  const match = tag2.trim().match(/^<\/?\s*([^\s>/]+)/);
  return match?.[1] ?? null;
}
function isOpeningTag(tag2, tagName) {
  return new RegExp(`^<${tagName}(?:\\s[^>]*)?>$`, "i").test(tag2);
}
function isClosingTag(tag2, tagName) {
  return new RegExp(`^</${tagName}(?:\\s[^>]*)?>$`, "i").test(tag2);
}
function isCobaltSelectionOpeningTag(tag2) {
  return /^<span\s[^>]*data-cobalt-selection=["']true["'][^>]*>$/i.test(tag2);
}
function shortcutFromKeyboardEvent(event) {
  const parts2 = [];
  if (event.ctrlKey) {
    parts2.push("ctrl");
  }
  if (event.metaKey) {
    parts2.push("meta");
  }
  if (event.altKey) {
    parts2.push("alt");
  }
  if (event.shiftKey) {
    parts2.push("shift");
  }
  parts2.push(event.key.toLowerCase());
  return parts2.join("+");
}
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// node_modules/@muze-labs/cobalt-rich-text-note/dist/editor-state.js
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/clipboard.js
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/runs.js
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
function applyAnnotationToState(state, tag2) {
  const parsed = parseAnnotationTag(tag2);
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/render.js
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

// node_modules/@muze-labs/cobalt-note-core/dist/selection.js
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
  const first2 = getCaretClientRect(root, 0);
  if (!current || !first2) {
    return false;
  }
  return current.top <= first2.top + tolerance;
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

// node_modules/@muze-labs/cobalt-rich-text-note/dist/editor.js
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
function replaceFragment(target, source2) {
  target.text = source2.text;
  target.annotations = source2.annotations.map((annotation) => ({
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
      const tag2 = command === "link" && typeof value === "string" ? createLinkAnnotationTag(value) : createAnnotationTag(command, value !== false);
      addAnnotation(fragment, [range.start, range.end], tag2);
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
    const tag2 = createAnnotationTag(definition.name, currentState[definition.name] === void 0);
    applyCommands(fragment, [
      new AddAnnotationCommand([selection.start, selection.end], tag2)
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

// src/features/paragraph-note-stacks/vocabulary.js
var annotationVocabulary = {
  prefixes: {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    dcterms: "http://purl.org/dc/terms/",
    oa: "http://www.w3.org/ns/oa#",
    schema: "https://schema.org/",
    cobalt: "https://vocab.muze.nl/cobalt#"
  },
  classes: {
    annotation: "http://www.w3.org/ns/oa#Annotation",
    textualBody: "http://www.w3.org/ns/oa#TextualBody",
    cobaltFragment: "https://vocab.muze.nl/cobalt#Fragment"
  },
  predicates: {
    type: "rdf$type",
    label: "rdfs$label",
    created: "dcterms$created",
    modified: "dcterms$modified",
    format: "dcterms$format",
    hasFormat: "dcterms$hasFormat",
    value: "rdf$value",
    hasBody: "oa$hasBody",
    hasTarget: "oa$hasTarget",
    text: "schema$text",
    cobaltFragment: "cobalt$fragment"
  }
};

// src/features/paragraph-note-stacks/cobalt-fragment-rdf.js
var cobalt = annotationVocabulary.prefixes.cobalt;
var rdf3 = annotationVocabulary.prefixes.rdf;
function writeCobaltFragment(fragment, { id: id2, htmlId, graph: graph3 } = {}) {
  validateFragment(fragment);
  if (typeof id2 !== "string" || !id2) {
    throw new TypeError("cobalt-fragment-rdf: fragment id is required");
  }
  if (typeof htmlId !== "string" || !htmlId || htmlId === id2) {
    throw new TypeError("cobalt-fragment-rdf: a distinct HTML body id is required");
  }
  const html2 = render(fragment);
  if (!graph3) {
    graph3 = new src_default2.Graph(
      [],
      id2,
      "text/turtle",
      annotationVocabulary.prefixes,
      src_default2.context()
    );
  }
  const node = graph3.addNamedNode(id2);
  const previous = field3(node, cobalt + "annotations");
  graph3.add(node, "a", annotationVocabulary.classes.cobaltFragment);
  graph3.set(node, rdf3 + "value", src_default2.literal(fragment.text));
  const annotations = new src_default2.Collection(graph3);
  for (const [index, annotation] of fragment.annotations.entries()) {
    const item = graph3.addNamedNode(`${id2}-${index}`);
    graph3.set(item, cobalt + "start", integerLiteral(annotation.range[0]));
    graph3.set(item, cobalt + "end", integerLiteral(annotation.range[1]));
    graph3.set(item, cobalt + "tag", src_default2.literal(annotation.tag));
    graph3.set(item, cobalt + "order", integerLiteral(annotation.order));
    annotations.push(item);
  }
  const currentIds = new Set(annotations.map((item) => item.id));
  if (previous instanceof src_default2.Collection) {
    for (const item of previous) {
      if (currentIds.has(item.id)) {
        continue;
      }
      for (const name of ["start", "end", "tag", "order"]) {
        graph3.delete(item, cobalt + name);
      }
      if (Object.keys(item).length === 1) {
        graph3.delete(item);
      }
    }
  }
  if (annotations.length === 0) {
    graph3.set(
      node,
      cobalt + "annotations",
      graph3.addNamedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#nil")
    );
  } else {
    graph3.set(node, cobalt + "annotations", annotations);
  }
  const body = graph3.addNamedNode(htmlId);
  graph3.add(body, "a", annotationVocabulary.classes.textualBody);
  graph3.set(body, annotationVocabulary.prefixes.dcterms + "format", "text/html");
  graph3.set(body, rdf3 + "value", src_default2.literal(html2));
  graph3.set(node, annotationVocabulary.prefixes.dcterms + "hasFormat", body);
  return node;
}
function readCobaltFragment(node) {
  if (!node || !src_default2.many(node.a).includes(
    annotationVocabulary.classes.cobaltFragment
  )) {
    throw new TypeError("cobalt-fragment-rdf: expected a Cobalt Fragment node");
  }
  let annotations = field3(node, cobalt + "annotations");
  if (annotations?.id === "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil") {
    annotations = new src_default2.Collection(node.graph);
  }
  if (!(annotations instanceof src_default2.Collection)) {
    throw new TypeError("cobalt-fragment-rdf: annotations must be a Collection");
  }
  const fragment = {
    text: stringValue(field3(node, rdf3 + "value")),
    annotations: Array.from(annotations, (item) => ({
      range: [
        numberValue(field3(item, cobalt + "start")),
        numberValue(field3(item, cobalt + "end"))
      ],
      tag: stringValue(field3(item, cobalt + "tag")),
      order: numberValue(field3(item, cobalt + "order"))
    }))
  };
  validateFragment(fragment);
  return fragment;
}
function field3(node, predicate) {
  if (!node?.graph) {
    throw new TypeError("cobalt-fragment-rdf: expected a native RDF node");
  }
  return node[node.graph.propertyName(predicate)];
}
function integerLiteral(value) {
  return src_default2.literal(value, {
    type: "http://www.w3.org/2001/XMLSchema#integer"
  });
}
function stringValue(value) {
  if (typeof value !== "string" && !(value instanceof String)) {
    throw new TypeError("cobalt-fragment-rdf: expected a string literal");
  }
  return String(value);
}
function numberValue(value) {
  const integerText = value instanceof String && value.type === "http://www.w3.org/2001/XMLSchema#integer" && /^[+-]?\d+$/.test(String(value));
  if (!integerText && typeof value !== "number" && !(value instanceof Number)) {
    throw new TypeError("cobalt-fragment-rdf: expected a numeric literal");
  }
  return Number(value);
}
function validateFragment(fragment) {
  if (typeof fragment?.text !== "string" || !Array.isArray(fragment.annotations)) {
    throw new TypeError("cobalt-fragment-rdf: expected text and annotations");
  }
  for (const annotation of fragment.annotations) {
    const range = annotation?.range;
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] < 0 || range[1] < range[0] || range[1] > fragment.text.length || typeof annotation.tag !== "string" || !Number.isSafeInteger(annotation.order)) {
      throw new TypeError("cobalt-fragment-rdf: invalid annotation range/tag/order");
    }
  }
}

// src/features/paragraph-note-stacks/annotation-model.js
var annotationModel = {
  vocabulary: annotationVocabulary,
  replicaPolicy: {
    ownedPredicates: [
      annotationVocabulary.prefixes.dcterms + "hasFormat",
      annotationVocabulary.prefixes.cobalt + "fragment",
      annotationVocabulary.prefixes.cobalt + "annotations"
    ],
    scalarPredicates: [
      annotationVocabulary.prefixes.oa + "hasBody",
      annotationVocabulary.prefixes.dcterms + "hasFormat",
      annotationVocabulary.prefixes.dcterms + "format",
      annotationVocabulary.prefixes.cobalt + "fragment",
      annotationVocabulary.prefixes.rdf + "value",
      ...["annotations", "start", "end", "tag", "order"].map(
        (name) => annotationVocabulary.prefixes.cobalt + name
      )
    ]
  },
  createAnnotationNote({
    anchorId,
    fragment,
    subjects = [],
    sequence = {},
    now: now2 = (/* @__PURE__ */ new Date()).toISOString()
  }) {
    const annotationId = this.createAnnotationId({ subjects, sequence });
    const storedFragment = writeCobaltFragment(fragment, {
      id: this.relatedSubjectId({ annotationId, part: "fragment" }),
      htmlId: this.relatedSubjectId({ annotationId, part: "html" })
    });
    return {
      id: annotationId,
      a: this.vocabulary.classes.annotation,
      dcterms$created: now2,
      dcterms$modified: now2,
      oa$hasBody: storedFragment.dcterms$hasFormat,
      cobalt$fragment: storedFragment,
      oa$hasTarget: `${this.currentDocumentIri({})}#${encodeURIComponent(anchorId)}`
    };
  },
  relatedSubjectId({ annotationId, part }) {
    return `${annotationId}${annotationId.includes("#") ? "-" : "#"}${part}`;
  },
  restoreAnnotationSequence({ subjects, sequence }) {
    const identifiers = subjects.map((subject) => subject.id?.match(/#margin-note-([A-Za-z0-9_-]{8})-([1-9][0-9]*)$/)).filter(Boolean);
    if (!sequence.code) {
      const codes = identifiers.map((match) => match[1]).sort();
      sequence.code = codes[0];
    }
    for (const match of identifiers) {
      if (match[1] === sequence.code) {
        sequence.counter = Math.max(sequence.counter || 0, Number(match[2]));
      }
    }
  },
  createAnnotationId({ subjects, sequence }) {
    this.restoreAnnotationSequence({ subjects, sequence });
    sequence.code ||= randomCode();
    sequence.counter = (sequence.counter || 0) + 1;
    if (!Number.isSafeInteger(sequence.counter)) {
      throw new RangeError("annotation-model: annotation counter exhausted");
    }
    return `${this.currentDocumentIri({})}#margin-note-${sequence.code}-${sequence.counter}`;
  },
  currentDocumentIri() {
    const href = globalThis.location?.href;
    if (!href) {
      return "urn:muze:margin-notes:local-document";
    }
    return href.replace(/#.*/, "");
  },
  annotationAnchorId({ annotation }) {
    const target = src_default2.one(annotation?.oa$hasTarget, "first");
    const iri = typeof target === "string" ? target : target?.id;
    if (!iri || !iri.startsWith(`${this.currentDocumentIri({})}#`)) {
      return void 0;
    }
    try {
      return decodeURIComponent(iri.slice(iri.indexOf("#") + 1)) || void 0;
    } catch {
      return void 0;
    }
  },
  annotationBody({ annotation }) {
    return src_default2.one(annotation?.oa$hasBody, "first");
  },
  annotationBodyFragment({ annotation }) {
    return readCobaltFragment(src_default2.one(annotation?.cobalt$fragment, "first"));
  },
  updateAnnotationBody({ annotation, fragment, now: now2 = (/* @__PURE__ */ new Date()).toISOString() }) {
    const body = this.annotationBody({ annotation });
    const storedFragment = src_default2.one(annotation?.cobalt$fragment, "first");
    if (!body || !storedFragment) {
      throw new TypeError("annotation-model: annotation needs a body and Cobalt fragment");
    }
    writeCobaltFragment(fragment, {
      id: storedFragment.id,
      htmlId: body.id,
      graph: storedFragment.graph
    });
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
  isOldmedAnnotation({ value }) {
    return src_default2.many(value?.a).includes(this.vocabulary.classes.annotation);
  },
  isMarginNoteAnnotation({ value }) {
    return Boolean(
      this.isOldmedAnnotation({ value }) && this.annotationBody({ annotation: value }) && src_default2.many(src_default2.one(value.cobalt$fragment, "first")?.a).includes(this.vocabulary.classes.cobaltFragment) && this.annotationAnchorId({ annotation: value })
    );
  },
  noteText({ fragment }) {
    if (fragment?.text != null) {
      return String(fragment.text);
    }
    return "(empty note)";
  }
};
function randomCode() {
  return btoa(String.fromCharCode(
    ...globalThis.crypto.getRandomValues(new Uint8Array(6))
  )).replace(/\+/g, "-").replace(/\//g, "_");
}

// src/features/paragraph-note-stacks/root.html
var root_default = '<div class="margin-notes-root" hidden></div>\n';

// src/features/paragraph-note-stacks/anchor-widget.html
var anchor_widget_default = '<span class="margin-notes-anchor-widget">\n  <button\n    type="button"\n    class="margin-notes-target-add-btn"\n    title="Add note"\n    aria-label="Add note"\n    data-simply-command="createNote"\n    data-simply-value=":value"\n  >+</button>\n  <span class="margin-notes-target-note-list" data-simply-shortcuts="marginNotesNote">\n    <span class="margin-notes-target-note-items" data-simply-list="visibleNotes">\n      <template rel="margin-notes-inline-note"></template>\n    </span>\n    <button\n      type="button"\n      class="margin-notes-target-note-count"\n      aria-expanded="false"\n      data-margin-notes-empty="true"\n      data-simply-command="toggleAnchorNoteList"\n      data-simply-value=":value"\n    ><span data-simply-field="overflowLabel"></span></button>\n  </span>\n</span>\n';

// src/features/paragraph-note-stacks/inline-note.html
var inline_note_default = '<article class="margin-notes-target-note">\n  <button\n    type="button"\n    class="margin-notes-target-note-toggle"\n    aria-expanded="false"\n    data-simply-shortcuts="marginNotesNote"\n    data-simply-command="expandInlineNote"\n    data-simply-value=":value"\n  ><span class="margin-notes-target-note-text" data-simply-field="body" data-simply-transform="cobaltFragment"></span></button>\n  <button\n    type="button"\n    class="margin-notes-target-note-close"\n    aria-label="Close note"\n    data-simply-command="collapseInlineNote"\n    data-simply-value=":value"\n  >x</button>\n  <span class="margin-notes-target-note-actions">\n    <button\n      type="button"\n      class="margin-notes-target-note-action"\n      data-simply-command="updateNote"\n      data-simply-value=":value"\n    >Edit</button>\n    <button\n      type="button"\n      class="margin-notes-target-note-action"\n      data-simply-command="deleteNote"\n      data-simply-value=":value"\n    >Delete</button>\n  </span>\n</article>\n';

// src/features/solid-connection/control.html
var control_default = '<form class="margin-notes-solid-connection" data-margin-notes-solid-connection>\n  <label class="margin-notes-solid-connection-webid">\n    <span>WebID</span>\n    <input\n      type="url"\n      inputmode="url"\n      autocomplete="url"\n      placeholder="https://example.solidcommunity.net/profile/card#me"\n      data-margin-notes-solid-webid\n    >\n  </label>\n  <button type="submit" class="ds-button ds-button-primary">Connect</button>\n  <p class="margin-notes-solid-connection-status" data-margin-notes-solid-status>Not connected</p>\n</form>\n';

// src/design-system.css
var design_system_default = '/*\n * Curated the-ds subset for margin-notes.\n *\n * This intentionally does not import the-ds wholesale. Margin notes is embedded\n * into host documents, so this file only defines design tokens and the small\n * button/dialog primitives used by the component.\n */\n\n@layer reset, setup, theme, base, component, page, utility;\n\n@layer setup {\n  :root,\n  :host {\n    --ds-black: #000;\n    --ds-white: #fff;\n    --ds-primary: oklch(0.7388 0.1792 126.69);\n    --ds-support: oklch(0.7388 0.1792 216.69);\n\n    --ds-grey-0: #eef1f8;\n    --ds-grey-5: #e9edf6;\n    --ds-grey-10: #e4eaf4;\n    --ds-grey-20: #dae2ed;\n    --ds-grey-30: #cdd7e3;\n    --ds-grey-40: #bdc8d4;\n    --ds-grey-50: #a8b4c0;\n    --ds-grey-60: #8f9ba6;\n    --ds-grey-70: #707c84;\n    --ds-grey-80: #4d565c;\n    --ds-grey-90: #262c2f;\n    --ds-grey-100: #000;\n\n    --ds-color-error: rgb(253, 143, 143);\n    --ds-color-warning: #ffffcc;\n    --ds-color-info: rgb(140, 180, 250);\n  }\n}\n\n@layer theme {\n  :root,\n  :host {\n    --ds-color-scheme: light;\n    --ds-font-heading: var(--margin-notes-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n    --ds-font-body: var(--margin-notes-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n    --ds-font-weight: 400;\n    --ds-font-size: 1rem;\n    --ds-line-height: 1.5rem;\n\n    --ds-heading-weight: 600;\n    --ds-space: var(--ds-line-height);\n    --ds-space-d4: calc(var(--ds-space) / 4);\n    --ds-space-d3: calc(var(--ds-space) / 3);\n    --ds-space-d2: calc(var(--ds-space) / 2);\n    --ds-space-x2: calc(2 * var(--ds-space));\n    --ds-space-x3: calc(3 * var(--ds-space));\n    --ds-space-x4: calc(4 * var(--ds-space));\n\n    --ds-primary-10: oklch(from var(--ds-primary) calc(l + 0.3) c h);\n    --ds-primary-90: oklch(from var(--ds-primary) calc(l - 0.3) c h);\n    --ds-primary-high: var(--ds-primary-90);\n    --ds-primary-low: var(--ds-primary-10);\n    --ds-primary-contrast: var(--ds-white);\n\n    --ds-support-10: oklch(from var(--ds-support) calc(l + 0.3) c h);\n    --ds-support-90: oklch(from var(--ds-support) calc(l - 0.3) c h);\n    --ds-support-high: var(--ds-support-90);\n    --ds-support-low: var(--ds-support-10);\n    --ds-support-contrast: var(--ds-white);\n\n    --ds-grey-high: var(--ds-grey-90);\n    --ds-grey-medium: var(--ds-grey-60);\n    --ds-grey-low: var(--ds-grey-10);\n    --ds-color: var(--ds-black);\n    --ds-color-background: var(--ds-white);\n    --ds-color-contrast: var(--ds-color);\n\n    --ds-shadow-light: rgba(0, 0, 0, 0.07);\n    --ds-shadow-middle: rgba(0, 0, 0, 0.09);\n    --ds-shadow-dark: rgba(0, 0, 0, 0.11);\n    --ds-shadow-tiny: 0 1px 1px var(--ds-shadow-dark);\n    --ds-shadow-small:\n      0 1px 1px var(--ds-shadow-dark),\n      0 2px 2px var(--ds-shadow-middle),\n      0 4px 4px var(--ds-shadow-light);\n    --ds-shadow-medium:\n      0 1px 1px var(--ds-shadow-middle),\n      0 2px 2px var(--ds-shadow-middle),\n      0 4px 4px var(--ds-shadow-middle),\n      0 6px 8px var(--ds-shadow-middle),\n      0 8px 16px var(--ds-shadow-middle);\n    --ds-shadow-large:\n      0 -2px 2px var(--ds-shadow-light),\n      0 4px 2px var(--ds-shadow-light),\n      0 8px 4px var(--ds-shadow-light),\n      0 16px 8px var(--ds-shadow-light),\n      0 32px 16px var(--ds-shadow-light);\n\n    --ds-box-radius: 4px;\n\n    --ds-input-border: var(--ds-grey-medium);\n    --ds-input-space: var(--ds-space);\n    --ds-input-font: var(--ds-font-body);\n    --ds-input-height: calc(var(--ds-line-height) * 1.5);\n    --ds-input-margin: calc(var(--ds-line-height) * 0.5);\n\n    --ds-button-space: calc(0.5 * var(--ds-input-space));\n    --ds-button-bg-color: var(--ds-grey-low);\n    --ds-button-default-bg-color: var(--ds-white);\n    --ds-button-border: 1px solid var(--ds-grey-low);\n    --ds-button-disabled-color: var(--ds-grey-medium);\n    --ds-button-disabled-bg-color: var(--ds-white);\n    --ds-button-primary-bg-color: var(--ds-primary);\n    --ds-button-primary-color: var(--ds-primary-contrast);\n    --ds-button-primary-border-color: transparent;\n    --ds-button-support-bg-color: var(--ds-support);\n    --ds-button-support-color: var(--ds-support-contrast);\n    --ds-button-support-border-color: transparent;\n    --ds-button-line-height: calc(var(--ds-line-height) * 1.5);\n    --ds-button-shadow: 0;\n    --ds-button-shadow-hover: var(--ds-shadow-small);\n    --ds-button-radius: var(--ds-box-radius);\n    --ds-button-padding: calc(0.5 * var(--ds-line-height));\n    --ds-button-font-size: calc(0.875 * var(--ds-font-size));\n\n    --ds-dialog-background: var(--ds-color-background);\n    --ds-dialog-color: var(--ds-color-contrast);\n    --ds-dialog-shadow: var(--ds-shadow-large);\n    --ds-dialog-radius: calc(2 * var(--ds-box-radius));\n    --ds-dialog-size: calc(50% - (1 / 2 * var(--ds-space)));\n    --ds-dialog-min-width: 25em;\n  }\n\n  :root[data-margin-notes-theme="dark"],\n  :host([data-margin-notes-theme="dark"]) {\n    --ds-color-scheme: dark;\n    --ds-primary: oklch(0.78 0.14 142);\n    --ds-support: oklch(0.78 0.13 225);\n    --ds-primary-high: oklch(0.84 0.11 142);\n    --ds-primary-low: oklch(0.3 0.08 142);\n    --ds-support-high: oklch(0.82 0.1 225);\n    --ds-support-low: oklch(0.3 0.08 225);\n    --ds-grey-high: #f3f3ed;\n    --ds-grey-medium: #b8bbad;\n    --ds-grey-low: #343831;\n    --ds-color: #f3f3ed;\n    --ds-color-background: #1b1d19;\n    --ds-color-contrast: #f3f3ed;\n    --ds-shadow-light: rgba(0, 0, 0, 0.18);\n    --ds-shadow-middle: rgba(0, 0, 0, 0.24);\n    --ds-shadow-dark: rgba(0, 0, 0, 0.32);\n    --ds-input-border: #5b6054;\n    --ds-button-bg-color: #343831;\n    --ds-button-default-bg-color: #242720;\n    --ds-button-border: 1px solid #4a5045;\n    --ds-button-disabled-color: #8e9285;\n    --ds-button-disabled-bg-color: #242720;\n    --ds-dialog-background: #1f211d;\n  }\n\n  @media (prefers-color-scheme: dark) {\n    :root[data-margin-notes-theme="system"],\n    :host([data-margin-notes-theme="system"]) {\n      --ds-color-scheme: dark;\n      --ds-primary: oklch(0.78 0.14 142);\n      --ds-support: oklch(0.78 0.13 225);\n      --ds-primary-high: oklch(0.84 0.11 142);\n      --ds-primary-low: oklch(0.3 0.08 142);\n      --ds-support-high: oklch(0.82 0.1 225);\n      --ds-support-low: oklch(0.3 0.08 225);\n      --ds-grey-high: #f3f3ed;\n      --ds-grey-medium: #b8bbad;\n      --ds-grey-low: #343831;\n      --ds-color: #f3f3ed;\n      --ds-color-background: #1b1d19;\n      --ds-color-contrast: #f3f3ed;\n      --ds-shadow-light: rgba(0, 0, 0, 0.18);\n      --ds-shadow-middle: rgba(0, 0, 0, 0.24);\n      --ds-shadow-dark: rgba(0, 0, 0, 0.32);\n      --ds-input-border: #5b6054;\n      --ds-button-bg-color: #343831;\n      --ds-button-default-bg-color: #242720;\n      --ds-button-border: 1px solid #4a5045;\n      --ds-button-disabled-color: #8e9285;\n      --ds-button-disabled-bg-color: #242720;\n      --ds-dialog-background: #1f211d;\n    }\n  }\n}\n\n@layer component {\n  .ds-button {\n    background-color: var(--ds-button-bg-color);\n    border: 0;\n    border-radius: var(--ds-button-radius);\n    box-shadow: var(--ds-button-shadow);\n    box-sizing: border-box;\n    color: inherit;\n    cursor: pointer;\n    display: inline-block;\n    font: inherit;\n    font-size: var(--ds-button-font-size);\n    line-height: var(--ds-button-line-height);\n    margin: 0 var(--ds-button-space) var(--ds-button-space) 0;\n    min-height: var(--ds-button-line-height);\n    outline: var(--ds-button-border);\n    overflow: visible;\n    padding: 0 var(--ds-button-padding);\n    text-align: center;\n    text-decoration: none;\n    white-space: nowrap;\n  }\n\n  .ds-button:hover,\n  .ds-button:focus {\n    box-shadow: var(--ds-button-shadow-hover);\n    text-decoration: none;\n  }\n\n  .ds-button-default {\n    background-color: var(--ds-button-default-bg-color);\n  }\n\n  .ds-button-primary,\n  .ds-button-primary:hover {\n    background-color: var(--ds-button-primary-bg-color);\n    color: var(--ds-button-primary-color);\n    outline: 1px solid var(--ds-button-primary-border-color);\n  }\n\n  .ds-button-support,\n  .ds-button-support:hover {\n    background-color: var(--ds-button-support-bg-color);\n    color: var(--ds-button-support-color);\n    outline: 1px solid var(--ds-button-support-border-color);\n  }\n\n  .ds-button-naked {\n    background: none;\n    box-shadow: none;\n    outline: none;\n  }\n\n  .ds-dialog {\n    background: var(--ds-dialog-background);\n    border: 0;\n    border-radius: var(--ds-dialog-radius);\n    box-shadow: var(--ds-dialog-shadow);\n    color: var(--ds-dialog-color);\n    max-width: 100%;\n    min-width: min(100%, var(--ds-dialog-min-width));\n    padding: 0;\n    width: var(--ds-dialog-size);\n  }\n}\n';

// src/features/paragraph-note-stacks/ui.css
var ui_default = '[data-margin-notes-target],\n.margin-notes-anchor-widget {\n  --margin-notes-paper-background: var(--ds-color-background, #fff);\n  --margin-notes-open-background: var(--ds-color-background, #fffefb);\n  --margin-notes-note-color: var(--ds-grey-high, #302a1d);\n  --margin-notes-muted-color: var(--ds-grey-medium, #5d5a51);\n  --margin-notes-rule-color: var(--ds-grey-low, #ebe4d1);\n  --margin-notes-marker-color: var(--ds-support, #c9a84f);\n  --margin-notes-action-color: var(--ds-primary-high, #4d5f8f);\n  --margin-notes-focus-color: var(--ds-primary-high, #3162d4);\n  --margin-notes-radius: var(--ds-box-radius, 4px);\n  --margin-notes-shadow: var(--ds-shadow-small, 0 4px 14px rgba(20, 31, 56, 0.16));\n  --margin-notes-font: var(--ds-font-body, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);\n  color-scheme: var(--ds-color-scheme, light);\n}\n\n[data-margin-notes-target] {\n  position: relative;\n  outline: none;\n}\n\n.margin-notes-anchor-widget,\n.margin-notes-anchor-widget-host {\n  display: contents;\n}\n\n[data-margin-notes-target]::before {\n  bottom: 0;\n  content: "";\n  left: -3rem;\n  position: absolute;\n  top: 0;\n  width: 3rem;\n}\n\n[data-margin-notes-target].margin-notes-target-tabstop:focus-visible {\n  outline: 2px solid var(--margin-notes-focus-color);\n  outline-offset: 4px;\n}\n\n.margin-notes-target-add-btn {\n  align-items: center;\n  background: var(--margin-notes-paper-background);\n  border: 1px solid var(--ds-grey-30, #cfd6e6);\n  border-radius: 999px;\n  box-shadow: var(--margin-notes-shadow);\n  color: var(--margin-notes-action-color);\n  cursor: pointer;\n  display: inline-flex;\n  font: 600 1rem/1 var(--margin-notes-font);\n  height: 2rem;\n  justify-content: center;\n  left: -2.75rem;\n  opacity: 0;\n  pointer-events: none;\n  position: absolute;\n  top: 0.35rem;\n  transform: translateX(0.25rem);\n  transition: opacity 120ms ease, transform 120ms ease, border-color 120ms ease;\n  width: 2rem;\n  z-index: 2;\n}\n\n[data-margin-notes-target]:hover .margin-notes-target-add-btn,\n[data-margin-notes-target]:focus .margin-notes-target-add-btn,\n[data-margin-notes-target]:focus-within .margin-notes-target-add-btn,\n.margin-notes-target-add-btn:focus-visible {\n  opacity: 1;\n  pointer-events: auto;\n  transform: translateX(0);\n}\n\n.margin-notes-target-add-btn:hover,\n.margin-notes-target-add-btn:focus-visible {\n  border-color: var(--margin-notes-focus-color);\n}\n\n.margin-notes-target-note-list {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n  left: calc(100% + 1.25rem);\n  position: absolute;\n  top: 0;\n  width: min(17rem, 34vw);\n  z-index: 3;\n}\n\n.margin-notes-target-note-list.is-expanded {\n  background: var(--margin-notes-open-background);\n  border-radius: var(--margin-notes-radius);\n  box-shadow: 0 0 0 0.35rem var(--margin-notes-open-background);\n  z-index: 30;\n}\n\n.margin-notes-target-note-count {\n  align-items: center;\n  align-self: flex-start;\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-muted-color);\n  cursor: pointer;\n  display: inline-flex;\n  font: 600 0.78rem/1 var(--margin-notes-font);\n  gap: 0.25rem;\n  padding: 0.05rem 0.2rem;\n}\n\n.margin-notes-target-note-count::before,\n.margin-notes-target-note-toggle::before {\n  background: var(--margin-notes-marker-color);\n  border-radius: 1px;\n  content: "";\n  display: inline-block;\n  flex: 0 0 auto;\n  height: 0.72rem;\n  opacity: 0.72;\n  transform: rotate(-2deg);\n  width: 0.58rem;\n}\n\n.margin-notes-target-note-count[hidden],\n.margin-notes-target-note-count[data-margin-notes-empty="true"],\n.margin-notes-target-note[hidden] {\n  display: none;\n}\n\n.margin-notes-target-note-items {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n}\n\n.margin-notes-target-note {\n  background: transparent;\n  border-radius: var(--margin-notes-radius);\n  color: var(--margin-notes-note-color);\n  min-height: 2rem;\n  position: relative;\n}\n\n.margin-notes-target-note.is-expanded {\n  background: var(--margin-notes-open-background);\n  left: 0;\n  position: absolute;\n  right: auto;\n  top: var(--margin-notes-expanded-top, 0);\n  width: min(24rem, 54vw);\n  z-index: 20;\n}\n\n.margin-notes-target-note-toggle {\n  align-items: baseline;\n  background: transparent;\n  border: 0;\n  color: inherit;\n  cursor: pointer;\n  display: flex;\n  gap: 0.38rem;\n  font: 0.875rem/1.35 var(--margin-notes-font);\n  overflow: hidden;\n  padding: 0.16rem 0;\n  text-align: left;\n  width: 100%;\n}\n\n.margin-notes-target-note-text {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-toggle {\n  cursor: text;\n  overflow: visible;\n  padding: 0.35rem 2rem 0.55rem 0;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-text {\n  overflow: visible;\n  text-overflow: clip;\n  white-space: normal;\n}\n\n.margin-notes-target-note-actions {\n  border-top: 1px solid var(--margin-notes-rule-color);\n  display: none;\n  gap: 0.35rem;\n  justify-content: flex-end;\n  padding: 0 0.45rem 0.45rem;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-actions {\n  display: flex;\n}\n\n.margin-notes-target-note-action {\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-action-color);\n  cursor: pointer;\n  font: 600 0.78rem/1 var(--margin-notes-font);\n  padding: 0.35rem;\n}\n\n.margin-notes-target-note-close {\n  align-items: center;\n  background: transparent;\n  border: 0;\n  color: var(--margin-notes-muted-color);\n  cursor: pointer;\n  display: none;\n  font: 1.1rem/1 var(--margin-notes-font);\n  height: 1.65rem;\n  justify-content: center;\n  padding: 0;\n  position: absolute;\n  right: 0.25rem;\n  top: 0.25rem;\n  width: 1.65rem;\n}\n\n.margin-notes-target-note.is-expanded .margin-notes-target-note-close {\n  display: inline-flex;\n}\n\n@media (max-width: 760px) {\n  [data-margin-notes-target]::before {\n    display: none;\n  }\n\n  .margin-notes-target-add-btn {\n    left: auto;\n    right: 0;\n    top: -0.85rem;\n  }\n\n  .margin-notes-target-note-list {\n    left: 0;\n    position: relative;\n    top: auto;\n    width: 100%;\n  }\n\n  .margin-notes-target-note.is-expanded {\n    width: min(100%, 24rem);\n  }\n}\n';

// src/features/solid-connection/ui.css
var ui_default2 = '.margin-notes-solid-connection {\n  color: var(--ds-color-contrast);\n  display: grid;\n  font-family: var(--ds-font-body);\n  font-size: 0.875rem;\n  gap: calc(var(--ds-space) / 3);\n  line-height: 1.35;\n}\n\n.margin-notes-solid-connection-webid {\n  display: grid;\n  gap: calc(var(--ds-space) / 4);\n}\n\n.margin-notes-solid-connection-webid span {\n  color: var(--ds-grey-medium);\n  font-size: 0.75rem;\n  font-weight: 600;\n}\n\n.margin-notes-solid-connection-webid input {\n  background: var(--ds-color-background);\n  border: 1px solid var(--ds-input-border);\n  border-radius: var(--ds-box-radius);\n  box-sizing: border-box;\n  color: var(--ds-color-contrast);\n  font: inherit;\n  inline-size: 100%;\n  min-block-size: var(--ds-input-height);\n  padding: 0 calc(var(--ds-space) / 3);\n}\n\n.margin-notes-solid-connection-status {\n  color: var(--ds-grey-medium);\n  margin: 0;\n}\n\n.margin-notes-solid-connection-status[data-status="connected"] {\n  color: var(--ds-primary-high);\n}\n\n.margin-notes-solid-connection-status[data-status="error"] {\n  color: var(--ds-color-error);\n}\n';

// node_modules/@muze-nl/metro-core/src/index.mjs
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

// node_modules/@muze-nl/metro-core/src/metro.mjs
var metroURL = "https://metro.muze.nl/details/";
if (!Symbol.metroProxy) {
  Symbol.metroProxy = Symbol("isProxy");
}
if (!Symbol.metroSource) {
  Symbol.metroSource = Symbol("source");
}
var Client = class _Client {
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
    options = Object.assign({}, this.clientOptions, options);
    const traceContext = createTraceContext(req, options);
    const middlewareContext = createMiddlewareContext(this, options, traceContext);
    const middlewares = this.clientOptions?.middlewares || [];
    const next = createMiddlewareChain(middlewares, traceContext, middlewareContext);
    return next(req);
  }
  with(...options) {
    return new _Client(deepClone(this.clientOptions), ...options);
  }
  get location() {
    return this.clientOptions.url;
  }
};
async function browserFetch(req) {
  if (req[Symbol.metroProxy]) {
    req = req[Symbol.metroSource];
  }
  const res = await fetch(req);
  return response(res);
}
function createMiddlewareChain(middlewares, traceContext, middlewareContext) {
  let next;
  for (const middleware of [browserFetch, ...middlewares]) {
    next = traceMiddleware(middleware, next, traceContext, middlewareContext);
  }
  return next;
}
function traceMiddleware(middleware, next, traceContext, middlewareContext) {
  const tracers2 = traceContext.tracers;
  return async function(req) {
    callTracers2(tracers2, "request", req, middleware, traceContext);
    let res;
    try {
      res = await middleware(req, next, middlewareContext);
    } catch (error4) {
      callTracers2(tracers2, "error", error4, req, middleware, traceContext);
      throw error4;
    }
    callTracers2(tracers2, "response", res, middleware, traceContext);
    return res;
  };
}
var traceContextId = 0;
var TRACE_OPTION_KEYS = ["trace", "tracer", "tracers"];
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
function createMiddlewareContext(client2, options, traceContext) {
  const trace2 = createTraceAPI(traceContext);
  return Object.freeze({
    client: client2,
    options,
    trace: trace2,
    fetch(req, fetchOptions = {}) {
      return client2.fetch(req, Object.assign({}, fetchOptions, { trace: trace2 }));
    }
  });
}
function createTraceAPI(context) {
  const api2 = {
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
      return tracedSpan(tracer, name, fn, data, context);
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
      return Object.assign({}, extra, { trace: api2 });
    }
  };
  return api2;
}
function callTracers2(tracers2, method, ...args) {
  for (const tracer of tracers2) {
    if (tracer && typeof tracer[method] == "function") {
      callTracer(tracer, method, args);
    }
  }
}
async function tracedSpan(tracer, name, fn, data, context) {
  let work = null;
  const run = () => {
    if (!work) {
      work = (async () => fn())();
    }
    return work;
  };
  try {
    await tracer.span(name, run, data, context);
  } catch (error4) {
    metroConsole.error("metro: tracer.span() failed", error4);
  }
  return run();
}
function callTracer(tracer, method, args) {
  const reportFailure = (error4) => {
    metroConsole.error("metro: tracer." + method + "() failed", error4);
  };
  try {
    const result = tracer[method].call(tracer, ...args);
    if (typeof result?.then == "function") {
      result.then(void 0, reportFailure);
    }
  } catch (error4) {
    reportFailure(error4);
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
function appendSearchParams(url2, params) {
  if (typeof params == "function") {
    params(url2.searchParams, url2);
  } else {
    params = new URLSearchParams(params);
    params.forEach((value, key) => {
      url2.searchParams.append(key, value);
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
var metroConsole = {
  error: (message2, ...details) => {
    console.error("\u24C2\uFE0F  ", message2, ...details);
  },
  info: (message2, ...details) => {
    console.info("\u24C2\uFE0F  ", message2, ...details);
  },
  group: (name) => {
    console.group("\u24C2\uFE0F  " + name);
  },
  groupEnd: (name) => {
    console.groupEnd("\u24C2\uFE0F  " + name);
  }
};
function metroError(message2, ...details) {
  metroConsole.error(message2, ...details);
  return new Error(message2, ...details);
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

// node_modules/@muze-nl/metro-middleware/src/json.mjs
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
      if (body === "") {
        return res;
      }
      try {
        let json2 = JSON.parse(body, options.reviver);
        return res.with({
          body: json2
        });
      } catch (error4) {
        if (!res.ok) {
          return res;
        }
        throw parseError(req, res, error4);
      }
    }
    return res;
  };
}
function parseError(req, res, cause) {
  const message2 = "jsonmw: could not parse " + res.headers.get("Content-Type") + " response from " + req.url;
  const error4 = new Error(message2, { cause });
  error4.request = req;
  error4.response = res;
  return error4;
}
var jsonRE = /^application\/([a-zA-Z0-9\-_]+\+)?json\b/;
function isJSON(contentType) {
  return jsonRE.exec(contentType);
}
function isPlainText(contentType) {
  return /^text\/plain\b/.exec(contentType);
}

// node_modules/@muze-nl/metro-middleware/src/thrower.mjs
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

// node_modules/@muze-nl/metro-middleware/src/getdata.mjs
function getdatamw(options = {}) {
  return async function getdata(req, next) {
    let res = await next(req);
    if (res.ok) {
      if (options.alwaysData) {
        let data = res.data;
        if (data == null) {
          data = {};
        }
        if (options.responseProperty && (typeof data != "object" && typeof data != "function")) {
          throw new TypeError("getdata: responseProperty requires response.data to be an object");
        }
        if (options.responseProperty) {
          Object.defineProperty(data, options.responseProperty, {
            value: res,
            enumerable: false,
            configurable: true
          });
        }
        return data;
      }
      if (res.data) {
        return res.data;
      }
    }
    return res;
  };
}

// node_modules/@muze-nl/metro-middleware/src/_trace.mjs
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

// node_modules/@muze-nl/metro-middleware/src/backoff.mjs
var DEFAULT_BACKOFF_STATUSES = [429, 503];
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
  const values3 = /* @__PURE__ */ new Map();
  return {
    get(key) {
      return values3.get(key) || 0;
    },
    set(key, until) {
      values3.set(key, until);
    },
    clear(key = null) {
      if (key == null) {
        values3.clear();
      } else {
        values3.delete(key);
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
  const url2 = new URL(req.url);
  if (options.scope == "url") {
    return url2.href;
  }
  if (options.scope == "path") {
    return `${url2.origin}${url2.pathname}`;
  }
  return url2.origin;
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
backoffmw.memoryStore = memoryBackoffStore;
backoffmw.localStorageStore = localStorageBackoffStore;
backoffmw.parseRetryAfter = parseRetryAfter;
backoffmw.responseDelay = responseBackoffDelay;

// node_modules/@muze-nl/metro-middleware/src/retry.mjs
var DEFAULT_RETRY_STATUS = [408, 425, 429, 500, 502, 503, 504];
var DEFAULT_RETRY_METHODS = ["GET", "HEAD", "OPTIONS"];
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
    const url2 = new URL(value, "https://localhost/");
    return url2.origin == "https://localhost" ? url2.pathname + url2.search : url2.href;
  } catch (e) {
    return String(value);
  }
}

// node_modules/@muze-nl/metro-middleware/src/abort.mjs
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
  if (typeof AbortSignal != "undefined" && typeof AbortSignal.any == "function") {
    return AbortSignal.any(signals2);
  }
  const controller = new AbortController();
  const cleanup = [];
  const abort = (event) => {
    for (const remove2 of cleanup) {
      remove2();
    }
    const source2 = event?.target || signals2.find((signal3) => signal3.aborted);
    if (!controller.signal.aborted) {
      controller.abort(source2?.reason || abortError());
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
function abortError(message2 = "Request was aborted") {
  if (typeof DOMException != "undefined") {
    return new DOMException(message2, "AbortError");
  }
  const error4 = new Error(message2);
  error4.name = "AbortError";
  return error4;
}
function signalFor(signal3, req) {
  return typeof signal3 == "function" ? signal3(req) : signal3;
}
function isAbortSignal(value) {
  return value && typeof value == "object" && typeof value.aborted == "boolean" && typeof value.addEventListener == "function";
}
abortmw.combineSignals = combineSignals;
abortmw.abortError = abortError;

// node_modules/@muze-nl/metro-middleware/src/timeout.mjs
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
timeoutmw.timeoutError = timeoutError;

// node_modules/@muze-nl/metro-middleware/src/echo.mock.mjs
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

// node_modules/@muze-nl/metro-middleware/src/error.mock.mjs
var baseResponse = {
  status: 200,
  statusText: "OK",
  headers: {
    "Content-Type": "application/json"
  }
};
var badRequest = (error4) => {
  return {
    status: error4.code,
    statusText: error4.message,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(error4)
  };
};
var status = {
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
function errormw(options) {
  const customStatus = Object.assign({}, status, options);
  return async function error4(req) {
    let url2 = url(req.url);
    if (status[url2.pathname]) {
      let error5 = {
        code: parseInt(url2.pathname.substring(1)),
        message: customStatus[url2.pathname]
      };
      return response(badRequest(error5));
    } else {
      return response(baseResponse);
    }
  };
}

// node_modules/@muze-nl/metro-middleware/src/index.mjs
var src_default3 = {
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

// node_modules/@muze-nl/metro-api/src/index.mjs
var API = class extends Client {
  #methods = null;
  #base = "";
  constructor(base, methods = {}, bind2 = null) {
    if (base instanceof Client) {
      super(base.clientOptions);
    } else {
      let baseURL = base;
      if (base && typeof base == "object" && !(base instanceof URL)) {
        baseURL = base.url;
      }
      try {
        new URL(baseURL);
      } catch {
        throw new TypeError(
          "metro-api: API base must be an absolute URL or Metro client",
          { cause: base }
        );
      }
      super(base);
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
function api(base, methods) {
  return new API(client(base, throwermw(), getdatamw()), methods);
}
function jsonApi(base, methods) {
  return new API(client(base, jsonmw(), throwermw(), getdatamw()), methods);
}

// node_modules/@muze-nl/metro-trace/src/index.mjs
var src_exports4 = {};
__export(src_exports4, {
  GraphTracer: () => GraphTracer,
  add: () => add,
  clear: () => clear,
  default: () => src_default4,
  delete: () => remove,
  graph: () => graph2,
  group: () => group,
  localConsole: () => localConsole,
  remove: () => remove
});

// node_modules/@muze-nl/metro-trace/src/tracegraph.mjs
var DEFAULT_OPTIONS = {
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
var SEVERITY_WEIGHT = {
  ok: 0,
  info: 1,
  warning: 2,
  error: 3,
  blocked: 4
};
var SEVERITY_SYMBOL = {
  ok: "\u2713",
  info: "\u2139",
  warning: "\u26A0",
  error: "\u2716",
  blocked: "\u26D4",
  skipped: "\u23ED",
  pending: "\u2026"
};
function graph2(options = {}) {
  return new GraphTracer(options);
}
function localConsole(options = {}) {
  return graph2(options);
}
var GraphTracer = class {
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
    const message2 = error4?.message || "Middleware failed";
    const trace2 = this.store.read(span.traceId);
    const alreadyReported = trace2?.diagnostics?.some((diagnostic) => diagnostic.data?.errorMessage == message2);
    if (span.kind == "fetch" || !alreadyReported) {
      this.diagnostic({
        traceId: span.traceId,
        spanId: span.spanId,
        severity: "error",
        code: span.kind == "fetch" ? "network-error" : "middleware-error",
        message: message2,
        data: {
          middleware: middlewareName(middleware),
          method: req?.method,
          url: safeURL(req?.url),
          name: error4?.name,
          errorMessage: message2
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
    const trace2 = {
      id: data.traceId || id("trace"),
      name,
      start: now(),
      status: "running",
      severity: "ok",
      data: sanitizeData(data)
    };
    state.activeTraceId = trace2.id;
    state.lastTraceId = trace2.id;
    this.lastTraceId = trace2.id;
    this.store.saveTrace(trace2);
    return trace2.id;
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
    const trace2 = typeof traceId == "object" ? traceId : this.get(traceId);
    if (!trace2) {
      return null;
    }
    return printTrace(trace2, Object.assign({}, this.options, options));
  }
  printLast(options = {}) {
    return this.print(this.lastTraceId || this.store.lastTraceId?.(), options);
  }
  render(traceId = this.lastTraceId, options = {}) {
    const trace2 = typeof traceId == "object" ? traceId : this.get(traceId);
    if (!trace2) {
      return "";
    }
    return renderTrace(trace2, Object.assign({}, this.options, options));
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
    const trace2 = this.store.read(state.activeTraceId);
    if (!trace2) {
      this.pause(context);
      return;
    }
    trace2.end = now();
    trace2.duration = trace2.end - trace2.start;
    trace2.status = status2 || traceStatus(trace2);
    trace2.severity = traceSeverity(trace2);
    this.store.saveTrace(trace2);
    state.lastTraceId = trace2.id;
    this.lastTraceId = trace2.id;
    if (this.options.autoPrint) {
      this.print(trace2.id);
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
function traceState() {
  return {
    stack: [],
    activeTraceId: null,
    activeParentSpanId: null,
    lastTraceId: null
  };
}
function renderTrace(trace2, options = {}) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  const diagnostics = trace2.diagnostics || [];
  const lines = [];
  lines.push(`${traceTitle(trace2)} ${trace2.status || ""} ${formatDuration(trace2.duration || elapsed(trace2))}`.trim());
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
  lines.push(options.view == "sequence" ? renderSequence(trace2, options) : renderTree(trace2, options));
  return lines.join("\n");
}
function renderTree(trace2, options = {}) {
  const spans = trace2.spans || [];
  const events = trace2.events || [];
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
function renderSequence(trace2, options = {}) {
  const arrows = sequenceArrows(trace2);
  if (!arrows.length) {
    return renderTree(trace2, options);
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
function printTrace(trace2, options = {}) {
  const output = renderTrace(trace2, options);
  const out = options.console || console;
  if (!out) {
    return output;
  }
  const title = `${symbol(trace2.severity)} ${traceTitle(trace2)} ${trace2.status || ""} ${formatDuration(trace2.duration || elapsed(trace2))}`.trim();
  if (out.groupCollapsed) {
    out.groupCollapsed("\u24C2\uFE0F  " + title);
  } else if (out.group) {
    out.group("\u24C2\uFE0F  " + title);
  }
  printDiagnostics(trace2.diagnostics || [], out);
  for (const line of output.split("\n")) {
    printLine(line, out);
  }
  if (options.includeRawTrace && out.dir) {
    out.dir(trace2);
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
    saveTrace(trace2) {
      traces.set(trace2.id, Object.assign({}, trace2));
      last = trace2.id;
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
    saveTrace(trace2) {
      safeStore(() => {
        storage.setItem(key(`trace:${trace2.id}`), JSON.stringify(trace2));
        storage.setItem(key("last"), trace2.id);
        updateIndex(storage, prefix, trace2.id);
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
  const response2 = span.response?.status ? ` HTTP ${span.response.status}` : "";
  const url2 = span.data?.url ? ` ${displayURL2(span.data.url)}` : "";
  return `${symbol(status2)} ${span.name}${response2}${url2} ${formatDuration(span.duration || elapsed(span))}`.trim();
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
function sequenceArrows(trace2) {
  const arrows = [];
  const spans = [...trace2.spans || []].sort((a, b) => a.start - b.start);
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
  for (const event of trace2.events || []) {
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
  const from2 = actors.indexOf(arrow.from);
  const to = actors.indexOf(arrow.to);
  const left = Math.min(from2, to);
  const right = Math.max(from2, to);
  const cells = actors.map(() => pad("\u2502", width));
  const label = `${symbol(arrow.severity)} ${arrow.label}`.trim();
  for (let index = left; index <= right; index++) {
    if (index == from2) {
      cells[index] = pad(from2 < to ? "\u251C" : "\u25C0", width);
    } else if (index == to) {
      cells[index] = pad(from2 < to ? "\u25B6" : "\u2524", width);
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
  const trace2 = traces.get(traceId);
  if (!trace2) {
    return null;
  }
  const result = Object.assign({}, trace2);
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
  const trace2 = parseJSON(storage.getItem(prefix + `trace:${traceId}`));
  if (!trace2) {
    return null;
  }
  trace2.spans = [];
  trace2.events = [];
  trace2.diagnostics = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key?.startsWith(prefix + `span:${traceId}:`)) {
      trace2.spans.push(parseJSON(storage.getItem(key)));
    } else if (key?.startsWith(prefix + `event:${traceId}:`)) {
      trace2.events.push(parseJSON(storage.getItem(key)));
    } else if (key?.startsWith(prefix + `diagnostic:${traceId}:`)) {
      trace2.diagnostics.push(parseJSON(storage.getItem(key)));
    }
  }
  trace2.spans = trace2.spans.filter(Boolean);
  trace2.events = trace2.events.filter(Boolean);
  trace2.diagnostics = trace2.diagnostics.filter(Boolean);
  trace2.status = trace2.status == "running" ? traceStatus(trace2) : trace2.status;
  trace2.severity = traceSeverity(trace2);
  return trace2;
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
    const trace2 = parseJSON(storage.getItem(prefix + `trace:${traceId}`));
    if (!trace2 || trace2.start < cutoff || keep.length >= maxTraces) {
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
function traceStatus(trace2) {
  const spans = trace2.spans || [];
  if (spans.some((span) => span.status == "running")) {
    return "incomplete";
  }
  if ((trace2.diagnostics || []).some((diagnostic) => diagnostic.severity == "error" || diagnostic.severity == "blocked")) {
    return "error";
  }
  if ((trace2.diagnostics || []).some((diagnostic) => diagnostic.severity == "warning")) {
    return "warning";
  }
  return "ok";
}
function traceSeverity(trace2) {
  let severity = trace2.status == "running" ? "pending" : "ok";
  for (const span of trace2.spans || []) {
    severity = maxSeverity(severity, span.severity || span.status || "ok");
  }
  for (const diagnostic of trace2.diagnostics || []) {
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
function traceTitle(trace2) {
  return trace2?.name || trace2?.id || "Metro trace";
}
function safeURL(value) {
  if (!value) {
    return value;
  }
  try {
    const url2 = new URL(value, typeof window != "undefined" ? window.location.href : "https://localhost/");
    url2.username = "";
    url2.password = "";
    for (const param of [...url2.searchParams.keys()]) {
      if (isSecretName(param)) {
        url2.searchParams.set(param, "\u2026");
      }
    }
    return url2.href;
  } catch (e) {
    return String(value);
  }
}
function displayURL2(value) {
  if (!value) {
    return "";
  }
  try {
    const url2 = new URL(value, "https://localhost/");
    return url2.origin == "https://localhost" ? url2.pathname + url2.search : url2.href;
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
    const url2 = new URL(value, "https://localhost/");
    return url2.pathname + url2.search;
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

// node_modules/@muze-nl/metro-trace/src/index.mjs
var metroConsole2 = {
  info: (message2, ...details) => console.info("\u24C2\uFE0F  ", message2, ...details),
  group: (name) => console.group("\u24C2\uFE0F  " + name),
  groupEnd: (name) => console.groupEnd("\u24C2\uFE0F  " + name)
};
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
var src_default4 = {
  add,
  delete: remove,
  remove,
  clear,
  group,
  graph: (...args) => graph2(...args),
  localConsole: (...args) => localConsole(...args)
};

// node_modules/@muze-nl/metro-hashparams/src/index.mjs
var src_exports5 = {};
__export(src_exports5, {
  append: () => append,
  clear: () => clear2,
  parse: () => parse
});
function parse(url2) {
  const hash = url(url2).hash.substr(1);
  const query = /\?[^#]*/.exec(hash)?.[0];
  return new URLSearchParams(query);
}
function append(url2, params) {
  url2 = url(url2);
  if (!(params instanceof URLSearchParams)) {
    params = new URLSearchParams(params);
  }
  let hash = url2.hash || "#";
  hash += "?" + params;
  return url2.with({ hash });
}
function clear2(url2) {
  url2 = url(url2);
  let hash = url2.hash.replace(/\?[^#]*/, "");
  if (hash.substr(0, 2) === "##") {
    hash = hash.substr(1);
  }
  return url2.with({ hash });
}

// node_modules/@muze-nl/metro-formdata/src/index.mjs
var metroURL2 = "https://metro.muze.nl/details/";
if (!Symbol.metroProxy) {
  Symbol.metroProxy = Symbol("isProxy");
}
if (!Symbol.metroSource) {
  Symbol.metroSource = Symbol("source");
}
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

// node_modules/@muze-nl/metro/src/index.mjs
var metro = Object.assign({}, src_exports3, {
  API,
  api,
  jsonApi,
  mw: src_default3,
  trace: src_exports4,
  hashParams: src_exports5,
  formdata
});
var src_default5 = metro;

// node_modules/@muze-nl/metro-oldm/src/oldmmw.mjs
function oldmmw(options) {
  options = Object.assign({
    contentType: "text/turtle",
    parser: src_default2.n3Parser,
    writer: src_default2.n3Writer
  }, options);
  const context = options.context ?? src_default2.context(options);
  async function oldmmw2(req, next) {
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
        if (isLinkedData(req.headers.get("Content-Type"))) {
          req = req.with({
            body: await writeRequestData(req)
          });
        }
      }
    }
    let res = await next(req);
    if (res && isLinkedData(res.headers?.get("Content-Type"))) {
      return res.with({
        body: await parseResponseData(req, res)
      });
    }
    return res;
  }
  async function writeRequestData(req) {
    try {
      return await context.writer(req.data);
    } catch (error4) {
      let message2 = "oldmmw: could not write request data as " + req.headers.get("Content-Type") + " for " + req.url;
      if (context.writer === src_default2.n3Writer) {
        message2 += "; the default writer expects an OLDM Graph";
      }
      throw linkedDataError(message2, error4, req);
    }
  }
  async function parseResponseData(req, res) {
    const contentType = res.headers.get("Content-Type");
    const body = await res.clone().text();
    try {
      return context.parse(body, req.url, contentType);
    } catch (error4) {
      if (!res.ok) {
        return body;
      }
      const message2 = "oldmmw: could not parse " + contentType + " response from " + req.url;
      throw linkedDataError(message2, error4, req, res);
    }
  }
  oldmmw2.context = context;
  return oldmmw2;
}
function linkedDataError(message2, cause, request2, response2) {
  const error4 = new Error(message2, { cause });
  error4.request = request2;
  if (response2) {
    error4.response = response2;
  }
  return error4;
}
var mimetypes = [
  /^text\/turtle\b/,
  /^application\/n-quads\b/,
  /^text\/x-nquads\b/,
  /^application\/n-triples\b/,
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
function isPlainText2(contentType) {
  return /^text\/plain\b/.exec(contentType);
}

// node_modules/@muze-nl/metro-oldm/src/index.mjs
var src_default6 = oldmmw;

// node_modules/@muze-labs/metro-solid/src/client.mjs
var vocabulary = src_default2.context();
function propertyValue(subject, iri) {
  const owner = subject?.graph ?? vocabulary;
  return subject?.[owner.propertyName(iri)];
}
var BASIC_CONTAINER = "http://www.w3.org/ns/ldp#BasicContainer";
var SOLID_RESPONSE = Symbol.for("muze.metro-solid.response");
function ensureSlash3(url2) {
  return String(url2).endsWith("/") ? String(url2) : `${url2}/`;
}
function ids(value) {
  return from(src_default2.many(value)).select((item) => typeof item === "string" ? item : item?.id).where(Boolean).toArray();
}
function solidApi(base, methods) {
  const linkedData = src_default6();
  return new src_default5.API(src_default5.client(
    base,
    linkedData,
    src_default5.mw.thrower(),
    src_default5.mw.getdata({
      alwaysData: true,
      responseProperty: SOLID_RESPONSE
    })
  ), {
    create(url2, body, options = {}) {
      const headers = new Headers(options.headers);
      if (!headers.has("If-None-Match")) {
        headers.set("If-None-Match", "*");
      }
      return this.put(String(url2), {
        ...options,
        body,
        headers
      });
    },
    createContainer(url2, options = {}) {
      const headers = new Headers(options.headers);
      if (!headers.has("If-None-Match")) {
        headers.set("If-None-Match", "*");
      }
      if (!headers.has("Link")) {
        headers.set("Link", `<${options.containerType ?? BASIC_CONTAINER}>; rel="type"`);
      }
      return this.put(ensureSlash3(url2), {
        ...options,
        body: options.body ?? "",
        headers
      });
    },
    async postToContainer(url2, body, options = {}) {
      const result = await this.post(ensureSlash3(url2), {
        ...options,
        body,
        headers: new Headers(options.headers)
      });
      const response2 = result[SOLID_RESPONSE];
      return {
        response: response2,
        location: response2.headers.get("Location"),
        etag: response2.headers.get("ETag")
      };
    },
    async contains(url2, options = {}) {
      const headers = new Headers(options.headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "text/turtle");
      }
      const result = await this.get(ensureSlash3(url2), {
        ...options,
        headers
      });
      const response2 = result[SOLID_RESPONSE];
      return from(src_default2.many(propertyValue(result?.primary, "http://www.w3.org/ns/ldp#contains"))).select((resource2) => {
        const id2 = typeof resource2 === "string" ? resource2 : resource2?.id;
        return { id: id2, url: id2, resource: resource2, response: response2 };
      }).where((entry) => entry.id).toArray();
    },
    async discoverProfile(webId, options = {}) {
      const headers = new Headers(options.headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "text/turtle");
      }
      const webIdIssues = issues(webId, allOf(String, validURL));
      if (webIdIssues) {
        throw new TypeError(`metro-solid: webId must be a fully qualified URL: ${webIdIssues[0].message}`);
      }
      const subjectId = webId;
      const result = await this.get(subjectId, {
        ...options,
        headers
      });
      const profile = result?.primary;
      if (!profile?.id) {
        throw new Error(`metro-solid: WebID did not resolve to a profile subject: ${subjectId}`);
      }
      return profile;
    },
    async discoverStorage(webId, options = {}) {
      const profile = await this.discoverProfile(webId, options);
      const storageUrls = [...new Set(from(ids(propertyValue(profile, "http://www.w3.org/ns/pim/space#storage"))).select(ensureSlash3).toArray())];
      return from(storageUrls).select((url2) => ({
        profile,
        id: url2,
        url: url2
      })).toArray();
    },
    async discoverWebId(webId, options = {}) {
      const profile = await this.discoverProfile(webId, options);
      const storage = [...new Set(from(ids(propertyValue(profile, "http://www.w3.org/ns/pim/space#storage"))).select(ensureSlash3).toArray())];
      return {
        webId,
        profile,
        storage,
        issuer: ids(propertyValue(profile, "http://www.w3.org/ns/solid/terms#oidcIssuer"))[0] ?? null,
        inbox: ids(propertyValue(profile, "http://www.w3.org/ns/ldp#inbox"))[0] ?? null
      };
    },
    ...methods,
    oldm: linkedData.context
  });
}

// node_modules/@muze-nl/metro-oauth2/src/oauth2.mjs
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

// node_modules/@muze-nl/metro-oauth2/node_modules/@muze-nl/assert/src/assert-core.mjs
var assert_core_exports2 = {};
__export(assert_core_exports2, {
  Optional: () => Optional2,
  Recommended: () => Recommended2,
  Required: () => Required2,
  allOf: () => allOf2,
  anyOf: () => anyOf3,
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
function conciseMessage2(message2, actual, expected) {
  if (message2 == "data and pattern are not equal") {
    return `expected ${formatValue2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message2 == "data does not match pattern" || /^data\[\d+\] does not match pattern$/.test(message2)) {
    return `expected ${describeExpected2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message2 == "data is undefined, should match pattern") {
    return `missing; expected ${describeExpected2(expected)}`;
  }
  if (message2 == "data is required") {
    return "required";
  }
  if (message2 == "data is an empty string, which is not allowed") {
    return "empty string is not allowed";
  }
  if (message2 == "data is not an object, pattern is") {
    return "data is not an object";
  }
  if (message2 == "data is not an instanceof pattern") {
    return `expected instance of ${describeExpected2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message2 == "data does not match oneOf patterns" || message2 == "data does not match anyOf patterns") {
    return `expected one of ${describeOneOf2(expected)}, found ${formatValue2(actual)}`;
  }
  if (message2 == "data matches pattern, when required not to") {
    return `must not match ${describeExpected2(expected)}`;
  }
  return message2;
}
function formatIssue2(issue, options = {}) {
  if (!issue || typeof issue != "object") {
    return String(issue);
  }
  let path2 = issue.pathString || pathToString2(issue.path || []) || "value";
  let indent = options.indent ?? "";
  return `${indent}${path2}: ${issue.message}`;
}
function formatIssues2(issues4, options = {}) {
  if (!issues4) {
    return false;
  }
  let indent = options.indent ?? "  - ";
  return (Array.isArray(issues4) ? issues4 : [issues4]).map((issue) => formatIssue2(issue, { ...options, indent }));
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
  let message2 = conciseMessage2(problem.message, actual, problem.expected);
  return {
    path: path2,
    pathString,
    message: message2,
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
function assert2(source2, test) {
  if (assertEnabled2) {
    let problems = fails2(source2, test);
    if (problems) {
      let assertionIssues = problemsToIssues2(problems);
      let formattedIssues = formatIssues2(assertionIssues);
      let message2 = "Assertions failed:\n" + formattedIssues.join("\n");
      console.error("\u{1F170}\uFE0F  " + message2);
      throw new Error(message2, {
        cause: { problems, issues: assertionIssues, source: source2 }
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
function anyOf3(...patterns) {
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
    let url2 = new URL(data);
    if (url2.href != data) {
      if (!(url2.href + "/" == data || url2.href == data + "/")) {
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
function error2(message2, found, expected, path2 = "", problems) {
  let pathParts = pathToArray2(path2);
  let result = {
    path: path2,
    pathString: pathToString2(pathParts),
    pathParts,
    message: message2,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn2(message2, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message2, pattern, data);
}

// node_modules/@muze-nl/metro-oauth2/node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assert = { ...assert_core_exports2 };

// node_modules/@muze-nl/metro-oauth2/src/tokenstore.mjs
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

// node_modules/@muze-nl/metro-oauth2/src/oauth2.mjs
var pendingTokenRequests = /* @__PURE__ */ new Map();
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
    authorize_callback: async (url2) => {
      if (window.location.href != url2.href) {
        window.location.replace(url2.href);
      }
      return false;
    }
  };
  assert2(options, {});
  const oauth22 = Object.assign({}, defaultOptions.oauth2_configuration, options?.oauth2_configuration);
  options = Object.assign({}, defaultOptions, options);
  options.oauth2_configuration = oauth22;
  const tokenStoreKey = options.tokens ?? "site:" + options.site;
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
      const token = await requestToken(fetchAccessToken);
      if (!token) {
        throw authorizationNotCompleted(req);
      }
      return oauth2authorized(req, next);
    } else if (tokenIsExpired && refreshToken) {
      const token = await requestToken(refreshAccessToken);
      if (!token) {
        throw authorizationNotCompleted(req);
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
      if (options.tokens.get("access_token")?.value !== accessToken.value) {
        return oauth2authorized(req, next, { handledRejectedToken: true });
      }
      options.tokens.delete("access_token");
      let tokenRequest = fetchAccessToken;
      if (refreshToken) {
        tokenRequest = refreshAccessToken;
      }
      const token = await requestToken(tokenRequest);
      if (!token) {
        throw authorizationNotCompleted(req);
      }
      return oauth2authorized(req, next, { handledRejectedToken: true });
    }
  }
  function requestToken(tokenRequest) {
    if (!pendingTokenRequests.has(tokenStoreKey)) {
      const pending = tokenRequest().finally(() => {
        pendingTokenRequests.delete(tokenStoreKey);
      });
      pendingTokenRequests.set(tokenStoreKey, pending);
    }
    return pendingTokenRequests.get(tokenStoreKey);
  }
  function getTokensFromLocation() {
    if (typeof window !== "undefined" && window?.location) {
      let url2 = url(window.location);
      let code, state, params;
      if (url2.searchParams.has("code") || url2.searchParams.has("error")) {
        params = url2.searchParams;
        url2 = url2.with({ search: "" });
        history.pushState({}, "", url2.href);
      } else if (url2.hash) {
        let query = url2.hash.substr(1);
        params = new URLSearchParams("?" + query);
        url2 = url2.with({ hash: "" });
        history.pushState({}, "", url2.href);
      }
      if (params) {
        validateIssuer(params.get("iss"));
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
    options.tokens.delete("authorization_code");
    let response2 = await options.client.post(tokenReq);
    if (!response2.ok) {
      let msg = await response2.text();
      throw metroError("OAuth2mw: fetch access_token: " + response2.status + ": " + response2.statusText + " (" + msg + ")", { cause: tokenReq });
    }
    let data = await response2.json();
    storeTokenResponse(data);
    return data;
  }
  async function refreshAccessToken() {
    let refreshTokenReq = getAccessTokenRequest("refresh_token");
    let response2 = await options.client.post(refreshTokenReq);
    if (!response2.ok) {
      let msg = await response2.text();
      throw metroError("OAuth2mw: refresh access_token: " + response2.status + ": " + response2.statusText + " (" + msg + ")", { cause: refreshTokenReq });
    }
    let data = await response2.json();
    storeTokenResponse(data);
    return data;
  }
  async function getAuthorizationCodeURL() {
    if (!oauth22.authorization_endpoint) {
      throw metroError("oauth2mw: Missing options.oauth2_configuration.authorization_endpoint");
    }
    let url2 = url(oauth22.authorization_endpoint, { hash: "" });
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
    if (oauth22.login_hint) {
      search.login_hint = oauth22.login_hint;
    }
    if (oauth22.nonce) {
      search.nonce = oauth22.nonce;
    }
    return url(url2, { search });
  }
  function getAccessTokenRequest(grant_type = null) {
    assert2(oauth22, {
      client_id: /.+/,
      redirect_uri: /.+/
    });
    if (!oauth22.token_endpoint) {
      throw metroError("oauth2mw: Missing options.endpoints.token url");
    }
    let url2 = url(oauth22.token_endpoint, { hash: "" });
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
    return request(url2, { method: "POST", headers, body: new URLSearchParams(params) });
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
      validateIssuer(authorization.iss);
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
  function validateIssuer(iss) {
    if (!oauth22.issuer) {
      return;
    }
    if (!iss) {
      if (oauth22.authorization_response_iss_parameter_supported) {
        throw metroError("oauth2mw: authorization response is missing iss, expected " + oauth22.issuer);
      }
      return;
    }
    if (iss !== oauth22.issuer) {
      throw metroError("oauth2mw: authorization response is from issuer " + iss + ", expected " + oauth22.issuer);
    }
  }
  function validateState(state) {
    let storedState = options.state.get();
    if (!state || state !== storedState) {
      throw metroError("oauth2mw: authorization state mismatch");
    }
  }
  function storeTokenResponse(data) {
    const token = validateTokenResponse(data, oauth22.token_type);
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
  const challenge = parseBearerChallenge(res.headers?.get("WWW-Authenticate"));
  if (res.status === 400) {
    return challenge?.error === "invalid_token";
  }
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
function validateTokenResponse(data, requiredTokenType) {
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
  if (requiredTokenType && tokenType !== normalizeTokenType(requiredTokenType)) {
    throw metroError("OAuth2mw: token endpoint returned a " + tokenType + " token, but " + requiredTokenType + " is required");
  }
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
  const encoder3 = new TextEncoder();
  const data = encoder3.encode(code_verifier);
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
function authorizationNotCompleted(req) {
  const error4 = new Error("oauth2mw: authorization was not completed for " + req.url + "; no access token was obtained");
  error4.code = "authorization_not_completed";
  error4.request = req;
  return error4;
}
function isRedirected() {
  let url2 = new URL(document.location.href);
  if (!url2.searchParams.has("code")) {
    if (url2.hash) {
      let query = url2.hash.substr(1);
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

// node_modules/dpop/build/index.js
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
  constructor(message2) {
    var _a;
    super(message2 !== null && message2 !== void 0 ? message2 : "operation not supported");
    this.name = this.constructor.name;
    (_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, this, this.constructor);
  }
};
var OperationProcessingError = class extends Error {
  constructor(message2) {
    var _a;
    super(message2);
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
  const claimsSet = Object.assign(/* @__PURE__ */ Object.create(null), additional, {
    iat: epochTime(),
    jti: crypto.randomUUID(),
    htm,
    nonce,
    htu,
    ath: accessToken ? b64u(await crypto.subtle.digest("SHA-256", buf(accessToken))) : void 0
  });
  return jwt({
    alg: determineJWSAlgorithm(privateKey),
    typ: "dpop+jwt",
    jwk: await publicJwk(publicKey)
  }, claimsSet, privateKey);
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

// node_modules/@muze-nl/metro-oauth2/src/keysstore.mjs
function keysStore() {
  return new Promise((resolve, reject) => {
    const request2 = globalThis.indexedDB.open("metro", 1);
    request2.onupgradeneeded = () => request2.result.createObjectStore("keyPairs", { keyPath: "domain" });
    request2.onerror = (event) => {
      reject(event);
    };
    request2.onsuccess = (event) => {
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
            const request3 = objectStore.get(key);
            request3.onsuccess = () => {
              resolve2(request3.result);
            };
            request3.onerror = reject2;
            tx.onerror = reject2;
          });
        },
        clear: function() {
          return new Promise((resolve2, reject2) => {
            const tx = db.transaction("keyPairs", "readwrite");
            const objectStore = tx.objectStore("keyPairs");
            const request3 = objectStore.clear();
            request3.onsuccess = () => {
              resolve2();
            };
            request3.onerror = reject2;
            tx.onerror = reject2;
          });
        }
      });
    };
  });
}

// node_modules/@muze-nl/metro-oauth2/src/oauth2.dpop.mjs
var serverNonces = /* @__PURE__ */ new Map();
function dpopmw(options) {
  assert2(options, {
    site: Required2(validURL2),
    token_endpoint: Required2(validURL2),
    dpop_signing_alg_values_supported: Optional2([])
    // this property is unfortunately rarely supported
  });
  return async (req, next) => {
    const keyPair = await keyPairFor(options.site);
    const origin = url(req.url).origin;
    let res = await next(await withProof(req, keyPair));
    rememberNonce(origin, res);
    if (needsProof(req) && await asksForNonce(res)) {
      res = await next(await withProof(req, keyPair));
      rememberNonce(origin, res);
    }
    return res;
  };
  function needsProof(req) {
    return req.url.startsWith(options.token_endpoint) || isDPoPAuthorization(req.headers.get("Authorization"));
  }
  async function withProof(req, keyPair) {
    if (!needsProof(req)) {
      return req;
    }
    const nonce = serverNonces.get(url(req.url).origin);
    const htu = targetURI(req.url);
    if (req.url.startsWith(options.token_endpoint)) {
      const proof2 = await generateProof(keyPair, htu, req.method, nonce);
      return req.with({
        headers: {
          "DPoP": proof2
        }
      });
    }
    const accessToken = req.headers.get("Authorization").split(" ")[1];
    const proof = await generateProof(keyPair, htu, req.method, nonce, accessToken);
    return req.with({
      headers: {
        "Authorization": "DPoP " + accessToken,
        "DPoP": proof
      }
    });
  }
}
async function keyPairFor(site) {
  const keys = await keysStore();
  let keyInfo = await keys.get(site);
  if (!keyInfo) {
    const keyPair = await generateKeyPair("ES256");
    keyInfo = { domain: site, keyPair };
    await keys.set(keyInfo);
  }
  return keyInfo.keyPair;
}
function targetURI(url2) {
  const target = new URL(url2);
  target.search = "";
  target.hash = "";
  return target.href;
}
function rememberNonce(origin, res) {
  const nonce = res.headers.get("DPoP-Nonce");
  if (nonce) {
    serverNonces.set(origin, nonce);
  }
}
async function asksForNonce(res) {
  if (!res.headers.get("DPoP-Nonce")) {
    return false;
  }
  if (res.status == 401) {
    const challenge = parseBearerChallenge(res.headers.get("WWW-Authenticate"));
    return challenge?.error == "use_dpop_nonce";
  }
  if (res.status == 400) {
    const body = await res.clone().json().catch(() => null);
    return body?.error == "use_dpop_nonce";
  }
  return false;
}
function isDPoPAuthorization(value) {
  return /^DPoP\s/i.test(value || "");
}

// node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/assert/src/assert-core.mjs
var assert_core_exports3 = {};
__export(assert_core_exports3, {
  Optional: () => Optional3,
  Recommended: () => Recommended3,
  Required: () => Required3,
  allOf: () => allOf3,
  anyOf: () => anyOf4,
  assert: () => assert3,
  disable: () => disable3,
  enable: () => enable3,
  error: () => error3,
  fails: () => fails3,
  formatIssue: () => formatIssue3,
  formatIssues: () => formatIssues3,
  instanceOf: () => instanceOf3,
  issues: () => issues3,
  not: () => not3,
  oneOf: () => oneOf3,
  validEmail: () => validEmail3,
  validURL: () => validURL3,
  warn: () => warn3
});
var assertEnabled3 = false;
function enable3() {
  assertEnabled3 = true;
}
function disable3() {
  assertEnabled3 = false;
}
function appendPath3(path2 = "", key) {
  if (typeof path2 == "undefined" || path2 == null) {
    path2 = "";
  }
  if (typeof key == "number") {
    return `${path2}[${key}]`;
  }
  return `${path2}.${key}`;
}
function pathToArray3(path2 = "") {
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
function pathToString3(path2 = []) {
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
function describeFunction3(value) {
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
function clip3(text, maxLength = 60) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + "\u2026";
}
function quoteString3(value) {
  return `'${clip3(String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n"))}'`;
}
function jsonSummary3(value) {
  try {
    let json = JSON.stringify(value);
    if (typeof json == "string") {
      return clip3(json);
    }
  } catch (e) {
  }
  let name = value?.constructor?.name;
  if (name && name != "Object") {
    return name;
  }
  return Object.prototype.toString.call(value);
}
function formatValue3(value) {
  if (typeof value == "string") {
    return quoteString3(value);
  }
  if (typeof value == "undefined") {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value == "function") {
    return describeFunction3(value);
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
  return jsonSummary3(value);
}
function describeExpected3(value) {
  if (value === String || value === Number || value === Boolean) {
    return describeFunction3(value);
  }
  if (typeof value == "function") {
    return describeFunction3(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return "[" + value.map(describeExpected3).join(", ") + "]";
  }
  return formatValue3(value);
}
function describeOneOf3(patterns) {
  return patterns.map(describeExpected3).join(", ");
}
function conciseMessage3(message2, actual, expected) {
  if (message2 == "data and pattern are not equal") {
    return `expected ${formatValue3(expected)}, found ${formatValue3(actual)}`;
  }
  if (message2 == "data does not match pattern" || /^data\[\d+\] does not match pattern$/.test(message2)) {
    return `expected ${describeExpected3(expected)}, found ${formatValue3(actual)}`;
  }
  if (message2 == "data is undefined, should match pattern") {
    return `missing; expected ${describeExpected3(expected)}`;
  }
  if (message2 == "data is required") {
    return "required";
  }
  if (message2 == "data is an empty string, which is not allowed") {
    return "empty string is not allowed";
  }
  if (message2 == "data is not an object, pattern is") {
    return "data is not an object";
  }
  if (message2 == "data is not an instanceof pattern") {
    return `expected instance of ${describeExpected3(expected)}, found ${formatValue3(actual)}`;
  }
  if (message2 == "data does not match oneOf patterns" || message2 == "data does not match anyOf patterns") {
    return `expected one of ${describeOneOf3(expected)}, found ${formatValue3(actual)}`;
  }
  if (message2 == "data matches pattern, when required not to") {
    return `must not match ${describeExpected3(expected)}`;
  }
  return message2;
}
function formatIssue3(issue, options = {}) {
  if (!issue || typeof issue != "object") {
    return String(issue);
  }
  let path2 = issue.pathString || pathToString3(issue.path || []) || "value";
  let indent = options.indent ?? "";
  return `${indent}${path2}: ${issue.message}`;
}
function formatIssues3(issues4, options = {}) {
  if (!issues4) {
    return false;
  }
  let indent = options.indent ?? "  - ";
  return (Array.isArray(issues4) ? issues4 : [issues4]).map((issue) => formatIssue3(issue, { ...options, indent }));
}
function issueFromProblem3(problem) {
  if (!problem || typeof problem != "object") {
    return {
      path: [],
      pathString: "",
      message: String(problem),
      expected: void 0,
      actual: void 0
    };
  }
  let path2 = pathToArray3(problem.path);
  let pathString = pathToString3(path2);
  let actual = problem.actual ?? problem.found;
  let expected = describeExpected3(problem.expected);
  let message2 = conciseMessage3(problem.message, actual, problem.expected);
  return {
    path: path2,
    pathString,
    message: message2,
    expected,
    actual
  };
}
function problemsToIssues3(problems) {
  if (!problems) {
    return [];
  }
  let result = [];
  for (let problem of Array.isArray(problems) ? problems : [problems]) {
    if (!problem) {
      continue;
    }
    if (problem && typeof problem == "object" && problem.problems) {
      let nested = problemsToIssues3(problem.problems);
      if (nested.length) {
        result = result.concat(nested);
        continue;
      }
    }
    result.push(issueFromProblem3(problem));
  }
  return result;
}
function assert3(source2, test) {
  if (assertEnabled3) {
    let problems = fails3(source2, test);
    if (problems) {
      let assertionIssues = problemsToIssues3(problems);
      let formattedIssues = formatIssues3(assertionIssues);
      let message2 = "Assertions failed:\n" + formattedIssues.join("\n");
      console.error("\u{1F170}\uFE0F  " + message2);
      throw new Error(message2, {
        cause: { problems, issues: assertionIssues, source: source2 }
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
function anyOf4(...patterns) {
  return function _anyOf(data, root, path2) {
    if (!Array.isArray(data)) {
      return error3("data is not an array", data, "anyOf", path2);
    }
    for (let [index, value] of data.entries()) {
      let itemPath = appendPath3(path2, index);
      if (oneOf3(...patterns)(value, root, itemPath)) {
        return error3("data does not match anyOf patterns", value, patterns, itemPath);
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
    let url2 = new URL(data);
    if (url2.href != data) {
      if (!(url2.href + "/" == data || url2.href == data + "/")) {
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
function issues3(data, pattern, root) {
  let problems = fails3(data, pattern, root);
  if (!problems) {
    return false;
  }
  return problemsToIssues3(problems);
}
function fails3(data, pattern, root, path2 = "") {
  if (typeof root == "undefined") {
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
      let index = data.findIndex((element2, index2) => fails3(element2, pattern, root, appendPath3(path2, index2)));
      if (index > -1) {
        problems.push(error3("data[" + index + "] does not match pattern", data[index], pattern, appendPath3(path2, index)));
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
    } else {
      for (let p of pattern) {
        for (let index of data.keys()) {
          let problem = fails3(data[index], p, root, appendPath3(path2, index));
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
      let index = data.findIndex((element2, index2) => fails3(element2, pattern, root, appendPath3(path2, index2)));
      if (index > -1) {
        problems.push(error3("data[" + index + "] does not match pattern", data[index], pattern, appendPath3(path2, index)));
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
          let result = fails3(data[patternKey], subpattern, root, appendPath3(path2, patternKey));
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
function error3(message2, found, expected, path2 = "", problems) {
  let pathParts = pathToArray3(path2);
  let result = {
    path: path2,
    pathString: pathToString3(pathParts),
    pathParts,
    message: message2,
    found,
    expected
  };
  if (problems) {
    result.problems = problems;
  }
  return result;
}
function warn3(message2, data, pattern, path2) {
  console.warn("\u{1F170}\uFE0F  Assert: " + path2, message2, pattern, data);
}

// node_modules/@muze-nl/metro-oidc/node_modules/@muze-nl/assert/src/assert.mjs
globalThis.assert = { ...assert_core_exports3 };

// node_modules/@muze-nl/metro-oidc/src/oidc.util.mjs
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
var validAuthMethods = [
  "none",
  "client_secret_post",
  "client_secret_basic",
  "client_secret_jwt",
  "private_key_jwt"
];

// node_modules/@muze-nl/metro-oidc/src/oidc.discovery.mjs
async function oidcDiscovery(options = {}) {
  assert3(options, {
    client: Optional3(instanceOf3(client().constructor)),
    issuer: Required3(validURL3)
  });
  const defaultOptions = {
    client: client().with(throwermw()).with(jsonmw()),
    requireDynamicRegistration: false
  };
  options = Object.assign({}, defaultOptions, options);
  options.client = options.client.with(throwermw()).with(jsonmw());
  requireSecureURL("issuer", options.issuer);
  function MustUseHTTPS(url2) {
    if (isSecureURL(url2)) {
      return false;
    }
    return error3("url must use https", url2);
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
    token_endpoint_auth_methods_supported: Optional3(anyOf4(...validAuthMethods)),
    token_endpoint_auth_signing_alg_values_supported: Optional3(MustInclude("RS256"), not3(MustInclude("none"))),
    display_values_supported: Optional3(anyOf4("page", "popup", "touch", "wap")),
    claim_types_supported: Optional3(anyOf4("normal", "aggregated", "distributed")),
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
  const configURL = url(options.issuer, ".well-known/openid-configuration");
  const response2 = await options.client.get(
    // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest
    // note: this allows path components in the options.issuer url
    configURL
  );
  const openid_config = response2.data;
  assert3(openid_config, openid_provider_metadata);
  checkProviderMetadata(openid_config, options.issuer);
  return openid_config;
}
var REQUIRED_ENDPOINTS = ["authorization_endpoint", "token_endpoint", "jwks_uri"];
function checkProviderMetadata(config, issuer) {
  if (!config || typeof config !== "object") {
    throw metroError("metro.oidc.discovery: openid-configuration for " + issuer + " is not a JSON object");
  }
  if (!sameIssuer(config.issuer, issuer)) {
    throw metroError("metro.oidc.discovery: openid-configuration is for issuer " + config.issuer + ", expected " + issuer);
  }
  requireSecureURL("issuer", config.issuer);
  for (const name of REQUIRED_ENDPOINTS) {
    if (!config[name]) {
      throw metroError("metro.oidc.discovery: openid-configuration for " + issuer + " has no " + name);
    }
    requireSecureURL(name, config[name]);
  }
  if (config.registration_endpoint) {
    requireSecureURL("registration_endpoint", config.registration_endpoint);
  }
}
function sameIssuer(discovered, requested) {
  if (typeof discovered != "string") {
    return false;
  }
  return withoutTrailingSlash(discovered) === withoutTrailingSlash(String(requested));
}
function withoutTrailingSlash(value) {
  return value.replace(/\/$/, "");
}
function requireSecureURL(name, value) {
  if (!isSecureURL(value)) {
    throw metroError("metro.oidc.discovery: " + name + " must use https: " + value);
  }
}
function isSecureURL(value) {
  let url2;
  try {
    url2 = new URL(String(value));
  } catch (e) {
    return false;
  }
  if (url2.protocol == "https:") {
    return true;
  }
  return url2.protocol == "http:" && isLoopback(url2.hostname);
}
function isLoopback(hostname) {
  return hostname == "localhost" || hostname.endsWith(".localhost") || hostname == "127.0.0.1" || hostname == "[::1]";
}

// node_modules/@muze-nl/metro-oidc/src/oidc.register.mjs
async function register(options) {
  const openid_client_metadata = {
    redirect_uris: Required3([validURL3]),
    response_types: Optional3([]),
    grant_types: Optional3(anyOf4("authorization_code", "refresh_token")),
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
    token_endpoint_auth_method: Optional3(oneOf3(...validAuthMethods)),
    token_endpoint_auth_signing_alg: Optional3(oneOf3(...validJWA)),
    default_max_age: Optional3(Number),
    require_auth_time: Optional3(Boolean),
    default_acr_values: Optional3([String]),
    initiate_login_uri: Optional3([validURL3]),
    request_uris: Optional3([validURL3])
  };
  assert3(options, {
    client: Optional3(instanceOf3(client().constructor)),
    registration_endpoint: validURL3,
    client_info: openid_client_metadata
  });
  const defaultOptions = {
    client: client().with(throwermw()).with(jsonmw()),
    client_info: {
      redirect_uris: [globalThis.document?.location.href]
    }
  };
  options = Object.assign({}, defaultOptions, options);
  options.client = options.client.with(throwermw()).with(jsonmw());
  if (!options.client_info) {
    options.client_info = {};
  }
  if (!options.client_info.redirect_uris) {
    options.client_info.redirect_uris = [globalThis.document?.location.href];
  }
  let response2 = await options.client.post(options.registration_endpoint, {
    body: options.client_info
  });
  let info = response2.data;
  if (!info.client_id) {
    throw metroError("metro.oidc: Error: dynamic registration of client failed, no client_id returned", response2);
  }
  options.client_info = Object.assign(options.client_info, info);
  return options.client_info;
}

// node_modules/@muze-nl/metro-oidc/src/oidc.store.mjs
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

// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder2 = new TextEncoder();
var decoder2 = new TextDecoder();
var strictDecoder = new TextDecoder("utf-8", { fatal: true });
var UINT32_RANGE = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf2 = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers)
    buf2.set(buffer, i), i += buffer.length;
  return buf2;
}
var NON_ASCII = /[^\x00-\x7f]/;
function encode(string) {
  if (typeof string == "string" && string.length >= 128) {
    if (NON_ASCII.test(string))
      throw new TypeError("non-ASCII string encountered in encode()");
    return encoder2.encode(string);
  }
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i] = code;
  }
  return bytes;
}
function decodeBase64(encoded, url2 = false) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded, { alphabet: url2 ? "base64url" : "base64" });
  if (url2) {
    if (encoded.includes("+") || encoded.includes("/"))
      throw new TypeError("Invalid base64url");
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  }
  const binary = atob(encoded), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  [Symbol.asyncIterator] = async function* () {
  };
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/util/base64url.js
var invalid = "The input to be decoded is not correctly encoded.";
function decode(input2) {
  try {
    return decodeBase64(typeof input2 == "string" ? input2 : decoder2.decode(input2), true);
  } catch (cause) {
    throw new TypeError(invalid, { cause });
  }
}

// node_modules/jose/dist/webapi/lib/validate.js
function isObject2(input2) {
  if (typeof input2 != "object" || input2 === null || Object.prototype.toString.call(input2) !== "[object Object]")
    return false;
  const prototype = Object.getPrototypeOf(input2);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}
function isJwkSet(input2) {
  return isObject2(input2) && Array.isArray(input2.keys) && Array.from(input2.keys).every(isObject2);
}
function isDisjoint(...headers) {
  const parameters = /* @__PURE__ */ new Set();
  for (const header of headers)
    if (header)
      for (const parameter of Object.keys(header)) {
        if (parameters.has(parameter))
          return false;
        parameters.add(parameter);
      }
  return true;
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch (cause) {
    throw new ErrorClass(`Failed to base64url decode the ${label}`, { cause });
  }
}
function encodeAsciiMember(value, label, ErrorClass) {
  try {
    return encode(value);
  } catch (cause) {
    throw new ErrorClass(`The ${label} is not a valid base64url string`, { cause });
  }
}
function parseJoseHeader(encodedProtectedHeader, ErrorClass, message2) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode(encodedProtectedHeader)));
  } catch (cause) {
    throw new ErrorClass(message2, { cause });
  }
  if (!isObject2(parsed))
    throw new ErrorClass(message2);
  return parsed;
}
var JWS_RECOGNIZED = { __proto__: null, b64: true };
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s != "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  return algorithms === void 0 ? void 0 : new Set(algorithms);
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === void 0)
    return [];
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input2) => typeof input2 != "string" || input2.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  const recognized = recognizedOption === void 0 ? recognizedDefault : { __proto__: null, ...recognizedOption, ...recognizedDefault };
  for (const parameter of protectedHeader.crit) {
    if (!(parameter in recognized))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === void 0)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized[parameter] && (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === void 0))
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return protectedHeader.crit;
}
function validateB64(protectedHeader, extensions) {
  if (extensions.includes("b64")) {
    const b64 = protectedHeader.b64;
    if (typeof b64 != "boolean")
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    return b64;
  }
  return true;
}

// node_modules/jose/dist/webapi/lib/key.js
var tag = (key) => key[Symbol.toStringTag];
var jwkMatchesOp = (entry, key, usage) => {
  const { alg } = entry;
  if (key.use !== void 0) {
    const expected = usage === "sign" || usage === "verify" ? "sig" : "enc";
    if (key.use !== expected)
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
  }
  if (key.alg !== void 0 && key.alg !== alg)
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  if (Array.isArray(key.key_ops)) {
    const expectedKeyOp = usage === "encrypt" || usage === "decrypt" ? entry.ops?.[usage === "encrypt" ? 0 : 1] : usage;
    if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp))
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
  }
};
async function prepareKey(entry, key, usage) {
  const { alg, secret } = entry, requiresPrivateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject2(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (requiresPrivateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === void 0 && normalized.priv === void 0)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${requiresPrivateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : requiresPrivateKey ? "private" : "public";
    if (key.type !== expectedType && (secret || ["secret", "public", "private"].includes(key.type)))
      throw new TypeError(`${tag(key)} instances must be of type "${expectedType}" for the ${alg} algorithm`);
    if (isCryptoKey2(key))
      return key;
    if (keyObject = key, keyObject.type === "secret")
      return keyObject.export();
  }
  cache ||= /* @__PURE__ */ new WeakMap();
  const cacheKey = key;
  let cached = cache.get(cacheKey);
  if (cached?.[alg])
    return cached[alg];
  if (cached || cache.set(cacheKey, cached = {}), keyObject && typeof keyObject.toCryptoKey == "function") {
    const isPublic = keyObject.type === "public", crv = nist[keyObject.asymmetricKeyDetails?.namedCurve], params = entry.resolve?.({ crv, asymmetricKeyType: keyObject.asymmetricKeyType }) ?? entry.subtle;
    return cached[alg] = keyObject.toCryptoKey(params, isPublic, entry.usages[isPublic ? 0 : 1]);
  }
  return normalized ??= keyObject.export({ format: "jwk" }), normalized.alg = alg, cached[alg] = await jwkToKey(entry, normalized);
}
var cache;
var nist = {
  __proto__: null,
  prime256v1: "P-256",
  secp384r1: "P-384",
  secp521r1: "P-521"
};
var isCryptoKey2 = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey2(key) || isKeyObject(key);
function message(msg, actual, ...types) {
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else types.length === 2 ? msg += `one of type ${types[0]} or ${types[1]}.` : msg += `of type ${types[0]}.`;
  return actual == null ? msg += ` Received ${actual}` : typeof actual == "function" && actual.name ? msg += ` Received function ${actual.name}` : typeof actual == "object" && actual != null && actual.constructor?.name && (msg += ` Received an instance of ${actual.constructor.name}`), msg;
}
function invalidKeyType(alg, actual, secret) {
  const types = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return secret && types.push("Uint8Array"), new TypeError(message(`Key for the ${alg} algorithm must be `, actual, ...types));
}
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkModulusLength(alg, key) {
  const { modulusLength } = key.algorithm;
  if (typeof modulusLength != "number" || modulusLength < 2048)
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
}
function checkCryptoKey(key, expected, usage) {
  const algorithm = key.algorithm;
  if (algorithm.name !== expected.name)
    throw unusable(expected.name);
  if (expected.hash && algorithm.hash?.name !== expected.hash)
    throw unusable(expected.hash, "algorithm.hash");
  if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve)
    throw unusable(expected.namedCurve, "algorithm.namedCurve");
  if (expected.length !== void 0 && algorithm.length !== expected.length)
    throw unusable(expected.length, "algorithm.length");
  checkUsage(key, usage);
}
function snapshotJwk(jwk) {
  return { __proto__: null, ...jwk };
}
function normalizeJwk(jwk) {
  const normalized = snapshotJwk(jwk);
  if (normalized.ext !== void 0 && typeof normalized.ext != "boolean")
    throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (normalized.key_ops !== void 0) {
    const value = normalized.key_ops, keyOps = Array.isArray(value) ? [...value] : void 0;
    if (!keyOps || keyOps.some((operation) => typeof operation != "string") || new Set(keyOps).size !== keyOps.length)
      throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    normalized.key_ops = keyOps;
  }
  return normalized;
}
async function jwkToKey(entry, jwk, extractable) {
  if (!entry.kty.includes(jwk.kty))
    throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle, isPrivate = !!(jwk.d || jwk.priv), keyData = { ...jwk, ext: extractable ?? jwk.ext };
  return keyData.kty !== "AKP" && delete keyData.alg, delete keyData.use, crypto.subtle.importKey("jwk", keyData, algorithm, keyData.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}
async function rawKey(key, expected, usage, extractable = false) {
  return key instanceof Uint8Array && (key = await crypto.subtle.importKey("raw", key, expected, extractable, [usage])), checkCryptoKey(key, expected, usage), key;
}

// node_modules/jose/dist/webapi/lib/key_descriptor.js
function table(entries) {
  const out = { __proto__: null };
  for (const alg in entries)
    out[alg] = { ...entries[alg], alg };
  return out;
}

// node_modules/jose/dist/webapi/lib/jws_algorithms.js
var sig = [["verify"], ["sign"]];
function hmac(bits) {
  const subtle = { name: "HMAC", hash: `SHA-${bits}` };
  return { kty: ["oct"], secret: true, subtle, signing: subtle, usages: sig };
}
function rsa(bits, saltLength) {
  const subtle = { name: saltLength ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${bits}` };
  return {
    kty: ["RSA"],
    subtle,
    signing: saltLength ? { ...subtle, saltLength } : subtle,
    usages: sig,
    minRsaBits: 2048
  };
}
function ecdsa(crv, bits) {
  return {
    kty: ["EC"],
    crv,
    subtle: { name: "ECDSA", namedCurve: crv },
    signing: { name: "ECDSA", hash: `SHA-${bits}` },
    usages: sig
  };
}
function eddsa() {
  const subtle = { name: "Ed25519" };
  return {
    kty: ["OKP"],
    crv: "Ed25519",
    subtle,
    signing: subtle,
    usages: sig
  };
}
function mldsa(parameterSet) {
  const subtle = { name: `ML-DSA-${parameterSet}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
var JWS = table({
  HS256: hmac(256),
  HS384: hmac(384),
  HS512: hmac(512),
  RS256: rsa(256),
  RS384: rsa(384),
  RS512: rsa(512),
  PS256: rsa(256, 32),
  PS384: rsa(384, 48),
  PS512: rsa(512, 64),
  ES256: ecdsa("P-256", 256),
  ES384: ecdsa("P-384", 384),
  ES512: ecdsa("P-521", 512),
  EdDSA: eddsa(),
  Ed25519: eddsa(),
  "ML-DSA-44": mldsa(44),
  "ML-DSA-65": mldsa(65),
  "ML-DSA-87": mldsa(87)
});
function jwsAlgorithm(alg) {
  const entry = typeof alg == "string" ? JWS[alg] : void 0;
  if (!entry)
    throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  return entry;
}

// node_modules/jose/dist/webapi/lib/jws_verify.js
function prepareVerify(options) {
  return [options && validateAlgorithms("algorithms", options.algorithms), options?.crit];
}
function parseProtectedHeader(encodedProtectedHeader) {
  return encodedProtectedHeader === void 0 ? {} : parseJoseHeader(encodedProtectedHeader, JWSInvalid, "JWS Protected Header is invalid");
}
function encodeCompactUnencodedPayload(payload) {
  try {
    return encode(payload);
  } catch (cause) {
    throw new JWSInvalid("JWS Compact Serialization payload must use only ASCII characters", {
      cause
    });
  }
}
async function verifySignature(jws, shared, key, encodeUnencodedPayload, parsedProtected) {
  const { protected: encodedProtectedHeader, header, payload: inputPayload } = jws, protectedHeader = parsedProtected ?? parseProtectedHeader(encodedProtectedHeader);
  if (!isDisjoint(protectedHeader, header))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...protectedHeader, ...header }, b64 = validateB64(protectedHeader, validateCrit(JWSInvalid, JWS_RECOGNIZED, shared[1], protectedHeader, joseHeader)), { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  if (shared[0] && !shared[0].has(alg))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (b64) {
    if (typeof inputPayload != "string")
      throw new JWSInvalid("JWS Payload must be a string");
  } else if (typeof inputPayload != "string" && !(inputPayload instanceof Uint8Array))
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  const signingPayload = b64 || typeof inputPayload != "string" ? inputPayload : encodeUnencodedPayload(inputPayload);
  let resolvedKey = false;
  typeof key == "function" && (key = await key(protectedHeader, jws), resolvedKey = true);
  const entry = jwsAlgorithm(alg), signingInput = concat(encodedProtectedHeader !== void 0 ? encode(encodedProtectedHeader) : new Uint8Array(), encode("."), typeof signingPayload == "string" ? shared[2] ??= encodeAsciiMember(signingPayload, "payload", JWSInvalid) : signingPayload), signature = decodeBase64url(jws.signature, "signature", JWSInvalid), verificationKey = await prepareKey(entry, key, "verify"), cryptoKey = await rawKey(verificationKey, entry.subtle, "verify");
  entry.minRsaBits && checkModulusLength(entry.alg, cryptoKey);
  let verified = false;
  try {
    verified = await crypto.subtle.verify(entry.signing, cryptoKey, signature, signingInput);
  } catch (cause) {
    throw new JWSSignatureVerificationFailed(void 0, { cause });
  }
  if (!verified)
    throw new JWSSignatureVerificationFailed();
  const result = { payload: typeof signingPayload == "string" ? decodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload };
  return encodedProtectedHeader !== void 0 && (result.protectedHeader = protectedHeader), header !== void 0 && (result.unprotectedHeader = header), resolvedKey ? [{ ...result, key: verificationKey }, b64] : [result, b64];
}
async function verifyCompact(jws, shared, key) {
  if (jws instanceof Uint8Array && (jws = decoder2.decode(jws)), typeof jws != "string")
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3)
    throw new JWSInvalid("Invalid Compact JWS");
  return verifySignature({ payload, protected: protectedHeader, signature }, shared, key, encodeCompactUnencodedPayload);
}

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = (date) => Math.floor(date.getTime() / 1e3);
var multipliers = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31557600
};
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var checkFailed = "check_failed";
function invalidDuration() {
  throw new TypeError("Invalid time period format");
}
function secs(str) {
  typeof str != "string" && invalidDuration();
  const matched = REGEX.exec(str);
  (!matched || matched[4] && matched[1]) && invalidDuration();
  const value = parseFloat(matched[2]), durationSeconds = Math.round(value * multipliers[matched[3][0].toLowerCase()]);
  return Number.isFinite(durationSeconds) || invalidDuration(), matched[1] === "-" || matched[4] === "ago" ? -durationSeconds : durationSeconds;
}
function validateInput(label, input2) {
  if (!Number.isFinite(input2))
    throw new TypeError(`Invalid ${label} input`);
  return input2;
}
var normalizeTyp = (value) => {
  const normalized = value.toLowerCase();
  return value.includes("/") ? normalized : `application/${normalized}`;
};
var checkAudiencePresence = (audPayload, audOption) => typeof audPayload == "string" ? audOption.includes(audPayload) : Array.isArray(audPayload) ? audOption.some((aud) => audPayload.includes(aud)) : false;
function validateNumericDate(claimsSet, claim, required = false) {
  const value = claimsSet[claim];
  if (!(value === void 0 && !required)) {
    if (typeof value != "number")
      throw new JWTClaimValidationFailed(`"${claim}" claim must be a number`, claimsSet, claim, "invalid");
    return value;
  }
}
function unexpectedClaim(claimsSet, claim) {
  throw new JWTClaimValidationFailed(`unexpected "${claim}" claim value`, claimsSet, claim, checkFailed);
}
function validateClaimsSet(protectedHeader, claimsSetBytes, options = {}) {
  let claimsSet;
  try {
    claimsSet = JSON.parse(strictDecoder.decode(claimsSetBytes));
  } catch (cause) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object", { cause });
  }
  if (!isObject2(claimsSet))
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  const { typ } = options;
  if (typ !== void 0 && (typeof protectedHeader.typ != "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ)))
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', claimsSet, "typ", checkFailed);
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options, presenceCheck = [...requiredClaims];
  maxTokenAge !== void 0 && presenceCheck.push("iat"), audience !== void 0 && presenceCheck.push("aud"), subject !== void 0 && presenceCheck.push("sub"), issuer !== void 0 && presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse()))
    if (!Object.hasOwn(claimsSet, claim))
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, claimsSet, claim, "missing");
  issuer !== void 0 && !(Array.isArray(issuer) ? issuer : [issuer]).includes(claimsSet.iss) && unexpectedClaim(claimsSet, "iss"), subject !== void 0 && claimsSet.sub !== subject && unexpectedClaim(claimsSet, "sub"), audience !== void 0 && !checkAudiencePresence(claimsSet.aud, typeof audience == "string" ? [audience] : audience) && unexpectedClaim(claimsSet, "aud");
  const { clockTolerance } = options;
  let tolerance = 0;
  if (typeof clockTolerance == "string")
    tolerance = secs(clockTolerance);
  else if (clockTolerance !== void 0) {
    if (typeof clockTolerance != "number")
      throw new TypeError("Invalid clockTolerance option type");
    tolerance = clockTolerance;
  }
  validateInput("clockTolerance option", tolerance);
  const { currentDate } = options, now2 = validateInput("currentDate option", epoch(currentDate === void 0 ? /* @__PURE__ */ new Date() : currentDate)), iat = validateNumericDate(claimsSet, "iat", maxTokenAge !== void 0), nbf = validateNumericDate(claimsSet, "nbf");
  if (nbf !== void 0 && nbf > now2 + tolerance)
    throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', claimsSet, "nbf", checkFailed);
  const exp = validateNumericDate(claimsSet, "exp");
  if (exp !== void 0 && exp <= now2 - tolerance)
    throw new JWTExpired('"exp" claim timestamp check failed', claimsSet, "exp", checkFailed);
  if (maxTokenAge !== void 0) {
    const age = now2 - iat, max = validateInput("maxTokenAge option", typeof maxTokenAge == "number" ? maxTokenAge : secs(maxTokenAge));
    if (age - tolerance > max)
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', claimsSet, "iat", checkFailed);
    if (age < -tolerance)
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', claimsSet, "iat", checkFailed);
  }
  return claimsSet;
}

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt2, key, options) {
  const [verified, b64] = await verifyCompact(jwt2, prepareVerify(options), key);
  if (!b64)
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  return { ...verified, payload };
}

// node_modules/jose/dist/webapi/jwks/local.js
function isUsableJWK(jwk, entry, alg, kid) {
  const { kty, key_ops: keyOps, ext, kid: jwkKid, alg: jwkAlg, use, crv } = jwk;
  return (ext === void 0 || typeof ext == "boolean") && (keyOps === void 0 || Array.isArray(keyOps) && keyOps.every((operation, index) => typeof operation == "string" && keyOps.indexOf(operation) === index) && keyOps.includes("verify")) && entry.kty.includes(kty) && (kid === void 0 || typeof kid == "string" && kid === jwkKid) && (jwkAlg === void 0 ? kty !== "AKP" : alg === jwkAlg) && (use === void 0 || use === "sig") && (!entry.crv || crv === entry.crv);
}
async function importWithAlgCache(cache2, jwk, entry) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk), { alg } = entry;
  if (cached[alg] === void 0) {
    const pending = jwkToKey(entry, jwk, true).then((key) => {
      if (key.type !== "public")
        throw new JWKSInvalid("JSON Web Key Set members must be public keys");
      return cached[alg] = key, key;
    }).catch((error4) => {
      throw cached[alg] === pending && delete cached[alg], error4;
    });
    cached[alg] = pending;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  let snapshot;
  try {
    snapshot = structuredClone(jwks);
  } catch (cause) {
    throw new JWKSInvalid("JSON Web Key Set malformed", { cause });
  }
  if (!isJwkSet(snapshot))
    throw new JWKSInvalid("JSON Web Key Set malformed");
  const metadata = snapshot.keys.map((jwk) => {
    const normalized = snapshotJwk(jwk);
    return Array.isArray(normalized.key_ops) && (normalized.key_ops = [...normalized.key_ops]), normalized;
  }), cached = /* @__PURE__ */ new WeakMap();
  return Object.defineProperty(async (protectedHeader, token) => {
    const { alg, kid } = { ...protectedHeader, ...token?.header }, entry = typeof alg == "string" ? JWS[alg] : void 0;
    if (!entry || entry.secret)
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
    const candidates = snapshot.keys.filter((_2, index) => isUsableJWK(metadata[index], entry, alg, kid)), { 0: jwk, length } = candidates;
    if (!length)
      throw new JWKSNoMatchingKey();
    if (length !== 1) {
      const error4 = new JWKSMultipleMatchingKeys();
      throw error4[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates)
          try {
            yield await importWithAlgCache(cached, jwk2, entry);
          } catch {
          }
      }, error4;
    }
    return importWithAlgCache(cached, jwk, entry);
  }, "jwks", {
    value: () => structuredClone(snapshot)
  });
}

// node_modules/@muze-nl/metro-oidc/src/oidc.jwt.mjs
var jwksCache = /* @__PURE__ */ new WeakMap();
function keySetFor(jwks) {
  if (!jwks || !Array.isArray(jwks.keys)) {
    throw metroError("metro.oidc: Error: jwks must be an object with a keys array");
  }
  if (!jwksCache.has(jwks)) {
    jwksCache.set(jwks, createLocalJWKSet(jwks));
  }
  return jwksCache.get(jwks);
}
function supportedAlgorithms(openidConfiguration = {}) {
  const algorithms = openidConfiguration.id_token_signing_alg_values_supported;
  if (Array.isArray(algorithms) && algorithms.length) {
    return algorithms.filter((algorithm) => algorithm !== "none");
  }
  return ["RS256"];
}
async function validateIdToken(idToken2, options = {}) {
  if (!idToken2) {
    throw metroError("metro.oidc: Error: token response did not include an id_token");
  }
  if (!options.jwks) {
    throw metroError("metro.oidc: Error: cannot validate id_token without jwks");
  }
  if (!options.issuer) {
    throw metroError("metro.oidc: Error: cannot validate id_token without issuer");
  }
  if (!options.client_id) {
    throw metroError("metro.oidc: Error: cannot validate id_token without client_id");
  }
  const { payload, protectedHeader } = await jwtVerify(
    idToken2,
    keySetFor(options.jwks),
    {
      issuer: options.issuer,
      audience: options.client_id,
      algorithms: options.algorithms || supportedAlgorithms(options.openid_configuration),
      clockTolerance: options.clockTolerance ?? 60,
      requiredClaims: ["iss", "sub", "aud", "exp", "iat"]
    }
  );
  if (options.nonce !== void 0 && payload.nonce !== options.nonce) {
    throw metroError("metro.oidc: Error: id_token nonce mismatch");
  }
  return {
    header: protectedHeader,
    claims: payload
  };
}

// node_modules/@muze-nl/metro-oidc/src/oidcmw.mjs
var pendingClientSetups = /* @__PURE__ */ new Map();
var BROWSER_CLIENT_METADATA = {
  token_endpoint_auth_method: "none",
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"]
};
function sharedClientSetup(key, setup) {
  if (!pendingClientSetups.has(key)) {
    const pending = setup().finally(() => {
      pendingClientSetups.delete(key);
    });
    pendingClientSetups.set(key, pending);
  }
  return pendingClientSetups.get(key);
}
function oidcmw(options = {}) {
  const defaultOptions = {
    client: client(),
    force_authorization: false,
    use_dpop: true,
    authorize_callback: async (url2) => {
      if (window.location.href != url2.href) {
        window.location.replace(url2.href);
      }
      return false;
    }
  };
  options = Object.assign({}, defaultOptions, options);
  const requestedClientInfo = options.client_info;
  assert3(options, {
    client: Required3(instanceOf3(client().constructor)),
    // required because it is set in defaultOptions
    client_info: Required3(),
    issuer: Required3(validURL3),
    oauth2: Optional3({}),
    openid_configuration: Optional3()
  });
  const account = accountFor(options);
  const expectedClaims = expectedClaimsFor(options);
  const site = siteFor(options.issuer, account);
  const clientSetupKey = options.issuer + " " + JSON.stringify(requestedClientInfo?.redirect_uris ?? null);
  let userStore = options.store;
  if (!options.store) {
    options.store = oidcStore(options.issuer);
    userStore = oidcStore(site);
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
  async function prepareClient() {
    if (options.openid_configuration && options.client_info?.client_id) {
      return;
    }
    const prepared = await sharedClientSetup(clientSetupKey, discoverAndRegister);
    options.openid_configuration = prepared.openid_configuration;
    options.client_info = prepared.client_info;
    options.store.set("openid_configuration", options.openid_configuration);
    options.store.set("client_info", options.client_info);
  }
  async function discoverAndRegister() {
    let openid_configuration = options.openid_configuration;
    if (!openid_configuration) {
      openid_configuration = await oidcDiscovery({
        issuer: options.issuer,
        client: options.client.with(options.issuer)
      });
    }
    let client_info = options.client_info;
    if (!client_info?.client_id) {
      if (!openid_configuration.registration_endpoint) {
        throw metroError("metro.oidcmw: Error: issuer " + options.issuer + " does not support dynamic client registration, but you haven't specified a client_id");
      }
      client_info = await register({
        registration_endpoint: openid_configuration.registration_endpoint,
        client: options.client,
        client_info: Object.assign({}, BROWSER_CLIENT_METADATA, client_info)
      });
      if (client_info.token_endpoint_auth_method == "none") {
        delete client_info.client_secret;
      }
    }
    return { openid_configuration, client_info };
  }
  function rememberNonce2(authorizeCallback) {
    if (typeof authorizeCallback != "function") {
      return authorizeCallback;
    }
    return async (url2) => {
      userStore.set("pending_nonce", url2.searchParams.get("nonce"));
      return authorizeCallback(url2);
    };
  }
  return async (req, next) => {
    let res;
    if (!options.force_authorization) {
      res = await next(req);
      if (res.ok || res.status != 401 && res.status != 403) {
        return res;
      }
    }
    await prepareClient();
    const scope = options.scope || defaultScope(options);
    const nonce = options.nonce || generateCodeVerifier(32);
    const oauth2Options = Object.assign(
      {
        site,
        client: options.client,
        force_authorization: true,
        authorize_callback: rememberNonce2(options.authorize_callback),
        oauth2_configuration: {
          client_id: options.client_info?.client_id,
          client_secret: options.client_info?.client_secret,
          token_endpoint_auth_method: options.client_info?.token_endpoint_auth_method,
          grant_type: "authorization_code",
          response_type: "code",
          response_mode: "query",
          authorization_endpoint: options.openid_configuration.authorization_endpoint,
          token_endpoint: options.openid_configuration.token_endpoint,
          scope,
          //FIXME: should only use scopes supported by server
          redirect_uri: options.client_info.redirect_uris[0],
          login_hint: options.login_hint ?? options.webid,
          issuer: options.openid_configuration.issuer,
          authorization_response_iss_parameter_supported: options.openid_configuration.authorization_response_iss_parameter_supported,
          token_type: options.use_dpop ? "DPoP" : void 0,
          nonce
        }
      }
      //...
    );
    const storeIdToken = async (req2, next2) => {
      const tokenEndpoint = url(options.openid_configuration.token_endpoint, { hash: "" }).href;
      const requestUrl = url(req2.url, { hash: "" }).href;
      if (requestUrl !== tokenEndpoint) {
        return next2(req2);
      }
      const isRefresh = await grantTypeOf(req2) == "refresh_token";
      const res2 = await next2(req2);
      const contentType = res2.headers.get("content-type");
      if (!res2.ok || !contentType?.startsWith("application/json")) {
        return res2;
      }
      let data = res2.data;
      if (!data || typeof data !== "object" || data instanceof ReadableStream) {
        const res22 = res2.clone();
        data = await res22.json();
      }
      const id_token = data?.id_token;
      if (isRefresh && !id_token) {
        return res2;
      }
      const jwks = await getJwks();
      const validation = await validateIdToken(id_token, {
        issuer: options.openid_configuration.issuer,
        client_id: options.client_info.client_id,
        jwks,
        openid_configuration: options.openid_configuration,
        nonce: isRefresh ? void 0 : userStore.get("pending_nonce")
      });
      if (isRefresh) {
        assertSameUserAsLogin(validation.claims, userStore.get("id_token_claims"));
      }
      assertExpectedUser(validation.claims, expectedClaims);
      userStore.set("id_token", id_token);
      userStore.set("id_token_claims", validation.claims);
      return res2;
    };
    const getJwks = async () => {
      if (!options.jwks) {
        const jwksClient = options.client.with(throwermw()).with(jsonmw());
        const response2 = await jwksClient.get(options.openid_configuration.jwks_uri);
        options.jwks = response2.data;
      }
      return options.jwks;
    };
    let oauth2client = options.client.with(options.issuer).with(storeIdToken);
    if (options.use_dpop) {
      const dpopOptions = {
        site: options.issuer,
        token_endpoint: options.openid_configuration.token_endpoint,
        dpop_signing_alg_values_supported: options.openid_configuration.dpop_signing_alg_values_supported
      };
      oauth2client = oauth2client.with(dpopmw(dpopOptions));
    }
    oauth2Options.client = oauth2client;
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
function accountFor(options) {
  return options.webid ?? options.login_hint;
}
function expectedClaimsFor(options) {
  if (options.webid) {
    return Object.assign({ webid: options.webid }, options.expected_claims);
  }
  return options.expected_claims || {};
}
function defaultScope(options) {
  const supported = options.openid_configuration?.scopes_supported;
  const solidIssuer = Array.isArray(supported) && supported.includes("webid");
  if (options.webid || solidIssuer) {
    return "openid webid";
  }
  return "openid";
}
function siteFor(issuer, account) {
  if (!account) {
    return issuer;
  }
  return issuer + "|" + account;
}
function assertExpectedUser(claims, expectedClaims) {
  for (const [name, expected] of Object.entries(expectedClaims)) {
    const actual = claimValue(claims, name);
    if (actual !== expected) {
      throw metroError("metro.oidcmw: id_token is for a different user: expected " + name + " " + expected + ", got " + actual);
    }
  }
}
async function grantTypeOf(req) {
  const body = await req.clone().text();
  return new URLSearchParams(body).get("grant_type");
}
function assertSameUserAsLogin(claims, loginClaims) {
  if (loginClaims && claims.sub !== loginClaims.sub) {
    throw metroError("metro.oidcmw: refreshed id_token is for a different user: expected sub " + loginClaims.sub + ", got " + claims.sub);
  }
}
function claimValue(claims, name) {
  if (name == "webid" && claims.webid === void 0) {
    return claims.sub;
  }
  return claims[name];
}
function isRedirected2() {
  return isRedirected();
}
function idToken(options) {
  if (!options.store) {
    if (!options.issuer) {
      throw metroError("Must supply options.issuer or options.store to get the id_token");
    }
    options.store = oidcStore(siteFor(options.issuer, accountFor(options)));
  }
  return options.store.get("id_token");
}
function idTokenClaims(options) {
  if (!options.store) {
    if (!options.issuer) {
      throw metroError("Must supply options.issuer or options.store to get the id_token claims");
    }
    options.store = oidcStore(siteFor(options.issuer, accountFor(options)));
  }
  return options.store.get("id_token_claims");
}

// node_modules/@muze-nl/metro-oidc/src/index.mjs
var oidc = {
  oidcmw,
  discover: oidcDiscovery,
  register,
  isRedirected: isRedirected2,
  idToken,
  idTokenClaims
};
var src_default7 = oidc;

// node_modules/@muze-nl/metro-oauth2/src/oauth2.discovery.mjs
var oauth2_discovery_exports = {};
__export(oauth2_discovery_exports, {
  default: () => makeClient
});
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
var validAuthMethods2 = [
  "client_secret_post",
  "client_secret_base",
  "client_secret_jwt",
  "private_key_jwt"
];
var oauth_authorization_server_metadata = {
  authorization_endpoint: Required2(validURL2),
  issuer: Required2(validURL2),
  response_types_supported: Required2(anyOf3("code", "token")),
  token_endpoint: Required2(validURL2),
  scopes_supported: Recommended2([]),
  code_challendge_methods_supported: Optional2([]),
  grant_types_supported: Optional2([]),
  introspection_endpoint: Optional2(validURL2),
  introspection_endpoint_auth_methods_supported: Optional2(validAuthMethods2),
  introspection_endpoint_auth_signing_alg_values_supported: Optional2(validAlgorithms),
  jwks_uri: Optional2(validURL2),
  op_policy_uri: Optional2(validURL2),
  op_tos_uri: Optional2(validURL2),
  registration_endpoint: Optional2(validURL2),
  response_modes_supported: Optional2([]),
  revocation_endpoint: Optional2(validURL2),
  revocation_endpoint_auth_methods_supported: Optional2(validAuthMethods2),
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
async function fetchWellknownOauthAuthorizationServer(issuer, client2) {
  let res = client2.get(url(issuer, ".wellknown/oauth_authorization_server"));
  if (!res.ok) {
    throw metroError("metro.oidcmw: Error while fetching " + issuer + ".wellknown/oauth_authorization_server", res);
  }
  assert2(res.headers.get("Content-Type"), /application\/json.*/);
  let configuration = await res.json();
  assert2(configuration, oauth_authorization_server_metadata);
  return configuration;
}

// node_modules/@muze-nl/metro-oauth2/src/oauth2.popup.mjs
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
    let message2;
    if (params.has("code")) {
      success = true;
      message2 = {
        authorization_code: params.get("code"),
        state: params.get("state"),
        iss: params.get("iss")
      };
    } else if (params.has("error")) {
      message2 = {
        error: params.get("error"),
        error_description: params.get("error_description"),
        state: params.get("state"),
        iss: params.get("iss")
      };
    } else {
      message2 = { error: "Could not find an authorization_code" };
    }
    parent.postMessage(message2, origin);
  }
  return success;
}
function authorizePopup(authorizationCodeURL, options = {}) {
  const url2 = new URL(authorizationCodeURL, window.location.href);
  const expectedState = url2.searchParams.get("state");
  const redirectUri = url2.searchParams.get("redirect_uri");
  const expectedOrigin = redirectUri ? new URL(redirectUri, window.location.href).origin : window.location.origin;
  return new Promise((resolve, reject) => {
    let settled = false;
    let closedWatcher = null;
    const cleanup = () => {
      settled = true;
      clearInterval(closedWatcher);
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
        resolve({
          authorization_code: event.data.authorization_code,
          state: event.data.state,
          iss: event.data.iss
        });
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
    if (!settled) {
      closedWatcher = setInterval(() => {
        if (popup.closed) {
          cleanup();
          reject("OAuth2 popup was closed");
        }
      }, POPUP_CLOSED_CHECK_MS);
    }
  });
}
var POPUP_CLOSED_CHECK_MS = 500;

// node_modules/@muze-nl/metro-oauth2/src/index.mjs
var oauth2 = Object.assign({}, oauth2_exports, {
  oauth2mw,
  discover: oauth2_discovery_exports,
  tokenstore: tokenStore,
  dpopmw,
  keysstore: keysStore,
  authorizePopup,
  popupHandleRedirect: handleRedirect
});

// node_modules/@muze-labs/jsfs-solid/src/metro.mjs
function createSolidMetroClient(input2, options = {}) {
  const providedClient = options.metroClient ?? options.metro ?? options.client;
  let metroClient = providedClient ?? input2;
  if (!(metroClient instanceof src_default5.Client)) {
    metroClient = src_default5.client(metroClient);
  }
  if (providedClient && options.configureMetro !== true) {
    return metroClient;
  }
  if (options.oidc !== false && src_default7?.oidcmw && typeof metroClient?.with === "function") {
    metroClient = metroClient.with(src_default7.oidcmw(options));
  }
  if (options.oldm !== false && typeof src_default6 === "function" && typeof metroClient?.with === "function") {
    metroClient = metroClient.with(src_default6(options));
  }
  return metroClient;
}

// src/storage/solid-notes-location.js
var DEFAULT_ROOT_FOLDER_NAME = "margin-notes";
var DEFAULT_PREFERENCES_FILENAME = "preferences.ttl";
var DEFAULT_CLIENT_NAME = "Margin Notes";
var LINKED_DATA_ACCEPT = "text/turtle, application/ld+json;q=0.9, */*;q=0.1";
var TURTLE = "text/turtle";
var SPARQL_UPDATE = "application/sparql-update";
var PREFERENCES_SUBJECT = "#margin-notes";
var prefixes2 = {
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
  const storageUrl2 = src_default2.one(profile?.storage, "first");
  if (!storageUrl2) {
    throw new Error(`No Solid storage root found in WebID profile: ${webId}`);
  }
  const issuer = profile?.issuer;
  const preferences = preferencesUrlForProfile({
    profile: profile?.profile,
    storageUrl: storageUrl2,
    options
  });
  const solid2 = options.solid || createStorageSolid({
    issuer,
    rootUrl: storageUrl2,
    options: storageOptions({ options, pageUrl })
  });
  const rootFolderUrl = await marginNotesRootFolder({
    solid: solid2,
    preferencesUrl: preferences.url,
    storageUrl: storageUrl2,
    rootFolderName: options.rootFolderName || DEFAULT_ROOT_FOLDER_NAME
  });
  const notesResourceUrl = await notesResourceUrlForPage({
    rootFolderUrl,
    pageUrl
  });
  return {
    webId,
    profile,
    issuer,
    storageUrl: storageUrl2,
    preferencesUrl: preferences.url,
    preferencesUrlSource: preferences.source,
    rootFolderUrl,
    pageUrl,
    resourceUrl: notesResourceUrl,
    solid: solid2
  };
}
function preferencesUrlForProfile({ profile, storageUrl: storageUrl2, options }) {
  if (options.preferencesUrl) {
    return {
      url: normalizeUrl(options.preferencesUrl, "preferencesUrl"),
      source: "configured"
    };
  }
  const context = src_default2.context({ prefixes: prefixes2 });
  context.addGraph(profile.graph);
  const profilePreferencesUrl = firstId(context.get(profile.id)?.pim$preferencesFile);
  if (profilePreferencesUrl) {
    return {
      url: profilePreferencesUrl,
      source: "profile"
    };
  }
  return {
    url: new URL(options.preferencesFilename || DEFAULT_PREFERENCES_FILENAME, ensureSlash4(storageUrl2)).href,
    source: "default"
  };
}
async function notesResourceUrlForPage({ rootFolderUrl, pageUrl } = {}) {
  const root = ensureSlash4(normalizeUrl(rootFolderUrl, "rootFolderUrl"));
  const page = currentPageUrl(pageUrl);
  return new URL(`page-${await sha256Hex(page)}.ttl`, root).href;
}
async function marginNotesRootFolder({ solid: solid2, preferencesUrl, storageUrl: storageUrl2, rootFolderName }) {
  const existing = await loadMarginNotesRootFolder({ solid: solid2, preferencesUrl });
  if (existing) return ensureSlash4(existing);
  const rootFolderUrl = new URL(`${encodePathSegment(rootFolderName)}/`, ensureSlash4(storageUrl2)).href;
  await saveDefaultMarginNotesRootFolder({ solid: solid2, preferencesUrl, rootFolderUrl });
  await ensureRootFolder({ solid: solid2, rootFolderUrl });
  return rootFolderUrl;
}
async function loadMarginNotesRootFolder({ solid: solid2, preferencesUrl }) {
  let graph3;
  try {
    graph3 = await solid2.get(preferencesUrl, {
      headers: { Accept: LINKED_DATA_ACCEPT }
    });
  } catch (error4) {
    if (isMissing(error4.cause)) return "";
    throw error4;
  }
  const context = src_default2.context({ prefixes: prefixes2 });
  context.addGraph(graph3);
  const subject = from(context.data).where((subject2) => firstId(subject2.mn$rootFolder))[0];
  return firstId(subject?.mn$rootFolder);
}
async function saveDefaultMarginNotesRootFolder({ solid: solid2, preferencesUrl, rootFolderUrl }) {
  const exists = await resourceExists({ solid: solid2, resourceUrl: preferencesUrl });
  if (!exists) {
    await solid2.put(preferencesUrl, {
      body: preferencesTurtle({ preferencesUrl, rootFolderUrl }),
      headers: { "Content-Type": TURTLE }
    });
    return;
  }
  await solid2.patch(preferencesUrl, {
    body: preferencesPatch({ preferencesUrl, rootFolderUrl }),
    headers: { "Content-Type": SPARQL_UPDATE }
  });
}
async function ensureRootFolder({ solid: solid2, rootFolderUrl }) {
  try {
    await solid2.createContainer(rootFolderUrl);
  } catch (error4) {
    if ([409, 412].includes(error4.cause?.status)) return;
    throw error4;
  }
}
async function resourceExists({ solid: solid2, resourceUrl }) {
  try {
    await solid2.head(resourceUrl);
    return true;
  } catch (error4) {
    if (isMissing(error4.cause)) return false;
    throw error4;
  }
}
function isMissing(response2) {
  return response2?.status === 404;
}
function preferencesTurtle({ preferencesUrl, rootFolderUrl }) {
  return `@prefix mn: <${prefixes2.mn}>.

<${preferencesSubject(preferencesUrl)}> a mn:Preferences;
  mn:rootFolder <${rootFolderUrl}>.
`;
}
function preferencesPatch({ preferencesUrl, rootFolderUrl }) {
  return `PREFIX mn: <${prefixes2.mn}>
INSERT DATA { <${preferencesSubject(preferencesUrl)}> a mn:Preferences; mn:rootFolder <${rootFolderUrl}>. }`;
}
function preferencesSubject(preferencesUrl) {
  return new URL(PREFERENCES_SUBJECT, preferencesUrl).href;
}
function createDiscoverySolid({ webId, options }) {
  const metroClient = createSolidMetroClient(webId, {
    ...storageOptions({ options, pageUrl: currentPageUrl(options.pageUrl) }),
    oidc: false,
    oldm: false,
    // solidApi owns the RDF middleware.
    configureMetro: true
  });
  return solidApi(metroClient);
}
function createStorageSolid({ issuer, rootUrl, options }) {
  const metroClient = createSolidMetroClient(rootUrl, {
    ...options,
    issuer,
    oidc: Boolean(issuer),
    oldm: false,
    // solidApi owns the RDF middleware.
    configureMetro: true
  });
  return solidApi(metroClient);
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
    authorize_callback: Optional(callable),
    force_authorization: Optional(Boolean),
    forceAuthorizationForWrites: Optional(Boolean),
    client_info: Optional(Object),
    solidOptions: Optional(Object)
  });
  if (optionIssues) {
    throw new TypeError(`Invalid Solid notes connection options: ${optionIssues[0].pathString} ${optionIssues[0].message}`);
  }
}
function callable(value, _root, path2) {
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
  const url2 = new URL(href);
  url2.hash = "";
  return url2.href;
}
function ensureSlash4(url2) {
  return String(url2).endsWith("/") ? String(url2) : `${url2}/`;
}
function firstId(value) {
  const item = src_default2.one(value, "first");
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

// src/features/paragraph-note-stacks.js
var paragraphNoteStacks = {
  transformers: {
    cobaltFragment(context, next) {
      context.value = { innerHTML: context.value == null ? "" : render(context.value) };
      return next(context);
    }
  },
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
      await notesApi.setupNotesStorage({
        app: this,
        storeKey
      });
      await this.actions.setTheme({
        theme: this.data.marginNotes.theme
      });
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
      await this.actions.installAnchorAffordances({ anchors });
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
        }).catch(() => {
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
          webId: initialWebId,
          interactive: false
        }).catch(() => {
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
      const service = await notesApi.ensureNotesService({ app: this });
      const annotation = notesApi.createAnnotationNote({
        anchorId,
        fragment,
        subjects: service.workspace.graph("notes").data,
        sequence: this.marginNotesRuntime.annotationIds
      });
      const storedAnnotation = await notesApi.createStoredAnnotation({
        app: this,
        annotation
      });
      const noteAnnotation = storedAnnotation || annotation;
      this.data.marginNotes.graph.push(noteAnnotation);
      anchor2.notes.push(notesApi.toRenderableNote({ annotation: noteAnnotation }));
      await this.actions.updateAnchorNoteState({ anchor: anchor2 });
      await this.actions.renderAnchorNotes({ anchor: anchor2 });
      await notesApi.syncNotesResource({ app: this });
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
      const annotation = this.marginNotesRuntime.notesService.data.notes.get(noteId);
      notesApi.updateAnnotationBody({ annotation, fragment });
      match.note.annotation = annotation;
      notesApi.syncRenderableNote({ note: match.note });
      await notesApi.saveStoredAnnotation({
        app: this,
        annotation: match.note.annotation
      });
      await this.actions.renderAnchorNotes({ anchor: match.anchor });
      await notesApi.syncNotesResource({ app: this });
    },
    async deleteNote({ noteId }) {
      const notesApi = this.api.notes;
      const match = notesApi.findNote({ app: this, noteId });
      if (!match) return;
      await notesApi.deleteStoredAnnotation({
        app: this,
        annotation: match.note.annotation
      });
      match.anchor.notes.splice(match.index, 1);
      notesApi.removeAnnotationFromGraph({
        app: this,
        annotationId: match.note.id
      });
      await this.actions.updateAnchorNoteState({ anchor: match.anchor });
      await this.actions.renderAnchorNotes({ anchor: match.anchor });
      await notesApi.syncNotesResource({ app: this });
    },
    async saveNotes() {
      const notesApi = this.api.notes;
      await notesApi.saveGraph({
        app: this,
        key: this.data.marginNotes.storeKey,
        subjects: this.data.marginNotes.graph
      });
    },
    async connectSolidStorage({ webId, interactive = true }) {
      const notesApi = this.api.notes;
      const config = this.marginNotesRuntime.solidConnectionConfig || {};
      let authorization;
      try {
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "connecting",
          webId,
          message: "Resolving Solid storage..."
        });
        notesApi.renderSolidConnectionStatus({ app: this });
        authorization = notesApi.prepareSolidAuthorization({ config, interactive });
        const connection = await notesApi.createSolidNotesConnection({
          ...config,
          ...authorization.options,
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
        const notesService = await notesApi.ensureNotesService({
          app: this,
          storeKey: this.data.marginNotes.storeKey
        });
        const solidClient = connection.solid || config.solid || config.solidForStore;
        if (!solidClient) {
          throw new Error("Solid connection did not provide a Solid API client for note sync");
        }
        await notesService.connect({
          solid: solidClient,
          resources: { notes: { url: connection.resourceUrl } }
        });
        notesApi.updateNotesPrefix({ app: this, service: notesService });
        const syncStatus = await notesService.sync("notes");
        if (syncStatus?.ok === false) {
          throw syncStatus.error || new Error(`Solid notes sync failed: ${syncStatus.status}`);
        }
        notesService.data.notes.refresh();
        this.marginNotesRuntime.solidConnection = connection;
        await this.actions.replaceNotesGraph({
          graph: notesApi.noteSubjects({ service: notesService })
        });
        notesApi.setSolidConnectionStatus({
          app: this,
          status: "connected",
          webId: connection.webId,
          storageUrl: connection.storageUrl,
          resourceUrl: connection.resourceUrl,
          message: `Connected to ${connection.storageUrl}`
        });
        notesApi.renderSolidConnectionStatus({ app: this });
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
      } finally {
        authorization?.close?.();
      }
    },
    async reloadNotesFromStore() {
      const notesApi = this.api.notes;
      const graph3 = await notesApi.loadGraph({
        app: this,
        key: this.data.marginNotes.storeKey,
        throwOnError: true
      });
      await this.actions.replaceNotesGraph({ graph: graph3 });
    },
    async replaceNotesGraph({ graph: graph3 }) {
      const notesApi = this.api.notes;
      this.data.marginNotes.graph = graph3;
      const notesByAnchor = notesApi.groupNotesByAnchor({
        notes: graph3
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
    async expandInlineNote({ source: source2 }) {
      const item = source2?.closest?.(".margin-notes-target-note");
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
    async closeInlineNote({ source: source2 }) {
      const item = source2?.closest?.(".margin-notes-target-note");
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
        return this.noteSubjects({ service: app2.marginNotesRuntime.notesService }).filter((annotation) => this.annotationAnchorId({ annotation }) === anchorId);
      },
      hostElement(value) {
        return value?.element || value || null;
      },
      prepareSolidAuthorization({ config, interactive = true }) {
        if (config.solid || config.discoverySolid || config.authorize_callback || config.usePopupAuth === false) return {};
        let popup = null;
        if (interactive) {
          popup = this.openSolidAuthPopup();
        }
        return {
          options: {
            authorize_callback: (authorizationCodeURL) => {
              if (!interactive) {
                throw new Error("Sign-in required. Click Connect to continue.");
              }
              return this.authorizeSolidPopup({ authorizationCodeURL, popup });
            }
          },
          close() {
            popup?.close();
            popup = null;
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
      setSolidConnectionStatus({ app: app2, status: status2, message: message2, webId, storageUrl: storageUrl2, resourceUrl }) {
        app2.data.marginNotes.solidConnection = {
          ...app2.data.marginNotes.solidConnection,
          status: status2,
          message: message2,
          webId: webId ?? app2.data.marginNotes.solidConnection.webId,
          storageUrl: storageUrl2 ?? app2.data.marginNotes.solidConnection.storageUrl,
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
      async setupNotesStorage({ app: app2, storeKey }) {
        return this.ensureNotesService({ app: app2, storeKey });
      },
      async ensureNotesService({ app: app2, storeKey = app2.data.marginNotes.storeKey }) {
        if (app2.marginNotesRuntime.notesService) {
          return app2.marginNotesRuntime.notesService;
        }
        const store = app2.marginNotesRuntime.store;
        const prefixes3 = {
          ...this.vocabulary.prefixes
        };
        app2.marginNotesRuntime.notesPrefixes = prefixes3;
        const local2 = store ? graph.resource({
          id: "notes:local",
          url: `urn:margin-notes:store:${encodeURIComponent(storeKey)}`,
          local: true,
          prefixes: prefixes3,
          async load() {
            return await store.load({ key: storeKey }) ?? "";
          },
          async save(turtle) {
            return store.save({ key: storeKey, value: turtle });
          }
        }) : {
          indexedDB: "margin-notes-workspace",
          store: "resources",
          key: storeKey,
          prefixes: prefixes3
        };
        const service = app2.marginNotesRuntime.simplySolid({
          localFirst: true,
          app: { slug: "margin-notes" },
          data: {
            notes: {
              kind: "resource",
              baseURI: this.currentDocumentIri({}),
              prefixes: prefixes3,
              ...this.replicaPolicy,
              local: local2
            }
          }
        });
        await service.open();
        app2.marginNotesRuntime.notesService = service;
        this.updateNotesPrefix({ app: app2, service });
        return service;
      },
      updateNotesPrefix({ app: app2, service }) {
        const data = service.workspace.graph("notes");
        const sequence = app2.marginNotesRuntime.annotationIds;
        this.restoreAnnotationSequence({ subjects: data.data, sequence });
        if (sequence.code) {
          const prefix = `${this.currentDocumentIri({})}#margin-note-${sequence.code}-`;
          if (app2.marginNotesRuntime.notesPrefixes) {
            app2.marginNotesRuntime.notesPrefixes.note = prefix;
          }
        }
      },
      noteSubjects({ service }) {
        return service.data.notes.list().filter((value) => this.isMarginNoteAnnotation({ value }));
      },
      async loadGraph({ app: app2, key }) {
        const service = await this.ensureNotesService({ app: app2, storeKey: key });
        return this.noteSubjects({ service });
      },
      async saveGraph({ app: app2, key }) {
        const service = await this.ensureNotesService({ app: app2, storeKey: key });
        await service.data.notes.saveAll();
        await this.syncNotesResource({ app: app2 });
        return true;
      },
      async createStoredAnnotation({ app: app2, annotation }) {
        const notesService = await this.ensureNotesService({ app: app2 });
        this.updateNotesPrefix({ app: app2, service: notesService });
        return notesService.data.notes.create(annotation);
      },
      async saveStoredAnnotation({ app: app2, annotation }) {
        const notesService = await this.ensureNotesService({ app: app2 });
        return notesService.data.notes.save(annotation.id);
      },
      async deleteStoredAnnotation({ app: app2, annotation }) {
        const notesService = await this.ensureNotesService({ app: app2 });
        return notesService.data.notes.delete(annotation.id);
      },
      async syncNotesResource({ app: app2 }) {
        const notesService = app2.marginNotesRuntime.notesService;
        const resource2 = notesService?.status.resources.notes;
        if (!resource2?.remote) {
          return null;
        }
        const status2 = await notesService.sync("notes");
        await app2.actions.replaceNotesGraph({
          graph: this.noteSubjects({ service: notesService })
        });
        if (status2?.ok === false) {
          this.setSolidConnectionStatus({
            app: app2,
            status: "sync-pending",
            message: `Saved on this device. Solid sync pending: ${status2.error?.message || status2.status}`
          });
          this.renderSolidConnectionStatus({ app: app2 });
        } else if (status2?.status !== "sync-pending" && app2.marginNotesRuntime.solidConnection) {
          this.setSolidConnectionStatus({ app: app2, status: "connected", message: `Connected to ${app2.marginNotesRuntime.solidConnection.storageUrl}` });
          this.renderSolidConnectionStatus({ app: app2 });
        }
        return status2;
      },
      groupNotesByAnchor({ notes }) {
        return notes.reduce((grouped, note) => {
          const anchorId = this.annotationAnchorId({ annotation: note });
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
      noteFromElement({ app: app2, source: source2 }) {
        const element2 = source2?.closest?.("[data-simply-value-path]");
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
  return config?.storeKey || `margin-notes-${namespace}`;
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

// src/component.js
function mount(config) {
  validateHostConfig(config);
  const mountContainer = config.container.element;
  const storeKey = storeKeyFromConfig(config);
  const store = config.store;
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
      annotationIds: {},
      hostAnchors: config.anchors,
      store,
      expandedStackBackground: config.expandedStackBackground || "#fffefb",
      anchorAffordances: [],
      resizeObserver: null,
      syncTimers: /* @__PURE__ */ new Map(),
      solidConnectionConfig: config.solidConnection || null,
      solidConnectionElement: null,
      solidConnectionCleanup: null,
      notesService: config.notesService || null,
      notesPrefixes: null,
      simplySolid,
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

// src/storage/solid-resource-store.js
var DEFAULT_CONTENT_TYPE = "text/turtle";
function createSolidResourceStore(options = {}) {
  assertOptions(options);
  const defaultResourceUrl = options.resourceUrl || "";
  const accept = DEFAULT_CONTENT_TYPE;
  const contentType = DEFAULT_CONTENT_TYPE;
  const providedSolid = options.solid || null;
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
      const solid2 = solidFor(resourceUrl);
      const response2 = await callResource(() => solid2.get(resourceUrl, {
        headers: { Accept: accept }
      }));
      if (isMissing2(response2)) return null;
      if (response2 instanceof src_default2.Graph) {
        return response2.write();
      }
      await ensureOk({ response: response2, operation: "load" });
      if (!/^text\/turtle\b/.test(response2.headers.get("Content-Type") || "")) {
        throw new TypeError("Solid resource store expects text/turtle");
      }
      return response2.text();
    },
    async save({ key, value } = {}) {
      const resourceUrl = resourceUrlFrom({ key, defaultResourceUrl });
      const solid2 = solidFor(resourceUrl, { writesBody: true });
      if (typeof value !== "string") {
        throw new TypeError("Solid resource store expects Turtle text");
      }
      const response2 = await callResource(() => solid2.put(resourceUrl, {
        body: value,
        headers: { "Content-Type": contentType }
      }));
      await ensureOk({ response: response2, operation: "save" });
      return {
        key: resourceUrl,
        resourceUrl,
        status: response2.status
      };
    },
    async remove({ key } = {}) {
      const resourceUrl = resourceUrlFrom({ key, defaultResourceUrl });
      const solid2 = solidFor(resourceUrl, { needsAuthorization: true });
      const response2 = await callResource(() => solid2.delete(resourceUrl));
      if (isMissing2(response2) || response2.status === 410) {
        return {
          key: resourceUrl,
          resourceUrl,
          status: response2.status
        };
      }
      await ensureOk({ response: response2, operation: "remove" });
      return {
        key: resourceUrl,
        resourceUrl,
        status: response2.status
      };
    }
  };
}
function assertOptions(options) {
  const optionIssues = issues(options, {
    resourceUrl: Optional(String),
    rootUrl: Optional(String),
    storageUrl: Optional(String),
    force_authorization: Optional(Boolean),
    forceAuthorizationForWrites: Optional(Boolean)
  });
  if (optionIssues) {
    throw new TypeError(`Invalid Solid resource store options: ${optionIssues[0].pathString} ${optionIssues[0].message}`);
  }
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
    assertSolidClient2(providedSolid);
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
  const solid2 = solidApi(metroClient);
  generatedClient.clients.set(cacheKey, solid2);
  return solid2;
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
function assertSolidClient2(solid2) {
  const clientIssues = issues(solid2, {
    get: callable2,
    put: callable2,
    delete: callable2
  });
  if (clientIssues) {
    throw new TypeError("Solid resource store requires a Solid API client with get/put/delete");
  }
}
function callable2(value, _root, path2) {
  if (typeof value !== "function") {
    return error("data is not a function", value, "function", path2);
  }
  return false;
}
async function callResource(operation) {
  try {
    return await operation();
  } catch (error4) {
    if (isMissing2(error4?.cause)) {
      return error4.cause;
    }
    throw error4;
  }
}
function isMissing2(response2) {
  return response2?.status === 404;
}
async function ensureOk({ response: response2, operation }) {
  if (response2.ok) return;
  const body = await responseText(response2).catch(() => "");
  const detail = body.trim() ? `: ${body.trim()}` : "";
  throw new Error(`Solid resource ${operation} failed (${response2.status} ${response2.statusText})${detail}`);
}
async function responseText(response2) {
  return response2.text();
}

// src/index.js
var MarginNotesAPI = {
  mount(config) {
    return mount(config);
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
  MarginNotesAPI,
  createSolidNotesConnection,
  createSolidResourceStore,
  mount,
  notesResourceUrlForPage,
  handleRedirect as popupHandleRedirect
};
//# sourceMappingURL=index.js.map
