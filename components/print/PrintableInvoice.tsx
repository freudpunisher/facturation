import React from "react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
}

interface Client {
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
}

export default function PrintableInvoice({
  invoice,
  client,
  invoiceItems,
}: {
  invoice: Invoice;
  client: Client;
  invoiceItems: InvoiceItem[];
}) {
  return (
    <div className="p-10 bg-white max-w-3xl mx-auto   print:p-0">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">INVOICE</h1>
          <p className="text-gray-600">Invoice #: {invoice.invoiceNumber}</p>
          <p className="text-gray-600">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p className="text-gray-600">Status: 
            <span className={`ml-2 px-2 py-1 rounded text-white {invoice.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}>
              {invoice.status.toUpperCase()}
            </span>
          </p>
        </div>
        {/* Company Logo */}
        <div className="w-32 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
          Your Logo Here
        </div>
      </div>

      {/* Billing Info */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <h2 className="font-semibold text-gray-700">Billed By:</h2>
          <p className="text-gray-800">Your Company Name</p>
          <p className="text-gray-600">NIF: 01248523</p>
          <p className="text-gray-600">RC: 6253</p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-700">Billed To:</h2>
          <p className="text-gray-800">{client.name}</p>
          <p className="text-gray-600">{client.company}</p>
          {client.address && <p className="text-gray-600">{client.address}</p>}
          <p className="text-gray-600">{client.email}</p>
          <p className="text-gray-600">{client.phone}</p>
        </div>
      </div>

      {/* Invoice Table */}
      <table className="w-full border-collapse border border-gray-200 mb-8">
        <thead>
          <tr className="bg-gray-100 border-b border-gray-200 text-gray-700">
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-right">Quantity</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-200 text-gray-800">
              <td className="p-3">{item.description}</td>
              <td className="p-3 text-right">{item.quantity}</td>
              <td className="p-3 text-right">{item.unitPrice}</td>
              <td className="p-3 text-right">{(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice Summary */}
      <div className="flex justify-end text-gray-800 mb-8">
        <div className="w-1/2">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Subtotal:</span>
            <span>{(invoice.totalAmount - invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>TVA (18%):</span>
            <span>{invoice.taxAmount}</span>
          </div>
          <div className="flex justify-between py-3 text-lg font-bold">
            <span>Total:</span>
            <span>{invoice.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Signature & Notes */}
      <div className="flex justify-between items-center text-gray-700">
        <div>
          <h3 className="text-sm font-semibold">Authorized Signature:</h3>
          <div className="w-40 h-12 border-b border-gray-400 mt-2"></div>
          <p className="text-xs">Your Name</p>
          <p className="text-xs">Your Position</p>
        </div>
        <div>
          <p className="text-xs italic text-gray-600">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
