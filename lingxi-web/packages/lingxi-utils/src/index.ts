export function noop() {}

export function isBlank(value?: string | null) {
  return !value || value.trim().length === 0;
}