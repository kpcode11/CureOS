"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  Users,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
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
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string | null;
  bloodType: string | null;
  emergencyContact: string | null;
  createdAt: string;
}

export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPatients();

    // Set up visibility change listener to refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing patients...");
        fetchPatients();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/patients");
      if (!response.ok) {
        console.error(
          "Failed to fetch patients:",
          response.status,
          response.statusText,
        );
        return;
      }
      const data = await response.json();
      console.log("Fetched patients:", data);
      setPatients(data || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.email &&
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-10 w-10 text-blue-600" />
              Patient Directory
            </h1>
            <p className="text-slate-600 mt-2">
              Search and manage patient records
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchPatients}
              variant="outline"
              className="gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              onClick={() => router.push("/receptionist/registration")}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              New Patient
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="shadow-md border-2 border-blue-100">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
              <Input
                placeholder="Search by name, phone, email, or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {patients.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    Search Results
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {filteredPatients.length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Search className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">
                    Registered Today
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {
                      patients.filter((p) => {
                        const today = new Date().toDateString();
                        const createdDate = new Date(
                          p.createdAt,
                        ).toDateString();
                        return today === createdDate;
                      }).length
                    }
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Table */}
        <Card className="shadow-xl border-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <CardTitle className="text-xl text-slate-900">
              Patient Records
            </CardTitle>
            <CardDescription>
              {filteredPatients.length}{" "}
              {filteredPatients.length === 1 ? "patient" : "patients"} found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonShinyGradient
                    key={i}
                    className="h-16 rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="font-bold text-slate-700">
                        Patient ID
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        Patient Name
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        Age/Gender
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        Contact
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        Blood Type
                      </TableHead>
                      <TableHead className="font-bold text-slate-700">
                        Registered
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient) => (
                      <TableRow
                        key={patient.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <TableCell className="font-mono text-sm font-medium text-blue-600">
                          {patient.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {patient.firstName} {patient.lastName}
                              </p>
                              {patient.email && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {patient.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-700">
                            <span className="font-medium">
                              {calculateAge(patient.dateOfBirth)}Y
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="capitalize">
                              {patient.gender.charAt(0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              {patient.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {patient.bloodType ? (
                            <Badge
                              variant="destructive"
                              className="font-semibold"
                            >
                              {patient.bloodType}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            <span className="text-sm">
                              {new Date(patient.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() =>
                              router.push(
                                `/receptionist/patients/${patient.id}`,
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPatients.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Search className="h-12 w-12 text-slate-300" />
                            <p className="text-slate-600 font-medium">
                              No patients found matching your search
                            </p>
                            <p className="text-sm text-slate-400">
                              Try adjusting your search terms
                            </p>
                          </div>
                        </TableCell>
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
