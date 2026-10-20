export function notFound(req, res) {
  res.status(404).json({ error: { message: "Route not found", details: [] } });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error" : err.message,
      details: err.details || [],
    },
  });
}
