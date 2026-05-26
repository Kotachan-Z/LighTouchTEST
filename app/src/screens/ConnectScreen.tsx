import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { useLightStore } from '../store/useLightStore';
import type { ScreenProps, DiscoveredDevice } from '../types';

export default function ConnectScreen({ navigation }: ScreenProps<'Connect'>) {
  const {
    bleConnState, deviceStatus, discoveredDevices,
    startScan, stopScan, connect,
  } = useLightStore();

  // デバイス状態を受け取ったら画面遷移
  useEffect(() => {
    if (deviceStatus === 'needs_setup') {
      navigation.replace('Setup');
    } else if (deviceStatus === 'ready') {
      navigation.replace('Home');
    }
  }, [deviceStatus, navigation]);

  const handleConnect = async (device: DiscoveredDevice) => {
    await connect(device);
  };

  const renderDevice = ({ item }: { item: DiscoveredDevice }) => (
    <TouchableOpacity style={s.deviceItem} onPress={() => handleConnect(item)}>
      <Text style={s.deviceName}>{item.name}</Text>
      <Text style={s.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  const scanning = bleConnState === 'scanning';
  const connecting = bleConnState === 'connecting';

  return (
    <View style={s.container}>
      <Text style={s.title}>デバイスに接続</Text>

      <Text style={s.status}>
        {bleConnState === 'off'       && 'Bluetoothが無効です。設定からオンにしてください。'}
        {bleConnState === 'disconnected' && '未接続'}
        {scanning                    && 'スキャン中...'}
        {connecting                  && '接続中...'}
        {bleConnState === 'connected' && 'デバイス状態を確認中...'}
      </Text>

      {(scanning || connecting || bleConnState === 'connected') && (
        <ActivityIndicator style={{ marginVertical: 12 }} />
      )}

      <TouchableOpacity
        style={[s.button, scanning && s.buttonSecondary]}
        onPress={scanning ? stopScan : startScan}
        disabled={connecting || bleConnState === 'connected'}>
        <Text style={s.buttonText}>
          {scanning ? 'スキャン停止' : 'スキャン開始'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={discoveredDevices}
        keyExtractor={d => d.id}
        renderItem={renderDevice}
        style={s.list}
        ListEmptyComponent={
          scanning
            ? <Text style={s.empty}>デバイスを探しています...</Text>
            : <Text style={s.empty}>デバイスが見つかりません</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title:         { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  status:        { fontSize: 14, color: '#555', marginBottom: 4 },
  list:          { marginTop: 16, flex: 1 },
  empty:         { textAlign: 'center', color: '#aaa', marginTop: 40 },
  deviceItem:    { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 10, elevation: 2 },
  deviceName:    { fontSize: 16, fontWeight: '600' },
  deviceId:      { fontSize: 12, color: '#888', marginTop: 4 },
  button:        { backgroundColor: '#4a90d9', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buttonSecondary: { backgroundColor: '#888' },
  buttonText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
});
