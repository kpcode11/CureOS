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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import { Loader2 } from "lucide-react";
import { useNurse } from "@/hooks/use-nurse";

export default function BedsPage() {
  const { beds, bedsLoading, fetchBeds, updateBedStatus } = useNurse();
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    fetchBeds(onlyAvailable).catch(() => undefined);
  }, [onlyAvailable, fetchBeds]);

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
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4"
            />
            <Button onClick={() => fetchBeds(onlyAvailable)}>Refresh</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bed inventory</CardTitle>
            <CardDescription>{beds.length} beds</CardDescription>
          </CardHeader>
          <CardContent>
            {bedsLoading ? (
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
                      <TableHead>Ward</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beds.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono">
                          {b.bedNumber}
                        </TableCell>
                        <TableCell>{b.ward}</TableCell>
                        <TableCell>{b.bedType}</TableCell>
                        <TableCell>{b.status}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Select
                              onValueChange={(val) =>
                                updateBedStatus(b.id, val)
                              }
                            >
                              <SelectTrigger className="w-36 h-9">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AVAILABLE">
                                  AVAILABLE
                                </SelectItem>
                                <SelectItem value="OCCUPIED">
                                  OCCUPIED
                                </SelectItem>
                                <SelectItem value="MAINTENANCE">
                                  MAINTENANCE
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                window.alert("Open assignment flow")
                              }
                            >
                              Assign
                            </Button>
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
