import React from 'react';
import { ExternalLink } from 'lucide-react';

interface PortfolioCardProps {
  thumbnailUrl: string;
  title: string;
  projectUrl?: string;
  onViewProject?: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  thumbnailUrl,
  title,
  projectUrl,
  onViewProject,
}) => {
  const handleClick = () => {
    if (projectUrl) {
      window.open(projectUrl, '_blank', 'noopener,noreferrer');
    } else if (onViewProject) {
      onViewProject();
    }
  };

  return (
    <div className="group relative bg-graphite border border-white/5 rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10">
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-graphite">
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Overlay no hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <ExternalLink size={24} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {title}
        </h3>
        <button
          onClick={handleClick}
          className="w-full py-2.5 px-4 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/50 text-gold text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-300"
        >
          Ver Projeto
        </button>
      </div>
    </div>
  );
};

export default PortfolioCard;
