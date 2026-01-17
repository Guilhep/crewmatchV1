import React from 'react';
import { ExternalLink } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
}

interface PortfolioTabProps {
  projects?: Project[];
  isOwnProfile?: boolean;
  onAddProject?: () => void;
}

const PortfolioTab: React.FC<PortfolioTabProps> = ({
  projects = [],
  isOwnProfile = false,
  onAddProject,
}) => {
  // Mock data - 3 projetos iniciais
  const defaultProjects: Project[] = [
    {
      id: '1',
      title: 'Comercial Premium',
      imageUrl: 'https://via.placeholder.com/400x400/1C1F26/C6A663?text=Projeto+1',
      link: 'https://youtube.com',
    },
    {
      id: '2',
      title: 'Videoclipe Musical',
      imageUrl: 'https://via.placeholder.com/400x400/1C1F26/C6A663?text=Projeto+2',
      link: 'https://drive.google.com',
    },
    {
      id: '3',
      title: 'Documentário',
      imageUrl: 'https://via.placeholder.com/400x400/1C1F26/C6A663?text=Projeto+3',
      link: 'https://example.com',
    },
  ];

  const displayProjects = projects.length > 0 ? projects : defaultProjects;

  const handleViewProject = (link: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full">
      {/* Grid Container - Responsive Grid */}
      <div 
        className="grid gap-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        }}
      >
        {displayProjects.map((project) => (
          <div
            key={project.id}
            className="group flex flex-col bg-graphite border border-white/5 rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
          >
            {/* Image Container - Square Aspect Ratio */}
            <div className="relative w-full aspect-square overflow-hidden bg-graphite">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <ExternalLink size={24} className="text-white" />
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <h3 className="text-white font-semibold text-base line-clamp-2 min-h-[2.5rem]">
                {project.title}
              </h3>

              {/* Action Button */}
              <button
                onClick={() => handleViewProject(project.link)}
                className="w-full py-2.5 px-4 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/50 text-gold text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn"
              >
                <span>Ver Projeto</span>
                <ExternalLink 
                  size={14} 
                  className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" 
                />
              </button>
            </div>
          </div>
        ))}

        {/* Add Project Button (only for own profile) */}
        {isOwnProfile && (
          <button
            onClick={onAddProject}
            className="flex flex-col items-center justify-center aspect-square bg-graphite border-2 border-dashed border-white/20 rounded-xl hover:border-gold/50 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-full bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mb-3 transition-colors">
              <ExternalLink size={24} className="text-gold" />
            </div>
            <span className="text-sm text-offWhite/60 group-hover:text-gold transition-colors font-medium">
              Adicionar Projeto
            </span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {displayProjects.length === 0 && !isOwnProfile && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-graphite border border-white/10 flex items-center justify-center mb-4">
            <ExternalLink size={32} className="text-offWhite/30" />
          </div>
          <p className="text-offWhite/60 text-center">
            Nenhum projeto no portfólio ainda.
          </p>
        </div>
      )}
    </div>
  );
};

export default PortfolioTab;
