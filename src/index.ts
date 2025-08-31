import { emailHandler } from "./handler/emailHandler";
import { Environment } from "./type.d";

export default {
  async fetch(_request: Request, _env: Environment, _ctx: ExecutionContext): Promise<Response> {
    return new Response('Email handler is active', { status: 200 });
  },

  async email(message: ForwardableEmailMessage, env: Environment, ctx: ExecutionContext): Promise<void> {
    await emailHandler(message, env, ctx);
  }
};
