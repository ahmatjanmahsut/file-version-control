import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Layout, Menu, Button, message } from 'antd'
import { UploadOutlined, LogoutOutlined, FileTextOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'
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
    localStorage.removeItem('token')
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

  const menuItems = [
    {
      key: 'files',
      icon: <FileTextOutlined />,
      label: <Link to="/files">文件列表</Link>
    },
    ...(isAdmin ? [{
      key: 'upload',
      icon: <UploadOutlined />,
      label: <Link to="/upload">上传文件</Link>
    }] : [])
  ]

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {currentUser && (
          <Sider width={220} style={{ background: '#001529' }}>
            <div className="logo" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
              工艺文件系统
            </div>
            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={['files']}
              items={menuItems}
              style={{ background: '#001529' }}
            />
          </Sider>
        )}
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontWeight: 'bold' }}>欢迎, {currentUser.username}</span>
                {isAdmin && (
                  <span style={{ color: '#1890ff', fontSize: 12, padding: '2px 8px', background: '#e6f7ff', borderRadius: 4 }}>管理员</span>
                )}
                <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16 }}>
                <Link to="/login">
                  <Button type="primary">登录</Button>
                </Link>
                <Link to="/register">
                  <Button>注册</Button>
                </Link>
              </div>
            )}
          </Header>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
            <Routes>
              <Route path="/login" element={
                currentUser ? <Navigate to="/files" /> : <Login setCurrentUser={setCurrentUser} setIsAdmin={setIsAdmin} />
              } />
              <Route path="/register" element={
                currentUser ? <Navigate to="/files" /> : <Register />
              } />
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
                  <FileUpload onUploadSuccess={() => {}} />
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
