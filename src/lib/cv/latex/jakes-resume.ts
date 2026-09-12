import { StructuredCv } from "@/types/cv"

/**
 * Escapes special LaTeX characters in user-provided text strings
 * to prevent Overleaf compilation errors.
 */
export function escapeLatex(text?: string | null): string {
  if (!text) return ""
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

/**
 * Generates ready-to-compile LaTeX source code using the classic
 * Jake's Resume Overleaf template (ATS-compliant, single column).
 */
export function generateJakesResumeLatex(cv: StructuredCv): string {
  const contact = cv.contact || { name: "Full Name", email: "email@example.com" }
  const name = escapeLatex(contact.name || "Full Name")
  const email = escapeLatex(contact.email || "")
  const phone = escapeLatex(contact.phone || "")
  const location = escapeLatex(contact.location || "")
  const linkedin = contact.linkedin || ""
  const github = contact.github || ""
  const website = contact.website || ""

  // Build header links
  const contactLinks: string[] = []
  if (phone) contactLinks.push(phone)
  if (email) contactLinks.push(`\\href{mailto:${email}}{\\underline{${email}}}`)
  if (linkedin) {
    const cleanLnk = linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
    contactLinks.push(`\\href{${linkedin}}{\\underline{linkedin.com/in/${escapeLatex(cleanLnk)}}}`)
  }
  if (github) {
    const cleanGh = github.replace(/^https?:\/\/(www\.)?github\.com\//, "")
    contactLinks.push(`\\href{${github}}{\\underline{github.com/${escapeLatex(cleanGh)}}}`)
  }
  if (website) {
    const cleanWeb = website.replace(/^https?:\/\//, "")
    contactLinks.push(`\\href{${website}}{\\underline{${escapeLatex(cleanWeb)}}}`)
  }

  // Build Experience LaTeX
  let experienceSection = ""
  if (cv.experience && cv.experience.length > 0) {
    const expItems = cv.experience
      .map((exp) => {
        const title = escapeLatex(exp.title || "Job Title")
        const company = escapeLatex(exp.company || "Company")
        const dates = escapeLatex(exp.dates || "")
        const loc = escapeLatex(exp.location || location || "")

        const bulletLines = (exp.bullets || [])
          .filter((b) => b.text && b.text.trim())
          .map((b) => `        \\resumeItem{${escapeLatex(b.text.trim())}}`)
          .join("\n")

        return `    \\resumeSubheading
      {${title}}{${dates}}
      {${company}}{${loc}}
      \\resumeItemListStart
${bulletLines}
      \\resumeItemListEnd`
      })
      .join("\n\n")

    experienceSection = `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart

${expItems}

  \\resumeSubHeadingListEnd
`
  }

  // Build Education LaTeX
  let educationSection = ""
  if (cv.education && cv.education.length > 0) {
    const eduItems = cv.education
      .map((edu) => {
        const institution = escapeLatex(edu.institution || "Institution")
        const degree = escapeLatex(edu.degree || "Degree")
        const dates = escapeLatex(edu.dates || "")
        const details = escapeLatex(edu.details || "")

        return `    \\resumeSubheading
      {${institution}}{${dates}}
      {${degree}}{${details}}`
      })
      .join("\n\n")

    educationSection = `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart

${eduItems}

  \\resumeSubHeadingListEnd
`
  }

  // Build Projects LaTeX
  let projectsSection = ""
  if (cv.projects && cv.projects.length > 0) {
    const projItems = cv.projects
      .map((proj) => {
        const name = escapeLatex(proj.name || "Project")
        const techStr = proj.technologies && proj.technologies.length > 0
          ? ` $|$ \\emph{${escapeLatex(proj.technologies.join(", "))}}`
          : ""
        const link = proj.link ? `\\href{${proj.link}}{\\underline{Link}}` : ""
        const desc = escapeLatex(proj.description || "")

        return `    \\resumeProjectHeading
      {\\textbf{${name}}${techStr}}{${link}}
      \\resumeItemListStart
        \\resumeItem{${desc}}
      \\resumeItemListEnd`
      })
      .join("\n\n")

    projectsSection = `
%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart

${projItems}

  \\resumeSubHeadingListEnd
`
  }

  // Build Skills LaTeX
  let skillsSection = ""
  if (cv.skills && cv.skills.length > 0) {
    const skillsList = escapeLatex(cv.skills.join(", "))
    skillsSection = `
%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${skillsList}}
    }}
 \\end{itemize}
`
  }

  // Complete Jake's Resume Document
  return `%-------------------------
% Resume in Latex (Jake's Resume Template)
% Tailored by Jomble App
% License : MIT
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{} % clear all header and footer fields
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generated pdf is machine readable/ATS parsable
\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubSubheading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\textit{\\small#1} & \\textit{\\small #2} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${contactLinks.join(" $|$ \n    ")}
\\end{center}
${educationSection}${experienceSection}${projectsSection}${skillsSection}
\\end{document}
`
}
