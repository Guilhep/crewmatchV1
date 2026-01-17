import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Film } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onBack: () => void;
  onLoginSuccess: () => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack, onLoginSuccess, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        onLoginSuccess();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Header */}
      <nav className="fixed top-0 z-40 w-full border-b border-white/5 bg-navy/80 backdrop-blur-md">
        <div className="container flex items-center justify-between px-6 py-4 mx-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-gold text-navy">
              <Film size={20} className="fill-current" />
            </div>
            <span className="text-2xl font-bold font-serif text-white tracking-tight">CrewMatch</span>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-offWhite/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-graphite border border-white/5 rounded-2xl p-8">
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Bem-vindo de volta</h1>
            <p className="text-offWhite/60 mb-8">Entre com suas credenciais para acessar</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-navy border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-navy border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-goldHover text-navy font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-offWhite/60 text-sm">
                Não tem uma conta?{' '}
                <button
                  onClick={onRegister}
                  className="text-gold hover:text-goldHover font-medium transition-colors"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
