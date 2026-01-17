import React, { useState } from 'react';
import { Mail, Lock, User, Building2, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccountDetailsStepCompanyProps {
  onNext: (data: {
    name: string;
    companyName: string;
    email: string;
    password: string;
    cnpj: string;
  }) => void;
}

// Função para formatar CNPJ (XX.XXX.XXX/XXXX-XX)
const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12)
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

// Função para validar CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.length === 14;
};

const AccountDetailsStepCompany: React.FC<AccountDetailsStepCompanyProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome do responsável é obrigatório';
    }

    if (!companyName.trim()) {
      newErrors.companyName = 'Nome da produtora é obrigatório';
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

    if (!cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!validateCNPJ(cnpj)) {
      newErrors.cnpj = 'CNPJ inválido (deve ter 14 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({ name, companyName, email, password, cnpj: cnpj.replace(/\D/g, '') });
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
        <h2 className="mb-3 font-serif text-3xl font-bold text-white">Criar Conta - Produtora</h2>
        <p className="text-offWhite/60 font-sans">Preencha os dados da sua produtora</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome do Responsável */}
        <div>
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-offWhite/80">
            Nome do Responsável
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

        {/* Nome da Produtora */}
        <div>
          <label htmlFor="companyName" className="block mb-2 text-sm font-medium text-offWhite/80">
            Nome da Produtora
          </label>
          <div className="relative">
            <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" />
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-graphite border rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 transition-all ${
                errors.companyName
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-white/10 focus:border-gold focus:ring-gold/30'
              }`}
              placeholder="Nome da sua produtora"
            />
          </div>
          {errors.companyName && <p className="mt-1 text-sm text-red-400">{errors.companyName}</p>}
        </div>

        {/* CNPJ */}
        <div>
          <label htmlFor="cnpj" className="block mb-2 text-sm font-medium text-offWhite/80">
            CNPJ
          </label>
          <div className="relative">
            <FileText size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-offWhite/40" />
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={handleCnpjChange}
              maxLength={18}
              className={`w-full pl-12 pr-4 py-3 bg-graphite border rounded-lg text-white placeholder-offWhite/40 focus:outline-none focus:ring-2 transition-all ${
                errors.cnpj
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-white/10 focus:border-gold focus:ring-gold/30'
              }`}
              placeholder="00.000.000/0000-00"
            />
          </div>
          {errors.cnpj && <p className="mt-1 text-sm text-red-400">{errors.cnpj}</p>}
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
              placeholder="contato@produtora.com"
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
          Criar Conta
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </motion.div>
  );
};

export default AccountDetailsStepCompany;
