const jwt = require('jsonwebtoken')
const config = require('./config')

// 验证JWT令牌
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' })
  }
}

// 管理员权限检查
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' })
  }
  next()
}

module.exports = {
  verifyToken,
  requireAdmin
}