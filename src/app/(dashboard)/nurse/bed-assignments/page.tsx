"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Home } from "lucide-react";
import { useNurse } from "@/hooks/use-nurse";

export default function BedAssignmentsPage() {
  const { assignments, assignmentsLoading, fetchAssignments, dischargeAssignment } = useNurse();
  const router = useRouter();

  useEffect(() => { fetchAssignments().catch(()=>undefined); }, [fetchAssignments]);

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Home className="w-8 h-8 text-emerald-600"/> Bed assignments</h1>
            <p className="text-slate-600">Active admissions and in‑ward assignments</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/nurse/beds')} variant="ghost">View beds</Button>
            <Button onClick={() => router.push('/receptionist/patients')} className="bg-emerald-600 text-white">New admission</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active assignments</CardTitle>
            <CardDescription>{assignments.length} active</CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin mr-3"/>Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-sm">{r.id.slice(0,8).toUpperCase()}</TableCell>
                        <TableCell>{r.bed ? `${r.bed.bedNumber} — ${r.bed.ward}` : '—'}</TableCell>
                        <TableCell>{r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '—'}</TableCell>
                        <TableCell>{new Date(r.assignedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => router.push(`/nurse/patients/${r.patient?.id}`)}>View</Button>
                            <Button className="bg-red-600 text-white" onClick={() => { if (!confirm('Confirm discharge for this assignment?')) return; dischargeAssignment(r.id).catch(()=>undefined); }}>Discharge</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {assignments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-slate-500">No active assignments</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
