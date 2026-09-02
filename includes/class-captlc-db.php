<?php
/**
 * Database access layer — all custom table queries live here.
 *
 * @package captain-live-chat
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
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
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
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT * FROM {$table} WHERE visitor_id = %s AND status != 'closed' AND deleted_at IS NULL ORDER BY id DESC LIMIT 1",
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
			$sql = $wpdb->prepare( "SELECT * FROM {$table} WHERE status = %s AND deleted_at IS NULL ORDER BY updated_at DESC", $status );
		} else {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$sql = "SELECT * FROM {$table} WHERE deleted_at IS NULL ORDER BY updated_at DESC";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $sql already built via $wpdb->prepare() above; this branch has no user-supplied value to bind.
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
	 * Soft-deletes a thread — hides it from the Inbox and from being
	 * matched as a visitor's ongoing conversation, but keeps the thread
	 * and its messages in the database so History still shows it as a
	 * permanent record. Use hard_delete_thread() to actually erase data.
	 *
	 * @param int $thread_id Thread ID.
	 * @return void
	 */
	public static function soft_delete_thread( $thread_id ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'deleted_at' => current_time( 'mysql' ) ),
			array( 'id' => $thread_id ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Permanently deletes a thread and all of its messages. Irreversible —
	 * this also removes it from History, unlike soft_delete_thread().
	 *
	 * @param int $thread_id Thread ID.
	 * @return void
	 */
	public static function hard_delete_thread( $thread_id ) {
		global $wpdb;

		$wpdb->delete( self::messages_table(), array( 'thread_id' => $thread_id ), array( '%d' ) );
		$wpdb->delete( self::threads_table(), array( 'id' => $thread_id ), array( '%d' ) );
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
	 * Removes a single custom data key from a thread.
	 *
	 * @param int    $thread_id Thread ID.
	 * @param string $key       Field name to remove.
	 * @return array Updated custom data array.
	 */
	public static function delete_thread_custom_data( $thread_id, $key ) {
		global $wpdb;

		$thread = self::get_thread( $thread_id );
		$data   = array();

		if ( $thread && ! empty( $thread->custom_data ) ) {
			$decoded = json_decode( $thread->custom_data, true );
			if ( is_array( $decoded ) ) {
				$data = $decoded;
			}
		}

		unset( $data[ $key ] );

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
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT * FROM {$table} WHERE thread_id = %d AND id > %d ORDER BY id ASC",
				$thread_id,
				$since_id
			)
		);
	}

	/**
	 * Returns the most recent $limit messages for a thread (oldest-first),
	 * used for the INITIAL load of a conversation so opening a thread with
	 * years of history doesn't pull every message at once.
	 *
	 * @param int $thread_id Thread ID.
	 * @param int $limit     Max messages to return.
	 * @return array{ messages: object[], has_more: bool }
	 */
	public static function get_recent_messages( $thread_id, $limit = 50 ) {
		global $wpdb;

		$table = self::messages_table();

		// Fetch the newest $limit+1 rows (DESC), then reverse to ASC for display.
		// The "+1" lets us detect whether there are older messages beyond this
		// page without a separate COUNT query.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
				"SELECT * FROM {$table} WHERE thread_id = %d ORDER BY id DESC LIMIT %d",
				$thread_id,
				$limit + 1
			)
		);

		$has_more = count( $rows ) > $limit;
		if ( $has_more ) {
			array_pop( $rows ); // drop the extra probe row
		}

		return array(
			'messages' => array_reverse( $rows ),
			'has_more' => $has_more,
		);
	}

	/**
	 * Returns up to $limit messages older than $before_id (oldest-first) —
	 * used to lazy-load earlier history as the agent/visitor scrolls up.
	 *
	 * @param int $thread_id Thread ID.
	 * @param int $before_id Only messages with id < this are returned.
	 * @param int $limit     Max messages to return.
	 * @return array{ messages: object[], has_more: bool }
	 */
	public static function get_messages_before( $thread_id, $before_id, $limit = 50 ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
				"SELECT * FROM {$table} WHERE thread_id = %d AND id < %d ORDER BY id DESC LIMIT %d",
				$thread_id,
				$before_id,
				$limit + 1
			)
		);

		$has_more = count( $rows ) > $limit;
		if ( $has_more ) {
			array_pop( $rows );
		}

		return array(
			'messages' => array_reverse( $rows ),
			'has_more' => $has_more,
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
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
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
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
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

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names come from $wpdb->prefix, not user input; query has no user-supplied values to bind.
		return (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$messages_table} m
			 INNER JOIN {$threads_table} t ON t.id = m.thread_id
			 WHERE m.sender_type = 'visitor' AND m.is_read = 0 AND t.status != 'closed'"
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
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
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
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
		self::upsert_agent_row(
			$user_id,
			array(
				'is_online'      => $is_online ? 1 : 0,
				'last_active_at' => current_time( 'mysql' ),
			),
			array( '%d', '%s' )
		);
	}

	/**
	 * Returns a single agent's profile row, merged with sane defaults so the
	 * caller never has to null-check individual fields.
	 *
	 * @param int $user_id WP user ID.
	 * @return array
	 */
	public static function get_agent_profile( $user_id ) {
		global $wpdb;

		$table = self::agents_table();
		$row   = $wpdb->get_row(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
			$wpdb->prepare( "SELECT * FROM {$table} WHERE user_id = %d", $user_id ),
			ARRAY_A
		);

		return wp_parse_args(
			$row ? $row : array(),
			array(
				'user_id'            => $user_id,
				'is_online'          => 0,
				'last_active_at'     => null,
				'company_name'       => '',
				'country'            => '',
				'address'            => '',
				'preferred_language' => 'en',
				'availability_mode'  => 'status',
			)
		);
	}

	/**
	 * Saves the editable profile fields for an agent (does not touch
	 * is_online / last_active_at — use set_agent_status() for those).
	 *
	 * @param int   $user_id WP user ID.
	 * @param array $data    Associative array; only recognised keys are saved.
	 * @return void
	 */
	public static function save_agent_profile( $user_id, array $data ) {
		$allowed = array(
			'company_name'       => '%s',
			'country'            => '%s',
			'address'            => '%s',
			'preferred_language' => '%s',
			'availability_mode'  => '%s',
		);

		$values  = array();
		$formats = array();
		foreach ( $allowed as $key => $format ) {
			if ( array_key_exists( $key, $data ) ) {
				$values[ $key ] = $data[ $key ];
				$formats[]      = $format;
			}
		}

		if ( empty( $values ) ) {
			return;
		}

		self::upsert_agent_row( $user_id, $values, $formats );
	}

	/**
	 * Inserts or partially updates a single agent row without clobbering
	 * columns that aren't part of this call — unlike $wpdb->replace(), which
	 * does a DELETE+INSERT and would reset every unlisted column to its
	 * default.
	 *
	 * @param int   $user_id WP user ID.
	 * @param array $data    Column => value pairs to set.
	 * @param array $formats Matching sprintf-style format list for $data.
	 * @return void
	 */
	private static function upsert_agent_row( $user_id, array $data, array $formats ) {
		global $wpdb;

		$table = self::agents_table();

		$columns      = array_keys( $data );
		$placeholders = array();
		$updates      = array();
		$values       = array( $user_id );

		foreach ( $columns as $i => $column ) {
			$placeholders[] = $formats[ $i ];
			$updates[]      = "{$column} = VALUES({$column})";
			$values[]       = $data[ $column ];
		}

		$columns_sql      = 'user_id, ' . implode( ', ', $columns );
		$placeholders_sql = '%d, ' . implode( ', ', $placeholders );
		$updates_sql      = implode( ', ', $updates );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.NotPrepared
		// Table/column names above come from a hardcoded internal whitelist, never
		// user input. All bound values are still passed through prepare() — as a
		// single array, which these SQL-safety sniffs can't statically trace.
		$sql = $wpdb->prepare(
			"INSERT INTO {$table} ({$columns_sql}) VALUES ({$placeholders_sql}) ON DUPLICATE KEY UPDATE {$updates_sql}",
			$values
		);

		$wpdb->query( $sql );
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.NotPrepared
	}

	/**
	 * Returns true if at least one agent is currently online.
	 * An agent is considered online if flagged AND active within the last 60 seconds.
	 *
	 * @return bool
	 */
	public static function is_any_agent_online() {
		global $wpdb;

		$table = self::agents_table();

		// Agents forced to "Always online" count regardless of the heartbeat cutoff below.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; static query has no user-supplied value to bind.
		$always_online = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table} WHERE availability_mode = 'always'" );
		if ( $always_online > 0 ) {
			return true;
		}

		$cutoff = gmdate( 'Y-m-d H:i:s', time() - 60 );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
		$count = (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT COUNT(*) FROM {$table} WHERE availability_mode != 'never' AND is_online = 1 AND last_active_at >= %s",
				$cutoff
			)
		);

		return $count > 0;
	}

	/**
	 * Finds open/pending threads whose last message is an unreplied visitor
	 * message older than the given cutoff, and for which a reminder email
	 * hasn't already been sent since that message arrived.
	 *
	 * @param string $cutoff MySQL datetime — only threads whose last visitor
	 *                       message is at or before this time are eligible.
	 * @return array<int,object> Rows with thread_id, visitor_name, visitor_email, last_message_at.
	 */
	public static function get_threads_needing_reminder( $cutoff ) {
		global $wpdb;

		$threads_table  = self::threads_table();
		$messages_table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names come from $wpdb->prefix, not user input; all bound values are still parameterised.
		return $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table names come from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT t.id AS thread_id, t.visitor_name, t.visitor_email, m.created_at AS last_message_at
				 FROM {$threads_table} t
				 INNER JOIN {$messages_table} m ON m.id = (
					 SELECT MAX(id) FROM {$messages_table} WHERE thread_id = t.id
				 )
				 WHERE t.status != 'closed'
				 AND m.sender_type = 'visitor'
				 AND m.created_at <= %s
				 AND ( t.reminder_sent_at IS NULL OR t.reminder_sent_at < m.created_at )",
				$cutoff
			)
		);
	}

	/**
	 * Returns the visitor messages in a thread that haven't been replied to
	 * yet — i.e. every visitor message sent after the agent's last reply
	 * (or all visitor messages, if the agent hasn't replied at all).
	 *
	 * @param int $thread_id Thread ID.
	 * @return array<int,object>
	 */
	public static function get_unreplied_visitor_messages( $thread_id ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
		$last_agent_id = (int) $wpdb->get_var(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT MAX(id) FROM {$table} WHERE thread_id = %d AND sender_type = 'agent'",
				$thread_id
			)
		);

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
		return $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT * FROM {$table} WHERE thread_id = %d AND id > %d AND sender_type = 'visitor' ORDER BY id ASC",
				$thread_id,
				$last_agent_id
			)
		);
	}

	/**
	 * Records that a reminder email was just sent for a thread, so the
	 * same pending message(s) don't trigger another email.
	 *
	 * @param int $thread_id Thread ID.
	 * @return void
	 */
	public static function mark_reminder_sent( $thread_id ) {
		global $wpdb;

		$wpdb->update(
			self::threads_table(),
			array( 'reminder_sent_at' => current_time( 'mysql' ) ),
			array( 'id' => $thread_id ),
			array( '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Returns the most recent agent-sent message in a thread (sender_type
	 * = 'agent', which also covers AI auto-replies — those are stored the
	 * same way), or null if the agent/AI hasn't sent anything yet. Used to
	 * check "did we already send this exact fallback text?" before
	 * re-sending it — checking the thread's last message generally isn't
	 * enough here, since by the time this runs the visitor's own message
	 * that triggered it has already been saved, so it would always be the
	 * most recent row.
	 *
	 * @param int $thread_id Thread ID.
	 * @return object|null
	 */
	public static function get_last_agent_message( $thread_id ) {
		global $wpdb;

		$table = self::messages_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
		return $wpdb->get_row(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
				"SELECT * FROM {$table} WHERE thread_id = %d AND sender_type = 'agent' ORDER BY id DESC LIMIT 1",
				$thread_id
			)
		);
	}
}
