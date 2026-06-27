import { PrismaClient, ApplicationStatus, WorkMode, JobSource, TimelineEventType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const now = new Date()
const daysAgo = (d: number) => {
  const date = new Date(now)
  date.setDate(now.getDate() - d)
  return date
}

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Upsert default user
  const email = 'demo@jomble.com'
  const passwordHash = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
    },
    create: {
      name: 'Demo User',
      email,
      passwordHash,
    },
  })

  console.log(`👤 Demo user: ${user.email} (ID: ${user.id})`)

  // 2. Clean existing applications for the demo user
  const deletedApps = await prisma.jobApplication.deleteMany({
    where: { userId: user.id },
  })
  console.log(`🗑️ Cleared ${deletedApps.count} existing job applications for this user.`)

  // 3. Define applications to seed
  const companies = ['Google', 'Meta', 'Stripe', 'Netflix', 'Uber', 'Airbnb', 'Microsoft', 'Amazon', 'Supabase', 'Vercel', 'Slack', 'Linear', 'TikTok', 'Apple', 'Github', 'Spotify', 'Canva', 'Notion', 'Discord', 'Zoom', 'Grab', 'Gojek', 'Tokopedia', 'Traveloka', 'Bukalapak']
  const titles = ['Software Engineer', 'Senior Software Engineer', 'Frontend Engineer', 'Backend Developer', 'Fullstack Engineer', 'Product Engineer', 'Developer Advocate', 'Engineering Manager', 'DevOps Engineer', 'Systems Engineer']
  const locations = ['Jakarta, Indonesia', 'Singapore', 'Remote', 'Hybrid, Tokyo', 'Seattle, WA', 'Redmond, WA', 'San Francisco, CA', 'Los Gatos, CA', 'New York, NY', 'Remote, US', 'Munich, Germany']
  const sources = Object.values(JobSource)
  const modes = Object.values(WorkMode)

  const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const getRandomRange = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min

  const applicationsData = []
  for (let i = 0; i < 100; i++) {
    const appliedDaysAgo = Math.floor(Math.random() * 60)
    const appliedAt = daysAgo(appliedDaysAgo)

    // Status distribution
    const statusRand = Math.random()
    let status: ApplicationStatus = ApplicationStatus.APPLIED
    if (statusRand < 0.25) status = ApplicationStatus.REJECTED
    else if (statusRand < 0.45) status = ApplicationStatus.APPLIED
    else if (statusRand < 0.60) status = ApplicationStatus.INTERVIEW
    else if (statusRand < 0.75) status = ApplicationStatus.SCREENING
    else if (statusRand < 0.85) status = ApplicationStatus.GHOSTED
    else if (statusRand < 0.92) status = ApplicationStatus.WITHDRAWN
    else if (statusRand < 0.97) status = ApplicationStatus.OFFER
    else status = ApplicationStatus.ACCEPTED

    const company = getRandomElement(companies)
    const title = getRandomElement(titles)

    // Setup lastActivityAt (at or after appliedAt, but before or at now)
    const activityDaysAgo = Math.floor(Math.random() * (appliedDaysAgo + 1))
    const lastActivityAt = daysAgo(activityDaysAgo)

    // Salary details
    const hasSalary = Math.random() > 0.4
    const currency = getRandomElement(['IDR', 'USD', 'SGD'])
    let salaryMin: number | null = null
    let salaryMax: number | null = null
    if (hasSalary) {
      if (currency === 'IDR') {
        salaryMin = getRandomRange(8, 40) * 1000000
        salaryMax = salaryMin + getRandomRange(4, 20) * 1000000
      } else if (currency === 'USD') {
        salaryMin = getRandomRange(60, 150) * 1000
        salaryMax = salaryMin + getRandomRange(10, 50) * 1000
      } else {
        salaryMin = getRandomRange(5, 12) * 1000
        salaryMax = salaryMin + getRandomRange(2, 6) * 1000
      }
    }

    const excitementScore = Math.random() > 0.15 ? getRandomRange(1, 5) : null

    // Timeline events
    const timelineEvents: {
      eventType: TimelineEventType;
      oldStatus?: ApplicationStatus;
      newStatus?: ApplicationStatus;
      description?: string;
      occurredAt: Date;
    }[] = [
      {
        eventType: TimelineEventType.STATUS_CHANGE,
        newStatus: ApplicationStatus.APPLIED,
        description: `Applied via ${getRandomElement(sources)}`,
        occurredAt: appliedAt,
      }
    ]

    if (status !== ApplicationStatus.APPLIED) {
      const intermediateDate = new Date(appliedAt)
      intermediateDate.setDate(appliedAt.getDate() + Math.max(1, Math.floor((appliedAt.getDate() - lastActivityAt.getDate()) / 2)))

      if (status === ApplicationStatus.SCREENING) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.SCREENING,
          description: 'Recruiter reached out for a phone screening',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.INTERVIEW) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.SCREENING,
          description: 'Recruiter reached out for screening',
          occurredAt: intermediateDate,
        })
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.SCREENING,
          newStatus: ApplicationStatus.INTERVIEW,
          description: 'Scheduled technical coding round',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.OFFER) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.INTERVIEW,
          description: 'Technical rounds completed',
          occurredAt: intermediateDate,
        })
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.INTERVIEW,
          newStatus: ApplicationStatus.OFFER,
          description: 'Received official offer letter',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.ACCEPTED) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.OFFER,
          description: 'Received offer',
          occurredAt: intermediateDate,
        })
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.OFFER,
          newStatus: ApplicationStatus.ACCEPTED,
          description: 'Accepted offer and signed contract',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.REJECTED) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.REJECTED,
          description: 'Received rejection email',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.WITHDRAWN) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.WITHDRAWN,
          description: 'Withdrew application',
          occurredAt: lastActivityAt,
        })
      } else if (status === ApplicationStatus.GHOSTED) {
        timelineEvents.push({
          eventType: TimelineEventType.STATUS_CHANGE,
          oldStatus: ApplicationStatus.APPLIED,
          newStatus: ApplicationStatus.GHOSTED,
          description: 'Marked as ghosted due to inactivity',
          occurredAt: lastActivityAt,
        })
      }
    }

    const hasNotes = Math.random() > 0.7
    const notesContent = hasNotes ? `Notes for ${company}: Random interview notes. Checked website, looks like a great team culture!` : undefined

    const hasContacts = Math.random() > 0.7
    const contactsData = hasContacts ? [
      {
        name: `Contact person at ${company}`,
        role: 'Hiring Manager',
        email: `hr@${company.toLowerCase().replace(/ /g, '')}.com`,
        linkedinUrl: undefined as string | undefined,
        notes: 'Met at a local tech meetup.',
      }
    ] : undefined

    applicationsData.push({
      companyName: company,
      jobTitle: title,
      location: getRandomElement(locations),
      jobUrl: `https://www.google.com/search?q=${company}+${title}+jobs`,
      source: getRandomElement(sources),
      workMode: getRandomElement(modes),
      salaryMin,
      salaryMax,
      currency,
      excitementScore,
      status,
      appliedAt,
      lastActivityAt,
      contacts: contactsData,
      notes: notesContent,
      timelineEvents,
    })
  }

  // 4. Create applications along with nested entities
  for (const app of applicationsData) {
    const { contacts, notes, timelineEvents, ...details } = app

    await prisma.jobApplication.create({
      data: {
        ...details,
        userId: user.id,
        ...(notes ? { notes: { create: { content: notes } } } : {}),
        ...(contacts ? {
          contacts: {
            create: contacts.map(c => ({
              name: c.name,
              role: c.role || null,
              email: c.email || null,
              linkedinUrl: c.linkedinUrl || null,
              notes: c.notes || null,
            })),
          },
        } : {}),
        ...(timelineEvents ? {
          timelineEvents: {
            create: timelineEvents.map(e => ({
              eventType: e.eventType,
              oldStatus: e.oldStatus || null,
              newStatus: e.newStatus || null,
              description: e.description || null,
              occurredAt: e.occurredAt,
            })),
          },
        } : {}),
      },
    })
  }

  console.log(`🎉 Seeded ${applicationsData.length} job applications with full histories successfully!`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
