import { signIn } from '@/lib/auth';
import { Button } from './ui/button';

export const LoginButton = ({
  tableId,
  email,
  workspace,
}: {
  email: string;
  workspace: string;
  tableId?: string;
}) => (
  <Button
    type='button'
    className='w-full'
    onClick={() => {
      signIn('credentials', {
        tableId,
        email,
        workspace,
      });
    }}
  >
    Login
  </Button>
);
