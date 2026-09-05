"use client"

import React from "react"
import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Award, Code2, FolderGit2, Link as LinkIcon } from "lucide-react"
import { StructuredCv } from "@/types/cv"
import { Badge } from "@/components/ui/badge"

interface ResumePaperPreviewProps {
  data: StructuredCv
  title?: string
  targetRole?: string | null
  className?: string
  showBulletIds?: boolean
}

export function ResumePaperPreview({
  data,
  title,
  targetRole,
  className = "",
  showBulletIds = false,
}: ResumePaperPreviewProps) {
  const { contact, summary, experience, education, skills, projects, certifications } = data

  return (
    <div
      className={`bg-white text-[#1E1E1E] rounded-xl shadow-md border border-[#E5E3DC] p-6 sm:p-10 font-sans max-w-4xl mx-auto flex flex-col gap-6 selection:bg-[#FFF0F0] selection:text-[#FF6B6B] ${className}`}
      style={{ minHeight: "800px" }}
    >
      {/* 1. RESUME HEADER */}
      <header className="border-b border-[#ECEAE4] pb-5 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1A1A]">
            {contact?.name || "Candidate Name"}
          </h1>
          {(targetRole || title) && (
            <span className="text-sm font-semibold text-[#FF6B6B] tracking-wide">
              {targetRole || title}
            </span>
          )}
        </div>

        {/* Contact Links Bar */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-[#5E5A54]">
          {contact?.email && (
            <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 hover:text-[#FF6B6B] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#8C877E]" />
              {contact.email}
            </a>
          )}

          {contact?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#8C877E]" />
              {contact.phone}
            </span>
          )}

          {contact?.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#8C877E]" />
              {contact.location}
            </span>
          )}

          {contact?.linkedin && (
            <a
              href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#FF6B6B] transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#0A66C2]" />
              LinkedIn
            </a>
          )}

          {contact?.github && (
            <a
              href={contact.github.startsWith("http") ? contact.github : `https://${contact.github}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#FF6B6B] transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5 text-[#24292F]" />
              GitHub
            </a>
          )}

          {contact?.website && (
            <a
              href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#FF6B6B] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#8C877E]" />
              Portfolio
            </a>
          )}
        </div>
      </header>

      {/* 2. SUMMARY */}
      {summary && (
        <section className="flex flex-col gap-1.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5">
            Professional Summary
          </h2>
          <p className="text-[13px] leading-relaxed text-[#383531]">
            {summary}
          </p>
        </section>
      )}

      {/* 3. EXPERIENCE */}
      {experience && experience.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5 border-b border-[#F0EFEA] pb-1">
            <Briefcase className="w-3.5 h-3.5 text-[#FF6B6B]" />
            Work Experience
          </h2>

          <div className="flex flex-col gap-5">
            {experience.map((exp) => (
              <div key={exp.id} className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-[14px] text-[#1A1A1A]">{exp.title}</span>
                    <span className="text-xs font-semibold text-[#FF6B6B]">@ {exp.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-[#7A756D] font-medium">
                    {exp.location && <span>{exp.location}</span>}
                    {exp.location && exp.dates && <span>•</span>}
                    <span>{exp.dates}</span>
                  </div>
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="list-disc list-outside pl-4 flex flex-col gap-1.5 text-[13px] text-[#383531] leading-relaxed">
                    {exp.bullets.map((bullet) => (
                      <li key={bullet.id} className="group relative">
                        <span>{bullet.text}</span>
                        {showBulletIds && (
                          <span className="ml-2 font-mono text-[10px] text-[#A39E95] bg-[#F4F3F0] px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 transition-opacity">
                            #{bullet.id}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SKILLS */}
      {skills && skills.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5 border-b border-[#F0EFEA] pb-1">
            <Code2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
            Core Skills & Technologies
          </h2>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-[#F4F3EF] hover:bg-[#EAE8E2] text-[#2D2A26] border-[#E0DED7] text-xs font-medium px-2.5 py-0.5 rounded-md transition-colors"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* 5. PROJECTS */}
      {projects && projects.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5 border-b border-[#F0EFEA] pb-1">
            <FolderGit2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
            Notable Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-3 bg-[#FAF9F7] border border-[#EBE9E3] rounded-lg flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-[#1A1A1A]">
                  <span>{proj.name}</span>
                  {proj.link && (
                    <a
                      href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#FF6B6B] hover:underline font-normal text-[11px]"
                    >
                      View ↗
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-[#5E5A54] leading-normal">{proj.description}</p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proj.technologies.map((t, tidx) => (
                      <span key={tidx} className="bg-white border border-[#E5E3DC] text-[10px] text-[#7A756D] px-1.5 py-0.2 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. EDUCATION & CERTIFICATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
        {education && education.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5 border-b border-[#F0EFEA] pb-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#FF6B6B]" />
              Education
            </h2>
            <div className="flex flex-col gap-3">
              {education.map((edu) => (
                <div key={edu.id} className="flex flex-col text-xs">
                  <span className="font-bold text-[#1A1A1A]">{edu.institution}</span>
                  <span className="text-[#5E5A54]">{edu.degree}</span>
                  {edu.dates && <span className="text-[11px] text-[#8C877E]">{edu.dates}</span>}
                  {edu.details && <span className="text-[11px] text-[#5E5A54] mt-0.5">{edu.details}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#7A756D] flex items-center gap-1.5 border-b border-[#F0EFEA] pb-1">
              <Award className="w-3.5 h-3.5 text-[#FF6B6B]" />
              Certifications
            </h2>
            <ul className="list-disc list-outside pl-4 flex flex-col gap-1 text-xs text-[#5E5A54]">
              {certifications.map((cert, cidx) => (
                <li key={cidx}>{cert}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
