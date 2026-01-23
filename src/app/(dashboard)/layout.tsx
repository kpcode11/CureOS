"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Lock,
  Home,
  LogOut,
  UserPlus,
  Calendar,
  FileText,
  Activity,
  Stethoscope,
  TestTube,
  Pill,
  Bed,
  AlertTriangle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession, SessionProvider } from "next-auth/react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "ADMIN";

  // Role-based sidebar items
  const getSidebarItems = () => {
    switch (userRole) {
      case "RECEPTIONIST":
        return [
          { label: "Dashboard", href: "/receptionist", icon: Home },
          {
            label: "Registration",
            href: "/receptionist/registration",
            icon: UserPlus,
          },
          {
            label: "Patient List",
            href: "/receptionist/search",
            icon: Users,
          },
          {
            label: "Appointments",
            href: "/receptionist/appointments",
            icon: Calendar,
          },
        ];
      case "DOCTOR":
        return [
          { label: "Dashboard", href: "/doctor", icon: Home },
          { label: "Patients", href: "/doctor/patients", icon: Users },
          {
            label: "Appointments",
            href: "/doctor/appointments",
            icon: Calendar,
          },
          { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
        ];
      case "NURSE":
        return [
          { label: "Dashboard", href: "/nurse", icon: Home },
          { label: "Patients", href: "/nurse/patients", icon: Users },
          { label: "Beds", href: "/nurse/beds", icon: Bed },
          { label: "Vitals", href: "/nurse/vitals", icon: Activity },
        ];
      case "LAB_TECH":
        return [
          { label: "Dashboard", href: "/lab-tech", icon: Home },
          { label: "Tests", href: "/lab-tech/tests", icon: TestTube },
          { label: "Results", href: "/lab-tech/results", icon: FileText },
        ];
      case "PHARMACIST":
        return [
          { label: "Dashboard", href: "/pharmacist", icon: Home },
          {
            label: "Prescriptions",
            href: "/pharmacist/prescriptions",
            icon: Pill,
          },
          { label: "Inventory", href: "/pharmacist/inventory", icon: FileText },
        ];
      case "EMERGENCY":
        return [
          { label: "Dashboard", href: "/emergency", icon: Home },
          { label: "Cases", href: "/emergency/cases", icon: AlertTriangle },
          { label: "Patients", href: "/emergency/patients", icon: Users },
        ];
      case "ADMIN":
      default:
        return [
          { label: "Dashboard", href: "/admin", icon: Home },
          {
            label: "Permissions",
            href: "/admin/rbac?tab=permissions",
            icon: Lock,
          },
          { label: "Roles", href: "/admin/rbac?tab=roles", icon: Shield },
          { label: "Users", href: "/admin/rbac?tab=users", icon: Users },
        ];
    }
  };

  const sidebarItems = getSidebarItems();

  const getRoleTitle = () => {
    switch (userRole) {
      case "RECEPTIONIST":
        return "Receptionist";
      case "DOCTOR":
        return "Doctor Portal";
      case "NURSE":
        return "Nurse Portal";
      case "LAB_TECH":
        return "Lab Tech Portal";
      case "PHARMACIST":
        return "Pharmacist";
      case "EMERGENCY":
        return "Emergency";
      case "ADMIN":
      default:
        return "RBAC Admin";
    }
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href.split("?")[0]);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 sticky top-0 h-screen flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              {getRoleTitle()}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.email || "admin@rbac.com"}
              </p>
              <p className="text-xs text-gray-500">{getRoleTitle()}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm font-medium border border-gray-200 hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
