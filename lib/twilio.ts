import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendEmergencySMS(
  phone: string,
  message: string
) {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}
export async function sendOtpSMS(
  phone: string,
  code: string
) {
  return client.messages.create({
    body: `Your MyOgun verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: phone,
  });
}
