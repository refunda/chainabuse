import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderEmail, userId, topic, message } = body;

        // ------------------------------------------------------------------
        // [INTEGRATION POINT]
        // This is where you plug in your actual email provider (like Resend).
        // ------------------------------------------------------------------
        
        /*
        import { Resend } from 'resend';
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
            from: 'system@chainabuse.tech', 
            to: 'support@chainabuse.tech',
            reply_to: senderEmail,
            subject: `[Support Ticket] ${topic}`,
            text: `Sender: ${senderEmail}\nUser Node ID: ${userId}\n\nDiagnostic Payload:\n${message}`,
        });
        */

        // For now, this just logs to your server console to prove the connection works.
        console.log(`[MAIL SERVER] Routing new ticket to support@chainabuse.ai`);
        console.log(`From: ${senderEmail} | Topic: ${topic}`);

        return NextResponse.json({ success: true, message: "Payload transmitted." });

    } catch (error) {
        console.error("[MAIL SERVER ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}