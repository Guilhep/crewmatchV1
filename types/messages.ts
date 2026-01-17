export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
  type?: 'text' | 'image' | 'system';
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline?: boolean;
  isMatch?: boolean;
  matchJobTitle?: string;
}

export interface ChatState {
  selectedConversationId: string | null;
  showChatOnMobile: boolean;
}



