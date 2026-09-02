import React, { useState, useEffect } from 'react';
import './schedule_editor.scss';
import { __ } from '@wordpress/i18n';
import Switcher from '../switcher/switcher.jsx';
import Primary_button from '../button/primary_button/primary_button.jsx';

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
	enabled:  true,
	timezone: 'UTC',
	days: Object.fromEntries( DAYS.map( ( d ) => [
		d.id,
		{ active: [ 'monday','tuesday','wednesday','thursday','friday' ].includes( d.id ), from: '09:00', to: '18:00' },
	] ) ),
};

/**
 * Reusable weekly schedule editor. This is the same underlying
 * captlc_get_schedule / captlc_save_schedule storage the old standalone
 * "Agent Schedule" page used — it's shared across all agents, and this
 * editor is now embedded in Profile under Availability → Custom.
 */
const ScheduleEditor = () => {
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
		ajax( 'captlc_save_schedule', { schedule: JSON.stringify( { ...schedule, enabled: true } ) } )
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

	if ( loading ) return <div className="captlc-schedule-editor-loading">{ __( 'Loading…', 'captain-live-chat' ) }</div>;

	return (
		<div className="captlc-schedule-editor">
			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` }>{ notice.msg }</div>
			) }

			<div className="captlc-schedule-editor__timezone">
				<label className="captlc-field__label" htmlFor="captlc-schedule-editor-timezone">{ __( 'Timezone', 'captain-live-chat' ) }</label>
				<input
					id="captlc-schedule-editor-timezone"
					type="text"
					className="captlc-input-field captlc-schedule-editor__tz-input"
					value={ schedule.timezone }
					onChange={ ( e ) => setSchedule( ( p ) => ( { ...p, timezone: e.target.value } ) ) }
					placeholder="Asia/Kolkata"
				/>
				<p className="captlc-field__hint">
					{ __( 'Use PHP timezone format, e.g. Asia/Kolkata, America/New_York, Europe/London', 'captain-live-chat' ) }
				</p>
			</div>

			<div className="captlc-schedule-editor__days">
				{ DAYS.map( ( day ) => {
					const cfg = schedule.days[ day.id ] || { active: false, from: '09:00', to: '18:00' };
					return (
						<div key={ day.id } className={ `captlc-schedule-editor__day${ cfg.active ? ' is-active' : '' }` }>
							<label className="captlc-schedule-editor__day-toggle">
								<Switcher
									checked={ cfg.active }
									onChange={ ( e ) => updateDay( day.id, 'active', e.target.checked ) }
								/>
								<span className="captlc-schedule-editor__day-name">{ day.label }</span>
							</label>

							{ cfg.active && (
								<div className="captlc-schedule-editor__time-row">
									<input
										type="time"
										className="captlc-input-field captlc-schedule-editor__time-input"
										value={ cfg.from }
										onChange={ ( e ) => updateDay( day.id, 'from', e.target.value ) }
									/>
									<span className="captlc-schedule-editor__time-sep">{ __( 'to', 'captain-live-chat' ) }</span>
									<input
										type="time"
										className="captlc-input-field captlc-schedule-editor__time-input"
										value={ cfg.to }
										onChange={ ( e ) => updateDay( day.id, 'to', e.target.value ) }
									/>
								</div>
							) }

							{ ! cfg.active && (
								<span className="captlc-schedule-editor__day-off">{ __( 'Off', 'captain-live-chat' ) }</span>
							) }
						</div>
					);
				} ) }
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

export default ScheduleEditor;
