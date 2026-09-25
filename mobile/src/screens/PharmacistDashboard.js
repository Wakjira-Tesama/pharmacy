import React, { useContext, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, Modal, FlatList } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, ArrowDownToLine, ShoppingCart, PackageSearch, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';

const StatCard = ({ title, value, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </TouchableOpacity>
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
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, financeRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/finance/daily')
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (financeRes.data.success) setFinance(financeRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSalesModal = async () => {
    setShowSalesModal(true);
    setSalesLoading(true);
    try {
      const response = await api.get('/finance/income');
      if (response.data.success) {
        setSalesList(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load sales list', error);
    } finally {
      setSalesLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
        }
      >
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Beza Pharmacy</Text>
        </View>
        
        <Text style={styles.sectionTitle}>Daily Operations</Text>
        <View style={styles.actionContainer}>
          <ActionButton title="Sell" icon={ShoppingCart} color="#0ea5e9" onPress={() => navigation.navigate('POS')} />
          <ActionButton title="Stock In" icon={ArrowDownToLine} color="#10b981" onPress={() => navigation.navigate('StockIn')} />
          <ActionButton title="Inventory" icon={PackageSearch} color="#f59e0b" onPress={() => navigation.navigate('Inventory')} />
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Total Medicines" value={stats?.totalMedicines || 0} color="#0ea5e9" onPress={() => navigation.navigate('Inventory')} />
          <StatCard title="Available Stock" value={stats?.totalStock || 0} color="#8b5cf6" onPress={() => navigation.navigate('Inventory')} />
          <StatCard title="Low Stock" value={stats?.lowStock || 0} color="#f59e0b" onPress={() => navigation.navigate('Inventory', { filter: 'lowStock' })} />
          <StatCard title="Expiring Soon" value={stats?.expiringSoon || 0} color="#f97316" onPress={() => navigation.navigate('Inventory', { filter: 'expiringSoon' })} />
        </View>

        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Sales Count" value={stats?.todaySalesCount || 0} color="#10b981" onPress={openSalesModal} />
          <StatCard title="Today's Income" value={`${finance?.income || 0} ETB`} color="#10b981" onPress={openSalesModal} />
        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Sales Modal */}
      <Modal visible={showSalesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Sales</Text>
              <TouchableOpacity onPress={() => setShowSalesModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            
            {salesLoading ? (
              <ActivityIndicator size="large" color="#0ea5e9" style={{marginTop: 20}} />
            ) : (
              <FlatList
                data={salesList}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.saleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saleDesc}>{item.description}</Text>
                      <Text style={styles.saleDate}>{new Date(item.transaction_date || item.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.saleAmount}>+{item.amount} ETB</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{textAlign: 'center', color: '#94a3b8'}}>No sales found.</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0ea5e9',
    textShadowColor: 'rgba(14, 165, 233, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    width: '100%',
    maxWidth: 414,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saleDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  saleDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  }
});
