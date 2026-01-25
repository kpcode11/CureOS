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
  const commonRoutes: Route[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <Home className="size-4" />,
      link: "/admin",
    },
  ];

  switch (userRole) {
    case "ADMIN":
      return [
        ...commonRoutes,
        {
          id: "admin",
          title: "Administration",
          icon: <Shield className="size-4" />,
          link: "/admin",
          subs: [
            {
              title: "Users",
              link: "/admin/rbac?tab=users",
              icon: <Users className="size-4" />,
            },
            {
              title: "Roles",
              link: "/admin/rbac?tab=roles",
              icon: <Lock className="size-4" />,
            },
            {
              title: "Permissions",
              link: "/admin/rbac?tab=permissions",
              icon: <Lock className="size-4" />,
            },
          ],
        },
        {
          id: "analytics",
          title: "Analytics",
          icon: <BarChart3 className="size-4" />,
          link: "#",
          subs: [
            {
              title: "Reports",
              link: "/admin/reports",
              icon: <FileText className="size-4" />,
            },
            {
              title: "Billing",
              link: "/admin/billing",
              icon: <DollarSign className="size-4" />,
            },
          ],
        },
      ];

    case "DOCTOR":
      return [
        ...commonRoutes,
        {
          id: "clinical",
          title: "Clinical",
          icon: <Stethoscope className="size-4" />,
          link: "/doctor",
          subs: [
            {
              title: "Patients",
              link: "/doctor/patients",
              icon: <Users className="size-4" />,
            },
            {
              title: "EMR",
              link: "/doctor/emr",
              icon: <FileText className="size-4" />,
            },
            {
              title: "Prescriptions",
              link: "/doctor/prescriptions",
              icon: <Pill className="size-4" />,
            },
            {
              title: "Orders",
              link: "/doctor/orders",
              icon: <Package2 className="size-4" />,
            },
          ],
        },
        {
          id: "surgery",
          title: "Surgery",
          icon: <Briefcase className="size-4" />,
          link: "/doctor/surgery",
        },
      ];

    case "NURSE":
      return [
        ...commonRoutes,
        {
          id: "patient-care",
          title: "Patient Care",
          icon: <Activity className="size-4" />,
          link: "/nurse",
          subs: [
            {
              title: "Bed Assignments",
              link: "/nurse/beds",
              icon: <Bed className="size-4" />,
            },
            {
              title: "Vitals",
              link: "/nurse/vitals",
              icon: <Activity className="size-4" />,
            },
            {
              title: "MAR",
              link: "/nurse/mar",
              icon: <Pill className="size-4" />,
            },
          ],
        },
      ];

    case "PHARMACIST":
      return [
        ...commonRoutes,
        {
          id: "pharmacy",
          title: "Pharmacy",
          icon: <Pill className="size-4" />,
          link: "/pharmacist",
          subs: [
            {
              title: "Prescriptions",
              link: "/pharmacist/prescriptions",
              icon: <Pill className="size-4" />,
            },
            {
              title: "Inventory",
              link: "/pharmacist/inventory",
              icon: <Package2 className="size-4" />,
            },
          ],
        },
      ];

    case "LAB_TECH":
      return [
        ...commonRoutes,
        {
          id: "lab",
          title: "Laboratory",
          icon: <TestTube className="size-4" />,
          link: "/lab-tech",
          subs: [
            {
              title: "Tests",
              link: "/lab-tech/tests",
              icon: <TestTube className="size-4" />,
            },
            {
              title: "Results",
              link: "/lab-tech/results",
              icon: <FileText className="size-4" />,
            },
          ],
        },
      ];

    case "RECEPTIONIST":
      return [
        ...commonRoutes,
        {
          id: "registration",
          title: "Registration",
          icon: <Users className="size-4" />,
          link: "/receptionist",
          subs: [
            {
              title: "New Patient",
              link: "/receptionist/registration",
              icon: <UserPlus className="size-4" />,
            },
            {
              title: "Appointments",
              link: "/receptionist/appointments",
              icon: <Package2 className="size-4" />,
            },
          ],
        },
      ];

    default:
      return commonRoutes;
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
            : "flex-row items-center justify-between"
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
            isCollapsed ? "flex-row md:flex-col-reverse" : "flex-row"
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
      
      <LogoutModal 
        open={logoutModalOpen} 
        onOpenChange={setLogoutModalOpen} 
      />
    </Sidebar>
  );
}
