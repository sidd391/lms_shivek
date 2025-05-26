
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
import Image from "next/image"; // Import next/image
import Link from "next/link";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              {/* Image component for the logo */}
              <Image 
                src="/Quantumhook_logo.png" 
                alt="QuantumHook Logo" 
                width={52} // Adjusted width for expanded state
                height={52} // Adjusted height for expanded state
                className="object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" // Collapsed state size
                data-ai-hint="company logo"
                priority 
              />
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
