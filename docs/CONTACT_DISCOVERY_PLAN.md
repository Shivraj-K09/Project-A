# 📇 Contact Discovery Roadmap

This roadmap outlines the remaining enhancements for the contact discovery and search experience. 

---

### ✅ Completed
- [x] **Smart Synchronization:** Robust matching with Supabase using 10-digit suffix logic.
- [x] **High-Performance Search:** React 19 `useDeferredValue` for butter-smooth typing.
- [x] **Strict Precision Engine:** Accurate `startsWith` and `Word` level matching.
- [x] **Premium Empty States:** Kinetic designs for "No Results" and "Sync Contacts".
- [x] **Sectioned List:** Grouped "Friends" vs. "Invite List" for better UX.

---

### 🚀 Upcoming Tasks

#### 1. 📨 Native Invite Functionality (SMS)
- **Current State:** The "Invite" button shows a drawer, but no SMS is sent.
- **The Task:** Implement `expo-sms` to trigger the native OS messaging app.
- **Message Template:** *"Hey! Come find me on Social Media: https://yourapp.link/download"*

#### 2. 🔍 Enhanced Search Clarity (Acronyms)
- **Current State:** Typing "SK" finds "Shivraj Kadgond", but nothing is highlighted visually.
- **The Task:** Update `ContactItem` to identify and highlight individual initials when an acronym match occurs.
- **Why:** This makes "Smart" search feel transparent and deliberate.

#### 3. 🔄 Refined Synchronizing States
- **Current State:** Shows a full skeleton or empty state initially.
- **The Task:** Replace high-friction transitions with a subtle "Syncing 1,000+ contacts..." haptic-driven status bar during background updates.
- **Why:** Improves the "perceived performance" on slower connections.

#### 4. 👥 Contextual Header Information
- **Current State:** Always shows "Total Contacts: 1,000".
- **The Task:** Dynamically switch the counter to "3 Matches Found" or "10 on Social Media" based on the current search state.
- **Why:** Keeps the user oriented while browsing large lists.

---

> [!TIP]
> **Next Step Recommendation:** Let's implement Task 1 (SMS Invites) so your app can actually start growing!
