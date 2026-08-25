<?php
/**
 * Role and user permission handling.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Roles
 *
 * Central place to decide who is allowed to act as a chat agent.
 */
class CAPTLC_Roles {

	/**
	 * Returns all WordPress roles available for selection in settings.
	 *
	 * @return array<string,string> role_slug => role_label
	 */
	public static function get_selectable_roles() {
		if ( ! function_exists( 'get_editable_roles' ) ) {
			require_once ABSPATH . 'wp-admin/includes/user.php';
		}

		$roles  = get_editable_roles();
		$output = array();

		foreach ( $roles as $slug => $role ) {
			$output[ $slug ] = translate_user_role( $role['name'] );
		}

		return $output;
	}

	/**
	 * Returns users list for the "specific users" checkbox list.
	 * Limited to users who can at least read the admin area.
	 *
	 * @return array<int,array{id:int,name:string,email:string,avatar:string}>
	 */
	public static function get_selectable_users() {
		$users = get_users(
			array(
				'fields'  => array( 'ID', 'display_name', 'user_email' ),
				'orderby' => 'display_name',
				'order'   => 'ASC',
			)
		);

		$output = array();

		foreach ( $users as $user ) {
			$output[] = array(
				'id'     => (int) $user->ID,
				'name'   => $user->display_name,
				'email'  => $user->user_email,
				'avatar' => get_avatar_url( $user->ID, array( 'size' => 64 ) ),
			);
		}

		return $output;
	}

	/**
	 * The plugin pages that are gated behind per-user access (in addition
	 * to the always-available base pages: Inbox, Profile, Documentation,
	 * Help). Keys match the React route slugs used in routes.js /
	 * navigation.jsx and the submenu slugs registered in class-captlc-menu.php.
	 *
	 * @return array<string,string> slug => label
	 */
	public static function get_optional_pages() {
		return array(
			'analytics'       => __( 'Analytics', 'captain-live-chat' ),
			'settings'        => __( 'Settings', 'captain-live-chat' ),
			'ai-settings'     => __( 'AI Agent', 'captain-live-chat' ),
			'widget-settings' => __( 'Widget Settings', 'captain-live-chat' ),
			'canned-replies'  => __( 'Canned Responses', 'captain-live-chat' ),
			'history'         => __( 'History', 'captain-live-chat' ),
		);
	}

	/**
	 * Returns the optional-page slugs a given user is allowed to open.
	 * Admins (manage_options) implicitly get every page, so this is only
	 * meaningful for non-admin agents granted access via the "specific
	 * users" list on the Profile → Team Access screen.
	 *
	 * @param int $user_id WP user ID.
	 * @return array<int,string>
	 */
	public static function get_user_allowed_pages( $user_id ) {
		if ( user_can( $user_id, 'manage_options' ) ) {
			return array_keys( self::get_optional_pages() );
		}

		$settings = CAPTLC_Settings::get_settings();
		$map      = isset( $settings['user_page_access'] ) && is_array( $settings['user_page_access'] ) ? $settings['user_page_access'] : array();
		$pages    = isset( $map[ $user_id ] ) && is_array( $map[ $user_id ] ) ? $map[ $user_id ] : array();

		return array_values( array_intersect( $pages, array_keys( self::get_optional_pages() ) ) );
	}

	/**
	 * Determines whether a given user is allowed to act as a chat agent.
	 *
	 * @param int $user_id WP user ID.
	 * @return bool
	 */
	public static function can_reply( $user_id ) {
		$settings = CAPTLC_Settings::get_settings();
		$user     = get_userdata( $user_id );

		if ( ! $user ) {
			return false;
		}

		// Specific user override — always wins if listed.
		if ( in_array( $user_id, array_map( 'intval', $settings['allowed_users'] ), true ) ) {
			return true;
		}

		// Role based check.
		foreach ( $user->roles as $role ) {
			if ( in_array( $role, $settings['allowed_roles'], true ) ) {
				return true;
			}
		}

		return false;
	}
}
