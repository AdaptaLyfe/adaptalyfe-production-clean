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
        
        // Create quick actions matching the exact HTML structure from screenshot
        const quickActionsHTML = `
          ${dashData.quickActions.map(action => `
            <div class="card" onclick="completeQuickAction('${action.id}')" style="cursor: pointer;">
              <div class="title">${getActionIcon(action.icon)} ${action.title}</div>
              <div class="desc">${action.description}</div>
            </div>
          `).join('')}
        `;
        
        // Remove existing injected content  
        const existing = document.getElementById('injected-quick-actions');
        if (existing) existing.remove();
        
        // Find the content div that holds all the cards
        const contentDiv = document.querySelector('div.content') || 
                          document.querySelector('[class="content"]') ||
                          document.querySelector('div').classList?.contains('content');
        
        if (contentDiv) {
          // Add quick action cards directly to the content area
          contentDiv.insertAdjacentHTML('beforeend', quickActionsHTML);
          console.log('✅ Quick actions added to content area');
        } else {
          // Look for existing cards and add quick actions alongside them
          const existingCards = document.querySelectorAll('.card');
          if (existingCards.length > 0) {
            // Insert after the last existing card
            const lastCard = existingCards[existingCards.length - 1];
            lastCard.insertAdjacentHTML('afterend', quickActionsHTML);
            console.log('✅ Quick actions added after existing cards');
          } else {
            // Fallback: find any div that contains cards based on the HTML structure
            const cardContainer = Array.from(document.querySelectorAll('div')).find(div => 
              div.innerHTML && (div.innerHTML.includes('class="card"') || div.innerHTML.includes('Daily Tasks'))
            );
            
            if (cardContainer) {
              cardContainer.insertAdjacentHTML('beforeend', quickActionsHTML);
              console.log('✅ Quick actions added to card container');
            }
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