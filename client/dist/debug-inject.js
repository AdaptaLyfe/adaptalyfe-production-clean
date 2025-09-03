// Debug script to inject quick actions directly into dashboard
console.log('🔧 Debug inject script loaded');

// Wait for page to load
setTimeout(() => {
  console.log('🔧 Starting debug injection...');
  
  // Add multiple debug buttons for testing different positions
  const debugBtn = document.createElement('button');
  debugBtn.innerHTML = 'INJECT QUICK ACTIONS';
  debugBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:red;color:white;padding:15px;border:none;cursor:pointer;font-weight:bold;border-radius:5px;';
  
  // Add DOM inspection button
  const inspectBtn = document.createElement('button');
  inspectBtn.innerHTML = 'INSPECT DOM';
  inspectBtn.style.cssText = 'position:fixed;top:70px;right:10px;z-index:9999;background:blue;color:white;padding:10px;border:none;cursor:pointer;font-weight:bold;border-radius:5px;';
  inspectBtn.onclick = () => {
    console.log('=== DOM INSPECTION ===');
    console.log('All headings:', Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
      tag: h.tagName,
      text: h.textContent.trim(),
      element: h
    })));
    
    console.log('Quick Actions related elements:', Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('Quick Actions')
    ));
    
    console.log('Today\'s Summary elements:', Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('Today\'s Summary')
    ));
    
    console.log('Dashboard structure:', document.querySelector('main') || document.querySelector('[class*="dashboard"]') || document.body);
  };
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
        
        // Create quick actions exactly as they appeared when working perfectly
        const quickActionsHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f0f0f0;
            border-bottom: 2px solid #ddd;
            z-index: 1000;
            padding: 10px;
          ">
            <div style="color: #16a34a; font-weight: bold; margin-bottom: 10px; text-align: left;">
              Quick Actions (Injected)
            </div>
            <div style="
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              max-width: 1200px;
              margin: 0 auto;
            ">
              ${dashData.quickActions.map(action => `
                <div onclick="completeQuickAction('${action.id}')" style="
                  background: ${action.completed ? '#dcfce7' : '#fef3c7'};
                  border: 2px solid ${action.completed ? '#16a34a' : '#f59e0b'};
                  border-radius: 8px;
                  padding: 16px;
                  text-align: center;
                  cursor: pointer;
                  transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                  <div style="font-size: 24px; margin-bottom: 8px;">
                    ${getActionIcon(action.icon)}
                  </div>
                  <div style="font-weight: bold; color: #333; font-size: 16px; margin-bottom: 4px;">
                    ${action.title}
                  </div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    ${action.description}
                  </div>
                  <div style="font-size: 10px; color: #888; text-transform: uppercase;">
                    ${action.category} • ${action.completed ? 'COMPLETED' : 'PENDING'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
        
        // Remove existing injected content  
        const existing = document.getElementById('injected-quick-actions');
        if (existing) existing.remove();
        
        // Inject at the very top of the page as in the working screenshot
        document.body.insertAdjacentHTML('afterbegin', quickActionsHTML);
        
        // Add some padding to the body to account for the fixed header
        document.body.style.paddingTop = '160px';
        
        console.log('✅ Quick actions injected at top of page exactly as in working state');
        
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
  document.body.appendChild(inspectBtn);
  console.log('✅ Debug buttons added to page');
  
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