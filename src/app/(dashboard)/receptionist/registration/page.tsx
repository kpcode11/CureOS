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
  AlertCircle,
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

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name);
};

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
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

export default function PatientRegistration() {
  const router = useRouter();
  const { toast } = useToast();
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (!validateName(formData.firstName.trim())) {
      newErrors.firstName =
        "First name should contain only letters, spaces, hyphens, and apostrophes (2-50 characters)";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (!validateName(formData.lastName.trim())) {
      newErrors.lastName =
        "Last name should contain only letters, spaces, hyphens, and apostrophes (2-50 characters)";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 0) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      } else if (age > 150) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone.trim())) {
      newErrors.phone =
        "Please enter a valid phone number (at least 10 digits)";
    }

    // Optional field validation (only if provided)
    if (formData.email && !validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.emergencyContact && !validatePhone(formData.emergencyContact.trim())) {
      newErrors.emergencyContact =
        "Please enter a valid emergency contact number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data with proper formatting
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        bloodType: formData.bloodType || null,
        address: formData.address.trim() || null,
        emergencyContact: formData.emergencyContact.trim() || null,
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || "Failed to register patient";
        
        // Better error messages for specific cases
        let displayMessage = errorMessage;
        if (response.status === 403) {
          displayMessage = "Permission denied: You don't have permission to register patients. Please log out and log back in.";
        } else if (response.status === 400) {
          displayMessage = errorMessage; // Validation errors are already descriptive
        } else if (response.status === 500) {
          displayMessage = "Server error occurred while registering patient. Please try again.";
        }
        
        throw new Error(displayMessage);
      }

      const patient = await response.json();
      setRegisteredPatient(patient);

      toast({
        title: "✓ Patient Registered Successfully!",
        description: `${patient.firstName} ${patient.lastName} (ID: ${patient.id.slice(0, 8)}) has been registered.`,
      });
      
      // Auto-dismiss success after 2 seconds and show next steps
      setTimeout(() => {
        console.log('Patient registered:', patient);
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.error('Registration error:', errorMessage);
      toast({
        title: "❌ Registration Failed",
        description: errorMessage,
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
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                      {errors.firstName && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.firstName}
                        </div>
                      )}
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
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      />
                      {errors.lastName && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.lastName}
                        </div>
                      )}
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
                      {errors.gender && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.gender}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dob"
                        className="text-slate-700 font-semibold"
                      >
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleChange("dateOfBirth", e.target.value)
                          }
                          className={`pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                            errors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.dateOfBirth}
                        </div>
                      )}
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          className={`pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                            errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.phone}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-700 font-semibold"
                      >
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="patient@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          className={`pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                            errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </div>
                      )}
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="emergency"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.emergencyContact}
                          onChange={(e) =>
                            handleChange("emergencyContact", e.target.value)
                          }
                          className={`pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 ${
                            errors.emergencyContact ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Relative or friend to contact in emergencies
                      </p>
                      {errors.emergencyContact && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.emergencyContact}
                        </div>
                      )}
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
