import React from 'react';
import { 
  MessageSquare, 
  PhoneMissed, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { PRICING_TIERS } from '../constants';
import { ViewState } from '../types';

interface LandingPageProps {
  onNavigate: (view: ViewState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LocalAI Receptionist</span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')} 
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 hidden sm:block"
            >
              Log in
            </button>
            <button 
              onClick={() => onNavigate('register')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-lg shadow-indigo-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Now integrating with Google Calendar & Cliniko
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              Never miss a client <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                ever again.
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              An AI receptionist for local businesses that answers every message, books clients, manages cancellations, and handles customer questions — 24/7.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('register')}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial <ArrowRight size={20} />
              </button>
              <button 
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                View Live Demo
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> No credit card required • Cancel anytime
            </p>
          </div>
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-100 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-blob animation-delay-2000"></div>
          </div>
        </section>

        {/* Problem/Solution Grid */}
        <section id="features" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Core Problems You Solve</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Local businesses lose thousands every month due to missed calls and slow replies. We fix that instantly.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mb-6">
                  <PhoneMissed size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Missed Call → Instant SMS</h3>
                <p className="text-slate-600">If you miss a call, our AI instantly texts back: "Sorry we missed you! How can we help?" capturing the lead immediately.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">24/7 Booking Agent</h3>
                <p className="text-slate-600">The AI connects to your calendar (Calendly, Acuity, Google) and books appointments directly in the chat.</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart FAQ Responses</h3>
                <p className="text-slate-600">Trains on your specific business info. Answers questions about pricing, parking, and services automatically.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Built for local service businesses</h2>
                <div className="space-y-6">
                  {[
                    "Acupuncture & Massage",
                    "Beauty Salons & Spas",
                    "Home Services (Plumbing, HVAC)",
                    "Real Estate Agents",
                    "Health Clinics"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-lg text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">10-Minute Setup</h4>
                      <p className="text-slate-600 mt-1">Connect your phone number, upload your service menu, and you're live.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 relative">
                <div className="absolute inset-0 bg-indigo-600 rounded-3xl rotate-3 opacity-10"></div>
                <div className="relative bg-slate-900 rounded-3xl p-6 shadow-2xl text-white max-w-sm mx-auto">
                  {/* Phone Mockup Content */}
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs">AI</div>
                    <div>
                      <div className="font-bold text-sm">LocalAI Receptionist</div>
                      <div className="text-xs text-slate-400">Active now</div>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-end">
                      <div className="bg-indigo-600 px-4 py-2 rounded-2xl rounded-tr-none max-w-[85%]">
                        Hi, do you have any openings for a deep tissue massage tomorrow?
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                        Hi! Yes, we have an opening at 2:00 PM and 4:30 PM tomorrow with Sarah. Would you like to grab one?
                      </div>
                    </div>
                     <div className="flex justify-end">
                      <div className="bg-indigo-600 px-4 py-2 rounded-2xl rounded-tr-none max-w-[85%]">
                        2:00 PM works perfectly.
                      </div>
                    </div>
                     <div className="flex justify-start">
                      <div className="bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                        Great! You're booked for 2:00 PM tomorrow. I've sent a confirmation to your email.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
              <p className="text-slate-600">Pay for results, not per-seat. Cancel anytime.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {PRICING_TIERS.map((tier) => (
                <div key={tier.name} className={`relative bg-white rounded-2xl p-8 border ${tier.recommended ? 'border-indigo-600 shadow-xl' : 'border-slate-200 shadow-sm'} flex flex-col`}>
                  {tier.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">${tier.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <p className="mt-4 text-slate-600 text-sm">{tier.description}</p>
                  
                  <div className="my-8 space-y-4 flex-1">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle2 size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => onNavigate('register')}
                    className={`w-full py-3 rounded-xl font-bold transition ${tier.recommended ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                  >
                    Start Free Trial
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4 text-white">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">L</div>
                <span className="text-xl font-bold">LocalAI Receptionist</span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Automating client communication for local businesses. Book more clients, save time, and grow your revenue on autopilot.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
            © {new Date().getFullYear()} LocalAI Receptionist Inc. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;