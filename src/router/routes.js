import React from 'react';
import { Navigate } from 'react-router-dom';
import Inbox from '../page/inbox/inbox.jsx';
import Settings from '../page/settings/settings.jsx';
import CannedReplies from '../page/canned_replies/canned_replies.jsx';
import History from '../page/history/history.jsx';
import AiSettings from '../page/ai_settings/ai_settings.jsx';
import WidgetDesigner from '../page/widget_designer/widget_designer.jsx';
import Analytics from '../page/analytics/analytics.jsx';
import Schedule from '../page/schedule/schedule.jsx';
import Help from '../page/help/help.jsx';
import Profile from '../page/profile/profile.jsx';

const routes = [
	{ path: '/',                element: <Navigate to="/inbox" replace /> },
	{ path: '/inbox',           element: <Inbox /> },
	{ path: '/widget-designer', element: <WidgetDesigner /> },
	{ path: '/canned-replies',  element: <CannedReplies /> },
	{ path: '/ai-settings',     element: <AiSettings /> },
	{ path: '/analytics',       element: <Analytics /> },
	{ path: '/settings',        element: <Settings /> },
	{ path: '/schedule',        element: <Schedule /> },
	{ path: '/history',         element: <History /> },
	{ path: '/help',            element: <Help /> },
	{ path: '/profile',         element: <Profile /> },
];

export default routes;
