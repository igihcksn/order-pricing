import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA = `create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  selected_items text not null,
  total_price numeric not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- Allow public anonymous users to insert new estimates
create policy "Allow anonymous inserts"
on public.orders
for insert
to anon
with check (true);

-- Allow anonymous users to view orders
create policy "Allow anonymous selects"
on public.orders
for select
to anon
using (true);

-- Allow anonymous users to update order status
create policy "Allow anonymous status updates"
on public.orders
for update
to anon
using (true)
with check (true);`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40">
      <div className="bg-white rounded-lg border border-neutral-200 max-w-xl w-full max-h-[90vh] flex flex-col shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-neutral-800" />
            <h2 className="text-base font-semibold text-neutral-900">
              Database Configuration
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div className="rounded-lg border border-neutral-200 p-4 bg-neutral-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-neutral-900">Connection Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                }`}
              >
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local Fallback Mode'}
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              {isSupabaseConfigured
                ? 'Orders are persisted directly to your configured Supabase database.'
                : 'Using local storage persistence. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect your live Supabase project.'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-neutral-900">
                Supabase SQL Schema (Single orders Table)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 text-xs text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-lg"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-neutral-100 text-xs rounded-lg overflow-x-auto font-mono">
              {SQL_SCHEMA}
            </pre>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-600">
            <p className="font-medium text-neutral-800">Environment Variables:</p>
            <p>1. VITE_SUPABASE_URL: Your Supabase Project URL</p>
            <p>2. VITE_SUPABASE_ANON_KEY: Your Supabase public anon key</p>
            <p>3. VITE_BUSINESS_PHONE_NUMBER: Optional WhatsApp business number (e.g. 6281234567890)</p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 h-9"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
