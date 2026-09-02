import React, { useState } from 'react';
import './settings.scss';
import { __ } from '@wordpress/i18n';
import Switcher from '../../components/switcher/switcher.jsx';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';

const initialSettings = ( typeof captlc_data !== 'undefined' && captlc_data?.settings ) || {
	allowed_roles: [ 'administrator' ],
	allowed_users: [],
	sound_enabled: true,
	browser_notif: true,
	email_notif:   true,
	reminder_email_enabled: true,
	reminder_delay_hours:   4,
};

const roleOptions = ( typeof captlc_data !== 'undefined' && captlc_data?.roles ) || {};

const Settings = () => {
	const [ allowedRoles, setAllowedRoles ] = useState( initialSettings.allowed_roles || [] );
	const [ soundEnabled, setSoundEnabled ] = useState( !! initialSettings.sound_enabled );
	const [ browserNotif, setBrowserNotif ] = useState( !! initialSettings.browser_notif );
	const [ emailNotif, setEmailNotif ]     = useState( !! initialSettings.email_notif );
	const [ reminderEmailEnabled, setReminderEmailEnabled ] = useState( !! initialSettings.reminder_email_enabled );
	const [ reminderDelayHours, setReminderDelayHours ]     = useState( initialSettings.reminder_delay_hours || 4 );
	const [ deleteDataOnUninstall, setDeleteDataOnUninstall ]         = useState( !! initialSettings.delete_data_on_uninstall );
	const [ preserveSettingsOnUninstall, setPreserveSettingsOnUninstall ] = useState( !! initialSettings.preserve_settings_on_uninstall );
	const [ showBranding, setShowBranding ] = useState( !! initialSettings.show_branding );

	const [ saving, setSaving ]   = useState( false );
	const [ notice, setNotice ]   = useState( null ); // { type: 'success'|'error', message: string }
	const [ activeTab, setActiveTab ] = useState( 'access' );

	const toggleRole = ( slug ) => {
		setAllowedRoles( ( prev ) =>
			prev.includes( slug ) ? prev.filter( ( r ) => r !== slug ) : [ ...prev, slug ]
		);
	};

	const handleSave = ( e ) => {
		if ( e && typeof e.preventDefault === 'function' ) {
			e.preventDefault();
		}
		if ( saving ) return;

		setSaving( true );
		setNotice( null );

		const body = new URLSearchParams();
		body.append( 'action', 'captlc_save_settings' );
		body.append( 'nonce', captlc_data.nonce );
		allowedRoles.forEach( ( r ) => body.append( 'allowed_roles[]', r ) );
		body.append( 'sound_enabled', soundEnabled ? '1' : '0' );
		body.append( 'browser_notif', browserNotif ? '1' : '0' );
		body.append( 'email_notif',   emailNotif   ? '1' : '0' );
		body.append( 'reminder_email_enabled', reminderEmailEnabled ? '1' : '0' );
		body.append( 'reminder_delay_hours',   reminderDelayHours );
		body.append( 'delete_data_on_uninstall',       deleteDataOnUninstall       ? '1' : '0' );
		body.append( 'preserve_settings_on_uninstall', preserveSettingsOnUninstall ? '1' : '0' );
		body.append( 'show_branding',                  showBranding                ? '1' : '0' );

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
				<button
					type="button"
					className={ `captlc-settings-tab${ 'uninstall' === activeTab ? ' is-active' : '' }` }
					onClick={ () => setActiveTab( 'uninstall' ) }
				>{ __( 'Uninstall', 'captain-live-chat' ) }</button>
			</div>

			<form onSubmit={ handleSave } className="captlc-settings-panel">

				{ 'access' === activeTab && (
					<>
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
							<p className="captlc-card__desc captlc-card__desc--footnote">
								{ __( 'To allow specific individual users regardless of role, and to control which pages each of them can open, go to Profile → Team Access.', 'captain-live-chat' ) }
							</p>
						</div>
					</>
				) }

				{ 'notifications' === activeTab && (
					<div className="captlc-card">
						<h2 className="captlc-card__title">{ __( 'Notifications', 'captain-live-chat' ) }</h2>

						<div className="captlc-toggle-list">
							<label className="captlc-toggle-row captlc-toggle-row--stacked">
								<div className="captlc-toggle-row__text">
									<span className="captlc-toggle-row__label">{ __( 'Show "Powered by Captain Live Chat" badge', 'captain-live-chat' ) }</span>
									<span className="captlc-toggle-row__desc">{ __( 'Optional — off by default. When enabled, a small credit badge is shown to your site visitors at the bottom of the chat widget.', 'captain-live-chat' ) }</span>
								</div>
								<Switcher checked={ showBranding } onChange={ ( e ) => setShowBranding( e.target.checked ) } />
							</label>
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
							<label className="captlc-toggle-row captlc-toggle-row--stacked">
								<div className="captlc-toggle-row__text">
									<span className="captlc-toggle-row__label">{ __( 'Unanswered message reminder', 'captain-live-chat' ) }</span>
									<span className="captlc-toggle-row__desc">{ __( 'If a visitor message hasn\'t been replied to after the delay below, email agents a reminder with the pending message(s).', 'captain-live-chat' ) }</span>
								</div>
								<Switcher checked={ reminderEmailEnabled } onChange={ ( e ) => setReminderEmailEnabled( e.target.checked ) } />
							</label>
							{ reminderEmailEnabled && (
								<div className="captlc-field captlc-field--inline">
									<label className="captlc-field__label" htmlFor="captlc-settings-reminder-hours">{ __( 'Remind after (hours)', 'captain-live-chat' ) }</label>
									<input
										id="captlc-settings-reminder-hours"
										type="number"
										min="1"
										max="72"
										className="captlc-input-field captlc-input-field--small"
										value={ reminderDelayHours }
										onChange={ ( e ) => setReminderDelayHours( e.target.value ) }
									/>
								</div>
							) }
						</div>
					</div>
				) }

				{ 'uninstall' === activeTab && (
					<div className="captlc-card captlc-card--danger">
						<h2 className="captlc-card__title">{ __( 'Uninstall Settings', 'captain-live-chat' ) }</h2>

						<div className="captlc-toggle-list">
							<label className="captlc-toggle-row captlc-toggle-row--stacked">
								<div className="captlc-toggle-row__text">
									<span className="captlc-toggle-row__label">{ __( 'Delete Data on Uninstall', 'captain-live-chat' ) }</span>
									<span className="captlc-toggle-row__desc">{ __( 'When enabled, all plugin data (threads, messages, settings) will be deleted when the plugin is uninstalled.', 'captain-live-chat' ) }</span>
								</div>
								<Switcher checked={ deleteDataOnUninstall } onChange={ ( e ) => setDeleteDataOnUninstall( e.target.checked ) } />
							</label>
							<label className="captlc-toggle-row captlc-toggle-row--stacked">
								<div className="captlc-toggle-row__text">
									<span className="captlc-toggle-row__label">{ __( 'Preserve Settings on Uninstall', 'captain-live-chat' ) }</span>
									<span className="captlc-toggle-row__desc">{ __( 'Overrides "Delete Data on Uninstall". Settings will be kept even if delete is enabled.', 'captain-live-chat' ) }</span>
								</div>
								<Switcher checked={ preserveSettingsOnUninstall } onChange={ ( e ) => setPreserveSettingsOnUninstall( e.target.checked ) } />
							</label>
						</div>
					</div>
				) }

			</form>
		</div>
	);
};

export default Settings;
