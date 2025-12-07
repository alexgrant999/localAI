
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Building2, 
  ArrowRight, 
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { ViewState } from '../types';
import { supabase, isSupabaseConfigured, SITE_URL } from '../supabaseClient';

interface AuthPageProps {
  view: 'login' | 'register';
  onNavigate: (view: ViewState) => void;
  initialError?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ view, onNavigate, initialError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: ''
  });

  // Determine the redirect URL: Use config SITE_URL if set, otherwise current browser origin
  const getRedirectUrl = () => {
    return SITE_URL ? SITE_URL : window.location.origin;
  };

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Safety check for demo environment
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured in supabaseClient.ts. Please add your URL and Key.");
      setIsLoading(false);
      return;
    }

    // Client-side validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const emailCleaned = formData.email.trim();

      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailCleaned,
          password: formData.password,
        });
        if (error) throw error;
        // Success is handled by App.tsx onAuthStateChange listener
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: emailCleaned,
          password: formData.password,
          options: {
            emailRedirectTo: getRedirectUrl(), // Ensure user returns to the correct app URL after confirming
            data: {
              name: formData.name,
              companyName: formData.companyName,
              plan: 'pro', // Default plan for trial
            }
          }
        });
        
        if (error) throw error;

        // Check if session was created immediately (Auto Confirm ON) or if email verification is needed (Auto Confirm OFF)
        if (data.user && !data.session) {
          setShowConfirmation(true);
          setIsLoading(false);
          return;
        }
        
        // If data.session exists, the onAuthStateChange listener in App.tsx will handle the redirect
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || err.error_description || "An error occurred";
      
      if (msg.includes("Email not confirmed")) {
        // If email isn't confirmed, show the confirmation screen so they can resend
        setSuccessMessage("Your email exists but is not confirmed.");
        setShowConfirmation(true);
      } else if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again or reset your password.");
      } else if (msg.includes("User already registered")) {
        setError("This email is already registered. Please log in.");
      } else if (msg.includes("Password should be at least")) {
        setError("Password is too short. It must be at least 6 characters.");
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email.trim(),
        options: {
          emailRedirectTo: getRedirectUrl()
        }
      });
      if (error) throw error;
      setSuccessMessage("Confirmation email resent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address above to reset your password.");
      return;
    }
    setResendLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email.trim(), {
        redirectTo: getRedirectUrl() + '#reset-password',
      });
      if (error) throw error;
      setSuccessMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  // ----------------------------------------------------------------------
  // VIEW: Email Confirmation Sent / Check Email
  // ----------------------------------------------------------------------
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-600 mb-6">
              We've sent a confirmation link to <span className="font-semibold text-slate-800">{formData.email}</span>.
            </p>
            
            {successMessage && (
               <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 font-medium">
                 {successMessage}
               </div>
            )}
            
            {error && (
               <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700 font-medium">
                 {error}
               </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-70 text-slate-900"
              >
                {resendLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <RefreshCw className="h-4 w-4 mr-2"/>}
                Resend Confirmation Email
              </button>
              
              <button
                onClick={() => onNavigate('login')}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
              >
                Back to Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW: Login / Register Form
  // ----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-white-200">
            L
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900">
          {view === 'login' ? 'Welcome back' : 'Start your 14-day free trial'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {view === 'login' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => onNavigate('register')} className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => onNavigate('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {!isSupabaseConfigured() && (
             <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-amber-800">
                <strong>Config Required:</strong> Please open <code>supabaseClient.ts</code> and add your Supabase URL and Anon Key to make this form work.
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-3">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                 <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {successMessage && (
               <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 font-medium flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-green-600" />
                 {successMessage}
               </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {view === 'register' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-slate-300 pl-10 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">
                    Business Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-slate-300 pl-10 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                      placeholder="Jane's Yoga Studio"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 pl-10 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  {view === 'login' && (
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resendLoading}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={view === 'login' ? "current-password" : "new-password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 pl-10 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm bg-white"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {view === 'register' && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-slate-700">
                    I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms</a> and <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                  </label>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    {view === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
            
          </form>

          {view === 'register' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Trusted by 500+ businesses</span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="flex justify-center grayscale opacity-50 hover:opacity-100 transition">
                  <img src="https://logo.clearbit.com/mindbodyonline.com" alt="Mindbody" className="h-6" />
                </div>
                <div className="flex justify-center grayscale opacity-50 hover:opacity-100 transition">
                  <img src="https://logo.clearbit.com/jane.app" alt="Jane" className="h-6" />
                </div>
                <div className="flex justify-center grayscale opacity-50 hover:opacity-100 transition">
                  <img src="https://logo.clearbit.com/cliniko.com" alt="Cliniko" className="h-6" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center">
           <button 
             onClick={() => onNavigate('landing')}
             className="text-sm text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 w-full"
            >
              <ArrowLeft size={14} /> Back to Home
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
