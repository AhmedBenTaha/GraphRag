const API_BASE_URL = "http://127.0.0.1:8000";

// State Management
let conversations = JSON.parse(localStorage.getItem('graphrag_conversations')) || [];
let currentConversationId = null;
let settings = JSON.parse(localStorage.getItem('graphrag_settings')) || {
  theme: 'dark',
  reduceMotion: false,
  enterToSend: true,
  autoScroll: true,
  markdown: true
};
let graphNetwork = null;
let isProcessing = false;

// DOM Elements
const chatInput = document.getElementById('chat-input');
const messagesArea = document.getElementById('messages-area');
const welcomeScreen = document.getElementById('welcome-screen');
const loadingContainer = document.getElementById('loading-container');
const charCount = document.getElementById('char-count');
const sidebarContent = document.getElementById('sidebar-content');
const inspectorPanel = document.getElementById('inspector-panel');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  renderSidebar();
  initBackgroundCanvas();
  initGraph();
  setupEventListeners();
  
  if (conversations.length === 0) {
    createNewChat();
  } else {
    loadConversation(conversations[0].id);
  }
});

// Settings & Theme
function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
  document.getElementById('setting-theme').value = settings.theme;
  document.getElementById('setting-reduce-motion').checked = settings.reduceMotion;
  document.getElementById('setting-enter-to-send').checked = settings.enterToSend;
  document.getElementById('setting-auto-scroll').checked = settings.autoScroll;
  document.getElementById('setting-markdown').checked = settings.markdown;
  
  if (settings.reduceMotion) {
    document.body.style.setProperty('--animation-duration', '0.01ms');
  }
}

function saveSettings() {
  localStorage.setItem('graphrag_settings', JSON.stringify(settings));
}

// Sidebar & Conversations
function createNewChat() {
  const id = Date.now().toString();
  const newConv = {
    id,
    title: 'New Conversation',
    messages: [],
    timestamp: Date.now()
  };
  conversations.unshift(newConv);
  saveConversations();
  renderSidebar();
  loadConversation(id);
  showToast('New conversation created', 'success');
}

function saveConversations() {
  localStorage.setItem('graphrag_conversations', JSON.stringify(conversations));
}

function renderSidebar() {
  sidebarContent.innerHTML = '';
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  const groups = { 'Today': [], 'Yesterday': [], 'Older': [] };
  
  conversations.forEach(conv => {
    const date = new Date(conv.timestamp).toDateString();
    if (date === today) groups['Today'].push(conv);
    else if (date === yesterday) groups['Yesterday'].push(conv);
    else groups['Older'].push(conv);
  });
  
  for (const [label, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'history-group';
    groupDiv.innerHTML = `<div class="history-label">${label}</div>`;
    
    items.forEach(conv => {
      const item = document.createElement('div');
      item.className = `history-item ${conv.id === currentConversationId ? 'active' : ''}`;
      item.innerHTML = `
        <span class="history-title">${conv.title}</span>
        <div class="history-item-actions">
          <button onclick="event.stopPropagation(); renameConversation('${conv.id}')"><i class="ph ph-pencil"></i></button>
          <button onclick="event.stopPropagation(); deleteConversation('${conv.id}')"><i class="ph ph-trash"></i></button>
        </div>
      `;
      item.onclick = () => loadConversation(conv.id);
      groupDiv.appendChild(item);
    });
    
    sidebarContent.appendChild(groupDiv);
  }
}

function loadConversation(id) {
  currentConversationId = id;
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  
  messagesArea.innerHTML = '';
  if (conv.messages.length === 0) {
    welcomeScreen.classList.remove('hidden');
  } else {
    welcomeScreen.classList.add('hidden');
    conv.messages.forEach(msg => {
      renderMessage(msg.role, msg.content, msg.timestamp, false);
    });
    scrollToBottom();
  }
  renderSidebar();
  
  // Close mobile sidebar if open
  document.getElementById('sidebar').classList.remove('open');
}

function renameConversation(id) {
  const conv = conversations.find(c => c.id === id);
  const newTitle = prompt('Rename conversation:', conv.title);
  if (newTitle && newTitle.trim() !== '') {
    conv.title = newTitle.trim();
    saveConversations();
    renderSidebar();
  }
}

function deleteConversation(id) {
  if (!confirm('Delete this conversation?')) return;
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();
  if (currentConversationId === id) {
    if (conversations.length > 0) {
      loadConversation(conversations[0].id);
    } else {
      createNewChat();
    }
  } else {
    renderSidebar();
  }
  showToast('Conversation deleted', 'success');
}

// Chat & Messaging
function renderMessage(role, content, timestamp, save = true) {
  welcomeScreen.classList.add('hidden');
  
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  
  const avatar = role === 'user' ? '<i class="ph ph-user"></i>' : '<i class="ph ph-sparkle"></i>';
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let htmlContent = content;
  if (role === 'assistant' && settings.markdown) {
    htmlContent = DOMPurify.sanitize(marked.parse(content));
  } else if (role === 'user') {
    htmlContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
  
  const actions = role === 'assistant' ? `
    <div class="message-actions">
      <button class="action-btn" onclick="copyMessage(this, '${encodeURIComponent(content)}')">
        <i class="ph ph-copy"></i> Copy
      </button>
      <button class="action-btn" onclick="regenerateMessage()">
        <i class="ph ph-arrows-clockwise"></i> Regenerate
      </button>
      <button class="action-btn" onclick="expandMessage(this)">
        <i class="ph ph-arrows-out-simple"></i> Expand
      </button>
    </div>
  ` : '';
  
  msgDiv.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-bubble">${htmlContent}</div>
      <div class="message-meta">
        <span>${time}</span>
      </div>
      ${actions}
    </div>
  `;
  
  messagesArea.appendChild(msgDiv);
  
  if (save && currentConversationId) {
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv) {
      conv.messages.push({ role, content, timestamp });
      if (conv.messages.length === 1 && role === 'user') {
        conv.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      }
      saveConversations();
      renderSidebar();
    }
  }
  
  if (settings.autoScroll) scrollToBottom();
}

function scrollToBottom() {
  const container = document.getElementById('chat-container');
  container.scrollTop = container.scrollHeight;
}

async function sendMessage(query) {
  if (!query.trim() || isProcessing) return;
  
  const timestamp = Date.now();
  renderMessage('user', query, timestamp);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  charCount.textContent = '0';
  
  isProcessing = true;
  showLoading();
  
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);
    
    hideLoading();
    renderMessage('assistant', data.answer, Date.now());
    showToast(`Response generated in ${duration}ms`, 'success');
  } catch (error) {
    hideLoading();
    renderMessage('assistant', `⚠️ Error: Failed to connect to the API. Please ensure the backend is running at ${API_BASE_URL}`, Date.now());
    showToast('API connection failed', 'error');
  } finally {
    isProcessing = false;
  }
}

function showLoading() {
  loadingContainer.classList.remove('hidden');
  const steps = ['step-1', 'step-2', 'step-3', 'step-4'];
  
  steps.forEach((id, index) => {
    const el = document.getElementById(id);
    el.className = 'loading-step pending';
    el.querySelector('i').className = 'ph ph-circle';
  });
  
  document.getElementById('step-1').className = 'loading-step active';
  document.getElementById('step-1').querySelector('i').className = 'ph ph-circle-notch ph-spin';
  
  let current = 0;
  window.loadingInterval = setInterval(() => {
    if (current < steps.length - 1) {
      const prev = document.getElementById(steps[current]);
      prev.className = 'loading-step completed';
      prev.querySelector('i').className = 'ph ph-check-circle';
      
      current++;
      const next = document.getElementById(steps[current]);
      next.className = 'loading-step active';
      next.querySelector('i').className = 'ph ph-circle-notch ph-spin';
    }
  }, 800);
}

function hideLoading() {
  clearInterval(window.loadingInterval);
  loadingContainer.classList.add('hidden');
}

// Message Actions
function copyMessage(btn, encodedContent) {
  const content = decodeURIComponent(encodedContent);
  navigator.clipboard.writeText(content).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = '<i class="ph ph-check"></i> Copied';
    showToast('Copied to clipboard', 'success');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<i class="ph ph-copy"></i> Copy';
    }, 2000);
  });
}

function regenerateMessage() {
  const conv = conversations.find(c => c.id === currentConversationId);
  if (!conv || conv.messages.length === 0) return;
  
  const lastUserMsg = [...conv.messages].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    // Remove the last assistant message if it exists
    if (conv.messages[conv.messages.length - 1].role === 'assistant') {
      conv.messages.pop();
      messagesArea.lastElementChild.remove();
      saveConversations();
    }
    sendMessage(lastUserMsg.content);
  }
}

function expandMessage(btn) {
  const bubble = btn.closest('.message-content').querySelector('.message-bubble');
  bubble.classList.toggle('expanded');
  btn.innerHTML = bubble.classList.contains('expanded') 
    ? '<i class="ph ph-arrows-in-simple"></i> Collapse' 
    : '<i class="ph ph-arrows-out-simple"></i> Expand';
}

// Graph Visualization (Demo)
function initGraph() {
  const container = document.getElementById('graph-container');
  const nodes = new vis.DataSet([
    { id: 1, label: 'GraphRAG', color: '#00f0ff', shape: 'dot', size: 30 },
    { id: 2, label: 'LlamaIndex', color: '#7b2cbf', shape: 'dot', size: 25 },
    { id: 3, label: 'Neo4j', color: '#00ff9d', shape: 'dot', size: 25 },
    { id: 4, label: 'Qdrant', color: '#ffb800', shape: 'dot', size: 25 },
    { id: 5, label: 'Retrieval', color: '#ff4d4d', shape: 'dot', size: 20 },
    { id: 6, label: 'LLM', color: '#00f0ff', shape: 'dot', size: 28 },
    { id: 7, label: 'Documents', color: '#8888a0', shape: 'dot', size: 22 }
  ]);
  
  const edges = new vis.DataSet([
    { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 2, to: 5 }, { from: 3, to: 5 }, { from: 4, to: 5 },
    { from: 5, to: 6 }, { from: 7, to: 5 }, { from: 7, to: 3 }
  ]);
  
  const data = { nodes, edges };
  const options = {
    nodes: {
      font: { color: document.body.getAttribute('data-theme') === 'dark' ? '#f0f0f5' : '#1a1a2e', size: 14 },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      color: { color: 'rgba(136, 136, 160, 0.4)', highlight: '#00f0ff' },
      smooth: { type: 'continuous' }
    },
    physics: {
      stabilization: false,
      barnesHut: { gravitationalConstant: -3000, springLength: 150 }
    },
    interaction: { hover: true, tooltipDelay: 200 }
  };
  
  graphNetwork = new vis.Network(container, data, options);
  
  document.getElementById('graph-reset').addEventListener('click', () => {
    graphNetwork.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  });
}

// Background Animation
function initBackgroundCanvas() {
  if (settings.reduceMotion) return;
  
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 2 + 1;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.fillStyle = document.body.getAttribute('data-theme') === 'dark' ? 'rgba(0, 240, 255, 0.3)' : 'rgba(123, 44, 191, 0.2)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  function init() {
    resize();
    particles = [];
    for (let i = 0; i < 50; i++) particles.push(new Particle());
  }
  
  function animate() {
    if (settings.reduceMotion) return;
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach((p, i) => {
      p.update();
      p.draw();
      
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.strokeStyle = document.body.getAttribute('data-theme') === 'dark' 
            ? `rgba(0, 240, 255, ${0.1 * (1 - dist / 150)})` 
            : `rgba(123, 44, 191, ${0.1 * (1 - dist / 150)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', resize);
  init();
  animate();
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'ph-check-circle' : type === 'error' ? 'ph-warning-circle' : 'ph-info';
  toast.innerHTML = `<i class="ph ${icon}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Event Listeners
function setupEventListeners() {
  // Input handling
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    charCount.textContent = this.value.length;
  });
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (settings.enterToSend) {
        e.preventDefault();
        sendMessage(chatInput.value);
      }
    }
  });
  
  document.getElementById('send-btn').addEventListener('click', () => sendMessage(chatInput.value));
  document.getElementById('clear-input').addEventListener('click', () => {
    chatInput.value = '';
    chatInput.style.height = 'auto';
    charCount.textContent = '0';
    chatInput.focus();
  });
  
  // Suggestion cards
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      sendMessage(card.dataset.query);
    });
  });
  
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(btn.dataset.view).classList.add('active');
      
      if (btn.dataset.view === 'view-graph' && graphNetwork) {
        setTimeout(() => graphNetwork.fit(), 100);
      }
    });
  });
  
  // Sidebar
  document.getElementById('btn-new-chat').addEventListener('click', createNewChat);
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('toggle-sidebar-mobile').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
  
  // Inspector
  document.getElementById('btn-toggle-inspector').addEventListener('click', () => {
    inspectorPanel.classList.toggle('visible');
  });
  document.getElementById('close-inspector').addEventListener('click', () => {
    inspectorPanel.classList.remove('visible');
  });
  
  // Settings
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
  });
  document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
  });
  
  document.getElementById('setting-theme').addEventListener('change', (e) => {
    settings.theme = e.target.value;
    applySettings();
    saveSettings();
    if (graphNetwork) graphNetwork.setOptions({
      nodes: { font: { color: settings.theme === 'dark' ? '#f0f0f5' : '#1a1a2e' } }
    });
  });
  
  document.getElementById('setting-reduce-motion').addEventListener('change', (e) => {
    settings.reduceMotion = e.target.checked;
    saveSettings();
    location.reload(); // Simple way to apply/remove canvas
  });
  
  document.getElementById('setting-enter-to-send').addEventListener('change', (e) => {
    settings.enterToSend = e.target.checked;
    saveSettings();
  });
  
  document.getElementById('setting-auto-scroll').addEventListener('change', (e) => {
    settings.autoScroll = e.target.checked;
    saveSettings();
  });
  
  document.getElementById('setting-markdown').addEventListener('change', (e) => {
    settings.markdown = e.target.checked;
    saveSettings();
  });
  
  document.getElementById('test-connection-btn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connection-status');
    statusEl.textContent = 'Testing...';
    statusEl.className = 'connection-status';
    
    try {
      const start = performance.now();
      const res = await fetch(`${API_BASE_URL}/`);
      const duration = Math.round(performance.now() - start);
      
      if (res.ok) {
        statusEl.innerHTML = `<i class="ph ph-check-circle"></i> API ONLINE <span style="margin-left:8px;opacity:0.7">${duration} ms</span>`;
        statusEl.className = 'connection-status success';
        showToast('API connection successful', 'success');
      } else {
        throw new Error('Bad response');
      }
    } catch (err) {
      statusEl.innerHTML = `<i class="ph ph-x-circle"></i> API OFFLINE`;
      statusEl.className = 'connection-status error';
      showToast('API connection failed', 'error');
    }
  });
  
  // Theme toggle
  document.getElementById('btn-theme').addEventListener('click', () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    applySettings();
    saveSettings();
  });
  
  // Command Palette
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const palette = document.getElementById('command-palette');
      palette.classList.remove('hidden');
      document.getElementById('command-input').focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      inspectorPanel.classList.remove('visible');
    }
  });
  
  document.querySelectorAll('.command-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      document.getElementById('command-palette').classList.add('hidden');
      
      switch(action) {
        case 'new-chat': createNewChat(); break;
        case 'search-conversations': 
          const q = prompt('Search conversations:');
          if (q) {
            const found = conversations.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
            if (found.length > 0) loadConversation(found[0].id);
            else showToast('No conversations found', 'warning');
          }
          break;
        case 'open-graph': 
          document.querySelector('[data-view="view-graph"]').click(); 
          break;
        case 'open-documents': 
          document.querySelector('[data-view="view-documents"]').click(); 
          break;
        case 'open-settings': 
          document.getElementById('settings-modal').classList.remove('hidden'); 
          break;
        case 'toggle-theme': 
          document.getElementById('btn-theme').click(); 
          break;
      }
    });
  });
  
  document.getElementById('command-palette').addEventListener('click', (e) => {
    if (e.target === document.getElementById('command-palette')) {
      document.getElementById('command-palette').classList.add('hidden');
    }
  });
  
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('settings-modal')) {
      document.getElementById('settings-modal').classList.add('hidden');
    }
  });
}