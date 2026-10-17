'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  Bot,
  ShieldCheck,
  FileText,
  Settings,
  Languages,
  Sun,
  Moon,
  ShieldAlert,
  UserCheck,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  KeyRound,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();

  const navItems = !user ? [] : [
    { href: '/', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/tracker', label: t.nav.tracker, icon: Wallet },
    { href: '/assistant', label: t.nav.assistant, icon: Bot },
    { href: '/schemes', label: t.nav.schemes, icon: ShieldCheck },
    { href: '/complaints', label: t.nav.complaints, icon: FileText },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin Portal', icon: ShieldAlert }] : []),
    { href: '/settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0b1329]/95 backdrop-blur border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tight">G</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">GigSaathi</span>
                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.appTagline}
              </p>
            </div>
          </Link>

          {/* Controls: Sunlight / Dark Mode Toggle + Language Switcher */}
          <div className="flex items-center gap-2">
            {/* Sunlight High-Contrast Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Sunlight / Outdoor Mode' : 'Switch to Dark Mode'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline text-amber-400 font-semibold">Sunlight Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="hidden sm:inline text-indigo-400 font-semibold">Dark Mode</span>
                </>
              )}
            </button>

            {/* Language Switcher Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <Languages className="w-4 h-4 text-emerald-400 ml-1.5 hidden xs:block" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('pa')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  language === 'pa'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ਪੰਜਾਬੀ
              </button>
            </div>

            {/* Auth / Profile & Logout Dropdown */}
            {user ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 transition-all shadow-sm"
                  title={`Signed in as ${user.fullName} (${user.role})`}
                >
                  <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="max-w-[100px] truncate">{user.fullName.split(' ')[0]}</span>
                  {isAdmin && (
                    <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-extrabold uppercase">
                      Admin
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 group-focus-within:rotate-180 transition-transform" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-3 space-y-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50 animate-fadeIn">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {user.primaryPlatform} • {user.city}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href="/settings"
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Profile & Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-300 hover:text-white hover:bg-rose-950/40 transition-colors"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>Admin Supervisor Hub</span>
                      </Link>
                    )}

                    <Link
                      href="/reset-password"
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <span>Change Password</span>
                    </Link>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : pathname !== '/login' && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Secondary Nav Bar */}
      {user && (
      <nav className="hidden md:block bg-[#0e172a] border-b border-slate-800/60 px-4">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      )}

      {/* Mobile Bottom Navigation Bar (Thumb friendly) */}
      {user && (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0b1329]/95 backdrop-blur border-t border-slate-800 px-2 py-1 shadow-2xl">
        <div className={`grid grid-cols-${navItems.length} gap-1`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </>
  );
}
