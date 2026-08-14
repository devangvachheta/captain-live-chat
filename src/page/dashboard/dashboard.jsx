import React, { useState, useEffect } from 'react';
import './dashboard.scss';
import { Link } from 'react-router-dom';
import { __ } from '@wordpress/i18n';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( {
		action,
		nonce: captlc_data.nonce,
		...data,
	} );

	return fetch( captlc_data.ajax_url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( res ) => {
		if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
		return res.json();
	} );
};

const IconInbox = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
	</svg>
);
const IconOpen = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
	</svg>
);
const IconUnread = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z"/>
		<path d="M2 7l10 6 10-6"/>
	</svg>
);
const IconDesign = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
	</svg>
);
const IconCanned = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
		<line x1="9" y1="10" x2="15" y2="10"/>
	</svg>
);

const Dashboard = () => {
	const [ stats, setStats ] = useState( null );

	useEffect( () => {
		ajax( 'captlc_get_dashboard_stats' )
			.then( ( res ) => { if ( res?.success ) setStats( res.data ); } )
			.catch( () => {} );
	}, [] );

	return (
		<div className="captlc-dashboard-overview">
			<div className="captlc-overview-header">
				<span className="captlc-overview-header__icon"><IconInbox /></span>
				<div>
					<h1 className="captlc-overview-header__title">{ __( 'Dashboard', 'captain-live-chat' ) }</h1>
					<p className="captlc-overview-header__subtitle">
						{ __( 'Your live chat command center — conversations, widget, and setup at a glance.', 'captain-live-chat' ) }
					</p>
				</div>
			</div>

			<div className="captlc-stat-cards">
				<Link to="/inbox" className="captlc-stat-card captlc-stat-card--purple">
					<span className="captlc-stat-card__icon"><IconInbox /></span>
					<span className="captlc-stat-card__value">{ stats ? stats.total_conversations : '—' }</span>
					<span className="captlc-stat-card__label">{ __( 'TOTAL CONVERSATIONS', 'captain-live-chat' ) }</span>
					<span className="captlc-stat-card__blob"></span>
				</Link>

				<Link to="/inbox" className="captlc-stat-card captlc-stat-card--teal">
					<span className="captlc-stat-card__icon"><IconOpen /></span>
					<span className="captlc-stat-card__value">{ stats ? stats.open_conversations : '—' }</span>
					<span className="captlc-stat-card__label">{ __( 'OPEN CONVERSATIONS', 'captain-live-chat' ) }</span>
					<span className="captlc-stat-card__blob"></span>
				</Link>

				<Link to="/inbox" className="captlc-stat-card captlc-stat-card--amber">
					<span className="captlc-stat-card__icon"><IconUnread /></span>
					<span className="captlc-stat-card__value">{ stats ? stats.unread_conversations : '—' }</span>
					<span className="captlc-stat-card__label">{ __( 'UNREAD CONVERSATIONS', 'captain-live-chat' ) }</span>
					<span className="captlc-stat-card__blob"></span>
				</Link>
			</div>

			<div className="captlc-getting-started">
				<div className="captlc-getting-started__header">
					<h2>{ __( 'Getting Started', 'captain-live-chat' ) }</h2>
					<span className="captlc-getting-started__pill">{ __( '3 easy steps', 'captain-live-chat' ) }</span>
				</div>

				<div className="captlc-getting-started__steps">
					<div className="captlc-gs-step">
						<span className="captlc-gs-step__num captlc-gs-step__num--purple">01</span>
						<span className="captlc-gs-step__icon captlc-gs-step__icon--purple"><IconDesign /></span>
						<h3>{ __( 'Design your widget', 'captain-live-chat' ) }</h3>
						<p>{ __( 'Pick colors, position, and the welcome text visitors see first.', 'captain-live-chat' ) }</p>
						<Link to="/widget-designer" className="captlc-gs-step__link captlc-gs-step__link--purple">
							{ __( 'Open Widget Designer', 'captain-live-chat' ) } →
						</Link>
					</div>

					<div className="captlc-gs-step">
						<span className="captlc-gs-step__num captlc-gs-step__num--teal">02</span>
						<span className="captlc-gs-step__icon captlc-gs-step__icon--teal"><IconCanned /></span>
						<h3>{ __( 'Add canned replies', 'captain-live-chat' ) }</h3>
						<p>{ __( 'Save common answers as shortcuts so agents can reply in one click.', 'captain-live-chat' ) }</p>
						<Link to="/canned-replies" className="captlc-gs-step__link captlc-gs-step__link--teal">
							{ __( 'Manage Canned Replies', 'captain-live-chat' ) } →
						</Link>
					</div>

					<div className="captlc-gs-step">
						<span className="captlc-gs-step__num captlc-gs-step__num--green">03</span>
						<span className="captlc-gs-step__icon captlc-gs-step__icon--green"><IconInbox /></span>
						<h3>{ __( 'Go to the Inbox', 'captain-live-chat' ) }</h3>
						<p>{ __( 'Start replying to visitors in real time from the Inbox.', 'captain-live-chat' ) }</p>
						<Link to="/inbox" className="captlc-gs-step__link captlc-gs-step__link--green">
							{ __( 'Open Inbox', 'captain-live-chat' ) } →
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
