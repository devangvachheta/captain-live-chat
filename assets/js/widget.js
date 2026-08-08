/**
 * Captain Live Chat — Frontend widget behaviour.
 * Vanilla JS only. Uses AJAX polling (no WebSocket) as decided for
 * shared-hosting compatibility.
 *
 * @package Captain_Live_Chat
 */

( function () {
	'use strict';

	if ( typeof captlcData === 'undefined' ) {
		return;
	}

	var STORAGE_KEY_VISITOR = 'captlc_visitor_id';
	var STORAGE_KEY_THREAD  = 'captlc_thread_id';

	var widget       = document.getElementById( 'captlc-widget' );
	var toggleBtn    = document.getElementById( 'captlc-widget-toggle' );
	var titleEl      = document.getElementById( 'captlc-widget-title' );
	var statusDot    = document.getElementById( 'captlc-widget-status-dot' );
	var statusText   = document.getElementById( 'captlc-widget-status-text' );
	var prechatForm  = document.getElementById( 'captlc-prechat-form' );
	var nameInput    = document.getElementById( 'captlc-input-name' );
	var emailInput   = document.getElementById( 'captlc-input-email' );
	var messageInput = document.getElementById( 'captlc-input-message' );
	var submitBtn    = document.getElementById( 'captlc-prechat-submit' );
	var threadBox    = document.getElementById( 'captlc-widget-thread' );
	var messagesBox  = document.getElementById( 'captlc-widget-messages' );
	var typingBox    = document.getElementById( 'captlc-widget-typing' );
	var seenBox      = document.getElementById( 'captlc-widget-seen' );
	var closedNotice = document.getElementById( 'captlc-widget-closed-notice' );
	var replyForm    = document.getElementById( 'captlc-reply-form' );
	var replyInput   = document.getElementById( 'captlc-reply-input' );

	if ( ! widget ) {
		return;
	}

	var pollTimer   = null;
	var presenceTimer = null;
	var lastMsgId   = 0;
	var lastTypingSent = 0;
	var currentTid  = getStored( STORAGE_KEY_THREAD );
	var visitorId   = getStored( STORAGE_KEY_VISITOR ) || generateUuid();

	setStored( STORAGE_KEY_VISITOR, visitorId );

	// Static text from localized data.
	titleEl.textContent           = captlcData.widgetTitle;
	nameInput.placeholder         = captlcData.i18n.namePlaceholder;
	emailInput.placeholder        = captlcData.i18n.emailPlaceholder;
	messageInput.placeholder      = captlcData.i18n.messagePlaceholder;
	submitBtn.textContent         = captlcData.i18n.startChat;
	replyInput.placeholder        = captlcData.i18n.typeMessage;

	/**
	 * Reads a value from localStorage, tolerating unavailable storage.
	 *
	 * @param {string} key Storage key.
	 * @return {string|null}
	 */
	function getStored( key ) {
		try {
			return window.localStorage.getItem( key );
		} catch ( e ) {
			return null;
		}
	}

	/**
	 * Writes a value to localStorage, tolerating unavailable storage.
	 *
	 * @param {string} key   Storage key.
	 * @param {string} value Value to store.
	 * @return {void}
	 */
	function setStored( key, value ) {
		try {
			window.localStorage.setItem( key, value );
		} catch ( e ) {
			// Storage unavailable (private mode etc.) — degrade silently.
		}
	}

	/**
	 * Generates a UUID v4 without external dependencies.
	 *
	 * @return {string}
	 */
	function generateUuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
			var r = ( Math.random() * 16 ) | 0;
			var v = 'x' === c ? r : ( r & 0x3 ) | 0x8;
			return v.toString( 16 );
		} );
	}

	/**
	 * Performs a POST request against admin-ajax.php.
	 *
	 * @param {string} action Ajax action name (without captlc_ prefix already included by caller).
	 * @param {Object} data   Key/value form data.
	 * @return {Promise<Object>}
	 */
	function ajax( action, data ) {
		var body = new URLSearchParams(
			Object.assign(
				{
					action: action,
					nonce: captlcData.nonce,
				},
				data || {}
			)
		);

		return fetch( captlcData.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		} ).then( function ( res ) {
			if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
			return res.json();
		} );
	}

	/**
	 * Shows an inline error notice inside the widget panel. Auto-clears after 5s.
	 *
	 * @param {string} msg Error message text.
	 * @return {void}
	 */
	function showWidgetError( msg ) {
		var existing = document.getElementById( 'captlc-widget-error' );
		if ( existing ) existing.remove();

		var el = document.createElement( 'div' );
		el.id = 'captlc-widget-error';
		el.className = 'captlc-widget__error';
		el.innerHTML = '<span>' + msg + '</span><button type="button" class="captlc-widget__error-close" aria-label="Dismiss">✕</button>';
		el.querySelector( '.captlc-widget__error-close' ).addEventListener( 'click', function () { el.remove(); } );

		// Insert before the reply form if thread is open, else before the submit button.
		var replyF = document.getElementById( 'captlc-reply-form' );
		if ( replyF ) {
			replyF.parentNode.insertBefore( el, replyF );
		} else {
			var panel = document.getElementById( 'captlc-widget-panel' );
			if ( panel ) panel.appendChild( el );
		}

		setTimeout( function () { if ( el.parentNode ) el.remove(); }, 5000 );
	}

	/**
	 * Appends a single message bubble to the thread view.
	 *
	 * @param {Object} msg Message object {sender_type, message}.
	 * @return {void}
	 */
	function appendMessage( msg ) {
		var bubble = document.createElement( 'div' );
		bubble.className = 'captlc-msg captlc-msg--' + ( 'agent' === msg.sender_type ? 'agent' : 'visitor' );

		if ( msg.message ) {
			var textNode = document.createElement( 'span' );
			textNode.textContent = msg.message;
			bubble.appendChild( textNode );
		}

		if ( msg.attachment_url ) {
			var isImage = /\.(jpe?g|png|gif|webp)$/i.test( msg.attachment_url );
			var link = document.createElement( 'a' );
			link.href = msg.attachment_url;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.style.display = 'block';
			link.style.marginTop = msg.message ? '6px' : '0';

			if ( isImage ) {
				var img = document.createElement( 'img' );
				img.src = msg.attachment_url;
				img.alt = '';
				img.style.maxWidth = '200px';
				img.style.maxHeight = '180px';
				img.style.borderRadius = '8px';
				img.style.display = 'block';
				link.appendChild( img );
			} else {
				link.textContent = '📎 ' + msg.attachment_url.split( '/' ).pop();
				link.style.fontSize = '12px';
				link.style.color = 'inherit';
			}

			bubble.appendChild( link );
		}

		messagesBox.appendChild( bubble );
		messagesBox.scrollTop = messagesBox.scrollHeight;

		if ( msg.id ) {
			lastMsgId = Math.max( lastMsgId, parseInt( msg.id, 10 ) );
		}
	}

	/**
	 * Switches the widget UI from pre-chat form to the active thread view.
	 *
	 * @return {void}
	 */
	function showThreadView() {
		prechatForm.hidden = true;
		threadBox.hidden = false;
	}

	/**
	 * Starts (or resumes) polling for new messages on the current thread.
	 *
	 * @return {void}
	 */
	function startPolling() {
		if ( pollTimer ) {
			clearInterval( pollTimer );
		}

		poll();
		pollTimer = setInterval( poll, captlcData.pollInterval || 3000 );
	}

	/**
	 * Single poll tick — fetches new messages since lastMsgId.
	 *
	 * @return {void}
	 */
	function poll() {
		if ( ! currentTid ) {
			return;
		}

		ajax( 'captlc_get_messages', { thread_id: currentTid, since_id: lastMsgId } ).then( function ( res ) {
			if ( ! res || ! res.success ) {
				return;
			}

			res.data.messages.forEach( appendMessage );

			typingBox.hidden = ! res.data.typing;
			seenBox.hidden = ! res.data.seen;

			if ( res.data.seen ) {
				seenBox.textContent = captlcData.i18n.seen || 'Seen';
			}

			if ( 'closed' === res.data.status ) {
				closedNotice.hidden = false;
				closedNotice.textContent = captlcData.offlineMessage;
				replyForm.querySelector( 'input' ).disabled = true;
			}
		} );
	}

	/**
	 * Sends a "visitor is typing" ping, throttled to once every 2 seconds.
	 *
	 * @return {void}
	 */
	function sendTypingPing() {
		if ( ! currentTid ) {
			return;
		}

		var now = Date.now();
		if ( now - lastTypingSent < 2000 ) {
			return;
		}
		lastTypingSent = now;

		ajax( 'captlc_update_typing', { thread_id: currentTid } );
	}

	/**
	 * Starts a periodic heartbeat that reports the visitor's current page URL.
	 *
	 * @return {void}
	 */
	function startPresenceHeartbeat() {
		if ( presenceTimer ) {
			clearInterval( presenceTimer );
		}

		var send = function () {
			if ( currentTid ) {
				ajax( 'captlc_update_presence', { thread_id: currentTid, url: window.location.href } );
			}
		};

		send();
		presenceTimer = setInterval( send, 10000 );
	}

	/**
	 * Checks whether any agent is online and updates the status dot.
	 *
	 * @return {void}
	 */
	function refreshAgentStatus() {
		ajax( 'captlc_widget_status', {} ).then( function ( res ) {
			var online = !! ( res && res.success && res.data.online );
			statusDot.classList.toggle( 'is-online', online );
			statusText.textContent = online ? captlcData.i18n.online : captlcData.i18n.offline;
		} );
	}

	// Toggle open/close.
	toggleBtn.addEventListener( 'click', function () {
		var isOpen = 'open' === widget.getAttribute( 'data-state' );
		widget.setAttribute( 'data-state', isOpen ? 'closed' : 'open' );

		if ( ! isOpen ) {
			refreshAgentStatus();

			if ( currentTid ) {
				showThreadView();
				startPolling();
				startPresenceHeartbeat();
			}
		}
	} );

	// Pre-chat form submit -> creates thread + first message.
	prechatForm.addEventListener( 'submit', function ( e ) {
		e.preventDefault();

		var name    = nameInput.value.trim();
		var email   = emailInput.value.trim();
		var message = messageInput.value.trim();

		if ( ! name || ! message ) {
			return;
		}

		submitBtn.disabled = true;

		ajax( 'captlc_start_thread', {
			visitor_id: visitorId,
			name: name,
			email: email,
			message: message,
			source_url: window.location.href,
		} ).then( function ( res ) {
			submitBtn.disabled = false;

			if ( ! res || ! res.success ) {
				showWidgetError( ( res && res.data && res.data.message ) || 'Could not start chat. Please try again.' );
				return;
			}

			currentTid = res.data.thread_id;
			setStored( STORAGE_KEY_THREAD, String( currentTid ) );

			appendMessage( { sender_type: 'visitor', message: message, id: res.data.message_id } );
			showThreadView();
			startPolling();
			startPresenceHeartbeat();
		} ).catch( function () {
			submitBtn.disabled = false;
			showWidgetError( 'Network error — please check your connection and try again.' );
		} );
	} );

	// Typing ping while the visitor types a reply.
	replyInput.addEventListener( 'input', sendTypingPing );

	// ── Emoji picker (vanilla) ───────────────────────────────────────────

	var EMOJI_LIST = [
		'😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😉',
		'😊','😇','🥰','😍','😘','😋','😛','😜','🤪','😝',
		'🤑','🤗','🤔','😐','😏','😒','🙄','😬','😔','😪',
		'😷','🤒','😵','😎','🥳','😕','😟','😢','😭','😱',
		'😤','😡','😠','💀','💩','👍','👎','👌','✅','❌',
		'⚠️','🔥','💯','❤️','🧡','💛','💚','💙','💜','🖤',
		'💔','💕','💖','💗','💓','💞','💘','💝','🎉','🎊',
		'👋','🙏','💪','✌️','🤞','👏','🙌','🤝','😸','🐶',
	];

	var emojiPickerEl   = null;
	var emojiOpenState  = false;

	/**
	 * Creates and toggles the lightweight emoji picker inside the widget.
	 *
	 * @return {void}
	 */
	function toggleEmojiPicker() {
		if ( emojiOpenState ) {
			if ( emojiPickerEl ) emojiPickerEl.remove();
			emojiPickerEl = null;
			emojiOpenState = false;
			return;
		}

		emojiPickerEl = document.createElement( 'div' );
		emojiPickerEl.className = 'captlc-widget-emoji-picker';

		var grid = document.createElement( 'div' );
		grid.className = 'captlc-widget-emoji-picker__grid';

		EMOJI_LIST.forEach( function ( emoji ) {
			var btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'captlc-widget-emoji-picker__btn';
			btn.textContent = emoji;
			btn.addEventListener( 'click', function () {
				replyInput.value += emoji;
				replyInput.focus();
				if ( emojiPickerEl ) emojiPickerEl.remove();
				emojiPickerEl = null;
				emojiOpenState = false;
			} );
			grid.appendChild( btn );
		} );

		emojiPickerEl.appendChild( grid );
		replyForm.parentNode.insertBefore( emojiPickerEl, replyForm );
		emojiOpenState = true;

		// Close on outside click.
		setTimeout( function () {
			document.addEventListener( 'click', function closeEmoji( e ) {
				if ( emojiPickerEl && ! emojiPickerEl.contains( e.target ) ) {
					emojiPickerEl.remove();
					emojiPickerEl = null;
					emojiOpenState = false;
					document.removeEventListener( 'click', closeEmoji );
				}
			} );
		}, 10 );
	}

	// ── Attachment upload (vanilla) ──────────────────────────────────────

	/**
	 * Handles file selection for attachment upload in the widget.
	 *
	 * @param {File} file Selected file object.
	 * @return {void}
	 */
	function handleWidgetAttachment( file ) {
		if ( ! currentTid ) return;

		var allowedTypes = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf' ];
		if ( allowedTypes.indexOf( file.type ) === -1 ) {
			showWidgetError( 'File type not allowed. Use JPG, PNG, GIF, WEBP or PDF.' );
			return;
		}

		if ( file.size > 5 * 1024 * 1024 ) {
			showWidgetError( 'File too large. Maximum 5 MB.' );
			return;
		}

		var formData = new FormData();
		formData.append( 'action', 'captlc_upload_attachment' );
		formData.append( 'nonce', captlcData.nonce );
		formData.append( 'thread_id', currentTid );
		formData.append( 'captlc_file', file );

		fetch( captlcData.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: formData,
		} )
			.then( function ( res ) {
				if ( ! res.ok ) throw new Error( 'HTTP ' + res.status );
				return res.json();
			} )
			.then( function ( res ) {
				if ( ! res || ! res.success ) {
					showWidgetError( ( res && res.data && res.data.message ) || 'Upload failed.' );
					return;
				}

				// Send message with attachment_url only.
				return ajax( 'captlc_send_message', {
					thread_id: currentTid,
					message: '',
					attachment_url: res.data.url,
				} ).then( function ( msgRes ) {
					if ( msgRes && msgRes.success ) {
						appendMessage( { sender_type: 'visitor', message: '', attachment_url: res.data.url, id: msgRes.data.message_id } );
					}
				} );
			} )
			.catch( function () {
				showWidgetError( 'Network error — upload failed.' );
			} );
	}

	// ── Wire up emoji + attachment buttons ───────────────────────────────
	var emojiBtn  = document.getElementById( 'captlc-widget-emoji-btn' );
	var attachBtn = document.getElementById( 'captlc-widget-attach-btn' );
	var attachInput = document.getElementById( 'captlc-widget-attach-input' );

	if ( emojiBtn ) {
		emojiBtn.addEventListener( 'click', toggleEmojiPicker );
	}

	if ( attachBtn && attachInput ) {
		attachBtn.addEventListener( 'click', function () {
			attachInput.click();
		} );

		attachInput.addEventListener( 'change', function () {
			if ( this.files && this.files[0] ) {
				handleWidgetAttachment( this.files[0] );
				this.value = '';
			}
		} );
	}

	// Reply form submit -> sends a follow-up message on an existing thread.
	replyForm.addEventListener( 'submit', function ( e ) {
		e.preventDefault();

		var text = replyInput.value.trim();

		if ( ! text || ! currentTid ) {
			return;
		}

		replyInput.value = '';

		ajax( 'captlc_send_message', { thread_id: currentTid, message: text } ).then( function ( res ) {
			if ( res && res.success ) {
				appendMessage( { sender_type: 'visitor', message: text, id: res.data.message_id } );
			} else {
				replyInput.value = text;
				showWidgetError( ( res && res.data && res.data.message ) || 'Message not sent. Please try again.' );
			}
		} ).catch( function () {
			replyInput.value = text;
			showWidgetError( 'Network error — message not sent.' );
		} );
	} );

	// If a thread already exists from a previous visit, jump straight to it.
	if ( currentTid ) {
		showThreadView();
	}
} )();
