import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handle() {
    setLoading(true);
    setMsg('');
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (error) {
      setMsg(error.message);
    } else if (mode === 'signup') {
      setMsg('Check your email to confirm your account.');
    } else {
      navigate('/');
    }
    setLoading(false);
  }

  async function handleDemo() {
    setLoading(true);
    setMsg('');
    // Unique demo account per browser, stored locally so the same demo user returns
    let demoEmail = localStorage.getItem('demo_email');
    let demoPassword = localStorage.getItem('demo_password');
    if (!demoEmail || !demoPassword) {
      const rand = Math.random().toString(36).slice(2, 10);
      demoEmail = `demo_${rand}_${Date.now()}@investar.demo`;
      demoPassword = `Demo!${Math.random().toString(36).slice(2, 14)}`;
      localStorage.setItem('demo_email', demoEmail);
      localStorage.setItem('demo_password', demoPassword);
    }

    let { error } = await supabase.auth.signInWithPassword({
      email: demoEmail, password: demoPassword,
    });
    if (error) {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: demoEmail, password: demoPassword,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpErr) {
        setMsg(signUpErr.message);
        setLoading(false);
        return;
      }
      const retry = await supabase.auth.signInWithPassword({
        email: demoEmail, password: demoPassword,
      });
      if (retry.error) {
        setMsg('Demo unavailable: please confirm email is auto-confirmed in auth settings.');
        setLoading(false);
        return;
      }
    }
    navigate('/');
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setMsg('');
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMsg((result.error as Error).message || 'Google sign-in failed');
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate('/');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">InveStarAnalyst</div>
            <div className="text-xs text-muted-foreground">AI Investment Advisor</div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-5">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === 'Enter' && handle()}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {msg && (
            <div className="mt-3 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs">
              {msg}
            </div>
          )}

          <button
            onClick={handle} disabled={loading}
            className="w-full mt-5 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">or</span></div>
          </div>

          <button
            onClick={handleGoogle} disabled={loading}
            className="w-full bg-background text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/40 disabled:opacity-40 flex items-center justify-center gap-2 transition-all border border-border"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5.2 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.1 5.2C40 35.7 43.5 30.3 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleDemo} disabled={loading}
            className="w-full mt-2 bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/70 disabled:opacity-40 flex items-center justify-center gap-2 transition-all border border-border"
          >
            Continue as Demo
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center mt-4 text-xs text-muted-foreground">
            {mode === 'login' ? "No account? " : "Have an account? "}
            <button
              className="text-primary hover:underline"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
