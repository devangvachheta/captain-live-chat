<?php
/**
 * MCP — Abilities API category registration. Categories must exist
 * before any ability in them is registered.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Categories
 */
class CAPTLC_MCP_Categories {

	const CONVERSATIONS = 'captlc-conversations';
	const AI             = 'captlc-ai';
	const CONTENT        = 'captlc-content';
	const CONFIGURATION  = 'captlc-configuration';
	const INSIGHTS       = 'captlc-insights';

	/**
	 * Registers all ability categories used by this plugin.
	 *
	 * @return void
	 */
	public static function register() {
		wp_register_ability_category(
			self::CONVERSATIONS,
			array(
				'label'       => __( 'Conversations', 'captain-live-chat' ),
				'description' => __( 'Threads, messages, agents, tags, and notes.', 'captain-live-chat' ),
			)
		);

		wp_register_ability_category(
			self::AI,
			array(
				'label'       => __( 'AI Auto-Reply', 'captain-live-chat' ),
				'description' => __( 'AI provider configuration and behaviour.', 'captain-live-chat' ),
			)
		);

		wp_register_ability_category(
			self::CONTENT,
			array(
				'label'       => __( 'Content', 'captain-live-chat' ),
				'description' => __( 'Canned replies, knowledge base, and FAQs.', 'captain-live-chat' ),
			)
		);

		wp_register_ability_category(
			self::CONFIGURATION,
			array(
				'label'       => __( 'Configuration', 'captain-live-chat' ),
				'description' => __( 'Schedule, widget design, and general settings.', 'captain-live-chat' ),
			)
		);

		wp_register_ability_category(
			self::INSIGHTS,
			array(
				'label'       => __( 'Insights', 'captain-live-chat' ),
				'description' => __( 'Analytics and conversation history.', 'captain-live-chat' ),
			)
		);
	}
}
