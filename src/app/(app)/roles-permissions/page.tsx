
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, 
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, PlusCircle, Save, Trash2, LayoutDashboard, User, FileText, BarChart2, UserPlus as UserPlusIcon, TestTube, Package as PackageIcon, Settings as SettingsIcon, Users as StaffIcon, Loader2 } from "lucide-react";
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define staffRoles and StaffRole type directly in the frontend
const predefinedStaffRolesArray = ["Admin", "Technician", "Receptionist", "Doctor", "Accountant", "Other"] as const;
type StaffRole = typeof predefinedStaffRolesArray[number];


interface Permission {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface ModulePermissions {
  module: string;
  moduleIcon: LucideIcon;
  permissions: Permission[];
}

interface Role {
  id: string; // Corresponds to roleName used in API (e.g., "Admin", "Doctor", "custom-role")
  name: string; // Display name for the role
  permissions: Set<string>;
}

const allFeaturePermissions: ModulePermissions[] = [
  {
    module: "Dashboard",
    moduleIcon: LayoutDashboard,
    permissions: [{ id: "dashboard.view", label: "View Dashboard" }],
  },
  {
    module: "Patients",
    moduleIcon: User,
    permissions: [
      { id: "patients.view", label: "View List" },
      { id: "patients.create", label: "Create New" },
      { id: "patients.edit", label: "Edit Details" },
      { id: "patients.delete", label: "Delete Records" },
    ],
  },
  {
    module: "Bills",
    moduleIcon: FileText,
    permissions: [
      { id: "bills.view", label: "View List" },
      { id: "bills.create", label: "Create New" },
      { id: "bills.edit", label: "Edit Details" },
      { id: "bills.delete", label: "Delete Records" },
    ],
  },
  {
    module: "Reports",
    moduleIcon: BarChart2,
    permissions: [
      { id: "reports.view", label: "View List" },
      { id: "reports.generate", label: "Generate New" },
    ],
  },
  {
    module: "Doctors",
    moduleIcon: UserPlusIcon,
    permissions: [
      { id: "doctors.view", label: "View List" },
      { id: "doctors.create", label: "Create New" },
      { id: "doctors.edit", label: "Edit Details" },
      { id: "doctors.delete", label: "Delete Records" },
    ],
  },
  {
    module: "Tests",
    moduleIcon: TestTube,
    permissions: [
      { id: "tests.view.categories", label: "View Categories" },
      { id: "tests.manage.categories", label: "Manage Categories" },
      { id: "tests.view.tests", label: "View Tests" },
      { id: "tests.manage.tests", label: "Manage Tests" },
    ],
  },
  {
    module: "Test Packages",
    moduleIcon: PackageIcon,
    permissions: [
      { id: "testpackages.view", label: "View List" },
      { id: "testpackages.create", label: "Create New" },
      { id: "testpackages.edit", label: "Edit Details" },
      { id: "testpackages.delete", label: "Delete Records" },
    ],
  },
  {
    module: "Staff",
    moduleIcon: StaffIcon,
    permissions: [
      { id: "staff.view", label: "View List" },
      { id: "staff.create", label: "Create New" },
      { id: "staff.edit", label: "Edit Details" },
      { id: "staff.manage.roles", label: "Manage Roles (via this page)" },
    ],
  },
  {
    module: "Settings",
    moduleIcon: SettingsIcon,
    permissions: [{ id: "settings.access", label: "Access Settings" }],
  },
];

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [isAddingRole, setIsAddingRole] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchRolesAndPermissions = React.useCallback(async () => {
    setIsLoadingRoles(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsLoadingRoles(false);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_API_URL}/role-permissions`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Failed to fetch roles and permissions.');
      
      const result = await response.json();
      if (result.success && typeof result.data === 'object' && result.data !== null) {
        const rolesFromApi: Role[] = Object.entries(result.data).map(([name, perms]) => ({
          id: name, 
          name: name,
          permissions: new Set(perms as string[]),
        }));
        
        const currentPredefinedRoleNames = predefinedStaffRolesArray.map(r => r);
        currentPredefinedRoleNames.forEach(predefinedRoleName => {
            if(!rolesFromApi.find(r => r.name === predefinedRoleName)){
                rolesFromApi.push({
                    id: predefinedRoleName,
                    name: predefinedRoleName,
                    permissions: new Set()
                });
            }
        });
        
        rolesFromApi.sort((a, b) => {
            const aIsPredefined = currentPredefinedRoleNames.includes(a.name as StaffRole);
            const bIsPredefined = currentPredefinedRoleNames.includes(b.name as StaffRole);
            if (aIsPredefined && !bIsPredefined) return -1;
            if (!aIsPredefined && bIsPredefined) return 1;
            return a.name.localeCompare(b.name);
        });

        setRoles(rolesFromApi);
      } else {
        throw new Error(result.message || 'Failed to parse roles data.');
      }
    } catch (error: any) {
      toast({ title: "Error Loading Roles", description: error.message, variant: "destructive" });
      setRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [toast]); 

  React.useEffect(() => {
    fetchRolesAndPermissions();
  }, [fetchRolesAndPermissions]); 


  React.useEffect(() => {
    if (isLoadingRoles) {
      return; 
    }

    if (roles.length > 0) {
      const currentSelectedId = selectedRole?.id;
      const roleInNewList = roles.find(r => r.id === currentSelectedId);

      if (roleInNewList) {
        if (roleInNewList !== selectedRole || 
            JSON.stringify(Array.from(roleInNewList.permissions)) !== JSON.stringify(Array.from(selectedRole?.permissions || []))) {
          setSelectedRole(roleInNewList);
        }
      } else {
        setSelectedRole(roles.find(r => r.name === 'Admin') || roles[0]);
      }
    } else {
      if (selectedRole !== null) {
          setSelectedRole(null);
      }
    }
  }, [roles, selectedRole, isLoadingRoles]);


  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    if (!selectedRole) return;

    const updatedPermissions = new Set(selectedRole.permissions);
    if (granted) {
      updatedPermissions.add(permissionId);
    } else {
      updatedPermissions.delete(permissionId);
    }
    
    setSelectedRole({ ...selectedRole, permissions: updatedPermissions });
    
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/role-permissions/${selectedRole.name}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify({ permissions: Array.from(selectedRole.permissions) }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({
          title: "Permissions Saved",
          description: `Permissions for role "${selectedRole.name}" have been updated.`,
        });
        
        fetchRolesAndPermissions(); 
      } else {
        throw new Error(result.message || 'Failed to save permissions.');
      }
    } catch (error: any) {
      toast({ title: "Error Saving Permissions", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNewRole = async () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "Role name cannot be empty.", variant: "destructive" });
      return;
    }
    const trimmedNewRoleName = newRoleName.trim();
    if (roles.find(r => r.name.toLowerCase() === trimmedNewRoleName.toLowerCase())) {
      toast({ title: "Error", description: "A role with this name already exists.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true); 
    const authToken = localStorage.getItem('authToken');
     if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
       
      const response = await fetch(`${BACKEND_API_URL}/role-permissions/${trimmedNewRoleName}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify({ permissions: [] }), 
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const newRole: Role = {
          id: trimmedNewRoleName, 
          name: trimmedNewRoleName,
          permissions: new Set(),
        };
        setRoles(prevRoles => [...prevRoles, newRole].sort((a,b) => a.name.localeCompare(b.name)));
        setSelectedRole(newRole);
        setNewRoleName('');
        setIsAddingRole(false);
        toast({ title: "Role Added", description: `Role "${newRole.name}" has been created.` });
      } else {
        throw new Error(result.message || 'Failed to create role on server.');
      }
    } catch (error: any) {
        toast({ title: "Error Adding Role", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    if (predefinedStaffRolesArray.map(r => r.toLowerCase()).includes(roleToDelete.name.toLowerCase())) {
        toast({
            title: "Cannot Delete Role",
            description: `The predefined role "${roleToDelete.name}" cannot be deleted.`,
            variant: "destructive",
        });
        setRoleToDelete(null);
        return;
    }
    
    setIsSaving(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please login.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/role-permissions/${roleToDelete.name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const updatedRoles = roles.filter(role => role.id !== roleToDelete.id);
        setRoles(updatedRoles);
        if (selectedRole?.id === roleToDelete.id) {
            setSelectedRole(updatedRoles.length > 0 ? (updatedRoles.find(r => r.name === 'Admin') || updatedRoles[0]) : null);
        }
        toast({ title: "Role Deleted", description: `The role "${roleToDelete.name}" has been successfully deleted.` });
      } else {
        throw new Error(result.message || 'Failed to delete role.');
      }
    } catch (error: any) {
      toast({ title: "Error Deleting Role", description: error.message, variant: "destructive" });
    } finally {
      setRoleToDelete(null);
      setIsSaving(false);
    }
  };


  return (
    <AlertDialog open={!!roleToDelete} onOpenChange={(openStatus) => { if (!openStatus) setRoleToDelete(null); }}>
      <div className="flex flex-col gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-3xl font-bold">Roles &amp; Permissions</CardTitle>
                
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">User Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoadingRoles ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded-md animate-pulse"></div>)}
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors",
                      selectedRole?.id === role.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleRoleSelect(role)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleRoleSelect(role);}}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select role ${role.name}`}
                  >
                    <span className="font-medium">{role.name}</span>
                    {!predefinedStaffRolesArray.map(r => r.toLowerCase()).includes(role.name.toLowerCase()) && (
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            selectedRole?.id === role.id
                              ? "text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                              : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleToDelete(role);
                          }}
                          aria-label={`Delete role ${role.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    )}
                  </div>
                ))
              )}
               <Button variant="outline" className="w-full mt-4 border-dashed hover:border-solid" onClick={() => setIsAddingRole(true)}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Role
              </Button>

              {isAddingRole && (
                <Card className="mt-4 p-4 space-y-3 shadow-inner bg-muted/50">
                  <h4 className="font-semibold">Create New Role</h4>
                  <div>
                    <Label htmlFor="newRoleName">Role Name</Label>
                    <Input 
                      id="newRoleName" 
                      value={newRoleName} 
                      onChange={(e) => setNewRoleName(e.target.value)} 
                      placeholder="e.g., Accountant" 
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                     <Button variant="ghost" size="sm" onClick={() => setIsAddingRole(false)} disabled={isSaving}>Cancel</Button>
                     <Button size="sm" onClick={handleAddNewRole} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Role"}
                     </Button>
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md">
            <CardHeader>
              {selectedRole ? (
                <>
                  <CardTitle className="text-xl">Permissions for: {selectedRole.name}</CardTitle>
                  <CardDescription>Grant or revoke access to features for this role.</CardDescription>
                </>
              ) : (
                <CardTitle className="text-xl">Select a Role</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingRoles && !selectedRole ? (
                 <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-md">
                            <div className="h-6 bg-muted rounded-md w-1/3 mb-3 animate-pulse"></div>
                            <div className="space-y-2">
                                <div className="h-5 bg-muted/50 rounded-md w-3/4 animate-pulse"></div>
                                <div className="h-5 bg-muted/50 rounded-md w-1/2 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
              ) : selectedRole ? (
                <Accordion type="multiple" defaultValue={allFeaturePermissions.map(m => m.module)} className="w-full">
                  {allFeaturePermissions.map((moduleItem) => {
                    const ModuleIcon = moduleItem.moduleIcon;
                    return (
                    <AccordionItem value={moduleItem.module} key={moduleItem.module}>
                      <AccordionTrigger className="text-lg hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ModuleIcon className="h-5 w-5 text-primary" />
                          {moduleItem.module}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-2">
                        <div className="space-y-3">
                          {moduleItem.permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/50">
                              <Checkbox
                                id={`${selectedRole.id}-${permission.id}`} 
                                checked={selectedRole.permissions.has(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                aria-labelledby={`${selectedRole.id}-${permission.id}-label`}
                                disabled={predefinedStaffRolesArray.map(r => r.toLowerCase()).includes(selectedRole.name.toLowerCase() as StaffRole) && selectedRole.name.toLowerCase() === 'admin'} 
                              />
                              <Label htmlFor={`${selectedRole.id}-${permission.id}`} id={`${selectedRole.id}-${permission.id}-label`} className="font-normal cursor-pointer flex-1">
                                {permission.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <p className="text-muted-foreground">Please select a role from the left panel to view and manage its permissions.</p>
              )}
            </CardContent>
            {selectedRole && (
              <CardFooter className="border-t pt-6 flex justify-end"> 
                <Button 
                  onClick={handleSavePermissions} 
                  className="bg-accent hover:bg-accent/90 text-accent-foreground" 
                  disabled={isSaving || (predefinedStaffRolesArray.map(r => r.toLowerCase()).includes(selectedRole.name.toLowerCase() as StaffRole) && selectedRole.name.toLowerCase() === 'admin')}
                >
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5" />}
                   Save Permissions
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting the role "{roleToDelete?.name}" will remove its permission configurations.
              Users assigned this role will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)} disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isSaving}>
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}

