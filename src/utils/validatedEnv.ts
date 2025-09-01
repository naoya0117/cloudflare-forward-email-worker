import { Environment } from "../type.d"

/**
 * バリデーション済み環境変数の型定義
 * すべてのフィールドが必須かつnon-nullableとなる
 */
type ValidatedEnv = {
    [key in keyof Environment]-?: NonNullable<Environment[key]>;
}

/**
 * 環境変数をバリデーションする
 * @param env 環境変数
 * @returns バリデーション済み環境変数
 */
export const validateEnv = (env: Environment): ValidatedEnv => {
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined || value === null) {
            throw new Error(`${key} is not set`)
        }
    }
    return env as ValidatedEnv;
}