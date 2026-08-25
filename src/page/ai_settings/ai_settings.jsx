import React, { useState, useEffect, useRef } from 'react';
import './ai_settings.scss';
import { __, sprintf } from '@wordpress/i18n';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

// ── Provider definitions ──────────────────────────────────────────────────
const PROVIDERS = [
	{
		id:          'groq',
		name:        'Groq',
		badge:       __( 'Free', 'captain-live-chat' ),
		badgeType:   'free',
		placeholder: 'gsk-...',
		models:      [ 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b' ],
		freeLink:    'https://console.groq.com/keys',
	},
	{
		id:          'gemini',
		name:        'Google Gemini',
		badge:       __( 'Free tier', 'captain-live-chat' ),
		badgeType:   'free',
		placeholder: 'AIza...',
		models:      [ 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro' ],
		freeLink:    'https://aistudio.google.com/app/apikey',
	},
	{
		id:          'openai',
		name:        'OpenAI',
		badge:       __( 'Paid', 'captain-live-chat' ),
		badgeType:   'paid',
		placeholder: 'sk-...',
		models:      [ 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo' ],
		freeLink:    'https://platform.openai.com/api-keys',
	},
	{
		id:          'anthropic',
		name:        'Anthropic Claude',
		badge:       __( 'Paid', 'captain-live-chat' ),
		badgeType:   'paid',
		placeholder: 'sk-ant-...',
		models:      [ 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6' ],
		freeLink:    'https://console.anthropic.com/settings/keys',
	},
	{
		id:          'openrouter',
		name:        'OpenRouter',
		badge:       __( 'Free models', 'captain-live-chat' ),
		badgeType:   'free',
		placeholder: 'sk-or-...',
		models:      [ 'meta-llama/llama-3.3-70b-instruct:free' ],
		freeLink:    'https://openrouter.ai/keys',
	},
];

const EyeIcon = ( { off } ) => off ? (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
		<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.36 18.36 0 0 1 4.22-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
		<line x1="1" y1="1" x2="23" y2="23"/>
	</svg>
) : (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
		<path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8z"/>
		<circle cx="12" cy="12" r="3"/>
	</svg>
);

const ChevronIcon = ( { open } ) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={ { transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' } }>
		<polyline points="6 9 12 15 18 9"/>
	</svg>
);

const InfoIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
		<circle cx="12" cy="12" r="10"/>
		<line x1="12" y1="16" x2="12" y2="11"/>
		<line x1="12" y1="8" x2="12.01" y2="8"/>
	</svg>
);

const LockIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
		<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>
);

// ── Field label with an inline "i" tooltip for extra context ─────────────
const LabelWithInfo = ( { children, tip } ) => (
	<label className="captlc-field__label captlc-field__label--with-info">
		{ children }
		<span className="captlc-field__info" tabIndex="0" title={ tip }>
			<InfoIcon />
		</span>
	</label>
);

// ── Enabled / Disabled segmented toggle ───────────────────────────────────
const SegmentedToggle = ( { checked, onChange } ) => (
	<div className="captlc-segmented-toggle" role="group">
		<button
			type="button"
			className={ `captlc-segmented-toggle__btn${ checked ? ' is-active' : '' }` }
			onClick={ () => onChange( true ) }
		>{ __( 'Enabled', 'captain-live-chat' ) }</button>
		<button
			type="button"
			className={ `captlc-segmented-toggle__btn${ ! checked ? ' is-active' : '' }` }
			onClick={ () => onChange( false ) }
		>{ __( 'Disabled', 'captain-live-chat' ) }</button>
	</div>
);

// ── Single provider row (collapsed header + expandable body) ─────────────
const ProviderRow = ( { provider, savedKey, savedKeyPreview, savedModel, isConnected, isActive, expanded, onToggle, onSetActive, onSave, onTest, onRemove } ) => {
	const [ key, setKey ]               = useState( savedKey || '' );
	// Guard against a stale/removed model saved before the model list changed
	// (e.g. Groq retiring `llama-3.3-70b-versatile`) — otherwise the <select>
	// visually shows its first option while still holding the invalid value
	// in state, and that invalid value gets sent to Test/Save.
	const [ model, setModel ]           = useState(
		savedModel && provider.models.includes( savedModel ) ? savedModel : provider.models[ 0 ]
	);
	const [ show, setShow ]             = useState( false );
	const [ saving, setSaving ]         = useState( false );
	const [ testing, setTesting ]       = useState( false );
	const [ testResult, setTestResult ] = useState( null );
	const [ saveResult, setSaveResult ] = useState( null );

	const handleSave = ( e ) => {
		e.stopPropagation();
		setSaving( true );
		setSaveResult( null );
		onSave( provider.id, key.trim(), model )
			.then( ( res ) => {
				setSaveResult( res?.success
					? { ok: true, msg: __( '✓ Saved', 'captain-live-chat' ) }
					: { ok: false, msg: res?.data?.message || __( 'Could not save', 'captain-live-chat' ) }
				);
			} )
			.catch( () => setSaveResult( { ok: false, msg: __( 'Network error — not saved', 'captain-live-chat' ) } ) )
			.finally( () => {
				setSaving( false );
				setTimeout( () => setSaveResult( null ), 3500 );
			} );
	};

	const handleTest = ( e ) => {
		e.stopPropagation();
		if ( ! key.trim() ) return;
		setTesting( true );
		setTestResult( null );
		onTest( provider.id, key.trim(), model )
			.then( ( res ) => {
				setTestResult( res?.success
					? { ok: true,  msg: __( 'Connected', 'captain-live-chat' ) }
					: { ok: false, msg: res?.data?.message || __( 'Connection failed', 'captain-live-chat' ) }
				);
			} )
			.catch( () => setTestResult( { ok: false, msg: __( 'Network error', 'captain-live-chat' ) } ) )
			.finally( () => setTesting( false ) );
	};

	const handleRemove = ( e ) => {
		e.stopPropagation();
		if ( ! window.confirm( __( 'Remove the saved API key for this provider?', 'captain-live-chat' ) ) ) return;
		setSaving( true );
		setSaveResult( null );
		onRemove( provider.id )
			.then( () => {
				setKey( '' );
				setSaveResult( { ok: true, msg: __( 'Key removed', 'captain-live-chat' ) } );
			} )
			.catch( () => setSaveResult( { ok: false, msg: __( 'Network error', 'captain-live-chat' ) } ) )
			.finally( () => {
				setSaving( false );
				setTimeout( () => setSaveResult( null ), 3500 );
			} );
	};

	return (
		<div className={ `captlc-ai-row${ expanded ? ' is-expanded' : '' }${ isActive ? ' is-active-provider' : '' }` }>
			<button type="button" className="captlc-ai-row__head" onClick={ onToggle }>
				<span className={ `captlc-ai-row__dot${ isConnected ? ' is-connected' : '' }` } title={ isConnected ? __( 'Connected', 'captain-live-chat' ) : __( 'Not connected', 'captain-live-chat' ) } />
				<span className="captlc-ai-row__name">{ provider.name }</span>
				<span className={ `captlc-ai-row__badge captlc-ai-row__badge--${ provider.badgeType }` }>{ provider.badge }</span>
				{ isActive && <span className="captlc-ai-row__active-tag">{ __( 'Active', 'captain-live-chat' ) }</span> }
				<span className="captlc-ai-row__spacer" />
				<span className="captlc-ai-row__status">{ isConnected ? __( 'Connected', 'captain-live-chat' ) : __( 'Not connected', 'captain-live-chat' ) }</span>
				<ChevronIcon open={ expanded } />
			</button>

			{ expanded && (
				<div className="captlc-ai-row__body">
					<div className="captlc-ai-row__field-grid">
						<div className="captlc-ai-row__field">
							<label className="captlc-field__label">{ __( 'API Key', 'captain-live-chat' ) }</label>
							<div className="captlc-ai-row__key-input">
								<input
									type={ show ? 'text' : 'password' }
									className="captlc-input-field"
									placeholder={ isConnected && ! key ? ( savedKeyPreview || __( 'Saved — enter a new key to replace it', 'captain-live-chat' ) ) : provider.placeholder }
									value={ key }
									onChange={ ( e ) => setKey( e.target.value ) }
								/>
								{ /* Nothing to reveal when the field is empty — the masked
								   preview shown as a placeholder (e.g. gsk_••••••••PPMG) is
								   never the real key and toggling type=text/password on an
								   empty input has no visible effect, which read as "broken". */ }
								{ key && (
									<button type="button" className="captlc-ai-row__show-btn" onClick={ () => setShow( ( v ) => ! v ) } title={ show ? __( 'Hide', 'captain-live-chat' ) : __( 'Show', 'captain-live-chat' ) }>
										<EyeIcon off={ show } />
									</button>
								) }
							</div>
						</div>

						<div className="captlc-ai-row__field captlc-ai-row__field--model">
							<label className="captlc-field__label">{ __( 'Model', 'captain-live-chat' ) }</label>
							<select className="captlc-select" value={ model } onChange={ ( e ) => setModel( e.target.value ) }>
								{ provider.models.map( ( m ) => <option key={ m } value={ m }>{ m }</option> ) }
							</select>
						</div>
					</div>

					<div className="captlc-ai-row__footer">
						<div className="captlc-ai-row__footer-left">
							<a href={ provider.freeLink } target="_blank" rel="noopener noreferrer" className="captlc-ai-row__free-link">
								{ __( 'Get free API key', 'captain-live-chat' ) } →
							</a>
							{ testResult && (
								<span className={ `captlc-ai-row__test-result${ testResult.ok ? ' is-ok' : ' is-fail' }` }>
									{ testResult.msg }
								</span>
							) }
							{ saveResult && (
								<span className={ `captlc-ai-row__test-result${ saveResult.ok ? ' is-ok' : ' is-fail' }` }>
									{ saveResult.msg }
								</span>
							) }
						</div>
						<div className="captlc-ai-row__footer-right">
							{ ! isActive && (
								<button type="button" className="captlc-secondary-button captlc-ai-row__small-btn" onClick={ ( e ) => { e.stopPropagation(); onSetActive( provider.id ); } }>
									{ __( 'Set as active', 'captain-live-chat' ) }
								</button>
							) }
							{ isConnected && (
								<button type="button" className="captlc-secondary-button captlc-ai-row__small-btn captlc-ai-row__remove-btn" onClick={ handleRemove } disabled={ saving }>
									{ __( 'Remove key', 'captain-live-chat' ) }
								</button>
							) }
							<button type="button" className="captlc-secondary-button captlc-ai-row__small-btn" onClick={ handleTest } disabled={ testing || ! key.trim() }>
								{ testing ? __( 'Testing…', 'captain-live-chat' ) : __( 'Test', 'captain-live-chat' ) }
							</button>
							<button type="button" className="captlc-primary-button captlc-ai-row__small-btn" onClick={ handleSave } disabled={ saving }>
								{ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save', 'captain-live-chat' ) }
							</button>
						</div>
					</div>
				</div>
			) }
		</div>
	);
};

// ── Knowledge Base ─────────────────────────────────────────────────────────
const KnowledgeIcon = ( { type } ) => type === 'url' ? (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
		<circle cx="12" cy="12" r="10"/>
		<line x1="2" y1="12" x2="22" y2="12"/>
		<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
	</svg>
) : (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
		<polyline points="14 2 14 8 20 8"/>
	</svg>
);

const TrashIcon = () => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
		<polyline points="3 6 5 6 21 6"/>
		<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
	</svg>
);

const KnowledgeBaseSection = () => {
	const [ entries, setEntries ]       = useState( [] );
	const [ loading, setLoading ]       = useState( true );
	const [ urlInput, setUrlInput ]     = useState( '' );
	const [ addingUrl, setAddingUrl ]   = useState( false );
	const [ uploading, setUploading ]   = useState( false );
	const [ error, setError ]           = useState( '' );
	const fileInputRef = useRef( null );

	const loadEntries = () => {
		ajax( 'captlc_get_knowledge' ).then( ( res ) => {
			if ( res?.success ) setEntries( res.data.entries || [] );
		} ).catch( () => {} ).finally( () => setLoading( false ) );
	};

	useEffect( () => { loadEntries(); }, [] );

	const handleAddUrl = () => {
		if ( ! urlInput.trim() || addingUrl ) return;
		setAddingUrl( true );
		setError( '' );
		ajax( 'captlc_add_knowledge_url', { url: urlInput.trim() } )
			.then( ( res ) => {
				if ( res?.success ) {
					setEntries( ( prev ) => [ ...prev, res.data.entry ] );
					setUrlInput( '' );
				} else {
					setError( res?.data?.message || __( 'Could not add this link.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => setError( __( 'Network error.', 'captain-live-chat' ) ) )
			.finally( () => setAddingUrl( false ) );
	};

	const handleFilePick = ( e ) => {
		const file = e.target.files && e.target.files[ 0 ];
		if ( ! file ) return;
		setUploading( true );
		setError( '' );

		const body = new FormData();
		body.append( 'action', 'captlc_upload_knowledge_file' );
		body.append( 'nonce', captlc_data.nonce );
		body.append( 'captlc_knowledge_file', file );

		fetch( captlc_data.ajax_url, { method: 'POST', credentials: 'same-origin', body } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				if ( res?.success ) {
					setEntries( ( prev ) => [ ...prev, res.data.entry ] );
				} else {
					setError( res?.data?.message || __( 'Could not process this file.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => setError( __( 'Network error.', 'captain-live-chat' ) ) )
			.finally( () => {
				setUploading( false );
				if ( fileInputRef.current ) fileInputRef.current.value = '';
			} );
	};

	const handleDelete = ( id ) => {
		setEntries( ( prev ) => prev.filter( ( e ) => e.id !== id ) );
		ajax( 'captlc_delete_knowledge', { id } ).catch( () => {} );
	};

	return (
		<div className="captlc-ai-kb-section">
			<div className="captlc-ai-kb-section__head">
				<h3 className="captlc-ai-kb-section__title">{ __( 'Knowledge Base', 'captain-live-chat' ) }</h3>
				<p className="captlc-card__desc">
					{ __( 'Add documents or website links. The AI reads them and uses the content to answer visitor questions.', 'captain-live-chat' ) }
				</p>
			</div>

			{ error && (
				<div className="captlc-notice captlc-notice--error captlc-ai-kb__notice">{ error }</div>
			) }

			<div className="captlc-ai-kb__add-row">
				<input
					type="url"
					className="captlc-input-field"
					placeholder={ __( 'https://yoursite.com/faq', 'captain-live-chat' ) }
					value={ urlInput }
					onChange={ ( e ) => setUrlInput( e.target.value ) }
					onKeyDown={ ( e ) => { if ( 'Enter' === e.key ) handleAddUrl(); } }
				/>
				<button type="button" className="captlc-secondary-button captlc-ai-row__small-btn" onClick={ handleAddUrl } disabled={ addingUrl || ! urlInput.trim() }>
					{ addingUrl ? __( 'Adding…', 'captain-live-chat' ) : __( 'Add Link', 'captain-live-chat' ) }
				</button>

				<span className="captlc-ai-kb__or">{ __( 'or', 'captain-live-chat' ) }</span>

				<input
					type="file"
					ref={ fileInputRef }
					accept=".pdf,.txt,application/pdf,text/plain"
					onChange={ handleFilePick }
					style={ { display: 'none' } }
					id="captlc-kb-file"
				/>
				<label htmlFor="captlc-kb-file" className="captlc-secondary-button captlc-ai-row__small-btn captlc-ai-kb__upload-btn">
					{ uploading ? __( 'Reading…', 'captain-live-chat' ) : __( 'Upload PDF / .txt', 'captain-live-chat' ) }
				</label>
			</div>

			{ ! loading && entries.length > 0 && (
				<div className="captlc-ai-kb__list">
					{ entries.map( ( entry ) => (
						<div key={ entry.id } className="captlc-ai-kb__item">
							<span className="captlc-ai-kb__item-icon"><KnowledgeIcon type={ entry.type } /></span>
							<div className="captlc-ai-kb__item-body">
								<span className="captlc-ai-kb__item-title">{ entry.title }</span>
								<span className="captlc-ai-kb__item-meta">
									{ entry.type === 'url' ? entry.source : `${ entry.char_count.toLocaleString() } ${ __( 'characters', 'captain-live-chat' ) }` }
								</span>
							</div>
							<button type="button" className="captlc-ai-kb__delete-btn" onClick={ () => handleDelete( entry.id ) } title={ __( 'Remove', 'captain-live-chat' ) }>
								<TrashIcon />
							</button>
						</div>
					) ) }
				</div>
			) }

			{ ! loading && entries.length === 0 && (
				<p className="captlc-ai-kb__empty">{ __( 'No sources added yet.', 'captain-live-chat' ) }</p>
			) }
		</div>
	);
};

// ── Main AI Settings page ─────────────────────────────────────────────────
const AiSettings = () => {
	const [ providerData, setProviderData ]     = useState( {} );
	const [ autoReply, setAutoReply ]           = useState( false );
	const [ activeProvider, setActiveProvider ] = useState( 'groq' );
	const [ systemPrompt, setSystemPrompt ]     = useState( '' );
	const [ dailyLimit, setDailyLimit ]         = useState( 0 );
	const [ usageToday, setUsageToday ]         = useState( 0 );
	const [ lastError, setLastError ]           = useState( null );
	const [ loading, setLoading ]               = useState( true );
	const [ notice, setNotice ]                 = useState( null );
	const [ savingGeneral, setSavingGeneral ]   = useState( false );
	const [ expandedId, setExpandedId ]         = useState( null );

	useEffect( () => {
		ajax( 'captlc_get_ai_settings' ).then( ( res ) => {
			if ( res?.success ) {
				setProviderData( res.data.providers || {} );
				setAutoReply( !! res.data.auto_reply_enabled );
				setActiveProvider( res.data.active_provider || 'groq' );
				setSystemPrompt( res.data.system_prompt || '' );
				setDailyLimit( res.data.daily_limit || 0 );
				setUsageToday( res.data.usage_today || 0 );
				setLastError( res.data.last_error || null );
				setExpandedId( res.data.active_provider || 'groq' );
			}
		} ).catch( () => {} ).finally( () => setLoading( false ) );
	}, [] );

	const showNotice = ( msg, type = 'success' ) => {
		setNotice( { msg, type } );
		setTimeout( () => setNotice( null ), 3500 );
	};

	const handleSaveProvider = ( providerId, key, model ) => {
		return ajax( 'captlc_save_ai_provider', { provider: providerId, api_key: key, model } )
			.then( ( res ) => {
				if ( res?.success ) {
					// Trust the backend's view of connected/key_preview rather than
					// guessing from the (possibly blank) key we just sent — a blank
					// key with an existing saved key means "still connected", not
					// "disconnected".
					setProviderData( ( prev ) => ( {
						...prev,
						[ providerId ]: {
							model,
							connected:   !! res.data?.connected,
							key_preview: res.data?.key_preview || '',
						},
					} ) );
				}
				return res;
			} );
	};

	const handleRemoveProvider = ( providerId ) => {
		return ajax( 'captlc_save_ai_provider', { provider: providerId, remove: '1' } )
			.then( ( res ) => {
				if ( res?.success ) {
					setProviderData( ( prev ) => ( {
						...prev,
						[ providerId ]: { model: '', connected: false, key_preview: '' },
					} ) );
				}
				return res;
			} );
	};

	const handleTestProvider = ( providerId, key, model ) => {
		return ajax( 'captlc_test_ai_provider', { provider: providerId, api_key: key, model } );
	};

	const handleSetActive = ( providerId ) => {
		setActiveProvider( providerId );
		ajax( 'captlc_save_ai_general', {
			auto_reply_enabled: autoReply ? '1' : '0',
			active_provider:    providerId,
			system_prompt:      systemPrompt,
			daily_limit:        dailyLimit,
		} ).then( ( res ) => {
			if ( res?.success ) showNotice( __( 'Active provider updated.', 'captain-live-chat' ) );
		} );
	};

	const handleSaveGeneral = () => {
		setSavingGeneral( true );
		ajax( 'captlc_save_ai_general', {
			auto_reply_enabled: autoReply ? '1' : '0',
			active_provider:    activeProvider,
			system_prompt:      systemPrompt,
			daily_limit:        dailyLimit,
		} ).then( ( res ) => {
			if ( res?.success ) showNotice( __( 'Settings saved.', 'captain-live-chat' ) );
			else showNotice( res?.data?.message || __( 'Save failed.', 'captain-live-chat' ), 'error' );
		} ).catch( () => showNotice( __( 'Network error.', 'captain-live-chat' ), 'error' ) )
		.finally( () => setSavingGeneral( false ) );
	};

	if ( loading ) return <div className="captlc-ai-loading">{ __( 'Loading…', 'captain-live-chat' ) }</div>;

	return (
		<div className="captlc-ai-settings">
			<div className="captlc-main__header captlc-ai-settings__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'AI Auto-Reply', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Answer visitors automatically when every agent is offline.', 'captain-live-chat' ) }</p>
				</div>
			</div>

			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` }>{ notice.msg }</div>
			) }

			{ lastError && (
				<div className="captlc-notice captlc-notice--error" role="alert">
					{ sprintf(
						/* translators: %s: the AI provider's error message */
						__( 'AI auto-reply failed recently: %s — visitors got the offline-message fallback instead. Check your API key and provider status.', 'captain-live-chat' ),
						lastError.message
					) }
					<button
						type="button"
						className="captlc-notice__close"
						onClick={ () => setLastError( null ) }
						aria-label={ __( 'Dismiss', 'captain-live-chat' ) }
					>✕</button>
				</div>
			) }

			{ /* ── General settings — compact ── */ }
			<div className="captlc-card captlc-ai-general">
				<div className="captlc-ai-general__head">
					<span className="captlc-ai-general__head-label">{ __( 'Enable AI auto-reply when all agents are offline', 'captain-live-chat' ) }</span>
					<SegmentedToggle checked={ autoReply } onChange={ ( val ) => setAutoReply( val ) } />
				</div>

				<div className={ `captlc-ai-general__body${ ! autoReply ? ' is-disabled' : '' }` }>
					{ ! autoReply && (
						<div className="captlc-ai-general__overlay">
							<span className="captlc-ai-general__overlay-badge">
								<LockIcon />
								{ __( 'AI Auto-Reply is currently inactive', 'captain-live-chat' ) }
							</span>
						</div>
					) }

					<div className="captlc-ai-general__fields">
						<div className="captlc-field captlc-ai-general__prompt-field">
							<LabelWithInfo tip={ __( 'Optional — add extra instructions specific to your business (tone, topics to focus on, what to avoid). A baseline persona is already applied automatically, so the assistant never claims to be ChatGPT/another AI provider and won\'t reply with everything as a giant table.', 'captain-live-chat' ) }>
								{ __( 'System Prompt', 'captain-live-chat' ) }
							</LabelWithInfo>
							<textarea
								className="captlc-textarea"
								rows="3"
								placeholder={ __( 'e.g. Focus on pricing and shipping questions. Recommend booking a call for anything about custom orders.', 'captain-live-chat' ) }
								value={ systemPrompt }
								onChange={ ( e ) => setSystemPrompt( e.target.value ) }
							/>
						</div>

						<div className="captlc-field captlc-ai-general__limit-field">
							<div className="captlc-ai-general__limit-row">
								<LabelWithInfo tip={ __( 'Set a number to cap how many AI replies go out per day (protects against a traffic spike or bots running up your API bill). Once reached, visitors get the offline-message fallback until it resets at midnight. Leave at 0 for unlimited.', 'captain-live-chat' ) }>
									{ __( 'Daily reply limit', 'captain-live-chat' ) }
								</LabelWithInfo>
								<input
									type="number"
									min="0"
									className="captlc-input-field captlc-ai-general__limit-input"
									value={ dailyLimit }
									onChange={ ( e ) => setDailyLimit( Math.max( 0, parseInt( e.target.value, 10 ) || 0 ) ) }
								/>
							</div>
							{ Number( dailyLimit ) > 0 && (
								<p className="captlc-field__hint captlc-ai-general__limit-hint">
									{ sprintf(
										/* translators: 1: replies sent today, 2: configured daily limit */
										__( 'Sent %1$d of %2$d today.', 'captain-live-chat' ),
										usageToday,
										dailyLimit
									) }
								</p>
							) }
						</div>

						<div className="captlc-ai-general__kb-wrap">
							<KnowledgeBaseSection />
						</div>
					</div>

					<div className="captlc-ai-general__divider" />

					<div className="captlc-form-actions">
						<button
							type="button"
							className="captlc-primary-button captlc-ai-row__small-btn"
							onClick={ handleSaveGeneral }
							disabled={ savingGeneral }
						>{ savingGeneral ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Settings', 'captain-live-chat' ) }</button>
					</div>
				</div>
			</div>

			{ /* ── Providers — compact accordion list ── */ }
			<div className="captlc-card captlc-ai-providers">
				<div className="captlc-ai-providers__head">
					<h2 className="captlc-card__title">{ __( 'Providers', 'captain-live-chat' ) }</h2>
					<p className="captlc-card__desc">{ __( 'Click a provider to add its key. Groq and Gemini are free, no card needed.', 'captain-live-chat' ) }</p>
				</div>

				<div className="captlc-ai-providers__list">
					{ PROVIDERS.map( ( provider ) => {
						const saved = providerData[ provider.id ] || {};
						return (
							<ProviderRow
								key={ provider.id }
								provider={ provider }
								savedKey={ saved.key || '' }
								savedKeyPreview={ saved.key_preview || '' }
								savedModel={ saved.model || provider.models[ 0 ] }
								isConnected={ !! saved.connected }
								isActive={ activeProvider === provider.id }
								expanded={ expandedId === provider.id }
								onToggle={ () => setExpandedId( ( id ) => id === provider.id ? null : provider.id ) }
								onSetActive={ handleSetActive }
								onSave={ handleSaveProvider }
								onTest={ handleTestProvider }
								onRemove={ handleRemoveProvider }
							/>
						);
					} ) }
				</div>
			</div>
		</div>
	);
};

export default AiSettings;
