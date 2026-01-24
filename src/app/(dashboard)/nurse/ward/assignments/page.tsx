"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Assignment { id: string; bed: { bedNumber: string; ward: string }; patient: { id: string; firstName: string; lastName: string }; assignedAt: string }

export default function WardAssignmentsPage(){
  const [rows, setRows] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');

  useEffect(()=>{ fetchRows(); }, []);

  const fetchRows = async () => {
    setLoading(true);
    try{
      const q = department ? `?department=${encodeURIComponent(department)}` : '';
      const res = await fetch(`/api/nurse/ward/assignments${q}`);
      const data = await res.json();
      setRows(data || []);
    }catch(err){ console.error(err); setRows([]); }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ward assignments</h1>
            <p className="text-slate-600">Shows active assignments for your ward (department)</p>
          </div>
          <div className="flex gap-2">
            <input placeholder="department (admin override)" value={department} onChange={e=>setDepartment(e.target.value)} className="input" />
            <Button onClick={fetchRows}>Refresh</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>{rows.length} active</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin mr-2"/>Loading…</div> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bed</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(r=> (
                      <TableRow key={r.id}>
                        <TableCell>{r.bed.bedNumber}</TableCell>
                        <TableCell>{r.patient.firstName} {r.patient.lastName}</TableCell>
                        <TableCell>{r.bed.ward}</TableCell>
                        <TableCell>{new Date(r.assignedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
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
