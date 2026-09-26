'use client';

import { useEffect, useRef } from 'react';
import { useTikTokStore } from '@/store/tiktokStore';
import { UploadJob } from '@/types';

const TERMINAL = ['published', 'failed', 'archived'];

export default function JobStatusTable({ onSelect }: { onSelect?: (job: UploadJob) => void }) {
  const { jobs, fetchJobs, processJob } = useTikTokStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    const hasPending = jobs.some((j) => !TERMINAL.includes(j.status));
    if (hasPending && pollCountRef.current < 30) {
      intervalRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        if (pollCountRef.current >= 30) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        try {
          await fetchJobs();
          const fresh = (useTikTokStore.getState().jobs || []) as UploadJob[];
          const stillPending = fresh.some((j) => !TERMINAL.includes(j.status));
          if (!stillPending && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } catch {
          // ignore polling errors
        }
      }, 5000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobs, fetchJobs]);

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center" data-testid="job-status-empty">
        <p className="text-text-secondary text-sm">No upload jobs yet. Create one above.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white" data-testid="job-status-table">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left">
          <tr>
            <th className="px-4 py-2">Carousel</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Scheduled</th>
            <th className="px-4 py-2">Video</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-t border-border hover:bg-secondary/20">
              <td className="px-4 py-2 font-mono text-xs truncate max-w-[180px]">{job.carousel_id}</td>
              <td className="px-4 py-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : job.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : job.status === 'processing' || job.status === 'uploading'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-2 text-xs text-text-secondary">{job.scheduled_at ? new Date(job.scheduled_at).toLocaleString() : '—'}</td>
              <td className="px-4 py-2 text-xs">{job.tiktok_video_id || '—'}</td>
              <td className="px-4 py-2 flex gap-1">
                <button
                  onClick={() => processJob(job.id).catch(() => {})}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary"
                >
                  Process Now
                </button>
                {onSelect && (
                  <button onClick={() => onSelect(job)} className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary">
                    Detail
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
