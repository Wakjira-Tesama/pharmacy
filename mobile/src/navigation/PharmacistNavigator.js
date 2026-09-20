import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ShoppingCart, ArrowDownToLine, PackageSearch } from 'lucide-react-native';

import PharmacistDashboard from '../screens/PharmacistDashboard';
import StockInScreen from '../screens/StockInScreen';
import POSScreen from '../screens/POSScreen';
import InventoryScreen from '../screens/InventoryScreen';
// Placeholders
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen (WIP)</Text>
  </View>
);

export default function PharmacistNavigator() {
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
        component={PharmacistDashboard} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="POS" 
        component={POSScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
          title: 'Sell'
        }}
      />
      <Tab.Screen 
        name="StockIn" 
        component={StockInScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ArrowDownToLine color={color} size={size} />,
          title: 'Stock In'
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <PackageSearch color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
