'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Ambulance, Clock } from 'lucide-react';

export function EmergencyDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stats = [
    {
      title: 'Active Cases',
      value: '5',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      title: 'Waiting',
      value: '12',
      icon: Users,
      color: 'bg-orange-500'
    },
    {
      title: 'In Treatment',
      value: '8',
      icon: Ambulance,
      color: 'bg-yellow-500'
    },
    {
      title: 'Avg Wait Time',
      value: '15m',
      icon: Clock,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Dashboard</h1>
        <p className="text-gray-600">Real-time emergency department status</p>
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
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full" variant="outline">New Patient</Button>
          <Button className="w-full" variant="outline">View Queue</Button>
          <Button className="w-full" variant="outline">Alert Hospital</Button>
        </CardContent>
      </Card>
    </div>
  );
}
