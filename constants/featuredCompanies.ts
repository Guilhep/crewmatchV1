export interface FeaturedCompany {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
}

export const FEATURED_COMPANIES: FeaturedCompany[] = [
  {
    id: '1',
    name: 'O2 Filmes',
    description: 'Produções cinematográficas de alto padrão',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    slug: 'o2-filmes',
  },
  {
    id: '2',
    name: 'KondZilla',
    description: 'Maior produtora de videoclipes do Brasil',
    imageUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    slug: 'kondzilla',
  },
  {
    id: '3',
    name: 'Netflix Brasil',
    description: 'Produções originais para streaming global',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    slug: 'netflix-brasil',
  },
  {
    id: '4',
    name: 'Conspiração Filmes',
    description: 'Cinema autoral e produções independentes',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    slug: 'conspiracao-filmes',
  },
  {
    id: '5',
    name: 'Globo Filmes',
    description: 'Grandes produções do cinema nacional',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    slug: 'globo-filmes',
  },
];

