/**
 * 環境変数の型定義
 */
export type Environment = {
    /** 転送先メールアドレス */
    FORWARD_EMAIL?: string;
    /** フォールバック用メールアドレス */
    FALLBACK_EMAIL?: string;
}
