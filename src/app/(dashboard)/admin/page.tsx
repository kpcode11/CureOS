'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Lock, Shield, ArrowRight } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState({ users: 0, roles: 0, permissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, rolesRes, permsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/roles'),
          fetch('/api/admin/permissions'),
        ]);

        const users = await usersRes.json();
        const roles = await rolesRes.json();
        const perms = await permsRes.json();

        setStats({
          users: Array.isArray(users) ? users.length : 0,
          roles: Array.isArray(roles) ? roles.length : 0,
          permissions: Array.isArray(perms) ? perms.length : 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '-' : value}</p>
        </div>
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
    </div>
  );

  const ActionCard = ({
    title,
    description,
    icon: Icon,
    href,
  }: {
    title: string;
    description: string;
    icon: any;
    href: string;
  }) => (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <Icon className="w-8 h-8 text-blue-600 mb-3" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        <div className="flex items-center text-blue-600 text-sm font-medium mt-4">
          Manage <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-600 mt-2">Manage your access control and track system activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.users} icon={Users} />
        <StatCard title="Total Roles" value={stats.roles} icon={Shield} />
        <StatCard title="Total Permissions" value={stats.permissions} icon={Lock} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <p className="text-gray-600 mb-6">Manage your system resources</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard
            title="Manage Users"
            description="View & edit users"
            icon={Users}
            href="/admin/rbac?tab=users"
          />
          <ActionCard
            title="Manage Roles"
            description="Configure roles"
            icon={Shield}
            href="/admin/rbac?tab=roles"
          />
          <ActionCard
            title="Permissions"
            description="Control access"
            icon={Lock}
            href="/admin/rbac?tab=permissions"
          />
        </div>
      </div>
    </div>
  );
}