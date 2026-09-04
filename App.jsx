import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { UserProvider, useUser } from './context/UserContext';

import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';


function AppContent() {

  const {
    isAuthenticated,
    loading,
  } = useUser();


  if (loading) {
    return null;
  }


  return (
    <NavigationContainer>

      {isAuthenticated
        ? <AppNavigator />
        : <AuthNavigator />
      }

    </NavigationContainer>
  );
}


export default function App() {

  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}