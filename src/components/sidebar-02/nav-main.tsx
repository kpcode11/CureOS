"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type React from "react";

export type Route = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  link: string;
};

export default function DashboardNavigation({ routes }: { routes: Route[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarMenu>
      {routes.map((route) => (
        <SidebarMenuItem key={route.id}>
          <SidebarMenuButton tooltip={route.title} asChild>
            <Link
              href={route.link}
              prefetch={true}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 transition-colors text-foreground hover:bg-sidebar-muted hover:text-foreground",
                isCollapsed && "justify-center"
              )}
            >
              {route.icon}
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium">
                  {route.title}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
