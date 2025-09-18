import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, DefaultTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// Import network debugger for development
import './src/utils/networkDebugger';
import { setupNetworkMonitor } from './src/utils/flipperNetworkSetup';

import { AuthProvider } from './src/store/AuthContext';
import { ThemeProvider, useTheme } from './src/store/ThemeContext';
import { PreferencesProvider, usePreferences } from './src/store/PreferencesContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  console.log('AppContent rendering...');

  try {
    const { state } = useTheme();
    const { preferences } = usePreferences();

    console.log('Theme state:', state);
    console.log('Preferences:', preferences);

    const paperTheme = state.isDark ? PaperDarkTheme : PaperDefaultTheme;
    const navigationTheme = state.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

    return (
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AuthProvider>
            <NavigationContainer
              theme={navigationTheme}
              key={preferences.language.code}
              onReady={() => console.log('Navigation container ready')}
              onStateChange={(state) => console.log('Navigation state changed:', state)}
            >
              <StatusBar barStyle={state.isDark ? 'light-content' : 'dark-content'} />
              <AppNavigator key={`nav-${preferences.language.code}`} />
              <Toast />
            </NavigationContainer>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    );
  } catch (error) {
    console.error('Error in AppContent:', error);
    return (
      <SafeAreaProvider>
        <PaperProvider theme={PaperDefaultTheme}>
          <NavigationContainer theme={NavigationDefaultTheme}>
            <StatusBar barStyle="dark-content" />
            <Toast />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }
}

function App() {
  console.log('App component rendering...');

  useEffect(() => {
    console.log('App useEffect running...');
    // Set up network monitoring for development
    try {
      setupNetworkMonitor();
      console.log('Network monitor setup complete');
    } catch (error) {
      console.error('Error setting up network monitor:', error);
    }
  }, []);

  return (
    <ThemeProvider>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </ThemeProvider>
  );
}

export default App;
