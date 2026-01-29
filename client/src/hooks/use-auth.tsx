import { createContext, useContext, ReactNode, useState } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { insertUserSchema, type User, type InsertUser, loginSchema, type PublicUser, registerSchema, } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { z } from "zod";
import { register } from "module";


type AuthContextType = {
  user: PublicUser | null | undefined;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ user: PublicUser; token: string }, Error, z.infer<typeof loginSchema>>;
  logoutMutation: UseMutationResult<{message: string}, Error, void>;
  registerMutation: UseMutationResult<{ user: PublicUser; token: string }, Error, z.infer<typeof registerSchema>>;
  loggingOut: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();

  const setUserInLocalStorage = (
    userId: string | number,
    username: string
  ) => {
    localStorage.setItem("userId", String(userId));
    localStorage.setItem("username", username);
  }


  const getUserQuery = async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      try {
        const res = await fetch(api.auth.me.path, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUserInLocalStorage(data.id, data.username);
        return data;
      } catch (e) {
        localStorage.removeItem("token");
        return null;
      }
    };

  const {
    data: user,
    error: data,
    isLoading,
  } = useQuery<PublicUser | null>({
    queryKey: [api.auth.me.path],
    queryFn: getUserQuery,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      const res = await apiRequest("POST", api.auth.login.path, credentials);
      return res.json();
    },
    onSuccess: (data: { user: PublicUser; token: string }) => {
      localStorage.setItem("token", data.token);
      setUserInLocalStorage(data.user.id, data.user.username);
      queryClient.setQueryData([api.auth.me.path], data.user);
    },
    onError: (error) => {
      console.log("Login error:", error.message);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof registerSchema>) => {
      const res = await apiRequest("POST", api.auth.register.path, credentials);
      return res.json();
    },
    onSuccess: (data: { user: PublicUser; token: string }) => {
      localStorage.setItem("token", data.token);
      setUserInLocalStorage(data.user.id, data.user.username);
      queryClient.setQueryData([api.auth.me.path], data.user);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const headers: HeadersInit = {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      };
      setLoggingOut(true);
      const res = await apiRequest("POST", api.auth.logout.path, undefined, headers);
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        queryClient.clear();
        setLoggingOut(false);
        toast({
        title: "Logged out successfully",
        variant: "default",
        });
    },
    onError: (error: Error) => {
      setLoggingOut(false);
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: data,
        loginMutation,
        logoutMutation,
        registerMutation,
        loggingOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
