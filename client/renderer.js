const API_BASE = 'http://localhost:8000/api'

let currentUser = null

async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = {
    method,
    headers
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '请求失败')
    }
    return await response.json()
  } catch (error) {
    console.error('API请求错误:', error)
    throw error
  }
}

async function login() {
  try {
    const result = await apiRequest('/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    })
    localStorage.setItem('token', result.token)
    currentUser = result.user
    return true
  } catch (error) {
    console.error('登录失败:', error)
    return false
  }
}

async function loadUsers() {
  try {
    const users = await apiRequest('/admin/users')
    const tbody = document.getElementById('usersTableBody')
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无数据</td></tr>'
      return
    }
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role === 'admin' ? '管理员' : '普通用户'}</span></td>
        <td>${new Date(user.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">
            <i class="bi bi-trash"></i> 删除
          </button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

async function addUser() {
  const form = document.getElementById('addUserForm')
  const formData = new FormData(form)
  const userData = {
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role')
  }

  try {
    await apiRequest('/admin/users', 'POST', userData)
    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide()
    form.reset()
    loadUsers()
    alert('用户添加成功')
  } catch (error) {
    alert('添加用户失败: ' + error.message)
  }
}

async function deleteUser(userId) {
  if (!confirm('确定要删除此用户吗？')) return

  try {
    await apiRequest(`/admin/users/${userId}`, 'DELETE')
    loadUsers()
    alert('用户删除成功')
  } catch (error) {
    alert('删除用户失败: ' + error.message)
  }
}

async function loadFiles() {
  try {
    const files = await apiRequest('/files')
    const tbody = document.getElementById('filesTableBody')
    if (files.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">暂无数据</td></tr>'
      return
    }
    tbody.innerHTML = files.map(file => `
      <tr>
        <td>${file.id}</td>
        <td>${file.name}</td>
        <td>${file.type}</td>
        <td>${(file.size / 1024).toFixed(2)} KB</td>
        <td><span class="version-tag">v${file.version}</span></td>
        <td>${file.uploader}</td>
        <td>${new Date(file.updatedAt).toLocaleString()}</td>
        <td class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="previewFile(${file.id})">
            <i class="bi bi-eye"></i> 预览
          </button>
          <button class="btn btn-success btn-sm" onclick="downloadFile(${file.id}, '${file.name}')">
            <i class="bi bi-download"></i> 下载
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteFile(${file.id})">
            <i class="bi bi-trash"></i> 删除
          </button>
        </td>
      </tr>
    `).join('')

    const versionSelect = document.getElementById('versionFileSelect')
    versionSelect.innerHTML = '<option value="">请选择文件...</option>' +
      files.map(file => `<option value="${file.id}">${file.name} (v${file.version})</option>`).join('')
  } catch (error) {
    console.error('加载文件失败:', error)
  }
}

async function previewFile(fileId) {
  window.open(`/preview.html?id=${fileId}`, '_blank', 'width=900,height=700')
}

async function downloadFile(fileId, fileName) {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载失败: ' + error.message)
  }
}

async function deleteFile(fileId) {
  if (!confirm('确定要删除此文件吗？')) return

  try {
    await apiRequest(`/files/${fileId}`, 'DELETE')
    loadFiles()
    alert('文件删除成功')
  } catch (error) {
    alert('删除文件失败: ' + error.message)
  }
}

async function loadVersions(fileId) {
  if (!fileId) {
    document.getElementById('versionsTableBody').innerHTML = '<tr><td colspan="5" class="text-center">请选择文件查看版本历史</td></tr>'
    return
  }

  try {
    const versions = await apiRequest(`/files/${fileId}/versions`)
    const tbody = document.getElementById('versionsTableBody')
    if (versions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无版本历史</td></tr>'
      return
    }
    tbody.innerHTML = versions.map(version => `
      <tr>
        <td><span class="version-tag">v${version.version}</span></td>
        <td>版本记录</td>
        <td>${version.uploader}</td>
        <td>${new Date(version.createdAt).toLocaleString()}</td>
        <td>
          <button class="btn btn-success btn-sm">
            <i class="bi bi-download"></i> 下载
          </button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('加载版本历史失败:', error)
  }
}

function setupEventListeners() {
  document.getElementById('startBackendBtn').addEventListener('click', async () => {
    if (window.electronAPI) {
      await window.electronAPI.startBackend()
      setTimeout(checkBackendStatus, 3000)
    } else {
      alert('请使用桌面客户端运行')
    }
  })

  document.getElementById('stopBackendBtn').addEventListener('click', async () => {
    if (window.electronAPI) {
      await window.electronAPI.stopBackend()
      checkBackendStatus()
    } else {
      alert('请使用桌面客户端运行')
    }
  })

  document.getElementById('openFrontendBtn').addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal('http://localhost:3000')
    } else {
      window.open('http://localhost:3000', '_blank')
    }
  })

  document.getElementById('openFrontendBtn2').addEventListener('click', () => {
    if (window.electronAPI) {
      window.electronAPI.openExternal('http://localhost:3000')
    } else {
      window.open('http://localhost:3000', '_blank')
    }
  })

  document.getElementById('saveUserBtn').addEventListener('click', addUser)

  document.getElementById('fileSearchInput').addEventListener('input', async (e) => {
    const searchText = e.target.value.toLowerCase()
    const files = await apiRequest('/files')
    const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchText))
    const tbody = document.getElementById('filesTableBody')
    if (filteredFiles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">无匹配结果</td></tr>'
      return
    }
    tbody.innerHTML = filteredFiles.map(file => `
      <tr>
        <td>${file.id}</td>
        <td>${file.name}</td>
        <td>${file.type}</td>
        <td>${(file.size / 1024).toFixed(2)} KB</td>
        <td><span class="version-tag">v${file.version}</span></td>
        <td>${file.uploader}</td>
        <td>${new Date(file.updatedAt).toLocaleString()}</td>
        <td class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="previewFile(${file.id})">
            <i class="bi bi-eye"></i> 预览
          </button>
          <button class="btn btn-success btn-sm" onclick="downloadFile(${file.id}, '${file.name}')">
            <i class="bi bi-download"></i> 下载
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteFile(${file.id})">
            <i class="bi bi-trash"></i> 删除
          </button>
        </td>
      </tr>
    `).join('')
  })

  document.getElementById('versionFileSelect').addEventListener('change', (e) => {
    loadVersions(e.target.value)
  })
}

async function checkBackendStatus() {
  try {
    const response = await fetch('http://localhost:8000/api/files', {
      method: 'HEAD'
    })
    document.getElementById('backendStatus').textContent = '运行中'
    document.getElementById('backendStatus').className = 'status-badge status-running'
  } catch (error) {
    document.getElementById('backendStatus').textContent = '未运行'
    document.getElementById('backendStatus').className = 'status-badge status-stopped'
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const loggedIn = await login()
  if (!loggedIn) {
    alert('无法登录管理后台，请确保后端服务已启动')
    return
  }

  setupEventListeners()
  loadUsers()
  loadFiles()
  checkBackendStatus()

  setInterval(checkBackendStatus, 5000)
})
