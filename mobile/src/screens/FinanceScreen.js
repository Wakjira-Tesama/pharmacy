import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import api from '../config/api';

const FREQUENCIES = [
  { id: 'MONTHLY', label: 'Monthly' },
  { id: 'DAILY', label: 'Daily' },
  { id: 'ONCE', label: 'One-time' },
];

const TYPE_PRESETS = ['Rent', 'Salary', 'Utilities'];

export default function FinanceScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyFinance, setDailyFinance] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenses, setExpenses] = useState([]);
  const [expenseType, setExpenseType] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [editingId, setEditingId] = useState(null);
  const listRef = useRef(null);

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

  const daysThisMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const numericAmount = Number(amount);
  const dailyShare = frequency === 'MONTHLY' && numericAmount > 0
    ? (numericAmount / daysThisMonth).toFixed(2)
    : null;

  const clearForm = () => {
    setEditingId(null);
    setExpenseType('Rent');
    setAmount('');
    setDescription('');
    setFrequency('MONTHLY');
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setExpenseType(item.reference_type || '');
    setAmount(String(item.amount ?? ''));
    setDescription(item.description || '');
    setFrequency(FREQUENCIES.some((entry) => entry.id === item.frequency) ? item.frequency : 'ONCE');
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const saveExpense = async () => {
    if (!expenseType.trim() || !numericAmount || numericAmount <= 0) {
      Alert.alert('Missing details', 'Enter an expense type and an amount greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        expense_type: expenseType.trim(),
        description: description.trim(),
        amount: numericAmount,
        frequency,
      };
      const wasEditing = Boolean(editingId);
      const response = wasEditing
        ? await api.put(`/finance/expenses/${editingId}`, payload)
        : await api.post('/finance/expenses', payload);
      if (response.data.success) {
        clearForm();
        await fetchFinanceData();
        Alert.alert(wasEditing ? 'Updated' : 'Saved', wasEditing ? 'Expense updated.' : 'Expense recorded.');
      }
    } catch (error) {
      Alert.alert('Could not save', error.response?.data?.message || 'Failed to record the expense.');
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = (item) => {
    const run = async () => {
      try {
        const response = await api.delete(`/finance/expenses/${item.id}`);
        if (response.data.success) {
          if (editingId === item.id) clearForm();
          await fetchFinanceData();
        }
      } catch (error) {
        Alert.alert('Could not delete', error.response?.data?.message || 'Failed to delete the expense.');
      }
    };

    const message = `Delete ${item.reference_type || 'this expense'}?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) run();
      return;
    }
    Alert.alert('Delete expense', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const frequencyLabel = (value) => {
    if (value === 'MONTHLY') return 'Monthly';
    if (value === 'DAILY') return 'Daily';
    return 'One-time';
  };

  const renderExpenseItem = ({ item }) => {
    const schedule = item.frequency || 'ONCE';
    const shownDaily = schedule === 'MONTHLY'
      ? (Number(item.amount) / daysThisMonth).toFixed(2)
      : null;
    return (
      <View style={styles.expenseCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.expenseType}>{item.reference_type}</Text>
          <Text style={styles.expenseDesc}>{item.description || frequencyLabel(schedule)}</Text>
          <Text style={styles.expenseDate}>
            {frequencyLabel(schedule)}
            {shownDaily ? ` · ${shownDaily} ETB / day` : ''}
            {schedule === 'ONCE' ? ` · ${new Date(item.created_at).toLocaleDateString()}` : ''}
          </Text>
        </View>
        <View style={styles.expenseSide}>
          <Text style={styles.expenseAmount}>-{item.amount} ETB</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeExpense(item)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const form = (
    <View>
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

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{editingId ? 'Edit expense' : 'Record expense'}</Text>
        <View style={styles.chipRow}>
          {TYPE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, expenseType === preset && styles.chipActive]}
              onPress={() => setExpenseType(preset)}
            >
              <Text style={[styles.chipText, expenseType === preset && styles.chipTextActive]}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Expense type, e.g. Rent or Salary"
          placeholderTextColor="#94a3b8"
          value={expenseType}
          onChangeText={setExpenseType}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount (ETB)"
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
        />
        <View style={styles.chipRow}>
          {FREQUENCIES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, frequency === item.id && styles.chipActive]}
              onPress={() => setFrequency(item.id)}
            >
              <Text style={[styles.chipText, frequency === item.id && styles.chipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helper}>
          {frequency === 'MONTHLY'
            ? `Rent, salary, and similar monthly costs are split over ${daysThisMonth} days.${dailyShare ? ` Today includes ${dailyShare} ETB.` : ''}`
            : frequency === 'DAILY'
              ? 'This amount is added to the expenses of every day.'
              : 'A one-time cost is recorded only on the day you save it.'}
        </Text>
        <TouchableOpacity style={styles.saveBtn} onPress={saveExpense} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? 'Update expense' : 'Save expense'}</Text>}
        </TouchableOpacity>
        {editingId ? (
          <TouchableOpacity style={styles.cancelBtn} onPress={clearForm}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.listHeaderContainer}>
        <Text style={styles.listHeader}>Recent Expenses</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchFinanceData}>
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
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

      <FlatList
        ref={listRef}
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExpenseItem}
        ListHeaderComponent={form}
        contentContainerStyle={{ paddingBottom: 24 }}
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
    marginHorizontal: 16,
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
  expenseSide: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  editBtnText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#0ea5e9',
  },
  chipText: {
    color: '#334155',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    color: '#0f172a',
  },
  helper: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  saveBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 10,
    alignItems: 'center',
    padding: 10,
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
});
