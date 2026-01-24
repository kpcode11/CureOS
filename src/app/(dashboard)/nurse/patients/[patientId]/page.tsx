"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNurse } from "@/hooks/use-nurse";

export default function NursePatientPage(){
  const params = useParams() as any;
  const patientId = params.patientId as string;
  const { getPatient, getPatientBed, getPatientEmr, getPatientLabTests } = useNurse();
  const [patient, setPatient] = useState<any>(null);
  const [bed, setBed] = useState<any>(null);
  const [emr, setEmr] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(()=>{ fetchAll(); }, [patientId]);
  const fetchAll = async () => {
    try{
      const [p, b, e, l] = await Promise.all([
        getPatient(patientId).catch(()=>null),
        getPatientBed(patientId).catch(()=>null),
        getPatientEmr(patientId).catch(()=>[]),
        getPatientLabTests(patientId).catch(()=>[]),
      ]);
      setPatient(p);
      setBed(b);
      setEmr(e || []);
      setLabs(l || []);
    }catch(err){ console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}</h1>
            <p className="text-slate-600">Nurse view — demographics, bed, EMR & labs</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={()=>router.push(`/nurse/nursing-records`)}>Add nursing record</Button>
            <Button variant="outline" onClick={()=>router.push(`/doctor/patients/${patientId}/emr`)}>Full EMR</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-slate-700 space-y-2">
                <div>Phone: {patient?.phone ?? '—'}</div>
                <div>Blood type: {patient?.bloodType ?? '—'}</div>
                <div>DOB: {patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Bed</CardTitle><CardDescription>Active assignment</CardDescription></CardHeader>
            <CardContent>
              {bed ? (
                <div className="space-y-2">
                  <div className="font-medium">{bed.bed?.bedNumber} — {bed.bed?.ward}</div>
                  <div className="text-sm text-slate-600">Assigned: {new Date(bed.assignedAt).toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-slate-500">No active bed assignment</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Recent EMR</CardTitle></CardHeader>
            <CardContent>
              {emr.length === 0 ? <div className="text-slate-500">No recent EMR entries</div> : emr.slice(0,5).map((e,i)=>(<div key={i} className="py-2 border-b last:border-0">{e.summary ?? JSON.stringify(e)}</div>))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent labs</CardTitle></CardHeader>
            <CardContent>
              {labs.length === 0 ? <div className="text-slate-500">No recent labs</div> : labs.slice(0,5).map((l,i)=>(<div key={i} className="py-2 border-b last:border-0">{l.testName ?? l.type}</div>))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
