'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Search,
  User,
  ArrowRight,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PatientSearchPage() {
  const router = useRouter();
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;

    setLoading(true);
    // Navigate to patient-specific billing page
    router.push(`/billing/patient/${patientId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <motion.div
        className="relative bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Patient Billing Search
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            View billing history and invoices for a specific patient
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 pb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="p-4 bg-purple-600 rounded-2xl">
                  <Search className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl text-center">Find Patient Bills</CardTitle>
              <CardDescription className="text-center text-lg mt-2">
                Enter a patient ID to view their complete billing history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <Label htmlFor="patientId" className="text-base mb-2">
                    Patient ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                    <Input
                      id="patientId"
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="pl-14 text-lg h-14 border-2 focus:border-purple-500"
                      placeholder="Enter patient ID"
                      required
                    />
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Enter the unique patient identifier to search their billing records
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !patientId.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-lg h-14 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search Patient Bills
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Tips</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Patient IDs are case-sensitive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>You can also search using MRN (Medical Record Number)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Results will show all invoices for the patient</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
