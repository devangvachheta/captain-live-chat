<?php
/**
 * AI Auto-Reply — provider management + response engine.
 *
 * Supports: Groq, Google Gemini, OpenAI, Anthropic Claude, OpenRouter.
 * API keys are encrypted with openssl before storing in wp_options.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_AI
 */
class CAPTLC_AI {

	const OPTION_PROVIDERS = 'captlc_ai_providers';
	const OPTION_GENERAL   = 'captlc_ai_general';
	const CIPHER           = 'AES-256-CBC';

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_ai_settings',   array( $this, 'get_settings' ) );
		add_action( 'wp_ajax_captlc_save_ai_provider',  array( $this, 'save_provider' ) );
		add_action( 'wp_ajax_captlc_test_ai_provider',  array( $this, 'test_provider' ) );
		add_action( 'wp_ajax_captlc_save_ai_general',   array( $this, 'save_general' ) );
	}

	// ── Encryption helpers ────────────────────────────────────────────────

	/**
	 * Returns the encryption key derived from the WP secret key.
	 *
	 * @return string 32-byte key.
	 */
	private static function enc_key() {
		return substr( hash( 'sha256', wp_salt( 'auth' ), true ), 0, 32 );
	}

	/**
	 * Encrypts a plain-text API key.
	 *
	 * @param string $plain Plain API key.
	 * @return string Base64-encoded cipher text.
	 */
	private static function encrypt( $plain ) {
		if ( ! function_exists( 'openssl_encrypt' ) || ! $plain ) {
			return $plain;
		}

		$iv = openssl_random_pseudo_bytes( 16 );

		return base64_encode( $iv . openssl_encrypt( $plain, self::CIPHER, self::enc_key(), OPENSSL_RAW_DATA, $iv ) );
	}

	/**
	 * Decrypts a stored API key.
	 *
	 * @param string $stored Base64-encoded cipher text.
	 * @return string Plain API key.
	 */
	private static function decrypt( $stored ) {
		if ( ! function_exists( 'openssl_decrypt' ) || ! $stored ) {
			return $stored;
		}

		$raw = base64_decode( $stored );
		$iv  = substr( $raw, 0, 16 );

		return openssl_decrypt( substr( $raw, 16 ), self::CIPHER, self::enc_key(), OPENSSL_RAW_DATA, $iv );
	}

	// ── AJAX handlers ─────────────────────────────────────────────────────

	/**
	 * Returns current AI settings (keys masked, connected flag, general config).
	 *
	 * @return void
	 */
	public function get_settings() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$stored    = (array) get_option( self::OPTION_PROVIDERS, array() );
		$providers = array();

		foreach ( $stored as $id => $data ) {
			$providers[ $id ] = array(
				'key'       => '', // never send decrypted key to frontend
				'model'     => $data['model'] ?? '',
				'connected' => ! empty( $data['encrypted_key'] ),
			);
		}

		$general = (array) get_option( self::OPTION_GENERAL, array() );

		wp_send_json_success(
			array(
				'providers'            => $providers,
				'auto_reply_enabled'   => ! empty( $general['auto_reply_enabled'] ),
				'active_provider'      => $general['active_provider'] ?? 'groq',
				'system_prompt'        => $general['system_prompt'] ?? '',
			)
		);
	}

	/**
	 * Saves (or removes) a provider API key and selected model.
	 *
	 * @return void
	 */
	public function save_provider() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$provider = isset( $_POST['provider'] ) ? sanitize_key( wp_unslash( $_POST['provider'] ) ) : '';
		$api_key  = isset( $_POST['api_key'] )  ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		$model    = isset( $_POST['model'] )    ? sanitize_text_field( wp_unslash( $_POST['model'] ) )   : '';

		if ( ! $provider ) {
			wp_send_json_error( array( 'message' => __( 'Missing provider.', 'captain-live-chat' ) ) );
		}

		$stored = (array) get_option( self::OPTION_PROVIDERS, array() );

		if ( $api_key ) {
			$stored[ $provider ] = array(
				'encrypted_key' => self::encrypt( $api_key ),
				'model'         => $model,
			);
		} else {
			unset( $stored[ $provider ] );
		}

		update_option( self::OPTION_PROVIDERS, $stored );

		wp_send_json_success( array( 'connected' => ! empty( $api_key ) ) );
	}

	/**
	 * Tests a provider key by sending a minimal "ping" prompt.
	 *
	 * @return void
	 */
	public function test_provider() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$provider = isset( $_POST['provider'] ) ? sanitize_key( wp_unslash( $_POST['provider'] ) ) : '';
		$api_key  = isset( $_POST['api_key'] )  ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		$model    = isset( $_POST['model'] )    ? sanitize_text_field( wp_unslash( $_POST['model'] ) )   : '';

		if ( ! $provider || ! $api_key ) {
			wp_send_json_error( array( 'message' => __( 'Missing provider or API key.', 'captain-live-chat' ) ) );
		}

		$response = self::call_provider( $provider, $api_key, $model, 'Say "ok" in one word.', '' );

		if ( is_wp_error( $response ) ) {
			wp_send_json_error( array( 'message' => $response->get_error_message() ) );
		}

		wp_send_json_success( array( 'message' => __( 'Connected successfully.', 'captain-live-chat' ) ) );
	}

	/**
	 * Saves general AI settings (auto-reply toggle, active provider, system prompt).
	 *
	 * @return void
	 */
	public function save_general() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$general = array(
			'auto_reply_enabled' => ! empty( $_POST['auto_reply_enabled'] ) && '1' === sanitize_text_field( wp_unslash( $_POST['auto_reply_enabled'] ) ),
			'active_provider'    => isset( $_POST['active_provider'] ) ? sanitize_key( wp_unslash( $_POST['active_provider'] ) ) : 'groq',
			'system_prompt'      => isset( $_POST['system_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['system_prompt'] ) ) : '',
		);

		update_option( self::OPTION_GENERAL, $general );

		wp_send_json_success( $general );
	}

	// ── Auto-reply engine ─────────────────────────────────────────────────

	/**
	 * Generates an AI reply for a visitor message.
	 * Called from the message polling endpoint when all agents are offline.
	 *
	 * @param int    $thread_id      Thread ID.
	 * @param string $visitor_message Latest message from visitor.
	 * @return string|WP_Error AI reply text, or WP_Error on failure.
	 */
	public static function auto_reply( $thread_id, $visitor_message ) {
		$general  = (array) get_option( self::OPTION_GENERAL, array() );
		$stored   = (array) get_option( self::OPTION_PROVIDERS, array() );
		$provider = $general['active_provider'] ?? 'groq';
		$prompt   = $general['system_prompt'] ?? '';

		if ( empty( $stored[ $provider ]['encrypted_key'] ) ) {
			return new WP_Error( 'no_key', __( 'No API key configured.', 'captain-live-chat' ) );
		}

		$key   = self::decrypt( $stored[ $provider ]['encrypted_key'] );
		$model = $stored[ $provider ]['model'] ?? '';

		return self::call_provider( $provider, $key, $model, $visitor_message, $prompt );
	}

	/**
	 * Makes the actual HTTP request to the chosen AI provider.
	 *
	 * @param string $provider Provider ID.
	 * @param string $api_key  Plain API key.
	 * @param string $model    Model name.
	 * @param string $message  User message.
	 * @param string $system   System prompt.
	 * @return string|WP_Error Reply text or error.
	 */
	private static function call_provider( $provider, $api_key, $model, $message, $system ) {
		switch ( $provider ) {
			case 'groq':
				return self::call_openai_compatible(
					'https://api.groq.com/openai/v1/chat/completions',
					$api_key,
					$model ?: 'llama-3.1-8b-instant',
					$message,
					$system
				);

			case 'openai':
				return self::call_openai_compatible(
					'https://api.openai.com/v1/chat/completions',
					$api_key,
					$model ?: 'gpt-4o-mini',
					$message,
					$system
				);

			case 'openrouter':
				return self::call_openai_compatible(
					'https://openrouter.ai/api/v1/chat/completions',
					$api_key,
					$model ?: 'meta-llama/llama-3.3-70b-instruct:free',
					$message,
					$system,
					array( 'HTTP-Referer' => home_url(), 'X-Title' => get_bloginfo( 'name' ) )
				);

			case 'gemini':
				return self::call_gemini( $api_key, $model ?: 'gemini-2.0-flash', $message, $system );

			case 'anthropic':
				return self::call_anthropic( $api_key, $model ?: 'claude-haiku-4-5-20251001', $message, $system );

			default:
				return new WP_Error( 'unknown_provider', __( 'Unknown AI provider.', 'captain-live-chat' ) );
		}
	}

	/**
	 * OpenAI-compatible endpoint (OpenAI, Groq, OpenRouter).
	 *
	 * @param string $url     API URL.
	 * @param string $key     API key.
	 * @param string $model   Model name.
	 * @param string $message User message.
	 * @param string $system  System prompt.
	 * @param array  $extra_headers Extra HTTP headers.
	 * @return string|WP_Error
	 */
	private static function call_openai_compatible( $url, $key, $model, $message, $system, $extra_headers = array() ) {
		$messages = array();

		if ( $system ) {
			$messages[] = array( 'role' => 'system', 'content' => $system );
		}

		$messages[] = array( 'role' => 'user', 'content' => $message );

		$headers = array_merge(
			array(
				'Content-Type'  => 'application/json',
				'Authorization' => 'Bearer ' . $key,
			),
			$extra_headers
		);

		$response = wp_remote_post(
			$url,
			array(
				'headers' => $headers,
				'body'    => wp_json_encode(
					array(
						'model'      => $model,
						'messages'   => $messages,
						'max_tokens' => 400,
					)
				),
				'timeout' => 20,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $body['choices'][0]['message']['content'] ) ) {
			return trim( $body['choices'][0]['message']['content'] );
		}

		$err = $body['error']['message'] ?? __( 'Invalid response from AI provider.', 'captain-live-chat' );

		return new WP_Error( 'ai_error', $err );
	}

	/**
	 * Google Gemini API.
	 *
	 * @param string $key     API key.
	 * @param string $model   Model name.
	 * @param string $message User message.
	 * @param string $system  System prompt.
	 * @return string|WP_Error
	 */
	private static function call_gemini( $key, $model, $message, $system ) {
		$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";

		$parts  = array();
		$prompt = $system ? $system . "\n\nVisitor: " . $message : $message;
		$parts[] = array( 'text' => $prompt );

		$response = wp_remote_post(
			$url,
			array(
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'contents'         => array( array( 'parts' => $parts ) ),
						'generationConfig' => array( 'maxOutputTokens' => 400 ),
					)
				),
				'timeout' => 20,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $body['candidates'][0]['content']['parts'][0]['text'] ) ) {
			return trim( $body['candidates'][0]['content']['parts'][0]['text'] );
		}

		$err = $body['error']['message'] ?? __( 'Invalid response from Gemini.', 'captain-live-chat' );

		return new WP_Error( 'ai_error', $err );
	}

	/**
	 * Anthropic Claude API.
	 *
	 * @param string $key     API key.
	 * @param string $model   Model name.
	 * @param string $message User message.
	 * @param string $system  System prompt.
	 * @return string|WP_Error
	 */
	private static function call_anthropic( $key, $model, $message, $system ) {
		$body = array(
			'model'      => $model,
			'max_tokens' => 400,
			'messages'   => array(
				array( 'role' => 'user', 'content' => $message ),
			),
		);

		if ( $system ) {
			$body['system'] = $system;
		}

		$response = wp_remote_post(
			'https://api.anthropic.com/v1/messages',
			array(
				'headers' => array(
					'x-api-key'         => $key,
					'anthropic-version' => '2023-06-01',
					'Content-Type'      => 'application/json',
				),
				'body'    => wp_json_encode( $body ),
				'timeout' => 20,
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( isset( $body['content'][0]['text'] ) ) {
			return trim( $body['content'][0]['text'] );
		}

		$err = $body['error']['message'] ?? __( 'Invalid response from Anthropic.', 'captain-live-chat' );

		return new WP_Error( 'ai_error', $err );
	}
}
