const BOT_TOKEN = "8793002359:AAHEv9w1N7x3Q1ud_UB1hxAJS2qAo4IEPDs";
const CHAT_ID = "8269163077";

export async function sendTelegramPaymentNotification(data: {
  userNickname: string;
  userEmail: string;
  planTitle: string;
  amountUZS: number;
  receiptUrl: string; // Base64 image
}): Promise<boolean> {
  try {
    const caption = `<b>💳 YANGI TO'LOV CHEKI YUKLANDI!</b>\n\n` +
      `<b>Foydalanuvchi:</b> ${data.userNickname} (${data.userEmail})\n` +
      `<b>Ta'rif:</b> ${data.planTitle}\n` +
      `<b>Summa:</b> ${data.amountUZS.toLocaleString()} UZS\n` +
      `<b>Sana:</b> ${new Date().toLocaleString('uz-UZ')}\n\n` +
      `<i>Admin paneldan tasdiqlashingiz mumkin.</i>`;

    // Send text message first
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: caption,
        parse_mode: 'HTML'
      })
    });

    // If receiptUrl is a base64 image, convert and send photo
    if (data.receiptUrl && data.receiptUrl.startsWith('data:image')) {
      const fetchBlob = await fetch(data.receiptUrl);
      const blob = await fetchBlob.blob();

      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('photo', blob, 'receipt.jpg');
      formData.append('caption', `Chek rasmi - ${data.userNickname}`);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    }

    return true;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}
