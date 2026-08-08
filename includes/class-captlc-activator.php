<?php
/**
 * Fired during plugin activation.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Activator
 *
 * Handles table creation and default option seeding on activation.
 */
class CAPTLC_Activator {

	/**
	 * Runs on plugin activation.
	 *
	 * @return void
	 */
	public static function activate() {
		self::create_tables();
		self::seed_default_options();
	}

	/**
	 * Runs on plugin deactivation.
	 * Intentionally does not remove tables/data.
	 *
	 * @return void
	 */
	public static function deactivate() {
		// Reserved for future use (e.g. clearing scheduled cron events).
	}

	/**
	 * Creates all custom DB tables required by the plugin.
	 *
	 * @return void
	 */
	private static function create_tables() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$table_threads  = $wpdb->prefix . 'captlc_threads';
		$table_messages = $wpdb->prefix . 'captlc_messages';
		$table_agents   = $wpdb->prefix . 'captlc_agents';

		$sql_threads = "CREATE TABLE {$table_threads} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			visitor_id VARCHAR(64) NOT NULL,
			visitor_name VARCHAR(191) DEFAULT '' NOT NULL,
			visitor_email VARCHAR(191) DEFAULT '' NOT NULL,
			assigned_agent_id BIGINT UNSIGNED DEFAULT NULL,
			status VARCHAR(20) DEFAULT 'open' NOT NULL,
			source_url TEXT NULL,
			browser VARCHAR(100) DEFAULT '' NOT NULL,
			device VARCHAR(100) DEFAULT '' NOT NULL,
			location VARCHAR(191) DEFAULT '' NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY visitor_id (visitor_id),
			KEY status (status),
			KEY assigned_agent_id (assigned_agent_id)
		) {$charset_collate};";

		$sql_messages = "CREATE TABLE {$table_messages} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			thread_id BIGINT UNSIGNED NOT NULL,
			sender_type VARCHAR(20) NOT NULL,
			sender_id BIGINT UNSIGNED DEFAULT NULL,
			message LONGTEXT NULL,
			attachment_url TEXT NULL,
			is_read TINYINT(1) DEFAULT 0 NOT NULL,
			created_at DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY thread_id (thread_id),
			KEY is_read (is_read)
		) {$charset_collate};";

		$sql_agents = "CREATE TABLE {$table_agents} (
			user_id BIGINT UNSIGNED NOT NULL,
			is_online TINYINT(1) DEFAULT 0 NOT NULL,
			last_active_at DATETIME NULL,
			PRIMARY KEY  (user_id)
		) {$charset_collate};";

		dbDelta( $sql_threads );
		dbDelta( $sql_messages );
		dbDelta( $sql_agents );
	}

	/**
	 * Seeds default plugin settings if they do not already exist.
	 *
	 * @return void
	 */
	private static function seed_default_options() {
		if ( false === get_option( 'captlc_settings' ) ) {
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

			add_option( 'captlc_settings', $defaults );
		}
	}
}
