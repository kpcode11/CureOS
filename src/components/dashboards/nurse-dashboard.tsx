'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, Pill, Clipboard } from 'lucide-react';

export function NurseDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    {
      title: 'Assigned Patients',
      value: '8',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Vitals',
      value: '5',
      icon: Activity,
      color: 'bg-orange-500'
    },
    {
      title: 'Medication Due',
      value: '3',
      icon: Pill,
      color: 'bg-red-500'
    },
    {
      title: 'Notes to Review',
      value: '2',
      icon: Clipboard,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nurse Dashboard</h1>
        <p className="text-gray-600">Your assigned patients and pending tasks</p>
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
          <Button className="w-full" variant="outline">Record Vitals</Button>
          <Button className="w-full" variant="outline">Update MAR</Button>
          <Button className="w-full" variant="outline">View Orders</Button>
        </CardContent>
      </Card>
    </div>
  );
}
