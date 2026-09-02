<?php
/**
 * Registers the admin menu page and mounts the React app.
 *
 * @since      1.0.0
 *
 * @package    captain-live-chat
 * @subpackage captain-live-chat/includes/admin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Captlc_Menu' ) ) {

	/**
	 * Class Captlc_Menu
	 *
	 * @since 1.0.0
	 */
	class Captlc_Menu {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Initiator
		 *
		 * @since 1.0.0
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Constructor — registers hooks.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			add_action( 'admin_menu', array( $this, 'captlc_admin_menu' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'captlc_admin_enqueue_scripts' ), 10, 1 );
		}

		/**
		 * Builds the base64 SVG data URI used for the WP admin-menu icon.
		 *
		 * Reads the single source-of-truth logo at assets/img/logo.svg so the
		 * same artwork is reused everywhere (WP left menu here, React app
		 * sidebar via captlc_data.plugin_url) — replace that one file to
		 * update the logo everywhere it appears.
		 *
		 * @since 1.0.0
		 * @return string Data URI, or the dashicon fallback if the file is missing.
		 */
		private static function captlc_menu_icon() {
			$path = CAPTLC_PATH . 'assets/img/logo.svg';

			if ( ! file_exists( $path ) ) {
				return 'dashicons-format-chat';
			}

			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_file_get_contents -- static asset bundled with the plugin.
			$svg = file_get_contents( $path );

			return 'data:image/svg+xml;base64,' . base64_encode( $svg ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		}

		/**
		 * Registers the top level admin menu and submenus.
		 *
		 * @since 1.0.0
		 */
		public function captlc_admin_menu() {
			// Admins always get full access. Non-admin users who've been granted
			// chat-reply permission (Settings → Who can reply) get the menu too,
			// just capped to 'read' so WP itself doesn't block the page render —
			// see captlc_menu_page_template() for the actual gate, and the React
			// sidebar hides admin-only sections for these users.
			$is_admin      = current_user_can( 'manage_options' );
			$is_agent_only = ! $is_admin && class_exists( 'CAPTLC_Roles' ) && CAPTLC_Roles::can_reply( get_current_user_id() );

			if ( ! $is_admin && ! $is_agent_only ) {
				return;
			}

			$capability = $is_admin ? 'manage_options' : 'read';

			// Optional pages (Analytics, Settings, AI Agent, Widget Settings,
			// Quick Reply, History) are gated per-user, set from Profile →
			// Team Access. Admins get all of them; agents only see the
			// submenu entry for a page if it's in their allowed list —
			// otherwise 'do_not_allow' hides that specific item, while still
			// letting the same agent through on pages they ARE allowed.
			$allowed_pages = $is_admin || ! class_exists( 'CAPTLC_Roles' )
				? array()
				: CAPTLC_Roles::get_user_allowed_pages( get_current_user_id() );

			$page_capability = function ( $slug ) use ( $is_admin, $capability, $allowed_pages ) {
				if ( $is_admin ) {
					return $capability;
				}
				return in_array( $slug, $allowed_pages, true ) ? 'read' : 'do_not_allow';
			};

			add_menu_page(
				__( 'Captain Live Chat', 'captain-live-chat' ),
				__( 'Live Chat', 'captain-live-chat' ),
				$capability,
				'captain-live-chat',
				array( $this, 'captlc_menu_page_template' ),
				self::captlc_menu_icon(),
				26
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Inbox', 'captain-live-chat' ),
				__( 'Inbox', 'captain-live-chat' ),
				$capability,
				'captain-live-chat',
				array( $this, 'captlc_menu_page_template' )
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Template', 'captain-live-chat' ),
				__( 'Template', 'captain-live-chat' ),
				$page_capability( 'widget-settings' ),
				'admin.php?page=captain-live-chat#/widget-designer'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Quick Reply', 'captain-live-chat' ),
				__( 'Quick Reply', 'captain-live-chat' ),
				$page_capability( 'canned-replies' ),
				'admin.php?page=captain-live-chat#/canned-replies'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'AI Agent', 'captain-live-chat' ),
				__( 'AI Agent', 'captain-live-chat' ),
				$page_capability( 'ai-settings' ),
				'admin.php?page=captain-live-chat#/ai-settings'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Analytics', 'captain-live-chat' ),
				__( 'Analytics', 'captain-live-chat' ),
				$page_capability( 'analytics' ),
				'admin.php?page=captain-live-chat#/analytics'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Settings', 'captain-live-chat' ),
				__( 'Settings', 'captain-live-chat' ),
				$page_capability( 'settings' ),
				'admin.php?page=captain-live-chat#/settings'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'History', 'captain-live-chat' ),
				__( 'History', 'captain-live-chat' ),
				$page_capability( 'history' ),
				'admin.php?page=captain-live-chat#/history'
			);

			// Admin-only — every MCP ability requires manage_options, so
			// non-admin agents get no use out of this page either.
			add_submenu_page(
				'captain-live-chat',
				__( 'MCP', 'captain-live-chat' ),
				__( 'MCP', 'captain-live-chat' ),
				'manage_options',
				'admin.php?page=captain-live-chat#/mcp'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Help', 'captain-live-chat' ),
				__( 'Help', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/help'
			);
		}

		/**
		 * Outputs the React app mount point.
		 *
		 * @since 1.0.0
		 */
		public function captlc_menu_page_template() {
			$is_admin = current_user_can( 'manage_options' );
			$is_agent = $is_admin || ( class_exists( 'CAPTLC_Roles' ) && CAPTLC_Roles::can_reply( get_current_user_id() ) );

			if ( ! $is_agent ) {
				wp_die( esc_html__( 'You do not have permission to access Captain Live Chat.', 'captain-live-chat' ) );
			}

			echo '<div id="captain-live-chat-app"></div>';
		}

		/**
		 * Enqueues the compiled React app and localizes plugin data.
		 * Only loads on the plugin's own admin page.
		 *
		 * @since 1.0.0
		 * @param string $hook Current admin page hook suffix.
		 * @return void
		 */
		public function captlc_admin_enqueue_scripts( $hook ) {
			if ( 'toplevel_page_captain-live-chat' !== $hook ) {
				return;
			}

			$asset_file = CAPTLC_PATH . 'build/index.asset.php';

			if ( ! file_exists( $asset_file ) ) {
				return;
			}

			$asset = require $asset_file;

			wp_enqueue_style(
				'captlc-admin-css',
				CAPTLC_URL . 'build/index.css',
				array(),
				CAPTLC_VERSION
			);
			wp_style_add_data( 'captlc-admin-css', 'rtl', 'replace' );

			wp_enqueue_style(
				'captlc-admin-overrides',
				CAPTLC_URL . 'assets/css/admin.css',
				array(),
				CAPTLC_VERSION
			);

			wp_enqueue_script(
				'captlc-admin-script',
				CAPTLC_URL . 'build/index.js',
				$asset['dependencies'],
				$asset['version'],
				true
			);

			wp_set_script_translations( 'captlc-admin-script', 'captain-live-chat' );

			// Safely call static methods only if classes are loaded.
			$settings      = class_exists( 'CAPTLC_Settings' ) ? CAPTLC_Settings::get_settings() : array();
			$roles         = class_exists( 'CAPTLC_Roles' ) ? CAPTLC_Roles::get_selectable_roles() : array();
			$users         = class_exists( 'CAPTLC_Roles' ) ? CAPTLC_Roles::get_selectable_users() : array();
			$canned        = class_exists( 'CAPTLC_Canned_Replies' ) ? CAPTLC_Canned_Replies::all() : array();
			$widget_design = class_exists( 'CAPTLC_Widget_Design' ) ? CAPTLC_Widget_Design::get_raw_option() : array();

			$agent_profile = class_exists( 'CAPTLC_DB' ) ? CAPTLC_DB::get_agent_profile( get_current_user_id() ) : array();
			$optional_pages = class_exists( 'CAPTLC_Roles' ) ? CAPTLC_Roles::get_optional_pages() : array();
			$allowed_pages  = class_exists( 'CAPTLC_Roles' ) ? CAPTLC_Roles::get_user_allowed_pages( get_current_user_id() ) : array();

			wp_localize_script(
				'captlc-admin-script',
				'captlc_data',
				array(
					'ajax_url'        => admin_url( 'admin-ajax.php' ),
					'nonce'           => wp_create_nonce( CAPTLC_Ajax::NONCE_ACTION ),
					'home_url'        => esc_url( home_url( '/' ) ),
					'settings'        => $settings,
					'roles'           => $roles,
					'users'           => $users,
					'optional_pages'  => $optional_pages,
					'allowed_pages'   => $allowed_pages,
					'agent_online'    => ! empty( $agent_profile['is_online'] ),
					'agent_profile'   => array(
						'company_name'       => isset( $agent_profile['company_name'] ) ? $agent_profile['company_name'] : '',
						'country'            => isset( $agent_profile['country'] ) ? $agent_profile['country'] : '',
						'address'            => isset( $agent_profile['address'] ) ? $agent_profile['address'] : '',
						'preferred_language' => isset( $agent_profile['preferred_language'] ) ? $agent_profile['preferred_language'] : 'en',
						'availability_mode'  => isset( $agent_profile['availability_mode'] ) ? $agent_profile['availability_mode'] : 'status',
					),
					'current_user'    => array(
						'id'         => get_current_user_id(),
						'name'       => wp_get_current_user()->display_name,
						'email'      => wp_get_current_user()->user_email,
						'avatar_url' => get_avatar_url( get_current_user_id(), array( 'size' => 128 ) ),
					),
					'poll_interval'   => absint( isset( $settings['poll_interval_ms'] ) ? $settings['poll_interval_ms'] : 3000 ),
					'sound_enabled'   => ! empty( $settings['sound_enabled'] ),
					'browser_notif'   => ! empty( $settings['browser_notif'] ),
					'captlc_version'  => CAPTLC_VERSION,
					'plugin_url'      => CAPTLC_URL,
					'text_domain'     => 'captain-live-chat',
					'canned_replies'  => $canned,
					'widget_design'   => $widget_design,
					'current_user_id' => get_current_user_id(),
					'is_admin'        => current_user_can( 'manage_options' ),
				)
			);
		}
	}

	Captlc_Menu::get_instance();
}
