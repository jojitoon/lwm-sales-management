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
  isMultiple?: boolean
) => {
  try {
    const workBook = XLSX.utils.book_new();
    if (isMultiple) {
      data.forEach((item) => {
        XLSX.utils.book_append_sheet(
          workBook,
          XLSX.utils.json_to_sheet(item.data),
          // replace any speacial characters with ''
          item.name.replace(/[^\w\s]/gi, '_')
        );
      });
    } else {
      XLSX.utils.book_append_sheet(
        workBook,
        XLSX.utils.json_to_sheet(data),
        'Sheet1'
      );
    }

    return XLSX.writeFileXLSX(workBook, name);
  } catch (error) {
    console.log(error);
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
        price: Number(datum.product_price),
        quantity: Number(datum.product_quantity),
      });
    } else {
      orders[datum.order_id] = {
        orderNumber: datum.order_id,
        name: `${datum.firstname} ${datum.lastname}`,
        total: Number(datum.total),
        email: datum.email,
        phone: datum.telephone,
        shippingZone: datum.shipping_zone,
        purchasedAt: new Date(datum.date_added).toISOString(),
        items: [
          {
            name: datum.product_name,
            price: Number(datum.product_price),
            quantity: Number(datum.product_quantity),
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
