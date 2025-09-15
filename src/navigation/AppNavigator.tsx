import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from 'react-native';

import { useAuth } from '../store/AuthContext';
import LoadingScreen from '../screens/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import PinAuthScreen from '../screens/auth/PinAuthScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PropertiesScreen from '../screens/properties/PropertiesScreen';
import PropertyDetailScreen from '../screens/properties/PropertyDetailScreen';
import AddPropertyScreen from '../screens/properties/AddPropertyScreen';
import PropertyImageScreen from '../screens/properties/PropertyImageScreen';
import PropertyMapScreen from '../screens/properties/PropertyMapScreen';
import PropertyDocumentsScreen from '../screens/properties/PropertyDocumentsScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = ({ requiresEmailVerification, emailVerificationEmail }: { requiresEmailVerification: boolean; emailVerificationEmail: string | null }) => {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={requiresEmailVerification ? "EmailVerification" : "Login"}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        initialParams={emailVerificationEmail ? { email: emailVerificationEmail } : undefined}
      />
      <Stack.Screen name="PinAuth" component={PinAuthScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
    </Stack.Navigator>
  );
};

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
    <Stack.Screen 
      name="PropertyImages" 
      component={PropertyImageScreen} 
      options={{ title: 'Property Images' }}
    />
    <Stack.Screen 
      name="PropertyMap" 
      component={PropertyMapScreen} 
      options={{ title: 'Property Map' }}
    />
    <Stack.Screen 
      name="PropertyDocuments" 
      component={PropertyDocumentsScreen} 
      options={{ title: 'Property Documents' }}
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
          <Text style={{ fontSize: size, color }}>🏠</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Properties" 
      component={PropertiesStack}
      options={{
        tabBarLabel: 'Properties',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>🏢</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Map" 
      component={MapScreen}
      options={{
        tabBarLabel: 'Map',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>🗺️</Text>
        ),
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ fontSize: size, color }}>👤</Text>
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

  // Also check PIN setup when user state changes
  useEffect(() => {
    if (state.user?.hasPinSetup !== undefined) {
      setHasPinSetup(state.user.hasPinSetup);
    }
  }, [state.user?.hasPinSetup]);

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
      {state.isAuthenticated && hasPinSetup ? (
        // User is fully authenticated and has PIN setup, show main app
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : hasSession ? (
        // User has an existing session but needs PIN auth first
        hasPinSetup ? (
          <Stack.Screen name="PinAuth" component={PinAuthScreen} />
        ) : (
          <Stack.Screen name="PinSetup" component={PinSetupScreen} />
        )
      ) : (
        // No session, show auth flow (includes email verification)
        <Stack.Screen name="Auth">
          {() => <AuthStack requiresEmailVerification={state.requiresEmailVerification} emailVerificationEmail={state.emailVerificationEmail} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
