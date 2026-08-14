import React, { useState, useEffect } from 'react';
import './navigation.scss';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, toggleSidebar } from '../../redux/slice.jsx';
import { __ } from '@wordpress/i18n';

const PLUGIN_VERSION = ( typeof captlc_data !== 'undefined' && captlc_data?.captlc_version )
	? captlc_data.captlc_version
	: '1.0.0';

// ── Icon helpers ────────────────────────────────────────────────────────
const IconInbox = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
const IconDesign = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<circle cx="12" cy="12" r="4"/>
		<line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/>
		<line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
		<line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/>
		<line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
	</svg>
);
const IconAnalytics = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="18" y1="20" x2="18" y2="10"/>
		<line x1="12" y1="20" x2="12" y2="4"/>
		<line x1="6"  y1="20" x2="6"  y2="14"/>
	</svg>
);
const IconSchedule = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<polyline points="12 6 12 12 16 14"/>
	</svg>
);
const IconHelp = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
		<line x1="12" y1="17" x2="12.01" y2="17"/>
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
const IconChevron = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="6 9 12 15 18 9"/>
	</svg>
);
const IconProfile = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
		<circle cx="12" cy="7" r="4" />
	</svg>
);

// ── Main navigation ─────────────────────────────────────────────────────
const Navigation = () => {
	const location = useLocation();
	const dispatch = useDispatch();
	const theme = useSelector( ( state ) => state.theme );
	const sidebarCollapsed = useSelector( ( state ) => state.sidebarCollapsed );
	const [ mobileOpen, setMobileOpen ] = useState( false );
	const [ generalOpen, setGeneralOpen ] = useState( true );
	const [ extraOpen, setExtraOpen ] = useState( true );
	const sidebarStateClass = sidebarCollapsed ? ' captlc-navigation-sidebar--collapsed' : '';

	const closeMobile = () => setMobileOpen( false );

	// Measures WP's own native admin-menu width (it can be default-width,
	// folded to icons-only, or hidden entirely on narrow screens) so our
	// fixed sidebar sits flush next to it instead of overlapping it.
	useEffect( () => {
		const wpMenu = document.getElementById( 'adminmenuwrap' ) || document.getElementById( 'adminmenu' );

		const measure = () => {
			const width = wpMenu && wpMenu.offsetParent !== null ? wpMenu.getBoundingClientRect().width : 0;
			document.documentElement.style.setProperty( '--captlc-wp-adminmenu-w', width + 'px' );
		};

		measure();

		const observer = ( 'ResizeObserver' in window ) ? new ResizeObserver( measure ) : null;
		if ( observer && wpMenu ) observer.observe( wpMenu );
		window.addEventListener( 'resize', measure );

		// WP core toggles a `folded` class on <body> when the menu is collapsed
		// (via JS, not a CSS transition we can hook into) — poll briefly after
		// any click as a cheap way to catch that state change too.
		document.body.addEventListener( 'click', measure );

		return () => {
			if ( observer ) observer.disconnect();
			window.removeEventListener( 'resize', measure );
			document.body.removeEventListener( 'click', measure );
		};
	}, [] );

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
					<div className="captlc-nav-logo-slot">
						<span className="captlc-nav-logo-icon"><LogoMark /></span>
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
					<h3>{ __( 'Captain Live Chat', 'captain-live-chat' ) }</h3>
				</div>

				{ /* ── Menu ── */ }
				<nav className="captlc-navigation-sidebar-menu">
					<Link to="/inbox" className={ linkClass( '/inbox' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconInbox /></span>
						<span className="captlc-nav-label">{ __( 'Inbox', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/ai-settings" className={ linkClass( '/ai-settings' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconAI /></span>
						<span className="captlc-nav-label">{ __( 'AI Agent', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/analytics" className={ linkClass( '/analytics' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconAnalytics /></span>
						<span className="captlc-nav-label">{ __( 'Analytics', 'captain-live-chat' ) }</span>
					</Link>

					<Link to="/settings" className={ linkClass( '/settings' ) } onClick={ closeMobile }>
						<span className="captlc-nav-icon"><IconSettings /></span>
						<span className="captlc-nav-label">{ __( 'Settings', 'captain-live-chat' ) }</span>
					</Link>

					<button
						type="button"
						className="captlc-nav-extra-toggle"
						onClick={ () => setGeneralOpen( ( v ) => ! v ) }
					>
						<span className="captlc-nav-extra-toggle__label">{ __( 'GENERAL', 'captain-live-chat' ) }</span>
						<span className={ `captlc-nav-extra-toggle__chevron${ generalOpen ? ' is-open' : '' }` }><IconChevron /></span>
					</button>

					{ generalOpen && (
						<div className="captlc-nav-extra-group">
							<Link to="/widget-designer" className={ linkClass( '/widget-designer' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconDesign /></span>
								<span className="captlc-nav-label">{ __( 'Widget Settings', 'captain-live-chat' ) }</span>
							</Link>

							<Link to="/profile" className={ linkClass( '/profile' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconProfile /></span>
								<span className="captlc-nav-label">{ __( 'Profile', 'captain-live-chat' ) }</span>
							</Link>

							<Link to="/canned-replies" className={ linkClass( '/canned-replies' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconCanned /></span>
								<span className="captlc-nav-label">{ __( 'Canned Responses', 'captain-live-chat' ) }</span>
							</Link>
						</div>
					) }

					<button
						type="button"
						className="captlc-nav-extra-toggle"
						onClick={ () => setExtraOpen( ( v ) => ! v ) }
					>
						<span className="captlc-nav-extra-toggle__label">{ __( 'EXTRA OPTIONS', 'captain-live-chat' ) }</span>
						<span className={ `captlc-nav-extra-toggle__chevron${ extraOpen ? ' is-open' : '' }` }><IconChevron /></span>
					</button>

					{ extraOpen && (
						<div className="captlc-nav-extra-group">
							<Link to="/schedule" className={ linkClass( '/schedule' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconSchedule /></span>
								<span className="captlc-nav-label">{ __( 'Agent Schedule', 'captain-live-chat' ) }</span>
							</Link>

							<Link to="/history" className={ linkClass( '/history' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconHistory /></span>
								<span className="captlc-nav-label">{ __( 'History', 'captain-live-chat' ) }</span>
							</Link>

							<Link to="/help" className={ linkClass( '/help' ) } onClick={ closeMobile }>
								<span className="captlc-nav-icon"><IconHelp /></span>
								<span className="captlc-nav-label">{ __( 'Help', 'captain-live-chat' ) }</span>
							</Link>
						</div>
					) }
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
