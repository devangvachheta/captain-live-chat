<?php
/**
 * Frontend widget markup — floating button + chat panel.
 * All dynamic strings are injected via wp_localize_script (captlcData),
 * this file only outputs the static skeleton.
 *
 * @package Captain_Live_Chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="captlc-widget" class="captlc-widget" data-state="closed">

	<button type="button" id="captlc-widget-toggle" class="captlc-widget__toggle" aria-label="<?php esc_attr_e( 'Open chat', 'captain-live-chat' ); ?>">
		<svg class="captlc-widget__icon captlc-widget__icon--chat" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M4 4h16v12H8l-4 4V4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
		</svg>
		<svg class="captlc-widget__icon captlc-widget__icon--close" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	</button>

	<div class="captlc-widget__panel" id="captlc-widget-panel">

		<div class="captlc-widget__header">
			<span class="captlc-widget__header-title" id="captlc-widget-title"></span>
			<span class="captlc-widget__status">
				<span class="captlc-widget__status-dot" id="captlc-widget-status-dot"></span>
				<span id="captlc-widget-status-text"></span>
			</span>
		</div>

		<!-- Pre-chat form -->
		<form id="captlc-prechat-form" class="captlc-widget__prechat">
			<input type="text" id="captlc-input-name" class="captlc-widget__input" required />
			<input type="email" id="captlc-input-email" class="captlc-widget__input" />
			<textarea id="captlc-input-message" class="captlc-widget__textarea" rows="3" required></textarea>
			<button type="submit" class="captlc-widget__send-btn" id="captlc-prechat-submit"></button>
		</form>

		<!-- Active conversation -->
		<div class="captlc-widget__thread" id="captlc-widget-thread" hidden>
			<div class="captlc-widget__messages" id="captlc-widget-messages"></div>

			<div class="captlc-widget__typing" id="captlc-widget-typing" hidden>
				<span class="captlc-typing-dots"><span></span><span></span><span></span></span>
			</div>

			<div class="captlc-widget__seen" id="captlc-widget-seen" hidden></div>

			<div class="captlc-widget__closed-notice" id="captlc-widget-closed-notice" hidden></div>

			<form id="captlc-reply-form" class="captlc-widget__reply-form">
				<button type="button" id="captlc-widget-emoji-btn" class="captlc-widget__action-btn" aria-label="<?php esc_attr_e( 'Emoji', 'captain-live-chat' ); ?>" title="<?php esc_attr_e( 'Emoji', 'captain-live-chat' ); ?>">
					😊
				</button>

				<button type="button" id="captlc-widget-attach-btn" class="captlc-widget__action-btn" aria-label="<?php esc_attr_e( 'Attach file', 'captain-live-chat' ); ?>" title="<?php esc_attr_e( 'Attach file', 'captain-live-chat' ); ?>">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
						<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
					</svg>
				</button>

				<input
					type="file"
					id="captlc-widget-attach-input"
					accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
					style="position:absolute;opacity:0;width:0;height:0;pointer-events:none;"
					aria-hidden="true"
				/>

				<input type="text" id="captlc-reply-input" class="captlc-widget__reply-input" autocomplete="off" />
				<button type="submit" class="captlc-widget__reply-send" aria-label="<?php esc_attr_e( 'Send', 'captain-live-chat' ); ?>">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
						<path d="M4 12l16-8-6 8 6 8-16-8z" fill="currentColor"/>
					</svg>
				</button>
			</form>
		</div>

	</div>
</div>
