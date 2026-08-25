<?php
/**
 * Settings storage and defaults.
 *
 * @package captain-live-chat
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
			'user_page_access' => array(),
			'sound_enabled'    => true,
			'email_notif'      => true,
			'browser_notif'    => true,
			'reminder_email_enabled' => true,
			'reminder_delay_hours'   => 4,
			'offline_message'  => __( 'Leave your message. We\'ll reply soon.', 'captain-live-chat' ),
			'widget_title'     => __( 'Chat with us', 'captain-live-chat' ),
			'poll_interval_ms' => 3000,
			'quick_replies'    => array( 'Pricing', 'Support', 'Get a Demo' ),
			'delete_data_on_uninstall'      => false,
			'preserve_settings_on_uninstall' => false,
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

		// offline_message / widget_title / poll_interval_ms / quick_replies are
		// intentionally NOT part of this form anymore — they're edited on the
		// Widget Designer page (CAPTLC_Widget_Design) and only fall back to the
		// static defaults from get_settings() above if that's ever empty.
		// allowed_users / user_page_access are likewise intentionally excluded —
		// they're edited on the Profile → Team Access screen via
		// save_team_access() below, and would otherwise get wiped to empty
		// every time this form (which doesn't include them) is submitted.
		$settings = array(
			'allowed_roles' => $allowed_roles,
			'sound_enabled' => ! empty( $raw['sound_enabled'] ) ? 1 : 0,
			'email_notif'   => ! empty( $raw['email_notif'] ) ? 1 : 0,
			'browser_notif' => ! empty( $raw['browser_notif'] ) ? 1 : 0,
			'reminder_email_enabled' => ! empty( $raw['reminder_email_enabled'] ) ? 1 : 0,
			'reminder_delay_hours'   => isset( $raw['reminder_delay_hours'] ) ? max( 1, min( 72, absint( $raw['reminder_delay_hours'] ) ) ) : 4,
			'delete_data_on_uninstall'       => ! empty( $raw['delete_data_on_uninstall'] ) ? 1 : 0,
			'preserve_settings_on_uninstall' => ! empty( $raw['preserve_settings_on_uninstall'] ) ? 1 : 0,
		);

		// Existing keys not covered by this form (e.g. offline_message,
		// widget_title, poll_interval_ms, quick_replies, allowed_users,
		// user_page_access) are preserved rather than wiped on save.
		$existing = get_option( self::OPTION_KEY, array() );
		$settings = array_merge( $existing, $settings );

		update_option( self::OPTION_KEY, $settings );

		return self::get_settings();
	}

	/**
	 * Sanitizes and persists the "specific users" allow-list and their
	 * per-page access, from the Profile → Team Access screen. Only touches
	 * these two keys — everything else in the settings option (roles,
	 * notification toggles, etc.) is left exactly as it was.
	 *
	 * @param array $raw Raw, unsanitized POST data.
	 * @return array The sanitized settings that were saved.
	 */
	public static function save_team_access( $raw ) {
		$allowed_users = isset( $raw['allowed_users'] ) && is_array( $raw['allowed_users'] )
			? array_values( array_unique( array_map( 'absint', $raw['allowed_users'] ) ) )
			: array();

		$valid_pages = array_keys( CAPTLC_Roles::get_optional_pages() );
		$page_access = array();

		if ( isset( $raw['user_page_access'] ) && is_string( $raw['user_page_access'] ) ) {
			$decoded = json_decode( wp_unslash( $raw['user_page_access'] ), true );

			if ( is_array( $decoded ) ) {
				foreach ( $decoded as $user_id => $pages ) {
					$user_id = absint( $user_id );
					if ( ! $user_id || ! is_array( $pages ) ) {
						continue;
					}
					$clean = array_values( array_intersect( array_map( 'sanitize_key', $pages ), $valid_pages ) );
					if ( ! empty( $clean ) ) {
						$page_access[ $user_id ] = $clean;
					}
				}
			}
		}

		$existing = get_option( self::OPTION_KEY, array() );
		$settings = array_merge(
			$existing,
			array(
				'allowed_users'    => $allowed_users,
				'user_page_access' => $page_access,
			)
		);

		update_option( self::OPTION_KEY, $settings );

		return self::get_settings();
	}
}
