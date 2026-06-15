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
    this.socket = io();

    this.socket.on('sync:initial', (data) => {
      console.log('Initial sync received');
      storage.saveProducts(data.products);
      storage.saveMessages(data.messages);
      storage.saveAdmins(data.admins);
      this.notify();
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
  }

  updateMessages(messages: CustomerMessage[]) {
    storage.saveMessages(messages);
    this.socket.emit('messages:update', messages);
  }

  updateAdmins(admins: AdminUser[]) {
    storage.saveAdmins(admins);
    this.socket.emit('admins:update', admins);
  }
}

export const syncService = new SyncService();
