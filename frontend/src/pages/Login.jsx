import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Code2, Sparkles, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

const LoginPage = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin) {
      if (!formData.username) {
        newErrors.username = 'Username is required';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // backend uses /auth/* routes and sets an httpOnly cookie on success
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';

      // For signup, backend expects `name` instead of `username` key
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.username, email: formData.email, password: formData.password };

      const backendUrl = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.protocol}//${window.location.hostname}/api`
        : `${window.location.protocol}//${window.location.hostname}:5000`
      );
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // server returns { success: true } on success
      if (data && data.success) {
        // Clear guest flag - user is now authenticated
        localStorage.removeItem('devstudio_demo');
        console.log("✅ Guest flag cleared - user is authenticated");
        
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('devstudio_token', data.token);
          console.log("✅ Token stored in localStorage");
        }
        
        // Store user info
        if (data.user) {
          localStorage.setItem('devstudio_user', JSON.stringify(data.user));
          console.log("✅ User stored in localStorage");
        }
        
        // after login, fetch the user profile using the session cookie
        if (isLogin) {
          try {
            const meRes = await fetch(`${backendUrl}/auth/me`, { credentials: 'include' });
            const meData = await meRes.json();
            if (meData && meData.user) {
              localStorage.setItem('devstudio_user', JSON.stringify(meData.user));
            }
          } catch (err) {
            console.warn('Failed to fetch /auth/me', err);
          }
        }

        setErrors({ submit: (data.message || (isLogin ? 'Login successful' : 'Signup successful')) });
        setTimeout(() => navigate('/editor'), 800);
      } else {
        setErrors({ submit: data.message || 'Authentication failed' });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ submit: 'Unable to connect to server. Please ensure the backend is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join DevStudio'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Login to continue coding' : 'Create your account'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg transition-all font-semibold ${
                isLogin
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg transition-all font-semibold ${
                !isLogin
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Choose a username"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {errors.submit && (
              <div className={`px-4 py-3 rounded-xl ${
                errors.submit.includes('successful') 
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {errors.submit}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  {isLogin ? 'Login to DevStudio' : 'Create Account'}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 font-semibold transition"
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.setItem('devstudio_demo', 'true');
                navigate('/editor');
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition font-medium"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 DevStudio - Professional Code Editor
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
