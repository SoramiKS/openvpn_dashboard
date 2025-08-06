"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Edit, Save, Trash2, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner" // Assuming you have sonner for toasts
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // Assuming you have shadcn/ui AlertDialog

type ServerNode = {
  id: string
  name: string
  ipAddress: string
  location: string
  apiKey: string
}

type Props = {
  open: boolean
  onClose: () => void
  node: ServerNode | null
  onNodeUpdated: () => void // Callback for when a node is updated
  onNodeDeleted: () => void // Callback for when a node is deleted
}

export function ManageNodeModal({ open, onClose, node, onNodeUpdated, onNodeDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedIpAddress, setEditedIpAddress] = useState("")
  const [editedLocation, setEditedLocation] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (node) {
      setEditedName(node.name)
      setEditedIpAddress(node.ipAddress)
      setEditedLocation(node.location || "")
      setIsEditing(false) // Reset edit mode when node changes or modal opens
    }
  }, [node, open])

  if (!node) return null

  const copyApiKey = () => {
    if (node?.apiKey) {
      // Using document.execCommand('copy') for better compatibility in iFrames
      const textarea = document.createElement('textarea');
      textarea.value = node.apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        toast.success("API Key copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy API Key:", err);
        toast.error("Failed to copy API Key. Please copy manually.");
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  const handleSave = async () => {
    if (!editedName.trim() || !editedIpAddress.trim()) {
      toast.error("Name and IP Address cannot be empty.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/servers/${node.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName.trim(),
          ipAddress: editedIpAddress.trim(),
          location: editedLocation.trim(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to update node")
      }

      toast.success("Node updated successfully!")
      setIsEditing(false)
      onNodeUpdated() // Trigger refresh in parent component
    } catch (err: any) {
      console.error("Failed to update node:", err)
      toast.error(err.message || "Failed to update node.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/servers/${node.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Failed to delete node")
      }

      toast.success("Node deleted successfully!")
      onClose() // Close modal
      onNodeDeleted() // Trigger refresh in parent component
    } catch (err: any) {
      console.error("Failed to delete node:", err)
      toast.error(err.message || "Failed to delete node.")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false) // Close confirmation dialog
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Node: {node.name}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edit node details." : "View node details and API Key."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Node Name */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Node Name</p>
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Node Name"
                />
              ) : (
                <p className="font-semibold">{node.name}</p>
              )}
            </div>

            {/* IP Address */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">IP Address</p>
              {isEditing ? (
                <Input
                  value={editedIpAddress}
                  onChange={(e) => setEditedIpAddress(e.target.value)}
                  placeholder="IP Address"
                />
              ) : (
                <p className="font-mono text-sm">{node.ipAddress}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
              {isEditing ? (
                <Input
                  value={editedLocation}
                  onChange={(e) => setEditedLocation(e.target.value)}
                  placeholder="Location (optional)"
                />
              ) : (
                <p>{node.location || "Unknown"}</p>
              )}
            </div>

            {/* API Key */}
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">API Key</p>
              <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded font-mono text-xs break-all select-all">
                <span>{node.apiKey}</span>
                <Button variant="ghost" size="sm" onClick={copyApiKey} className="ml-auto">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2 mt-4">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !editedName.trim() || !editedIpAddress.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Node
                    </>
                  )}
                </Button>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Node
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              <span className="font-bold"> {node.name}</span> node and all associated users and logs from the database.
              Make sure you have also removed the agent from your server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
