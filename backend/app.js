const express = require('express')
const cors = require('cors')
const config = require('./config')
const db = require('./db')
const authRoutes = require('./routes/auth')
const fileRoutes = require('./routes/files')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/files', fileRoutes)

// 启动服务器
const startServer = async () => {
  try {
    // 连接数据库
    await db.connect()
    
    // 启动服务器
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`)
    })
  } catch (error) {
    console.error('启动服务器失败:', error)
    process.exit(1)
  }
}

startServer()