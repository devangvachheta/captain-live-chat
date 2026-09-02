import React, { useState, useEffect } from 'react';
import './mcp.scss';
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

// Category slugs -> display order + fallback labels (used only until the
// server's own label for each category arrives with the ability list).
const CATEGORY_ORDER = [
	'captlc-conversations',
	'captlc-ai',
	'captlc-content',
	'captlc-configuration',
	'captlc-insights',
];
const CATEGORY_LABELS = {
	'captlc-conversations': __( 'Conversations', 'captain-live-chat' ),
	'captlc-ai':             __( 'AI Auto-Reply', 'captain-live-chat' ),
	'captlc-content':        __( 'Content', 'captain-live-chat' ),
	'captlc-configuration':  __( 'Configuration', 'captain-live-chat' ),
	'captlc-insights':       __( 'Insights', 'captain-live-chat' ),
};

const Mcp = () => {
	const [ loading, setLoading ]     = useState( true );
	const [ available, setAvailable ] = useState( true );
	const [ masterEnabled, setMasterEnabled ] = useState( true );
	const [ abilities, setAbilities ] = useState( [] );
	const [ savingKey, setSavingKey ] = useState( null ); // 'master' | ability name | null

	useEffect( () => {
		ajax( 'captlc_get_mcp_settings' )
			.then( ( res ) => {
				if ( res?.success ) {
					setAvailable( !! res.data.available );
					setMasterEnabled( !! res.data.enabled );
					setAbilities( res.data.abilities || [] );
				}
			} )
			.finally( () => setLoading( false ) );
	}, [] );

	const handleMasterToggle = ( checked ) => {
		setMasterEnabled( checked );
		setSavingKey( 'master' );
		ajax( 'captlc_save_mcp_settings', { enabled: checked ? '1' : '0' } )
			.finally( () => setSavingKey( null ) );
	};

	const handleAbilityToggle = ( name, checked ) => {
		setAbilities( ( prev ) => prev.map( ( a ) => ( a.name === name ? { ...a, enabled: checked } : a ) ) );
		setSavingKey( name );
		ajax( 'captlc_save_mcp_settings', { ability_name: name, ability_enabled: checked ? '1' : '0' } )
			.finally( () => setSavingKey( null ) );
	};

	const grouped = CATEGORY_ORDER
		.map( ( slug ) => ( { slug, items: abilities.filter( ( a ) => a.category === slug ) } ) )
		.filter( ( g ) => g.items.length > 0 );

	return (
		<div className="captlc-mcp">
			<div className="captlc-main__header">
				<h1 className="captlc-main__title">{ __( 'MCP', 'captain-live-chat' ) }</h1>
			</div>
			<p className="captlc-mcp__intro">
				{ __( 'Let AI assistants like Claude or Cursor manage your live chat through natural language, using the WordPress Abilities API.', 'captain-live-chat' ) }
			</p>

			{ loading ? (
				<div className="captlc-card"><p className="captlc-card__desc">{ __( 'Loading…', 'captain-live-chat' ) }</p></div>
			) : ! available ? (
				<div className="captlc-card captlc-card--warning">
					<h2 className="captlc-card__title">{ __( 'MCP needs WordPress 6.9+', 'captain-live-chat' ) }</h2>
					<p className="captlc-card__desc">
						{ __( 'This site\'s WordPress version doesn\'t include the Abilities API yet. Everything else in the plugin works normally — update WordPress under Dashboard → Updates to unlock this page.', 'captain-live-chat' ) }
					</p>
				</div>
			) : (
				<>
					<div className="captlc-card">
						<div className="captlc-toggle-list">
							<label className="captlc-toggle-row captlc-toggle-row--stacked">
								<div className="captlc-toggle-row__text">
									<span className="captlc-toggle-row__label">{ __( 'AI Access', 'captain-live-chat' ) }</span>
									<span className="captlc-toggle-row__desc">{ __( 'Master switch for every ability below. Turn this off to fully block AI clients from this plugin.', 'captain-live-chat' ) }</span>
								</div>
								<Switcher
									checked={ masterEnabled }
									disabled={ 'master' === savingKey }
									onChange={ ( e ) => handleMasterToggle( e.target.checked ) }
								/>
							</label>
						</div>
					</div>

					<div className="captlc-card">
						<h2 className="captlc-card__title">{ __( 'Abilities', 'captain-live-chat' ) }</h2>
						<p className="captlc-card__desc">
							{ __( 'Turn individual abilities on or off. Read-only ones are safe to leave on; consider leaving destructive actions off unless you need them.', 'captain-live-chat' ) }
						</p>

						{ grouped.map( ( group ) => (
							<div className="captlc-mcp__group" key={ group.slug }>
								<h3 className="captlc-mcp__group-title">{ CATEGORY_LABELS[ group.slug ] || group.slug }</h3>
								<div className="captlc-toggle-list">
									{ group.items.map( ( ability ) => (
										<label className="captlc-toggle-row captlc-toggle-row--stacked" key={ ability.name }>
											<div className="captlc-toggle-row__text">
												<span className="captlc-toggle-row__label">
													{ ability.label }
													{ ability.readonly && (
														<span className="captlc-mcp__badge captlc-mcp__badge--readonly">{ __( 'READ-ONLY', 'captain-live-chat' ) }</span>
													) }
													{ ability.destructive && (
														<span className="captlc-mcp__badge captlc-mcp__badge--destructive">{ __( 'DESTRUCTIVE', 'captain-live-chat' ) }</span>
													) }
												</span>
												<span className="captlc-toggle-row__desc">{ ability.description }</span>
											</div>
											<Switcher
												checked={ !! ability.enabled }
												disabled={ ability.name === savingKey }
												onChange={ ( e ) => handleAbilityToggle( ability.name, e.target.checked ) }
											/>
										</label>
									) ) }
								</div>
							</div>
						) ) }
					</div>

					<div className="captlc-card">
						<h2 className="captlc-card__title">{ __( 'Connecting an AI Assistant', 'captain-live-chat' ) }</h2>
						<p className="captlc-card__desc">
							{ __( 'This plugin only registers WordPress Abilities — it doesn\'t run its own MCP server or bundle a connector. A separate, general-purpose MCP bridge plugin (installed once for your whole site) exposes these abilities, along with any other plugin\'s abilities, to AI clients like Claude Desktop or Cursor.', 'captain-live-chat' ) }
						</p>
						<ol className="captlc-mcp__steps">
							<li>{ __( 'Install an Abilities-API-aware MCP bridge plugin of your choice (for example, one from the WordPress.org plugin directory, or the official WordPress MCP Adapter).', 'captain-live-chat' ) }</li>
							<li>{ __( 'Turn on the abilities above that you want AI assistants to be able to use — everything requires an admin account either way.', 'captain-live-chat' ) }</li>
							<li>{ __( 'Follow that bridge plugin\'s own instructions to connect Claude Desktop, Cursor, or another MCP client to your site.', 'captain-live-chat' ) }</li>
						</ol>
						<p className="captlc-card__desc captlc-card__desc--footnote">
							{ __( 'This plugin isn\'t affiliated with any bridge plugin — you\'re free to install, swap, or remove one at any time without affecting the abilities registered here.', 'captain-live-chat' ) }
						</p>
					</div>
				</>
			) }
		</div>
	);
};

export default Mcp;
