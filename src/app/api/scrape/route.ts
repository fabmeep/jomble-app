import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";

// Helpers for regex-based tag extraction

function extractJsonLd(html: string): any[] {
    const jsonLdRegex = /<script\b[^>]*\btype=(["']?)application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi;
    const results: any[] = [];
    let match;
    while ((match = jsonLdRegex.exec(html)) !== null) {
        try {
            const rawJson = match[2].trim();
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed)) {
                results.push(...parsed);
            } else if (parsed && typeof parsed === "object") {
                if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
                    results.push(...parsed["@graph"]);
                } else {
                    results.push(parsed);
                }
            }
        } catch (e) {
            // Ignore parse errors for malformed JSON-LD blocks
        }
    }
    return results;
}

function extractMetaTag(html: string, nameOrProperty: string): string | null {
    const regex = new RegExp(
        `<meta\\s+[^>]*(?:property|name)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
        "i"
    );
    const match = html.match(regex);
    if (match) return match[1];

    // try reversed attributes (content before property/name)
    const reverseRegex = new RegExp(
        `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${nameOrProperty}["']`,
        "i"
    );
    const revMatch = html.match(reverseRegex);
    if (revMatch) return revMatch[1];

    return null;
}

function formatLocation(jobLocation: any): string | undefined {
    if (!jobLocation) return undefined;
    const address = jobLocation.address;
    if (!address) {
        if (typeof jobLocation === "string") return jobLocation;
        if (jobLocation.name) return jobLocation.name;
        return undefined;
    }
    if (typeof address === "string") return address;
    const parts = [];
    if (address.addressLocality) parts.push(address.addressLocality);
    if (address.addressRegion) parts.push(address.addressRegion);
    if (address.addressCountry) parts.push(address.addressCountry);
    if (parts.length === 0 && address.streetAddress) {
        parts.push(address.streetAddress);
    }
    return parts.join(", ") || undefined;
}

function determineWorkMode(title: string, description: string, locationStr: string): "REMOTE" | "HYBRID" | "ON_SITE" {
    const searchStr = `${title} ${locationStr} ${description}`.toLowerCase();
    if (searchStr.includes("hybrid")) {
        return "HYBRID";
    }
    if (
        searchStr.includes("remote") ||
        searchStr.includes("work from home") ||
        searchStr.includes("wfh") ||
        searchStr.includes("telecommute") ||
        searchStr.includes("anywhere")
    ) {
        return "REMOTE";
    }
    return "ON_SITE";
}

function parseTitleAndCompany(titleStr: string): { jobTitle: string; companyName: string } {
    let jobTitle = titleStr;
    let companyName = "";

    // Normalize commonly structured page titles
    if (titleStr.includes(" at ")) {
        const parts = titleStr.split(" at ");
        jobTitle = parts[0].trim();
        companyName = parts[1].split(/[|-]/)[0].trim();
    } else if (titleStr.includes(" - ")) {
        const parts = titleStr.split(" - ");
        jobTitle = parts[0].trim();
        companyName = parts[1].split(/[|]/)[0].trim();
    } else if (titleStr.includes(" | ")) {
        const parts = titleStr.split(" | ");
        jobTitle = parts[0].trim();
        companyName = parts[1].trim();
    }
    
    return { jobTitle, companyName };
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await req.json();
        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return NextResponse.json({ error: "Malformed URL structure" }, { status: 400 });
        }

        const hostname = parsedUrl.hostname.toLowerCase();

        // 1. Fetch the URL page content
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            next: { revalidate: 0 } // bypass cache
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch page content" }, { status: 502 });
        }

        const html = await response.text();

        // 2. Initialize defaults
        let jobTitle = "";
        let companyName = "";
        let location = "";
        let workMode: "REMOTE" | "HYBRID" | "ON_SITE" = "ON_SITE";
        let salaryMin: number | null = null;
        let salaryMax: number | null = null;
        let currency = "USD";

        // Try extracting JSON-LD JobPosting schema first
        const jsonLdObjects = extractJsonLd(html);
        const jobPosting = jsonLdObjects.find(
            (obj) =>
                obj &&
                (obj["@type"] === "JobPosting" ||
                 (Array.isArray(obj["@type"]) && obj["@type"].includes("JobPosting")))
        );

        if (jobPosting) {
            jobTitle = jobPosting.title || "";
            companyName = jobPosting.hiringOrganization?.name || 
                          (typeof jobPosting.hiringOrganization === "string" ? jobPosting.hiringOrganization : "");
            
            const rawLoc = formatLocation(jobPosting.jobLocation);
            if (rawLoc) location = rawLoc;

            // Handle salary if present in schema
            if (jobPosting.baseSalary) {
                currency = jobPosting.baseSalary.currency || "USD";
                const valObj = jobPosting.baseSalary.value;
                if (valObj) {
                    if (typeof valObj === "number" || typeof valObj === "string") {
                        salaryMin = Math.round(Number(valObj));
                        salaryMax = Math.round(Number(valObj));
                    } else {
                        if (valObj.minValue !== undefined) salaryMin = Math.round(Number(valObj.minValue));
                        if (valObj.maxValue !== undefined) salaryMax = Math.round(Number(valObj.maxValue));
                        if (valObj.value !== undefined && !salaryMin && !salaryMax) {
                            salaryMin = Math.round(Number(valObj.value));
                            salaryMax = Math.round(Number(valObj.value));
                        }
                    }
                }
            }

            // Map JobLocationType to REMOTE
            if (jobPosting.jobLocationType === "TELECOMMUTE") {
                workMode = "REMOTE";
            } else {
                workMode = determineWorkMode(jobTitle, jobPosting.description || "", location);
            }
        } else {
            // Fallback: Open Graph Metadata & Title
            const ogTitle = extractMetaTag(html, "og:title") || extractMetaTag(html, "twitter:title");
            const ogDescription = extractMetaTag(html, "og:description") || extractMetaTag(html, "twitter:description") || "";
            const ogSiteName = extractMetaTag(html, "og:site_name");

            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const pageTitle = titleMatch ? titleMatch[1].trim() : "";

            const targetTitle = ogTitle || pageTitle;

            if (targetTitle) {
                const parsed = parseTitleAndCompany(targetTitle);
                jobTitle = parsed.jobTitle;
                companyName = ogSiteName || parsed.companyName;
            }

            // Guess location from metadata
            const geoRegion = extractMetaTag(html, "geo.region");
            const geoPlacename = extractMetaTag(html, "geo.placename");
            if (geoPlacename) {
                location = geoRegion ? `${geoPlacename}, ${geoRegion}` : geoPlacename;
            }

            workMode = determineWorkMode(jobTitle, ogDescription, location);
        }

        // Clean values
        jobTitle = jobTitle.trim();
        companyName = companyName.trim();
        location = location.trim();

        // Fallback for company name based on subdomain for Lever/Greenhouse if empty
        if (!companyName) {
            if (hostname.includes("lever.co")) {
                // lever URLs: jobs.lever.co/company/...
                const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
                if (pathParts.length > 0) {
                    companyName = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
                }
            } else if (hostname.includes("greenhouse.io")) {
                // greenhouse URLs: boards.greenhouse.io/company/...
                const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
                if (pathParts.length > 0) {
                    companyName = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
                }
            }
        }

        // Determine Source Enum
        let source = "OTHER";
        if (hostname.includes("linkedin.com")) {
            source = "LINKEDIN";
        } else if (hostname.includes("indeed.com")) {
            source = "INDEED";
        } else if (hostname.includes("glassdoor.com")) {
            source = "GLASSDOOR";
        } else if (hostname.includes("github.com")) {
            source = "GITHUB_JOBS";
        } else {
            source = "COMPANY_WEBSITE";
        }

        return NextResponse.json({
            companyName: companyName || "Unknown Company",
            jobTitle: jobTitle || "Unknown Position",
            location: location || null,
            workMode,
            salaryMin,
            salaryMax,
            currency,
            source,
            jobUrl: url,
        });

    } catch (error) {
        console.error("Scraping error:", error);
        return NextResponse.json({ error: "Internal server error during scraping" }, { status: 500 });
    }
}
