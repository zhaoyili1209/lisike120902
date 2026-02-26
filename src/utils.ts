import { Card, Suit, Rank } from './types';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN,
    Rank.EIGHT, Rank.NINE, Rank.TEN, Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    }
  }
  return shuffle(deck);
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const canPlayCard = (card: Card, topCard: Card, currentSuit: Suit | null): boolean => {
  if (card.rank === Rank.EIGHT) return true;
  
  const targetSuit = currentSuit || topCard.suit;
  return card.suit === targetSuit || card.rank === topCard.rank;
};

export const getSuitIcon = (suit: Suit): string => {
  switch (suit) {
    case Suit.HEARTS: return '♥';
    case Suit.DIAMONDS: return '♦';
    case Suit.CLUBS: return '♣';
    case Suit.SPADES: return '♠';
  }
};

export const getSuitColor = (suit: Suit): string => {
  switch (suit) {
    case Suit.HEARTS:
    case Suit.DIAMONDS:
      return 'text-red-600';
    case Suit.CLUBS:
    case Suit.SPADES:
      return 'text-zinc-900';
  }
};
