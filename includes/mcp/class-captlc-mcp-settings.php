<?php
/**
 * MCP — AI Access master switch + per-ability enable/disable settings.
 *
 * This is the piece that was missing before: a stored option that both
 * the ability-registration files and the future Settings → MCP UI read
 * from, so a site owner can turn any individual ability off (or kill
 * everything with one master switch) without touching code.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Settings
 */
class CAPTLC_MCP_Settings {

	const OPTION = 'captlc_mcp_settings';

	/**
	 * Returns the full settings array, with defaults applied.
	 *
	 * @return array{enabled: bool, abilities: array<string,bool>}
	 */
	public static function get_settings() {
		$defaults = array(
			'enabled'   => true,
			'abilities' => array(),
		);
		$stored = get_option( self::OPTION, array() );
		return wp_parse_args( is_array( $stored ) ? $stored : array(), $defaults );
	}

	/**
	 * Whether the master "AI Access" switch is on. When off, every
	 * ability is registered as non-public regardless of its individual
	 * toggle — this fully blocks AI clients from the plugin, matching
	 * the "Master switch for every ability below" behaviour.
	 *
	 * @return bool
	 */
	public static function is_master_enabled() {
		return (bool) self::get_settings()['enabled'];
	}

	/**
	 * Whether a specific ability is enabled. Unlisted abilities fall
	 * back to $default_enabled — read-only abilities default ON,
	 * write/destructive abilities default OFF (matches the reference
	 * pattern: "Read-only abilities are on by default. Create, Update,
	 * Duplicate, and Delete are all off by default"). A site owner can
	 * still flip either direction from the Settings → MCP screen.
	 *
	 * @param string $ability_name    Fully-qualified ability name, e.g. 'captlc/threads-list'.
	 * @param bool   $default_enabled Fallback when the site owner hasn't set this ability explicitly.
	 * @return bool
	 */
	public static function is_ability_enabled( $ability_name, $default_enabled = true ) {
		$settings = self::get_settings();
		if ( ! array_key_exists( $ability_name, $settings['abilities'] ) ) {
			return (bool) $default_enabled;
		}
		return (bool) $settings['abilities'][ $ability_name ];
	}

	/**
	 * Whether an ability should be exposed to MCP clients right now —
	 * combines the master switch and the ability's own toggle. Pass the
	 * result of this straight into an ability's `meta.public` at
	 * registration time.
	 *
	 * @param string $ability_name    Fully-qualified ability name.
	 * @param bool   $default_enabled Fallback when unset — see is_ability_enabled().
	 * @return bool
	 */
	public static function is_exposed( $ability_name, $default_enabled = true ) {
		return self::is_master_enabled() && self::is_ability_enabled( $ability_name, $default_enabled );
	}

	/**
	 * Sets the master switch. Used by the Settings → MCP UI.
	 *
	 * @param bool $enabled Whether AI Access should be on.
	 * @return void
	 */
	public static function set_master_enabled( $enabled ) {
		$settings            = self::get_settings();
		$settings['enabled'] = (bool) $enabled;
		update_option( self::OPTION, $settings );
	}

	/**
	 * Sets a single ability's toggle. Used by the Settings → MCP UI.
	 *
	 * @param string $ability_name Fully-qualified ability name.
	 * @param bool   $enabled      Whether this ability should be exposed.
	 * @return void
	 */
	public static function set_ability_enabled( $ability_name, $enabled ) {
		$settings                              = self::get_settings();
		$settings['abilities'][ $ability_name ] = (bool) $enabled;
		update_option( self::OPTION, $settings );
	}

	/**
	 * Permission check used by every ability's permission_callback:
	 * only users who could already reach this plugin's Settings page
	 * can be acted on behalf of via MCP — no lower-privilege tier, by
	 * deliberate decision (matches the reference plugin's "every ability
	 * requires manage_options" model).
	 *
	 * @return bool
	 */
	public static function can_manage() {
		return current_user_can( 'manage_options' );
	}
}
