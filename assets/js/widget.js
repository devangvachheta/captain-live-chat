/**
 * Captain Live Chat — Frontend widget behaviour.
 * Vanilla JS only.
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

	// Screen views
	var widget          = document.getElementById( 'captlc-widget' );
	var toggleBtn       = document.getElementById( 'captlc-widget-toggle' );
	
	// Welcome Screen Elements
	var welcomeScreen   = document.getElementById( 'captlc-screen-welcome' );
	var welcomeTitle    = document.getElementById( 'captlc-welcome-title' );
	var welcomeSubtitle = document.getElementById( 'captlc-welcome-subtitle' );
	var welcomeAvatar   = document.getElementById( 'captlc-welcome-avatar' );
	var welcomeStatusDot   = welcomeScreen ? welcomeScreen.querySelector( '.captlc-widget__welcome-status-dot' ) : null;
	var welcomeStatusLabel = document.getElementById( 'captlc-welcome-status-label' );
	var welcomeMessage  = document.getElementById( 'captlc-welcome-message' );
	var startChatBtn    = document.getElementById( 'captlc-btn-start-chat' );
	var resumeChatBtn   = document.getElementById( 'captlc-btn-resume-chat' );

	// Pre-chat Form Elements
	var prechatScreen   = document.getElementById( 'captlc-screen-prechat' );
	var prechatForm     = document.getElementById( 'captlc-prechat-form' );
	var prechatBack     = document.getElementById( 'captlc-prechat-back' );
	var nameInput       = document.getElementById( 'captlc-input-name' );
	var emailInput      = document.getElementById( 'captlc-input-email' );
	var messageInput    = document.getElementById( 'captlc-input-message' );
	var submitBtn       = document.getElementById( 'captlc-prechat-submit' );

	// Active Chat Elements
	var chatScreen      = document.getElementById( 'captlc-screen-chat' );
	var chatBack        = document.getElementById( 'captlc-chat-back' );
	var chatHeaderAvatar = document.getElementById( 'captlc-chat-header-avatar' );
	var chatAgentName   = document.getElementById( 'captlc-chat-agent-name' );
	var statusDot       = document.getElementById( 'captlc-widget-status-dot' );
	var statusText      = document.getElementById( 'captlc-widget-status-text' );
	var threadBox       = document.getElementById( 'captlc-widget-thread' );
	var messagesBox     = document.getElementById( 'captlc-widget-messages' );
	var typingBox       = document.getElementById( 'captlc-widget-typing' );
	var seenBox         = document.getElementById( 'captlc-widget-seen' );
	var closedNotice    = document.getElementById( 'captlc-widget-closed-notice' );
	var replyForm       = document.getElementById( 'captlc-reply-form' );
	var replyInput      = document.getElementById( 'captlc-reply-input' );

	if ( ! widget ) {
		return;
	}

	// Apply saved widget design settings (from Widget Designer page).
	var design = captlcData.widgetDesign || {};
	if ( design.accent_color ) {
		widget.style.setProperty( '--captlcw-accent', design.accent_color );
		widget.style.setProperty( '--captlcw-accent-hover', design.accent_color );
		widget.style.setProperty( '--captlcw-bubble-visitor-bg', design.visitor_bubble_color || design.accent_color );
	}
	if ( design.agent_bubble_color ) {
		widget.style.setProperty( '--captlcw-bubble-agent-bg', design.agent_bubble_color );
		widget.style.setProperty( '--captlcw-bubble-agent-text', '#1c2233' );
	}

	// Position: left or right.
	if ( design.position === 'left' ) {
		widget.classList.add( 'captlc-widget--left' );
		widget.style.left  = '24px';
		widget.style.right = 'auto';
	} else {
		widget.style.right = '24px';
		widget.style.left  = 'auto';
	}

	var pollTimer     = null;
	var presenceTimer = null;
	var lastMsgId     = 0;
	var lastTypingSent = 0;
	var currentTid    = getStored( STORAGE_KEY_THREAD );
	var visitorId     = getStored( STORAGE_KEY_VISITOR ) || generateUuid();

	setStored( STORAGE_KEY_VISITOR, visitorId );

	// Set launcher icon
	var iconWrap = document.getElementById( 'captlc-toggle-icon-chat' );
	if ( iconWrap ) {
		iconWrap.setAttribute( 'data-icon', design.button_icon || 'chat1' );
	}

	// Populate welcome text content
	if ( welcomeTitle ) {
		welcomeTitle.textContent = design.welcome_title || '👋 Our team is here for you';
	}
	if ( welcomeSubtitle ) {
		welcomeSubtitle.textContent = design.welcome_subtitle || 'We typically reply in a few minutes.';
	}
	if ( welcomeMessage ) {
		welcomeMessage.textContent = design.welcome_message || 'Hi, how can we help?';
	}

	// Localize strings on forms
	if ( nameInput ) nameInput.placeholder         = captlcData.i18n.namePlaceholder;
	if ( emailInput ) emailInput.placeholder        = captlcData.i18n.emailPlaceholder;
	if ( messageInput ) messageInput.placeholder      = captlcData.i18n.messagePlaceholder;
	if ( submitBtn ) submitBtn.textContent         = captlcData.i18n.startChat;
	if ( replyInput ) replyInput.placeholder        = captlcData.i18n.typeMessage;
	if ( chatAgentName ) chatAgentName.textContent  = captlcData.i18n.supportAgent || 'Support Agent';

	// Render avatars
	if ( design.show_avatar ) {
		if ( welcomeAvatar ) renderAvatar( welcomeAvatar, design );
		if ( chatHeaderAvatar ) renderAvatar( chatHeaderAvatar, design );
	} else {
		if ( welcomeAvatar ) welcomeAvatar.style.display = 'none';
		if ( chatHeaderAvatar ) chatHeaderAvatar.style.display = 'none';
	}

	// Quick reply buttons — render inside pre-chat form if configured.
	var quickReplies = design.quick_replies || [];
	if ( ! quickReplies.length && captlcData.settings && captlcData.settings.quick_replies ) {
		quickReplies = captlcData.settings.quick_replies;
	}

	if ( quickReplies && quickReplies.length && prechatForm ) {
		var qrWrap = document.createElement( 'div' );
		qrWrap.className = 'captlc-widget-quick-replies';

		quickReplies.forEach( function ( label ) {
			var btn = document.createElement( 'button' );
			btn.type = 'button';
			btn.className = 'captlc-widget-qr-btn';
			btn.textContent = label;

			btn.addEventListener( 'click', function () {
				messageInput.value = label;
				messageInput.focus();
			} );

			qrWrap.appendChild( btn );
		} );

		prechatForm.insertBefore( qrWrap, messageInput );
	}

	// Screen Transition Helper
	function showScreen( screenId ) {
		var screens = [ welcomeScreen, prechatScreen, chatScreen ];
		screens.forEach( function ( scr ) {
			if ( scr ) {
				scr.style.display = 'none';
				scr.classList.remove( 'is-active' );
			}
		} );

		var target = document.getElementById( screenId );
		if ( target ) {
			target.style.display = 'flex';
			target.classList.add( 'is-active' );
		}
	}

	function renderAvatar( containerEl, design ) {
		containerEl.innerHTML = '';
		var isHeader = containerEl.classList.contains( 'captlc-widget__header-agent-avatar' );
		var size = isHeader ? 32 : 44;
		
		var avatar = document.createElement( 'div' );
		avatar.style.width = size + 'px';
		avatar.style.height = size + 'px';
		avatar.style.borderRadius = '50%';
		avatar.style.background = design.avatar_bg_color || '#9ca3af';
		avatar.style.display = 'flex';
		avatar.style.alignItems = 'center';
		avatar.style.justifyContent = 'center';
		avatar.style.color = '#fff';
		avatar.style.fontWeight = '700';
		avatar.style.fontSize = ( size * 0.4 ) + 'px';
		avatar.style.overflow = 'hidden';
		avatar.style.flexShrink = '0';

		if ( design.avatar_image_url ) {
			var img = document.createElement( 'img' );
			img.src = design.avatar_image_url;
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';
			avatar.appendChild( img );
		} else {
			avatar.textContent = ( design.avatar_initials || 'A' ).charAt( 0 ).toUpperCase();
		}
		containerEl.appendChild( avatar );
	}

	function getStored( key ) {
		try {
			return window.localStorage.getItem( key );
		} catch ( e ) {
			return null;
		}
	}

	function setStored( key, value ) {
		try {
			window.localStorage.setItem( key, value );
		} catch ( e ) {
		}
	}

	function generateUuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
			var r = ( Math.random() * 16 ) | 0;
			var v = 'x' === c ? r : ( r & 0x3 ) | 0x8;
			return v.toString( 16 );
		} );
	}

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

	function showWidgetError( msg ) {
		var existing = document.getElementById( 'captlc-widget-error' );
		if ( existing ) existing.remove();

		var el = document.createElement( 'div' );
		el.id = 'captlc-widget-error';
		el.className = 'captlc-widget__error';
		el.innerHTML = '<span>' + msg + '</span><button type="button" class="captlc-widget__error-close" aria-label="Dismiss">✕</button>';
		el.querySelector( '.captlc-widget__error-close' ).addEventListener( 'click', function () { el.remove(); } );

		var replyF = document.getElementById( 'captlc-reply-form' );
		if ( replyF && chatScreen && chatScreen.style.display !== 'none' ) {
			replyF.parentNode.insertBefore( el, replyF );
		} else {
			var activePanel = welcomeScreen.style.display !== 'none' ? welcomeScreen : prechatScreen;
			activePanel.appendChild( el );
		}

		setTimeout( function () { if ( el.parentNode ) el.remove(); }, 5000 );
	}

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

	function startPolling() {
		if ( pollTimer ) {
			clearInterval( pollTimer );
		}

		poll();
		pollTimer = setInterval( poll, captlcData.pollInterval || 3000 );
	}

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

	function refreshAgentStatus() {
		ajax( 'captlc_widget_status', {} ).then( function ( res ) {
			var online = !! ( res && res.success && res.data.online );
			
			// Update active chat header status
			if ( statusDot ) statusDot.classList.toggle( 'is-online', online );
			if ( statusText ) statusText.textContent = online ? captlcData.i18n.online : captlcData.i18n.offline;

			// Update welcome screen card status
			if ( welcomeStatusDot ) welcomeStatusDot.classList.toggle( 'is-online', online );
			if ( welcomeStatusLabel ) welcomeStatusLabel.textContent = online ? captlcData.i18n.online : captlcData.i18n.offline;
		} );
	}

	function setupButtonsState() {
		if ( currentTid ) {
			if ( startChatBtn ) startChatBtn.style.display = 'none';
			if ( resumeChatBtn ) resumeChatBtn.style.display = 'flex';
		} else {
			if ( startChatBtn ) startChatBtn.style.display = 'flex';
			if ( resumeChatBtn ) resumeChatBtn.style.display = 'none';
		}
	}

	// Toggle panel open/close
	toggleBtn.addEventListener( 'click', function () {
		var isOpen = 'open' === widget.getAttribute( 'data-state' );
		widget.setAttribute( 'data-state', isOpen ? 'closed' : 'open' );

		if ( ! isOpen ) {
			refreshAgentStatus();
			setupButtonsState();
			
			// Always start at welcome screen or direct to active thread if preferred?
			// The user wants a Welcome screen that offers Start vs Resume options, so show Welcome Screen.
			showScreen( 'captlc-screen-welcome' );

			if ( currentTid ) {
				// Keep polling messages in background if thread exists
				startPolling();
				startPresenceHeartbeat();
			}
		}
	} );

	// Close panel buttons inside screens
	var closeButtons = widget.querySelectorAll( '.captlc-widget__panel-close' );
	closeButtons.forEach( function ( btn ) {
		btn.addEventListener( 'click', function () {
			widget.setAttribute( 'data-state', 'closed' );
		} );
	} );

	// Action button: Start new chat
	if ( startChatBtn ) {
		startChatBtn.addEventListener( 'click', function () {
			showScreen( 'captlc-screen-prechat' );
		} );
	}

	// Action button: Resume existing chat
	if ( resumeChatBtn ) {
		resumeChatBtn.addEventListener( 'click', function () {
			showScreen( 'captlc-screen-chat' );
			// Scroll to bottom
			if ( messagesBox ) {
				messagesBox.scrollTop = messagesBox.scrollHeight;
			}
		} );
	}

	// Back navigations
	if ( prechatBack ) {
		prechatBack.addEventListener( 'click', function () {
			showScreen( 'captlc-screen-welcome' );
		} );
	}
	if ( chatBack ) {
		chatBack.addEventListener( 'click', function () {
			showScreen( 'captlc-screen-welcome' );
		} );
	}

	// Pre-chat form submit
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
			showScreen( 'captlc-screen-chat' );
			startPolling();
			startPresenceHeartbeat();
		} ).catch( function () {
			submitBtn.disabled = false;
			showWidgetError( 'Network error — please check your connection and try again.' );
		} );
	} );

	// Typing ping
	replyInput.addEventListener( 'input', sendTypingPing );

	// Emoji picker
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

	// Attachment Upload
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

	// Reply submit
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

	// When opening, if there is a thread, load history messages
	if ( currentTid ) {
		ajax( 'captlc_get_messages', { thread_id: currentTid, since_id: 0 } ).then( function ( res ) {
			if ( res && res.success ) {
				res.data.messages.forEach( appendMessage );
			}
		} );
	}
} )();
