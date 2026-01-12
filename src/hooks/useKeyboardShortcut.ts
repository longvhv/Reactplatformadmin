/**
 * useKeyboardShortcut Hook
 * Handle keyboard shortcuts with modifier keys
 */

import { useEffect } from 'react';

interface KeyboardShortcutConfig {
  key: string;
  modifiers?: ('ctrl' | 'cmd' | 'shift' | 'alt')[];
  callback: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts
 * @param config - Keyboard shortcut configuration
 * 
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   modifiers: ['cmd', 'ctrl'],
 *   callback: () => setSearchOpen(true)
 * });
 */
export function useKeyboardShortcut({
  key,
  modifiers = [],
  callback,
  enabled = true,
}: KeyboardShortcutConfig) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the key matches
      if (event.key.toLowerCase() !== key.toLowerCase()) return;

      // Check modifiers
      const hasCtrlOrCmd = modifiers.includes('ctrl') || modifiers.includes('cmd');
      const hasShift = modifiers.includes('shift');
      const hasAlt = modifiers.includes('alt');

      const ctrlOrCmdPressed = event.ctrlKey || event.metaKey;
      const shiftPressed = event.shiftKey;
      const altPressed = event.altKey;

      // Verify all required modifiers are pressed
      if (hasCtrlOrCmd && !ctrlOrCmdPressed) return;
      if (hasShift && !shiftPressed) return;
      if (hasAlt && !altPressed) return;

      // Verify no extra modifiers are pressed
      if (!hasCtrlOrCmd && ctrlOrCmdPressed) return;
      if (!hasShift && shiftPressed) return;
      if (!hasAlt && altPressed) return;

      event.preventDefault();
      callback(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, modifiers, callback, enabled]);
}
