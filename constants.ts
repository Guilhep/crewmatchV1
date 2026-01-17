import { Profile } from './types';

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Ana Silva',
    role: 'Diretora de Fotografia',
    level: 'Lenda',
    verified: true,
    imageUrl: 'https://picsum.photos/200/200?random=5',
    skills: ['Narrativa Visual', 'Luz Natural', 'Liderança de Equipe']
  },
  {
    id: 'p2',
    name: 'Carlos Mendes',
    role: 'Gaffer',
    level: 'Senior',
    verified: true,
    imageUrl: 'https://picsum.photos/200/200?random=6',
    skills: ['Sistemas DMX', 'GrandMA', 'HMI Lighting']
  }
];