/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Info, 
  ChevronRight, 
  User, 
  Cpu, 
  AlertCircle,
  Hand as HandIcon
} from 'lucide-react';
import { Card, Suit, Rank, GameStatus } from './types';
import { createDeck, canPlayCard, getSuitIcon, getSuitColor } from './utils';

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;

export default function App() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [showSuitPicker, setShowSuitPicker] = useState(false);
  const [lastAction, setLastAction] = useState<string>('Welcome to Crazy Eights!');
  const [isDealing, setIsDealing] = useState(false);

  // Initialize Game
  const initGame = useCallback(() => {
    const deck = createDeck();
    const pHand = deck.splice(0, 8);
    const aHand = deck.splice(0, 8);
    
    // Ensure first discard is not an 8 for simplicity
    let firstDiscardIndex = 0;
    while (deck[firstDiscardIndex].rank === Rank.EIGHT) {
      firstDiscardIndex++;
    }
    const firstDiscard = deck.splice(firstDiscardIndex, 1)[0];

    setPlayerHand(pHand);
    setAiHand(aHand);
    setDrawPile(deck);
    setDiscardPile([firstDiscard]);
    setCurrentSuit(null);
    setTurn('player');
    setStatus('playing');
    setLastAction('Game started! Your turn.');
    setIsDealing(true);
    setTimeout(() => setIsDealing(false), 1500);
  }, []);

  useEffect(() => {
    if (status === 'waiting') {
      initGame();
    }
  }, [status, initGame]);

  // AI Logic
  useEffect(() => {
    if (turn === 'ai' && status === 'playing' && !isDealing) {
      const timer = setTimeout(() => {
        const topCard = discardPile[discardPile.length - 1];
        const playableCards = aiHand.filter(c => canPlayCard(c, topCard, currentSuit));

        if (playableCards.length > 0) {
          // AI Strategy: Play non-8 first, if multiple, pick random
          const nonEights = playableCards.filter(c => c.rank !== Rank.EIGHT);
          const cardToPlay = nonEights.length > 0 
            ? nonEights[Math.floor(Math.random() * nonEights.length)]
            : playableCards[0];

          playCard(cardToPlay, 'ai');
        } else if (drawPile.length > 0) {
          drawCard('ai');
        } else {
          setLastAction('AI has no moves and deck is empty. Skipping turn.');
          setTurn('player');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, discardPile, currentSuit, drawPile, status, isDealing]);

  const playCard = (card: Card, who: 'player' | 'ai') => {
    const topCard = discardPile[discardPile.length - 1];
    
    if (who === 'player' && !canPlayCard(card, topCard, currentSuit)) {
      setLastAction("You can't play that card!");
      return;
    }

    if (who === 'player') {
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setAiHand(prev => prev.filter(c => c.id !== card.id));
    }

    setDiscardPile(prev => [...prev, card]);
    setCurrentSuit(null); // Reset suit override unless it's an 8

    if (card.rank === Rank.EIGHT) {
      if (who === 'player') {
        setShowSuitPicker(true);
        setLastAction("Crazy 8! Pick a suit.");
      } else {
        // AI picks most frequent suit in hand
        const suits = aiHand.map(c => c.suit);
        const mostFrequentSuit = suits.length > 0 
          ? suits.sort((a,b) => suits.filter(v => v===a).length - suits.filter(v => v===b).length).pop()!
          : Suit.HEARTS;
        setCurrentSuit(mostFrequentSuit);
        setLastAction(`AI played an 8 and picked ${mostFrequentSuit}!`);
        setTurn('player');
      }
    } else {
      setLastAction(`${who === 'player' ? 'You' : 'AI'} played ${card.rank} of ${card.suit}.`);
      setTurn(who === 'player' ? 'ai' : 'player');
    }

    // Check Win
    if (who === 'player' && playerHand.length === 1) setStatus('won');
    if (who === 'ai' && aiHand.length === 1) setStatus('lost');
  };

  const drawCard = (who: 'player' | 'ai') => {
    if (drawPile.length === 0) {
      setLastAction("Draw pile is empty!");
      return;
    }

    const newDrawPile = [...drawPile];
    const card = newDrawPile.pop()!;
    setDrawPile(newDrawPile);

    if (who === 'player') {
      setPlayerHand(prev => [...prev, card]);
      setLastAction("You drew a card.");
      // In some variations, drawing ends turn. In others, you can play if it matches.
      // Let's stick to: draw one, then turn ends if not playable, or just end turn.
      // Standard rule: if you draw and can play, you can. But to keep it simple: draw ends turn.
      setTurn('ai');
    } else {
      setAiHand(prev => [...prev, card]);
      setLastAction("AI drew a card.");
      setTurn('player');
    }
  };

  const handleSuitPick = (suit: Suit) => {
    setCurrentSuit(suit);
    setShowSuitPicker(false);
    setLastAction(`You picked ${suit}. AI's turn.`);
    setTurn('ai');
  };

  return (
    <div className="min-h-screen bg-[#1a472a] text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/10 bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-bold">8</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Crazy Eights</h1>
            <p className="text-xs text-emerald-300/70 font-mono uppercase tracking-widest">Premium Edition</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-400" />
              <span className="text-sm font-medium">{playerHand.length} Cards</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-blue-400" />
              <span className="text-sm font-medium">{aiHand.length} Cards</span>
            </div>
          </div>
          <button 
            onClick={() => setStatus('waiting')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Reset Game"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden">
        
        {/* AI Hand */}
        <div className="w-full flex justify-center">
          <div className="relative h-[160px] w-full max-w-4xl flex justify-center items-center">
            <AnimatePresence>
              {aiHand.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ y: -200, opacity: 0 }}
                  animate={{ 
                    x: (index - (aiHand.length - 1) / 2) * (aiHand.length > 8 ? 30 : 50),
                    y: 0,
                    opacity: 1,
                    rotate: (index - (aiHand.length - 1) / 2) * 2
                  }}
                  exit={{ y: -200, opacity: 0 }}
                  className="absolute"
                  style={{ zIndex: index }}
                >
                  <CardBack />
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="absolute -top-6 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <Cpu size={14} className="text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Opponent</span>
            </div>
          </div>
        </div>

        {/* Center Area (Deck & Discard) */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16 my-8">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <button 
              onClick={() => turn === 'player' && drawCard('player')}
              disabled={turn !== 'player' || drawPile.length === 0}
              className="relative"
            >
              {drawPile.length > 0 ? (
                <div className="relative">
                  {/* Stack effect */}
                  <div className="absolute top-1 left-1 w-[100px] h-[140px] bg-emerald-900 rounded-xl border border-white/10" />
                  <div className="absolute top-0.5 left-0.5 w-[100px] h-[140px] bg-emerald-800 rounded-xl border border-white/10" />
                  <CardBack isDrawPile />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/60 px-2 py-1 rounded text-xs font-bold">{drawPile.length}</span>
                  </div>
                </div>
              ) : (
                <div className="w-[100px] h-[140px] border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-xs text-white/40 font-bold uppercase">Empty</span>
                </div>
              )}
            </button>
            <p className="text-center mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Draw Pile</p>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <AnimatePresence mode="popLayout">
              {discardPile.slice(-1).map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="relative shadow-2xl"
                >
                  <CardView card={card} />
                  {currentSuit && (
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-500 animate-bounce">
                      <span className={`text-2xl ${getSuitColor(currentSuit)}`}>{getSuitIcon(currentSuit)}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <p className="text-center mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Discard Pile</p>
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex justify-center pb-8">
          <div className="relative h-[180px] w-full max-w-5xl flex justify-center items-end">
            <AnimatePresence>
              {playerHand.map((card, index) => (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ 
                    x: (index - (playerHand.length - 1) / 2) * (playerHand.length > 10 ? 40 : 60),
                    y: turn === 'player' ? 0 : 20,
                    opacity: 1,
                    rotate: (index - (playerHand.length - 1) / 2) * 1.5,
                    scale: turn === 'player' ? 1 : 0.95
                  }}
                  whileHover={turn === 'player' ? { 
                    y: -40, 
                    scale: 1.1, 
                    zIndex: 100,
                    rotate: 0,
                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                  } : {}}
                  className="absolute cursor-pointer"
                  onClick={() => turn === 'player' && playCard(card, 'player')}
                >
                  <CardView card={card} isPlayable={turn === 'player' && canPlayCard(card, discardPile[discardPile.length-1], currentSuit)} />
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="absolute -bottom-4 flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              <User size={14} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Your Hand</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none">
          <motion.div 
            key={lastAction}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center shadow-xl"
          >
            <p className="text-sm font-medium text-emerald-100">{lastAction}</p>
          </motion.div>
        </div>

        {/* Turn Indicator */}
        <div className="absolute top-24 left-8 hidden lg:block">
          <div className="flex flex-col gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${turn === 'player' ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-white/5 border-white/10 opacity-40'}`}>
              <div className={`w-3 h-3 rounded-full ${turn === 'player' ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
              <span className="text-sm font-bold uppercase tracking-widest">Your Turn</span>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${turn === 'ai' ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white/5 border-white/10 opacity-40'}`}>
              <div className={`w-3 h-3 rounded-full ${turn === 'ai' ? 'bg-blue-500 animate-pulse' : 'bg-white/20'}`} />
              <span className="text-sm font-bold uppercase tracking-widest">AI Thinking</span>
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {showSuitPicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a472a] border border-white/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-2">Pick a New Suit</h2>
              <p className="text-emerald-200/60 text-sm mb-8">You played an 8! Choose the suit for the next player.</p>
              <div className="grid grid-cols-2 gap-4">
                {[Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES].map((suit) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitPick(suit)}
                    className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  >
                    <span className={`text-4xl ${getSuitColor(suit)}`}>{getSuitIcon(suit)}</span>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{suit}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {status !== 'playing' && status !== 'waiting' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl ${status === 'won' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                {status === 'won' ? <Trophy size={48} /> : <AlertCircle size={48} />}
              </div>
              <h2 className="text-5xl font-black mb-2 tracking-tight">
                {status === 'won' ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-white/60 mb-12 text-lg">
                {status === 'won' ? 'You cleared all your cards first!' : 'The AI cleared its cards before you.'}
              </p>
              <button 
                onClick={() => setStatus('waiting')}
                className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw size={20} />
                Play Again
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Footer Info */}
      <footer className="md:hidden p-4 bg-black/20 border-t border-white/10 flex justify-around items-center">
        <div className="flex items-center gap-2">
          <User size={14} className="text-emerald-400" />
          <span className="text-xs font-bold">{playerHand.length}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-blue-400" />
          <span className="text-xs font-bold">{aiHand.length}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <HandIcon size={14} className={turn === 'player' ? 'text-emerald-400' : 'text-white/20'} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{turn === 'player' ? 'Your Turn' : 'AI Turn'}</span>
        </div>
      </footer>
    </div>
  );
}

function CardView({ card, isPlayable = true }: { card: Card, isPlayable?: boolean }) {
  const color = getSuitColor(card.suit);
  const icon = getSuitIcon(card.suit);

  return (
    <div className={`
      relative w-[100px] h-[140px] bg-white rounded-xl shadow-xl flex flex-col justify-between p-2 select-none
      ${!isPlayable ? 'grayscale-[0.5] opacity-80' : 'ring-offset-2 ring-offset-[#1a472a] hover:ring-2 ring-emerald-400'}
      transition-all duration-200
    `}>
      <div className={`flex flex-col items-center leading-none ${color}`}>
        <span className="text-xl font-bold">{card.rank}</span>
        <span className="text-sm">{icon}</span>
      </div>
      
      <div className={`absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none ${color}`}>
        <span className="text-6xl">{icon}</span>
      </div>

      <div className={`flex flex-col items-center leading-none rotate-180 ${color}`}>
        <span className="text-xl font-bold">{card.rank}</span>
        <span className="text-sm">{icon}</span>
      </div>

      {card.rank === Rank.EIGHT && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
          <span className="text-[10px] font-bold text-white">8</span>
        </div>
      )}
    </div>
  );
}

function CardBack({ isDrawPile = false }: { isDrawPile?: boolean }) {
  return (
    <div className={`
      w-[100px] h-[140px] bg-emerald-800 rounded-xl shadow-xl p-1.5 border border-white/20
      ${isDrawPile ? 'hover:scale-105 active:scale-95 transition-transform cursor-pointer' : ''}
    `}>
      <div className="w-full h-full border-2 border-white/10 rounded-lg flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '12px 12px'
        }} />
        <div className="w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/5 rounded-full border border-white/10" />
        </div>
      </div>
    </div>
  );
}
