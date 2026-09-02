<?php
/**
 * MCP — Knowledge Base domain, as WordPress Abilities. SCAFFOLD — see
 * class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Knowledge
 */
class CAPTLC_MCP_Tools_Knowledge {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/knowledge-get',
			array(
				'label'               => __( 'Get Knowledge Base', 'captain-live-chat' ),
				'description'         => __( 'List knowledge base entries (URLs and files).', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/knowledge-get', true ),
			)
		);

		wp_register_ability(
			'captlc/knowledge-add-url',
			array(
				'label'               => __( 'Add Knowledge URL', 'captain-live-chat' ),
				'description'         => __( 'Add a URL to the knowledge base for AI grounding.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'url' => array( 'type' => 'string' ) ),
					'required'   => array( 'url' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/knowledge-add-url', false ),
			)
		);

		wp_register_ability(
			'captlc/knowledge-delete',
			array(
				'label'               => __( 'Delete Knowledge Entry', 'captain-live-chat' ),
				'description'         => __( 'Delete a knowledge base entry.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'entry_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'entry_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/knowledge-delete', false, true ),
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
