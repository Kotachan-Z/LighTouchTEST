import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import ConnectScreen from '../screens/ConnectScreen';
import SetupScreen from '../screens/SetupScreen';
import HomeScreen from '../screens/HomeScreen';
import KeyManagementScreen from '../screens/KeyManagementScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import type { RootStackParamList } from '../types';
import { useLightStore } from '../store/useLightStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const initBle = useLightStore(s => s.initBle);

  useEffect(() => { initBle(); }, [initBle]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Connect"
        screenOptions={{ headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="Connect"       component={ConnectScreen}       options={{ title: 'LighTouch' }} />
        <Stack.Screen name="Setup"         component={SetupScreen}         options={{ title: '初回セットアップ', headerBackVisible: false }} />
        <Stack.Screen name="Home"          component={HomeScreen}           options={{ title: 'ホーム', headerBackVisible: false }} />
        <Stack.Screen name="KeyManagement"  component={KeyManagementScreen}  options={{ title: '鍵の管理' }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'パスワードリセット' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
