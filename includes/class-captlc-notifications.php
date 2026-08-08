<?php
/**
 * Handles outbound notifications (currently: email) for new visitor messages.
 * Browser notification + sound are handled client-side in JS using the
 * settings values this class' sibling (CAPTLC_Settings) exposes.
 *
 * @package Captain_Live_Chat
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
