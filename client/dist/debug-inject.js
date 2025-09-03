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
        
        // Create quick actions HTML - restored working version
        const quickActionsHTML = `
          <div id="injected-quick-actions" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
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
                  ${getActionIcon(action.icon)}
                </div>
                <div style="font-weight: bold; color: #333; margin-bottom: 4px; font-size: 16px;">${action.title}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${action.description}</div>
                <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${action.category} • ${action.completed ? '✅ Done' : '⏳ Pending'}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        
        // Remove existing injected content  
        const existing = document.getElementById('injected-quick-actions');
        if (existing) existing.remove();
        
        // Find the exact Quick Actions section more precisely
        const quickActionsHeading = Array.from(document.querySelectorAll('h1, h2, h3')).find(el => 
          el.textContent && el.textContent.trim() === 'Quick Actions'
        );
        
        if (quickActionsHeading) {
          // Look for Today's Summary card to replace
          const todaysSummaryCard = document.querySelector('div').innerText?.includes("Today's Summary");
          let targetElement = quickActionsHeading.nextElementSibling;
          
          // Find the container that should hold the quick actions
          while (targetElement) {
            if (targetElement.textContent?.includes("Today's Summary") || 
                targetElement.textContent?.includes("Daily Progress") ||
                targetElement.querySelector('[class*="summary"]')) {
              break;
            }
            targetElement = targetElement.nextElementSibling;
          }
          
          if (targetElement) {
            // Replace the content of the found container
            targetElement.innerHTML = quickActionsHTML;
            console.log('✅ Quick actions replaced content in dashboard section');
          } else {
            // Create new container in the correct location
            const container = document.createElement('div');
            container.innerHTML = quickActionsHTML;
            container.style.cssText = 'margin: 16px 0;';
            quickActionsHeading.insertAdjacentElement('afterend', container);
            console.log('✅ Quick actions inserted after heading');
          }
        } else {
          console.log('❌ Could not find Quick Actions heading');
          // Emergency fallback - find any element with "Quick Actions" text
          const anyQuickActions = Array.from(document.querySelectorAll('*')).find(el => 
            el.textContent?.includes('Quick Actions') && el.tagName.match(/H[1-6]/)
          );
          
          if (anyQuickActions) {
            const container = document.createElement('div');
            container.innerHTML = quickActionsHTML;
            container.style.cssText = 'margin: 16px 0;';
            anyQuickActions.insertAdjacentElement('afterend', container);
            console.log('✅ Quick actions inserted after found heading');
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