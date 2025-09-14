import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// Import network debugger for development
import './src/utils/networkDebugger';
import { setupNetworkMonitor } from './src/utils/flipperNetworkSetup';

import { AuthProvider } from './src/store/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Set up network monitoring for development
    setupNetworkMonitor();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <AppNavigator />
            <Toast />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
