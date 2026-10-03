import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Animated, Easing, useWindowDimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);
  const [localLoading, setLocalLoading] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [motion]);

  const rotateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: ['-28deg', '28deg'],
  });
  const rotateX = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['14deg', '-10deg', '14deg'],
  });
  const lift = motion.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -16, 0],
  });

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    
    setLocalLoading(true);
    const result = await login(username, password);
    setLocalLoading(false);
    
    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.content, wide && styles.contentWide]}>
          <View style={[styles.headerContainer, wide && styles.headerWide]}>
            <Animated.View style={[styles.stage, { transform: [{ translateY: lift }] }]}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  { transform: [{ perspective: 900 }, { rotateX }, { rotateY }] },
                ]}
              >
                <Text style={styles.logoLetter}>B</Text>
              </Animated.View>
            </Animated.View>
            <Text style={[styles.title, wide && styles.titleWide]}>Welcome to Beza Pharmacy</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={[styles.formContainer, wide && styles.formWide]}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin}
              disabled={localLoading || isLoading}
            >
              {localLoading || isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff', // Light sky blue background
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  contentWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 48,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerWide: {
    flex: 1,
    marginBottom: 0,
    maxWidth: 460,
  },
  stage: {
    marginBottom: 8,
  },
  logoContainer: {
    backgroundColor: '#0ea5e9',
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 58,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleWide: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  formWide: {
    width: 440,
    flexGrow: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
