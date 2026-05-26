import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLightStore } from '../store/useLightStore';
import type { ScreenProps } from '../types';

export default function ForgotPasswordScreen({ navigation }: ScreenProps<'ForgotPassword'>) {
  const { secretQuestion, lastEvent, clearEvent, getQuestion, resetPassword } = useLightStore();

  const [answer, setAnswer]             = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPw, setConfirmPw]       = useState('');
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [fetchingQ, setFetchingQ]       = useState(true);

  // 画面を開いたらデバイスに質問テキストを問い合わせ
  useEffect(() => {
    getQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // secretQuestion がセットされたらローディング終了
  useEffect(() => {
    if (secretQuestion !== null) setFetchingQ(false);
  }, [secretQuestion]);

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent === 'reset_ok') {
      // リセット成功 → 認証画面へ戻る
      clearEvent();
      navigation.goBack();
    } else if (lastEvent === 'reset_fail') {
      setError('回答が違います。もう一度お試しください。');
      setLoading(false);
      clearEvent();
    } else if (lastEvent === 'error') {
      setError('エラーが発生しました。');
      setLoading(false);
      clearEvent();
    }
  }, [lastEvent, clearEvent, navigation]);

  const handleReset = () => {
    setError('');
    if (!answer) { setError('回答を入力してください'); return; }
    if (newPassword.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }
    if (newPassword !== confirmPw) { setError('パスワードが一致しません'); return; }
    setLoading(true);
    resetPassword(answer, newPassword);
  };

  if (fetchingQ) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color="#4a90d9" />
        <Text style={s.loadingText}>デバイスから質問を取得中...</Text>
      </View>
    );
  }

  if (!secretQuestion) {
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.noQuestionIcon}>❓</Text>
        <Text style={s.noQuestionTitle}>秘密の質問が設定されていません</Text>
        <Text style={s.noQuestionDesc}>
          パスワードリセットを使うには、事前に{'\n'}
          秘密の質問を設定する必要があります。
        </Text>
        <TouchableOpacity style={s.button} onPress={() => navigation.goBack()}>
          <Text style={s.buttonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>パスワードリセット</Text>

      <View style={s.questionBox}>
        <Text style={s.questionLabel}>秘密の質問</Text>
        <Text style={s.questionText}>{secretQuestion}</Text>
      </View>

      <TextInput
        style={s.input}
        placeholder="回答"
        placeholderTextColor="#999"
        value={answer}
        onChangeText={setAnswer}
        editable={!loading}
      />
      <TextInput
        style={s.input}
        placeholder="新しいパスワード（6文字以上）"
        placeholderTextColor="#999"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        editable={!loading}
      />
      <TextInput
        style={s.input}
        placeholder="新しいパスワード（確認）"
        placeholderTextColor="#999"
        secureTextEntry
        value={confirmPw}
        onChangeText={setConfirmPw}
        editable={!loading}
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={handleReset}
        disabled={loading}>
        <Text style={s.buttonText}>
          {loading ? 'リセット中...' : 'パスワードをリセット'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.linkBtn} onPress={() => navigation.goBack()}>
        <Text style={s.linkText}>← 戻る</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, padding: 24, backgroundColor: '#f5f5f5' },
  center:         { justifyContent: 'center', alignItems: 'center' },
  loadingText:    { marginTop: 12, color: '#666', fontSize: 14 },
  noQuestionIcon: { fontSize: 48, marginBottom: 16 },
  noQuestionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  noQuestionDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  title:          { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  questionBox:    { backgroundColor: '#e3f2fd', padding: 16, borderRadius: 8, marginBottom: 20 },
  questionLabel:  { fontSize: 12, color: '#1565c0', fontWeight: '600', marginBottom: 4 },
  questionText:   { fontSize: 16, color: '#1a237e', fontWeight: '500' },
  input:          { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  error:          { color: '#c62828', marginBottom: 12 },
  button:         { backgroundColor: '#4a90d9', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn:        { alignItems: 'center', marginTop: 20, padding: 8 },
  linkText:       { color: '#4a90d9', fontSize: 14 },
});
