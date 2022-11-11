import nodemailer from 'nodemailer';
import { User } from '../entities/user.entity';
import config from 'config';
import pug from 'pug';
import { convert } from 'html-to-text';

const smtp = config.get<{
  host: string;
  port: number;
  user: string;
  pass: string;
}>('smtp');

export default class Email {
  firstName: string;
  to: string;
  from: string;
  constructor(public user: User, public url: string) {
    this.firstName = user.name.split(' ')[0];
    this.to = user.email;
    this.from = `Codevo ${config.get<string>('emailFrom')}`;
  }

  private newTransport() {

    return nodemailer.createTransport({
      ...smtp,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }

  private async send(template: string, subject: string) {
    //Gerar modelo HTML com base na string do modelo
    const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
      firstName: this.firstName,
      subject,
      url: this.url,
    });
    // Criar mailOptions
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: convert(html),
      html,
    };

    // Enviar e-mail com código de verificação
    const info = await this.newTransport().sendMail(mailOptions);
    console.log(nodemailer.getTestMessageUrl(info));
  }

  async sendVerificationCode() {
    await this.send('verificationCode', 'Seu código de ativação');
  }

  async sendPasswordResetToken() {
    await this.send(
      'resetPassword',
      'Seu token de redefinição de senha (válido por apenas 10 minutos)'
    );
  }
}
