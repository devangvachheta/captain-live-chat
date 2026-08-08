<?php
/**
 * Canned Replies management — stored as a single WP option (JSON array).
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Canned_Replies
 */
class CAPTLC_Canned_Replies {

	const OPTION_KEY = 'captlc_canned_replies';

	/**
	 * Registers ajax hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_canned_replies',    array( $this, 'get_replies' ) );
		add_action( 'wp_ajax_nopriv_captlc_get_canned_replies', array( $this, 'get_replies' ) );
		add_action( 'wp_ajax_captlc_save_canned_replies',   array( $this, 'save_replies' ) );
	}

	/**
	 * Returns all canned replies.
	 *
	 * @return void
	 */
	public function get_replies() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		wp_send_json_success( array( 'replies' => self::all() ) );
	}

	/**
	 * Saves the full canned replies list (replace strategy — client sends the full array).
	 *
	 * @return void
	 */
	public function save_replies() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$raw = isset( $_POST['replies'] ) ? wp_unslash( $_POST['replies'] ) : '[]';

		// The client sends JSON string.
		$decoded = json_decode( $raw, true );

		if ( ! is_array( $decoded ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'captain-live-chat' ) ) );
		}

		$sanitized = array();
		foreach ( $decoded as $item ) {
			if ( empty( $item['shortcut'] ) || empty( $item['text'] ) ) {
				continue;
			}

			$sanitized[] = array(
				'id'       => isset( $item['id'] ) ? absint( $item['id'] ) : time() + wp_rand( 0, 999 ),
				'shortcut' => sanitize_text_field( $item['shortcut'] ),
				'text'     => sanitize_textarea_field( $item['text'] ),
			);
		}

		update_option( self::OPTION_KEY, $sanitized );

		wp_send_json_success( array( 'replies' => $sanitized ) );
	}

	/**
	 * Returns all canned replies from the DB.
	 *
	 * @return array
	 */
	public static function all() {
		return (array) get_option( self::OPTION_KEY, array() );
	}
}
