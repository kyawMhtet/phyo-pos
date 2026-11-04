export type FieldErrors = Record<string, string>;

// What a server action reports back: `fieldErrors` are keyed by input id and shown
// under that input, `error` is for problems no single field can fix.
export type FormResult = { fieldErrors?: FieldErrors; error?: string };

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
