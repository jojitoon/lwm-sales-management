import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.setting.findFirst({
    where: { id: 'settings' },
  });
  console.log({ settings });

  return Response.json(settings);
}
