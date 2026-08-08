import React, { useState } from 'react';
import './navigation.scss';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, toggleSidebar } from '../../redux/slice.jsx';
import { __ } from '@wordpress/i18n';

const PLUGIN_VERSION = ( typeof captlc_data !== 'undefined' && captlc_data?.captlc_version )
	? captlc_data.captlc_version
	: '1.0.0';

// ── Icon helpers ────────────────────────────────────────────────────────
const IconDashboard = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
		<rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
	</svg>
);
const IconSettings = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="3"/>
		<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
	</svg>
);
const IconCanned = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
		<line x1="9" y1="10" x2="15" y2="10"/>
	</svg>
);
const IconHistory = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="1 4 1 10 7 10"/>
		<path d="M3.51 15a9 9 0 1 0 .49-3.31"/>
		<polyline points="12 7 12 12 15 15"/>
	</svg>
);
const IconAI = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
		<circle cx="9" cy="14" r="1" fill="currentColor"/>
		<circle cx="15" cy="14" r="1" fill="currentColor"/>
	</svg>
);
const LogoMark = () => (
	<span className="captlc-nav-logo-mark">CLC</span>
);
const ThemeToggle = ( { theme, dispatch } ) => (
	<button
		type="button"
		className="captlc-dm-toggle"
		title={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-live-chat' ) : __( 'Switch to Dark Mode', 'captain-live-chat' ) }
		aria-label={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-live-chat' ) : __( 'Switch to Dark Mode', 'captain-live-chat' ) }
		onClick={ () => dispatch( toggleTheme() ) }
	>
		<svg className="captlc-dm-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
		</svg>
		<svg className="captlc-dm-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="12" r="5"/>
			<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
			<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
		</svg>
	</button>
);
const IconHamburger = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
		<line x1="3" y1="6"  x2="21" y2="6"/>
		<line x1="3" y1="12" x2="21" y2="12"/>
		<line x1="3" y1="18" x2="21" y2="18"/>
	</svg>
);
const IconClose = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
		<line x1="18" y1="6"  x2="6"  y2="18"/>
		<line x1="6"  y1="6"  x2="18" y2="18"/>
	</svg>
);
const IconSidebarToggle = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect x="3" y="4" width="18" height="16" rx="2"/>
		<line x1="10" y1="4" x2="10" y2="20"/>
	</svg>
);

// ── Main navigation ─────────────────────────────────────────────────────
const Navigation = () => {
	const location = useLocation();
	const dispatch = useDispatch();
	const theme = useSelector( ( state ) => state.theme );
	const sidebarCollapsed = useSelector( ( state ) => state.sidebarCollapsed );
	const [ mobileOpen, setMobileOpen ] = useState( false );
	const sidebarStateClass = sidebarCollapsed ? ' captlc-navigation-sidebar--collapsed' : '';

	const closeMobile = () => setMobileOpen( false );

	const isActive = ( path ) => {
		if ( path === '/' ) return location.pathname === '/';
		return location.pathname.startsWith( path );
	};

	const linkClass = ( path ) =>
		`captlc-nav-link ${ isActive( path ) ? 'captlc-nav-link--active' : '' }`;

	return (
		<>
			<button
				className={ `captlc-hamburger${ mobileOpen ? ' captlc-hamburger--hidden' : '' }` }
				aria-label={ __( 'Toggle navigation menu', 'captain-live-chat' ) }
				aria-expanded={ mobileOpen }
				onClick={ () => setMobileOpen( ( o ) => ! o ) }
			>
				{ mobileOpen ? <IconClose /> : <IconHamburger /> }
			</button>
			{ mobileOpen && <div className="captlc-nav-overlay" onClick={ closeMobile } aria-hidden="true" /> }
			<div className={ `captlc-navigation-sidebar${ sidebarStateClass }${ mobileOpen ? ' captlc-nav--open' : '' }` }>

				{ /* ── Logo ── */ }
				<div className="captlc-navigation-sidebar-logo">
					<span className="captlc-nav-logo-icon"><LogoMark /></span>
					<h3>{ __( 'Captain Live Chat', 'captain-live-chat' ) }</h3>
					<button
						type="button"
						className="captlc-nav-collapse-btn"
						title={ sidebarCollapsed ? __( 'Expand sidebar', 'captain-live-chat' ) : __( 'Collapse sidebar', 'captain-live-chat' ) }
						aria-label={ sidebarCollapsed ? __( 'Expand sidebar', 'captain-live-chat' ) : __( 'Collapse sidebar', 'captain-live-chat' ) }
						onClick={ () => dispatch( toggleSidebar() ) }
					>
						<IconSidebarToggle />
					</button>
				</div>

				{ /* ── Menu ── */ }
				<nav className="captlc-navigation-sidebar-menu">
					<Link to="/" className={ linkClass( '/' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconDashboard /></span>
						<span className="captlc-nav-label">{ __( 'Dashboard', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/settings" className={ linkClass( '/settings' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconSettings /></span>
						<span className="captlc-nav-label">{ __( 'Settings', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/canned-replies" className={ linkClass( '/canned-replies' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconCanned /></span>
						<span className="captlc-nav-label">{ __( 'Canned Replies', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/history" className={ linkClass( '/history' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconHistory /></span>
						<span className="captlc-nav-label">{ __( 'History', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/ai-settings" className={ linkClass( '/ai-settings' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconAI /></span>
						<span className="captlc-nav-label">{ __( 'AI Auto-Reply', 'captain-live-chat' ) }</span>
					</Link>
				</nav>

				{ /* ── Footer version ── */ }
				<div className="captlc-navigation-sidebar-footer">
					<span className="captlc-nav-version">
						{ __( 'VERSION', 'captain-live-chat' ) } : { PLUGIN_VERSION }
					</span>
					<ThemeToggle theme={ theme } dispatch={ dispatch } />
				</div>

			</div>
		</>
	);
};

export default Navigation;
