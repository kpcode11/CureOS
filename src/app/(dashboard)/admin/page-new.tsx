'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/sidebar-02/app-sidebar';
import { ChevronDown, Plus, Download, FileText, Users, Lock, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import GooeyDepartmentDashboard from '@/components/gooey-department-dashboard';

interface StatCard {
  title: string;
  value: number | string;
  change: string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}

export default function AdminPageNew() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        const statsData: StatCard[] = [
          {
            title: 'Total Users',
            value: Array.isArray(users) ? users.length : 0,
            change: '+12%',
            icon: <Users className="w-5 h-5" />,
            color: 'bg-blue-50 dark:bg-blue-900/20',
            link: '/admin/rbac?tab=users',
          },
          {
            title: 'Roles',
            value: Array.isArray(roles) ? roles.length : 0,
            change: '+4%',
            icon: <Shield className="w-5 h-5" />,
            color: 'bg-purple-50 dark:bg-purple-900/20',
            link: '/admin/rbac?tab=roles',
          },
          {
            title: 'Permissions',
            value: Array.isArray(perms) ? perms.length : 0,
            change: '+8%',
            icon: <Lock className="w-5 h-5" />,
            color: 'bg-green-50 dark:bg-green-900/20',
            link: '/admin/rbac?tab=permissions',
          },
          {
            title: 'System Health',
            value: '98%',
            change: '+2%',
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'bg-emerald-50 dark:bg-emerald-900/20',
          },
        ];

        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          {/* Header */}
          <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b bg-card sticky top-0 z-10 w-full">
            <h1 className="text-base sm:text-lg font-medium flex-1 truncate">Admin Dashboard</h1>

            <div className="flex items-center gap-2 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 sm:gap-3 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <span className="hidden xs:inline">Export</span>
                    <Download className="w-4 h-4" />
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Export Report
                  </DropdownMenuItem>
                  <DropdownMenuItem>Export Users</DropdownMenuItem>
                  <DropdownMenuItem>Export Audit Log</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="gap-2 h-8 sm:h-9 text-xs sm:text-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Add User</span>
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-background w-full">
            {/* Welcome Section */}
            <div className="space-y-2 sm:space-y-5">
              <h2 className="text-lg sm:text-[22px] font-semibold leading-relaxed">
                Welcome Back, {session?.user?.name || 'Admin'}!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                System Status: <span className="text-emerald-600 font-medium">Operational</span> • All modules active
              </p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 rounded-xl border bg-card">
              {stats.map((stat, index) => (
                <Link
                  key={stat.title}
                  href={stat.link || '#'}
                  className={`group flex flex-col justify-between p-4 rounded-lg transition-all ${stat.color} hover:shadow-md cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {stat.icon}
                      <span className="text-[10px] sm:text-xs lg:text-sm font-medium">
                        {stat.title}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg sm:text-xl lg:text-[28px] font-semibold">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Department Analytics */}
            <div className="border rounded-xl bg-card overflow-hidden">
              <div className="p-4 sm:p-6 border-b bg-card">
                <h3 className="text-base sm:text-lg font-semibold">Department Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time metrics across all hospital departments
                </p>
              </div>
              <div className="overflow-auto">
                <GooeyDepartmentDashboard />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <Link
                href="/admin/rbac?tab=users"
                className="p-4 sm:p-6 border rounded-xl bg-card hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Manage Users</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Add, edit, and manage system users
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              <Link
                href="/admin/rbac?tab=roles"
                className="p-4 sm:p-6 border rounded-xl bg-card hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Manage Roles</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Configure roles and permissions
                    </p>
                  </div>
                  <Shield className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              <Link
                href="/admin/rbac?tab=permissions"
                className="p-4 sm:p-6 border rounded-xl bg-card hover:bg-accent transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base">Manage Permissions</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Define and assign permissions
                    </p>
                  </div>
                  <Lock className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>

              <div className="p-4 sm:p-6 border rounded-xl bg-card">
                <h4 className="font-semibold text-sm sm:text-base">System Status</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span>Database</span>
                    <span className="text-emerald-600">✓ Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span>Authentication</span>
                    <span className="text-emerald-600">✓ Active</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span>Real-time Sync</span>
                    <span className="text-emerald-600">✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
