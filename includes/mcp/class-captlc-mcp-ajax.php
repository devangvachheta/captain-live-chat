<?php
/**
 * MCP — AJAX endpoints that back the Settings → MCP React page: list every
 * registered ability with its current on/off state, and save toggle
 * changes. Kept in its own file inside includes/mcp/ rather than the
 * plugin's main AJAX class, so the MCP feature stays self-contained.
 *
 * @package captain-live-chat
 * @subpackage captain-live-chat/includes/mcp
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class CAPTLC_MCP_Ajax
 */
class CAPTLC_MCP_Ajax {

	/**
	 * Registers the AJAX hooks. Admin-only actions — no _nopriv variant,
	 * matching the "every MCP ability requires manage_options" decision.
	 *
	 * @return void
	 */
	public function __construct() {
		add_action( 'wp_ajax_captlc_get_mcp_settings', array( $this, 'get_mcp_settings' ) );
		add_action( 'wp_ajax_captlc_save_mcp_settings', array( $this, 'save_mcp_settings' ) );
	}

	/**
	 * Returns the master switch state plus every registered captlc/*
	 * ability with its label, description, category, read-only/
	 * destructive annotations, and current enabled state — everything
	 * the Settings → MCP page needs to render its toggle list.
	 *
	 * @return void
	 */
	public function get_mcp_settings() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		$available = CAPTLC_MCP::is_available();
		$abilities = array();

		if ( $available && function_exists( 'wp_get_abilities' ) ) {
			foreach ( wp_get_abilities() as $ability ) {
				$name = $ability->get_name();
				if ( 0 !== strpos( $name, 'captlc/' ) ) {
					continue;
				}

				$annotations = (array) $ability->get_meta_item( 'annotations' );
				$readonly    = ! empty( $annotations['readonly'] );

				$abilities[] = array(
					'name'        => $name,
					'label'       => $ability->get_label(),
					'description' => $ability->get_description(),
					'category'    => $ability->get_category(),
					'readonly'    => $readonly,
					'destructive' => ! empty( $annotations['destructive'] ),
					'enabled'     => CAPTLC_MCP_Settings::is_ability_enabled( $name, $readonly ),
				);
			}
		}

		wp_send_json_success(
			array(
				'available' => $available,
				'enabled'   => CAPTLC_MCP_Settings::is_master_enabled(),
				'abilities' => $abilities,
			)
		);
	}

	/**
	 * Saves the master switch state and/or a set of per-ability toggles.
	 *
	 * @return void
	 */
	public function save_mcp_settings() {
		check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
		}

		if ( isset( $_POST['enabled'] ) ) {
			CAPTLC_MCP_Settings::set_master_enabled( 'true' === wp_unslash( $_POST['enabled'] ) || '1' === wp_unslash( $_POST['enabled'] ) );
		}

		if ( isset( $_POST['ability_name'], $_POST['ability_enabled'] ) ) {
			$ability_name = sanitize_text_field( wp_unslash( $_POST['ability_name'] ) );
			$enabled      = 'true' === wp_unslash( $_POST['ability_enabled'] ) || '1' === wp_unslash( $_POST['ability_enabled'] );

			if ( 0 === strpos( $ability_name, 'captlc/' ) ) {
				CAPTLC_MCP_Settings::set_ability_enabled( $ability_name, $enabled );
			}
		}

		wp_send_json_success();
	}
}
