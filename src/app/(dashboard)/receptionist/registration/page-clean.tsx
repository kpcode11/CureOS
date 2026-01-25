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
    <div className="min-h-screen bg-background p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Patient Registration
              </h1>
              <p className="mt-1 text-slate-600">
                Register a new patient in the hospital system
              </p>
            </div>
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

        {/* Success Message */}
        {registeredPatient && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-800">
                    Registration Successful!
                  </h3>
                  <p className="text-green-700">
                    Patient has been successfully registered in the system.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-slate-900 mb-3">
                  Patient Details:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Name:</span>
                    <span className="ml-2 font-medium">
                      {registeredPatient.firstName} {registeredPatient.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Patient ID:</span>
                    <span className="ml-2 font-medium font-mono">
                      {registeredPatient.id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Phone:</span>
                    <span className="ml-2 font-medium">
                      {registeredPatient.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Registration Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(registeredPatient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6">
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
          <div className="flex items-center justify-center">
            <div className="sm:mx-auto sm:max-w-2xl w-full">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                  {/* First Name */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="first-name">
                        First name<span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        type="text"
                        id="first-name"
                        placeholder="Enter first name"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        required
                      />
                      {errors.firstName && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.firstName}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Last Name */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="last-name">
                        Last name<span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        type="text"
                        id="last-name"
                        placeholder="Enter last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                        required
                      />
                      {errors.lastName && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.lastName}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Email */}
                  <div className="col-span-full">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="email">
                        Email Address
                      </FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          type="email"
                          id="email"
                          placeholder="patient@email.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          className={`pl-10 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Phone */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="phone">
                        Phone Number<span className="text-red-500">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className={`pl-10 ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                          required
                        />
                      </div>
                      {errors.phone && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.phone}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Date of Birth */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="dob">
                        Date of Birth<span className="text-red-500">*</span>
                      </FieldLabel>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                          className={`pl-10 ${errors.dateOfBirth ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                          required
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.dateOfBirth}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Blood Group */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="blood-group">Blood Group</FieldLabel>
                      <Select
                        value={formData.bloodType}
                        onValueChange={(value) => handleChange("bloodType", value)}
                      >
                        <SelectTrigger id="blood-group">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              <span className="font-semibold text-emerald-700">{bg}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Emergency Contact */}
                  <div className="col-span-full sm:col-span-3">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="emergency">Emergency Contact</FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="emergency"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.emergencyContact}
                          onChange={(e) => handleChange("emergencyContact", e.target.value)}
                          className={`pl-10 ${errors.emergencyContact ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        />
                      </div>
                      <FieldDescription>
                        Relative or friend to contact in emergencies
                      </FieldDescription>
                      {errors.emergencyContact && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.emergencyContact}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Separator */}
                  <div className="col-span-full">
                    <div className="border-t border-gray-200 my-6"></div>
                  </div>

                  {/* Gender Selection */}
                  <div className="col-span-full">
                    <Field className="gap-4">
                      <FieldLabel className="font-semibold text-foreground">
                        Gender<span className="text-red-500">*</span>
                      </FieldLabel>

                      <RadioGroup
                        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
                        value={formData.gender}
                        onValueChange={(value) => handleChange("gender", value)}
                      >
                        <div className="border-input has-data-[state=checked]:border-ring relative flex flex-col gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <div className="flex justify-between">
                            <RadioGroupItem
                              id="male"
                              value="male"
                              className="order-1 after:absolute after:inset-0"
                            />
                            <FieldLabel htmlFor="male" className="block text-sm font-medium text-foreground">
                              Male
                            </FieldLabel>
                          </div>
                        </div>

                        <div className="border-input has-data-[state=checked]:border-ring relative flex flex-col gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <div className="flex justify-between">
                            <RadioGroupItem
                              id="female"
                              value="female"
                              className="order-1 after:absolute after:inset-0"
                            />
                            <FieldLabel htmlFor="female" className="block text-sm font-medium text-foreground">
                              Female
                            </FieldLabel>
                          </div>
                        </div>

                        <div className="border-input has-data-[state=checked]:border-ring relative flex flex-col gap-2 rounded-md border p-4 shadow-xs outline-none">
                          <div className="flex justify-between">
                            <RadioGroupItem
                              id="other"
                              value="other"
                              className="order-1 after:absolute after:inset-0"
                            />
                            <FieldLabel htmlFor="other" className="block text-sm font-medium text-foreground">
                              Other
                            </FieldLabel>
                          </div>
                        </div>
                      </RadioGroup>

                      {errors.gender && (
                        <div className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.gender}
                        </div>
                      )}
                    </Field>
                  </div>

                  {/* Address */}
                  <div className="col-span-full">
                    <Field className="gap-2">
                      <FieldLabel htmlFor="address">
                        Residential Address
                      </FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Textarea
                          id="address"
                          placeholder="Enter complete address with city, state, and PIN code"
                          value={formData.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          className="pl-10 min-h-[100px]"
                        />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-gray-200 my-6"></div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={() => router.push("/receptionist")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Register Patient
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}