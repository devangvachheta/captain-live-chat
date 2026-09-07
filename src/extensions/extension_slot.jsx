import React, { useEffect, useState } from 'react';
import { getPage, EXTENSION_EVENT } from './registry.js';

/**
 * Renders an add-on-provided page for `slug` when one has registered
 * itself (see registry.js), otherwise renders `fallback`. Re-checks the
 * registry whenever a new page registers, so it works regardless of
 * whether the add-on's script finishes loading before or after this one
 * has already rendered.
 *
 * @param {{ slug: string, fallback: React.ReactNode }} props
 */
const ExtensionSlot = ( { slug, fallback } ) => {
	const [ , setTick ] = useState( 0 );

	useEffect( () => {
		const onRegistered = ( event ) => {
			if ( event?.detail?.slug === slug ) {
				setTick( ( n ) => n + 1 );
			}
		};
		window.addEventListener( EXTENSION_EVENT, onRegistered );
		return () => window.removeEventListener( EXTENSION_EVENT, onRegistered );
	}, [ slug ] );

	const Registered = getPage( slug );

	return Registered ? <Registered /> : fallback;
};

export default ExtensionSlot;
