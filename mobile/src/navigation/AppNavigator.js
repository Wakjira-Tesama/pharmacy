import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import AdminNavigator from './AdminNavigator';
import PharmacistNavigator from './PharmacistNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user == null ? (
          // No token found, user isn't signed in
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === 'ADMIN' ? (
          // User is signed in as ADMIN
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        ) : (
          // User is signed in as PHARMACIST
          <Stack.Screen name="PharmacistApp" component={PharmacistNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
