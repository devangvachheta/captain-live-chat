<?php
/**
 * MCP — Analytics & History domain, as WordPress Abilities. SCAFFOLD —
 * see class-captlc-mcp-tools-agents.php header.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Analytics_History
 */
class CAPTLC_MCP_Tools_Analytics_History {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/analytics-get',
			array(
				'label'               => __( 'Get Analytics', 'captain-live-chat' ),
				'description'         => __( 'Get analytics summary for a date range.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::INSIGHTS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'from' => array(
							'type'        => 'string',
							'description' => 'YYYY-MM-DD',
						),
						'to'   => array(
							'type'        => 'string',
							'description' => 'YYYY-MM-DD',
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/analytics-get', true ),
			)
		);

		wp_register_ability(
			'captlc/history-get',
			array(
				'label'               => __( 'Get History', 'captain-live-chat' ),
				'description'         => __( 'Get past thread/message history.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::INSIGHTS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/history-get', true ),
			)
		);

		wp_register_ability(
			'captlc/history-export',
			array(
				'label'               => __( 'Export History', 'captain-live-chat' ),
				'description'         => __( 'Export conversation history (CSV/JSON) for a date range.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::INSIGHTS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'from'   => array( 'type' => 'string' ),
						'to'     => array( 'type' => 'string' ),
						'format' => array(
							'type' => 'string',
							'enum' => array( 'csv', 'json' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'not_implemented' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/history-export', false ),
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
