<?php
/**
 * Chat Tags, Internal Notes and Agent Schedule — combined feature class.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Features
 *
 * Handles: chat tags, internal notes per thread, agent availability schedule.
 */
class CAPTLC_Features {

	const SCHEDULE_OPTION = 'captlc_agent_schedule';

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		// Tags.
		add_action( 'wp_ajax_captlc_get_tags',    array( $this, 'get_tags' ) );
		add_action( 'wp_ajax_captlc_save_tags',   array( $this, 'save_tags' ) );

		// Internal notes.
		add_action( 'wp_ajax_captlc_get_notes',   array( $this, 'get_notes' ) );
		add_action( 'wp_ajax_captlc_add_note',    array( $this, 'add_note' ) );
		add_action( 'wp_ajax_captlc_delete_note', array( $this, 'delete_note' ) );

		// Agent schedule.
		add_action( 'wp_ajax_captlc_get_schedule',  array( $this, 'get_schedule' ) );
		add_action( 'wp_ajax_captlc_save_schedule', array( $this, 'save_schedule' ) );

		// Register the custom cron interval as early as possible, but the
		// filter itself is harmless before init — it's *scheduling* an event
		// (wp_schedule_event) that must wait until init, since that call
		// fires the 'cron_schedules' filter and can trigger other plugins'
		// (e.g. WooCommerce) translation-loading code too early.
		add_filter( 'cron_schedules', array( $this, 'add_cron_interval' ) );

		add_action( 'captlc_schedule_tick', array( $this, 'apply_schedule' ) );
		add_action( 'init', array( $this, 'maybe_schedule_cron' ) );
	}

	/**
	 * Schedules the recurring cron event, if not already scheduled.
	 * Must run on 'init' or later — scheduling triggers the 'cron_schedules'
	 * filter, which other plugins (e.g. WooCommerce) hook into with code
	 * that isn't safe to run before 'init'.
	 *
	 * @return void
	 */
	public function maybe_schedule_cron() {
		if ( ! wp_next_scheduled( 'captlc_schedule_tick' ) ) {
			wp_schedule_event( time(), 'captlc_5min', 'captlc_schedule_tick' );
		}
	}

	/**
	 * Adds a 5-minute cron interval.
	 *
	 * @param array $schedules Existing schedules.
	 * @return array
	 */
	public function add_cron_interval( $schedules ) {
		$schedules['captlc_5min'] = array(
			'interval' => 300,
			'display'  => __( 'Every 5 minutes', 'captain-live-chat' ),
		);
		return $schedules;
	}

	// ── Tags ─────────────────────────────────────────────────────────────

	/**
	 * Returns tags for a thread.
	 *
	 * @return void
	 */
	public function get_tags() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$tags      = (array) get_post_meta( 0, '' ); // unused, using options.

		$all_tags  = (array) get_option( 'captlc_tags', array() );
		$thread_tags = (array) get_option( 'captlc_thread_tags_' . $thread_id, array() );

		wp_send_json_success( array( 'all_tags' => $all_tags, 'thread_tags' => $thread_tags ) );
	}

	/**
	 * Saves tags for a thread (and adds any new global tags).
	 *
	 * @return void
	 */
	public function save_tags() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$raw_tags  = isset( $_POST['tags'] ) ? sanitize_text_field( wp_unslash( $_POST['tags'] ) ) : '';

		$tags = array_filter( array_map( 'sanitize_text_field', explode( ',', $raw_tags ) ) );
		$tags = array_values( array_unique( $tags ) );

		// Save tags on thread.
		update_option( 'captlc_thread_tags_' . $thread_id, $tags );

		// Merge into global tag library.
		$all_tags = (array) get_option( 'captlc_tags', array() );
		$all_tags = array_values( array_unique( array_merge( $all_tags, $tags ) ) );
		update_option( 'captlc_tags', $all_tags );

		wp_send_json_success( array( 'tags' => $tags ) );
	}

	// ── Internal Notes ────────────────────────────────────────────────────

	/**
	 * Returns internal notes for a thread.
	 *
	 * @return void
	 */
	public function get_notes() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$notes     = (array) get_option( 'captlc_notes_' . $thread_id, array() );

		wp_send_json_success( array( 'notes' => $notes ) );
	}

	/**
	 * Adds an internal note to a thread.
	 *
	 * @return void
	 */
	public function add_note() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$text      = isset( $_POST['note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['note'] ) ) : '';

		if ( ! $thread_id || ! $text ) {
			wp_send_json_error( array( 'message' => __( 'Missing thread or note text.', 'captain-live-chat' ) ) );
		}

		$user  = wp_get_current_user();
		$notes = (array) get_option( 'captlc_notes_' . $thread_id, array() );

		$note = array(
			'id'         => uniqid( 'note_', true ),
			'text'       => $text,
			'agent_name' => $user->display_name,
			'created_at' => current_time( 'mysql' ),
		);

		$notes[] = $note;
		update_option( 'captlc_notes_' . $thread_id, $notes );

		wp_send_json_success( array( 'note' => $note ) );
	}

	/**
	 * Deletes an internal note by ID.
	 *
	 * @return void
	 */
	public function delete_note() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );
		$this->require_agent();

		$thread_id = isset( $_POST['thread_id'] ) ? absint( $_POST['thread_id'] ) : 0;
		$note_id   = isset( $_POST['note_id'] )   ? sanitize_text_field( wp_unslash( $_POST['note_id'] ) ) : '';

		$notes = (array) get_option( 'captlc_notes_' . $thread_id, array() );
		$notes = array_values( array_filter( $notes, fn( $n ) => $n['id'] !== $note_id ) );

		update_option( 'captlc_notes_' . $thread_id, $notes );

		wp_send_json_success();
	}

	// ── Agent Schedule ────────────────────────────────────────────────────

	/**
	 * Returns current schedule.
	 *
	 * @return void
	 */
	public function get_schedule() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( null, 403 );
		}

		wp_send_json_success( array( 'schedule' => self::get_saved_schedule() ) );
	}

	/**
	 * Saves agent availability schedule.
	 *
	 * @return void
	 */
	public function save_schedule() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( null, 403 );
		}

		$raw = isset( $_POST['schedule'] ) ? wp_unslash( $_POST['schedule'] ) : '{}';
		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'captain-live-chat' ) ) );
		}

		$days_of_week = array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' );
		$saved        = array(
			'enabled'  => ! empty( $data['enabled'] ),
			'timezone' => isset( $data['timezone'] ) ? sanitize_text_field( $data['timezone'] ) : wp_timezone_string(),
			'days'     => array(),
		);

		foreach ( $days_of_week as $day ) {
			$day_data = $data['days'][ $day ] ?? array();
			$saved['days'][ $day ] = array(
				'active' => ! empty( $day_data['active'] ),
				'from'   => isset( $day_data['from'] ) ? sanitize_text_field( $day_data['from'] ) : '09:00',
				'to'     => isset( $day_data['to'] )   ? sanitize_text_field( $day_data['to'] )   : '18:00',
			);
		}

		update_option( self::SCHEDULE_OPTION, $saved );
		$this->apply_schedule();

		wp_send_json_success( array( 'schedule' => $saved ) );
	}

	/**
	 * Returns saved schedule (or default Mon–Fri 9–18).
	 *
	 * @return array
	 */
	public static function get_saved_schedule() {
		$defaults = array(
			'enabled'  => false,
			'timezone' => wp_timezone_string(),
			'days'     => array(
				'monday'    => array( 'active' => true,  'from' => '09:00', 'to' => '18:00' ),
				'tuesday'   => array( 'active' => true,  'from' => '09:00', 'to' => '18:00' ),
				'wednesday' => array( 'active' => true,  'from' => '09:00', 'to' => '18:00' ),
				'thursday'  => array( 'active' => true,  'from' => '09:00', 'to' => '18:00' ),
				'friday'    => array( 'active' => true,  'from' => '09:00', 'to' => '18:00' ),
				'saturday'  => array( 'active' => false, 'from' => '09:00', 'to' => '18:00' ),
				'sunday'    => array( 'active' => false, 'from' => '09:00', 'to' => '18:00' ),
			),
		);

		return wp_parse_args( (array) get_option( self::SCHEDULE_OPTION, array() ), $defaults );
	}

	/**
	 * Applies the schedule: sets all allowed-agent rows in captlc_agents to online/offline.
	 *
	 * @return void
	 */
	public function apply_schedule() {
		$schedule = self::get_saved_schedule();

		if ( empty( $schedule['enabled'] ) ) {
			return;
		}

		try {
			$tz  = new DateTimeZone( $schedule['timezone'] ?: wp_timezone_string() );
			$now = new DateTime( 'now', $tz );
		} catch ( Exception $e ) {
			$now = new DateTime( 'now' );
		}

		$day_name  = strtolower( $now->format( 'l' ) );
		$time_now  = $now->format( 'H:i' );
		$day_cfg   = $schedule['days'][ $day_name ] ?? array( 'active' => false );

		$is_online = $day_cfg['active']
			&& isset( $day_cfg['from'], $day_cfg['to'] )
			&& $time_now >= $day_cfg['from']
			&& $time_now <= $day_cfg['to'];

		// Get all allowed agents and update their status.
		$users = get_users( array( 'fields' => array( 'ID' ) ) );
		foreach ( $users as $user ) {
			if ( CAPTLC_Roles::can_reply( $user->ID ) ) {
				CAPTLC_DB::set_agent_status( $user->ID, $is_online );
			}
		}
	}

	/**
	 * Permission guard for agent-only endpoints.
	 *
	 * @return void
	 */
	private function require_agent() {
		if ( ! is_user_logged_in() || ! CAPTLC_Roles::can_reply( get_current_user_id() ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}
	}
}
