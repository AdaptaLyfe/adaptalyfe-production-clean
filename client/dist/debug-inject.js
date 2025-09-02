// Debug script to inject quick actions directly into dashboard
console.log('🔧 Debug inject script loaded');

// Wait for page to load
setTimeout(() => {
  console.log('🔧 Starting debug injection...');
  
  // Add debug button to current page
  const debugBtn = document.createElement('button');
  debugBtn.innerHTML = 'INJECT QUICK ACTIONS';
  debugBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:15px;border:none;cursor:pointer;font-weight:bold;border-radius:5px;';
  debugBtn.onclick = async () => {
    console.log('🔧 Fetching dashboard data...');
    
    try {
      const dashResponse = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      const dashData = await dashResponse.json();
      console.log('📊 Dashboard data:', dashData);
      
      if (dashData.quickActions && dashData.quickActions.length > 0) {
        console.log('✅ Found', dashData.quickActions.length, 'quick actions');
        
        // Create quick actions HTML
        const quickActionsHTML = `
          <div id="injected-quick-actions" style="background: white; padding: 20px; margin: 20px 0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #22c55e;">
            <h3 style="color: #16a34a; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">Quick Actions (Injected)</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              ${dashData.quickActions.map(action => `
                <div onclick="completeQuickAction('${action.id}')" style="
                  background: linear-gradient(135deg, ${action.completed ? '#dcfce7, #bbf7d0' : '#fef3c7, #fed7aa'}); 
                  padding: 16px; 
                  border-radius: 8px; 
                  border: 2px solid ${action.completed ? '#16a34a' : '#f59e0b'}; 
                  cursor: pointer;
                  transition: transform 0.2s;
                  text-align: center;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                  <div style="font-size: 24px; margin-bottom: 8px;">
                    ${getActionEmoji(action.icon)}
                  </div>
                  <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 16px;">${action.title}</div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${action.description}</div>
                  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${action.category} • ${action.completed ? '✅ Completed' : '⏳ Pending'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        
        // Find Quick Actions section and inject
        const quickActionsSection = document.querySelector('h2');
        if (quickActionsSection && quickActionsSection.textContent.includes('Quick Actions')) {
          // Remove existing injected content
          const existing = document.getElementById('injected-quick-actions');
          if (existing) existing.remove();
          
          quickActionsSection.insertAdjacentHTML('afterend', quickActionsHTML);
          console.log('✅ Quick actions injected after heading');
        } else {
          // Inject at top of body
          const existing = document.getElementById('injected-quick-actions');
          if (existing) existing.remove();
          
          document.body.insertAdjacentHTML('afterbegin', quickActionsHTML);
          console.log('✅ Quick actions injected at body start');
        }
        
        // Add completion function to global scope
        window.completeQuickAction = async (actionId) => {
          console.log('🎯 Completing action:', actionId);
          try {
            const response = await fetch(`/api/quick-actions/${actionId}`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ completed: true })
            });
            
            if (response.ok) {
              console.log('✅ Action completed:', actionId);
              // Refresh the injected quick actions
              debugBtn.click();
            } else {
              console.error('❌ Failed to complete action:', actionId);
            }
          } catch (error) {
            console.error('❌ Error completing action:', error);
          }
        };
        
        alert('Quick Actions Injected! Check the page - you should see 4 action boxes.');
        
      } else {
        console.error('❌ No quick actions found in API response');
        alert('No quick actions found in API response');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      alert('Failed to fetch dashboard data: ' + error.message);
    }
  };
  
  document.body.appendChild(debugBtn);
  console.log('✅ Debug button added to page');
  
}, 2000);

// Helper function for action icons
function getActionEmoji(icon) {
  const iconMap = {
    'mood': '😊',
    'pill': '💊', 
    'activity': '🏃',
    'moon': '🌙'
  };
  return iconMap[icon] || '⭐';
}

console.log('🔧 Debug inject script setup complete');