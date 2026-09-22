/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { PriceCalculator } from './components/PriceCalculator';
import { OrderHistory } from './components/OrderHistory';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { Order, OrderHistoryState } from './types';
import { fetchOrdersFromDatabase } from './lib/supabase';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [historyState, setHistoryState] = useState<OrderHistoryState>('loading');
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  const loadOrders = useCallback(async () => {
    setHistoryState('loading');
    setHistoryError(null);
    try {
      const data = await fetchOrdersFromDatabase();
      setOrders(data);
      setHistoryState(data.length === 0 ? 'empty' : 'data');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Database communication failed.';
      setHistoryError(message);
      setHistoryState('error');
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans antialiased">
      <Header onOpenSetupModal={() => setIsSetupModalOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Estimator and Lead Capture Component */}
        <section aria-labelledby="calculator-heading">
          <PriceCalculator onOrderCreated={loadOrders} />
        </section>

        {/* Persisted Orders and Leads Table */}
        <section aria-labelledby="history-heading">
          <OrderHistory
            orders={orders}
            state={historyState}
            errorMessage={historyError}
            onRefresh={loadOrders}
          />
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 space-y-2 sm:space-y-0">
          <p>Sneaker Clean Service Price Estimator and Booking System</p>
          <p>Direct WhatsApp integration with automated estimate pre-fill</p>
        </div>
      </footer>

      {/* Supabase Schema and Configuration Modal */}
      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
}
