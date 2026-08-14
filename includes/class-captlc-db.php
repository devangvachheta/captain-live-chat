<?php
/**
 * Database access layer — all custom table queries live here.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_DB
 */
class CAPTLC_DB {

	/**
	 * Returns the threads table name.
	 *
	 * @return string
	 */
	public static function threads_table() {
		global $wpdb;
		return $wpdb->prefix . 'captlc_threads';
	}

	/**
	 * Returns the messages table name.
	 *
	 * @return string
	 */
	public static function messages_table() {
		global $wpdb;
		return $wpdb->prefix . 'captlc_messages';
	}

	/**
	 * Returns the agents table name.
	 *
	 * @return string
	 */
	public static function agents_table() {
		global $wpdb;
		return $wpdb->prefix . 'captlc_agents';
	}

	/**
	 * Creates a new chat thread.
	 *
	 * @param array $data Thread fields (visitor_id, visitor_name, visitor_email, source_url, browser, device, location).
	 * @return int Inserted thread ID.
	 */
	public static function create_thread( $data ) {
		global $wpdb;

		$now = current_time( 'mysql' );

		$wpdb->insert(
			self::threads_table(),
			array(
				'visitor_id'    => $data['visitor_id'],
				'visitor_name'  => isset( $data['visitor_name'] ) ? $data['visitor_name'] : '',
				'visitor_email' => isset( $data['visitor_email'] ) ? $data['visitor_email'] : '',
				'status'        => 'open',
				'source_url'    => isset( $data['source_url'] ) ? $data['source_url'] : '',
				'browser'       => isset( $data['browser'] ) ? $data['browser'] : '',
				'device'        => isset( $data['device'] ) ? $data['device'] : '',
				'location'      => isset( $data['location'] ) ? $data['location'] : '',
				'created_at'    => $now,
				'updated_at'    => $now,
			),
			array( '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		return (int) $wpdb->insert_id;
	}

	/**
	 * Fetches a single thread by ID.
	 *
	 * @param int $thread_id Thread ID.
	 * @return object|null
	 */
	public static function get_thread( $thread_id ) {
		global $wpdb;

		$table = self::threads_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $thread_id )
		);
	}

	/**
	 * Fetches a thread by the visitor's cookie/localStorage ID.
	 *
	 * @param string $visitor_id Visitor identifier.
	 * @return object|null
	 */
	public static function get_thread_by_visitor( $visitor_id ) {
		global $wpdb;

		$table = self::threads_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE visitor_id = %s AND status != 'closed' ORDER BY id DESC LIMIT 1",
				$visitor_id
			)
		);
	}

	/**
	 * Returns all threads for the inbox list, most recently updated first.
	 *
	 * @param string $status Optional status filter ('open', 'pending', 'closed', or '' for all).
	 * @return array
	 */
	public static function get_threads( $status = '' ) {
		global $wpdb;

		$table = self::threads_table();

		if ( $status ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$sql = $wpdb->prepare( "SELECT * FROM {$table} WHERE status = %s ORDER BY updated_at DESC", $status );
		} else {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$sql = "SELECT * FROM {$table} ORDER BY updated_at DESC";
		}

		return $wpdb->get_results( $sql );
	}

	/**
	 * Updates thread status.
	 *
	 * @param int    $thread_id Thread ID.
	 * @param string $status    New status.
	 * @return void
	 */
	public static function update_thread_status( $thread_id, $status ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array(
				'status'     => $status,
				'updated_at' => current_time( 'mysql' ),
			),
			array( 'id' => $thread_id ),
			array( '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Toggles the is_favorite (star) flag on a thread.
	 *
	 * @param int  $thread_id Thread ID.
	 * @param bool $favorite  New value.
	 * @return void
	 */
	public static function set_thread_favorite( $thread_id, $favorite ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'is_favorite' => $favorite ? 1 : 0 ),
			array( 'id' => $thread_id ),
			array( '%d' ),
			array( '%d' )
		);
	}

	/**
	 * Toggles the is_blocked flag on a thread (blocks the visitor from sending
	 * further messages).
	 *
	 * @param int  $thread_id Thread ID.
	 * @param bool $blocked   New value.
	 * @return void
	 */
	public static function set_thread_blocked( $thread_id, $blocked ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'is_blocked' => $blocked ? 1 : 0 ),
			array( 'id' => $thread_id ),
			array( '%d' ),
			array( '%d' )
		);
	}

	/**
	 * Assigns (or unassigns, if null) an agent to a thread.
	 *
	 * @param int      $thread_id Thread ID.
	 * @param int|null $agent_id  User ID of the agent, or null to unassign.
	 * @return void
	 */
	public static function assign_thread_agent( $thread_id, $agent_id ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'assigned_agent_id' => $agent_id ? $agent_id : null ),
			array( 'id' => $thread_id ),
			array( '%d' ),
			array( '%d' )
		);
	}

	/**
	 * Merges a key/value pair into a thread's custom_data JSON column.
	 *
	 * @param int    $thread_id Thread ID.
	 * @param string $key       Custom field label.
	 * @param string $value     Custom field value.
	 * @return array Updated custom data (assoc array).
	 */
	public static function set_thread_custom_data( $thread_id, $key, $value ) {
		global $wpdb;

		$thread = self::get_thread( $thread_id );
		$data   = array();

		if ( $thread && ! empty( $thread->custom_data ) ) {
			$decoded = json_decode( $thread->custom_data, true );
			if ( is_array( $decoded ) ) {
				$data = $decoded;
			}
		}

		$data[ $key ] = $value;

		$wpdb->update(
			self::threads_table(),
			array( 'custom_data' => wp_json_encode( $data ) ),
			array( 'id' => $thread_id ),
			array( '%s' ),
			array( '%d' )
		);

		return $data;
	}

	/**
	 * Touches a thread's updated_at timestamp (used on new message).
	 *
	 * @param int $thread_id Thread ID.
	 * @return void
	 */
	public static function touch_thread( $thread_id ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'updated_at' => current_time( 'mysql' ) ),
			array( 'id' => $thread_id ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Inserts a new message into a thread.
	 *
	 * @param array $data Message fields (thread_id, sender_type, sender_id, message, attachment_url).
	 * @return int Inserted message ID.
	 */
	public static function add_message( $data ) {
		global $wpdb;

		$wpdb->insert(
			self::messages_table(),
			array(
				'thread_id'      => $data['thread_id'],
				'sender_type'    => $data['sender_type'],
				'sender_id'      => isset( $data['sender_id'] ) ? $data['sender_id'] : null,
				'message'        => isset( $data['message'] ) ? $data['message'] : '',
				'attachment_url' => isset( $data['attachment_url'] ) ? $data['attachment_url'] : '',
				'is_read'        => 0,
				'created_at'     => current_time( 'mysql' ),
			),
			array( '%d', '%s', '%d', '%s', '%s', '%d', '%s' )
		);

		self::touch_thread( $data['thread_id'] );

		return (int) $wpdb->insert_id;
	}

	/**
	 * Returns messages for a thread, optionally only messages newer than $since_id.
	 *
	 * @param int $thread_id Thread ID.
	 * @param int $since_id  Only return messages with ID greater than this.
	 * @return array
	 */
	public static function get_messages( $thread_id, $since_id = 0 ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE thread_id = %d AND id > %d ORDER BY id ASC",
				$thread_id,
				$since_id
			)
		);
	}

	/**
	 * Marks all visitor messages in a thread as read (agent has opened the chat).
	 *
	 * @param int $thread_id Thread ID.
	 * @return void
	 */
	public static function mark_thread_read( $thread_id ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query(
			$wpdb->prepare(
				"UPDATE {$table} SET is_read = 1 WHERE thread_id = %d AND sender_type = 'visitor'",
				$thread_id
			)
		);
	}

	/**
	 * Returns a single message row (or null).
	 *
	 * @param int $message_id Message ID.
	 * @return object|null
	 */
	public static function get_message( $message_id ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $message_id )
		);
	}

	/**
	 * Deletes a single message by ID.
	 *
	 * @param int $message_id Message ID.
	 * @return bool
	 */
	public static function delete_message( $message_id ) {
		global $wpdb;

		$table = self::messages_table();

		return (bool) $wpdb->delete( $table, array( 'id' => $message_id ), array( '%d' ) );
	}

	/**
	 * Counts unread visitor messages across all open threads (for badge/notification).
	 *
	 * @return int
	 */
	public static function count_unread() {
		global $wpdb;

		$messages_table = self::messages_table();
		$threads_table  = self::threads_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$messages_table} m
			 INNER JOIN {$threads_table} t ON t.id = m.thread_id
			 WHERE m.sender_type = 'visitor' AND m.is_read = 0 AND t.status != 'closed'"
		);
	}

	/**
	 * Counts unread visitor messages for a single thread (used for the "seen" tick).
	 *
	 * @param int $thread_id Thread ID.
	 * @return int
	 */
	public static function count_unread_for_thread( $thread_id ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE thread_id = %d AND sender_type = 'visitor' AND is_read = 0",
				$thread_id
			)
		);
	}

	/**
	 * Updates the visitor's current page URL on a thread (live presence heartbeat).
	 *
	 * @param int    $thread_id Thread ID.
	 * @param string $url       Current page URL.
	 * @return void
	 */
	public static function update_thread_url( $thread_id, $url ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'source_url' => $url ),
			array( 'id' => $thread_id ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Sets an agent's online/offline flag.
	 *
	 * @param int  $user_id  WP user ID.
	 * @param bool $is_online Online state.
	 * @return void
	 */
	public static function set_agent_status( $user_id, $is_online ) {
		global $wpdb;

		$table = self::agents_table();

		$wpdb->replace(
			$table,
			array(
				'user_id'        => $user_id,
				'is_online'      => $is_online ? 1 : 0,
				'last_active_at' => current_time( 'mysql' ),
			),
			array( '%d', '%d', '%s' )
		);
	}

	/**
	 * Returns true if at least one agent is currently online.
	 * An agent is considered online if flagged AND active within the last 60 seconds.
	 *
	 * @return bool
	 */
	public static function is_any_agent_online() {
		global $wpdb;

		$table   = self::agents_table();
		$cutoff  = gmdate( 'Y-m-d H:i:s', time() - 60 );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE is_online = 1 AND last_active_at >= %s",
				$cutoff
			)
		);

		return $count > 0;
	}
}
