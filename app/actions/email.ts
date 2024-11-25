'use server'

import { NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

export async function sendEmail(data: { to: string; subject: string; html: string }) {
  try {
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        to_email: data.to,
        subject: data.subject,
        message_html: data.html,
      }
    );

    if (result.status === 200) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

