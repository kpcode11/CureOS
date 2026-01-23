'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LabOrderFormComponent } from '@/components/doctor/lab-order-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function LabOrderPage() {
  const params = useParams();
  const patientId = params.id as string;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/doctor/patients/${patientId}`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Order Lab Test</h1>
      </div>

      <div className="max-w-2xl">
        <LabOrderFormComponent
          patientId={patientId}
          onSuccess={() => {
            // Redirect handled in component
          }}
          onCancel={() => {
            window.history.back();
          }}
        />
      </div>
    </div>
  );
}
