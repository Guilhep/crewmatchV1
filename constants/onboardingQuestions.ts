export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  category: string;
}

export const ONBOARDING_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Qual a taxa de quadros (fps) padrão para cinema?",
    options: ["24fps", "30fps", "60fps", "120fps"],
    correctAnswer: "24fps",
    category: "Fundamentos"
  },
  {
    id: 2,
    question: "O que acontece se você aumentar muito o ISO?",
    options: ["A imagem fica mais escura", "Gera ruído/granulação", "Aumenta a profundidade de campo", "Melhora a qualidade da imagem"],
    correctAnswer: "Gera ruído/granulação",
    category: "Exposição"
  },
  {
    id: 3,
    question: "Para gravar em 60fps mantendo o motion blur natural (Regra dos 180º), qual deve ser o Shutter Speed?",
    options: ["1/60", "1/120", "1/240", "1/30"],
    correctAnswer: "1/120",
    category: "Técnica"
  },
  {
    id: 4,
    question: "Qual destas resoluções é 4K UHD?",
    options: ["1920x1080", "2560x1440", "3840x2160", "4096x2160"],
    correctAnswer: "3840x2160",
    category: "Resolução"
  },
  {
    id: 5,
    question: "Em iluminação, qual temperatura de cor representa a luz do dia (Daylight)?",
    options: ["3200K", "4500K", "5600K", "8000K"],
    correctAnswer: "5600K",
    category: "Iluminação"
  },
  {
    id: 6,
    question: "O que é Profundidade de Campo?",
    options: ["A distância entre a câmera e o objeto", "A área da imagem que está em foco nítido", "A quantidade de luz que entra na câmera", "A velocidade do obturador"],
    correctAnswer: "A área da imagem que está em foco nítido",
    category: "Óptica"
  }
];

export type Patent = 'bronze' | 'prata' | 'ouro';

/**
 * Calcula a patente baseada na porcentagem de acertos (0 a 100)
 * - Menor que 70%: bronze
 * - 70% ou mais: prata
 * Nota: Ouro pode ser implementado no futuro com critérios adicionais
 */
export function calculatePatent(percentage: number): Patent {
  if (percentage >= 70) {
    return 'prata';
  }
  return 'bronze';
}

/**
 * Função legada mantida para compatibilidade
 * @deprecated Use calculatePatent com porcentagem
 */
export type UserLevel = 'silver' | 'bronze' | 'trainee';

export function calculateLevel(score: number): UserLevel {
  if (score >= 7) return 'silver';
  if (score >= 4) return 'bronze';
  return 'trainee';
}



