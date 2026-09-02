<?php
/**
 * Plugin Name:       Captain Live Chat
 * Plugin URI:        https://wordpress.org/plugins/captain-live-chat
 * Description:       Lightweight, self-hosted live chat plugin for WordPress. No monthly subscription, no external servers — 100% your database.
 * Version:           0.0.1
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
define( 'CAPTLC_VERSION', '0.0.1' );
define( 'CAPTLC_DB_VERSION', '0.0.1' );
define( 'CAPTLC_FILE', __FILE__ );
define( 'CAPTLC_PATH', plugin_dir_path( __FILE__ ) );
define( 'CAPTLC_URL', plugin_dir_url( __FILE__ ) );
define( 'CAPTLC_BASENAME', plugin_basename( __FILE__ ) );

require_once CAPTLC_PATH . 'includes/class-captlc-plugin-load.php';
