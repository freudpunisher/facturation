"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { type Client, clientColumns } from "@/components/data-table/columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, AlertCircle } from "lucide-react"
import Layout from "@/components/kokonutui/layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toaster"

export default function ClientsPage() {
  // State variables
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    nif: "",
    phone: "",
    company: "",
    status: "active",
  })
  const { toast } = useToast()

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Function to fetch clients from API
  const fetchClients = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      
      // Transform data to match expected Client interface if needed
      const formattedClients = data.map((client: any) => ({
        id: client.id.toString(),
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        status: client.status,
        createdAt: new Date(client.createdAt).toISOString().split('T')[0],
      }))
      
      setClients(formattedClients)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission for adding a new client
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          nif: formData.nif,
          phone: formData.phone,
          company: formData.company,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add client')
      }

      // Refresh client list
      await fetchClients()
      
      // Reset form and close dialog
      resetForm()
      setIsAddDialogOpen(false)
      
      // Show success toast
      toast({
        title: "Success",
        description: "Client added successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add client',
        variant: "destructive",
      })
    }
  }

  // Handle form submission for updating a client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(formData.id),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      // Refresh client list
      await fetchClients()
      
      // Reset form and close dialog
      resetForm()
      setIsEditDialogOpen(false)
      
      // Show success toast
      toast({
        title: "Success",
        description: "Client updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update client',
        variant: "destructive",
      })
    }
  }

  // Handle client deletion
  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await fetch('/api/clients', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: parseInt(id) }),
        })

        if (!response.ok) {
          throw new Error('Failed to delete client')
        }

        // Refresh client list
        await fetchClients()
        
        // Show success toast
        toast({
          title: "Success",
          description: "Client deleted successfully",
        })
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to delete client',
          variant: "destructive",
        })
      }
    }
  }

  // Function to open edit dialog with client data
  const openEditDialog = (client: Client) => {
    setFormData({
      id: client.id,
      name: client.name,
      email: client.email,
      nif: client.nif,
      phone: client.phone,
      company: client.company,
      status: client.status,
    })
    setIsEditDialogOpen(true)
  }

  // Reset form data
  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      email: "",
      nif: "",
      phone: "",
      company: "",
      status: "active",
    })
  }

  // Extend client columns with actions
  const columnsWithActions = [
    ...clientColumns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Client } }) => (
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => openEditDialog(row.original)}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleDeleteClient(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clients</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddClient}>
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>Fill in the details to add a new client to your system.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nif" className="text-right">
                      NIF
                    </Label>
                    <Input
                      id="nif"
                      name="nif"
                      value={formData.nif}
                      onChange={handleInputChange}
                      className="col-span-3"
                      
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">
                      Company
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Client</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          {isLoading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : (
            <DataTable 
              columns={columnsWithActions} 
              data={clients} 
              searchColumn="name" 
              searchPlaceholder="Search clients..." 
            />
          )}
        </div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateClient}>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>Update client information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company" className="text-right">
                  Company
                </Label>
                <Input
                  id="edit-company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <select
                  id="edit-status"
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Client</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}