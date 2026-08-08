import React, { useState, useRef, useEffect } from 'react';
import './emoji_picker.scss';

// Curated emoji set — grouped by category, no external library needed.
const EMOJI_GROUPS = [
	{
		label: '😊 Smileys',
		emojis: [
			'😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
			'😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
			'😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
			'😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔',
			'😪','🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶',
			'😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁',
			'☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰',
			'😥','😢','😭','😱','😖','😣','😞','😓','😩','😫',
			'🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩',
		],
	},
	{
		label: '👋 People',
		emojis: [
			'👋','🤚','🖐','✋','🖖','👌','🤌','✌️','🤞','🤟',
			'🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎',
			'✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏',
			'💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃',
			'🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋',
		],
	},
	{
		label: '❤️ Hearts',
		emojis: [
			'❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
			'❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
			'✝️','☯️','🕊','🙏','💫','⭐','🌟','✨','🎇','🎆',
		],
	},
	{
		label: '🎉 Fun',
		emojis: [
			'🎉','🎊','🎈','🎁','🎀','🎗','🎟','🎫','🏆','🥇',
			'🥈','🥉','🏅','🎖','🏵','🎪','🤹','🎭','🎨','🎬',
			'🎤','🎧','🎼','🎵','🎶','🎹','🥁','🪘','🎷','🎺',
			'🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🕹','🎰',
		],
	},
	{
		label: '👍 Common',
		emojis: [
			'👍','👎','👌','✅','❌','⚠️','🔥','💯','🆗','🆕',
			'🆙','🆒','🆓','🆖','📌','📍','🔗','📎','✏️','📝',
			'📋','📂','📁','🗂','📅','📆','🗒','🗓','📊','📈',
			'📉','📄','📃','📑','📊','🔍','🔎','🔒','🔓','🔑',
		],
	},
];

const EmojiPicker = ( { onSelect, isOpen, onClose } ) => {
	const [ activeGroup, setActiveGroup ] = useState( 0 );
	const [ search, setSearch ] = useState( '' );
	const pickerRef = useRef( null );

	// Close on outside click.
	useEffect( () => {
		if ( ! isOpen ) return;

		const handleClick = ( e ) => {
			if ( pickerRef.current && ! pickerRef.current.contains( e.target ) ) {
				onClose();
			}
		};

		document.addEventListener( 'mousedown', handleClick );
		return () => document.removeEventListener( 'mousedown', handleClick );
	}, [ isOpen, onClose ] );

	if ( ! isOpen ) return null;

	const filteredEmojis = search.trim()
		? EMOJI_GROUPS.flatMap( ( g ) => g.emojis ).filter( ( e ) => {
			// Simple codepoint search — works for most emoji.
			return e.includes( search );
		} )
		: EMOJI_GROUPS[ activeGroup ].emojis;

	return (
		<div className="captlc-emoji-picker" ref={ pickerRef }>
			<div className="captlc-emoji-picker__search">
				<input
					type="text"
					placeholder="Search emoji…"
					value={ search }
					onChange={ ( e ) => setSearch( e.target.value ) }
					className="captlc-emoji-picker__search-input"
					autoFocus
				/>
			</div>

			{ ! search && (
				<div className="captlc-emoji-picker__tabs">
					{ EMOJI_GROUPS.map( ( group, i ) => (
						<button
							key={ i }
							type="button"
							className={ `captlc-emoji-picker__tab${ activeGroup === i ? ' is-active' : '' }` }
							onClick={ () => setActiveGroup( i ) }
							title={ group.label }
						>
							{ group.emojis[ 0 ] }
						</button>
					) ) }
				</div>
			) }

			<div className="captlc-emoji-picker__grid">
				{ filteredEmojis.length === 0 && (
					<div className="captlc-emoji-picker__empty">No emoji found</div>
				) }
				{ filteredEmojis.map( ( emoji, i ) => (
					<button
						key={ i }
						type="button"
						className="captlc-emoji-picker__emoji"
						onClick={ () => {
							onSelect( emoji );
							onClose();
						} }
						title={ emoji }
					>
						{ emoji }
					</button>
				) ) }
			</div>
		</div>
	);
};

export default EmojiPicker;
