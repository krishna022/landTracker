/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, ErrorUtils } from 'react-native';
import React from 'react';
import { Text, View } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const errorHandler = (error, errorInfo) => {
      console.error('App Error:', error, errorInfo);
      setHasError(true);
      setError(error.message);
    };

    // Set up global error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(errorHandler);

    return () => {
      ErrorUtils.setGlobalHandler(originalHandler);
    };
  }, []);

  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          App Crashed
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center' }}>
          {error || 'An unexpected error occurred'}
        </Text>
        <Text style={{ fontSize: 12, marginTop: 20, textAlign: 'center' }}>
          Check console logs for more details
        </Text>
      </View>
    );
  }

  return children;
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => AppWithErrorBoundary);
