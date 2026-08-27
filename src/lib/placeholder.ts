/**
 * Copy the client has not supplied yet is carried as a [[TOKEN]] in content/de.ts
 * and stays visible on the page so it cannot be shipped by accident.
 */
export function isPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && /^\[\[[A-Z0-9_]+\]\]$/.test(value.trim());
}

/** True for any string still containing a token, e.g. inside a sentence. */
export function containsPlaceholder(value: string | null | undefined): boolean {
  return typeof value === "string" && /\[\[[A-Z0-9_]+\]\]/.test(value);
}
