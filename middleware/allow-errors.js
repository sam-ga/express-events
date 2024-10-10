const allowErrors = (req, res, next) => {
  res.locals.errors = {}
  res.locals.fieldValues = {}
  next()
}

module.exports = allowErrors