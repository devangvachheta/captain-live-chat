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
		 * Registers the top level admin menu and submenus.
		 *
		 * @since 1.0.0
		 */
		public function captlc_admin_menu() {
			$capability = 'manage_options';

			if ( ! current_user_can( $capability ) ) {
				return;
			}

			add_menu_page(
				__( 'Captain Live Chat', 'captain-live-chat' ),
				__( 'Live Chat', 'captain-live-chat' ),
				$capability,
				'captain-live-chat',
				array( $this, 'captlc_menu_page_template' ),
				'dashicons-format-chat',
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
				$capability,
				'admin.php?page=captain-live-chat#/widget-designer'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Quick Reply', 'captain-live-chat' ),
				__( 'Quick Reply', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/canned-replies'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'AI Agent', 'captain-live-chat' ),
				__( 'AI Agent', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/ai-settings'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Analytics', 'captain-live-chat' ),
				__( 'Analytics', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/analytics'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Settings', 'captain-live-chat' ),
				__( 'Settings', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/settings'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'Agent Schedule', 'captain-live-chat' ),
				__( 'Agent Schedule', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/schedule'
			);

			add_submenu_page(
				'captain-live-chat',
				__( 'History', 'captain-live-chat' ),
				__( 'History', 'captain-live-chat' ),
				$capability,
				'admin.php?page=captain-live-chat#/history'
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
			$settings      = class_exists( 'CAPTLC_Settings' )      ? CAPTLC_Settings::get_settings()          : array();
			$roles         = class_exists( 'CAPTLC_Roles' )         ? CAPTLC_Roles::get_selectable_roles()     : array();
			$users         = class_exists( 'CAPTLC_Roles' )         ? CAPTLC_Roles::get_selectable_users()     : array();
			$canned        = class_exists( 'CAPTLC_Canned_Replies' ) ? CAPTLC_Canned_Replies::all()             : array();
			$widget_design = class_exists( 'CAPTLC_Widget_Design' )  ? CAPTLC_Widget_Design::get_raw_option()  : array();

			global $wpdb;
			$agent_row = null;
			if ( class_exists( 'CAPTLC_DB' ) ) {
				$agents_table = CAPTLC_DB::agents_table();
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$agent_row = $wpdb->get_row(
					$wpdb->prepare( "SELECT is_online FROM {$agents_table} WHERE user_id = %d", get_current_user_id() )
				);
			}

			wp_localize_script(
				'captlc-admin-script',
				'captlc_data',
				array(
					'ajax_url'       => admin_url( 'admin-ajax.php' ),
					'nonce'          => wp_create_nonce( CAPTLC_Ajax::NONCE_ACTION ),
					'home_url'       => esc_url( home_url( '/' ) ),
					'settings'       => $settings,
					'roles'          => $roles,
					'users'          => $users,
					'agent_online'   => $agent_row ? (bool) $agent_row->is_online : false,
					'current_user'   => array(
						'id'         => get_current_user_id(),
						'name'       => wp_get_current_user()->display_name,
						'email'      => wp_get_current_user()->user_email,
						'avatar_url' => get_avatar_url( get_current_user_id(), array( 'size' => 128 ) ),
					),
					'poll_interval'  => absint( isset( $settings['poll_interval_ms'] ) ? $settings['poll_interval_ms'] : 3000 ),
					'sound_enabled'  => ! empty( $settings['sound_enabled'] ),
					'browser_notif'  => ! empty( $settings['browser_notif'] ),
					'captlc_version' => CAPTLC_VERSION,
					'plugin_url'     => CAPTLC_URL,
					'text_domain'    => 'captain-live-chat',
					'canned_replies' => $canned,
					'widget_design'  => $widget_design,
					'current_user_id' => get_current_user_id(),
					'is_admin'       => current_user_can( 'manage_options' ),
				)
			);
		}
	}

	Captlc_Menu::get_instance();
}
