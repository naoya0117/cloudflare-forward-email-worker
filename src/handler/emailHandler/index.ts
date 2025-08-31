import { Environment } from  "../../type.d";

/**
 * メールをFORWARD_EMAILに転送する関数
 * @param message 
 * @param env 
 * @param _ctx 
 * @returns Responseオブジェクト
 */
export const emailHandler = async(message: ForwardableEmailMessage, env: Environment, _ctx: ExecutionContext): Promise<Response> => {

    const { FORWARD_EMAIL, FALLBACK_EMAIL } = env;

    try {
        await message.forward(FORWARD_EMAIL);
    } catch (error) {
        console.warn("Warning: Primary forward failed:", (error as Error).message);
        await message.forward(FALLBACK_EMAIL);
    }

    return new Response("Email forwarded successfully", { status: 200 });
}