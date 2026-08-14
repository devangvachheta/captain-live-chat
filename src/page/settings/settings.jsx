import React, { useState } from 'react';
import './settings.scss';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { setAgentOnline } from '../../redux/slice.jsx';
import Switcher from '../../components/switcher/switcher.jsx';
import Input from '../../components/input/Input.jsx';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';

const initialSettings = ( typeof captlc_data !== 'undefined' && captlc_data?.settings ) || {
	allowed_roles:    [ 'administrator' ],
	allowed_users:    [],
	sound_enabled:    true,
	browser_notif:    true,
	email_notif:      true,
	widget_title:     '',
	offline_message:  '',
	poll_interval_ms: 3000,
};

const roleOptions = ( typeof captlc_data !== 'undefined' && captlc_data?.roles ) || {};
const userOptions = ( typeof captlc_data !== 'undefined' && captlc_data?.users ) || [];

const Settings = () => {
	const dispatch = useDispatch();
	const agentOnline = useSelector( ( state ) => state.agentOnline );

	const [ allowedRoles, setAllowedRoles ]     = useState( initialSettings.allowed_roles || [] );
	const [ allowedUsers, setAllowedUsers ]     = useState( ( initialSettings.allowed_users || [] ).map( Number ) );
	const [ soundEnabled, setSoundEnabled ]     = useState( !! initialSettings.sound_enabled );
	const [ browserNotif, setBrowserNotif ]     = useState( !! initialSettings.browser_notif );
	const [ emailNotif, setEmailNotif ]         = useState( !! initialSettings.email_notif );
	const [ widgetTitle, setWidgetTitle ]       = useState( initialSettings.widget_title || '' );
	const [ offlineMessage, setOfflineMessage ] = useState( initialSettings.offline_message || '' );
	const [ pollInterval, setPollInterval ]       = useState( initialSettings.poll_interval_ms || 3000 );
	const [ quickReplies, setQuickReplies ]       = useState( initialSettings.quick_replies || [] );
	const [ quickReplyInput, setQuickReplyInput ] = useState( '' );

	const [ saving, setSaving ]   = useState( false );
	const [ notice, setNotice ]   = useState( null ); // { type: 'success'|'error', message: string }
	const [ activeTab, setActiveTab ] = useState( 'access' );

	const handleStatusToggle = ( e ) => {
		const checked = e.target.checked;
		dispatch( setAgentOnline( checked ) );

		const body = new URLSearchParams( {
			action: 'captlc_toggle_agent_status',
			nonce: captlc_data.nonce,
			is_online: checked ? '1' : '0',
		} );
		fetch( captlc_data.ajax_url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		} ).catch( () => {
			dispatch( setAgentOnline( ! checked ) );
		} );
	};

	const toggleRole = ( slug ) => {
		setAllowedRoles( ( prev ) =>
			prev.includes( slug ) ? prev.filter( ( r ) => r !== slug ) : [ ...prev, slug ]
		);
	};

	const toggleUser = ( id ) => {
		setAllowedUsers( ( prev ) =>
			prev.includes( id ) ? prev.filter( ( u ) => u !== id ) : [ ...prev, id ]
		);
	};

	const handleSave = ( e ) => {
		e.preventDefault();
		if ( saving ) return;

		setSaving( true );
		setNotice( null );

		const body = new URLSearchParams();
		body.append( 'action', 'captlc_save_settings' );
		body.append( 'nonce', captlc_data.nonce );
		allowedRoles.forEach( ( r ) => body.append( 'allowed_roles[]', r ) );
		allowedUsers.forEach( ( u ) => body.append( 'allowed_users[]', u ) );
		body.append( 'sound_enabled',    soundEnabled ? '1' : '0' );
		body.append( 'browser_notif',    browserNotif ? '1' : '0' );
		body.append( 'email_notif',      emailNotif   ? '1' : '0' );
		body.append( 'widget_title',     widgetTitle );
		body.append( 'offline_message',  offlineMessage );
		body.append( 'poll_interval_ms', pollInterval );
		quickReplies.forEach( ( r ) => body.append( 'quick_replies[]', r ) );

		fetch( captlc_data.ajax_url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		} )
			.then( ( res ) => {
				if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
				return res.json();
			} )
			.then( ( res ) => {
				if ( res?.success ) {
					setNotice( {
						type: 'success',
						message: __( 'Settings saved successfully.', 'captain-live-chat' ),
					} );
				} else {
					setNotice( {
						type: 'error',
						message: res?.data?.message || __( 'Could not save settings. Please try again.', 'captain-live-chat' ),
					} );
				}
			} )
			.catch( () => {
				setNotice( {
					type: 'error',
					message: __( 'Network error — settings not saved. Check your connection and try again.', 'captain-live-chat' ),
				} );
			} )
			.finally( () => {
				setSaving( false );
				// Auto-clear success notice after 4s.
				setTimeout( () => setNotice( ( n ) => ( n?.type === 'success' ? null : n ) ), 4000 );
			} );
	};

	return (
		<div className="captlc-settings">
			<div className="captlc-main__header">
				<h1 className="captlc-main__title">{ __( 'Settings', 'captain-live-chat' ) }</h1>
				<Primary_button
					type="button"
					onClick={ handleSave }
					text={ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Settings', 'captain-live-chat' ) }
					loader={ saving }
				/>
			</div>

			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` } role="alert">
					{ notice.message }
					<button
						type="button"
						className="captlc-notice__close"
						onClick={ () => setNotice( null ) }
						aria-label={ __( 'Dismiss', 'captain-live-chat' ) }
					>✕</button>
				</div>
			) }

			<div className="captlc-settings-tabs">
				<button
					type="button"
					className={ `captlc-settings-tab${ 'access' === activeTab ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'access' ) }
				>{ __( 'Agents & Access', 'captain-live-chat' ) }</button>
				<button
					type="button"
					className={ `captlc-settings-tab${ 'notifications' === activeTab ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'notifications' ) }
				>{ __( 'Notifications', 'captain-live-chat' ) }</button>
			</div>

			<form onSubmit={ handleSave } className="captlc-settings-panel">

				{ 'access' === activeTab && (
					<>
						{ /* ── Availability Status ── */ }
						<div className="captlc-card">
							<h2 className="captlc-card__title">{ __( 'Availability Status', 'captain-live-chat' ) }</h2>
							<p className="captlc-card__desc">{ __( 'Toggle your status between Online and Offline. When Offline, the front-end chat widget changes to show your offline welcome message and email submission form.', 'captain-live-chat' ) }</p>

							<div style={ { display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 } }>
								<div className={ `captlc-status-dot${ agentOnline ? ' is-online' : '' }` } style={ { width: 8, height: 8, borderRadius: '50%', background: agentOnline ? '#22c55e' : '#94a3b8' } } />
								<Switcher checked={ agentOnline } onChange={ handleStatusToggle } />
								<span style={ { fontSize: 13, fontWeight: 600, color: 'var(--captlc-text-primary)' } }>
									{ agentOnline ? __( 'Online', 'captain-live-chat' ) : __( 'Offline', 'captain-live-chat' ) }
								</span>
							</div>
						</div>

						{ /* ── Roles ── */ }
						<div className="captlc-card">
							<h2 className="captlc-card__title">{ __( 'Who can reply to chats', 'captain-live-chat' ) }</h2>
							<p className="captlc-card__desc">{ __( 'Choose which roles are allowed to act as chat agents.', 'captain-live-chat' ) }</p>

							<div className="captlc-checkbox-list">
								{ Object.entries( roleOptions ).map( ( [ slug, label ] ) => (
									<label key={ slug } className="captlc-checkbox">
										<input
											type="checkbox"
											checked={ allowedRoles.includes( slug ) }
											onChange={ () => toggleRole( slug ) }
										/>
										<span className="captlc-checkbox__box"></span>
										<span className="captlc-checkbox__label">{ label }</span>
									</label>
								) ) }
							</div>
						</div>

						{ /* ── Specific users ── */ }
						<div className="captlc-card">
							<h2 className="captlc-card__title">{ __( 'Or allow specific users', 'captain-live-chat' ) }</h2>
							<p className="captlc-card__desc">{ __( 'These users can reply to chats regardless of their role.', 'captain-live-chat' ) }</p>

							<div className="captlc-checkbox-list captlc-checkbox-list--scroll">
								{ userOptions.map( ( user ) => (
									<label key={ user.id } className="captlc-checkbox">
										<input
											type="checkbox"
											checked={ allowedUsers.includes( user.id ) }
											onChange={ () => toggleUser( user.id ) }
										/>
										<span className="captlc-checkbox__box"></span>
										<span className="captlc-checkbox__label">{ user.name }</span>
									</label>
								) ) }
							</div>
						</div>
					</>
				) }

				{ 'notifications' === activeTab && (
					<div className="captlc-card">
						<h2 className="captlc-card__title">{ __( 'Notifications', 'captain-live-chat' ) }</h2>

						<div className="captlc-toggle-list">
							<label className="captlc-toggle-row">
								<Switcher checked={ soundEnabled } onChange={ ( e ) => setSoundEnabled( e.target.checked ) } />
								<span>{ __( 'Sound notification', 'captain-live-chat' ) }</span>
							</label>
							<label className="captlc-toggle-row">
								<Switcher checked={ browserNotif } onChange={ ( e ) => setBrowserNotif( e.target.checked ) } />
								<span>{ __( 'Browser notification', 'captain-live-chat' ) }</span>
							</label>
							<label className="captlc-toggle-row">
								<Switcher checked={ emailNotif } onChange={ ( e ) => setEmailNotif( e.target.checked ) } />
								<span>{ __( 'Email notification', 'captain-live-chat' ) }</span>
							</label>
						</div>
					</div>
				) }



			</form>
		</div>
	);
};

export default Settings;
