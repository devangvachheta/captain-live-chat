import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store.js';
import Captain_app from './captain_app.js';
import './style/global.scss';

const container = document.getElementById( 'captain-live-chat-app' );

if ( container ) {

	// Create a root for React to render into.
	const root = createRoot( container );

	root.render(
		<Provider store={ store }>
			<Captain_app />
		</Provider>
	);
}
