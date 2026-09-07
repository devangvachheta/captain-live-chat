<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Removes ALL plugin-created database tables and option entries so that
 * no orphaned data is left behind after the plugin is deleted.
 *
 * This file is ONLY executed when the admin clicks "Delete" on the
 * Plugins screen, NOT on deactivation.
 *
 * @package captain-live-chat
 * @link    https://developer.wordpress.org/plugins/plugin-basics/uninstall-methods/
 */

// Exit if called directly (WordPress sets WP_UNINSTALL_PLUGIN on uninstall).
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

// ── Read the "Settings → Uninstall" preferences before touching anything ──
// Both toggles live inside the captlc_settings option itself, so we must
// read them first and decide, then act — deleting that option later would
// destroy the very flags we're checking.
$captlc_settings                       = get_option( 'captlc_settings', array() );
$captlc_delete_data_on_uninstall       = ! empty( $captlc_settings['delete_data_on_uninstall'] );
$captlc_preserve_settings_on_uninstall = ! empty( $captlc_settings['preserve_settings_on_uninstall'] );

// Nothing to do if the admin never opted in to deletion.
if ( ! $captlc_delete_data_on_uninstall ) {
	return;
}

// ── Drop custom tables ──────────────────────────────────────────────────
$captlc_tables = array(
	$wpdb->prefix . 'captlc_threads',
	$wpdb->prefix . 'captlc_messages',
	$wpdb->prefix . 'captlc_agents',
);

foreach ( $captlc_tables as $captlc_table ) {
	// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery
	$wpdb->query( 'DROP TABLE IF EXISTS `' . esc_sql( $captlc_table ) . '`' );
}

// ── Remove plugin options ───────────────────────────────────────────────
$captlc_options = array(
	'captlc_settings',
	'captlc_canned_replies',
	'captlc_ai_providers',
	'captlc_ai_general',
	'captlc_widget_design',
	'captlc_agent_schedule',
	'captlc_tags',
	'captlc_faqs',
);

// "Preserve Settings on Uninstall" overrides deletion of captlc_settings
// specifically, so allowed roles/notification preferences etc. survive a
// future reinstall even though everything else (threads, messages, canned
// replies...) is still wiped.
if ( $captlc_preserve_settings_on_uninstall ) {
	$captlc_options = array_diff( $captlc_options, array( 'captlc_settings' ) );
}

foreach ( $captlc_options as $captlc_option ) {
	delete_option( $captlc_option );
	// Also remove from the site options table in multisite installs.
	delete_site_option( $captlc_option );
}

// ── Clear all plugin transients ─────────────────────────────────────────
// Transients follow the pattern captlc_* — we delete them using a LIKE query
// rather than iterating, since they can be numerous (one per thread/visitor).
$wpdb->query(
	"DELETE FROM {$wpdb->options}
	 WHERE option_name LIKE '\_transient\_captlc\_%'
	    OR option_name LIKE '\_transient\_timeout\_captlc\_%'"
);

if ( is_multisite() ) {
	$wpdb->query(
		"DELETE FROM {$wpdb->sitemeta}
		 WHERE meta_key LIKE '\_site\_transient\_captlc\_%'
		    OR meta_key LIKE '\_site\_transient\_timeout\_captlc\_%'"
	);
}
