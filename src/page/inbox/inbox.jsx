import React, { useState, useEffect, useRef, useCallback } from 'react';
import './inbox.scss';
import { __ } from '@wordpress/i18n';
import { useSelector, useDispatch } from 'react-redux';
import { setAgentOnline } from '../../redux/slice.jsx';
import Switcher from '../../components/switcher/switcher.jsx';
import Input from '../../components/input/Input.jsx';
import EmojiPicker from '../../components/emoji/emoji_picker.jsx';
import AttachmentUpload from '../../components/attachment/attachment.jsx';
const POLL_INTERVAL = ( typeof captlc_data !== 'undefined' && captlc_data?.poll_interval ) || 3000;

// ── Shared ajax helper with error propagation ────────────────────────────
const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( {
		action,
		nonce: captlc_data.nonce,
		...data,
	} );

	return fetch( captlc_data.ajax_url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( res ) => {
		if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
		return res.json();
	} );
};

// ── Toast notification component ─────────────────────────────────────────
const Toast = ( { message, type = 'error', onDismiss } ) => (
	<div className={ `captlc-toast captlc-toast--${ type }` } role="alert">
		<span>{ message }</span>
		<button type="button" className="captlc-toast__close" onClick={ onDismiss } aria-label={ __( 'Dismiss', 'captain-live-chat' ) }>✕</button>
	</div>
);

// ── Network status banner ─────────────────────────────────────────────────
const OfflineBanner = () => (
	<div className="captlc-offline-banner" role="status">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
		{ __( 'Connection lost — trying to reconnect…', 'captain-live-chat' ) }
	</div>
);

const Inbox = () => {
	const [ threads, setThreads ] = useState( [] );
	const [ activeThread, setActiveThread ] = useState( null );
	const [ messages, setMessages ] = useState( [] );
	const [ replyText, setReplyText ] = useState( '' );
	const dispatch = useDispatch();
	const isOnline = useSelector( ( state ) => state.agentOnline );
	const [ isTyping, setIsTyping ] = useState( false );
	const [ sendingReply, setSendingReply ] = useState( false );
	const [ toast, setToast ] = useState( null );
	const [ isNetworkDown, setIsNetworkDown ] = useState( false );
	const [ threadLoading, setThreadLoading ] = useState( true );
	const [ closingThread, setClosingThread ] = useState( false );
	const [ showEmoji, setShowEmoji ] = useState( false );
	const [ cannedSuggestions, setCannedSuggestions ] = useState( [] );
	const [ allCanned, setAllCanned ] = useState( [] );
	const [ activeTab, setActiveTab ] = useState( 'messages' ); // 'messages' | 'notes'
	const [ notes, setNotes ]         = useState( [] );
	const [ noteText, setNoteText ]   = useState( '' );
	const [ addingNote, setAddingNote ] = useState( false );
	const [ threadTags, setThreadTags ] = useState( [] );
	const [ tagInput, setTagInput ]   = useState( '' );
	const [ openMsgMenu, setOpenMsgMenu ] = useState( null ); // id of message whose (...) menu is open
	const [ shortcutModalMsg, setShortcutModalMsg ] = useState( null ); // message being saved as a canned shortcut
	const [ shortcutCode, setShortcutCode ] = useState( '' );
	const [ savingShortcut, setSavingShortcut ] = useState( false );
	const [ sidebarOpen, setSidebarOpen ] = useState( true );
	const [ listCollapsed, setListCollapsed ] = useState( false );
	const [ assignMenuOpen, setAssignMenuOpen ] = useState( false );
	const [ resolveMenuOpen, setResolveMenuOpen ] = useState( false );
	const [ commerce, setCommerce ] = useState( null );
	const [ customKey, setCustomKey ] = useState( '' );
	const [ customValue, setCustomValue ] = useState( '' );
	const [ addingCustom, setAddingCustom ] = useState( false );
	const [ savingCustom, setSavingCustom ] = useState( false );

	// Load canned replies once.
	useEffect( () => {
		ajax( 'captlc_get_canned_replies' ).then( ( res ) => {
			if ( res?.success ) setAllCanned( res.data.replies || [] );
		} ).catch( () => {} );
	}, [] );

	const lastMsgId       = useRef( 0 );
	const prevUnread      = useRef( {} );
	const isFirstLoad     = useRef( true );
	const messagesEndRef  = useRef( null );
	const lastTypingSent  = useRef( 0 );
	const failCount       = useRef( 0 );
	const replyInputRef   = useRef( null );

	// Close any open message (...) menu when clicking elsewhere.
	useEffect( () => {
		if ( ! openMsgMenu ) return;
		const close = () => setOpenMsgMenu( null );
		document.addEventListener( 'click', close );
		return () => document.removeEventListener( 'click', close );
	}, [ openMsgMenu ] );

	// Close the "Assign to" / "Resolve" dropdowns when clicking elsewhere.
	useEffect( () => {
		if ( ! assignMenuOpen && ! resolveMenuOpen ) return;
		const close = () => { setAssignMenuOpen( false ); setResolveMenuOpen( false ); };
		document.addEventListener( 'click', close );
		return () => document.removeEventListener( 'click', close );
	}, [ assignMenuOpen, resolveMenuOpen ] );

	// ── Toast helpers ────────────────────────────────────────────────────
	const showToast = useCallback( ( message, type = 'error' ) => {
		setToast( { message, type } );
		setTimeout( () => setToast( null ), 5000 );
	}, [] );

	// ── Sound + browser notification helpers ─────────────────────────────
	const playBeep = useCallback( () => {
		if ( ! captlc_data?.sound_enabled ) return;
		try {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			const ctx = new Ctx();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = 'sine';
			osc.frequency.value = 880;
			gain.gain.setValueAtTime( 0.15, ctx.currentTime );
			gain.gain.exponentialRampToValueAtTime( 0.001, ctx.currentTime + 0.35 );
			osc.connect( gain );
			gain.connect( ctx.destination );
			osc.start();
			osc.stop( ctx.currentTime + 0.35 );
		} catch ( e ) {}
	}, [] );

	const notify = useCallback( ( thread ) => {
		playBeep();
		if ( captlc_data?.browser_notif && 'Notification' in window && Notification.permission === 'granted' ) {
			const n = new Notification( thread.visitor_name || __( 'New message', 'captain-live-chat' ), {
				body: thread.last_message || '',
				tag: 'captlc-thread-' + thread.id,
			} );
			n.onclick = () => { window.focus(); openThread( thread ); n.close(); };
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ playBeep ] );

	// ── Thread list polling ───────────────────────────────────────────────
	const refreshThreads = useCallback( () => {
		ajax( 'captlc_get_threads' )
			.then( ( res ) => {
				if ( ! res?.success ) return;
				const list = res.data.threads;

				// Network recovery.
				if ( isNetworkDown ) {
					setIsNetworkDown( false );
					showToast( __( 'Connection restored.', 'captain-live-chat' ), 'success' );
				}
				failCount.current = 0;

				if ( ! isFirstLoad.current ) {
					list.forEach( ( t ) => {
						const prev = prevUnread.current[ t.id ] || 0;
						if ( t.unread > prev && ( ! activeThread || t.id !== activeThread.id ) ) {
							notify( t );
						}
					} );
				}

				const map = {};
				list.forEach( ( t ) => { map[ t.id ] = t.unread; } );
				prevUnread.current = map;
				isFirstLoad.current = false;

				setThreads( list );
				setThreadLoading( false );
			} )
			.catch( () => {
				failCount.current += 1;
				setThreadLoading( false );
				// Only mark network down after 3 consecutive failures (avoids flash on single blip).
				if ( failCount.current >= 3 ) {
					setIsNetworkDown( true );
				}
			} );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ activeThread, isNetworkDown, notify, showToast ] );

	useEffect( () => {
		if ( captlc_data?.browser_notif && 'Notification' in window && Notification.permission === 'default' ) {
			Notification.requestPermission();
		}
		refreshThreads();
		const id = setInterval( refreshThreads, POLL_INTERVAL );
		return () => clearInterval( id );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// ── Active thread message polling ─────────────────────────────────────
	const pollMessages = useCallback( () => {
		if ( ! activeThread ) return;

		ajax( 'captlc_get_messages', { thread_id: activeThread.id, since_id: lastMsgId.current } )
			.then( ( res ) => {
				if ( ! res?.success ) return;
				if ( res.data.messages.length ) {
					setMessages( ( prev ) => [ ...prev, ...res.data.messages ] );
					res.data.messages.forEach( ( m ) => {
						lastMsgId.current = Math.max( lastMsgId.current, m.id );
					} );
				}
				setIsTyping( !! res.data.typing );
			} )
			.catch( () => {} ); // silent — thread poll failures handled by threads poll banner
	}, [ activeThread ] );

	useEffect( () => {
		if ( ! activeThread ) return;
		lastMsgId.current = 0;
		setMessages( [] );
		setIsTyping( false );
		pollMessages();
		const id = setInterval( pollMessages, POLL_INTERVAL );
		return () => clearInterval( id );
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ activeThread?.id ] );

	useEffect( () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	}, [ messages ] );

	// ── Auto-away on tab hidden ───────────────────────────────────────────
	useEffect( () => {
		const handleVisibility = () => {
			if ( document.hidden && isOnline ) {
				ajax( 'captlc_toggle_agent_status', { is_online: '0' } ).catch( () => {} );
			} else if ( ! document.hidden && isOnline ) {
				ajax( 'captlc_toggle_agent_status', { is_online: '1' } ).catch( () => {} );
			}
		};
		document.addEventListener( 'visibilitychange', handleVisibility );
		return () => document.removeEventListener( 'visibilitychange', handleVisibility );
	}, [ isOnline ] );

	// ── Heartbeat — keep agent online every 45s ───────────────────────────
	useEffect( () => {
		const id = setInterval( () => {
			if ( isOnline && ! document.hidden ) {
				ajax( 'captlc_toggle_agent_status', { is_online: '1' } ).catch( () => {} );
			}
		}, 45000 );
		return () => clearInterval( id );
	}, [ isOnline ] );

	// ── Actions ───────────────────────────────────────────────────────────
	const openThread = ( thread ) => {
		setActiveThread( thread );
		setMessages( [] );
		lastMsgId.current = 0;
		setIsTyping( false );
		setActiveTab( 'messages' );
		setNotes( [] );
		setThreadTags( [] );
		setTagInput( '' );
		setCommerce( null );
		setAssignMenuOpen( false );
		setResolveMenuOpen( false );
		setAddingCustom( false );
		ajax( 'captlc_mark_read', { thread_id: thread.id } ).catch( () => {} );
		ajax( 'captlc_get_notes', { thread_id: thread.id } )
			.then( ( r ) => { if ( r?.success ) setNotes( r.data.notes ); } ).catch( () => {} );
		ajax( 'captlc_get_tags', { thread_id: thread.id } )
			.then( ( r ) => { if ( r?.success ) setThreadTags( r.data.thread_tags || [] ); } ).catch( () => {} );
		ajax( 'captlc_get_commerce_data', { email: thread.visitor_email || '' } )
			.then( ( r ) => { if ( r?.success ) setCommerce( r.data ); } ).catch( () => {} );
	};

	const toggleFavorite = () => {
		if ( ! activeThread ) return;
		const next = ! activeThread.is_favorite;
		setActiveThread( ( prev ) => ( { ...prev, is_favorite: next } ) );
		setThreads( ( prev ) => prev.map( ( t ) => t.id === activeThread.id ? { ...t, is_favorite: next } : t ) );
		ajax( 'captlc_toggle_favorite', { thread_id: activeThread.id, favorite: next ? '1' : '0' } )
			.catch( () => showToast( __( 'Could not update favorite.', 'captain-live-chat' ) ) );
	};

	const assignAgent = ( agentId ) => {
		if ( ! activeThread ) return;
		setAssignMenuOpen( false );
		setActiveThread( ( prev ) => ( { ...prev, assigned_agent_id: agentId || null } ) );
		setThreads( ( prev ) => prev.map( ( t ) => t.id === activeThread.id ? { ...t, assigned_agent_id: agentId || null } : t ) );
		ajax( 'captlc_assign_agent', { thread_id: activeThread.id, agent_id: agentId || '0' } )
			.then( ( res ) => {
				if ( ! res?.success ) showToast( res?.data?.message || __( 'Could not assign agent.', 'captain-live-chat' ) );
			} )
			.catch( () => showToast( __( 'Could not assign agent.', 'captain-live-chat' ) ) );
	};

	const toggleBlockVisitor = () => {
		if ( ! activeThread ) return;
		const next = ! activeThread.is_blocked;
		if ( next && ! window.confirm( __( 'Block this visitor from sending further messages?', 'captain-live-chat' ) ) ) return;
		setActiveThread( ( prev ) => ( { ...prev, is_blocked: next } ) );
		ajax( 'captlc_toggle_block', { thread_id: activeThread.id, blocked: next ? '1' : '0' } )
			.catch( () => showToast( __( 'Could not update block status.', 'captain-live-chat' ) ) );
	};

	const submitCustomData = ( e ) => {
		e.preventDefault();
		const key = customKey.trim();
		const value = customValue.trim();
		if ( ! key || ! value || ! activeThread ) return;

		setSavingCustom( true );
		ajax( 'captlc_save_custom_data', { thread_id: activeThread.id, key, value } )
			.then( ( res ) => {
				if ( res?.success ) {
					setActiveThread( ( prev ) => ( { ...prev, custom_data: res.data.custom_data } ) );
					setCustomKey( '' );
					setCustomValue( '' );
					setAddingCustom( false );
				} else {
					showToast( res?.data?.message || __( 'Could not save custom field.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => showToast( __( 'Network error — could not save custom field.', 'captain-live-chat' ) ) )
			.finally( () => setSavingCustom( false ) );
	};

	const addNote = () => {
		const text = noteText.trim();
		if ( ! text || ! activeThread ) return;
		setAddingNote( true );
		ajax( 'captlc_add_note', { thread_id: activeThread.id, note: text } )
			.then( ( r ) => { if ( r?.success ) { setNotes( ( p ) => [ ...p, r.data.note ] ); setNoteText( '' ); } } )
			.catch( () => {} ).finally( () => setAddingNote( false ) );
	};

	const deleteNote = ( noteId ) => {
		if ( ! activeThread ) return;
		ajax( 'captlc_delete_note', { thread_id: activeThread.id, note_id: noteId } )
			.then( () => setNotes( ( p ) => p.filter( ( n ) => n.id !== noteId ) ) ).catch( () => {} );
	};

	const addTag = ( tag ) => {
		const t = tag.trim().toLowerCase().replace( /\s+/g, '-' );
		if ( ! t || ! activeThread || threadTags.includes( t ) ) return;
		const updated = [ ...threadTags, t ];
		setThreadTags( updated );
		ajax( 'captlc_save_tags', { thread_id: activeThread.id, tags: updated.join( ',' ) } ).catch( () => {} );
	};

	const removeTag = ( tag ) => {
		if ( ! activeThread ) return;
		const updated = threadTags.filter( ( t ) => t !== tag );
		setThreadTags( updated );
		ajax( 'captlc_save_tags', { thread_id: activeThread.id, tags: updated.join( ',' ) } ).catch( () => {} );
	};

	const sendReply = ( e ) => {
		e.preventDefault();
		const text = replyText.trim();
		if ( ! text || ! activeThread || sendingReply ) return;

		setSendingReply( true );
		setReplyText( '' );

		ajax( 'captlc_send_message', { thread_id: activeThread.id, message: text } )
			.then( ( res ) => {
				if ( res?.success ) {
					setMessages( ( prev ) => [
						...prev,
						{ id: res.data.message_id, sender_type: 'agent', sender_id: res.data.sender_id, message: text },
					] );
					lastMsgId.current = Math.max( lastMsgId.current, res.data.message_id );
				} else {
					// Server returned a non-success (e.g. rate limit 429).
					setReplyText( text );
					showToast( res?.data?.message || __( 'Failed to send. Please try again.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => {
				setReplyText( text );
				showToast( __( 'Network error — message not sent. Please try again.', 'captain-live-chat' ) );
			} )
			.finally( () => setSendingReply( false ) );
	};

	const handleReplyChange = ( e ) => {
		const val = e.target.value;
		setReplyText( val );

		// Canned reply autocomplete — trigger on "/" prefix.
		if ( val.startsWith( '/' ) ) {
			const q = val.slice( 1 ).toLowerCase();
			setCannedSuggestions(
				allCanned.filter( ( r ) => r.shortcut.toLowerCase().startsWith( q ) ).slice( 0, 6 )
			);
		} else {
			setCannedSuggestions( [] );
		}

		if ( ! activeThread ) return;
		const now = Date.now();
		if ( now - lastTypingSent.current < 2000 ) return;
		lastTypingSent.current = now;
		ajax( 'captlc_update_typing', { thread_id: activeThread.id } ).catch( () => {} );
	};

	const applyCanned = ( reply ) => {
		setReplyText( reply.text );
		setCannedSuggestions( [] );
	};

	const resolveThread = () => {
		if ( ! activeThread || closingThread ) return;
		const isClosed = 'closed' === activeThread.status;

		if ( ! isClosed && ! window.confirm( __( 'Resolve this chat? The visitor will see the offline message if they reply again.', 'captain-live-chat' ) ) ) return;

		setResolveMenuOpen( false );
		setClosingThread( true );

		const action = isClosed ? 'captlc_reopen_thread' : 'captlc_close_thread';

		ajax( action, { thread_id: activeThread.id } )
			.then( ( res ) => {
				if ( res?.success ) {
					const newStatus = isClosed ? 'open' : 'closed';
					setActiveThread( ( prev ) => ( { ...prev, status: newStatus } ) );
					setThreads( ( prev ) => prev.map( ( t ) => t.id === activeThread.id ? { ...t, status: newStatus } : t ) );
					showToast( isClosed ? __( 'Chat reopened.', 'captain-live-chat' ) : __( 'Chat resolved.', 'captain-live-chat' ), 'success' );
				} else {
					showToast( res?.data?.message || __( 'Could not update the chat. Please try again.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => showToast( __( 'Network error — could not update chat status.', 'captain-live-chat' ) ) )
			.finally( () => setClosingThread( false ) );
	};

	const handleEmojiSelect = ( emoji ) => {
		setReplyText( ( prev ) => prev + emoji );
	};

	const handleAttachmentSuccess = ( fileData ) => {
		if ( ! activeThread ) return;

		// Send a message that contains just the attachment URL so the same
		// message rendering pipeline handles it.
		ajax( 'captlc_send_message', {
			thread_id: activeThread.id,
			message: '',
			attachment_url: fileData.url,
		} ).then( ( res ) => {
			if ( res?.success ) {
				setMessages( ( prev ) => [ ...prev, {
					id: res.data.message_id,
					sender_type: 'agent',
					message: '',
					attachment_url: fileData.url,
				} ] );
				lastMsgId.current = Math.max( lastMsgId.current, res.data.message_id );
			}
		} ).catch( () => showToast( __( 'Attachment sent but message record failed.', 'captain-live-chat' ) ) );
	};

	// ── Message context menu actions ────────────────────────────────────────

	const handleReplyToMessage = () => {
		setOpenMsgMenu( null );
		replyInputRef.current?.focus();
	};

	const handleCopyMessage = ( msg ) => {
		setOpenMsgMenu( null );
		if ( ! msg.message ) return;
		navigator.clipboard?.writeText( msg.message )
			.then( () => showToast( __( 'Copied to clipboard.', 'captain-live-chat' ), 'success' ) )
			.catch( () => showToast( __( 'Could not copy text.', 'captain-live-chat' ) ) );
	};

	const canDeleteMessage = ( msg ) =>
		'agent' === msg.sender_type &&
		( captlc_data?.is_admin || ( msg.sender_id && captlc_data?.current_user_id === msg.sender_id ) );

	const handleDeleteMessage = ( msg ) => {
		setOpenMsgMenu( null );
		if ( ! window.confirm( __( 'Delete this message? This cannot be undone.', 'captain-live-chat' ) ) ) return;

		const prevMessages = messages;
		setMessages( ( prev ) => prev.filter( ( m ) => m.id !== msg.id ) );

		ajax( 'captlc_delete_message', { message_id: msg.id } )
			.then( ( res ) => {
				if ( ! res?.success ) {
					setMessages( prevMessages );
					showToast( res?.data?.message || __( 'Could not delete message.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => {
				setMessages( prevMessages );
				showToast( __( 'Network error — could not delete message.', 'captain-live-chat' ) );
			} );
	};

	const openShortcutModal = ( msg ) => {
		setOpenMsgMenu( null );
		setShortcutCode( '' );
		setShortcutModalMsg( msg );
	};

	const submitShortcut = ( e ) => {
		e.preventDefault();
		const code = shortcutCode.trim().replace( /^\//, '' );
		if ( ! code || ! shortcutModalMsg ) return;

		setSavingShortcut( true );
		ajax( 'captlc_quick_add_canned_reply', { shortcut: code, text: shortcutModalMsg.message || '' } )
			.then( ( res ) => {
				if ( res?.success ) {
					setAllCanned( res.data.replies || [] );
					showToast( __( 'Saved as shortcut.', 'captain-live-chat' ), 'success' );
					setShortcutModalMsg( null );
				} else {
					showToast( res?.data?.message || __( 'Could not save shortcut.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => showToast( __( 'Network error — could not save shortcut.', 'captain-live-chat' ) ) )
			.finally( () => setSavingShortcut( false ) );
	};

	// ── Render ────────────────────────────────────────────────────────────
	return (
		<div className="captlc-dashboard">

			{ toast && (
				<Toast message={ toast.message } type={ toast.type } onDismiss={ () => setToast( null ) } />
			) }

			{ shortcutModalMsg && (
				<div className="captlc-modal-overlay" onClick={ () => setShortcutModalMsg( null ) }>
					<form
						className="captlc-modal"
						onClick={ ( e ) => e.stopPropagation() }
						onSubmit={ submitShortcut }
					>
						<h3 className="captlc-modal__title">{ __( 'Save as shortcut', 'captain-live-chat' ) }</h3>
						<p className="captlc-modal__preview">{ shortcutModalMsg.message }</p>
						<Input
							placeholder={ __( 'Shortcut, e.g. thanks', 'captain-live-chat' ) }
							value={ shortcutCode }
							onChange={ ( e ) => setShortcutCode( e.target.value ) }
						/>
						<div className="captlc-modal__actions">
							<button
								type="button"
								className="captlc-secondary-button"
								onClick={ () => setShortcutModalMsg( null ) }
							>{ __( 'Cancel', 'captain-live-chat' ) }</button>
							<button
								type="submit"
								className="captlc-primary-button"
								disabled={ savingShortcut || ! shortcutCode.trim() }
							>{ savingShortcut ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save', 'captain-live-chat' ) }</button>
						</div>
					</form>
				</div>
			) }

			{ isNetworkDown && <OfflineBanner /> }

			<div className={ `captlc-inbox${ listCollapsed ? ' captlc-inbox--list-collapsed' : '' }` }>
				<div className="captlc-inbox__list">
					<div className="captlc-inbox__list-header">
						<span className="captlc-inbox__list-header-label">{ __( 'Inbox', 'captain-live-chat' ) }</span>
						<button
							type="button"
							className="captlc-inbox__list-collapse-btn"
							title={ listCollapsed ? __( 'Expand conversation list', 'captain-live-chat' ) : __( 'Collapse conversation list', 'captain-live-chat' ) }
							aria-label={ listCollapsed ? __( 'Expand conversation list', 'captain-live-chat' ) : __( 'Collapse conversation list', 'captain-live-chat' ) }
							onClick={ () => setListCollapsed( ( v ) => ! v ) }
						>
							{ listCollapsed ? '›' : '‹' }
						</button>
					</div>
					{ threadLoading && (
						<div className="captlc-inbox__empty">
							<div className="captlc-skeleton captlc-skeleton--line"></div>
							<div className="captlc-skeleton captlc-skeleton--line"></div>
							<div className="captlc-skeleton captlc-skeleton--line"></div>
						</div>
					) }

					{ ! threadLoading && threads.length === 0 && (
						<div className="captlc-inbox__empty">
							{ __( 'No conversations yet.', 'captain-live-chat' ) }
						</div>
					) }

					{ threads.map( ( thread ) => (
						<button
							type="button"
							key={ thread.id }
							className={ `captlc-thread-item${ activeThread?.id === thread.id ? ' is-active' : '' }` }
							onClick={ () => openThread( thread ) }
							title={ thread.visitor_name || __( 'Visitor', 'captain-live-chat' ) }
						>
							<span className="captlc-thread-item__avatar">
								{ ( thread.visitor_name || '?' ).charAt( 0 ).toUpperCase() }
								<span className={ `captlc-thread-item__dot ${ 'closed' === thread.status ? 'is-closed' : 'is-open' }` }></span>
							</span>
							<span className="captlc-thread-item__body">
								<span className="captlc-thread-item__name">{ thread.visitor_name || __( 'Visitor', 'captain-live-chat' ) }</span>
								<span className="captlc-thread-item__preview">{ thread.last_message }</span>
							</span>
							{ thread.unread > 0 && (
								<span className="captlc-thread-item__badge">{ thread.unread }</span>
							) }
						</button>
					) ) }
				</div>

				<div className="captlc-inbox__chat">
					{ ! activeThread && (
						<div className="captlc-inbox__placeholder">
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
							</svg>
							<div>
								<div style={ { fontWeight: 600, marginBottom: 4 } }>{ __( 'No conversation selected', 'captain-live-chat' ) }</div>
								<div style={ { fontSize: 13 } }>{ __( 'Select a conversation from the list to start replying.', 'captain-live-chat' ) }</div>
							</div>
						</div>
					) }

					{ activeThread && (
						<>
						<div className="captlc-inbox__chat-panel">
							<div className="captlc-inbox__chat-header">
								<div className="captlc-inbox__header-left">
									<div className="captlc-inbox__header-title-row">
										<span className="captlc-inbox__visitor-name">
											{ activeThread.visitor_name || __( 'Visitor', 'captain-live-chat' ) }
										</span>
										{ activeThread.assigned_agent_id && (
											<span
												className="captlc-avatar-badge"
												title={ ( captlc_data?.users || [] ).find( ( u ) => u.id === activeThread.assigned_agent_id )?.name || '' }
											>
												{ ( ( captlc_data?.users || [] ).find( ( u ) => u.id === activeThread.assigned_agent_id )?.name || '?' ).charAt( 0 ).toUpperCase() }
											</span>
										) }
									</div>
								{ /* Verified badge intentionally omitted — we don't yet have a real
								    identity-verification mechanism, so showing it for every visitor
								    with an email would be misleading. */ }
								</div>

								<div className="captlc-inbox__header-actions">
									<button
										type="button"
										className={ `captlc-icon-button${ activeThread.is_favorite ? ' is-active' : '' }` }
										title={ __( 'Favorite', 'captain-live-chat' ) }
										onClick={ toggleFavorite }
									>★</button>

									<div className="captlc-dropdown-wrap">
										<button
											type="button"
											className="captlc-secondary-button"
											onClick={ ( e ) => { e.stopPropagation(); setResolveMenuOpen( false ); setAssignMenuOpen( ! assignMenuOpen ); } }
										>
											{ activeThread.assigned_agent_id
												? ( ( captlc_data?.users || [] ).find( ( u ) => u.id === activeThread.assigned_agent_id )?.name || __( 'Assign to', 'captain-live-chat' ) )
												: __( 'Assign to', 'captain-live-chat' ) }
										</button>
										{ assignMenuOpen && (
											<div className="captlc-dropdown" onClick={ ( e ) => e.stopPropagation() }>
												<button type="button" className="captlc-dropdown__item" onClick={ () => assignAgent( captlc_data?.current_user_id ) }>
													{ __( 'Assign to me', 'captain-live-chat' ) }
												</button>
												<div className="captlc-dropdown__divider" />
												{ ( captlc_data?.users || [] ).map( ( u ) => (
													<button
														key={ u.id }
														type="button"
														className={ `captlc-dropdown__item${ activeThread.assigned_agent_id === u.id ? ' is-active' : '' }` }
														onClick={ () => assignAgent( u.id ) }
													>{ u.name }</button>
												) ) }
												{ activeThread.assigned_agent_id && (
													<>
														<div className="captlc-dropdown__divider" />
														<button type="button" className="captlc-dropdown__item" onClick={ () => assignAgent( null ) }>
															{ __( 'Unassign', 'captain-live-chat' ) }
														</button>
													</>
												) }
											</div>
										) }
									</div>

									<div className="captlc-dropdown-wrap">
										<button
											type="button"
											className={ `captlc-secondary-button${ closingThread ? ' is-loading' : '' }` }
											onClick={ resolveThread }
											disabled={ closingThread }
										>
											{ closingThread
												? __( 'Working…', 'captain-live-chat' )
												: ( 'closed' === activeThread.status ? __( 'Reopen', 'captain-live-chat' ) : __( 'Resolve', 'captain-live-chat' ) ) }
										</button>
										<button
											type="button"
											className="captlc-secondary-button captlc-secondary-button--caret"
											title={ __( 'More status options', 'captain-live-chat' ) }
											onClick={ ( e ) => { e.stopPropagation(); setAssignMenuOpen( false ); setResolveMenuOpen( ! resolveMenuOpen ); } }
										>⌄</button>
										{ resolveMenuOpen && (
											<div className="captlc-dropdown captlc-dropdown--right" onClick={ ( e ) => e.stopPropagation() }>
												<button type="button" className="captlc-dropdown__item" onClick={ resolveThread }>
													{ 'closed' === activeThread.status ? __( 'Mark as open', 'captain-live-chat' ) : __( 'Mark as resolved', 'captain-live-chat' ) }
												</button>
											</div>
										) }
									</div>

									<button
										type="button"
										className={ `captlc-secondary-button${ sidebarOpen ? ' is-active' : '' }` }
										onClick={ () => setSidebarOpen( ! sidebarOpen ) }
									>ⓘ { __( 'Details', 'captain-live-chat' ) }</button>
								</div>
							</div>

							{ /* Page URL moved to the Details sidebar's "Pages Visited" section — see below. */ }

							{ /* Tag row intentionally removed from here — same tag editor now
							    lives in the Details sidebar, where it's actually needed. */ }

							{ /* ── Messages / Notes tabs ── */ }
							<div className="captlc-inbox__tabs">
								<button
									type="button"
									className={ `captlc-inbox__tab${ activeTab === 'messages' ? ' is-active' : '' }` }
									onClick={ () => setActiveTab( 'messages' ) }
								>{ __( 'Messages', 'captain-live-chat' ) }</button>
								<button
									type="button"
									className={ `captlc-inbox__tab${ activeTab === 'notes' ? ' is-active' : '' }` }
									onClick={ () => setActiveTab( 'notes' ) }
								>
									{ __( 'Notes', 'captain-live-chat' ) }
									{ notes.length > 0 && <span className="captlc-inbox__tab-badge">{ notes.length }</span> }
								</button>
							</div>

							{ activeTab === 'messages' && (
								<>
									<div className="captlc-inbox__messages">
								{ messages.length === 0 && (
									<div className="captlc-inbox__no-messages">
										{ __( 'No messages yet.', 'captain-live-chat' ) }
									</div>
								) }
								{ messages.map( ( msg, i ) => (
									<div key={ msg.id || i } className={ `captlc-msg-row captlc-msg-row--${ msg.sender_type }` }>
										<div className={ `captlc-msg captlc-msg--${ msg.sender_type }` }>
											{ msg.message && <span>{ msg.message }</span> }
											{ msg.attachment_url && (
												/\.(jpe?g|png|gif|webp)$/i.test( msg.attachment_url ) ? (
													<a
														href={ msg.attachment_url }
														target="_blank"
														rel="noopener noreferrer"
														className="captlc-msg__attachment captlc-msg__attachment--image"
													>
														<img src={ msg.attachment_url } alt="" />
													</a>
												) : (
													<a
														href={ msg.attachment_url }
														target="_blank"
														rel="noopener noreferrer"
														className="captlc-msg__attachment captlc-msg__attachment--file"
													>
														📎 { msg.attachment_url.split( '/' ).pop() }
													</a>
												)
											) }
										</div>

										{ msg.message && (
											<div className={ `captlc-msg-menu-wrap${ openMsgMenu === msg.id ? ' is-open' : '' }` }>
												<button
													type="button"
													className="captlc-msg-menu-trigger"
													title={ __( 'Message options', 'captain-live-chat' ) }
													aria-label={ __( 'Message options', 'captain-live-chat' ) }
													onClick={ ( e ) => {
														e.stopPropagation();
														setOpenMsgMenu( openMsgMenu === msg.id ? null : msg.id );
													} }
												>☰</button>

												{ openMsgMenu === msg.id && (
													<div className="captlc-msg-menu" onClick={ ( e ) => e.stopPropagation() }>
														<button type="button" className="captlc-msg-menu__item" onClick={ handleReplyToMessage }>
															<span className="captlc-msg-menu__icon">↩</span> { __( 'Reply', 'captain-live-chat' ) }
														</button>
														<button type="button" className="captlc-msg-menu__item" onClick={ () => openShortcutModal( msg ) }>
															<span className="captlc-msg-menu__icon">💬</span> { __( 'Save as shortcut', 'captain-live-chat' ) }
														</button>
														<button type="button" className="captlc-msg-menu__item" onClick={ () => handleCopyMessage( msg ) }>
															<span className="captlc-msg-menu__icon">⧉</span> { __( 'Copy all text', 'captain-live-chat' ) }
														</button>
														{ canDeleteMessage( msg ) && (
															<button type="button" className="captlc-msg-menu__item captlc-msg-menu__item--danger" onClick={ () => handleDeleteMessage( msg ) }>
																<span className="captlc-msg-menu__icon">🗑</span> { __( 'Delete', 'captain-live-chat' ) }
															</button>
														) }
													</div>
												) }
											</div>
										) }
									</div>
								) ) }
								<div ref={ messagesEndRef } />
							</div>

							{ isTyping && (
								<div className="captlc-inbox__typing">
									<span className="captlc-typing-dots">
										<span></span><span></span><span></span>
									</span>
									<span>{ __( 'Visitor is typing…', 'captain-live-chat' ) }</span>
								</div>
							) }

							<div className="captlc-inbox__reply-wrap">
								{ cannedSuggestions.length > 0 && (
									<div className="captlc-canned-dropdown">
										{ cannedSuggestions.map( ( r ) => (
											<button
												key={ r.id }
												type="button"
												className="captlc-canned-dropdown__item"
												onClick={ () => applyCanned( r ) }
											>
												<span className="captlc-canned-dropdown__shortcut">/{ r.shortcut }</span>
												<span className="captlc-canned-dropdown__text">{ r.text }</span>
											</button>
										) ) }
									</div>
								) }
								<EmojiPicker
									isOpen={ showEmoji }
									onSelect={ handleEmojiSelect }
									onClose={ () => setShowEmoji( false ) }
								/>
								<form className="captlc-inbox__reply-form" onSubmit={ sendReply }>
									<textarea
										ref={ replyInputRef }
										className="captlc-reply-textarea"
										placeholder={ __( 'Write your message…', 'captain-live-chat' ) }
										value={ replyText }
										onChange={ handleReplyChange }
										onKeyDown={ ( e ) => {
											if ( 'Enter' === e.key && ! e.shiftKey ) {
												e.preventDefault();
												sendReply( e );
											}
										} }
										rows={ 3 }
									/>
									<div className="captlc-reply-toolbar">
										<div className="captlc-reply-toolbar__left">
											<button
												type="button"
												className={ `captlc-emoji-trigger${ showEmoji ? ' is-active' : '' }` }
												onClick={ () => setShowEmoji( ( v ) => ! v ) }
												title={ __( 'Emoji', 'captain-live-chat' ) }
												aria-label={ __( 'Emoji', 'captain-live-chat' ) }
											>
												😊
											</button>

											<AttachmentUpload
												threadId={ activeThread.id }
												nonce={ captlc_data.nonce }
												ajaxUrl={ captlc_data.ajax_url }
												onUploadSuccess={ handleAttachmentSuccess }
												onError={ ( msg ) => showToast( msg ) }
											/>
										</div>

										<button
											type="submit"
											className="captlc-primary-button"
											disabled={ sendingReply || ( ! replyText.trim() ) }
										>
											{ sendingReply ? __( 'Sending…', 'captain-live-chat' ) : __( 'Send', 'captain-live-chat' ) }
										</button>
									</div>
								</form>
							</div>
						</>
					) }

					{ activeTab === 'notes' && (
						<div className="captlc-inbox__notes">
							<div className="captlc-inbox__notes-list">
								{ notes.length === 0 && (
									<div className="captlc-inbox__notes-empty">
										{ __( 'No internal notes yet. Notes are only visible to agents.', 'captain-live-chat' ) }
									</div>
								) }
								{ notes.map( ( note ) => (
									<div key={ note.id } className="captlc-note">
										<div className="captlc-note__header">
											<span className="captlc-note__agent">{ note.agent_name }</span>
											<span className="captlc-note__time">{ note.created_at?.slice( 0, 16 ) }</span>
											<button type="button" className="captlc-note__delete" onClick={ () => deleteNote( note.id ) }>×</button>
										</div>
										<div className="captlc-note__text">{ note.text }</div>
									</div>
								) ) }
							</div>
							<div className="captlc-inbox__notes-add">
								<textarea
									className="captlc-textarea captlc-inbox__notes-textarea"
									rows="3"
									placeholder={ __( 'Add an internal note… (only agents see this)', 'captain-live-chat' ) }
									value={ noteText }
									onChange={ ( e ) => setNoteText( e.target.value ) }
								/>
								<button
									type="button"
									className="captlc-primary-button"
									onClick={ addNote }
									disabled={ addingNote || ! noteText.trim() }
								>
									{ addingNote ? __( 'Adding…', 'captain-live-chat' ) : __( 'Add Note', 'captain-live-chat' ) }
								</button>
							</div>
						</div>
					) }
				</div>

					{ sidebarOpen && (
						<div className="captlc-contact-sidebar">
							<button type="button" className="captlc-contact-sidebar__close" onClick={ () => setSidebarOpen( false ) }>×</button>

							<div className="captlc-contact-sidebar__avatar">
								{ ( activeThread.visitor_name || '?' ).charAt( 0 ).toUpperCase() }
							</div>
							<div className="captlc-contact-sidebar__name">{ activeThread.visitor_name || __( 'Visitor', 'captain-live-chat' ) }</div>
							{ activeThread.visitor_email && (
								<div className="captlc-contact-sidebar__email">{ activeThread.visitor_email }</div>
							) }

							{ activeThread.location && (
								<div className="captlc-sidebar-section">
									<div className="captlc-sidebar-section__title">{ __( 'Location', 'captain-live-chat' ) }</div>
									<div className="captlc-sidebar-row">🌍 { activeThread.location }</div>
								</div>
							) }

							{ ( activeThread.browser || activeThread.device || activeThread.language ) && (
								<div className="captlc-sidebar-section">
									<div className="captlc-sidebar-section__title">{ __( 'Device', 'captain-live-chat' ) }</div>
									{ activeThread.browser && <div className="captlc-sidebar-row">🌐 { __( 'Browser:', 'captain-live-chat' ) } { activeThread.browser }</div> }
									{ activeThread.device && <div className="captlc-sidebar-row">💻 { __( 'Device:', 'captain-live-chat' ) } { activeThread.device }</div> }
									{ activeThread.language && <div className="captlc-sidebar-row">🗣 { __( 'Language:', 'captain-live-chat' ) } { activeThread.language }</div> }
								</div>
							) }

							<div className="captlc-sidebar-section">
								<div className="captlc-sidebar-section__title">{ __( 'Orders', 'captain-live-chat' ) }</div>
								{ ! commerce && <div className="captlc-sidebar-row captlc-sidebar-row--muted">{ __( 'Loading…', 'captain-live-chat' ) }</div> }
								{ commerce && ! commerce.available && (
									<div className="captlc-sidebar-row captlc-sidebar-row--muted">{ commerce.reason }</div>
								) }
								{ commerce && commerce.available && (
									<div className="captlc-sidebar-row">
										{ commerce.orders.count } { __( 'Orders', 'captain-live-chat' ) } · { commerce.currency }{ commerce.orders.total.toFixed( 2 ) }
									</div>
								) }
							</div>

							<div className="captlc-sidebar-section">
								<div className="captlc-sidebar-section__title">{ __( 'Cart', 'captain-live-chat' ) }</div>
								{ ! commerce && <div className="captlc-sidebar-row captlc-sidebar-row--muted">{ __( 'Loading…', 'captain-live-chat' ) }</div> }
								{ commerce && ! commerce.available && (
									<div className="captlc-sidebar-row captlc-sidebar-row--muted">{ commerce.reason }</div>
								) }
								{ commerce && commerce.available && commerce.cart && ! commerce.cart.available && (
									<div className="captlc-sidebar-row captlc-sidebar-row--muted">{ commerce.cart.reason }</div>
								) }
								{ commerce && commerce.available && commerce.cart && commerce.cart.available && (
									<div className="captlc-sidebar-row">
										{ commerce.cart.items } { __( 'Items', 'captain-live-chat' ) } · { commerce.currency }{ commerce.cart.total.toFixed( 2 ) }
									</div>
								) }
							</div>

							<div className="captlc-sidebar-section">
								<div className="captlc-sidebar-section__title">{ __( 'Tags', 'captain-live-chat' ) }</div>
								<div className="captlc-inbox__tags-row captlc-inbox__tags-row--sidebar">
									{ threadTags.map( ( tag ) => (
										<span key={ tag } className="captlc-tag">
											#{ tag }
											<button type="button" className="captlc-tag__remove" onClick={ () => removeTag( tag ) }>×</button>
										</span>
									) ) }
									<input
										type="text"
										className="captlc-tag-input"
										placeholder={ __( 'Add tag…', 'captain-live-chat' ) }
										value={ tagInput }
										onChange={ ( e ) => setTagInput( e.target.value ) }
										onKeyDown={ ( e ) => {
											if ( ( e.key === 'Enter' || e.key === ',' ) && tagInput.trim() ) {
												e.preventDefault();
												addTag( tagInput );
												setTagInput( '' );
											}
										} }
									/>
								</div>
							</div>

							<div className="captlc-sidebar-section">
								<div className="captlc-sidebar-section__title">{ __( 'Custom Data', 'captain-live-chat' ) }</div>
								{ Object.entries( activeThread.custom_data || {} ).map( ( [ key, value ] ) => (
									<div key={ key } className="captlc-sidebar-row captlc-sidebar-row--custom">
										<span className="captlc-sidebar-row__label">{ key }</span>
										<span>{ value }</span>
									</div>
								) ) }

								{ ! addingCustom && (
									<button type="button" className="captlc-add-link" onClick={ () => setAddingCustom( true ) }>
										+ { __( 'Add Custom', 'captain-live-chat' ) }
									</button>
								) }

								{ addingCustom && (
									<form className="captlc-custom-data-form" onSubmit={ submitCustomData }>
										<Input
											placeholder={ __( 'Field name', 'captain-live-chat' ) }
											value={ customKey }
											onChange={ ( e ) => setCustomKey( e.target.value ) }
										/>
										<Input
											placeholder={ __( 'Value', 'captain-live-chat' ) }
											value={ customValue }
											onChange={ ( e ) => setCustomValue( e.target.value ) }
										/>
										<div className="captlc-modal__actions">
											<button type="button" className="captlc-secondary-button" onClick={ () => setAddingCustom( false ) }>
												{ __( 'Cancel', 'captain-live-chat' ) }
											</button>
											<button type="submit" className="captlc-primary-button" disabled={ savingCustom || ! customKey.trim() || ! customValue.trim() }>
												{ savingCustom ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save', 'captain-live-chat' ) }
											</button>
										</div>
									</form>
								) }
							</div>

							<div className="captlc-sidebar-section">
								<div className="captlc-sidebar-section__title">{ __( 'Pages Visited', 'captain-live-chat' ) }</div>
								{ activeThread.source_url ? (
									<a
										href={ activeThread.source_url }
										target="_blank"
										rel="noopener noreferrer"
										className="captlc-sidebar-row captlc-sidebar-row--link"
										title={ activeThread.source_url }
									>
										🔗 { activeThread.source_url }
									</a>
								) : (
									<div className="captlc-sidebar-row captlc-sidebar-row--muted">{ __( 'Not tracked yet.', 'captain-live-chat' ) }</div>
								) }
							</div>

							<div className="captlc-contact-sidebar__footer">
								<button type="button" className="captlc-block-button" onClick={ toggleBlockVisitor }>
									🚫 { activeThread.is_blocked ? __( 'Unblock', 'captain-live-chat' ) : __( 'Block', 'captain-live-chat' ) }
								</button>
							</div>
						</div>
					) }
					</>
			) }
		</div>
	</div>
</div>
	);
};

export default Inbox;
