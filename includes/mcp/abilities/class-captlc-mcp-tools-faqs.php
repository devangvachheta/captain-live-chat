<?php
/**
 * MCP — FAQs domain, as WordPress Abilities. SCAFFOLD — see
 * class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Faqs
 */
class CAPTLC_MCP_Tools_Faqs {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/faqs-get',
			array(
				'label'               => __( 'Get FAQs', 'captain-live-chat' ),
				'description'         => __( 'Get the current FAQ list.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/faqs-get', true ),
			)
		);

		wp_register_ability(
			'captlc/faqs-save',
			array(
				'label'               => __( 'Save FAQs', 'captain-live-chat' ),
				'description'         => __( 'Save/replace the full FAQ list.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONTENT,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'faqs' => array( 'type' => 'array' ) ),
					'required'   => array( 'faqs' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/faqs-save', false ),
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
