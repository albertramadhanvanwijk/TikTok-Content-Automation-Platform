'use client';

import { UploadJob } from '@/types';

export default function JobDetailModal({ job, open, onClose }: { job: UploadJob | null; open: boolean; onClose: () => void }) {
  if (!open || !job) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="job-detail-modal">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload Job Detail</h3>
          <button onClick={onClose} className="rounded border border-border px-3 py-1 text-sm">
            Close
          </button>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between"><dt className="text-text-secondary">ID</dt><dd className="font-mono text-xs">{job.id}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Carousel</dt><dd className="font-mono text-xs">{job.carousel_id}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Account</dt><dd className="font-mono text-xs">{job.tiktok_account_id}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Status</dt><dd className="font-medium">{job.status}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Video ID</dt><dd className="font-mono text-xs">{job.tiktok_video_id || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Scheduled</dt><dd>{job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-text-secondary">Retries</dt><dd>{job.retry_count}</dd></div>
          {job.last_error && <div className="rounded bg-red-50 p-2 text-xs text-red-700">{job.last_error}</div>}
        </dl>
        <pre className="max-h-48 overflow-auto rounded bg-secondary p-3 text-xs">{JSON.stringify(job, null, 2)}</pre>
        {job.tiktok_video_id && <p className="text-xs text-text-secondary">TikTok video: {job.tiktok_video_id}</p>}
      </div>
    </div>
  );
}
