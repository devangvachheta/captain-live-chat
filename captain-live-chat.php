<?php
/**
 * Plugin Name:       Captain Live Chat
 * Plugin URI:        https://example.com/captain-live-chat
 * Description:       Lightweight, self-hosted live chat plugin for WordPress. No monthly subscription, no external servers — 100% your database.
 * Version:           1.0.0
 * Author:            Bharti
 * Text Domain:       captain-live-chat
 * Domain Path:       /languages
 * Requires at least: 5.8
 * Requires PHP:      7.4
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
define( 'CAPTLC_VERSION', '1.0.0' );
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
