"use client"

import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, FileText, Calendar, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import Layout from '@/components/kokonutui/layout';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: string;
  }

  const [clients, setClients] = useState<Client[]>([]);
  interface Invoice {
    id: number;
    invoiceNumber: string;
    clientId: number;
    createdAt: string;
    totalAmount: number;
    taxAmount: number;
    status: string;
  }

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from your API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Replace these URLs with your actual API endpoints
        const clientsRes = await fetch('/api/clients');
        const invoicesRes = await fetch('/api/invoices');
        const detailsRes = await fetch('/api/invoice-items');
        const taxesRes = await fetch('/api/taxes');

        if (!clientsRes.ok || !invoicesRes.ok || !detailsRes.ok || !taxesRes.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const clientsData = await clientsRes.json();
        const invoicesData = await invoicesRes.json();
        const detailsData = await detailsRes.json();
        const taxesData = await taxesRes.json();

        setClients(clientsData);
        setInvoices(invoicesData);
        setInvoiceDetails(detailsData);
        setTaxes(taxesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate metrics for overview
  const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
  const totalTax = invoices.reduce((sum, invoice) => sum + Number(invoice.taxAmount), 0);
  const activeClients = clients.filter(client => client.status === 'active').length;
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
  const overdueInvoices = invoices.filter(invoice => invoice.status === 'overdue').length;

  // Data for charts
  const statusData = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length, color: '#4caf50' },
    { name: 'Pending', value: invoices.filter(i => i.status === 'pending').length, color: '#ff9800' },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, color: '#f44336' },
  ];

  const revenueByClient = clients.map(client => {
    const clientInvoices = invoices.filter(invoice => invoice.clientId === client.id);
    return {
      name: client.name,
      revenue: clientInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Helper function to get client name by id
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>

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
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{totalTax.toLocaleString()}</div>
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
                          <span className="text-sm font-medium">{client.revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `{(client.revenue / totalRevenue * 100)}%` }}
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
                  {clients.map((client) => (
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
                    <TableHead>Created</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(invoice.clientId)}</TableCell>
                      <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{Number(invoice.totalAmount).toLocaleString()}</TableCell>
                      <TableCell>{Number(invoice.taxAmount).toLocaleString()}</TableCell>
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
                    <div className="text-2xl font-bold">{totalTax.toLocaleString()}</div>
                    <p className="text-sm text-gray-500 mt-1">Across all invoices</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(totalTax / (totalRevenue - totalTax) * 100).toFixed(2)}%
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Average rate applied</p>
                  </CardContent>
                </Card>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Registered Date</TableHead>
                    <TableHead>Tax Amount</TableHead>
                    <TableHead>Authority Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxes.map((tax, index) => {
                    const invoice = invoices.find(inv => inv.id === tax.invoiceId);
                    return (
                      <TableRow key={tax.id || index}>
                        <TableCell className="font-medium">
                          {invoice ? invoice.invoiceNumber : '-'}
                        </TableCell>
                        <TableCell>
                          {invoice ? getClientName(invoice.clientId) : '-'}
                        </TableCell>
                        <TableCell>{tax.invoice_registered_date}</TableCell>
                        <TableCell>
                          {invoice ? Number(invoice.taxAmount).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>{tax.authorityReference || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  );
};

export default Dashboard;