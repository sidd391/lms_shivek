import type { PropsWithChildren } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter, // Added for potential future use
} from "@/components/ui/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Atom } from "lucide-react";
import Link from "next/link";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <Atom className="h-8 w-8 text-sidebar-accent" />
              <span className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                QuantumHook
              </span>
            </Link>
          </SidebarHeader>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav />
          </div>
          {/* Example SidebarFooter if needed later
          <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">© 2024 QuantumHook</p>
          </SidebarFooter>
          */}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Navbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
