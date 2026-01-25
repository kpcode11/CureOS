"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  Home,
  Package2,
  Settings,
  Users,
  Shield,
  Lock,
  Stethoscope,
  TestTube,
  Pill,
  Bed,
  BarChart3,
  FileText,
  Briefcase,
  UserPlus,
  Bell,
  LogOut,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  LayoutGrid,
} from "lucide-react";
import { Logo } from "@/components/sidebar-02/logo";
import type { Route } from "./nav-main";
import DashboardNavigation from "@/components/sidebar-02/nav-main";
import { NotificationsPopover } from "@/components/sidebar-02/nav-notifications";
import { TeamSwitcher } from "@/components/sidebar-02/team-switcher";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { LogoutModal } from "@/components/ui/logout-modal";

const sampleNotifications = [
  {
    id: "1",
    avatar: "/avatars/01.png",
    fallback: "OM",
    text: "New patient registered.",
    time: "10m ago",
  },
  {
    id: "2",
    avatar: "/avatars/02.png",
    fallback: "JL",
    text: "Lab results available.",
    time: "1h ago",
  },
  {
    id: "3",
    avatar: "/avatars/03.png",
    fallback: "HH",
    text: "Surgery scheduled.",
    time: "2h ago",
  },
];

// Hospital-specific routes based on user role
const getHospitalRoutes = (userRole?: string): Route[] => {
  // Role-specific dashboard route
  const getDashboardRoute = (role?: string): Route => {
    switch (role) {
      case "ADMIN":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/admin",
        };
      case "DOCTOR":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/doctor",
        };
      case "NURSE":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/nurse",
        };
      case "RECEPTIONIST":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/receptionist",
        };
      case "LAB_TECHNICIAN":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/lab-tech",
        };
      case "PHARMACIST":
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/pharmacist",
        };
      default:
        return {
          id: "dashboard",
          title: "Dashboard",
          icon: <Home className="size-4" />,
          link: "/admin",
        };
    }
  };

  switch (userRole) {
    case "ADMIN":
      return [
        getDashboardRoute(userRole),
        {
          id: "users",
          title: "Users",
          icon: <Users className="size-4" />,
          link: "/admin/rbac?tab=users",
        },
        {
          id: "roles",
          title: "Roles",
          icon: <Lock className="size-4" />,
          link: "/admin/rbac?tab=roles",
        },
        {
          id: "permissions",
          title: "Permissions",
          icon: <Lock className="size-4" />,
          link: "/admin/rbac?tab=permissions",
        },
      ];

    case "DOCTOR":
      return [
        getDashboardRoute(userRole),
        {
          id: "patients",
          title: "Patients",
          icon: <Users className="size-4" />,
          link: "/doctor/patients",
        },
        {
          id: "appointments",
          title: "Appointments",
          icon: <Package2 className="size-4" />,
          link: "/doctor/appointments",
        },
        {
          id: "emergency",
          title: "Emergency",
          icon: <AlertTriangle className="size-4" />,
          link: "/doctor/emergency",
        },
        {
          id: "referrals",
          title: "Referrals",
          icon: <ArrowRightLeft className="size-4" />,
          link: "/doctor/referrals",
        },
        {
          id: "surgery",
          title: "Surgeries",
          icon: <Briefcase className="size-4" />,
          link: "/doctor/surgeries",
        },
      ];

    case "NURSE":
      return [
        getDashboardRoute(userRole),
        {
          id: "bed-assignments",
          title: "Bed Assignments",
          icon: <Bed className="size-4" />,
          link: "/nurse/bed-assignments",
        },
        {
          id: "beds",
          title: "Beds",
          icon: <Bed className="size-4" />,
          link: "/nurse/beds",
        },
        {
          id: "medication",
          title: "Medication",
          icon: <Pill className="size-4" />,
          link: "/nurse/medication",
        },
        {
          id: "nursing-records",
          title: "Nursing Records",
          icon: <FileText className="size-4" />,
          link: "/nurse/nursing-records",
        },
        {
          id: "patients",
          title: "Patients",
          icon: <Users className="size-4" />,
          link: "/nurse/patients",
        },
        {
          id: "vitals",
          title: "Vitals",
          icon: <Activity className="size-4" />,
          link: "/nurse/vitals",
        },
        {
          id: "ward",
          title: "Ward",
          icon: <LayoutGrid className="size-4" />,
          link: "/nurse/ward",
        },
      ];

    case "PHARMACIST":
      return [
        getDashboardRoute(userRole),
        {
          id: "prescriptions",
          title: "Prescriptions",
          icon: <Pill className="size-4" />,
          link: "/pharmacist/prescriptions",
        },
        {
          id: "dispense",
          title: "Dispense",
          icon: <Package2 className="size-4" />,
          link: "/pharmacist/dispense",
        },
        {
          id: "queue",
          title: "Queue",
          icon: <Users className="size-4" />,
          link: "/pharmacist/queue",
        },
        {
          id: "inventory",
          title: "Inventory",
          icon: <Package2 className="size-4" />,
          link: "/pharmacist/inventory",
        },
        {
          id: "safety-alerts",
          title: "Safety Alerts",
          icon: <AlertTriangle className="size-4" />,
          link: "/pharmacist/safety-alerts",
        },
      ];

    case "LAB_TECH":
      return [
        getDashboardRoute("LAB_TECHNICIAN"),
        {
          id: "orders",
          title: "Orders",
          icon: <Package2 className="size-4" />,
          link: "/lab-tech/orders",
        },
        {
          id: "results",
          title: "Results",
          icon: <FileText className="size-4" />,
          link: "/lab-tech/results",
        },
        {
          id: "critical",
          title: "Critical",
          icon: <AlertTriangle className="size-4" />,
          link: "/lab-tech/critical",
        },
      ];

    case "RECEPTIONIST":
      return [
        getDashboardRoute(userRole),
        {
          id: "new-patient",
          title: "New Patient",
          icon: <UserPlus className="size-4" />,
          link: "/receptionist/registration",
        },
        {
          id: "appointments",
          title: "Appointments",
          icon: <Package2 className="size-4" />,
          link: "/receptionist/appointments",
        },
        {
          id: "patients",
          title: "Patient Records",
          icon: <Users className="size-4" />,
          link: "/receptionist/patients",
        },
        {
          id: "search",
          title: "Search Patients",
          icon: <Search className="size-4" />,
          link: "/receptionist/search",
        },
        {
          id: "emergency",
          title: "Emergency",
          icon: <AlertTriangle className="size-4" />,
          link: "/receptionist/emergency",
        },
        {
          id: "referrals",
          title: "Referrals",
          icon: <ArrowRightLeft className="size-4" />,
          link: "/receptionist/referrals",
        },
      ];

    case "BILLING_OFFICER":
      return [
        getDashboardRoute(userRole),
        {
          id: "patient",
          title: "Patient Billing",
          icon: <Users className="size-4" />,
          link: "/billing/patient",
        },
        {
          id: "overdue",
          title: "Overdue",
          icon: <AlertTriangle className="size-4" />,
          link: "/billing/overdue",
        },
        {
          id: "audit-logs",
          title: "Audit Logs",
          icon: <FileText className="size-4" />,
          link: "/billing/audit-logs",
        },
      ];

    default:
      return [getDashboardRoute(userRole)];
  }
};

const teams = [
  { id: "1", name: "CureOS Hospital", logo: Logo, plan: "Professional" },
  { id: "2", name: "Emergency Wing", logo: Logo, plan: "Active" },
  { id: "3", name: "ICU Ward", logo: Logo, plan: "Active" },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { data: session } = useSession();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const userRole = session?.user?.role;
  const isCollapsed = state === "collapsed";
  const routes = getHospitalRoutes(userRole);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader
        className={cn(
          "flex md:pt-3.5",
          isCollapsed
            ? "flex-row items-center justify-between gap-y-4 md:flex-col md:items-start md:justify-start"
            : "flex-row items-center justify-between",
        )}
      >
        <a href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          {!isCollapsed && (
            <span className="font-semibold text-black dark:text-white">
              CureOS
            </span>
          )}
        </a>

        <motion.div
          key={isCollapsed ? "header-collapsed" : "header-expanded"}
          className={cn(
            "flex items-center gap-2",
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <NotificationsPopover notifications={sampleNotifications} />
          <SidebarTrigger />
        </motion.div>
      </SidebarHeader>
      <SidebarContent className="gap-4 px-2 py-4">
        <DashboardNavigation routes={routes} />
      </SidebarContent>
      <SidebarFooter className="px-2 space-y-2">
        <TeamSwitcher teams={teams} />
        <button
          onClick={() => setLogoutModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm font-medium border border-gray-200 hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} />
    </Sidebar>
  );
}
