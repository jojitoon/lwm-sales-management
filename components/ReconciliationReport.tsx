'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  IconTrendingUp,
  IconPackage,
  IconCurrencyDollar,
  IconShoppingCart,
  IconArrowRight,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface ReconciliationReportProps {
  currentSession: string;
  availableSessions: string[];
}

export function ReconciliationReport({
  currentSession,
  availableSessions,
}: ReconciliationReportProps) {
  const [selectedSession, setSelectedSession] = useState(currentSession);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Pagination states for different tables
  const [salesTablePage, setSalesTablePage] = useState(0);
  const [salesByTableTypePage, setSalesByTableTypePage] = useState(0);
  const [modalSalesPage, setModalSalesPage] = useState(0);
  const [modalTransactionsPage, setModalTransactionsPage] = useState(0);
  const [modalTablesPage, setModalTablesPage] = useState(0);
  const [modalTableSalesPage, setModalTableSalesPage] = useState(0);
  const [modalStockMovementPage, setModalStockMovementPage] = useState(0);
  const [modalClosingStockPage, setModalClosingStockPage] = useState(0);
  const [mainToMiniPage, setMainToMiniPage] = useState(0);
  const [miniToTablePage, setMiniToTablePage] = useState(0);
  const [modalBooksPage, setModalBooksPage] = useState(0);
  const [preordersPage, setPreordersPage] = useState(0);
  const [closingStocksPage, setClosingStocksPage] = useState(0);

  const PAGE_SIZE = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliation', selectedSession],
    queryFn: async () => {
      const response = await axios.get('/api/reconciliation', {
        params: {
          session: selectedSession === 'all' ? 'all' : selectedSession,
        },
      });
      return response.data;
    },
    enabled: !!selectedSession,
  });

  // Extract data with safe defaults
  const summary = data?.summary;
  const salesByTable = data?.salesByTable || [];
  const salesByTableType = data?.salesByTableType || [];
  const stockMovements = data?.stockMovements || {
    mainToMini: [],
    miniToTable: [],
  };
  const closingStocks = data?.closingStocks || [];
  const preorders = data?.preorders || [];

  // Paginated data for main sales table
  const paginatedSalesByTable = useMemo(() => {
    if (!salesByTable || salesByTable.length === 0) return [];
    const start = salesTablePage * PAGE_SIZE;
    return salesByTable.slice(start, start + PAGE_SIZE);
  }, [salesByTable, salesTablePage]);

  // Paginated data for sales by table type
  const paginatedSalesByTableType = useMemo(() => {
    if (!salesByTableType || salesByTableType.length === 0) return [];
    const start = salesByTableTypePage * PAGE_SIZE;
    return salesByTableType.slice(start, start + PAGE_SIZE);
  }, [salesByTableType, salesByTableTypePage]);

  // Paginated data for stock movements
  const paginatedMainToMini = useMemo(() => {
    if (!stockMovements?.mainToMini || stockMovements.mainToMini.length === 0)
      return [];
    const start = mainToMiniPage * PAGE_SIZE;
    return stockMovements.mainToMini.slice(start, start + PAGE_SIZE);
  }, [stockMovements?.mainToMini, mainToMiniPage]);

  const paginatedMiniToTable = useMemo(() => {
    if (!stockMovements?.miniToTable || stockMovements.miniToTable.length === 0)
      return [];
    const start = miniToTablePage * PAGE_SIZE;
    return stockMovements.miniToTable.slice(start, start + PAGE_SIZE);
  }, [stockMovements?.miniToTable, miniToTablePage]);

  // Paginated data for closing stocks
  const paginatedClosingStocks = useMemo(() => {
    if (!closingStocks || closingStocks.length === 0) return [];
    const start = closingStocksPage * PAGE_SIZE;
    return closingStocks.slice(start, start + PAGE_SIZE);
  }, [closingStocks, closingStocksPage]);

  // Paginated data for preorders
  const paginatedPreorders = useMemo(() => {
    if (!preorders || preorders.length === 0) return [];
    const start = preordersPage * PAGE_SIZE;
    return preorders.slice(start, start + PAGE_SIZE);
  }, [preorders, preordersPage]);

  // Paginated data for modal tables
  const paginatedModalSales = useMemo(() => {
    if (!modalData?.sales) return [];
    const start = modalSalesPage * PAGE_SIZE;
    return modalData.sales.slice(start, start + PAGE_SIZE);
  }, [modalData?.sales, modalSalesPage]);

  const paginatedModalBooks = useMemo(() => {
    if (!modalData?.books) return [];
    const start = modalBooksPage * PAGE_SIZE;
    return modalData.books.slice(start, start + PAGE_SIZE);
  }, [modalData?.books, modalBooksPage]);

  const paginatedModalTransactions = useMemo(() => {
    if (!modalData?.transactions) return [];
    const start = modalTransactionsPage * PAGE_SIZE;
    return modalData.transactions.slice(start, start + PAGE_SIZE);
  }, [modalData?.transactions, modalTransactionsPage]);

  const paginatedModalTables = useMemo(() => {
    if (!modalData?.tables) return [];
    const start = modalTablesPage * PAGE_SIZE;
    return modalData.tables.slice(start, start + PAGE_SIZE);
  }, [modalData?.tables, modalTablesPage]);

  const paginatedModalTableSales = useMemo(() => {
    if (!modalData?.table?.sales) return [];
    const start = modalTableSalesPage * PAGE_SIZE;
    return modalData.table.sales.slice(start, start + PAGE_SIZE);
  }, [modalData?.table?.sales, modalTableSalesPage]);

  const paginatedModalStockMovement = useMemo(() => {
    if (!modalData?.movement?.items) return [];
    const start = modalStockMovementPage * PAGE_SIZE;
    return modalData.movement.items.slice(start, start + PAGE_SIZE);
  }, [modalData?.movement?.items, modalStockMovementPage]);

  const paginatedModalClosingStock = useMemo(() => {
    if (!modalData?.closing?.remainingStock) return [];
    const start = modalClosingStockPage * PAGE_SIZE;
    return modalData.closing.remainingStock.slice(start, start + PAGE_SIZE);
  }, [modalData?.closing?.remainingStock, modalClosingStockPage]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>Loading reconciliation data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-gray-500'>No data available</div>
      </div>
    );
  }

  // Helper function to render pagination controls
  const renderPagination = (
    currentPage: number,
    setPage: (page: number) => void,
    totalItems: number,
    pageSize: number = PAGE_SIZE
  ) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const start = currentPage * pageSize + 1;
    const end = Math.min((currentPage + 1) * pageSize, totalItems);

    if (totalPages <= 1) return null;

    return (
      <div className='flex items-center justify-between px-4 py-4 border-t'>
        <div className='text-sm text-muted-foreground'>
          Showing {start} to {end} of {totalItems} items
        </div>
        <div className='flex items-center gap-2'>
          <div className='text-sm text-muted-foreground'>
            Page {currentPage + 1} of {totalPages}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Session Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Session Filter</CardTitle>
          <CardDescription>
            Select a session to view reconciliation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className='w-full max-w-sm'>
              <SelectValue placeholder='Select session' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Sessions</SelectItem>
              {availableSessions.map((session) => (
                <SelectItem key={session} value={session}>
                  {session}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card
          className='cursor-pointer hover:bg-card transition-colors'
          onClick={() => {
            setModalTitle('All Sales Details');
            setModalData({
              type: 'all-sales',
              sales: salesByTable.flatMap((table: any) =>
                table.sales.map((sale: any) => ({
                  ...sale,
                  tableId: table.tableId,
                  tableName: table.tableName,
                }))
              ),
            });
            setModalSalesPage(0); // Reset pagination
            setModalOpen(true);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Sales</CardTitle>
            <IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₦{summary.totalSales.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Click to view all sales
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:bg-card transition-colors'
          onClick={() => {
            setModalTitle('All Books Sold');
            const allBooks: Record<
              string,
              { quantity: number; price: number; sales: any[] }
            > = {};
            salesByTable.forEach((table: any) => {
              table.sales.forEach((sale: any) => {
                sale.items.forEach((item: any) => {
                  const bookTitle = item.book.title;
                  if (!allBooks[bookTitle]) {
                    allBooks[bookTitle] = {
                      quantity: 0,
                      price: item.price,
                      sales: [],
                    };
                  }
                  allBooks[bookTitle].quantity += item.quantity;
                  allBooks[bookTitle].sales.push({
                    ...item,
                    saleOrderNumber: sale.orderNumber,
                    tableId: table.tableId,
                    tableName: table.tableName,
                  });
                });
              });
            });
            setModalData({
              type: 'books-sold',
              books: Object.entries(allBooks).map(([title, data]) => ({
                title,
                ...data,
              })),
            });
            setModalOpen(true);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Items Sold</CardTitle>
            <IconShoppingCart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.totalItemsSold}</div>
            <p className='text-xs text-muted-foreground'>
              Click to view by book
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:bg-card transition-colors'
          onClick={() => {
            setModalTitle('All Transactions');
            setModalData({
              type: 'transactions',
              transactions: salesByTable.flatMap((table: any) =>
                table.sales.map((sale: any) => ({
                  ...sale,
                  tableId: table.tableId,
                  tableName: table.tableName,
                }))
              ),
            });
            setModalTransactionsPage(0); // Reset pagination
            setModalOpen(true);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Transactions</CardTitle>
            <IconTrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {summary.totalTransactions}
            </div>
            <p className='text-xs text-muted-foreground'>
              Click to view details
            </p>
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:bg-card transition-colors'
          onClick={() => {
            setModalTitle('Sales by Table');
            setModalData({
              type: 'tables',
              tables: salesByTable,
            });
            setModalTablesPage(0); // Reset pagination
            setModalOpen(true);
          }}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Tables</CardTitle>
            <IconPackage className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.totalTables}</div>
            <p className='text-xs text-muted-foreground'>
              Click to view breakdown
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue='sales-by-type' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='sales-by-type'>Sales by Table Type</TabsTrigger>
          <TabsTrigger value='sales'>Sales by Table</TabsTrigger>
          <TabsTrigger value='stock-movements'>Stock Movements</TabsTrigger>
          <TabsTrigger value='closing-stocks'>Closing Stocks</TabsTrigger>
          <TabsTrigger value='preorders'>Preorders</TabsTrigger>
        </TabsList>

        {/* Sales by Table Type */}
        <TabsContent value='sales-by-type' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Sales by Table Type</CardTitle>
              <CardDescription>
                Breakdown of sales grouped by table type (POS, TRANSFER, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Type</TableHead>
                      <TableHead className='text-right'>Tables</TableHead>
                      <TableHead className='text-right'>Transactions</TableHead>
                      <TableHead className='text-right'>Items Sold</TableHead>
                      <TableHead className='text-right'>Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesByTableType &&
                    paginatedSalesByTableType.length > 0 ? (
                      paginatedSalesByTableType.map((tableType: any) => (
                        <TableRow
                          key={tableType.tableType}
                          className='cursor-pointer hover:bg-card'
                          onClick={() => {
                            setModalTitle(
                              `Sales Details - ${tableType.tableType}`
                            );
                            setModalData({
                              type: 'table-type-sales',
                              tableType,
                            });
                            setModalTableSalesPage(0);
                            setModalOpen(true);
                          }}
                        >
                          <TableCell className='font-medium'>
                            {tableType.tableType}
                          </TableCell>
                          <TableCell className='text-right'>
                            {tableType.tables.length}
                          </TableCell>
                          <TableCell className='text-right'>
                            {tableType.transactionCount}
                          </TableCell>
                          <TableCell className='text-right'>
                            {tableType.totalItems}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            ₦{tableType.totalSales.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='h-24 text-center text-gray-500'
                        >
                          No sales data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(
                salesByTableTypePage,
                setSalesByTableTypePage,
                salesByTableType.length,
                PAGE_SIZE
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales by Table */}
        <TabsContent value='sales' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Sales by Individual Table</CardTitle>
              <CardDescription>
                Breakdown of sales for each table in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedSession === 'all' && (
                        <TableHead>Session</TableHead>
                      )}
                      <TableHead>Table ID</TableHead>
                      <TableHead>Table Name</TableHead>
                      <TableHead className='text-right'>Transactions</TableHead>
                      <TableHead className='text-right'>Items Sold</TableHead>
                      <TableHead className='text-right'>Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesByTable &&
                    paginatedSalesByTable.length > 0 ? (
                      paginatedSalesByTable.map((table: any) => (
                        <TableRow
                          key={table.tableId}
                          className='cursor-pointer hover:bg-card'
                          onClick={() => {
                            setModalTitle(
                              `Sales Details - ${table.tableName} (${table.tableId})`
                            );
                            setModalData({
                              type: 'table-sales',
                              table,
                            });
                            setModalTableSalesPage(0); // Reset pagination
                            setModalOpen(true);
                          }}
                        >
                          {selectedSession === 'all' && (
                            <TableCell className='font-medium'>
                              {table.session || 'Unknown'}
                            </TableCell>
                          )}
                          <TableCell className='font-medium'>
                            {selectedSession === 'all'
                              ? table.tableId.split('::')[1] || table.tableId
                              : table.tableId}
                          </TableCell>
                          <TableCell>{table.tableName}</TableCell>
                          <TableCell className='text-right'>
                            {table.transactionCount}
                          </TableCell>
                          <TableCell className='text-right'>
                            {table.totalItems}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            ₦{table.totalSales.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className='h-24 text-center text-gray-500'
                        >
                          No sales data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(
                salesTablePage,
                setSalesTablePage,
                salesByTable.length,
                PAGE_SIZE
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements */}
        <TabsContent value='stock-movements' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Main Store to Mini Store */}
            <Card>
              <CardHeader>
                <CardTitle>Main Store → Mini Store</CardTitle>
                <CardDescription>
                  Stock distributed from main store to mini stores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {paginatedMainToMini && paginatedMainToMini.length > 0 ? (
                    paginatedMainToMini.map((movement: any, index: number) => (
                      <div
                        key={index}
                        className='border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-card transition-colors'
                        onClick={() => {
                          setModalTitle(
                            `Stock Movement: ${movement.from} → ${movement.to}`
                          );
                          setModalData({
                            type: 'stock-movement',
                            movement,
                          });
                          setModalStockMovementPage(0); // Reset pagination
                          setModalOpen(true);
                        }}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{movement.from}</span>
                            <IconArrowRight className='h-4 w-4' />
                            <span className='font-medium'>{movement.to}</span>
                          </div>
                          <Badge variant='outline'>
                            {new Date(movement.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className='text-sm text-gray-600'>
                          {movement.totalQuantity} items • ₦
                          {movement.totalValue.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Click to view {movement.items.length} book types
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      No stock movements available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mini Store to Table */}
            <Card>
              <CardHeader>
                <CardTitle>Mini Store → Tables</CardTitle>
                <CardDescription>
                  Stock distributed from mini store to tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {paginatedMiniToTable && paginatedMiniToTable.length > 0 ? (
                    paginatedMiniToTable.map((movement: any, index: number) => (
                      <div
                        key={index}
                        className='border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-card transition-colors'
                        onClick={() => {
                          setModalTitle(
                            `Stock Movement: ${movement.from} → ${movement.to} (Table ${movement.tableId})`
                          );
                          setModalData({
                            type: 'stock-movement',
                            movement,
                          });
                          setModalStockMovementPage(0); // Reset pagination
                          setModalOpen(true);
                        }}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{movement.from}</span>
                            <IconArrowRight className='h-4 w-4' />
                            <span className='font-medium'>{movement.to}</span>
                          </div>
                          <Badge variant='outline'>
                            {new Date(movement.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <div className='text-sm text-gray-600'>
                          {movement.totalQuantity} items • ₦
                          {movement.totalValue.toLocaleString()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          Table: {movement.tableId} • Click to view{' '}
                          {movement.items.length} book types
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-8 text-gray-500'>
                      No stock movements available
                    </div>
                  )}
                </div>
                {renderPagination(
                  miniToTablePage,
                  setMiniToTablePage,
                  stockMovements?.miniToTable?.length || 0
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Closing Stocks */}
        <TabsContent value='closing-stocks' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Closing Stocks</CardTitle>
              <CardDescription>
                Remaining stock returned at session close
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name/Table ID</TableHead>
                      <TableHead>Closed At</TableHead>
                      <TableHead>Closed By</TableHead>
                      <TableHead className='text-right'>Items</TableHead>
                      <TableHead className='text-right'>Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClosingStocks &&
                    paginatedClosingStocks.length > 0 ? (
                      paginatedClosingStocks.map(
                        (closing: any, index: number) => (
                          <TableRow
                            key={index}
                            className='cursor-pointer hover:bg-card'
                            onClick={() => {
                              setModalTitle(
                                `Closing Stock - ${
                                  closing.tableId
                                    ? `${closing.name} (${closing.tableId})`
                                    : closing.name
                                }`
                              );
                              setModalData({
                                type: 'closing-stock',
                                closing,
                              });
                              setModalClosingStockPage(0); // Reset pagination
                              setModalOpen(true);
                            }}
                          >
                            <TableCell>
                              <Badge
                                variant={
                                  closing.type === 'main-store'
                                    ? 'default'
                                    : closing.type === 'mini-store'
                                    ? 'secondary'
                                    : 'outline'
                                }
                              >
                                {closing.type.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className='font-medium'>
                              {closing.tableId
                                ? `${closing.name} (${closing.tableId})`
                                : closing.name}
                            </TableCell>
                            <TableCell>
                              {closing.closedAt
                                ? new Date(closing.closedAt).toLocaleString()
                                : 'N/A'}
                            </TableCell>
                            <TableCell>{closing.closedBy || 'N/A'}</TableCell>
                            <TableCell className='text-right'>
                              {closing.totalQuantity}
                            </TableCell>
                            <TableCell className='text-right font-medium'>
                              ₦{closing.totalValue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className='h-24 text-center text-gray-500'
                        >
                          No closing stocks available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(
                closingStocksPage,
                setClosingStocksPage,
                closingStocks?.length || 0
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preorders */}
        <TabsContent value='preorders' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Preorders Processed</CardTitle>
              <CardDescription>
                All preorders processed in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedSession === 'all' && (
                        <TableHead>Session</TableHead>
                      )}
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Shipping Zone</TableHead>
                      <TableHead className='text-right'>Items</TableHead>
                      <TableHead className='text-right'>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPreorders && paginatedPreorders.length > 0 ? (
                      paginatedPreorders.map((preorder: any) => (
                        <TableRow
                          key={preorder.id}
                          className='cursor-pointer hover:bg-card'
                          onClick={() => {
                            setSelectedOrder(preorder);
                            setOrderModalOpen(true);
                          }}
                        >
                          {selectedSession === 'all' && (
                            <TableCell className='font-medium'>
                              {preorder.session || 'Unknown'}
                            </TableCell>
                          )}
                          <TableCell className='font-medium'>
                            {preorder.orderNumber}
                          </TableCell>
                          <TableCell>{preorder.fullName}</TableCell>
                          <TableCell>{preorder.email}</TableCell>
                          <TableCell>
                            {preorder.shippingZone || 'N/A'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {preorder.items.reduce(
                              (sum: number, item: any) => sum + item.quantity,
                              0
                            )}
                          </TableCell>
                          <TableCell className='text-right font-medium'>
                            ₦{preorder.total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                preorder.isCollected
                                  ? 'default'
                                  : preorder.isPartiallyCollected
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {preorder.isCollected
                                ? 'Collected'
                                : preorder.isPartiallyCollected
                                ? 'Partial'
                                : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{preorder.processedBy}</TableCell>
                          <TableCell>
                            {new Date(preorder.processedAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className='h-24 text-center text-gray-500'
                        >
                          No preorders found for this session
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(
                preordersPage,
                setPreordersPage,
                preorders?.length || 0
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-6xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>Detailed breakdown of items</DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            {modalData && (
              <>
                {modalData.type === 'all-sales' && (
                  <>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Slip Number</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className='text-right'>Items</TableHead>
                            <TableHead className='text-right'>Total</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedModalSales.map((sale: any) => (
                            <TableRow
                              key={sale.id}
                              className='cursor-pointer hover:bg-card'
                              onClick={() => {
                                setSelectedOrder(sale);
                                setOrderModalOpen(true);
                              }}
                            >
                              <TableCell className='font-medium'>
                                {sale.orderNumber}
                              </TableCell>
                              <TableCell>{sale.slipNumber || 'N/A'}</TableCell>
                              <TableCell>
                                {sale.tableName} ({sale.tableId})
                              </TableCell>
                              <TableCell>{sale.fullName}</TableCell>
                              <TableCell className='text-right'>
                                {sale.items.reduce(
                                  (sum: number, item: any) =>
                                    sum + item.quantity,
                                  0
                                )}
                              </TableCell>
                              <TableCell className='text-right font-medium'>
                                ₦{sale.total.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {new Date(sale.createdAt).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(
                      modalSalesPage,
                      setModalSalesPage,
                      modalData.sales?.length || 0
                    )}
                  </>
                )}

                {modalData.type === 'books-sold' && (
                  <>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead className='text-right'>
                              Total Quantity
                            </TableHead>
                            <TableHead className='text-right'>
                              Unit Price
                            </TableHead>
                            <TableHead className='text-right'>
                              Total Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedModalBooks.map((book: any) => (
                            <TableRow key={book.title}>
                              <TableCell className='font-medium'>
                                {book.title}
                              </TableCell>
                              <TableCell className='text-right'>
                                {book.quantity}
                              </TableCell>
                              <TableCell className='text-right'>
                                ₦{book.price.toLocaleString()}
                              </TableCell>
                              <TableCell className='text-right font-medium'>
                                ₦{(book.quantity * book.price).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(
                      modalBooksPage,
                      setModalBooksPage,
                      modalData.books?.length || 0
                    )}
                  </>
                )}

                {modalData.type === 'transactions' && (
                  <>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order Number</TableHead>
                            <TableHead>Slip Number</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className='text-right'>Total</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedModalTransactions.map(
                            (transaction: any) => (
                              <TableRow
                                key={transaction.id}
                                className='cursor-pointer hover:bg-card'
                                onClick={() => {
                                  setSelectedOrder(transaction);
                                  setOrderModalOpen(true);
                                }}
                              >
                                <TableCell className='font-medium'>
                                  {transaction.orderNumber}
                                </TableCell>
                                <TableCell>
                                  {transaction.slipNumber || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {transaction.tableName} ({transaction.tableId}
                                  )
                                </TableCell>
                                <TableCell>{transaction.fullName}</TableCell>
                                <TableCell className='text-right font-medium'>
                                  ₦{transaction.total.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(
                                    transaction.createdAt
                                  ).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(
                      modalTransactionsPage,
                      setModalTransactionsPage,
                      modalData.transactions?.length || 0
                    )}
                  </>
                )}

                {modalData.type === 'tables' && (
                  <>
                    <div className='space-y-4'>
                      {paginatedModalTables.map((table: any) => (
                        <Card key={table.tableId}>
                          <CardHeader>
                            <CardTitle>
                              {table.tableName} ({table.tableId})
                            </CardTitle>
                            <CardDescription>
                              {table.transactionCount} transactions •{' '}
                              {table.totalItems} items • ₦
                              {table.totalSales.toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className='rounded-md border'>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Order Number</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className='text-right'>
                                      Items
                                    </TableHead>
                                    <TableHead className='text-right'>
                                      Total
                                    </TableHead>
                                    <TableHead>Date</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {table.sales.map((sale: any) => (
                                    <TableRow
                                      key={sale.id}
                                      className='cursor-pointer hover:bg-card'
                                      onClick={() => {
                                        setSelectedOrder(sale);
                                        setOrderModalOpen(true);
                                      }}
                                    >
                                      <TableCell className='font-medium'>
                                        {sale.orderNumber}
                                      </TableCell>
                                      <TableCell>{sale.fullName}</TableCell>
                                      <TableCell className='text-right'>
                                        {sale.items.reduce(
                                          (sum: number, item: any) =>
                                            sum + item.quantity,
                                          0
                                        )}
                                      </TableCell>
                                      <TableCell className='text-right font-medium'>
                                        ₦{sale.total.toLocaleString()}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(
                                          sale.createdAt
                                        ).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {renderPagination(
                        modalTablesPage,
                        setModalTablesPage,
                        modalData.tables?.length || 0
                      )}
                    </div>
                  </>
                )}

                {modalData.type === 'table-type-sales' && (
                  <>
                    <div className='space-y-4'>
                      <div className='grid grid-cols-4 gap-4'>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Table Type
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              {modalData.tableType.tableType}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>Tables</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              {modalData.tableType.tables.length}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Transactions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              {modalData.tableType.transactionCount}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Total Sales
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              ₦{modalData.tableType.totalSales.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Tables in this Type
                        </h3>
                        <div className='flex flex-wrap gap-2'>
                          {modalData.tableType.tables.map((tableId: string) => (
                            <Badge key={tableId} variant='outline'>
                              {tableId}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-semibold mb-2'>
                          Books Sold Breakdown
                        </h3>
                        <div className='rounded-md border'>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Book Title</TableHead>
                                <TableHead className='text-right'>
                                  Quantity
                                </TableHead>
                                <TableHead className='text-right'>
                                  Total Value
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {modalData.tableType.booksSold &&
                              modalData.tableType.booksSold.length > 0 ? (
                                modalData.tableType.booksSold.map(
                                  (book: any) => (
                                    <TableRow key={book.title}>
                                      <TableCell className='font-medium'>
                                        {book.title}
                                      </TableCell>
                                      <TableCell className='text-right'>
                                        {book.quantity}
                                      </TableCell>
                                      <TableCell className='text-right font-medium'>
                                        ₦{book.value.toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  )
                                )
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className='h-24 text-center text-gray-500'
                                  >
                                    No books sold
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {modalData.type === 'table-sales' && (
                  <>
                    <div className='space-y-4'>
                      <div className='grid grid-cols-3 gap-4'>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Transactions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              {modalData.table.transactionCount}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Total Items
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              {modalData.table.totalItems}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm'>
                              Total Sales
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className='text-2xl font-bold'>
                              ₦{modalData.table.totalSales.toLocaleString()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className='rounded-md border'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order Number</TableHead>
                              <TableHead>Slip Number</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className='text-right'>
                                Items
                              </TableHead>
                              <TableHead className='text-right'>
                                Total
                              </TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedModalTableSales.map((sale: any) => (
                              <TableRow
                                key={sale.id}
                                className='cursor-pointer hover:bg-card'
                                onClick={() => {
                                  setSelectedOrder(sale);
                                  setOrderModalOpen(true);
                                }}
                              >
                                <TableCell className='font-medium'>
                                  {sale.orderNumber}
                                </TableCell>
                                <TableCell>
                                  {sale.slipNumber || 'N/A'}
                                </TableCell>
                                <TableCell>{sale.fullName}</TableCell>
                                <TableCell className='text-right'>
                                  {sale.items.reduce(
                                    (sum: number, item: any) =>
                                      sum + item.quantity,
                                    0
                                  )}
                                </TableCell>
                                <TableCell className='text-right font-medium'>
                                  ₦{sale.total.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {new Date(sale.createdAt).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {renderPagination(
                        modalTableSalesPage,
                        setModalTableSalesPage,
                        modalData.table?.sales?.length || 0
                      )}
                    </div>
                  </>
                )}

                {modalData.type === 'stock-movement' && (
                  <>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead className='text-right'>
                              Quantity
                            </TableHead>
                            <TableHead className='text-right'>
                              Unit Price
                            </TableHead>
                            <TableHead className='text-right'>
                              Total Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedModalStockMovement.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className='font-medium'>
                                  {item.title}
                                </TableCell>
                                <TableCell className='text-right'>
                                  {item.quantity}
                                </TableCell>
                                <TableCell className='text-right'>
                                  ₦{item.price.toLocaleString()}
                                </TableCell>
                                <TableCell className='text-right font-medium'>
                                  ₦
                                  {(
                                    item.quantity * item.price
                                  ).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          {modalStockMovementPage ===
                            Math.floor(
                              (modalData.movement?.items?.length - 1 || 0) /
                                PAGE_SIZE
                            ) && (
                            <TableRow className='font-bold'>
                              <TableCell>Total</TableCell>
                              <TableCell className='text-right'>
                                {modalData.movement.totalQuantity}
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell className='text-right'>
                                ₦
                                {modalData.movement.totalValue.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(
                      modalStockMovementPage,
                      setModalStockMovementPage,
                      modalData.movement?.items?.length || 0
                    )}
                    {modalData.movement && (
                      <div className='mt-4 p-4 bg-card rounded-lg'>
                        <div className='flex justify-between items-center'>
                          <span className='font-medium'>Total Quantity:</span>
                          <span className='text-lg font-bold'>
                            {modalData.movement.totalQuantity}
                          </span>
                        </div>
                        <div className='flex justify-between items-center mt-2'>
                          <span className='font-medium'>Total Value:</span>
                          <span className='text-lg font-bold'>
                            ₦{modalData.movement.totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {modalData.type === 'closing-stock' && (
                  <>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead className='text-right'>
                              Quantity
                            </TableHead>
                            <TableHead className='text-right'>
                              Unit Price
                            </TableHead>
                            <TableHead className='text-right'>
                              Total Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedModalClosingStock.map(
                            (item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell className='font-medium'>
                                  {item.title}
                                </TableCell>
                                <TableCell className='text-right'>
                                  {item.quantity}
                                </TableCell>
                                <TableCell className='text-right'>
                                  ₦{item.price.toLocaleString()}
                                </TableCell>
                                <TableCell className='text-right font-medium'>
                                  ₦
                                  {(
                                    item.quantity * item.price
                                  ).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                          {modalClosingStockPage ===
                            Math.floor(
                              (modalData.closing?.remainingStock?.length - 1 ||
                                0) / PAGE_SIZE
                            ) && (
                            <TableRow className='font-bold'>
                              <TableCell>Total</TableCell>
                              <TableCell className='text-right'>
                                {modalData.closing.totalQuantity}
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell className='text-right'>
                                ₦{modalData.closing.totalValue.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {renderPagination(
                      modalClosingStockPage,
                      setModalClosingStockPage,
                      modalData.closing?.remainingStock?.length || 0
                    )}
                    {modalData.closing && (
                      <div className='mt-4 p-4 bg-card rounded-lg'>
                        <div className='flex justify-between items-center'>
                          <span className='font-medium'>Total Quantity:</span>
                          <span className='text-lg font-bold'>
                            {modalData.closing.totalQuantity}
                          </span>
                        </div>
                        <div className='flex justify-between items-center mt-2'>
                          <span className='font-medium'>Total Value:</span>
                          <span className='text-lg font-bold'>
                            ₦{modalData.closing.totalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className='max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.processedBy ? 'Preorder' : 'Order'} Details -{' '}
              {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.slipNumber &&
                `Slip Number: ${selectedOrder.slipNumber}`}
              {selectedOrder?.processedBy &&
                ` • Processed by: ${selectedOrder.processedBy}`}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4 space-y-4'>
            {selectedOrder && (
              <>
                {/* Order Information */}
                <div className='grid grid-cols-2 gap-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm'>
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-1 text-sm'>
                      <div>
                        <span className='font-medium'>Name:</span>{' '}
                        {selectedOrder.fullName}
                      </div>
                      <div>
                        <span className='font-medium'>Email:</span>{' '}
                        {selectedOrder.email || 'N/A'}
                      </div>
                      <div>
                        <span className='font-medium'>Phone:</span>{' '}
                        {selectedOrder.phoneNumber || 'N/A'}
                      </div>
                      {selectedOrder.customerLocation && (
                        <div>
                          <span className='font-medium'>Location:</span>{' '}
                          {selectedOrder.customerLocation}
                        </div>
                      )}
                      {selectedOrder.shippingZone && (
                        <div>
                          <span className='font-medium'>Shipping Zone:</span>{' '}
                          {selectedOrder.shippingZone}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-sm'>
                        {selectedOrder?.processedBy ? 'Preorder' : 'Order'}{' '}
                        Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-1 text-sm'>
                      <div>
                        <span className='font-medium'>Order Number:</span>{' '}
                        {selectedOrder.orderNumber}
                      </div>
                      {selectedOrder.slipNumber && (
                        <div>
                          <span className='font-medium'>Slip Number:</span>{' '}
                          {selectedOrder.slipNumber}
                        </div>
                      )}
                      {selectedOrder.tableId && (
                        <div>
                          <span className='font-medium'>Table:</span>{' '}
                          {selectedOrder.tableName || 'N/A'} (
                          {selectedOrder.tableId})
                        </div>
                      )}
                      {selectedOrder.processedBy && (
                        <div>
                          <span className='font-medium'>Processed By:</span>{' '}
                          {selectedOrder.processedBy}
                        </div>
                      )}
                      {selectedOrder.processedAt && (
                        <div>
                          <span className='font-medium'>Processed At:</span>{' '}
                          {new Date(selectedOrder.processedAt).toLocaleString()}
                        </div>
                      )}
                      <div>
                        <span className='font-medium'>Order Date:</span>{' '}
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className='font-medium'>Status:</span>{' '}
                        {selectedOrder.isCollected !== undefined ? (
                          <Badge
                            variant={
                              selectedOrder.isCollected
                                ? 'default'
                                : selectedOrder.isPartiallyCollected
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {selectedOrder.isCollected
                              ? 'Collected'
                              : selectedOrder.isPartiallyCollected
                              ? 'Partially Collected'
                              : 'Pending'}
                          </Badge>
                        ) : (
                          selectedOrder.orderStatus || 'COMPLETED'
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='rounded-md border'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead className='text-right'>
                              Quantity
                            </TableHead>
                            <TableHead className='text-right'>
                              Unit Price
                            </TableHead>
                            <TableHead className='text-right'>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items &&
                          selectedOrder.items.length > 0 ? (
                            <>
                              {selectedOrder.items.map(
                                (item: any, idx: number) => (
                                  <TableRow key={item.id || idx}>
                                    <TableCell className='font-medium'>
                                      {item.book?.title ||
                                        item.productName ||
                                        'Unknown Book'}
                                      {item.isCollected !== undefined && (
                                        <Badge
                                          variant={
                                            item.isCollected
                                              ? 'default'
                                              : 'outline'
                                          }
                                          className='ml-2'
                                        >
                                          {item.isCollected
                                            ? 'Collected'
                                            : 'Pending'}
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                      {item.quantity}
                                    </TableCell>
                                    <TableCell className='text-right'>
                                      ₦{item.price.toLocaleString()}
                                    </TableCell>
                                    <TableCell className='text-right font-medium'>
                                      ₦
                                      {(
                                        item.quantity * item.price
                                      ).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                              <TableRow className='font-bold'>
                                <TableCell colSpan={3} className='text-right'>
                                  Total:
                                </TableCell>
                                <TableCell className='text-right'>
                                  ₦{selectedOrder.total.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </>
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                className='h-24 text-center text-gray-500'
                              >
                                No items found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
