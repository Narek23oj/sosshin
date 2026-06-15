/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { storage } from '../lib/storage';
import { syncService } from '../lib/sync';
import { useSync } from '../hooks/useSync';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Phone, Mail, Menu, X, ArrowUpRight, Pin } from 'lucide-react';

export default function HomePage() {
  const heroImage = '/src/assets/images/sos_pool_equipment_hero_1781518777028.jpg';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const syncTick = useSync();

  useEffect(() => {
    setProducts(storage.getProducts());
  }, [syncTick]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.barcode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.name.localeCompare(b.name, 'hy');
  });

  const handleSubmitMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const messages = storage.getMessages();
      messages.unshift({
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        message: formData.get('message') as string,
        createdAt: new Date().toISOString(),
      });
      storage.saveMessages(messages);
      syncService.updateMessages(messages);
      setFormSuccess(true);
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setFormSuccess(false), 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-bg-main/90 px-6 py-4 backdrop-blur-md md:px-16">
        <a href="#" className="flex items-center gap-3">
          <div className="flex h-10 min-w-[54px] items-center justify-center rounded-lg bg-accent font-extrabold text-white">
            SOS
          </div>
          <span className="hidden text-sm font-extrabold text-text-muted sm:block">sosshin.am</span>
        </a>

        <button 
          className="rounded-lg border border-border bg-bg-card p-2 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
        </button>

        <nav className={cn(
          "absolute top-[73px] left-6 right-6 flex flex-col gap-4 rounded-xl border border-border bg-bg-card p-6 shadow-2xl md:static md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none",
          isMenuOpen ? "flex" : "hidden"
        )}>
          <a href="#catalog" className="text-[0.94rem] font-bold text-text-secondary hover:text-white transition-colors">Կատալոգ</a>
          <a href="#contact" className="text-[0.94rem] font-bold text-text-secondary hover:text-white transition-colors">Հարցում</a>
          <a href="/admin" className="text-[0.94rem] font-bold text-text-secondary hover:text-white transition-colors">Admin</a>
        </nav>
      </header>

      <main className="flex-1 pt-20">
        <section className="relative flex min-h-[700px] items-center justify-center overflow-hidden px-6 md:px-16">
          <div className="absolute inset-0 bg-cover bg-right-center" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main/99 via-bg-main/88 to-bg-main/32" aria-hidden="true" />
          
          <div className="relative z-10 w-full max-w-[760px]">
            <p className="eyebrow mb-4">sosshin.am equipment catalog</p>
            <h1 className="text-white text-4xl font-extrabold leading-[1.06] md:text-7xl">
              Լողավազանների նասոսներ, խողովակներ և տեխնիկական սարքավորումներ
            </h1>
            <p className="mt-6 max-w-[620px] text-lg leading-relaxed text-text-secondary">
              Ընտրեք լողավազանի համար անհրաժեշտ սարքավորումները՝ նասոսներ, ֆիլտրեր,
              PVC խողովակներ, փականներ և պահեստամասեր։
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#catalog" className="flex h-12 items-center justify-center rounded-lg bg-accent px-6 font-extrabold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition-colors">
                Տեսնել կատալոգը
              </a>
              <a href="#contact" className="flex h-12 items-center justify-center rounded-lg border border-border-hover bg-transparent px-6 font-extrabold text-white hover:bg-bg-card transition-colors">
                Ուղարկել հարցում
              </a>
            </div>
            <div className="mt-8 flex gap-3 text-xs font-bold text-text-muted uppercase">
              <span className="rounded-full bg-border/50 px-3 py-1 border border-border">Pumps</span>
              <span className="rounded-full bg-border/50 px-3 py-1 border border-border">Filters</span>
              <span className="rounded-full bg-border/50 px-3 py-1 border border-border">PVC Pipes</span>
              <span className="rounded-full bg-border/50 px-3 py-1 border border-border">Valves</span>
            </div>
          </div>
        </section>

        <section id="catalog" className="px-6 py-20 md:px-16 scroll-mt-20">
          <div className="mb-10 max-w-[780px]">
            <p className="eyebrow mb-3">sosshin.am catalog</p>
            <h2 className="section-title text-3xl md:text-5xl">Սարքավորումներ՝ արագ ընտրելու համար</h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              Ընտրեք լավագույյ սարքավորումները ձեր լողավազանի համար։ 
              Pinned ապրանքները ցուցադրվում են վերևում։
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-[1fr,220px]">
            <div className="relative">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input 
                type="search" 
                placeholder="Որոնել անունով կամ barcode-ով" 
                className="pl-12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="bg-bg-card"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Բոլոր label-ները</option>
              <option value="Sale">Sale</option>
              <option value="Popular">Popular</option>
              <option value="New">New</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence>
              {filteredProducts.map((p) => (
                <motion.article 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={p.id}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl transition-all duration-300 hover:border-accent/40",
                    p.pinned && "border-amber-500/50"
                  )}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-bg-main">
                    <img 
                      src={p.image || heroImage} 
                      alt={p.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="grid gap-2.5 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {p.status && (
                        <span className="rounded-full bg-bg-main px-2.5 py-1 text-[0.7rem] font-extrabold text-accent border border-border uppercase">
                          {p.status}
                        </span>
                      )}
                      {p.pinned && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[0.7rem] font-extrabold text-amber-500 border border-amber-500/20 uppercase">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-bold">{p.name}</h3>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-extrabold text-white">{formatPrice(p.price)}</span>
                      <span className="text-[0.75rem] font-medium text-text-muted uppercase tracking-wider">{p.barcode}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-bg-card p-12 text-center text-text-muted">
              Ապրանք դեռ չկա։
            </div>
          )}
        </section>

        <section id="contact" className="grid gap-12 bg-bg-sidebar px-6 py-24 text-text-secondary md:grid-cols-2 md:px-16 border-t border-border">
          <div>
            <p className="eyebrow mb-4">Customer questions</p>
            <h2 className="mb-6 text-3xl font-extrabold text-white md:text-5xl">Ուղարկել հարցում sosshin.am-ին</h2>
            <p className="text-lg text-text-muted">Ձեր հաղորդագրությունը կփոխանցվի ադմին բաժին։ Մեր մասնագետները կկապնվեն ձեզ հետ:</p>
            
            <div className="mt-10 flex flex-col gap-6 font-extrabold">
              <a href="tel:+37400000000" className="flex items-center gap-4 text-xl text-white hover:text-accent transition-colors">
                <Phone className="h-6 w-6 text-accent" /> +374 XX XXX XXX
              </a>
              <a href="mailto:info@sosshin.am" className="flex items-center gap-4 text-xl text-white hover:text-accent transition-colors">
                <Mail className="h-6 w-6 text-accent" /> info@sosshin.am
              </a>
              <div className="flex items-center gap-4 text-xl text-white">
                <div className="h-6 w-6 rounded-full bg-accent/20 p-1">
                  <div className="h-full w-full rounded-full bg-accent ring-4 ring-accent/30 animate-pulse" />
                </div>
                <span>Երևան և մարզեր</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitMessage} className="flex flex-col gap-5 rounded-xl border border-border bg-bg-card p-8 text-text-secondary shadow-2xl">
            <label className="flex flex-col gap-2 font-extrabold text-white">
              Անուն
              <input type="text" name="name" placeholder="Ձեր անունը" required />
            </label>
            <label className="flex flex-col gap-2 font-extrabold text-white">
              Հեռախոս
              <input type="tel" name="phone" placeholder="+374" required />
            </label>
            <label className="flex flex-col gap-2 font-extrabold text-white">
              Հարց կամ պատվերի նկարագրություն
              <textarea name="message" rows={4} placeholder="Օրինակ՝ պետք է նասոս 30 մ³ լողավազանի համար" required />
            </label>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "mt-2 flex h-14 items-center justify-center rounded-lg bg-accent px-8 font-extrabold text-white transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-50 shadow-lg shadow-accent/20",
                formSuccess && "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              )}
            >
              {isSubmitting ? "Ուղարկվում է..." : formSuccess ? "Հարցումը ուղարկվեց!" : "Ուղարկել հարցում"}
            </button>
            <p className="text-center text-xs text-text-muted">Հարցումը կերևա admin dashboard-ում։</p>
          </form>
        </section>
      </main>

      <footer className="flex flex-col items-center justify-between border-t border-border bg-bg-sidebar px-6 py-8 sm:flex-row md:px-16">
        <p className="text-sm font-medium text-text-muted">© {new Date().getFullYear()} sosshin.am</p>
        <a href="#" className="flex items-center gap-2 text-sm font-extrabold text-accent hover:text-white transition-colors">
          Վերև <ArrowUpRight className="h-4 w-4" />
        </a>
      </footer>
    </div>
  );
}
