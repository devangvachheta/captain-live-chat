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

const initialState = {
	plugin_info: {},
	theme: getSavedTheme(),
	sidebarCollapsed: getSavedSidebarCollapsed(),
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
	},
} );

export const { handlePluginInfo, toggleTheme, setTheme, toggleSidebar } = Slice.actions;
export default Slice.reducer;
