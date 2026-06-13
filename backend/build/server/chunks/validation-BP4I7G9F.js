const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function toNonEmptyString(value) {
  return typeof value === "string" ? value.trim() : "";
}
function toInteger(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && /^-?\d+$/.test(value.trim())) {
    return Number(value);
  }
  return NaN;
}
function isValidEmail(value) {
  return EMAIL_REGEX.test(toNonEmptyString(value).toLowerCase());
}
function parseIsoDate(value) {
  const text = toNonEmptyString(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}
function differenceInDays(start, end) {
  return Math.floor((end.getTime() - start.getTime()) / 864e5);
}
function normalizeRoomLookup(value) {
  const str = toNonEmptyString(value).toLowerCase();
  if (!str) return null;
  if (/^\d+$/.test(str)) {
    return { kind: "id", value: Number(str) };
  }
  return { kind: "code", value: str };
}

export { toInteger as a, differenceInDays as d, isValidEmail as i, normalizeRoomLookup as n, parseIsoDate as p, toNonEmptyString as t };
//# sourceMappingURL=validation-BP4I7G9F.js.map
