import { forwardRef } from 'react';
import './switcher.scss';

const Switcher = forwardRef( ( { checked, onChange, uncontrolled = false, htmlFor = '', disabled = false }, ref ) => {

	if ( uncontrolled ) {
		return (
			<label className={ `captlc-switcher${ disabled ? ' is-disabled' : '' }` } htmlFor={ htmlFor }>
				<input type="checkbox" className="captlc-switcher-input" id={ htmlFor } ref={ ref } disabled={ disabled } />
				<span className="captlc-switcher-slider"></span>
			</label>
		);
	}

	return (
		<label className={ `captlc-switcher${ disabled ? ' is-disabled' : '' }` }>
			<input
				type="checkbox"
				className="captlc-switcher-input"
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
			/>
			<span className="captlc-switcher-slider"></span>
		</label>
	);
} );

export default Switcher;
