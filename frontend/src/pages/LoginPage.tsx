import React, { useState } from 'react';
import axios from 'axios';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole, LogIn, Mail, Moon, School, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppUi } from '../context/AppContext';

type LoginLocationState = { from?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useAppUi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedPath = (location.state as LoginLocationState | null)?.from;
  const destination = requestedPath?.startsWith('/') && requestedPath !== '/login'
    ? requestedPath
    : '/painel';

  if (isAuthenticated) return <Navigate to={destination} replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError('Informe o e-mail e a senha.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (requestError: unknown) {
      const message = axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error
        : null;
      setError(message || 'Não foi possível entrar. Verifique a conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-main relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[100px] animate-mesh-1" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[100px] animate-mesh-2" />
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
        className="absolute top-4 right-4 p-3 rounded-xl border border-border bg-card/80 text-text-muted hover:text-text-main hover:bg-surface transition-colors"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-amber-400" />}
      </button>

      <section className="glass-panel relative w-full max-w-md rounded-3xl border border-border shadow-2xl p-6 sm:p-8 bg-card">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <School size={24} />
          </div>
          <div>
            <span className="font-black text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-widest font-display">
              SGST
            </span>
            <p className="text-xs font-bold text-text-muted">Gestão de ambientes e turmas</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-black font-display tracking-tight">Acessar o sistema</h1>
          <p className="mt-1 text-sm text-text-muted">Entre com as credenciais fornecidas pela administração.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-black text-text-muted uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                disabled={isSubmitting}
                className="w-full border border-border rounded-xl py-3 pl-10 pr-3 bg-input text-text-main text-sm font-semibold outline-none focus:border-primary disabled:opacity-60"
                placeholder="usuario@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-black text-text-muted uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <LockKeyhole size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={event => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="w-full border border-border rounded-xl py-3 pl-10 pr-3 bg-input text-text-main text-sm font-semibold outline-none focus:border-primary disabled:opacity-60"
                placeholder="Sua senha"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white rounded-xl py-3 px-4 font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 size={17} className="animate-spin" /> Entrando...</>
            ) : (
              <><LogIn size={17} /> Entrar</>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
