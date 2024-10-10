const bcrypt = require('bcryptjs')

module.exports = [
  {
    username: 'admin',
    password: bcrypt.hashSync('pass', 10)
  },
  {
    username: 'sam',
    password: bcrypt.hashSync('pass', 10)
  },
  {
    username: 'iury',
    password: bcrypt.hashSync('pass', 10)
  },
]