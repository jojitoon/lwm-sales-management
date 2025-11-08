import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const generateTableId = async (
  tableType: string,
  session: string
): Promise<string> => {
  // Get all active tables in the current session
  const existingTables = await prisma.tableSaleSession.findMany({
    where: {
      session,
      isActive: true,
    },
    select: {
      tableId: true,
      data: true,
    },
  });

  // Filter tables by type - check both tableId pattern and data.tableType
  const typeTables = existingTables.filter((table) => {
    // Check if tableId matches the pattern (e.g., POS-1, TRF-2)
    const pattern = new RegExp(`^${tableType.toUpperCase()}-\\d+$`, 'i');
    if (pattern.test(table.tableId)) {
      return true;
    }

    // Also check data.tableType for tables that might not have migrated yet
    if (table.data && typeof table.data === 'object') {
      const data = table.data as { tableType?: string };
      if (data.tableType?.toLowerCase() === tableType.toLowerCase()) {
        return true;
      }
    }

    return false;
  });

  // Get the highest number for this type from tableIds that match the pattern
  // Only count tables that follow the new format (TYPE-NUMBER)
  let maxNumber = 0;
  for (const table of typeTables) {
    const pattern = new RegExp(`^${tableType.toUpperCase()}-(\\d+)$`, 'i');
    const match = table.tableId.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  // Generate new ID: TYPE-NUMBER
  // If no pattern matches (e.g., old format tables), start from 1
  // Otherwise, use maxNumber + 1
  const newNumber = maxNumber + 1;
  return `${tableType.toUpperCase()}-${newNumber}`;
};

export const findOrCreateUser = async (
  email: string,
  workspace: string,
  tableId: string,
  tableType: string
) => {
  let currentSessionDB = await prisma.setting.findFirst();

  if (!currentSessionDB) {
    currentSessionDB = await prisma.setting.create({
      data: {
        id: 'settings',
        currentSession: 'FIRST_SESSION',
      },
    });
  }

  const currentSession = currentSessionDB?.currentSession as string;

  let user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  console.log('user', user);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: extractNameFromEmail(email),
      },
    });
  }

  let workspaceModelId;
  const modelIdMap: Record<string, string> = {
    'pre-order': 'preorderSession',
    'table-manager': 'tableSaleSession',
    'book-sales': 'tableSaleSession',
    'mini-store': 'miniStoreSession',
    'preorder-ministore': 'miniStoreSession',
    'main-store': 'mainStoreSession',
  };

  if (workspace === 'pre-order') {
    // Find the existing table manager session for this table
    // Preorder users need to be linked to a table session for stock management
    const tableSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
        tableId,
        managerId: { not: null }, // This should be the original table manager
      },
    });

    if (!tableSaleSession) {
      return null; // Cannot create preorder session without a valid table
    }

    let preorderSession = await prisma.preorderSession.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        session: currentSession,
      },
    });

    if (!preorderSession) {
      preorderSession = await prisma.preorderSession.create({
        data: {
          session: currentSession,
          userId: user.id,
          tableSaleSessionId: tableSaleSession.id, // Link to table session
          data: {},
        },
      });
    } else if (!preorderSession.tableSaleSessionId) {
      // Update existing session if it doesn't have a table link
      preorderSession = await prisma.preorderSession.update({
        where: { id: preorderSession.id },
        data: {
          tableSaleSessionId: tableSaleSession.id,
        },
      });
    }

    workspaceModelId = preorderSession.id;
  }

  if (workspace === 'table-manager') {
    let tableSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        managerId: user.id,
        isActive: true,
        session: currentSession,
      },
    });

    if (!tableSaleSession) {
      const newTableId = await generateTableId(tableType, currentSession);
      tableSaleSession = await prisma.tableSaleSession.create({
        data: {
          managerId: user.id,
          session: currentSession,
          tableId: newTableId,
          name: `Table Manager ${newTableId}`,
          data: {
            tableType,
            list: [], // Initialize with empty stock list
          },
        },
      });
    }

    workspaceModelId = tableSaleSession.id;
  }

  if (workspace === 'book-sales') {
    // Find the existing table manager session for this table
    const tableSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
        tableId,
        managerId: { not: null }, // This should be the original table manager
      },
    });

    console.log(
      'tableSaleSession',
      JSON.stringify(tableSaleSession, null, 2),
      currentSession,
      tableId
    );

    if (!tableSaleSession) {
      return null;
    }

    // Instead of creating a new session, we'll link the user to the existing table manager's session
    // This way both the table manager and sales person share the same stock
    workspaceModelId = tableSaleSession.id;
  }

  if (workspace === 'mini-store') {
    let miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
        type: 'regular',
      },
    });

    if (!miniStoreSession) {
      miniStoreSession = await prisma.miniStoreSession.create({
        data: {
          session: currentSession,
          type: 'regular',
          data: {
            list: [], // Initialize with empty stock list
          },
        },
      });
    }

    workspaceModelId = miniStoreSession.id;
  }

  if (workspace === 'preorder-ministore') {
    let miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
        type: 'preorder',
      },
    });

    if (!miniStoreSession) {
      miniStoreSession = await prisma.miniStoreSession.create({
        data: {
          session: currentSession,
          type: 'preorder',
          data: {
            list: [], // Initialize with empty stock list
          },
        },
      });
    }

    workspaceModelId = miniStoreSession.id;
  }

  if (workspace === 'main-store') {
    let mainStoreSession = await prisma.mainStoreSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
      },
    });

    const books = await prisma.book.findMany();

    const data = books.map((book) => ({
      title: book.title,
      price: book.price,
      total: book.available,
      available: book.available,
      distributed: 0,
    }));

    if (!mainStoreSession) {
      mainStoreSession = await prisma.mainStoreSession.create({
        data: {
          session: currentSession,
          data: { list: data },
          name: `Main Store`,
        },
      });
    }

    workspaceModelId = mainStoreSession.id;
  }

  let mySession = await prisma.mySession.findFirst({
    where: {
      userId: user.id,
      session: currentSession,
      workspace,
      isActive: true,
    },
    include: {
      [modelIdMap[workspace]]: true,
      user: true,
    },
  });

  if (!mySession) {
    mySession = await prisma.mySession.create({
      data: {
        userId: user.id,
        session: currentSession,
        workspace,
        [`${modelIdMap[workspace]}Id`]: workspaceModelId,
      },
      include: {
        [modelIdMap[workspace]]: true,
        user: true,
      },
    });

    await prisma.mySession.updateMany({
      where: {
        userId: user.id,
        id: {
          not: mySession.id,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  return mySession;
};

export const extractNameFromEmail = (email: string) => {
  const namePart = email.split('@')[0];
  const nameParts = namePart.split('.');
  const name = nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return name;
};

export const getUserSession = async () => {
  const session = await auth();
  if (!session?.user?.id) return false;

  const currentSession = await prisma.setting.findUnique({
    where: { id: 'settings' },
  });

  const mySession = await prisma.mySession.findFirst({
    where: {
      userId: session?.user?.id,
      session: currentSession?.currentSession || '',
      isActive: true,
    },
  });

  return mySession;
};
