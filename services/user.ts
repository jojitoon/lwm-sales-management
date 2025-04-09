import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const generateTableId = () => {
  const date = new Date().getTime();
  const truncatedDate = date.toString().slice(0, 3);
  const random = Math.random().toString(36).substring(2, 5);
  return `${truncatedDate}-${random}`;
};

export const findOrCreateUser = async (
  email: string,
  workspace: string,
  tableId: string
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
    'main-store': 'mainStoreSession',
  };

  if (workspace === 'pre-order') {
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
          data: {},
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
      const newTableId = generateTableId();
      tableSaleSession = await prisma.tableSaleSession.create({
        data: {
          managerId: user.id,
          session: currentSession,
          tableId: newTableId,
          name: `Table Manager ${newTableId}`,
          data: {},
        },
      });
    }

    workspaceModelId = tableSaleSession.id;
  }

  if (workspace === 'book-sales') {
    const tableSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
        tableId,
      },
    });

    if (!tableSaleSession) {
      return null;
    }

    let bookSaleSession = await prisma.tableSaleSession.findFirst({
      where: {
        salesPersonId: user.id,
        isActive: true,
        session: currentSession,
        tableId,
      },
    });

    if (!bookSaleSession) {
      bookSaleSession = await prisma.tableSaleSession.create({
        data: {
          salesPersonId: user.id,
          session: currentSession,
          tableId,
          name: `Book Sales ${tableSaleSession.name}`,
          data: {},
        },
      });
    }

    workspaceModelId = bookSaleSession.id;
  }

  if (workspace === 'mini-store') {
    let miniStoreSession = await prisma.miniStoreSession.findFirst({
      where: {
        isActive: true,
        session: currentSession,
      },
    });

    if (!miniStoreSession) {
      miniStoreSession = await prisma.miniStoreSession.create({
        data: {
          session: currentSession,
          data: {},
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
