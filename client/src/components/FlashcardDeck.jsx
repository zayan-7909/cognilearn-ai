import { useState, useContext } from 'react';
import { DocumentContext } from '../context/DocumentContext.jsx';

export default function FlashcardDeck() {
  const { docState } = useContext(DocumentContext);
  const [flipped, setFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = docState.flashcards.length > 0 ? docState.flashcards : [
    {
      id: 'demo-1',
      front: 'What is Retrieval-Augmented Generation (RAG)?',
      back: 'An NLP architectural pattern combining semantic vector search with generative LLMs to ground outputs directly in external text.',
    },
    {
      id: 'demo-2',
      front: 'What does the SM-2 algorithm calculate?',
      back: 'Optimal repetition spacing intervals and ease factors based on user self-evaluation ratings.',
    }
  ];

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev < cards.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="text-xs text-slate-400 mb-4">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="relative h-64 w-96 cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all duration-300 hover:border-blue-500/50 flex flex-col justify-between"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
          {flipped ? 'Answer' : 'Question (Click to flip)'}
        </span>
        <p className="text-center text-sm font-medium text-slate-200">
          {flipped ? currentCard.back : currentCard.front}
        </p>
        <span className="text-right text-[10px] text-slate-600">SM-2 Spaced Repetition</span>
      </div>

      {flipped && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleNext}
            className="rounded-lg bg-rose-600/20 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-600/30 transition"
          >
            Again (&lt;1d)
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-amber-600/20 px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-600/30 transition"
          >
            Good (1d)
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-emerald-600/20 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition"
          >
            Easy (4d)
          </button>
        </div>
      )}
    </div>
  );
}