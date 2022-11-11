import { object, string, TypeOf } from 'zod';

export const createPostSchema = object({
  body: object({
    title: string({
      required_error: 'O título do post é necessário',
    }),
    content: string({
      required_error: 'O conteúdo do post é necessário',
    }),
    image: string({
      required_error: 'Uma imagem é necessário para a capa do post',
    }),
  }),
});

const params = {
  params: object({
    postId: string(),
  }),
};

export const getPostSchema = object({
  ...params,
});

export const updatePostSchema = object({
  ...params,
  body: object({
    title: string(),
    content: string(),
    image: string(),
  }).partial(),
});

export const deletePostSchema = object({
  ...params,
});

export type CreatePostInput = TypeOf<typeof createPostSchema>['body'];
export type GetPostInput = TypeOf<typeof getPostSchema>['params'];
export type UpdatePostInput = TypeOf<typeof updatePostSchema>;
export type DeletePostInput = TypeOf<typeof deletePostSchema>['params'];