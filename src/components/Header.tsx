import React from 'react';
import { Sparkles, Database, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  onOpenSetupModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSetupModal }) => {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-semibold text-sm">
            SC
          </div>
          <div>
            <h1 className="text-base font-semibold text-neutral-900 leading-tight">
              Sneaker Clean Service
            </h1>
            <p className="text-xs text-neutral-500">
              Price Estimator & Lead Closer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onOpenSetupModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors h-9"
            title="View database connection status and SQL schema"
          >
            <Database className="w-3.5 h-3.5 text-neutral-500" />
            <span>Database Status</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-500' : 'bg-neutral-400'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
