import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Package, DollarSign, Users } from 'lucide-react-native';

import AdminDashboard from '../screens/AdminDashboard';
import InventoryScreen from '../screens/InventoryScreen';
// Placeholders for other screens
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen (WIP)</Text>
  </View>
);

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Finance" 
        component={() => <PlaceholderScreen name="Finance" />} 
        options={{
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={() => <PlaceholderScreen name="Users" />} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
