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
import { RTLProvider } from './src/store/RTLContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { state } = useTheme();
  const { preferences } = usePreferences();

  const paperTheme = state.isDark ? PaperDarkTheme : PaperDefaultTheme;
  const navigationTheme = state.isDark ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme} key={preferences.language.code}>
            <StatusBar barStyle={state.isDark ? 'light-content' : 'dark-content'} />
            <AppNavigator key={`nav-${preferences.language.code}`} />
            <Toast />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function App() {
  useEffect(() => {
    // Set up network monitoring for development
    setupNetworkMonitor();
  }, []);

  return (
    <ThemeProvider>
      <PreferencesProvider>
        <RTLProvider>
          <AppContent />
        </RTLProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}

export default App;
