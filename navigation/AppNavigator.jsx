import React from 'react';
import { View, Platform } from 'react-native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { Feather } from '@expo/vector-icons';

import Home from '../screens/app/Home';
import Strategies from '../screens/app/Strategies';
import Reports from '../screens/app/Reports';
import Profile from '../screens/app/Profile';
import Brokers from '../screens/app/Brokers';
import DematAccount from '../screens/app/DematAccount';
import ChangePassword from '../screens/app/ChangePassword';
import About from '../screens/app/About';
import Tutorials from '../screens/app/Tutorials';
import Privacy from '../screens/app/Privacy';
import Terms from '../screens/app/Terms';
import Plans from '../screens/app/Plans';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


const COLORS = {
  active: '#000',
  inactive: '#9AA2B1',
  border: '#ECEEF3',
  bg: '#FFFFFF',
  screenBg: '#F7F8FA',
};


const ICONS = {
  Home: 'home',
  Strategies: 'activity',
  Reports: 'bar-chart-2',
  Profile: 'user',
};


function TabIcon({ routeName, focused, color }) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather
        name={ICONS[routeName]}
        size={22}
        color={color}
      />

      {focused && (
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.active,
            marginTop: 4,
          }}
        />
      )}
    </View>
  );
}


/* -----------------------------------------
   BOTTOM TAB NAVIGATOR
----------------------------------------- */

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,

        tabBarShowLabel: true,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: -2,
        },

        tabBarStyle: {
          backgroundColor: COLORS.bg,

          borderTopWidth: 1,
          borderTopColor: COLORS.border,

          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,

          height: Platform.OS === 'ios' ? 95 : 75,

          paddingTop: 8,

          paddingBottom:
            Platform.OS === 'ios' ? 24 : 6,

          elevation: 0,
          shadowOpacity: 0,

          overflow: 'hidden',
        },

        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            routeName={route.name}
            focused={focused}
            color={color}
          />
        ),
      })}
    >

      <Tab.Screen
        name="Home"
        component={Home}
      />

      <Tab.Screen
        name="Strategies"
        component={Strategies}
      />

      <Tab.Screen
        name="Reports"
        component={Reports}
      />

      <Tab.Screen
        name="Profile"
        component={Profile}
      />

    </Tab.Navigator>
  );
}


/* -----------------------------------------
   APP STACK
----------------------------------------- */

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
      headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
      />

      <Stack.Screen
        name="Broker"
        component={Brokers}
      />

      <Stack.Screen
        name="DematAccount"
        component={DematAccount}
      />

      <Stack.Screen
        name="ChangePassword"
        component={ChangePassword}
      />

      <Stack.Screen
        name="About"
        component={About}
      />

      <Stack.Screen
        name="Tutorials"
        component={Tutorials}
      />

      <Stack.Screen
        name="Privacy"
        component={Privacy}
      />

      <Stack.Screen
        name="Terms"
        component={Terms}
      />

      <Stack.Screen
        name="Plans"
        component={Plans}
      />
    </Stack.Navigator>
  );
}