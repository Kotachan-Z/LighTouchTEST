import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLightStore } from '../store/useLightStore';
import type { ScreenProps } from '../types';

export default function SetupScreen({ navigation }: ScreenProps<'Setup'>) {
  const { lastEvent, clearEvent, setPassword, setSecret } = useLightStore();

  // Step 1: パスワード設定  Step 2: 秘密の質問設定
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 フィールド
  const [password, setPasswordInput] = useState('');
  const [confirm, setConfirm] = useState('');

  // Step 2 フィールド
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerConfirm, setAnswerConfirm] = useState('');

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent === 'cmd_ok') {
      if (step === 1) {
        // パスワード設定完了 → Step 2 へ
        setStep(2);
        setLoading(false);
        setError('');
      } else if (step === 2) {
        // 秘密の質問設定完了 → 鍵管理へ (デバイスが KEY_REGISTRATION に遷移)
        navigation.replace('KeyManagement', { fromSetup: true });
      }
    } else if (lastEvent === 'error') {
      setError('エラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
    clearEvent();
  }, [lastEvent, clearEvent, step, navigation]);

  const handleStep1 = () => {
    setError('');
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません');
      return;
    }
    setLoading(true);
    setPassword(password);
  };

  const handleStep2 = () => {
    setError('');
    if (question.trim().length < 4) {
      setError('質問を4文字以上で入力してください');
      return;
    }
    if (answer.length < 2) {
      setError('回答を2文字以上で入力してください');
      return;
    }
    if (answer !== answerConfirm) {
      setError('回答が一致しません');
      return;
    }
    setLoading(true);
    setSecret(question.trim(), answer);
  };

  return (
    <View style={s.container}>
      {/* ステップインジケーター */}
      <View style={s.stepRow}>
        <View style={[s.stepDot, step >= 1 ? s.stepActive : s.stepInactive]}>
          <Text style={s.stepNum}>1</Text>
        </View>
        <View style={s.stepLine} />
        <View style={[s.stepDot, step >= 2 ? s.stepActive : s.stepInactive]}>
          <Text style={s.stepNum}>2</Text>
        </View>
      </View>

      {step === 1 ? (
        <>
          <Text style={s.title}>管理者パスワードを設定</Text>
          <Text style={s.desc}>
            設定変更に使うパスワードです。{'\n'}
            6文字以上、忘れずに保管してください。
          </Text>
          <TextInput
            style={s.input}
            placeholder="パスワード（6文字以上）"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPasswordInput}
            editable={!loading}
          />
          <TextInput
            style={s.input}
            placeholder="パスワード（確認）"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            editable={!loading}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleStep1}
            disabled={loading}>
            <Text style={s.buttonText}>{loading ? '設定中...' : '次へ →'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.title}>秘密の質問を設定</Text>
          <Text style={s.desc}>
            パスワードを忘れたときのリセットに使います。{'\n'}
            自分だけが知っている質問と回答を設定してください。
          </Text>
          <TextInput
            style={s.input}
            placeholder="質問（例: 初めて飼ったペットの名前は？）"
            placeholderTextColor="#999"
            value={question}
            onChangeText={setQuestion}
            editable={!loading}
          />
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
            placeholder="回答（確認）"
            placeholderTextColor="#999"
            value={answerConfirm}
            onChangeText={setAnswerConfirm}
            editable={!loading}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleStep2}
            disabled={loading}>
            <Text style={s.buttonText}>{loading ? '設定中...' : 'セットアップ完了'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, padding: 24, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  stepDot:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepActive:   { backgroundColor: '#4a90d9' },
  stepInactive: { backgroundColor: '#ccc' },
  stepNum:      { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#ccc', maxWidth: 60, marginHorizontal: 8 },
  title:        { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  desc:         { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  input:        { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  error:        { color: '#c62828', marginBottom: 12 },
  button:       { backgroundColor: '#4a90d9', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});
