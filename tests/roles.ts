export type WorkspaceRole = 'book-sales' | 'table-manager' | 'mini-store';

export const roles: WorkspaceRole[] = ['book-sales', 'table-manager', 'mini-store'];

export type RoleLoginConfig = {
  email: string;
  workspace: WorkspaceRole;
  tableId?: string;
  tableType?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function getRoleLogin(role: WorkspaceRole): RoleLoginConfig {
  const email = requireEnv('PW_USER_EMAIL');

  if (role === 'book-sales') {
    return {
      email,
      workspace: 'book-sales',
      tableId: requireEnv('PW_BOOK_SALES_TABLE_ID'),
    };
  }

  if (role === 'table-manager') {
    return {
      email,
      workspace: 'table-manager',
      tableType: requireEnv('PW_TABLE_MANAGER_TABLE_TYPE'),
    };
  }

  return {
    email,
    workspace: 'mini-store',
  };
}

