"use client"

import * as React from "react"
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

interface DeleteProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileName: string
  onConfirm: () => Promise<void>
}

export function DeleteProfileDialog({
  open,
  onOpenChange,
  profileName,
  onConfirm,
}: DeleteProfileDialogProps) {
  const [loading, setLoading] = React.useState(false)

  const deletionDate = new Date()
  deletionDate.setDate(deletionDate.getDate() + 7)
  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Delete Profile
          </DialogTitle>
          <DialogDescription className="text-left pt-2 space-y-3">
            <p>
              Are you sure you want to delete <span className="font-medium text-gray-900">{profileName}</span>&apos;s profile?
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
              <p className="font-medium mb-1">7-Day Grace Period</p>
              <ul className="list-disc list-inside space-y-1 text-orange-700">
                <li>The profile will be permanently deleted on <span className="font-medium">{formattedDate}</span></li>
                <li>The user will be blocked from logging in</li>
                <li>You can cancel the deletion at any time before then</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Profile'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
