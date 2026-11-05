// Runs inside the QuickJS sandbox before the user's script. It builds the `apidocs` object and keeps every result in __apidocsState.
// It calls no host function, so a script can reach only what is defined here.
export const preludeSource = `
(function () {
  var input = JSON.parse(__apidocsInput);
  var state = { logs: [], logsTruncated: false, checks: [], writes: [], removals: [], request: null };
  globalThis.__apidocsState = state;
  var environment = input.variables.environment;
  var globals = input.variables.globals;
  var phase = input.phase;
  var requestState = input.request;

  function text(value) {
    if (typeof value === 'string') return value;
    try {
      var json = JSON.stringify(value);
      return json === undefined ? String(value) : json;
    } catch (error) {
      return String(value);
    }
  }
  function show(value) {
    return text(value).slice(0, 200);
  }
  function messageOf(error) {
    return error && error.message ? String(error.message) : String(error);
  }
  function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  var vars = {
    get: function (name) {
      name = String(name);
      if (has(environment, name)) return environment[name];
      if (has(globals, name)) return globals[name];
      return undefined;
    },
    has: function (name) {
      name = String(name);
      return has(environment, name) || has(globals, name);
    },
    set: function (name, value, options) {
      name = String(name);
      if (value === undefined) throw new Error('apidocs.vars.set needs a value.');
      var scope = options && options.scope === 'global' ? 'global' : 'environment';
      var stored = String(value);
      if (scope === 'global') globals[name] = stored;
      else environment[name] = stored;
      state.writes.push({ scope: scope, name: name, value: stored });
    },
    remove: function (name, options) {
      name = String(name);
      var scope = options && options.scope === 'global' ? 'global' : 'environment';
      if (scope === 'global') delete globals[name];
      else delete environment[name];
      state.removals.push({ scope: scope, name: name });
    }
  };

  function ensurePre() {
    if (phase !== 'pre') throw new Error('apidocs.req can only be changed in a pre-request script.');
  }
  var req = {
    get url() { return requestState.url; },
    set url(value) { ensurePre(); requestState.url = String(value); },
    get method() { return requestState.method; },
    set method(value) { ensurePre(); requestState.method = String(value).toUpperCase(); },
    setHeader: function (name, value) {
      ensurePre();
      var wanted = String(name).toLowerCase();
      requestState.headers = requestState.headers.filter(function (header) {
        return header.name.toLowerCase() !== wanted;
      });
      requestState.headers.push({ name: String(name), value: String(value) });
    },
    dropHeader: function (name) {
      ensurePre();
      var wanted = String(name).toLowerCase();
      requestState.headers = requestState.headers.filter(function (header) {
        return header.name.toLowerCase() !== wanted;
      });
    }
  };

  var resObject = null;
  if (phase === 'post') {
    var response = input.response;
    resObject = {
      status: response.status,
      elapsed: response.elapsedMs,
      header: function (name) {
        var wanted = String(name).toLowerCase();
        var keys = Object.keys(response.headers);
        for (var i = 0; i < keys.length; i++) {
          if (keys[i].toLowerCase() === wanted) return response.headers[keys[i]];
        }
        return undefined;
      },
      text: function () {
        return response.body;
      },
      data: function () {
        try {
          return JSON.parse(response.body);
        } catch (error) {
          throw new Error('The response body is not valid JSON.');
        }
      }
    };
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    var keysA = Object.keys(a);
    var keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (var i = 0; i < keysA.length; i++) {
      if (!has(b, keysA[i]) || !deepEqual(a[keysA[i]], b[keysA[i]])) return false;
    }
    return true;
  }
  function assertion(value) {
    return {
      equals: function (expected) {
        if (!deepEqual(value, expected)) throw new Error('Expected ' + show(value) + ' to equal ' + show(expected));
      },
      isTrue: function () {
        if (value !== true) throw new Error('Expected ' + show(value) + ' to be true');
      },
      isFalse: function () {
        if (value !== false) throw new Error('Expected ' + show(value) + ' to be false');
      },
      includes: function (item) {
        var found = false;
        if (typeof value === 'string') found = value.indexOf(String(item)) !== -1;
        else if (Array.isArray(value)) found = value.some(function (entry) { return deepEqual(entry, item); });
        if (!found) throw new Error('Expected ' + show(value) + ' to include ' + show(item));
      },
      below: function (limit) {
        if (!(value < limit)) throw new Error('Expected ' + show(value) + ' to be below ' + show(limit));
      },
      above: function (limit) {
        if (!(value > limit)) throw new Error('Expected ' + show(value) + ' to be above ' + show(limit));
      },
      hasKey: function (key) {
        if (value === null || typeof value !== 'object' || !has(value, key)) {
          throw new Error('Expected ' + show(value) + ' to have key ' + show(key));
        }
      }
    };
  }

  function check(name, fn) {
    var label = String(name);
    try {
      fn();
      state.checks.push({ name: label, passed: true });
    } catch (error) {
      state.checks.push({ name: label, passed: false, message: messageOf(error) });
    }
  }

  function log() {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) parts.push(text(arguments[i]));
    if (state.logs.length >= input.maxLogLines) {
      state.logsTruncated = true;
      return;
    }
    state.logs.push(parts.join(' '));
  }

  function send() {
    throw new Error('apidocs.send is not supported in this version.');
  }

  var apidocs = { vars: vars, req: req, check: check, assert: assertion, log: log, send: send };
  Object.defineProperty(apidocs, 'res', {
    enumerable: true,
    get: function () {
      if (!resObject) throw new Error('apidocs.res is only available in a post-response script.');
      return resObject;
    }
  });
  globalThis.apidocs = apidocs;
  if (phase === 'pre') state.request = requestState;
})();
`
