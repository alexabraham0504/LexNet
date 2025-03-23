const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await api.post('/api/users/login', { email, password });
    
    if (response.data.success) {
      const { token } = response.data;
      
      // Log token details
      console.log('Login successful, token received:', token.substring(0, 20) + '...');
      
      // Store token in session storage
      sessionStorage.setItem('token', token);
      
      // Verify token was stored
      const storedToken = sessionStorage.getItem('token');
      console.log('Token stored successfully:', storedToken === token);
      
      // Continue with login process
      toast.success('Login successful');
      navigate('/lawyer/dashboard');
    } else {
      toast.error(response.data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    toast.error(error.response?.data?.message || 'Login failed. Please try again.');
  }
}; 