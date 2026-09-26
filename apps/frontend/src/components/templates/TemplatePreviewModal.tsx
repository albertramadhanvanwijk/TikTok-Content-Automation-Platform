'use client';

import { Template } from '@/types';

export default function TemplatePreviewModal({ template, open, onClose }: { template: Template | null; open: boolean; onClose: () => void }) {
  if (!open || !template) return null;
  const data: any = template.style_data || {};
  const colors: string[] = data.color_scheme || [];
  const fonts: string[] = data.fonts || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="template-preview-modal">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{template.name}</h3>
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">Close</button>
        </div>
        <p className="text-sm text-text-secondary">{template.description || 'No description'}</p>
        <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: colors[0] || '#ffffff', color: colors[0] && colors[0].toLowerCase() === '#030712' ? '#ffffff' : '#111827' }}>
          <p className="font-bold" style={{ fontFamily: fonts[0] || 'Inter' }}>
            Preview: {template.style_name}
          </p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <span key={c} className="h-6 w-6 rounded-full border border-white/50" style={{ background: c }} />
            ))}
          </div>
          <p className="text-xs opacity-80">Fonts: {fonts.join(', ') || '—'}</p>
          <p className="text-xs opacity-80">Layout: {data.layout || '—'}</p>
        </div>
        <pre className="max-h-40 overflow-auto rounded bg-secondary p-3 text-xs">{JSON.stringify(template.style_data, null, 2)}</pre>
      </div>
    </div>
  );
}
