// File Manager Script - LocalStorage Implementation (Supabase Ready)
// No WebSocket - Static SPA, open directly or via LiveServer

// Supabase Config (Required)
const SUPABASE_URL = 'https://bsnajahxawnlbehkkkgv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbmFqYWh4YXdubGJlaGtra2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTIxNjMsImV4cCI6MjA4OTc4ODE2M30.bcvC_j0W7wByqUi_L14DWq0P23e6WPJLtBvfbnoLnyI';


let files = []; // Current files list
let supabaseClient = null; // Our client instance

// Init



document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Sidebar toggle
  const sidebarToggles = document.querySelectorAll('.hamburger');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebar = document.querySelector('.sidebar');
  // No mainContent shift needed

  function toggleSidebar(e) {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
    e.target.classList.toggle('active');
  }

  sidebarToggles.forEach(toggle => toggle.addEventListener('click', toggleSidebar));
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('open');
    });
  }

  // Supabase client (required)
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await loadFiles();

  // Nav - enhanced to close sidebar on mobile
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const page = e.currentTarget.dataset.page;
      switchPage(page);
      // Close sidebar
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('open');
    });
  });

  // Upload
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const confirmUpload = document.getElementById('confirmUpload');

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('drop', handleDrop);
  fileInput.addEventListener('change', handleFiles);
  confirmUpload.addEventListener('click', uploadSelectedFiles);

  switchPage('dashboard');
}

function updateDashboard() {
  loadFiles(); // Ensure latest files
  
  // Total files
  document.getElementById('totalFiles').textContent = files.length;
  
  // Total storage
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  document.getElementById('totalStorage').textContent = (totalSize / (1024*1024)).toFixed(1) + ' MB';
  
  // Uploads today
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayUploads = files.filter(file => {
    const fileDate = new Date(file.uploaded_at || file.uploadedAt);
    return fileDate >= today && fileDate < tomorrow;
  }).length;
  document.getElementById('uploadsToday').textContent = todayUploads;
  
  // Recent files
  const recent = files.slice(0,5).map(file => {
    const typeInfo = getFileType({name: file.name, type: file.mime_type || file.mime || ''});
    const dateStr = new Date(file.uploaded_at || file.uploadedAt).toLocaleDateString();
    return `<div class="recent-item">
      <span class="recent-icon">${typeInfo.icon}</span>
      <div class="recent-info">
        <div class="recent-name">${file.name}</div>
        <div class="recent-date">${dateStr}</div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('recentFilesList').innerHTML = recent || '<p>No recent files</p>';
}

function switchPage(pageId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  if (pageId === 'dashboard') updateDashboard();
  if (pageId === 'view') loadFilesGrid();
}

function applyFilters() {
  const searchQuery = document.getElementById('searchInput').value.toLowerCase();
  const dateFilter = document.getElementById('dateFilter').value;

  let filtered = files.filter(file => file.name.toLowerCase().includes(searchQuery));

  if (dateFilter) {
    const filterDate = new Date(dateFilter + 'T00:00:00');
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    filtered = filtered.filter(file => {
      const fileDate = new Date(file.uploaded_at || file.uploadedAt || '1970-01-01');
      return fileDate >= filterDate && fileDate < nextDay;
    });
  }

  renderFilesGrid(filtered);
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const dateFilter = document.getElementById('dateFilter');
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (dateFilter) dateFilter.addEventListener('change', applyFilters);
});

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  handleFiles(e);
}

function handleFiles(e) {
  const newFiles = Array.from(e.target.files || []);
  displayFileList(newFiles);
}

function getFileType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const mime = file.type.toLowerCase();
  if (mime.startsWith('image/')) return {icon: '🖼️', label: 'Image'};
  if (mime === 'application/pdf' || ext === 'pdf') return {icon: '📕', label: 'PDF'};
  if (ext === 'doc' || ext === 'docx') return {icon: '📝', label: 'Word'};
  if (ext === 'xls' || ext === 'xlsx') return {icon: '📊', label: 'Excel'};
  if (mime === 'text/plain' || ext === 'txt') return {icon: '📄', label: 'Text'};
  if (ext === 'zip' || ext === 'rar') return {icon: '📦', label: 'Archive'};
  return {icon: '📎', label: 'File'};
}

function displayFileList(selectedFiles) {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const typeInfo = getFileType(file);
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `${typeInfo.icon} ${file.name} (${(file.size/1024).toFixed(1)}KB) <span class="remove-file" data-index="${index}" style="cursor:pointer;color:red;">×</span>`;
    fileList.appendChild(div);
  });
  window.selectedFiles = selectedFiles;
}

async function uploadSelectedFiles() {
  if (!window.selectedFiles?.length) return alert('No files selected');

  const nameInput = document.getElementById('fileNameInput');
  const customName = nameInput.value.trim();
  if (customName && !window.selectedFiles.length) return alert('No files to name');

  const promises = window.selectedFiles.map(async (file) => {
    try {
      const displayName = customName || file.name;
      const fileName = `${Date.now()}-${displayName}`;
      const { data, error } = await supabaseClient.storage
        .from('files')
        .upload(fileName, file);
      if (error) throw error;

      await supabaseClient.from('files').insert({
        name: displayName,
        size: file.size,
        mime_type: file.type,
        path: fileName,
        uploaded_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Upload error:', err);
      alert(`Error uploading ${file.name}: ${err.message}`);
    }
  });

  await Promise.all(promises);
  alert('Upload complete!');
  window.selectedFiles = [];
  document.getElementById('fileList').innerHTML = '';
  nameInput.value = '';
  document.getElementById('fileInput').value = '';
  loadFilesGrid();
}

async function loadFiles() {
  const { data, error } = await supabaseClient
    .from('files')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (error) {
    console.error('Load error:', error);
    files = [];
  } else {
    files = data || [];
  }
}

function renderFilesGrid(fileList) {
  const grid = document.getElementById('filesGrid');
  grid.innerHTML = '';
  fileList.forEach((fileObj, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    
    const typeInfo = getFileType({name: fileObj.name, type: fileObj.mime_type || fileObj.mime || ''});
    const isImage = (fileObj.mime_type || fileObj.mime || '').startsWith('image/');
    const uploadedDate = fileObj.uploaded_at || fileObj.uploadedAt;
    const dateStr = uploadedDate ? new Date(uploadedDate).toLocaleDateString() : 'Unknown';
    const preview = isImage ? `<img src="${fileObj.data || `https://${SUPABASE_URL.split('/')[2]}/storage/v1/object/public/files/${fileObj.path}`}" alt="${fileObj.name}" style="max-width:100%;max-height:150px;border-radius:8px;">` : `<div class="file-icon" style="font-size:48px;padding:20px;">${typeInfo.icon}</div>`;
    const downloadUrl = `https://${SUPABASE_URL.split('/')[2]}/storage/v1/object/public/files/${fileObj.path}`;
    const globalIndex = files.indexOf(fileObj);

    card.innerHTML = `
      <div class="file-preview">${preview}</div>
      <div class="file-type">${typeInfo.icon} ${typeInfo.label}</div>
      <div class="file-name">${fileObj.name}</div>
      <div class="file-date">Added: ${dateStr}</div>
      <a href="${downloadUrl}" class="download-btn" download="${fileObj.name}">Download</a>
      <button class="delete-btn" onclick="confirmDelete('${fileObj.id}', '${fileObj.path}')">Delete</button>
    `;

    grid.appendChild(card);
  });
}

function loadFilesGrid() {
  loadFiles();
  renderFilesGrid(files);
}

async function deleteFile(fileId, filePath) {
  if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;

  try {
    // Delete from storage
    const { error: storageError } = await supabaseClient.storage
      .from('files')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from DB
    const { error: dbError } = await supabaseClient
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    alert('File deleted successfully!');
    await loadFiles(); // Reload list
    renderFilesGrid(files);
    if (document.querySelector('.page.active').id === 'dashboard') {
      updateDashboard();
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting file: ' + err.message);
  }
}

function confirmDelete(fileId, filePath) {
  deleteFile(fileId, filePath);
}



