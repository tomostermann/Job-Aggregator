import nodemailer, { Transporter } from "nodemailer";
import { ENV } from "../config/env";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!ENV.SMTP_HOST) return null;
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE,
    auth: ENV.SMTP_USER
      ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS }
      : undefined,
  });
  return cachedTransporter;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendMailInput {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  attachments?: MailAttachment[];
}

export async function sendMail(input: SendMailInput): Promise<{ delivered: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      "[mail] SMTP non configuré — email non envoyé. Renseignez SMTP_HOST/SMTP_USER/SMTP_PASS dans .env",
    );
    console.info("[mail] Contenu qui aurait été envoyé :", {
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      body: input.text,
    });
    return { delivered: false };
  }
  await transporter.sendMail({
    from: ENV.SMTP_FROM,
    to: input.to,
    replyTo: input.replyTo,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
  return { delivered: true };
}