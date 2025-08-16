import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Email Handler worker', () => {
	it('responds with status message (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Email handler is active"`);
		expect(response.status).toBe(200);
	});

	it('responds with status message (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatchInlineSnapshot(`"Email handler is active"`);
		expect(response.status).toBe(200);
	});

	describe('email handler', () => {
		it('should forward email successfully', async () => {
			// モックメッセージオブジェクト
			const mockMessage = {
				from: 'test@example.com',
				to: 'recipient@example.com',
				subject: 'Test Email',
				forward: vi.fn().mockResolvedValue(undefined)
			};

			// モック環境変数
			const mockEnv = {
				FORWARD_EMAIL: 'forward@example.com',
				FALLBACK_EMAIL: 'fallback@example.com'
			};

			const ctx = createExecutionContext();

			// email関数を直接テスト
			await worker.email(mockMessage, mockEnv, ctx);
			await waitOnExecutionContext(ctx);

			// forward関数が正しいアドレスで呼ばれたかチェック
			expect(mockMessage.forward).toHaveBeenCalledWith('forward@example.com');
			expect(mockMessage.forward).toHaveBeenCalledTimes(1);
		});

		it('should use fallback address when primary forward fails', async () => {
			const mockMessage = {
				from: 'test@example.com',
				to: 'recipient@example.com',
				subject: 'Test Email',
				forward: vi.fn()
					.mockRejectedValueOnce(new Error('Primary forward failed'))
					.mockResolvedValueOnce(undefined)
			};

			const mockEnv = {
				FORWARD_EMAIL: 'forward@example.com',
				FALLBACK_EMAIL: 'fallback@example.com'
			};

			const ctx = createExecutionContext();

			await worker.email(mockMessage, mockEnv, ctx);
			await waitOnExecutionContext(ctx);

			// 両方のアドレスが呼ばれたかチェック
			expect(mockMessage.forward).toHaveBeenCalledWith('forward@example.com');
			expect(mockMessage.forward).toHaveBeenCalledWith('fallback@example.com');
			expect(mockMessage.forward).toHaveBeenCalledTimes(2);
		});

		it('should throw error when both forwards fail', async () => {
			const mockMessage = {
				from: 'test@example.com',
				to: 'recipient@example.com',
				subject: 'Test Email',
				forward: vi.fn()
					.mockRejectedValueOnce(new Error('Primary forward failed'))
					.mockRejectedValueOnce(new Error('Fallback forward failed'))
			};

			const mockEnv = {
				FORWARD_EMAIL: 'forward@example.com',
				FALLBACK_EMAIL: 'fallback@example.com'
			};

			const ctx = createExecutionContext();

			await expect(worker.email(mockMessage, mockEnv, ctx))
				.rejects
				.toThrow('Fallback forward failed');
		});

		it('should exit early when message is missing', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const mockEnv = {
				FORWARD_EMAIL: 'forward@example.com',
				FALLBACK_EMAIL: 'fallback@example.com'
			};

			const ctx = createExecutionContext();

			// null messageでテスト
			await worker.email(null, mockEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(consoleSpy).toHaveBeenCalledWith('Warning: message is missing. Exiting.');
			consoleSpy.mockRestore();
		});

		it('should exit early when from address is invalid', async () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const mockMessage = {
				from: 'invalid-email',
				forward: vi.fn()
			};

			const mockEnv = {
				FORWARD_EMAIL: 'forward@example.com',
				FALLBACK_EMAIL: 'fallback@example.com'
			};

			const ctx = createExecutionContext();

			await worker.email(mockMessage, mockEnv, ctx);
			await waitOnExecutionContext(ctx);

			expect(consoleSpy).toHaveBeenCalledWith('Warning: message.from is not a valid email address. Exiting.');
			expect(mockMessage.forward).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should throw error when email configuration is missing', async () => {
			const mockMessage = {
				from: 'test@example.com',
				forward: vi.fn()
			};

			// 環境変数が設定されていない場合
			const mockEnv = {};

			const ctx = createExecutionContext();

			await expect(worker.email(mockMessage, mockEnv, ctx))
				.rejects
				.toThrow('Email configuration is missing');
		});
	});
});
