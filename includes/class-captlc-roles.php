<?php
/**
 * Role and user permission handling.
 *
 * @package Captain_Live_Chat
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
	 * @return array<int,array{id:int,name:string}>
	 */
	public static function get_selectable_users() {
		$users = get_users(
			array(
				'fields'  => array( 'ID', 'display_name' ),
				'orderby' => 'display_name',
				'order'   => 'ASC',
			)
		);

		$output = array();

		foreach ( $users as $user ) {
			$output[] = array(
				'id'   => (int) $user->ID,
				'name' => $user->display_name,
			);
		}

		return $output;
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
