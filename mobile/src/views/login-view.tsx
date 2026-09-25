import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLoginViewModel } from '@/viewmodels/use-login-view-model';

const DEMO_USERS = [
  { email: 'cidadao@fiscalize.gov.br', label: 'Cidadão Teste', perfil: 'Cidadão', senha: 'Cidadao@123456', color: '#3182ce' },
  { email: 'gestor@fiscalize.gov.br', label: 'EMLURB', perfil: 'Gestor', senha: 'Gestor@123456', color: '#38a169' },
  { email: 'gestor.compesa@fiscalize.gov.br', label: 'COMPESA', perfil: 'Gestor', senha: 'Gestor@123456', color: '#00a3c4' },
  { email: 'gestor.celpe@fiscalize.gov.br', label: 'CELPE', perfil: 'Gestor', senha: 'Gestor@123456', color: '#d69e2e' },
  { email: 'gestor.cttu@fiscalize.gov.br', label: 'CTTU', perfil: 'Gestor', senha: 'Gestor@123456', color: '#dd6b20' },
  { email: 'gestor.sinfra@fiscalize.gov.br', label: 'SINFRA', perfil: 'Gestor', senha: 'Gestor@123456', color: '#319795' },
  { email: 'gestor.semc@fiscalize.gov.br', label: 'SEMC', perfil: 'Gestor', senha: 'Gestor@123456', color: '#805ad5' },
  { email: 'admin@fiscalize.gov.br', label: 'Admin', perfil: 'Admin', senha: 'Admin@123456', color: '#e53e3e' },
] as const;

/**
 * View — the sign-in screen. Holds no state and performs no I/O of its own;
 * everything it shows comes from the ViewModel.
 */
export function LoginView() {
  const { email, setEmail, senha, setSenha, fieldErrors, error, isSubmitting, submit } =
    useLoginViewModel();
  const [focusedField, setFocusedField] = useState<'email' | 'senha' | null>(null);

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Fiscalize</Text>
              <Text style={styles.subtitle}>Sistema integrado de gestão urbana de Pernambuco</Text>
            </View>

            <View style={styles.form}>
              <Field
                autoComplete="email"
                error={fieldErrors.email}
                focused={focusedField === 'email'}
                keyboardType="email-address"
                label="Email"
                onBlur={() => setFocusedField(null)}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                placeholder="seu@email.com"
                value={email}
              />
              <Field
                autoComplete="password"
                error={fieldErrors.senha}
                focused={focusedField === 'senha'}
                label="Senha"
                onBlur={() => setFocusedField(null)}
                onChangeText={setSenha}
                onFocus={() => setFocusedField('senha')}
                placeholder="qualquer senha"
                secureTextEntry
                value={senha}
              />

              {error ? <Text style={styles.feedback}>{error}</Text> : null}

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={submit}
                style={[styles.button, isSubmitting && styles.buttonDisabled]}>
                {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Entrar</Text>}
              </Pressable>
            </View>

            <QuickAccess onSelect={(demo) => { setEmail(demo.email); setSenha(demo.senha); }} />

            <Text style={styles.registerText}>
              Não tem uma conta?{' '}
              <Link href="/register" style={styles.registerLink}>
                Criar conta
              </Link>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({
  autoComplete,
  error,
  focused,
  keyboardType,
  label,
  onBlur,
  onChangeText,
  onFocus,
  placeholder,
  secureTextEntry,
  value,
}: {
  autoComplete: 'email' | 'password';
  error?: string;
  focused: boolean;
  keyboardType?: 'default' | 'email-address';
  label: string;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="#a0aec0"
        secureTextEntry={secureTextEntry}
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function QuickAccess({ onSelect }: { onSelect: (demo: (typeof DEMO_USERS)[number]) => void }) {
  const citizens = DEMO_USERS.filter((user) => user.perfil === 'Cidadão');
  const managers = DEMO_USERS.filter((user) => user.perfil === 'Gestor');
  const admins = DEMO_USERS.filter((user) => user.perfil === 'Admin');

  return (
    <View style={styles.quickAccess}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Acesso rápido</Text>
        <View style={styles.divider} />
      </View>
      {citizens.map((user) => <DemoButton key={user.email} user={user} onPress={() => onSelect(user)} fullWidth />)}
      <View style={styles.managerGrid}>
        {managers.map((user) => <DemoButton key={user.email} user={user} onPress={() => onSelect(user)} />)}
      </View>
      {admins.map((user) => <DemoButton key={user.email} user={user} onPress={() => onSelect(user)} fullWidth />)}
      <Text style={styles.hint}>Clique para preencher automaticamente</Text>
    </View>
  );
}

function DemoButton({
  fullWidth = false,
  onPress,
  user,
}: {
  fullWidth?: boolean;
  onPress: () => void;
  user: (typeof DEMO_USERS)[number];
}) {
  return (
    <Pressable onPress={onPress} style={[styles.demoButton, { borderColor: user.color }, fullWidth && styles.demoButtonFull]}>
      <Text numberOfLines={1} style={styles.demoLabel}>{user.label}</Text>
      <Text style={[styles.badge, { backgroundColor: user.color }]}>{user.perfil}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  title: {
    color: '#1a202c',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#718096',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#2d3748',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    color: '#1a202c',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputFocused: {
    borderColor: '#667eea',
  },
  inputError: {
    borderColor: '#e53e3e',
  },
  error: {
    color: '#e53e3e',
    fontSize: 12,
  },
  feedback: {
    color: '#e53e3e',
    fontSize: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 13,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAccess: {
    marginTop: 32,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  divider: {
    backgroundColor: '#e2e8f0',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#a0aec0',
    fontSize: 12,
  },
  managerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  demoButton: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    minWidth: '46%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  demoButtonFull: {
    flex: 0,
    width: '100%',
  },
  demoLabel: {
    color: '#2d3748',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  hint: {
    color: '#a0aec0',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  registerText: {
    color: '#718096',
    fontSize: 14,
    marginTop: 32,
    textAlign: 'center',
  },
  registerLink: {
    color: '#4c51bf',
    fontWeight: '600',
  },
});
