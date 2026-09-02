<?php
/**
 * Frontend widget markup — floating button + chat panel.
 * All dynamic strings are injected via wp_localize_script (captlcData),
 * this file only outputs the static skeleton.
 *
 * @package captain-live-chat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="captlc-widget" class="captlc-widget" data-state="closed">

	<button type="button" id="captlc-widget-toggle" class="captlc-widget__toggle" aria-label="<?php esc_attr_e( 'Open chat', 'captain-live-chat' ); ?>" aria-expanded="false" aria-controls="captlc-widget-panel" style="background:var(--captlcw-accent);border:none;outline:none;box-shadow:0 8px 24px rgba(47,110,240,0.35);border-radius:50%;color:#fff;">
		<span class="captlc-widget__toggle-icon-wrap" id="captlc-toggle-icon-chat" data-icon="chat1" aria-hidden="true">
			<svg class="captlc-widget__icon captlc-widget__icon--chat1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
			</svg>
			<svg class="captlc-widget__icon captlc-widget__icon--chat2" viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
			</svg>
			<svg class="captlc-widget__icon captlc-widget__icon--chat3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l4.94-1.38A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
				<path d="M8 11h8M8 15h5" stroke-linecap="round"/>
			</svg>
			<svg class="captlc-widget__icon captlc-widget__icon--chat4" viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/>
			</svg>
		</span>
		<svg class="captlc-widget__icon captlc-widget__icon--close" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
		</svg>
	</button>

	<div class="captlc-widget__panel" id="captlc-widget-panel" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e( 'Live chat', 'captain-live-chat' ); ?>" aria-hidden="true">

		<!-- SCREEN 1: Welcome Screen -->
		<div class="captlc-widget__screen is-active" id="captlc-screen-welcome">
			<div class="captlc-widget__header captlc-widget__header--welcome" style="background:var(--captlcw-accent);">
				<h2 id="captlc-welcome-title"></h2>
				<p id="captlc-welcome-subtitle"></p>
			</div>
			
			<div class="captlc-widget__welcome-body">
				<div id="captlc-welcome-agent-card" class="captlc-widget__welcome-agent-card">
					<div class="captlc-widget__welcome-avatar" id="captlc-welcome-avatar"></div>
					<div class="captlc-widget__welcome-agent-info">
						<span class="captlc-widget__welcome-status-badge">
							<span class="captlc-widget__welcome-status-dot"></span>
							<span id="captlc-welcome-status-label">ONLINE</span>
						</span>
						<p id="captlc-welcome-message"></p>
					</div>
				</div>
				
				<!-- Action Buttons -->
				<button type="button" id="captlc-btn-start-chat" class="captlc-widget__large-btn" style="background:var(--captlcw-accent);">
					<span><?php esc_html_e( 'Start a new chat', 'captain-live-chat' ); ?></span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
				</button>
				
				<button type="button" id="captlc-btn-resume-chat" class="captlc-widget__large-btn" style="background:var(--captlcw-accent); display:none;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" style="transform:scaleX(-1);"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
					<span><?php esc_html_e( 'Return to Conversation', 'captain-live-chat' ); ?></span>
				</button>
			</div>
			
			<!-- Bottom Tabs Menu (Chatway Style) -->
			<div class="captlc-widget__footer-tabs">
				<button type="button" class="captlc-widget__footer-tab is-active" data-tab="chat" aria-pressed="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
					</svg>
					<span><?php esc_html_e( 'Chat', 'captain-live-chat' ); ?></span>
				</button>
				<button type="button" class="captlc-widget__footer-tab" data-tab="faq" aria-pressed="false">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
						<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
					<span><?php esc_html_e( 'FAQ', 'captain-live-chat' ); ?></span>
				</button>
			</div>

			<?php if ( ! empty( $show_branding ) ) : ?>
			<div class="captlc-widget__branding">
				<?php esc_html_e( 'Powered by', 'captain-live-chat' ); ?> <span style="font-weight:700;">Captain Live Chat</span>
			</div>
			<?php endif; ?>
		</div>

		<!-- SCREEN 2: Pre-chat Form -->
		<div class="captlc-widget__screen" id="captlc-screen-prechat" style="display:none;">
			<div class="captlc-widget__header captlc-widget__header--sub" style="background:var(--captlcw-accent);">
			<button type="button" class="captlc-widget__back-btn" id="captlc-prechat-back" aria-label="<?php esc_attr_e( 'Back', 'captain-live-chat' ); ?>">←</button>
				<span class="captlc-widget__header-title"><?php esc_html_e( 'Start Chat', 'captain-live-chat' ); ?></span>
				<button type="button" class="captlc-widget__panel-close" aria-label="<?php esc_attr_e( 'Close chat', 'captain-live-chat' ); ?>">✕</button>
			</div>
			
			<form id="captlc-prechat-form" class="captlc-widget__prechat">
				<input type="text" id="captlc-input-name" class="captlc-widget__input" aria-label="<?php esc_attr_e( 'Your name', 'captain-live-chat' ); ?>" required />
				<input type="email" id="captlc-input-email" class="captlc-widget__input" aria-label="<?php esc_attr_e( 'Your email (optional)', 'captain-live-chat' ); ?>" />
				<textarea id="captlc-input-message" class="captlc-widget__textarea" aria-label="<?php esc_attr_e( 'Your message', 'captain-live-chat' ); ?>" rows="3" required></textarea>
				<button type="submit" class="captlc-widget__send-btn" id="captlc-prechat-submit" style="background:var(--captlcw-accent);"></button>
			</form>

			<?php if ( ! empty( $show_branding ) ) : ?>
			<div class="captlc-widget__branding">
				<?php esc_html_e( 'Powered by', 'captain-live-chat' ); ?> <span style="font-weight:700;">Captain Live Chat</span>
			</div>
			<?php endif; ?>
		</div>

		<!-- SCREEN 3: Active Chat conversation -->
		<div class="captlc-widget__screen" id="captlc-screen-chat" style="display:none;">
			<div class="captlc-widget__header captlc-widget__header--agent" style="background:var(--captlcw-accent);">
				<button type="button" class="captlc-widget__back-btn" id="captlc-chat-back" aria-label="<?php esc_attr_e( 'Back', 'captain-live-chat' ); ?>">←</button>
				<div class="captlc-widget__header-agent-avatar" id="captlc-chat-header-avatar"></div>
				<div class="captlc-widget__header-agent-meta">
					<span class="captlc-widget__header-agent-name" id="captlc-chat-agent-name"></span>
					<span class="captlc-widget__header-agent-status">
						<span class="captlc-widget__status-dot" id="captlc-widget-status-dot"></span>
						<span id="captlc-widget-status-text"></span>
					</span>
				</div>
				<button type="button" class="captlc-widget__panel-close" aria-label="<?php esc_attr_e( 'Close chat', 'captain-live-chat' ); ?>">✕</button>
			</div>

			<div class="captlc-widget__thread" id="captlc-widget-thread">
				<div class="captlc-widget__messages" id="captlc-widget-messages" role="log" aria-live="polite" aria-relevant="additions"></div>

				<div class="captlc-widget__typing" id="captlc-widget-typing" hidden role="status" aria-live="polite">
					<span class="captlc-typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
					<span class="captlc-sr-only"><?php esc_html_e( 'Typing…', 'captain-live-chat' ); ?></span>
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

					<input type="text" id="captlc-reply-input" class="captlc-widget__reply-input" aria-label="<?php esc_attr_e( 'Write your message', 'captain-live-chat' ); ?>" autocomplete="off" />
					<button type="submit" class="captlc-widget__reply-send" aria-label="<?php esc_attr_e( 'Send', 'captain-live-chat' ); ?>" style="background:var(--captlcw-accent);">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
							<path d="M4 12l16-8-6 8 6 8-16-8z" fill="currentColor"/>
						</svg>
					</button>
				</form>
			</div>
		</div>

		<!-- SCREEN 4: FAQ -->
		<div class="captlc-widget__screen" id="captlc-screen-faq" style="display:none;">
			<div class="captlc-widget__header captlc-widget__header--sub" style="background:var(--captlcw-accent);">
				<span class="captlc-widget__header-title"><?php esc_html_e( 'Frequently Asked Questions', 'captain-live-chat' ); ?></span>
				<button type="button" class="captlc-widget__panel-close" aria-label="<?php esc_attr_e( 'Close chat', 'captain-live-chat' ); ?>">✕</button>
			</div>

			<div class="captlc-widget__faq-body">
				<div class="captlc-widget__faq-list" id="captlc-faq-list"></div>
				<p class="captlc-widget__faq-empty" id="captlc-faq-empty" hidden><?php esc_html_e( 'No FAQs have been added yet.', 'captain-live-chat' ); ?></p>

				<div class="captlc-widget__faq-detail" id="captlc-faq-detail" style="display:none;">
					<button type="button" class="captlc-widget__faq-detail-back" id="captlc-faq-detail-back">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
						<span><?php esc_html_e( 'All FAQs', 'captain-live-chat' ); ?></span>
					</button>
					<h3 class="captlc-widget__faq-detail-question" id="captlc-faq-detail-question"></h3>
					<p class="captlc-widget__faq-detail-answer" id="captlc-faq-detail-answer"></p>
				</div>
			</div>

			<div class="captlc-widget__footer-tabs">
				<button type="button" class="captlc-widget__footer-tab" data-tab="chat">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
					</svg>
					<span>Chat</span>
				</button>
				<button type="button" class="captlc-widget__footer-tab is-active" data-tab="faq">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
						<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
					</svg>
					<span>FAQ</span>
				</button>
			</div>

			<?php if ( ! empty( $show_branding ) ) : ?>
			<div class="captlc-widget__branding">
				<?php esc_html_e( 'Powered by', 'captain-live-chat' ); ?> <span style="font-weight:700;">Captain Live Chat</span>
			</div>
			<?php endif; ?>
		</div>

	</div>
</div>
