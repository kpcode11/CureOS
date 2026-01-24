"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Save,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function UpdateAmountPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });

  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      const res = await fetch(`/api/billing/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setBill(data);
        setFormData({
          amount: data.amount.toString(),
          description: data.description,
        });
      }
    } catch (error) {
      console.error("Error fetching bill:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newAmount = parseFloat(formData.amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/billing/${params.id}/update-amount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: newAmount,
          description: formData.description,
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Bill amount updated successfully",
        });
        setTimeout(() => {
          router.push(`/billing/${params.id}`);
        }, 1500);
      } else {
        const error = await res.json();
        toast({
          title: "Update Failed",
          description: error.error || "Failed to update bill amount",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the bill",
        variant: "destructive",
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
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-blue-600/5" />
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
            <div className="p-3 bg-orange-600 rounded-xl">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Update Bill Amount
              </h1>
              <p className="text-slate-600 mt-1">
                Modify invoice amount and description
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Update Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-blue-50">
                  <CardTitle className="text-2xl">Edit Bill Details</CardTitle>
                  <CardDescription>
                    Update the amount and description for this invoice
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="amount" className="text-base">
                        Bill Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative mt-2">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                          }
                          className="pl-10 text-lg h-12"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-2">
                        Current amount: ₹{bill?.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-base">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        className="mt-2 min-h-[120px]"
                        placeholder="Enter bill description"
                        required
                      />
                    </div>

                    <div className="pt-6 border-t">
                      <Button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-lg h-12 shadow-lg"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-none shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-blue-50">
                  <CardTitle>Current Invoice</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Invoice ID</span>
                    <span className="font-mono font-semibold">
                      {params.id?.toString().slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Patient ID</span>
                    <span className="font-semibold">
                      {bill?.patientId.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-slate-600">Status</span>
                    <span className="font-semibold">{bill?.status}</span>
                  </div>

                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-slate-900">
                        Current Amount
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{bill?.amount.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-l-4 border-l-orange-600 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        Important
                      </h3>
                      <p className="text-sm text-slate-600">
                        Changes to the bill amount will be logged in the audit
                        trail. Ensure accuracy before saving.
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
