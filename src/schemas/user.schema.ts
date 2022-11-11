import { object, string, TypeOf, z } from 'zod';
import { RoleEnumType } from '../entities/user.entity';

export const createUserSchema = object({
  body: object({
    name: string({
      required_error: 'O nome é requerido',
    }),
    email: string({
      required_error: 'O campo e-mail é requerido',
    }).email('Endereço de e-mail invalido'),
    password: string({
      required_error: 'Uma senha deve ser fornecida',
    })
      .min(8, 'A senha deve consister em 8 ou mais caracteres')
      .max(32, 'A senha deve ser até ou menos de 32 caracteres'),
    passwordConfirm: string({
      required_error: 'Por favor, confirme sua senha',
    }),
    role: z.optional(z.nativeEnum(RoleEnumType)),
  }).refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'As senhas fornecidas não coincidem',
  }),
});

export const loginUserSchema = object({
  body: object({
    email: string({
      required_error: 'Um endereço de e-mail é necessário',
    }).email('Invalid email address'),
    password: string({
      required_error: 'Por favor, entre com sua senha',
    }).min(8, 'Invalid email or password'),
  }),
});

export const verifyEmailSchema = object({
  params: object({
    verificationCode: string(),
  }),
});

export type CreateUserInput = Omit<
  TypeOf<typeof createUserSchema>['body'],
  'passwordConfirm'
>;

export type LoginUserInput = TypeOf<typeof loginUserSchema>['body'];
export type VerifyEmailInput = TypeOf<typeof verifyEmailSchema>['params'];
