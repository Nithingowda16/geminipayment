import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  darkMode: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Initialize Auth State & Dark Mode from LocalStorage on Mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Fetch current user from server to verify token freshness
        try {
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          } else {
            // Token invalid or expired
            handleLogout();
          }
        } catch (err) {
          console.error("Failed to authenticate session on startup:", err);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Setup Dark Mode (Disabled: Only light theme is used)
    setDarkMode(false);
    document.documentElement.classList.remove('dark');
  }, []);

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, remember_me: rememberMe })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        
        // Persist session
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed.' };
      }
    } catch (err) {
      return { success: false, message: 'Network connection failed. Make sure server is running.' };
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const toggleDarkMode = () => {
    // No-op: Only light theme is supported
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        darkMode,
        login: handleLogin,
        logout: handleLogout,
        toggleDarkMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
