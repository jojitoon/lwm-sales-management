'use client';

import * as React from 'react';
import {
  IconDashboard,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconPackage,
  IconSearch,
  IconSettings,
  IconTable,
} from '@tabler/icons-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import { useMySession } from '@/hooks/data/useMySession';

const buildData = (workspace: string) => {
  const mainSwitch = () => {
    switch (workspace) {
      case 'main-store':
        return [
          {
            title: 'Stock',
            url: '#',
            icon: IconPackage,
          },
          {
            title: 'Requests',
            url: '#',
            icon: IconFileDescription,
          },
        ];
      case 'mini-store':
        return [
          {
            title: 'Stock',
            url: '#',
            icon: IconPackage,
          },
          {
            title: 'Requests',
            url: '#',
            icon: IconFileDescription,
          },
        ];
      case 'table-manager':
        return [
          {
            title: 'Stock',
            url: '#',
            icon: IconPackage,
          },
          {
            title: 'Sales',
            url: '#',
            icon: IconFileDescription,
          },
        ];
      case 'pre-order':
        return [
          {
            title: 'Sales',
            url: '/preorder-sales',
            icon: IconFileDescription,
          },
          {
            title: 'Reports',
            url: '/report-user',
            icon: IconFileDescription,
          },
        ];
      case 'book-sales':
        return [
          {
            title: 'Sales',
            url: '/book-sales',
            icon: IconFileDescription,
          },
          {
            title: 'Reports',
            url: '/report-book-sales',
            icon: IconFileDescription,
          },
        ];
      default:
        return [];
    }
  };

  const data = {
    common: [
      {
        title: 'Dashboard',
        url: '/',
        icon: IconDashboard,
      },
    ],
    navMain: mainSwitch(),
    // navClouds: [
    //   {
    //     title: 'Capture',
    //     icon: IconCamera,
    //     isActive: true,
    //     url: '#',
    //     items: [
    //       {
    //         title: 'Active Proposals',
    //         url: '#',
    //       },
    //       {
    //         title: 'Archived',
    //         url: '#',
    //       },
    //     ],
    //   },
    //   {
    //     title: 'Proposal',
    //     icon: IconFileDescription,
    //     url: '#',
    //     items: [
    //       {
    //         title: 'Active Proposals',
    //         url: '#',
    //       },
    //       {
    //         title: 'Archived',
    //         url: '#',
    //       },
    //     ],
    //   },
    //   {
    //     title: 'Prompts',
    //     icon: IconFileAi,
    //     url: '#',
    //     items: [
    //       {
    //         title: 'Active Proposals',
    //         url: '#',
    //       },
    //       {
    //         title: 'Archived',
    //         url: '#',
    //       },
    //     ],
    //   },
    // ],
    navSecondary: [
      {
        title: 'Settings',
        url: '#',
        icon: IconSettings,
      },
      {
        title: 'Get Help',
        url: '#',
        icon: IconHelp,
      },
      {
        title: 'Search',
        url: '#',
        icon: IconSearch,
      },
    ],
    // documents: [
    //   {
    //     name: 'Data Library',
    //     url: '#',
    //     icon: IconDatabase,
    //   },
    //   {
    //     name: 'Reports',
    //     url: '#',
    //     icon: IconReport,
    //   },
    //   {
    //     name: 'Word Assistant',
    //     url: '#',
    //     icon: IconFileWord,
    //   },
    // ],
  };

  return data;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;

  console.log({ userId });

  const { data: mySession } = useMySession(userId);

  console.log({ mySession });

  const data = buildData(mySession?.workspace as string);

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className='data-[slot=sidebar-menu-button]:!p-1.5'
            >
              <a href='#'>
                <IconInnerShadowTop className='!size-5' />
                <span className='text-base font-semibold'>LWM Sales Mgt.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...data.common, ...data.navMain]} />
        {/* <NavDocuments items={data.documents} /> */}
        {['table-manager', 'book-sales'].includes(
          mySession?.workspace as string
        ) && (
          <div className='flex flex-col gap-2 p-2'>
            <div className='flex items-center gap-2'>
              <IconTable />
              <span className='text-lg font-bold uppercase'>
                {mySession?.tableSaleSession?.tableId}
              </span>
            </div>
          </div>
        )}
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        {session?.user && <NavUser user={session?.user as any} />}
      </SidebarFooter>
    </Sidebar>
  );
}
