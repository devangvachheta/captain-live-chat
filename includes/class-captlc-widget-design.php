<?php
/**
 * Widget Designer — stores visual customisation settings for the frontend widget.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_Widget_Design
 */
class CAPTLC_Widget_Design {

	const OPTION_KEY = 'captlc_widget_design';

	/**
	 * Registers AJAX hooks.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_widget_design', array( $this, 'get_design' ) );
		add_action( 'wp_ajax_captlc_save_widget_design', array( $this, 'save_design' ) );
	}

	/**
	 * Returns current widget design settings.
	 *
	 * @return void
	 */
	public function get_design() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		wp_send_json_success( array( 'design' => self::get_settings() ) );
	}

	/**
	 * Saves widget design settings.
	 *
	 * @return void
	 */
	public function save_design() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$raw  = isset( $_POST['design'] ) ? wp_unslash( $_POST['design'] ) : '{}';
		$data = json_decode( $raw, true );

		if ( ! is_array( $data ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid data.', 'captain-live-chat' ) ) );
		}

		// Handle multi-widget save format
		if ( isset( $data['widgets'] ) && is_array( $data['widgets'] ) ) {
			$sanitized_widgets = array();
			foreach ( $data['widgets'] as $w ) {
				if ( ! is_array( $w ) ) {
					continue;
				}
				$sanitized_widgets[] = array(
					'id'                   => isset( $w['id'] ) ? sanitize_key( $w['id'] ) : '',
					'name'                 => isset( $w['name'] ) ? sanitize_text_field( $w['name'] ) : '',
					'active'               => ! empty( $w['active'] ),
					'accent_color'         => isset( $w['accent_color'] ) ? sanitize_hex_color( $w['accent_color'] ) : '#2f6ef0',
					'button_style'         => isset( $w['button_style'] ) ? sanitize_key( $w['button_style'] ) : 'bubble',
					'button_icon'          => isset( $w['button_icon'] ) ? sanitize_key( $w['button_icon'] ) : 'chat1',
					'position'             => isset( $w['position'] ) ? sanitize_key( $w['position'] ) : 'right',
					'widget_size'          => in_array( ( isset( $w['widget_size'] ) ? $w['widget_size'] : '' ), array( 'default', 'large' ), true ) ? $w['widget_size'] : 'default',
					'welcome_title'        => isset( $w['welcome_title'] ) ? sanitize_text_field( $w['welcome_title'] ) : '',
					'welcome_subtitle'     => isset( $w['welcome_subtitle'] ) ? sanitize_text_field( $w['welcome_subtitle'] ) : '',
					'welcome_message'      => isset( $w['welcome_message'] ) ? sanitize_text_field( $w['welcome_message'] ) : '',
					'show_avatar'          => isset( $w['show_avatar'] ) ? (bool) $w['show_avatar'] : true,
					'avatar_initials'      => isset( $w['avatar_initials'] ) ? sanitize_text_field( $w['avatar_initials'] ) : 'A',
					'avatar_bg_color'      => isset( $w['avatar_bg_color'] ) ? sanitize_hex_color( $w['avatar_bg_color'] ) : '#9ca3af',
					'avatar_image_url'     => isset( $w['avatar_image_url'] ) ? esc_url_raw( $w['avatar_image_url'] ) : '',
					'placeholder_text'     => isset( $w['placeholder_text'] ) ? sanitize_text_field( $w['placeholder_text'] ) : '',
					'visitor_bubble_color' => isset( $w['visitor_bubble_color'] ) ? sanitize_hex_color( $w['visitor_bubble_color'] ) : '#2f6ef0',
					'agent_bubble_color'   => isset( $w['agent_bubble_color'] ) ? sanitize_hex_color( $w['agent_bubble_color'] ) : '#f0f2f5',
					'template'             => isset( $w['template'] ) ? sanitize_key( $w['template'] ) : 'classic',
					'offline_message'      => isset( $w['offline_message'] ) ? sanitize_textarea_field( $w['offline_message'] ) : '',
					'poll_interval_ms'     => isset( $w['poll_interval_ms'] ) ? absint( $w['poll_interval_ms'] ) : 3000,
					'quick_replies'        => isset( $w['quick_replies'] ) && is_array( $w['quick_replies'] )
						? array_filter( array_map( 'sanitize_text_field', $w['quick_replies'] ) )
						: array(),
				);
			}

			$saved = array(
				'active_id' => isset( $data['active_id'] ) ? sanitize_key( $data['active_id'] ) : '',
				'widgets'   => $sanitized_widgets,
			);

			update_option( self::OPTION_KEY, $saved );
			wp_send_json_success( array( 'design' => $saved ) );
		}

		// Fallback to legacy single widget save
		$saved = array(
			'accent_color'         => isset( $data['accent_color'] ) ? sanitize_hex_color( $data['accent_color'] ) : '#2f6ef0',
			'button_style'         => isset( $data['button_style'] ) ? sanitize_key( $data['button_style'] ) : 'bubble',
			'button_icon'          => isset( $data['button_icon'] ) ? sanitize_key( $data['button_icon'] ) : 'chat1',
			'position'             => isset( $data['position'] ) ? sanitize_key( $data['position'] ) : 'right',
			'widget_size'          => in_array( ( isset( $data['widget_size'] ) ? $data['widget_size'] : '' ), array( 'default', 'large' ), true ) ? $data['widget_size'] : 'default',
			'welcome_title'        => isset( $data['welcome_title'] ) ? sanitize_text_field( $data['welcome_title'] ) : '',
			'welcome_subtitle'     => isset( $data['welcome_subtitle'] ) ? sanitize_text_field( $data['welcome_subtitle'] ) : '',
			'welcome_message'      => isset( $data['welcome_message'] ) ? sanitize_text_field( $data['welcome_message'] ) : '',
			'show_avatar'          => isset( $data['show_avatar'] ) ? (bool) $data['show_avatar'] : true,
			'avatar_initials'      => isset( $data['avatar_initials'] ) ? sanitize_text_field( $data['avatar_initials'] ) : 'A',
			'avatar_bg_color'      => isset( $data['avatar_bg_color'] ) ? sanitize_hex_color( $data['avatar_bg_color'] ) : '#9ca3af',
			'avatar_image_url'     => isset( $data['avatar_image_url'] ) ? esc_url_raw( $data['avatar_image_url'] ) : '',
			'placeholder_text'     => isset( $data['placeholder_text'] ) ? sanitize_text_field( $data['placeholder_text'] ) : '',
			'visitor_bubble_color' => isset( $data['visitor_bubble_color'] ) ? sanitize_hex_color( $data['visitor_bubble_color'] ) : '#2f6ef0',
			'agent_bubble_color'   => isset( $data['agent_bubble_color'] ) ? sanitize_hex_color( $data['agent_bubble_color'] ) : '#f0f2f5',
			'template'             => isset( $data['template'] ) ? sanitize_key( $data['template'] ) : 'classic',
		);

		update_option( self::OPTION_KEY, $saved );
		wp_send_json_success( array( 'design' => $saved ) );
	}

	/**
	 * Returns current design settings merged with defaults.
	 *
	 * @return array
	 */
	public static function get_settings() {
		$defaults = array(
			'accent_color'         => '#2f6ef0',
			'button_style'         => 'bubble',
			'button_icon'          => 'chat1',
			'position'             => 'right',
			'widget_size'          => 'default',
			'welcome_title'        => '👋 Our team is here for you',
			'welcome_subtitle'     => 'We typically reply in a few minutes.',
			'welcome_message'      => 'Hi, how can we help?',
			'show_avatar'          => true,
			'avatar_initials'      => 'A',
			'avatar_bg_color'      => '#9ca3af',
			'avatar_image_url'     => '',
			'placeholder_text'     => 'Write your message…',
			'visitor_bubble_color' => '#2f6ef0',
			'agent_bubble_color'   => '#f0f2f5',
			'template'             => 'classic',
			'offline_message'      => __( 'Leave your message. We\'ll reply soon.', 'captain-live-chat' ),
			'poll_interval_ms'     => 3000,
			'quick_replies'        => array( 'Pricing', 'Support', 'Get a Demo' ),
		);

		$saved = get_option( self::OPTION_KEY, array() );

		// If it's a list format, return the active widget's settings
		if ( isset( $saved['widgets'] ) && is_array( $saved['widgets'] ) ) {
			$active_id     = isset( $saved['active_id'] ) ? $saved['active_id'] : '';
			$active_widget = null;
			foreach ( $saved['widgets'] as $w ) {
				if ( $w['id'] === $active_id || ( empty( $active_id ) && ! empty( $w['active'] ) ) ) {
					$active_widget = $w;
					break;
				}
			}
			if ( ! $active_widget && ! empty( $saved['widgets'] ) ) {
				$active_widget = $saved['widgets'][0]; // Fallback to first widget
			}
			if ( $active_widget ) {
				return wp_parse_args( $active_widget, $defaults );
			}
		}

		// Fallback to legacy flat structure
		return wp_parse_args( $saved, $defaults );
	}

	/**
	 * Returns raw settings option array (wrapped as list if legacy flat structure).
	 *
	 * @return array
	 */
	public static function get_raw_option() {
		$saved = get_option( self::OPTION_KEY, array() );

		// If it's legacy flat structure, wrap it into a list format
		if ( ! isset( $saved['widgets'] ) ) {
			$flat_settings           = self::get_settings(); // merges defaults
			$flat_settings['id']     = 'widget-default';
			$flat_settings['name']   = 'Default Widget';
			$flat_settings['active'] = true;

			$saved = array(
				'active_id' => 'widget-default',
				'widgets'   => array( $flat_settings ),
			);
		}

		return $saved;
	}
}
