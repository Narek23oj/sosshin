/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, CustomerMessage, AdminUser } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { storage } from '../lib/storage';
import { syncService } from '../lib/sync';
import { useSync } from '../hooks/useSync';
import { 
  Plus, Package, MessageSquare, Users, Image as ImageIcon, 
  Trash2, Edit2, Pin, Search, LogOut, ChevronRight, Barcode, DollarSign,
  CheckCircle, Link as LinkIcon, Info
} from 'lucide-react';

const FALLBACK_IMAGE = '/src/assets/images/sos_pool_equipment_hero_1781518777028.jpg';

const LOCAL_SUGGESTIONS = [
  { name: 'Լողավազանի նասոս 1.5 HP', barcode: 'SOS-PUMP-1500', status: 'Popular' },
  { name: 'Լողավազանի նասոս 2 HP', barcode: 'SOS-PUMP-2000', status: 'New' },
  { name: 'PVC խողովակ 50մմ', barcode: 'SOS-PVC-50', status: 'In Stock' },
  { name: 'PVC անկյուն 90°', barcode: 'SOS-PVC-ELBOW-90', status: 'In Stock' },
  { name: 'Ավազային ֆիլտր լողավազանի համար', barcode: 'SOS-FILTER-SAND', status: 'Sale' },
  { name: 'Փական PVC 50մմ', barcode: 'SOS-VALVE-50', status: 'Popular' },
  { name: 'Ճնշաչափ ֆիլտրի համար', barcode: 'SOS-GAUGE-01', status: 'New' },
];

interface AdminPageProps {
  onLogout: () => void;
}

export default function AdminPage({ onLogout }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'messages' | 'admins'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [suggestions, setSuggestions] = useState<typeof LOCAL_SUGGESTIONS>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'name' | 'barcode' | null>(null);
  const syncTick = useSync();

  useEffect(() => {
    setProducts(storage.getProducts());
    setMessages(storage.getMessages());
    setAdmins(storage.getAdmins());
  }, [syncTick]);

  const handleNameChange = (val: string) => {
    setEditingProduct({ ...editingProduct, name: val });
    if (val.length > 1) {
      const filtered = LOCAL_SUGGESTIONS.filter(s => 
        s.name.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setActiveSuggestionField('name');
    } else {
      setSuggestions([]);
      setActiveSuggestionField(null);
    }
  };

  const handleBarcodeChange = (val: string) => {
    setEditingProduct({ ...editingProduct, barcode: val });
    if (val.length > 1) {
      const filtered = LOCAL_SUGGESTIONS.filter(s => 
        s.name.toLowerCase().includes(val.toLowerCase()) || 
        s.barcode.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
      setActiveSuggestionField('barcode');
    } else {
      setSuggestions([]);
      setActiveSuggestionField(null);
    }
  };

  const applySuggestion = (s: typeof LOCAL_SUGGESTIONS[0]) => {
    setEditingProduct({
      ...editingProduct,
      name: s.name,
      barcode: s.barcode,
      status: s.status
    });
    setSuggestions([]);
    setActiveSuggestionField(null);
  };

  const refreshData = () => {
    setProducts(storage.getProducts());
    setMessages(storage.getMessages());
    setAdmins(storage.getAdmins());
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      barcode: formData.get('barcode') as string,
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      image: formData.get('image') as string,
      status: formData.get('status') as string,
      pinned: formData.get('pinned') === 'on',
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    const currentProducts = storage.getProducts();
    if (editingProduct?.id) {
      const index = currentProducts.findIndex(p => p.id === editingProduct.id);
      if (index !== -1) currentProducts[index] = productData;
    } else {
      currentProducts.unshift(productData);
    }

    storage.saveProducts(currentProducts);
    syncService.updateProducts(currentProducts);
    setProducts(currentProducts);
    setEditingProduct(null);
    setScanStatus('Ապրանքը հաջողությամբ պահպանվեց։');
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setScanStatus(''), 3000);
  };

  const handleDeleteProduct = (id: string) => {
    const currentProducts = storage.getProducts().filter(p => p.id !== id);
    storage.saveProducts(currentProducts);
    syncService.updateProducts(currentProducts);
    setProducts(currentProducts);
  };

  const handleDeleteMessage = (id: string) => {
    const currentMessages = storage.getMessages().filter(m => m.id !== id);
    storage.saveMessages(currentMessages);
    syncService.updateMessages(currentMessages);
    setMessages(currentMessages);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 embedding
        setScanStatus('Image too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
        setScanStatus('Image uploaded and embedded.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearchOnline = async () => {
    const barcode = editingProduct?.barcode;
    if (!barcode) {
      setScanStatus('Նախ լրացրեք կամ սկան արեք barcode-ը։');
      return;
    }

    setIsSearchingOnline(true);
    setScanStatus('Փնտրում է ինտերնետում...');
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
      const data = await response.json();
      if (data.product) {
        setEditingProduct({
          ...editingProduct,
          name: data.product.product_name || editingProduct.name,
          image: data.product.image_front_url || editingProduct.image,
        });
        setScanStatus('Գտավ տվյալներ։');
      } else {
        setScanStatus('Այս barcode-ով online արդյունք չգտնվեց։');
      }
    } catch (error) {
      setScanStatus('Online որոնումը չաշխատեց։');
    } finally {
      setIsSearchingOnline(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-main font-sans text-text-secondary">
      <aside className="fixed inset-y-0 left-0 w-72 bg-bg-sidebar p-6 text-white overflow-y-auto z-40 hidden md:block border-r border-border">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-12 min-w-[54px] items-center justify-center rounded-lg bg-accent font-extrabold text-white">
            SOS
          </div>
          <div>
            <strong className="block text-lg tracking-tight">sosshin.am</strong>
            <small className="font-semibold text-text-muted">Admin Dashboard</small>
          </div>
        </div>

        <nav className="grid gap-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-3 font-extrabold transition-all",
              activeTab === 'products' ? "bg-bg-card text-white ring-1 ring-border" : "text-text-muted hover:text-white"
            )}
          >
            <Package className="h-5 w-5" /> Products
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-3 font-extrabold transition-all",
              activeTab === 'messages' ? "bg-bg-card text-white ring-1 ring-border" : "text-text-muted hover:text-white"
            )}
          >
            <MessageSquare className="h-5 w-5" /> Messages
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-4 py-3 font-extrabold transition-all",
              activeTab === 'admins' ? "bg-bg-card text-white ring-1 ring-border" : "text-text-muted hover:text-white"
            )}
          >
            <Users className="h-5 w-5" /> Admins
          </button>
          <hr className="my-4 border-border" />
          <a href="/" className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-extrabold text-text-muted hover:text-white">
            Open site <ChevronRight className="h-4 w-4" />
          </a>
          <button 
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-extrabold text-text-muted hover:text-white"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 md:ml-72 bg-bg-main pb-12">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-bg-main/50 px-8 backdrop-blur-md border-b border-border text-white">
          <h2 className="text-xl font-bold tracking-tight">
            {activeTab === 'products' && "Products"}
            {activeTab === 'messages' && "Messages"}
            {activeTab === 'admins' && "Admins"}
          </h2>
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
               SOS
             </div>
          </div>
        </header>

        <div className="px-8 pt-8">
          {activeTab === 'products' && (
            <div className="grid gap-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Product management</p>
                  <h3 className="section-title text-2xl">Ավելացնել կամ փոփոխել ապրանք</h3>
                </div>
                <div className="flex gap-4">
                  <div className="rounded-lg border border-border bg-bg-card px-4 py-2 shadow-sm">
                    <span className="text-xs font-bold text-text-muted uppercase">Total</span>
                    <p className="text-lg font-extrabold text-white">{products.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-bg-card px-4 py-2 shadow-sm">
                    <span className="text-xs font-bold text-text-muted uppercase">Pinned</span>
                    <p className="text-lg font-extrabold text-white">{products.filter(p => p.pinned).length}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="grid gap-6 rounded-xl border border-border bg-bg-card p-8 shadow-2xl">
                <div className="grid gap-4 sm:grid-cols-[1fr,auto]">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-extrabold text-white">Barcode</label>
                    <div className="relative">
                      <Barcode className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <input 
                        type="text" 
                        name="barcode"
                        value={editingProduct?.barcode || ''}
                        onChange={(e) => handleBarcodeChange(e.target.value)}
                        placeholder="Սկան արեք կամ գրեք barcode" 
                        required 
                        className="pl-12"
                        autoComplete="off"
                      />
                    </div>
                    {activeSuggestionField === 'barcode' && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-sidebar shadow-2xl">
                        {suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className="flex w-full flex-col p-3 text-left hover:bg-white/5 border-b border-border last:border-0"
                          >
                            <strong className="text-sm text-white">{s.name}</strong>
                            <span className="text-[0.7rem] text-text-muted">{s.barcode} • {s.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={handleSearchOnline}
                    disabled={isSearchingOnline}
                    className="self-end h-12 rounded-lg border border-border bg-transparent px-6 font-extrabold text-white hover:bg-white/5 transition-colors"
                  >
                    {isSearchingOnline ? 'Searching...' : 'Search online'}
                  </button>
                </div>
                {scanStatus && <p className="text-xs font-bold text-accent">{scanStatus}</p>}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-sm font-extrabold text-white">Product name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={editingProduct?.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Օրինակ՝ Pool Pump 1.5 HP" 
                      required 
                      autoComplete="off"
                    />
                    {activeSuggestionField === 'name' && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-sidebar shadow-2xl">
                        {suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applySuggestion(s)}
                            className="flex w-full flex-col p-3 text-left hover:bg-white/5 border-b border-border last:border-0"
                          >
                            <strong className="text-sm text-white">{s.name}</strong>
                            <span className="text-[0.7rem] text-text-muted">{s.barcode} • {s.status}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-white">Price (AMD)</label>
                    <div className="relative">
                      <DollarSign className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
                      <input 
                        type="number" 
                        name="price"
                        value={editingProduct?.price || ''}
                        onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        placeholder="Գին AMD" 
                        required 
                        className="pl-12"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-white">Product Image</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
                        <input 
                          type="text" 
                          name="image"
                          value={editingProduct?.image || ''}
                          onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                          placeholder="Image URL or upload ->" 
                          className="pl-12"
                        />
                      </div>
                      <label className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-border bg-white/5 text-white hover:bg-white/10 transition-colors overflow-hidden">
                        {editingProduct?.image ? (
                          <img src={editingProduct.image} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-extrabold text-white">Status / label</label>
                    <input 
                      list="status-list" 
                      name="status"
                      value={editingProduct?.status || ''}
                      onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})}
                      placeholder="Sale, Popular, New կամ custom" 
                    />
                    <datalist id="status-list">
                      <option value="Sale" />
                      <option value="Popular" />
                      <option value="New" />
                      <option value="In Stock" />
                    </datalist>
                  </div>
                </div>

                <label className="flex items-center gap-3 text-sm font-extrabold text-white cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="pinned" 
                    checked={editingProduct?.pinned || false}
                    onChange={(e) => setEditingProduct({...editingProduct, pinned: e.target.checked})}
                    className="h-5 w-5 rounded border-border bg-bg-main" 
                  />
                  Pin product and show higher/highlighted
                </label>

                <div className="flex gap-3">
                  <button type="submit" className="flex h-12 items-center justify-center rounded-lg bg-accent px-8 font-extrabold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors">
                    {editingProduct?.id ? 'Update Product' : 'Save Product'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct(null)}
                    className="flex h-12 items-center justify-center rounded-lg border border-border bg-transparent px-8 font-extrabold text-white hover:bg-white/5 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </form>

              <div className="overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-bg-sidebar text-xs font-extrabold text-text-muted uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Barcode</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-border group hover:bg-bg-main/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image || FALLBACK_IMAGE} alt="" className="h-10 w-10 rounded border border-border object-cover" />
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{p.name}</span>
                              {p.pinned && <span className="text-[0.65rem] font-extrabold text-amber-500 flex items-center gap-1 uppercase"><Pin className="h-2 w-2" /> Pinned</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-text-muted">{p.barcode}</td>
                        <td className="p-4 font-extrabold text-white">{formatPrice(p.price)}</td>
                        <td className="p-4">
                          {p.status && (
                            <span className="rounded-full bg-bg-main border border-border px-2 py-0.5 text-[0.65rem] font-extrabold text-accent uppercase">
                              {p.status}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setEditingProduct(p)}
                              className="p-2 text-text-muted hover:text-accent transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 text-text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-text-muted">No products yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Inquiries</p>
                  <h3 className="section-title text-2xl">Հաճախորդների հարցումներ</h3>
                </div>
                <div className="rounded-full bg-accent/10 border border-accent/20 px-4 py-1 text-sm font-bold text-accent">
                  {messages.length} messages
                </div>
              </div>
              
              <div className="grid gap-4">
                {messages.map((m) => (
                  <div key={m.id} className="relative rounded-xl border border-border bg-bg-card p-6 shadow-2xl">
                    <button 
                      onClick={() => handleDeleteMessage(m.id)}
                      className="absolute top-4 right-4 p-2 text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-main text-accent border border-border">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <strong className="block text-white">{m.name}</strong>
                        <span className="text-xs font-bold text-text-muted">{m.phone}</span>
                      </div>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{m.message}</p>
                    <time className="mt-4 block text-[0.7rem] font-bold text-text-muted uppercase tracking-wider">
                      {new Date(m.createdAt).toLocaleString('hy-AM')}
                    </time>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-bg-card p-12 text-center text-text-muted">
                    Հաղորդագրություններ դեռ չկան։
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="grid gap-8 max-w-2xl">
              <div>
                <p className="eyebrow">User management</p>
                <h3 className="section-title text-2xl">Admin Access</h3>
              </div>
              
              <div className="grid gap-4">
                {admins.map((a) => (
                  <div key={a.email} className="flex items-center justify-between rounded-xl border border-border bg-bg-card p-4 shadow-lg transition-all hover:border-accent/40">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border border-border",
                        a.role === 'Main admin' ? "bg-amber-500/10 text-amber-500" : "bg-accent/10 text-accent"
                      )}>
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        {/* ադմինի անունը չևերեվա as requested */}
                        <strong className="block text-white">Admin User</strong>
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">{a.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="rounded-xl bg-accent/5 p-6 border border-accent/10">
                <p className="text-xs font-bold text-accent leading-relaxed uppercase tracking-widest">
                  <Info className="inline h-4 w-4 mr-2 mb-1" />
                  Admin users can manage the entire catalog.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
