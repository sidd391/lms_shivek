
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Palette, Building } from "lucide-react";
import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from "@/components/ui/form"; // Added FormItem
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label as UILabel } from "@/components/ui/label"; // Import standard Label

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
  confirmNewPassword: z.string().min(8, 'Confirm password is required.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ['confirmNewPassword'],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const labDetailsFormSchema = z.object({
  labName: z.string().min(3, "Lab name must be at least 3 characters."),
  labAddress: z.string().min(10, "Lab address must be at least 10 characters.").optional().or(z.literal('')),
});
type LabDetailsFormValues = z.infer<typeof labDetailsFormSchema>;


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const LAB_NAME_SETTING_KEY = 'LAB_NAME';
const LAB_ADDRESS_SETTING_KEY = 'LAB_ADDRESS';
const DEFAULT_LAB_NAME = 'QuantumHook Diagnostics';
const DEFAULT_LAB_ADDRESS = '123 Lab Lane, Science City, ST 54321\nPhone: (555) 123-4567 | Email: contact@quantumhook.dev';


export default function SettingsPage() {
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isSavingLabDetails, setIsSavingLabDetails] = React.useState(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAuthToken(localStorage.getItem('authToken'));
  }, []);


  const passwordHookForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const labDetailsHookForm = useForm<LabDetailsFormValues>({
    resolver: zodResolver(labDetailsFormSchema),
    defaultValues: {
      labName: DEFAULT_LAB_NAME,
      labAddress: DEFAULT_LAB_ADDRESS,
    },
  });

  React.useEffect(() => {
    setIsClient(true);
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true' || (!storedDarkMode && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const fetchLabSettings = async () => {
      if (!authToken) {
        console.log("Auth token not yet available for fetching lab settings.");
        // Optionally, if settings are critical on load, you might show a loading state
        // or trigger a re-fetch once authToken is available.
        return;
      }
      try {
        const [nameResponse, addressResponse] = await Promise.all([
          fetch(`${BACKEND_API_URL}/settings/${LAB_NAME_SETTING_KEY}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          }),
          fetch(`${BACKEND_API_URL}/settings/${LAB_ADDRESS_SETTING_KEY}`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          })
        ]);

        const nameResult = await nameResponse.json();
        const addressResult = await addressResponse.json();

        let fetchedLabName = DEFAULT_LAB_NAME;
        let fetchedLabAddress = DEFAULT_LAB_ADDRESS;

        if (nameResponse.ok && nameResult.success && nameResult.data?.value) {
          fetchedLabName = nameResult.data.value;
        }
        if (addressResponse.ok && addressResult.success && addressResult.data?.value) {
          fetchedLabAddress = addressResult.data.value;
        }

        labDetailsHookForm.reset({
          labName: fetchedLabName,
          labAddress: fetchedLabAddress,
        });

      } catch (error) {
        console.error("Error fetching lab settings:", error);
        toast({ title: "Error Loading Lab Settings", description: "Could not fetch lab details. Using defaults.", variant: "destructive" });
        labDetailsHookForm.reset({
          labName: DEFAULT_LAB_NAME,
          labAddress: DEFAULT_LAB_ADDRESS,
        });
      }
    };
    fetchLabSettings();

  }, [labDetailsHookForm, authToken, toast]); // Added authToken and toast as dependencies

  const handleDarkModeChange = (checked: boolean) => {
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
     toast({ title: "Appearance Updated", description: `Dark mode ${checked ? 'enabled' : 'disabled'}.` });
  };

  const handleChangePassword: SubmitHandler<PasswordFormValues> = async (data) => {
    setIsChangingPassword(true);
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please re-login to change password.", variant: "destructive" });
      router.push('/');
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
            title: 'Password Changed Successfully',
            description: result.message || 'Your password has been updated.',
        });
        passwordHookForm.reset();
      } else {
        toast({
            title: 'Password Change Failed',
            description: result.message || 'Could not change password. Please check current password.',
            variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({ title: 'Password Change Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveLabDetails: SubmitHandler<LabDetailsFormValues> = async (data) => {
    setIsSavingLabDetails(true);
    if (!authToken) {
      toast({ title: "Authentication Error", description: "Please re-login.", variant: "destructive" });
      router.push('/');
      setIsSavingLabDetails(false);
      return;
    }
    try {
      const namePayload = { value: data.labName };
      const addressPayload = { value: data.labAddress || DEFAULT_LAB_ADDRESS };

      const [nameResponse, addressResponse] = await Promise.all([
        fetch(`${BACKEND_API_URL}/settings/${LAB_NAME_SETTING_KEY}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify(namePayload),
        }),
        fetch(`${BACKEND_API_URL}/settings/${LAB_ADDRESS_SETTING_KEY}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify(addressPayload),
        })
      ]);

      const nameResult = await nameResponse.json();
      const addressResult = await addressResponse.json();

      if (nameResponse.ok && nameResult.success && addressResponse.ok && addressResult.success) {
        toast({ title: "Lab Details Updated", description: "Lab name and address have been saved." });
        labDetailsHookForm.reset({ labName: data.labName, labAddress: data.labAddress || DEFAULT_LAB_ADDRESS });
      } else {
        let errorMsg = "Could not save lab details. ";
        if (!nameResponse.ok || !nameResult.success) errorMsg += `Lab Name Error: ${nameResult.message || 'Unknown error'}. `;
        if (!addressResponse.ok || !addressResult.success) errorMsg += `Lab Address Error: ${addressResult.message || 'Unknown error'}.`;
        toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Network Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingLabDetails(false);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Settings</CardTitle>
          <CardDescription>Configure system preferences and account details.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6 bg-card p-1 rounded-lg shadow-sm">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-5 w-5" /> Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="lab_details" className="flex items-center gap-2">
            <Building className="h-5 w-5" /> Lab Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...passwordHookForm}>
                <form onSubmit={passwordHookForm.handleSubmit(handleChangePassword)} className="space-y-6">
                  <FormField
                    control={passwordHookForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <RHFFormLabel htmlFor="currentPassword">Current Password *</RHFFormLabel>
                        <FormControl><Input id="currentPassword" type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordHookForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <RHFFormLabel htmlFor="newPassword">New Password *</RHFFormLabel>
                        <FormControl><Input id="newPassword" type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordHookForm.control}
                    name="confirmNewPassword"
                    render={({ field }) => (
                      <FormItem>
                        <RHFFormLabel htmlFor="confirmNewPassword">Confirm New Password *</RHFFormLabel>
                        <FormControl><Input id="confirmNewPassword" type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isChangingPassword}>
                    {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Change Password
                  </Button>
                  <Separator />
                  <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <UILabel htmlFor="twoFactorAuth" className="flex flex-col space-y-1">
                      <span>Two-Factor Authentication (2FA)</span>
                      <span className="font-normal leading-snug text-muted-foreground">
                        Enhance your account security with an extra layer of protection. (Feature coming soon)
                      </span>
                    </UILabel>
                    <Switch id="twoFactorAuth" disabled />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                <UILabel htmlFor="darkMode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Switch to a darker interface.
                  </span>
                </UILabel>
                {isClient && (
                  <Switch
                    id="darkMode"
                    onCheckedChange={handleDarkModeChange}
                    defaultChecked={typeof window !== 'undefined' && document.documentElement.classList.contains('dark')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab_details">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Lab Details</CardTitle>
              <CardDescription>Define your laboratory's name and address for display on reports and bills.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...labDetailsHookForm}>
                <form onSubmit={labDetailsHookForm.handleSubmit(handleSaveLabDetails)} className="space-y-6">
                  <FormField
                    control={labDetailsHookForm.control}
                    name="labName"
                    render={({ field }) => (
                      <FormItem>
                        <RHFFormLabel htmlFor="labName">Laboratory Name *</RHFFormLabel>
                        <FormControl><Input id="labName" placeholder="Enter your lab's name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={labDetailsHookForm.control}
                    name="labAddress"
                    render={({ field }) => (
                      <FormItem>
                        <RHFFormLabel htmlFor="labAddress">Laboratory Address & Contact *</RHFFormLabel>
                        <FormControl>
                          <Textarea
                            id="labAddress"
                            placeholder="Enter your lab's full address, phone, and email...\ne.g., 123 Lab Lane, Science City, ST 54321\nPhone: (555) 123-4567 | Email: contact@yourlab.com"
                            {...field}
                            value={field.value ?? ''}
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingLabDetails || !labDetailsHookForm.formState.isDirty}>
                    {isSavingLabDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Lab Details
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
