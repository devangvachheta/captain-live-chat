import React, { useState, useEffect } from 'react';
import './ai_settings.scss';
import { __ } from '@wordpress/i18n';
import Switcher from '../../components/switcher/switcher.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

// ── Provider definitions (same as Captain AI Studio) ─────────────────────
const PROVIDERS = [
	{
		id:         'groq',
		name:       'Groq',
		badge:      __( 'Free — No Credit Card', 'captain-live-chat' ),
		badgeType:  'free',
		placeholder:'gsk-...',
		models:     [ 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768' ],
		freeLink:   'https://console.groq.com/keys',
		hasTest:    true,
	},
	{
		id:         'gemini',
		name:       'Google Gemini',
		badge:      __( 'Free Tier Available', 'captain-live-chat' ),
		badgeType:  'free',
		placeholder:'AIza...',
		models:     [ 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro' ],
		freeLink:   'https://aistudio.google.com/app/apikey',
		hasTest:    true,
	},
	{
		id:         'openai',
		name:       'OpenAI',
		badge:      __( 'Pay-As-You-Go', 'captain-live-chat' ),
		badgeType:  'paid',
		placeholder:'sk-...',
		models:     [ 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo' ],
		freeLink:   'https://platform.openai.com/api-keys',
		hasTest:    true,
	},
	{
		id:         'anthropic',
		name:       'Anthropic Claude',
		badge:      __( 'Pay-As-You-Go', 'captain-live-chat' ),
		badgeType:  'paid',
		placeholder:'sk-ant-...',
		models:     [ 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6' ],
		freeLink:   'https://console.anthropic.com/settings/keys',
		hasTest:    true,
	},
	{
		id:         'openrouter',
		name:       'OpenRouter',
		badge:      __( 'Free Models Available', 'captain-live-chat' ),
		badgeType:  'free',
		placeholder:'sk-or-...',
		models:     [ 'meta-llama/llama-3.3-70b-instruct:free' ],
		freeLink:   'https://openrouter.ai/keys',
		hasTest:    true,
	},
];

// ── Single provider card ──────────────────────────────────────────────────
const ProviderCard = ( { provider, savedKey, savedModel, isConnected, onSave, onTest } ) => {
	const [ key, setKey ]           = useState( savedKey || '' );
	const [ model, setModel ]       = useState( savedModel || provider.models[ 0 ] );
	const [ show, setShow ]         = useState( false );
	const [ saving, setSaving ]     = useState( false );
	const [ testing, setTesting ]   = useState( false );
	const [ testResult, setTestResult ] = useState( null );

	const handleSave = () => {
		setSaving( true );
		onSave( provider.id, key, model ).finally( () => setSaving( false ) );
	};

	const handleTest = () => {
		if ( ! key.trim() ) return;
		setTesting( true );
		setTestResult( null );
		onTest( provider.id, key, model )
			.then( ( res ) => {
				setTestResult( res?.success
					? { ok: true,  msg: __( '✓ Connected', 'captain-live-chat' ) }
					: { ok: false, msg: res?.data?.message || __( '✗ Connection failed', 'captain-live-chat' ) }
				);
			} )
			.catch( () => setTestResult( { ok: false, msg: __( '✗ Network error', 'captain-live-chat' ) } ) )
			.finally( () => setTesting( false ) );
	};

	return (
		<div className={ `captlc-ai-card${ isConnected ? ' is-connected' : '' }` }>
			<div className="captlc-ai-card__header">
				<div className="captlc-ai-card__title-row">
					<span className="captlc-ai-card__name">{ provider.name }</span>
					<span className={ `captlc-ai-card__badge captlc-ai-card__badge--${ provider.badgeType }` }>
						{ '🆓 ' }{ provider.badge }
					</span>
				</div>
				{ isConnected
					? <span className="captlc-ai-card__status captlc-ai-card__status--connected">✓ { __( 'Connected', 'captain-live-chat' ) }</span>
					: <span className="captlc-ai-card__status">{ __( 'Not Connected', 'captain-live-chat' ) }</span>
				}
			</div>

			<div className="captlc-ai-card__body">
				<label className="captlc-field__label">{ __( 'API Key', 'captain-live-chat' ) }</label>
				<div className="captlc-ai-card__key-row">
					<input
						type={ show ? 'text' : 'password' }
						className="captlc-input-field"
						placeholder={ provider.placeholder }
						value={ key }
						onChange={ ( e ) => setKey( e.target.value ) }
					/>
					<button
						type="button"
						className="captlc-ai-card__show-btn"
						onClick={ () => setShow( ( v ) => ! v ) }
						title={ show ? __( 'Hide', 'captain-live-chat' ) : __( 'Show', 'captain-live-chat' ) }
					>{ show ? '🙈' : '👁' }</button>

					{ provider.hasTest && (
						<button
							type="button"
							className="captlc-ai-card__test-btn"
							onClick={ handleTest }
							disabled={ testing || ! key.trim() }
						>{ testing ? __( '…', 'captain-live-chat' ) : __( 'Test', 'captain-live-chat' ) }</button>
					) }
				</div>

				{ testResult && (
					<div className={ `captlc-ai-card__test-result captlc-ai-card__test-result--${ testResult.ok ? 'ok' : 'fail' }` }>
						{ testResult.msg }
					</div>
				) }

				<div className="captlc-ai-card__models-row">
					<span className="captlc-field__label">{ __( 'Model:', 'captain-live-chat' ) }</span>
					<div className="captlc-ai-card__models">
						{ provider.models.map( ( m ) => (
							<button
								key={ m }
								type="button"
								className={ `captlc-ai-card__model-chip${ model === m ? ' is-active' : '' }` }
								onClick={ () => setModel( m ) }
							>{ m }</button>
						) ) }
					</div>
				</div>

				<div className="captlc-ai-card__footer">
					<a
						href={ provider.freeLink }
						target="_blank"
						rel="noopener noreferrer"
						className="captlc-ai-card__free-link"
					>{ __( 'Get free API key →', 'captain-live-chat' ) }</a>

					<button
						type="button"
						className="captlc-primary-button"
						onClick={ handleSave }
						disabled={ saving }
					>{ saving ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save', 'captain-live-chat' ) }</button>
				</div>
			</div>
		</div>
	);
};

// ── Main AI Settings page ─────────────────────────────────────────────────
const AiSettings = () => {
	const [ providerData, setProviderData ]   = useState( {} );
	const [ autoReply, setAutoReply ]         = useState( false );
	const [ activeProvider, setActiveProvider ] = useState( 'groq' );
	const [ systemPrompt, setSystemPrompt ]   = useState( '' );
	const [ loading, setLoading ]             = useState( true );
	const [ notice, setNotice ]               = useState( null );
	const [ savingGeneral, setSavingGeneral ] = useState( false );

	useEffect( () => {
		ajax( 'captlc_get_ai_settings' ).then( ( res ) => {
			if ( res?.success ) {
				setProviderData( res.data.providers || {} );
				setAutoReply( !! res.data.auto_reply_enabled );
				setActiveProvider( res.data.active_provider || 'groq' );
				setSystemPrompt( res.data.system_prompt || '' );
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
					setProviderData( ( prev ) => ( { ...prev, [ providerId ]: { key, model, connected: !! key } } ) );
					showNotice( __( 'Provider saved.', 'captain-live-chat' ) );
				} else {
					showNotice( res?.data?.message || __( 'Save failed.', 'captain-live-chat' ), 'error' );
				}
			} )
			.catch( () => showNotice( __( 'Network error.', 'captain-live-chat' ), 'error' ) );
	};

	const handleTestProvider = ( providerId, key, model ) => {
		return ajax( 'captlc_test_ai_provider', { provider: providerId, api_key: key, model } );
	};

	const handleSaveGeneral = () => {
		setSavingGeneral( true );
		ajax( 'captlc_save_ai_general', {
			auto_reply_enabled: autoReply ? '1' : '0',
			active_provider:    activeProvider,
			system_prompt:      systemPrompt,
		} ).then( ( res ) => {
			if ( res?.success ) showNotice( __( 'Settings saved.', 'captain-live-chat' ) );
			else showNotice( res?.data?.message || __( 'Save failed.', 'captain-live-chat' ), 'error' );
		} ).catch( () => showNotice( __( 'Network error.', 'captain-live-chat' ), 'error' ) )
		.finally( () => setSavingGeneral( false ) );
	};

	if ( loading ) return <div className="captlc-ai-loading">{ __( 'Loading…', 'captain-live-chat' ) }</div>;

	return (
		<div className="captlc-ai-settings">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'AI Auto-Reply', 'captain-live-chat' ) }</h1>
					<p className="captlc-main__subtitle">{ __( 'Connect your AI providers. Start free with Groq or Gemini — no credit card needed.', 'captain-live-chat' ) }</p>
				</div>
			</div>

			{ notice && (
				<div className={ `captlc-notice captlc-notice--${ notice.type }` }>{ notice.msg }</div>
			) }

			{ /* ── General settings ── */ }
			<div className="captlc-card captlc-ai-general">
				<h2 className="captlc-card__title">{ __( 'Auto-Reply Settings', 'captain-live-chat' ) }</h2>

				<div className="captlc-ai-general__row">
					<label className="captlc-toggle-row">
						<Switcher checked={ autoReply } onChange={ ( e ) => setAutoReply( e.target.checked ) } />
						<span>{ __( 'Enable AI auto-reply when all agents are offline', 'captain-live-chat' ) }</span>
					</label>
				</div>

				<div className="captlc-field" style={ { marginTop: '16px' } }>
					<label className="captlc-field__label">{ __( 'Active Provider', 'captain-live-chat' ) }</label>
					<div className="captlc-ai-general__provider-pills">
						{ PROVIDERS.map( ( p ) => (
							<button
								key={ p.id }
								type="button"
								className={ `captlc-ai-general__pill${ activeProvider === p.id ? ' is-active' : '' }` }
								onClick={ () => setActiveProvider( p.id ) }
							>{ p.name }</button>
						) ) }
					</div>
				</div>

				<div className="captlc-field" style={ { marginTop: '16px' } }>
					<label className="captlc-field__label">
						{ __( 'System Prompt / Instructions', 'captain-live-chat' ) }
					</label>
					<textarea
						className="captlc-textarea"
						rows="4"
						placeholder={ __( 'You are a helpful support assistant for our website. Answer visitor questions politely and concisely. If you cannot help, ask them to leave their email and we will follow up.', 'captain-live-chat' ) }
						value={ systemPrompt }
						onChange={ ( e ) => setSystemPrompt( e.target.value ) }
					/>
				</div>

				<div className="captlc-form-actions" style={ { marginTop: '16px' } }>
					<button
						type="button"
						className="captlc-primary-button"
						onClick={ handleSaveGeneral }
						disabled={ savingGeneral }
					>{ savingGeneral ? __( 'Saving…', 'captain-live-chat' ) : __( 'Save Settings', 'captain-live-chat' ) }</button>
				</div>
			</div>

			{ /* ── Provider cards grid ── */ }
			<div className="captlc-ai-grid">
				{ PROVIDERS.map( ( provider ) => {
					const saved = providerData[ provider.id ] || {};
					return (
						<ProviderCard
							key={ provider.id }
							provider={ provider }
							savedKey={ saved.key || '' }
							savedModel={ saved.model || provider.models[ 0 ] }
							isConnected={ !! saved.connected }
							onSave={ handleSaveProvider }
							onTest={ handleTestProvider }
						/>
					);
				} ) }
			</div>
		</div>
	);
};

export default AiSettings;
