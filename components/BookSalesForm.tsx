'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DialogHeader } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
} from '@tabler/icons-react';

interface BookSalesFormProps {
  availableStock: any[];
  open?: boolean;
  setOpen?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface SaleItem {
  bookTitle: string;
  quantity: number;
  price: number;
}

export function BookSalesForm({
  availableStock,
  open: externalOpen,
  setOpen: externalSetOpen,
  trigger,
}: BookSalesFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalSetOpen || setInternalOpen;
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SaleItem>({
    bookTitle: '',
    quantity: 1,
    price: 0,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await axios.post('/api/book-sales', saleData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sale completed successfully');
      setOpen(false);
      setShowConfirmation(false);
      setCustomerInfo({ fullName: '', email: '', phoneNumber: '' });
      setSaleItems([]);
      setCurrentItem({ bookTitle: '', quantity: 1, price: 0 });
      queryClient.invalidateQueries({ queryKey: ['book-sales'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    },
  });

  const addItem = () => {
    if (!currentItem.bookTitle || currentItem.quantity <= 0) {
      toast.error('Please select a book and enter a valid quantity');
      return;
    }

    const book = availableStock.find((b) => b.title === currentItem.bookTitle);
    if (!book) {
      toast.error('Book not found in stock');
      return;
    }

    // Check if book already exists in sale items
    const existingItemIndex = saleItems.findIndex(
      (item) => item.bookTitle === currentItem.bookTitle
    );

    if (existingItemIndex !== -1) {
      // Book already exists, update quantity
      const existingItem = saleItems[existingItemIndex];
      const newQuantity = existingItem.quantity + currentItem.quantity;

      if (newQuantity > book.available) {
        toast.error(
          `Insufficient stock. Available: ${book.available}, Requested: ${newQuantity}`
        );
        return;
      }

      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
      setSaleItems(updatedItems);
      toast.success(
        `Updated quantity for "${currentItem.bookTitle}" to ${newQuantity}`
      );
    } else {
      // New book, add to sale items
      if (currentItem.quantity > book.available) {
        toast.error('Insufficient stock');
        return;
      }

      setSaleItems([...saleItems, { ...currentItem, price: book.price }]);
      toast.success(`Added "${currentItem.bookTitle}" to sale`);
    }

    setCurrentItem({ bookTitle: '', quantity: 1, price: 0 });
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    const item = saleItems[index];
    const book = availableStock.find((b) => b.title === item.bookTitle);

    if (book && newQuantity > book.available) {
      toast.error(`Insufficient stock. Available: ${book.available}`);
      return;
    }

    const updatedItems = [...saleItems];
    updatedItems[index] = { ...item, quantity: newQuantity };
    setSaleItems(updatedItems);
  };

  const handleSubmit = () => {
    if (!customerInfo.fullName || !customerInfo.email) {
      toast.error('Please fill in customer information');
      return;
    }

    if (saleItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    // Validate stock availability for all items before submitting
    const stockValidationErrors: string[] = [];

    for (const item of saleItems) {
      const book = availableStock.find((b) => b.title === item.bookTitle);

      if (!book) {
        stockValidationErrors.push(
          `Book "${item.bookTitle}" is no longer available`
        );
        continue;
      }

      if (item.quantity > book.available) {
        stockValidationErrors.push(
          `Insufficient stock for "${item.bookTitle}". Available: ${book.available}, Requested: ${item.quantity}`
        );
      }
    }

    // If there are any stock validation errors, show them and prevent submission
    if (stockValidationErrors.length > 0) {
      toast.error('Stock validation failed:');
      stockValidationErrors.forEach((error) => {
        toast.error(error);
      });
      return;
    }

    // Show confirmation instead of directly submitting
    setShowConfirmation(true);
  };

  const confirmSale = () => {
    const total = saleItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    mutation.mutate({
      customerInfo,
      items: saleItems,
      total,
    });
  };

  const availableBooks = availableStock.filter((book) => book.available > 0);

  // Check if any sale items have insufficient stock
  const hasInsufficientStock = saleItems.some((item) => {
    const book = availableStock.find((b) => b.title === item.bookTitle);
    return book && item.quantity > book.available;
  });

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className='cursor-pointer w-full'>
          {trigger}
        </div>
      ) : (
        <Button onClick={() => setOpen(true)} className='gap-2'>
          <IconShoppingCart className='h-4 w-4' />
          Make Sale
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>Book Sales</DialogTitle>
            <DialogDescription className='text-base'>
              Record a new book sale and update stock inventory.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-8'>
            {/* Customer Information */}
            {!showConfirmation && (
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-xl font-semibold text-muted-foreground'>
                  Customer Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <Label className='text-sm font-medium'>Full Name *</Label>
                    <Input
                      value={customerInfo.fullName}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          fullName: e.target.value,
                        })
                      }
                      placeholder='Enter customer name'
                      className='mt-1'
                    />
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Email *</Label>
                    <Input
                      type='email'
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      placeholder='Enter email'
                      className='mt-1'
                    />
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Phone Number</Label>
                    <Input
                      value={customerInfo.phoneNumber}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder='Enter phone number'
                      className='mt-1'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Add Items */}
            {!showConfirmation && (
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-xl font-semibold text-muted-foreground'>
                  Add Items
                </h3>
                <div className='flex gap-4'>
                  <div className='flex-1'>
                    <Label className='text-sm font-medium'>Book</Label>
                    <div className='mt-1'>
                      <Select
                        value={currentItem.bookTitle}
                        onValueChange={(value) => {
                          const book = availableBooks.find(
                            (b) => b.title === value
                          );
                          setCurrentItem({
                            ...currentItem,
                            bookTitle: value,
                            price: book?.price || 0,
                          });
                        }}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select book' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available Books</SelectLabel>
                            {availableBooks.map((book) => (
                              <SelectItem key={book.title} value={book.title}>
                                <div className='flex justify-between w-full'>
                                  <span>{book.title}</span>
                                  <span className='text-sm text-gray-500 ml-2'>
                                    Stock: {book.available} | ₦
                                    {book.price?.toLocaleString()}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm font-medium'>Quantity</Label>
                    <Input
                      type='number'
                      // min='1'
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseInt(e.target.value),
                        })
                      }
                      className='mt-1'
                    />
                  </div>
                  <div className='flex items-end'>
                    <Button onClick={addItem} className='w-full gap-2'>
                      <IconPlus className='h-4 w-4' />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sale Items */}
            {saleItems.length > 0 && !showConfirmation && (
              <div className='space-y-4 p-4 border rounded-lg'>
                <h3 className='text-xl font-semibold text-muted-foreground'>
                  Sale Items ({saleItems.length})
                </h3>
                <div className='space-y-3'>
                  {saleItems.map((item, index) => {
                    const book = availableStock.find(
                      (b) => b.title === item.bookTitle
                    );
                    const hasInsufficientStock =
                      book && item.quantity > book.available;

                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm ${
                          hasInsufficientStock ? 'border-red-300 bg-red-50' : ''
                        }`}
                      >
                        <div className='flex-1'>
                          <h4 className='font-semibold text-gray-800'>
                            {item.bookTitle}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            ₦{item.price.toLocaleString()} per unit
                          </p>
                          <p className='text-sm text-blue-600 font-medium'>
                            Quantity: {item.quantity} units
                          </p>
                          <p className='text-sm text-green-600 font-semibold'>
                            Total: ₦
                            {(item.price * item.quantity).toLocaleString()}
                          </p>
                          {hasInsufficientStock && (
                            <p className='text-sm text-red-600 font-medium mt-1'>
                              ⚠️ Insufficient stock! Available:{' '}
                              {book?.available || 0}
                            </p>
                          )}
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                updateItemQuantity(index, item.quantity - 1)
                              }
                              className='h-8 w-8 p-0'
                            >
                              <IconMinus className='h-3 w-3' />
                            </Button>
                            <span className='font-medium min-w-[2rem] text-center'>
                              {item.quantity}
                            </span>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                updateItemQuantity(index, item.quantity + 1)
                              }
                              className='h-8 w-8 p-0'
                            >
                              <IconPlus className='h-3 w-3' />
                            </Button>
                          </div>
                          <div className='text-right min-w-[120px]'>
                            <span className='font-bold text-lg'>
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => removeItem(index)}
                            className='h-8 w-8 p-0'
                          >
                            <IconTrash className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className='border-t pt-4'>
                  <div className='flex justify-between items-center text-lg font-bold'>
                    <span>Total Amount:</span>
                    <span className='text-2xl text-green-600'>
                      ₦
                      {saleItems
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Section */}
            {showConfirmation && (
              <div className='space-y-4 p-6'>
                <div className='text-center'>
                  <h3 className='text-xl font-bold text-blue-800 mb-2'>
                    Confirm Sale
                  </h3>
                  <p className='text-gray-600'>
                    Please review the details below before completing the sale
                  </p>
                </div>

                {/* Customer Info Summary */}
                <div className='bg-white p-4 rounded-lg border'>
                  <h4 className='font-semibold text-gray-800 mb-2'>
                    Customer Details
                  </h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-sm'>
                    <div>
                      <span className='font-medium'>Name:</span>{' '}
                      {customerInfo.fullName}
                    </div>
                    <div>
                      <span className='font-medium'>Email:</span>{' '}
                      {customerInfo.email}
                    </div>
                    {customerInfo.phoneNumber && (
                      <div>
                        <span className='font-medium'>Phone:</span>{' '}
                        {customerInfo.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Summary */}
                <div className='bg-white p-4 rounded-lg border'>
                  <h4 className='font-semibold text-gray-800 mb-3'>
                    Sale Items
                  </h4>
                  <div className='space-y-2'>
                    {saleItems.map((item, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center py-2 border-b last:border-b-0'
                      >
                        <div>
                          <span className='font-medium'>{item.bookTitle}</span>
                          <span className='text-sm text-gray-500 ml-2'>
                            × {item.quantity}
                          </span>
                        </div>
                        <span className='font-semibold'>
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className='mt-3 pt-3 border-t'>
                    <div className='flex justify-between items-center text-lg font-bold'>
                      <span>Total Amount:</span>
                      <span className='text-xl text-green-600'>
                        ₦
                        {saleItems
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3 justify-center'>
                  <Button
                    variant='outline'
                    onClick={() => setShowConfirmation(false)}
                    disabled={mutation.isPending}
                  >
                    Back to Edit
                  </Button>
                  <Button
                    onClick={confirmSale}
                    disabled={mutation.isPending}
                    className='min-w-[140px] gap-2 bg-green-600 hover:bg-green-700'
                  >
                    {mutation.isPending ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <IconShoppingCart className='h-4 w-4' />
                        Confirm Sale
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!showConfirmation && (
            <DialogFooter className='gap-3'>
              <Button
                variant='outline'
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  mutation.isPending ||
                  saleItems.length === 0 ||
                  hasInsufficientStock
                }
                className='min-w-[140px] gap-2'
              >
                {mutation.isPending ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    Processing...
                  </>
                ) : hasInsufficientStock ? (
                  <>
                    <IconShoppingCart className='h-4 w-4' />
                    Fix Stock Issues
                  </>
                ) : (
                  <>
                    <IconShoppingCart className='h-4 w-4' />
                    Complete Sale
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
