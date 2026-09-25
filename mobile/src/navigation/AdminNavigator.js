import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Menu, Home, Package, DollarSign, Users as UsersIcon, UserCircle, User, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

import AdminDashboard from '../screens/AdminDashboard';
import InventoryScreen from '../screens/InventoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

import FinanceScreen from '../screens/FinanceScreen';
import UsersScreen from '../screens/UsersScreen';

const Stack = createNativeStackNavigator();

const NavigationMenu = () => {
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();

  const handleNavigate = (screen) => {
    setVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={{ padding: 10 }}>
        <Menu color="#333" size={24} />
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.webConstraint}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownContainer, { right: 15, left: 'auto' }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Dashboard')}>
                    <Home color="#64748b" size={20} />
                    <Text style={styles.menuText}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Inventory')}>
                    <Package color="#64748b" size={20} />
                    <Text style={styles.menuText}>Inventory</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Finance')}>
                    <DollarSign color="#64748b" size={20} />
                    <Text style={styles.menuText}>Finance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Users')}>
                    <UsersIcon color="#64748b" size={20} />
                    <Text style={styles.menuText}>Users</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const ProfileMenu = () => {
  const [visible, setVisible] = useState(false);
  const { logout, user } = useContext(AuthContext);
  const navigation = useNavigation();

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={{ padding: 10, flexDirection: 'row', alignItems: 'center' }}>
        <UserCircle color="#0f172a" size={28} />
        <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{user?.name}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.webConstraint}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownContainer, { left: 15, right: 'auto', width: 150 }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setVisible(false); navigation.navigate('Profile'); }}>
                    <User color="#475569" size={18} />
                    <Text style={styles.menuText}>Profile</Text>
                  </TouchableOpacity>
                  <View style={styles.dropdownDivider} />
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setVisible(false); logout(); }}>
                    <LogOut color="#ef4444" size={18} />
                    <Text style={[styles.menuText, { color: '#ef4444' }]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLeft: () => <ProfileMenu />,
        headerRight: () => <NavigationMenu />,
        headerTitle: '',
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
        headerShadowVisible: false, // removes the bottom border/shadow
      }}
    >
      <Stack.Screen name="Dashboard" component={AdminDashboard} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="Finance" component={FinanceScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
  },
  webConstraint: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 414 : '100%',
    height: '100%',
    position: 'relative',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500'
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  }
});
