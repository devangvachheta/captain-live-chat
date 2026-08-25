import React, { useState, useEffect, useRef } from 'react';
import './analytics.scss';
import { __ } from '@wordpress/i18n';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

// ── Format seconds to human-readable ─────────────────────────────────────
const formatTime = ( secs ) => {
	if ( ! secs ) return '—';
	if ( secs < 60 ) return `${ secs }s`;
	if ( secs < 3600 ) return `${ Math.round( secs / 60 ) }m`;
	return `${ Math.round( secs / 3600 ) }h`;
};

// ── Stat card ─────────────────────────────────────────────────────────────
const StatCard = ( { label, value, sub, color, icon } ) => (
	<div className="captlc-stat-card">
		<div className="captlc-stat-card__icon" style={ { background: color + '22', color } }>
			{ icon }
		</div>
		<div className="captlc-stat-card__body">
			<div className="captlc-stat-card__value">{ value }</div>
			<div className="captlc-stat-card__label">{ label }</div>
			{ sub && <div className="captlc-stat-card__sub">{ sub }</div> }
		</div>
	</div>
);

// ── Bar chart (vanilla canvas — no library) ───────────────────────────────
const BarChart = ( { data, label } ) => {
	const canvasRef = useRef( null );

	useEffect( () => {
		const canvas = canvasRef.current;
		if ( ! canvas || ! data ) return;

		const ctx    = canvas.getContext( '2d' );
		const W      = canvas.offsetWidth || 600;
		const H      = 180;
		canvas.width  = W * window.devicePixelRatio;
		canvas.height = H * window.devicePixelRatio;
		ctx.scale( window.devicePixelRatio, window.devicePixelRatio );

		const vals   = Object.values( data );
		const labels = Object.keys( data );
		const max    = Math.max( ...vals, 1 );
		const pad    = { top: 16, right: 12, bottom: 32, left: 12 };
		const barW   = ( W - pad.left - pad.right ) / vals.length;
		const gap    = Math.max( 2, barW * 0.18 );

		// Theme-aware colors.
		const isDark = document.querySelector( '[data-captlc-theme="dark"]' );
		const barColor   = '#2f6ef0';
		const textColor  = isDark ? '#8992ab' : '#9ca3af';
		const gridColor  = isDark ? '#232b40' : '#f0f0f0';

		ctx.clearRect( 0, 0, W, H );

		// Grid lines (3 horizontal).
		ctx.strokeStyle = gridColor;
		ctx.lineWidth   = 1;
		for ( let i = 1; i <= 3; i++ ) {
			const y = pad.top + ( ( H - pad.top - pad.bottom ) / 3 ) * i;
			ctx.beginPath();
			ctx.moveTo( pad.left, y );
			ctx.lineTo( W - pad.right, y );
			ctx.stroke();
		}

		// Bars.
		vals.forEach( ( v, i ) => {
			const barH   = ( ( H - pad.top - pad.bottom ) * v ) / max;
			const x      = pad.left + i * barW + gap / 2;
			const y      = H - pad.bottom - barH;
			const bWidth = barW - gap;

			ctx.beginPath();
			ctx.roundRect( x, y, bWidth, barH, [ 4, 4, 0, 0 ] );
			ctx.fillStyle = barColor;
			ctx.fill();
		} );

		// X-axis labels (every 3 hours for hourly, every 2 for daily).
		ctx.fillStyle  = textColor;
		ctx.font       = `${ 10 * window.devicePixelRatio }px sans-serif`;
		ctx.textAlign  = 'center';
		ctx.scale( 1 / window.devicePixelRatio, 1 / window.devicePixelRatio );
		const step = labels.length > 20 ? 3 : 2;
		labels.forEach( ( lbl, i ) => {
			if ( i % step !== 0 ) return;
			const x = ( pad.left + i * barW + barW / 2 ) * window.devicePixelRatio;
			ctx.fillText( lbl, x, ( H - 8 ) * window.devicePixelRatio );
		} );
	}, [ data ] );

	return (
		<div className="captlc-chart-wrap">
			{ label && <div className="captlc-chart__label">{ label }</div> }
			<canvas ref={ canvasRef } className="captlc-chart-canvas" style={ { width: '100%', height: 180 } }></canvas>
		</div>
	);
};

// ── Mini donut / ratio bar ─────────────────────────────────────────────────
const RatioBar = ( { open, closed } ) => {
	const total = open + closed || 1;
	const pct   = Math.round( ( open / total ) * 100 );
	return (
		<div className="captlc-ratio">
			<div className="captlc-ratio__bar">
				<div className="captlc-ratio__fill captlc-ratio__fill--open" style={ { width: `${ pct }%` } }></div>
				<div className="captlc-ratio__fill captlc-ratio__fill--closed" style={ { width: `${ 100 - pct }%` } }></div>
			</div>
			<div className="captlc-ratio__legend">
				<span><span className="captlc-ratio__dot captlc-ratio__dot--open"></span>{ __( 'Open', 'captain-live-chat' ) } — { open }</span>
				<span><span className="captlc-ratio__dot captlc-ratio__dot--closed"></span>{ __( 'Closed', 'captain-live-chat' ) } — { closed }</span>
			</div>
		</div>
	);
};

// ── Hourly labels: 0–23 → "12am", "1am" … ────────────────────────────────
const hourLabel = ( h ) => {
	if ( h === 0 )  return '12am';
	if ( h < 12 )   return `${ h }am`;
	if ( h === 12 ) return '12pm';
	return `${ h - 12 }pm`;
};

// ── Main Analytics page ───────────────────────────────────────────────────
const Analytics = () => {
	const [ data, setData ]       = useState( null );
	const [ loading, setLoading ] = useState( true );
	const [ range, setRange ]     = useState( 'week' );

	useEffect( () => {
		setLoading( true );
		ajax( 'captlc_get_analytics', { range } )
			.then( ( res ) => { if ( res?.success ) setData( res.data ); } )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
	}, [ range ] );

	if ( loading && ! data ) return <div className="captlc-analytics-loading">{ __( 'Loading analytics…', 'captain-live-chat' ) }</div>;

	if ( ! data ) return <div className="captlc-analytics-loading">{ __( 'No data available.', 'captain-live-chat' ) }</div>;

	// Convert hourly array to label:value object.
	const hourlyData = {};
	data.hourly.forEach( ( cnt, h ) => { hourlyData[ hourLabel( h ) ] = cnt; } );

	const trendLabel = {
		week:  __( 'Chats — Last 7 Days', 'captain-live-chat' ),
		month: __( 'Chats — Last 30 Days', 'captain-live-chat' ),
		year:  __( 'Chats — Last 12 Months', 'captain-live-chat' ),
	}[ range ];

	return (
		<div className="captlc-analytics">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Analytics', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Overview of your live chat performance.', 'captain-live-chat' ) }</p>
				</div>
				<div className="captlc-analytics-range">
					{ [
						{ id: 'week',  label: __( 'Week', 'captain-live-chat' ) },
						{ id: 'month', label: __( 'Month', 'captain-live-chat' ) },
						{ id: 'year',  label: __( 'Year', 'captain-live-chat' ) },
					].map( ( r ) => (
						<button
							key={ r.id }
							type="button"
							className={ `captlc-analytics-range__btn${ range === r.id ? ' is-active' : '' }` }
							onClick={ () => setRange( r.id ) }
						>
							{ r.label }
						</button>
					) ) }
				</div>
			</div>

			{ /* ── Stat cards ── */ }
			<div className="captlc-stat-grid">
				<StatCard
					label={ __( 'Chats Today', 'captain-live-chat' ) }
					value={ data.totals.today }
					color="#2f6ef0"
					icon={ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
				/>
				<StatCard
					label={ __( 'This Week', 'captain-live-chat' ) }
					value={ data.totals.week }
					color="#10b981"
					icon={ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
				/>
				<StatCard
					label={ __( 'This Month', 'captain-live-chat' ) }
					value={ data.totals.month }
					color="#8b5cf6"
					icon={ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
				/>
				<StatCard
					label={ __( 'Avg Response', 'captain-live-chat' ) }
					value={ formatTime( data.response_time ) }
					sub={ __( 'first reply time', 'captain-live-chat' ) }
					color="#f97316"
					icon={ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
				/>
				<StatCard
					label={ __( 'Total All Time', 'captain-live-chat' ) }
					value={ data.totals.total }
					color="#ec4899"
					icon={ <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> }
				/>
			</div>

			{ /* ── Charts row ── */ }
			<div className="captlc-charts-grid">
				<div className="captlc-card">
					<BarChart data={ data.trend } label={ trendLabel } />
				</div>
				<div className="captlc-card">
					<BarChart data={ hourlyData } label={ __( 'Most Active Hours (last 30 days)', 'captain-live-chat' ) } />
				</div>
			</div>

			{ /* ── Open/Closed ratio ── */ }
			<div className="captlc-card">
				<h2 className="captlc-card__title">{ __( 'Open vs Closed Ratio', 'captain-live-chat' ) }</h2>
				<RatioBar open={ data.status_ratio.open } closed={ data.status_ratio.closed } />
			</div>

			{ /* ── Agent stats ── */ }
			{ data.agent_stats.length > 0 && (
				<div className="captlc-card">
					<h2 className="captlc-card__title">{ __( 'Agent Replies', 'captain-live-chat' ) }</h2>
					<p className="captlc-card__desc">{ __( 'Total replies sent per agent (all time).', 'captain-live-chat' ) }</p>
					<div className="captlc-agent-stats">
						{ data.agent_stats.map( ( agent, i ) => {
							const max = data.agent_stats[ 0 ].replies;
							return (
								<div key={ i } className="captlc-agent-stat-row">
									<div className="captlc-agent-stat-row__avatar">
										{ agent.name.charAt( 0 ).toUpperCase() }
									</div>
									<div className="captlc-agent-stat-row__body">
										<div className="captlc-agent-stat-row__name">{ agent.name }</div>
										<div className="captlc-agent-stat-row__bar">
											<div
												className="captlc-agent-stat-row__fill"
												style={ { width: `${ ( agent.replies / max ) * 100 }%` } }
											></div>
										</div>
									</div>
									<div className="captlc-agent-stat-row__count">{ agent.replies }</div>
								</div>
							);
						} ) }
					</div>
				</div>
			) }
		</div>
	);
};

export default Analytics;
