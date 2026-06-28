import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = await getUserId();
        const application = await prisma.jobApplication.findFirst({
            where: {
                id,
                userId
            },
            include: {
                notes: true,
                contacts: true,
                timelineEvents: true
            }
        });
        if (!application) {
            return NextResponse.json({ error: "Job application not found" }, { status: 404 });
        }

        return NextResponse.json(application, { status: 200 });
    } catch (error) {
        console.error("Error fetching application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = await getUserId();
        const body = await req.json();

        // 1. Verify ownership of the job application
        const currentApp = await prisma.jobApplication.findFirst({
            where: { id, userId },
            select: { status: true }
        });
        if (!currentApp) {
            return NextResponse.json({ error: "Job application not found or unauthorized" }, { status: 404 });
        }

        // 2. Extract relation fields
        const { notes, contacts, redFlags, ...applicationData } = body;

        // 3. Cast numeric fields properly
        if (applicationData.salaryMin !== undefined) {
            applicationData.salaryMin = applicationData.salaryMin !== null && applicationData.salaryMin !== ""
                ? Number(applicationData.salaryMin)
                : null;
        }
        if (applicationData.salaryMax !== undefined) {
            applicationData.salaryMax = applicationData.salaryMax !== null && applicationData.salaryMax !== ""
                ? Number(applicationData.salaryMax)
                : null;
        }
        if (applicationData.excitementScore !== undefined) {
            applicationData.excitementScore = applicationData.excitementScore !== null && applicationData.excitementScore !== ""
                ? Number(applicationData.excitementScore)
                : null;
        }

        // 4. Cast date fields
        if (applicationData.appliedAt) {
            applicationData.appliedAt = new Date(applicationData.appliedAt);
        }
        if (applicationData.lastActivityAt) {
            applicationData.lastActivityAt = new Date(applicationData.lastActivityAt);
        }

        // 5. Log status change timeline event if status is different
        let statusChangeCreate = {};
        if (applicationData.status && currentApp.status !== applicationData.status) {
            statusChangeCreate = {
                timelineEvents: {
                    create: {
                        eventType: "STATUS_CHANGE",
                        oldStatus: currentApp.status,
                        newStatus: applicationData.status,
                        occurredAt: new Date(),
                    }
                }
            };
        }

        // 6. Update the main job application
        const updatedApplication = await prisma.jobApplication.update({
            where: { id },
            data: {
                ...applicationData,
                ...statusChangeCreate
            }
        });

        // 7. Sync notes
        if (notes !== undefined) {
            const firstNote = await prisma.note.findFirst({
                where: { jobAppId: id },
                orderBy: { createdAt: "asc" }
            });
            if (firstNote) {
                if (!notes || notes.trim() === "") {
                    await prisma.note.delete({ where: { id: firstNote.id } });
                } else {
                    await prisma.note.update({
                        where: { id: firstNote.id },
                        data: { content: notes }
                    });
                }
            } else if (notes && notes.trim() !== "") {
                await prisma.note.create({
                    data: { jobAppId: id, content: notes }
                });
                await prisma.timelineEvent.create({
                    data: {
                        jobAppId: id,
                        eventType: "NOTE_ADDED",
                        description: notes.trim().length > 60 ? notes.trim().substring(0, 57) + "..." : notes.trim(),
                        occurredAt: new Date(),
                    }
                });
            }
        }

        // 8. Sync contacts
        if (contacts !== undefined) {
            await prisma.contact.deleteMany({
                where: { jobAppId: id }
            });
            if (contacts.length > 0) {
                await prisma.contact.createMany({
                    data: contacts.map((c: any) => ({
                        jobAppId: id,
                        name: c.name.trim(),
                        role: c.role?.trim() || null,
                        email: c.email?.trim() || null,
                        linkedinUrl: c.linkedinUrl?.trim() || null,
                        notes: c.notes?.trim() || null
                    }))
                });
            }
        }

        // 9. Sync red flags
        if (redFlags !== undefined) {
            await prisma.jobApplicationRedFlag.deleteMany({
                where: { jobAppId: id }
            });
            if (redFlags.length > 0) {
                await prisma.jobApplicationRedFlag.createMany({
                    data: redFlags.map((flagId: string) => ({
                        jobAppId: id,
                        flagId
                    }))
                });
            }
        }

        return NextResponse.json(updatedApplication);
    } catch (error) {
        console.error("Error updating application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const userId = await getUserId();

        // Verify ownership before deleting
        const currentApp = await prisma.jobApplication.findFirst({
            where: { id, userId }
        });
        if (!currentApp) {
            return NextResponse.json({ error: "Job application not found or unauthorized" }, { status: 404 });
        }

        const application = await prisma.jobApplication.delete({
            where: { id }
        });
        return NextResponse.json(application);
    } catch (error) {
        console.error("Error deleting application:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

