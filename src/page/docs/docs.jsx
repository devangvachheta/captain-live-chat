import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import './docs.scss';

// ─── Documentation Data ───────────────────────────────────────────────────────
const DOCS = [
	{
		key: 'getting-started',
		icon: '🚀',
		title: __( 'Getting Started', 'captain-live-chat' ),
		desc: __( 'What to set up first after installing Captain Live Chat.', 'captain-live-chat' ),
		badge_color: '#2f6ef0',
		badge_label: __( 'Start Here', 'captain-live-chat' ),
		intro: __( 'Captain Live Chat adds a chat widget to your site automatically — there\u2019s no shortcode to place. This guide walks through the handful of things worth checking before your first conversation.', 'captain-live-chat' ),
		note: __( 'The widget appears on the front end as soon as the plugin is active — you can turn it off from Widget Settings if you want to finish styling it first.', 'captain-live-chat' ),
		note_type: 'info',
		steps: [
			{
				title: __( 'Style your widget', 'captain-live-chat' ),
				body: __( 'Go to Widget Settings and walk through the 5 steps: Appearance (colors, launcher icon, position), Welcome Screen, Chat View, Offline message, and general Widget Settings (poll interval, quick reply buttons). Click Save & Publish when done.', 'captain-live-chat' ),
			},
			{
				title: __( 'Fill in your Profile', 'captain-live-chat' ),
				body: __( 'Go to Profile and add your name, company, and preferred chat language. Set your Availability — this decides when visitors see you as online.', 'captain-live-chat' ),
			},
			{
				title: __( 'Decide who can reply', 'captain-live-chat' ),
				body: __( 'Go to Settings and choose which WordPress roles or specific users are allowed to act as chat agents. Only Administrators can reply until you grant access here.', 'captain-live-chat' ),
			},
			{
				title: __( 'Turn on AI Auto-Reply (optional)', 'captain-live-chat' ),
				body: __( 'If you want visitors answered even when no agent is online, connect a free provider like Groq or Gemini under AI Agent.', 'captain-live-chat' ),
			},
			{
				title: __( 'Open the Inbox', 'captain-live-chat' ),
				body: __( 'That\u2019s it — new conversations from your site now show up under Inbox in real time.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'widget-designer',
		icon: '🎨',
		title: __( 'Widget Designer', 'captain-live-chat' ),
		desc: __( 'Style the chat bubble your visitors see — colors, screens, and the offline form.', 'captain-live-chat' ),
		badge_color: '#8b5cf6',
		badge_label: __( 'Admin Only', 'captain-live-chat' ),
		intro: __( 'The Widget Designer is a 5-step wizard that controls exactly what visitors see on your site, from the launcher bubble to the offline contact form. Changes only go live once you click Save & Publish.', 'captain-live-chat' ),
		note: __( 'Use the Online / Offline switch above Live Preview and the desktop / mobile icons to check how each screen looks before publishing.', 'captain-live-chat' ),
		note_type: 'info',
		steps: [
			{
				title: __( 'Step 1 — Appearance', 'captain-live-chat' ),
				body: __( 'Pick a Widget Accent Color, a launcher button icon, and whether the bubble sits Bottom Left or Bottom Right of the screen.', 'captain-live-chat' ),
			},
			{
				title: __( 'Step 2 — Welcome Screen', 'captain-live-chat' ),
				body: __( 'Set the greeting title and subtitle visitors see when they first open the widget, plus any quick-reply prompt buttons (e.g. \u201cPricing\u201d, \u201cSupport\u201d).', 'captain-live-chat' ),
			},
			{
				title: __( 'Step 3 — Chat View', 'captain-live-chat' ),
				body: __( 'Customize the look of an active conversation — the header and the message bubble styling visitors see once a chat has started.', 'captain-live-chat' ),
			},
			{
				title: __( 'Step 4 — Offline', 'captain-live-chat' ),
				body: __( 'Write the message shown when no agent is available. Visitors can still leave their name, email, and a message from this screen so you can follow up later.', 'captain-live-chat' ),
				tip: __( 'This screen only appears when your Availability (see the Profile & Availability guide) is set to offline.', 'captain-live-chat' ),
			},
			{
				title: __( 'Step 5 — Widget Settings', 'captain-live-chat' ),
				body: __( 'Set the Polling Interval (how often the widget checks for new messages, in milliseconds) and manage the Quick Reply buttons shown to visitors.', 'captain-live-chat' ),
			},
			{
				title: __( 'Publish your changes', 'captain-live-chat' ),
				body: __( 'Click Save & Publish on any step to push your changes live immediately — no need to finish every step first.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'inbox',
		icon: '💬',
		title: __( 'Inbox — Replying to Chats', 'captain-live-chat' ),
		desc: __( 'Where every conversation from your site lands, and how to work through them.', 'captain-live-chat' ),
		badge_color: '#22c55e',
		badge_label: __( 'Agents & Admins', 'captain-live-chat' ),
		intro: __( 'The Inbox lists every visitor conversation your widget receives. It updates automatically, so you don\u2019t need to refresh the page to see new messages.', 'captain-live-chat' ),
		note: __( 'You need to be added under Settings \u2192 Who can reply before the Inbox and its actions become available to your account.', 'captain-live-chat' ),
		note_type: 'warning',
		steps: [
			{
				title: __( 'Pick a conversation', 'captain-live-chat' ),
				body: __( 'Click any thread on the left to open it. Unread conversations are highlighted until you open them.', 'captain-live-chat' ),
			},
			{
				title: __( 'Reply to the visitor', 'captain-live-chat' ),
				body: __( 'Type in the message box at the bottom and send. You can also attach files, and use an emoji picker or Quick Reply shortcuts while typing.', 'captain-live-chat' ),
			},
			{
				title: __( 'Assign, tag, or add a private note', 'captain-live-chat' ),
				body: __( 'Use the conversation panel to assign the chat to a specific agent, add tags for organizing conversations, or leave an internal note only agents can see.', 'captain-live-chat' ),
			},
			{
				title: __( 'Favorite, block, or close', 'captain-live-chat' ),
				body: __( 'Star a conversation to find it again quickly, block a visitor if they\u2019re abusive, or close a thread once it\u2019s resolved. Closed threads can be reopened at any time.', 'captain-live-chat' ),
			},
			{
				title: __( 'Quick Reply while typing', 'captain-live-chat' ),
				body: __( 'Type "/" followed by a saved shortcut to instantly insert a Canned Response into your message.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'ai-agent',
		icon: '🤖',
		title: __( 'AI Auto-Reply', 'captain-live-chat' ),
		desc: __( 'Let AI answer visitors automatically when no agent is online.', 'captain-live-chat' ),
		badge_color: '#f59e0b',
		badge_label: __( 'API Key Required', 'captain-live-chat' ),
		intro: __( 'AI Agent connects Captain Live Chat to an AI provider so visitors get an instant reply even outside your team\u2019s working hours. It only takes over when every agent is offline, and a human can jump into the conversation at any time.', 'captain-live-chat' ),
		note: __( 'Groq and Google Gemini both offer a free tier with no credit card required — a good place to start.', 'captain-live-chat' ),
		note_type: 'info',
		steps: [
			{
				title: __( 'Choose a provider', 'captain-live-chat' ),
				body: __( 'Under Active Provider, pick Groq, Google Gemini, OpenAI, Anthropic Claude, or OpenRouter. Each card has a \u201cGet free API key\u201d link if you don\u2019t already have one.', 'captain-live-chat' ),
			},
			{
				title: __( 'Paste your API key', 'captain-live-chat' ),
				body: __( 'Paste the key into the API Key field for that provider, pick a model, then click Test to confirm the connection works before saving.', 'captain-live-chat' ),
			},
			{
				title: __( 'Write a System Prompt', 'captain-live-chat' ),
				body: __( 'This tells the AI how to behave — for example, what tone to use and what to do when it can\u2019t answer a question (like asking for the visitor\u2019s email).', 'captain-live-chat' ),
			},
			{
				title: __( 'Turn on Auto-Reply', 'captain-live-chat' ),
				body: __( 'Switch on \u201cEnable AI auto-reply when all agents are offline\u201d and click Save Settings. The AI will now respond only when no agent is available.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'profile',
		icon: '👤',
		title: __( 'Profile & Availability', 'captain-live-chat' ),
		desc: __( 'Your agent details, and controlling when visitors see you as online.', 'captain-live-chat' ),
		badge_color: '#06b6d4',
		badge_label: __( 'Every Agent', 'captain-live-chat' ),
		intro: __( 'Your Profile page controls what visitors see about you during a chat, and — through Availability — decides whether the widget shows as online or offline at any given moment.', 'captain-live-chat' ),
		note: __( 'Availability is the single source of truth for your online status. It replaces any separate online/offline switch you may have seen elsewhere in the plugin.', 'captain-live-chat' ),
		note_type: 'info',
		steps: [
			{
				title: __( 'Fill in your details', 'captain-live-chat' ),
				body: __( 'Add your Full Name, Company Name, Email, Country, Address, and Preferred Chat Language, then click Save Changes.', 'captain-live-chat' ),
			},
			{
				title: __( 'Choose an Availability mode', 'captain-live-chat' ),
				body: __( 'Show online based on status \u2014 you control it manually with the toggle. Never online \u2014 always shows the offline screen. Always online \u2014 always shows as available. Custom availability \u2014 follow a weekly schedule.', 'captain-live-chat' ),
			},
			{
				title: __( 'Set a Custom schedule (optional)', 'captain-live-chat' ),
				body: __( 'If you pick Custom availability, a weekly schedule editor appears right on this page. Turn on the days you work and set start/end times \u2014 this schedule is shared by the whole team.', 'captain-live-chat' ),
			},
			{
				title: __( 'Toggle online/offline manually', 'captain-live-chat' ),
				body: __( 'When Availability is set to \u201cShow online based on status,\u201d use the switch on this page any time you step away \u2014 visitors immediately see the Offline screen from Widget Designer.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'canned-responses',
		icon: '⚡',
		title: __( 'Canned Responses', 'captain-live-chat' ),
		desc: __( 'Save reusable replies so you don\u2019t retype the same answers all day.', 'captain-live-chat' ),
		badge_color: '#ec4899',
		badge_label: __( 'Admin Only', 'captain-live-chat' ),
		intro: __( 'Canned Responses are saved message templates your whole team can reuse from the Inbox with a quick shortcut, instead of typing the same answer over and over.', 'captain-live-chat' ),
		note: __( 'Managing the Canned Responses library requires Administrator access, but every agent can use existing shortcuts while replying in the Inbox.', 'captain-live-chat' ),
		note_type: 'warning',
		steps: [
			{
				title: __( 'Create a response', 'captain-live-chat' ),
				body: __( 'Go to Canned Responses and add a short shortcut (e.g. \u201crefund\u201d) along with the full message text it should insert.', 'captain-live-chat' ),
			},
			{
				title: __( 'Use it in a conversation', 'captain-live-chat' ),
				body: __( 'While replying in the Inbox, type "/" followed by the shortcut. The full saved message is inserted instantly \u2014 edit it before sending if needed.', 'captain-live-chat' ),
			},
			{
				title: __( 'Edit or remove a response', 'captain-live-chat' ),
				body: __( 'Open Canned Responses any time to update the wording or delete ones you no longer need.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'settings',
		icon: '⚙️',
		title: __( 'Settings & Permissions', 'captain-live-chat' ),
		desc: __( 'Decide who can act as a chat agent, and configure notifications.', 'captain-live-chat' ),
		badge_color: '#64748b',
		badge_label: __( 'Admin Only', 'captain-live-chat' ),
		intro: __( 'Settings controls access to the plugin itself. By default only Administrators can open the Inbox and reply to chats \u2014 use this page to bring other team members in.', 'captain-live-chat' ),
		note: __( 'A person needs to be listed here \u2014 by role or individually \u2014 before the plugin menu even appears for their account.', 'captain-live-chat' ),
		note_type: 'warning',
		steps: [
			{
				title: __( 'Allow a role', 'captain-live-chat' ),
				body: __( 'Check any WordPress role (e.g. Editor, Shop Manager) under Who Can Reply to grant every user with that role access to the Inbox and Profile.', 'captain-live-chat' ),
			},
			{
				title: __( 'Allow a specific person', 'captain-live-chat' ),
				body: __( 'Add an individual user if you want to grant access without changing their role.', 'captain-live-chat' ),
			},
			{
				title: __( 'Set notification preferences', 'captain-live-chat' ),
				body: __( 'Turn on sound, browser, or email notifications so agents know when a new message arrives, even if the Inbox tab isn\u2019t focused.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'analytics-history',
		icon: '📊',
		title: __( 'Analytics & History', 'captain-live-chat' ),
		desc: __( 'See how your chat is performing, and look back at past conversations.', 'captain-live-chat' ),
		badge_color: '#0ea5e9',
		badge_label: __( 'Admin Only', 'captain-live-chat' ),
		intro: __( 'Analytics gives you an overview of chat volume and response activity. History lets you search, review, and export every past conversation \u2014 including ones that have been closed.', 'captain-live-chat' ),
		note: __( 'History exports download as a CSV file you can open in Excel or Google Sheets.', 'captain-live-chat' ),
		note_type: 'info',
		steps: [
			{
				title: __( 'Check Analytics', 'captain-live-chat' ),
				body: __( 'Open Analytics for a snapshot of conversation volume and trends over time.', 'captain-live-chat' ),
			},
			{
				title: __( 'Search past conversations', 'captain-live-chat' ),
				body: __( 'Open History to search, filter, and page through every past conversation, including closed threads.', 'captain-live-chat' ),
			},
			{
				title: __( 'Export a CSV', 'captain-live-chat' ),
				body: __( 'Use the export option on the History page to download the conversations matching your current search/filter as a spreadsheet.', 'captain-live-chat' ),
			},
		],
	},
	{
		key: 'mcp',
		icon: '🔌',
		title: __( 'MCP — Connecting AI Assistants', 'captain-live-chat' ),
		desc: __( 'Let tools like Claude or Cursor manage your live chat through natural language.', 'captain-live-chat' ),
		badge_color: '#6366f1',
		badge_label: __( 'Admin Only', 'captain-live-chat' ),
		intro: __( 'MCP exposes Captain Live Chat\u2019s features \u2014 threads, replies, canned responses, knowledge base, and more \u2014 as WordPress Abilities, using the native Abilities API built into WordPress core. AI assistants connect through a separate bridge plugin you choose, so you\u2019re never locked into one specific AI tool.', 'captain-live-chat' ),
		note: __( 'This page requires WordPress 6.9 or newer (Abilities API) and is only visible to Administrators. Everything else in the plugin works normally without it.', 'captain-live-chat' ),
		note_type: 'warning',
		steps: [
			{
				title: __( 'Open the MCP page', 'captain-live-chat' ),
				body: __( 'Go to MCP in the sidebar menu. If your site is running WordPress 6.9+, you\u2019ll see the AI Access switch and a list of abilities grouped by category (Conversations, AI Auto-Reply, Content, Configuration, Insights).', 'captain-live-chat' ),
			},
			{
				title: __( 'Check the AI Access switch', 'captain-live-chat' ),
				body: __( 'This master switch is on by default. Turn it off any time to fully block AI clients from this plugin, regardless of which abilities below are individually enabled.', 'captain-live-chat' ),
			},
			{
				title: __( 'Review individual abilities', 'captain-live-chat' ),
				body: __( 'Read-only abilities (marked READ-ONLY) are on by default \u2014 they\u2019re safe for an assistant to use freely. Abilities marked DESTRUCTIVE (like deleting a thread) are off by default; turn them on only if you want an AI assistant to be able to take that action.', 'captain-live-chat' ),
				tip: __( 'Every ability still requires an administrator account to execute \u2014 there\u2019s no lower-privilege tier.', 'captain-live-chat' ),
			},
			{
				title: __( 'Install an MCP bridge plugin', 'captain-live-chat' ),
				body: __( 'Captain Live Chat only registers Abilities \u2014 it doesn\u2019t run its own MCP server. Install any general-purpose, Abilities-API-aware bridge plugin (for example, the official WordPress MCP Adapter) once for your whole site; it will pick up these abilities automatically, alongside any other plugin\u2019s abilities.', 'captain-live-chat' ),
			},
			{
				title: __( 'Connect your AI client', 'captain-live-chat' ),
				body: __( 'Follow your chosen bridge plugin\u2019s own instructions to connect Claude Desktop, Cursor, or another MCP client to your site. From there you can ask it things like \u201cshow me today\u2019s unread chats\u201d or \u201cclose thread #42.\u201d', 'captain-live-chat' ),
			},
		],
	},
];

// ─── Guide List Item (left sidebar) ──────────────────────────────────────────
const GuideItem = ( { doc, active, onClick } ) => (
	<div className={ `captlc-docs-guide-item${ active ? ' captlc-docs-guide-item--active' : '' }` } onClick={ onClick }>
		<span className="captlc-docs-guide-icon" style={ { background: doc.badge_color + '18', color: doc.badge_color } }>
			{ doc.icon }
		</span>
		<span className="captlc-docs-guide-title">{ doc.title }</span>
	</div>
);

// ─── Step Component ───────────────────────────────────────────────────────────
const Step = ( { step, index } ) => (
	<div className="captlc-docs-step">
		<div className="captlc-docs-step-num">{ index + 1 }</div>
		<div className="captlc-docs-step-body">
			<h3 className="captlc-docs-step-title">{ step.title }</h3>
			<p className="captlc-docs-step-desc">{ step.body }</p>

			{ step.tip && (
				<div className="captlc-docs-tip">
					<span className="captlc-docs-tip-icon">✓</span>
					<span>{ step.tip }</span>
				</div>
			) }
		</div>
	</div>
);

// ─── Detail View ──────────────────────────────────────────────────────────────
const DocDetail = ( { doc, onBack } ) => (
	<div className="captlc-docs-detail">
		<div className="captlc-docs-detail-breadcrumb">
			<button className="captlc-docs-back-btn" onClick={ onBack }><span className="captlc-dir-arrow" aria-hidden="true">←</span> { __( 'All Guides', 'captain-live-chat' ) }</button>
			<span className="captlc-docs-detail-badge" style={ { background: doc.badge_color + '18', color: doc.badge_color } }>
				{ doc.badge_label }
			</span>
		</div>

		<h2 className="captlc-docs-detail-title">{ doc.title }</h2>
		<p className="captlc-docs-detail-intro">{ doc.intro }</p>

		{ doc.note && (
			<div className={ `captlc-docs-notice captlc-docs-notice--${ doc.note_type }` }>
				<span className="captlc-docs-notice-icon">
					{ doc.note_type === 'info' ? 'ⓘ' : doc.note_type === 'warning' ? '⚠' : '✓' }
				</span>
				<span>{ doc.note }</span>
			</div>
		) }

		<div className="captlc-docs-steps-list">
			{ doc.steps.map( ( step, i ) => <Step key={ i } step={ step } index={ i } /> ) }
		</div>
	</div>
);

// ─── Guide Grid (index view) ──────────────────────────────────────────────────
const DocGrid = ( { onSelect } ) => (
	<div className="captlc-docs-grid-view">
		<h2 className="captlc-docs-grid-title">{ __( 'Documentation', 'captain-live-chat' ) }</h2>
		<p className="captlc-docs-grid-subtitle">{ __( 'Choose a topic below to get step-by-step guidance.', 'captain-live-chat' ) }</p>
		<div className="captlc-docs-grid">
			{ DOCS.map( ( doc ) => (
				<div key={ doc.key } className="captlc-docs-grid-card" onClick={ () => onSelect( doc.key ) }>
					<div className="captlc-docs-grid-card-icon" style={ { background: doc.badge_color + '18', color: doc.badge_color } }>
						{ doc.icon }
					</div>
					<div className="captlc-docs-grid-card-body">
						<h3 className="captlc-docs-grid-card-title">{ doc.title }</h3>
						<p className="captlc-docs-grid-card-desc">{ doc.desc }</p>
					</div>
					<span className="captlc-docs-grid-card-arrow">→</span>
				</div>
			) ) }
		</div>
	</div>
);

// ─── Main Docs Page ───────────────────────────────────────────────────────────
const Docs = () => {
	const [ params, setParams ] = useSearchParams();
	const activeKey = params.get( 'guide' ) || null;
	const activeDoc = DOCS.find( ( d ) => d.key === activeKey ) || null;

	const handleSelect = ( key ) => setParams( { guide: key } );
	const handleBack   = ()      => setParams( {} );

	return (
		<div className="captlc-docs-page">
			<div className="captlc-main__header">
				<div>
					<h1 className="captlc-main__title">{ __( 'Documentation', 'captain-live-chat' ) }</h1>
					<p className="captlc-docs-page-subtitle">
						{ __( 'Everything you need to set up and use Captain Live Chat.', 'captain-live-chat' ) }
					</p>
				</div>
			</div>

			<div className="captlc-docs-layout">
				{ /* ── Left Sidebar ─────────────────────────────────────────── */ }
				<div className="captlc-docs-sidebar">
					<p className="captlc-docs-sidebar-heading">{ __( 'GUIDES', 'captain-live-chat' ) }</p>
					{ DOCS.map( ( doc ) => (
						<GuideItem
							key={ doc.key }
							doc={ doc }
							active={ activeKey === doc.key }
							onClick={ () => handleSelect( doc.key ) }
						/>
					) ) }
				</div>

				{ /* ── Right Content ─────────────────────────────────────────── */ }
				<div className="captlc-docs-content">
					{ activeDoc
						? <DocDetail doc={ activeDoc } onBack={ handleBack } />
						: <DocGrid onSelect={ handleSelect } />
					}
				</div>
			</div>
		</div>
	);
};

export default Docs;
