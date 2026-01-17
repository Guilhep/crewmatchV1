import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { QuizQuestion } from '../../constants/onboardingQuestions';

interface QuizStepProps {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: { [questionId: number]: string };
  onAnswerSelect: (questionId: number, answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const QuizStep: React.FC<QuizStepProps> = ({
  questions,
  currentQuestionIndex,
  answers,
  onAnswerSelect,
  onNext,
  onPrevious,
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-offWhite/60">
            Pergunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <span className="text-sm font-medium text-gold">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-graphite rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-gold rounded-full"
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="p-8 border rounded-2xl bg-graphite border-white/10">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase border rounded-full border-gold/30 text-gold bg-gold/5">
            {currentQuestion.category}
          </span>
        </div>
        
        <h2 className="mb-8 font-serif text-2xl font-bold text-white leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Options */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              return (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onAnswerSelect(currentQuestion.id, option)}
                  className={`w-full p-4 text-left border rounded-lg transition-all ${
                    isSelected
                      ? 'bg-gold/10 border-gold text-white'
                      : 'bg-navy border-white/10 text-offWhite hover:border-gold/30 hover:bg-gold/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckCircle2 size={24} className="text-gold flex-shrink-0" />
                    ) : (
                      <Circle size={24} className="text-offWhite/40 flex-shrink-0" />
                    )}
                    <span className="font-medium">{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onPrevious}
          disabled={isFirstQuestion}
          className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
            isFirstQuestion
              ? 'text-offWhite/20 cursor-not-allowed'
              : 'text-white border border-white/10 bg-graphite hover:bg-white/5'
          }`}
        >
          Anterior
        </button>

        <button
          onClick={onNext}
          disabled={!selectedAnswer}
          className={`px-8 py-3 text-sm font-bold tracking-widest uppercase rounded-lg transition-all ${
            !selectedAnswer
              ? 'bg-graphite text-offWhite/20 cursor-not-allowed'
              : 'bg-gold text-white hover:bg-goldHover shadow-lg hover:shadow-blue-900/20'
          }`}
        >
          {isLastQuestion ? 'Finalizar' : 'Próxima'}
        </button>
      </div>
    </motion.div>
  );
};

export default QuizStep;



