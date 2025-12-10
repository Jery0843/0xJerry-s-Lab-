'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTerminal, FaSearch, FaCog, FaUser, FaLock, FaBars, FaTimes, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import SearchModal from './SearchModal';

interface AdminUser {
  id: number;
  username: string;
  last_login?: string;
}

const Header = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', otp: '' });
  const [adminLoginForm, setAdminLoginForm] = useState({ username: '', password: '' });
  const [setupForm, setSetupForm] = useState({ username: '', password: '', confirmPassword: '', setupKey: '' });
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [userSession, setUserSession] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [hasAdminUser, setHasAdminUser] = useState(true);

  // Check sessions on component mount
  useEffect(() => {
    checkAdminSession();
    checkAdminUserExists();
    checkUserSession();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') {
      setShowLoginModal(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserDropdown]);

  const checkAdminSession = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAdminMode(true);
        setAdminUser(data.user || null);
      } else {
        setIsAdminMode(false);
        setAdminUser(null);
        // Clear any stale session cookie
        document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      setIsAdminMode(false);
      setAdminUser(null);
      // Clear any stale session cookie
      document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  const checkAdminUserExists = async () => {
    try {
      const response = await fetch('/api/admin/setup');
      const data = await response.json();
      setHasAdminUser(data.hasAdminUser);
    } catch (error) {
      console.error('Error checking admin user existence:', error);
    }
  };

  const checkUserSession = async () => {
    try {
      const response = await fetch('/api/user/session', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUserSession(data.user);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    }
  };

  const handleLoginToggle = () => {
    if (userSession) {
      setShowUserDropdown(!showUserDropdown);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleUserLogout = async () => {
    try {
      await fetch('/api/user/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUserSession(null);
      document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setShowUserDropdown(false);
      window.location.href = '/';
    } catch (error) {
      console.error('User logout error:', error);
    }
  };

  const handleAdminToggle = () => {
    if (isAdminMode) {
      handleAdminLogout();
    } else {
      if (!hasAdminUser) {
        setShowSetupModal(true);
      } else {
        setShowAdminModal(true);
      }
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (loginStep === 'email') {
        // Check if email is admin username
        if (loginForm.email && !loginForm.email.includes('@')) {
          // This is admin login
          setShowLoginModal(false);
          setAdminLoginForm({ username: loginForm.email, password: '' });
          setShowAdminModal(true);
          setLoginForm({ email: '', otp: '' });
          setLoginStep('email');
          return;
        }
        
        // Send OTP for regular user
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginForm.email, purpose: 'login' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setLoginStep('otp');
        } else {
          setError(data.error || 'Failed to send OTP');
        }
      } else {
        // Verify OTP
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            email: loginForm.email, 
            otp: loginForm.otp,
            machineId: 'login'
          })
        });
        
        if (response.ok) {
          // Set user session cookie
          const sessionToken = Buffer.from(`${loginForm.email}:${Date.now()}`).toString('base64');
          document.cookie = `user_session=${sessionToken}; path=/; max-age=${24*60*60}; SameSite=Strict`;
          
          setShowLoginModal(false);
          setLoginForm({ email: '', otp: '' });
          setLoginStep('email');
          window.location.href = '/dashboard';
        } else {
          const data = await response.json();
          setError(data.error || 'Invalid OTP');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(adminLoginForm)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAdminMode(true);
        setAdminUser(data.user);
        setShowAdminModal(false);
        setAdminLoginForm({ username: '', password: '' });
        window.dispatchEvent(new Event('adminModeChanged'));
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (setupForm.password !== setupForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: setupForm.username,
          password: setupForm.password,
          setupKey: setupForm.setupKey
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setHasAdminUser(true);
        setShowSetupModal(false);
        setSetupForm({ username: '', password: '', confirmPassword: '', setupKey: '' });
        setTimeout(() => {
          setShowAdminModal(true);
        }, 500);
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/auth', { 
        method: 'DELETE',
        credentials: 'include'
      });
      setIsAdminMode(false);
      setAdminUser(null);
      document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.dispatchEvent(new Event('adminModeChanged'));
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="glass-panel backdrop-blur-sm sticky top-0 z-[100]">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <FaTerminal className="text-cyber-green text-xl sm:text-2xl group-hover:animate-pulse" />
              <span className="text-base sm:text-xl font-cyber font-bold" data-text="0xJerry&apos;s Lab">
                0xJerry&apos;s Lab
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link 
                href="/" 
                className="hover:text-cyber-blue transition-colors duration-300 hover:glow text-sm xl:text-base"
              >
                ~/home
              </Link>
              <Link 
                href="/machines" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./writeups
              </Link>
              <Link 
                href="/membership" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./membership
              </Link>
              <Link 
                href="/news" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./news
              </Link>
              <Link 
                href="/forums" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./forums
              </Link>
              <Link 
                href="/tools" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./tools
              </Link>

              <Link 
                href="/about" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
              >
                ./about
              </Link>
              <Link 
                href="https://jerome.is-a.dev/contact" 
                className="hover:text-cyber-blue transition-colors duration-300 text-sm xl:text-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                ./contact
              </Link>
            </nav>

            {/* Desktop Admin & Search */}
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-4">
              <button 
                className="text-cyber-green hover:text-cyber-blue transition-colors p-2"
                title="Search"
                onClick={() => setShowSearchModal(true)}
              >
                <FaSearch className="text-sm lg:text-base" />
              </button>
              <div className="relative">
                <button 
                  onClick={isAdminMode ? handleAdminToggle : handleLoginToggle}
                  className={`transition-all duration-500 p-3 text-sm lg:text-base ${
                    isAdminMode 
                      ? 'text-cyber-pink hover:text-red-400' 
                      : userSession 
                        ? 'text-cyber-blue hover:text-cyber-green text-xl lg:text-2xl'
                        : 'text-cyber-green hover:text-cyber-blue bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 backdrop-blur-md border border-cyan-400/30 rounded-lg hover:from-cyan-300/30 hover:via-blue-400/30 hover:to-purple-500/30 hover:border-cyan-300/50 hover:shadow-2xl hover:shadow-cyan-400/30 hover:scale-105 transform'
                  }`}
                  title={isAdminMode ? 'Logout' : (userSession ? 'User Menu' : 'Login')}
                >
                  {isAdminMode ? 'Logout' : (userSession ? <FaUserCircle /> : 'Login')}
                </button>
                {showUserDropdown && userSession && (
                  <div className="absolute right-0 top-full mt-2 bg-black/80 backdrop-blur-sm border border-cyber-green/50 rounded-lg shadow-xl z-50 min-w-[150px]">
                    <button
                      onClick={() => {
                        window.location.href = '/dashboard';
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-cyber-green hover:bg-cyber-green/20 transition-colors rounded-t-lg"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleUserLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors border-t border-cyber-green/30 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button & Controls */}
            <div className="flex items-center space-x-2 sm:hidden">
              <button 
                className="text-cyber-green hover:text-cyber-blue transition-colors p-2"
                title="Search"
                onClick={() => setShowSearchModal(true)}
              >
                <FaSearch className="text-sm" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-cyber-green hover:text-cyber-blue transition-colors p-2"
                title="Menu"
              >
                {showMobileMenu ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="lg:hidden mt-4 pb-4 border-t border-cyber-green/30 pt-4">
              <nav className="flex flex-col space-y-3">
                <Link 
                  href="/" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ~/home
                </Link>
                <Link 
                  href="/machines" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./writeups
                </Link>
                <Link 
                  href="/membership" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./membership
                </Link>
                <Link 
                  href="/news" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./news
                </Link>
                <Link 
                  href="/forums" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./forums
                </Link>
                <Link 
                  href="/tools" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./tools
                </Link>

                <Link 
                  href="/about" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  ./about
                </Link>
                <Link 
                  href="https://jerome.is-a.dev/contact" 
                  className="text-sm hover:text-cyber-blue transition-colors py-2"
                  onClick={() => setShowMobileMenu(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ./contact
                </Link>
                
                {/* Mobile Login Button */}
                <div className="pt-3 border-t border-cyber-green/30 mt-3 space-y-2">
                  {!isAdminMode && userSession ? (
                    <>
                      <button 
                        onClick={() => {
                          window.location.href = '/dashboard';
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-2 text-sm text-cyber-green hover:text-cyber-blue transition-colors py-2"
                      >
                        <FaUserCircle />
                        <span>Dashboard</span>
                      </button>
                      <button 
                        onClick={() => {
                          handleUserLogout();
                          setShowMobileMenu(false);
                        }}
                        className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 transition-colors py-2"
                      >
                        <FaSignOutAlt />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        if (isAdminMode) {
                          handleAdminToggle();
                        } else {
                          handleLoginToggle();
                        }
                        setShowMobileMenu(false);
                      }}
                      className={`flex items-center space-x-2 text-xs transition-all duration-500 py-2 px-3 rounded-lg ${
                        isAdminMode 
                          ? 'text-cyber-pink' 
                          : 'text-cyber-green hover:text-cyber-blue bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 backdrop-blur-md border border-cyan-400/30 hover:from-cyan-300/30 hover:via-blue-400/30 hover:to-purple-500/30 hover:border-cyan-300/50 hover:shadow-2xl hover:shadow-cyan-400/30 hover:scale-105 transform'
                      }`}
                    >
                      <FaUser />
                      <span>{isAdminMode ? 'Logout' : 'Login'}</span>
                    </button>
                  )}
                </div>
              </nav>
            </div>
          )}

          {/* Tablet Navigation - visible on md screens only */}
          <nav className="hidden sm:flex lg:hidden mt-4 flex-wrap gap-3 sm:gap-4 border-t border-cyber-green/30 pt-3">
            <Link href="/" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">~/home</Link>
            <Link href="/machines" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./writeups</Link>
            <Link href="/membership" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./membership</Link>
            <Link href="/news" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./news</Link>
            <Link href="/forums" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./forums</Link>
            <Link href="/tools" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./tools</Link>

            <Link href="/about" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors">./about</Link>
            <Link href="https://jerome.is-a.dev/contact" className="text-xs sm:text-sm hover:text-cyber-blue transition-colors" target="_blank" rel="noopener noreferrer">./contact</Link>
            
            {/* Tablet Login Button */}
            {!isAdminMode && userSession ? (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex items-center space-x-1 text-xs sm:text-sm text-cyber-green hover:text-cyber-blue transition-colors"
                >
                  <FaUserCircle />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={handleUserLogout}
                  className="flex items-center space-x-1 text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={isAdminMode ? handleAdminToggle : handleLoginToggle}
                className={`flex items-center space-x-1 text-xs transition-all duration-500 px-2 py-1 rounded-lg ${
                  isAdminMode 
                    ? 'text-cyber-pink' 
                    : 'text-cyber-green hover:text-cyber-blue bg-gradient-to-br from-cyan-400/20 via-blue-500/20 to-purple-600/20 backdrop-blur-md border border-cyan-400/30 hover:from-cyan-300/30 hover:via-blue-400/30 hover:to-purple-500/30 hover:border-cyan-300/50 hover:shadow-2xl hover:shadow-cyan-400/30 hover:scale-105 transform'
                }`}
              >
                <FaUser />
                <span>{isAdminMode ? 'Logout' : 'Login'}</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* User Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-card-bg border border-cyber-green p-4 sm:p-6 rounded-lg max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">
              <span data-text={loginStep === 'email' ? 'LOGIN' : 'VERIFY OTP'}>
                {loginStep === 'email' ? 'LOGIN' : 'VERIFY OTP'}
              </span>
            </h3>
            {error && (
              <div className="mb-3 sm:mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleUserLogin}>
              <div className="mb-3 sm:mb-4 space-y-3">
                {loginStep === 'email' ? (
                  <>
                    <input
                      type="text"
                      placeholder="Email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                      required
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={loginForm.otp}
                      onChange={(e) => setLoginForm({...loginForm, otp: e.target.value})}
                      className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base text-center tracking-widest"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Check your email ({loginForm.email}) for the OTP code
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyber-green text-terminal-bg py-2 px-4 rounded hover:bg-cyber-blue transition-colors font-bold disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'PROCESSING...' : (loginStep === 'email' ? 'SEND OTP' : 'VERIFY')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginForm({ email: '', otp: '' });
                    setLoginStep('email');
                    setError('');
                  }}
                  className="flex-1 bg-transparent border border-cyber-green text-cyber-green py-2 px-4 rounded hover:bg-cyber-green hover:text-terminal-bg transition-colors text-sm sm:text-base"
                >
                  CANCEL
                </button>
              </div>
              {loginStep === 'otp' && (
                <button
                  type="button"
                  onClick={() => setLoginStep('email')}
                  className="w-full mt-2 text-xs text-cyber-blue hover:text-cyber-green transition-colors"
                >
                  ← Back to email
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-card-bg border border-cyber-green p-4 sm:p-6 rounded-lg max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">
              <span data-text="ADMIN ACCESS REQUIRED">
                ADMIN ACCESS REQUIRED
              </span>
            </h3>
            {error && (
              <div className="mb-3 sm:mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAdminLogin}>
              <div className="mb-3 sm:mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={adminLoginForm.username}
                  onChange={(e) => setAdminLoginForm({...adminLoginForm, username: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={adminLoginForm.password}
                  onChange={(e) => setAdminLoginForm({...adminLoginForm, password: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyber-green text-terminal-bg py-2 px-4 rounded hover:bg-cyber-blue transition-colors font-bold disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'AUTHENTICATING...' : 'ACCESS'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminLoginForm({ username: '', password: '' });
                    setError('');
                  }}
                  className="flex-1 bg-transparent border border-cyber-green text-cyber-green py-2 px-4 rounded hover:bg-cyber-green hover:text-terminal-bg transition-colors text-sm sm:text-base"
                >
                  ABORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-card-bg border border-cyber-green p-4 sm:p-6 rounded-lg max-w-md w-full">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-center">
              <span data-text="ADMIN SETUP REQUIRED">
                ADMIN SETUP REQUIRED
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 text-center">
              Create the first admin user for this system.
            </p>
            {error && (
              <div className="mb-3 sm:mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAdminSetup}>
              <div className="mb-3 sm:mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Setup Key"
                  value={setupForm.setupKey}
                  onChange={(e) => setSetupForm({...setupForm, setupKey: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
                <input
                  type="text"
                  placeholder="Admin Username"
                  value={setupForm.username}
                  onChange={(e) => setSetupForm({...setupForm, username: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={setupForm.password}
                  onChange={(e) => setSetupForm({...setupForm, password: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={setupForm.confirmPassword}
                  onChange={(e) => setSetupForm({...setupForm, confirmPassword: e.target.value})}
                  className="w-full bg-terminal-bg border border-cyber-green/50 p-2 sm:p-3 rounded text-cyber-green focus:border-cyber-green focus:outline-none text-sm sm:text-base"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyber-green text-terminal-bg py-2 px-4 rounded hover:bg-cyber-blue transition-colors font-bold disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? 'CREATING...' : 'CREATE ADMIN'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSetupModal(false);
                    setSetupForm({ username: '', password: '', confirmPassword: '', setupKey: '' });
                    setError('');
                  }}
                  className="flex-1 bg-transparent border border-cyber-green text-cyber-green py-2 px-4 rounded hover:bg-cyber-green hover:text-terminal-bg transition-colors text-sm sm:text-base"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearchModal} 
        onClose={() => setShowSearchModal(false)} 
      />
    </>
  );
};

export default Header;
