<?php
/**
 * The file that defines the load plugin.
 *
 * @since   1.0.0
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Captlc_Plugin_Load' ) ) {

	/**
	 * Class Captlc_Plugin_Load
	 *
	 * @since 1.0.0
	 */
	class Captlc_Plugin_Load {

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
		 * Define the core functionality of the plugin.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			// Activator class must be loaded immediately, activation/deactivation
			// hooks fire before 'plugins_loaded', so it can't wait for captlc_load_dependencies().
			require_once CAPTLC_PATH . 'includes/class-captlc-activator.php';

			register_activation_hook( CAPTLC_FILE, array( 'CAPTLC_Activator', 'activate' ) );
			register_deactivation_hook( CAPTLC_FILE, array( 'CAPTLC_Activator', 'deactivate' ) );

			add_action( 'plugins_loaded', array( $this, 'captlc_init_plugin' ) );
			add_action( 'init', array( 'CAPTLC_Activator', 'maybe_upgrade' ) );
		}

		/**
		 * Files load plugin loaded.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function captlc_init_plugin() {
			$this->captlc_load_dependencies();

			new CAPTLC_Ajax();
			new CAPTLC_Notifications();
			new CAPTLC_Canned_Replies();
			new CAPTLC_History();
			new CAPTLC_AI();
			new CAPTLC_Knowledge();
			new CAPTLC_Widget_Design();
			new CAPTLC_Faq();
			new CAPTLC_Analytics();
			new CAPTLC_Features();

			if ( is_admin() ) {
				new Captlc_Menu();
			} else {
				new CAPTLC_Public();
			}
		}

		/**
		 * Load the required dependencies for this plugin.
		 *
		 * @since 1.0.0
		 */
		public function captlc_load_dependencies() {
			require_once CAPTLC_PATH . 'includes/class-captlc-roles.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-settings.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-db.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-notifications.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-ajax.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-canned-replies.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-history.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-ai.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-knowledge.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-widget-design.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-faq.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-analytics.php';
			require_once CAPTLC_PATH . 'includes/class-captlc-features.php';
			require_once CAPTLC_PATH . 'includes/admin/class-captlc-menu.php';
			require_once CAPTLC_PATH . 'public/class-captlc-public.php';
		}
	}

	Captlc_Plugin_Load::get_instance();
}
