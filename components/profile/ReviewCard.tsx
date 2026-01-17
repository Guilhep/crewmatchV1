import React from 'react';
import { Star } from 'lucide-react';

interface ReviewCardProps {
  projectName: string;
  feedback: string;
  rating: number; // 0 a 5
  clientName?: string;
  date?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  projectName,
  feedback,
  rating,
  clientName,
  date,
}) => {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={
          index < rating
            ? 'text-gold fill-gold'
            : 'text-offWhite/20 fill-offWhite/10'
        }
      />
    ));
  };

  return (
    <div className="bg-graphite border border-white/5 rounded-xl p-6 hover:border-gold/20 transition-all duration-300 hover:shadow-lg hover:shadow-gold/5">
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-white font-semibold text-base mb-2">{projectName}</h4>
        {clientName && (
          <p className="text-gold text-xs font-medium mb-1">{clientName}</p>
        )}
        {date && (
          <p className="text-offWhite/40 text-xs">{date}</p>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">{renderStars()}</div>
        <span className="text-offWhite/60 text-xs font-medium">
          {rating}/5
        </span>
      </div>

      {/* Feedback */}
      <p className="text-offWhite/70 text-sm leading-relaxed">{feedback}</p>
    </div>
  );
};

export default ReviewCard;
