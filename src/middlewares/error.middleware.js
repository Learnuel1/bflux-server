exports.notFound = (_req, res, _next) =>{
  const err = new Error("Route Not Found");
  err.status = 404;
  res.status(err.status).json({error: err.message});
};

exports.errorHandler = (err, _req, res, _next) =>{
  if(err.error){
    return res.status(err.status || 404).json({error: err.message})
  }
  res.status(err.status || 500).json({error: err.message || "Unknown error occurred"})
}