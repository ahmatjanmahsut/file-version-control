import React, { useState, useEffect } from 'react'
import { Table, Button, Input, message, Space, Modal, Popconfirm } from 'antd'
import { SearchOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api'

interface FileListProps {
  isAdmin: boolean
}

interface File {
  id: number
  name: string
  type: string
  size: number
  version: number
  uploader: string
  createdAt: string
  updatedAt: string
}

const FileList: React.FC<FileListProps> = ({ isAdmin }) => {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [versionModalVisible, setVersionModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const navigate = useNavigate()

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await api.get('/files')
      setFiles(response.data)
    } catch (error) {
      message.error('获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handlePreview = (file: File) => {
    navigate(`/files/${file.id}/preview`)
  }

  const handleDownload = async (file: File) => {
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      message.error('下载文件失败')
    }
  }

  const handleDelete = async (fileId: number) => {
    try {
      await api.delete(`/files/${fileId}`)
      message.success('删除文件成功')
      fetchFiles()
    } catch (error) {
      message.error('删除文件失败')
    }
  }

  const handleViewVersions = async (file: File) => {
    setSelectedFile(file)
    try {
      const response = await api.get(`/files/${file.id}/versions`)
      setVersions(response.data)
      setVersionModalVisible(true)
    } catch (error) {
      message.error('获取版本历史失败')
    }
  }

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const columns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version'
    },
    {
      title: '上传者',
      dataIndex: 'uploader',
      key: 'uploader'
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: File) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
          <Button icon={<HistoryOutlined />} onClick={() => handleViewVersions(record)}>版本历史</Button>
          {isAdmin && (
            <>
              <Button icon={<EditOutlined />}>编辑</Button>
              <Popconfirm
                title="确定删除此文件吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h2>文件列表</h2>
        <Input
          placeholder="搜索文件"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="file-list-search"
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredFiles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`${selectedFile?.name} 的版本历史`}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVersionModalVisible(false)}>关闭</Button>
        ]}
      >
        <Table
          columns={[
            {
              title: '版本',
              dataIndex: 'version',
              key: 'version'
            },
            {
              title: '上传时间',
              dataIndex: 'createdAt',
              key: 'createdAt'
            },
            {
              title: '上传者',
              dataIndex: 'uploader',
              key: 'uploader'
            },
            {
              title: '操作',
              key: 'action',
              render: () => (
                <Space size="middle">
                  <Button icon={<DownloadOutlined />}>下载</Button>
                  <Button icon={<EyeOutlined />}>预览</Button>
                </Space>
              )
            }
          ]}
          dataSource={versions}
          rowKey="id"
        />
      </Modal>
    </div>
  )
}

export default FileList
