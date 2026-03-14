export interface Wallpaper {
  id: string;
  url: string;
  thumbnail: string;
}

export const WALLPAPERS = {
  bright: [
    {
      id: 'b1',
      url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=200',
    },
    {
      id: 'b2',
      url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200',
    },
    {
      id: 'b3',
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200',
    },
    {
      id: 'b4',
      url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=200',
    },
    {
      id: 'b5',
      url: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=200',
    },
    {
      id: 'b6',
      url: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1554034483-04fda0d3507b?q=80&w=200',
    },
  ],
  dark: [
    {
      id: 'd1',
      url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=200',
    },
    {
      id: 'd2',
      url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=200',
    },
    {
      id: 'd3',
      url: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=200',
    },
    {
      id: 'd4',
      url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=200',
    },
    {
      id: 'd5',
      url: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?q=80&w=200',
    },
    {
      id: 'd6',
      url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1000',
      thumbnail: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=200',
    },
  ],
  solid: [
    { id: 's1', url: '#6366f1', thumbnail: '#6366f1' },
    { id: 's2', url: '#ec4899', thumbnail: '#ec4899' },
    { id: 's3', url: '#f59e0b', thumbnail: '#f59e0b' },
    { id: 's4', url: '#10b981', thumbnail: '#10b981' },
    { id: 's5', url: '#3b82f6', thumbnail: '#3b82f6' },
    { id: 's6', url: '#ef4444', thumbnail: '#ef4444' },
    { id: 's7', url: '#8b5cf6', thumbnail: '#8b5cf6' },
    { id: 's8', url: '#06b6d4', thumbnail: '#06b6d4' },
  ],
};

export const BUBBLE_COLORS = [
  '#6366f1', // Indigo (Default)
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#005c4b', // Classic WhatsApp Green
];
