'use client';

import { useState } from 'react';
import { useTikTokStore } from '@/store/tiktokStore';
import { toast } from '@/store/toastStore';

export default function ConnectButton({ redirectUri }: { redirectUri: string }) {
  const { getAuthUrl } = useTikTokStore();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const url = await getAuthUrl(redirectUri);
      if (!url) {
        toast.error('Connect failed', 'No auth URL returned');
        setLoading(false);
        return;
      }
      window.location.href = url;
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.message || 'Failed to get auth URL';
      toast.error('Connect failed', msg);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="rounded-lg bg-black px-6 py-2 font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? 'Connecting…' : 'Connect TikTok'}
    </button>
  );
}
