import { useCallback, useState } from 'react';

import { ApiError } from '@/models/api-error';
import * as authService from '@/services/auth-service';
import { PRIVACY_POLICY_VERSION } from '@/constants/privacy-policy';

/**
 * ViewModel — owns the state and the actions of the sign-up screen.
 *
 * Field rules mirror frontend/src/lib/validations.ts `registerSchema`. Unlike
 * sign-in, a successful call here doesn't authenticate anything — the backend
 * returns no token for /auth/register — so `submit` reports success and lets
 * the View send the user to `/login` to sign in for real.
 */
// Updated by AI.
export function useRegisterViewModel() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
    confirmarSenha?: string;
    dataNascimento?: string;
    cpf?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    privacyPolicyAccepted?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  const submit = useCallback(async () => {
    const errors = validate(nome, email, senha, confirmarSenha, dataNascimento, privacyPolicyAccepted, {
      cpf, rua, numero, bairro, cidade, estado, cep,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await authService.register({
        nome, email, senha, dataNascimento: toIsoBirthDate(dataNascimento)!, cpf, rua, numero, bairro, cidade, estado, cep, complemento,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      });
      setDidSucceed(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Erro inesperado ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    nome,
    email,
    senha,
    confirmarSenha,
    dataNascimento,
    cpf,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento,
    privacyPolicyAccepted,
  ]);

  return {
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    dataNascimento,
    setDataNascimento,
    cpf, setCpf, rua, setRua, numero, setNumero, bairro, setBairro,
    cidade, setCidade, estado, setEstado, cep, setCep, complemento, setComplemento,
    privacyPolicyAccepted,
    setPrivacyPolicyAccepted,
    fieldErrors,
    error,
    isSubmitting,
    didSucceed,
    submit,
  };
}

// Updated by AI.
function validate(
  nome: string,
  email: string,
  senha: string,
  confirmarSenha: string,
  dataNascimento: string,
  privacyPolicyAccepted: boolean,
  address: { cpf: string; rua: string; numero: string; bairro: string; cidade: string; estado: string; cep: string }
) {
  const errors: Record<string, string> = {};

  if (nome.trim().length < 3) {
    errors.nome = 'Nome deve ter no mínimo 3 caracteres';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email inválido';
  }
  if (!isPasswordPolicyValid(senha)) {
    errors.senha =
      'Senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas e minúsculas, número e caractere especial';
  }
  if (confirmarSenha !== senha) {
    errors.confirmarSenha = 'As senhas não correspondem';
  }
  const birthDate = parseBirthDate(dataNascimento);
  if (!birthDate || birthDate.age < 0) {
    errors.dataNascimento = 'Informe uma data válida no formato DD/MM/AAAA para maiores de 18 anos';
  } else if (birthDate.age < 18) {
    errors.dataNascimento =
      'A conta não pode ser criada. É necessário ser maior de 18 anos para utilizar a plataforma';
  }
  if (!privacyPolicyAccepted) {
    errors.privacyPolicyAccepted = 'Aceite a Política de Privacidade para criar sua conta';
  }

  for (const [field, value] of Object.entries(address)) {
    if (!value.trim()) errors[field] = 'Campo obrigatório';
  }

  return errors;
}

// Created by AI.
// Updated by AI.
function toIsoBirthDate(value: string): string | null {
  const birthDate = parseBirthDate(value);
  return birthDate && birthDate.age >= 18 ? birthDate.iso : null;
}

// Created by AI.
function parseBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) return null;

  const today = new Date();
  let age = today.getFullYear() - Number(year);
  if (
    today.getMonth() < Number(month) - 1 ||
    (today.getMonth() === Number(month) - 1 && today.getDate() < Number(day))
  ) age -= 1;

  return { age, iso: `${year}-${month}-${day}` };
}

// Created by AI.
function isPasswordPolicyValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}
