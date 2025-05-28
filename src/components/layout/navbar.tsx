
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    // Always remove token from client first
    localStorage.removeItem('authToken');
    localStorage.removeItem('appLabCode'); // Also clear lab code for a full reset

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header needed for logout typically,
          // but if your backend expects it for some reason, add it.
        },
      });

      // We don't strictly need to check backend response for logout success
      // as the primary action (clearing client token) is done.
      // But it's good to log if the backend call failed for other reasons.
      if (!response.ok) {
        const result = await response.json().catch(() => ({ message: "Backend logout endpoint error."}));
        console.warn("Backend logout call failed or returned error:", result.message);
      }
      
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });

    } catch (error) {
      console.error('Logout request error:', error);
      // Even if backend call fails, client-side token is cleared, so consider it a client-side success.
      toast({
        title: "Logout Successful (Client)",
        description: "Your session has been cleared locally.",
      });
    } finally {
      router.push('/'); 
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm",
      "print:hidden" // This class will hide the header when printing
    )}>
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-2">
        {/* App Logo/Name could be here if not in sidebar header, or keep it minimal */}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>QH</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile" passHref legacyBehavior>
              <DropdownMenuItem asChild className="cursor-pointer">
                <a>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings" passHref legacyBehavior>
              <DropdownMenuItem asChild className="cursor-pointer">
                <a>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
    
