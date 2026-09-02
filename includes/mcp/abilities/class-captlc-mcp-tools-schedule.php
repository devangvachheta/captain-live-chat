<?php
/**
 * MCP — Schedule / Business Hours domain, as WordPress Abilities.
 * SCAFFOLD — see class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Schedule
 */
class CAPTLC_MCP_Tools_Schedule {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/schedule-get',
			array(
				'label'               => __( 'Get Schedule', 'captain-live-chat' ),
				'description'         => __( 'Get the current business-hours schedule.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'execute_callback'    => array( __CLASS__, 'get_schedule' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/schedule-get', true ),
			)
		);

		wp_register_ability(
			'captlc/schedule-save',
			array(
				'label'               => __( 'Save Schedule', 'captain-live-chat' ),
				'description'         => __( 'Save the business-hours schedule.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'schedule' => array( 'type' => 'object' ) ),
					'required'   => array( 'schedule' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/schedule-save', false ),
			)
		);
	}

	/**
	 * captlc/schedule-get — fully implemented, reuses the same static
	 * schedule reader the widget itself uses.
	 *
	 * @return array
	 */
	public static function get_schedule() {
		return array( 'schedule' => CAPTLC_Features::get_saved_schedule() );
	}

	/**
	 * Placeholder callback for not-yet-wired abilities in this domain.
	 *
	 * @return WP_Error
	 */
	public static function not_implemented() {
		return new WP_Error( 'captlc_mcp_not_implemented', __( 'This ability is scaffolded but not yet implemented.', 'captain-live-chat' ) );
	}
}
