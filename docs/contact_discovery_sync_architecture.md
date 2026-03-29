# Contact Discovery & Scalable Sync Architecture

This document outlines the high-fidelity, production-grade architecture for synchronizing user contacts, matching them against the application's user base, and providing real-time "Joined" notifications.

## 1. System Overview
The goal is to provide a seamless "Discovery" experience similar to WhatsApp or Telegram. The system identifies which of a user's phone contacts are already members of the platform and provides real-time updates when new contacts join.

---

## 2. Technical Stack
- **Client (Mobile):** React Native (Expo) - [Expo Contacts](https://docs.expo.dev/versions/latest/sdk/contacts/)
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Realtime (Replication)
- **Logic:** Postgres RPC + Database Triggers

---

## 3. Client-Side Operations (The Mobile App)

### A. Normalization & Scrubbing
To ensure matching works across different carriers and regions, all phone numbers are "washed" before being sent to the server.
- **Task:** Convert all numbers to **E.164 format** (e.g., `+12345678901`).
- **Optimization:** Fetch contacts in batches of 100 to avoid UI jank during the scan.

### B. Batching & Throttling
- **Batching:** Large contact lists (e.g., 2,000+ contacts) are split into chunks of 500 to keep network payloads small (~15KB per chunk).
- **Throttling:** Implements a **Sync Lock** (e.g., 6 hours). The app only performs a full discovery sync once every few hours to prevent unnecessary database load.

### C. Incremental Delta Syncs
After the initial sync, the app stores a "Snapshot" of known contacts. Future syncs only send **newly added** contacts or contacts that haven't been cross-referenced in the last 7 days.

---

## 4. Database-Side Operations (Supabase)

### A. High-Speed Matching (The RPC)
A specialized Postgres function (`rpc`) handles the cross-referencing in a single trip.
- **Logic:** `SELECT * FROM users WHERE phone_number = ANY(cleaned_numbers_list)`
- **Turbo Marker (Indexing):** A **B-Tree Index** is applied to the `phone_number` column. This transforms O(n) table scans into O(log n) lookups, allowing the database to match 500 numbers in milliseconds even with millions of users.

### B. The "Joined" Logic (Temporal Calculation)
The database automatically identifies new users registered within the last 24 hours.
```sql
is_new = (created_at > now() - interval '24 hours')
```
The app receives this flag and displays the "New" badge without doing any client-side date math.

---

## 5. Real-Time Discovery Architecture

To provide "Instant" updates when a contact joins, we use an **Inversion Map (Watch List)**.

### A. The Watch List Table
Whenever a user syncs contacts that are NOT currently members, the server records an interest mapping:
- **Table:** `contact_watch_list`
- **Schema:** `phone_number (text), interested_user_id (uuid)`

### B. The Registration Trigger
When a new user registers:
1.  **Trigger:** A Postgres trigger runs on the `users` table.
2.  **Match:** It checks the `contact_watch_list` for the new user's phone number.
3.  **Alert:** It broadcasts a **Supabase Realtime** event specifically to the `interested_user_id`.
4.  **UI Update:** The friend's app receives this "Spark" and instantly transforms the "Invite" button into a "Message" button.

---

## 6. Privacy & Security
- **Strict Encryption:** All payloads are sent over HTTPS.
- **Optional Hashing:** For maximum privacy, phone numbers can be hashed (SHA-256) on the phone. Matching then occurs between the "Hash of Number" columns in the database.

---

## 7. Scalability Limits
- **Network:** 5,000 contacts = ~75KB (Text is extremely light).
- **Concurrency:** Supported by **Supavisor (Connection Pooling)** to handle thousands of simultaneous syncs without locking the database.

---

## Summary of Implementation Logic
1.  **Foundation:** Mobile cleans and batches numbers.
2.  **Matching:** In-Memory Postgres matching via indexed columns.
3.  **Persistence:** Watch-list records pending invitations.
4.  **Real-time:** Automative notification when "watched" numbers register.

> [!IMPORTANT]
> Always ensure the `phone_number` column is unique and indexed before deploying the sync logic.
