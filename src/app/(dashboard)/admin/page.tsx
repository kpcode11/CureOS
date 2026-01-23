'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Users, Lock, BarChart3 } from 'lucide-react';

export default function AdminPage() {
  const adminModules = [
    {
      title: 'Role-Based Access Control',
      description: 'Manage roles, permissions, and user access',
      icon: Shield,
      href: '/admin/rbac',
      color: 'blue',
    },
    {
      title: 'User Management',
      description: 'View and manage all system users',
      icon: Users,
      href: '/admin/rbac?tab=users',
      color: 'green',
    },
    {
      title: 'Audit Logs',
      description: 'Track all system changes and user actions',
      icon: BarChart3,
      href: '/admin/audit',
      color: 'purple',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your hospital system's core functions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => {
            const Icon = module.icon;
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
              green: 'bg-green-50 border-green-200 hover:border-green-300',
              purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
            };

            const iconColorClasses = {
              blue: 'text-blue-600',
              green: 'text-green-600',
              purple: 'text-purple-600',
            };

            const buttonColorClasses = {
              blue: 'text-blue-600 hover:text-blue-700',
              green: 'text-green-600 hover:text-green-700',
              purple: 'text-purple-600 hover:text-purple-700',
            };

            if (module.disabled) {
              return (
                <div
                  key={module.title}
                  className={`rounded-lg border-2 p-6 opacity-50 cursor-not-allowed ${
                    colorClasses[module.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${iconColorClasses[module.color as keyof typeof iconColorClasses]}`} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                  <span className="text-xs font-semibold text-gray-500">Coming Soon</span>
                </div>
              );
            }

            return (
              <Link key={module.title} href={module.href}>
                <div
                  className={`rounded-lg border-2 p-6 transition cursor-pointer ${
                    colorClasses[module.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 mb-3 ${iconColorClasses[module.color as keyof typeof iconColorClasses]}`}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{module.description}</p>
                  <span className={`text-sm font-semibold ${buttonColorClasses[module.color as keyof typeof buttonColorClasses]}`}>
                    Access →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}