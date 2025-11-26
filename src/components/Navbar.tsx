'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Activity, Sparkles, User, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ModeToggle } from '@/components/mode-toggle';

export default function Navbar() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  // Track current user ID to prevent unnecessary re-renders
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sessionUser = (data as any).session?.user ?? null;
      setUser(sessionUser);
      currentUserIdRef.current = sessionUser?.id || null;
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null;
        const currentUserId = currentUserIdRef.current;
        const newUserId = newUser?.id || null;

        // Ignore SIGNED_IN events if user hasn't actually changed
        if (event === 'SIGNED_IN' && currentUserId === newUserId) {
          return;
        }

        // Only update state if user actually changed
        if (currentUserId !== newUserId) {
          setUser(newUser);
          currentUserIdRef.current = newUserId;

          if (event === 'SIGNED_IN' && session) {
            setIsDialogOpen(false);
            router.push('/dashboard');
          }
        }
      }
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  async function signUp() {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setError('Check your email for confirmation!');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo/Title */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-purple-500 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-400 dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Health Tracker
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Your Complete Wellness Dashboard
                </p>
              </div>
            </Link>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <ModeToggle />
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                    <div className="relative">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-semibold text-xs hidden sm:inline">
                      Cloud Synced
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="group px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 flex items-center gap-1.5 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20"
                  >
                    <svg
                      className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-2 border border-amber-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="hidden sm:inline">Guest Mode</span>
                  </div>
                  <button
                    onClick={() => router.push('/auth')}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 border border-white/20"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'signin'
                ? 'Sign in to access your health dashboard'
                : 'Create an account to start tracking your nutrition'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div
                className={`text-sm p-3 rounded-md ${
                  error.includes('Check your email')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {error}
              </div>
            )}
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => (mode === 'signin' ? signIn() : signUp())}
              disabled={loading}
            >
              {loading
                ? 'Loading...'
                : mode === 'signin'
                ? 'Sign In'
                : 'Sign Up'}
            </Button>
            <button
              className="w-full text-sm text-slate-600 hover:text-slate-900"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
