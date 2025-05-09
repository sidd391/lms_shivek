
"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  BarChart2, 
  UserPlus, 
  TestTube, 
  Package as PackageIcon, // Renamed to avoid conflict with Package component
  Users, 
  Settings,
  FlaskConical
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: User },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/doctors", label: "Doctors", icon: UserPlus },
  { href: "/tests", label: "Tests", icon: TestTube },
  { href: "/test-packages", label: "Test Packages", icon: PackageIcon },
  { href: "/staff", label: "Staff", icon: Users },
  // { href: "/labs", label: "Labs", icon: FlaskConical }, // Commented out as per previous implicit removal
  // { href: "/users", label: "Users", icon: Users }, // Commented out as per previous implicit removal
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" || (pathname === "/" && item.href === "/dashboard"))}
              tooltip={{ children: item.label, side: "right", align: "center" }}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
