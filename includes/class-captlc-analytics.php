<?php
/**
 * Analytics — all stats queries for the Analytics Dashboard.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Analytics
 */
class CAPTLC_Analytics {

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_analytics', array( $this, 'get_analytics' ) );
	}

	/**
	 * Returns all analytics data in one call.
	 *
	 * @return void
	 */
	public function get_analytics() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$range = isset( $_POST['range'] ) ? sanitize_key( $_POST['range'] ) : 'week';
		if ( ! in_array( $range, array( 'week', 'month', 'year' ), true ) ) {
			$range = 'week';
		}

		wp_send_json_success(
			array(
				'totals'        => self::get_totals(),
				'hourly'        => self::get_hourly_distribution(),
				'agent_stats'   => self::get_agent_stats(),
				'status_ratio'  => self::get_status_ratio(),
				'response_time' => self::get_avg_response_time(),
				'trend'         => self::get_trend( $range ),
				'range'         => $range,
			)
		);
	}

	/**
	 * Returns chat counts for today, this week, and this month.
	 *
	 * @return array
	 */
	private static function get_totals() {
		global $wpdb;
		$t = CAPTLC_DB::threads_table();

		$today       = current_time( 'Y-m-d' );
		$week_start  = gmdate( 'Y-m-d', strtotime( 'monday this week', current_datetime()->getTimestamp() ) );
		$month_start = current_time( 'Y-m' ) . '-01';

		return array(
			'today' => (int) $wpdb->get_var(
				$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT COUNT(*) FROM {$t} WHERE DATE(created_at) = %s",
					$today
				)
			),
			'week'  => (int) $wpdb->get_var(
				$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT COUNT(*) FROM {$t} WHERE created_at >= %s",
					$week_start
				)
			),
			'month' => (int) $wpdb->get_var(
				$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT COUNT(*) FROM {$t} WHERE created_at >= %s",
					$month_start
				)
			),
			'total' => (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$t}" ), // phpcs:ignore
		);
	}

	/**
	 * Returns message count grouped by hour of day (0–23) for the last 30 days.
	 *
	 * @return array<int,int> hour => count
	 */
	private static function get_hourly_distribution() {
		global $wpdb;
		$m   = CAPTLC_DB::messages_table();
		$ago = gmdate( 'Y-m-d H:i:s', strtotime( '-30 days', current_datetime()->getTimestamp() ) );

		$rows = $wpdb->get_results(
			$wpdb->prepare(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT HOUR(created_at) AS h, COUNT(*) AS cnt FROM {$m} WHERE created_at >= %s GROUP BY h ORDER BY h ASC",
				$ago
			)
		);

		$result = array_fill( 0, 24, 0 );
		foreach ( $rows as $row ) {
			$result[ (int) $row->h ] = (int) $row->cnt;
		}

		return $result;
	}

	/**
	 * Returns per-agent reply counts for all time.
	 *
	 * @return array
	 */
	private static function get_agent_stats() {
		global $wpdb;
		$m = CAPTLC_DB::messages_table();

		$rows = $wpdb->get_results(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT sender_id, COUNT(*) AS replies FROM {$m} WHERE sender_type = 'agent' AND sender_id IS NOT NULL GROUP BY sender_id ORDER BY replies DESC LIMIT 10"
		);

		$result = array();
		foreach ( $rows as $row ) {
			$user     = get_userdata( $row->sender_id );
			$result[] = array(
				'name'    => $user ? $user->display_name : __( 'Unknown', 'captain-live-chat' ),
				'replies' => (int) $row->replies,
			);
		}

		return $result;
	}

	/**
	 * Returns count of open vs closed threads.
	 *
	 * @return array
	 */
	private static function get_status_ratio() {
		global $wpdb;
		$t = CAPTLC_DB::threads_table();

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results( "SELECT status, COUNT(*) AS cnt FROM {$t} GROUP BY status" );

		$result = array(
			'open'   => 0,
			'closed' => 0,
		);
		foreach ( $rows as $row ) {
			if ( isset( $result[ $row->status ] ) ) {
				$result[ $row->status ] = (int) $row->cnt;
			}
		}

		return $result;
	}

	/**
	 * Calculates average first-response time in seconds (agent's first reply - visitor's first message).
	 *
	 * @return int Seconds, or 0 if no data.
	 */
	private static function get_avg_response_time() {
		global $wpdb;
		$m   = CAPTLC_DB::messages_table();
		$t   = CAPTLC_DB::threads_table();
		$ago = gmdate( 'Y-m-d H:i:s', strtotime( '-30 days', current_datetime()->getTimestamp() ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$threads = $wpdb->get_col(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
				"SELECT id FROM {$t} WHERE created_at >= %s AND status = 'closed'",
				$ago
			)
		);

		if ( empty( $threads ) ) {
			return 0;
		}

		$diffs = array();
		foreach ( $threads as $tid ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$visitor_first = $wpdb->get_var(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
					"SELECT created_at FROM {$m} WHERE thread_id = %d AND sender_type = 'visitor' ORDER BY id ASC LIMIT 1",
					$tid
				)
			);
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$agent_first = $wpdb->get_var(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input; all bound values are still parameterised.
					"SELECT created_at FROM {$m} WHERE thread_id = %d AND sender_type = 'agent' ORDER BY id ASC LIMIT 1",
					$tid
				)
			);

			if ( $visitor_first && $agent_first ) {
				$diff = strtotime( $agent_first ) - strtotime( $visitor_first );
				if ( $diff > 0 && $diff < 86400 ) {
					$diffs[] = $diff;
				}
			}
		}

		return empty( $diffs ) ? 0 : (int) ( array_sum( $diffs ) / count( $diffs ) );
	}

	/**
	 * Returns chat volume over time for the requested range — used by the
	 * "Week / Month / Year" toggle on the Analytics page.
	 *
	 * @param string $range One of 'week' (7 days), 'month' (30 days), or 'year' (12 months).
	 * @return array label => count, oldest first.
	 */
	private static function get_trend( $range ) {
		global $wpdb;
		$t = CAPTLC_DB::threads_table();

		if ( 'year' === $range ) {
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
					"SELECT DATE_FORMAT(created_at, '%%Y-%%m') AS d, COUNT(*) AS cnt FROM {$t} WHERE created_at >= %s GROUP BY d ORDER BY d ASC",
					gmdate( 'Y-m-01', strtotime( '-11 months', current_datetime()->getTimestamp() ) )
				)
			);

			$result = array();
			$by_key = array();
			for ( $i = 11; $i >= 0; $i-- ) {
				$ts               = strtotime( "-{$i} months", current_datetime()->getTimestamp() );
				$key              = gmdate( 'Y-m', $ts );
				$result[ gmdate( 'M \'y', $ts ) ] = 0;
				$by_key[ $key ]   = gmdate( 'M \'y', $ts ); // phpcs:ignore Squiz.PHP.DisallowMultipleAssignments.Found
			}
			foreach ( $rows as $row ) {
				if ( isset( $by_key[ $row->d ] ) ) {
					$result[ $by_key[ $row->d ] ] = (int) $row->cnt;
				}
			}
			return $result;
		}

		$days = 'month' === $range ? 29 : 6;
		$ago  = gmdate( 'Y-m-d', strtotime( "-{$days} days", current_datetime()->getTimestamp() ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name comes from $wpdb->prefix, not user input.
				"SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM {$t} WHERE DATE(created_at) >= %s GROUP BY d ORDER BY d ASC",
				$ago
			)
		);

		$result = array();
		$by_key = array();
		for ( $i = $days; $i >= 0; $i-- ) {
			$ts       = strtotime( "-{$i} days", current_datetime()->getTimestamp() );
			$key      = gmdate( 'Y-m-d', $ts );
			$label    = gmdate( 'D j', $ts );
			$result[ $label ] = 0;
			$by_key[ $key ]   = $label;
		}
		foreach ( $rows as $row ) {
			if ( isset( $by_key[ $row->d ] ) ) {
				$result[ $by_key[ $row->d ] ] = (int) $row->cnt;
			}
		}

		return $result;
	}
}
