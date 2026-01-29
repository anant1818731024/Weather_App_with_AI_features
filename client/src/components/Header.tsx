import { useAuth } from '@/hooks/use-auth';
import { Loader2, LogOut, Settings, UserIcon } from 'lucide-react';
import React from 'react'
import { Link, useLocation } from 'wouter';
import { Button } from './ui/button';
import { log } from 'console';

const Header = () => {
    const { user, logoutMutation, loggingOut } = useAuth();
    const [, setLocation] = useLocation();
    
  return (
    <header className="w-full fixed flex items-center justify-between px-4 py-3 bg-white/50 backdrop-blur-md shadow-md rounded-md z-50 top-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.8-3.2-3.7-5.6-7.1-5.6H6c-3.3 0-6 2.7-6 6s2.7 6 6 6h11.5c1.9 0 3.5-1.6 3.5-3.5Z"/><path d="M22 10.5V6a2 2 0 0 0-2-2h-3l-2.5-3H9.5L7 4H4a2 2 0 0 0-2 2v2"/><path d="M16 10a4 4 0 0 0-4-4"/></svg>
              </div>
              <h1 className="gap-2 lg:gap-4 flex justify-between text-2xl font-bold font-display tracking-tight text-foreground items-center">
                <Link to = "/" className="inline-flex items-center">Atmosphere</Link> 
                {!user && <button onClick={() => setLocation("/auth")} className="ml-[30px] text-sm md:text-lg text-primary font-semibold underline underline-offset-4">
                  Login/Sign up
                </button>}
              </h1>
            </div>
            
            {user && <div className="flex items-center md:gap-4 lg:mt-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="w-4 h-4" />
                <span>{user?.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/profile")}
                title="Profile Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logoutMutation.mutate()}
                title="Logout"
              >
                {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              </Button>
            </div>}
          </header>
  )
}

export default Header
