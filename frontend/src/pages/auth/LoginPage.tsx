import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useLogin } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const login = useLogin();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Sign in to track your queue and orders.</p>

      <form onSubmit={handleSubmit((values) => login.mutate(values))} className="mt-6 space-y-4">
        <Input label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-violet-500 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={login.isPending}>Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600/60 dark:text-white/50">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-violet-500 hover:underline">Create one</Link>
      </p>

      <div className="mt-6 rounded-xl bg-black/[0.03] dark:bg-white/5 p-3 text-xs text-ink-600/70 dark:text-white/50">
        <p className="font-semibold mb-1">Demo accounts</p>
        <p>Student: student@qserve.dev / Student@1234</p>
        <p>Staff: staff@qserve.dev / Staff@1234</p>
        <p>Admin: admin@qserve.dev / Admin@1234</p>
      </div>
    </div>
  );
}
