import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  envUrl &&
  envAnonKey &&
  envUrl.startsWith('http') &&
  !envUrl.includes('your-project-id') &&
  envAnonKey !== 'your-supabase-anon-key'
);

// Fallback local storage key for preview testing when Supabase credentials are not yet configured
const LOCAL_STORAGE_KEY = 'sneaker_clean_orders_fallback';

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: Order[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore storage quota errors
  }
}

let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(envUrl!, envAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export async function fetchOrdersFromDatabase(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as Order[];
  }

  // If Supabase is not configured yet, return local storage fallback orders
  return getLocalOrders();
}

export async function insertOrderToDatabase(payload: {
  customer_name: string;
  customer_phone: string;
  selected_items: string;
  total_price: number;
  status: 'pending';
}): Promise<Order> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database insert');
    }

    return data[0] as Order;
  }

  // Fallback simulation for preview environment when credentials are not yet injected
  const newOrder: Order = {
    id: crypto.randomUUID ? crypto.randomUUID() : 'ord-' + Date.now(),
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    selected_items: payload.selected_items,
    total_price: payload.total_price,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const existing = getLocalOrders();
  saveLocalOrders([newOrder, ...existing]);
  return newOrder;
}

export async function updateOrderStatusInDatabase(
  orderId: string,
  newStatus: 'processed'
): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  // Fallback for local preview
  const orders = getLocalOrders();
  const updated = orders.map((o) =>
    o.id === orderId ? { ...o, status: newStatus } : o
  );
  saveLocalOrders(updated);
}
