import nodemailer from 'nodemailer';

export class GmailService {
  createTransporter(email: string, accessToken: string) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: email,
        accessToken: accessToken,
      },
    });
  }

  async sendMail(options: {
    to: string;
    toName?: string;
    from: string;
    fromName?: string;
    subject: string;
    html: string;
    accessToken: string;
  }): Promise<{ messageId: string; etherealPreviewUrl?: string }> {
    const transporter = this.createTransporter(options.from, options.accessToken);

    const info = await transporter.sendMail({
      from: options.fromName ? `"${options.fromName}" <${options.from}>` : options.from,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log(`[GmailService] Email successfully sent via XOAUTH2 from ${options.from}: ${info.messageId}`);
    return {
      messageId: info.messageId,
    };
  }
}

export const gmailService = new GmailService();
