import React, { useState } from 'react'
import { Form, Input, Button, Checkbox, message, Typography, Card, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const { Title } = Typography

interface LoginProps {
  setCurrentUser: (user: any) => void
  setIsAdmin: (isAdmin: boolean) => void
}

const Login: React.FC<LoginProps> = ({ setCurrentUser, setIsAdmin }) => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await axios.post('/api/auth/login', values)
      const { token, user } = response.data
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      setCurrentUser(user)
      setIsAdmin(user.role === 'admin')
      message.success('登录成功')
      navigate('/files')
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>用户登录</Title>
        <Form
          name="login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input prefix={<LockOutlined />} type="password" placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <a href="#" style={{ float: 'right' }}>忘记密码?</a>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
              登录
            </Button>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <span>还没有账号?</span>
              <Link to="/register">立即注册</Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login