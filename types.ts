
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Bird {
  y: number;
  velocity: number;
  rotation: number;
  wingPos: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  type?: 'physics' | 'ambient' | 'glow';
}

export interface AIComment {
  text: string;
  mood: 'encouraging' | 'snarky' | 'surprised';
}

export interface MissionInfo {
  title: string;
  objective: string;
}
