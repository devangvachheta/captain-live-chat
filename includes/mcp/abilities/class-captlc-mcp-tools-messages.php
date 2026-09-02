<?php
/**
 * MCP — Messages domain, as WordPress Abilities. Fully implemented,
 * calls CAPTLC_DB directly.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp/abilities
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Tools_Messages
 */
class CAPTLC_MCP_Tools_Messages {

	/**
	 * Registers this domain's abilities.
	 *
	 * @return void
	 */
	public static function register() {

		wp_register_ability(
			'captlc/messages-get',
			array(
				'label'               => __( 'Get Messages', 'captain-live-chat' ),
				'description'         => __( 'Get messages for a thread, optionally only newer than since_id.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'since_id'  => array( 'type' => 'integer' ),
					),
					'required'   => array( 'thread_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'get_messages' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/messages-get', true ),
			)
		);

		wp_register_ability(
			'captlc/messages-get-older',
			array(
				'label'               => __( 'Get Older Messages', 'captain-live-chat' ),
				'description'         => __( 'Get messages older than a given message ID (pagination).', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id' => array( 'type' => 'integer' ),
						'before_id' => array( 'type' => 'integer' ),
						'limit'     => array( 'type' => 'integer' ),
					),
					'required'   => array( 'thread_id', 'before_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'get_older_messages' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/messages-get-older', true ),
			)
		);

		wp_register_ability(
			'captlc/messages-send',
			array(
				'label'               => __( 'Send Message', 'captain-live-chat' ),
				'description'         => __( 'Send an agent message into a thread.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array(
						'thread_id'      => array( 'type' => 'integer' ),
						'message'        => array( 'type' => 'string' ),
						'attachment_url' => array( 'type' => 'string' ),
					),
					'required'   => array( 'thread_id', 'message' ),
				),
				'execute_callback'    => array( __CLASS__, 'send_message' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/messages-send', false ),
			)
		);

		wp_register_ability(
			'captlc/messages-delete',
			array(
				'label'               => __( 'Delete Message', 'captain-live-chat' ),
				'description'         => __( 'Delete a single message.', 'captain-live-chat' ),
				'category'            => CAPTLC_MCP_Categories::CONVERSATIONS,
				'input_schema'        => array(
					'type'       => 'object',
					'properties' => array( 'message_id' => array( 'type' => 'integer' ) ),
					'required'   => array( 'message_id' ),
				),
				'execute_callback'    => array( __CLASS__, 'delete_message' ),
				'permission_callback' => array( 'CAPTLC_MCP_Settings', 'can_manage' ),
				'meta'                => CAPTLC_MCP_Ability_Meta::build( 'captlc/messages-delete', false, true ),
			)
		);
	}

	/**
	 * captlc/messages-get
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function get_messages( $input ) {
		$messages = CAPTLC_DB::get_messages(
			(int) ( $input['thread_id'] ?? 0 ),
			(int) ( $input['since_id'] ?? 0 )
		);

		return array( 'messages' => array_map( array( __CLASS__, 'format_message' ), $messages ) );
	}

	/**
	 * captlc/messages-get-older
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function get_older_messages( $input ) {
		$messages = CAPTLC_DB::get_messages_before(
			(int) ( $input['thread_id'] ?? 0 ),
			(int) ( $input['before_id'] ?? 0 ),
			(int) ( $input['limit'] ?? 50 )
		);

		return array( 'messages' => array_map( array( __CLASS__, 'format_message' ), $messages ) );
	}

	/**
	 * captlc/messages-send — attributed to the currently logged-in WP
	 * user, since Abilities API permission/execute callbacks run as
	 * whichever user the MCP Adapter's transport authenticated.
	 *
	 * @param array $input Ability input.
	 * @return array|WP_Error
	 */
	public static function send_message( $input ) {
		$thread_id = (int) ( $input['thread_id'] ?? 0 );
		$message   = isset( $input['message'] ) ? wp_kses_post( $input['message'] ) : '';

		if ( empty( $message ) ) {
			return new WP_Error( 'captlc_mcp_bad_request', __( 'Message text is required.', 'captain-live-chat' ) );
		}

		if ( ! CAPTLC_DB::get_thread( $thread_id ) ) {
			return new WP_Error( 'captlc_mcp_not_found', __( 'Thread not found.', 'captain-live-chat' ) );
		}

		$message_id = CAPTLC_DB::add_message(
			array(
				'thread_id'      => $thread_id,
				'sender_type'    => 'agent',
				'sender_id'      => get_current_user_id() ?: null,
				'message'        => $message,
				'attachment_url' => isset( $input['attachment_url'] ) ? esc_url_raw( $input['attachment_url'] ) : '',
			)
		);

		return array(
			'success'    => true,
			'message_id' => $message_id,
		);
	}

	/**
	 * captlc/messages-delete
	 *
	 * @param array $input Ability input.
	 * @return array
	 */
	public static function delete_message( $input ) {
		CAPTLC_DB::delete_message( (int) ( $input['message_id'] ?? 0 ) );
		return array( 'success' => true );
	}

	/**
	 * Formats a raw message row for ability output.
	 *
	 * @param object $message Raw message row.
	 * @return array
	 */
	private static function format_message( $message ) {
		return array(
			'id'             => (int) $message->id,
			'thread_id'      => (int) $message->thread_id,
			'sender_type'    => $message->sender_type,
			'sender_id'      => $message->sender_id ? (int) $message->sender_id : null,
			'message'        => $message->message,
			'attachment_url' => $message->attachment_url,
			'is_read'        => (bool) $message->is_read,
			'created_at'     => $message->created_at,
		);
	}

}
