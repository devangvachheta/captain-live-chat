import React, { useState, useEffect, useRef, useCallback } from 'react';
import './profile.scss';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentUser, setAgentOnline, setAgentProfile } from '../../redux/slice.jsx';
import Switcher from '../../components/switcher/switcher.jsx';
import Input from '../../components/input/Input.jsx';
import ScheduleEditor from '../../components/schedule_editor/schedule_editor.jsx';
import MultiSelect from '../../components/multiselect/multiselect.jsx';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';
import COUNTRIES from './countries.js';
import LANGUAGES from './languages.js';

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

const AVAILABILITY_OPTIONS = [
	{ value: 'status', label: __( 'Show online based on status', 'captain-live-chat' ) },
	{ value: 'never',  label: __( 'Never online', 'captain-live-chat' ) },
	{ value: 'always', label: __( 'Always online', 'captain-live-chat' ) },
	{ value: 'custom', label: __( 'Custom availability', 'captain-live-chat' ) },
];

const IconPencil = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
		<path d="m15 5 4 4" />
	</svg>
);

// ── Team access (admin-only) ─────────────────────────────────────────────
const isAdmin        = ( typeof captlc_data !== 'undefined' && !! captlc_data?.is_admin ) || false;
const currentUserId  = ( typeof captlc_data !== 'undefined' && captlc_data?.current_user_id ) || 0;
const teamUsers      = ( ( typeof captlc_data !== 'undefined' && captlc_data?.users ) || [] ).filter( ( u ) => u.id !== currentUserId );
const optionalPages  = Object.entries( ( typeof captlc_data !== 'undefined' && captlc_data?.optional_pages ) || {} )
	.map( ( [ value, label ] ) => ( { value, label } ) );
const initialAllowedUserIds = ( ( typeof captlc_data !== 'undefined' && captlc_data?.settings?.allowed_users ) || [] ).map( Number );
const initialPageAccess     = ( typeof captlc_data !== 'undefined' && captlc_data?.settings?.user_page_access ) || {};

const Profile = () => {
	const dispatch = useDispatch();
	const currentUser = useSelector( ( state ) => state.currentUser );
	const agentOnline = useSelector( ( state ) => state.agentOnline );
	const agentProfile = useSelector( ( state ) => state.agentProfile );

	const [ displayName, setDisplayName ] = useState( '' );
	const [ userEmail, setUserEmail ] = useState( '' );
	const [ editingName, setEditingName ] = useState( false );
	const [ companyName, setCompanyName ] = useState( '' );
	const [ country, setCountry ] = useState( '' );
	const [ address, setAddress ] = useState( '' );
	const [ preferredLanguage, setPreferredLanguage ] = useState( 'en' );
	const [ availabilityMode, setAvailabilityMode ] = useState( 'status' );

	// 'idle' | 'saving' | 'saved' | 'error'
	const [ saveState, setSaveState ] = useState( 'idle' );
	const [ errorMsg, setErrorMsg ] = useState( '' );

	// ── Team access state (admin-only card) ──
	const [ allowedUserIds, setAllowedUserIds ] = useState( initialAllowedUserIds );
	const [ pageAccessMap, setPageAccessMap ] = useState( () => {
		const map = {};
		Object.entries( initialPageAccess ).forEach( ( [ id, pages ] ) => {
			map[ id ] = Array.isArray( pages ) ? pages : [];
		} );
		return map;
	} );
	const [ teamSaveState, setTeamSaveState ] = useState( 'idle' ); // idle | saving | saved | error
	const [ teamErrorMsg, setTeamErrorMsg ] = useState( '' );

	const saveTimer = useRef( null );
	const savedFlashTimer = useRef( null );
	const hydrated = useRef( false );

	// Initialize inputs when data first loads (don't fight the user's typing
	// on subsequent redux updates that our own save triggers).
	useEffect( () => {
		if ( currentUser && ! hydrated.current ) {
			setDisplayName( currentUser.name || '' );
			setUserEmail( currentUser.email || '' );
		}
	}, [ currentUser ] );

	useEffect( () => {
		if ( agentProfile && ! hydrated.current ) {
			setCompanyName( agentProfile.company_name || '' );
			setCountry( agentProfile.country || '' );
			setAddress( agentProfile.address || '' );
			setPreferredLanguage( agentProfile.preferred_language || 'en' );
			setAvailabilityMode( agentProfile.availability_mode || 'status' );
			hydrated.current = true;
		}
	}, [ agentProfile ] );

	// "Always"/"Never" force the visible online state regardless of the raw
	// is_online flag — the manual switch is disabled for those modes since
	// it no longer controls anything.
	const manualToggleDisabled = availabilityMode === 'always' || availabilityMode === 'never';
	const displayOnline = availabilityMode === 'always'
		? true
		: availabilityMode === 'never'
			? false
			: agentOnline;

	const handleStatusToggle = ( e ) => {
		if ( manualToggleDisabled ) return;
		const checked = e.target.checked;
		dispatch( setAgentOnline( checked ) );

		ajax( 'captlc_toggle_agent_status', { is_online: checked ? '1' : '0' } )
			.catch( () => {
				dispatch( setAgentOnline( ! checked ) );
				setErrorMsg( __( 'Could not update online status.', 'captain-live-chat' ) );
				setSaveState( 'error' );
			} );
	};

	// Auto-save: debounced so tabbing through several fields quickly (or fast
	// typing) collapses into one request using the latest values, rather than
	// firing a save per keystroke/blur.
	const doSave = useCallback( ( values ) => {
		if ( ! values.displayName.trim() || ! values.userEmail.trim() ) {
			setErrorMsg( __( 'Full Name and Email can\u2019t be empty.', 'captain-live-chat' ) );
			setSaveState( 'error' );
			return;
		}

		setSaveState( 'saving' );

		ajax( 'captlc_save_profile', {
			display_name: values.displayName.trim(),
			user_email: values.userEmail.trim(),
			company_name: values.companyName.trim(),
			country: values.country,
			address: values.address.trim(),
			preferred_language: values.preferredLanguage,
			availability_mode: values.availabilityMode,
		} )
			.then( ( res ) => {
				if ( res?.success ) {
					dispatch( setCurrentUser( res.data.user ) );
					dispatch( setAgentProfile( res.data.profile ) );
					setSaveState( 'saved' );
					clearTimeout( savedFlashTimer.current );
					savedFlashTimer.current = setTimeout( () => setSaveState( 'idle' ), 2200 );
				} else {
					setErrorMsg( res?.data?.message || __( 'Could not save. Please try again.', 'captain-live-chat' ) );
					setSaveState( 'error' );
				}
			} )
			.catch( () => {
				setErrorMsg( __( 'Network error — change not saved.', 'captain-live-chat' ) );
				setSaveState( 'error' );
			} );
	}, [ dispatch ] );

	const scheduleSave = useCallback( ( overrides = {} ) => {
		clearTimeout( saveTimer.current );
		saveTimer.current = setTimeout( () => {
			doSave( {
				displayName, userEmail, companyName, country, address, preferredLanguage, availabilityMode,
				...overrides,
			} );
		}, 500 );
	}, [ doSave, displayName, userEmail, companyName, country, address, preferredLanguage, availabilityMode ] );

	// Selects/toggles save immediately (no "in-progress typing" concern).
	const saveNow = ( overrides ) => {
		clearTimeout( saveTimer.current );
		doSave( {
			displayName, userEmail, companyName, country, address, preferredLanguage, availabilityMode,
			...overrides,
		} );
	};

	// ── Team access handlers (admin-only) ──
	const toggleUserAllowed = ( id ) => {
		setAllowedUserIds( ( prev ) =>
			prev.includes( id ) ? prev.filter( ( u ) => u !== id ) : [ ...prev, id ]
		);
	};

	const setUserPages = ( id, pages ) => {
		setPageAccessMap( ( prev ) => ( { ...prev, [ id ]: pages } ) );
	};

	const saveTeamAccess = () => {
		if ( teamSaveState === 'saving' ) return;

		setTeamSaveState( 'saving' );

		const body = new URLSearchParams();
		body.append( 'action', 'captlc_save_team_access' );
		body.append( 'nonce', captlc_data.nonce );
		allowedUserIds.forEach( ( id ) => body.append( 'allowed_users[]', id ) );
		body.append( 'user_page_access', JSON.stringify( pageAccessMap ) );

		fetch( captlc_data.ajax_url, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		} )
			.then( ( r ) => {
				if ( ! r.ok ) throw new Error( 'HTTP ' + r.status );
				return r.json();
			} )
			.then( ( res ) => {
				if ( res?.success ) {
					setTeamSaveState( 'saved' );
					setTimeout( () => setTeamSaveState( 'idle' ), 2200 );
				} else {
					setTeamErrorMsg( res?.data?.message || __( 'Could not save. Please try again.', 'captain-live-chat' ) );
					setTeamSaveState( 'error' );
				}
			} )
			.catch( () => {
				setTeamErrorMsg( __( 'Network error — team access not saved.', 'captain-live-chat' ) );
				setTeamSaveState( 'error' );
			} );
	};

	useEffect( () => () => {
		clearTimeout( saveTimer.current );
		clearTimeout( savedFlashTimer.current );
	}, [] );

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
				<div className="captlc-profile__save-indicator">
					{ saveState === 'saving' && <span className="captlc-profile__save-status">{ __( 'Saving…', 'captain-live-chat' ) }</span> }
					{ saveState === 'saved'  && <span className="captlc-profile__save-status is-saved">✓ { __( 'Saved', 'captain-live-chat' ) }</span> }
				</div>
			</div>

			{ saveState === 'error' && (
				<div className="captlc-notice captlc-notice--error" role="alert">
					{ errorMsg }
					<button
						type="button"
						className="captlc-notice__close"
						onClick={ () => setSaveState( 'idle' ) }
						aria-label={ __( 'Dismiss', 'captain-live-chat' ) }
					>✕</button>
				</div>
			) }

			<div className="captlc-profile__layout">
				{ /* ── Left: Avatar card — now also hosts inline name editing
				       and the Availability controls, since this is the
				       "who am I / am I reachable" summary at a glance. ── */ }
				<div className="captlc-card captlc-profile__avatar-card">
					<div className="captlc-profile__avatar-circle">
						{ currentUser?.avatar_url ? (
							<img src={ currentUser.avatar_url } alt={ currentUser.name } />
						) : (
							getInitials( displayName || currentUser?.name )
						) }
					</div>

					<div className="captlc-profile__name-row">
						{ editingName ? (
							<input
								type="text"
								className="captlc-profile__name-input"
								value={ displayName }
								autoFocus
								onChange={ ( e ) => setDisplayName( e.target.value ) }
								onBlur={ () => { setEditingName( false ); scheduleSave(); } }
								onKeyDown={ ( e ) => {
									if ( e.key === 'Enter' ) e.currentTarget.blur();
									if ( e.key === 'Escape' ) { setDisplayName( currentUser?.name || '' ); setEditingName( false ); }
								} }
							/>
						) : (
							<>
								<h2 className="captlc-profile__avatar-name">{ displayName || __( 'Loading…', 'captain-live-chat' ) }</h2>
								<button
									type="button"
									className="captlc-profile__edit-name-btn"
									onClick={ () => setEditingName( true ) }
									aria-label={ __( 'Edit name', 'captain-live-chat' ) }
								>
									<IconPencil />
								</button>
							</>
						) }
					</div>

					<span className="captlc-profile__avatar-email">{ userEmail }</span>

					<div className="captlc-profile__avatar-divider"></div>

					{ /* ── Availability (moved here from its own card — this is
					       the "am I reachable right now" info, so it belongs
					       right next to who's asking) ── */ }
					<div className="captlc-profile__avatar-availability">
						<div className="captlc-profile__status-action">
							<Switcher checked={ displayOnline } onChange={ handleStatusToggle } disabled={ manualToggleDisabled } />
							<span className={ `captlc-profile__status-label${ displayOnline ? ' is-online' : '' }` }>
								{ displayOnline ? __( 'Online', 'captain-live-chat' ) : __( 'Offline', 'captain-live-chat' ) }
							</span>
						</div>

						<div className="captlc-field captlc-profile__avatar-availability-select">
							<label className="captlc-field__label" htmlFor="captlc-profile-availability">{ __( 'Availability', 'captain-live-chat' ) }</label>
							<select
								id="captlc-profile-availability"
								className="captlc-select"
								value={ availabilityMode }
								onChange={ ( e ) => {
									setAvailabilityMode( e.target.value );
									saveNow( { availabilityMode: e.target.value } );
								} }
							>
								{ AVAILABILITY_OPTIONS.map( ( o ) => (
									<option key={ o.value } value={ o.value }>{ o.label }</option>
								) ) }
							</select>
						</div>

						<p className="captlc-field__hint captlc-profile__avatar-availability-hint">
							{ manualToggleDisabled
								? __( 'Controlled by the Availability setting above.', 'captain-live-chat' )
								: __( 'Toggle whether visitors see you as online to receive chats.', 'captain-live-chat' ) }
						</p>

						{ availabilityMode === 'custom' && (
							<div className="captlc-profile__schedule-inline">
								<ScheduleEditor />
							</div>
						) }
					</div>
				</div>

				{ /* ── Right: everything else ── */ }
				<div className="captlc-profile__main">
					{ /* ── Details Form ── */ }
					<div className="captlc-card">
						<h2 className="captlc-card__title">{ __( 'Profile Details', 'captain-live-chat' ) }</h2>
						<div className="captlc-profile__form-row">
							<div className="captlc-field">
								<label className="captlc-field__label" htmlFor="captlc-profile-company">{ __( 'Company Name', 'captain-live-chat' ) }</label>
								<Input
									id="captlc-profile-company"
									value={ companyName }
									onChange={ ( e ) => setCompanyName( e.target.value ) }
									onBlur={ () => scheduleSave() }
									placeholder={ __( 'Enter your company name', 'captain-live-chat' ) }
								/>
							</div>

							<div className="captlc-field">
								<label className="captlc-field__label" htmlFor="captlc-profile-country">{ __( 'Country', 'captain-live-chat' ) }</label>
								<select
									id="captlc-profile-country"
									className="captlc-select"
									value={ country }
									onChange={ ( e ) => { setCountry( e.target.value ); saveNow( { country: e.target.value } ); } }
								>
									<option value="">{ __( 'Select your country', 'captain-live-chat' ) }</option>
									{ COUNTRIES.map( ( c ) => (
										<option key={ c.code } value={ c.code }>{ c.name }</option>
									) ) }
								</select>
							</div>

							<div className="captlc-field captlc-field--full">
								<label className="captlc-field__label" htmlFor="captlc-profile-address">{ __( 'Address', 'captain-live-chat' ) }</label>
								<textarea
									id="captlc-profile-address"
									className="captlc-input-field"
									rows={ 2 }
									value={ address }
									onChange={ ( e ) => setAddress( e.target.value ) }
									onBlur={ () => scheduleSave() }
									placeholder={ __( 'Enter your address', 'captain-live-chat' ) }
								/>
							</div>

							<div className="captlc-field">
								<label className="captlc-field__label" htmlFor="captlc-profile-language">{ __( 'Preferred Chat Language', 'captain-live-chat' ) }</label>
								<select
									id="captlc-profile-language"
									className="captlc-select"
									value={ preferredLanguage }
									onChange={ ( e ) => { setPreferredLanguage( e.target.value ); saveNow( { preferredLanguage: e.target.value } ); } }
								>
									{ LANGUAGES.map( ( l ) => (
										<option key={ l.code } value={ l.code }>{ l.name }</option>
									) ) }
								</select>
								<p className="captlc-field__hint">{ __( 'Affects the whole team.', 'captain-live-chat' ) }</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{ isAdmin && (
				<div className="captlc-card captlc-team-access">
					<div className="captlc-team-access__header">
						<div>
							<h2 className="captlc-card__title">{ __( 'Team Access', 'captain-live-chat' ) }</h2>
							<p className="captlc-card__desc">
								{ __( 'Choose which WordPress users can act as chat agents, and which extra pages each of them can open. Inbox, Profile, Documentation and Help are always included.', 'captain-live-chat' ) }
							</p>
						</div>
						<Primary_button
							type="button"
							onClick={ saveTeamAccess }
							text={ teamSaveState === 'saving' ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Team Access', 'captain-live-chat' ) }
							loader={ teamSaveState === 'saving' }
						/>
					</div>

					{ teamSaveState === 'error' && (
						<div className="captlc-notice captlc-notice--error" role="alert">
							{ teamErrorMsg }
							<button
								type="button"
								className="captlc-notice__close"
								onClick={ () => setTeamSaveState( 'idle' ) }
								aria-label={ __( 'Dismiss', 'captain-live-chat' ) }
							>✕</button>
						</div>
					) }
					{ teamSaveState === 'saved' && (
						<div className="captlc-notice captlc-notice--success" role="status">
							{ __( 'Team access saved.', 'captain-live-chat' ) }
						</div>
					) }

					<div className="captlc-team-access__list">
						<div className="captlc-team-access__row captlc-team-access__row--head">
							<span></span>
							<span>{ __( 'User', 'captain-live-chat' ) }</span>
							<span>{ __( 'Email', 'captain-live-chat' ) }</span>
							<span>{ __( 'Page Access', 'captain-live-chat' ) }</span>
						</div>

						{ teamUsers.length === 0 && (
							<p className="captlc-team-access__empty">{ __( 'No other users found.', 'captain-live-chat' ) }</p>
						) }

						{ teamUsers.map( ( user ) => {
							const allowed = allowedUserIds.includes( user.id );
							return (
								<div key={ user.id } className="captlc-team-access__row">
									<label className="captlc-checkbox captlc-team-access__checkbox">
										<input
											type="checkbox"
											checked={ allowed }
											onChange={ () => toggleUserAllowed( user.id ) }
										/>
										<span className="captlc-checkbox__box"></span>
									</label>

									<div className="captlc-team-access__user">
										<span className="captlc-team-access__avatar">
											{ user.avatar
												? <img src={ user.avatar } alt="" />
												: ( user.name || '?' ).charAt( 0 ).toUpperCase() }
										</span>
										<span className="captlc-team-access__name">{ user.name }</span>
									</div>

									<span className="captlc-team-access__email">{ user.email }</span>

									<MultiSelect
										options={ optionalPages }
										value={ pageAccessMap[ user.id ] || [] }
										onChange={ ( pages ) => setUserPages( user.id, pages ) }
										disabled={ ! allowed }
										placeholder={ __( 'Base pages only', 'captain-live-chat' ) }
									/>
								</div>
							);
						} ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default Profile;
