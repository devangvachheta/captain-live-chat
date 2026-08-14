import React, { useState } from 'react';
import './help.scss';
import { __ } from '@wordpress/i18n';

const IconDoc = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
		<polyline points="14 2 14 8 20 8"/>
		<line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
	</svg>
);
const IconSupport = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
	</svg>
);
const IconStar = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
	</svg>
);

const FAQS = [
	{
		q: __( 'How do I add the chat widget to my site?', 'captain-live-chat' ),
		a: __( 'Go to Template, choose your colors and position, then turn the widget on. It appears automatically on the front end — no shortcode needed.', 'captain-live-chat' ),
	},
	{
		q: __( 'Who can reply to chats?', 'captain-live-chat' ),
		a: __( 'Go to Settings → Agents & Access to choose which roles or specific users can act as chat agents.', 'captain-live-chat' ),
	},
	{
		q: __( 'How do Quick Replies work?', 'captain-live-chat' ),
		a: __( 'Save a shortcut and message under Quick Reply. While replying in the Inbox, type "/" followed by the shortcut to insert it instantly.', 'captain-live-chat' ),
	},
	{
		q: __( 'Can AI reply automatically?', 'captain-live-chat' ),
		a: __( 'Yes — configure a provider and prompt under AI Agent. It can answer visitors automatically until a human agent takes over the conversation.', 'captain-live-chat' ),
	},
	{
		q: __( 'Why is a conversation marked as offline?', 'captain-live-chat' ),
		a: __( 'The online/offline toggle in the Inbox controls this. Turn it on so visitors see you as available and offline messages stop showing.', 'captain-live-chat' ),
	},
];

const Help = () => {
	const [ openFaq, setOpenFaq ] = useState( 0 );

	return (
		<div className="captlc-help">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Help & Support', 'captain-live-chat' ) }</h1>
					<p className="captlc-help__subtitle">
						{ __( 'Find answers to common questions and get started quickly.', 'captain-live-chat' ) }
					</p>
				</div>
			</div>

			<div className="captlc-help-cards">
				<a
					className="captlc-help-card"
					href="https://example.com/captain-live-chat/docs"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span className="captlc-help-card__icon"><IconDoc /></span>
					<h3>{ __( 'Documentation', 'captain-live-chat' ) }</h3>
					<p>{ __( 'Read our full plugin documentation to learn all available features.', 'captain-live-chat' ) }</p>
					<span className="captlc-help-card__link">{ __( 'View Docs', 'captain-live-chat' ) } →</span>
				</a>

				<a
					className="captlc-help-card"
					href="https://example.com/captain-live-chat/support"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span className="captlc-help-card__icon"><IconSupport /></span>
					<h3>{ __( 'Support', 'captain-live-chat' ) }</h3>
					<p>{ __( 'Open a support ticket and our team will get back to you quickly.', 'captain-live-chat' ) }</p>
					<span className="captlc-help-card__link">{ __( 'Get Support', 'captain-live-chat' ) } →</span>
				</a>

				<a
					className="captlc-help-card"
					href="https://wordpress.org/plugins/captain-live-chat/#reviews"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span className="captlc-help-card__icon"><IconStar /></span>
					<h3>{ __( 'Rate Us', 'captain-live-chat' ) }</h3>
					<p>{ __( 'Enjoying the plugin? Leave us a 5-star review on WordPress.org!', 'captain-live-chat' ) }</p>
					<span className="captlc-help-card__link">{ __( 'Rate Plugin', 'captain-live-chat' ) } →</span>
				</a>
			</div>

			<div className="captlc-help-faq">
				<h2>{ __( 'Frequently Asked Questions', 'captain-live-chat' ) }</h2>

				<div className="captlc-faq-list">
					{ FAQS.map( ( item, i ) => (
						<div key={ i } className={ `captlc-faq-item${ openFaq === i ? ' is-open' : '' }` }>
							<button
								type="button"
								className="captlc-faq-item__question"
								onClick={ () => setOpenFaq( openFaq === i ? -1 : i ) }
							>
								{ item.q }
								<span className="captlc-faq-item__caret">⌄</span>
							</button>
							{ openFaq === i && (
								<p className="captlc-faq-item__answer">{ item.a }</p>
							) }
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default Help;
