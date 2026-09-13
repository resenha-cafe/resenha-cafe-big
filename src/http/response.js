/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * HTTP — Response Helpers (Funções Puras)
 * ============================================================
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

export function ok(data, headers = {}) {
  return json({ success: true, ...data }, 200, headers);
}

export function created(data, headers = {}) {
  return json({ success: true, ...data }, 201, headers);
}

export function noContent(headers = {}) {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, ...headers },
  });
}

export function validationError(message, errors = [], headers = {}) {
  return json({ success: false, error: message, errors }, 400, headers);
}

export function unauthorized(message = "Unauthorized", headers = {}) {
  return json({ success: false, error: message }, 401, headers);
}

export function forbidden(message = "Forbidden", headers = {}) {
  return json({ success: false, error: message }, 403, headers);
}

export function notFound(message = "Not Found", headers = {}) {
  return json({ success: false, error: message }, 404, headers);
}

export function conflict(message = "Conflict", headers = {}) {
  return json({ success: false, error: message }, 409, headers);
}

export function tooManyRequests(message = "Too Many Requests", headers = {}) {
  return json({ success: false, error: message }, 429, {
    "Retry-After": "60",
    ...CORS_HEADERS,
    ...headers,
  });
}

export function internalError(message = "Internal Server Error", stack = null, headers = {}) {
  const data = { success: false, error: message };
  if (stack && globalThis.__DEV__) {
    data.stack = stack;
  }
  return json(data, 500, headers);
}

export function methodNotAllowed(message = "Method Not Allowed", headers = {}) {
  return json({ success: false, error: message }, 405, headers);
}

export function timeout(message = "Request Timeout", headers = {}) {
  return json({ success: false, error: message }, 408, headers);
}

export function preflight(headers = {}) {
  return new Response(null, {
    status: 204,
    headers: { ...CORS_HEADERS, ...headers },
  });
}

export default {
  json,
  ok,
  created,
  noContent,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  methodNotAllowed,
  timeout,
  preflight,
};
export const ResponseFactory = {
  ok,
  created,
  noContent,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  methodNotAllowed,
  timeout,
  preflight,
};