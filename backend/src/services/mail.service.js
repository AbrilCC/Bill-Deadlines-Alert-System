import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendResetPasswordEmail(email, resetLink) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recuperar contraseña - Mango",
    html: `
      <h2>Recuperar contraseña</h2>

      <p>Si te ha llegado este mail es porque has pedido restablecer tu contraseña en Mango - Sistema de alerta de vencimientos.
      Haz click en el siguiente link para crear una nueva contraseña:</p>

      <a href="${resetLink}">
        Restablecer contraseña
      </a>

      <p>Este link expira en 15 minutos.</p>
    `,
  });
}