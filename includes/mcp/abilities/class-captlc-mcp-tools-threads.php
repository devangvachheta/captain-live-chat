<?php
/**
 * MCP — Threads domain, as WordPress Abilities.
 *
 * Fully implemented: calls CAPTLC_DB directly. This file is the
 * reference pattern the remaining domain files follow.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Threads
 */
class CAPTLC_MCP_Tools_Threads {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/threads-list',
			array(
				'label'               => __( 'List Threads', 'captain-live-chat' ),
				'description'         => __( 'List chat threads, optionally filtered by status.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'status' => array(
							'type' => 'string',
							'enum' => array( 'open', 'closed', '' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'list_threads' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-list', true ),
			)
		);

		wp_register_ability(
			'captlc/threads-get',
			array(
				'label'               => __( 'Get Thread', 'captain-live-chat' ),
				'description'         => __( 'Get a single thread by ID.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'get_thread' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-get', true ),
			)
		);

		wp_register_ability(
			'captlc/threads-close',
			array(
				'label'               => __( 'Close Thread', 'captain-live-chat' ),
				'description'         => __( 'Close a chat thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'close_thread' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-close', false ),
			)
		);

		wp_register_ability(
			'captlc/threads-reopen',
			array(
				'label'               => __( 'Reopen Thread', 'captain-live-chat' ),
				'description'         => __( 'Reopen a closed chat thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'reopen_thread' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-reopen', false ),
			)
		);

		wp_register_ability(
			'captlc/threads-delete',
			array(
				'label'               => __( 'Remove Thread', 'captain-live-chat' ),
				'description'         => __( 'Remove a chat thread from the Inbox. It stays visible in History as a permanent record; use the History screen to erase it for good.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'delete_thread' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-delete', false, false ),
			)
		);

		wp_register_ability(
			'captlc/threads-assign-agent',
			array(
				'label'               => __( 'Assign Agent', 'captain-live-chat' ),
				'description'         => __( 'Assign a thread to an agent, or unassign with null.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'agent_id'  => array( 'type' => array( 'integer', 'null' ) ),
					),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'assign_agent' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-assign-agent', false ),
			)
		);

		wp_register_ability(
			'captlc/threads-mark-read',
			array(
				'label'               => __( 'Mark Thread Read', 'captain-live-chat' ),
				'description'         => __( 'Mark all visitor messages in a thread as read.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'thread_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'mark_read' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-mark-read', false ),
			)
		);

		wp_register_ability(
			'captlc/threads-toggle-favorite',
			array(
				'label'               => __( 'Toggle Thread Favorite', 'captain-live-chat' ),
				'description'         => __( 'Mark or unmark a thread as favorite.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'favorite'  => array( 'type' => 'boolean' ),
					),
					'required'   => array( 'thread_id', 'favorite' ),
				),
				'execute_callback'    => array( __CLASS__, 'toggle_favorite' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-toggle-favorite', false ),
			)
		);

		wp_register_ability(
			'captlc/threads-toggle-block',
			array(
				'label'               => __( 'Toggle Visitor Block', 'captain-live-chat' ),
				'description'         => __( 'Block or unblock the visitor on a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'blocked'   => array( 'type' => 'boolean' ),
					),
					'required'   => array( 'thread_id', 'blocked' ),
				),
				'execute_callback'    => array( __CLASS__, 'toggle_block' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/threads-toggle-block', false ),
			)
		);
	}

	/**
	 * captlc/threads-list
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function list_threads( $input ) {
		$status  = isset( $input['status'] ) ? sanitize_text_field( $input['status'] ) : '';
		$threads = CAPTLC_DB::get_threads( $status );

		return array( 'threads' => array_map( array( __CLASS__, 'format_thread' ), $threads ) );
	}

	/**
	 * captlc/threads-get
	 *
	 * @param array $input Ability input.
	 * @return array|WP_Error
	 */
	public static function get_thread( $input ) {
		$thread = CAPTLC_DB::get_thread( (int) ( $input['thread_id'] ?? 0 ) );

		if ( ! $thread ) {
			return new WP_Error( 'captlc_mcp_not_found', __( 'Thread not found.', 'captain-live-chat' ) );
		}

		return array( 'thread' => self::format_thread( $thread ) );
	}

	/**
	 * captlc/threads-close
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function close_thread( $input ) {
		CAPTLC_DB::update_thread_status( (int) ( $input['thread_id'] ?? 0 ), 'closed' );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-reopen
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function reopen_thread( $input ) {
		CAPTLC_DB::update_thread_status( (int) ( $input['thread_id'] ?? 0 ), 'open' );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-delete
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function delete_thread( $input ) {
		CAPTLC_DB::soft_delete_thread( (int) ( $input['thread_id'] ?? 0 ) );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-assign-agent
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function assign_agent( $input ) {
		$agent_id = isset( $input['agent_id'] ) && null !== $input['agent_id'] ? (int) $input['agent_id'] : null;
		CAPTLC_DB::assign_thread_agent( (int) ( $input['thread_id'] ?? 0 ), $agent_id );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-mark-read
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function mark_read( $input ) {
		CAPTLC_DB::mark_thread_read( (int) ( $input['thread_id'] ?? 0 ) );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-toggle-favorite
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function toggle_favorite( $input ) {
		CAPTLC_DB::set_thread_favorite( (int) ( $input['thread_id'] ?? 0 ), ! empty( $input['favorite'] ) );
		return array( 'success' => true );
	}

	/**
	 * captlc/threads-toggle-block
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function toggle_block( $input ) {
		CAPTLC_DB::set_thread_blocked( (int) ( $input['thread_id'] ?? 0 ), ! empty( $input['blocked'] ) );
		return array( 'success' => true );
	}

	/**
	 * Formats a raw thread row into the ability output shape.
	 *
	 * @param object $thread Raw thread row.
	 * @return array
	 */
	private static function format_thread( $thread ) {
		return array(
			'id'                => (int) $thread->id,
			'visitor_name'      => $thread->visitor_name,
			'visitor_email'     => $thread->visitor_email,
			'status'            => $thread->status,
			'source_url'        => $thread->source_url,
			'browser'           => $thread->browser,
			'device'            => $thread->device,
			'location'          => $thread->location,
			'assigned_agent_id' => $thread->assigned_agent_id ? (int) $thread->assigned_agent_id : null,
			'is_favorite'       => (bool) $thread->is_favorite,
			'is_blocked'        => (bool) $thread->is_blocked,
			'unread'            => CAPTLC_DB::count_unread_for_thread( $thread->id ),
			'updated_at'        => $thread->updated_at,
		);
	}

}
