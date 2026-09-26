'use client';

import { useState } from 'react';
import { useContentStore } from '@/store/contentStore';
import { toast } from '@/store/toastStore';

const DEFAULT_STYLE_DATA = JSON.stringify({ color_scheme: ['#030712', '#D4AF37'], fonts: ['Inter'], layout: 'centered' }, null, 2);

export default function TemplateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createTemplate } = useContentStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [styleName, setStyleName] = useState('minimal');
  const [styleData, setStyleData] = useState(DEFAULT_STYLE_DATA);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('name is required');
      return;
    }
    let parsed: any;
    try {
      parsed = JSON.parse(styleData);
    } catch {
      setError('Invalid JSON in style_data');
      return;
    }
    setLoading(true);
    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        style_name: styleName,
        style_data: parsed,
        is_public: isPublic,
      } as any);
      toast.success('Template created');
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create template';
      setError(msg);
      toast.error('Create failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="template-form-modal">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">New Template</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border px-4 py-2" placeholder="My Template" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg border border-border px-4 py-2" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Style</label>
            <select value={styleName} onChange={(e) => setStyleName(e.target.value)} className="w-full rounded-lg border border-border px-4 py-2">
              <option value="minimal">minimal</option>
              <option value="professional">professional</option>
              <option value="casual">casual</option>
              <option value="educational">educational</option>
            </select>
          </div>
          <div>
            <label htmlFor="style_data" className="block text-sm font-medium mb-1">style_data (JSON) *</label>
            <textarea
              id="style_data"
              aria-label="style_data"
              value={styleData}
              onChange={(e) => setStyleData(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs"
              rows={6}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Public
          </label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2">Cancel</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
