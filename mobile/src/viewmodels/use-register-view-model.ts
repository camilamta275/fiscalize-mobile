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
export function useRegisterViewModel() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
    confirmarSenha?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  const submit = useCallback(async () => {
    const errors = validate(nome, email, senha, confirmarSenha);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await authService.register(nome, email, senha);
      setDidSucceed(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Erro inesperado ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  }, [nome, email, senha, confirmarSenha]);

  return {
    nome,
    setNome,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    fieldErrors,
    error,
    isSubmitting,
    didSucceed,
    submit,
  };
}

function validate(nome: string, email: string, senha: string, confirmarSenha: string) {
  const errors: { nome?: string; email?: string; senha?: string; confirmarSenha?: string } = {};

  if (nome.trim().length < 3) {
    errors.nome = 'Nome deve ter no mínimo 3 caracteres';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email inválido';
  }
  if (senha.length < 8) {
    errors.senha = 'Senha deve ter no mínimo 8 caracteres';
  }
  if (confirmarSenha !== senha) {
    errors.confirmarSenha = 'As senhas não correspondem';
  }

  return errors;
}
