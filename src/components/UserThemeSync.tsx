'use client';

import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export const UserThemeSync = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) {
      return;
    }

    const savedTheme = localStorage.getItem(`theme_${user.id}`);
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('light');
    }
    setIsLoaded(true);
  }, [user?.id, mounted, setTheme]);

  useEffect(() => {
    if (!mounted || !user?.id || !theme || !isLoaded) {
      return;
    }
    localStorage.setItem(`theme_${user.id}`, theme);
  }, [theme, user?.id, mounted, isLoaded]);

  return null;
};
