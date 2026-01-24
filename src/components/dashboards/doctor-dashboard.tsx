'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDoctor, Appointment, Prescription, Surgery } from '@/hooks/use-doctor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, Calendar, AlertCircle, Loader, AlertTriangle } from 'lucide-react';

export function DoctorDashboard() {
  const { getPatients, getAppointments, getPrescriptions, getSurgeries, loading } = useDoctor();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    patients: 0,
    pendingPrescriptions: 0,
    scheduledSurgeries: 0,
    upcomingAppointments: 0
  });
  const [recentItems, setRecentItems] = useState({
    appointments: [] as Appointment[],
    prescriptions: [] as Prescription[],
    surgeries: [] as Surgery[]
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadData = async () => {
      const [patients, appointments, prescriptions, surgeries] = await Promise.all([
        getPatients(),
        getAppointments({ status: 'SCHEDULED' }),
        getPrescriptions(false),
        getSurgeries({ status: 'SCHEDULED' })
      ]);

      setStats({
        patients: patients.length,
        pendingPrescriptions: prescriptions.filter((p) => !p.dispensed).length,
        scheduledSurgeries: surgeries.length,
        upcomingAppointments: appointments.filter(
          (a) => new Date(a.dateTime) > new Date()
        ).length
      });

      setRecentItems({
        appointments: appointments.slice(0, 3),
        prescriptions: prescriptions.slice(0, 3),
        surgeries: surgeries.slice(0, 3)
      });
    };

    loadData();
  }, [mounted, getPatients, getAppointments, getPrescriptions, getSurgeries]);

  if (!mounted) return null;

  const statCards = [
    {
      title: 'My Patients',
      value: stats.patients,
      icon: Users,
      color: 'bg-blue-500',
      href: '/doctor/patients'
    },
    {
      title: 'Pending Prescriptions',
      value: stats.pendingPrescriptions,
      icon: AlertCircle,
      color: 'bg-orange-500'
    },
    {
      title: 'Scheduled Surgeries',
      value: stats.scheduledSurgeries,
      icon: Calendar,
      color: 'bg-purple-500'
    },
    {
      title: 'Upcoming Appointments',
      value: stats.upcomingAppointments,
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

      {loading && (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader className="animate-spin h-4 w-4" />
          Loading data...
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const card = (
            <Card
              key={idx}
              className={stat.href ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
            >
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

          return stat.href ? (
            <Link key={idx} href={stat.href}>
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/doctor/patients">
            <Button className="w-full" variant="outline">
              View My Patients
            </Button>
          </Link>
          <Link href="/doctor/surgeries">
            <Button className="w-full" variant="outline">
              Manage Surgeries
            </Button>
          </Link>
          <Link href="/doctor/emergency">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Department
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      {recentItems.appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentItems.appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3 border rounded flex justify-between items-start"
              >
                <div>
                  <p className="font-medium">{apt.reason}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(apt.dateTime).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    apt.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
