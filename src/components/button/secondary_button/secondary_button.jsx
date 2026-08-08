import './secondary_button.scss';
import Loader from '../../loader/loader.jsx';

const Secondary_button = ( { text = '', loader = false, onClick, disabled = false, type = 'button' } ) => {
	return (
		<button
			type={ type }
			className="captlc-secondary-button"
			onClick={ () => { if ( onClick ) onClick(); } }
			disabled={ disabled || loader }
		>
			{ text }
			{ loader && <Loader /> }
		</button>
	);
};

export default Secondary_button;
