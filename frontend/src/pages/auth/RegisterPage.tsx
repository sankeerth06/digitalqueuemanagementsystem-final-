import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useRegister } from '../../hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  studentId: z.string().optional(),
  password: z.string().min(8, 'At least 8 characters').regex(/\d/, 'Must include a number'),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const registerMutation = useRegister();

  return (
    <div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">Join QServe and skip the physical line.</p>

      <form onSubmit={handleSubmit((values) => registerMutation.mutate(values))} className="mt-6 space-y-4">
        <Input label="Full name" placeholder="Asha Verma" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        <Input label="Student ID (optional)" placeholder="CS21B045" error={errors.studentId?.message} {...register('studentId')} />
        <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" loading={registerMutation.isPending}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600/60 dark:text-white/50">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-violet-500 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
