const express = require('express')
const bcrypt = require('bcrypt')
const db = require('../db')
const { verifyToken, requireAdmin } = require('../middleware')
const router = express.Router()

// 获取所有用户
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email, role, createdAt, updatedAt FROM Users ORDER BY id')
    res.json(result.recordset)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 创建用户
router.post('/users', verifyToken, requireAdmin, async (req, res) => {
  const { username, email, password, role } = req.body

  try {
    const usernameCheck = await db.query('SELECT * FROM Users WHERE username = @param1', [username])
    if (usernameCheck.recordset.length > 0) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    const emailCheck = await db.query('SELECT * FROM Users WHERE email = @param1', [email])
    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.query(
      'INSERT INTO Users (username, email, password, role) VALUES (@param1, @param2, @param3, @param4)',
      [username, email, hashedPassword, role || 'user']
    )

    res.status(201).json({ message: '用户创建成功' })
  } catch (error) {
    console.error('创建用户失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 删除用户
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params

  try {
    const userCheck = await db.query('SELECT * FROM Users WHERE id = @param1', [id])
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (userCheck.recordset[0].role === 'admin') {
      return res.status(400).json({ message: '不能删除管理员账户' })
    }

    await db.query('DELETE FROM Users WHERE id = @param1', [id])
    res.json({ message: '用户删除成功' })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 更新用户
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  const { username, email, role } = req.body

  try {
    await db.query(
      'UPDATE Users SET username = @param1, email = @param2, role = @param3, updatedAt = GETDATE() WHERE id = @param4',
      [username, email, role, id]
    )
    res.json({ message: '用户更新成功' })
  } catch (error) {
    console.error('更新用户失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
