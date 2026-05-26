import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useLightStore } from '../store/useLightStore';
import type { ScreenProps } from '../types';

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const {
    bleConnState, isAuthenticated, isLightOn, lastEvent,
    clearEvent, authenticate, disconnect, endSettings,
  } = useLightStore();

  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (bleConnState === 'disconnected') {
      navigation.replace('Connect');
    }
  }, [bleConnState, navigation]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent === 'auth_failed') {
      setAuthError('パスワードが違います');
    } else if (lastEvent === 'auth_success') {
      setAuthError('');
      setPassword('');
    }
    clearEvent();
  }, [lastEvent, clearEvent]);

  const handleAuth = () => {
    setAuthError('');
    if (!password) { setAuthError('パスワードを入力してください'); return; }
    authenticate(password);
  };

  const handleDisconnect = () => {
    Alert.alert('切断', 'デバイスとの接続を切断しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '切断', style: 'destructive', onPress: async () => {
          endSettings();
          await disconnect();
        },
      },
    ]);
  };

  return (
    <View style={s.container}>
      {/* 接続ステータス */}
      <View style={s.statusBar}>
        <View style={[s.dot, bleConnState === 'connected' ? s.dotOn : s.dotOff]} />
        <Text style={s.statusText}>
          {bleConnState === 'connected' ? 'BLE 接続中' : '切断'}
        </Text>
        <TouchableOpacity onPress={handleDisconnect} style={s.disconnectBtn}>
          <Text style={s.disconnectText}>切断</Text>
        </TouchableOpacity>
      </View>

      {/* 認証ブロック */}
      {!isAuthenticated ? (
        <View style={s.authBox}>
          <Text style={s.authTitle}>パスワード認証</Text>
          <Text style={s.authDesc}>設定モードを使うにはパスワードが必要です。</Text>
          <TextInput
            style={s.input}
            placeholder="パスワード"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {authError ? <Text style={s.error}>{authError}</Text> : null}
          <TouchableOpacity style={s.button} onPress={handleAuth}>
            <Text style={s.buttonText}>認証する</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.linkBtn}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.linkText}>パスワードを忘れた場合</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ライト状態 (NFC専用・読み取り専用) */}
          <View style={[s.lightStatus, isLightOn ? s.lightStatusOn : s.lightStatusOff]}>
            <Text style={s.lightIcon}>{isLightOn ? '💡' : '🔦'}</Text>
            <View>
              <Text style={s.lightStatusLabel}>ライト</Text>
              <Text style={s.lightStatusValue}>{isLightOn ? 'ON' : 'OFF'}</Text>
            </View>
            <Text style={s.lightHint}>NFC タグで切替</Text>
          </View>

          {/* 設定メニュー */}
          <TouchableOpacity
            style={s.button}
            onPress={() => navigation.navigate('KeyManagement', {})}>
            <Text style={s.buttonText}>🔑  鍵の管理</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.button, s.buttonSecondary]}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={s.buttonText}>❓  秘密の質問を変更</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  statusBar:         { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  dot:               { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  dotOn:             { backgroundColor: '#4caf50' },
  dotOff:            { backgroundColor: '#f44336' },
  statusText:        { flex: 1, fontSize: 14, color: '#333' },
  disconnectBtn:     { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f5f5f5', borderRadius: 6 },
  disconnectText:    { color: '#f44336', fontSize: 13 },
  authBox:           { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 2 },
  authTitle:         { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  authDesc:          { fontSize: 13, color: '#666', marginBottom: 16 },
  input:             { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 10 },
  error:             { color: '#c62828', marginBottom: 8 },
  button:            { backgroundColor: '#4a90d9', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonSecondary:   { backgroundColor: '#78909c' },
  buttonText:        { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn:           { alignItems: 'center', marginTop: 16, padding: 8 },
  linkText:          { color: '#4a90d9', fontSize: 14 },
  lightStatus:       { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 8 },
  lightStatusOn:     { backgroundColor: '#fff9c4' },
  lightStatusOff:    { backgroundColor: '#455a64' },
  lightIcon:         { fontSize: 40, marginRight: 16 },
  lightStatusLabel:  { fontSize: 12, color: '#888', fontWeight: '500' },
  lightStatusValue:  { fontSize: 28, fontWeight: 'bold', color: '#333' },
  lightHint:         { marginLeft: 'auto', fontSize: 11, color: '#888' },
});
