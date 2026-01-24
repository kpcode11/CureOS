"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Bed { id: string; bedNumber: string; ward: string; bedType: string; status: string }

export default function BedsPage(){
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(()=>{ fetchBeds(); }, [onlyAvailable]);

  const fetchBeds = async () => {
    setLoading(true);
    try{
      const url = onlyAvailable ? '/api/nurse/beds/available' : '/api/nurse/beds';
      const res = await fetch(url);
      const data = await res.json();
      setBeds(data || []);
    }catch(err){ console.error(err); setBeds([]); }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try{
      const res = await fetch(`/api/nurse/beds/${id}/status`, { method: 'PATCH', headers: { 'content-type':'application/json' }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error('failed');
      await fetchBeds();
    }catch(err){ alert('Unable to update bed status'); console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Beds</h1>
            <p className="text-slate-600">Ward & bed status</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Only available</label>
            <input type="checkbox" checked={onlyAvailable} onChange={e=>setOnlyAvailable(e.target.checked)} className="h-4 w-4" />
            <Button onClick={fetchBeds}>Refresh</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bed inventory</CardTitle>
            <CardDescription>{beds.length} beds</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div className="py-12 flex items-center justify-center"><Loader2 className="animate-spin"/></div> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bed</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beds.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono">{b.bedNumber}</TableCell>
                        <TableCell>{b.ward}</TableCell>
                        <TableCell>{b.bedType}</TableCell>
                        <TableCell>{b.status}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Select onValueChange={(val)=>updateStatus(b.id, val)}>
                              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Change status"/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AVAILABLE">AVAILABLE</SelectItem>
                                <SelectItem value="OCCUPIED">OCCUPIED</SelectItem>
                                <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" onClick={()=>window.alert('Open assignment flow')}>Assign</Button>
                          </div>
                        </TableCell>
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

