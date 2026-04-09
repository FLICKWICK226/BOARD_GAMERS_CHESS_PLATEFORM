import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useChessGame } from '@/hooks/use-chess-game';
import { EngineLevel } from '@/hooks/use-stockfish';
import { Bot, RotateCcw, ArrowLeft, Trophy, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameViewProps {
  level: EngineLevel;
  onBack: () => void;
}

export function GameView({ level, onBack }: GameViewProps) {
  const [gameResult, setGameResult] = useState<string | null>(null);
  
  const { 
    fen, 
    makeMove, 
    resetGame, 
    undoMove, 
    thinking, 
    isReady,
    isGameOver 
  } = useChessGame({
    level,
    onGameOver: (result) => setGameResult(result),
  });

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // Always promote to queen for simplicity
    });
    return move;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sidebar: Move Info & Controls */}
      <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux niveaux
        </Button>

        <div className="bg-surface-container rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-tight">IA Stockfish</h3>
              <p className="text-xs text-muted-foreground capitalize">{level}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Statut :</span>
              <span className={`font-medium ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                {isReady ? (thinking ? 'Réflexion...' : 'En attente') : 'Initialisation...'}
              </span>
            </div>
            
            {!isReady && (
              <div className="flex items-center gap-2 text-[10px] text-yellow-400/80 bg-yellow-400/5 p-2 rounded border border-yellow-400/10">
                <AlertCircle className="w-3 h-3" />
                Chargement du moteur WASM...
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            onClick={resetGame} 
            variant="outline" 
            className="w-full justify-start gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recommencer
          </Button>
          <Button 
            onClick={undoMove} 
            variant="outline" 
            disabled={thinking}
            className="w-full justify-start gap-2"
          >
            Annuler le coup
          </Button>
        </div>
      </div>

      {/* Main Board */}
      <div className="lg:col-span-6 order-1 lg:order-2">
        <div className="relative aspect-square max-w-[600px] mx-auto group">
          <div className="absolute -inset-2 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative rounded-xl overflow-hidden border border-white/5 shadow-2xl">
            <Chessboard 
              position={fen} 
              onPieceDrop={onDrop}
              boardOrientation="white"
              customDarkSquareStyle={{ backgroundColor: '#2d333b' }}
              customLightSquareStyle={{ backgroundColor: '#e6edf3' }}
              animationDuration={300}
            />
          </div>

          {/* Game Over Overlay */}
          {gameResult && (
            <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative bg-surface-high border border-primary/20 p-8 rounded-2xl shadow-2xl text-center max-w-sm mx-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Partie terminée</h2>
                <p className="text-muted-foreground mb-6 font-medium">{gameResult}</p>
                <div className="flex gap-3">
                  <Button onClick={resetGame} className="flex-1 gradient-primary text-[#152800]">
                    Rejouer
                  </Button>
                  <Button onClick={onBack} variant="outline" className="flex-1">
                    Quitter
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: History / Analysis placeholder */}
      <div className="lg:col-span-3 space-y-6 order-3">
        <div className="bg-surface-container rounded-xl p-5 border border-border/50 h-[400px] flex flex-col">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Historique</h3>
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <p className="text-xs text-muted-foreground italic">
              Les coups s'afficheront ici lors d'une prochaine mise à jour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
