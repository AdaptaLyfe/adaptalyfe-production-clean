// Debug login API endpoint
async function testLogin() {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('JSON response:', data);
    } else {
      const text = await response.text();
      console.log('Text response:', text);
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the test
testLogin();