"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Layout from "@/components/kokonutui/layout";

// Define types for the API response
type InvoiceItem = {
  item_designation: string;
  item_quantity: string;
  item_price: string;
  item_ct: string;
  item_tl: string;
  item_ott_tax: string;
  item_tsce_tax: string;
  item_price_nvat: string;
  vat: string;
  item_price_wvat: string;
  item_total_amount: string;
};

type Invoice = {
  invoice_number: string;
  invoice_date: string;
  tp_type: string;
  tp_name: string;
  tp_TIN: string;
  tp_trade_number: string;
  tp_postal_number: string;
  tp_phone_number: string;
  tp_address_province: string;
  tp_address_commune: string;
  tp_address_quartier: string;
  tp_address_avenue: string;
  tp_address_rue: string;
  tp_address_number: string;
  vat_taxpayer: string;
  ct_taxpayer: string;
  tl_taxpayer: string;
  tp_fiscal_center: string;
  tp_activity_sector: string;
  tp_legal_form: string;
  payment_type: string;
  invoice_currency: string;
  customer_name: string;
  customer_TIN: string;
  customer_address: string;
  vat_customer_payer: string;
  invoice_type: string;
  cancelled_invoice_ref: string;
  cancelled_invoice: string;
  cn_motif: string;
  invoice_ref: string;
  invoice_identifier: string;
  invoice_items: InvoiceItem[];
};

type EBMSResponse = {
  success: boolean;
  msg: string;
  result: {
    invoices: Invoice[];
  };
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, you would get this data from a route parameter or state
  // For this example, we'll simulate retrieving the data from localStorage
  useEffect(() => {
    // This would normally come from a URL parameter and API call
    // For demo purposes, we're assuming the data is in localStorage
    try {
      const storedData = localStorage.getItem('ebmsInvoiceData');
      if (storedData) {
        const parsedData: EBMSResponse = JSON.parse(storedData);
        if (parsedData.success && parsedData.result.invoices.length > 0) {
          setInvoiceData(parsedData.result.invoices[0]);
        } else {
          setError("No invoice data found");
        }
      }
    } catch (err) {
      setError("Failed to load invoice data");
      console.error(err);
    }
  }, []);

  // Calculate totals
  const calculateTotals = () => {
    if (!invoiceData?.invoice_items) return { total: 0, vatTotal: 0 };
    
    return invoiceData.invoice_items.reduce(
      (acc, item) => {
        const amount = parseFloat(item.item_total_amount);
        const vat = parseFloat(item.vat);
        
        return {
          total: acc.total + amount,
          vatTotal: acc.vatTotal + vat,
        };
      },
      { total: 0, vatTotal: 0 }
    );
  };

  const { total, vatTotal } = calculateTotals();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-BI', {
      style: 'currency',
      currency: invoiceData?.invoice_currency || 'BIF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get payment type label
  const getPaymentTypeLabel = (type: string) => {
    const paymentTypes: Record<string, string> = {
      "1": "Cash",
      "2": "Credit Card",
      "3": "Bank Transfer",
      "4": "Mobile Money",
      "5": "Other",
    };
    return paymentTypes[type] || type;
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Taxes
        </Button>

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : invoiceData ? (
          <div className="space-y-6">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold mb-3">Invoice Details</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Invoice Number:</span>
                        <span className="font-medium">{invoiceData.invoice_number}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium">{new Date(invoiceData.invoice_date).toLocaleString()}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Currency:</span>
                        <span className="font-medium">{invoiceData.invoice_currency}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="font-medium">{getPaymentTypeLabel(invoiceData.payment_type)}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Invoice Type:</span>
                        <span className="font-medium">{invoiceData.invoice_type}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Invoice ID:</span>
                        <span className="font-medium text-xs break-all">{invoiceData.invoice_identifier}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{invoiceData.customer_name}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">TIN:</span>
                        <span className="font-medium">{invoiceData.customer_TIN || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium">{invoiceData.customer_address || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold mb-3">Taxpayer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Name:</span>
                        <span className="font-medium">{invoiceData.tp_name}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">TIN:</span>
                        <span className="font-medium">{invoiceData.tp_TIN}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{invoiceData.tp_phone_number}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Trade Number:</span>
                        <span className="font-medium">{invoiceData.tp_trade_number}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Sector:</span>
                        <span className="font-medium">{invoiceData.tp_activity_sector}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Legal Form:</span>
                        <span className="font-medium">{invoiceData.tp_legal_form}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Province:</span>
                        <span className="font-medium">{invoiceData.tp_address_province}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Commune:</span>
                        <span className="font-medium">{invoiceData.tp_address_commune}</span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-medium">{`${invoiceData.tp_address_quartier}, ${invoiceData.tp_address_avenue}, ${invoiceData.tp_address_number}`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">VAT</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceData.invoice_items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.item_designation}</TableCell>
                          <TableCell className="text-right">{item.item_quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(item.item_price))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(item.vat))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(item.item_total_amount))}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={3} className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(vatTotal)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">Invoice data not found</div>
        )}
      </div>
    </Layout>
  );
}