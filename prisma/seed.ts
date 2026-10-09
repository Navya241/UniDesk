import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting UniDesk comprehensive database seeding...");

  // 1. Clear existing records in correct referential order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.escalationConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log("🧹 Cleaned old database records.");

  // 2. Create Departments
  const itDept = await prisma.department.create({
    data: {
      name: "IT Support",
      code: "IT",
      description: "Campus networking, server infrastructure, hardware, and university portals.",
      defaultCategory: "IT",
    },
  });

  const hostelDept = await prisma.department.create({
    data: {
      name: "Hostel Department",
      code: "HOSTEL",
      description: "Hostel room allocation, maintenance, mess food quality, and amenities.",
      defaultCategory: "HOSTEL",
    },
  });

  const acadDept = await prisma.department.create({
    data: {
      name: "Academic Affairs",
      code: "ACAD",
      description: "Curriculum, grade cards, course registrations, timetables, and exams.",
      defaultCategory: "ACADEMICS",
    },
  });

  const libDept = await prisma.department.create({
    data: {
      name: "Library Services",
      code: "LIB",
      description: "Book borrowing, digital journal repository, study hall, and research archives.",
      defaultCategory: "LIBRARY",
    },
  });

  const adminDept = await prisma.department.create({
    data: {
      name: "Administration",
      code: "ADMIN",
      description: "Fee payments, certificates, transcripts, security, and estate management.",
      defaultCategory: "ADMINISTRATION",
    },
  });

  const generalDept = await prisma.department.create({
    data: {
      name: "General Support",
      code: "GEN",
      description: "General campus inquiries, transport, and miscellaneous issues.",
      defaultCategory: "OTHER",
    },
  });

  console.log("🏢 Created 6 University Departments.");

  // 3. Create Users with standard demo credentials
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const staffPasswordHash = await bcrypt.hash("Staff@123", 10);
  const studentPasswordHash = await bcrypt.hash("Student@123", 10);
  const facultyPasswordHash = await bcrypt.hash("Faculty@123", 10);

  const adminUser = await prisma.user.create({
    data: {
      name: "Dr. Arvind Sharma",
      email: "admin@unidesk.edu",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arvind",
    },
  });

  const itStaff = await prisma.user.create({
    data: {
      name: "Vikram Malhotra",
      email: "it.staff@unidesk.edu",
      passwordHash: staffPasswordHash,
      role: "DEPARTMENT_STAFF",
      departmentId: itDept.id,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
    },
  });

  const hostelStaff = await prisma.user.create({
    data: {
      name: "Suresh Rao",
      email: "hostel.staff@unidesk.edu",
      passwordHash: staffPasswordHash,
      role: "DEPARTMENT_STAFF",
      departmentId: hostelDept.id,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh",
    },
  });

  const libStaff = await prisma.user.create({
    data: {
      name: "Pooja Desai",
      email: "library.staff@unidesk.edu",
      passwordHash: staffPasswordHash,
      role: "DEPARTMENT_STAFF",
      departmentId: libDept.id,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja",
    },
  });

  const acadStaff = await prisma.user.create({
    data: {
      name: "Dr. Meenakshi Sundaram",
      email: "academic.staff@unidesk.edu",
      passwordHash: staffPasswordHash,
      role: "DEPARTMENT_STAFF",
      departmentId: acadDept.id,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meenakshi",
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      name: "Aarav Patel",
      email: "student@unidesk.edu",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav",
    },
  });

  const facultyUser = await prisma.user.create({
    data: {
      name: "Prof. Rajesh Kumar",
      email: "faculty@unidesk.edu",
      passwordHash: facultyPasswordHash,
      role: "FACULTY",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh",
    },
  });

  console.log("👤 Created 7 Demo Users (Admin, 4 Staff, Student, Faculty).");

  // 4. Escalation Configurations
  const categories = ["HOSTEL", "ACADEMICS", "IT", "LIBRARY", "ADMINISTRATION", "OTHER"];
  for (const cat of categories) {
    await prisma.escalationConfig.create({
      data: {
        category: cat,
        lowHours: 72,
        mediumHours: 48,
        highHours: 24,
        urgentHours: 12,
        notifyAdmin: true,
      },
    });
  }
  console.log("⏱️ Seeded Escalation SLA Configurations.");

  // 5. Seed Comprehensive FAQs
  const faqs = [
    {
      category: "IT",
      question: "How do I connect to the Campus High-Speed Wi-Fi (UniSecure)?",
      answer: "Select the 'UniSecure-WPA2' network on your device. Authenticate with your University Roll Number as the username and your portal password. If certificate prompt appears, accept the university root CA.",
      order: 1,
    },
    {
      category: "IT",
      question: "How do I reset my forgotten University Portal password?",
      answer: "Visit portal.university.edu/forgot-password, enter your registered @unidesk.edu email, and check your inbox for the OTP reset link. Alternatively, submit a ticket to IT Support.",
      order: 2,
    },
    {
      category: "HOSTEL",
      question: "What is the procedure to report room plumbing or electrical maintenance?",
      answer: "Create a new ticket under the 'Hostel' category, select your hostel block and room number in the description, and mark priority as 'High' if there is water leakage.",
      order: 1,
    },
    {
      category: "HOSTEL",
      question: "What are the mess timings and night curfew rules?",
      answer: "Breakfast: 7:30 AM - 9:30 AM, Lunch: 12:30 PM - 2:30 PM, Dinner: 7:30 PM - 9:30 PM. Campus gate curfew for hostellers is 10:00 PM on weekdays and 10:30 PM on weekends.",
      order: 2,
    },
    {
      category: "ACADEMICS",
      question: "How do I request an official academic transcript or provisional certificate?",
      answer: "Transcripts can be requested through Academic Affairs. Submit a ticket with your batch details, enrollment number, and required number of copies.",
      order: 1,
    },
    {
      category: "LIBRARY",
      question: "How many books can a B.Tech student borrow at a time and for how long?",
      answer: "Undergraduate students can borrow up to 4 books for a duration of 14 days. Books can be renewed once online if there are no pending reservations.",
      order: 1,
    },
    {
      category: "ADMINISTRATION",
      question: "Where do I submit fee payment receipts or scholarship deduction proofs?",
      answer: "Submit an Administration ticket attaching your bank transaction receipt / fee challan PDF. The Accounts Office will verify and issue clearance within 3 business days.",
      order: 1,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }
  console.log("📚 Seeded FAQs across all categories.");

  // 6. Seed Realistic Tickets with Comments, History, and Statuses
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

  // Ticket 1: In Progress IT ticket
  const t1 = await prisma.ticket.create({
    data: {
      ticketNumber: "TICK-2026-0001",
      title: "Wi-Fi access point in Computer Lab 3 dropping connections repeatedly",
      description: "Every day between 2 PM and 5 PM during practical labs, the AP 'AP-LAB3-5G' drops 40+ student laptops. Ping loss is above 60%.",
      category: "IT",
      priority: "HIGH",
      status: "IN_PROGRESS",
      reporterId: studentUser.id,
      departmentId: itDept.id,
      assignedToId: itStaff.id,
      dueAt: new Date(now.getTime() + 18 * 60 * 60 * 1000),
      escalationState: "NONE",
      createdAt: twoDaysAgo,
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: t1.id,
      authorId: itStaff.id,
      message: "We observed the high traffic spike on Cisco Switch Port 24. Replacing the faulty transceiver today by 4 PM.",
      createdAt: yesterday,
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: t1.id,
        actorId: studentUser.id,
        action: "CREATED",
        notes: "Ticket created via portal",
        createdAt: twoDaysAgo,
      },
      {
        ticketId: t1.id,
        actorId: itStaff.id,
        action: "ASSIGNED",
        oldValue: "Unassigned",
        newValue: "Vikram Malhotra",
        notes: "Claimed ticket from IT queue",
        createdAt: new Date(twoDaysAgo.getTime() + 2 * 60 * 60 * 1000),
      },
      {
        ticketId: t1.id,
        actorId: itStaff.id,
        action: "STATUS_CHANGED",
        fieldChanged: "status",
        oldValue: "SUBMITTED",
        newValue: "IN_PROGRESS",
        notes: "Investigation initiated on switch switch-lab3-core",
        createdAt: yesterday,
      },
    ],
  });

  // Ticket 2: Escalated / Overdue Hostel Issue
  const t2 = await prisma.ticket.create({
    data: {
      ticketNumber: "TICK-2026-0002",
      title: "Hostel Block B 3rd Floor water purifier leaking heavily",
      description: "Water purifier near Room 314 has been overflowing since last week, causing slippery corridors and water wastage.",
      category: "HOSTEL",
      priority: "URGENT",
      status: "SUBMITTED",
      reporterId: studentUser.id,
      departmentId: hostelDept.id,
      dueAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Overdue!
      escalationState: "ESCALATED",
      createdAt: fourDaysAgo,
    },
  });

  await prisma.ticketHistory.createMany({
    data: [
      {
        ticketId: t2.id,
        actorId: studentUser.id,
        action: "CREATED",
        notes: "Ticket submitted with Urgent priority",
        createdAt: fourDaysAgo,
      },
      {
        ticketId: t2.id,
        actorId: null,
        action: "ESCALATED",
        fieldChanged: "escalationState",
        oldValue: "NONE",
        newValue: "ESCALATED",
        notes: "System Auto-Escalation: SLA exceeded by 24+ hours",
        createdAt: yesterday,
      },
    ],
  });

  // Ticket 3: Resolved Library Ticket
  const t3 = await prisma.ticket.create({
    data: {
      ticketNumber: "TICK-2026-0003",
      title: "Request for IEEE Xplore digital library remote access renewal",
      description: "Faculty portal VPN token for IEEE Xplore database subscription was expiring on October 1st.",
      category: "LIBRARY",
      priority: "MEDIUM",
      status: "RESOLVED",
      reporterId: facultyUser.id,
      departmentId: libDept.id,
      assignedToId: libStaff.id,
      dueAt: yesterday,
      resolvedAt: yesterday,
      escalationState: "NONE",
      createdAt: threeDaysAgo,
    },
  });

  await prisma.ticketComment.create({
    data: {
      ticketId: t3.id,
      authorId: libStaff.id,
      message: "The institutional Shibboleth token has been refreshed. You can now login through the faculty portal.",
      createdAt: yesterday,
    },
  });

  // Ticket 4: Anonymous Grievance
  const t4 = await prisma.ticket.create({
    data: {
      ticketNumber: "TICK-2026-0004",
      title: "Mess Night Food Quality & Hygiene in Central Dining Hall",
      description: "The food served on Tuesday night was undercooked and drinking water dispenser had sediment. Requesting urgent inspection by mess committee.",
      category: "HOSTEL",
      priority: "HIGH",
      status: "SUBMITTED",
      isAnonymous: true,
      reporterId: studentUser.id,
      departmentId: hostelDept.id,
      dueAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      escalationState: "NONE",
      createdAt: yesterday,
    },
  });

  // Ticket 5: Closed Academics Ticket
  const t5 = await prisma.ticket.create({
    data: {
      ticketNumber: "TICK-2026-0005",
      title: "Grade card discrepancy for Semester 5 Distributed Systems Lab",
      description: "The grade for CSE-502 was recorded as B instead of A+ as awarded in practical viva by external examiner.",
      category: "ACADEMICS",
      priority: "HIGH",
      status: "CLOSED",
      reporterId: studentUser.id,
      departmentId: acadDept.id,
      assignedToId: acadStaff.id,
      dueAt: threeDaysAgo,
      resolvedAt: twoDaysAgo,
      closedAt: yesterday,
      escalationState: "NONE",
      createdAt: fourDaysAgo,
    },
  });

  console.log("🎫 Seeded 5 Realistic Tickets across multiple departments and states.");

  // 7. Seed Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: itStaff.id,
        ticketId: t1.id,
        title: "Ticket Assigned",
        message: "You claimed Ticket #TICK-2026-0001 (Wi-Fi in Lab 3).",
        type: "TICKET_ASSIGNED",
        isRead: true,
        createdAt: yesterday,
      },
      {
        userId: adminUser.id,
        ticketId: t2.id,
        title: "🚨 SLA Breach Escalation",
        message: "Ticket #TICK-2026-0002 has exceeded the 24h SLA resolution threshold.",
        type: "ESCALATED",
        isRead: false,
        createdAt: yesterday,
      },
      {
        userId: studentUser.id,
        ticketId: t1.id,
        title: "Staff Update on Ticket #TICK-2026-0001",
        message: "Vikram Malhotra commented on your Wi-Fi issue.",
        type: "NEW_COMMENT",
        isRead: false,
        createdAt: yesterday,
      },
    ],
  });
  console.log("🔔 Seeded notifications.");

  console.log("🎉 UniDesk Database Seed Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
