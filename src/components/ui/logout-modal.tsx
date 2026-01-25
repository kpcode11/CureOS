"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogoutModal({ open, onOpenChange }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({
        callbackUrl: "/login",
        redirect: true,
      });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Sign out of CureOS?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Are you sure you want to sign out? You'll need to sign in again to
            access your account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-2xl"
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full sm:w-auto rounded-2xl"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
