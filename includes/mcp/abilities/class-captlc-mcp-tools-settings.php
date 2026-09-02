<?php
/**
 * MCP — Settings & Custom/Commerce Data domain, as WordPress Abilities.
 * SCAFFOLD — see class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Settings
 */
class CAPTLC_MCP_Tools_Settings {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/settings-save',
			array(
				'label'               => __( 'Save Plugin Settings', 'captain-live-chat' ),
				'description'         => __( 'Save general plugin settings.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONFIGURATION,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'settings' => array( 'type' => 'object' ) ),
					'required'   => array( 'settings' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/settings-save', false ),
			)
		);

		wp_register_ability(
			'captlc/custom-data-save',
			array(
				'label'               => __( 'Save Custom Data', 'captain-live-chat' ),
				'description'         => __( 'Save a custom key/value on a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'key'       => array( 'type' => 'string' ),
						'value'     => array( 'type' => 'string' ),
					),
					'required'   => array( 'thread_id', 'key', 'value' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/custom-data-save', false ),
			)
		);

		wp_register_ability(
			'captlc/custom-data-delete',
			array(
				'label'               => __( 'Delete Custom Data', 'captain-live-chat' ),
				'description'         => __( 'Delete a custom key/value from a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'key'       => array( 'type' => 'string' ),
					),
					'required'   => array( 'thread_id', 'key' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/custom-data-delete', false ),
			)
		);

		wp_register_ability(
			'captlc/commerce-get',
			array(
				// translators: WooCommerce is a proper noun, kept untranslated.
				'label'               => __( 'Get Commerce Data', 'captain-live-chat' ),
				'description'         => __( "Get WooCommerce/order data linked to a thread's visitor.", 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/commerce-get', true ),
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
