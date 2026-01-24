'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Search,
  ArrowRight,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BillingRecord {
  id: string;
  patientId: string;
  amount: number;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string;
}

export default function OverdueBillsPage() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOverdueBills();
  }, []);

  const fetchOverdueBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/overdue');
      if (res.ok) {
        const data = await res.json();
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOverdue = bills.reduce((sum, b) => sum + b.amount, 0);
  const avgDaysOverdue = bills.length > 0
    ? Math.round(bills.reduce((sum, b) => {
        const days = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / bills.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-600 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                  Overdue Bills
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                Bills that have passed their due date
              </p>
            </div>
            <Link href="/billing">
              <Button variant="outline" className="border-slate-300">
                View All Bills
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Overdue Amount</p>
                  <p className="text-3xl font-bold mt-2">₹{totalOverdue.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-red-100">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Action required</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Overdue Bills</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{bills.length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Avg Days Overdue</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{avgDaysOverdue}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by patient ID or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-red-500 h-11"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bills Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Overdue Invoices</CardTitle>
              <CardDescription>
                Showing {filteredBills.length} overdue bills requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg">No overdue bills found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Invoice ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Patient ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Description</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Amount</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Due Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Days Overdue</th>
                        <th className="text-left py-4 px-4 font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill, index) => {
                        const daysOverdue = Math.floor((Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <motion.tr
                            key={bill.id}
                            className="border-b border-slate-100 hover:bg-red-50/50 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm text-slate-600">
                                {bill.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-medium text-slate-900">
                                {bill.patientId.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-4 px-4 max-w-xs truncate">
                              {bill.description}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-red-600">
                                ₹{bill.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600">
                              {new Date(bill.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4">
                              <Badge className="bg-red-50 text-red-700 border-red-200 border">
                                {daysOverdue} days
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Link href={`/billing/${bill.id}`}>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  View Details
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
