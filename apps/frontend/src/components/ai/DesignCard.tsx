'use client';

import { Design } from '@/types';

export default function DesignCard({ design }: { design: Design }) {
  if (!design) return null;
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3" data-testid="design-card">
      <h3 className="font-semibold text-text-primary">Design Suggestion</h3>
      {design.color_scheme && design.color_scheme.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-text-secondary">Colors:</span>
          {design.color_scheme.map((hex) => (
            <span key={hex} className="inline-flex items-center gap-1 text-xs">
              <span
                className="inline-block h-5 w-5 rounded-full border border-border"
                style={{ background: hex }}
                aria-label={hex}
              />
              <span className="font-mono text-text-secondary">{hex}</span>
            </span>
          ))}
        </div>
      )}
      {design.fonts && design.fonts.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-text-secondary">Fonts:</span>
          {design.fonts.map((f) => (
            <span key={f} className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-text-primary">
              {f}
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-text-tertiary">Layout:</span> <span className="font-medium text-text-primary">{design.layout}</span>
        </div>
        {design.recommended_dimensions && (
          <div>
            <span className="text-text-tertiary">Size:</span> <span className="font-medium">{design.recommended_dimensions}</span>
          </div>
        )}
      </div>
      {design.visual_elements && design.visual_elements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {design.visual_elements.map((v) => (
            <span key={v} className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {v}
            </span>
          ))}
        </div>
      )}
      {design.mock && (
        <p className="text-xs text-amber-600">Mock design — set OPENAI_API_KEY for real suggestions</p>
      )}
    </div>
  );
}
