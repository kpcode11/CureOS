"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplet,
  Save,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function PatientRegistration() {
  const router = useRouter();
  const { toast } = useToast();
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    bloodType: "",
    address: "",
    emergencyContact: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to register patient");
      }

      const patient = await response.json();
      setRegisteredPatient(patient);

      toast({
        title: "Patient Registered Successfully!",
        description: `${patient.firstName} ${patient.lastName} has been registered.`,
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          "There was an error registering the patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRegisteredPatient(null);
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      bloodType: "",
      address: "",
      emergencyContact: "",
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <UserPlus className="h-10 w-10 text-blue-600" />
              Patient Registration
            </h1>
            <p className="text-slate-600 mt-2">
              Register a new patient in the hospital system
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/receptionist")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Success Card */}
        {registeredPatient && (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="inline-flex h-20 w-20 rounded-full bg-green-500 items-center justify-center mb-6 shadow-lg">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-green-900 mb-3">
                Registration Successful!
              </h3>
              <p className="text-slate-700 mb-6 text-lg">
                Patient has been successfully registered in the system
              </p>

              <div className="bg-white rounded-xl border-2 border-green-300 p-6 mb-6 max-w-md mx-auto">
                <p className="text-sm text-slate-600 mb-2">Patient ID</p>
                <p className="text-3xl font-mono font-bold text-green-600">
                  {registeredPatient.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-lg font-semibold text-slate-900">
                    {registeredPatient.firstName} {registeredPatient.lastName}
                  </p>
                  <p className="text-sm text-slate-600">
                    {registeredPatient.phone}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  onClick={handleReset}
                  size="lg"
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Register Another Patient
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/receptionist")}
                  size="lg"
                  className="gap-2"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        {!registeredPatient && (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card className="lg:col-span-2 shadow-md hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Enter patient&apos;s personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-slate-700 font-semibold"
                      >
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        required
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-slate-700 font-semibold"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleChange("lastName", e.target.value)
                        }
                        required
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">
                        Gender <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => handleChange("gender", value)}
                        className="flex gap-4"
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label
                            htmlFor="male"
                            className="font-normal cursor-pointer"
                          >
                            Male
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label
                            htmlFor="female"
                            className="font-normal cursor-pointer"
                          >
                            Female
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label
                            htmlFor="other"
                            className="font-normal cursor-pointer"
                          >
                            Other
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dob"
                        className="text-slate-700 font-semibold"
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleChange("dateOfBirth", e.target.value)
                          }
                          required
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-slate-700 font-semibold"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-700 font-semibold"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="patient@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="text-slate-700 font-semibold"
                    >
                      Residential Address
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Textarea
                        id="address"
                        placeholder="Enter complete address with city, state, and PIN code"
                        value={formData.address}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        className="pl-10 min-h-[100px] border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical & Contact Info */}
              <div className="space-y-6">
                <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Droplet className="h-5 w-5" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold">
                        Blood Group
                      </Label>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) =>
                          handleChange("bloodType", value)
                        }
                      >
                        <SelectTrigger className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "A+",
                            "A-",
                            "B+",
                            "B-",
                            "O+",
                            "O-",
                            "AB+",
                            "AB-",
                          ].map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              <span className="font-semibold text-emerald-700">
                                {bg}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="emergency"
                        className="text-slate-700 font-semibold"
                      >
                        Emergency Contact
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="emergency"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.emergencyContact}
                          onChange={(e) =>
                            handleChange("emergencyContact", e.target.value)
                          }
                          className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Relative or friend to contact in emergencies
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Quick Registration
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Fill in all required fields marked with{" "}
                          <span className="text-red-500">*</span> to register
                          the patient.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Registering Patient...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Register Patient
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
