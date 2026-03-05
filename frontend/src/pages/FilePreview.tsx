import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, message, Typography, Space, Select } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Title } = Typography
const { Option } = Select

interface FileVersion {
  id: number
  version: number
  createdAt: string
  uploader: string
}

const FilePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [file, setFile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number>(1)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (id) {
      fetchFileDetails()
      fetchVersions()
    }
  }, [id])

  const fetchFileDetails = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/files/${id}`)
      setFile(response.data)
    } catch (error) {
      message.error('获取文件详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async () => {
    try {
      const response = await axios.get(`/api/files/${id}/versions`)
      setVersions(response.data)
      if (response.data.length > 0) {
        setSelectedVersion(response.data[0].version)
      }
    } catch (error) {
      message.error('获取版本历史失败')
    }
  }

  const handleVersionChange = async (version: number) => {
    setSelectedVersion(version)
    try {
      const response = await axios.get(`/api/files/${id}/preview?version=${version}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      setPreviewUrl(url)
    } catch (error) {
      message.error('获取预览失败')
    }
  }

  useEffect(() => {
    if (id && selectedVersion) {
      handleVersionChange(selectedVersion)
    }
  }, [id, selectedVersion])

  const handleBack = () => {
    navigate('/files')
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (!file) {
    return <div>文件不存在</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>返回文件列表</Button>
        <Title level={3}>{file.name}</Title>
        <div>
          <span>版本：</span>
          <Select
            value={selectedVersion}
            onChange={handleVersionChange}
            style={{ width: 120, marginLeft: 8 }}
          >
            {versions.map(version => (
              <Option key={version.id} value={version.version}>
                v{version.version}
              </Option>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="file-preview-container">
        {file.type.includes('word') || file.type.includes('excel') ? (
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="文件预览"
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>不支持的文件类型</p>
          </div>
        )}
      </div>

      <div className="file-version-list">
        <h4>版本历史</h4>
        <Space direction="vertical" style={{ width: '100%' }}>
          {versions.map(version => (
            <div key={version.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderBottom: '1px solid #f0f0f0' }}>
              <div>
                <span>版本：v{version.version}</span>
                <span style={{ marginLeft: 20 }}>上传时间：{version.createdAt}</span>
                <span style={{ marginLeft: 20 }}>上传者：{version.uploader}</span>
              </div>
              <Button type={selectedVersion === version.version ? 'primary' : 'default'} onClick={() => setSelectedVersion(version.version)}>
                查看此版本
              </Button>
            </div>
          ))}
        </Space>
      </div>
    </div>
  )
}

export default FilePreview