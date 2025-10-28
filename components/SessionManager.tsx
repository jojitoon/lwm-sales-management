'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SessionCloseDialog } from '@/components/SessionCloseDialog';
import { IconLock } from '@tabler/icons-react';

interface SessionManagerProps {
  mainStoreSessions: any[];
  miniStoreSessions: any[];
}

export function SessionManager({
  mainStoreSessions,
  miniStoreSessions,
}: SessionManagerProps) {
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<
    'main-store' | 'mini-store'
  >('main-store');

  const handleCloseSession = (
    session: any,
    type: 'main-store' | 'mini-store'
  ) => {
    setSelectedSession(session);
    setSelectedSessionType(type);
    setCloseDialogOpen(true);
  };

  const totalActiveSessions =
    mainStoreSessions.length + miniStoreSessions.length;

  if (totalActiveSessions === 0) {
    return (
      <div className='text-center py-8'>
        <div className='text-gray-500'>No active sessions found</div>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        {/* Main Store Sessions */}
        {mainStoreSessions.length > 0 && (
          <div className='border rounded-lg'>
            <div className='p-4 border-b bg-gray-50'>
              <h3 className='font-semibold'>Main Store Sessions</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mainStoreSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className='font-medium'>
                      {session.session}
                    </TableCell>
                    <TableCell>{session.name}</TableCell>
                    <TableCell>{session.managerId || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(session.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.isActive ? 'default' : 'secondary'}
                      >
                        {session.isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.isActive && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleCloseSession(session, 'main-store')
                          }
                        >
                          <IconLock className='h-4 w-4 mr-1' />
                          Close Session
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mini Store Sessions */}
        {miniStoreSessions.length > 0 && (
          <div className='border rounded-lg'>
            <div className='p-4 border-b bg-gray-50'>
              <h3 className='font-semibold'>Mini Store Sessions</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miniStoreSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className='font-medium'>
                      {session.session}
                    </TableCell>
                    <TableCell>{session.managerId || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(session.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.isActive ? 'default' : 'secondary'}
                      >
                        {session.isActive ? 'Active' : 'Closed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.isActive && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleCloseSession(session, 'mini-store')
                          }
                        >
                          <IconLock className='h-4 w-4 mr-1' />
                          Close Session
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Session Close Dialog */}
      {selectedSession && (
        <SessionCloseDialog
          open={closeDialogOpen}
          setOpen={setCloseDialogOpen}
          sessionType={selectedSessionType}
          session={selectedSession}
        />
      )}
    </>
  );
}
