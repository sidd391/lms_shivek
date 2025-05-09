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
  description: string;
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
    description: 'Full access to all system features.',
    permissions: new Set(allFeaturePermissions.flatMap(m => m.permissions.map(p => p.id))),
  },
  {
    id: 'doctor',
    name: 'Doctor',
    description: 'Access to patient data, reports, and billing for their patients.',
    permissions: new Set(['dashboard.view', 'patients.view', 'patients.edit', 'bills.view', 'reports.view', 'doctors.view']),
  },
  {
    id: 'receptionist',
    name: 'Receptionist',
    description: 'Manages patient registration, appointments, and billing.',
    permissions: new Set(['patients.view', 'patients.create', 'patients.edit', 'bills.view', 'bills.create', 'doctors.view']),
  },
  {
    id: 'technician',
    name: 'Lab Technician',
    description: 'Manages tests and reports generation.',
    permissions: new Set(['tests.view.tests', 'reports.view', 'reports.generate']),
  },
];

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = React.useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(roles.length > 0 ? roles[0] : null);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [newRoleDescription, setNewRoleDescription] = React.useState('');
  const [isAddingRole, setIsAddingRole] = React.useState(false);

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

    // Update in the main roles list as well for persistence (in a real app, this would be an API call)
    setRoles(roles.map(r => r.id === selectedRole.id ? updatedRole : r));
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    // In a real app, this would be an API call to save the selectedRole.permissions
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
      description: newRoleDescription.trim(),
      permissions: new Set(), // Start with no permissions
    };
    setRoles([...roles, newRole]);
    setSelectedRole(newRole);
    setNewRoleName('');
    setNewRoleDescription('');
    setIsAddingRole(false);
    toast({ title: "Role Added", description: `Role "${newRole.name}" has been created.` });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and their access to system features.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List Column */}
        <Card className="md:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">User Roles</CardTitle>
            <CardDescription>Select a role to manage its permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map((role) => (
              <Button
                key={role.id}
                variant={selectedRole?.id === role.id ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleRoleSelect(role)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80 data-[state=active]:text-primary-foreground/80">
                    {role.description || 'No description'}
                  </span>
                </div>
              </Button>
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
                <div>
                  <Label htmlFor="newRoleDescription">Description (Optional)</Label>
                  <Input 
                    id="newRoleDescription" 
                    value={newRoleDescription} 
                    onChange={(e) => setNewRoleDescription(e.target.value)} 
                    placeholder="Brief description of the role"
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

        {/* Permissions Column */}
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
                            />
                            <Label htmlFor={permission.id} className="font-normal cursor-pointer flex-1">
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
    </div>
  );
}