<?php
/**
 * MCP — Widget Design domain, as WordPress Abilities. SCAFFOLD — see
 * class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Widget_Design
 */
class CAPTLC_MCP_Tools_Widget_Design {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/widget-design-get',
			array(
				'label'               => __( 'Get Widget Design', 'captain-live-chat' ),
				'description'         => __( 'Get the current widget design/branding settings.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/widget-design-get', true ),
			)
		);

		wp_register_ability(
			'captlc/widget-design-save',
			array(
				'label'               => __( 'Save Widget Design', 'captain-live-chat' ),
				'description'         => __( 'Save widget design/branding settings (colors, position, greeting).', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'design' => array( 'type' => 'object' ) ),
					'required'   => array( 'design' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/widget-design-save', false ),
			)
		);

		wp_register_ability(
			'captlc/widget-status',
			array(
				'label'               => __( 'Get Widget Status', 'captain-live-chat' ),
				'description'         => __( 'Get whether the chat widget is currently enabled/online.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/widget-status', true ),
			)
		);
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
