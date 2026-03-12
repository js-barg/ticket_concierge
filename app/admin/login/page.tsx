import { redirect } from 'next/navigation';
import { getServerSession, requireAdminRole } from '../../../lib/auth';
import { AdminLoginForm } from './AdminLoginForm';

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (session?.user && requireAdminRole(session.user)) {
    redirect((await searchParams).callbackUrl ?? '/admin');
  }

  const { callbackUrl, error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <h1 className="text-xl font-semibold text-white">Admin sign in</h1>
      <AdminLoginForm callbackUrl={callbackUrl ?? '/admin'} />
      {error === 'CredentialsSignin' && (
        <p className="text-sm text-amber-400">Invalid email or password.</p>
      )}
    </div>
  );
}
