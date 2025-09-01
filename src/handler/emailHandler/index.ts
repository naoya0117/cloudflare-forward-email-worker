import { Environment } from  "../../type.d/index.js";
import { validateEnv } from "../../utils/validatedEnv.js";

/**
 * メールをFORWARD_EMAILに転送し、エラーが起きたらFALLBACK_EMAILに転送する
 * @param message 
 * @param env 
 * @param _ctx 
 * @returns Responseオブジェクト
 */
export const emailHandler = async(message: ForwardableEmailMessage, env: Environment, _ctx: ExecutionContext): Promise<Response> => {

    const { FORWARD_EMAIL, FALLBACK_EMAIL } = validateEnv(env);

    try {
        await message.forward(FORWARD_EMAIL);
    } catch (error) {
        // エラーが起きたらフォールバック用のメールアドレスに転送する
        console.warn("Warning: Primary forward failed:", (error as Error).message);
        await message.forward(FALLBACK_EMAIL);
    }

    return new Response("Email forwarded successfully", { status: 200 });
}