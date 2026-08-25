import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import routes from './router/routes.js';
import Navigation from './page/navigation/navigation.jsx';

const AppContent = () => {
	const location = useLocation();
	const theme = useSelector( ( state ) => state.theme );
	const sidebarCollapsed = useSelector( ( state ) => state.sidebarCollapsed );

	// Reset scroll to top whenever the route changes — otherwise the page
	// keeps whatever scroll position the previous page was left at, and
	// people have to scroll back up manually after every menu click.
	useEffect( () => {
		window.scrollTo( 0, 0 );
		const main = document.querySelector( '.captlc-app-main-content' );
		if ( main ) main.scrollTop = 0;
	}, [ location.pathname ] );

	// Apply data-captlc-theme on the root wrapper — CSS vars cascade from here.
	useEffect( () => {
		const el = document.getElementById( 'captain-live-chat-app' );
		if ( el ) {
			el.setAttribute( 'data-captlc-theme', theme );
		}
	}, [ theme ] );

	return (
		<div
			className="captain-app"
			data-captlc-theme={ theme }
			data-captlc-sidebar={ sidebarCollapsed ? 'collapsed' : 'expanded' }
		>
			<Navigation />
			<div
				className={ `captlc-app-main-content${
					sidebarCollapsed ? ' captlc-app-main-content--collapsed' : ''
				}` }
			>
				<Routes>
					{ routes.map( ( route, index ) => (
						<Route key={ index } path={ route.path } element={ route.element } />
					) ) }
				</Routes>
			</div>
		</div>
	);
};

const Captain_app = () => {
	return (
		<HashRouter>
			<AppContent />
		</HashRouter>
	);
};

export default Captain_app;
