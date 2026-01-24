'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Pill, 
  Package, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Clock,
  CheckCircle,
  PackageX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Stats {
  totalPrescriptions: number;
  pendingDispense: number;
  lowStockItems: number;
  dispensedToday: number;
}

export default function PharmacistDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalPrescriptions: 0,
    pendingDispense: 0,
    lowStockItems: 0,
    dispensedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prescriptions, pending, lowStock] = await Promise.all([
          fetch('/api/pharmacist/prescriptions').then(r => r.json()),
          fetch('/api/pharmacist/prescriptions?dispensed=false').then(r => r.json()),
          fetch('/api/pharmacist/inventory/low-stock').then(r => r.json()),
        ]);

        const today = new Date().toDateString();
        const dispensedToday = prescriptions.filter((p: any) => 
          p.dispensed && new Date(p.dispensedAt).toDateString() === today
        ).length;

        setStats({
          totalPrescriptions: prescriptions.length || 0,
          pendingDispense: pending.length || 0,
          lowStockItems: lowStock.length || 0,
          dispensedToday,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Pending Dispense',
      value: stats.pendingDispense,
      description: 'Awaiting fulfillment',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/pharmacist/queue',
    },
    {
      title: 'Dispensed Today',
      value: stats.dispensedToday,
      description: 'Completed prescriptions',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      link: '/pharmacist/prescriptions',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      description: 'Needs reordering',
      icon: PackageX,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/pharmacist/safety-alerts',
    },
    {
      title: 'Total Prescriptions',
      value: stats.totalPrescriptions,
      description: 'All time records',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/pharmacist/prescriptions',
    },
  ];

  const quickActions = [
    {
      title: 'Dispense Prescription',
      description: 'Process pending prescriptions',
      icon: Pill,
      href: '/pharmacist/queue',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Manage Inventory',
      description: 'Update stock levels',
      icon: Package,
      href: '/pharmacist/inventory',
      color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      title: 'Safety Alerts',
      description: 'Review critical alerts',
      icon: AlertTriangle,
      href: '/pharmacist/safety-alerts',
      color: 'bg-amber-600 hover:bg-amber-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Pharmacy Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Manage prescriptions, inventory, and patient safety
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={stat.link}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 hover:border-blue-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        {stat.title}
                      </CardTitle>
                      <div className={`${stat.bgColor} p-2 rounded-lg`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900">
                        {loading ? '...' : stat.value}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {stat.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Quick Actions</CardTitle>
              <CardDescription>Common pharmacy tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <div className={`${action.color} text-white p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105`}>
                        <Icon className="w-8 h-8 mb-4" />
                        <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Recent Activity</CardTitle>
              <CardDescription>Latest pharmacy operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-slate-500 text-center py-8">Loading activity...</p>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      View detailed activity in{' '}
                      <Link href="/pharmacist/prescriptions" className="text-blue-600 hover:underline">
                        Prescriptions
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
