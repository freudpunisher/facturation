"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Layout from "@/components/kokonutui/layout"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { type InvoiceItem, invoiceItemColumns } from "@/components/data-table/columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Plus, Printer, FileText, Edit, Trash2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toaster"
import PrintableInvoice from "@/components/print/PrintableInvoice";


// Types based on your schema
interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  createdAt: string;
  address?: string; // Optional as it's not in the schema but in your UI
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId: number;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: "paid" | "pending" | "overdue";
  createdAt: string;
}

interface InvoiceDetail {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number; // Generated always as SQL
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { toast } = useToast();

  // State variables
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<{[key: string]: InvoiceDetail[]}>({});
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
const [printingInvoiceItems, setPrintingInvoiceItems] = useState<InvoiceDetail[]>([]);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleteInvoiceAlertOpen, setIsDeleteInvoiceAlertOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [clientFormData, setClientFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    invoiceNumber: "",
    // Removed issueDate and dueDate
    totalAmount: "0", // Start with 0
    taxAmount: "0", // Start with 0
    status: "pending" as "paid" | "pending" | "overdue",
    invoice_type: 'FN',
    payment_type: 0,
    invoice_currency: 'BIF',
    tp_fiscal_center:'DMC'
  });

  const [itemFormData, setItemFormData] = useState({
    description: "",
    quantity: "1",
    unitPrice: "",
    invoiceId: ""
  });

  //fetch client bills
  const fetchclientbills = async () => {
    // Fetch invoices for this client
    try {
    const invoicesResponse = await fetch(`/api/invoices?clientId=${clientId}`);
    if (!invoicesResponse.ok) {
      throw new Error('Failed to fetch invoices');
    }
    const invoicesData = await invoicesResponse.json();
    setInvoices(invoicesData);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An unknown error occurred');
  } 
  }

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintingInvoice(null);
      setPrintingInvoiceItems([]);
    };
  
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch client
        const clientResponse = await fetch(`/api/clients/${clientId}`);
        if (!clientResponse.ok) {
          throw new Error('Failed to fetch client data');
        }
        const clientData = await clientResponse.json();
        setClient(clientData);
        setClientFormData({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          company: clientData.company,
          address: clientData.address || "",
        });
        
        // Fetch invoices for this client
        await fetchclientbills();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  // Fetch invoice items when an invoice is expanded
  useEffect(() => {
    const fetchInvoiceItems = async (invoiceId: string) => {
      try {
        const response = await fetch(`/api/invoice-items?invoiceId=${invoiceId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch invoice items');
        }
        const data = await response.json();
        setInvoiceItems(prev => ({ ...prev, [invoiceId]: data }));
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'Failed to fetch invoice items',
          variant: "destructive",
        });
      }
    };
    
    if (expandedInvoice && !invoiceItems[expandedInvoice]) {
      fetchInvoiceItems(expandedInvoice);
    }
  }, [expandedInvoice, toast]);



  

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInvoiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInvoiceStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "paid" | "pending" | "overdue";
    setInvoiceFormData(prev => ({ ...prev, status: value }));
  };

  const handleItemInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemFormData(prev => ({ ...prev, [name]: value }));
  };

  // Update client
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/clients`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(clientId),
          name: clientFormData.name,
          email: clientFormData.email,
          phone: clientFormData.phone,
          company: clientFormData.company,
          // Add other fields as needed
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      // Refresh client data
      const updatedClient = await response.json();
      setClient(updatedClient);
      setIsEditClientOpen(false);
      
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update client',
        variant: "destructive",
      });
    }
  };

  // Create new invoice
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate a unique invoice number (e.g., using timestamp)
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Create the invoice with all fields
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceNumber, // Automatically generated
          clientId: parseInt(clientId),
          totalAmount: 0, // Start with 0, will be updated when items are added
          taxAmount: 0, // Start with 0, will be updated when items are added
          status: invoiceFormData.status,
          invoice_type: invoiceFormData.invoice_type,
          payment_type: parseInt(invoiceFormData.payment_type.toString()), // Ensure it's an integer
          invoice_currency: invoiceFormData.invoice_currency,
          tp_fiscal_center: invoiceFormData.tp_fiscal_center,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }
      
      // Get the newly created invoice
      const newInvoice = await response.json();
      
      // Refresh the invoices list
      const invoicesResponse = await fetch(`/api/invoices?clientId=${clientId}`);
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData);
      
      // Set the newly created invoice as the selected one for adding items
      setExpandedInvoice(newInvoice.id.toString());
      setSelectedInvoiceId(newInvoice.id.toString());
      
      // Close the new invoice dialog
      setIsNewInvoiceOpen(false);
      
      // Open the add item dialog automatically
      setIsNewItemOpen(true);
      
      toast({
        title: "Success",
        description: "Invoice created successfully. Add items to this invoice.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to create invoice',
        variant: "destructive",
      });
    }
  };
  

  const updateInvoiceTotal = async (invoiceId: string) => {
    try {
      // Get the current items
      const items = invoiceItems[invoiceId] || [];
      
      // Calculate new total
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        return sum + (itemTotal || 0);
      }, 0);
      
      // Assume tax is 10% of subtotal (adjust as needed)
      const taxAmount = subtotal * 0.1;
      const totalAmount = subtotal + taxAmount;
      
      // Update the invoice
      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(invoiceId),
          totalAmount: totalAmount,
          taxAmount: taxAmount,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update invoice totals');
      }
      
      // Refresh invoices
      const invoicesResponse = await fetch(`/api/invoices?clientId=${clientId}`);
      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update invoice totals',
        variant: "destructive",
      });
    }
  };



  // Add new invoice item
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    
    try {
      const response = await fetch('/api/invoice-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: parseInt(selectedInvoiceId),
          description: itemFormData.description,
          quantity: parseInt(itemFormData.quantity),
          unitPrice: parseFloat(itemFormData.unitPrice),
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add invoice item');
      }
  
      // Refresh invoice items
      const itemsResponse = await fetch(`/api/invoice-items?invoiceId=${selectedInvoiceId}`);
      const itemsData = await itemsResponse.json();
      setInvoiceItems(prev => ({ ...prev, [selectedInvoiceId]: itemsData }));
      
      // Update invoice totals
      // await updateInvoiceTotal(selectedInvoiceId);
     
      await fetchclientbills();
      // Reset form or keep dialog open depending on needs
      setItemFormData({
        description: "",
        quantity: "1",
        unitPrice: "",
        invoiceId: ""
      });
      
      toast({
        title: "Success",
        description: "Item added successfully and invoice total updated",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add item',
        variant: "destructive",
      });
    }
  };

  const toggleInvoiceExpand = (invoiceId: string) => {
    if (expandedInvoice === invoiceId) {
      setExpandedInvoice(null);
    } else {
      setExpandedInvoice(invoiceId);
    }
  };

  // Delete client
  const handleDeleteClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: parseInt(clientId) }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setIsDeleteAlertOpen(false);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
      
      // Navigate back to clients list
      router.push('/clients');
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete client',
        variant: "destructive",
      });
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoiceId) return;
    
    try {
      const response = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: parseInt(selectedInvoiceId) }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      // Update invoices list
      setInvoices(invoices.filter(invoice => invoice.id.toString() !== selectedInvoiceId));
      setIsDeleteInvoiceAlertOpen(false);
      setSelectedInvoiceId(null);
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete invoice',
        variant: "destructive",
      });
    }
  };

  const printInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
      if (!invoice || !client) return;
  
      // Fetch items if not already loaded
      if (!invoiceItems[invoiceId]) {
        const response = await fetch(`/api/invoice-items?invoiceId=${invoiceId}`);
        if (!response.ok) throw new Error('Failed to fetch items');
        const items = await response.json();
        setInvoiceItems(prev => ({ ...prev, [invoiceId]: items }));
        console.log(items, "items");
        setPrintingInvoiceItems(items);
      } else {
        setPrintingInvoiceItems(invoiceItems[invoiceId]);
      }
  
      setPrintingInvoice(invoice);
      
      // Wait for state update and trigger print
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to print',
        variant: "destructive",
      });
    }
  };

  const printInvoicePdf = (invoiceId: string) => {
    // Implement PDF generation
    alert("PDF generation would happen here");
  };

  // Calculate total outstanding amount
  const calculateOutstandingAmount = () => {
    return invoices
      .filter(inv => inv.status !== "paid")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>Loading client data...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Client not found</AlertDescription>
        </Alert>
        <Button className="mt-4" asChild>
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/clients">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Clients
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Client Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditClientOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Client
            </Button>
          </div>
        </div>

        {/* Client Details Card */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">{client.name}</h2>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {client.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {client.phone}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Company:</span> {client.company}
                </p>
                {clientFormData.address && (
                  <p className="text-sm">
                    <span className="font-medium">Address:</span> {clientFormData.address}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Summary</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Client since:</span>{" "}
                  {new Date(client.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Total invoices:</span> {invoices.length}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Outstanding amount:</span>{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "BIF",
                  }).format(calculateOutstandingAmount())}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Billing History</h2>
            <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
  <form onSubmit={handleInvoiceSubmit}>
    <DialogHeader>
      <DialogTitle>Create New Invoice</DialogTitle>
      <DialogDescription>Create a new invoice for this client. You'll add items next.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="invoiceNumber" className="text-right">
          Invoice #
        </Label>
        <Input
          id="invoiceNumber"
          name="invoiceNumber"
          value={invoiceFormData.invoiceNumber}
          onChange={handleInvoiceInputChange}
          className="col-span-3"
          placeholder="Will be auto-generated"
          disabled
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="invoice_type" className="text-right">
          Invoice Type
        </Label>
        <select
          id="invoice_type"
          name="invoice_type"
          value={invoiceFormData.invoice_type}
          onChange={handleInvoiceInputChange}
          className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="FN">FN - Normal Invoice</option>
          <option value="FA">FA - Advance Invoice</option>
          <option value="RC">RC - Credit Note</option>
          <option value="RHF">RHF - Non-fiscal Receipt</option>
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="tp_fiscal_center" className="text-right">
        Centre fiscal
        </Label>
        <select
          id="tp_fiscal_center"
          name="tp_fiscal_center"
          value={invoiceFormData.tp_fiscal_center}
          onChange={handleInvoiceInputChange}
          className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="DMC">DMC - Direction des Moyens Contribuables</option>
          <option value="DPMC">DPMC - Direction des Petits et Micro Contribuables</option>
          <option value="DGC">DGC - Direction des Grands contribuables</option>
          
        </select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="payment_type" className="text-right">
          Payment Type
        </Label>
        <select
          id="payment_type"
          name="payment_type"
          value={invoiceFormData.payment_type}
          onChange={handleInvoiceInputChange}
          className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="0">0 - Cash</option>
          <option value="1">1 - Check</option>
          <option value="2">2 - Bank Card</option>
          <option value="3">3 - Bank Transfer</option>
          <option value="4">4 - Mobile Money</option>
          <option value="5">5 - Other</option>
        </select>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="invoice_currency" className="text-right">
          Currency
        </Label>
        <select
          id="invoice_currency"
          name="invoice_currency"
          value={invoiceFormData.invoice_currency}
          onChange={handleInvoiceInputChange}
          className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="BIF">BIF - Burundian Franc</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
        </select>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <select
          id="status"
          name="status"
          value={invoiceFormData.status}
          onChange={handleInvoiceInputChange}
          className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2"
          required
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Create Invoice & Add Items</Button>
    </DialogFooter>
  </form>
</DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No invoices found for this client.</p>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 dark:border-[#1F1F23] rounded-lg overflow-hidden">
                  <div
  className="p-4 bg-gray-50 dark:bg-[#1F1F23] flex justify-between items-center cursor-pointer"
  onClick={() => toggleInvoiceExpand(invoice.id.toString())}
>
  <div className="flex items-center space-x-4">
    <span className="font-medium">{invoice.invoiceNumber}</span>
    <span>Created: {new Date(invoice.createdAt).toLocaleDateString()}</span>
    <div
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        invoice.status === "paid"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : invoice.status === "pending"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
    </div>
  </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "BIF",
                        }).format(invoice.totalAmount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          printInvoice(invoice.id.toString());
                        }}
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          printInvoicePdf(invoice.id.toString());
                        }}
                        title="Generate PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoiceId(invoice.id.toString());
                          setIsDeleteInvoiceAlertOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {printingInvoice && client && (
  <div className="printable-invoice">
    <PrintableInvoice 
      invoice={printingInvoice}
      client={client}
      invoiceItems={printingInvoiceItems}
    />
  </div>
)}

                  {expandedInvoice === invoice.id.toString() && (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Invoice Items</h3>
                        <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => setSelectedInvoiceId(invoice.id.toString())}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <form onSubmit={handleItemSubmit}>
                              <DialogHeader>
                                <DialogTitle>Add Invoice Item</DialogTitle>
                                <DialogDescription>Add a new item to this invoice.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="description" className="text-right">
                                    Description
                                  </Label>
                                  <Input
                                    id="description"
                                    name="description"
                                    value={itemFormData.description}
                                    onChange={handleItemInputChange}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="quantity" className="text-right">
                                    Quantity
                                  </Label>
                                  <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    min="1"
                                    value={itemFormData.quantity}
                                    onChange={handleItemInputChange}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="unitPrice" className="text-right">
                                    Unit Price
                                  </Label>
                                  <Input
                                    id="unitPrice"
                                    name="unitPrice"
                                    type="number"
                                    step="0.01"
                                    value={itemFormData.unitPrice}
                                    onChange={handleItemInputChange}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit">Add Item</Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {invoiceItems[invoice.id.toString()] ? (
                        invoiceItems[invoice.id.toString()].length > 0 ? (
                          <DataTable 
                            columns={invoiceItemColumns} 
                            data={invoiceItems[invoice.id.toString()].map(item => ({
                              id: item.id.toString(),
                              description: item.description,
                              quantity: item.quantity,
                              unitPrice: item.unitPrice,
                              total: item.total || (item.quantity * item.unitPrice)
                            }))} 
                          />
                        ) : (
                          <p className="text-center py-4 text-gray-500">No items found for this invoice.</p>
                        )
                      ) : (
                        <p className="text-center py-4">Loading invoice items...</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent>
          <form onSubmit={handleClientSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>Update client information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={clientFormData.name}
                  onChange={handleClientInputChange}
                  className="col-span-3"
                  required
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
                  value={clientFormData.email}
                  onChange={handleClientInputChange}
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
                  value={clientFormData.phone}
                  onChange={handleClientInputChange}
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
                  value={clientFormData.company}
                  onChange={handleClientInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={clientFormData.address}
                  onChange={handleClientInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and all associated invoices from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Invoice Alert */}
      <AlertDialog open={isDeleteInvoiceAlertOpen} onOpenChange={setIsDeleteInvoiceAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice and all associated items from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>    
  );
}