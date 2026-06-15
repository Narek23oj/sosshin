/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  image: string;
  status?: string;
  pinned: boolean;
  createdAt: string;
}

export interface CustomerMessage {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  role: 'Main admin' | 'Admin';
}
