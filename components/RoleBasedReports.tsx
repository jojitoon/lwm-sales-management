'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconPackage,
  IconUsers,
  IconCurrencyDollar,
  IconChartBar,
} from '@tabler/icons-react';
import { SalesSummaryReport } from './SalesSummaryReport';
import { StockMovementReport } from './StockMovementReport';
import { RequestStatusReport } from './RequestStatusReport';
import { UserPerformanceReport } from './UserPerformanceReport';
import { FinancialSummaryReport } from './FinancialSummaryReport';
import { SessionClosingReport } from './SessionClosingReport';

interface RoleBasedReportsProps {
  workspace: string;
  isAdmin: boolean;
  userId: string;
}

export function RoleBasedReports({
  workspace,
  isAdmin,
  userId,
}: RoleBasedReportsProps) {
  const [selectedTab, setSelectedTab] = useState('sales-summary');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', selectedTab, dateRange, workspace],
    queryFn: async () => {
      const response = await axios.get('/api/reports', {
        params: {
          type: selectedTab,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          workspace,
        },
      });
      return response.data;
    },
  });

  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'sales-summary', label: 'Sales Summary', icon: IconTrendingUp },
      { id: 'stock-movement', label: 'Stock Movement', icon: IconPackage },
    ];

    if (isAdmin) {
      return [
        ...baseTabs,
        { id: 'request-status', label: 'Request Status', icon: IconUsers },
        {
          id: 'user-performance',
          label: 'User Performance',
          icon: IconChartBar,
        },
        {
          id: 'financial-summary',
          label: 'Financial Summary',
          icon: IconCurrencyDollar,
        },
        {
          id: 'session-closing',
          label: 'Session Closing',
          icon: IconTrendingDown,
        },
      ];
    }

    // Role-specific tabs
    switch (workspace) {
      case 'main-store':
        return [
          ...baseTabs,
          { id: 'request-status', label: 'Request Status', icon: IconUsers },
        ];
      case 'mini-store':
        return [
          ...baseTabs,
          { id: 'request-status', label: 'Request Status', icon: IconUsers },
        ];
      case 'table-manager':
      case 'book-sales':
        return baseTabs;
      case 'pre-order':
        return [
          ...baseTabs,
          {
            id: 'financial-summary',
            label: 'Financial Summary',
            icon: IconCurrencyDollar,
          },
        ];
      default:
        return baseTabs;
    }
  };

  const availableTabs = getAvailableTabs();

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>Loading report data...</div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className='flex justify-center items-center h-64'>
          <div className='text-gray-500'>No data available</div>
        </div>
      );
    }

    switch (selectedTab) {
      case 'sales-summary':
        return (
          <SalesSummaryReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      case 'stock-movement':
        return (
          <StockMovementReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      case 'request-status':
        return (
          <RequestStatusReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      case 'user-performance':
        return (
          <UserPerformanceReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      case 'financial-summary':
        return (
          <FinancialSummaryReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      case 'session-closing':
        return (
          <SessionClosingReport
            data={reportData.data}
            workspace={workspace}
            isAdmin={isAdmin}
          />
        );
      default:
        return <div>Report not available</div>;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and report type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4 items-center'>
            <div>
              <label className='text-sm font-medium'>From:</label>
              <input
                type='date'
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className='ml-2 px-3 py-1 border rounded'
              />
            </div>
            <div>
              <label className='text-sm font-medium'>To:</label>
              <input
                type='date'
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className='ml-2 px-3 py-1 border rounded'
              />
            </div>
            <Badge variant='outline' className='ml-4'>
              {workspace.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className='grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          {availableTabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className='flex items-center gap-2'
            >
              <tab.icon className='h-4 w-4' />
              <span className='hidden sm:inline'>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className='mt-6'>
            {renderReportContent()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
