import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { apiRequest, setAuthFailureHandler } from '../services/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);


  // ==============================
  // REGISTER AUTH-FAILURE HANDLER
  // (lets api.js log the user out on a failed refresh)
  // ==============================

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
      setIsAuthenticated(false);
    });
  }, []);


  // ==============================
  // RESTORE SESSION
  // ==============================

  useEffect(() => {

    const restoreSession = async () => {

      try {

        const res = await apiRequest(
          'POST',
          '/api/users/me'
        );

        setUser(res.user);
        setIsAuthenticated(true);

      } catch (error) {

        console.log(
          'No active session'
        );

        setUser(null);
        setIsAuthenticated(false);

      } finally {

        setLoading(false);

      }
    };

    restoreSession();

  }, []);


  // ==============================
  // FETCH USER AFTER LOGIN
  // ==============================

  const fetchUser = async () => {

    try {

      const res = await apiRequest(
        'POST',
        '/api/users/me'
      );

      setUser(res.user);
      setIsAuthenticated(true);

      return res.user;

    } catch (error) {

      console.error(
        'Fetch user failed:',
        error.message
      );

      setUser(null);
      setIsAuthenticated(false);

      throw error;
    }
  };


  // ==============================
  // LOGOUT
  // ==============================

  const logout = async () => {

    try {

      await apiRequest(
        'POST',
        '/api/auth/logout'
      );

    } catch (error) {

      console.error(
        'Logout failed:',
        error.message
      );

    } finally {

      setUser(null);
      setIsAuthenticated(false);

    }
  };


  const value = {
    user,
    isAuthenticated,
    loading,
    fetchUser,
    logout,
  };


  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => {

  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      'useUser must be used inside UserProvider'
    );
  }

  return context;
};