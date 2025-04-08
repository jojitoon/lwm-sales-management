'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { AccountCard, AccountCardFooter, AccountCardBody } from './AccountCard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateSettings } from '@/lib/actions/settings';
import Loading from '@/app/loading';
import { sessionOptions } from '@/lib/constant';
import { useSettings } from '@/hooks/data/useSettings';

export default function UpdateSession() {
  const [state, formAction] = useActionState(updateSettings, {
    error: '',
  });

  useEffect(() => {
    if (state.success == true) toast.success('Updated Settings');
    if (state.error) toast.error('Error', { description: state.error });
  }, [state]);

  const { data, isLoading } = useSettings();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AccountCard
      params={{
        header: 'Sales Session',
        description: 'Please provide sales session',
      }}
    >
      <form action={formAction}>
        <AccountCardBody>
          <Select name='session' defaultValue={data?.currentSession}>
            <SelectTrigger className='w-[250px]'>
              <SelectValue placeholder='Select a session' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sessions</SelectLabel>
                {sessionOptions.map((session, index) => (
                  <SelectItem key={index} value={session}>
                    {session?.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </AccountCardBody>
        <AccountCardFooter description='This is current session'>
          <Submit />
        </AccountCardFooter>
      </form>
    </AccountCard>
  );
}

const Submit = () => {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>Update Session</Button>;
};
