"use client";

import { useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/kokonutui/layout";

type Tax = {
  id: number;
  invoice: {
    id: number;
    invoiceNumber: string;
    createdAt: string;
  };
  invoice_registered_date: string;
  authorityReference: string | null;
  createdAt: string;
  status?: 'active' | 'canceled';
};

export default function TaxPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");
  const [invoiceIdFilter, setInvoiceIdFilter] = useState("");
  
  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Tax | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  
  useEffect(() => {
    fetchTaxes();
  }, [currentPage, dateFilter, referenceFilter, invoiceIdFilter]);
  
  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/taxes");
      
      if (!response.ok) {
        throw new Error("Failed to fetch taxes");
      }
      
      const data = await response.json();
      
      // Apply filters
      let filteredData = data;
      
      if (dateFilter) {
        filteredData = filteredData.filter((tax: Tax) => 
          tax.invoice_registered_date.includes(dateFilter)
        );
      }
      
      if (referenceFilter) {
        filteredData = filteredData.filter((tax: Tax) => 
          tax.authorityReference?.toLowerCase().includes(referenceFilter.toLowerCase())
        );
      }
      
      if (invoiceIdFilter) {
        filteredData = filteredData.filter((tax: Tax) => 
          tax.invoice.invoiceNumber.toString().includes(invoiceIdFilter)
        );
      }
      
      // Calculate pagination
      setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
      
      // Slice the data for the current page
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setTaxes(paginatedData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  const onView = async (invoice: Tax) => {
    try {
      // Extract invoice sequence from invoice number
      const [invoiceSequence] = invoice.invoice.invoiceNumber.split('/');
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
      
      // Create the invoice identifier with proper formatting
      const invoice_identifier = [
        process.env.NEXT_PUBLIC_EBMS_NIF,
        process.env.NEXT_PUBLIC_EBMS_USERNAME,
        formatEBMSDate(invoice.invoice.createdAt),
        invoiceSequence.padStart(5, '0') // Ensure 5-digit sequence
      ].join('/');
      
      // Authenticate with the EBMS API
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
      
      // Handle authentication errors
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(`Authentication failed: ${errorData.message || 'Unknown error'}`);
      }
      
      // Extract token from authentication response
      const authData = await authResponse.json();
      const token = authData.result.token;
      
      // Submit the invoice identifier to EBMS API
      const submitResponse = await fetch(`${process.env.NEXT_PUBLIC_EBMS_API_URL}/getInvoice/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_identifier: invoice_identifier
        })
      });
      
      // Handle submission response
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(`Invoice submission failed: ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await submitResponse.json();
      console.log(result, 'result');
      
      // Store the invoice data in localStorage (or you could use a state management solution)
      localStorage.setItem('ebmsInvoiceData', JSON.stringify(result));
      
      // Navigate to the invoice detail page
      window.location.href = `/tax/invoice/${invoice.id}`;
      
    } catch (error) {
      console.error("Error in onView function:", error);
      alert(`Error fetching invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onCancel = async () => {
    if (!selectedInvoice || !cancellationReason) {
      alert("Please provide a cancellation reason");
      return;
    }

    try {
      // Extract invoice sequence from invoice number
      const [invoiceSequence] = selectedInvoice.invoice.invoiceNumber.split('/');
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
      
      // Create the invoice identifier with proper formatting
      const invoice_identifier = [
        process.env.NEXT_PUBLIC_EBMS_NIF,
        process.env.NEXT_PUBLIC_EBMS_USERNAME,
        formatEBMSDate(selectedInvoice.invoice.createdAt),
        invoiceSequence.padStart(5, '0') // Ensure 5-digit sequence
      ].join('/');
      
      // Authenticate with the EBMS API
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
      
      // Handle authentication errors
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(`Authentication failed: ${errorData.message || 'Unknown error'}`);
      }
      
      // Extract token from authentication response
      const authData = await authResponse.json();
      const token = authData.result.token;
      
      // Cancel the invoice through EBMS API
      const cancelResponse = await fetch(`${process.env.NEXT_PUBLIC_EBMS_API_URL}/cancelInvoice/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoice_identifier: invoice_identifier,
          cn_motif: cancellationReason
        })
      });
      
      // Handle cancellation response
      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json();
        throw new Error(`Invoice cancellation failed: ${errorData.message || 'Unknown error'}`);
      }
      
      // Update local state
      const updatedTaxes = taxes.map(tax => 
        tax.id === selectedInvoice.id 
          ? { ...tax, status: 'canceled' } as Tax
          : tax
      );
      setTaxes(updatedTaxes);
      
      // Update database via local API
      await fetch(`/api/taxes/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'canceled',
          cancellationReason: cancellationReason
        })
      });
      
      // Close modal and reset state
      setIsCancelModalOpen(false);
      setSelectedInvoice(null);
      setCancellationReason("");
      
    } catch (error) {
      console.error("Error in onCancel function:", error);
      alert(`Error cancelling invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearFilters = () => {
    setDateFilter("");
    setReferenceFilter("");
    setInvoiceIdFilter("");
    setCurrentPage(1);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Generate pagination links
  const generatePaginationLinks = () => {
    const links = [];
    
    // Previous button
    links.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    // First page
    links.push(
      <PaginationItem key="1">
        <PaginationLink 
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis if needed
    if (currentPage > 3) {
      links.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue;
      links.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis if needed
    if (currentPage < totalPages - 2) {
      links.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page
    if (totalPages > 1) {
      links.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    links.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );
    
    return links;
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Taxes Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Invoice ID</label>
                <Input
                  type="text"
                  placeholder="Filter by Invoice ID"
                  value={invoiceIdFilter}
                  onChange={(e) => setInvoiceIdFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input
                  type="text"
                  placeholder="Filter by Date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Authority Reference</label>
                <Input
                  type="text"
                  placeholder="Filter by Reference"
                  value={referenceFilter}
                  onChange={(e) => setReferenceFilter(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 text-center">{error}</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Authority Reference</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxes.length > 0 ? (
                        taxes.map((tax) => (
                          <TableRow key={tax.id}>
                            <TableCell>{tax.id}</TableCell>
                            <TableCell>{tax.invoice.invoiceNumber}</TableCell>
                            <TableCell>{tax.invoice_registered_date}</TableCell>
                            <TableCell>{tax.authorityReference || "-"}</TableCell>
                            <TableCell>{formatDate(tax.createdAt)}</TableCell>
                            <TableCell>
                              <span className={`
                                px-2 py-1 rounded text-xs font-medium
                                ${tax.status === 'canceled' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'}
                              `}>
                                {tax.status }
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onView(tax)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {tax.status !== 'canceled' && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => {
                                      setSelectedInvoice(tax);
                                      setIsCancelModalOpen(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No taxes found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {taxes.length > 0 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        {generatePaginationLinks()}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Cancel Invoice Modal */}
        <Dialog 
          open={isCancelModalOpen} 
          onOpenChange={() => {
            setIsCancelModalOpen(false);
            setSelectedInvoice(null);
            setCancellationReason("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Invoice</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this invoice
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label htmlFor="cancellation-reason" className="block mb-2 text-sm font-medium">
                Cancellation Reason
              </label>
              <Input 
                id="cancellation-reason"
                placeholder="Enter cancellation reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setSelectedInvoice(null);
                  setCancellationReason("");
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={onCancel}
                disabled={!cancellationReason}
              >
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}