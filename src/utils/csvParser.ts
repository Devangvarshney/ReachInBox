import type { EmailLead } from '../types';

export interface ParseResult {
  leads: EmailLead[];
  rawEmails: string[];
  totalCount: number;
  invalidCount: number;
  fileName?: string;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export const parseLeadsFromTextOrCsv = (rawText: string, fileName?: string): ParseResult => {
  const lines = rawText.split(/\r\n|\n|\r/);
  const leads: EmailLead[] = [];
  const rawEmails: string[] = [];
  const seenEmails = new Set<string>();

  if (lines.length === 0) {
    return { leads: [], rawEmails: [], totalCount: 0, invalidCount: 0, fileName };
  }

  // Check if first line looks like a header with column names
  const headerLine = lines[0].toLowerCase();
  let emailColIdx = -1;
  let nameColIdx = -1;
  let companyColIdx = -1;

  if (headerLine.includes('email') || headerLine.includes('name') || headerLine.includes('company')) {
    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    emailColIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
    nameColIdx = headers.findIndex(h => h.includes('name') || h.includes('first') || h.includes('contact'));
    companyColIdx = headers.findIndex(h => h.includes('company') || h.includes('org') || h.includes('account'));
  }

  const startRow = emailColIdx !== -1 ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (emailColIdx !== -1) {
      // CSV column based parse
      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const email = cols[emailColIdx]?.toLowerCase();
      if (email && email.match(EMAIL_REGEX)) {
        if (!seenEmails.has(email)) {
          seenEmails.add(email);
          rawEmails.push(email);
          leads.push({
            email,
            name: nameColIdx !== -1 ? cols[nameColIdx] : undefined,
            company: companyColIdx !== -1 ? cols[companyColIdx] : undefined,
          });
        }
      }
    } else {
      // Generic regex extraction for any plain text / raw emails
      const matches = line.match(EMAIL_REGEX);
      if (matches) {
        matches.forEach(m => {
          const email = m.toLowerCase();
          if (!seenEmails.has(email)) {
            seenEmails.add(email);
            rawEmails.push(email);
            leads.push({ email });
          }
        });
      }
    }
  }

  return {
    leads,
    rawEmails,
    totalCount: leads.length,
    invalidCount: Math.max(0, lines.length - startRow - leads.length),
    fileName,
  };
};

export const generateSampleCsvBlob = (): Blob => {
  const sample = `Email,Name,Company
sarah.connor@cyberdyne.io,Sarah Connor,Cyberdyne Systems
john.wick@continental.com,John Wick,Continental Hotels
tony.stark@starkindustries.com,Tony Stark,Stark Industries
bruce.wayne@wayneenterprises.com,Bruce Wayne,Wayne Enterprises
diana.prince@themyscira.gov,Diana Prince,Themyscira Corp
peter.parker@dailybugle.net,Peter Parker,Daily Bugle
clark.kent@dailyplanet.com,Clark Kent,Daily Planet
wade.wilson@xforce.org,Wade Wilson,X-Force LLC
natasha.romanoff@avengers.org,Natasha Romanoff,Avengers Initiative
steve.rogers@shield.gov,Steve Rogers,SHIELD`;

  return new Blob([sample], { type: 'text/csv;charset=utf-8;' });
};
