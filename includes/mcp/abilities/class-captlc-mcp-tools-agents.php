<?php
/**
 * MCP — Agents / Presence / Team domain, as WordPress Abilities.
 *
 * SCAFFOLD: names + schemas are registered so they're discoverable, but
 * execute_callback returns `captlc_mcp_not_implemented` until wired up
 * (see MCP-ABILITIES-PLAN.md).
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Agents
 */
class CAPTLC_MCP_Tools_Agents {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/agents-toggle-status',
			array(
				'label'               => __( 'Toggle Agent Status', 'captain-live-chat' ),
				'description'         => __( 'Set an agent online/offline.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'user_id'   => array( 'type' => 'integer' ),
						'is_online' => array( 'type' => 'boolean' ),
					),
					'required'   => array( 'user_id', 'is_online' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/agents-toggle-status', false ),
			)
		);

		wp_register_ability(
			'captlc/agents-update-presence',
			array(
				'label'               => __( 'Update Agent Presence', 'captain-live-chat' ),
				'description'         => __( 'Update an agent presence heartbeat.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'user_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'user_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/agents-update-presence', false ),
			)
		);

		wp_register_ability(
			'captlc/team-save-access',
			array(
				'label'               => __( 'Save Team Access', 'captain-live-chat' ),
				'description'         => __( 'Save which pages/roles a team member can access.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'user_id' => array( 'type' => 'integer' ),
						'pages'   => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
					'required'   => array( 'user_id', 'pages' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/team-save-access', false ),
			)
		);

		wp_register_ability(
			'captlc/profile-save',
			array(
				'label'               => __( 'Save Agent Profile', 'captain-live-chat' ),
				'description'         => __( 'Save an agent profile (display name, avatar, signature).', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'user_id' => array( 'type' => 'integer' ),
						'data'    => array( 'type' => 'object' ),
					),
					'required'   => array( 'user_id', 'data' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/profile-save', false ),
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
