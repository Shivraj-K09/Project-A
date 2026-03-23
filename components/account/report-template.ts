import dayjs from 'dayjs';

export interface AccountReportData {
  profile: {
    username: string;
    first_name?: string;
    last_name?: string;
    email: string;
    phone_number?: string;
    created_at: string;
  };
  privacy: {
    last_seen: string;
    profile_photo: string;
    read_receipts: boolean;
  };
  notification: {
    mention_notifications: boolean;
    group_notifications: boolean;
    direct_message_notifications: boolean;
  } | null;
  chat: {
    enter_to_send: boolean;
    chat_wallpaper: string;
    wallpaper_dim: number;
    bubble_shape: string;
  } | null;
  network: {
    messages_sent: number;
    messages_received: number;
    media_sent: number;
    media_received: number;
    calls_sent: number;
    calls_received: number;
  };
  storage: {
    cache_size: number;
    total_space: number;
  } | null;
  messages: Array<{
    text: string;
    created_at: string;
    is_mine: boolean;
  }>;
}

export const generateReportHTML = (data: AccountReportData, brandColor: string, reportId?: string) => {
  const { profile, privacy, network, messages } = data;

  return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; padding: 40px; margin: 0; }
            .header { border-bottom: 2px solid ${brandColor}; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: ${brandColor}; margin: 0; }
            .subtitle { font-size: 14px; color: #666; font-weight: 600; text-transform: uppercase; margin-top: 5px; }
            
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
            
            .grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .item { min-width: 200px; margin-bottom: 15px; }
            .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; }
            .value { font-size: 14px; font-weight: 500; color: #111; margin-top: 4px; }
            
            .card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #f3f4f6; }
            .footer { margin-top: 100px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            .disclaimer { font-size: 10px; color: #aaa; line-height: 1.6; }

            .msg-row { border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
            .msg-meta { font-size: 11px; color: #999; margin-bottom: 4px; font-weight: 700; }
            .msg-text { font-size: 13px; color: #333; line-height: 1.5; }
            .msg-sender { color: ${brandColor}; }
            .msg-agent { color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ACCOUNT DATA REPORT</h1>
            <div class="subtitle">Generated for ${profile.username}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Identity & Profile</h2>
            <div class="grid">
              <div class="item"><div class="label">Full Name</div><div class="value">${profile.first_name || ''} ${profile.last_name || ''}</div></div>
              <div class="item"><div class="label">Email Address</div><div class="value">${profile.email}</div></div>
              <div class="item"><div class="label">Phone Number</div><div class="value">${profile.phone_number || 'N/A'}</div></div>
              <div class="item"><div class="label">Username</div><div class="value">@${profile.username}</div></div>
              <div class="item"><div class="label">Member Since</div><div class="value">${dayjs(profile.created_at).format('MMM D, YYYY')}</div></div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Privacy Settings</h2>
            <div class="card">
              <div class="grid">
                <div class="item"><div class="label">Last Seen Visibility</div><div class="value">${privacy.last_seen}</div></div>
                <div class="item"><div class="label">Profile Photo</div><div class="value">${privacy.profile_photo}</div></div>
                <div class="item"><div class="label">Read Receipts</div><div class="value">${privacy.read_receipts ? 'Enabled' : 'Disabled'}</div></div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Support Chat History (E2E Decrypted)</h2>
            <div class="card" style="padding: 10px 20px;">
              ${
                messages && messages.length > 0
                  ? messages
                      .map(
                        (m) => `
                <div class="msg-row">
                  <div class="msg-meta">
                    <span class="${m.is_mine ? 'msg-sender' : 'msg-agent'}">${m.is_mine ? 'You' : 'Support Team'}</span> • ${dayjs(m.created_at).format('MMM D, YYYY • h:mm A')}
                  </div>
                  <div class="msg-text">${m.text}</div>
                </div>
              `
                      )
                      .join('')
                  : '<p style="color: #888; text-align: center; margin: 20px 0;">No support messages found.</p>'
              }
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Network Usage Statistics</h2>
            <div class="grid">
              <div class="item"><div class="label">Messages Sent</div><div class="value">${network.messages_sent || 0}</div></div>
              <div class="item"><div class="label">Messages Received</div><div class="value">${network.messages_received || 0}</div></div>
              <div class="item"><div class="label">Media Sent</div><div class="value">${(network.media_sent / 1024 / 1024).toFixed(2)} MB</div></div>
              <div class="item"><div class="label">Calls Sent</div><div class="value">${network.calls_sent || 0}</div></div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Export Security</h2>
            <p style="font-size: 13px; color: #444;">This report was generated securely on your device. All end-to-end encrypted chats were decrypted locally using your private key. This document is for your offline reference.</p>
          </div>

          <div class="footer">
            <div class="disclaimer">
              This document is private and confidential. Report ID: ${reportId || 'LOCAL-SYNC'}<br/>
              Created on ${dayjs().format('MMMM D, YYYY at h:mm A')} via Secure Export Tool.
            </div>
          </div>
        </body>
      </html>
    `;
};
