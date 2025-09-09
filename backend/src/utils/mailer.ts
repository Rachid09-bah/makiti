import nodemailer, { Transporter } from 'nodemailer';

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
    if (cachedTransporter) return cachedTransporter;

    const provider = String(process.env.MAIL_PROVIDER || 'smtp').toLowerCase();

    // Provider-specific SMTP mapping (Maildrip via SMTP)
    const host =
        (provider === 'maildrip' ? process.env.MAILDRIP_SMTP_HOST : undefined) ||
        process.env.SMTP_HOST || '';
    const port = parseInt(
        (provider === 'maildrip' ? (process.env.MAILDRIP_SMTP_PORT || '') : '') ||
        (process.env.SMTP_PORT || '0'),
        10
    );
    const user =
        (provider === 'maildrip' ? process.env.MAILDRIP_SMTP_USER : undefined) ||
        process.env.SMTP_USER || '';
    const pass =
        (provider === 'maildrip' ? process.env.MAILDRIP_SMTP_PASS : undefined) ||
        process.env.SMTP_PASS || '';
    const secure = String(
        (provider === 'maildrip' ? process.env.MAILDRIP_SMTP_SECURE : undefined) ||
        process.env.SMTP_SECURE || 'false'
    ).toLowerCase() === 'true';

    if (host && port && user && pass) {
        cachedTransporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass }
        });
        console.info(`[mailer] Using provider: ${provider} (SMTP host: ${host})`);
    } else {
        // Fallback to console logging if SMTP is not configured
        console.warn('[mailer] No SMTP configured (provider=' + provider + '). Emails will be logged to console.');
        cachedTransporter = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });
    }

    return cachedTransporter;
}

export async function sendMail(options: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    const provider = String(process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
    const from = process.env.SMTP_FROM || process.env.MAILDRIP_FROM || 'Makiti <no-reply@makiti.local>';
    const transporter = getTransporter();

    await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
    });

    // Log email content if using fallback (streamTransport)
    const isStream = (transporter as any)?.options?.streamTransport;
    if (isStream) {
        console.log('📧 Email would be sent (provider=' + provider + '):');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Content: ${options.text || options.html}`);
    }
}

export function getAppWebUrl(): string {
    return process.env.APP_WEB_URL || 'http://localhost:5173';
}



