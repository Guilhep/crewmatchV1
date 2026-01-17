import { Conversation, Message } from '../types/messages';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participantId: 'user-1',
    participantName: 'Sebastian Rudiger',
    participantAvatar: 'https://picsum.photos/200/200?random=sebastian',
    lastMessage: 'Perfect! Will check it 🔥',
    lastMessageTime: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    isMatch: false,
  },
  {
    id: '2',
    participantId: 'user-2',
    participantName: 'Caroline Varsaha',
    participantAvatar: 'https://picsum.photos/200/200?random=caroline',
    lastMessage: 'Thanks, Jimmy! Talk later',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 2,
    isOnline: false,
    isMatch: false,
  },
  {
    id: '3',
    participantId: 'user-3',
    participantName: 'Darshan Patelchi',
    participantAvatar: 'https://picsum.photos/200/200?random=darshan',
    lastMessage: 'Sound good for me too!',
    lastMessageTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
    unreadCount: 3,
    isOnline: false,
    isMatch: false,
  },
  {
    id: '4',
    participantId: 'user-4',
    participantName: 'Mohammed Arnold',
    participantAvatar: 'https://picsum.photos/200/200?random=mohammed',
    lastMessage: 'No rush, mate! Just let me know when you\'re ready.',
    lastMessageTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMatch: false,
  },
  {
    id: '5',
    participantId: 'user-5',
    participantName: 'Tamara Schipchinskaya',
    participantAvatar: 'https://picsum.photos/200/200?random=tamara',
    lastMessage: 'Okay, I\'ll tell him about it',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMatch: false,
  },
  {
    id: '6',
    participantId: 'user-6',
    participantName: 'Ariana Amberline',
    participantAvatar: 'https://picsum.photos/200/200?random=ariana',
    lastMessage: 'Good nite, Honey! ❤️',
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: false,
    isMatch: false,
  },
];

// Helper para criar datas com horários específicos
const createDate = (hours: number, minutes: number, daysAgo: number = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    {
      id: 'msg-1-1',
      text: 'Hi, Jimmy! Any update today?',
      senderId: 'user-1',
      receiverId: 'current-user',
      timestamp: createDate(21, 32, 0),
      read: true,
    },
    {
      id: 'msg-1-2',
      text: 'All good! we have some update ✨',
      senderId: 'current-user',
      receiverId: 'user-1',
      timestamp: createDate(21, 33, 0),
      read: true,
    },
    {
      id: 'msg-1-3',
      text: 'Here\'s the new landing page design!',
      senderId: 'current-user',
      receiverId: 'user-1',
      timestamp: createDate(21, 34, 0),
      read: true,
    },
    {
      id: 'msg-1-4',
      text: 'Cool! I have some feedbacks on the "How it work" section. but overall looks good now! 👍',
      senderId: 'user-1',
      receiverId: 'current-user',
      timestamp: createDate(22, 15, 0),
      read: true,
    },
    {
      id: 'msg-1-5',
      text: 'Perfect! Will check it 🔥',
      senderId: 'current-user',
      receiverId: 'user-1',
      timestamp: createDate(21, 34, 0),
      read: true,
    },
  ],
  '2': [
    {
      id: 'msg-2-1',
      text: 'Thanks, Jimmy! Talk later',
      senderId: 'user-2',
      receiverId: 'current-user',
      timestamp: createDate(20, 12, 0),
      read: false,
    },
  ],
  '3': [
    {
      id: 'msg-3-1',
      text: 'Sound good for me too!',
      senderId: 'user-3',
      receiverId: 'current-user',
      timestamp: createDate(14, 29, 0),
      read: false,
    },
  ],
  '4': [
    {
      id: 'msg-4-1',
      text: 'No rush, mate! Just let me know when you\'re ready.',
      senderId: 'user-4',
      receiverId: 'current-user',
      timestamp: createDate(13, 8, 0),
      read: true,
    },
  ],
  '5': [
    {
      id: 'msg-5-1',
      text: 'Okay, I\'ll tell him about it',
      senderId: 'user-5',
      receiverId: 'current-user',
      timestamp: createDate(11, 15, 1),
      read: true,
    },
  ],
  '6': [
    {
      id: 'msg-6-1',
      text: 'Good nite, Honey! ❤️',
      senderId: 'user-6',
      receiverId: 'current-user',
      timestamp: createDate(22, 0, 2),
      read: true,
    },
  ],
};



