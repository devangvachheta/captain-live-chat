=== Captain Live Chat ===
Contributors: bharti
Tags: live chat, chat, support, customer service, real-time chat, chat widget
Requires at least: 5.8
Tested up to: 6.7
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html

Lightweight, self-hosted live chat for WordPress. No monthly subscription, no third-party servers — 100% your data.

== Description ==

**Captain Live Chat** is a powerful, fully self-hosted live chat plugin for WordPress. Unlike cloud-based services such as Tawk.to, Zendesk, or Crisp, Captain Live Chat keeps every message in your own WordPress database. No monthly subscription. No data leaving your server.

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
* `uninstall.php` for clean data removal

== Installation ==

1. Upload the `captain-live-chat` folder to `/wp-content/plugins/`.
2. Activate the plugin from the **Plugins** screen in WordPress.
3. Go to **Live Chat → Settings** and configure who can act as an agent.
4. Visit your site and click the chat bubble (bottom-right) to start a test conversation.
5. Return to **Live Chat → Dashboard**, enable "I am online", and reply.

= Minimum Requirements =

* WordPress 5.8 or greater
* PHP 7.4 or greater
* MySQL 5.6 or MariaDB 10.1 or greater

== Frequently Asked Questions ==

= Does this plugin require a paid subscription? =
No. Captain Live Chat is 100% free and self-hosted. All data stays on your server.

= Does it work on shared hosting? =
Yes. The plugin uses AJAX polling (not WebSockets), which works on all shared hosting providers including Hostinger, Bluehost, SiteGround, and Kinsta.

= Is data stored on your servers? =
No. All chat data is stored exclusively in your WordPress database. No data is ever sent to external servers.

= Can multiple agents reply to chats? =
Yes. You can grant chat access by WordPress role (e.g. all Editors) or by selecting individual users.

= Will my visitors' messages be safe? =
All visitor inputs are sanitized server-side using WordPress functions. All AJAX endpoints are protected by nonces. Visitor-facing endpoints are rate-limited to prevent spam.

= Can I change the widget colours? =
The frontend widget uses CSS custom properties. You can override `--captlc-w-accent` (and related variables) in your theme's CSS.

= What happens to data when I uninstall? =
All plugin data (database tables, options, transients) is removed cleanly when you delete the plugin via the WordPress admin.

== Screenshots ==

1. **Dashboard (Dark mode)** — Facebook Messenger-style inbox with thread list and chat panel.
2. **Dashboard (Light mode)** — Clean, distraction-free agent interface.
3. **Frontend Widget** — Floating chat bubble with pre-chat form.
4. **Active Conversation** — Typing indicator, message bubbles, visitor info.
5. **Settings Page** — Role/user permissions, notification toggles, widget text.

== Changelog ==

= 1.0.0 =
* Initial release.
* Frontend floating chat widget (pre-chat form, polling, typing indicator, seen tick).
* React-based admin dashboard (thread list, chat panel, visitor info).
* Role-based and user-based agent permissions.
* Sound, browser, and email notifications with rate limiting.
* Auto-away on tab visibility change.
* Transient-based rate limiting on visitor AJAX endpoints.
* Network error handling with toast notifications.
* `uninstall.php` for clean data removal.
* Dark and light mode admin UI.

== Upgrade Notice ==

= 1.0.0 =
Initial release. No upgrade steps required.
