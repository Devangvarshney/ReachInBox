import nodemailer, { Transporter } from 'nodemailer';
import { SenderAccount } from '../models';

export interface SendMailOptions {
  from?: string;
  fromName?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendMailResult {
  messageId: string;
  etherealPreviewUrl: string | false;
  senderUsed: string;
}

class EtherealService {
  private transporters: Map<string, Transporter> = new Map();
  private isInitialized = false;

  async initMultiSenders() {
    if (this.isInitialized) return;

    try {
      // Check if senders exist in DB
      let senders = await SenderAccount.find({ active: true });

      if (senders.length === 0) {
        console.log('[Ethereal SMTP] Initializing 2 new Ethereal test accounts...');
        for (let i = 1; i <= 2; i++) {
          const testAccount = await nodemailer.createTestAccount();
          const sender = await SenderAccount.findOneAndUpdate(
            { email: testAccount.user },
            {
              $set: {
                pass: testAccount.pass,
                active: true,
              },
              $setOnInsert: {
                email: testAccount.user,
                name: i === 1 ? 'ReachInbox Sales Team' : 'ReachInbox Growth SDR',
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                user: testAccount.user,
                isEthereal: true,
              },
            },
            { upsert: true, new: true }
          );
          senders.push(sender);
          console.log(`[Ethereal SMTP] Ready Sender #${i}: ${sender.email}`);
        }
      }

      // Build nodemailer transporters for each sender
      for (const sender of senders) {
        const transporter = nodemailer.createTransport({
          host: sender.host,
          port: sender.port,
          secure: sender.secure,
          auth: {
            user: sender.user,
            pass: sender.pass,
          },
        });
        this.transporters.set(sender._id.toString(), transporter);
      }

      this.isInitialized = true;
      console.log(`[Ethereal SMTP] Ready with ${this.transporters.size} active sender accounts.`);
    } catch (err: any) {
      console.error('[Ethereal SMTP] Initialization error:', err.message);
    }
  }

  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    await this.initMultiSenders();

    const senders = await SenderAccount.find({ active: true });
    if (senders.length === 0) {
      throw new Error('No active sender accounts available for SMTP delivery.');
    }

    // Round-robin or random selection across available multi-senders
    const selectedSender = senders[Math.floor(Math.random() * senders.length)];
    let transporter = this.transporters.get(selectedSender._id.toString());

    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: selectedSender.host,
        port: selectedSender.port,
        secure: selectedSender.secure,
        auth: {
          user: selectedSender.user,
          pass: selectedSender.pass,
        },
      });
      this.transporters.set(selectedSender._id.toString(), transporter);
    }

    const senderDisplayName = options.fromName || selectedSender.name || 'ReachInbox Outreach';
    const fromAddress = `"${senderDisplayName}" <${selectedSender.email}>`;

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`[Ethereal SMTP] Mail sent to ${options.to} via ${selectedSender.email}`);
    if (previewUrl) {
      console.log(`[Ethereal Preview URL] ${previewUrl}`);
    }

    return {
      messageId: info.messageId,
      etherealPreviewUrl: previewUrl,
      senderUsed: selectedSender.email,
    };
  }
}

export const etherealService = new EtherealService();
