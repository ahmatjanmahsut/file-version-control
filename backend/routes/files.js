const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db')
const config = require('../config')
const { verifyToken, requireAdmin } = require('../middleware')
const router = express.Router()

// 确保上传目录存在
if (!fs.existsSync(config.uploads.directory)) {
  fs.mkdirSync(config.uploads.directory, { recursive: true })
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.directory)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

const upload = multer({ storage })

// 获取文件列表
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.id, f.name, f.type, f.size, f.version, u.username as uploader, f.createdAt, f.updatedAt
      FROM Files f
      JOIN Users u ON f.uploaderId = u.id
      ORDER BY f.updatedAt DESC
    `)
    res.json(result.recordset)
  } catch (error) {
    console.error('获取文件列表失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取文件详情
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await db.query(`
      SELECT f.id, f.name, f.type, f.size, f.version, u.username as uploader, f.createdAt, f.updatedAt
      FROM Files f
      JOIN Users u ON f.uploaderId = u.id
      WHERE f.id = @param1
    `, [id])
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: '文件不存在' })
    }
    res.json(result.recordset[0])
  } catch (error) {
    console.error('获取文件详情失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 上传文件
router.post('/upload', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
  const file = req.file
  const { originalname, mimetype, size, filename } = file
  const uploaderId = req.user.id

  try {
    // 检查文件是否已存在
    const existingFile = await db.query('SELECT * FROM Files WHERE name = @param1', [originalname])
    
    if (existingFile.recordset.length > 0) {
      // 更新现有文件版本
      const currentFile = existingFile.recordset[0]
      const newVersion = currentFile.version + 1
      
      // 保存旧版本记录
      await db.query(
        'INSERT INTO FileVersions (fileId, version, path, uploaderId) VALUES (@param1, @param2, @param3, @param4)',
        [currentFile.id, currentFile.version, currentFile.path, uploaderId]
      )
      
      // 更新文件信息
      await db.query(
        'UPDATE Files SET path = @param1, size = @param2, version = @param3, updatedAt = GETDATE() WHERE id = @param4',
        [filename, size, newVersion, currentFile.id]
      )
      
      res.json({ message: '文件版本更新成功', version: newVersion })
    } else {
      // 创建新文件
      await db.query(
        'INSERT INTO Files (name, type, size, path, uploaderId) VALUES (@param1, @param2, @param3, @param4, @param5)',
        [originalname, mimetype, size, filename, uploaderId]
      )
      
      res.json({ message: '文件上传成功' })
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 下载文件
router.get('/:id/download', verifyToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await db.query('SELECT * FROM Files WHERE id = @param1', [id])
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: '文件不存在' })
    }
    const file = result.recordset[0]
    const filePath = path.join(config.uploads.directory, file.path)
    res.download(filePath, file.name)
  } catch (error) {
    console.error('下载文件失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 预览文件
router.get('/:id/preview', verifyToken, async (req, res) => {
  const { id } = req.params
  const { version } = req.query
  try {
    let filePath
    if (version) {
      // 获取指定版本的文件
      const versionResult = await db.query(
        'SELECT * FROM FileVersions WHERE fileId = @param1 AND version = @param2',
        [id, version]
      )
      if (versionResult.recordset.length === 0) {
        return res.status(404).json({ message: '版本不存在' })
      }
      filePath = path.join(config.uploads.directory, versionResult.recordset[0].path)
    } else {
      // 获取最新版本的文件
      const result = await db.query('SELECT * FROM Files WHERE id = @param1', [id])
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: '文件不存在' })
      }
      filePath = path.join(config.uploads.directory, result.recordset[0].path)
    }
    res.sendFile(filePath)
  } catch (error) {
    console.error('预览文件失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 获取文件版本历史
router.get('/:id/versions', verifyToken, async (req, res) => {
  const { id } = req.params
  try {
    const result = await db.query(`
      SELECT v.id, v.version, v.createdAt, u.username as uploader
      FROM FileVersions v
      JOIN Users u ON v.uploaderId = u.id
      WHERE v.fileId = @param1
      ORDER BY v.version DESC
    `, [id])
    res.json(result.recordset)
  } catch (error) {
    console.error('获取版本历史失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 删除文件
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params
  try {
    // 删除文件版本记录
    await db.query('DELETE FROM FileVersions WHERE fileId = @param1', [id])
    // 删除文件记录
    await db.query('DELETE FROM Files WHERE id = @param1', [id])
    res.json({ message: '文件删除成功' })
  } catch (error) {
    console.error('删除文件失败:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router