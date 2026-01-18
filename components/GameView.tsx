
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  GRAVITY, 
  FLAP_STRENGTH, 
  PIPE_SPEED, 
  PIPE_SPAWN_RATE, 
  PIPE_WIDTH, 
  PIPE_GAP, 
  BIRD_SIZE, 
  BIRD_X,
  GROUND_HEIGHT,
  GROUND_SPEED,
  THEMES
} from '../constants';
import { GameState, Bird, Pipe, Particle } from '../types';
import { audioService } from '../services/audioService';

interface GameViewProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameView: React.FC<GameViewProps> = ({ gameState, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdRef = useRef<Bird>({ y: GAME_HEIGHT / 2, velocity: 0, rotation: 0, wingPos: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const trailRef = useRef<{x: number, y: number, alpha: number}[]>([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const animationFrameIdRef = useRef<number>();
  const shakeRef = useRef(0);

  const spawnParticles = (x: number, y: number, color: string, count: number, velocity: number = 2, type: 'physics' | 'ambient' | 'glow' = 'physics') => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * velocity + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2,
        type
      });
    }
  };

  const flap = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    birdRef.current.velocity = FLAP_STRENGTH;
    birdRef.current.wingPos = 1;
    audioService.playFlap();
    spawnParticles(BIRD_X - 10, birdRef.current.y, '#ffffff88', 4, 1.5);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); flap(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    if (shakeRef.current > 0) shakeRef.current -= 0.15;

    const bird = birdRef.current;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 3, Math.max(-Math.PI / 6, bird.velocity * 0.08));
    if (bird.wingPos > 0) bird.wingPos -= 0.12;

    trailRef.current.unshift({ x: BIRD_X, y: bird.y, alpha: 0.6 });
    if (trailRef.current.length > 20) trailRef.current.pop();
    trailRef.current.forEach(t => t.alpha -= 0.03);

    const isOutOfBounds = bird.y + BIRD_SIZE / 2 > GAME_HEIGHT - GROUND_HEIGHT || bird.y - BIRD_SIZE / 2 < 0;
    if (isOutOfBounds) { triggerGameOver(); return; }

    groundOffsetRef.current = (groundOffsetRef.current + GROUND_SPEED) % 40;

    frameCountRef.current++;

    // Ambient theme particles
    const currentTheme = THEMES[Math.min(THEMES.length - 1, Math.floor(scoreRef.current / 10))];
    if (frameCountRef.current % 10 === 0) {
      particlesRef.current.push({
        x: GAME_WIDTH + 20,
        y: Math.random() * GAME_HEIGHT,
        vx: -Math.random() * 2 - 1,
        vy: (Math.random() - 0.5) * 1,
        life: 2.0,
        color: currentTheme.ambient,
        size: Math.random() * 3 + 1,
        type: 'ambient'
      });
    }

    if (frameCountRef.current % PIPE_SPAWN_RATE === 0) {
      const topHeight = Math.floor(Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 120)) + 60;
      pipesRef.current.push({ x: GAME_WIDTH, topHeight, bottomY: topHeight + PIPE_GAP, passed: false });
    }

    pipesRef.current.forEach(pipe => {
      pipe.x -= PIPE_SPEED;
      const birdBox = { left: BIRD_X - 12, right: BIRD_X + 12, top: bird.y - 12, bottom: bird.y + 12 };
      if (birdBox.right > pipe.x && birdBox.left < pipe.x + PIPE_WIDTH) {
        if (birdBox.top < pipe.topHeight || birdBox.bottom > pipe.bottomY) triggerGameOver();
      }
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        scoreRef.current += 1;
        onScoreUpdate(scoreRef.current);
        audioService.playScore();
        spawnParticles(pipe.x + PIPE_WIDTH, (pipe.topHeight + pipe.bottomY) / 2, '#fbbf24', 15, 4, 'glow');
      }
    });

    pipesRef.current = pipesRef.current.filter(p => p.x + PIPE_WIDTH > -20);

    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      p.life -= (p.type === 'ambient' ? 0.005 : 0.02);
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    animationFrameIdRef.current = requestAnimationFrame(update);
  }, [gameState, onGameOver, onScoreUpdate]);

  const triggerGameOver = () => {
    audioService.playHit();
    shakeRef.current = 12;
    spawnParticles(BIRD_X, birdRef.current.y, '#facc15', 30, 6);
    spawnParticles(BIRD_X, birdRef.current.y, '#ef4444', 15, 4);
    spawnParticles(BIRD_X, birdRef.current.y, '#ffffff', 10, 8);
    onGameOver(scoreRef.current);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    if (shakeRef.current > 0) ctx.translate(Math.random() * shakeRef.current - shakeRef.current/2, Math.random() * shakeRef.current - shakeRef.current/2);

    const themeIdx = Math.min(THEMES.length - 1, Math.floor(scoreRef.current / 10));
    const theme = THEMES[themeIdx];
    
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGrad.addColorStop(0, theme.sky[0]);
    bgGrad.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid lines for Cyber/Inferno
    if (theme.name === 'Cyber' || theme.name === 'Inferno') {
      ctx.strokeStyle = theme.name === 'Cyber' ? '#00ff4111' : '#ff4b2b11';
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GAME_HEIGHT); ctx.stroke(); }
      for (let i = 0; i < GAME_HEIGHT; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GAME_WIDTH, i); ctx.stroke(); }
    }

    // Bird Trail
    trailRef.current.forEach((t, i) => {
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.fillStyle = theme.trail;
      ctx.beginPath(); ctx.arc(t.x, t.y, (BIRD_SIZE / 2) * (1 - i / 20), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Pipes
    pipesRef.current.forEach(pipe => {
      const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      grad.addColorStop(0, theme.pipe[0]); grad.addColorStop(0.5, theme.pipe[1]); grad.addColorStop(1, theme.pipe[2]);
      
      if (theme.name === 'Cyber' || theme.name === 'Inferno' || theme.name === 'Abyss') {
        ctx.shadowBlur = 15; ctx.shadowColor = theme.pipe[1];
      }

      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;

      // Top
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 25, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.topHeight - 25, PIPE_WIDTH + 10, 25);

      // Bottom
      ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, GAME_HEIGHT);
      ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, GAME_HEIGHT);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 25);
      ctx.strokeRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 25);
      
      ctx.shadowBlur = 0;
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.type === 'glow') { ctx.shadowBlur = 10; ctx.shadowColor = p.color; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1.0;

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GAME_HEIGHT - GROUND_HEIGHT, 0, GAME_HEIGHT);
    groundGrad.addColorStop(0, '#222'); groundGrad.addColorStop(1, '#000');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    ctx.strokeStyle = theme.pipe[1]; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT); ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT); ctx.stroke();
    
    // Bird
    const bird = birdRef.current;
    ctx.save();
    ctx.translate(BIRD_X, bird.y); ctx.rotate(bird.rotation);
    if (theme.name === 'Cyber' || theme.name === 'Inferno') { ctx.shadowBlur = 20; ctx.shadowColor = '#facc15'; }
    ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#854d0e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, BIRD_SIZE/2, BIRD_SIZE/2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(10, -5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffffbb'; ctx.beginPath();
    const wingY = bird.wingPos > 0.5 ? -14 : 4;
    ctx.ellipse(-8, wingY, 12, 7, -bird.rotation * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(25, 2); ctx.lineTo(15, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      birdRef.current = { y: GAME_HEIGHT / 2, velocity: 0, rotation: 0, wingPos: 0 };
      pipesRef.current = []; particlesRef.current = []; trailRef.current = [];
      scoreRef.current = 0; frameCountRef.current = 0; update();
    } else {
      const ctx = canvasRef.current?.getContext('2d'); if (ctx) draw(ctx);
    }
    return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [gameState, update]);

  return <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} onClick={flap} className="block w-full h-full cursor-pointer touch-none" />;
};

export default GameView;
