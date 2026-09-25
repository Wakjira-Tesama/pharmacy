import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CustomDatePicker({ visible, date, onConfirm, onCancel }) {
  const [currentDate, setCurrentDate] = useState(date || new Date());
  const [viewDate, setViewDate] = useState(date || new Date());

  useEffect(() => {
    if (visible) {
      const initDate = date || new Date();
      setCurrentDate(initDate);
      setViewDate(initDate);
    }
  }, [visible, date]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = 
        currentDate.getDate() === d &&
        currentDate.getMonth() === month &&
        currentDate.getFullYear() === year;

      // Check if it's today just to highlight text if we want, but image shows selected circle
      const isToday = 
        new Date().getDate() === d &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => setCurrentDate(new Date(year, month, d))}
        >
          <Text style={[
            styles.dayText, 
            isSelected && styles.selectedDayText,
            !isSelected && isToday && styles.todayText
          ]}>
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerYear}>{currentDate.getFullYear()}</Text>
            <Text style={styles.headerDate}>
              {SHORT_DAYS[currentDate.getDay()]}, {SHORT_MONTHS[currentDate.getMonth()]} {currentDate.getDate()}
            </Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Month Nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navIcon}>
                <ChevronLeft color="#333" size={24} />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navIcon}>
                <ChevronRight color="#333" size={24} />
              </TouchableOpacity>
            </View>

            {/* Days Header */}
            <View style={styles.daysHeader}>
              {DAYS.map((d, i) => (
                <Text key={i} style={styles.dayHeaderText}>{d}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendarDays()}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setCurrentDate(new Date())} style={styles.actionBtn}>
              <Text style={styles.actionText}>CLEAR</Text>
            </TouchableOpacity>
            <View style={styles.actionRight}>
              <TouchableOpacity onPress={onCancel} style={styles.actionBtn}>
                <Text style={styles.actionText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onConfirm(currentDate)} style={styles.actionBtn}>
                <Text style={styles.actionText}>SET</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    width: 320,
    borderRadius: 4,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  header: {
    backgroundColor: '#006B8F',
    padding: 20,
  },
  headerYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 4,
  },
  headerDate: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navIcon: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: '#006B8F',
    borderRadius: 20, // Circular highlight
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#006B8F',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionRight: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  actionText: {
    color: '#006B8F',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  }
});
