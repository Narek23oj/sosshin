/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';

import { storage } from '../lib/storage';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Check against storage credentials
    if (storage.validateLogin(email, password)) {
      onLogin(email);
      navigate('/admin');
    } else {
      setError('Սխալ email կամ password։');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-main p-6 font-sans">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-bg-card shadow-[0_0_50px_rgba(79,70,229,0.1)] md:grid-cols-2">
        <div className="flex flex-col justify-center p-10 md:p-14">
          <div className="mb-10">
            <a href="/" className="mb-8 inline-flex items-center gap-3">
              <div className="flex h-10 min-w-[54px] items-center justify-center rounded-lg bg-accent font-extrabold text-white">
                SOS
              </div>
              <span className="text-sm font-extrabold text-text-muted">sosshin.am</span>
            </a>
            <p className="eyebrow mb-2">Secure admin area</p>
            <h1 className="text-white text-4xl font-extrabold">Admin Panel</h1>
            <p className="mt-4 text-text-secondary">Մուտք գործեք՝ ապրանքները և հաճախորդների հարցումները կառավարելու համար։</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-white">Admin email</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" 
                  required 
                  className="pl-12"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-extrabold text-white">Password</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" 
                  required 
                  className="pl-12"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-500">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 flex h-14 items-center justify-center rounded-lg bg-accent px-8 font-extrabold text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              {loading ? "Մուտք..." : "Մուտք գործել"}
            </button>
          </form>
        </div>

        <div className="hidden bg-cover bg-center md:block" style={{ backgroundImage: "url('/src/assets/images/sos_pool_equipment_hero_1781518777028.jpg')" }}>
          <div className="h-full w-full bg-bg-main/40 backdrop-blur-[2px]" />
        </div>
      </div>
    </div>
  );
}
