import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import db from '../db/database';
import { getFrontendUrl } from './frontendUrl';

type EmailProvider = 'resend' | 'smtp';

interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
}

export interface EmailPreferences {
  companyName?: string;
  signature?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  welcomeText?: string;
  licencesText?: string;
  tasksText?: string;
}

function getEmailDefaults(prefs?: EmailPreferences | null) {
  return {
    companyName: prefs?.companyName || 'DevToolbox',
    signature: prefs?.signature || 'L\'équipe DevToolbox',
    primaryColor: prefs?.primaryColor || '#0066CC',
    secondaryColor: prefs?.secondaryColor || '#004499',
    logoUrl: prefs?.logoUrl || '',
  };
}

/**
 * Charge la configuration SMTP depuis la base de données ou les variables d'environnement
 */
function loadSmtpConfig(): SmtpConfig | null {
  const dbConfig = db.prepare('SELECT host, port, user, pass, from_email FROM smtp_config WHERE id = 1').get() as {
    host: string | null;
    port: number | null;
    user: string | null;
    pass: string | null;
    from_email: string | null;
  } | undefined;

  if (dbConfig && dbConfig.host && dbConfig.user && dbConfig.pass) {
    return {
      host: dbConfig.host,
      port: dbConfig.port || 587,
      user: dbConfig.user,
      pass: dbConfig.pass,
      fromEmail: dbConfig.from_email || dbConfig.user || 'noreply@devtoolbox.com',
    };
  }

  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@devtoolbox.com';

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return {
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      pass: SMTP_PASS,
      fromEmail: SMTP_FROM,
    };
  }

  return null;
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && (process.env.RESEND_FROM || process.env.SMTP_FROM));
}

function getEmailProvider(): EmailProvider | null {
  const configured = process.env.EMAIL_PROVIDER?.toLowerCase();

  if (configured === 'resend') {
    return isResendConfigured() ? 'resend' : null;
  }

  if (configured === 'smtp') {
    return getTransporter() ? 'smtp' : null;
  }

  if (isResendConfigured()) {
    return 'resend';
  }

  return getTransporter() ? 'smtp' : null;
}

function getFromAddress(companyName?: string): string {
  const d = getEmailDefaults(null);
  const name = companyName || d.companyName;
  const provider = getEmailProvider();

  if (provider === 'resend') {
    const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'noreply@devtoolbox.com';
    return `"${name}" <${from}>`;
  }

  const config = loadSmtpConfig();
  const fromAddr = config?.fromEmail ?? process.env.SMTP_FROM ?? 'noreply@devtoolbox.com';
  return `"${name}" <${fromAddr}>`;
}

async function dispatchEmail(email: OutboundEmail): Promise<boolean> {
  const provider = getEmailProvider();
  if (!provider) {
    return false;
  }

  if (provider === 'resend') {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: email.from,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      return false;
    }

    return true;
  }

  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }

  await transporter.sendMail(email);
  return true;
}

/**
 * Obtient le transporteur Nodemailer (config DB prioritaire sur env)
 */
function getTransporter(): nodemailer.Transporter | null {
  const config = loadSmtpConfig();
  if (!config) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

/**
 * Envoie un email de confirmation de bienvenue à un nouvel utilisateur
 */
export async function sendConfirmationEmail(email: string, name: string, prefs?: EmailPreferences | null): Promise<boolean> {
  if (!getEmailProvider()) {
    console.warn('Service email non configuré - email de confirmation non envoyé');
    return false;
  }

  const d = getEmailDefaults(prefs);
  const fromAddr = getFromAddress(d.companyName);
  const welcomeBody = prefs?.welcomeText
    ? prefs.welcomeText.split('\n').map(p => `<p>${p}</p>`).join('')
    : `<p>Merci de vous être inscrit sur <strong>${d.companyName}</strong> ! Votre compte a été créé avec succès.</p><p>Vous pouvez maintenant accéder à tous les outils disponibles et commencer à utiliser votre boîte à outils de développement.</p>`;

  try {
    const sent = await dispatchEmail({
      from: fromAddr,
      to: email,
      subject: 'Bienvenue sur DevToolbox ! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0066CC 0%, #004499 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #0066CC;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${d.logoUrl ? `<img src="${d.logoUrl}" alt="${d.companyName}" style="max-height: 60px; margin-bottom: 10px;">` : ''}
            <h1>Bienvenue sur ${d.companyName} ! 🎉</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            ${welcomeBody}
            <p style="text-align: center;">
              <a href="${getFrontendUrl()}" class="button">Accéder à ${d.companyName}</a>
            </p>
            <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br>${d.signature}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Bienvenue sur DevToolbox !
        
        Bonjour ${name},
        
        Merci de vous être inscrit sur DevToolbox ! Votre compte a été créé avec succès.
        
        Vous pouvez maintenant accéder à tous les outils disponibles et commencer à utiliser votre boîte à outils de développement.
        
        Accédez à DevToolbox : ${getFrontendUrl()}
        
        Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.
        
        Cordialement,
        L'équipe DevToolbox
      `,
    });

    if (sent) {
      console.log(`Email de confirmation envoyé à ${email}`);
    }
    return sent;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return false;
  }
}

/**
 * Interface pour une licence expirante
 */
export interface ExpiringLicence {
  name: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export interface ExpiringDomainEmail {
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  payer: string;
  sellYearly: number | null;
  currency: string;
  daysUntilExpiry: number;
  isExpired: boolean;
}

/**
 * Envoie un email de notification d'expiration de domaines
 */
export async function sendDomainExpirationEmail(
  email: string,
  name: string,
  domains: ExpiringDomainEmail[],
  prefs?: EmailPreferences | null
): Promise<boolean> {
  if (!getEmailProvider()) {
    console.warn('Service email non configuré - email de notification domaines non envoyé');
    return false;
  }

  if (domains.length === 0) {
    return false;
  }

  const billableCount = domains.filter((d) => d.payer === 'client').length;

  const domainsListHtml = domains
    .map((domain) => {
      const label = domain.clientName
        ? `${domain.name} (${domain.clientName})`
        : domain.name;
      const status = domain.isExpired
        ? `<span style="color: #dc2626; font-weight: bold;">❌ Expiré depuis ${Math.abs(domain.daysUntilExpiry)} jours</span>`
        : `<span style="color: #f59e0b; font-weight: bold;">⚠️ ${domain.daysUntilExpiry} jours restants</span>`;
      const billing =
        domain.payer === 'client'
          ? `<br><span style="color: #2563eb;">💶 À facturer${domain.sellYearly != null && domain.sellYearly > 0 ? ` — ${domain.sellYearly.toFixed(2)} ${domain.currency} HT/an` : ''}${domain.clientEmail ? ` — ${domain.clientEmail}` : ''}</span>`
          : '<br><span style="color: #64748b;">🏢 Renouvellement agence</span>';
      return `<li style="margin-bottom: 12px; padding: 12px; background: #fff; border-left: 3px solid ${domain.isExpired ? '#dc2626' : '#f59e0b'}; border-radius: 4px;">
        <strong>${label}</strong><br>
        ${status}${billing}
      </li>`;
    })
    .join('');

  const domainsListText = domains
    .map((domain) => {
      const label = domain.clientName
        ? `${domain.name} (${domain.clientName})`
        : domain.name;
      const status = domain.isExpired
        ? `❌ Expiré depuis ${Math.abs(domain.daysUntilExpiry)} jours`
        : `⚠️ ${domain.daysUntilExpiry} jours restants`;
      const billing =
        domain.payer === 'client'
          ? ` | À facturer${domain.sellYearly != null && domain.sellYearly > 0 ? ` ${domain.sellYearly.toFixed(2)} ${domain.currency} HT/an` : ''}`
          : ' | Renouvellement agence';
      return `- ${label} - ${status}${billing}`;
    })
    .join('\n');

  const d = getEmailDefaults(prefs);
  const fromAddr = getFromAddress(d.companyName);
  const subjectSuffix = billableCount > 0 ? `, ${billableCount} à facturer` : '';

  try {
    const sent = await dispatchEmail({
      from: fromAddr,
      to: email,
      subject: `🌐 Domaines à renouveler (${domains.length}${subjectSuffix})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${d.primaryColor};">Domaines à renouveler</h2>
          <p>Bonjour ${name},</p>
          <p>Vous avez <strong>${domains.length} domaine(s)</strong> nécessitant votre attention :</p>
          <ul style="list-style: none; padding: 0;">${domainsListHtml}</ul>
          <p style="color: #64748b; font-size: 14px;">Exportez le CSV facturation depuis Domain Hub pour importer dans votre banque.</p>
        </body>
        </html>
      `,
      text: `Domaines à renouveler\n\nBonjour ${name},\n\n${domainsListText}\n\nExportez le CSV facturation depuis Domain Hub.`,
    });
    return sent;
  } catch (error) {
    console.error('Erreur envoi email domaines:', error);
    return false;
  }
}

/**
 * Envoie un email de notification d'expiration de licences
 */
export async function sendLicenceExpirationEmail(
  email: string,
  name: string,
  licences: ExpiringLicence[],
  prefs?: EmailPreferences | null
): Promise<boolean> {
  if (!getEmailProvider()) {
    console.warn('Service email non configuré - email de notification de licences non envoyé');
    return false;
  }

  if (licences.length === 0) {
    return false;
  }

  const expiredCount = licences.filter((l) => l.isExpired).length;
  const warningCount = licences.length - expiredCount;

  const licencesListHtml = licences
    .map((licence) => {
      const status = licence.isExpired
        ? `<span style="color: #dc2626; font-weight: bold;">❌ Expirée depuis ${Math.abs(licence.daysUntilExpiry)} jours</span>`
        : `<span style="color: #f59e0b; font-weight: bold;">⚠️ ${licence.daysUntilExpiry} jours restants</span>`;
      return `<li style="margin-bottom: 12px; padding: 12px; background: #fff; border-left: 3px solid ${licence.isExpired ? '#dc2626' : '#f59e0b'}; border-radius: 4px;">
        <strong>${licence.name}</strong><br>
        ${status}
      </li>`;
    })
    .join('');

  const licencesListText = licences
    .map((licence) => {
      const status = licence.isExpired
        ? `❌ Expirée depuis ${Math.abs(licence.daysUntilExpiry)} jours`
        : `⚠️ ${licence.daysUntilExpiry} jours restants`;
      return `- ${licence.name} - ${status}`;
    })
    .join('\n');

  const d = getEmailDefaults(prefs);
  const fromAddr = getFromAddress(d.companyName);
  const licencesIntro = prefs?.licencesText
    ? prefs.licencesText.split('\n').map(p => `<p>${p}</p>`).join('')
    : `<p>Vous avez <strong>${licences.length} licence(s)</strong> nécessitant votre attention :</p>`;

  try {
    const sent = await dispatchEmail({
      from: fromAddr,
      to: email,
      subject: `🔑 Licences à renouveler (${licences.length})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${d.primaryColor} 0%, ${d.secondaryColor} 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .licences-list {
              list-style: none;
              padding: 0;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: ${d.primaryColor};
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .summary {
              background: ${expiredCount > 0 ? '#fee2e2' : '#fef3c7'};
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid ${expiredCount > 0 ? '#dc2626' : '#f59e0b'};
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Licences à renouveler</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            ${licencesIntro}
            <div class="summary">
              ${expiredCount > 0 ? `<strong>${expiredCount} licence(s) expirée(s)</strong>` : ''}
              ${warningCount > 0 ? `<strong>${warningCount} licence(s) expirant bientôt</strong>` : ''}
            </div>
            <ul class="licences-list">
              ${licencesListHtml}
            </ul>
            <p style="text-align: center;">
              <a href="${getFrontendUrl()}/tools/licence-key-hub" class="button">Gérer mes licences</a>
            </p>
            <p>N'oubliez pas de renouveler vos licences avant leur expiration pour éviter toute interruption de service.</p>
            <p>Cordialement,<br>${d.signature}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Licences à renouveler
        
        Bonjour ${name},
        
        Vous avez ${licences.length} licence(s) nécessitant votre attention :
        
        ${licencesListText}
        
        ${expiredCount > 0 ? `${expiredCount} licence(s) expirée(s)` : ''}
        ${warningCount > 0 ? `${warningCount} licence(s) expirant bientôt` : ''}
        
        Gérer mes licences : ${getFrontendUrl()}/tools/licence-key-hub
        
        N'oubliez pas de renouveler vos licences avant leur expiration pour éviter toute interruption de service.
        
        Cordialement,
        L'équipe DevToolbox
      `,
    });

    if (sent) {
      console.log(`Email de notification de licences envoyé à ${email}`);
    }
    return sent;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de notification de licences:', error);
    return false;
  }
}

/**
 * Envoie un email de test pour valider la configuration email
 */
export async function sendTestEmail(email: string, name: string, prefs?: EmailPreferences | null): Promise<boolean> {
  if (!getEmailProvider()) {
    console.warn('Service email non configuré - email de test non envoyé');
    return false;
  }

  const d = getEmailDefaults(prefs);
  const fromAddr = getFromAddress(d.companyName);

  try {
    const sent = await dispatchEmail({
      from: fromAddr,
      to: email,
      subject: `🔔 Test de notification ${d.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${d.primaryColor} 0%, ${d.secondaryColor} 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .success {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔔 Test de notification</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            <div class="success">
              <p><strong>✅ Succès !</strong></p>
              <p>Si vous recevez cet email, cela signifie que votre configuration SMTP fonctionne correctement.</p>
            </div>
            <p>Vous recevrez désormais des notifications par email pour les licences expirantes dans votre Licence Key Hub.</p>
            <p>Cordialement,<br>${d.signature}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Test de notification DevToolbox
        
        Bonjour ${name},
        
        ✅ Succès !
        
        Si vous recevez cet email, cela signifie que votre configuration SMTP fonctionne correctement.
        
        Vous recevrez désormais des notifications par email pour les licences expirantes dans votre Licence Key Hub.
        
        Cordialement,
        L'équipe DevToolbox
      `,
    });

    if (sent) {
      console.log(`Email de test envoyé à ${email}`);
    }
    return sent;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    return false;
  }
}

/**
 * Interface pour une tâche avec rappel
 */
export interface TaskReminder {
  title: string;
  description?: string;
  dueDate: string;
  client?: string;
  link?: string;
  daysUntilDue?: number;
}

/**
 * Envoie un email de rappel pour une tâche
 */
export async function sendTaskReminderEmail(
  email: string,
  name: string,
  task: TaskReminder,
  prefs?: EmailPreferences | null
): Promise<boolean> {
  if (!getEmailProvider()) {
    console.warn('Service email non configuré - email de rappel de tâche non envoyé');
    return false;
  }

  const daysUntilDue = task.daysUntilDue;
  let urgencyText = '';
  let urgencyColor = '#0066CC';
  
  if (daysUntilDue !== undefined) {
    if (daysUntilDue < 0) {
      urgencyText = `⚠️ En retard depuis ${Math.abs(daysUntilDue)} jour(s)`;
      urgencyColor = '#dc2626';
    } else if (daysUntilDue === 0) {
      urgencyText = '🔴 Échéance aujourd\'hui !';
      urgencyColor = '#dc2626';
    } else if (daysUntilDue === 1) {
      urgencyText = '⚠️ Échéance demain';
      urgencyColor = '#f59e0b';
    } else {
      urgencyText = `📅 Échéance dans ${daysUntilDue} jour(s)`;
      urgencyColor = '#0066CC';
    }
  }

  const taskDetailsHtml = `
    <div style="background: #fff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
      <h2 style="margin-top: 0; color: #1f2937;">${task.title}</h2>
      ${task.description ? `<p style="color: #6b7280; margin: 10px 0;">${task.description}</p>` : ''}
      <div style="margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>📅 Date d'échéance :</strong> ${new Date(task.dueDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${task.client ? `<p style="margin: 5px 0;"><strong>👤 Client :</strong> ${task.client}</p>` : ''}
        ${task.link ? `<p style="margin: 5px 0;"><strong>🔗 Lien :</strong> <a href="${task.link}" style="color: #0066CC;">${task.link}</a></p>` : ''}
        ${urgencyText ? `<p style="margin: 10px 0; padding: 10px; background: ${urgencyColor === '#dc2626' ? '#fee2e2' : urgencyColor === '#f59e0b' ? '#fef3c7' : '#dbeafe'}; border-radius: 4px; color: ${urgencyColor}; font-weight: bold;">${urgencyText}</p>` : ''}
      </div>
    </div>
  `;

  const taskDetailsText = `
${task.title}
${task.description ? `\n${task.description}` : ''}

📅 Date d'échéance : ${new Date(task.dueDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${task.client ? `👤 Client : ${task.client}` : ''}
${task.link ? `🔗 Lien : ${task.link}` : ''}
${urgencyText ? `\n${urgencyText}` : ''}
  `;

  const d = getEmailDefaults(prefs);
  const fromAddr = getFromAddress(d.companyName);
  const tasksIntro = prefs?.tasksText
    ? prefs.tasksText.split('\n').map(p => `<p>${p}</p>`).join('')
    : `<p>Vous avez une tâche qui nécessite votre attention :</p>`;

  try {
    const sent = await dispatchEmail({
      from: fromAddr,
      to: email,
      subject: `📋 Rappel de tâche : ${task.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, ${d.primaryColor} 0%, ${d.secondaryColor} 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: ${d.primaryColor};
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Rappel de tâche</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            ${tasksIntro}
            ${taskDetailsHtml}
            <p style="text-align: center;">
              <a href="${getFrontendUrl()}/tools/task-reminder" class="button">Voir mes tâches</a>
            </p>
            <p>Cordialement,<br>${d.signature}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Rappel de tâche
        
        Bonjour ${name},
        
        Vous avez une tâche qui nécessite votre attention :
        
        ${taskDetailsText}
        
        Voir mes tâches : ${getFrontendUrl()}/tools/task-reminder
        
        Cordialement,
        L'équipe DevToolbox
      `,
    });

    if (sent) {
      console.log(`Email de rappel de tâche envoyé à ${email} pour la tâche "${task.title}"`);
    }
    return sent;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de rappel de tâche:', error);
    return false;
  }
}

/**
 * Vérifie si le service email est configuré
 */
export function isEmailConfigured(): boolean {
  return getEmailProvider() !== null;
}

export { loadSmtpConfig };

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${getFrontendUrl()}/?reset=${encodeURIComponent(resetToken)}`;
  const d = getEmailDefaults();
  const from = getFromAddress(d.companyName);

  if (!getEmailProvider()) {
    return false;
  }

  return dispatchEmail({
    to: email,
    from,
    subject: `Réinitialisation de votre mot de passe — ${d.companyName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Réinitialisation du mot de passe</h2>
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valide 1 heure) :</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:${d.primaryColor};color:white;text-decoration:none;border-radius:6px;">Réinitialiser mon mot de passe</a></p>
        <p style="color:#6b7280;font-size:14px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      </div>
    `,
    text: `Bonjour ${name},\n\nRéinitialisez votre mot de passe : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
  });
}

/**
 * Charge les préférences email d'un utilisateur depuis la base
 */
export function loadEmailPreferencesForUser(userId: string): EmailPreferences | null {
  const row = db.prepare('SELECT * FROM user_email_preferences WHERE user_id = ?').get(userId) as {
    company_name: string | null;
    signature: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    logo_url: string | null;
    welcome_text: string | null;
    licences_text: string | null;
    tasks_text: string | null;
  } | undefined;

  if (!row) return null;

  return {
    companyName: row.company_name || undefined,
    signature: row.signature || undefined,
    primaryColor: row.primary_color || undefined,
    secondaryColor: row.secondary_color || undefined,
    logoUrl: row.logo_url || undefined,
    welcomeText: row.welcome_text || undefined,
    licencesText: row.licences_text || undefined,
    tasksText: row.tasks_text || undefined,
  };
}


