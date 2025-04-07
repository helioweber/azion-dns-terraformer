
import { BindZone, BindRecord, AnalysisResult } from '@/types';

/**
 * Analyze DNS records for best practices and potential issues
 */
export function analyzeDnsRecords(zones: BindZone[]): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  
  zones.forEach(zone => {
    // Check if MX records have backup servers
    const mxRecords = zone.records.filter(record => record.type === 'MX');
    if (mxRecords.length === 1) {
      results.push({
        issueType: 'Backup Email Server',
        severity: 'medium',
        description: `Only one MX record found for ${zone.domain}. This creates a single point of failure for email delivery.`,
        recommendation: 'Add at least one backup MX record with a higher preference value.'
      });
    }
    
    // Check for short TTL values
    zone.records.forEach(record => {
      if (record.ttl && record.ttl < 300) {
        results.push({
          issueType: 'Low TTL',
          severity: 'low',
          description: `Record ${record.name || '@'} has a very low TTL (${record.ttl}s).`,
          recommendation: 'Consider increasing TTL to at least 300s (5 minutes) to reduce DNS query load.'
        });
      }
    });
    
    // Check for missing www record
    const hasWww = zone.records.some(record => 
      (record.name === 'www' || record.name === `www.${zone.domain}`) && 
      (record.type === 'A' || record.type === 'CNAME')
    );
    
    if (!hasWww) {
      results.push({
        issueType: 'Missing www Record',
        severity: 'low',
        description: `No www record found for ${zone.domain}.`,
        recommendation: 'Consider adding a www record (A or CNAME) to accommodate users who may type www prefix.'
      });
    }
    
    // Check for missing SPF records
    const hasSPF = zone.records.some(record => 
      (record.type === 'TXT' && record.data.some(d => d.includes('v=spf1'))) ||
      record.type === 'SPF'
    );
    
    if (!hasSPF) {
      results.push({
        issueType: 'Missing SPF',
        severity: 'high',
        description: `No SPF record found for ${zone.domain}.`,
        recommendation: 'Add an SPF record to prevent email spoofing and improve deliverability.'
      });
    }
    
    // Check for missing DMARC records
    const hasDMARC = zone.records.some(record => 
      record.type === 'TXT' && 
      record.name === '_dmarc' &&
      record.data.some(d => d.includes('v=DMARC1'))
    );
    
    if (!hasDMARC) {
      results.push({
        issueType: 'Missing DMARC',
        severity: 'medium',
        description: `No DMARC record found for ${zone.domain}.`,
        recommendation: 'Add a DMARC record to improve email security and deliverability.'
      });
    }
    
    // Check for DNSSEC
    const hasDNSKEY = zone.records.some(record => record.type === 'DNSKEY');
    const hasDS = zone.records.some(record => record.type === 'DS');
    
    if (!hasDNSKEY && !hasDS) {
      results.push({
        issueType: 'DNSSEC Not Implemented',
        severity: 'medium',
        description: `DNSSEC does not appear to be implemented for ${zone.domain}.`,
        recommendation: 'Consider implementing DNSSEC to protect against DNS spoofing and cache poisoning attacks.'
      });
    }
  });
  
  return results;
}

/**
 * Generate a human-readable report from analysis results
 */
export function generateAnalysisReport(results: AnalysisResult[]): string {
  if (results.length === 0) {
    return "No issues detected. Your DNS configuration follows best practices.";
  }
  
  let report = "# DNS Best Practices Analysis Report\n\n";
  
  // Group by severity
  const highSeverity = results.filter(r => r.severity === 'high');
  const mediumSeverity = results.filter(r => r.severity === 'medium');
  const lowSeverity = results.filter(r => r.severity === 'low');
  
  if (highSeverity.length > 0) {
    report += "## Critical Issues\n\n";
    highSeverity.forEach(result => {
      report += `### ${result.issueType}\n`;
      report += `${result.description}\n\n`;
      report += `**Recommendation:** ${result.recommendation}\n\n`;
    });
  }
  
  if (mediumSeverity.length > 0) {
    report += "## Important Recommendations\n\n";
    mediumSeverity.forEach(result => {
      report += `### ${result.issueType}\n`;
      report += `${result.description}\n\n`;
      report += `**Recommendation:** ${result.recommendation}\n\n`;
    });
  }
  
  if (lowSeverity.length > 0) {
    report += "## Minor Suggestions\n\n";
    lowSeverity.forEach(result => {
      report += `### ${result.issueType}\n`;
      report += `${result.description}\n\n`;
      report += `**Recommendation:** ${result.recommendation}\n\n`;
    });
  }
  
  return report;
}
