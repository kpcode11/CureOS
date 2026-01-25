"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import { Loader2, Plus } from "lucide-react";
import { useNurse } from "@/hooks/use-nurse";

export default function NursingRecordsPage() {
  const { records, recordsLoading, fetchNursingRecords, createNursingRecord } =
    useNurse();
  const [patientName, setPatientName] = useState("");
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchNursingRecords().catch(() => undefined);
  }, [fetchNursingRecords]);

  const createRecord = async () => {
    if (!bp && !hr) return alert("provide at least one vital");
    await createNursingRecord({
      nurseId: null,
      patientName: patientName || "Unknown",
      vitals: { bp, hr },
    });
    setBp("");
    setHr("");
    setPatientName("");
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nursing records</h1>
            <p className="text-slate-600">Vitals and nursing notes</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => fetchNursingRecords()} variant="outline">
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/nurse/nursing-records")}
              className="bg-emerald-600 text-white"
            >
              <Plus className="mr-2" />
              New
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create quick vitals</CardTitle>
            <CardDescription>
              Enter basic vitals for a patient (quick capture)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="patient name (optional)"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
              <Input
                placeholder="BP (e.g. 120/80)"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
              />
              <Input
                placeholder="HR"
                value={hr}
                onChange={(e) => setHr(e.target.value)}
              />
              <Button
                onClick={createRecord}
                className="bg-emerald-600 text-white"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent records</CardTitle>
            <CardDescription>{records.length} records</CardDescription>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonShinyGradient
                    key={i}
                    className="h-12 rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Vitals</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">
                          {r.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>{r.patientName}</TableCell>
                        <TableCell className="text-sm">
                          {r.vitals
                            ? Object.entries(r.vitals)
                                .map(([k, v]) => `${k}:${v}`)
                                .join(" ")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {new Date(r.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            onClick={() =>
                              router.push(`/nurse/nursing-records/${r.id}`)
                            }
                          >
                            View / Edit
                          </Button>
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
