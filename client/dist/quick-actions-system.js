// Comprehensive Customizable Quick Actions System
console.log('🚀 Advanced Quick Actions System loaded');

class QuickActionsManager {
  constructor() {
    this.dashboardData = null;
    this.config = {
      layout: 'grid-4',
      position: 'top',
      selectedActions: []
    };
    this.init();
  }

  async init() {
    await this.loadDashboardData();
    await this.loadConfig();
    this.createControlPanel();
    this.setupEventListeners();
  }

  async loadDashboardData() {
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      this.dashboardData = await response.json();
      console.log('📊 Dashboard data loaded:', this.dashboardData);
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
    }
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/quick-actions/config', {
        credentials: 'include'
      });
      const config = await response.json();
      this.config = {
        layout: config.layout || 'grid-4',
        position: config.position || 'top',
        selectedActions: config.selectedActions || [],
        availableActions: config.availableActions || [],
        categories: config.categories || []
      };
      console.log('⚙️ Config loaded:', this.config);
    } catch (error) {
      console.error('❌ Failed to load config:', error);
    }
  }

  createControlPanel() {
    const controlPanel = document.createElement('div');
    controlPanel.id = 'quick-actions-control-panel';
    controlPanel.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: white;
        border: 2px solid #22c55e;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 320px;
        font-family: Arial, sans-serif;
      ">
        <h3 style="margin: 0 0 15px 0; color: #16a34a; font-size: 16px;">
          ⚡ Quick Actions Dashboard
        </h3>
        
        <div style="margin-bottom: 10px;">
          <button id="showQuickActions" style="
            background: #22c55e;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 5px;
            font-size: 12px;
          ">Show Actions</button>
          
          <button id="customizeQuickActions" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-right: 5px;
            font-size: 12px;
          ">Customize</button>
          
          <button id="hideQuickActions" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
          ">Hide</button>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label style="font-size: 12px; color: #666; display: block; margin-bottom: 5px;">Layout:</label>
          <select id="layoutSelect" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
            <option value="grid-2">2 Columns Grid</option>
            <option value="grid-3">3 Columns Grid</option>
            <option value="grid-4">4 Columns Grid</option>
            <option value="list">List View</option>
          </select>
        </div>
        
        <div style="margin-bottom: 10px;">
          <label style="font-size: 12px; color: #666; display: block; margin-bottom: 5px;">Position:</label>
          <select id="positionSelect" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
            <option value="top">Top of Page</option>
            <option value="bottom">Bottom of Page</option>
            <option value="sidebar">Sidebar</option>
          </select>
        </div>
        
        <div id="customizationPanel" style="display: none;">
          <h4 style="font-size: 14px; margin: 15px 0 10px 0; color: #374151;">Select Actions:</h4>
          <div id="actionsList"></div>
          <button id="saveConfig" style="
            background: #16a34a;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            width: 100%;
            font-size: 12px;
          ">Save Configuration</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    this.updateControlPanelValues();
  }

  updateControlPanelValues() {
    const layoutSelect = document.getElementById('layoutSelect');
    const positionSelect = document.getElementById('positionSelect');
    
    if (layoutSelect) layoutSelect.value = this.config.layout;
    if (positionSelect) positionSelect.value = this.config.position;
  }

  setupEventListeners() {
    document.getElementById('showQuickActions')?.addEventListener('click', () => this.renderQuickActions());
    document.getElementById('hideQuickActions')?.addEventListener('click', () => this.hideQuickActions());
    document.getElementById('customizeQuickActions')?.addEventListener('click', () => this.toggleCustomization());
    document.getElementById('layoutSelect')?.addEventListener('change', (e) => this.updateLayout(e.target.value));
    document.getElementById('positionSelect')?.addEventListener('change', (e) => this.updatePosition(e.target.value));
    document.getElementById('saveConfig')?.addEventListener('click', () => this.saveConfiguration());
  }

  async renderQuickActions() {
    if (!this.dashboardData) {
      await this.loadDashboardData();
    }

    this.hideQuickActions(); // Remove existing

    const quickActionsContainer = document.createElement('div');
    quickActionsContainer.id = 'customizable-quick-actions';
    
    const containerStyle = this.getContainerStyle();
    quickActionsContainer.style.cssText = containerStyle;
    
    const quickActions = this.dashboardData.quickActions || [];
    
    quickActionsContainer.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      ">
        <h3 style="margin: 0; color: #16a34a; font-size: 18px;">Quick Actions</h3>
        <span style="font-size: 12px; color: #666;">
          ${quickActions.filter(a => a.completed).length}/${quickActions.length} completed
        </span>
      </div>
      
      <div style="${this.getGridStyle()}">
        ${quickActions.map(action => `
          <div class="quick-action-card" onclick="quickActionsManager.completeAction('${action.id}')" style="
            background: ${action.completed ? '#dcfce7' : action.color + '20'};
            border: 2px solid ${action.completed ? '#16a34a' : action.color};
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
            <div style="font-size: 24px; margin-bottom: 8px;">
              ${action.icon}
            </div>
            <div style="font-weight: bold; color: #333; font-size: 14px; margin-bottom: 4px;">
              ${action.title}
            </div>
            <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
              ${action.description}
            </div>
            <div style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
              ${action.category} • ${action.completed ? '✅ DONE' : '⏳ PENDING'}
            </div>
            ${action.completed ? '<div style="position: absolute; top: 5px; right: 5px; color: #16a34a; font-size: 16px;">✓</div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
    
    this.insertContainer(quickActionsContainer);
    console.log('✅ Quick actions rendered with', quickActions.length, 'actions');
  }

  getContainerStyle() {
    const baseStyle = `
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;

    switch (this.config.position) {
      case 'top':
        return baseStyle + `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
        `;
      case 'bottom':
        return baseStyle + `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 1200px;
        `;
      case 'sidebar':
        return baseStyle + `
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 300px;
          max-height: 80vh;
          overflow-y: auto;
        `;
      default:
        return baseStyle + `
          margin: 20px;
          width: calc(100% - 40px);
          max-width: 1200px;
        `;
    }
  }

  getGridStyle() {
    const baseStyle = 'display: grid; gap: 12px;';
    
    switch (this.config.layout) {
      case 'grid-2':
        return baseStyle + ' grid-template-columns: repeat(2, 1fr);';
      case 'grid-3':
        return baseStyle + ' grid-template-columns: repeat(3, 1fr);';
      case 'grid-4':
        return baseStyle + ' grid-template-columns: repeat(4, 1fr);';
      case 'list':
        return baseStyle + ' grid-template-columns: 1fr;';
      default:
        return baseStyle + ' grid-template-columns: repeat(4, 1fr);';
    }
  }

  insertContainer(container) {
    switch (this.config.position) {
      case 'top':
      case 'bottom':
      case 'sidebar':
        document.body.appendChild(container);
        break;
      default:
        // Try to insert in main content area
        const main = document.querySelector('main') || document.querySelector('[class*="content"]') || document.body;
        main.insertBefore(container, main.firstChild);
    }
  }

  hideQuickActions() {
    const existing = document.getElementById('customizable-quick-actions');
    if (existing) {
      existing.remove();
    }
  }

  async completeAction(actionId) {
    try {
      const response = await fetch(`/api/quick-actions/${actionId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Action completed:', result);
        
        // Show success message
        this.showNotification(`${result.message}`, 'success');
        
        // Refresh the quick actions
        await this.loadDashboardData();
        this.renderQuickActions();
      }
    } catch (error) {
      console.error('❌ Error completing action:', error);
      this.showNotification('Failed to complete action', 'error');
    }
  }

  toggleCustomization() {
    const panel = document.getElementById('customizationPanel');
    if (panel.style.display === 'none') {
      this.showCustomization();
    } else {
      panel.style.display = 'none';
    }
  }

  showCustomization() {
    const panel = document.getElementById('customizationPanel');
    const actionsList = document.getElementById('actionsList');
    
    if (!this.config.availableActions) {
      actionsList.innerHTML = '<p style="font-size: 12px; color: #666;">Loading available actions...</p>';
      panel.style.display = 'block';
      return;
    }
    
    actionsList.innerHTML = this.config.availableActions.map(action => `
      <label style="
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      " onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='transparent'">
        <input type="checkbox" ${this.config.selectedActions.includes(action.id) ? 'checked' : ''} 
               value="${action.id}" style="margin-right: 8px;">
        <span style="margin-right: 8px; font-size: 14px;">${action.icon}</span>
        <div>
          <div style="font-weight: bold; color: #333;">${action.title}</div>
          <div style="color: #666; font-size: 10px;">${action.category} • ${action.description}</div>
        </div>
      </label>
    `).join('');
    
    panel.style.display = 'block';
  }

  async updateLayout(layout) {
    this.config.layout = layout;
    await this.saveConfigToServer();
    if (document.getElementById('customizable-quick-actions')) {
      this.renderQuickActions();
    }
  }

  async updatePosition(position) {
    this.config.position = position;
    await this.saveConfigToServer();
    if (document.getElementById('customizable-quick-actions')) {
      this.renderQuickActions();
    }
  }

  async saveConfiguration() {
    const checkboxes = document.querySelectorAll('#actionsList input[type="checkbox"]');
    const selectedActions = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    
    this.config.selectedActions = selectedActions;
    await this.saveConfigToServer();
    await this.loadDashboardData();
    
    this.showNotification('Configuration saved successfully!', 'success');
    document.getElementById('customizationPanel').style.display = 'none';
    
    if (document.getElementById('customizable-quick-actions')) {
      this.renderQuickActions();
    }
  }

  async saveConfigToServer() {
    try {
      await fetch('/api/quick-actions/config', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedActions: this.config.selectedActions,
          layout: this.config.layout,
          position: this.config.position
        })
      });
    } catch (error) {
      console.error('❌ Failed to save config:', error);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: bold;
      font-size: 14px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the system when page loads
setTimeout(() => {
  window.quickActionsManager = new QuickActionsManager();
}, 2000);