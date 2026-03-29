export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping?: boolean;
  status?: 'read' | 'delivered' | 'sent';
  isJoinedNew?: boolean;
  canInvite?: boolean;
  about?: string;
  phoneNumber?: string;
}

export const DEMO_DATA: Chat[] = [
  {
    id: '1',
    name: 'Shivraj Singh',
    lastMessage: 'Yo! Did you check the new design?',
    time: '12:45 PM',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&q=80',
    unreadCount: 2,
    isOnline: true,
    isTyping: false,
    status: 'read',
  },
  {
    id: '2',
    name: 'Google Deepmind',
    lastMessage: 'The new Gemini model is fire! 🚀',
    time: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1614850523060-8da1d56aeef6?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: true,
    isTyping: true,
    status: 'delivered',
  },
  {
    id: '3',
    name: 'Design Team',
    lastMessage: 'Sent the finalized assets for the mobile app.',
    time: 'Monday',
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
  {
    id: '4',
    name: 'Elon Musk',
    lastMessage: "Let's go to Mars next week! 🌌",
    time: 'Dec 12',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'sent',
  },
  {
    id: '5',
    name: 'Sarah Connor',
    lastMessage: 'The future is not set.',
    time: 'Nov 22',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
  {
    id: '6',
    name: 'Tony Stark',
    lastMessage: 'I am Iron Man.',
    time: 'Oct 05',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
  {
    id: '7',
    name: 'Peter Parker',
    lastMessage: 'With great power comes great responsibility.',
    time: 'Just Now',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&q=80',
    unreadCount: 5,
    isOnline: true,
    status: 'delivered',
  },
  {
    id: '8',
    name: 'Bruce Wayne',
    lastMessage: 'I have a plan.',
    time: '2h ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
  {
    id: '9',
    name: 'Natasha Romanoff',
    lastMessage: 'The sun is getting real low.',
    time: '3h ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: true,
    status: 'delivered',
  },
  {
    id: '10',
    name: 'Wanda Maximoff',
    lastMessage: 'Everything is fine.',
    time: 'Yesterday',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
  {
    id: '11',
    name: 'Stephen Strange',
    lastMessage: 'I saw 14,000,605 futures.',
    time: 'Wednesday',
    avatar: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'sent',
  },
  {
    id: '12',
    name: 'Steve Rogers',
    lastMessage: 'I can do this all day.',
    time: 'Dec 15',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&q=80',
    unreadCount: 0,
    isOnline: false,
    status: 'read',
  },
];
