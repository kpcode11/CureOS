'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Settings,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Save
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const statuses = [
  { value: 'PENDING', label: 'Pending', icon: Clock, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', description: 'Payment is pending' },
  { value: 'PAID', label: 'Paid', icon: CheckCircle2, color: 'bg-green-50 border-green-200 text-green-700', description: 'Payment completed' },
  { value: 'OVERDUE', label: 'Overdue', icon: AlertCircle, color: 'bg-red-50 border-red-200 text-red-700', description: 'Payment is overdue' },
  { value: 'CANCELLED', label: 'Cancelled', icon: XCircle, color: 'bg-gray-50 border-gray-200 text-gray-700', description: 'Invoice cancelled' }
];

export default function StatusChangePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      const res = await fetch(`/api/billing/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBill(data);
        setSelectedStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/billing/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus })
      });

      if (res.ok) {
        toast({
          title: 'Status Updated',
          description: 'Bill status has been updated successfully',
        });
        setTimeout(() => {
          router.push(`/billing/${params.id}`);
        }, 1500);
      } else {
        const error = await res.json();
        toast({
          title: 'Update Failed',
          description: error.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while updating status',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/billing/${params.id}`}>
              <Button variant="ghost" className="hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Invoice
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-xl">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Change Bill Status</h1>
              <p className="text-slate-600 mt-1">Update the payment status for this invoice</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardTitle className="text-2xl">Select New Status</CardTitle>
                  <CardDescription>Choose the appropriate status for this invoice</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    {statuses.map((status) => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.value}
                          onClick={() => setSelectedStatus(status.value)}
                          className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                            selectedStatus === status.value
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-lg ${status.color} flex items-center justify-center`}>
                              <Icon className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-lg text-slate-900">{status.label}</p>
                              <p className="text-sm text-slate-600 mt-1">{status.description}</p>
                            </div>
                            {selectedStatus === status.value && (
                              <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t">
                    <Button
                      onClick={handleSubmit}
                      disabled={saving || selectedStatus === bill?.status}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-12 shadow-lg"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-none shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Invoice ID</span>
                    <span className="font-mono font-semibold">{params.id?.toString().slice(0, 8)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Amount</span>
                    <span className="font-bold text-blue-600">₹{bill?.amount.toLocaleString()}</span>
                  </div>

                  <div className="pt-4">
                    <p className="text-slate-600 mb-2">Current Status</p>
                    {bill && (() => {
                      const currentStatus = statuses.find(s => s.value === bill.status);
                      const StatusIcon = currentStatus?.icon || Clock;
                      return (
                        <div className={`px-4 py-3 rounded-lg border-2 ${currentStatus?.color} flex items-center gap-2`}>
                          <StatusIcon className="w-5 h-5" />
                          <span className="font-semibold text-lg">{currentStatus?.label}</span>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
