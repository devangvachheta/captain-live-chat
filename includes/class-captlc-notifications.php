<?php
/**
 * Handles outbound notifications (currently: email) for new visitor messages.
 * Browser notification + sound are handled client-side in JS using the
 * settings values this class' sibling (CAPTLC_Settings) exposes.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Notifications
 */
class CAPTLC_Notifications {

	/**
	 * How long to wait before sending another email for the same thread, in seconds.
	 * Prevents inbox flooding when a visitor sends several messages quickly.
	 *
	 * @var int
	 */
	const EMAIL_RATE_LIMIT = 300;

	/**
	 * Hooks the unanswered-message reminder check onto the plugin's existing
	 * 5-minute cron tick (registered by CAPTLC_Features), so no extra cron
	 * event needs to be scheduled.
	 */
	public function __construct() {
		add_action( 'captlc_schedule_tick', array( __CLASS__, 'maybe_send_reminders' ) );
	}

	/**
	 * Sends an email to all allowed agents if email notifications are enabled
	 * and this thread hasn't already triggered one recently.
	 *
	 * @param int    $thread_id    Thread ID.
	 * @param string $visitor_name Visitor's display name.
	 * @param string $message      Message text.
	 * @return void
	 */
	public static function maybe_notify_new_message( $thread_id, $visitor_name, $message ) {
		$settings = CAPTLC_Settings::get_settings();

		if ( empty( $settings['email_notif'] ) ) {
			return;
		}

		$rate_limit_key = 'captlc_email_sent_' . $thread_id;

		if ( get_transient( $rate_limit_key ) ) {
			return;
		}

		$recipients = self::get_agent_emails();

		if ( empty( $recipients ) ) {
			return;
		}

		$subject = sprintf(
			/* translators: %s: visitor name */
			__( 'New live chat message from %s', 'captain-live-chat' ),
			$visitor_name ? $visitor_name : __( 'a visitor', 'captain-live-chat' )
		);

		$body = sprintf(
			/* translators: 1: visitor name, 2: message text, 3: dashboard URL */
			__( "%1\$s says:\n\n%2\$s\n\nReply from your dashboard: %3\$s", 'captain-live-chat' ),
			$visitor_name ? $visitor_name : __( 'Visitor', 'captain-live-chat' ),
			$message,
			admin_url( 'admin.php?page=captain-live-chat' )
		);

		wp_mail( $recipients, $subject, $body );

		set_transient( $rate_limit_key, 1, self::EMAIL_RATE_LIMIT );
	}

	/**
	 * Checks for threads whose last visitor message has gone unreplied for
	 * longer than the configured delay, and emails agents a reminder with
	 * the pending message(s) so they can follow up. Runs on the plugin's
	 * 5-minute cron tick.
	 *
	 * @return void
	 */
	public static function maybe_send_reminders() {
		$settings = CAPTLC_Settings::get_settings();

		if ( empty( $settings['reminder_email_enabled'] ) ) {
			return;
		}

		$delay_hours = ! empty( $settings['reminder_delay_hours'] ) ? (int) $settings['reminder_delay_hours'] : 4;
		$cutoff      = gmdate( 'Y-m-d H:i:s', time() - ( $delay_hours * HOUR_IN_SECONDS ) );

		$threads = CAPTLC_DB::get_threads_needing_reminder( $cutoff );

		if ( empty( $threads ) ) {
			return;
		}

		$recipients = self::get_agent_emails();

		if ( empty( $recipients ) ) {
			return;
		}

		foreach ( $threads as $thread ) {
			self::send_reminder_email( $thread, $recipients );
			CAPTLC_DB::mark_reminder_sent( $thread->thread_id );
		}
	}

	/**
	 * Builds and sends a single reminder email for one thread's pending
	 * (unreplied) visitor messages.
	 *
	 * @param object $thread     Row from CAPTLC_DB::get_threads_needing_reminder().
	 * @param array  $recipients Agent email addresses.
	 * @return void
	 */
	private static function send_reminder_email( $thread, $recipients ) {
		$messages = CAPTLC_DB::get_unreplied_visitor_messages( $thread->thread_id );

		if ( empty( $messages ) ) {
			return;
		}

		$visitor_label = $thread->visitor_name ? $thread->visitor_name : __( 'A visitor', 'captain-live-chat' );

		$subject = sprintf(
			/* translators: %s: visitor name */
			__( 'Reminder: %s is still waiting for a reply', 'captain-live-chat' ),
			$visitor_label
		);

		$transcript = '';
		foreach ( $messages as $message ) {
			$transcript .= sprintf(
				"[%s] %s\n",
				mysql2date( 'M j, g:i a', $message->created_at ),
				$message->message
			);
		}

		$body = sprintf(
			/* translators: 1: visitor name, 2: message transcript, 3: dashboard URL */
			__( "%1\$s has been waiting for a reply:\n\n%2\$s\nReply from your dashboard: %3\$s", 'captain-live-chat' ),
			$visitor_label,
			$transcript,
			admin_url( 'admin.php?page=captain-live-chat&thread=' . $thread->thread_id )
		);

		wp_mail( $recipients, $subject, $body );
	}

	/**
	 * Collects unique email addresses for every user allowed to act as an agent.
	 * Falls back to the site admin email if no agents are configured yet.
	 *
	 * @return array<int,string>
	 */
	private static function get_agent_emails() {
		$settings = CAPTLC_Settings::get_settings();
		$emails   = array();

		$users = get_users(
			array(
				'fields' => array( 'ID', 'user_email' ),
			)
		);

		foreach ( $users as $user ) {
			if ( CAPTLC_Roles::can_reply( $user->ID ) ) {
				$emails[] = $user->user_email;
			}
		}

		$emails = array_unique( array_filter( $emails ) );

		if ( empty( $emails ) ) {
			$emails[] = get_option( 'admin_email' );
		}

		return $emails;
	}
}
