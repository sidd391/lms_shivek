
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { ShieldCheck, PlusCircle, Save, Trash2, Edit, Users, LayoutDashboard, User, FileText, BarChart2, UserPlus as UserPlusIcon, TestTube, Package as PackageIcon, Settings as SettingsIcon } from "lucide-react";
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


interface Permission {
  id: string;
  label: string;
  icon?: LucideIcon; // Optional icon for permission
}

interface ModulePermissions {
  module: string;
  moduleIcon: LucideIcon;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  permissions: Set<string>; // Set of permission IDs
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
    moduleIcon: Users,
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

const initialRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    permissions: new Set(allFeaturePermissions.flatMap(m => m.permissions.map(p => p.id))),
  },
  {
    id: 'doctor',
    name: 'Doctor',
    permissions: new Set(['dashboard.view', 'patients.view', 'patients.edit', 'bills.view', 'reports.view', 'doctors.view']),
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    permissions: new Set(['patients.view', 'patients.create', 'patients.edit', 'bills.view', 'bills.create', 'doctors.view']),
  },
  {
    id: 'technician',
    name: 'Lab Technician',
    permissions: new Set(['tests.view.tests', 'reports.view', 'reports.generate']),
  },
];

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = React.useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(roles.length > 0 ? roles[0] : null);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [isAddingRole, setIsAddingRole] = React.useState(false);
  const [roleToDelete, setRoleToDelete] = React.useState<Role | null>(null);

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

    const updatedRole = { ...selectedRole, permissions: updatedPermissions };
    setSelectedRole(updatedRole);
    setRoles(roles.map(r => r.id === selectedRole.id ? updatedRole : r));
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    console.log(`Saving permissions for role: ${selectedRole.name}`, selectedRole.permissions);
    toast({
      title: "Permissions Saved",
      description: `Permissions for role "${selectedRole.name}" have been updated.`,
    });
  };

  const handleAddNewRole = () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "Role name cannot be empty.", variant: "destructive" });
      return;
    }
    const newRoleId = newRoleName.toLowerCase().replace(/\s+/g, '-');
    if (roles.find(r => r.id === newRoleId)) {
      toast({ title: "Error", description: "A role with this name (or similar ID) already exists.", variant: "destructive" });
      return;
    }
    const newRole: Role = {
      id: newRoleId,
      name: newRoleName.trim(),
      permissions: new Set(),
    };
    setRoles([...roles, newRole]);
    setSelectedRole(newRole);
    setNewRoleName('');
    setIsAddingRole(false);
    toast({ title: "Role Added", description: `Role "${newRole.name}" has been created.` });
  };

  const confirmDeleteRole = () => {
    if (!roleToDelete) return;

    if (roleToDelete.id === 'admin') {
        toast({
            title: "Cannot Delete Role",
            description: "The Administrator role cannot be deleted.",
            variant: "destructive",
        });
        setRoleToDelete(null);
        return;
    }

    setRoles(prevRoles => prevRoles.filter(role => role.id !== roleToDelete.id));
    
    if (selectedRole?.id === roleToDelete.id) {
        const newRolesList = roles.filter(role => role.id !== roleToDelete.id);
        setSelectedRole(newRolesList.length > 0 ? newRolesList[0] : null);
    }
    
    toast({
        title: "Role Deleted",
        description: `The role "${roleToDelete.name}" has been successfully deleted.`,
    });
    setRoleToDelete(null);
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
                <CardDescription>Manage user roles and their access to system features.</CardDescription>
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
              {roles.map((role) => (
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
                  {role.id !== 'admin' && (
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
              ))}
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
                     <Button variant="ghost" size="sm" onClick={() => setIsAddingRole(false)}>Cancel</Button>
                     <Button size="sm" onClick={handleAddNewRole}>Create Role</Button>
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
              {selectedRole ? (
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
                                id={permission.id}
                                checked={selectedRole.permissions.has(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                aria-labelledby={`${permission.id}-label`}
                              />
                              <Label htmlFor={permission.id} id={`${permission.id}-label`} className="font-normal cursor-pointer flex-1">
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
              <CardFooter className="border-t pt-6">
                <Button onClick={handleSavePermissions} className="ml-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Save className="mr-2 h-5 w-5" /> Save Permissions
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Deleting the role "{roleToDelete?.name}" will remove it permanently.
              Any users assigned to this role may lose their specific permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
