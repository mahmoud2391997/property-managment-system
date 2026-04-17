// Test Next.js Login API Directly

async function testLoginAPI() {
  console.log('Testing Next.js login API...')
  
  try {
    // Create form data as the login form would
    const formData = new FormData()
    formData.append('email', 'staffuser0@example.com')
    formData.append('password', 'ChangeMe123!')
    
    // Call the login action directly
    const response = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual' // Don't follow redirects
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 307) {
      const location = response.headers.get('location')
      console.log('Redirect location:', location)
      console.log('Login successful - redirecting to:', location)
    } else if (response.status === 400) {
      const errorText = await response.text()
      console.log('Login error:', errorText)
    } else {
      const responseText = await response.text()
      console.log('Unexpected response:', responseText)
    }
    
  } catch (error) {
    console.error('Login API test error:', error)
  }
}

testLoginAPI()
