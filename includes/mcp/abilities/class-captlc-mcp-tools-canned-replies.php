<?php
/**
 * MCP — Canned Replies domain, as WordPress Abilities. SCAFFOLD — see
 * class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Canned_Replies
 */
class CAPTLC_MCP_Tools_Canned_Replies {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/canned-replies-get',
			array(
				'label'               => __( 'Get Canned Replies', 'captain-live-chat' ),
				'description'         => __( 'Get all canned replies.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/canned-replies-get', true ),
			)
		);

		wp_register_ability(
			'captlc/canned-replies-save',
			array(
				'label'               => __( 'Save Canned Replies', 'captain-live-chat' ),
				'description'         => __( 'Save/replace the full canned replies list.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'replies' => array( 'type' => 'array' ) ),
					'required'   => array( 'replies' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/canned-replies-save', false ),
			)
		);

		wp_register_ability(
			'captlc/canned-replies-quick-add',
			array(
				'label'               => __( 'Quick-Add Canned Reply', 'captain-live-chat' ),
				'description'         => __( 'Quickly add one canned reply.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'title' => array( 'type' => 'string' ),
						'body'  => array( 'type' => 'string' ),
					),
					'required'   => array( 'title', 'body' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/canned-replies-quick-add', false ),
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
