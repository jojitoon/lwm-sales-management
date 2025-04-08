import { GalleryVerticalEnd } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form>
        <div className='flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <a
              href='#'
              className='flex flex-col items-center gap-2 font-medium'
            >
              <div className='flex size-8 items-center justify-center rounded-md'>
                <GalleryVerticalEnd className='size-6' />
              </div>
              <span className='sr-only'>
                Living word media sales management
              </span>
            </a>
            <h1 className='text-xl font-bold'>
              Living word media sales management
            </h1>
            <Link href='/login'>
              <div className='text-center text-sm hover:underline underline-offset-4'>
                Not an admin? Sign in as user
              </div>
            </Link>
          </div>
          <div className='flex flex-col gap-6'>
            <div className='grid gap-3'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                placeholder='********'
                required
              />
            </div>
            <Button type='submit' className='w-full'>
              Go to dashboard
            </Button>
          </div>
        </div>
      </form>
      <div className='text-muted-foreground text-center text-xs text-balance'>
        password is provided to those who have access to the system
      </div>
    </div>
  );
}
