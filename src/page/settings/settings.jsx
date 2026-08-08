import React, { useState } from 'react';
import './settings.scss';
import { __ } from '@wordpress/i18n';
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
	const [ allowedRoles, setAllowedRoles ]     = useState( initialSettings.allowed_roles || [] );
	const [ allowedUsers, setAllowedUsers ]     = useState( ( initialSettings.allowed_users || [] ).map( Number ) );
	const [ soundEnabled, setSoundEnabled ]     = useState( !! initialSettings.sound_enabled );
	const [ browserNotif, setBrowserNotif ]     = useState( !! initialSettings.browser_notif );
	const [ emailNotif, setEmailNotif ]         = useState( !! initialSettings.email_notif );
	const [ widgetTitle, setWidgetTitle ]       = useState( initialSettings.widget_title || '' );
	const [ offlineMessage, setOfflineMessage ] = useState( initialSettings.offline_message || '' );
	const [ pollInterval, setPollInterval ]     = useState( initialSettings.poll_interval_ms || 3000 );

	const [ saving, setSaving ]   = useState( false );
	const [ notice, setNotice ]   = useState( null ); // { type: 'success'|'error', message: string }

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

			<form onSubmit={ handleSave }>

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

				{ /* ── Notifications ── */ }
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

				{ /* ── Widget text ── */ }
				<div className="captlc-card">
					<h2 className="captlc-card__title">{ __( 'Widget text', 'captain-live-chat' ) }</h2>

					<div className="captlc-field">
						<label className="captlc-field__label">{ __( 'Chat window title', 'captain-live-chat' ) }</label>
						<Input value={ widgetTitle } onChange={ ( e ) => setWidgetTitle( e.target.value ) } />
					</div>

					<div className="captlc-field">
						<label className="captlc-field__label">{ __( 'Offline message', 'captain-live-chat' ) }</label>
						<textarea
							className="captlc-textarea"
							rows="3"
							value={ offlineMessage }
							onChange={ ( e ) => setOfflineMessage( e.target.value ) }
						/>
					</div>

					<div className="captlc-field captlc-field--half">
						<label className="captlc-field__label">{ __( 'Polling interval (milliseconds)', 'captain-live-chat' ) }</label>
						<Input
							type="number"
							value={ pollInterval }
							onChange={ ( e ) => setPollInterval( e.target.value ) }
						/>
						<p className="captlc-field__hint">{ __( 'Minimum 1500. Lower = more real-time but more server requests.', 'captain-live-chat' ) }</p>
					</div>
				</div>

				<div className="captlc-form-actions">
					<Primary_button
						type="submit"
						text={ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Settings', 'captain-live-chat' ) }
						loader={ saving }
					/>
				</div>

			</form>
		</div>
	);
};

export default Settings;
