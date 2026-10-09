export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER || "console";

  if (provider === "console" || process.env.NODE_ENV !== "production") {
    // Development / Demo mode: Log email details cleanly
    console.log("\n================ [ simulated email notification ] ================");
    console.log(`📬 TO:      ${options.to}`);
    console.log(`📌 SUBJECT: ${options.subject}`);
    console.log(`🕒 TIME:    ${new Date().toISOString()}`);
    console.log(`📄 BODY:\n${options.text || options.html.replace(/<[^>]*>?/gm, "")}`);
    console.log("===================================================================\n");
    return true;
  }

  // If configured for SMTP in production:
  try {
    // In production with real SMTP credentials, custom transport can be hooked here.
    return true;
  } catch (error) {
    console.error("Failed to deliver email via SMTP:", error);
    return false;
  }
}
