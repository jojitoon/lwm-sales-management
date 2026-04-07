import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SheetData {
  order_id: string;
  product_name: string;
  product_price: string;
  product_quantity: string;
  firstname: string;
  lastname: string;
  total: string;
  email: string;
  telephone: string;
  shipping_zone: string;
  date_added: string;
}

export const parseSheet = (data: ArrayBuffer) => {
  const workBook = XLSX.read(data, { type: 'binary' });

  if (workBook.SheetNames?.length < 1) {
    toast.error('Error', { description: 'No sheets found in the file' });
    return [];
  }

  const workSheetName = workBook.SheetNames[0];
  const workSheet = workBook.Sheets[workSheetName];

  const dataJson = XLSX.utils.sheet_to_json(workSheet, {
    defval: '',
    raw: false,
  });

  return validateJson(dataJson as SheetData[]);
};

export const toSheet = async (
  data: any[],
  name: string,
  isMultiple?: boolean,
) => {
  try {
    const workBook = XLSX.utils.book_new();
    if (isMultiple) {
      // Filter out items with empty or undefined data
      const validData = data.filter(
        (item) =>
          item?.data && Array.isArray(item.data) && item.data.length > 0,
      );

      if (validData.length === 0) {
        toast.error('Error', { description: 'No data available to download' });
        return;
      }

      validData.forEach((item) => {
        // Excel sheet names have a 31 character limit
        let sheetName = item.name.replace(/[^\w\s]/gi, '_');
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31);
        }
        // Ensure sheet name is not empty
        if (!sheetName || sheetName.trim() === '') {
          sheetName = 'Sheet';
        }

        XLSX.utils.book_append_sheet(
          workBook,
          XLSX.utils.json_to_sheet(item.data),
          sheetName,
        );
      });
    } else {
      if (!data || data.length === 0) {
        toast.error('Error', { description: 'No data available to download' });
        return;
      }
      XLSX.utils.book_append_sheet(
        workBook,
        XLSX.utils.json_to_sheet(data),
        'Sheet1',
      );
    }

    // Check if workbook has any sheets before writing
    if (workBook.SheetNames.length === 0) {
      toast.error('Error', { description: 'No data available to download' });
      return;
    }

    return XLSX.writeFileXLSX(workBook, name);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    toast.error('Error', {
      description: 'Failed to generate download file. Please try again.',
    });
  }
};

const validateJson = (data: SheetData[]) => {
  const orders: Record<
    string,
    {
      orderNumber: string;
      name: string;
      total: number;
      shippingZone: string;
      email: string;
      phone: string;
      purchasedAt: string;
      items: Array<Record<string, string | number>>;
    }
  > = {};

  data.forEach((datum) => {
    if (orders[datum.order_id]) {
      orders[datum.order_id].items.push({
        name: datum.product_name,
        price: Number(datum.product_price ?? 0),
        quantity: Number(datum.product_quantity ?? 1),
      });
    } else {
      orders[datum.order_id] = {
        orderNumber: datum.order_id,
        name: `${datum.firstname} ${datum.lastname}`,
        total: Number(datum.total ?? 0),
        email: datum.email,
        phone: datum.telephone,
        shippingZone: datum.shipping_zone,
        purchasedAt: new Date(datum.date_added).toISOString(),
        items: [
          {
            name: datum.product_name,
            price: Number(datum.product_price ?? 0),
            quantity: Number(datum.product_quantity ?? 1),
          },
        ],
      };
    }
  });

  return Object.values(orders);
};

export const genericError = {
  error: 'Internal Server Error. Please try again later.',
};

export const generateId = (length: number) => {
  return Math.random()
    .toString(20)
    .slice(2, 2 + length);
};

/**
 * Get the book ID for a given product name from the mapping table
 * This function can be used throughout the codebase to look up book mappings
 */
export async function getBookIdFromMapping(
  productName: string,
  prisma: any,
): Promise<string | null> {
  try {
    const mapping = await prisma.bookMapping.findUnique({
      where: { productName },
      select: { bookId: true },
    });
    return mapping?.bookId || null;
  } catch {
    return null;
  }
}
