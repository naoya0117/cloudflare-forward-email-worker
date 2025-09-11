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

    // メッセージの妥当性チェック
    if (!message) {
        console.warn('Warning: message is missing. Exiting.');
        return new Response("Bad Request: Message is missing", { status: 400 });
    }

    // メールアドレスの妥当性チェック
    if (!message.from || !isValidEmail(message.from)) {
        console.warn('Warning: message.from is not a valid email address. Exiting.');
        return new Response("Bad Request: Invalid from address", { status: 400 });
    }

    const { FORWARD_EMAIL, FALLBACK_EMAIL } = validateEnv(env);

    try {
        await message.forward(FORWARD_EMAIL);
        console.log("Email forwarded successfully to primary address:", FORWARD_EMAIL);
    } catch (primaryError) {
        console.warn("Warning: Primary forward failed:", (primaryError as Error).message);
        
        try {
            await message.forward(FALLBACK_EMAIL);
            console.log("Email forwarded successfully to fallback address:", FALLBACK_EMAIL);
        } catch (fallbackError) {
            console.error("Error: Both primary and fallback forwards failed");
            console.error("Primary error:", (primaryError as Error).message);
            console.error("Fallback error:", (fallbackError as Error).message);
            
            // テストとの互換性のため、両方失敗時は例外をthrow
            throw new Error("Fallback forward failed");
        }
    }

    return new Response("Email forwarded successfully", { status: 200 });
}

/**
 * メールアドレスの妥当性をチェックする
 * @param email チェック対象のメールアドレス
 * @returns 妥当性チェック結果
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}