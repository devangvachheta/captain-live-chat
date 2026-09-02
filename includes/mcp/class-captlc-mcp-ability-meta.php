<?php
/**
 * MCP — shared helper for building the `meta` arg every ability needs:
 * readonly/destructive annotations, plus the `public` flag computed live
 * from the Settings → MCP per-ability toggle. Used by every domain file
 * so the toggle logic lives in exactly one place.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Ability_Meta
 */
class CAPTLC_MCP_Ability_Meta {

	/**
	 * Builds the `meta` arg for wp_register_ability(). The `public`
	 * flag's fallback default follows $readonly: read-only abilities
	 * default ON, everything that writes defaults OFF, until a site
	 * owner explicitly toggles it from Settings → MCP. Sets both the
	 * high-level `public` flag and the MCP-specific `mcp.public` flag
	 * to the same value — different WordPress/bridge versions read
	 * either one, and the two must never disagree.
	 *
	 * @param string $ability_name Fully-qualified ability name, e.g. 'captlc/threads-list'.
	 * @param bool   $readonly     Whether this ability only reads data (drives the READ-ONLY badge and the default toggle state).
	 * @param bool   $destructive  Whether this ability is destructive (e.g. delete).
	 * @return array
	 */
	public static function build( $ability_name, $readonly, $destructive = false ) {
		$exposed = CAPTLC_MCP_Settings::is_exposed( $ability_name, $readonly );

		return array(
			'annotations' => array(
				'readonly'    => $readonly,
				'destructive' => $destructive,
			),
			'public'      => $exposed,
			'mcp'         => array(
				'public' => $exposed,
			),
		);
	}
}
