import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu, Button, message } from 'antd'
import { UploadOutlined, UserOutlined, LogoutOutlined, FileTextOutlined, HomeOutlined } from '@ant-design/icons'
import Login from './pages/Login'
import Register from './pages/Register'
import FileList from './pages/FileList'
import FilePreview from './pages/FilePreview'
import FileUpload from './pages/FileUpload'
import './App.css'

const { Header, Content, Sider } = Layout

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const parsedUser = JSON.parse(user)
      setCurrentUser(parsedUser)
      setIsAdmin(parsedUser.role === 'admin')
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setCurrentUser(null)
    setIsAdmin(false)
    message.success('退出登录成功')
  }

  const PrivateRoute = ({ children, adminRequired = false }: { children: React.ReactNode, adminRequired?: boolean }) => {
    if (!currentUser) {
      return <Navigate to="/login" />
    }
    if (adminRequired && !isAdmin) {
      return <Navigate to="/files" />
    }
    return children
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {currentUser && (
          <Sider width={200} style={{ background: '#fff' }}>
            <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold' }}>
              工艺文件系统
            </div>
            <Menu
              mode="inline"
              defaultSelectedKeys={['files']}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.Item key="files" icon={<FileTextOutlined />}>
                文件列表
              </Menu.Item>
              {isAdmin && (
                <Menu.Item key="upload" icon={<UploadOutlined />}>
                  上传文件
                </Menu.Item>
              )}
            </Menu>
          </Sider>
        )}
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span>欢迎, {currentUser.username}</span>
                <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16 }}>
                <Button type="primary">登录</Button>
                <Button>注册</Button>
              </div>
            )}
          </Header>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
            <Routes>
              <Route path="/login" element={<Login setCurrentUser={setCurrentUser} setIsAdmin={setIsAdmin} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/files" element={
                <PrivateRoute>
                  <FileList isAdmin={isAdmin} />
                </PrivateRoute>
              } />
              <Route path="/files/:id/preview" element={
                <PrivateRoute>
                  <FilePreview />
                </PrivateRoute>
              } />
              <Route path="/upload" element={
                <PrivateRoute adminRequired>
                  <FileUpload />
                </PrivateRoute>
              } />
              <Route path="/" element={<Navigate to={currentUser ? "/files" : "/login"} />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  )
}

export default App