import React, { useState, useEffect, useRef, useCallback } from 'react';
import './dashboard.scss';
import { __ } from '@wordpress/i18n';
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

const Dashboard = () => {
	const [ threads, setThreads ] = useState( [] );
	const [ activeThread, setActiveThread ] = useState( null );
	const [ messages, setMessages ] = useState( [] );
	const [ replyText, setReplyText ] = useState( '' );
	const [ isOnline, setIsOnline ] = useState( !! captlc_data?.agent_online );
	const [ isTyping, setIsTyping ] = useState( false );
	const [ sendingReply, setSendingReply ] = useState( false );
	const [ toast, setToast ] = useState( null );
	const [ isNetworkDown, setIsNetworkDown ] = useState( false );
	const [ threadLoading, setThreadLoading ] = useState( true );
	const [ closingThread, setClosingThread ] = useState( false );
	const [ showEmoji, setShowEmoji ] = useState( false );
	const [ cannedSuggestions, setCannedSuggestions ] = useState( [] );
	const [ allCanned, setAllCanned ] = useState( [] );

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
		ajax( 'captlc_mark_read', { thread_id: thread.id } ).catch( () => {} );
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
						{ id: res.data.message_id, sender_type: 'agent', message: text },
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

	const closeThread = () => {
		if ( ! activeThread || closingThread ) return;
		if ( ! window.confirm( __( 'Close this chat? The visitor will see the offline message if they reply again.', 'captain-live-chat' ) ) ) return;

		setClosingThread( true );
		ajax( 'captlc_close_thread', { thread_id: activeThread.id } )
			.then( ( res ) => {
				if ( res?.success ) {
					refreshThreads();
					showToast( __( 'Chat closed.', 'captain-live-chat' ), 'success' );
				} else {
					showToast( res?.data?.message || __( 'Could not close the chat. Please try again.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => showToast( __( 'Network error — could not close chat.', 'captain-live-chat' ) ) )
			.finally( () => setClosingThread( false ) );
	};

	const handleOnlineToggle = ( e ) => {
		const checked = e.target.checked;
		setIsOnline( checked );
		ajax( 'captlc_toggle_agent_status', { is_online: checked ? '1' : '0' } )
			.catch( () => showToast( __( 'Could not update online status.', 'captain-live-chat' ) ) );
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

	// ── Render ────────────────────────────────────────────────────────────
	return (
		<div className="captlc-dashboard">

			{ toast && (
				<Toast message={ toast.message } type={ toast.type } onDismiss={ () => setToast( null ) } />
			) }

			{ isNetworkDown && <OfflineBanner /> }

			<div className="captlc-main__header">
				<h1 className="captlc-main__title">{ __( 'Inbox', 'captain-live-chat' ) }</h1>

				<label className="captlc-agent-toggle">
					<Switcher checked={ isOnline } onChange={ handleOnlineToggle } />
					<span>{ isOnline ? __( 'Online', 'captain-live-chat' ) : __( 'Offline', 'captain-live-chat' ) }</span>
				</label>
			</div>

			<div className="captlc-inbox">
				<div className="captlc-inbox__list">
					<div className="captlc-inbox__list-header">
						{ __( 'Conversations', 'captain-live-chat' ) }
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
						>
							<span className={ `captlc-thread-item__dot ${ 'closed' === thread.status ? 'is-closed' : 'is-open' }` }></span>
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
						<div className="captlc-inbox__chat-panel">
							<div className="captlc-inbox__chat-header">
								<div>
									<div className="captlc-inbox__visitor-name">
										{ activeThread.visitor_name || __( 'Visitor', 'captain-live-chat' ) }
									</div>
									<div className="captlc-inbox__visitor-meta">
										{ [ activeThread.visitor_email, activeThread.browser, activeThread.device ].filter( Boolean ).join( ' · ' ) }
									</div>
									{ activeThread.source_url && (
										<div className="captlc-inbox__visitor-url" title={ activeThread.source_url }>
											{ activeThread.source_url }
										</div>
									) }
								</div>
								<button
									type="button"
									className={ `captlc-secondary-button${ closingThread ? ' is-loading' : '' }` }
									onClick={ closeThread }
									disabled={ closingThread }
								>
									{ closingThread ? __( 'Closing…', 'captain-live-chat' ) : __( 'Close chat', 'captain-live-chat' ) }
								</button>
							</div>

							<div className="captlc-inbox__messages">
								{ messages.length === 0 && (
									<div className="captlc-inbox__no-messages">
										{ __( 'No messages yet.', 'captain-live-chat' ) }
									</div>
								) }
								{ messages.map( ( msg, i ) => (
									<div key={ msg.id || i } className={ `captlc-msg captlc-msg--${ msg.sender_type }` }>
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

									<Input
										placeholder={ __( 'Type a reply…', 'captain-live-chat' ) }
										value={ replyText }
										onChange={ handleReplyChange }
									/>
									<button
										type="submit"
										className="captlc-primary-button"
										disabled={ sendingReply || ( ! replyText.trim() ) }
									>
										{ sendingReply ? __( 'Sending…', 'captain-live-chat' ) : __( 'Send', 'captain-live-chat' ) }
									</button>
								</form>
							</div>
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
