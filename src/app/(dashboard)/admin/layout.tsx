'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home, Shield, Users, Lock, BarChart3 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminLinks = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: Home,
    },
    {
      label: 'RBAC Management',
      href: '/admin/rbac',
      icon: Shield,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2 hover:opacity-80">
              <Shield className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">← Back to Home</Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-gray-50 p-6">
          <nav className="space-y-2">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <div className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-gray-200 transition cursor-pointer text-gray-700 hover:text-gray-900">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
