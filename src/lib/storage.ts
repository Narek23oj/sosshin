/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, CustomerMessage, AdminUser } from '../types';

const STORAGE_KEYS = {
  products: 'sos.v2.products',
  admins: 'sos.v2.admins',
  messages: 'sos.v2.messages',
  activeAdmin: 'sos.v2.activeAdmin'
};

const DEFAULT_ADMINS: AdminUser[] = [
  {
    email: 'narek@sosshin.am',
    role: 'Main admin'
  },
  {
    email: 'vardan@sosshin.am',
    role: 'Admin'
  }
];

const ADMIN_CREDENTIALS = [
  { email: 'narek@sosshin.am', password: 'Narek098' },
  { email: 'vardan@sosshin.am', password: 'VardanInitial2026' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    barcode: 'SOS-PUMP-1500',
    name: 'Լողավազանի նասոս 1.5 HP',
    price: 145000,
    image: '',
    status: 'Popular',
    pinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    barcode: 'SOS-PVC-50',
    name: 'PVC խողովակ 50մմ',
    price: 3200,
    image: '',
    status: 'New',
    pinned: false,
    createdAt: new Date().toISOString()
  }
];

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.products);
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  },
  getMessages: (): CustomerMessage[] => {
    const data = localStorage.getItem(STORAGE_KEYS.messages);
    return data ? JSON.parse(data) : [];
  },
  saveMessages: (messages: CustomerMessage[]) => {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  },
  getAdmins: (): AdminUser[] => {
    const data = localStorage.getItem(STORAGE_KEYS.admins);
    return data ? JSON.parse(data) : DEFAULT_ADMINS;
  },
  validateLogin: (email: string, pass: string): boolean => {
    return ADMIN_CREDENTIALS.some(c => c.email.toLowerCase() === email.toLowerCase() && c.password === pass);
  },
  saveAdmins: (admins: AdminUser[]) => {
    localStorage.setItem(STORAGE_KEYS.admins, JSON.stringify(admins));
  },
  getActiveAdmin: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.activeAdmin);
  },
  setActiveAdmin: (email: string | null) => {
    if (email) {
      localStorage.setItem(STORAGE_KEYS.activeAdmin, email);
    } else {
      localStorage.removeItem(STORAGE_KEYS.activeAdmin);
    }
  }
};
