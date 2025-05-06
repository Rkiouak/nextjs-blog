import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'authToken'; // Consider moving to a config file

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null); // Initialize null, check localStorage in effect
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Check localStorage only on the client-side after mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        // If you store user details, parse them here, otherwise set a default
        setUser({ username: 'AuthenticatedUser' }); // Or fetch user details based on token
      }
    } catch (error) {
      console.error("Error reading auth token from localStorage:", error);
      // Handle potential SecurityError in restricted environments
    } finally {
      setIsLoading(false); // Finished initial loading
    }
  }, []); // Run only once on mount

  // Effect to update localStorage and user state when token changes
  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
        // Don't automatically set user here unless you decode the token
        // or fetch user details. For now, let login set the user.
        // Example: Assume token means user is logged in, needs details fetched/decoded
         if (!user) setUser({ username: 'AuthenticatedUser' }); // Basic user if not set
      } catch (error) {
        console.error("Error writing auth token to localStorage:", error);
      }
    } else {
      try {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      } catch (error) {
        console.error("Error removing auth token from localStorage:", error);
      }
    }
  }, [token, user]); // Re-run when token or user potentially changes

  // Centralized handler for Unauthorized (401/403) responses
  // Now focuses on clearing state, not navigating.
  const handleUnauthorized = useCallback(() => {
    console.log("AuthContext: Handling Unauthorized (401/403). Clearing token.");
    setToken(null); // Clear token immediately
    // Navigation should be handled by the component/page that received the 401/403
    // For example: router.push('/login?sessionExpired=true');
  }, []);

  // Login function: returns user info on success, throws error on failure.
  // Does NOT navigate.
  const login = useCallback(async (username, password) => {
    const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/token`;
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Check for specific auth errors first
        if (response.status === 401 || response.status === 403) {
           console.error(`Auth Error (${response.status}) during login.`);
           // Optionally call handleUnauthorized here IF you want state cleared even on failed login attempt
           // handleUnauthorized(); // Depends on desired UX
        }
        // Try to get error details
        let errorMsg = `Login failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) { /* Ignore parsing error */ }
        throw new Error(errorMsg); // Throw error for the page to catch
      }

      const data = await response.json();

      if (data.access_token) {
        setToken(data.access_token);
        const loggedInUser = { username: username }; // Or decode from token if possible
        setUser(loggedInUser);
        return loggedInUser; // Return user/token data on success
      } else {
        throw new Error('Login successful, but no access token received.');
      }

    } catch (error) {
      console.error("Login API call failed:", error);
      // Re-throw the error for the calling component (e.g., LoginPage) to handle
      throw error;
    }
  }, []); // Removed handleUnauthorized from deps as it's stable

  // Logout function: Clears state, does NOT navigate.
  const logout = useCallback(() => {
    console.log("AuthContext: Logging out.");
    setToken(null);
    // Navigation (e.g., to '/') should be handled by the component triggering logout (e.g., Header)
  }, []);

  // Memoize the context value
  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading, // Expose loading state for initial auth check
      login,
      logout,
      handleUnauthorized,
    }),
    [user, token, isLoading, login, logout, handleUnauthorized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
