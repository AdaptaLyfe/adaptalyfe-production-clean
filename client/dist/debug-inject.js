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
        
        // Create compact quick actions matching existing dashboard cards
        const quickActionsHTML = `
          <div id="injected-quick-actions" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; width: 100%;">
            ${dashData.quickActions.map(action => `
              <div onclick="completeQuickAction('${action.id}')" style="
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.15s ease;
                min-height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
              " 
              onmouseover="this.style.borderColor='#3b82f6'; this.style.background='#f1f5f9'" 
              onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 16px;">${getActionIcon(action.icon)}</div>
                  <div style="font-weight: 500; color: #1e293b; font-size: 14px;">${action.title}</div>
                </div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                  ${action.description}
                </div>
                <div style="position: absolute; top: 12px; right: 12px;">
                  ${action.completed ? 
                    '<div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>' : 
                    '<div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>'
                  }
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Remove existing injected content
        const existing = document.getElementById('injected-quick-actions');
        if (existing) existing.remove();
        
        // Find the Quick Actions section and replace the empty content
        const quickActionsHeading = Array.from(document.querySelectorAll('h2, h3')).find(el => 
          el.textContent.includes('Quick Actions')
        );
        
        if (quickActionsHeading) {
          // Look for the container after the heading that might contain Today's Summary
          let targetContainer = quickActionsHeading.nextElementSibling;
          
          // Find the right container - look for one that contains Today's Summary or is empty
          while (targetContainer && !targetContainer.textContent.includes("Today's Summary") && targetContainer.children.length > 0) {
            targetContainer = targetContainer.nextElementSibling;
          }
          
          if (targetContainer) {
            // Replace the content of this container with our quick actions
            targetContainer.innerHTML = quickActionsHTML;
            targetContainer.style.cssText = 'margin-top: 16px;';
            console.log('✅ Quick actions replaced existing content in dashboard section');
          } else {
            // Create new container right after the heading
            const newContainer = document.createElement('div');
            newContainer.style.cssText = 'margin-top: 16px;';
            newContainer.innerHTML = quickActionsHTML;
            quickActionsHeading.insertAdjacentElement('afterend', newContainer);
            console.log('✅ Quick actions added in new container after heading');
          }
        } else {
          console.log('❌ Could not find Quick Actions heading - using fallback positioning');
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

// Helper function for action icons matching dashboard style
function getActionIcon(icon) {
  const iconMap = {
    'mood': '😊',
    'pill': '💊', 
    'activity': '🏃',
    'moon': '🌙'
  };
  return iconMap[icon] || '📋';
}

console.log('🔧 Debug inject script setup complete');