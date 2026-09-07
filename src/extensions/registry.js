/**
 * Extension registry — lets a separately installed, separately built
 * add-on plugin (e.g. "Captain Live Chat Pro") inject a page
 * component into this app's existing routes/nav without this plugin
 * knowing anything about that add-on at build time.
 *
 * How it's used:
 * - This app renders a slot (see ExtensionSlot below) wherever an
 *   add-on-provided page belongs, e.g. the "AI Agent" route.
 * - The add-on's own script (enqueued on the same admin screen, declared
 *   as a script dependency on this app's script so it always runs after)
 *   calls `window.CaptlcExtensions.registerPage('ai-settings', Component)`
 *   once it has loaded.
 * - The slot listens for the registration event and swaps itself for the
 *   registered component, no matter which script finished loading first.
 */

const pages = {};

const EVENT_NAME = 'captlc-extension-registered';

/**
 * Registers a page component for a given slug. Safe to call multiple
 * times (e.g. hot reload) — last registration for a slug wins.
 *
 * @param {string} slug      Slot identifier, e.g. 'ai-settings'.
 * @param {Function} Component React component to render for that slot.
 */
export function registerPage( slug, Component ) {
	pages[ slug ] = Component;
	if ( typeof window !== 'undefined' ) {
		window.dispatchEvent( new CustomEvent( EVENT_NAME, { detail: { slug } } ) );
	}
}

/**
 * Returns the currently registered component for a slot, or null.
 *
 * @param {string} slug Slot identifier.
 */
export function getPage( slug ) {
	return pages[ slug ] || null;
}

export const EXTENSION_EVENT = EVENT_NAME;

if ( typeof window !== 'undefined' ) {
	window.CaptlcExtensions = window.CaptlcExtensions || {};
	window.CaptlcExtensions.registerPage = registerPage;
}
