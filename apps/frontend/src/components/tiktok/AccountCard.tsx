'use client';

import { useState } from 'react';

interface Account {
  id: string;
  username: string;
  display_name?: string;
  connected_at: string;
  status: string;
}

export default function AccountCard({ account, onDisconnect }: { account: Account; onDisconnect: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex items-center gap-4" data-testid="account-card">
      <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
        {account.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">@{account.username}</p>
        <p className="text-xs text-text-secondary">{new Date(account.connected_at).toLocaleDateString()}</p>
        <span className="inline-block mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{account.status}</span>
      </div>
      <div className="flex flex-col gap-2">
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50">
            Disconnect
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { onDisconnect(account.id); setConfirm(false); }} className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white">
              Confirm
            </button>
            <button onClick={() => setConfirm(false)} className="rounded-lg border border-border px-3 py-1 text-sm">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
