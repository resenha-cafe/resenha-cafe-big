/**
 * @deprecated Use import { canonicalJson } from "./utils/index.js"
 */
export function stableStringify(obj) {
  if (globalThis.__DEV__) {
    console.warn("stableStringify is deprecated. Use canonicalJson instead.");
  }
  return ModernUtils.canonicalJson(obj);
}

/**
 * @deprecated Use import { deepFreeze } from "./utils/index.js"
 */
export function freezeDeep(obj) {
  if (globalThis.__DEV__) {
    console.warn("freezeDeep is deprecated. Use deepFreeze instead.");
  }
  return ModernUtils.deepFreeze(obj);
}

/**
 * @deprecated Use import { identityHash } from "./utils/index.js"
 */
export function fastHash(str) {
  if (globalThis.__DEV__) {
    console.warn("fastHash is deprecated. Use identityHash instead.");
  }
  return ModernUtils.identityHash(str);
}