"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import { Loader2 } from "lucide-react";
import { useNurse } from "@/hooks/use-nurse";

export default function WardAssignmentsPage() {
  const { wardAssignments, wardLoading, fetchWardAssignments } = useNurse();
  const [department, setDepartment] = useState("");

  useEffect(() => {
    fetchWardAssignments(department).catch(() => undefined);
  }, [department, fetchWardAssignments]);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ward assignments</h1>
            <p className="text-slate-600">
              Shows active assignments for your ward (department)
            </p>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="department (admin override)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input"
            />
            <Button onClick={() => fetchWardAssignments(department)}>
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>{wardAssignments.length} active</CardDescription>
          </CardHeader>
          <CardContent>
            {wardLoading ? (
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
                      <TableHead>Bed</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wardAssignments.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.bed.bedNumber}</TableCell>
                        <TableCell>
                          {r.patient.firstName} {r.patient.lastName}
                        </TableCell>
                        <TableCell>{r.bed.ward}</TableCell>
                        <TableCell>
                          {new Date(r.assignedAt).toLocaleString()}
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
