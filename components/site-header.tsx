import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

export async function SiteHeader() {
  const settings = await prisma.setting.findUnique({
    where: { id: 'settings' },
  });

  const session = await auth();
  const isAdmin = (session?.user as any)?.isAdmin || false;
  const userId = session?.user?.id || '';

  // Get user's workspace/role
  let userRole = 'Admin';
  if (!isAdmin && userId) {
    const currentSessionName = settings?.currentSession || '';
    const mySession = await prisma.mySession.findFirst({
      where: {
        userId: userId,
        session: currentSessionName,
        isActive: true,
      },
    });

    if (mySession?.workspace) {
      userRole = formatWorkspace(mySession.workspace);
    } else {
      userRole = 'User';
    }
  }

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />
        <h1 className='text-base font-medium'>
          {formatSession(settings?.currentSession || '')}
        </h1>
        <div className='ml-auto flex items-center gap-2'>
          <Badge variant='outline' className='text-sm font-medium'>
            {userRole}
          </Badge>
        </div>
      </div>
    </header>
  );
}

const formatSession = (session: string) => {
  return session.replace(/_/g, ' ');
};

const formatWorkspace = (workspace: string) => {
  return workspace
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
