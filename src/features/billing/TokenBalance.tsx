'use client';

import { Coins } from 'lucide-react';
import { useEffect, useState } from 'react';

export const TokenBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch('/api/user/tokens');
        const data = await response.json();
        setBalance(data.tokenBalance);
      } catch (error) {
        console.error('Failed to fetch token balance', error);
      }
    };

    fetchBalance();
  }, []);

  if (balance === null) {
    return <div className="text-sm">Loading...</div>;
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
      <Coins className="size-4 text-yellow-500" />
      <span>
        {balance}
        {' '}
        Tokens
      </span>
    </div>
  );
};
