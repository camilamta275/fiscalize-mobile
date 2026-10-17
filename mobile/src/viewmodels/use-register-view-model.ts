import { useCallback, useState } from 'react';

import { ApiError } from '@/models/api-error';
import * as authService from '@/services/auth-service';

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
  const [cpf, setCpf] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [complemento, setComplemento] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
    confirmarSenha?: string;
    cpf?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  const submit = useCallback(async () => {
    const errors = validate(nome, email, senha, confirmarSenha, {
      cpf, rua, numero, bairro, cidade, estado, cep,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await authService.register({
        nome, email, senha, cpf, rua, numero, bairro, cidade, estado, cep, complemento,
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
    cpf,
    rua,
    numero,
    bairro,
    cidade,
    estado,
    cep,
    complemento,
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
    cpf, setCpf, rua, setRua, numero, setNumero, bairro, setBairro,
    cidade, setCidade, estado, setEstado, cep, setCep, complemento, setComplemento,
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
  for (const [field, value] of Object.entries(address)) {
    if (!value.trim()) errors[field] = 'Campo obrigatório';
  }

  return errors;
}

// Created by AI.
function isPasswordPolicyValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}
