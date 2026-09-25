import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import api from '../config/api';

const screenWidth = Dimensions.get('window').width;

export default function FinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [dailyFinance, setDailyFinance] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [dailyRes, expensesRes] = await Promise.all([
        api.get('/finance/daily'),
        api.get('/finance/expenses')
      ]);
      
      if (dailyRes.data.success) {
        setDailyFinance(dailyRes.data.data);
      }
      if (expensesRes.data.success) {
        setExpenses(expensesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.expenseType}>{item.reference_type}</Text>
        <Text style={styles.expenseDesc}>{item.description}</Text>
        <Text style={styles.expenseDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.expenseAmount}>-{item.amount} ETB</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance Management</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today's Income</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>{dailyFinance.income} ETB</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today's Expense</Text>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{dailyFinance.expense} ETB</Text>
        </View>
        <View style={[styles.summaryCard, { width: '100%', marginTop: 10, backgroundColor: '#f0f9ff' }]}>
          <Text style={styles.summaryLabel}>Net Balance</Text>
          <Text style={[styles.summaryValue, { color: '#0ea5e9', fontSize: 24 }]}>{dailyFinance.balance} ETB</Text>
        </View>
      </View>

      <View style={styles.listHeaderContainer}>
        <Text style={styles.listHeader}>Recent Expenses</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchFinanceData}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No recent expenses found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
  },
  refreshBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  expenseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  expenseType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  expenseDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
  }
});
