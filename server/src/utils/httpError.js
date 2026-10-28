// Create an error the central error handler turns into a proper JSON response.
export function httpError(status, message, details = []) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}
