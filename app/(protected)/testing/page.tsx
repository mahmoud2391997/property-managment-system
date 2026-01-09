'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, FileText, AlertCircle } from 'lucide-react';

const invoices = [
  { id: 'INV-001', description: 'January 2026 Rent', dueDate: '2026-01-15', amount: 1200.00, status: 'due', overdue: true },
  { id: 'INV-002', description: 'Utilities - December 2025', dueDate: '2026-01-05', amount: 156.50, status: 'due', overdue: true },
  { id: 'INV-003', description: 'Maintenance Fee', dueDate: '2026-01-20', amount: 75.00, status: 'due', overdue: false },
  { id: 'INV-004', description: 'Parking Fee', dueDate: '2026-01-10', amount: 100.00, status: 'due', overdue: true },
  { id: 'INV-005', description: 'November 2025 Rent', dueDate: '2025-12-01', amount: 1200.00, status: 'paid', overdue: false },
  { id: 'INV-006', description: 'December 2025 Rent', dueDate: '2026-01-01', amount: 1200.00, status: 'paid', overdue: false },
];

function App() {
  const dueInvoices = invoices.filter(inv => inv.status === 'due');
  const totalDue = dueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const handlePayAll = () => {
    alert(`Proceeding to pay full amount: $${totalDue.toFixed(2)}`);
    // Integrate your payment gateway here
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Your Invoices</h1>
            <p className="mt-2 text-sm text-gray-600">
              All due invoices must be paid in full at once. Partial or individual payments are not allowed.
            </p>
          </div>
        </header>

        {/* Total Due Banner (visible on larger screens) */}
        {totalDue > 0 && (
          <div className="hidden md:block bg-blue-600 text-white">
            <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold">Total Amount Due:</span>
                <span className="ml-3 text-3xl font-bold">${totalDue.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePayAll}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
              >
                Pay All Due
              </button>
            </div>
          </div>
        )}

        {/* Invoices List */}
        <main className="max-w-6xl mx-auto px-4 py-8 pb-32 md:pb-8">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className={inv.status === 'due' ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                      {inv.overdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">${inv.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className={`bg-white rounded-lg shadow p-5 ${inv.status === 'paid' ? 'opacity-75' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{inv.id}</h3>
                    <p className="text-sm text-gray-600 mt-1">{inv.description}</p>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {inv.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {inv.overdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span>{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">${inv.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Mobile Sticky Footer */}
        {totalDue > 0 && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg">
            <div className="px-4 py-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm text-gray-600">Total Due</p>
                  <p className="text-2xl font-bold text-gray-900">${totalDue.toFixed(2)}</p>
                </div>
                <button
                  onClick={handlePayAll}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Pay All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;