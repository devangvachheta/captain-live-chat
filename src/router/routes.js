import React from 'react';
import { Navigate } from 'react-router-dom';
import Inbox from '../page/inbox/inbox.jsx';
import Settings from '../page/settings/settings.jsx';
import CannedReplies from '../page/canned_replies/canned_replies.jsx';
import History from '../page/history/history.jsx';
import AiSettings from '../page/ai_settings/ai_settings.jsx';
import WidgetDesigner from '../page/widget_designer/widget_designer.jsx';
import Analytics from '../page/analytics/analytics.jsx';
import Help from '../page/help/help.jsx';
import Profile from '../page/profile/profile.jsx';
import Docs from '../page/docs/docs.jsx';
import Mcp from '../page/mcp/mcp.jsx';

// Non-admin agents only see the optional pages (Analytics, Settings, AI
// Agent, Widget Settings, Quick Reply, History) they've been granted on
// Profile → Team Access. Their backend AJAX actions for these pages also
// require manage_options, so this route guard mainly catches a manually
// typed/bookmarked URL — the sidebar already hides links they can't use.
const isAdmin = ( typeof captlc_data !== 'undefined' && !! captlc_data?.is_admin ) || false;
const allowedPages = ( typeof captlc_data !== 'undefined' && captlc_data?.allowed_pages ) || [];
const canOpen = ( slug ) => isAdmin || allowedPages.includes( slug );
const PageGate = ( { slug, children } ) => ( canOpen( slug ) ? children : <Navigate to="/inbox" replace /> );

const routes = [
	{ path: '/',                element: <Navigate to="/inbox" replace /> },
	{ path: '/inbox',           element: <Inbox /> },
	{ path: '/widget-settings', element: <PageGate slug="widget-settings"><WidgetDesigner /></PageGate> },
	{ path: '/widget-designer', element: <Navigate to="/widget-settings" replace /> }, // old URL — keep working for anyone with it bookmarked
	{ path: '/canned-replies',  element: <PageGate slug="canned-replies"><CannedReplies /></PageGate> },
	{ path: '/ai-settings',     element: <PageGate slug="ai-settings"><AiSettings /></PageGate> },
	{ path: '/analytics',       element: <PageGate slug="analytics"><Analytics /></PageGate> },
	{ path: '/settings',        element: <PageGate slug="settings"><Settings /></PageGate> },
	{ path: '/history',         element: <PageGate slug="history"><History /></PageGate> },
	{ path: '/help',            element: <Help /> },
	{ path: '/profile',         element: <Profile /> },
	{ path: '/docs',            element: <Docs /> },
	{ path: '/mcp',             element: isAdmin ? <Mcp /> : <Navigate to="/inbox" replace /> },
	{ path: '/schedule',        element: <Navigate to="/profile" replace /> },
];

export default routes;
