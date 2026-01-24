"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNurse } from "@/hooks/use-nurse";

export default function NursingRecordDetail(){
  const params = useParams() as any;
  const id = params.id as string;
  const { getNursingRecord, updateNursingRecord } = useNurse();
  const [rec, setRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [bp, setBp] = useState('');
  const router = useRouter();

  useEffect(()=>{ fetchRec(); }, [id]);
  const fetchRec = async () => {
    setLoading(true);
    try{
      const data = await getNursingRecord(id);
      setRec(data);
      setNotes(data?.notes ?? '');
      setBp(data?.vitals?.bp ?? '');
    }catch(err){ console.error(err); setRec(null); }
    setLoading(false);
  };

  const save = async () => {
    try{
      const body: any = {};
      if (notes) body.notes = notes;
      if (bp) body.vitals = { bp };
      await updateNursingRecord(id, body);
      router.back();
    }catch(err){ alert('Unable to save'); console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nursing record</CardTitle>
          </CardHeader>
          <CardContent>
            {!rec ? <div>Loading…</div> : (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">Patient: <strong>{rec.patientName}</strong></div>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={bp} onChange={e=>setBp(e.target.value)} placeholder="BP" />
                  <Input value={rec.nurseId ?? ''} disabled />
                </div>
                <div>
                  <textarea className="w-full p-3 border rounded" rows={6} value={notes} onChange={e=>setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={()=>router.back()}>Cancel</Button>
                  <Button onClick={save} className="bg-emerald-600 text-white">Save</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
