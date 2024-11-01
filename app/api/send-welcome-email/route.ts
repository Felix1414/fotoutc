import { NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();

    const templateParams = {
      to_name: name,
      to_email: email,
    };

    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      templateParams
    );

    if (result.status === 200) {
      return NextResponse.json({ message: 'Welcome email sent successfully' });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}