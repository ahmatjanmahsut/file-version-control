require('dotenv').config()

module.exports = {
  port: process.env.PORT || 8000,
  database: {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'FileVersionControl',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'your_password',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    expiresIn: '1h'
  },
  uploads: {
    directory: './uploads'
  }
}