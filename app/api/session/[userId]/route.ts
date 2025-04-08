import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const mySession = await prisma.mySession.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      tableSaleSession: true,
      miniStoreSession: true,
      mainStoreSession: true,
      preorderSession: true,
      user: true,
    },
  });

  return Response.json(mySession);
}
