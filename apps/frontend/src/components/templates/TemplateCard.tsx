'use client';

import { Template } from '@/types';

export default function TemplateCard({
  template,
  onDelete,
  onPreview,
  onUse,
}: {
  template: Template;
  onDelete: (id: string) => void;
  onPreview: (t: Template) => void;
  onUse: (id: string) => void;
}) {
  const colors: string[] = (template.style_data as any)?.color_scheme || [];
  return (
    <div className="rounded-xl border border-border bg-white p-4 space-y-3" data-testid="template-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-text-primary truncate">{template.name}</p>
          <p className="text-xs text-text-secondary line-clamp-2">{template.description || 'No description'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{template.style_name}</span>
      </div>
      {colors.length > 0 && (
        <div className="flex gap-1">
          {colors.slice(0, 4).map((c) => (
            <span key={c} className="h-5 w-5 rounded-full border border-border" style={{ background: c }} aria-label={c} />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-2">
        <button onClick={() => onUse(template.id)} className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white">
          Use
        </button>
        <button onClick={() => onPreview(template)} className="rounded-lg border border-border px-3 py-1 text-xs">
          Preview
        </button>
        <button onClick={() => onDelete(template.id)} className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}
