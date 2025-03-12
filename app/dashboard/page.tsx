import React, { useState } from 'react';
import { Bar, Pie } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, FileText, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Mock data based on the schema
const mockClients = [
  { id: 1, name: 'Acme Corp', email: 'contact@acme.com', phone: '555-1234', company: 'Acme Corporation', status: 'active' },
  { id: 2, name: 'Globex Inc', email: 'info@globex.com', phone: '555-5678', company: 'Globex International', status: 'active' },
  { id: 3, name: 'Wayne Enterprises', email: 'bruce@wayne.com', phone: '555-9012', company: 'Wayne Enterprises', status: 'inactive' },
  { id: 4, name: 'Stark Industries', email: 'tony@stark.com', phone: '555-3456', company: 'Stark Industries', status: 'active' },
];

const mockInvoices = [
  { id: 1, invoiceNumber: 'INV-001', clientId: 1, totalAmount: 1250.00, taxAmount: 250.00, status: 'paid', createdAt: '2025-02-15' },
  { id: 2, invoiceNumber: 'INV-002', clientId: 2, totalAmount: 3750.00, taxAmount: 750.00, status: 'pending', createdAt: '2025-02-28' },
  { id: 3, invoiceNumber: 'INV-003', clientId: 1, totalAmount: 500.00, taxAmount: 100.00, status: 'overdue', createdAt: '2025-01-31' },
  { id: 4, invoiceNumber: 'INV-004', clientId: 4, totalAmount: 2000.00, taxAmount: 400.00, status: 'pending', createdAt: '2025-03-05' },
  { id: 5, invoiceNumber: 'INV-005', clientId: 3, totalAmount: 1800.00, taxAmount: 360.00, status: 'paid', createdAt: '2025-03-10' },
];

const mockDetails = [
  { id: 1, invoiceId: 1, description: 'Web Development', quantity: 25, unitPrice: 50.00, total: 1250.00 },
  { id: 2, invoiceId: 2, description: 'Consulting Services', quantity: 15, unitPrice: 250.00, total: 3750.00 },
  { id: 3, invoiceId: 3, description: 'Design Work', quantity: 10, unitPrice: 50.00, total: 500.00 },
  { id: 4, invoiceId: 4, description: 'System Maintenance', quantity: 20, unitPrice: 100.00, total: 2000.00 },
  { id: 5, invoiceId: 5, description: 'Software License', quantity: 3, unitPrice: 600.00, total: 1800.00 },
];

// Dashboard component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate metrics for overview
  const totalRevenue = mockInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
  const totalTax = mockInvoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount), 0);
  const activeClients = mockClients.filter(client => client.status === 'active').length;
  const pendingInvoices = mockInvoices.filter(invoice => invoice.status === 'pending').length;
  const overdueInvoices = mockInvoices.filter(invoice => invoice.status === 'overdue').length;

  // Data for charts
  const statusData = [
    { name: 'Paid', value: mockInvoices.filter(i => i.status === 'paid').length, color: '#4caf50' },
    { name: 'Pending', value: mockInvoices.filter(i => i.status === 'pending').length, color: '#ff9800' },
    { name: 'Overdue', value: mockInvoices.filter(i => i.status === 'overdue').length, color: '#f44336' },
  ];

  const revenueByClient = mockClients.map(client => {
    const clientInvoices = mockInvoices.filter(invoice => invoice.clientId === client.id);
    return {
      name: client.name,
      revenue: clientInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Helper function to get client name by id
  const getClientName = (clientId: number) => {
    const client = mockClients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Invoice Management Dashboard</h1>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeClients}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInvoices}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
                <FileText className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalTax.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <div className="flex items-center justify-center h-full">
                  {statusData.map((entry, index) => (
                    <div key={index} className="mx-4 text-center">
                      <div className="text-2xl font-bold">{entry.value}</div>
                      <div className="mt-1 flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                        <span>{entry.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueByClient.slice(0, 4).map((client, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{client.name}</span>
                          <span className="text-sm font-medium">${client.revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(client.revenue / totalRevenue * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>Manage your client database</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.company}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Records</CardTitle>
              <CardDescription>Track and manage all invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell>{invoice.createdAt}</TableCell>
                      <TableCell>${invoice.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>${invoice.taxAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Taxes Tab */}
        <TabsContent value="taxes">
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary</CardTitle>
              <CardDescription>Tax collection and reporting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalTax.toLocaleString()}</div>
                    <p className="text-sm text-gray-500 mt-1">Across all invoices</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">20%</div>
                    <p className="text-sm text-gray-500 mt-1">Standard rate applied</p>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tax Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell>{invoice.createdAt}</TableCell>
                      <TableCell>${invoice.taxAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;