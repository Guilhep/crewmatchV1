import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { UserLevel } from '../../constants/onboardingQuestions';

interface ResultStepProps {
  score: number;
  level: UserLevel;
  totalQuestions: number;
  onComplete: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({ score, level, totalQuestions, onComplete }) => {
  const levelConfig = {
    silver: {
      label: 'Silver (Prata)',
      description: 'Excelente! Você demonstrou conhecimento técnico avançado.',
      icon: Award,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
      borderColor: 'border-gold',
    },
    bronze: {
      label: 'Bronze',
      description: 'Bom conhecimento técnico. Continue aprimorando suas habilidades.',
      icon: CheckCircle2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400',
    },
    trainee: {
      label: 'Trainee/Pending',
      description: 'Você ainda não atingiu o nível mínimo. Continue estudando e tente novamente.',
      icon: XCircle,
      color: 'text-offWhite/60',
      bgColor: 'bg-offWhite/5',
      borderColor: 'border-offWhite/20',
    },
  };

  const config = levelConfig[level];
  const Icon = config.icon;
  const percentage = Math.round((score / totalQuestions) * 100);
  const canReceiveMatches = level !== 'trainee';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-full max-w-2xl mx-auto text-center"
    >
      {/* Score Display */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="mb-8"
      >
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.bgColor} ${config.borderColor} border-2 mb-6`}>
          <Icon size={48} className={config.color} />
        </div>
        <h2 className="mb-2 font-serif text-4xl font-bold text-white">
          {score}/{totalQuestions}
        </h2>
        <p className="text-2xl font-bold text-gold">{percentage}%</p>
      </motion.div>

      {/* Level Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`p-8 border rounded-2xl ${config.bgColor} ${config.borderColor} border-2 mb-8`}
      >
        <h3 className={`mb-3 font-serif text-3xl font-bold ${config.color}`}>
          Nível {config.label}
        </h3>
        <p className="text-offWhite/80 leading-relaxed">{config.description}</p>
      </motion.div>

      {/* Status Message */}
      {canReceiveMatches ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 p-6 border rounded-xl bg-gold/10 border-gold/30"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={20} className="text-gold" />
            <p className="font-semibold text-gold">Conta criada com sucesso!</p>
          </div>
          <p className="text-sm text-offWhite/70">
            Você já pode receber matches e começar a trabalhar em projetos.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8 p-6 border rounded-xl bg-offWhite/5 border-offWhite/20"
        >
          <p className="text-sm text-offWhite/70">
            Sua conta foi criada, mas você ainda não pode receber matches. Continue estudando e tente novamente em breve.
          </p>
        </motion.div>
      )}

      {/* Complete Button */}
      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onComplete}
        className="w-full px-8 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all shadow-lg bg-gold rounded-lg hover:bg-goldHover hover:shadow-blue-900/20"
      >
        {canReceiveMatches ? 'Acessar Dashboard' : 'Entendido'}
      </motion.button>
    </motion.div>
  );
};

export default ResultStep;



