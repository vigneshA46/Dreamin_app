import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from '../screens/auth/Login';
import Terms from '../screens/app/Terms';
import Privacy from '../screens/app/Privacy';
import Signup from '../screens/app/Signup';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={Login}
      />

      <Stack.Screen
        name="Signup"
        component={Signup}
      />

      <Stack.Screen
        name="Terms"
        component={Terms}
      />

      <Stack.Screen
        name="Privacy"
        component={Privacy}
      />
    </Stack.Navigator>
  );
}