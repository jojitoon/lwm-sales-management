'use server';
import { revalidatePath } from 'next/cache';

async function revalidateBooks() {
  revalidatePath('/books');
}

export { revalidateBooks };
