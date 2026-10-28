export function validate(schemas = {}) {
  return (req, res, next) => {
    const validated = {};
    const details = [];

    for (const key of ["body", "query", "params"]) {
      if (!schemas[key]) continue;

      const result = schemas[key].safeParse(req[key]);
      if (result.success) {
        validated[key] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({
            path: [key, ...issue.path].join("."),
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) {
      const err = new Error("Validation failed");
      err.status = 400;
      err.details = details;
      return next(err);
    }

    req.validated = validated;
    next();
  };
}
