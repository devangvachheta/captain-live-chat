<?php
/**
 * MCP — main bootstrap.
 *
 * This is the ONLY file the rest of the plugin links to
 * (see includes/class-captlc-plugin-load.php). Everything else the MCP
 * feature needs lives inside includes/mcp/ and is required from here.
 *
 * Built entirely on WordPress core's Abilities API (6.9+). This plugin
 * does NOT run its own MCP server and does NOT bundle or instantiate any
 * specific bridge plugin — it only registers Abilities. Any general-
 * purpose MCP bridge the site owner installs separately (Easy MCP AI,
 * the official WordPress MCP Adapter, or any other Abilities-API-aware
 * bridge) discovers and exposes these abilities automatically. That
 * keeps the site owner free to pick/swap bridges, and means this file
 * has no dependency on any one bridge's class names.
 *
 * @since   1.0.0
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
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-ai.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-schedule.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-widget-design.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-analytics-history.php';
require_once __DIR__ . '/abilities/class-captlc-mcp-tools-settings.php';

/**
 * Class CAPTLC_MCP
 */
class CAPTLC_MCP {

	/**
	 * Sets up hooks. Registration itself only happens if the Abilities
	 * API is available — checked lazily on the hook, since core may load
	 * after this constructor runs on 'plugins_loaded'.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'wp_abilities_api_categories_init', array( 'CAPTLC_MCP_Categories', 'register' ) );
		add_action( 'wp_abilities_api_init', array( $this, 'register_abilities' ) );

		add_action( 'admin_notices', array( $this, 'maybe_show_dependency_notice' ) );

		new CAPTLC_MCP_Ajax();
	}

	/**
	 * Registers every domain's abilities. Runs on wp_abilities_api_init,
	 * so this method is never called on WP < 6.9 (the hook doesn't exist),
	 * which is the correct no-op behaviour for older sites.
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
		CAPTLC_MCP_Tools_Ai::register();
		CAPTLC_MCP_Tools_Schedule::register();
		CAPTLC_MCP_Tools_Widget_Design::register();
		CAPTLC_MCP_Tools_Analytics_History::register();
		CAPTLC_MCP_Tools_Settings::register();
	}

	/**
	 * Whether the one real dependency this feature needs — WordPress
	 * core's Abilities API — is present. Deliberately does NOT check for
	 * any specific bridge plugin: that's the site owner's independent
	 * choice, and different bridges use different class names, so
	 * hard-coding one here would wrongly report "inactive" for sites
	 * running a bridge other than the one we happened to check for.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return function_exists( 'wp_register_ability' );
	}

	/**
	 * Shows an admin notice on the plugin's own settings screens when
	 * the Abilities API itself is missing (WP < 6.9), instead of failing
	 * silently. Does not warn about a missing bridge plugin — the
	 * Settings → MCP screen is the right place to explain bridge choices,
	 * not a global admin notice.
	 *
	 * @return void
	 */
	public function maybe_show_dependency_notice() {
		if ( self::is_available() ) {
			return;
		}

		$screen = get_current_screen();
		if ( ! $screen || false === strpos( (string) $screen->id, 'captain-live-chat' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-warning"><p>%s</p></div>',
			esc_html__( 'Captain Live Chat\'s AI/MCP abilities need WordPress 6.9 or newer (Abilities API). Everything else in the plugin works normally.', 'captain-live-chat' )
		);
	}
}
