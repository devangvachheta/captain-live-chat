<?php
/**
 * Chat history — search, filter, paginate, export.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_History
 */
class CAPTLC_History {

	/**
	 * Registers ajax hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_history', array( $this, 'get_history' ) );
		add_action( 'wp_ajax_captlc_get_thread_messages', array( $this, 'get_thread_messages' ) );
		add_action( 'wp_ajax_captlc_get_older_thread_messages', array( $this, 'get_older_thread_messages' ) );
		add_action( 'wp_ajax_captlc_export_history', array( $this, 'export_history' ) );
		add_action( 'wp_ajax_captlc_permanently_delete_thread', array( $this, 'permanently_delete_thread' ) );
	}

	/**
	 * Permanently erases a thread and its messages — unlike the Inbox's
	 * "Remove from Inbox" (a soft delete), this is irreversible and also
	 * removes the thread from History. Confirmed client-side before this
	 * call is made; kept admin-only and separate from the Inbox's delete
	 * action on purpose, so permanent erasure is always a deliberate,
	 * harder-to-reach step.
	 *
	 * @return void
	 */
	public function permanently_delete_thread() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;

		if ( ! $thread_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread.', 'captain-live-chat' ) ) );
		}

		CAPTLC_DB::hard_delete_thread( $thread_id );

		wp_send_json_success();
	}

	/**
	 * Returns paginated, filtered thread list for the History page.
	 *
	 * @return void
	 */
	public function get_history() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		global $wpdb;

		$threads_table  = CAPTLC_DB::threads_table();
		$messages_table = CAPTLC_DB::messages_table();

		$search    = isset( $_POST['search'] ) ? sanitize_text_field( wp_unslash( $_POST['search'] ) ) : '';
		$status    = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : '';
		$date_from = isset( $_POST['date_from'] ) ? sanitize_text_field( wp_unslash( $_POST['date_from'] ) ) : '';
		$date_to   = isset( $_POST['date_to'] ) ? sanitize_text_field( wp_unslash( $_POST['date_to'] ) ) : '';
		$page      = isset( $_POST['page'] ) ? max( 1, absint( $_POST['page'] ) ) : 1;
		$per_page  = isset( $_POST['per_page'] ) ? min( 100, absint( $_POST['per_page'] ) ) : 20;
		$offset    = ( $page - 1 ) * $per_page;

		$where  = array( '1=1' );
		$params = array();

		if ( $search ) {
			$like     = '%' . $wpdb->esc_like( $search ) . '%';
			$where[]  = '(t.visitor_name LIKE %s OR t.visitor_email LIKE %s)';
			$params[] = $like;
			$params[] = $like;
		}

		if ( $status ) {
			$where[]  = 't.status = %s';
			$params[] = $status;
		}

		if ( $date_from ) {
			$where[]  = 't.created_at >= %s';
			$params[] = $date_from . ' 00:00:00';
		}

		if ( $date_to ) {
			$where[]  = 't.created_at <= %s';
			$params[] = $date_to . ' 23:59:59';
		}

		$where_sql = implode( ' AND ', $where );

		// Count total.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		$count_sql = "SELECT COUNT(*) FROM {$threads_table} t WHERE {$where_sql}";
		$total     = $params
			// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
			? (int) $wpdb->get_var( $wpdb->prepare( $count_sql, $params ) )
			: (int) $wpdb->get_var( $count_sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		// Fetch page of threads with message count.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$data_sql = "
			SELECT t.*,
				   ( SELECT COUNT(*) FROM {$messages_table} m WHERE m.thread_id = t.id ) AS message_count
			FROM {$threads_table} t
			WHERE {$where_sql}
			ORDER BY t.updated_at DESC
			LIMIT %d OFFSET %d
		";

		$data_params = array_merge( $params, array( $per_page, $offset ) );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$threads = $wpdb->get_results( $wpdb->prepare( $data_sql, $data_params ) );

		wp_send_json_success(
			array(
				'threads'     => $threads,
				'total'       => $total,
				'total_pages' => (int) ceil( $total / $per_page ),
				'page'        => $page,
			)
		);
	}

	/**
	 * Returns all messages for a single thread (for the expandable row).
	 *
	 * @return void
	 */
	public function get_thread_messages() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;

		if ( ! $thread_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread.', 'captain-live-chat' ) ) );
		}

		// Only the most recent page — a returning customer's thread can span
		// months and thousands of messages, so loading everything at once
		// when the row is expanded would be slow. Older messages are
		// fetched on demand via get_older_thread_messages() as the transcript
		// is scrolled up.
		$page = CAPTLC_DB::get_recent_messages( $thread_id, 50 );

		wp_send_json_success(
			array(
				'messages' => $page['messages'],
				'has_more' => $page['has_more'],
			)
		);
	}

	/**
	 * Loads an older page of a thread's transcript for the History page
	 * (paired with get_thread_messages() above).
	 *
	 * @return void
	 */
	public function get_older_thread_messages() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$before_id = isset( $_POST['before_id'] ) ? absint( $_POST['before_id'] ) : 0;

		if ( ! $thread_id || ! $before_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread.', 'captain-live-chat' ) ) );
		}

		$page = CAPTLC_DB::get_messages_before( $thread_id, $before_id, 50 );

		wp_send_json_success(
			array(
				'messages' => $page['messages'],
				'has_more' => $page['has_more'],
			)
		);
	}

	/**
	 * Generates and returns a CSV of filtered threads + their messages.
	 *
	 * @return void
	 */
	public function export_history() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		global $wpdb;

		$threads_table  = CAPTLC_DB::threads_table();
		$messages_table = CAPTLC_DB::messages_table();

		$search    = isset( $_POST['search'] ) ? sanitize_text_field( wp_unslash( $_POST['search'] ) ) : '';
		$status    = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : '';
		$date_from = isset( $_POST['date_from'] ) ? sanitize_text_field( wp_unslash( $_POST['date_from'] ) ) : '';
		$date_to   = isset( $_POST['date_to'] ) ? sanitize_text_field( wp_unslash( $_POST['date_to'] ) ) : '';

		$where  = array( '1=1' );
		$params = array();

		if ( $search ) {
			$like     = '%' . $wpdb->esc_like( $search ) . '%';
			$where[]  = '(t.visitor_name LIKE %s OR t.visitor_email LIKE %s)';
			$params[] = $like;
			$params[] = $like;
		}

		if ( $status ) {
			$where[]  = 't.status = %s';
			$params[] = $status;
		}

		if ( $date_from ) {
			$where[]  = 't.created_at >= %s';
			$params[] = $date_from . ' 00:00:00';
		}

		if ( $date_to ) {
			$where[]  = 't.created_at <= %s';
			$params[] = $date_to . ' 23:59:59';
		}

		$where_sql = implode( ' AND ', $where );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$sql = "SELECT t.* FROM {$threads_table} t WHERE {$where_sql} ORDER BY t.created_at DESC LIMIT 2000";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$threads = $params ? $wpdb->get_results( $wpdb->prepare( $sql, $params ) ) : $wpdb->get_results( $sql ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

		// Build CSV.
		$rows   = array();
		$rows[] = array( 'Thread ID', 'Visitor Name', 'Email', 'Status', 'Browser', 'Device', 'Source URL', 'Date', 'Sender', 'Message' );

		foreach ( $threads as $thread ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$msgs = $wpdb->get_results(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				$wpdb->prepare( "SELECT * FROM {$messages_table} WHERE thread_id = %d ORDER BY id ASC", $thread->id )
			);

			if ( empty( $msgs ) ) {
				$rows[] = array(
					$thread->id,
					$thread->visitor_name,
					$thread->visitor_email,
					$thread->status,
					$thread->browser,
					$thread->device,
					$thread->source_url,
					$thread->created_at,
					'',
					'',
				);
				continue;
			}

			foreach ( $msgs as $msg ) {
				$rows[] = array(
					$thread->id,
					$thread->visitor_name,
					$thread->visitor_email,
					$thread->status,
					$thread->browser,
					$thread->device,
					$thread->source_url,
					$thread->created_at,
					$msg->sender_type,
					$msg->message,
				);
			}
		}

		$csv = '';
		foreach ( $rows as $row ) {
			$escaped = array_map(
				static function ( $field ) {
					$field = str_replace( '"', '""', (string) $field );
					return '"' . $field . '"';
				},
				$row
			);
			$csv    .= implode( ',', $escaped ) . "\r\n";
		}

		wp_send_json_success( array( 'csv' => $csv ) );
	}
}
