"use server";

import { z } from 'zod';
import postgres from "postgres";
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const DB_URL = `${process.env.POSTGRES_URL}`
const dbclient = {
    sql: postgres(DB_URL),
  };

export async function createInvoice(formData: FormData) {
  try {
    console.log('Creating invoice...');
    const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']), 
    date: z.string(),
    });
    const createInvoice = FormSchema.omit({ id: true, date: true });
    const { customerId, amount, status } = createInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),  
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    await  dbclient.sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
    revalidatePath('/dashboard/invoices');
   
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create invoice.');
  } finally {
    redirect('/dashboard/invoices');
  }
  
}