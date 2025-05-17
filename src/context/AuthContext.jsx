// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router'; // Import router for potential use in handleUnauthorized if needed elsewhere

const AuthContext = createContext(null);
const TOKEN_KEY = 'authToken';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // Will store user details { username, email, ... }
  const [isLoading, setIsLoading] = useState(true); // For initial token and user loading

  const fetchUserDetails = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setIsLoading(false); // Ensure loading stops if no token
      return;
    }
    // Temporarily set isLoading to true for this specific fetch,
    // though global isLoading might already cover it.
    // setIsLoading(true); // Re-enable if distinct loading states are needed per fetch
    try {
      const profileUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/me/`;
      const response = await fetch(profileUrl, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        console.warn('AuthContext: fetchUserDetails - Unauthorized. Clearing token.');
        localStorage.removeItem(TOKEN_KEY); // Explicitly remove invalid token
        setToken(null);
        setUser(null);
        // Optionally trigger a global unauthorized handler if needed beyond context
        // handleUnauthorized(); // No, this would cause a loop if called from here directly
        return; // Stop further processing
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user details.' }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData); // Store full user object
    } catch (error) {
      console.error("AuthContext: Failed to fetch user details:", error);
      setUser(null); // Clear user on error
      // If the error was due to an invalid token, it should be cleared above.
      // If it's another type of error, we might not want to clear the token immediately,
      // unless we are sure the token is the cause.
    } finally {
      // Global isLoading should be set to false after initial attempt
      // For subsequent fetches (e.g. after login), this isLoading might not be the primary concern.
      setIsLoading(false); // Ensure loading is false after attempt
    }
  }, []); // No dependencies that would cause re-creation issues here

  // Effect for initial loading of token and user details from localStorage
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); // Start loading
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        if (isMounted) { // Check if component is still mounted
          fetchUserDetails(storedToken).then(() => {
            if (isMounted) setIsLoading(false);
          });
        }
      } else {
        if (isMounted) setIsLoading(false); // No token, stop loading
      }
    } catch (error) {
      console.error("Error reading auth token from localStorage:", error);
      if (isMounted) setIsLoading(false); // Stop loading on error
    }
    return () => { isMounted = false; };
  }, [fetchUserDetails]); // fetchUserDetails is stable due to useCallback

  // Effect to update localStorage when token changes (but not user object directly)
  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (error) {
        console.error("Error writing auth token to localStorage:", error);
      }
    } else {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (error) {
        console.error("Error removing auth token from localStorage:", error);
      }
    }
  }, [token]);

  const handleUnauthorized = useCallback(() => {
    console.log("AuthContext: Handling Unauthorized (401/403). Clearing token and user.");
    setToken(null);
    setUser(null);
    // Navigation should be handled by the component/page.
    // Example: router.push('/login?sessionExpired=true');
  }, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true); // Indicate loading during login process
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
        let errorMsg = `Login failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) { /* Ignore parsing error */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (data.access_token) {
        setToken(data.access_token); // This will trigger the useEffect to save to localStorage
        await fetchUserDetails(data.access_token); // Fetch user details with the new token
        // Login function now resolves with the user object or true/void
        // We rely on fetchUserDetails to set the user state.
        // The calling component (LoginPage) will handle navigation.
        return true; // Indicate success
      } else {
        throw new Error('Login successful, but no access token received.');
      }
    } catch (error) {
      console.error("Login API call failed:", error);
      handleUnauthorized(); // Clear any potentially partially set auth state on login failure
      throw error; // Re-throw for LoginPage to handle
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserDetails, handleUnauthorized]);

  const logout = useCallback(() => {
    console.log("AuthContext: Logging out.");
    setToken(null);
    setUser(null);
    // Navigation (e.g., to '/') handled by the component triggering logout
  }, []);

  const value = useMemo(
      () => ({
        user, // Now contains full user details { username, email, ... }
        token,
        isAuthenticated: !!token && !!user, // Consider user also for isAuthenticated
        isLoading,
        login,
        logout,
        handleUnauthorized,
      }),
      [user, token, isLoading, login, logout, handleUnauthorized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}