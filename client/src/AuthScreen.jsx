import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

function AuthScreen() {
  const { login } = useContext(AuthContext);
  const [isLoginView, setIsLoginView] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLoginView ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`https://smart-job-tracker-w66c.onrender.com${endpoint}`, formData);
      
      // Call the login function from our context with the data from the server
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', background: '#f4f4f4', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
      
      {error && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLoginView && (
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={{ padding: '10px' }} />
        )}
        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={{ padding: '10px' }} />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={{ padding: '10px' }} />
        
        <button type="submit" style={{ padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isLoginView ? 'Log In' : 'Sign Up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        {isLoginView ? "Don't have an account? " : "Already have an account? "}
        <span 
          onClick={() => setIsLoginView(!isLoginView)} 
          style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          {isLoginView ? 'Sign up' : 'Log in'}
        </span>
      </p>
    </div>
  );
}

export default AuthScreen;