=== Captain Live Chat ===
Contributors: devangvachheta
Tags: live chat, chat widget, customer service, support, real-time chat
Requires at least: 6.2
Tested up to: 7.1
Stable tag: 1.3.0
Requires PHP: 7.4
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Self-hosted live chat for WordPress with optional AI auto-reply. No subscription — your data stays in your database.

== Description ==

**Captain Live Chat** is a powerful, fully self-hosted live chat plugin for WordPress. Unlike cloud-based services such as Tawk.to, Zendesk, or Crisp, Captain Live Chat keeps every message in your own WordPress database. No monthly subscription. No data leaving your server — unless you choose to switch on the optional AI auto-reply feature, which sends the visitor's message to an AI provider you select (see "External Services" below).

= Why Captain Live Chat? =

* ✅ **100% Self-Hosted** — All conversations stay in your WordPress database.
* ✅ **No Subscription** — One plugin, unlimited conversations, forever.
* ✅ **Lightweight** — No heavy external scripts. Shared-hosting friendly.
* ✅ **Real-time Polling** — Messages appear within 3 seconds without WebSockets (works on all hosting).
* ✅ **Modern Admin UI** — React-based dashboard with dark and light mode.
* ✅ **Role & User Permissions** — Decide exactly who can act as a chat agent.
* ✅ **Multiple Notifications** — Sound, browser, and email alerts for new messages.
* ✅ **Typing Indicator** — Both visitor and agent see "typing…" in real time.
* ✅ **Read Receipts** — Visitor sees "Seen" once the agent has read the message.
* ✅ **Live Visitor Info** — See visitor's browser, device, and current page URL live.
* ✅ **Auto-Away** — Agent is automatically set offline when the tab becomes inactive.

= Features =

**Frontend Widget**
* Floating chat button (bottom-right, fully responsive)
* Pre-chat form: name, email, message
* Live online/offline agent status indicator
* Typing indicator (animated dots)
* "Seen" read receipts
* Offline fallback message

**Agent Dashboard**
* Facebook Messenger-style inbox — thread list + chat panel side by side
* Real-time message polling
* Visitor info panel: name, email, browser, device, live current URL
* Close chat, mark read, assign conversations
* Agent online/offline toggle with 45-second heartbeat
* Auto-away when browser tab is hidden

**AI Auto-Reply (Optional)**
* Automatically replies to visitors when no agent is online, using an AI provider you connect (Groq, OpenAI, Google Gemini, or Anthropic — bring your own API key)
* Custom system prompt to steer tone and topics
* Knowledge base — add links or upload PDF/.txt documents so replies are grounded in your own content
* Configurable daily reply limit
* See "External Services" below for what is sent and to whom

**Analytics & History**
* Dashboard analytics: chat volume, response times, agent performance
* Full conversation history with CSV export
* Canned replies / quick responses for agents

**Settings**
* Allow specific WordPress roles (Administrator, Editor, etc.) as agents
* Or allow individual users regardless of role
* Sound notification (Web Audio API — no extra file)
* Browser push notification with one-click permission request
* Email notification (rate-limited to prevent flooding)
* Customise widget title and offline message
* Polling interval control (default 3 seconds)

**Developer-Friendly**
* WordPress Coding Standards throughout
* BEM-style CSS naming, all classes prefixed `captlc-`
* All inputs sanitized, all outputs escaped, nonce-verified endpoints
* Transient-based rate limiting on visitor-facing endpoints
* `uninstall.php` for opt-in clean data removal (toggle in Settings)

== Installation ==

1. Upload the `captain-live-chat` folder to `/wp-content/plugins/`.
2. Activate the plugin from the **Plugins** screen in WordPress.
3. Go to **Live Chat → Settings** and configure who can act as an agent.
4. Visit your site and click the chat bubble (bottom-right) to start a test conversation.
5. Return to **Live Chat → Dashboard**, enable "I am online", and reply.

= Minimum Requirements =

* WordPress 6.2 or greater
* PHP 7.4 or greater
* MySQL 5.6 or MariaDB 10.1 or greater

== Frequently Asked Questions ==

= Does this plugin require a paid subscription? =
No. Captain Live Chat is 100% free and self-hosted. All data stays on your server.

= Does it work on shared hosting? =
Yes. The plugin uses AJAX polling (not WebSockets), which works on all shared hosting providers including Hostinger, Bluehost, SiteGround, and Kinsta.

= Is data stored on your servers? =
No. All chat data is stored exclusively in your WordPress database — Captain Live Chat itself never sends data to any server we operate. If you switch on the optional AI auto-reply feature, the visitor's message is sent to the AI provider you personally connect (using your own API key) so it can generate a reply. See "External Services" below for details. This feature is off by default.

= Does the AI auto-reply feature send my visitors' data anywhere? =
Only if you enable it and configure an AI provider yourself. When enabled, the visitor's message (and, optionally, your knowledge base content and system prompt) is sent to whichever provider you chose — Groq, OpenAI, Google Gemini, or Anthropic — using your own API key. See "External Services" below for each provider's data-handling terms.

= Can multiple agents reply to chats? =
Yes. You can grant chat access by WordPress role (e.g. all Editors) or by selecting individual users.

= Will my visitors' messages be safe? =
All visitor inputs are sanitized server-side using WordPress functions. All AJAX endpoints are protected by nonces. Visitor-facing endpoints are rate-limited to prevent spam.

= Can I change the widget colours? =
The frontend widget uses CSS custom properties. You can override `--captlc-w-accent` (and related variables) in your theme's CSS.

= What happens to data when I uninstall? =
By default, your data is kept so you don't lose anything if you reinstall later. If you want a clean removal, turn on "Delete data on uninstall" in Settings before deleting the plugin — this removes all plugin database tables, options, and transients when you click Delete on the Plugins screen. A "Preserve settings on uninstall" option is also available if you want your role/notification preferences to survive a future reinstall while everything else is wiped.

== External Services ==

Captain Live Chat's core live-chat features (widget, inbox, notifications, analytics) run entirely on your own WordPress database and make no external calls.

The plugin includes an **optional** AI auto-reply feature. It is **disabled by default** and only activates once you enable it and enter your own API key for a provider. When enabled, the visitor's message — and, depending on your settings, your custom system prompt and knowledge base content — is sent to the provider you selected so it can generate a reply. No data is sent to any of these services unless you turn this feature on.

This plugin can connect to one of the following third-party AI services, depending on which provider you configure:

* **Groq** — [Terms of Use](https://groq.com/terms-of-use) | [Privacy Policy](https://groq.com/privacy-policy)
* **OpenAI** — [Terms of Use](https://openai.com/policies/) | [Privacy Policy](https://openai.com/policies/privacy-policy/)
* **Google Gemini API** — [Terms of Service](https://ai.google.dev/gemini-api/terms) | [Privacy Policy](https://policies.google.com/privacy)
* **Anthropic (Claude)** — [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) | [Privacy Policy](https://www.anthropic.com/legal/privacy)

Data sent: the visitor's chat message, and, if configured, your custom system prompt and knowledge base text. No data is sent unless you have enabled AI auto-reply and provided your own API key for the selected provider.

== Screenshots ==

1. **Dashboard (Dark mode)** — Facebook Messenger-style inbox with thread list and chat panel.
2. **Dashboard (Light mode)** — Clean, distraction-free agent interface.
3. **Frontend Widget** — Floating chat bubble with pre-chat form.
4. **Active Conversation** — Typing indicator, message bubbles, visitor info.
5. **Settings Page** — Role/user permissions, notification toggles, widget text.

== Changelog ==

= 1.3.0 =
* Initial public release on WordPress.org.
* Frontend floating chat widget (pre-chat form, polling, typing indicator, seen tick).
* React-based admin dashboard (thread list, chat panel, visitor info).
* Role-based and user-based agent permissions.
* Sound, browser, and email notifications with rate limiting.
* Auto-away on tab visibility change.
* Optional AI auto-reply (Groq, OpenAI, Gemini, or Anthropic — bring your own API key), with custom system prompt, knowledge base, and daily reply limit.
* Analytics dashboard and full conversation history with CSV export.
* Canned replies for agents.
* Transient-based rate limiting on visitor AJAX endpoints.
* Network error handling with toast notifications.
* `uninstall.php` for opt-in clean data removal (toggle in Settings).
* Dark and light mode admin UI.

== Upgrade Notice ==

= 1.3.0 =
Initial public release on WordPress.org.
