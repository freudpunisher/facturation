"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Printer,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
} from "lucide-react";
import PrintableInvoice from "@/components/print/PrintableInvoice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster"
import Layout from "@/components/kokonutui/layout";

interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  taxAmount: number;
  status: "paid" | "pending" | "overdue";
  sync: boolean;
  client: Client;
}

interface Client {
  id: number;
  name: string;
  company: string;
  address?: string;
  email: string;
  phone: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export default function FacturationPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<{ [key: string]: InvoiceItem[] }>({});
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [syncFilter, setSyncFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
const {toast} = useToast();
  // Fetch invoices
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...invoices];

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(invoice => invoice.status === statusFilter);
    }

    // Apply sync filter
    if (syncFilter !== "all") {
      const syncValue = syncFilter === "synced";
      result = result.filter(invoice => invoice.sync === syncValue);
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.client.name.toLowerCase().includes(term) ||
        invoice.client.company.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date-asc":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "date-desc":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "amount-asc":
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case "amount-desc":
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "number-asc":
        result.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
        break;
      case "number-desc":
        result.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
        break;
    }

    setFilteredInvoices(result);
  }, [invoices, statusFilter, syncFilter, searchTerm, sortBy]);

  // Fetch invoice items when expanding
  const fetchInvoiceItems = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/invoice-items?invoiceId=${invoiceId}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const items = await response.json();
      setInvoiceItems(prev => ({ ...prev, [invoiceId]: items }));
      console.log(items,"test ")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    }
  };

  const handleExpand = async (invoiceId: number) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
    } else {
      if (!invoiceItems[invoiceId]) {
        await fetchInvoiceItems(invoiceId);
      }
      setExpandedInvoiceId(invoiceId);
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => window.print(), 100);
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    
    try {
      const response = await fetch(`/api/invoices/${selectedInvoice}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete invoice");
      
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice));
      setDeleteDialogOpen(false);
      toast({
        title: "Invoice deleted",
        description: "The invoice has been permanently removed.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      toast({
        title: "Error",
        description: "Failed to delete the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };




  

  const handleSync = async (invoiceId: number) => {
    setIsUpdating(invoiceId);
    try {
      // 1. Get the invoice data
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error("Invoice not found");
  
      // 2. Get invoice items if not already loaded
      if (!invoiceItems[invoiceId]) {
        await fetchInvoiceItems(invoiceId);
      }
  
      // 3. Authenticate with EBMS API to get token
      const authResponse = await fetch(`${process.env.NEXT_PUBLIC_EBMS_API_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: process.env.NEXT_PUBLIC_EBMS_USERNAME,
          password: process.env.NEXT_PUBLIC_EBMS_PASSWORD
        })
      });
  
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(`Authentication failed: ${errorData.message || 'Unknown error'}`);
      }
  
      const { token, result } = await authResponse.json();
      console.log(result.token,'tokennnnnn')
  
      // 4. Transform data to EBMS format
      const ebmsInvoice = transformToEBMSFormat(invoice);
  
      // 5. Submit to EBMS API with the token
      const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_EBMS_API_URL}/addInvoice_confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.token}`
        },
        body: JSON.stringify(ebmsInvoice)
      });
  
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`EBMS sync failed: ${errorData.message || 'Unknown error'}`);
      }
  // 6. Parse the EBMS API response
  const ebmsResult = await submitResponse.json();
  const { invoice_registered_number, invoice_registered_date } = ebmsResult.result;

  // 7. Post the registered number and date to the taxes API
  const taxResponse = await fetch('/api/taxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId: invoiceId, // Use the invoiceId from the function parameter
      invoice_registered_date: invoice_registered_date,
      authorityReference: invoice_registered_number,
    }),
  });

  if (!taxResponse.ok) {
    const errorData = await taxResponse.json();
    throw new Error(`Failed to create tax record: ${errorData.error || 'Unknown error'}`);
  }

  // 8. Update local database and state
  const updateResponse = await fetch(`/api/invoices/${invoiceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sync: true }),
  });

  if (!updateResponse.ok) throw new Error("Failed to update sync status");

  // Update local state
  setInvoices(prev =>
    prev.map(inv =>
      inv.id === invoiceId
        ? { ...inv, sync: true }
        : inv
    )
  );

  toast({
    title: "Sync Successful",
    description: "Invoice synchronized with EBMS and tax record created",
  });
} catch (error) {
  console.error("Sync Error:", error);
  toast({
    title: "Sync Failed",
    description: error instanceof Error ? error.message : "Failed to sync invoice",
    variant: "destructive",
  });
} finally {
  setIsUpdating(null);
}
};

// Add the transform function
const transformToEBMSFormat = (invoice: Invoice) => {
  // Ensure we have the invoice items
  const items = invoiceItems[invoice.id] || [];
  console.log("Invoice Items for Transformation:", invoiceItems[invoice.id]); // Log the items

  // Format date to YYYYMMDDHHMMSS
  const formatEBMSDate = (dateString: string) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const d = new Date(dateString);
    
    // Get UTC time parts
    const year = d.getUTCFullYear();
    const month = pad(d.getUTCMonth() + 1); // Months are 0-based in JS
    const day = pad(d.getUTCDate());
    const hours = pad(d.getUTCHours());
    const minutes = pad(d.getUTCMinutes());
    const seconds = pad(d.getUTCSeconds());
  
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  // Calculate VAT (18%)
  const calculateVAT = (amount: number) => {
    return Number((amount * 0.18).toFixed(2));
  };

  // Split invoice number (assuming format "0001/2021")
  const [invoiceSequence] = invoice.invoiceNumber.split('/');
  
  // Format date to YYYY-MM-DD
  const invoiceDate = new Date(invoice.createdAt).toISOString().split('.')[0].replace('T', ' ');
console.log(invoiceDate, "invoiceDateFormatted");
const date = new Date(invoice.createdAt).toISOString().split('T')[0];

console.log(formatEBMSDate(invoice.createdAt))
  
  
  return {
    invoice_number: invoice.invoiceNumber,
    invoice_date: invoiceDate,
    invoice_type: "FN", // Normal invoice
    tp_type: "1", // Type of taxpayer
    tp_name: "CERTRAG",
    tp_TIN: "4000003568", // Replace with actual company TIN
    tp_trade_number: "65905", // Replace with actual company TIN
    customer_name: invoice.client.name,
    customer_address: invoice.client.address || "",
    invoice_currency: "BIF",
    tp_phone_number:"79764778",
    tp_address_province:"BUJUMBURA",
    tp_address_commune:"NTAHANGWA",
    tp_address_quartier:"Kigobe",
    tp_address_avenue:"Rukambara",
    tp_address_number:"28", // Replace with an appropriate value
    vat_taxpayer:"1",
    ct_taxpayer:"0",
    tl_taxpayer:"0",
    tp_fiscal_center:"DMC",
    tp_activity_sector:"construction",
    tp_legal_form:"su",
    payment_type:"1",
    invoice_identifier: [
      "4000003568",
      process.env.NEXT_PUBLIC_EBMS_USERNAME,
      formatEBMSDate(invoice.createdAt),
      invoiceSequence.padStart(5, '0') // Ensure 5-digit sequence
    ].join('/'),
    invoice_items: items.map(item => ({
      item_designation: item.description,
      item_quantity: item.quantity.toString(),
      item_price: item.unitPrice,
      item_ct: "1", // Tax category
      item_tl: "18", // Tax rate (18%)
      item_price_nvat: ((item.quantity * item.unitPrice) - calculateItemTax(item)),
      vat: calculateItemTax(item),
      item_price_wvat: (item.quantity * item.unitPrice),
      item_total_amount: (item.quantity * item.unitPrice)
    })),
    // invoice_vat_amount: invoice.taxAmount,
    // invoice_payable_amount: invoice.totalAmount
  };
};

// Helper function to calculate tax for an item
const calculateItemTax = (item: InvoiceItem) => {
  return (item.quantity * item.unitPrice) * 0.18 / 1.18; // Assuming 18% VAT, extracting from total
}

  const resetFilters = () => {
    setStatusFilter("all");
    setSyncFilter("all");
    setSearchTerm("");
    setSortBy("date-desc");
  };

  if (isLoading) return <Layout><div className="p-4">Loading invoices...</div></Layout>;
  if (error) return <Layout><div className="p-4 text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Invoices</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/invoices/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
            <Button variant="outline" onClick={fetchInvoices}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search by invoice# or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={syncFilter} onValueChange={setSyncFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sync" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sync</SelectItem>
                <SelectItem value="synced">Synced</SelectItem>
                <SelectItem value="unsynced">Unsynced</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <h3 className="font-medium">Sort By</h3>
                  <div className="space-y-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Date (Newest)</SelectItem>
                        <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                        <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                        <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                        <SelectItem value="number-desc">Invoice# (Z-A)</SelectItem>
                        <SelectItem value="number-asc">Invoice# (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Results summary */}
        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>

        {/* Invoices list */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center border rounded-lg">
              <p className="text-gray-500">No invoices match your filters</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={resetFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            filteredInvoices.map(invoice => (
              <div key={invoice.id} className="border rounded-lg shadow-sm">
                <div className="p-4 flex items-center justify-between ">
                  <div 
                    className="flex items-center space-x-4 cursor-pointer" 
                    onClick={() => handleExpand(invoice.id)}
                  >
                    {expandedInvoiceId === invoice.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                    <div>
                      <span className="font-medium">#{invoice.invoiceNumber}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {invoice.sync}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status.toUpperCase()}
                      </span>
                      {invoice.sync && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          SYNCED
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      ${invoice.totalAmount}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrint(invoice)}
                      title="Print Invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    {!invoice.sync && (
                      <Button
  variant="outline"
  size="sm"
  className="text-blue-600 hover:text-blue-700"
  onClick={() => handleSync(invoice.id)}
  disabled={isUpdating === invoice.id}
  title="Sync Invoice"
>
  <RefreshCw className={`h-4 w-4 ${isUpdating === invoice.id ? 'animate-spin' : ''}`} />
</Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(invoice.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Invoice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedInvoiceId === invoice.id && (
                  <div className="p-4 border-t">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Client Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{invoice.client.name}</p>
                          <p>{invoice.client.company}</p>
                          {invoice.client.address && <p>{invoice.client.address}</p>}
                        </div>
                        <div>
                          <p>
                            <span className="text-gray-500 mr-2">Email:</span>
                            {invoice.client.email}
                          </p>
                          <p>
                            <span className="text-gray-500 mr-2">Phone:</span>
                            {invoice.client.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <h3 className="font-medium mb-2">Invoice Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Quantity</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Unit Price</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems[invoice.id]?.length > 0 ? (
                            invoiceItems[invoice.id].map(item => (
                              <tr key={item.id} className="border-t">
                                <td className="px-4 py-2">{item.description}</td>
                                <td className="px-4 py-2 text-right">{item.quantity}</td>
                                <td className="px-4 py-2 text-right">${item.unitPrice}</td>
                                <td className="px-4 py-2 text-right">
                                  ${(item.total !== undefined ? item.total : (item.quantity * item.unitPrice))}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                                Loading items...
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot >
                          <tr className="border-t">
                            <td colSpan={3} className="px-4 py-2 text-right font-medium">Subtotal:</td>
                            <td className="px-4 py-2 text-right font-medium">
                              ${(invoice.totalAmount - invoice.taxAmount)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-right font-medium">Tax:</td>
                            <td className="px-4 py-2 text-right">${invoice.taxAmount}</td>
                          </tr>
                          <tr className="border-t">
                            <td colSpan={3} className="px-4 py-2 text-right font-medium">Total:</td>
                            <td className="px-4 py-2 text-right font-bold">${invoice.totalAmount}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Print Dialog */}
        {printingInvoice && (
          <div className="hidden print-block">
            <PrintableInvoice
              invoice={printingInvoice}
              client={printingInvoice.client}
              invoiceItems={invoiceItems[printingInvoice.id] || []}
            />
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the invoice.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}