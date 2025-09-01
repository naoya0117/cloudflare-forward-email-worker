import { Environment } from  "../../type.d";
import { validateEnv } from "../../utils/validatedEnv";

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
        await forwardEmail(message, FORWARD_EMAIL);
    } catch (error) {
        // エラーが起きたらフォールバック用のメールアドレスに転送する
        console.warn("Warning: Primary forward failed:", (error as Error).message);
        await forwardEmail(message, FALLBACK_EMAIL);
    }

    return new Response("Email forwarded successfully", { status: 200 });
}

/**
 * メールを転送する関数
 * @param message 
 * @param email 
 */
const forwardEmail = async(message: ForwardableEmailMessage, email: string) => {
    try {
        await message.forward(email);
    } catch (error) {
        console.warn("Warning: Forward failed:", (error as Error).message);
        throw error;
    }
}