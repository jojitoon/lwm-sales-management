'use client';

import {
  IconCirclePlusFilled,
  IconDownload,
  type Icon,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useMySession } from '@/hooks/data/useMySession';
import { useSession } from 'next-auth/react';
import { useCallback, useMemo, useState } from 'react';
import AddBook from './AddBook';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const isAdmin = (session?.user as any)?.isAdmin as boolean;
  const { data: mySession } = useMySession(userId);
  const workspace = mySession?.workspace as string;

  const [openAddBook, setOpenAddBook] = useState(false);

  const buildActions = useCallback((isAdmin: boolean, workspace: string) => {
    if (isAdmin) {
      return {
        title: 'Add Book',
        action: () => {
          setOpenAddBook(true);
        },
      };
    }

    switch (workspace) {
      case 'table-manager':
        return {
          title: 'Request Books',
          action: () => {},
        };
      case 'book-sales':
        return {
          title: 'Sell Books',
          action: () => {},
        };
      case 'pre-order':
        return {
          title: 'Process Order',
          action: () => {},
        };
      case 'main-store':
        return {
          title: 'Add Book',
          action: () => {
            setOpenAddBook(true);
          },
        };
      case 'mini-store':
        return {
          title: 'Request Books',
          action: () => {},
        };
      default:
        return {};
    }
  }, []);
  const actions = useMemo(
    () => buildActions(isAdmin, workspace),
    [isAdmin, workspace]
  );

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className='flex flex-col gap-2'>
          <SidebarMenu>
            <SidebarMenuItem className='flex items-center gap-2'>
              <SidebarMenuButton
                tooltip='Quick Create'
                className='bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear'
                onClick={actions?.action}
              >
                <IconCirclePlusFilled />
                <span>{actions?.title}</span>
              </SidebarMenuButton>
              {isAdmin && (
                <Button
                  size='icon'
                  className='size-8 group-data-[collapsible=icon]:opacity-0'
                  variant='outline'
                >
                  <IconDownload />
                  <span className='sr-only'>Import</span>
                </Button>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AddBook open={openAddBook} setOpen={setOpenAddBook} />
    </>
  );
}
