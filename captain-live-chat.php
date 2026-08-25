<?php
/**
 * Plugin Name:       Captain Live Chat
 * Plugin URI:        https://wordpress.org/plugins/captain-live-chat
 * Description:       Lightweight, self-hosted live chat plugin for WordPress. No monthly subscription, no external servers — 100% your database.
 * Version:           1.3.0
 * Author:            devangvachheta
 * Author URI:        https://profiles.wordpress.org/devangvachheta/
 * Text Domain:       captain-live-chat
 * Domain Path:       /languages
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package captain-live-chat
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Core plugin constants.
 */
define( 'CAPTLC_VERSION', '1.3.0' );
define( 'CAPTLC_DB_VERSION', '1.3.0' );
define( 'CAPTLC_FILE', __FILE__ );
define( 'CAPTLC_PATH', plugin_dir_path( __FILE__ ) );
define( 'CAPTLC_URL', plugin_dir_url( __FILE__ ) );
define( 'CAPTLC_BASENAME', plugin_basename( __FILE__ ) );

require_once CAPTLC_PATH . 'includes/class-captlc-plugin-load.php';

/**
 * Load plugin textdomain for translations.
 *
 * @return void
 */
function captlc_load_textdomain() {
	load_plugin_textdomain( 'captain-live-chat', false, dirname( CAPTLC_BASENAME ) . '/languages' );
}
add_action( 'init', 'captlc_load_textdomain' );
