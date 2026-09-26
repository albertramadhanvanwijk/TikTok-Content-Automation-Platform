'use client';

import { Shortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
}

export default function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{s.description}</span>
              <kbd className="px-2 py-1 bg-secondary rounded text-text-primary font-mono text-xs">
                {s.ctrlKey && 'Ctrl+'}{s.shiftKey && 'Shift+'}{s.altKey && 'Alt+'}{s.metaKey && 'Cmd+'}{s.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>
        <button 
          onClick={() => {}}
          className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}