import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Order, OrderHistoryState } from '../types';
import { formatRupiah } from '../constants';
import { updateOrderStatusInDatabase } from '../lib/supabase';

interface OrderHistoryProps {
  orders: Order[];
  state: OrderHistoryState;
  errorMessage: string | null;
  onRefresh: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  state,
  errorMessage,
  onRefresh,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkProcessed = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusInDatabase(orderId, 'processed');
      onRefresh();
    } catch (err: unknown) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
            Order & Lead History
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Persisted transaction records and incoming lead status.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-colors h-9"
          title="Refresh orders from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${state === 'loading' ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* State Machine Rendering */}

      {/* 1. Loading State: 3 pulse-animated placeholder rows */}
      {state === 'loading' && (
        <div className="space-y-3">
          <div className="animate-pulse bg-neutral-100 rounded-lg h-12 w-full" />
          <div className="animate-pulse bg-neutral-100 rounded-lg h-12 w-full" />
          <div className="animate-pulse bg-neutral-100 rounded-lg h-12 w-full" />
        </div>
      )}

      {/* 2. Empty State: neutral bordered card */}
      {state === 'empty' && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-600">
            No orders recorded yet. Calculated orders will appear here.
          </p>
        </div>
      )}

      {/* 3. Error State: neutral panel with message and Retry button */}
      {state === 'error' && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                Failed to load orders
              </h3>
              <p className="text-xs text-neutral-600">
                {errorMessage ||
                  'Could not connect to the database. Please check your network or credentials.'}
              </p>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center px-3.5 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors h-9"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Data State: clean table */}
      {state === 'data' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Selected Service</th>
                <th className="py-3 px-3">Total Price</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.map((order) => {
                const isPending = order.status === 'pending';
                const isItemUpdating = updatingId === order.id;

                return (
                  <tr key={order.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-neutral-900">
                      {order.customer_name}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-600 font-mono text-xs">
                      +{order.customer_phone}
                    </td>

                    <td className="py-3.5 px-3 text-neutral-800">
                      {order.selected_items}
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-neutral-900">
                      {formatRupiah(Number(order.total_price))}
                    </td>

                    <td className="py-3.5 px-3 text-xs text-neutral-500 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isPending ? (
                        <span className="inline-flex items-center space-x-1 bg-neutral-100 text-neutral-800 rounded-lg px-2.5 py-1 text-xs font-medium">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>pending</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>processed</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      {isPending ? (
                        <button
                          type="button"
                          disabled={isItemUpdating}
                          onClick={() => handleMarkProcessed(order.id)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-800 hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        >
                          {isItemUpdating ? 'Updating...' : 'Mark Processed'}
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
