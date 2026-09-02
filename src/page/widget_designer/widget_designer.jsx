import React, { useState, useEffect } from 'react';
import './widget_designer.scss';
import { __ } from '@wordpress/i18n';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';
import Switcher from '../../components/switcher/switcher.jsx';
import Input from '../../components/input/Input.jsx';

const ajax = ( action, data = {} ) => {
	const body = new URLSearchParams( { action, nonce: captlc_data.nonce, ...data } );
	return fetch( captlc_data.ajax_url, {
		method: 'POST', credentials: 'same-origin',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: body.toString(),
	} ).then( ( r ) => r.json() );
};

const COLOR_PRESETS = [
	'#2f6ef0', '#0d9488', '#1e293b', '#3b82f6',
	'#f97316', '#8b5cf6', '#ec4899', '#10b981',
];

const BUTTON_ICONS = [
	{
		id: 'chat1',
		svg: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
			</svg>
		),
	},
	{
		id: 'chat2',
		svg: (
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
			</svg>
		),
	},
	{
		id: 'chat3',
		svg: (
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
				<path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l4.94-1.38A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
				<path d="M8 11h8M8 15h5" strokeLinecap="round"/>
			</svg>
		),
	},
	{
		id: 'chat4',
		svg: (
			<svg viewBox="0 0 24 24" fill="currentColor">
				<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/>
			</svg>
		),
	},
];

const STEPS = [
	{ id: 1, label: __( 'Appearance', 'captain-live-chat' ) },
	{ id: 2, label: __( 'Welcome Screen', 'captain-live-chat' ) },
	{ id: 3, label: __( 'Chat View', 'captain-live-chat' ) },
	{ id: 4, label: __( 'Offline', 'captain-live-chat' ) },
	{ id: 5, label: __( 'Widget settings', 'captain-live-chat' ) },
];

const DEFAULT_WIDGET = {
	accent_color:         '#2f6ef0',
	button_style:         'bubble',
	button_icon:          'chat1',
	position:             'right',
	widget_size:          'default',
	welcome_title:        '👋 Our team is here for you',
	welcome_subtitle:     'We typically reply in a few minutes.',
	welcome_message:      'Hi, how can we help?',
	show_avatar:          true,
	avatar_initials:      'A',
	avatar_bg_color:      '#9ca3af',
	avatar_image_url:     '',
	placeholder_text:     'Write your message…',
	visitor_bubble_color: '#2f6ef0',
	agent_bubble_color:   '#f0f2f5',
	template:             'classic',
	offline_message:      'Leave your message. We\'ll reply soon.',
	poll_interval_ms:     3000,
	quick_replies:        [ 'Pricing', 'Support', 'Get a Demo' ],
};

const Avatar = ( { design, size = 40 } ) => {
	const style = {
		width:          size,
		height:         size,
		borderRadius:   '50%',
		background:     design.avatar_bg_color || '#9ca3af',
		display:        'flex',
		alignItems:     'center',
		justifyContent: 'center',
		color:          '#fff',
		fontWeight:     700,
		fontSize:       size * 0.4,
		flexShrink:     0,
		overflow:       'hidden',
	};

	if ( design.avatar_image_url ) {
		return <div style={ style }><img src={ design.avatar_image_url } alt="" style={ { width: '100%', height: '100%', objectFit: 'cover' } } /></div>;
	}

	return <div style={ style }>{ design.avatar_initials?.charAt( 0 ).toUpperCase() || 'A' }</div>;
};

const WidgetPreview = ( { design, previewScreen, deviceMode, onlineMode } ) => {
	const accent = design.accent_color || '#2f6ef0';

	return (
		<div className={ `captlc-wd-preview-container captlc-wd-preview--${ deviceMode }` }>
			<div className="captlc-wd-preview-device-header">
				<div className="captlc-wd-preview-device-dot"></div>
				<div className="captlc-wd-preview-device-dot"></div>
				<div className="captlc-wd-preview-device-dot"></div>
			</div>
			
			<div className="captlc-wd-preview-device-body">
				<div className={ `captlc-wd-preview__widget captlc-wd-preview__widget--${ design.template || 'classic' }` }>
					{ ! onlineMode ? (
						<>
							<div className="captlc-wd-preview__header" style={ { background: accent } }>
								<div className="captlc-wd-preview__header-content">
									<h2>{ __( 'Offline', 'captain-live-chat' ) }</h2>
									<p>{ __( 'We are currently offline', 'captain-live-chat' ) }</p>
								</div>
							</div>

							<div className="captlc-wd-preview__welcome-body">
								<p className="captlc-wd-preview__offline-msg" style={ { fontSize: 13, color: '#64748b', lineHeight: 1.4, margin: '20px 0' } }>
									{ design.offline_message || 'Leave your message. We\'ll reply soon.' }
								</p>

								<div className="captlc-field" style={ { width: '100%' } }>
									<input type="text" className="captlc-wd-preview__input" placeholder={ __( 'Your Name', 'captain-live-chat' ) } disabled />
								</div>
								<div className="captlc-field" style={ { width: '100%' } }>
									<input type="email" className="captlc-wd-preview__input" placeholder={ __( 'Your Email', 'captain-live-chat' ) } disabled />
								</div>
								<div className="captlc-field" style={ { width: '100%', marginBottom: 20 } }>
									<textarea className="captlc-wd-preview__textarea" rows="2" placeholder={ __( 'Your Message', 'captain-live-chat' ) } disabled></textarea>
								</div>

								<button
									type="button"
									className="captlc-wd-preview__start-btn"
									style={ { background: accent, width: '100%' } }
								>
									{ __( 'Send Message', 'captain-live-chat' ) }
								</button>
							</div>
						</>
					) : (
						<>
							{ previewScreen === 'welcome' && (
								<>
									<div className="captlc-wd-preview__header" style={ { background: accent } }>
										<div className="captlc-wd-preview__header-content">
											<h2>{ design.welcome_title || '👋 Our team is here for you' }</h2>
											<p>{ design.welcome_subtitle || 'We typically reply in a few minutes.' }</p>
										</div>
									</div>

									<div className="captlc-wd-preview__welcome-body">
										<div className="captlc-wd-preview__agent-card">
											{ design.show_avatar && <Avatar design={ design } size={ 44 } /> }
											<div className="captlc-wd-preview__agent-card-right">
												<div className="captlc-wd-preview__online-badge">
													<span className="captlc-wd-preview__online-dot"></span>
													{ __( 'ONLINE', 'captain-live-chat' ) }
												</div>
												<p className="captlc-wd-preview__welcome-msg">{ design.welcome_message || 'Hi, how can we help?' }</p>
											</div>
										</div>

										{ design.quick_replies && design.quick_replies.length > 0 && (
											<div className="captlc-wd-preview__quick-replies" style={ { display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' } }>
												{ design.quick_replies.map( ( qr, idx ) => (
													<span key={ idx } style={ { border: `1px solid ${ accent }`, color: accent, padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 500 } }>
														{ qr }
													</span>
												) ) }
											</div>
										)}

										<button
											type="button"
											className="captlc-wd-preview__start-btn"
											style={ { background: accent, width: '100%', marginBottom: 8 } }
										>
											{ __( 'Start a new chat', 'captain-live-chat' ) }
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={ { marginLeft: 6 } }><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
										</button>

										<button
											type="button"
											className="captlc-wd-preview__start-btn"
											style={ { background: accent, width: '100%', opacity: 0.95 } }
										>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16" style={ { transform: 'scaleX(-1)', marginRight: 6 } }><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
											{ __( 'Return to Conversation', 'captain-live-chat' ) }
										</button>

										<div className="captlc-wd-preview-footer-tabs" style={ { display: 'flex', borderTop: '1px solid #e2e8f0', background: '#ffffff', padding: 6, gap: 6, justifyContent: 'center', marginTop: 16 } }>
											<div className="captlc-wd-preview-footer-tab is-active" style={ { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 6, borderRadius: 6, color: accent, fontSize: 10, fontWeight: 600, background: 'rgba(47, 110, 240, 0.05)' } }>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
													<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
												</svg>
												<span>Chat</span>
											</div>
											<div className="captlc-wd-preview-footer-tab" style={ { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 6, borderRadius: 6, color: '#94a3b8', fontSize: 10, fontWeight: 600 } }>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
													<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
												</svg>
												<span>FAQ</span>
											</div>
										</div>
									</div>
								</>
							) }

							{ previewScreen === 'chat' && (
								<>
									<div className="captlc-wd-preview__chat-header" style={ { background: accent } }>
										{ design.show_avatar && <Avatar design={ design } size={ 36 } /> }
										<span>{ __( 'Agent', 'captain-live-chat' ) }</span>
									</div>

									<div className="captlc-wd-preview__chat-messages">
										<div className="captlc-wd-preview__msg captlc-wd-preview__msg--agent" style={ { background: design.agent_bubble_color } }>
											{ design.welcome_message || 'Hi, how can we help?' }
										</div>
										<div className="captlc-wd-preview__msg captlc-wd-preview__msg--visitor" style={ { background: design.visitor_bubble_color } }>
											Hi, I need help please
										</div>
									</div>

									<div className="captlc-wd-preview__chat-input">
										<span>{ design.placeholder_text || 'Write your message…' }</span>
										<div className="captlc-wd-preview__chat-actions">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
											<div className="captlc-wd-preview__send-btn" style={ { background: accent } }>
												<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
											</div>
										</div>
									</div>
								</>
							) }
						</>
					) }
				</div>

				{ /* Mock launcher button at the bottom of the device container */ }
				<div className="captlc-wd-preview-launcher-row" style={ { display: 'flex', justifyContent: design.position === 'left' ? 'flex-start' : 'flex-end', padding: '12px 16px', marginTop: 12, width: '100%', maxWidth: 280 } }>
					<div
						className="captlc-wd-preview-launcher"
						style={ {
							width: 50,
							height: 50,
							borderRadius: '50%',
							background: accent,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#fff',
							boxShadow: '0 8px 24px rgba(47, 110, 240, 0.35)',
						} }
					>
						<div style={ { width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' } }>
							{ BUTTON_ICONS.find( ( i ) => i.id === design.button_icon )?.svg || BUTTON_ICONS[0].svg }
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const WidgetDesigner = () => {
	const [ rawOption, setRawOption ] = useState( null );
	const [ widgets, setWidgets ] = useState( [] );
	const [ activeId, setActiveId ] = useState( '' );
	const [ step, setStep ] = useState( 1 ); // 1 | 2 | 3 | 4
	const [ deviceMode, setDeviceMode ] = useState( 'desktop' ); // desktop | mobile
	const [ onlineMode, setOnlineMode ] = useState( true ); // true (Online) | false (Offline)
	const [ previewScreen, setPreviewScreen ] = useState( 'welcome' ); // welcome | chat

	// Keep the live preview's tab/state in sync with the current step: Step 2
	// edits the Welcome Screen, Step 3 edits the Chat View, Step 4 edits the
	// Offline experience — so the preview should jump to match, and jump back
	// online if the person steps back to 2 or 3.
	useEffect( () => {
		if ( step === 2 ) {
			setPreviewScreen( 'welcome' );
			setOnlineMode( true );
		} else if ( step === 3 ) {
			setPreviewScreen( 'chat' );
			setOnlineMode( true );
		} else if ( step === 4 ) {
			setOnlineMode( false );
		}
	}, [ step ] );

	const [ saving, setSaving ] = useState( false );
	const [ loading, setLoading ] = useState( true );
	const [ saved, setSaved ] = useState( false );

	const [ quickReplyInput, setQuickReplyInput ] = useState( '' );

	// ── FAQ tab (widget's "FAQ" screen) — separate option, shared across widgets ──
	const [ faqs, setFaqs ] = useState( [] );
	const [ faqsLoaded, setFaqsLoaded ] = useState( false );
	const [ faqSaving, setFaqSaving ] = useState( false );
	const [ faqSaved, setFaqSaved ] = useState( false );
	const [ faqQuestionInput, setFaqQuestionInput ] = useState( '' );
	const [ faqAnswerInput, setFaqAnswerInput ] = useState( '' );
	const [ faqEditingId, setFaqEditingId ] = useState( null );

	useEffect( () => {
		ajax( 'captlc_get_faqs' )
			.then( ( res ) => {
				if ( res?.success ) {
					setFaqs( res.data.faqs || [] );
				}
			} )
			.catch( () => {} )
			.finally( () => setFaqsLoaded( true ) );
	}, [] );

	const saveFaqs = ( nextFaqs ) => {
		setFaqs( nextFaqs );
		setFaqSaving( true );
		ajax( 'captlc_save_faqs', { faqs: JSON.stringify( nextFaqs ) } )
			.then( ( res ) => {
				if ( res?.success ) {
					setFaqs( res.data.faqs || nextFaqs );
					setFaqSaved( true );
					setTimeout( () => setFaqSaved( false ), 2500 );
				}
			} )
			.finally( () => setFaqSaving( false ) );
	};

	const handleFaqSubmit = () => {
		const question = faqQuestionInput.trim();
		const answer   = faqAnswerInput.trim();
		if ( ! question || ! answer ) return;

		if ( faqEditingId ) {
			saveFaqs( faqs.map( ( f ) => f.id === faqEditingId ? { ...f, question, answer } : f ) );
		} else {
			saveFaqs( [ ...faqs, { id: 'faq_' + Date.now().toString( 36 ), question, answer } ] );
		}

		setFaqQuestionInput( '' );
		setFaqAnswerInput( '' );
		setFaqEditingId( null );
	};

	const handleFaqEdit = ( faq ) => {
		setFaqEditingId( faq.id );
		setFaqQuestionInput( faq.question );
		setFaqAnswerInput( faq.answer );
	};

	const handleFaqCancelEdit = () => {
		setFaqEditingId( null );
		setFaqQuestionInput( '' );
		setFaqAnswerInput( '' );
	};

	const handleFaqDelete = ( id ) => {
		saveFaqs( faqs.filter( ( f ) => f.id !== id ) );
		if ( faqEditingId === id ) handleFaqCancelEdit();
	};

	// Load widgets list on mount
	useEffect( () => {
		if ( typeof captlc_data !== 'undefined' && captlc_data?.widget_design && captlc_data.widget_design.widgets ) {
			const option = captlc_data.widget_design;
			setRawOption( option );
			setWidgets( option.widgets || [] );
			setActiveId( option.active_id || option.widgets[0]?.id || '' );
			setLoading( false );
			return;
		}

		ajax( 'captlc_get_widget_design' )
			.then( ( res ) => {
				if ( res?.success ) {
					const option = res.data.design;
					setRawOption( option );
					setWidgets( option.widgets || [] );
					setActiveId( option.active_id || option.widgets[0]?.id || '' );
				}
			} )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
	}, [] );

	const activeWidget = widgets.find( ( w ) => w.id === activeId ) || DEFAULT_WIDGET;

	const updateActive = ( key, value ) => {
		setWidgets( ( prev ) =>
			prev.map( ( w ) => ( w.id === activeId ? { ...w, [ key ]: value } : w ) )
		);
	};

	const saveDesign = ( customWidgets = widgets ) => {
		const updatedWidgets = customWidgets.map( ( w ) => ( {
			...w,
			active: w.id === activeId,
			template: 'classic', // enforce default layout
		} ) );

		const payload = {
			active_id: activeId,
			widgets:   updatedWidgets,
		};

		return ajax( 'captlc_save_widget_design', { design: JSON.stringify( payload ) } )
			.then( ( res ) => {
				if ( res?.success ) {
					setRawOption( res.data.design );
					setWidgets( res.data.design.widgets || [] );
					if ( typeof captlc_data !== 'undefined' && captlc_data.widget_design ) {
						captlc_data.widget_design = res.data.design;
					}
				}
				return res;
			} );
	};

	const handlePublish = () => {
		setSaving( true );
		saveDesign()
			.then( ( res ) => {
				if ( res?.success ) {
					setSaved( true );
					setTimeout( () => {
						setSaved( false );
					}, 2000 );
				} else {
					alert( res?.data?.message || __( 'Publish failed.', 'captain-live-chat' ) );
				}
			} )
			.catch( () => {} )
			.finally( () => setSaving( false ) );
	};

	const handleNext = () => {
		saveDesign();
		setStep( ( s ) => s + 1 );
	};

	const handleBack = () => {
		saveDesign();
		setStep( ( s ) => s - 1 );
	};

	const handleStepClick = ( targetStep ) => {
		saveDesign();
		setStep( targetStep );
	};

	if ( loading ) {
		return <div className="captlc-wd-loading">{ __( 'Loading…', 'captain-live-chat' ) }</div>;
	}

	return (
		<div className="captlc-wd-wrap">
			{ /* ── Wizard Header ── */ }
			<div className="captlc-wd-wizard-header">
				
				<div className="captlc-wd-steps">
					{ STEPS.map( ( s, i ) => (
						<React.Fragment key={ s.id }>
							<button
								type="button"
								className={ `captlc-wd-step-pill${ step === s.id ? ' is-active' : '' }${ step > s.id ? ' is-done' : '' }` }
								onClick={ () => handleStepClick( s.id ) }
							>
								<span className="captlc-wd-step-pill__num">
									{ step > s.id ? '✓' : s.id }
								</span>
								<span className="captlc-wd-step-pill__label">{ s.label }</span>
							</button>
							{ i < STEPS.length - 1 && <span className="captlc-wd-step-connector">&gt;</span> }
						</React.Fragment>
					) ) }
				</div>

				<div className="captlc-wd-wizard-actions">
					{ step > 1 && (
						<button
							type="button"
							className="captlc-secondary-button"
							onClick={ handleBack }
							style={ { marginRight: 8 } }
						>
							{ __( 'Back', 'captain-live-chat' ) }
						</button>
					) }
					{ step < STEPS.length ? (
						<button
							type="button"
							className="captlc-primary-button"
							onClick={ handleNext }
						>
							{ __( 'Next', 'captain-live-chat' ) } <span className="captlc-dir-arrow" aria-hidden="true">→</span>
						</button>
					) : (
						<Primary_button
							text={ saved ? __( '✓ Saved!', 'captain-live-chat' ) : __( 'Save & Publish', 'captain-live-chat' ) }
							loader={ saving }
							onClick={ handlePublish }
						/>
					) }
				</div>
			</div>

			{ /* ── Two column layout: active step controls + preview ── */ }
			<div className="captlc-wd-layout">
				
				{ /* Left Column: Active Step Controls ONLY */ }
				<div className="captlc-wd-controls">
					
				{ /* Widget Name input — only relevant while setting up appearance (step 1) */ }
					{ step === 1 && (
						<div className="captlc-card" style={ { padding: '16px 20px', marginBottom: 12 } }>
							<div className="captlc-field" style={ { marginBottom: 0 } }>
								<label className="captlc-field__label" htmlFor="captlc-wd-name" style={ { fontSize: 10, marginBottom: 4 } }>{ __( 'Widget Name', 'captain-live-chat' ) }</label>
								<Input
									id="captlc-wd-name"
									value={ activeWidget.name || '' }
									onChange={ ( e ) => updateActive( 'name', e.target.value ) }
									placeholder={ __( 'Widget Name', 'captain-live-chat' ) }
								/>
							</div>
						</div>
					) }

					{ /* Wizard step panels */ }
					{ step === 1 && (
						<div className="captlc-card captlc-wd-step-card animate-fade-in">
							<h2 className="captlc-wd-step__title">{ __( 'Widget Appearance', 'captain-live-chat' ) }</h2>
							<p className="captlc-wd-step__desc">{ __( 'Configure your brand colors, position, and button launcher icon.', 'captain-live-chat' ) }</p>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Widget Accent Color', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-color-row">
									{ COLOR_PRESETS.map( ( color ) => (
										<button
											key={ color }
											type="button"
											className={ `captlc-wd-color-swatch${ activeWidget.accent_color === color ? ' is-active' : '' }` }
											style={ { background: color } }
											onClick={ () => updateActive( 'accent_color', color ) }
										>
											{ activeWidget.accent_color === color && <span>✓</span> }
										</button>
									) ) }
									<label className="captlc-wd-color-custom">
										<input
											type="color"
											value={ activeWidget.accent_color || '#2f6ef0' }
											onChange={ ( e ) => updateActive( 'accent_color', e.target.value ) }
										/>
										<span>+</span>
									</label>
								</div>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Button Launcher Icon', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-icon-row">
									{ BUTTON_ICONS.map( ( icon ) => (
										<button
											key={ icon.id }
											type="button"
											className={ `captlc-wd-icon-btn${ activeWidget.button_icon === icon.id ? ' is-active' : '' }` }
											style={ activeWidget.button_icon === icon.id ? { background: activeWidget.accent_color } : {} }
											onClick={ () => updateActive( 'button_icon', icon.id ) }
										>
											{ icon.svg }
										</button>
									) ) }
								</div>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Launcher Alignment Position', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-position-row">
									{ [ { id: 'left', label: __( 'Bottom Left', 'captain-live-chat' ) }, { id: 'right', label: __( 'Bottom Right', 'captain-live-chat' ) } ].map( ( pos ) => (
										<button
											key={ pos.id }
											type="button"
											className={ `captlc-wd-position-btn${ activeWidget.position === pos.id ? ' is-active' : '' }` }
											onClick={ () => updateActive( 'position', pos.id ) }
										>
											{ pos.label }
										</button>
									) ) }
								</div>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Chat Panel Size', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-position-row">
									{ [
										{ id: 'default', label: __( 'Default', 'captain-live-chat' ) },
										{ id: 'large',    label: __( 'Large', 'captain-live-chat' ) },
									].map( ( size ) => (
										<button
											key={ size.id }
											type="button"
											className={ `captlc-wd-position-btn${ ( activeWidget.widget_size || 'default' ) === size.id ? ' is-active' : '' }` }
											onClick={ () => updateActive( 'widget_size', size.id ) }
										>
											{ size.label }
										</button>
									) ) }
								</div>
								<p className="captlc-wd-section__hint">{ __( 'Default fits most sites. Large gives more room for longer conversations.', 'captain-live-chat' ) }</p>
							</div>
						</div>
					) }

					{ step === 2 && (
						<div className="captlc-card captlc-wd-step-card animate-fade-in">
							<h2 className="captlc-wd-step__title">{ __( 'Welcome Screen texts', 'captain-live-chat' ) }</h2>
							<p className="captlc-wd-step__desc">{ __( 'Customize titles and prompts visitors see when clicking the widget.', 'captain-live-chat' ) }</p>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Header Welcome Title', 'captain-live-chat' ) }</label>
								<input
									type="text"
									className="captlc-input-field"
									value={ activeWidget.welcome_title || '' }
									onChange={ ( e ) => updateActive( 'welcome_title', e.target.value ) }
									placeholder="👋 Our team is here for you"
								/>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Welcome Subtitle', 'captain-live-chat' ) }</label>
								<input
									type="text"
									className="captlc-input-field"
									value={ activeWidget.welcome_subtitle || '' }
									onChange={ ( e ) => updateActive( 'welcome_subtitle', e.target.value ) }
									placeholder="We typically reply in a few minutes."
								/>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Launcher Greeting Prompt', 'captain-live-chat' ) }</label>
								<input
									type="text"
									className="captlc-input-field"
									value={ activeWidget.welcome_message || '' }
									onChange={ ( e ) => updateActive( 'welcome_message', e.target.value ) }
									placeholder="Hi, how can we help?"
								/>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label" style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }>
									<span>{ __( 'Show Agent Avatar', 'captain-live-chat' ) }</span>
									<Switcher checked={ !! activeWidget.show_avatar } onChange={ ( e ) => updateActive( 'show_avatar', e.target.checked ) } />
								</label>
							</div>

							{ activeWidget.show_avatar && (
								<div className="captlc-wd-avatar-editor animate-fade-in" style={ { background: 'var(--captlc-bg-hover)', padding: '16px', borderRadius: 8 } }>
									<div className="captlc-wd-avatar-row" style={ { display: 'flex', gap: 14, alignItems: 'center' } }>
										<Avatar design={ activeWidget } size={ 48 } />
										<div style={ { flex: 1, display: 'flex', gap: 10, alignItems: 'flex-end' } }>
											<div style={ { flexShrink: 0 } }>
												<label className="captlc-field__label" htmlFor="captlc-wd-initials" style={ { fontSize: 10 } }>{ __( 'Initials', 'captain-live-chat' ) }</label>
												<input
													id="captlc-wd-initials"
													type="text"
													className="captlc-input-field"
													style={ { width: 50, padding: 6, textAlign: 'center' } }
													maxLength="2"
													value={ activeWidget.avatar_initials || '' }
													onChange={ ( e ) => updateActive( 'avatar_initials', e.target.value.toUpperCase() ) }
												/>
											</div>
											<div style={ { flex: 1, minWidth: 0 } }>
												<label className="captlc-field__label" htmlFor="captlc-wd-image-url" style={ { fontSize: 10 } }>{ __( 'Custom Image URL', 'captain-live-chat' ) }</label>
												<input
													id="captlc-wd-image-url"
													type="url"
													className="captlc-input-field"
													placeholder="https://example.com/avatar.jpg"
													value={ activeWidget.avatar_image_url || '' }
													onChange={ ( e ) => updateActive( 'avatar_image_url', e.target.value ) }
												/>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					) }

					{ step === 3 && (
						<div className="captlc-card captlc-wd-step-card animate-fade-in">
							<h2 className="captlc-wd-step__title">{ __( 'Chat Screen View', 'captain-live-chat' ) }</h2>
							<p className="captlc-wd-step__desc">{ __( 'Customize the active dialog thread window styles.', 'captain-live-chat' ) }</p>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Input Field Placeholder Text', 'captain-live-chat' ) }</label>
								<input
									type="text"
									className="captlc-input-field"
									value={ activeWidget.placeholder_text || '' }
									onChange={ ( e ) => updateActive( 'placeholder_text', e.target.value ) }
									placeholder="Write your message…"
								/>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Visitor Message Bubble Color', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-color-row">
									{ COLOR_PRESETS.map( ( color ) => (
										<button
											key={ color }
											type="button"
											className={ `captlc-wd-color-swatch${ activeWidget.visitor_bubble_color === color ? ' is-active' : '' }` }
											style={ { background: color } }
											onClick={ () => updateActive( 'visitor_bubble_color', color ) }
										>
											{ activeWidget.visitor_bubble_color === color && <span>✓</span> }
										</button>
									) ) }
									<label className="captlc-wd-color-custom">
										<input
											type="color"
											value={ activeWidget.visitor_bubble_color || '#2f6ef0' }
											onChange={ ( e ) => updateActive( 'visitor_bubble_color', e.target.value ) }
										/>
										<span>+</span>
									</label>
								</div>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Agent Message Bubble Background', 'captain-live-chat' ) }</label>
								<div className="captlc-wd-color-row">
									{ [ '#f0f2f5', '#e8f0fe', '#fef3c7', '#f0fdf4', '#fff7ed', '#fdf4ff' ].map( ( color ) => (
										<button
											key={ color }
											type="button"
											className={ `captlc-wd-color-swatch${ activeWidget.agent_bubble_color === color ? ' is-active' : '' }` }
											style={ { background: color, border: '1.5px solid var(--captlc-border)' } }
											onClick={ () => updateActive( 'agent_bubble_color', color ) }
										>
											{ activeWidget.agent_bubble_color === color && <span style={ { color: '#374151' } }>✓</span> }
										</button>
									) ) }
									<label className="captlc-wd-color-custom">
										<input
											type="color"
											value={ activeWidget.agent_bubble_color || '#f0f2f5' }
											onChange={ ( e ) => updateActive( 'agent_bubble_color', e.target.value ) }
										/>
										<span>+</span>
									</label>
								</div>
							</div>
						</div>
					) }

					{ step === 4 && (
						<div className="captlc-card captlc-wd-step-card animate-fade-in">
							<h2 className="captlc-wd-step__title">{ __( 'Offline Experience', 'captain-live-chat' ) }</h2>
							<p className="captlc-wd-step__desc">{ __( 'What visitors see when no agent is online to reply.', 'captain-live-chat' ) }</p>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Offline Welcome Message', 'captain-live-chat' ) }</label>
								<textarea
									className="captlc-textarea"
									rows="3"
									value={ activeWidget.offline_message || '' }
									onChange={ ( e ) => updateActive( 'offline_message', e.target.value ) }
									placeholder="Leave your message. We'll reply soon."
								/>
							</div>
						</div>
					) }

					{ step === 5 && (
						<div className="captlc-card captlc-wd-step-card animate-fade-in">
							<h2 className="captlc-wd-step__title">{ __( 'Widget Settings & Options', 'captain-live-chat' ) }</h2>
							<p className="captlc-wd-step__desc">{ __( 'Configure server intervals, quick responses, and the FAQ tab.', 'captain-live-chat' ) }</p>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Polling Interval (Milliseconds)', 'captain-live-chat' ) }</label>
								<input
									type="number"
									className="captlc-input-field"
									value={ activeWidget.poll_interval_ms || 3000 }
									onChange={ ( e ) => updateActive( 'poll_interval_ms', e.target.value ) }
								/>
								<p className="captlc-field__hint" style={ { fontSize: 11, marginTop: 4, color: 'var(--captlc-text-secondary)' } }>
									{ __( 'Minimum 1500. Lower = more real-time but more server requests.', 'captain-live-chat' ) }
								</p>
							</div>

							<div className="captlc-wd-section">
								<label className="captlc-wd-label">{ __( 'Quick Reply Buttons (Widget)', 'captain-live-chat' ) }</label>
								<div className="captlc-qr-chips" style={ { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 } }>
									{ ( activeWidget.quick_replies || [] ).map( ( qr, idx ) => (
										<span key={ idx } style={ { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--captlc-bg-hover)', border: '1px solid var(--captlc-border)', padding: '4px 10px', borderRadius: 16, fontSize: 12 } }>
											{ qr }
											<button
												type="button"
												onClick={ () => updateActive( 'quick_replies', activeWidget.quick_replies.filter( ( _, j ) => j !== idx ) ) }
												style={ { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 } }
											>×</button>
										</span>
									) ) }
								</div>

								<div className="captlc-qr-add" style={ { display: 'flex', gap: 8 } }>
									<input
										type="text"
										className="captlc-input-field"
										placeholder={ __( 'e.g. Pricing', 'captain-live-chat' ) }
										value={ quickReplyInput }
										onChange={ ( e ) => setQuickReplyInput( e.target.value ) }
										onKeyDown={ ( e ) => {
											if ( e.key === 'Enter' && quickReplyInput.trim() ) {
												e.preventDefault();
												updateActive( 'quick_replies', [ ...( activeWidget.quick_replies || [] ), quickReplyInput.trim() ] );
												setQuickReplyInput( '' );
											}
										} }
									/>
									<button
										type="button"
										className="captlc-secondary-button"
										onClick={ () => {
											if ( quickReplyInput.trim() ) {
												updateActive( 'quick_replies', [ ...( activeWidget.quick_replies || [] ), quickReplyInput.trim() ] );
												setQuickReplyInput( '' );
											}
										} }
									>
										{ __( '+ Add', 'captain-live-chat' ) }
									</button>
								</div>
							</div>

							<div className="captlc-wd-subsection">
								<h3 className="captlc-wd-subsection__title">{ __( 'FAQ tab', 'captain-live-chat' ) }</h3>
								<p className="captlc-wd-step__desc">{ __( 'Questions & answers shown in the widget\'s FAQ tab, so visitors can find quick answers without waiting for a reply.', 'captain-live-chat' ) }</p>

								<div className="captlc-wd-section">
									<label className="captlc-wd-label">{ faqEditingId ? __( 'Edit FAQ', 'captain-live-chat' ) : __( 'Add a new FAQ', 'captain-live-chat' ) }</label>

									<input
										type="text"
										className="captlc-input-field"
										placeholder={ __( 'Question — e.g. How can I track my order?', 'captain-live-chat' ) }
										value={ faqQuestionInput }
										onChange={ ( e ) => setFaqQuestionInput( e.target.value ) }
										style={ { marginBottom: 8 } }
									/>
									<textarea
										className="captlc-input-field"
										rows={ 3 }
										placeholder={ __( 'Answer', 'captain-live-chat' ) }
										value={ faqAnswerInput }
										onChange={ ( e ) => setFaqAnswerInput( e.target.value ) }
										style={ { marginBottom: 8, resize: 'vertical' } }
									/>

									<div style={ { display: 'flex', gap: 8 } }>
										<button
											type="button"
											className="captlc-primary-button"
											disabled={ ! faqQuestionInput.trim() || ! faqAnswerInput.trim() || faqSaving }
											onClick={ handleFaqSubmit }
										>
											{ faqEditingId ? __( 'Save changes', 'captain-live-chat' ) : __( '+ Add FAQ', 'captain-live-chat' ) }
										</button>
										{ faqEditingId && (
											<button type="button" className="captlc-secondary-button" onClick={ handleFaqCancelEdit }>
												{ __( 'Cancel', 'captain-live-chat' ) }
											</button>
										) }
										{ faqSaved && <span style={ { alignSelf: 'center', fontSize: 12, color: 'var(--captlc-success-text, #16a34a)' } }>{ __( '✓ Saved', 'captain-live-chat' ) }</span> }
									</div>
								</div>

								<div className="captlc-wd-section">
									<label className="captlc-wd-label">{ __( 'Current FAQs', 'captain-live-chat' ) }</label>

									{ faqsLoaded && ! faqs.length && (
										<p className="captlc-wd-section__hint">{ __( 'No FAQs yet — add your first one above.', 'captain-live-chat' ) }</p>
									) }

									<div className="captlc-wd-faq-list">
										{ faqs.map( ( faq ) => (
											<div key={ faq.id } className="captlc-wd-faq-row">
												<div className="captlc-wd-faq-row__text">
													<strong>{ faq.question }</strong>
													<span>{ faq.answer }</span>
												</div>
												<div className="captlc-wd-faq-row__actions">
													<button type="button" className="captlc-secondary-button" onClick={ () => handleFaqEdit( faq ) }>{ __( 'Edit', 'captain-live-chat' ) }</button>
													<button type="button" className="captlc-secondary-button captlc-wd-faq-row__delete" onClick={ () => handleFaqDelete( faq.id ) }>{ __( 'Delete', 'captain-live-chat' ) }</button>
												</div>
											</div>
										) ) }
									</div>
								</div>
							</div>
						</div>
					) }


				</div>

				{ /* Right Column: Live Preview */ }
				<div className="captlc-wd-preview-col">
						
						{ /* Live preview label — the preview itself now auto-switches to
						    match whichever step you're on (Welcome/Chat/Offline), so no manual
						    state toggles are needed here. Device size is still switchable via
						    the icons next to it. */ }
						<div className="captlc-wd-preview-screen-tabs">
							<span className="captlc-wd-preview-label-tag">{ __( 'LIVE PREVIEW', 'captain-live-chat' ) }</span>

							{ /* Device toggle */ }
							<div className="captlc-wd-preview-device-toggles">
								<button
									type="button"
									className={ `captlc-wd-toolbar-btn${ deviceMode === 'desktop' ? ' is-active' : '' }` }
									onClick={ () => setDeviceMode( 'desktop' ) }
									title={ __( 'Desktop View', 'captain-live-chat' ) }
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
										<rect x="2" y="3" width="20" height="14" rx="2"/>
										<line x1="8" y1="21" x2="16" y2="21"/>
										<line x1="12" y1="17" x2="12" y2="21"/>
									</svg>
								</button>
								<button
									type="button"
									className={ `captlc-wd-toolbar-btn${ deviceMode === 'mobile' ? ' is-active' : '' }` }
									onClick={ () => setDeviceMode( 'mobile' ) }
									title={ __( 'Mobile View', 'captain-live-chat' ) }
								>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
										<rect x="6" y="2" width="12" height="20" rx="2"/>
										<line x1="11" y1="18" x2="13" y2="18"/>
									</svg>
								</button>
							</div>
						</div>

						{ /* Preview rendering frame */ }
						<WidgetPreview
							design={ activeWidget }
							previewScreen={ previewScreen }
							deviceMode={ deviceMode }
							onlineMode={ onlineMode }
						/>
					</div>

			</div>
		</div>
	);
};

export default WidgetDesigner;
