import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, extractErrorMessage } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await api.post('/auth/login', input);
      return res.data.data as { user: User; accessToken: string };
    },
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      redirectByRole(user.role, navigate);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await api.post('/auth/register', input);
      return res.data.data as { user: User; accessToken: string };
    },
    onSuccess: ({ user, accessToken }) => {
      setSession(user, accessToken);
      toast.success('Account created! Welcome to QServe.');
      navigate('/student');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearSession();
      navigate('/login');
    },
  });
}

function redirectByRole(role: User['role'], navigate: ReturnType<typeof useNavigate>) {
  if (role === 'admin') navigate('/admin');
  else if (role === 'staff') navigate('/staff');
  else navigate('/student');
}
