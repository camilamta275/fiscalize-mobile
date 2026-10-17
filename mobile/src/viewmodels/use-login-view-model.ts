import { useCallback, useState } from 'react';

import { useSession } from '@/contexts/session-context';

/**
 * ViewModel — owns the state and the actions of the sign-in screen.
 *
 * Field rules mirror frontend/src/lib/validations.ts `loginSchema` so the two
 * apps reject the same input for the same reason.
 */
// Updated by AI.
export function useLoginViewModel() {
  const { signIn, error: authError } = useSession();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; senha?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(async () => {
    const errors = validate(email, senha);
    setFieldErrors(errors);
    if (errors.email || errors.senha) return;

    setIsSubmitting(true);
    try {
      await signIn(email, senha);
    } catch {
      // Already surfaced through `authError` below.
    } finally {
      setIsSubmitting(false);
    }
  }, [email, senha, signIn]);

  return {
    email,
    setEmail,
    senha,
    setSenha,
    fieldErrors,
    error: authError,
    isSubmitting,
    submit,
  };
}

// Updated by AI.
function validate(email: string, senha: string) {
  const errors: { email?: string; senha?: string } = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email inválido';
  }
  if (!isPasswordPolicyValid(senha)) {
    errors.senha =
      'Senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas e minúsculas, número e caractere especial';
  }

  return errors;
}

// Created by AI.
function isPasswordPolicyValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}
