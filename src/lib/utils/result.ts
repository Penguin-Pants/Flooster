/**
 * Helpers for the `Result` values returned by the generated command wrappers
 * in `bindings.ts`. Those wrappers resolve with `{ status: "error", error }`
 * instead of throwing, so an `await` on its own never reaches a `catch`.
 */

/** Throws when `result` is a command `Result` with `status === "error"`. */
export const expectOk = (result: unknown): void => {
  if (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    (result as { status: unknown }).status === "error"
  ) {
    const error = (result as { error?: unknown }).error;
    throw new Error(typeof error === "string" ? error : String(error));
  }
};

/** Message text for a caught value, for logs and toasts. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
