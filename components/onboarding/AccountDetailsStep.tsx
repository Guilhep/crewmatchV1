import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccountDetailsStepProps {
  onNext: (data: { name: string; email: string; password: string }) => void;
}

const AccountDetailsStep: React.FC<AccountDetailsStepProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({ name, email, password });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="mb-8 text-center">
        <h2 className="mb-3 font-serif text-3xl font-bold text-white">Criar Conta</h2>
        <p className="text-offWhite/60 font-sans">Preencha seus dados para começar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-offWhite/80">
            Nome Completo
          </label>
          <div className="relative">
            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-graphite border rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 transition-all ${
                errors.name 
                  ? 'border-red-500/50 focus:ring-red-500/50' 
                  : 'border-white/10 focus:border-gold focus:ring-gold/30'
              }`}
              placeholder="Seu nome completo"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block mb-2 text-sm font-medium text-offWhite/80">
            Email
          </label>
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-graphite border rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 transition-all ${
                errors.email 
                  ? 'border-red-500/50 focus:ring-red-500/50' 
                  : 'border-white/10 focus:border-gold focus:ring-gold/30'
              }`}
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="block mb-2 text-sm font-medium text-offWhite/80">
            Senha
          </label>
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-graphite border rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 transition-all ${
                errors.password 
                  ? 'border-red-500/50 focus:ring-red-500/50' 
                  : 'border-white/10 focus:border-gold focus:ring-gold/30'
              }`}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
        </div>

        {/* Botão Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all shadow-lg bg-gold rounded-lg hover:bg-goldHover hover:shadow-blue-900/20 group mt-8"
        >
          Continuar
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>

      {/* Social Login (opcional - placeholder) */}
      <div className="mt-6">
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-navy text-offWhite/40">ou</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="px-4 py-3 text-sm font-medium text-white border rounded-lg border-white/10 bg-graphite hover:bg-white/5 transition-colors"
          >
            Google
          </button>
          <button
            type="button"
            className="px-4 py-3 text-sm font-medium text-white border rounded-lg border-white/10 bg-graphite hover:bg-white/5 transition-colors"
          >
            GitHub
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountDetailsStep;



