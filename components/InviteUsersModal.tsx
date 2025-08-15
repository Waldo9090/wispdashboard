"use client"

import { useState, useEffect } from "react"
import { X, Search, UserPlus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { collection, setDoc, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface AuthorizedUser {
  id: string
  email: string
}

interface InviteUsersModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InviteUsersModal({ isOpen, onClose }: InviteUsersModalProps) {
  const [email, setEmail] = useState("")
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, userId: string, userEmail: string} | null>(null)

  // Load authorized users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAuthorizedUsers()
    }
  }, [isOpen])

  const loadAuthorizedUsers = async () => {
    try {
      setLoading(true)
      const authorizedUsersRef = collection(db, 'authorizedUsers')
      const snapshot = await getDocs(authorizedUsersRef)
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email
      }))
      
      setAuthorizedUsers(users)
    } catch (error) {
      console.error('Error loading authorized users:', error)
      toast.error('Failed to load authorized users')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setIsInviting(true)
      
      // Create document with email as the document ID
      const emailLower = email.trim().toLowerCase()
      const userDocRef = doc(db, 'authorizedUsers', emailLower)
      
      // Set the document with email as the ID and email field
      await setDoc(userDocRef, {
        email: email.trim(),
        invitedAt: new Date(),
        invitedBy: 'current-user' // You can replace this with actual user info if needed
      })

      toast.success(`Successfully invited ${email.trim()}`)
      setEmail("")
      
      // Reload the authorized users list
      await loadAuthorizedUsers()
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Failed to invite user. They may already be authorized.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    // Show confirmation dialog first
    setDeleteConfirmation({ show: true, userId, userEmail })
  }

  const confirmDeleteUser = async () => {
    if (!deleteConfirmation) return
    
    try {
      await deleteDoc(doc(db, 'authorizedUsers', deleteConfirmation.userId))
      toast.success(`Removed ${deleteConfirmation.userEmail} from authorized users`)
      await loadAuthorizedUsers()
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Failed to remove user')
    } finally {
      setDeleteConfirmation(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Share</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email for example: john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>
            <Button
              onClick={handleInvite}
              disabled={isInviting || !email.trim()}
              className="w-full"
            >
              {isInviting ? 'Adding...' : 'Add'}
            </Button>
          </div>

          {/* Authorized Users List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Authorized Users</h3>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading users...
              </div>
            ) : authorizedUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No authorized users yet
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {authorizedUsers.map((user) => (
                  <Card key={user.id} className="border border-border">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{user.email}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id, user.email)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Confirm Delete</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to remove <span className="font-medium text-foreground">{deleteConfirmation.userEmail}</span> from authorized users?
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                className="flex-1"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
