interface EmailMessage {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  forward(email: string): Promise<void>;
}

interface Environment {
  FORWARD_EMAIL?: string;
  FALLBACK_EMAIL?: string;
  [key: string]: string | undefined;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Environment, ctx: ExecutionContext): Promise<Response> {
    return new Response('Email handler is active', { status: 200 });
  },

  async email(message: EmailMessage, env: Environment, ctx: ExecutionContext): Promise<void> {
    if (!message) {
      console.warn("Warning: message is missing. Exiting.");
      return;
    }

    if (!message.from || typeof message.from !== 'string' || !message.from.includes('@')) {
      console.warn("Warning: message.from is not a valid email address. Exiting.");
      return;
    }

    // Secretsから転送先アドレスを取得
    const forwardEmail = env.FORWARD_EMAIL;
    const fallbackAddress = env.FALLBACK_EMAIL;

    // Secretsが設定されていない場合のチェック
    if (!forwardEmail || !fallbackAddress) {
      console.error("Error: Required email secrets are not configured.");
      throw new Error("Email configuration is missing");
    }

    try {
      await message.forward(forwardEmail);
      console.log("Email successfully forwarded to primary address");
    } catch (error) {
      // プライマリ転送に失敗したら、fallbackAddressへ転送
      console.warn("Warning: Primary forward failed:", (error as Error).message);
      try {
        await message.forward(fallbackAddress);
        console.log("Email successfully forwarded to fallback address");
      } catch (fallbackError) {
        console.error("Error forwarding email to fallback address:", fallbackError);
        throw fallbackError;
      }
    }
  }
};
