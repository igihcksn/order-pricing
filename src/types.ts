export type BasePackageType = 'basic' | 'deep';

export interface ServicePackage {
  id: BasePackageType;
  name: string;
  price: number;
  description: string;
  features: string[];
}

export interface ServiceAddon {
  id: 'express';
  name: string;
  price: number;
  description: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  selected_items: string;
  total_price: number;
  status: 'pending' | 'processed';
  created_at: string;
}

export type OrderHistoryState = 'loading' | 'empty' | 'error' | 'data';
