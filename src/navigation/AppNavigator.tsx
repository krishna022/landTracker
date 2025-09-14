import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../store/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PinLoginScreen from '../screens/auth/PinLoginScreen';
import PinAuthScreen from '../screens/auth/PinAuthScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PropertiesScreen from '../screens/properties/PropertiesScreen';
import PropertyDetailScreen from '../screens/properties/PropertyDetailScreen';
import AddPropertyScreen from '../screens/properties/AddPropertyScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="PinLogin" component={PinLoginScreen} />
    <Stack.Screen name="PinAuth" component={PinAuthScreen} />
    <Stack.Screen name="PinSetup" component={PinSetupScreen} />
  </Stack.Navigator>
);

// Properties Stack
const PropertiesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PropertiesList" 
      component={PropertiesScreen} 
      options={{ title: 'My Properties' }}
    />
    <Stack.Screen 
      name="PropertyDetail" 
      component={PropertyDetailScreen} 
      options={{ title: 'Property Details' }}
    />
    <Stack.Screen 
      name="AddProperty" 
      component={AddPropertyScreen} 
      options={{ title: 'Add Property' }}
    />
  </Stack.Navigator>
);

// Main App Tabs
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#2E7D32',
      tabBarInactiveTintColor: '#9E9E9E',
      headerShown: false,
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color, size }) => (
          <Icon name="dashboard" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Properties" 
      component={PropertiesStack}
      options={{
        tabBarLabel: 'Properties',
        tabBarIcon: ({ color, size }) => (
          <Icon name="location-city" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Map" 
      component={MapScreen}
      options={{
        tabBarLabel: 'Map',
        tabBarIcon: ({ color, size }) => (
          <Icon name="map" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <Icon name="person" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { state, hasExistingSession } = useAuth();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [hasPinSetup, setHasPinSetup] = useState<boolean | null>(null);

  useEffect(() => {
    checkSessionAndPin();
  }, []);

  const checkSessionAndPin = async () => {
    try {
      const sessionExists = await hasExistingSession();
      setHasSession(sessionExists);
      
      if (sessionExists) {
        const pinData = await AsyncStorage.getItem('user_pin');
        setHasPinSetup(!!pinData);
      }
    } catch (error) {
      setHasSession(false);
      setHasPinSetup(false);
    }
  };

  // Show loading while checking session
  if (state.isLoading || hasSession === null) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.isAuthenticated ? (
        // User is fully authenticated, show main app
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : hasSession ? (
        // User has an existing session but needs PIN/biometric auth
        hasPinSetup ? (
          <Stack.Screen name="PinAuth" component={PinAuthScreen} />
        ) : (
          <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        )
      ) : (
        // No session, show auth flow
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
