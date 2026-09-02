<?php
/**
 * AI Knowledge Base — lets admins feed extra context (documents, web pages)
 * to the AI auto-reply so it can answer questions specific to the site.
 *
 * @since      0.0.1
 *
 * @package    captain-live-chat
 * @subpackage captain-live-chat/includes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'CAPTLC_Knowledge' ) ) {

	/**
	 * Class CAPTLC_Knowledge
	 */
	class CAPTLC_Knowledge {

		/**
		 * Option key storing all knowledge base entries. Deliberately not
		 * autoloaded (see class-captlc-activator.php upgrade routine) since
		 * extracted document text can be sizeable and this isn't needed on
		 * every page load — only when building an AI reply.
		 */
		const OPTION_KEY = 'captlc_ai_knowledge';

		/**
		 * Max number of knowledge entries a site can store at once.
		 */
		const MAX_ENTRIES = 15;

		/**
		 * Max characters kept per entry after extraction — keeps the combined
		 * context small enough to stay within free-tier model context limits.
		 */
		const MAX_CHARS_PER_ENTRY = 6000;

		/**
		 * Max combined characters across all entries injected into a single
		 * AI request.
		 */
		const MAX_CONTEXT_CHARS = 8000;

		/**
		 * Constructor — registers AJAX hooks.
		 */
		public function __construct() {
			add_action( 'wp_ajax_captlc_get_knowledge', array( $this, 'get_knowledge' ) );
			add_action( 'wp_ajax_captlc_add_knowledge_url', array( $this, 'add_knowledge_url' ) );
			add_action( 'wp_ajax_captlc_upload_knowledge_file', array( $this, 'upload_knowledge_file' ) );
			add_action( 'wp_ajax_captlc_delete_knowledge', array( $this, 'delete_knowledge' ) );
		}

		/**
		 * Returns all saved entries (without the full extracted text, to
		 * keep the list response light — the AI prompt builder reads the
		 * option directly for full content).
		 *
		 * @return array
		 */
		private static function get_entries() {
			return (array) get_option( self::OPTION_KEY, array() );
		}

		/**
		 * Persists entries, explicitly keeping the option un-autoloaded.
		 *
		 * @param array $entries Entries to save.
		 * @return void
		 */
		private static function save_entries( $entries ) {
			update_option( self::OPTION_KEY, array_values( $entries ), false );
		}

		/**
		 * Returns the combined, capped knowledge context text ready to be
		 * appended to the AI system prompt. Empty string if nothing saved.
		 *
		 * @return string
		 */
		public static function get_context_text() {
			$entries = self::get_entries();

			if ( empty( $entries ) ) {
				return '';
			}

			$chunks = array();
			$total  = 0;

			foreach ( $entries as $entry ) {
				$text = isset( $entry['content'] ) ? $entry['content'] : '';
				if ( '' === $text ) {
					continue;
				}

				$remaining = self::MAX_CONTEXT_CHARS - $total;
				if ( $remaining <= 0 ) {
					break;
				}

				$piece    = mb_substr( $text, 0, $remaining );
				$chunks[] = '### ' . ( isset( $entry['title'] ) ? $entry['title'] : __( 'Untitled', 'captain-live-chat' ) ) . "\n" . $piece;
				$total   += mb_strlen( $piece );
			}

			if ( empty( $chunks ) ) {
				return '';
			}

			return "\n\n" . __( 'Reference material — use this to answer questions when relevant:', 'captain-live-chat' ) . "\n\n" . implode( "\n\n", $chunks );
		}

		/**
		 * Lists saved knowledge entries (metadata only, no full text).
		 *
		 * @return void
		 */
		public function get_knowledge() {
			check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
			}

			$entries = array_map(
				function ( $entry ) {
					return array(
						'id'         => $entry['id'],
						'type'       => $entry['type'],
						'title'      => $entry['title'],
						'source'     => $entry['source'],
						'char_count' => isset( $entry['content'] ) ? mb_strlen( $entry['content'] ) : 0,
						'created_at' => $entry['created_at'],
					);
				},
				self::get_entries()
			);

			wp_send_json_success( array( 'entries' => $entries ) );
		}

		/**
		 * Fetches a URL, strips it down to plain text, and saves it as a
		 * knowledge entry.
		 *
		 * @return void
		 */
		public function add_knowledge_url() {
			check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
			}

			$entries = self::get_entries();
			if ( count( $entries ) >= self::MAX_ENTRIES ) {
				wp_send_json_error( array( 'message' => __( 'Knowledge base is full. Delete a source before adding another.', 'captain-live-chat' ) ) );
			}

			$url = isset( $_POST['url'] ) ? esc_url_raw( wp_unslash( $_POST['url'] ) ) : '';

			if ( empty( $url ) || ! wp_http_validate_url( $url ) ) {
				wp_send_json_error( array( 'message' => __( 'Please enter a valid, publicly reachable URL.', 'captain-live-chat' ) ) );
			}

			$response = wp_safe_remote_get(
				$url,
				array(
					'timeout'     => 15,
					'redirection' => 3,
					'user-agent'  => 'Captain Live Chat/' . CAPTLC_VERSION,
				)
			);

			if ( is_wp_error( $response ) ) {
				wp_send_json_error( array( 'message' => __( 'Could not reach that URL.', 'captain-live-chat' ) ) );
			}

			$code = wp_remote_retrieve_response_code( $response );
			if ( $code < 200 || $code >= 300 ) {
				wp_send_json_error(
					array(
						/* translators: %d: HTTP status code returned by the remote server. */
						'message' => sprintf( __( 'The page returned an error (HTTP %d).', 'captain-live-chat' ), $code ),
					)
				);
			}

			$html = wp_remote_retrieve_body( $response );
			$text = self::html_to_text( $html );

			if ( '' === trim( $text ) ) {
				wp_send_json_error( array( 'message' => __( 'Could not extract any readable text from that page.', 'captain-live-chat' ) ) );
			}

			$title = self::extract_html_title( $html );
			$title = $title ? $title : wp_parse_url( $url, PHP_URL_HOST );

			$entry = array(
				'id'         => wp_generate_uuid4(),
				'type'       => 'url',
				'title'      => sanitize_text_field( $title ),
				'source'     => $url,
				'content'    => mb_substr( $text, 0, self::MAX_CHARS_PER_ENTRY ),
				'created_at' => current_time( 'mysql' ),
			);

			$entries[] = $entry;
			self::save_entries( $entries );

			unset( $entry['content'] );
			wp_send_json_success( array( 'entry' => $entry ) );
		}

		/**
		 * Accepts an uploaded .txt or .pdf file, extracts its text, and
		 * saves it as a knowledge entry.
		 *
		 * @return void
		 */
		public function upload_knowledge_file() {
			check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
			}

			$entries = self::get_entries();
			if ( count( $entries ) >= self::MAX_ENTRIES ) {
				wp_send_json_error( array( 'message' => __( 'Knowledge base is full. Delete a source before adding another.', 'captain-live-chat' ) ) );
			}

			if ( empty( $_FILES['captlc_knowledge_file'] ) ) {
				wp_send_json_error( array( 'message' => __( 'No file received.', 'captain-live-chat' ) ) );
			}

			$allowed_types = array(
				'text/plain'      => 'txt',
				'application/pdf' => 'pdf',
			);

			if ( ! function_exists( 'wp_check_filetype_and_ext' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			// Determine the file's REAL type from its bytes + extension
			// rather than trusting the browser-supplied `type` field, which
			// is client input and easily spoofed.
			$checked   = wp_check_filetype_and_ext(
				$_FILES['captlc_knowledge_file']['tmp_name'],
				$_FILES['captlc_knowledge_file']['name'],
				array(
					'txt' => 'text/plain',
					'pdf' => 'application/pdf',
				)
			);
			$file_type = $checked['type'];

			if ( ! isset( $allowed_types[ $file_type ] ) ) {
				wp_send_json_error( array( 'message' => __( 'Only .txt and .pdf files are supported right now.', 'captain-live-chat' ) ) );
			}

			$max_size = 8 * 1024 * 1024; // 8 MB.
			if ( isset( $_FILES['captlc_knowledge_file']['size'] ) && (int) $_FILES['captlc_knowledge_file']['size'] > $max_size ) {
				wp_send_json_error( array( 'message' => __( 'File too large. Maximum size is 8 MB.', 'captain-live-chat' ) ) );
			}

			if ( ! function_exists( 'wp_handle_upload' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$uploaded = wp_handle_upload( $_FILES['captlc_knowledge_file'], array( 'test_form' => false ) );

			if ( isset( $uploaded['error'] ) ) {
				wp_send_json_error( array( 'message' => $uploaded['error'] ) );
			}

			$extension = $allowed_types[ $file_type ];
			$raw_bytes = file_exists( $uploaded['file'] ) ? file_get_contents( $uploaded['file'] ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

			$text = 'pdf' === $extension
				? self::extract_pdf_text( $raw_bytes )
				: self::clean_whitespace( wp_check_invalid_utf8( $raw_bytes, true ) );

			// The uploaded copy only exists to extract text from — delete it,
			// we don't need to keep the original file around.
			if ( file_exists( $uploaded['file'] ) ) {
				wp_delete_file( $uploaded['file'] );
			}

			if ( '' === trim( (string) $text ) ) {
				wp_send_json_error(
					array(
						'message' => 'pdf' === $extension
							? __( 'Could not extract text from this PDF. Scanned/image-only PDFs aren\'t supported — try a text-based PDF or a .txt file.', 'captain-live-chat' )
							: __( 'This file appears to be empty.', 'captain-live-chat' ),
					)
				);
			}

			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- original filename is only used as a display title, never executed or used as a path.
			$original_name = isset( $_FILES['captlc_knowledge_file']['name'] ) ? sanitize_file_name( wp_unslash( $_FILES['captlc_knowledge_file']['name'] ) ) : __( 'Untitled document', 'captain-live-chat' );

			$entry = array(
				'id'         => wp_generate_uuid4(),
				'type'       => 'file',
				'title'      => $original_name,
				'source'     => $original_name,
				'content'    => mb_substr( $text, 0, self::MAX_CHARS_PER_ENTRY ),
				'created_at' => current_time( 'mysql' ),
			);

			$entries[] = $entry;
			self::save_entries( $entries );

			unset( $entry['content'] );
			wp_send_json_success( array( 'entry' => $entry ) );
		}

		/**
		 * Deletes a single knowledge entry by ID.
		 *
		 * @return void
		 */
		public function delete_knowledge() {
			check_ajax_referer( CAPTLC_Ajax::NONCE_ACTION, 'nonce' );

			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Permission denied.', 'captain-live-chat' ) ), 403 );
			}

			$id = isset( $_POST['id'] ) ? sanitize_text_field( wp_unslash( $_POST['id'] ) ) : '';
			if ( ! $id ) {
				wp_send_json_error( array( 'message' => __( 'Missing entry.', 'captain-live-chat' ) ) );
			}

			$entries = array_filter(
				self::get_entries(),
				function ( $entry ) use ( $id ) {
					return $entry['id'] !== $id;
				}
			);

			self::save_entries( $entries );

			wp_send_json_success();
		}

		/**
		 * Collapses an HTML document down to readable body text: strips
		 * script/style blocks, tags, then normalises whitespace.
		 *
		 * @param string $html Raw HTML.
		 * @return string
		 */
		private static function html_to_text( $html ) {
			$html = preg_replace( '#<(script|style|noscript|svg|nav|footer)\b[^>]*>.*?</\1>#is', ' ', $html );
			$html = preg_replace( '#<(br|/p|/div|/li|/h[1-6])\b[^>]*>#i', "\n", $html );
			$text = wp_strip_all_tags( $html, true );
			$text = html_entity_decode( $text, ENT_QUOTES, 'UTF-8' );

			return self::clean_whitespace( $text );
		}

		/**
		 * Collapses repeated blank lines/spaces produced by tag stripping.
		 *
		 * @param string $text Raw extracted text.
		 * @return string
		 */
		private static function clean_whitespace( $text ) {
			$text = (string) $text;
			$text = preg_replace( '/[ \t]+/', ' ', $text );
			$text = preg_replace( '/\n{3,}/', "\n\n", $text );

			return trim( $text );
		}

		/**
		 * Pulls the <title> out of an HTML document, if present.
		 *
		 * @param string $html Raw HTML.
		 * @return string
		 */
		private static function extract_html_title( $html ) {
			if ( preg_match( '#<title[^>]*>(.*?)</title>#is', $html, $m ) ) {
				return trim( html_entity_decode( wp_strip_all_tags( $m[1] ), ENT_QUOTES, 'UTF-8' ) );
			}
			return '';
		}

		/**
		 * Best-effort, dependency-free text extraction for PDF files.
		 *
		 * PDFs store page text inside content streams as show-text operators
		 * (Tj / TJ) between BT...ET markers, optionally Flate (zlib)
		 * compressed. This decompresses each stream and pulls the literal
		 * strings out of those operators.
		 *
		 * Works well for standard text-based PDFs (the vast majority of
		 * exported docs/articles). Scanned or image-only PDFs have no text
		 * layer and will correctly return an empty string.
		 *
		 * @param string $bytes Raw PDF file contents.
		 * @return string
		 */
		private static function extract_pdf_text( $bytes ) {
			if ( '' === (string) $bytes ) {
				return '';
			}

			$text = '';

			// Pull out every stream ... endstream block, decompress if needed,
			// and scan for BT...ET text-showing sections within each.
			if ( preg_match_all( '/stream\r?\n(.*?)endstream/s', $bytes, $streams ) ) {
				foreach ( $streams[1] as $stream ) {
					$decoded = @gzuncompress( $stream ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- many streams aren't Flate-compressed; failure just means we try the raw bytes instead.
					$chunk   = false !== $decoded ? $decoded : $stream;

					if ( ! preg_match( '/\bBT\b/', $chunk ) ) {
						continue;
					}

					$text .= self::extract_pdf_show_text_ops( $chunk ) . "\n";
				}
			}

			return self::clean_whitespace( $text );
		}

		/**
		 * Extracts the literal string operands of Tj / TJ (show text)
		 * operators from a single decoded PDF content stream.
		 *
		 * @param string $stream Decoded PDF content stream.
		 * @return string
		 */
		private static function extract_pdf_show_text_ops( $stream ) {
			$out = array();

			// Tj: (literal string) Tj
			if ( preg_match_all( '/\(((?:[^()\\\\]|\\\\.)*)\)\s*Tj/', $stream, $m ) ) {
				foreach ( $m[1] as $piece ) {
					$out[] = self::unescape_pdf_string( $piece );
				}
			}

			// TJ: [ (str) -120 (str2) ... ] TJ — array form, numbers are kerning and ignored.
			if ( preg_match_all( '/\[((?:[^\[\]]|\\\\.)*)\]\s*TJ/', $stream, $arrays ) ) {
				foreach ( $arrays[1] as $array_body ) {
					if ( preg_match_all( '/\(((?:[^()\\\\]|\\\\.)*)\)/', $array_body, $m2 ) ) {
						foreach ( $m2[1] as $piece ) {
							$out[] = self::unescape_pdf_string( $piece );
						}
					}
				}
			}

			return implode( ' ', $out );
		}

		/**
		 * Resolves PDF string escapes (\), \(, \n, octal escapes) into
		 * plain characters.
		 *
		 * @param string $str Raw PDF literal string contents.
		 * @return string
		 */
		private static function unescape_pdf_string( $str ) {
			$str = str_replace( array( '\\(', '\\)', '\\\\' ), array( '(', ')', '\\' ), $str );
			$str = preg_replace( '/\\\\n/', "\n", $str );
			$str = preg_replace( '/\\\\[0-9]{1,3}/', '', $str );

			return $str;
		}
	}
}
