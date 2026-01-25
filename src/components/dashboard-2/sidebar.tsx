"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LogoutModal } from "@/components/ui/logout-modal";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  BarChart,
  Mail,
  Calendar,
  FileText,
  Users,
  Folder,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  MoreHorizontal,
  ChevronsUpDown,
  Atom,
  LogOut,
  UserCircle,
  CreditCard,
  Globe,
  Shield,
  Stethoscope,
  Pill,
  TestTube,
  Bed,
  Activity,
  Package2,
  Briefcase,
  DollarSign,
  ClipboardList,
} from "lucide-react";

const getMenuItems = (role?: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      icon: LayoutGrid,
      href: role === "ADMIN" ? "/admin" : `/${role?.toLowerCase()}`,
      isActive: true,
    },
  ];

  switch (role) {
    case "ADMIN":
      return [
        ...baseItems,
        { title: "RBAC", icon: Shield, href: "/admin/rbac" },
        { title: "Users", icon: Users, href: "/admin/users" },
        { title: "Settings", icon: Settings, href: "/admin/settings" },
        { title: "Insurance", icon: CreditCard, href: "/admin/insurance" },
      ];
    case "DOCTOR":
      return [
        ...baseItems,
        { title: "Appointments", icon: Calendar, href: "/doctor/appointments" },
        { title: "Emergency", icon: Activity, href: "/doctor/emergency" },
        { title: "Patients", icon: Users, href: "/doctor/patients" },
        { title: "Referrals", icon: FileText, href: "/doctor/referrals" },
        { title: "Surgeries", icon: Briefcase, href: "/doctor/surgeries" },
      ];
    case "NURSE":
      return [
        ...baseItems,
        { title: "Bed Assignments", icon: Bed, href: "/nurse/bed-assignments" },
        { title: "Beds", icon: Bed, href: "/nurse/beds" },
        { title: "Medication", icon: Pill, href: "/nurse/medication" },
        {
          title: "Nursing Records",
          icon: FileText,
          href: "/nurse/nursing-records",
        },
        { title: "Patients", icon: Users, href: "/nurse/patients" },
        { title: "Vitals", icon: Activity, href: "/nurse/vitals" },
        { title: "Ward", icon: LayoutGrid, href: "/nurse/ward" },
      ];
    case "PHARMACIST":
      return [
        ...baseItems,
        { title: "Dispense", icon: Package2, href: "/pharmacist/dispense" },
        { title: "Inventory", icon: LayoutGrid, href: "/pharmacist/inventory" },
        {
          title: "Prescriptions",
          icon: Pill,
          href: "/pharmacist/prescriptions",
        },
        { title: "Queue", icon: ClipboardList, href: "/pharmacist/queue" },
        {
          title: "Safety Alerts",
          icon: Activity,
          href: "/pharmacist/safety-alerts",
        },
      ];
    case "LAB_TECH":
      return [
        ...baseItems,
        { title: "Critical", icon: Activity, href: "/lab-tech/critical" },
        { title: "Orders", icon: ClipboardList, href: "/lab-tech/orders" },
        { title: "Results", icon: TestTube, href: "/lab-tech/results" },
      ];
    case "RECEPTIONIST":
      return [
        ...baseItems,
        {
          title: "Appointments",
          icon: Calendar,
          href: "/receptionist/appointments",
        },
        { title: "Emergency", icon: Activity, href: "/receptionist/emergency" },
        {
          title: "Registration",
          icon: UserCircle,
          href: "/receptionist/registration",
        },
        { title: "Search", icon: Globe, href: "/receptionist/search" },
      ];
    default:
      return baseItems;
  }
};

const getDepartments = (role?: string) => {
  if (role === "ADMIN") {
    return [
      { name: "Billing", hasNotification: false, href: "/billing" },
      { name: "Doctor Portal", hasNotification: false, href: "/doctor" },
      { name: "Emergency", hasNotification: true, href: "/emergency" },
      { name: "Laboratory", hasNotification: false, href: "/lab-tech" },
      { name: "Pharmacy", hasNotification: true, href: "/pharmacist" },
    ];
  }
  return [];
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const userRole = session?.user?.role;
  const [foldersOpen, setFoldersOpen] = React.useState(true);

  const menuItems = getMenuItems(userRole);
  const folders = getDepartments(userRole);

  return (
    <Sidebar collapsible="offcanvas" className="lg:border-r-0!" {...props}>
      <SidebarHeader className="p-3 sm:p-4 lg:p-5 pb-0">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white">
            <Atom className="size-3" />
          </div>
          <span className="font-semibold text-base sm:text-lg">CureOS</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 sm:px-4 lg:px-5">
        <div className="flex items-center gap-2 sm:gap-3 rounded-lg border bg-card p-2 sm:p-3 mb-3 sm:mb-4">
          <Avatar className="size-8 sm:size-[34px] shrink-0">
            <AvatarFallback className="bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white text-xs sm:text-sm font-semibold">
              {session?.user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs sm:text-sm">
              {session?.user?.name
                ? `${session.user.name}'s Workspace`
                : "CureOS Hospital"}
            </p>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="size-3 sm:size-3.5" />
              <span className="text-[10px] sm:text-xs">
                {userRole ? `${userRole} Portal` : "Portal"}
              </span>
            </div>
          </div>
        </div>

        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    className="h-9 sm:h-[38px]"
                  >
                    <Link href={item.href}>
                      {item.icon && (
                        <item.icon
                          className={`size-4 sm:size-5 ${
                            item.isGradient ? "text-[#6e3ff3]" : ""
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm ${
                          item.isGradient
                            ? "bg-clip-text text-transparent bg-linear-to-r from-[#6e3ff3] to-[#df3674]"
                            : ""
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.isActive && (
                        <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-60" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {folders.length > 0 && (
          <Collapsible open={foldersOpen} onOpenChange={setFoldersOpen}>
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="flex items-center justify-between px-0 text-[10px] sm:text-[11px] font-semibold tracking-wider text-muted-foreground">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <ChevronDown
                      className={`size-3 sm:size-3.5 transition-transform ${
                        foldersOpen ? "" : "-rotate-90"
                      }`}
                    />
                    DEPARTMENTS
                  </div>
                </CollapsibleTrigger>
                <MoreHorizontal className="size-4 cursor-pointer hover:text-foreground transition-colors" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="mt-2">
                    {folders.map((folder) => (
                      <SidebarMenuItem key={folder.name}>
                        <SidebarMenuButton asChild className="h-9 sm:h-[38px]">
                          <Link href={folder.href || "#"}>
                            <Folder className="size-4 sm:size-5 text-muted-foreground" />
                            <span className="flex-1 text-muted-foreground text-sm truncate">
                              {folder.name}
                            </span>
                            {folder.hasNotification && (
                              <div className="size-1.5 rounded-full bg-[#6e3ff3] shrink-0" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <Avatar className="size-7 sm:size-8">
                <AvatarFallback className="text-xs">
                  {session?.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs sm:text-sm">
                  {session?.user?.name || "Unknown User"}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {session?.user?.role || "No Role"}
                </p>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground shrink-0" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem
              className="text-red-600 hover:bg-accent cursor-pointer"
              onClick={() => setLogoutModalOpen(true)}
            >
              <LogOut className="size-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <LogoutModal open={logoutModalOpen} onOpenChange={setLogoutModalOpen} />
    </Sidebar>
  );
}
