import nodemailer from 'nodemailer';

// Configuration SMTP depuis les variables d'environnement
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@devtoolbox.com';

// Créer le transporteur email (seulement si configuré)
let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true pour 465, false pour les autres ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Envoie un email de confirmation de bienvenue à un nouvel utilisateur
 */
export async function sendConfirmationEmail(email: string, name: string): Promise<boolean> {
  // Si le transporteur n'est pas configuré, on retourne false sans erreur
  if (!transporter) {
    console.warn('SMTP non configuré - email de confirmation non envoyé');
    return false;
  }

  try {
    const mailOptions = {
      from: `"DevToolbox" <${SMTP_FROM}>`,
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
            <h1>Bienvenue sur DevToolbox ! 🎉</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Merci de vous être inscrit sur <strong>DevToolbox</strong> ! Votre compte a été créé avec succès.</p>
            <p>Vous pouvez maintenant accéder à tous les outils disponibles et commencer à utiliser votre boîte à outils de développement.</p>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Accéder à DevToolbox</a>
            </p>
            <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br>L'équipe DevToolbox</p>
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
        
        Accédez à DevToolbox : ${process.env.FRONTEND_URL || 'http://localhost:5173'}
        
        Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.
        
        Cordialement,
        L'équipe DevToolbox
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    return false;
  }
}

/**
 * Vérifie si le service email est configuré
 */
export function isEmailConfigured(): boolean {
  return transporter !== null;
}

