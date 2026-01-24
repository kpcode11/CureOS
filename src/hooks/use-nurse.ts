"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

type Bed = { id: string; bedNumber: string; ward: string; bedType: string; status: string };
type Assignment = { id: string; bed: any; patient: any; nurse?: any; assignedAt: string };
type NursingRecord = { id: string; nurseId: string; patientName: string; vitals: any; createdAt: string };

function handleResp(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json().catch(() => null);
}

export function useNurse() {
  const toast = useToast();

  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedsLoading, setBedsLoading] = useState(false);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [wardAssignments, setWardAssignments] = useState<Assignment[]>([]);
  const [wardLoading, setWardLoading] = useState(false);

  const [records, setRecords] = useState<NursingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const fetchBeds = useCallback(async (onlyAvailable = false) => {
    setBedsLoading(true);
    try {
      const url = onlyAvailable ? "/api/nurse/beds/available" : "/api/nurse/beds";
      const data = await fetch(url).then(handleResp);
      setBeds(data || []);
      return data;
    } catch (err: any) {
      console.error("fetchBeds", err);
      toast.toast({ title: "Unable to load beds", description: err?.message ?? String(err) });
      setBeds([]);
      throw err;
    } finally {
      setBedsLoading(false);
    }
  }, [toast]);

  const updateBedStatus = useCallback(async (bedId: string, status: string) => {
    try {
      const res = await fetch(`/api/nurse/beds/${bedId}/status`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
      const updated = await handleResp(res);
      toast.toast({ title: "Bed updated", description: `${updated?.bedNumber ?? bedId} → ${status}` });
      // optimistic refresh
      await fetchBeds();
      return updated;
    } catch (err: any) {
      toast.toast({ title: "Unable to update bed", description: err?.message ?? String(err) });
      throw err;
    }
  }, [fetchBeds, toast]);

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const data = await fetch("/api/nurse/bed-assignments").then(handleResp);
      setAssignments(data || []);
      return data;
    } catch (err: any) {
      console.error("fetchAssignments", err);
      toast.toast({ title: "Unable to load assignments", description: err?.message ?? String(err) });
      setAssignments([]);
      throw err;
    } finally {
      setAssignmentsLoading(false);
    }
  }, [toast]);

  const dischargeAssignment = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/nurse/bed-assignments/${id}/discharge`, { method: "PATCH" });
      const data = await handleResp(res);
      toast.toast({ title: "Patient discharged", description: `Assignment ${id.slice?.(0,8)}` });
      await fetchAssignments();
      return data;
    } catch (err: any) {
      toast.toast({ title: "Unable to discharge", description: err?.message ?? String(err) });
      throw err;
    }
  }, [fetchAssignments, toast]);

  const fetchWardAssignments = useCallback(async (department?: string) => {
    setWardLoading(true);
    try {
      const q = department ? `?department=${encodeURIComponent(department)}` : "";
      const data = await fetch(`/api/nurse/ward/assignments${q}`).then(handleResp);
      setWardAssignments(data || []);
      return data;
    } catch (err: any) {
      toast.toast({ title: "Unable to load ward assignments", description: err?.message ?? String(err) });
      setWardAssignments([]);
      throw err;
    } finally {
      setWardLoading(false);
    }
  }, [toast]);

  const fetchNursingRecords = useCallback(async (patientName?: string) => {
    setRecordsLoading(true);
    try {
      const q = patientName ? `?patientName=${encodeURIComponent(patientName)}` : "";
      const data = await fetch(`/api/nurse/nursing-records${q}`).then(handleResp);
      setRecords(data || []);
      return data;
    } catch (err: any) {
      toast.toast({ title: "Unable to load nursing records", description: err?.message ?? String(err) });
      setRecords([]);
      throw err;
    } finally {
      setRecordsLoading(false);
    }
  }, [toast]);

  const createNursingRecord = useCallback(async (body: any) => {
    try {
      const res = await fetch(`/api/nurse/nursing-records`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const created = await handleResp(res);
      toast.toast({ title: "Nursing record created" });
      await fetchNursingRecords();
      return created;
    } catch (err: any) {
      toast.toast({ title: "Unable to create record", description: err?.message ?? String(err) });
      throw err;
    }
  }, [fetchNursingRecords, toast]);

  const getNursingRecord = useCallback(async (id: string) => {
    try {
      return await fetch(`/api/nurse/nursing-records/${id}`).then(handleResp);
    } catch (err: any) {
      toast.toast({ title: "Unable to load record", description: err?.message ?? String(err) });
      throw err;
    }
  }, [toast]);

  const updateNursingRecord = useCallback(async (id: string, body: any) => {
    try {
      const res = await fetch(`/api/nurse/nursing-records/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const updated = await handleResp(res);
      toast.toast({ title: "Nursing record updated" });
      return updated;
    } catch (err: any) {
      toast.toast({ title: "Unable to update record", description: err?.message ?? String(err) });
      throw err;
    }
  }, [toast]);

  const getPatient = useCallback(async (patientId: string) => {
    try {
      return await fetch(`/api/nurse/patients/${patientId}`).then(handleResp);
    } catch (err: any) {
      toast.toast({ title: "Unable to load patient", description: err?.message ?? String(err) });
      throw err;
    }
  }, [toast]);

  const getPatientBed = useCallback(async (patientId: string) => {
    try {
      return await fetch(`/api/nurse/patients/${patientId}/bed`).then(handleResp);
    } catch (err: any) {
      // silent fallback — patient may not have a bed
      return null;
    }
  }, []);

  const getPatientEmr = useCallback(async (patientId: string) => {
    try {
      return await fetch(`/api/nurse/patients/${patientId}/emr`).then(handleResp);
    } catch (err: any) {
      return [];
    }
  }, []);

  const getPatientLabTests = useCallback(async (patientId: string) => {
    try {
      return await fetch(`/api/nurse/patients/${patientId}/lab-tests`).then(handleResp);
    } catch (err: any) {
      return [];
    }
  }, []);

  useEffect(() => {
    // initial quick preload for common nurse pages
    fetchBeds().catch(() => undefined);
    fetchAssignments().catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // beds
    beds,
    bedsLoading,
    fetchBeds,
    updateBedStatus,
    // assignments
    assignments,
    assignmentsLoading,
    fetchAssignments,
    dischargeAssignment,
    // ward
    wardAssignments,
    wardLoading,
    fetchWardAssignments,
    // nursing records
    records,
    recordsLoading,
    fetchNursingRecords,
    createNursingRecord,
    getNursingRecord,
    updateNursingRecord,
    // patient helpers
    getPatient,
    getPatientBed,
    getPatientEmr,
    getPatientLabTests,
  } as const;
}
