<?php
/**
 * All admin-ajax.php request handlers for the plugin.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Ajax
 */
class CAPTLC_Ajax {

	const NONCE_ACTION = 'captlc_ajax_nonce';

	/**
	 * Registers all ajax hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		// Visitor-facing (works for logged-out users too).
		add_action( 'wp_ajax_captlc_start_thread', array( $this, 'start_thread' ) );
		add_action( 'wp_ajax_nopriv_captlc_start_thread', array( $this, 'start_thread' ) );

		add_action( 'wp_ajax_captlc_send_message', array( $this, 'send_message' ) );
		add_action( 'wp_ajax_nopriv_captlc_send_message', array( $this, 'send_message' ) );

		add_action( 'wp_ajax_captlc_get_messages', array( $this, 'get_messages' ) );
		add_action( 'wp_ajax_nopriv_captlc_get_messages', array( $this, 'get_messages' ) );

		add_action( 'wp_ajax_captlc_widget_status', array( $this, 'widget_status' ) );
		add_action( 'wp_ajax_nopriv_captlc_widget_status', array( $this, 'widget_status' ) );

		add_action( 'wp_ajax_captlc_update_typing', array( $this, 'update_typing' ) );
		add_action( 'wp_ajax_nopriv_captlc_update_typing', array( $this, 'update_typing' ) );

		add_action( 'wp_ajax_captlc_update_presence', array( $this, 'update_presence' ) );
		add_action( 'wp_ajax_nopriv_captlc_update_presence', array( $this, 'update_presence' ) );

		add_action( 'wp_ajax_captlc_save_settings', array( $this, 'save_settings' ) );

		add_action( 'wp_ajax_captlc_upload_attachment', array( $this, 'upload_attachment' ) );
		add_action( 'wp_ajax_nopriv_captlc_upload_attachment', array( $this, 'upload_attachment' ) );

		// Agent/admin-only.
		add_action( 'wp_ajax_captlc_get_threads', array( $this, 'get_threads' ) );
		add_action( 'wp_ajax_captlc_close_thread', array( $this, 'close_thread' ) );
		add_action( 'wp_ajax_captlc_mark_read', array( $this, 'mark_read' ) );
		add_action( 'wp_ajax_captlc_toggle_agent_status', array( $this, 'toggle_agent_status' ) );
	}

	/**
	 * Verifies the shared front/back nonce or dies.
	 *
	 * @return void
	 */
	private function verify_nonce() {
		check_ajax_referer( self::NONCE_ACTION, 'nonce' );
	}

	/**
	 * Simple transient-based rate limiter to stop spam from a single visitor/IP.
	 * Dies with a JSON error if the limit is exceeded.
	 *
	 * @param string $bucket     Distinguishes different limited actions (e.g. 'start_thread').
	 * @param int    $max_hits   Max allowed hits within the window.
	 * @param int    $window_sec Window length in seconds.
	 * @return void
	 */
	private function enforce_rate_limit( $bucket, $max_hits = 20, $window_sec = 60 ) {
		$identity = ! empty( $_POST['visitor_id'] ) ? sanitize_text_field( wp_unslash( $_POST['visitor_id'] ) ) : $this->get_client_ip();
		$key      = 'captlc_rl_' . $bucket . '_' . md5( $identity );

		$hits = (int) get_transient( $key );

		if ( $hits >= $max_hits ) {
			wp_send_json_error( array( 'message' => __( 'Too many requests. Please slow down and try again shortly.', 'captain-live-chat' ) ), 429 );
		}

		set_transient( $key, $hits + 1, $window_sec );
	}

	/**
	 * Best-effort client IP lookup, used only for rate-limiting (not stored).
	 *
	 * @return string
	 */
	private function get_client_ip() {
		$candidates = array( 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' );

		foreach ( $candidates as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = sanitize_text_field( wp_unslash( $_SERVER[ $key ] ) );
				$ip = trim( explode( ',', $ip )[0] );
				return $ip;
			}
		}

		return 'unknown';
	}

	/**
	 * Resolves (or generates) the current visitor's stable identifier.
	 *
	 * @return string
	 */
	private function get_visitor_id() {
		if ( ! empty( $_POST['visitor_id'] ) ) {
			return sanitize_text_field( wp_unslash( $_POST['visitor_id'] ) );
		}

		return wp_generate_uuid4();
	}

	/**
	 * Detects a coarse browser + device string from the user agent (no external service).
	 *
	 * @return array{browser:string,device:string}
	 */
	private function detect_client() {
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) : '';

		$browser = 'Unknown';
		if ( stripos( $ua, 'Edg' ) !== false ) {
			$browser = 'Edge';
		} elseif ( stripos( $ua, 'Chrome' ) !== false ) {
			$browser = 'Chrome';
		} elseif ( stripos( $ua, 'Firefox' ) !== false ) {
			$browser = 'Firefox';
		} elseif ( stripos( $ua, 'Safari' ) !== false ) {
			$browser = 'Safari';
		}

		$device = ( stripos( $ua, 'Mobile' ) !== false || stripos( $ua, 'Android' ) !== false ) ? 'Mobile' : 'Desktop';

		return array(
			'browser' => $browser,
			'device'  => $device,
		);
	}

	/**
	 * Starts a new chat thread from the pre-chat form.
	 *
	 * @return void
	 */
	public function start_thread() {
		$this->verify_nonce();
		$this->enforce_rate_limit( 'start_thread', 10, 60 );

		$visitor_id    = $this->get_visitor_id();
		$visitor_name  = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
		$visitor_email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
		$message       = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
		$source_url    = isset( $_POST['source_url'] ) ? sanitize_text_field( wp_unslash( $_POST['source_url'] ) ) : '';

		if ( empty( $visitor_name ) || empty( $message ) ) {
			wp_send_json_error( array( 'message' => __( 'Name and message are required.', 'captain-live-chat' ) ) );
		}

		$client = $this->detect_client();

		$existing = CAPTLC_DB::get_thread_by_visitor( $visitor_id );

		if ( $existing ) {
			$thread_id = (int) $existing->id;
		} else {
			$thread_id = CAPTLC_DB::create_thread(
				array(
					'visitor_id'    => $visitor_id,
					'visitor_name'  => $visitor_name,
					'visitor_email' => $visitor_email,
					'source_url'    => $source_url,
					'browser'       => $client['browser'],
					'device'        => $client['device'],
					'location'      => '',
				)
			);
		}

		$message_id = CAPTLC_DB::add_message(
			array(
				'thread_id'   => $thread_id,
				'sender_type' => 'visitor',
				'message'     => $message,
			)
		);

		CAPTLC_Notifications::maybe_notify_new_message( $thread_id, $visitor_name, $message );

		wp_send_json_success(
			array(
				'thread_id'  => $thread_id,
				'visitor_id' => $visitor_id,
				'message_id' => $message_id,
			)
		);
	}

	/**
	 * Sends a message — used by both visitor (nopriv) and logged-in agents.
	 *
	 * @return void
	 */
	public function send_message() {
		$this->verify_nonce();

		$is_agent_precheck = is_user_logged_in() && CAPTLC_Roles::can_reply( get_current_user_id() );
		if ( ! $is_agent_precheck ) {
			$this->enforce_rate_limit( 'send_message', 30, 60 );
		}

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$message   = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
		$attachment_url = isset( $_POST['attachment_url'] ) ? esc_url_raw( wp_unslash( $_POST['attachment_url'] ) ) : '';

		if ( ! $thread_id || ( '' === trim( $message ) && '' === $attachment_url ) ) {
			wp_send_json_error( array( 'message' => __( 'Message cannot be empty.', 'captain-live-chat' ) ) );
		}

		$thread = CAPTLC_DB::get_thread( $thread_id );

		if ( ! $thread ) {
			wp_send_json_error( array( 'message' => __( 'Chat thread not found.', 'captain-live-chat' ) ) );
		}

		$is_agent = is_user_logged_in() && CAPTLC_Roles::can_reply( get_current_user_id() );

		if ( $is_agent ) {
			$sender_type = 'agent';
			$sender_id   = get_current_user_id();

			if ( 'closed' === $thread->status ) {
				CAPTLC_DB::update_thread_status( $thread_id, 'open' );
			}
		} else {
			$sender_type = 'visitor';
			$sender_id   = null;
		}

		$message_id = CAPTLC_DB::add_message(
			array(
				'thread_id'      => $thread_id,
				'sender_type'    => $sender_type,
				'sender_id'      => $sender_id,
				'message'        => $message,
				'attachment_url' => $attachment_url,
			)
		);

		if ( 'agent' === $sender_type ) {
			CAPTLC_DB::mark_thread_read( $thread_id );
		} else {
			CAPTLC_Notifications::maybe_notify_new_message( $thread_id, $thread->visitor_name, $message );

			// AI auto-reply — only when all agents are offline.
			$general = (array) get_option( CAPTLC_AI::OPTION_GENERAL, array() );
			if ( ! empty( $general['auto_reply_enabled'] ) && ! CAPTLC_DB::is_any_agent_online() ) {
				$ai_reply = CAPTLC_AI::auto_reply( $thread_id, $message );
				if ( ! is_wp_error( $ai_reply ) && $ai_reply ) {
					CAPTLC_DB::add_message(
						array(
							'thread_id'   => $thread_id,
							'sender_type' => 'agent',
							'sender_id'   => null,
							'message'     => $ai_reply,
						)
					);
				}
			}
		}

		// Sending a message counts as "no longer typing".
		delete_transient( 'captlc_typing_' . $thread_id . '_' . $sender_type );

		wp_send_json_success( array( 'message_id' => $message_id ) );
	}

	/**
	 * Polling endpoint — returns new messages for a thread since a given ID.
	 *
	 * @return void
	 */
	public function get_messages() {
		$this->verify_nonce();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$since_id  = isset( $_POST['since_id'] ) ? absint( $_POST['since_id'] ) : 0;

		if ( ! $thread_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread.', 'captain-live-chat' ) ) );
		}

		$thread = CAPTLC_DB::get_thread( $thread_id );

		if ( ! $thread ) {
			wp_send_json_error( array( 'message' => __( 'Chat thread not found.', 'captain-live-chat' ) ) );
		}

		$rows = CAPTLC_DB::get_messages( $thread_id, $since_id );

		$is_agent = is_user_logged_in() && CAPTLC_Roles::can_reply( get_current_user_id() );

		if ( $is_agent ) {
			CAPTLC_DB::mark_thread_read( $thread_id );
		}

		$messages = array();
		foreach ( $rows as $row ) {
			$messages[] = array(
				'id'             => (int) $row->id,
				'sender_type'    => $row->sender_type,
				'message'        => $row->message,
				'attachment_url' => $row->attachment_url,
				'created_at'     => $row->created_at,
			);
		}

		// "Other side" typing indicator: agent watches for visitor typing and vice versa.
		$other_sender = $is_agent ? 'visitor' : 'agent';
		$is_typing    = (bool) get_transient( 'captlc_typing_' . $thread_id . '_' . $other_sender );

		// Visitor-facing "seen" tick: true once the agent has read all of the visitor's messages.
		$seen = 0 === CAPTLC_DB::count_unread_for_thread( $thread_id );

		wp_send_json_success(
			array(
				'messages' => $messages,
				'status'   => $thread->status,
				'typing'   => $is_typing,
				'seen'     => $seen,
			)
		);
	}

	/**
	 * Tells the widget whether any agent is currently online (for the pre-chat status dot).
	 *
	 * @return void
	 */
	public function widget_status() {
		$this->verify_nonce();

		wp_send_json_success(
			array(
				'online' => CAPTLC_DB::is_any_agent_online(),
			)
		);
	}

	/**
	 * Sets a short-lived "is typing" flag for a thread.
	 * Uses a transient instead of a DB table since it is disposable, high-frequency data.
	 *
	 * @return void
	 */
	public function update_typing() {
		$this->verify_nonce();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;

		if ( ! $thread_id ) {
			wp_send_json_error();
		}

		$is_agent    = is_user_logged_in() && CAPTLC_Roles::can_reply( get_current_user_id() );
		$sender_type = $is_agent ? 'agent' : 'visitor';

		set_transient( 'captlc_typing_' . $thread_id . '_' . $sender_type, 1, 5 );

		wp_send_json_success();
	}

	/**
	 * Updates the visitor's current page URL for a thread (called periodically while the widget is open).
	 *
	 * @return void
	 */
	public function update_presence() {
		$this->verify_nonce();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$url       = isset( $_POST['url'] ) ? esc_url_raw( wp_unslash( $_POST['url'] ) ) : '';

		if ( ! $thread_id || ! $url ) {
			wp_send_json_error();
		}

		CAPTLC_DB::update_thread_url( $thread_id, $url );

		wp_send_json_success();
	}

	/**
	 * Returns the thread list for the agent inbox (with unread counts).
	 *
	 * @return void
	 */
	public function get_threads() {
		$this->verify_nonce();
		$this->require_agent();

		$threads = CAPTLC_DB::get_threads();
		$output  = array();

		global $wpdb;
		$messages_table = CAPTLC_DB::messages_table();

		foreach ( $threads as $thread ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$unread = (int) $wpdb->get_var(
				$wpdb->prepare(
					"SELECT COUNT(*) FROM {$messages_table} WHERE thread_id = %d AND sender_type = 'visitor' AND is_read = 0",
					$thread->id
				)
			);

			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$last_message = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT message FROM {$messages_table} WHERE thread_id = %d ORDER BY id DESC LIMIT 1",
					$thread->id
				)
			);

			$output[] = array(
				'id'            => (int) $thread->id,
				'visitor_name'  => $thread->visitor_name,
				'visitor_email' => $thread->visitor_email,
				'status'        => $thread->status,
				'source_url'    => $thread->source_url,
				'browser'       => $thread->browser,
				'device'        => $thread->device,
				'unread'        => $unread,
				'last_message'  => $last_message ? wp_trim_words( $last_message, 10 ) : '',
				'updated_at'    => $thread->updated_at,
			);
		}

		wp_send_json_success( array( 'threads' => $output ) );
	}

	/**
	 * Closes a chat thread.
	 *
	 * @return void
	 */
	public function close_thread() {
		$this->verify_nonce();
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;

		if ( ! $thread_id ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread.', 'captain-live-chat' ) ) );
		}

		CAPTLC_DB::update_thread_status( $thread_id, 'closed' );

		wp_send_json_success();
	}

	/**
	 * Marks a thread's visitor messages as read.
	 *
	 * @return void
	 */
	public function mark_read() {
		$this->verify_nonce();
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;

		if ( $thread_id ) {
			CAPTLC_DB::mark_thread_read( $thread_id );
		}

		wp_send_json_success();
	}

	/**
	 * Toggles the current agent's online/offline flag.
	 *
	 * @return void
	 */
	public function toggle_agent_status() {
		$this->verify_nonce();
		$this->require_agent();

		$is_online = isset( $_POST['is_online'] ) && '1' === sanitize_text_field( wp_unslash( $_POST['is_online'] ) );

		CAPTLC_DB::set_agent_status( get_current_user_id(), $is_online );

		wp_send_json_success();
	}

	/**
	 * Dies with an error if the current user is not an allowed chat agent.
	 *
	 * @return void
	 */
	private function require_agent() {
		if ( ! is_user_logged_in() || ! CAPTLC_Roles::can_reply( get_current_user_id() ) ) {
			wp_send_json_error( array( 'message' => __( 'You are not allowed to perform this action.', 'captain-live-chat' ) ), 403 );
		}
	}

	/**
	 * Handles file/image upload from visitor widget or agent dashboard.
	 * Uses wp_handle_upload() — stores in standard WP uploads folder.
	 *
	 * @return void
	 */
	public function upload_attachment() {
		$this->verify_nonce();
		$this->enforce_rate_limit( 'upload', 10, 60 );

		if ( empty( $_FILES['captlc_file'] ) ) {
			wp_send_json_error( array( 'message' => __( 'No file received.', 'captain-live-chat' ) ) );
		}

		// Allowed MIME types — images + common docs only.
		$allowed_types = array(
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/webp',
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		);

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$file_type = isset( $_FILES['captlc_file']['type'] ) ? sanitize_mime_type( wp_unslash( $_FILES['captlc_file']['type'] ) ) : '';

		if ( ! in_array( $file_type, $allowed_types, true ) ) {
			wp_send_json_error( array( 'message' => __( 'File type not allowed. Allowed: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX.', 'captain-live-chat' ) ) );
		}

		// Max 5 MB.
		$max_size = 5 * 1024 * 1024;
		if ( isset( $_FILES['captlc_file']['size'] ) && (int) $_FILES['captlc_file']['size'] > $max_size ) {
			wp_send_json_error( array( 'message' => __( 'File too large. Maximum size is 5 MB.', 'captain-live-chat' ) ) );
		}

		if ( ! function_exists( 'wp_handle_upload' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$uploaded = wp_handle_upload(
			$_FILES['captlc_file'],
			array( 'test_form' => false )
		);

		if ( isset( $uploaded['error'] ) ) {
			wp_send_json_error( array( 'message' => $uploaded['error'] ) );
		}

		wp_send_json_success(
			array(
				'url'  => $uploaded['url'],
				'type' => $uploaded['type'],
				'name' => basename( $uploaded['file'] ),
			)
		);
	}

	/**
	 * Saves plugin settings from the React Settings page.
	 * Restricted to users who can manage options (not just agents).
	 *
	 * @return void
	 */
	public function save_settings() {
		$this->verify_nonce();

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'You do not have permission to do this.', 'captain-live-chat' ) ), 403 );
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- nonce already verified above.
		$raw = wp_unslash( $_POST );

		$saved = CAPTLC_Settings::save_settings( $raw );

		wp_send_json_success( array( 'settings' => $saved ) );
	}
}
