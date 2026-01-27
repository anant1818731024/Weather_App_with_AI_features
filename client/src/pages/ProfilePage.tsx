import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserInput } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, ArrowLeft, User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { z } from "zod";
import { api } from "@shared/routes";
import { on } from "events";

/* ---------------- Password Schema ---------------- */

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      )
      .refine((val) => !/\s/.test(val), {
        message: "Password must not contain spaces",
      }),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);

  /* ---------------- Read-only Profile Form ---------------- */

  const profileForm = useForm<z.infer<typeof api.user.update.input>>({
    resolver: zodResolver(api.user.update.input),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      profileImageUrl: "",
    },
  });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                username: user.username ?? "",
                email: user.email ?? "",
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
                profileImageUrl: user.profileImageUrl ?? "",
            });

        }
    }, [user, profileForm]);

  /* ---------------- Password Form ---------------- */

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onUpdatePassword = async (data: ChangePasswordValues) => {
    setIsUpdatingPassword(true);
    try {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      await apiRequest("Post", api.user.changePassword.path, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }, headers);

      passwordForm.reset();
      toast({ title: "Password updated successfully" });
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const onProfileUpdate = async (data: UpdateUserInput) => {
    setIsProfileUpdating(true);
    try {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
        if(user?.username === data.username){
            delete data.username;
        }
        if(user?.email === data.email){
            delete data.email;
        }
      const updatedUser = await apiRequest("PATCH", api.user.update.path, data, headers);
      queryClient.setQueryData([api.auth.me.path], await updatedUser.json());
      toast({ title: "Profile updated successfully" });
    } catch (error: any) {
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProfileUpdating(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold font-display">Profile</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* -------- Profile (Read-only) -------- */}

            <Card className="glass-panel border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  This information is currently read-only.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileUpdate)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field}/>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" {...field} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="profileImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="outline" disabled={isProfileUpdating}>
                      {isProfileUpdating && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Profile
                    </Button> 
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* -------- Change Password -------- */}

            <Card className="glass-panel border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onUpdatePassword)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" variant="outline" disabled={isUpdatingPassword}>
                      {isUpdatingPassword && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
