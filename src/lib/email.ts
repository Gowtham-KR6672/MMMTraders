import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export const sendOTP = async (to: string, otp: string) => {
  const mailOptions = {
    from: process.env.BREVO_SENDER_EMAIL || 'ictstaff08@gmail.com',
    to,
    subject: 'Your OTP for MMM Traders Signup',
    text: `Your OTP for signing up to MMM Traders is: ${otp}. It is valid for 5 minutes.`,
    html: `<p>Your OTP for signing up to MMM Traders is: <strong>${otp}</strong>. It is valid for 5 minutes.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
