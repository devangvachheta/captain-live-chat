import React from 'react';
import './ai_settings_upsell.scss';
import { __ } from '@wordpress/i18n';

/**
 * Shown at the AI Agent nav item when the separate "AI Agent for
 * Captain Live Chat" add-on is not installed/active. This plugin ships
 * with no AI code or third-party API calls of its own — installing the
 * add-on is what unlocks this page (see ExtensionSlot in
 * src/router/routes.js, which swaps this out automatically once the
 * add-on's script registers itself).
 */
const AiSettingsUpsell = () => (
	<div className="captlc-ai-upsell">
		<div className="captlc-ai-upsell__card">
			<h2>{ __( 'AI Agent', 'captain-live-chat' ) }</h2>
			<p>
				{ __(
					'Automatically reply to visitors when no agent is online, using an AI provider you connect with your own API key. This is a separate, optional add-on — Captain Live Chat itself makes no external network calls.',
					'captain-live-chat'
				) }
			</p>
			<p className="captlc-ai-upsell__hint">
				{ __(
					'Install and activate the "Captain Live Chat Pro" add-on to unlock this page.',
					'captain-live-chat'
				) }
			</p>
		</div>
	</div>
);

export default AiSettingsUpsell;
