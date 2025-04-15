
import { useState } from 'react';

/**
 * Hook to manage input state
 */
export const useInputState = () => {
  const [input, setInput] = useState('');
  const [lastQuery, setLastQuery] = useState('');

  return {
    input,
    setInput,
    lastQuery,
    setLastQuery
  };
};
