import React, { useContext } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppFrame() {
  const { user } = useContext(AuthContext);
  const wideLogin = Platform.OS === 'web' && !user;

  return (
    <View style={styles.container}>
      <View style={Platform.OS === 'web' ? [styles.webContainer, wideLogin && styles.webWide] : styles.mobileContainer}>
        <AppNavigator />
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppFrame />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb', // gray background for the laptop screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 414, // iPhone 11 Pro Max width
    height: '100%',
    maxHeight: 896,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  webWide: {
    maxWidth: 1100,
    maxHeight: '100%',
    backgroundColor: '#f0f9ff',
    overflow: 'visible',
    shadowOpacity: 0,
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
  }
});
