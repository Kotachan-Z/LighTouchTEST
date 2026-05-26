import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLightStore } from '../store/useLightStore';
import type { NfcKeyInfo, ScreenProps } from '../types';

export default function KeyManagementScreen({ route, navigation }: ScreenProps<'KeyManagement'>) {
  const fromSetup = route.params?.fromSetup ?? false;
  const { registeredKeys, lastEvent, clearEvent, listKeys, startKeyRegistration, deleteKey } = useLightStore();
  const [waitingForNfc, setWaitingForNfc] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    listKeys();
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    switch (lastEvent) {
      case 'key_registered':
        setWaitingForNfc(false);
        setStatusMsg('鍵が登録されました ✓');
        break;
      case 'key_deleted':
        setStatusMsg('鍵を削除しました');
        break;
      case 'error':
        setWaitingForNfc(false);
        setStatusMsg('エラーが発生しました');
        break;
    }
    clearEvent();
  }, [lastEvent, clearEvent]);

  const handleAddKey = () => {
    setStatusMsg('NFCタグをデバイスにかざしてください...');
    setWaitingForNfc(true);
    startKeyRegistration();
  };

  const handleDeleteKey = (key: NfcKeyInfo) => {
    Alert.alert(
      '鍵を削除',
      `UID: ${key.uidHex}\n${key.label ? `ラベル: ${key.label}\n` : ''}この鍵を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive',
          onPress: () => {
            deleteKey(key.uid);
            setStatusMsg('削除中...');
          },
        },
      ],
    );
  };

  const handleDone = () => {
    if (fromSetup) {
      navigation.replace('Home');
    } else {
      navigation.goBack();
    }
  };

  const renderKey = ({ item }: { item: NfcKeyInfo }) => (
    <View style={s.keyItem}>
      <View style={s.keyInfo}>
        <Text style={s.keyLabel}>{item.label || '(ラベルなし)'}</Text>
        <Text style={s.keyUid}>{item.uidHex}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDeleteKey(item)} style={s.deleteBtn}>
        <Text style={s.deleteBtnText}>削除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      {fromSetup && (
        <View style={s.setupBanner}>
          <Text style={s.setupBannerText}>
            セットアップの最後のステップです。{'\n'}
            使用するNFCタグを登録してください。
          </Text>
        </View>
      )}

      <Text style={s.count}>登録済み: {registeredKeys.length} 件</Text>

      {statusMsg ? (
        <Text style={[s.status, waitingForNfc && s.statusWaiting]}>{statusMsg}</Text>
      ) : null}

      {waitingForNfc && <ActivityIndicator style={{ marginVertical: 8 }} />}

      <TouchableOpacity
        style={[s.button, waitingForNfc && s.buttonDisabled]}
        onPress={handleAddKey}
        disabled={waitingForNfc}>
        <Text style={s.buttonText}>＋ NFCタグを追加</Text>
      </TouchableOpacity>

      <FlatList
        data={registeredKeys}
        keyExtractor={k => k.uidHex}
        renderItem={renderKey}
        style={s.list}
        ListEmptyComponent={
          <Text style={s.empty}>登録された鍵はありません</Text>
        }
      />

      <TouchableOpacity style={s.doneButton} onPress={handleDone}>
        <Text style={s.doneButtonText}>
          {fromSetup ? 'セットアップ完了' : '完了'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  setupBanner:     { backgroundColor: '#e3f2fd', padding: 14, borderRadius: 8, marginBottom: 16 },
  setupBannerText: { color: '#1565c0', fontSize: 14, lineHeight: 20 },
  count:           { fontSize: 14, color: '#555', marginBottom: 4 },
  status:          { fontSize: 14, color: '#333', marginBottom: 4 },
  statusWaiting:   { color: '#4a90d9' },
  button:          { backgroundColor: '#4a90d9', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonDisabled:  { backgroundColor: '#aaa' },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  list:            { flex: 1, marginTop: 4 },
  empty:           { textAlign: 'center', color: '#aaa', marginTop: 40 },
  keyItem:         { backgroundColor: '#fff', padding: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 8, elevation: 1 },
  keyInfo:         { flex: 1 },
  keyLabel:        { fontSize: 15, fontWeight: '600' },
  keyUid:          { fontSize: 12, color: '#888', fontFamily: 'monospace', marginTop: 2 },
  deleteBtn:       { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fce4ec', borderRadius: 6 },
  deleteBtnText:   { color: '#c62828', fontSize: 13 },
  doneButton:      { backgroundColor: '#4caf50', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  doneButtonText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
