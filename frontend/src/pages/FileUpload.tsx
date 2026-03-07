import React from 'react'
import { Upload, Button, message, Typography, Form } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const { Title } = Typography
const { Dragger } = Upload

interface FileUploadProps {
  onUploadSuccess?: () => void
}

const FileUpload: React.FC<FileUploadProps> = () => {
  const [fileList, setFileList] = React.useState<any[]>([])
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const handleUpload = async (file: any) => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      message.success('文件上传成功')
      setFileList([])
      form.resetFields()
    } catch (error) {
      message.error('文件上传失败')
    }
  }

  const props = {
    name: 'file',
    multiple: false,
    accept: '.doc,.docx,.xls,.xlsx',
    fileList,
    onChange(info: any) {
      const { status } = info.file
      if (status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (status === 'done') {
        message.success(`${info.file.name} 文件上传成功`)
      } else if (status === 'error') {
        message.error(`${info.file.name} 文件上传失败`)
      }
    },
    beforeUpload: (file: any) => {
      handleUpload(file)
      return false
    }
  }

  return (
    <div>
      <Title level={3}>上传文件</Title>
      <Form form={form} layout="vertical">
        <Form.Item label="文件信息">
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p className="ant-upload-hint">
              支持上传 Word (.doc, .docx) 和 Excel (.xls, .xlsx) 文件
            </p>
          </Dragger>
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={() => navigate('/files')} style={{ marginRight: 8 }}>
            返回文件列表
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default FileUpload
