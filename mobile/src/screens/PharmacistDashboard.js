import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, ArrowDownToLine, ShoppingCart, PackageSearch } from 'lucide-react-native';

const StatCard = ({ title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </View>
);

const ActionButton = ({ title, icon: Icon, color, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <Icon color={color} size={24} />
    </View>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>
);

export default function PharmacistDashboard() {
  const { logout, user } = useContext(AuthContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacy</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>Hello, {user?.name}</Text>
        
        <Text style={styles.sectionTitle}>Daily Operations</Text>
        <View style={styles.actionContainer}>
          <ActionButton title="Sell" icon={ShoppingCart} color="#0ea5e9" />
          <ActionButton title="Stock In" icon={ArrowDownToLine} color="#10b981" />
          <ActionButton title="Add Med" icon={PlusCircle} color="#8b5cf6" />
          <ActionButton title="Inventory" icon={PackageSearch} color="#f59e0b" />
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Total Medicines" value="124" color="#0ea5e9" />
          <StatCard title="Available Stock" value="4,520" color="#8b5cf6" />
          <StatCard title="Low Stock" value="8" color="#f59e0b" />
          <StatCard title="Expiring Soon" value="3" color="#f97316" />
        </View>

        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Sales Count" value="42" color="#10b981" />
          <StatCard title="Today's Income" value="2,100 ETB" color="#10b981" />
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    marginTop: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    width: '23%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500'
  }
});
