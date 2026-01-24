'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Building2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'INSURANCE'>('CARD');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    upiId: '',
    insuranceProvider: '',
    insuranceId: ''
  });

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/billing/${params.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          ...paymentDetails
        })
      });

      if (res.ok) {
        toast({
          title: 'Payment Successful',
          description: 'The payment has been processed successfully.',
        });
        setTimeout(() => {
          router.push(`/billing/${params.id}`);
        }, 1500);
      } else {
        const error = await res.json();
        toast({
          title: 'Payment Failed',
          description: error.error || 'Failed to process payment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while processing payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: DollarSign, color: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'CARD', label: 'Credit/Debit Card', icon: CreditCard, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'UPI', label: 'UPI', icon: Wallet, color: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'INSURANCE', label: 'Insurance', icon: Building2, color: 'bg-orange-50 border-orange-200 text-orange-700' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-blue-600/5" />
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
            <div className="p-3 bg-green-600 rounded-xl">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Process Payment</h1>
              <p className="text-slate-600 mt-1">Complete payment for invoice #{params.id?.toString().slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <CardTitle className="text-2xl">Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Payment Method Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === method.id
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-lg ${method.color} flex items-center justify-center mb-3`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <p className="font-semibold text-slate-900">{method.label}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Payment Details Form */}
                  <div className="pt-6 border-t">
                    {paymentMethod === 'CARD' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={paymentDetails.cardNumber}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                            maxLength={19}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardHolder">Card Holder Name</Label>
                          <Input
                            id="cardHolder"
                            placeholder="John Doe"
                            value={paymentDetails.cardHolder}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, cardHolder: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={paymentDetails.expiryDate}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                              maxLength={5}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              type="password"
                              placeholder="123"
                              value={paymentDetails.cvv}
                              onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                              maxLength={4}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'UPI' && (
                      <div>
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="yourname@upi"
                          value={paymentDetails.upiId}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                          className="mt-2"
                        />
                      </div>
                    )}

                    {paymentMethod === 'INSURANCE' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                          <Input
                            id="insuranceProvider"
                            placeholder="ABC Insurance Co."
                            value={paymentDetails.insuranceProvider}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, insuranceProvider: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="insuranceId">Policy Number</Label>
                          <Input
                            id="insuranceId"
                            placeholder="POL123456789"
                            value={paymentDetails.insuranceId}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, insuranceId: e.target.value })}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'CASH' && (
                      <div className="text-center py-8">
                        <DollarSign className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <p className="text-slate-600">Cash payment will be recorded when you confirm.</p>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full bg-green-600 hover:bg-green-700 text-lg h-12 shadow-lg"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-none shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Invoice ID</span>
                    <span className="font-mono font-semibold">{params.id?.toString().slice(0, 8)}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Payment Method</span>
                    <span className="font-semibold">{paymentMethods.find(m => m.id === paymentMethod)?.label}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Date</span>
                    <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-slate-900">Total Amount</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">₹ ---</p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                      <AlertCircle className="w-5 h-5 mt-0.5" />
                      <p className="text-sm">
                        Payment will be processed securely. A receipt will be generated upon successful transaction.
                      </p>
                    </div>
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
