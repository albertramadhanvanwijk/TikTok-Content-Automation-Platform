'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTikTokStore } from '@/store/tiktokStore';
import { toast } from '@/store/toastStore';

function TikTokCallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { connectAccount } = useTikTokStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const code = params.get('code');
    const mock = params.get('mock');
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}/tiktok/callback` : 'http://localhost:3001/tiktok/callback';

    if (mock === '1') {
      const mockCode = code || `mock_code_${Date.now()}`;
      connectAccount(mockCode, redirectUri)
        .then(() => {
          setStatus('success');
          toast.success('TikTok connected (mock)', 'No TIKTOK_CLIENT_KEY — demo account created');
          setTimeout(() => router.replace('/tiktok'), 800);
        })
        .catch((e: any) => {
          setStatus('error');
          setMsg(e.message || 'Mock connect failed');
        });
      return;
    }

    if (!code) {
      setStatus('error');
      setMsg('Missing code parameter');
      return;
    }

    connectAccount(code, redirectUri)
      .then(() => {
        setStatus('success');
        toast.success('TikTok connected');
        router.replace('/tiktok');
      })
      .catch((e: any) => {
        setStatus('error');
        setMsg(e.response?.data?.error?.message || e.message || 'Connect failed');
      });
  }, [params, connectAccount, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-6">
      {status === 'loading' && <p className="text-sm text-text-secondary">Connecting TikTok…</p>}
      {status === 'success' && <p className="text-sm text-green-700">Connected! Redirecting to TikTok Hub…</p>}
      {status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Connect failed</p>
          <p className="mt-1">{msg}</p>
          <button onClick={() => router.replace('/tiktok')} className="mt-3 rounded bg-white px-3 py-1 border border-border text-sm">Back to TikTok Hub</button>
        </div>
      )}
    </div>
  );
}

export default function TikTokCallbackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-text-secondary">Loading…</div>}>
      <TikTokCallbackInner />
    </Suspense>
  );
}
