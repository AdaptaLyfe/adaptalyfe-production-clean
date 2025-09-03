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
        
        // Create quick actions HTML matching dashboard design
        const quickActionsHTML = `
          <div id="injected-quick-actions" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 16px 0;">
            ${dashData.quickActions.map(action => `
              <div onclick="completeQuickAction('${action.id}')" style="
                background: ${action.completed ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)'};
                border: 1px solid ${action.completed ? '#16a34a' : '#d97706'};
                border-radius: 12px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                position: relative;
                overflow: hidden;
              " 
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)'" 
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0, 0, 0, 0.1)'">
                <div style="font-size: 32px; margin-bottom: 12px; opacity: 0.9;">
                  ${getActionEmoji(action.icon)}
                </div>
                <div style="font-weight: 600; color: #1f2937; margin-bottom: 6px; font-size: 16px;">
                  ${action.title}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;">
                  ${action.description}
                </div>
                <div style="
                  background: ${action.completed ? '#16a34a' : '#d97706'};
                  color: white;
                  font-size: 10px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  padding: 4px 8px;
                  border-radius: 12px;
                  display: inline-block;
                ">
                  ${action.completed ? '✓ Complete' : '○ Pending'}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Find the exact Quick Actions section and inject in the right place
        const quickActionsHeading = document.querySelector('h2');
        const todaysSummary = document.querySelector('[class*="summary"]') || document.querySelector('[class*="Summary"]');
        
        // Remove existing injected content
        const existing = document.getElementById('injected-quick-actions');
        if (existing) existing.remove();
        
        if (quickActionsHeading && quickActionsHeading.textContent.includes('Quick Actions')) {
          // Look for the container that holds Today's Summary and inject alongside it
          const parentContainer = quickActionsHeading.parentElement;
          if (parentContainer) {
            // Create a flex container to hold both Today's Summary and Quick Actions
            const flexContainer = document.createElement('div');
            flexContainer.style.cssText = 'display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;';
            flexContainer.innerHTML = quickActionsHTML;
            
            quickActionsHeading.insertAdjacentElement('afterend', flexContainer);
            console.log('✅ Quick actions injected in proper dashboard location');
          }
        } else {
          // Fallback: inject after the greeting section
          const greetingSection = document.querySelector('[class*="greeting"]') || 
                                  document.querySelector('.dark') || 
                                  document.querySelector('h1');
          if (greetingSection) {
            greetingSection.insertAdjacentHTML('afterend', `
              <div style="margin: 20px; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Quick Actions</h2>
                ${quickActionsHTML}
              </div>
            `);
            console.log('✅ Quick actions injected after greeting with proper styling');
          }
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

// Helper function for action icons with better medical app icons
function getActionEmoji(icon) {
  const iconMap = {
    'mood': '😌',
    'pill': '💊', 
    'activity': '🏃‍♀️',
    'moon': '🌙'
  };
  return iconMap[icon] || '⭐';
}

console.log('🔧 Debug inject script setup complete');