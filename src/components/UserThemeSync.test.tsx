import { useUser } from '@clerk/nextjs';
import { render } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserThemeSync } from './UserThemeSync';

// Mock the hooks
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}));

describe('UserThemeSync', () => {
  const setThemeMock = vi.fn();

  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
    };
  })();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    (useTheme as any).mockReturnValue({
      theme: 'system',
      setTheme: setThemeMock,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('does nothing if user is not logged in', () => {
    (useUser as any).mockReturnValue({ user: null });
    render(<UserThemeSync />);

    // Should not call getItem or setTheme
    expect(localStorageMock.getItem).not.toHaveBeenCalled();
    expect(setThemeMock).not.toHaveBeenCalled();
  });

  it('loads saved theme from localStorage on mount', () => {
    (useUser as any).mockReturnValue({ user: { id: 'user_123' } });
    localStorageMock.setItem('theme_user_123', 'dark');

    render(<UserThemeSync />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme_user_123');
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('defaults to light if no theme saved', () => {
    (useUser as any).mockReturnValue({ user: { id: 'user_123' } });
    // localStorage is empty

    render(<UserThemeSync />);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('theme_user_123');
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });
});
