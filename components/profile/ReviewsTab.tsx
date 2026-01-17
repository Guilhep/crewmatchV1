import React from 'react';
import { Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  projectName: string;
  clientName?: string;
  feedback: string;
  rating: number; // 1 a 5
  date?: string;
}

interface ReviewsTabProps {
  reviews?: Review[];
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ reviews = [] }) => {
  // Mock data - 3 avaliações de exemplo
  const defaultReviews: Review[] = [
    {
      id: '1',
      projectName: 'Comercial Premium - O2 Filmes',
      clientName: 'O2 Filmes',
      feedback: 'Trabalho excepcional! Profissionalismo e criatividade em cada detalhe. A equipe superou todas as nossas expectativas e entregou um resultado final de altíssima qualidade. Recomendo fortemente para projetos de grande porte.',
      rating: 5,
      date: '15 de Janeiro, 2024',
    },
    {
      id: '2',
      projectName: 'Videoclipe Musical - KondZilla',
      clientName: 'KondZilla Records',
      feedback: 'Excelente comunicação e entrega dentro do prazo. O resultado final superou nossas expectativas. Profissionalismo em todos os aspectos do projeto.',
      rating: 4,
      date: '20 de Fevereiro, 2024',
    },
    {
      id: '3',
      projectName: 'Documentário Independente',
      clientName: 'Produtora Independente',
      feedback: 'Criatividade e atenção aos detalhes impressionantes. O profissional demonstrou grande comprometimento e visão artística única.',
      rating: 5,
      date: '10 de Março, 2024',
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews : defaultReviews;

  // Função para renderizar as estrelas
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const isFilled = index < rating;
      return (
        <Star
          key={index}
          size={18}
          className={
            isFilled
              ? 'text-gold fill-gold'
              : 'text-offWhite/20 fill-offWhite/10'
          }
          strokeWidth={isFilled ? 2 : 1.5}
        />
      );
    });
  };

  // Formatar data se fornecida
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return dateString;
  };

  return (
    <div className="w-full">
      {/* Container de Reviews - Layout Vertical com Espaçamento Generoso */}
      <div className="space-y-6">
        {displayReviews.map((review) => (
          <div
            key={review.id}
            className="group relative bg-graphite border border-white/5 rounded-xl p-6 md:p-8 hover:border-gold/20 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5"
          >
            {/* Decorative Quote Icon */}
            <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Quote size={48} className="text-gold" />
            </div>

            {/* Cabeçalho do Card */}
            <div className="mb-4 pr-16">
              <h3 className="text-white font-bold text-lg md:text-xl mb-2 font-serif">
                {review.projectName}
              </h3>
              
              {/* Client Name e Rating */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {review.clientName && (
                  <p className="text-gold text-sm font-medium">
                    {review.clientName}
                  </p>
                )}
                
                {/* Rating Stars */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-offWhite/60 text-sm font-medium ml-1">
                    {review.rating}/5
                  </span>
                </div>
              </div>

              {/* Date */}
              {review.date && (
                <p className="text-offWhite/40 text-xs mt-2">
                  {formatDate(review.date)}
                </p>
              )}
            </div>

            {/* Separador Elegante */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-5"></div>

            {/* Corpo do Card - Feedback */}
            <div className="relative">
              <p className="text-offWhite/80 leading-relaxed text-base md:text-lg italic font-light">
                "{review.feedback}"
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {displayReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-graphite border border-white/10 flex items-center justify-center mb-6">
            <Star size={40} className="text-offWhite/30" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            Nenhuma avaliação ainda
          </h3>
          <p className="text-offWhite/60 text-center max-w-md">
            Quando você receber avaliações de clientes, elas aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
