<?php
/**
 * Settings storage and defaults.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Settings
 *
 * Reads/writes the single `captlc_settings` option.
 * Saving happens via CAPTLC_Ajax::save_settings() (called from the React Settings page).
 */
class CAPTLC_Settings {

	const OPTION_KEY = 'captlc_settings';

	/**
	 * Returns merged settings (defaults + saved).
	 *
	 * @return array
	 */
	public static function get_settings() {
		$defaults = array(
			'allowed_roles'    => array( 'administrator' ),
			'allowed_users'    => array(),
			'sound_enabled'    => true,
			'email_notif'      => true,
			'browser_notif'    => true,
			'offline_message'  => __( 'Leave your message. We\'ll reply soon.', 'captain-live-chat' ),
			'widget_title'     => __( 'Chat with us', 'captain-live-chat' ),
			'poll_interval_ms' => 3000,
		);

		$saved = get_option( self::OPTION_KEY, array() );

		return wp_parse_args( $saved, $defaults );
	}

	/**
	 * Sanitizes and persists a settings array (called from the ajax save handler).
	 *
	 * @param array $raw Raw, unsanitized settings (typically from $_POST).
	 * @return array The sanitized settings that were saved.
	 */
	public static function save_settings( $raw ) {
		$allowed_roles = isset( $raw['allowed_roles'] ) && is_array( $raw['allowed_roles'] )
			? array_map( 'sanitize_key', $raw['allowed_roles'] )
			: array();

		$allowed_users = isset( $raw['allowed_users'] ) && is_array( $raw['allowed_users'] )
			? array_map( 'absint', $raw['allowed_users'] )
			: array();

		$settings = array(
			'allowed_roles'    => $allowed_roles,
			'allowed_users'    => $allowed_users,
			'sound_enabled'    => ! empty( $raw['sound_enabled'] ) ? 1 : 0,
			'email_notif'      => ! empty( $raw['email_notif'] ) ? 1 : 0,
			'browser_notif'    => ! empty( $raw['browser_notif'] ) ? 1 : 0,
			'offline_message'  => isset( $raw['offline_message'] ) ? sanitize_textarea_field( $raw['offline_message'] ) : '',
			'widget_title'     => isset( $raw['widget_title'] ) ? sanitize_text_field( $raw['widget_title'] ) : '',
			'poll_interval_ms' => isset( $raw['poll_interval_ms'] ) ? absint( $raw['poll_interval_ms'] ) : 3000,
		);

		update_option( self::OPTION_KEY, $settings );

		return $settings;
	}
}
