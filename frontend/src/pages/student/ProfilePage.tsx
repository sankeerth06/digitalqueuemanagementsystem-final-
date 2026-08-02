import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api, extractErrorMessage } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { initials } from '../../utils/format';

interface ProfileForm {
  name: string;
  phone?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit } = useForm<ProfileForm>({
    defaultValues: { name: user?.name, phone: user?.phone },
  });
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm } = useForm<PasswordForm>();

  const onSaveProfile = async (values: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', values);
      updateUser(res.data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (values: PasswordForm) => {
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password updated. Please log in again next time.');
      resetPasswordForm();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="card-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-xl font-bold text-violet-600 dark:text-violet-400">
            {initials(user.name)}
          </div>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-ink-600/60 dark:text-white/50">{user.email}</p>
            {user.studentId && <p className="text-xs text-ink-600/40 dark:text-white/30">ID: {user.studentId}</p>}
          </div>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-4 text-sm font-semibold">Personal information</h2>
        <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-4">
          <Input label="Full name" {...registerProfile('name')} />
          <Input label="Phone" {...registerProfile('phone')} />
          <Button type="submit" loading={savingProfile}>Save changes</Button>
        </form>
      </div>

      <div className="card-surface p-6">
        <h2 className="mb-4 text-sm font-semibold">Change password</h2>
        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
          <Input label="Current password" type="password" {...registerPassword('currentPassword', { required: true })} />
          <Input label="New password" type="password" {...registerPassword('newPassword', { required: true, minLength: 8 })} />
          <Button type="submit" variant="secondary" loading={savingPassword}>Update password</Button>
        </form>
      </div>
    </div>
  );
}
