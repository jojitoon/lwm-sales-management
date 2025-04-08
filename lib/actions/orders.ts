'use server';
import { prisma } from '@/lib/prisma';
import { generateId, genericError } from '../utils';

interface ActionResult {
  error?: string;
  uploaded: boolean;
}

export async function uploadSheetAction(
  _: ActionResult,
  listData: {
    orderNumber: string;
    name: string;
    total: number;
    shippingZone: string;
    email: string;
    phone: string;
    purchasedAt: string;
    items: Array<Record<string, string | number>>;
  }[]
): Promise<ActionResult> {
  try {
    for (const data of listData) {
      await prisma.preOrder.create({
        data: {
          id: generateId(15),
          orderNumber: data.orderNumber,
          fullName: data.name,
          total: data.total,
          shippingZone: data.shippingZone,
          email: data.email,
          phoneNumber: data.phone,
          purchasedAt: data.purchasedAt,
          items: {
            createMany: {
              data: data.items.map((item) => ({
                productName: item.name as string,
                price: item.price as number,
                quantity: item.quantity as number,
                id: generateId(15),
              })),
            },
          },
        },
      });
    }
    return { uploaded: true };
  } catch {
    return { ...genericError, uploaded: false };
  }
}
