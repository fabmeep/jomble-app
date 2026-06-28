import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { jobApplicationSchema } from "@/shared/schemas/jobApplication";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const userId = await getUserId();
        const applications = await prisma.jobApplication.findMany({
            where: { userId }
        });

        console.log(applications);

        return new Response(JSON.stringify(applications), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserId();
        const body = await req.json();
        const validation = jobApplicationSchema.safeParse(body);
        if (!validation.success) {
            return new NextResponse(JSON.stringify({ error: "Validation failed" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const { notes, contacts, redFlags, ...applicationData } = validation.data;

        // Create job application
        const application = await prisma.jobApplication.create({
            data: {
                userId,
                ...applicationData,
                ...(notes ? { notes: { create: { content: notes, }, }, } : {}),
                ...(redFlags && redFlags.length > 0
                    ? {
                        redFlags: {
                            create: redFlags.map((flagId: string) => ({
                                flagId
                            }))
                        }
                    } : {}),
                ...(contacts && contacts.length > 0
                    ? {
                        contacts: {
                            create: contacts.map((contact: any) => ({
                                name: contact.name,
                                role: contact.role,
                                email: contact.email,
                                linkedinUrl: contact.linkedinUrl,
                                notes: contact.notes,
                            }))
                        }
                    } : {}),
                timelineEvents: {
                    create: [
                        {
                            eventType: "STATUS_CHANGE",
                            newStatus: applicationData.status,
                            description: "Created application",
                            occurredAt: new Date(),
                        },
                        ...(notes ? [{
                            eventType: "NOTE_ADDED" as const,
                            description: notes.trim().length > 60 ? notes.trim().substring(0, 57) + "..." : notes.trim(),
                            occurredAt: new Date(),
                        }] : []),
                        ...(contacts && contacts.length > 0 ? contacts.map((c: any) => ({
                            eventType: "CONTACT_ADDED" as const,
                            description: `${c.name}${c.role ? `, ${c.role}` : ""}`,
                            occurredAt: new Date(),
                        })) : [])
                    ]
                }
            },
        });

        return new NextResponse(JSON.stringify(application), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error creating application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}