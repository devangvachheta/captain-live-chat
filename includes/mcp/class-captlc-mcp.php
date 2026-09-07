<?php
/**
 * MCP — main bootstrap.
 *
 * This is the ONLY file the rest of the plugin links to
 * (see includes/class-captlc-plugin-load.php). Everything else the MCP
 * feature needs lives inside includes/mcp/ and is required from here.
 *
 * Built entirely on WordPress core's Abilities API. The plugin now
 * requires WordPress 6.9+ (see readme.txt), so the Abilities API is
 * always present — this file registers abilities unconditionally and
 * carries no old-WP fallback path. This plugin does NOT run its own
 * MCP server and does NOT bundle or instantiate any specific bridge
 * plugin — it only registers Abilities. Any general-purpose MCP bridge
 * the site owner installs separately (the official WordPress MCP
 * Adapter, or any other Abilities-API-aware bridge) discovers and
 * exposes these abilities automatically. That keeps the site owner free
 * to pick/swap bridges, and means this file has no dependency on any one
 * bridge's class names.
 *
 * The AI domain's abilities (captlc/ai-*) are not registered here — they
 * ship with the separate AI Agent add-on, which registers them itself
 * on the same wp_abilities_api_init hook when active.
 *
 * @since   0.0.1
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-captlc-mcp-settings.php';
require_once __DIR__ . '/class-captlc-mcp-categories.php';
require_once __DIR__ . '/class-captlc-mcp-ability-meta.php';
require_once __DIR__ . '/class-captlc-mcp-ajax.php';

require_once __DIR__ . '/abilities/class-captlc-mcp-tools-threads.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-messages.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-agents.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-tags-notes.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-canned-replies.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-knowledge.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-faqs.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-schedule.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-widget-design.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-analytics-history.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-settings.php';

/**
 * Class CAPTLC_MCP
 */
class CAPTLC_MCP {

	/**
	 * Sets up hooks.
	 *
	 * @since 0.0.1
	 */
	public function __construct() {
		add_action( 'wp_abilities_api_categories_init', array( 'CAPTLC_MCP_Categories', 'register' ) );
		add_action( 'wp_abilities_api_init', array( $this, 'register_abilities' ) );

		new CAPTLC_MCP_Ajax();
	}

	/**
	 * Registers every domain's abilities.
	 *
	 * @return void
	 */
	public function register_abilities() {
		CAPTLC_MCP_Tools_Threads::register();
		CAPTLC_MCP_Tools_Messages::register();
		CAPTLC_MCP_Tools_Agents::register();
		CAPTLC_MCP_Tools_Tags_Notes::register();
		CAPTLC_MCP_Tools_Canned_Replies::register();
		CAPTLC_MCP_Tools_Knowledge::register();
		CAPTLC_MCP_Tools_Faqs::register();
		CAPTLC_MCP_Tools_Schedule::register();
		CAPTLC_MCP_Tools_Widget_Design::register();
		CAPTLC_MCP_Tools_Analytics_History::register();
		CAPTLC_MCP_Tools_Settings::register();
	}

	/**
	 * Whether the Abilities API is present. Kept as a single source of
	 * truth for CAPTLC_MCP_Ajax's response payload; always true now that
	 * the plugin requires WordPress 6.9+, but cheap enough to leave as a
	 * defensive check rather than assume.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return function_exists( 'wp_register_ability' );
	}
}
