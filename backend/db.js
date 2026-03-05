const sql = require('mssql')
const config = require('./config')

class Database {
  constructor() {
    this.pool = null
  }

  async connect() {
    try {
      this.pool = await sql.connect(config.database)
      console.log('数据库连接成功')
      await this.createTables()
    } catch (error) {
      console.error('数据库连接失败:', error)
      throw error
    }
  }

  async createTables() {
    try {
      // 创建用户表
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
        CREATE TABLE Users (
          id INT PRIMARY KEY IDENTITY(1,1),
          username NVARCHAR(50) UNIQUE NOT NULL,
          email NVARCHAR(100) UNIQUE NOT NULL,
          password NVARCHAR(100) NOT NULL,
          role NVARCHAR(20) DEFAULT 'user',
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE()
        )
      `)

      // 创建文件表
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Files' AND xtype='U')
        CREATE TABLE Files (
          id INT PRIMARY KEY IDENTITY(1,1),
          name NVARCHAR(255) NOT NULL,
          type NVARCHAR(50) NOT NULL,
          size BIGINT NOT NULL,
          path NVARCHAR(255) NOT NULL,
          version INT DEFAULT 1,
          uploaderId INT NOT NULL,
          createdAt DATETIME DEFAULT GETDATE(),
          updatedAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (uploaderId) REFERENCES Users(id)
        )
      `)

      // 创建文件版本表
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FileVersions' AND xtype='U')
        CREATE TABLE FileVersions (
          id INT PRIMARY KEY IDENTITY(1,1),
          fileId INT NOT NULL,
          version INT NOT NULL,
          path NVARCHAR(255) NOT NULL,
          uploaderId INT NOT NULL,
          createdAt DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (fileId) REFERENCES Files(id),
          FOREIGN KEY (uploaderId) REFERENCES Users(id)
        )
      `)

      // 创建管理员用户（如果不存在）
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM Users WHERE username='admin')
        INSERT INTO Users (username, email, password, role)
        VALUES ('admin', 'admin@example.com', 'admin123', 'admin')
      `)

    } catch (error) {
      console.error('创建表失败:', error)
      throw error
    }
  }

  async query(query, params = []) {
    try {
      const request = this.pool.request()
      params.forEach((param, index) => {
        request.input(`param${index + 1}`, param)
      })
      return await request.query(query)
    } catch (error) {
      console.error('查询失败:', error)
      throw error
    }
  }

  async close() {
    try {
      await this.pool.close()
      console.log('数据库连接已关闭')
    } catch (error) {
      console.error('关闭数据库连接失败:', error)
      throw error
    }
  }
}

module.exports = new Database()