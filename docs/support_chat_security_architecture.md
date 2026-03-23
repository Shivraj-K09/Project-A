# Secure E2EE Support Chat: System Architecture & Specification

## 1. Overview
This document outlines the architecture for a "Zero-Knowledge" Support Chat system. It balances absolute user privacy (End-to-End Encryption) with administrative oversight (Master Auditor Access) and ephemeral local storage. This specification ensures 100% compatibility between the **Expo Mobile App** and the **Next.js Web App**.

---

## 2. Core Functionality
- **End-to-End Encryption (E2EE):** All chat content is encrypted on the device before being sent to the server.
- **Multi-Recipient Access:** During an active session, the User and the assigned Support Agent can decrypt messages. The System Owner (Super Admin) can always decrypt via a Master Key.
- **Ephemeral UI (Scrapping):** Once a chat session is terminated, the local decryption keys and message cache are purged from the participants' devices.
- **Soft-Delete Archive:** Messages are kept in the database (Supabase) but marked as "Archived," making them invisible to the standard application flow while remaining available for legal/auditor review.

---

## 3. Technical Architecture (Universal Standard)

To ensure messages sent from Mobile can be read on Web (and vice-versa), the system follows the **Web Crypto API Standard**.

### A. Key Infrastructure
1.  **Identity Keys (Asymmetric):** Each device generates an **ECDH** (Elliptic Curve Diffie-Hellman) keypair using the `P-256` or `P-384` curve.
    - *Private Key:* Stored in the device's Secure Enclave (Mobile) or IndexedDB (Web).
    - *Public Key:* Stored in the Supabase `profiles` table.
2.  **Encryption Key (Symmetric):** Messages are encrypted using **AES-256-GCM**. The symmetric key is derived or "wrapped" for each recipient.
3.  **Auditor Master Key:** A permanent Master Public Key is injected into both apps. The **Auditor Private Key** is stored **offline** by the Super Admin.

### B. Cross-Platform Compatibility
- **Mobile (Expo):** Uses `expo-standard-web-crypto` to provide a high-performance polyfill that mimics the browser's crypto engine while using phone hardware.
- **Web (Next.js):** Uses the native `window.crypto.subtle` API built into all modern browsers.
- **Result:** Identical mathematical logic across all platforms.

### C. Mathematical Security (Brute Force Protection)
- **AES-256-GCM:** Mathematically impossible to brute-force ($2^{256}$ combinations).
- **Isolation:** The database never sees Private Keys, ensuring that even a total database compromise leaves the data unreadable.

---

## 4. RBAC Hierarchy (Role-Based Access Control)

| Role | Responsibility | Data Access (RLS) | Encryption Access |
| :--- | :--- | :--- | :--- |
| **User** | Customer/Client | Own rows only | User Private Key |
| **Support/Agent** | Issue Resolution | Assigned active chats only | Agent Private Key (Active) |
| **Admin** | System Management | All metadata (logs/stats) | **None** (Cannot decrypt content) |
| **Super Admin** | Total Control / Owner | Full Database Access | **Master Auditor Key** |

---

## 5. Database Schema (Supabase)

### Table: `support_sessions`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Unique session identifier |
| `user_id` | uuid (FK) | ID of the customer |
| `agent_id` | uuid (FK) | ID of the support agent |
| `status` | text | 'active', 'archived', 'pending' |
| `created_at` | timestamp | Initial start time |

### Table: `support_messages`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Message ID |
| `session_id` | uuid (FK) | Reference to support_sessions |
| `sender_id` | uuid (FK) | Who sent it |
| `encrypted_blob` | text | The AES-encrypted message content (Ciphertext) |
| `keys_header` | JSONB | Wrapped symmetric keys for User, Agent, and Auditor |
| `is_archived` | boolean | Default: false. True after "End Chat" |
| `message_type` | text | 'text', 'image', 'file' |
| `attachment_path` | text | Path to the encrypted blob in Supabase Storage (Null for text) |
| `metadata` | JSONB | Default: '{}'. Flexible storage for client-side metadata (e.g. `temp_id`) |

---

## 6. Media & Attachment Encryption (High-Fidelity)

To maintain absolute privacy for images and files, the system uses a **Hybrid Binary Encryption** model. This ensures that even "Previews" in the Supabase Dashboard are unreadable static noise.

### A. The "Split Storage" Strategy
1.  **Storage Layer (Supabase Storage):** Stores the **Encrypted Binary Blob**. The file is scrambled *before* upload using a unique session-based AES key.
2.  **Database Layer (Supabase DB):** Stores the metadata, the file path, and the **Wrapped Session Keys** (encrypted for User and Auditor).

### B. Encryption Lifecycle (For Images)
1.  **Local Capture:** User selects or takes a photo.
2.  **Binary Scrambling:** The app generates a 256-bit AES "One-Time File Key." The entire image binary is encrypted locally.
3.  **Key Wrapping:** This unique File Key is wrapped (asymmetrically encrypted) for each recipient (User, Agent, and Auditor) using their respective Public Keys.
4.  **Zero-Knowledge Upload:** The scrambled file is uploaded to a **Private Bucket** in Supabase Storage.
5.  **Audit Guarantee:** Because the Auditor's key is included in the wrap, the Super Admin can download the scrambled file and restore the original image using their offline Private Key.

### C. Security Benefits
- **No Previews:** Supabase cannot generate thumbnails or previews. The file appears as "corrupted" or "digital static" to all unauthorized observers.
- **Privacy at Rest:** Even a full compromise of the Storage Buckets leaves the attachments unreadable.

---

## 7. Security & Lifecycle Protocols

### I. The "End Chat" Sequence
1.  **Trigger:** Either party clicks "End & Secure Session."
2.  **Cloud Step:** Supabase updates `is_archived = true`.
3.  **The Scrap (Local Wipe):** 
    - The App/Web dashboard deletes the session key from local storage.
    - Result: Participants can no longer decrypt the history. 

### II. The Audit Process (Master Access)
- Only the **Super Admin** can fetch archived rows.
- Only the **Super Admin** possesses the Private Auditor Key to decrypt the `auditor_access` block in the `keys_header`.

---

## 8. Implementation Roadmap
1.  **Phase 1 (Infrastructure):** Setup `expo-standard-web-crypto` (Mobile) and generate the Master Auditor Keypair.
2.  **Phase 2 (RBAC Setup):** Finalize Supabase RLS policies using the `public.authorize()` helper.
3.  **Phase 3 (Encrypted Tunnel):** Implement the `CryptoHelper` class—identical logic for both React Native and Next.js using the Web Crypto API.
4.  **Phase 4 (UI Integration):** Build the Chat screens and the "End Session" secure-purging logic.
