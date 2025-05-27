"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function LogoutConfirmationModal({ isOpen, onClose, onConfirm, isLoggingOut }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Confirm Logout</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to log out? You will need to log in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoggingOut}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Yes, Log Out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 