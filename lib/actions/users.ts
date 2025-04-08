'use server';

import { revalidatePath } from 'next/cache';

import { genericError } from '../utils';
import { prisma } from '../prisma';
import { auth } from '../auth';
import { updateUserSchema } from '../schema/auth';

interface ActionResult {
  error: string;
}

// export async function adminSignin(
//   _: ActionResult,
//   formData: FormData
// ): Promise<ActionResult> {
//   if (formData.get('password') !== 'admin') {
//     return { error: 'Invalid password' };
//   }

//   console.log({ formData });

//   // const hashedPassword = await new Argon2id().hash(data.password);

//   const admin = await findOrCreateAdmin();

//   if (!admin) {
//     return {
//       error: 'Failed to log in as admin user',
//     };
//   }

//   const session = await lucia.createSession(admin.id, { session: 'ADMIN' });
//   const sessionCookie = lucia.createSessionCookie(session.id);
//   setAuthCookie(sessionCookie);
//   return redirect('/');
// }

export async function updateUser(
  _: {
    error: string;
  },
  formData: FormData
): Promise<ActionResult & { success?: boolean }> {
  const session = await auth();
  if (!session) return { error: 'Unauthorised' };

  const name = formData.get('name') ?? undefined;
  const email = formData.get('email') ?? undefined;

  const result = updateUserSchema.safeParse({ name, email });

  if (!result.success) {
    const error = result.error.flatten().fieldErrors;
    if (error.name) return { error: 'Invalid name - ' + error.name[0] };
    if (error.email) return { error: 'Invalid email - ' + error.email[0] };
    return genericError;
  }

  try {
    await prisma.user.update({
      data: { ...result.data },
      where: { id: session.user?.id },
    });
    revalidatePath('/account');
    return { success: true, error: '' };
  } catch {
    return genericError;
  }
}
