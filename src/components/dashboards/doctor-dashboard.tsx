'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, Calendar, AlertCircle } from 'lucide-react';

export function DoctorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    {
      title: 'My Patients',
      value: '24',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Prescriptions',
      value: '8',
      icon: AlertCircle,
      color: 'bg-orange-500'
    },
    {
      title: 'Scheduled Surgeries',
      value: '3',
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Lab Orders',
      value: '12',
      icon: Activity,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <p className="text-gray-600">Overview of your patients and pending tasks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`${stat.color} p-2 rounded text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full" variant="outline">Create Prescription</Button>
          <Button className="w-full" variant="outline">Order Lab Tests</Button>
          <Button className="w-full" variant="outline">Request Break-Glass Access</Button>
        </CardContent>
      </Card>
    </div>
  );
}
