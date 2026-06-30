/**
 * Serialize DB results: converts Date objects to ISO strings so Zod schemas
 * (generated from OpenAPI which uses string for dates) can parse them.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
