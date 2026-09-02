import React, { useState, useEffect } from 'react';
import './schedule.scss';
import { __ } from '@wordpress/i18n';
import Switcher from '../../components/switcher/switcher.jsx';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

const DAYS = [
	{ id: 'monday',    label: __( 'Monday',    'captain-live-chat' ) },
	{ id: 'tuesday',   label: __( 'Tuesday',   'captain-live-chat' ) },
	{ id: 'wednesday', label: __( 'Wednesday', 'captain-live-chat' ) },
	{ id: 'thursday',  label: __( 'Thursday',  'captain-live-chat' ) },
	{ id: 'friday',    label: __( 'Friday',    'captain-live-chat' ) },
	{ id: 'saturday',  label: __( 'Saturday',  'captain-live-chat' ) },
	{ id: 'sunday',    label: __( 'Sunday',    'captain-live-chat' ) },
];

const DEFAULT_SCHEDULE = {
	enabled:  false,
	timezone: 'UTC',
	days: Object.fromEntries( DAYS.map( ( d ) => [
		d.id,
		{ active: [ 'monday','tuesday','wednesday','thursday','friday' ].includes( d.id ), from: '09:00', to: '18:00' },
	] ) ),
};

const Schedule = () => {
	const [ schedule, setSchedule ] = useState( DEFAULT_SCHEDULE );
	const [ loading, setLoading ]   = useState( true );
	const [ saving, setSaving ]     = useState( false );
	const [ notice, setNotice ]     = useState( null );

	useEffect( () => {
		ajax( 'captlc_get_schedule' ).then( ( res ) => {
			if ( res?.success ) setSchedule( res.data.schedule );
		} ).catch( () => {} ).finally( () => setLoading( false ) );
	}, [] );

	const updateDay = ( day, field, value ) => {
		setSchedule( ( prev ) => ( {
			...prev,
			days: { ...prev.days, [ day ]: { ...prev.days[ day ], [ field ]: value } },
		} ) );
	};

	const handleSave = () => {
		setSaving( true );
		setNotice( null );
		ajax( 'captlc_save_schedule', { schedule: JSON.stringify( schedule ) } )
			.then( ( res ) => {
				if ( res?.success ) {
					setNotice( { type: 'success', msg: __( 'Schedule saved and applied.', 'captain-live-chat' ) } );
					setTimeout( () => setNotice( null ), 3500 );
				} else {
					setNotice( { type: 'error', msg: res?.data?.message || __( 'Save failed.', 'captain-live-chat' ) } );
				}
			} )
			.catch( () => setNotice( { type: 'error', msg: __( 'Network error.', 'captain-live-chat' ) } ) )
			.finally( () => setSaving( false ) );
	};

	if ( loading ) return <div className="captlc-schedule-loading">{ __( 'Loading…', 'captain-live-chat' ) }</div>;

	return (
		<div className="captlc-schedule">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Agent Schedule', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Set when agents are automatically marked online or offline.', 'captain-live-chat' ) }</p>
				</div>
			</div>

			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` }>{ notice.msg }</div>
			) }

			<div className="captlc-card">
				<div className="captlc-schedule__enable-row">
					<label className="captlc-toggle-row">
						<Switcher
							checked={ schedule.enabled }
							onChange={ ( e ) => setSchedule( ( p ) => ( { ...p, enabled: e.target.checked } ) ) }
						/>
						<div>
							<div style={ { fontWeight: 600, fontSize: 14 } }>{ __( 'Enable Automatic Schedule', 'captain-live-chat' ) }</div>
							<div style={ { fontSize: 12, color: 'var(--captlc-text-muted)', marginTop: 2 } }>
								{ __( 'Agents will be auto set online/offline based on the schedule below.', 'captain-live-chat' ) }
							</div>
						</div>
					</label>
				</div>

				{ schedule.enabled && (
					<>
						<div className="captlc-schedule__timezone">
							<label className="captlc-field__label" htmlFor="captlc-schedule-timezone">{ __( 'Timezone', 'captain-live-chat' ) }</label>
							<input
								id="captlc-schedule-timezone"
								type="text"
								className="captlc-input-field captlc-schedule__tz-input"
								value={ schedule.timezone }
								onChange={ ( e ) => setSchedule( ( p ) => ( { ...p, timezone: e.target.value } ) ) }
								placeholder="Asia/Kolkata"
							/>
							<p className="captlc-field__hint">
								{ __( 'Use PHP timezone format, e.g. Asia/Kolkata, America/New_York, Europe/London', 'captain-live-chat' ) }
							</p>
						</div>

						<div className="captlc-schedule__days">
							{ DAYS.map( ( day ) => {
								const cfg = schedule.days[ day.id ] || { active: false, from: '09:00', to: '18:00' };
								return (
									<div key={ day.id } className={ `captlc-schedule__day${ cfg.active ? ' is-active' : '' }` }>
										<label className="captlc-schedule__day-toggle">
											<Switcher
												checked={ cfg.active }
												onChange={ ( e ) => updateDay( day.id, 'active', e.target.checked ) }
											/>
											<span className="captlc-schedule__day-name">{ day.label }</span>
										</label>

										{ cfg.active && (
											<div className="captlc-schedule__time-row">
												<input
													type="time"
													className="captlc-input-field captlc-schedule__time-input"
													value={ cfg.from }
													onChange={ ( e ) => updateDay( day.id, 'from', e.target.value ) }
												/>
												<span className="captlc-schedule__time-sep">{ __( 'to', 'captain-live-chat' ) }</span>
												<input
													type="time"
													className="captlc-input-field captlc-schedule__time-input"
													value={ cfg.to }
													onChange={ ( e ) => updateDay( day.id, 'to', e.target.value ) }
												/>
											</div>
										) }

										{ ! cfg.active && (
											<span className="captlc-schedule__day-off">{ __( 'Off', 'captain-live-chat' ) }</span>
										) }
									</div>
								);
							} ) }
						</div>
					</>
				) }
			</div>

			<div className="captlc-form-actions">
				<Primary_button
					text={ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Schedule', 'captain-live-chat' ) }
					loader={ saving }
					onClick={ handleSave }
				/>
			</div>
		</div>
	);
};

export default Schedule;
