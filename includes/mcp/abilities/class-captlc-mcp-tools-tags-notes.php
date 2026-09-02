<?php
/**
 * MCP — Tags & Notes domain, as WordPress Abilities. SCAFFOLD — see
 * class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Tags_Notes
 */
class CAPTLC_MCP_Tools_Tags_Notes {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/tags-get',
			array(
				'label'               => __( 'Get Tags', 'captain-live-chat' ),
				'description'         => __( 'Get tags for a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/tags-get', true ),
			)
		);

		wp_register_ability(
			'captlc/tags-save',
			array(
				'label'               => __( 'Save Tags', 'captain-live-chat' ),
				'description'         => __( 'Save tags for a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'tags'      => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
					'required'   => array( 'thread_id', 'tags' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/tags-save', false ),
			)
		);

		wp_register_ability(
			'captlc/notes-get',
			array(
				'label'               => __( 'Get Notes', 'captain-live-chat' ),
				'description'         => __( 'Get internal notes on a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/notes-get', true ),
			)
		);

		wp_register_ability(
			'captlc/notes-add',
			array(
				'label'               => __( 'Add Note', 'captain-live-chat' ),
				'description'         => __( 'Add an internal note to a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'note'      => array( 'type' => 'string' ),
					),
					'required'   => array( 'thread_id', 'note' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/notes-add', false ),
			)
		);

		wp_register_ability(
			'captlc/notes-delete',
			array(
				'label'               => __( 'Delete Note', 'captain-live-chat' ),
				'description'         => __( 'Delete an internal note.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'note_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'note_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/notes-delete', false ),
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
