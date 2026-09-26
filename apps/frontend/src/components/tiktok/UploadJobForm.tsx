'use client';

import { useState, useEffect } from 'react';
import { useTikTokStore } from '@/store/tiktokStore';
import { useContentStore } from '@/store/contentStore';
import { toast } from '@/store/toastStore';

export default function UploadJobForm({ onCreated }: { onCreated?: () => void }) {
  const { createUploadJob, accounts, fetchAccounts } = useTikTokStore();
  const { carousels, fetchCarousels } = useContentStore();
  const [carouselId, setCarouselId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (carousels.length === 0) fetchCarousels().catch(() => {});
    if (accounts.length === 0) fetchAccounts().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!carouselId || !accountId) {
      setError('carousel and TikTok account are required');
      return;
    }
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (d <= new Date()) {
        setError('scheduled_at must be in the future');
        return;
      }
    }
    setLoading(true);
    try {
      await createUploadJob(carouselId, accountId, scheduledAt || undefined);
      toast.success('Upload job created');
      setScheduledAt('');
      onCreated?.();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create job';
      setError(msg);
      toast.error('Create failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-white p-4" data-testid="upload-job-form">
      <h3 className="font-semibold text-text-primary">New Upload Job</h3>
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium mb-1">Carousel *</label>
          <select value={carouselId} onChange={(e) => setCarouselId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Select carousel</option>
            {carousels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">TikTok Account *</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">Select account</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                @{a.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Scheduled at (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <p className="text-xs text-text-tertiary mt-1">Must be in the future</p>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Creating…' : 'Create Job'}
      </button>
    </form>
  );
}
