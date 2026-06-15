/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { io, Socket } from 'socket.io-client';
import { Product, CustomerMessage, AdminUser } from '../types';
import { storage } from './storage';

class SyncService {
  private socket: Socket;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.socket = io({
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    // Initial fetch via REST API (works on Vercel)
    this.fetchInitialData();

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('sync:initial', (data) => {
      console.log('Initial sync received via socket');
      this.applyData(data);
    });

    this.socket.on('products:changed', (products) => {
      storage.saveProducts(products);
      this.notify();
    });

    this.socket.on('messages:changed', (messages) => {
      storage.saveMessages(messages);
      this.notify();
    });

    this.socket.on('admins:changed', (admins) => {
      storage.saveAdmins(admins);
      this.notify();
    });
  }

  private async fetchInitialData() {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        this.applyData(data);
      }
    } catch (err) {
      console.error('Initial REST fetch failed:', err);
    }
  }

  private applyData(data: any) {
    if (data.products) storage.saveProducts(data.products);
    if (data.messages) storage.saveMessages(data.messages);
    if (data.admins) storage.saveAdmins(data.admins);
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  updateProducts(products: Product[]) {
    storage.saveProducts(products);
    this.socket.emit('products:update', products);
    this.saveToApi(); // Fallback persistent save
  }

  updateMessages(messages: CustomerMessage[]) {
    storage.saveMessages(messages);
    this.socket.emit('messages:update', messages);
    this.saveToApi();
  }

  updateAdmins(admins: AdminUser[]) {
    storage.saveAdmins(admins);
    this.socket.emit('admins:update', admins);
    this.saveToApi();
  }

  private async saveToApi() {
    try {
      const data = {
        products: storage.getProducts(),
        messages: storage.getMessages(),
        admins: storage.getAdmins()
      };
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('API save failed:', err);
    }
  }
}

export const syncService = new SyncService();
