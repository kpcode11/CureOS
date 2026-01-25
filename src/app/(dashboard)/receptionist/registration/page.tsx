"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Save,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Heart,
  Shield,
  Activity,
  Check,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Enhanced validation helpers
const validatePhone = (phone: string): boolean => {
  // Enhanced phone validation for Indian numbers
  const phoneRegex = /^(?:\+91[-\s]?)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name) && name.trim().length >= 2;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const formatPhoneNumber = (phone: string): string => {
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91')) {
    const number = cleaned.substring(2);
    if (number.length === 10) {
      return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
    }
  }
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
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
    // Format phone numbers automatically
    if (field === 'phone' || field === 'emergencyContact') {
      value = formatPhoneNumber(value);
    }
    
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
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    // Optional field validation (only if provided)
    if (formData.email && !validateEmail(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.emergencyContact && !validatePhone(formData.emergencyContact.trim())) {
      newErrors.emergencyContact = "Please enter a valid 10-digit Indian mobile number";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-5xl">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Patient Registration
            </h1>
            <p className="text-lg text-slate-600 max-w-4xl">
              Complete the form below to register a new patient in our healthcare system. All required fields are marked with an asterisk.
            </p>
          </div>

          {/* Success State */}
          {registeredPatient && (
            <Card className="mb-12 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-green-800">
                      Registration Successful!
                    </h3>
                    <p className="text-green-700 mt-1">
                      Patient has been successfully registered in our system.
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200/50">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Full Name:</span>
                      <span className="font-semibold text-slate-900">
                        {registeredPatient.firstName} {registeredPatient.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Patient ID:</span>
                      <span className="font-mono font-bold text-blue-600">
                        {registeredPatient.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Contact:</span>
                      <span className="font-semibold text-slate-900">
                        {registeredPatient.phone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Registered:</span>
                      <span className="font-semibold text-slate-900">
                        {new Date(registeredPatient.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    onClick={handleReset}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Register Another Patient
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/receptionist")}
                    size="lg"
                    className="shadow-lg border-slate-200"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration Form */}
          {!registeredPatient && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit}>
                  {/* Personal Information Section */}
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-3 mb-10">
                    <div>
                      <h2 className="flex items-center gap-3 font-semibold text-slate-800 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        Personal Information
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Enter the patient's basic personal details including name, contact information, and demographic data.
                      </p>
                    </div>
                    <div className="sm:max-w-3xl md:col-span-2">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        {/* First Name */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="first-name" className="text-slate-700 font-semibold">
                              First name<span className="text-red-500 ml-1">*</span>
                            </FieldLabel>
                            <Input
                              type="text"
                              id="first-name"
                              placeholder="Enter first name"
                              value={formData.firstName}
                              onChange={(e) => handleChange("firstName", e.target.value)}
                              className={`h-11 border-2 transition-all duration-200 ${
                                errors.firstName 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                              }`}
                              autoComplete="given-name"
                              required
                            />
                            {errors.firstName && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.firstName}
                              </div>
                            )}
                          </Field>
                        </div>

                        {/* Last Name */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="last-name" className="text-slate-700 font-semibold">
                              Last name<span className="text-red-500 ml-1">*</span>
                            </FieldLabel>
                            <Input
                              type="text"
                              id="last-name"
                              placeholder="Enter last name"
                              value={formData.lastName}
                              onChange={(e) => handleChange("lastName", e.target.value)}
                              className={`h-11 border-2 transition-all duration-200 ${
                                errors.lastName 
                                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                              }`}
                              autoComplete="family-name"
                              required
                            />
                            {errors.lastName && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.lastName}
                              </div>
                            )}
                          </Field>
                        </div>

                        {/* Date of Birth */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="dob" className="text-slate-700 font-semibold">
                              Date of Birth<span className="text-red-500 ml-1">*</span>
                            </FieldLabel>
                            <div className="relative group">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200 pointer-events-none" />
                              <Input
                                id="dob"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                                className={`h-11 pl-11 pr-4 border-2 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white ${
                                  errors.dateOfBirth 
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 shadow-red-100" 
                                    : "border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 hover:shadow-blue-50 focus:shadow-blue-100"
                                } shadow-sm hover:shadow-md focus:shadow-lg`}
                                style={{
                                  colorScheme: 'light'
                                }}
                                max={new Date().toISOString().split('T')[0]}
                                required
                              />
                              {formData.dateOfBirth && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                  Age: {calculateAge(formData.dateOfBirth)}
                                </div>
                              )}
                            </div>
                            {errors.dateOfBirth && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.dateOfBirth}
                              </div>
                            )}
                          </Field>
                        </div>

                        {/* Gender Selection */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-3">
                            <FieldLabel className="text-slate-700 font-semibold">
                              Gender<span className="text-red-500 ml-1">*</span>
                            </FieldLabel>
                            <RadioGroup
                              value={formData.gender}
                              onValueChange={(value) => handleChange("gender", value)}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <RadioGroupItem value="male" id="male" className="sr-only" />
                                  <label htmlFor="male" className={`h-5 w-5 rounded-full border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    formData.gender === 'male' 
                                      ? 'border-blue-500 bg-blue-500' 
                                      : 'border-slate-300 hover:border-slate-400'
                                  }`}>
                                    {formData.gender === 'male' && <Check className="h-3 w-3 text-white" />}
                                  </label>
                                </div>
                                <FieldLabel htmlFor="male" className="font-medium cursor-pointer text-slate-700">
                                  Male
                                </FieldLabel>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <RadioGroupItem value="female" id="female" className="sr-only" />
                                  <label htmlFor="female" className={`h-5 w-5 rounded-full border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    formData.gender === 'female' 
                                      ? 'border-pink-500 bg-pink-500' 
                                      : 'border-slate-300 hover:border-slate-400'
                                  }`}>
                                    {formData.gender === 'female' && <Check className="h-3 w-3 text-white" />}
                                  </label>
                                </div>
                                <FieldLabel htmlFor="female" className="font-medium cursor-pointer text-slate-700">
                                  Female
                                </FieldLabel>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <RadioGroupItem value="other" id="other" className="sr-only" />
                                  <label htmlFor="other" className={`h-5 w-5 rounded-full border-2 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                    formData.gender === 'other' 
                                      ? 'border-purple-500 bg-purple-500' 
                                      : 'border-slate-300 hover:border-slate-400'
                                  }`}>
                                    {formData.gender === 'other' && <Check className="h-3 w-3 text-white" />}
                                  </label>
                                </div>
                                <FieldLabel htmlFor="other" className="font-medium cursor-pointer text-slate-700">
                                  Other
                                </FieldLabel>
                              </div>
                            </RadioGroup>
                            {errors.gender && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.gender}
                              </div>
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Contact Information Section */}
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-3 mb-10">
                    <div>
                      <h2 className="flex items-center gap-3 font-semibold text-slate-800 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        Contact Information
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Provide contact details for the patient including phone number, email address, and residential address.
                      </p>
                    </div>
                    <div className="sm:max-w-3xl md:col-span-2">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        {/* Phone Number */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="phone" className="text-slate-700 font-semibold">
                              Phone Number<span className="text-red-500 ml-1">*</span>
                            </FieldLabel>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="Enter 10-digit mobile number"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className={`h-11 pl-11 border-2 transition-all duration-200 ${
                                  errors.phone 
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                                    : "border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                }`}
                                maxLength={15}
                                autoComplete="tel"
                                required
                              />
                            </div>
                            <FieldDescription className="text-slate-500">
                              Indian mobile number (10 digits)
                            </FieldDescription>
                            {errors.phone && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.phone}
                              </div>
                            )}
                          </Field>
                        </div>

                        {/* Email */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="email" className="text-slate-700 font-semibold">
                              Email Address
                            </FieldLabel>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                              <Input
                                type="email"
                                id="email"
                                placeholder="patient@example.com"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className={`h-11 pl-11 border-2 transition-all duration-200 ${
                                  errors.email 
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                                    : "border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                }`}
                                autoComplete="email"
                              />
                            </div>
                            <FieldDescription className="text-slate-500">
                              Optional - for appointment notifications
                            </FieldDescription>
                            {errors.email && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.email}
                              </div>
                            )}
                          </Field>
                        </div>

                        {/* Address */}
                        <div className="col-span-full">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="address" className="text-slate-700 font-semibold">
                              Residential Address
                            </FieldLabel>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                              <Textarea
                                id="address"
                                placeholder="Enter complete address with city, state, and PIN code"
                                value={formData.address}
                                onChange={(e) => handleChange("address", e.target.value)}
                                className="pl-11 min-h-[100px] border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 resize-none"
                                rows={3}
                              />
                            </div>
                            <FieldDescription className="text-slate-500">
                              Include street, city, state, and PIN code
                            </FieldDescription>
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Medical Information Section */}
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-3 mb-10">
                    <div>
                      <h2 className="flex items-center gap-3 font-semibold text-slate-800 text-lg">
                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <Heart className="h-4 w-4 text-red-600" />
                        </div>
                        Medical Information
                      </h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Optional medical details that help in providing better healthcare services and emergency situations.
                      </p>
                    </div>
                    <div className="sm:max-w-3xl md:col-span-2">
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                        {/* Blood Group */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="blood-group" className="text-slate-700 font-semibold">
                              Blood Group
                            </FieldLabel>
                            <Select
                              value={formData.bloodType}
                              onValueChange={(value) => handleChange("bloodType", value)}
                            >
                              <SelectTrigger 
                                id="blood-group" 
                                className="h-11 border-2 border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white hover:border-red-300 focus:border-red-500 focus:ring-red-500/20 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Droplets className="h-4 w-4 text-red-500" />
                                  <SelectValue placeholder="Select blood group" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-white/95 backdrop-blur-lg border border-slate-200 shadow-lg rounded-xl">
                                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                                  <SelectItem key={bg} value={bg} className="cursor-pointer hover:bg-red-50 rounded-lg mx-1 my-0.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                      <span className="font-semibold text-red-600">{bg}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FieldDescription className="text-slate-500">
                              Helpful for emergency situations
                            </FieldDescription>
                          </Field>
                        </div>

                        {/* Emergency Contact */}
                        <div className="col-span-full sm:col-span-3">
                          <Field className="gap-2">
                            <FieldLabel htmlFor="emergency" className="text-slate-700 font-semibold">
                              Emergency Contact
                            </FieldLabel>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                              <Input
                                id="emergency"
                                type="tel"
                                placeholder="Emergency contact number"
                                value={formData.emergencyContact}
                                onChange={(e) => handleChange("emergencyContact", e.target.value)}
                                className={`h-11 pl-11 border-2 transition-all duration-200 ${
                                  errors.emergencyContact 
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
                                    : "border-slate-200 focus:border-red-500 focus:ring-red-500/20"
                                }`}
                                maxLength={15}
                              />
                            </div>
                            <FieldDescription className="text-slate-500">
                              Relative or friend to contact in emergencies
                            </FieldDescription>
                            {errors.emergencyContact && (
                              <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.emergencyContact}
                              </div>
                            )}
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Form Actions */}
                  <div className="flex items-center justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/receptionist")}
                      className="flex items-center gap-2 h-11 px-6 border-2 border-slate-200 hover:border-slate-300 shadow-sm"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Dashboard
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex items-center gap-2 h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Register Patient
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}