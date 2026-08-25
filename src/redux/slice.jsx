import { createSlice } from '@reduxjs/toolkit';

// Read saved theme from localStorage (persists across page reloads).
const getSavedTheme = () => {
	try {
		return localStorage.getItem( 'captlc_theme' ) || 'light';
	} catch {
		return 'light';
	}
};

// Read saved sidebar collapsed state from localStorage (persists across page reloads).
const getSavedSidebarCollapsed = () => {
	try {
		return localStorage.getItem( 'captlc_sidebar_collapsed' ) === '1';
	} catch {
		return false;
	}
};

const DEFAULT_AGENT_PROFILE = {
	company_name: '',
	country: '',
	address: '',
	preferred_language: 'en',
	availability_mode: 'status',
};

const initialState = {
	plugin_info: {},
	theme: getSavedTheme(),
	sidebarCollapsed: getSavedSidebarCollapsed(),
	currentUser: ( typeof captlc_data !== 'undefined' && captlc_data?.current_user ) || null,
	agentOnline: ( typeof captlc_data !== 'undefined' && !! captlc_data?.agent_online ) || false,
	agentProfile: ( typeof captlc_data !== 'undefined' && captlc_data?.agent_profile )
		? { ...DEFAULT_AGENT_PROFILE, ...captlc_data.agent_profile }
		: DEFAULT_AGENT_PROFILE,
};

const Slice = createSlice( {
	name: 'Slice',
	initialState,
	reducers: {
		handlePluginInfo: ( state, action ) => {
			state.plugin_info = action.payload;
		},
		toggleTheme: ( state ) => {
			state.theme = state.theme === 'light' ? 'dark' : 'light';
			try {
				localStorage.setItem( 'captlc_theme', state.theme );
			} catch {}
		},
		setTheme: ( state, action ) => {
			state.theme = action.payload;
			try {
				localStorage.setItem( 'captlc_theme', action.payload );
			} catch {}
		},
		toggleSidebar: ( state ) => {
			state.sidebarCollapsed = ! state.sidebarCollapsed;
			try {
				localStorage.setItem( 'captlc_sidebar_collapsed', state.sidebarCollapsed ? '1' : '0' );
			} catch {}
		},
		setCurrentUser: ( state, action ) => {
			state.currentUser = action.payload;
		},
		setAgentOnline: ( state, action ) => {
			state.agentOnline = action.payload;
		},
		setAgentProfile: ( state, action ) => {
			state.agentProfile = { ...state.agentProfile, ...action.payload };
		},
	},
} );

export const { handlePluginInfo, toggleTheme, setTheme, toggleSidebar, setCurrentUser, setAgentOnline, setAgentProfile } = Slice.actions;
export default Slice.reducer;
