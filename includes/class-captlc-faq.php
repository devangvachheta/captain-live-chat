<?php
/**
 * FAQ — questions & answers shown in the widget's "FAQ" tab.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Faq
 */
class CAPTLC_Faq {

	const OPTION_KEY = 'captlc_faqs';

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		// Admin — manage the list (Widget Designer page).
		add_action( 'wp_ajax_captlc_get_faqs', array( $this, 'admin_get_faqs' ) );
		add_action( 'wp_ajax_captlc_save_faqs', array( $this, 'save_faqs' ) );

		// Public — the widget's FAQ tab (visitor is never logged in as an agent).
		add_action( 'wp_ajax_captlc_get_widget_faqs', array( $this, 'get_widget_faqs' ) );
		add_action( 'wp_ajax_nopriv_captlc_get_widget_faqs', array( $this, 'get_widget_faqs' ) );
	}

	/**
	 * Returns the saved FAQ list, oldest-added first.
	 *
	 * @return array[] List of array( 'id' => string, 'question' => string, 'answer' => string ).
	 */
	public static function get_faqs() {
		$faqs = get_option( self::OPTION_KEY, array() );
		return is_array( $faqs ) ? $faqs : array();
	}

	/**
	 * Admin: returns the full FAQ list for the Widget Designer editor.
	 *
	 * @return void
	 */
	public function admin_get_faqs() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		wp_send_json_success( array( 'faqs' => self::get_faqs() ) );
	}

	/**
	 * Public: returns the FAQ list for the visitor-facing widget.
	 * Same shape as admin_get_faqs() but no capability check — anyone can read FAQs.
	 *
	 * @return void
	 */
	public function get_widget_faqs() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		wp_send_json_success( array( 'faqs' => self::get_faqs() ) );
	}

	/**
	 * Saves the full FAQ list (replaces whatever was there before).
	 *
	 * @return void
	 */
	public function save_faqs() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$raw  = isset( $_POST['faqs'] ) ? wp_unslash( $_POST['faqs'] ) : '[]';
		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'captain-live-chat' ) ) );
		}

		$sanitized = array();

		foreach ( $data as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}

			$question = isset( $item['question'] ) ? sanitize_text_field( $item['question'] ) : '';
			$answer   = isset( $item['answer'] ) ? sanitize_textarea_field( $item['answer'] ) : '';

			if ( '' === $question || '' === $answer ) {
				continue; // skip incomplete rows rather than saving empty FAQs
			}

			$sanitized[] = array(
				'id'       => isset( $item['id'] ) ? sanitize_key( $item['id'] ) : wp_generate_uuid4(),
				'question' => $question,
				'answer'   => $answer,
			);
		}

		update_option( self::OPTION_KEY, $sanitized );

		wp_send_json_success( array( 'faqs' => $sanitized ) );
	}
}
