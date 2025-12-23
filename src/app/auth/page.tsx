'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  LogIn,
  UserPlus,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router, supabase.auth]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Successfully signed in! Redirecting...',
      });
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error.message || 'Failed to sign in. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: "Account created! Check your email to confirm your account. After confirming, you'll be redirected back to the app automatically.",
      });

      // Clear form fields after successful signup
      setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
      }, 1000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-10 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-60 left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back to Home Button */}
          <button
            onClick={() => router.push('/')}
            className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Auth Card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 dark:from-green-500 dark:via-purple-500 dark:to-blue-500 bg-clip-text text-transparent mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-muted-foreground">
                {isSignUp
                  ? 'Start your wellness journey today'
                  : 'Sign in to continue tracking your health'}
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg border animate-fade-in ${
                  message.type === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                }`}
              >
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Auth Form */}
            <form
              onSubmit={isSignUp ? handleSignUp : handleSignIn}
              className="space-y-4"
            >
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {isSignUp && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 via-purple-500 to-blue-500 hover:from-green-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <UserPlus className="w-5 h-5" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </>
                )}
              </button>
            </form>

            {/* Toggle Sign In/Sign Up */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      Sign In
                    </span>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      Sign Up
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Guest Mode Option */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 rounded-lg border border-border/50 hover:bg-muted/50 font-medium transition-all duration-300 hover:scale-105 active:scale-95 text-sm"
              >
                Continue as Guest
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Try the app without an account (data saved locally)
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing up, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}
