export function now() {
  return Date.now();
}

export function iso() {
  return new Date().toISOString();
}

export function formatDuration(ms) {
  if (ms < 0) ms = 0;
  if (ms < 1) return "0ms";
  if (ms < 1000) return Math.round(ms) + "ms";
  var seconds = ms / 1000;
  if (seconds < 60) return seconds.toFixed(1) + "s";
  var minutes = Math.floor(seconds / 60);
  var remainingSeconds = Math.round(seconds % 60);
  if (remainingSeconds === 0) return minutes + "m";
  return minutes + "m " + remainingSeconds + "s";
}

export function isValidDate(date) {
  if (date === null || date === undefined || date === "") return false;
  var parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

export function extractYear(date) {
  if (date === null || date === undefined || date === "") return null;
  if (typeof date === "number") {
    return (date >= 1000 && date <= 9999) ? date : null;
  }
  if (typeof date === "string" && /^\d{4}$/.test(date)) {
    var year = parseInt(date, 10);
    return (year >= 1000 && year <= 9999) ? year : null;
  }
  var parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  var year = parsed.getFullYear();
  return (year >= 1000 && year <= 9999) ? year : null;
}

export function today() {
  return new Date().toISOString().split("T")[0];
}