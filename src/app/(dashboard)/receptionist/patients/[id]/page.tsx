"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Droplet,
  AlertCircle,
  Edit,
  Save,
  X,
  Loader2,
  FileText,
  Clock,
  Stethoscope,
  Activity,
  CalendarDays,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonShinyGradient } from "@/components/ui/skeleton-shiny";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
  notes: string | null;
  doctor: {
    id: string;
    specialization: string;
    user: {
      name: string;
      email: string;
    };
  };
}

interface EMRRecord {
  id: string;
  diagnosis: string;
  symptoms: string;
  notes: string | null;
  createdAt: string;
}

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
  appointments?: Appointment[];
  emrRecords?: EMRRecord[];
}

export default function PatientDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    bloodType: "",
    emergencyContact: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || "",
          phone: data.phone,
          address: data.address || "",
          bloodType: data.bloodType || "",
          emergencyContact: data.emergencyContact || "",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch patient details",
          variant: "destructive",
        });
        router.push("/receptionist/search");
      }
    } catch (error) {
      console.error("Error fetching patient:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patient details",
        variant: "destructive",
      });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleUpdate = async () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.phone.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and phone are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatient({ ...patient!, ...updatedPatient });
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Patient information updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update patient",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email || "",
        phone: patient.phone,
        address: patient.address || "",
        bloodType: patient.bloodType || "",
        emergencyContact: patient.emergencyContact || "",
      });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <SkeletonShinyGradient className="h-12 w-96 rounded-lg bg-muted" />
            <div className="grid gap-6 md:grid-cols-2">
              <SkeletonShinyGradient className="h-96 rounded-lg bg-muted" />
              <SkeletonShinyGradient className="h-96 rounded-lg bg-muted" />
            </div>
            <SkeletonShinyGradient className="h-64 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Patient not found</p>
          <Button
            onClick={() => router.push("/receptionist/search")}
            className="mt-4"
          >
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/receptionist/search")}
              className="hover:bg-blue-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
                <UserCircle className="h-10 w-10 text-blue-600" />
                Patient Details
              </h1>
              <p className="text-slate-600 mt-2">
                Comprehensive patient information
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Edit className="h-4 w-4" />
                Edit Information
              </Button>
            )}
          </div>
        </div>

        {/* Patient Information Card */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-blue-900">
                  {patient.firstName} {patient.lastName}
                </CardTitle>
                <CardDescription className="text-blue-700 mt-1">
                  Patient ID: {patient.id}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2 bg-white border-blue-300"
                >
                  {calculateAge(patient.dateOfBirth)} years old
                </Badge>
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2 bg-white border-blue-300"
                >
                  {patient.gender}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-slate-700 font-medium"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-slate-700 font-medium"
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-slate-700 font-medium"
                    >
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-slate-700 font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="bloodType"
                      className="text-slate-700 font-medium"
                    >
                      Blood Type
                    </Label>
                    <Input
                      id="bloodType"
                      value={formData.bloodType}
                      onChange={(e) =>
                        setFormData({ ...formData, bloodType: e.target.value })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      placeholder="e.g., A+, B-, O+, AB+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="emergencyContact"
                      className="text-slate-700 font-medium"
                    >
                      Emergency Contact
                    </Label>
                    <Input
                      id="emergencyContact"
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: e.target.value,
                        })
                      }
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-slate-700 font-medium"
                  >
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Phone</p>
                    <p className="text-base font-semibold text-slate-900">
                      {patient.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Email</p>
                    <p className="text-base font-semibold text-slate-900">
                      {patient.email || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Date of Birth
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {formatDate(patient.dateOfBirth)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                  <Droplet className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Blood Type
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {patient.bloodType || "Not recorded"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Emergency Contact
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {patient.emergencyContact || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      Address
                    </p>
                    <p className="text-base font-semibold text-slate-900">
                      {patient.address || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments History */}
        {patient.appointments && patient.appointments.length > 0 && (
          <Card className="shadow-lg border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardTitle className="text-2xl text-purple-900 flex items-center gap-2">
                <CalendarDays className="h-6 w-6" />
                Recent Appointments
              </CardTitle>
              <CardDescription className="text-purple-700">
                Latest 10 appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            {formatDateTime(appointment.dateTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            {appointment.doctor.user.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-300">
                            {appointment.doctor.specialization}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {appointment.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(appointment.status)}
                          >
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/receptionist/appointments/${appointment.id}`,
                              )
                            }
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* EMR Records */}
        {patient.emrRecords && patient.emrRecords.length > 0 && (
          <Card className="shadow-lg border-2 border-emerald-200">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100">
              <CardTitle className="text-2xl text-emerald-900 flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Medical Records (EMR)
              </CardTitle>
              <CardDescription className="text-emerald-700">
                Recent medical history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {patient.emrRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-emerald-900">
                        {record.diagnosis}
                      </h4>
                      <span className="text-sm text-slate-600">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-2">
                      <span className="font-medium">Symptoms:</span>{" "}
                      {record.symptoms}
                    </p>
                    {record.notes && (
                      <p className="text-slate-600 text-sm">
                        <span className="font-medium">Notes:</span>{" "}
                        {record.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Information */}
        <Card className="shadow-lg border-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="text-xl text-slate-900">
              Registration Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Registered on:</span>
              <span>{formatDateTime(patient.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
