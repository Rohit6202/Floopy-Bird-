
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const GRAVITY = 0.22;
export const FLAP_STRENGTH = -5.0;
export const PIPE_SPEED = 2.8;
export const PIPE_SPAWN_RATE = 90;
export const PIPE_WIDTH = 65;
export const PIPE_GAP = 150;
export const BIRD_SIZE = 34;
export const BIRD_X = 60;
export const GROUND_HEIGHT = 80;
export const GROUND_SPEED = 3.2;

export const THEMES = [
  { 
    name: 'Day', 
    sky: ['#70c5ce', '#ffffff'], 
    pipe: ['#16a34a', '#4ade80', '#14532d'],
    trail: '#ffffff55',
    ambient: '#ffffffaa'
  },
  { 
    name: 'Sunset', 
    sky: ['#ff5f6d', '#ffc371'], 
    pipe: ['#9a3412', '#f97316', '#7c2d12'],
    trail: '#ffed4a55',
    ambient: '#ffd70044'
  },
  { 
    name: 'Night', 
    sky: ['#0f2027', '#203a43'], 
    pipe: ['#1e3a8a', '#3b82f6', '#172554'],
    trail: '#60a5fa55',
    ambient: '#ffffff88'
  },
  { 
    name: 'Space', 
    sky: ['#000000', '#434343'], 
    pipe: ['#4c1d95', '#a78bfa', '#2e1065'],
    trail: '#c084fc88',
    ambient: '#ffffff'
  },
  { 
    name: 'Cyber', 
    sky: ['#000000', '#1a1a1a'], 
    pipe: ['#be185d', '#f472b6', '#831843'],
    trail: '#f472b6aa',
    ambient: '#00ff41aa'
  },
  { 
    name: 'Abyss', 
    sky: ['#000428', '#004e92'], 
    pipe: ['#0083b0', '#00b4db', '#004e92'],
    trail: '#00b4db66',
    ambient: '#ffffff33'
  },
  { 
    name: 'Inferno', 
    sky: ['#ed213a', '#93291e'], 
    pipe: ['#333333', '#dd1818', '#000000'],
    trail: '#ff4b2b88',
    ambient: '#ff4b2baa'
  }
];
