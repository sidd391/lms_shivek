
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Edit3, KeyRound, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel as RHFFormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const NO_TITLE_VALUE = "__NO_TITLE__"; 

interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  title?: string | null;
  firstName?: string;
  lastName?: string;
}

const profileFormSchema = z.object({
  title: z.string().optional().nullable(),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().optional().nullable().refine(val => !val || val === '' || /^\+?[0-9\s-()]{7,}$/.test(val), {
    message: "Phone number must be valid or empty (at least 7 digits if provided)."
  }),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
  confirmNewPassword: z.string().min(8, 'Confirm password is required.'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ['confirmNewPassword'],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;


export default function MyProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const profileHookForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      title: '', 
      firstName: '',
      lastName: '',
      phone: '', 
    },
  });

  const passwordHookForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoadingProfile(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        toast({ title: 'Authentication Error', description: 'Please log in to view your profile.', variant: 'destructive' });
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`${BACKEND_API_URL}/auth/status`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!response.ok) {
          if (response.status === 401) {
             localStorage.removeItem('authToken');
             router.push('/');
          }
          throw new Error('Failed to fetch user profile');
        }
        const result = await response.json();
        if (result.success && result.user) {
          const userData = result.user as UserProfile;
          setUserProfile(userData);
          profileHookForm.reset({
            title: userData.title || '', 
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '', 
          });
        } else {
          throw new Error(result.message || 'Could not load profile data.');
        }
      } catch (error: any) {
        toast({ title: 'Error Loading Profile', description: error.message, variant: 'destructive' });
        localStorage.removeItem('authToken');
        router.push('/');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchUserProfile();
  }, [router, toast, profileHookForm]);

  const handleProfileUpdate: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!userProfile || !userProfile.id) {
        toast({ title: 'Error', description: 'User profile not loaded.', variant: 'destructive' });
        return;
    }
    setIsUpdatingProfile(true);
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({ title: "Auth Error", description: "Please re-login.", variant: "destructive" });
      router.push('/');
      setIsUpdatingProfile(false);
      return;
    }
    
    const payload = {
      title: data.title === NO_TITLE_VALUE ? null : data.title || null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null, 
      email: userProfile.email, 
      role: userProfile.role,   
      status: 'Active', 
    };

    try {
      const response = await fetch(`${BACKEND_API_URL}/staff/${userProfile.id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: 'Profile Updated', description: 'Your profile details have been saved.' });
        const updatedUser = result.data as UserProfile; 
        setUserProfile(prev => prev ? {...prev, ...updatedUser, fullName: updatedUser.fullName || `${updatedUser.title || ''} ${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim() } : null);
        profileHookForm.reset({ 
            title: updatedUser.title || '',
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            phone: updatedUser.phone || '',
        }, { keepDirty: false });  // Reset dirty state after successful save
      } else {
        throw new Error(result.message || 'Failed to update profile.');
      }
    } catch (error: any) {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword: SubmitHandler<PasswordFormValues> = async (data) => {
    setIsChangingPassword(true);
    const authToken = localStorage.getItem('authToken');
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

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-7 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-7 w-40" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userProfile) {
    return <p>Could not load user profile. Please try logging in again.</p>;
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserCircle className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold">{userProfile.fullName || `${userProfile.firstName} ${userProfile.lastName}`}</CardTitle>
              <CardDescription>View and manage your personal information and account settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Edit3 className="mr-2 h-5 w-5"/>Personal Information</CardTitle>
          <CardDescription>Update your display name and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileHookForm}>
            <form onSubmit={profileHookForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <RHFFormLabel>Email Address (Cannot be changed)</RHFFormLabel>
                  <Input value={userProfile.email} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <RHFFormLabel>Role (System Assigned)</RHFFormLabel>
                  <Input value={userProfile.role} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={profileHookForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <RHFFormLabel htmlFor="profileTitle">Title</RHFFormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === NO_TITLE_VALUE ? '' : value)} 
                        value={field.value || NO_TITLE_VALUE}
                      >
                          <FormControl>
                            <SelectTrigger id="profileTitle"><SelectValue placeholder="Select Title" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_TITLE_VALUE}>None</SelectItem>
                            {['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileHookForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <RHFFormLabel htmlFor="profileFirstName">First Name *</RHFFormLabel>
                      <FormControl><Input id="profileFirstName" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileHookForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <RHFFormLabel htmlFor="profileLastName">Last Name *</RHFFormLabel>
                      <FormControl><Input id="profileLastName" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={profileHookForm.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <RHFFormLabel htmlFor="profilePhone">Phone Number</RHFFormLabel>
                    <FormControl><Input id="profilePhone" type="tel" {...field} value={field.value ?? ''} placeholder="e.g., +1 123 456 7890"/></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
              <Button type="submit" disabled={isUpdatingProfile || !profileHookForm.formState.isDirty}>
                {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Profile Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><KeyRound className="mr-2 h-5 w-5" />Change Password</CardTitle>
          <CardDescription>Update your account password. Choose a strong, unique password.</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Change Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
