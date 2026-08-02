import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    // In production this calls POST /api/auth/forgot-password to email a reset link.
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    toast.success(`Reset link sent to ${values.email}`);
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-500/10 text-mint-500">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold">Check your inbox</h1>
        <p className="mt-1.5 text-sm text-ink-600/60 dark:text-white/50">
          We've sent a password reset link. It expires in 15 minutes.
        </p>
        <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-violet-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-600/60 dark:text-white/50">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Email" type="email" placeholder="you@college.edu" error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-violet-500 hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
