import { useState, useRef, useEffect } from 'react';
import './multiselect.scss';
import { __, sprintf } from '@wordpress/i18n';

const IconChevron = () => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<polyline points="6 9 12 15 18 9"/>
	</svg>
);

/**
 * A dropdown that opens a checkbox list, for picking several options from a
 * small fixed set (e.g. "which pages can this agent open").
 *
 * @param {Object}   props
 * @param {Array<{value:string,label:string}>} props.options   All selectable options.
 * @param {Array<string>} props.value                          Currently selected option values.
 * @param {(next: Array<string>) => void}       props.onChange  Called with the new selection.
 * @param {boolean}  [props.disabled]  Disables the trigger entirely.
 * @param {string}   [props.placeholder]  Shown on the trigger when nothing is selected.
 */
const MultiSelect = ( { options = [], value = [], onChange = () => {}, disabled = false, placeholder = '' } ) => {
	const [ open, setOpen ] = useState( false );
	const rootRef = useRef( null );

	useEffect( () => {
		const onClickOutside = ( e ) => {
			if ( rootRef.current && ! rootRef.current.contains( e.target ) ) {
				setOpen( false );
			}
		};
		document.addEventListener( 'mousedown', onClickOutside );
		return () => document.removeEventListener( 'mousedown', onClickOutside );
	}, [] );

	const toggleValue = ( optValue ) => {
		const next = value.includes( optValue )
			? value.filter( ( v ) => v !== optValue )
			: [ ...value, optValue ];
		onChange( next );
	};

	const summary = value.length === 0
		? ( placeholder || __( 'None selected', 'captain-live-chat' ) )
		: value.length === options.length
			? __( 'All pages', 'captain-live-chat' )
			: sprintf(
				/* translators: %d: number of selected pages */
				__( '%d pages selected', 'captain-live-chat' ),
				value.length
			);

	return (
		<div className={ `captlc-multiselect${ disabled ? ' captlc-multiselect--disabled' : '' }` } ref={ rootRef }>
			<button
				type="button"
				className="captlc-multiselect__trigger"
				onClick={ () => ! disabled && setOpen( ( o ) => ! o ) }
				disabled={ disabled }
			>
				<span className="captlc-multiselect__summary">{ summary }</span>
				<span className={ `captlc-multiselect__chevron${ open ? ' is-open' : '' }` }><IconChevron /></span>
			</button>

			{ open && ! disabled && (
				<div className="captlc-multiselect__panel">
					{ options.map( ( opt ) => (
						<label key={ opt.value } className="captlc-multiselect__option">
							<input
								type="checkbox"
								checked={ value.includes( opt.value ) }
								onChange={ () => toggleValue( opt.value ) }
							/>
							<span className="captlc-multiselect__box"></span>
							<span className="captlc-multiselect__label">{ opt.label }</span>
						</label>
					) ) }
				</div>
			) }
		</div>
	);
};

export default MultiSelect;
