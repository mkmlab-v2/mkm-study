import { useState } from 'react';
import { ZODIAC_ANIMALS, CHARACTER_TRAITS, ZODIAC_CHARACTER_MAPPING } from '../utils/zodiacData';
import { ZodiacAnimal, CharacterTrait } from '../utils/types';
import { Sparkles } from 'lucide-react';

interface CharacterSelectionProps {
  onSelect: (zodiac: ZodiacAnimal, character: CharacterTrait) => void;
}

export default function CharacterSelection({ onSelect }: CharacterSelectionProps) {
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacAnimal | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterTrait | null>(null);
  const [mode, setMode] = useState<'zodiac' | 'character'>('zodiac');

  const handleAutoAssign = () => {
    const characters = Object.values(CHARACTER_TRAITS);
    const randomChar = characters[Math.floor(Math.random() * characters.length)];
    const zodiacId = ZODIAC_CHARACTER_MAPPING[randomChar.id];
    const zodiac = ZODIAC_ANIMALS[zodiacId];

    onSelect(zodiac, randomChar);
  };

  const handleConfirm = () => {
    if (selectedZodiac && selectedCharacter) {
      onSelect(selectedZodiac, selectedCharacter);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">12AI 캐릭터 선택</h2>
          <button
            onClick={handleAutoAssign}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            자동 배정
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setMode('zodiac')}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              mode === 'zodiac' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            12 동물 선택
          </button>
          <button
            onClick={() => setMode('character')}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
              mode === 'character' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            12 특징 선택
          </button>
        </div>

        {mode === 'zodiac' && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {Object.values(ZODIAC_ANIMALS).map((zodiac) => (
              <button
                key={zodiac.id}
                onClick={() => setSelectedZodiac(zodiac)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedZodiac?.id === zodiac.id
                    ? 'border-blue-500 bg-blue-500/10 scale-105'
                    : 'border-gray-700 hover:border-blue-500/50 bg-gray-900'
                }`}
              >
                <div className="text-4xl mb-2">{zodiac.emoji}</div>
                <div className="text-sm font-bold text-white">{zodiac.name}</div>
                <div className="text-xs text-gray-400 mt-1">{zodiac.element}</div>
              </button>
            ))}
          </div>
        )}

        {mode === 'character' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.values(CHARACTER_TRAITS).map((character) => (
              <button
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedCharacter?.id === character.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-blue-500/50 bg-gray-900'
                }`}
              >
                <div className="font-bold text-lg mb-1 text-white">{character.name}</div>
                <div className="text-sm text-gray-400 mb-2">{character.description}</div>
                <div className="flex flex-wrap gap-1">
                  {character.traits.map((trait, i) => (
                    <span key={i} className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {trait}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedZodiac && selectedCharacter && (
        <div className="sticky bottom-0 bg-gradient-to-t from-black via-black to-transparent pt-6">
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedZodiac.emoji}</div>
                  <div>
                    <div className="text-white font-bold">{selectedZodiac.name} × {selectedCharacter.name}</div>
                    <div className="text-sm text-gray-400">{selectedCharacter.description}</div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              이 캐릭터로 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
