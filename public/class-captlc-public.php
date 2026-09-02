<?php
/**
 * Frontend bootstrap: enqueues and renders the floating chat widget.
 *
 * @package captain-live-chat
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

		// Inline critical override — kills ANY theme reset.css color on the toggle button.
		// Using wp_add_inline_style for max specificity without an extra HTTP request.
		$inline_css = '
			.captlc-widget .captlc-widget__toggle,
			.captlc-widget .captlc-widget__toggle:hover,
			.captlc-widget .captlc-widget__toggle:focus,
			.captlc-widget .captlc-widget__toggle:active,
			.captlc-widget .captlc-widget__toggle:focus-visible {
				background-color: var(--captlcw-accent) !important;
				border: none !important;
				outline: none !important;
				color: #fff !important;
				border-radius: 50% !important;
				box-shadow: 0 8px 24px rgba(47,110,240,.35) !important;
			}
		';
		wp_add_inline_style( 'captlc-widget', $inline_css );

		wp_enqueue_script(
			'captlc-widget',
			CAPTLC_URL . 'assets/js/widget.js',
			array(),
			CAPTLC_VERSION,
			true
		);

		$settings      = CAPTLC_Settings::get_settings();
		$widget_design = class_exists( 'CAPTLC_Widget_Design' ) ? CAPTLC_Widget_Design::get_settings() : array();

		wp_localize_script(
			'captlc-widget',
			'captlcData',
			array(
				'ajaxUrl'        => admin_url( 'admin-ajax.php' ),
				'nonce'          => wp_create_nonce( CAPTLC_Ajax::NONCE_ACTION ),
				'pollInterval'   => absint( ! empty( $widget_design['poll_interval_ms'] ) ? $widget_design['poll_interval_ms'] : $settings['poll_interval_ms'] ),
				'widgetTitle'    => ! empty( $widget_design['welcome_title'] ) ? $widget_design['welcome_title'] : $settings['widget_title'],
				'offlineMessage' => ! empty( $widget_design['offline_message'] ) ? $widget_design['offline_message'] : $settings['offline_message'],
				'widgetDesign'   => $widget_design,
				'quickReplies'   => ! empty( $widget_design['quick_replies'] ) ? $widget_design['quick_replies'] : ( isset( $settings['quick_replies'] ) ? $settings['quick_replies'] : array() ),
				'i18n'           => array(
					'namePlaceholder'    => __( 'Your name', 'captain-live-chat' ),
					'emailPlaceholder'   => __( 'Your email (optional)', 'captain-live-chat' ),
					'messagePlaceholder' => ! empty( $widget_design['placeholder_text'] ) ? $widget_design['placeholder_text'] : __( 'Type your message…', 'captain-live-chat' ),
					'send'               => __( 'Send', 'captain-live-chat' ),
					'startChat'          => __( 'Start Chat', 'captain-live-chat' ),
					'online'             => __( 'Online', 'captain-live-chat' ),
					'offline'            => __( 'Offline', 'captain-live-chat' ),
					'typeMessage'        => ! empty( $widget_design['placeholder_text'] ) ? $widget_design['placeholder_text'] : __( 'Type a message…', 'captain-live-chat' ),
					'seen'               => __( 'Seen', 'captain-live-chat' ),
					'supportAgent'       => __( 'Support Agent', 'captain-live-chat' ),
					'openChat'           => __( 'Open chat', 'captain-live-chat' ),
					'closeChat'          => __( 'Close chat', 'captain-live-chat' ),
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

		$show_branding = class_exists( 'CAPTLC_Settings' ) ? ! empty( CAPTLC_Settings::get_settings()['show_branding'] ) : false;

		include CAPTLC_PATH . 'public/views/widget-container.php';
	}
}
