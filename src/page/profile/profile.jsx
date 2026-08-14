import React, { useState, useEffect } from 'react';
import './profile.scss';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser, setAgentOnline } from '../../redux/slice.jsx';
import Switcher from '../../components/switcher/switcher.jsx';
import Input from '../../components/input/Input.jsx';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => {
		if ( ! r.ok ) throw new Error( 'HTTP ' + r.status );
		return r.json();
	} );
};

const Profile = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector( ( state ) => state.currentUser );
	const agentOnline = useSelector( ( state ) => state.agentOnline );

	const [ displayName, setDisplayName ] = useState( '' );
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ saving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null ); // { type: 'success' | 'error', message: string }

	// Initialize inputs when currentUser is loaded
	useEffect( () => {
		if ( currentUser ) {
			setDisplayName( currentUser.name || '' );
			setUserEmail( currentUser.email || '' );
		}
	}, [ currentUser ] );

	const handleStatusToggle = ( e ) => {
		const checked = e.target.checked;
		dispatch( setAgentOnline( checked ) );

		ajax( 'captlc_toggle_agent_status', { is_online: checked ? '1' : '0' } )
			.catch( () => {
				dispatch( setAgentOnline( ! checked ) );
				setNotice( {
					type: 'error',
					message: __( 'Could not update online status.', 'captain-live-chat' ),
				} );
				setTimeout( () => setNotice( null ), 4000 );
			} );
	};

	const handleSave = ( e ) => {
		e.preventDefault();
		if ( saving ) return;

		if ( ! displayName.trim() || ! userEmail.trim() ) {
			setNotice( {
				type: 'error',
				message: __( 'Display Name and Email are required.', 'captain-live-chat' ),
			} );
			return;
		}

		setSaving( true );
		setNotice( null );

		ajax( 'captlc_save_profile', {
			display_name: displayName.trim(),
			user_email: userEmail.trim(),
		} )
			.then( ( res ) => {
				if ( res?.success ) {
					dispatch( setCurrentUser( res.data.user ) );
					setNotice( {
						type: 'success',
						message: __( 'Profile updated successfully.', 'captain-live-chat' ),
					} );
				} else {
					setNotice( {
						type: 'error',
						message: res?.data?.message || __( 'Could not save profile. Please try again.', 'captain-live-chat' ),
					} );
				}
			} )
			.catch( () => {
				setNotice( {
					type: 'error',
					message: __( 'Network error — profile not saved. Check your connection.', 'captain-live-chat' ),
				} );
			} )
			.finally( () => {
				setSaving( false );
				setTimeout( () => setNotice( ( n ) => ( n?.type === 'success' ? null : n ) ), 4000 );
			} );
	};

	const handleCancel = () => {
		if ( currentUser ) {
			setDisplayName( currentUser.name || '' );
			setUserEmail( currentUser.email || '' );
			setNotice( null );
		}
	};

	// Helper to get avatar initials
	const getInitials = ( name ) => {
		if ( ! name ) return '?';
		const parts = name.split( ' ' );
		return parts.map( ( p ) => p[0] ).slice( 0, 2 ).join( '' ).toUpperCase();
	};

	return (
		<div className="captlc-profile">
			<div className="captlc-main__header">
				<h1 className="captlc-main__title">{ __( 'Profile', 'captain-live-chat' ) }</h1>
				<div className="captlc-profile__header-actions">
					<button
						type="button"
						className="captlc-secondary-button"
						onClick={ handleCancel }
						style={ { marginRight: 8 } }
					>
						{ __( 'Cancel', 'captain-live-chat' ) }
					</button>
					<Primary_button
						type="button"
						onClick={ handleSave }
						text={ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Changes', 'captain-live-chat' ) }
						loader={ saving }
					/>
				</div>
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

			<div className="captlc-profile__content">
				{ /* ── Avatar Section ── */ }
				<div className="captlc-card captlc-profile__avatar-card">
					<div className="captlc-profile__avatar-section">
						<div className="captlc-profile__avatar-container">
							<div className="captlc-profile__avatar-circle">
								{ currentUser?.avatar_url ? (
									<img src={ currentUser.avatar_url } alt={ currentUser.name } />
								) : (
									getInitials( currentUser?.name )
								) }
							</div>
						</div>
						<h2 className="captlc-profile__avatar-name">{ currentUser?.name || __( 'Loading…', 'captain-live-chat' ) }</h2>
					</div>
				</div>

				{ /* ── Availability Card ── */ }
				<div className="captlc-profile__status-card">
					<div className="captlc-profile__status-label">
						<span>{ __( 'Online Availability', 'captain-live-chat' ) }</span>
						<span>{ __( 'Toggle whether visitors see you as online to receive chats.', 'captain-live-chat' ) }</span>
					</div>
					<div className="captlc-profile__status-action">
						<div className={ `captlc-status-dot${ agentOnline ? ' is-online' : '' }` } />
						<Switcher checked={ agentOnline } onChange={ handleStatusToggle } />
						<span>{ agentOnline ? __( 'Online', 'captain-live-chat' ) : __( 'Offline', 'captain-live-chat' ) }</span>
					</div>
				</div>

				{ /* ── Details Form ── */ }
				<div className="captlc-card">
					<h2 className="captlc-card__title" style={ { marginBottom: 16 } }>{ __( 'Profile Details', 'captain-live-chat' ) }</h2>
					<form onSubmit={ handleSave }>
						<div className="captlc-profile__form-row">
							<div className="captlc-field">
								<label className="captlc-field__label">{ __( 'Display Name', 'captain-live-chat' ) }</label>
								<Input
									value={ displayName }
									onChange={ ( e ) => setDisplayName( e.target.value ) }
									placeholder={ __( 'Your Name', 'captain-live-chat' ) }
								/>
							</div>

							<div className="captlc-field">
								<label className="captlc-field__label">{ __( 'Email Address', 'captain-live-chat' ) }</label>
								<Input
									type="email"
									value={ userEmail }
									onChange={ ( e ) => setUserEmail( e.target.value ) }
									placeholder={ __( 'email@example.com', 'captain-live-chat' ) }
								/>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Profile;
