import { forwardRef } from 'react';
import './switcher.scss';

const Switcher = forwardRef( ( { checked, onChange, uncontrolled = false, htmlFor = '' }, ref ) => {

	if ( uncontrolled ) {
		return (
			<label className="captlc-switcher" htmlFor={ htmlFor }>
				<input type="checkbox" className="captlc-switcher-input" id={ htmlFor } ref={ ref } />
				<span className="captlc-switcher-slider"></span>
			</label>
		);
	}

	return (
		<label className="captlc-switcher">
			<input
				type="checkbox"
				className="captlc-switcher-input"
				checked={ checked }
				onChange={ onChange }
			/>
			<span className="captlc-switcher-slider"></span>
		</label>
	);
} );

export default Switcher;
