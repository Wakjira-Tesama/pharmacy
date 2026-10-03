import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Menu, Home, ShoppingCart, ArrowDownToLine, PackageSearch, UserCircle, User, LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

import PharmacistDashboard from '../screens/PharmacistDashboard';
import StockInScreen from '../screens/StockInScreen';
import POSScreen from '../screens/POSScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
                <View style={[styles.dropdownContainer, { left: 15, right: 'auto' }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Dashboard')}>
                    <Home color="#64748b" size={20} />
                    <Text style={styles.menuText}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('POS')}>
                    <ShoppingCart color="#64748b" size={20} />
                    <Text style={styles.menuText}>Sell</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('StockIn')}>
                    <ArrowDownToLine color="#64748b" size={20} />
                    <Text style={styles.menuText}>Stock In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('Inventory')}>
                    <PackageSearch color="#64748b" size={20} />
                    <Text style={styles.menuText}>Inventory</Text>
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
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.profileButton}>
        <Text style={styles.profileName} numberOfLines={1}>{user?.name}</Text>
        {user?.profile_image ? (
          <Image source={{ uri: user.profile_image }} style={styles.headerAvatar} />
        ) : (
          <UserCircle color="#0f172a" size={26} />
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalBackground}>
            <View style={styles.webConstraint}>
              <TouchableWithoutFeedback>
                <View style={[styles.dropdownContainer, { right: 15, left: 'auto', width: 150 }]}>
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

export default function PharmacistNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: () => (
          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.headerBar}>
              <NavigationMenu />
              <Text style={styles.headerTitle} numberOfLines={1}>Beza Pharmacy</Text>
              <ProfileMenu />
            </View>
          </SafeAreaView>
        ),
      }}
    >
      <Stack.Screen name="Dashboard" component={PharmacistDashboard} />
      <Stack.Screen name="POS" component={POSScreen} />
      <Stack.Screen name="StockIn" component={StockInScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
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
  },
  headerSafe: {
    backgroundColor: '#ffffff',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
    color: '#0ea5e9',
    marginHorizontal: 4,
  },
  profileButton: {
    maxWidth: 118,
    paddingVertical: 8,
    paddingRight: 10,
    paddingLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    maxWidth: 72,
    marginRight: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
