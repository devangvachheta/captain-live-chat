=== Captain Live Chat ===
Contributors: devangvachheta
Tags: live chat, chat widget, customer service, support, real-time chat
Requires at least: 6.9
Tested up to: 7.1
Stable tag: 0.0.2
Requires PHP: 7.4
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Self-hosted live chat for WordPress. No subscription, no external servers — your conversations stay in your own database.

== Description ==

<strong>Captain Live Chat</strong> is a powerful, fully self-hosted live chat plugin for WordPress. Unlike cloud-based services such as Tawk.to, Zendesk, or Crisp, Captain Live Chat keeps every message in your own WordPress database. No monthly subscription, no external calls, no data leaving your server.

Whether you run a small business site, a support-heavy SaaS product, or an agency managing chat for multiple clients, Captain Live Chat gives you a lightweight, self-hosted inbox that works out of the box on any host.

<strong>💬 A Real Chat Widget, Not a Contact Form</strong>

A floating chat bubble on the front end opens into a real-time conversation: pre-chat form, typing indicators, read receipts, and an offline fallback message when no agent is online.

<strong>📥 Facebook Messenger–Style Agent Inbox</strong>

A modern, React-based dashboard with a thread list and chat panel side by side. Agents can toggle online/offline, get a 45-second heartbeat, and go auto-away when their browser tab is hidden.

<strong>🔔 Notifications That Actually Reach Agents</strong>

Sound, browser push, and rate-limited email notifications make sure a new visitor message doesn't sit unseen.

<strong>👥 Role & User-Based Agent Permissions</strong>

Decide exactly who can act as a chat agent — by WordPress role (e.g. all Editors) or by picking individual users, regardless of role.

<strong>📊 Built-in Analytics & History</strong>

Track chat volume, response times, and agent performance from the dashboard, with full conversation history and CSV export.

<strong>⚡ Lightweight & Shared-Hosting Friendly</strong>

Real-time-feeling updates via AJAX polling (not WebSockets), so it works on shared hosting exactly as well as on managed WordPress hosting.

<strong>Perfect for:</strong>

* Small businesses that want live chat without a monthly subscription
* Support teams who need conversation history and analytics in their own database
* Agencies managing chat for multiple client sites
* Any WordPress site that wants visitor data to stay on their own server

== Key Features ==

* 💬 <strong>Floating Chat Widget</strong> : Pre-chat form, typing indicator, read receipts, and an offline fallback message
* 📥 <strong>Agent Inbox</strong> : Messenger-style thread list and chat panel, real-time polling, visitor info panel (browser, device, live current URL)
* 👥 <strong>Role & User Permissions</strong> : Grant agent access by WordPress role or by individual user
* 🔔 <strong>Notifications</strong> : Sound, browser push, and rate-limited email alerts for new messages
* 🟢 <strong>Online Status & Auto-Away</strong> : 45-second heartbeat, automatic away when the browser tab is hidden
* 📊 <strong>Analytics & History</strong> : Chat volume, response times, agent performance, full history with CSV export
* 💡 <strong>Canned Replies</strong> : Quick, reusable responses for agents
* 🎨 <strong>Widget Designer</strong> : Accent color, position, welcome message, and a live preview
* 🔒 <strong>Self-Hosted</strong> : All conversations stay in your own WordPress database — no external calls
* ⚡ <strong>Lightweight</strong> : AJAX polling instead of WebSockets — works on any shared host

== Installation ==

1. Upload the <code>captain-live-chat</code> folder to <code>/wp-content/plugins/</code>, or install the plugin directly from the WordPress Plugins screen.
2. Activate the plugin from the <strong>Plugins</strong> screen.
3. Go to <strong>Live Chat → Settings</strong> and configure who can act as an agent.
4. Visit your site and click the chat bubble (bottom-right) to start a test conversation.
5. Return to <strong>Live Chat → Dashboard</strong>, enable "I am online", and reply.

== Usage ==

After activation:

1. <strong>Set up agents</strong> — Under Settings, allow specific WordPress roles or individual users as chat agents.
2. <strong>Customize the widget</strong> — Use the Widget Designer to set accent color, position, and welcome message.
3. <strong>Go online</strong> — Toggle "I am online" in the dashboard so visitors see an active agent.
4. <strong>Reply in real time</strong> — New visitor messages appear in the Inbox within a few seconds via polling.
5. <strong>Review performance</strong> — Check the Analytics tab for chat volume, response times, and history.

== Frequently Asked Questions ==

= Does this plugin require a paid subscription? =

No. Captain Live Chat is 100% free and self-hosted. All data stays on your server.

= Does it work on shared hosting? =

Yes. The plugin uses AJAX polling (not WebSockets), which works on all shared hosting providers including Hostinger, Bluehost, SiteGround, and Kinsta.

= Is data stored on your servers? =

Yes, entirely. All chat data is stored exclusively in your WordPress database. Captain Live Chat itself makes no external network calls and sends data to no third-party service.

= Does Captain Live Chat send my visitors' data anywhere? =

No. This plugin has no AI or third-party integrations of its own and makes no external network calls of any kind.

= Can multiple agents reply to chats? =

Yes. You can grant chat access by WordPress role (e.g. all Editors) or by selecting individual users.

= Will my visitors' messages be safe? =

All visitor inputs are sanitized server-side using WordPress functions. All AJAX endpoints are protected by nonces. Visitor-facing endpoints are rate-limited to prevent spam.

= Can I change the widget colours? =

The frontend widget uses CSS custom properties. You can override <code>--captlc-w-accent</code> (and related variables) in your theme's CSS.

= Does the widget show a "Powered by Captain Live Chat" credit to my visitors? =

No, not unless you turn it on. It is off by default. If you'd like to help others discover the plugin, you can enable "Show 'Powered by Captain Live Chat' badge" under Settings → Notifications — entirely optional, and you can customize the badge text to whatever you like. It's always rendered as plain text with no external link, regardless of what text you enter.

= What happens to data when I uninstall? =

By default, your data is kept so you don't lose anything if you reinstall later. If you want a clean removal, turn on "Delete data on uninstall" in Settings before deleting the plugin — this removes all plugin database tables, options, and transients when you click Delete on the Plugins screen. A "Preserve settings on uninstall" option is also available if you want your role/notification preferences to survive a future reinstall while everything else is wiped.

= Can AI assistants manage my chats? =

Optionally, yes. On WordPress 6.9 or newer, the plugin registers a set of read/management actions as WordPress Abilities via core's Abilities API. With a separate MCP bridge plugin installed, AI assistants can use those abilities. This is entirely optional and unrelated to any third-party AI provider — the plugin itself makes no AI API calls.

== Screenshots ==

1. The floating chat widget on a live site — pre-chat greeting, quick replies, and the message thread.
2. The agent Inbox — thread list, active conversation, and visitor info panel side by side.
3. Knowledge Base — add links or upload documents for your team's own reference.
4. Analytics dashboard — chat volume, response time, and resolution rate at a glance.
5. Widget Designer — accent color, position, welcome message, and a live preview.

== External Services ==

Captain Live Chat makes no external network calls of any kind. Every feature (widget, inbox, notifications, analytics, canned replies, knowledge base storage) runs entirely on your own WordPress database, and no visitor or site data is sent to any third-party server.

== Changelog ==

= 0.0.2 (07/09/2026) =
* Removed: All direct third-party AI provider integration (AI Auto-Reply) has been removed from this plugin. Captain Live Chat now makes zero external network calls of any kind.
* Changed: Minimum WordPress requirement raised to 6.9. The MCP/Abilities-API feature no longer carries a fallback path for older WordPress versions.
* New: The optional "Powered by Captain Live Chat" badge text is now customizable (Settings → Notifications). Always rendered as plain text, regardless of what is entered — never a link or HTML.

= 0.0.1 =
* Initial release.

== Upgrade Notice ==

= 0.0.2 =
Removes all third-party AI provider integration — the plugin now makes no external network calls. Requires WordPress 6.9+.
