const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')
const config = require('../config')
const router = express.Router()

// 注册路由
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  try {
    // 检查用户名是否已存在
    const usernameCheck = await db.query('SELECT * FROM Users WHERE username = @param1', [username])
    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 检查邮箱是否已存在
    const emailCheck = await db.query('SELECT * FROM Users WHERE email = @param1', [email])
    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    await db.query(
      'INSERT INTO Users (username, email, password) VALUES (@param1, @param2, @param3)',
      [username, email, hashedPassword]
    )

    res.status(201).json({ message: '注册成功' })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 登录路由
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  try {
    // 查找用户
    const result = await db.query('SELECT * FROM Users WHERE username = @param1', [username])
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const user = result.recordset[0]

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router