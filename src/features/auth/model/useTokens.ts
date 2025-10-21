import { useState, useEffect } from 'react';
import { Tokens } from 'shared/model';

export const useTokens = () => {
  const [tokens, setTokens] = useState<Tokens>({
    togglToken: localStorage.getItem('togglToken') || '',
    youtrackToken: localStorage.getItem('youtrackToken') || '',
  });

  // Сохранение токенов в localStorage
  useEffect(() => {
    Object.entries(tokens).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value);
    });
  }, [tokens]);

  const updateToken = (field: keyof Tokens, value: string) => {
    setTokens(prev => ({ ...prev, [field]: value }));
  };

  const allFieldsFilled = Object.values(tokens).every(token => token.trim() !== '');

  return {
    tokens,
    setTokens,
    updateToken,
    allFieldsFilled
  };
};
