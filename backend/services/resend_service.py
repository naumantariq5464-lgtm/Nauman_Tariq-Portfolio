"""
services/resend_service.py — Transactional email via Resend API.
Sends email notification to Nauman when contact form is submitted.
"""

import resend
from config import settings

resend.api_key = settings.resend_api_key


def send_contact_notification(
    full_name: str,
    email: str,
    subject: str,
    message: str,
) -> bool:
    """
    Send an email to Nauman when someone submits the contact form.
    Returns True on success, False on failure (never raises — email is best-effort).
    """
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; 
                border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: #111111; color: #ffffff; padding: 24px 32px;">
        <h2 style="margin: 0; font-size: 20px;">New Portfolio Message</h2>
        <p style="margin: 4px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">
          Someone reached out via your portfolio contact form.
        </p>
      </div>
      <div style="padding: 28px 32px; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #6e6e6e; font-size: 13px; 
                       font-weight: 600; text-transform: uppercase; width: 100px;">Name</td>
            <td style="padding: 10px 0; color: #111111; font-size: 15px;">{full_name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6e6e6e; font-size: 13px; 
                       font-weight: 600; text-transform: uppercase;">Email</td>
            <td style="padding: 10px 0; color: #111111; font-size: 15px;">
              <a href="mailto:{email}" style="color: #111111;">{email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #6e6e6e; font-size: 13px; 
                       font-weight: 600; text-transform: uppercase;">Subject</td>
            <td style="padding: 10px 0; color: #111111; font-size: 15px;">{subject}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #6e6e6e; font-size: 13px; font-weight: 600; 
                  text-transform: uppercase; margin-bottom: 10px;">Message</p>
        <p style="color: #111111; font-size: 15px; line-height: 1.7; 
                  background: #f8f8f8; padding: 16px; border-radius: 6px; 
                  border-left: 3px solid #111111;">{message}</p>
        <div style="margin-top: 28px; text-align: center;">
          <a href="mailto:{email}?subject=Re: {subject}" 
             style="background: #111111; color: #ffffff; text-decoration: none; 
                    padding: 12px 28px; border-radius: 6px; font-size: 14px; 
                    font-weight: 600; display: inline-block;">
            Reply to {full_name}
          </a>
        </div>
      </div>
      <div style="background: #f8f8f8; padding: 16px 32px; text-align: center; 
                  color: #6e6e6e; font-size: 12px;">
        © 2026 Nauman Tariq Portfolio — Automated notification
      </div>
    </div>
    """

    try:
        params = resend.Emails.SendParams(
            from_=settings.resend_from_email,
            to=[settings.resend_to_email],
            reply_to=email,
            subject=f"[Portfolio] New message: {subject}",
            html=html_body,
        )
        resend.Emails.send(params)
        return True
    except Exception as e:
        # Log but don't crash — message is already saved to DB
        print(f"[Resend] Email send failed: {e}")
        return False
