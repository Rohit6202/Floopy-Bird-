
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameView from './components/GameView';
import { GameState, AIComment, MissionInfo } from './types';
import { getAICommentary, generateMissionInfo, getLiveInsight } from './services/geminiService';
import { audioService } from './services/audioService';
import { THEMES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappy-highscore');
    return saved ? parseInt(saved) : 0;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [aiComment, setAiComment] = useState<AIComment | null>(null);
  const [missionInfo, setMissionInfo] = useState<MissionInfo | null>(null);
  const [liveInsight, setLiveInsight] = useState("Awaiting flight commands...");
  const [isLoading, setIsLoading] = useState(false);

  const lastInsightScore = useRef(0);

  useEffect(() => {
    if (gameState === GameState.START && !missionInfo) {
      setIsLoading(true);
      generateMissionInfo('Day').then(info => {
        setMissionInfo(info);
        setIsLoading(false);
      });
    }
  }, [gameState, missionInfo]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappy-highscore', score.toString());
    }

    // Every 10 points, get a live AI insight
    if (score > 0 && score % 10 === 0 && score !== lastInsightScore.current) {
      lastInsightScore.current = score;
      getLiveInsight(score).then(setLiveInsight);
    }
  }, [score, highScore]);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    setIsLoading(true);
    const comment = await getAICommentary(finalScore, "Structure failure mid-transit");
    setAiComment(comment);
    setIsLoading(false);
  }, []);

  const startGame = () => {
    setScore(0);
    setAiComment(null);
    setLiveInsight("Stabilizing altitude...");
    setGameState(GameState.PLAYING);
  };

  const currentThemeIdx = Math.min(THEMES.length - 1, Math.floor(score / 10));
  const theme = THEMES[currentThemeIdx];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-500/30">
      <div className="relative w-full max-w-[400px] aspect-[2/3] bg-black rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-[12px] border-slate-900 ring-1 ring-white/10">
        
        <GameView 
          gameState={gameState} 
          onGameOver={handleGameOver} 
          onScoreUpdate={setScore} 
        />

        {/* Audio Control */}
        <button 
          onClick={() => { setIsMuted(!isMuted); audioService.setMuted(!isMuted); }}
          className="absolute top-6 right-6 z-30 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white/80 hover:text-white border border-white/10 active:scale-90 transition-all"
        >
          {isMuted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
        </button>

        {gameState === GameState.START && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-1000">
            <div className="mb-8 text-center px-8">
              <h1 className="pixel-font text-white text-4xl mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                GEMINI<br/>FLAP
              </h1>
              <p className="text-blue-400 font-black tracking-widest text-[8px] uppercase">Neural Network Arcade</p>
            </div>

            <div className="w-full max-w-[280px] space-y-4">
              <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                <p className="text-slate-500 font-bold text-[9px] mb-2 uppercase tracking-widest">Active Mission</p>
                {isLoading ? (
                  <div className="h-10 flex items-center justify-center"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                  <>
                    <p className="pixel-font text-blue-400 text-xs mb-1 uppercase tracking-tighter">{missionInfo?.title}</p>
                    <p className="text-white/60 text-[10px] italic leading-tight">{missionInfo?.objective}</p>
                  </>
                )}
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex justify-between items-center px-6">
                <span className="text-slate-500 font-bold text-[9px] uppercase">Record</span>
                <span className="pixel-font text-white text-lg">{highScore}</span>
              </div>
            </div>

            <button 
              onClick={startGame}
              disabled={isLoading}
              className="mt-12 group relative bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
            >
              Start Uplink
            </button>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-in zoom-in duration-300">
            <div className="w-full max-w-[340px] bg-slate-900/90 border border-white/10 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
              </div>

              <h2 className="pixel-font text-red-500 text-sm mb-6 text-center tracking-widest uppercase">Connectivity Lost</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Transit</p>
                  <p className="pixel-font text-2xl text-white">{score}</p>
                </div>
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Max</p>
                  <p className="pixel-font text-2xl text-yellow-500">{highScore}</p>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-2xl p-5 mb-8 min-h-[100px] flex items-center justify-center">
                {isLoading ? (
                  <div className="flex space-x-1.5"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150"></div></div>
                ) : (
                  <p className="text-[11px] text-slate-300 leading-relaxed text-center font-medium italic">"{aiComment?.text}"</p>
                )}
              </div>

              <button 
                onClick={startGame}
                className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em]"
              >
                Re-Initialize
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <>
            <div className="absolute top-14 left-0 right-0 z-10 pointer-events-none flex flex-col items-center">
              <div className="pixel-font text-6xl text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.7)] animate-in slide-in-from-top duration-500">
                {score}
              </div>
              <div className="mt-6 px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                <p className="text-[8px] pixel-font text-blue-400 tracking-widest uppercase">{theme.name} Grid</p>
              </div>
            </div>

            {/* AI Insight Ticker */}
            <div className="absolute bottom-6 left-6 right-6 z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl py-2 px-4 flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] text-white/70 font-bold whitespace-nowrap animate-marquee">
                  AI CORE: {liveInsight}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
