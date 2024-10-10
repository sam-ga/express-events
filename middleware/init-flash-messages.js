const initFlashMessages = (req, res, next) => {
  res.locals.message = req.session.message
  res.locals.errorMessage = req.session.errorMessage
  req.session.message = null
  req.session.errorMessage = null
  req.session.save(() => {
    next()
  })
}

module.exports = initFlashMessages