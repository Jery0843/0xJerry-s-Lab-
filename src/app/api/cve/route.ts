import { NextResponse } from 'next/server';

interface CVEItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  score: number;
  publishedDate: string;
  lastModified: string;
  references: string[];
  affectedProducts: string[];
}

export async function GET() {
  try {
    // Directly use NVD API - last 3 days for most recent (skip AI to save Perplexity credits)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 3);
    
    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${startDateStr}T00:00:00.000&pubEndDate=${endDateStr}T23:59:59.999&resultsPerPage=100&startIndex=0`,
      {
        headers: {
          'User-Agent': '0xJerrys-Lab-CVE-Fetcher/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NVD API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    const cves: CVEItem[] = data.vulnerabilities?.map((vuln: any) => {
      const cve = vuln.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || cve.metrics?.cvssMetricV2?.[0];
      
      return {
        id: cve.id,
        title: cve.id,
        description: cve.descriptions?.find((desc: any) => desc.lang === 'en')?.value || 'No description available',
        severity: metrics?.cvssData?.baseSeverity || 'UNKNOWN',
        score: metrics?.cvssData?.baseScore || 0,
        publishedDate: cve.published,
        lastModified: cve.lastModified,
        references: cve.references?.map((ref: any) => ref.url) || [],
        affectedProducts: cve.configurations?.nodes?.flatMap((node: any) => 
          node.cpeMatch?.map((match: any) => match.criteria) || []
        ) || []
      };
    }) || [];
    
    // Filter out CVEs with score 0 or UNKNOWN severity
    const filteredCves = cves.filter(cve => cve.score > 0 && cve.severity !== 'UNKNOWN');
    
    // Sort CVEs by score (highest first), then by published date (newest first)
    filteredCves.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    });

    return NextResponse.json(filteredCves);
  } catch (error) {
    console.error('Error fetching CVE data:', error);
    
    // Return fallback data if API fails - with recent sample CVEs
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const fallbackCVEs: CVEItem[] = [
      {
        id: 'CVE-2024-SAMPLE',
        title: 'CVE-2024-SAMPLE',
        description: 'CVE data temporarily unavailable. This is sample data. The NVD API may be rate-limited or experiencing issues. Please try refreshing the page.',
        severity: 'HIGH',
        score: 8.5,
        publishedDate: yesterday.toISOString(),
        lastModified: today.toISOString(),
        references: ['https://nvd.nist.gov/', 'https://cve.org/'],
        affectedProducts: ['Sample Product']
      },
      {
        id: 'CVE-2024-EXAMPLE',
        title: 'CVE-2024-EXAMPLE',
        description: 'Another sample CVE entry. Real CVE data will show here when the API is available.',
        severity: 'MEDIUM',
        score: 6.2,
        publishedDate: yesterday.toISOString(),
        lastModified: yesterday.toISOString(),
        references: ['https://nvd.nist.gov/'],
        affectedProducts: ['Example Software']
      }
    ];

    return NextResponse.json(fallbackCVEs);
  }
}
