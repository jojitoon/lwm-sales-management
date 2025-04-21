'use client';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useState } from 'react';
import Link from 'next/link';
import { GalleryVerticalEnd } from 'lucide-react';
import { Button } from './ui/button';
import { signIn } from 'next-auth/react';

export function UserLoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [workspace, setWorkspace] = useState('');
  const [email, setEmail] = useState('');
  const [tableId, setTableId] = useState('');
  const [tableType, setTableType] = useState('');

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className='flex flex-col items-center gap-2'>
        <a href='#' className='flex flex-col items-center gap-2 font-medium'>
          <div className='flex size-8 items-center justify-center rounded-md'>
            <GalleryVerticalEnd className='size-6' />
          </div>
          <span className='sr-only'>Living word media sales management</span>
        </a>
        <h1 className='text-xl font-bold'>
          Living word media sales management
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-3'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className='grid gap-3'>
                <Label htmlFor='workspace'>Workspace</Label>

                <Select required value={workspace} onValueChange={setWorkspace}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Select a workspace' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='table-manager'>Table Manager</SelectItem>
                    <SelectItem value='book-sales'>Book Sales</SelectItem>
                    <SelectItem value='mini-store'>Mini Store</SelectItem>
                    <SelectItem value='main-store'>Main Store</SelectItem>
                    <SelectItem value='pre-order'>Pre-order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {workspace === 'book-sales' && (
                <div className='grid gap-3'>
                  <Label htmlFor='table-id'>Table Id</Label>

                  <Input
                    id='table-id'
                    type='text'
                    required
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  />
                </div>
              )}
              {workspace === 'table-manager' && (
                <div className='grid gap-3'>
                  <Label htmlFor='table-id'>Table Type</Label>
                  <Select
                    required
                    value={tableType}
                    onValueChange={setTableType}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a workspace' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='pos'>POS</SelectItem>
                      <SelectItem value='cash'>Cash</SelectItem>
                      <SelectItem value='transfer'>Transfer</SelectItem>
                      <SelectItem value='qr'>QR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className='flex flex-col gap-3'>
                <Button
                  type='button'
                  className='w-full'
                  onClick={() => {
                    signIn('credentials', {
                      tableId,
                      email,
                      workspace,
                      tableType,
                      redirectTo: location.origin,
                    });
                  }}
                >
                  Login
                </Button>
              </div>
            </div>
            <Link
              href='/admin-login'
              className='text-sm text-muted-foreground underline underline-offset-4'
            >
              <div className='mt-4 text-center text-sm'>Sign in as admin</div>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
