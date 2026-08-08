<?php
/**
 * Frontend bootstrap: enqueues and renders the floating chat widget.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Public
 */
class CAPTLC_Public {

	/**
	 * Constructor — registers hooks.
	 */
	public function __construct() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'wp_footer', array( $this, 'render_widget' ) );
	}

	/**
	 * Enqueues widget CSS/JS on the public site.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		wp_enqueue_style(
			'captlc-widget',
			CAPTLC_URL . 'assets/css/widget.css',
			array(),
			CAPTLC_VERSION
		);

		wp_enqueue_script(
			'captlc-widget',
			CAPTLC_URL . 'assets/js/widget.js',
			array(),
			CAPTLC_VERSION,
			true
		);

		$settings = CAPTLC_Settings::get_settings();

		wp_localize_script(
			'captlc-widget',
			'captlcData',
			array(
				'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
				'nonce'          => wp_create_nonce( CAPTLC_Ajax::NONCE_ACTION ),
				'pollInterval'   => absint( $settings['poll_interval_ms'] ),
				'widgetTitle'    => $settings['widget_title'],
				'offlineMessage' => $settings['offline_message'],
				'i18n'           => array(
					'namePlaceholder'    => __( 'Your name', 'captain-live-chat' ),
					'emailPlaceholder'   => __( 'Your email (optional)', 'captain-live-chat' ),
					'messagePlaceholder' => __( 'Type your message…', 'captain-live-chat' ),
					'send'               => __( 'Send', 'captain-live-chat' ),
					'startChat'          => __( 'Start Chat', 'captain-live-chat' ),
					'online'             => __( 'Online', 'captain-live-chat' ),
					'offline'            => __( 'Offline', 'captain-live-chat' ),
					'typeMessage'        => __( 'Type a message…', 'captain-live-chat' ),
					'seen'               => __( 'Seen', 'captain-live-chat' ),
				),
			)
		);
	}

	/**
	 * Outputs the widget container markup in the site footer.
	 *
	 * @return void
	 */
	public function render_widget() {
		if ( is_admin() ) {
			return;
		}

		include CAPTLC_PATH . 'public/views/widget-container.php';
	}
}
