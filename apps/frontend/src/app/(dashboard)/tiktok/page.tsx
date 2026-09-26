'use client';

import { useEffect, useState } from 'react';
import { useTikTokStore } from '@/store/tiktokStore';
import ConnectButton from '@/components/tiktok/ConnectButton';
import AccountCard from '@/components/tiktok/AccountCard';
import UploadJobForm from '@/components/tiktok/UploadJobForm';
import JobStatusTable from '@/components/tiktok/JobStatusTable';
import JobDetailModal from '@/components/tiktok/JobDetailModal';
import { UploadJob } from '@/types';
import { toast } from '@/store/toastStore';

export default function TikTokHubPage() {
  const { accounts, fetchAccounts, fetchJobs, disconnectAccount, error } = useTikTokStore();
  const [selectedJob, setSelectedJob] = useState<UploadJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([fetchAccounts(), fetchJobs()]);
      } catch (e: any) {
        // show toast but remain usable (mock fallback may leave accounts empty)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAccounts, fetchJobs]);

  const handleDisconnect = async (id: string) => {
    try {
      await disconnectAccount(id);
      toast.success('Disconnected', 'TikTok account removed');
    } catch (e: any) {
      toast.error('Disconnect failed', e.message);
    }
  };

  const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/tiktok/callback` : 'http://localhost:3001/tiktok/callback';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">TikTok Hub</h1>
        <p className="text-text-secondary mt-1">Connect accounts and manage upload jobs. In mock mode you can still create jobs end-to-end.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error} — in mock mode TikTok calls are stubbed; you can still demo upload jobs.
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <ConnectButton redirectUri={redirectUri} />
        </div>
        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <p className="text-sm text-text-secondary mb-3">No TikTok accounts connected yet.</p>
            <p className="text-xs text-text-tertiary mb-4">Click Connect TikTok — without TIKTOK_CLIENT_KEY you&apos;ll be redirected via mock callback.</p>
            <ConnectButton redirectUri={redirectUri} />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {accounts.map((a: any) => (
              <AccountCard key={a.id} account={a} onDisconnect={handleDisconnect} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Upload Jobs</h2>
        <UploadJobForm onCreated={() => fetchJobs()} />
        <JobStatusTable onSelect={(j) => setSelectedJob(j)} />
      </section>

      <JobDetailModal job={selectedJob} open={!!selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
