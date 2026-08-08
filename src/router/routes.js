import React from 'react';
import Dashboard from '../page/dashboard/dashboard.jsx';
import Settings from '../page/settings/settings.jsx';
import CannedReplies from '../page/canned_replies/canned_replies.jsx';
import History from '../page/history/history.jsx';
import AiSettings from '../page/ai_settings/ai_settings.jsx';

const routes = [
	{ path: '/',              element: <Dashboard /> },
	{ path: '/settings',      element: <Settings /> },
	{ path: '/canned-replies',element: <CannedReplies /> },
	{ path: '/history',       element: <History /> },
	{ path: '/ai-settings',   element: <AiSettings /> },
];

export default routes;
